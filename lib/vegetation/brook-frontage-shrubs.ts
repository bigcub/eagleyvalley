import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Surface } from '../world/surface';
import { inPoly } from '../core/geo';
import { BROOK_FRONTAGE_SHRUBS as D, BROOK_PARKING } from '../world/layout';

/** UP-001/002 irregular crowns replace the two solid west-wall hedge volumes.
 * Small leaves and branching are procedural; positions and sizes estimated. */
export function addBrookFrontageShrubs(
  kit: Kit,
  { scene, surface }: { scene: T.Scene; surface: Surface },
) {
  let seed = 921;
  const rand = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
  const shape = new T.Shape();
  for (let i = 0; i <= 8; i++) {
    const a = (i * Math.PI) / 4,
      x = Math.cos(a) * 0.045,
      y = Math.sin(a) * 0.023;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const material = kit.mat('brookFrontageLeaves', '#647b3e', 1);
  material.side = T.DoubleSide;
  const count = 1400;
  const leaves = new T.InstancedMesh(
    new T.ShapeGeometry(shape),
    material,
    D.length * count,
  );
  const stems = new T.InstancedMesh(
    new T.CylinderGeometry(0.012, 0.03, 1, 5),
    kit.mat('brookFrontageBranches', '#64553e', 1),
    D.length * 7,
  );
  const o = new T.Object3D(),
    up = new T.Vector3(0, 1, 0);
  D.forEach((s, index) => {
    const base = surface.brookParkingY(s.x, s.z) + 0.075;
    for (let k = 0; k < 7; k++) {
      const a = k * 2.399;
      const branch = new T.Vector3(
        Math.cos(a) * s.rx * 0.6,
        s.height * (0.52 + rand() * 0.25),
        Math.sin(a) * s.rz * 0.6,
      );
      o.position.set(
        s.x + branch.x / 2,
        base + branch.y / 2,
        s.z + branch.z / 2,
      );
      o.quaternion.setFromUnitVectors(up, branch.clone().normalize());
      o.scale.set(1, branch.length(), 1);
      o.updateMatrix();
      stems.setMatrixAt(index * 7 + k, o.matrix);
    }
    for (let k = 0; k < count; k++) {
      const level = 0.18 + rand() * 0.82;
      let x = s.x,
        z = s.z;
      for (let attempt = 0; attempt < 20; attempt++) {
        const a = rand() * Math.PI * 2,
          r = Math.sqrt(rand()) * Math.sqrt(1 - Math.pow(level * 2 - 1, 2));
        x = s.x + Math.cos(a) * r * s.rx;
        z = s.z + Math.sin(a) * r * s.rz;
        const bed = BROOK_PARKING.beds[s.bed];
        if (
          inPoly(x - 0.05, z, bed) &&
          inPoly(x + 0.05, z, bed) &&
          inPoly(x, z - 0.05, bed) &&
          inPoly(x, z + 0.05, bed)
        )
          break;
        x = s.x;
        z = s.z;
      }
      o.position.set(x, base + level * s.height, z);
      o.rotation.set(
        rand() * Math.PI,
        rand() * Math.PI * 2,
        rand() * Math.PI * 2,
      );
      const size = 0.75 + rand() * 0.5;
      o.scale.set(size, size, size);
      o.updateMatrix();
      leaves.setMatrixAt(index * count + k, o.matrix);
      leaves.setColorAt(
        index * count + k,
        new T.Color().setHSL(
          0.2 + rand() * 0.055,
          0.3 + rand() * 0.15,
          0.55 + rand() * 0.25,
        ),
      );
    }
  });
  stems.castShadow =
    stems.receiveShadow =
    leaves.castShadow =
    leaves.receiveShadow =
      true;
  scene.add(stems, leaves);
}
