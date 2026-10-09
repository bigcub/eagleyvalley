import {
  BROOK_EAST_GROUND as D,
  BROOK_EAST_BANDS as C,
  BROOK_HEIGHT as H,
} from '../world/layout';
import * as T from 'three';
import type { Kit } from '../core/kit';
import { masonryUV } from '../materials/building-surfaces';
import { brookStoreyY } from './brook-mill';

// East elevation from the local Geograph reference and Historic England 1388079.
// u runs along the front (positive south, left in the photograph), d outward.
const rot = -0.0854,
  cx = 113.42,
  cz = -35.27;
const point = (u: number, d: number): [number, number] => [
  cx + Math.sin(rot) * u + Math.cos(rot) * d,
  cz + Math.cos(rot) * u - Math.sin(rot) * d,
];

function eastHelpers(kit: Kit, base: number) {
  const b = (
    u: number,
    y: number,
    d: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const [x, z] = point(u, d);
    kit.box(x, base + y, z, depth, h, w, m, rot);
  };
  /** Vertical shape in the front's plane, or turned by `turn` about its centre. */
  const shape = (
    points: [number, number][],
    u: number,
    y: number,
    d: number,
    m: T.Material,
    turn = 0,
  ) => {
    const s = new T.Shape(points.map((p) => new T.Vector2(...p))),
      g = new T.ShapeGeometry(s);
    g.rotateY(Math.PI / 2 + turn);
    g.rotateY(rot);
    const [x, z] = point(u, d);
    g.translate(x, base + y, z);
    kit.batch(g, m);
  };
  return { b, shape };
}

/** Main-block east front in the 3.6m-storey frame; the caller stretches it. */
export function addBrookEntrance(kit: Kit, base: number) {
  const { batch } = kit;
  const { stone, brick, trim, glass, dark } = kit.m;
  const { b, shape } = eastHelpers(kit, base);
  const framed = (
    u: number,
    y: number,
    w: number,
    h: number,
    d: number,
    arched = false,
    rise = 0.22,
    lights = 2,
  ) => {
    if (arched) {
      const arch = (ww: number, hh: number): [number, number][] => {
        const p: [number, number][] = [
          [-ww / 2, -hh / 2],
          [ww / 2, -hh / 2],
          [ww / 2, hh / 2 - rise],
        ];
        for (let k = 1; k <= 16; k++) {
          const x = ww / 2 - (ww * k) / 16;
          const q = Math.max(0, 1 - Math.pow(x / (ww / 2), 2));
          p.push([x, hh / 2 - rise + rise * (rise > 0.3 ? Math.sqrt(q) : q)]);
        }
        return p;
      };
      shape(arch(w + 0.2, h + 0.2), u, y, d + 0.06, trim);
      shape(arch(w, h), u, y, d + 0.13, glass);
    } else {
      b(u, y, d, w + 0.2, h + 0.2, 0.12, trim);
      b(u, y, d + 0.08, w, h, 0.08, glass);
    }
    for (let k = 0; k <= lights; k++)
      b(
        u - w / 2 + (k * w) / lights,
        y - (arched ? rise / 2 : 0),
        d + 0.16,
        0.05,
        h - (arched ? rise : 0),
        0.04,
        dark,
      );
    const rows = Math.max(3, Math.round(h / 0.75));
    for (let k = 0; k < rows; k++)
      b(u, y - h / 2 + (k * h) / rows, d + 0.16, w, 0.045, 0.04, dark);
    b(u, y - h / 2 - 0.13, d + 0.12, w + 0.3, 0.12, 0.3, trim);
  };

  const half = C.towerHalf;
  // Tower bay projects slightly; stone ground storey, brick above.
  b(0, 9, 0.26, half * 2, 18, 0.75, brick);
  b(0, 1.8, 0.28, half * 2, 3.6, 0.8, stone);
  for (const u of [-half, half]) b(u, 9, 0.75, 0.4, 18, 0.3, brick);

  // Flank windows: floor 4 (index 3) round-headed, the rest flat-headed.
  for (const u of C.flankOpenings)
    for (let floor = 0; floor < 5; floor++) {
      if (floor === 0 && Math.abs(u - C.porchU) < 1.2) continue;
      framed(u, floor * 3.6 + 1.75, 1.65, 2.55, 0.16, floor === 3, C.archRise);
    }
  // Tower: paired stair lights stepped half a storey, wide top-floor light.
  const L = C.stairLights;
  for (const [lo, hi] of L.spans)
    for (const u of L.us)
      framed(u, (lo + hi) / 2, L.width, hi - lo, 0.7, false, 0.22, 2);
  framed(
    0,
    4 * 3.6 + 1.75,
    C.topLight.width,
    C.topLight.height,
    0.7,
    false,
    0.22,
    3,
  );

  // Projecting course under the top floor; cornice and parapet.
  b(0, 4 * 3.6 - 0.1, 0.79, half * 2 + 0.4, 0.24, 0.35, trim);
  for (const side of [-1, 1])
    b(side * 8.1, 4 * 3.6 - 0.1, 0.16, 9.8, 0.2, 0.4, trim);
  b(0, 18.25, 0.05, 26.3, 0.3, 0.75, trim);
  b(0, 18.45, -0.05, 26.1, 0.55, 0.45, brick);
  b(0, 18.75, -0.05, 26.3, 0.12, 0.6, trim);

  // Buff stripes every few courses; they stop only where a window is.
  const courseMaterial = kit.mat('brookEastStoneCourses', '#c9b994');
  courseMaterial.map = kit.m.stone.map;
  const course = (lo: number, hi: number, y: number, depth: number) => {
    if (hi - lo < 0.05) return;
    const g = new T.BoxGeometry(0.1, C.stripes.thickness, hi - lo);
    g.rotateY(rot);
    const [x, z] = point((lo + hi) / 2, depth);
    g.translate(x, base + y, z);
    masonryUV(g, 2);
    batch(g, courseMaterial);
  };
  type Gap = { u: number; half: number; lo: number; hi: number };
  const flankGaps: Gap[] = C.flankOpenings.flatMap((u) =>
    [1, 2, 3, 4].map((floor) => ({
      u,
      half: 0.95,
      lo: floor * 3.6 + 0.3,
      hi: floor * 3.6 + 3.15,
    })),
  );
  const towerGaps: Gap[] = [
    ...L.spans.flatMap(([lo, hi]) =>
      L.us.map((u) => ({
        u,
        half: L.width / 2 + 0.12,
        lo: lo - 0.2,
        hi: hi + 0.12,
      })),
    ),
    { u: 0, half: C.topLight.width / 2 + 0.12, lo: 14.2, hi: 17.2 },
  ];
  const run = (
    lo: number,
    hi: number,
    y: number,
    depth: number,
    gaps: Gap[],
  ) => {
    let start = lo;
    for (const g of gaps
      .filter((g) => y > g.lo && y < g.hi && g.u > lo && g.u < hi)
      .sort((a, b) => a.u - b.u)) {
      course(start, g.u - g.half, y, depth);
      start = g.u + g.half;
    }
    course(start, hi, y, depth);
  };
  const S = C.stripes;
  for (let y = S.from; y <= S.to; y += S.step) {
    run(C.flankEnds[0], C.flankEnds[1], y, 0.08, flankGaps);
    run(C.flankEnds[2], C.flankEnds[3], y, 0.08, flankGaps);
    run(-half + 0.2, half - 0.2, y, 0.68, towerGaps);
    for (const u of [-half, half]) course(u - 0.21, u + 0.21, y, 0.93);
  }

  // Downpipes either side of the tower, as photographed.
  for (const u of C.downpipes) {
    b(u, 9.1, 0.27, 0.09, 18.2, 0.09, dark);
    b(u, 0.15, 0.32, 0.2, 0.25, 0.2, dark);
  }

  // Offset pointed porch, visible at the left of the east-facing reference.
  const porch = C.porchU;
  b(porch, 1.65, 1.0, 2.65, 3.3, 1.8, stone);
  const stoneFace = new T.MeshStandardMaterial({
    color: '#b1a38a',
    roughness: 1,
    side: T.DoubleSide,
  });
  shape(
    [
      [-1.52, 0],
      [1.52, 0],
      [0, 1.3],
    ],
    porch,
    3.3,
    1.93,
    stoneFace,
  );
  shape(
    [
      [-0.73, 0],
      [0.73, 0],
      [0.73, 2.2],
      [0, 2.85],
      [-0.73, 2.2],
    ],
    porch,
    0.1,
    1.96,
    dark,
  );
  b(porch, 0.1, 2.0, 2.8, 0.2, 1.05, trim);
  b(porch, 1.1, 2.02, 0.04, 1.9, 0.04, trim);
  for (const u of D.positions)
    framed(u, D.centreY, D.width, D.height, D.depth, true, D.rise);
  return [
    point(porch - 1.4, 0.1),
    point(porch + 1.4, 0.1),
    point(porch + 1.4, 2.5),
    point(porch - 1.4, 2.5),
  ];
}

/** Tower above the parapet and the front's corner finials, built at true
 * heights. The east photograph shows an open stage with corner pinnacles,
 * the clock stage and a pediment; the DSM puts the top near 31m. Stage
 * sizes are interpreted from the photograph. */
export function addBrookTowerTop(kit: Kit, base: number) {
  const { batch } = kit;
  const { brick, trim, glass, dark } = kit.m;
  const { b, shape } = eastHelpers(kit, base);
  const ball = (u: number, d: number, y: number, r: number) => {
    const g = new T.SphereGeometry(r, 10, 8);
    const [x, z] = point(u, d);
    g.translate(x, base + y, z);
    batch(g, trim);
  };
  const pinnacle = (u: number, d: number, y: number, size: number) => {
    b(u, y + size * 0.6, d, size, size * 1.2, size, trim);
    ball(u, d, y + size * 1.2 + size * 0.45, size * 0.45);
  };
  const parapet = H.parapet;
  // Corner finials at both ends of the east front.
  for (const u of [-13, 13]) pinnacle(u, 0.05, parapet, 0.7);

  // Stage A: open stage above the cornice, pierced band, corner pinnacles.
  const a0 = brookStoreyY(18),
    a1 = a0 + 2.3,
    aCentre = -1.4,
    aDepth = 4.6;
  b(0, (a0 + a1) / 2, aCentre, 6.4, a1 - a0, aDepth, brick);
  b(0, a0 + 0.12, aCentre, 6.7, 0.24, aDepth + 0.3, trim);
  b(0, a1 + 0.11, aCentre, 6.8, 0.22, aDepth + 0.4, trim);
  const front = aCentre + aDepth / 2;
  for (let k = 0; k < 5; k++)
    b(-2.2 + k * 1.1, (a0 + a1) / 2 + 0.15, front + 0.02, 0.5, 0.7, 0.05, dark);
  for (const u of [-3.25, 3.25])
    for (const d of [front + 0.1, aCentre - aDepth / 2 - 0.1])
      pinnacle(u, d, a1 + 0.22, 0.38);

  // Stage B: clock stage with buff corner pilasters.
  const b0 = a1 + 0.22,
    b1 = b0 + 3.4,
    bCentre = -1.2,
    bSize = 4.8;
  b(0, (b0 + b1) / 2, bCentre, bSize, b1 - b0, bSize, brick);
  for (const u of [-bSize / 2, bSize / 2])
    for (const d of [bCentre - bSize / 2, bCentre + bSize / 2])
      b(u, (b0 + b1) / 2, d, 0.32, b1 - b0, 0.32, trim);
  b(0, b1 + 0.1, bCentre, bSize + 0.35, 0.2, bSize + 0.35, trim);
  for (const y of [b0 + 1.1, b0 + 2.3])
    b(0, y, bCentre, bSize + 0.04, 0.14, bSize + 0.04, trim);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ece8da';
  ctx.beginPath();
  ctx.arc(128, 128, 123, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2d2c';
  ctx.lineWidth = 7;
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92);
    ctx.lineTo(128 + Math.sin(a) * 112, 128 - Math.cos(a) * 112);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(75, 90);
  ctx.lineTo(128, 128);
  ctx.lineTo(173, 59);
  ctx.stroke();
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  const clockY = (b0 + b1) / 2 + 0.1;
  const face = new T.CircleGeometry(1.05, 48);
  face.rotateY(Math.PI / 2 + rot);
  const [fx, fz] = point(0, bCentre + bSize / 2 + 0.03);
  face.translate(fx, base + clockY, fz);
  batch(face, new T.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
  const ring = new T.RingGeometry(1.06, 1.25, 48);
  ring.rotateY(Math.PI / 2 + rot);
  ring.translate(fx, base + clockY, fz);
  batch(ring, trim);
  // User winter reference from X127,Z27 shows a circular glazed south face,
  // distinct from the east clock.
  const [sx, sz] = point(bSize / 2 + 0.03, bCentre);
  const side = (g: T.BufferGeometry, m: T.Material, y: number) => {
    g.rotateY(rot);
    g.translate(sx, base + y, sz);
    batch(g, m);
  };
  side(new T.CircleGeometry(0.82, 40), glass, clockY);
  side(new T.RingGeometry(0.83, 1.06, 40), trim, clockY);
  side(new T.RingGeometry(0.39, 0.45, 32), dark, clockY);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const bar = new T.BoxGeometry(0.38, 0.045, 0.055);
    bar.rotateZ(a);
    bar.translate(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.018);
    side(bar, dark, clockY);
  }

  // Stage C: pediments on each face over a low pyramid, finials.
  const c0 = b1 + 0.2,
    rise = 1.9,
    span = bSize + 0.2;
  const pedimentMat = new T.MeshStandardMaterial({
    color: '#9a5946',
    side: T.DoubleSide,
    roughness: 1,
  });
  const gable: [number, number][] = [
    [-span / 2, 0],
    [span / 2, 0],
    [0, rise],
  ];
  // East and west faces in the front's plane; north and south turned.
  for (const d of [bCentre + span / 2, bCentre - span / 2])
    shape(gable, 0, c0, d, pedimentMat);
  for (const u of [-span / 2, span / 2]) {
    const g = new T.ShapeGeometry(
      new T.Shape(gable.map((p) => new T.Vector2(...p))),
    );
    g.rotateY(rot);
    const [x, z] = point(u, bCentre);
    g.translate(x, base + c0, z);
    batch(g, pedimentMat);
  }
  const roof = new T.ConeGeometry((span / 2) * Math.SQRT2, rise, 4, 1);
  roof.rotateY(Math.PI / 4 + rot);
  const [rx, rz] = point(0, bCentre);
  roof.translate(rx, base + c0 + rise / 2, rz);
  batch(roof, kit.m.slate);
  // Buff copings on the photographed east pediment.
  const slopeLength = Math.hypot(span / 2, rise);
  for (const sign of [-1, 1]) {
    const edge = new T.BoxGeometry(0.16, 0.14, slopeLength);
    edge.rotateX(-sign * Math.atan2(rise, span / 2));
    edge.rotateY(rot);
    const [x, z] = point((-sign * span) / 4, bCentre + span / 2 + 0.05);
    edge.translate(x, base + c0 + rise / 2, z);
    batch(edge, trim);
  }
  for (const u of [-span / 2, span / 2])
    for (const d of [bCentre - span / 2, bCentre + span / 2])
      pinnacle(u, d, c0, 0.28);
  pinnacle(0, bCentre + span / 2, c0 + rise - 0.1, 0.3);
}
