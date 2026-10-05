import * as T from 'three';
import { inPoly, nearest, outline, type P } from '../core/geo';
import { drape, strip, sweep } from '../core/mesh';
import type { Kit } from '../core/kit';
import { grassTexture } from '../materials/landscape-materials';
import {
  TURNING_CIRCLE as C,
  TURNING_CIRCLE_DETAILS as D,
} from '../world/layout';
import type { Surface } from '../world/surface';

function curve(points: P[], closed: boolean, samples: number): P[] {
  return new T.CatmullRomCurve3(
    points.map(([x, z]) => new T.Vector3(x, 0, z)),
    closed,
    'centripetal',
  )
    .getPoints(samples)
    .map((p) => [p.x, p.z]);
}

function leftNormals(points: P[], closed: boolean): P[] {
  const last = points.length - 1;
  return points.map((_, i) => {
    const a = points[closed && i === 0 ? last - 1 : Math.max(0, i - 1)],
      b = points[closed && i === last ? 1 : Math.min(last, i + 1)],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz);
    return [-dz / len, dx / len];
  });
}

/** Shared outlines for road, footway, island, landform and movement. */
export function createTurningCirclePlan() {
  const outer = curve(C.outer, false, 150);
  const outerNormals = leftNormals(outer, false);
  // Preserve M01's paving seam normal and back edge.
  outerNormals[0] = [-0.248348, 0.968671];
  const widths = outer.map((_, i) => {
    const u = (i / (outer.length - 1)) * (C.pavementWidths.length - 1);
    const k = Math.min(C.pavementWidths.length - 2, Math.floor(u));
    return T.MathUtils.lerp(
      C.pavementWidths[k],
      C.pavementWidths[k + 1],
      u - k,
    );
  });
  const back = outer.map(
    (p, i): P => [
      p[0] + outerNormals[i][0] * widths[i],
      p[1] + outerNormals[i][1] * widths[i],
    ],
  );
  back[0] = [125.275, 37.44];
  const island = curve(C.island, true, 100);
  const islandNormals = leftNormals(island, true);
  // A broad block-paved nose, with only a narrow margin on the other sides.
  const grass = island.map(([x, z]): P => {
    const dx = 138 - x,
      dz = 26 - z,
      d = Math.hypot(dx, dz);
    const inset = 0.22 + 1.2 * (1 - T.MathUtils.smoothstep(x, 130, 134));
    return [x + (dx / d) * inset, z + (dz / d) * inset];
  });
  const road = [...outer, ...C.mouth];
  // The loop paving ends at the asphalt edge. Filling the whole road beneath
  // asphalt let differently triangulated grades expose small paving shards.
  const blockRoad = [...outer, ...C.asphaltMouth.slice(2, 7)];
  const formation = [...back, ...C.mouth];
  const start = Math.ceil((D.bed.start / (C.outer.length - 1)) * 150);
  const end = Math.floor((D.bed.end / (C.outer.length - 1)) * 150);
  const bedFront = back
    .slice(start, end + 1)
    .map(
      (q, i): P => [
        q[0] + outerNormals[start + i][0] * 0.14,
        q[1] + outerNormals[start + i][1] * 0.14,
      ],
    );
  const s = D.shelter,
    cos = Math.cos(s.rotation),
    sin = Math.sin(s.rotation);
  function shelterPoint(u: number, v: number): P {
    return [s.centre[0] + cos * u + sin * v, s.centre[1] - sin * u + cos * v];
  }
  // The wall goes behind the shelter; its paved recess cannot be a soil bed.
  bedFront.forEach((p, i) => {
    const dx = p[0] - s.centre[0],
      dz = p[1] - s.centre[1];
    const u = cos * dx - sin * dz,
      v = sin * dx + cos * dz;
    if (Math.abs(u) < s.width / 2 + 0.3 && v < s.depth / 2 + 0.35)
      bedFront[i] = shelterPoint(u, s.depth / 2 + 0.35);
  });
  const shelterApron = [
    shelterPoint(-s.width / 2 - 0.15, -0.65),
    shelterPoint(s.width / 2 + 0.15, -0.65),
    shelterPoint(s.width / 2 + 0.15, 0.65),
    shelterPoint(-s.width / 2 - 0.15, 0.65),
  ];
  const bedBack = bedFront.map(
    (q, i): P => [
      q[0] + outerNormals[start + i][0] * D.bed.width,
      q[1] + outerNormals[start + i][1] * D.bed.width,
    ],
  );
  const bed = [...bedFront, ...bedBack.toReversed()];
  return {
    outer,
    outerNormals,
    widths,
    back,
    island,
    islandNormals,
    grass,
    road,
    blockRoad,
    formation,
    edge: outline(formation),
    bedFront,
    bed,
    shelterApron,
  };
}
export type TurningCirclePlan = ReturnType<typeof createTurningCirclePlan>;

export function inTurningCircle(x: number, z: number, plan: TurningCirclePlan) {
  const b = C.bounds;
  return (
    x >= b.x0 &&
    x <= b.x1 &&
    z >= b.z0 &&
    z <= b.z1 &&
    inPoly(x, z, plan.formation)
  );
}

/** Distance from the finished formation, for the grass bank blend. */
export function turningCircleEdgeDistance(
  x: number,
  z: number,
  plan: TurningCirclePlan,
) {
  const b = C.bounds;
  if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return Infinity;
  return nearest(x, z, plan.edge).d;
}

export function addTurningCircle(kit: Kit, { surface }: { surface: Surface }) {
  const p = surface.turningCirclePlan,
    y = surface.turningCircleY;
  // The island plates cover this road fill. No disconnected road ribbons or
  // abrupt UV seams at each mapped centreline segment.
  kit.batch(
    drape(p.blockRoad, (x, z) => y(x, z) + 0.015, 1),
    kit.m.blockPaving,
  );
  kit.batch(
    drape(C.asphaltMouth, (x, z) => y(x, z) + 0.021, 1),
    kit.m.asphalt,
  );
  kit.batch(
    drape(p.island, (x, z) => y(x, z) + 0.072, 1),
    kit.m.blockPaving,
  );
  const grass = kit.mat('turningIslandGrass', '#6f8150');
  grass.map = grassTexture();
  grass.bumpMap = grass.map;
  grass.bumpScale = 0.035;
  kit.batch(
    drape(p.grass, (x, z) => y(x, z) + 0.082, 1),
    grass,
  );
  for (const [points, normals] of [
    [p.outer, p.outerNormals],
    [p.island, p.islandNormals],
  ])
    kit.batch(
      sweep(points, normals, (i) => y(...points[i]), [
        [-0.08, 0.005],
        [-0.08, 0.09],
        [0.08, 0.09],
      ]),
      kit.m.kerb,
    );
  const end = p.widths.findIndex((w) => w < 0.08);
  const inner = p.outer
    .slice(0, end + 1)
    .map(
      (q, i): P => [
        q[0] + p.outerNormals[i][0] * 0.08,
        q[1] + p.outerNormals[i][1] * 0.08,
      ],
    );
  const back = p.back.slice(0, end + 1);
  kit.batch(
    strip(
      inner,
      back,
      inner.map((q, i) => [y(...q) + 0.07, y(...back[i]) + 0.07]),
    ),
    kit.m.blockPaving,
  );
}
