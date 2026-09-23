import * as T from 'three';
import { densify, nearest } from '../core/geo';
import type { Kit } from '../core/kit';
import { grassTexture } from '../materials/landscape-materials';
import type { WorldData } from './data';
import type { Surface } from './surface';

const { lerp } = T.MathUtils;

/**
 * Grass landform: a coarse 2m mesh over the whole map with the mill courts cut
 * out, and a 0.5m mesh there to resolve narrow level changes.
 */
export function addLand(scene: T.Scene, surface: Surface) {
  const { terrain, riverSeg } = surface;
  const grassMap = grassTexture();
  function makeLand(
    x0: number,
    z0: number,
    w: number,
    d: number,
    step: number,
    omitCourts = false,
  ) {
    const g = new T.PlaneGeometry(
      w,
      d,
      Math.round(w / step),
      Math.round(d / step),
    );
    g.rotateX(-Math.PI / 2);
    g.translate(x0 + w / 2, 0, z0 + d / 2);
    const pos = g.getAttribute('position'),
      colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i);
      let y = terrain(x, z);
      // Match the coarse edge exactly to avoid cracks at the patch perimeter.
      if (step < 2 && (x === x0 || x === x0 + w || z === z0 || z === z0 + d)) {
        const ax = Math.floor(x / 2) * 2,
          az = Math.floor(z / 2) * 2,
          u = (x - ax) / 2,
          v = (z - az) / 2;
        y = lerp(
          lerp(terrain(ax, az), terrain(ax + 2, az), u),
          lerp(terrain(ax, az + 2), terrain(ax + 2, az + 2), u),
          v,
        );
      }
      pos.setY(i, y);
      const c = new T.Color('#6f8150');
      c.multiplyScalar(0.88 + 0.12 * Math.sin(x * 0.036) * Math.cos(z * 0.042));
      if (nearest(x, z, riverSeg).d < 8) c.set('#617158');
      colors.push(c.r, c.g, c.b);
    }
    if (omitCourts) {
      const old = g.index!,
        indices: number[] = [];
      for (let i = 0; i < old.count; i += 3) {
        const ids = [old.getX(i), old.getX(i + 1), old.getX(i + 2)],
          x = ids.reduce((s, j) => s + pos.getX(j), 0) / 3,
          z = ids.reduce((s, j) => s + pos.getZ(j), 0) / 3;
        if (x > 0 && x < 176 && z > -46 && z < 60) continue;
        indices.push(...ids);
      }
      g.setIndex(indices);
    }
    const landUV = g.getAttribute('uv');
    for (let i = 0; i < pos.count; i++)
      landUV.setXY(i, pos.getX(i) / 12, pos.getZ(i) / 12);
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const mesh = new T.Mesh(
      g,
      new T.MeshStandardMaterial({
        vertexColors: true,
        map: grassMap,
        bumpMap: grassMap,
        bumpScale: 0.035,
        roughness: 1,
      }),
    );
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  makeLand(-750, -650, 1500, 1300, 2, true);
  makeLand(0, -46, 176, 106, 0.5);
}

/** Eagley Brook: soil bed, water surface and drifting ripple lines. */
export function addWater(
  scene: T.Scene,
  kit: Kit,
  surface: Surface,
  data: WorldData,
) {
  const { riverY, riverSeg } = surface;
  const waterMat = new T.MeshStandardMaterial({
    color: '#548b89',
    metalness: 0.45,
    roughness: 0.19,
    transparent: true,
    opacity: 0.88,
  });
  for (const w of data.water) {
    kit.ribbon(densify(w.points), 10, kit.m.soil, (x, z) => riverY(x, z) - 0.4);
    kit.ribbon(densify(w.points), 7, waterMat, (x, z) => riverY(x, z));
  }
  const lines: T.Line[] = [];
  for (let i = 0; i < 70; i++) {
    const s = riverSeg[i % riverSeg.length],
      t = (i * 0.618) % 1,
      x = lerp(s.a[0], s.b[0], t),
      z = lerp(s.a[1], s.b[1], t);
    const g = new T.BufferGeometry().setFromPoints([
      new T.Vector3(x, riverY(x, z) + 0.06, z),
      new T.Vector3(x + 1.6, riverY(x, z) + 0.06, z + 0.18),
    ]);
    const l = new T.Line(
      g,
      new T.LineBasicMaterial({
        color: '#cee4d6',
        transparent: true,
        opacity: 0.25,
      }),
    );
    scene.add(l);
    lines.push(l);
  }
  return {
    material: waterMat,
    animate(time: number) {
      lines.forEach((l, i) => {
        l.position.x = Math.sin(time * 0.8 + i) * 0.6;
        l.position.z = Math.sin(time * 0.6 + i) * 0.2;
      });
    },
  };
}
