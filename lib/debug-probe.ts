import * as T from 'three';
import { testHooks } from './game/hooks';

// Deterministic inspection hooks for regression scripts. They read the built
// scene and the movement surface; they never change world geometry.
type Probe = {
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  render: () => void;
  freeze: () => void;
  follow: (x: number, z: number) => void;
  ground: (x: number, z: number) => number;
  terrain: (x: number, z: number) => number;
  canStand: (x: number, z: number, r: number) => boolean;
  driveFrom: (x: number, z: number, yaw: number) => void;
};

function materialKey(m: T.Material) {
  const s = m as T.MeshStandardMaterial;
  return [
    m.type,
    s.color?.getHexString() ?? '',
    s.map ? 'map' : '',
    s.bumpMap ? 'bump' : '',
    s.roughness?.toFixed(3) ?? '',
    s.metalness?.toFixed(3) ?? '',
    m.transparent ? `t${m.opacity.toFixed(2)}` : '',
    m.side,
    s.vertexColors ? 'vc' : '',
  ].join('|');
}

function sceneFingerprint(scene: T.Scene) {
  const groups: Record<
    string,
    { meshes: number; vertices: number; sum: number[]; instances: number }
  > = {};
  scene.updateMatrixWorld(true);
  const v = new T.Vector3();
  scene.traverse((o) => {
    const mesh = o as T.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const key = `${mesh.type}|${mats.map(materialKey).join('+')}|${mesh.castShadow ? 'c' : ''}${mesh.receiveShadow ? 'r' : ''}`;
    const g = (groups[key] ??= {
      meshes: 0,
      vertices: 0,
      sum: [0, 0, 0],
      instances: 0,
    });
    const pos = mesh.geometry.getAttribute('position');
    g.meshes++;
    g.vertices += pos.count;
    const inst = (mesh as T.InstancedMesh).isInstancedMesh
      ? (mesh as T.InstancedMesh)
      : undefined;
    if (inst) {
      g.instances += inst.count;
      const m = new T.Matrix4();
      for (let i = 0; i < inst.count; i++) {
        inst.getMatrixAt(i, m);
        const e = m.elements;
        g.sum[0] += e[12];
        g.sum[1] += e[13];
        g.sum[2] += e[14];
      }
      return;
    }
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      g.sum[0] += v.x;
      g.sum[1] += v.y;
      g.sum[2] += v.z;
    }
  });
  return groups;
}

function surfaceGrid(
  probe: Probe,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  step: number,
) {
  const ground: number[] = [],
    terrain: number[] = [],
    stand: string[] = [];
  for (let z = z0; z <= z1; z += step) {
    let row = '';
    for (let x = x0; x <= x1; x += step) {
      ground.push(Math.round(probe.ground(x, z) * 1e4) / 1e4);
      terrain.push(Math.round(probe.terrain(x, z) * 1e4) / 1e4);
      row +=
        (probe.canStand(x, z, 0.35) ? 1 : 0) +
        (probe.canStand(x, z, 1) ? 2 : 0);
    }
    stand.push(row);
  }
  return { x0, x1, z0, z1, step, ground, terrain, stand };
}

export function installDebugProbe(probe: Probe) {
  testHooks().eagley_debug = {
    // Test setup for streets disconnected from the spawn by filtered links.
    // Movement after setup still uses the normal controller and collisions.
    driveFrom: probe.driveFrom,
    fingerprint: () => sceneFingerprint(probe.scene),
    at: (x: number, z: number) => ({
      ground: probe.ground(x, z),
      terrain: probe.terrain(x, z),
    }),
    surface: (which: 'wide' | 'core') =>
      which === 'wide'
        ? surfaceGrid(probe, -420, 340, -250, 260, 2)
        : surfaceGrid(probe, 0, 160, -60, 40, 0.5),
    /** Material, hit point and vertex count under a screen point (-1..1). */
    pick(nx: number, ny: number) {
      const ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2(nx, ny), probe.camera);
      const hit = ray.intersectObjects(probe.scene.children, true)[0];
      if (!hit) return undefined;
      const mesh = hit.object as T.Mesh;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      return {
        material: mats.map(materialKey).join('+'),
        point: hit.point.toArray().map((v) => Math.round(v * 100) / 100),
        vertices: mesh.geometry.getAttribute('position').count,
      };
    },
    // Place the camera at eye height above the movement surface.
    view(x: number, z: number, h: number, tx: number, tz: number, th = h) {
      probe.freeze();
      probe.follow(x, z);
      probe.camera.position.set(x, probe.ground(x, z) + h, z);
      probe.camera.lookAt(tx, probe.ground(tx, tz) + th, tz);
      probe.render();
    },
  };
}
