import * as T from 'three';
import type { Kit } from '../core/kit';
import { densify, inPoly, outline, type P } from '../core/geo';
import { drape } from '../core/mesh';
import { masonryUV } from '../materials/building-surfaces';
import { BROOK_PARKING as D, BROOK_PARKING_RAIL as R } from '../world/layout';
import type { Surface } from '../world/surface';

export const brookParking = D.outline;
const inBed = (x: number, z: number) => D.beds.some((p) => inPoly(x, z, p));

/** Aerial-interpreted formation; bay count, widths and bed dimensions estimated. */
export function addBrookParking(kit: Kit, { surface }: { surface: Surface }) {
  const height = surface.brookParkingY;
  kit.batch(
    drape(brookParking, (x, z) => height(x, z) + 0.02, 1.5),
    kit.m.asphalt,
  );
  // Beds have solid edging, never kerbs across the entrance or mapped aisles.
  for (const bed of D.beds) {
    kit.batch(
      drape(bed, (x, z) => height(x, z) + 0.075, 0.5),
      kit.m.soil,
    );
    for (const { a, b } of outline(bed))
      kit.ribbon(
        densify([a, b], 0.5),
        0.12,
        kit.m.kerb,
        (x, z) => height(x, z) + 0.09,
      );
  }
  // Only the western asphalt margin gets a kerb. The brook has its own rail.
  kit.ribbon(
    densify([D.outline[7], D.outline[8], D.outline[9], D.outline[0]], 0.5),
    0.12,
    kit.m.kerb,
    (x, z) => height(x, z) + 0.06,
  );
  const line = (a: P, b: P) =>
    kit.ribbon(
      densify([a, b], 0.25),
      0.075,
      kit.m.paint,
      (x, z) => height(x, z) + 0.035,
      0,
      (p, q) => {
        const x = (p[0] + q[0]) / 2,
          z = (p[1] + q[1]) / 2;
        return inPoly(x, z, brookParking) && !inBed(x, z);
      },
    );
  // Explicit rows, confined to each parking half. No lines through the aisles.
  // These are provisional represented totals, not a surveyed capacity.
  for (const row of [
    { a: [29.8, -54.4], b: [29.4, -50], n: 4, dx: 2.45, dz: 0.2 },
    { a: [49, -53], b: [48.6, -48.6], n: 5, dx: 2.45, dz: 0.2 },
    { a: [37.8, -46.1], b: [41.8, -45.8], n: 7, dx: -0.2, dz: 2.45 },
    { a: [48.2, -46.3], b: [52.5, -45.9], n: 7, dx: -0.2, dz: 2.45 },
    { a: [59.8, -39.3], b: [63, -39], n: 5, dx: -0.2, dz: 2.45 },
  ]) {
    for (let i = 0; i <= row.n; i++)
      line(
        [row.a[0] + i * row.dx, row.a[1] + i * row.dz],
        [row.b[0] + i * row.dx, row.b[1] + i * row.dz],
      );
  }
  // Short fan of bays follows the diagonal western boundary.
  for (let i = 0; i < 4; i++)
    line(
      [17.8 + i * 1.75, -41.5 - i * 1.75],
      [21.2 + i * 1.75, -38.1 - i * 1.75],
    );
  // Hatched heads keep turning space clear beside the two middle rows.
  for (const [x, z] of [
    [35.7, -51.7],
    [49, -48],
  ] as P[])
    for (let i = 0; i < 5; i++)
      line([x + i * 0.65, z], [x + i * 0.65 + 0.6, z + 0.7]);
}

/** Register the solid bed rims and brook-side railing alongside their geometry. */
export function addBrookParkingBoundaries(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const walls: { a: P; b: P }[] = [];
  for (const bed of D.beds)
    walls.push(...outline(bed).map(({ a, b }) => ({ a, b })));
  const post = kit.mat('brookParkingPosts', '#25343b', 0.65);
  const rail = kit.mat('brookParkingPaleRails', '#b7c0bc', 0.65);
  const retaining = kit.mat('brookParkingRetainingStone', '#96988b', 1);
  retaining.map = kit.m.stone.map;
  const pts = densify(D.brookEdge, R.spacing),
    height = surface.brookParkingY;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      y = height(...a);
    kit.box(
      a[0],
      y + R.height / 2,
      a[1],
      R.postWidth,
      R.height,
      R.postWidth,
      post,
    );
    kit.box(a[0], y + 0.06, a[1], 0.19, 0.12, 0.19, post);
    kit.box(a[0], y + R.height + 0.015, a[1], 0.15, 0.03, 0.15, post);
    if (!i) continue;
    const b = pts[i - 1],
      yb = height(...b);
    // Photo-visible masonry beneath the rail. Its bottom is fitted to
    // adjoining terrain; the concealed lower face is not a surveyed height.
    const len = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const nx = -(a[1] - b[1]) / len,
      nz = (a[0] - b[0]) / len;
    const bottomA = Math.min(
      y - 0.15,
      surface.terrain(a[0] + nx * 0.7, a[1] + nz * 0.7) - 0.2,
    );
    const bottomB = Math.min(
      yb - 0.15,
      surface.terrain(b[0] + nx * 0.7, b[1] + nz * 0.7) - 0.2,
    );
    const wall = new T.BoxGeometry(0.45, 1, len + 0.03),
      position = wall.getAttribute('position');
    for (let k = 0; k < position.count; k++) {
      const t = T.MathUtils.clamp((position.getZ(k) + len / 2) / len, 0, 1);
      position.setY(
        k,
        T.MathUtils.lerp(
          T.MathUtils.lerp(bottomB, bottomA, t),
          T.MathUtils.lerp(yb, y, t) + 0.02,
          position.getY(k) + 0.5,
        ),
      );
    }
    wall.rotateY(Math.atan2(a[0] - b[0], a[1] - b[1]));
    wall.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
    wall.computeVertexNormals();
    masonryUV(wall, 2);
    kit.batch(wall, retaining);
    for (const h of R.bars)
      kit.beam(
        new T.Vector3(a[0], y + h, a[1]),
        new T.Vector3(b[0], yb + h, b[1]),
        0.04,
        0.04,
        rail,
      );
    const run = densify([b, a], R.uprightSpacing);
    for (const p of run.slice(1, -1))
      kit.box(p[0], height(...p) + 0.58, p[1], 0.025, 0.76, 0.025, rail);
    walls.push({ a, b });
  }
  return walls;
}

/** Replace the former sparse scattered cards with closed clipped hedge volumes. */
export function addBrookHedges(kit: Kit, { surface }: { surface: Surface }) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#4b5b32';
  ctx.fillRect(0, 0, 128, 128);
  let seed = 930;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `hsl(${78 + rand() * 18},${24 + rand() * 18}%,${22 + rand() * 20}%)`;
    ctx.beginPath();
    ctx.ellipse(
      rand() * 128,
      rand() * 128,
      1 + rand() * 2,
      1 + rand() * 2,
      rand() * 6.28,
      0,
      6.28,
    );
    ctx.fill();
  }
  const map = new T.CanvasTexture(c);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.colorSpace = T.SRGBColorSpace;
  const hedge = kit.mat('brookClippedHedge', '#b2bd8c');
  hedge.map = map;
  hedge.bumpMap = map;
  hedge.bumpScale = 0.04;
  for (const [i, bed] of D.beds.entries()) {
    if (i >= 4) continue; // PA11 replaces west frontage blocks with branched shrubs.
    const h = i < 2 ? 1.05 : i < 4 ? 0.85 : 0.75;
    const shape = new T.Shape(bed.map(([x, z]) => new T.Vector2(x, -z)));
    const g = new T.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.1,
    });
    g.rotateX(-Math.PI / 2);
    const p = g.getAttribute('position'),
      uv = g.getAttribute('uv');
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j),
        z = p.getZ(j),
        y = p.getY(j);
      p.setY(j, y + surface.brookParkingY(x, z) + 0.12);
      uv.setXY(j, (x + z) / 0.8, (y + z) / 0.8);
    }
    g.computeVertexNormals();
    kit.batch(g, hedge);
  }
  // Two tall conifers frame the opening in June 2024; sizes/positions estimated.
  for (const [x, z] of D.entranceTrees) {
    const g = new T.SphereGeometry(1, 12, 14),
      p = g.getAttribute('position');
    for (let j = 0; j < p.count; j++) {
      const y = p.getY(j),
        t = (y + 1) / 2;
      const width =
        1.18 *
        (1 - 0.42 * t) *
        (1 + 0.08 * Math.sin(y * 29 + Math.atan2(p.getZ(j), p.getX(j)) * 7));
      p.setXYZ(
        j,
        x + p.getX(j) * width,
        surface.brookParkingY(x, z) + 2.65 + y * 2.5,
        z + p.getZ(j) * width,
      );
    }
    g.computeVertexNormals();
    kit.batch(g, hedge);
  }
}
