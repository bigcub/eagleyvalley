import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Surface } from '../world/surface';
import { densify, inPoly } from '../core/geo';
import {
  BROOK_PARKING as B,
  BROOK_PARKING_PLANTING as D,
} from '../world/layout';

/** M10 roadside clipped crowns and entrance conifers from June2024.
 * Procedural leaves replace the solid bed extrusions. All sizes estimated. */
export function addBrookParkingPlanting(
  kit: Kit,
  { scene, surface }: { scene: T.Scene; surface: Surface },
) {
  let seed = 930;
  const rand = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
  const crowns = [
    ...D.hedges.flatMap((h) =>
      densify(h.path, D.crownSpacing).map(([x, z]) => ({
        x,
        z,
        height: h.height,
        rx: 0.85,
        rz: 0.85,
        bed: h.bed,
      })),
    ),
    ...D.islands,
  ];
  const shape = new T.Shape();
  shape.absellipse(0, 0, 0.052, 0.025, 0, Math.PI * 2, false, 0);
  const mat = kit.mat('brookParkingLeaves', '#71854b');
  mat.side = T.DoubleSide;
  const count = 1800;
  const leaves = new T.InstancedMesh(
    new T.ShapeGeometry(shape, 4),
    mat,
    crowns.length * count,
  );
  const twig = kit.mat('brookParkingTwigs', '#62573f');
  const o = new T.Object3D();
  crowns.forEach((s, index) => {
    const y = surface.brookParkingY(s.x, s.z) + 0.09;
    for (let k = 0; k < 7; k++) {
      const a = k * 2.399;
      kit.beam(
        new T.Vector3(s.x, y, s.z),
        new T.Vector3(
          s.x + Math.cos(a) * s.rx * 0.48,
          y + s.height * 0.8,
          s.z + Math.sin(a) * s.rz * 0.48,
        ),
        0.025,
        0.025,
        twig,
      );
    }
    for (let k = 0; k < count; k++) {
      const level = 0.12 + rand() * 0.88;
      let x = s.x,
        z = s.z;
      for (let attempt = 0; attempt < 25; attempt++) {
        const a = rand() * Math.PI * 2,
          r = Math.sqrt(rand()) * (0.82 + 0.18 * Math.sin(level * Math.PI));
        x = s.x + Math.cos(a) * r * s.rx;
        z = s.z + Math.sin(a) * r * s.rz;
        const bed = B.beds[s.bed];
        if (
          inPoly(x - 0.07, z, bed) &&
          inPoly(x + 0.07, z, bed) &&
          inPoly(x, z - 0.07, bed) &&
          inPoly(x, z + 0.07, bed)
        )
          break;
        x = s.x;
        z = s.z;
      }
      o.position.set(x, y + level * s.height, z);
      o.rotation.set(
        rand() * Math.PI,
        rand() * Math.PI * 2,
        rand() * Math.PI * 2,
      );
      const scale = 0.8 + rand() * 0.5;
      o.scale.setScalar(scale);
      o.updateMatrix();
      leaves.setMatrixAt(index * count + k, o.matrix);
      leaves.setColorAt(
        index * count + k,
        new T.Color().setHSL(
          0.2 + rand() * 0.055,
          0.3 + rand() * 0.12,
          0.47 + rand() * 0.25,
        ),
      );
    }
  });
  // Short paired needles along a central spray make a feathery conifer edge.
  const spray = new T.Shape();
  spray.moveTo(0, 0);
  spray.lineTo(0.025, 0.28);
  spray.lineTo(0, 0.4);
  for (let i = 6; i >= 0; i--) {
    const y = 0.05 + i * 0.045,
      w = 0.1 * (1 - i / 9);
    spray.lineTo(-w, y + 0.045);
    spray.lineTo(-0.012, y);
  }
  spray.lineTo(0, 0);
  for (let i = 0; i < 7; i++) {
    const y = 0.05 + i * 0.045,
      w = 0.1 * (1 - i / 9);
    spray.lineTo(w, y + 0.045);
    spray.lineTo(0.012, y);
  }
  spray.lineTo(0, 0.4);
  spray.closePath();
  const conifer = kit.mat('brookEntranceConifer', '#466448');
  conifer.side = T.DoubleSide;
  const spraysPerTree = 2200;
  const needles = new T.InstancedMesh(
    new T.ShapeGeometry(spray),
    conifer,
    B.entranceTrees.length * spraysPerTree,
  );
  B.entranceTrees.forEach(([x, z], index) => {
    const y = surface.brookParkingY(x, z) + 0.1,
      h = D.coniferHeight;
    kit.box(x, y + h / 2, z, 0.13, h, 0.13, twig);
    for (let j = 0; j < 24; j++) {
      const level = 0.12 + j * 0.031,
        a = j * 2.399,
        r = D.coniferRadius * Math.pow(Math.sin(level * Math.PI), 0.7);
      kit.beam(
        new T.Vector3(x, y + level * h, z),
        new T.Vector3(
          x + Math.cos(a) * r,
          y + level * h + 0.3,
          z + Math.sin(a) * r,
        ),
        0.035,
        0.025,
        twig,
      );
    }
    for (let j = 0; j < spraysPerTree; j++) {
      const level = 0.04 + rand() * 0.91,
        a = rand() * Math.PI * 2;
      const r =
        D.coniferRadius *
        Math.pow(Math.sin(level * Math.PI), 0.7) *
        (0.65 + 0.35 * Math.sqrt(rand()));
      o.position.set(x + Math.cos(a) * r, y + level * h, z + Math.sin(a) * r);
      o.rotation.set(
        (rand() - 0.5) * 1.2,
        a + Math.PI / 2,
        (rand() - 0.5) * 0.6,
      );
      o.scale.setScalar(0.7 + rand() * 0.65);
      o.updateMatrix();
      needles.setMatrixAt(index * spraysPerTree + j, o.matrix);
      needles.setColorAt(
        index * spraysPerTree + j,
        new T.Color().setHSL(
          0.29 + rand() * 0.04,
          0.22 + rand() * 0.15,
          0.42 + rand() * 0.24,
        ),
      );
    }
  });
  leaves.castShadow =
    leaves.receiveShadow =
    needles.castShadow =
    needles.receiveShadow =
      true;
  scene.add(leaves, needles);
}
