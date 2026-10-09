import * as T from 'three';
import type { Kit } from '../core/kit';
import { inPoly, nearest, outline, type P } from '../core/geo';
import { drape, sweep } from '../core/mesh';
import { BROOK_EAST_BEDS as D } from '../world/layout';
import type { Surface } from '../world/surface';

/** Mulched entrance beds with clipped shrubs and sign posts. Trees are
 * added with the other trees in vegetation.ts. Layout estimated. */
export function addBrookEastBeds(kit: Kit, { surface }: { surface: Surface }) {
  const y = (x: number, z: number) => surface.ground(x, z) + 0.05;
  const mulch = kit.mat('brookEastMulch', '#7b6a55');
  mulch.map = kit.m.stone.map;
  for (const bed of D.beds) {
    kit.batch(drape(bed, y, 0.5), mulch);
    // Low concrete edging round each bed.
    const ring: P[] = [...bed, bed[0]];
    const outs = ring.map((p, i): [number, number] => {
      const a = ring[Math.max(0, i - 1)],
        b = ring[Math.min(ring.length - 1, i + 1)],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz) || 1;
      return [dz / len, -dx / len];
    });
    kit.batch(
      sweep(ring, outs, (i) => surface.ground(...ring[i]), [
        [-0.07, -0.05],
        [-0.07, 0.11],
        [0.07, 0.11],
        [0.07, -0.05],
      ]),
      kit.m.kerb,
    );
  }
  const post = kit.mat('brookEastSignPost', '#9aa0a0', 0.5);
  const board = kit.mat('brookEastSignBoard', '#e9ece6');
  for (const [x, z] of D.signs) {
    const base = y(x, z);
    kit.box(x, base + 0.75, z, 0.06, 1.5, 0.06, post);
    kit.box(x, base + 1.25, z + 0.04, 0.42, 0.55, 0.03, board);
  }
}

/** NrBn7lFZ84Dc1-Ddye6W_g June2024 headings245/285/325: low, flat-topped
 * clipped masses fill both beds, ground cover in the south bed and lumpier
 * shrubs round the signs. Small instanced leaves follow a rounded profile
 * inside each bed edge; heights and lumps are estimates. */
export function addBrookEastBedPlanting(
  kit: Kit,
  { scene, surface }: { scene: T.Scene; surface: Surface },
) {
  let seed = 4127;
  const rand = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
  const shape = new T.Shape();
  shape.absellipse(0, 0, 0.06, 0.03, 0, Math.PI * 2, false, 0);
  const mat = kit.mat('brookEastBedLeaves', '#6d8448');
  mat.side = T.DoubleSide;
  const perM2 = D.leavesPerM2;
  const plans = D.beds.map((bed, b) => {
    const xs = bed.map((p) => p[0]),
      zs = bed.map((p) => p[1]);
    const box = [
      Math.min(...xs),
      Math.max(...xs),
      Math.min(...zs),
      Math.max(...zs),
    ];
    let area = 0;
    bed.forEach((p, i) => {
      const q = bed[(i + 1) % bed.length];
      area += p[0] * q[1] - q[0] * p[1];
    });
    return {
      bed,
      box,
      edge: outline(bed),
      h: D.heights[b],
      n: Math.round((Math.abs(area) / 2) * perM2),
    };
  });
  const total = plans.reduce((s, p) => s + p.n, 0);
  const leaves = new T.InstancedMesh(new T.ShapeGeometry(shape, 3), mat, total);
  const o = new T.Object3D();
  let index = 0;
  for (const { bed, box, edge, h, n } of plans) {
    for (let k = 0; k < n; k++) {
      let x = 0,
        z = 0,
        d = 0;
      for (let attempt = 0; attempt < 40; attempt++) {
        x = box[0] + rand() * (box[1] - box[0]);
        z = box[2] + rand() * (box[3] - box[2]);
        if (!inPoly(x, z, bed)) continue;
        d = nearest(x, z, edge).d;
        if (d < D.inset) continue;
        if (D.trees.some((t) => Math.hypot(t.x - x, t.z - z) < D.trunkClear))
          continue;
        break;
      }
      // Rounded shoulder at the bed edge, gentle lumps across the top.
      const shoulder = Math.min(1, (d - D.inset) / D.shoulder);
      const lump =
        1 +
        D.lumpiness * Math.sin(x * 2.3 + z * 0.7) * Math.sin(z * 2.9 - x * 0.4);
      const top = h * Math.sqrt(Math.max(0.05, shoulder)) * lump;
      // Most leaves form the clipped outer shell; some fill the sides.
      const y = rand() < 0.78 ? top - rand() * 0.1 : rand() * top;
      o.position.set(x, surface.ground(x, z) + 0.06 + y, z);
      o.rotation.set(
        rand() * Math.PI,
        rand() * Math.PI * 2,
        rand() * Math.PI * 2,
      );
      o.scale.setScalar(0.85 + rand() * 0.5);
      o.updateMatrix();
      leaves.setMatrixAt(index, o.matrix);
      leaves.setColorAt(
        index++,
        new T.Color().setHSL(
          0.21 + rand() * 0.05,
          0.3 + rand() * 0.12,
          0.42 + rand() * 0.22,
        ),
      );
    }
  }
  leaves.castShadow = leaves.receiveShadow = true;
  scene.add(leaves);
}
