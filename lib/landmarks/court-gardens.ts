import * as T from 'three';
import { inPoly, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { drape } from '../core/mesh';
import { COURT_GARDENS as G, COURT_ROCKERY as R } from '../world/layout';
import type { Surface } from '../world/surface';
import { boardFence, clippedHedge, type Wall } from './garden-fences';

// Modern Bridge Mill (court houses) gardens and the rockery between the court
// and the lower gardens. UP-003 and Google aerial; dimensions are estimates.

const world = (u: number, v: number): P => [
  40.42 + u * 0.997 + v * 0.079,
  7.45 - u * 0.079 + v * 0.997,
];

const [A, B] = R.edge;
const span = Math.hypot(B[0] - A[0], B[1] - A[1]);
const along: P = [(B[0] - A[0]) / span, (B[1] - A[1]) / span];
const north: P = [along[1], -along[0]];
const depth = R.fronts[R.fronts.length - 1];
const at = (t: number, d: number): P => [
  A[0] + along[0] * t * span + north[0] * d,
  A[1] + along[1] * t * span + north[1] * d,
];

/** Position across the rockery: t along the court edge, d metres north of it. */
export function inCourtRockery(x: number, z: number) {
  const dx = x - A[0],
    dz = z - A[1];
  const t = (dx * along[0] + dz * along[1]) / span,
    d = dx * north[0] + dz * north[1];
  return t >= 0 && t <= 1 && d > 0 && d <= depth ? { t, d } : undefined;
}

/** No.3's side garden: block east end and well mouth, rockery foot and
 * boundary hedges. One level terrace; the level itself is estimated. */
export const courtSideGarden: P[] = [
  world(23.6, -4.6),
  A,
  at(0, depth),
  at((70 - A[0]) / (B[0] - A[0]), depth),
  ...G.sideHedge.slice().reverse(),
  world(23.6, -7.76),
];
export function courtSideGardenTerrain(
  x: number,
  z: number,
  sampled: (x: number, z: number) => number,
) {
  return inPoly(x, z, courtSideGarden) ? sampled(66, -6) : undefined;
}

/** Grass formation under the tiers: a plane below every tier top, so the
 * coarse grass mesh never shows through the stone faces. */
export function courtRockeryTerrain(
  x: number,
  z: number,
  courtY: (x: number, z: number) => number,
  garden: (x: number, z: number) => number,
) {
  const r = inCourtRockery(x, z);
  if (!r) return undefined;
  const foot = at(r.t, depth);
  return T.MathUtils.lerp(courtY(x, z) - 0.9, garden(...foot), r.d / depth);
}

export function addCourtGardens(kit: Kit, { surface }: { surface: Surface }) {
  const walls: Wall[] = [];
  const ground = (x: number, z: number) => surface.terrain(x, z);
  const lawn = (x: number, z: number) => surface.ground(x, z);

  // Rockery: coping at the court edge and three planted tiers of large stones.
  // Large weathered gritstone blocks with moss, not clean dressed coursing.
  const stones = ['#8f8670', '#7b735f', '#9c927a', '#86806a'].map((c, i) =>
    kit.mat(`courtRockeryStone${i}`, c),
  );
  const soil = kit.mat('courtRockerySoil', '#5b4c3b');
  const rot = Math.atan2(along[0], along[1]);
  const top = (k: number, t: number) =>
    surface.courtY(...at(t, 0)) - R.drops[k];
  const garden = (t: number) => lawn(...at(t, depth + 0.3)) - 0.05;
  for (let k = 0; k < R.fronts.length; k++) {
    const front = R.fronts[k],
      back = k ? R.fronts[k - 1] : 0;
    let s = 0,
      n = k * 3;
    while (s < span - 0.05) {
      const len = Math.min(0.75 + ((n * 0.37) % 0.4), span - s);
      const t = (s + len / 2) / span,
        y0 = top(k, t),
        y1 = k + 1 < R.fronts.length ? top(k + 1, t) : garden(t),
        lift = k ? ((n * 0.29) % 0.16) - 0.05 : 0,
        [x, z] = at(t, front - 0.26 + ((n * 0.17) % 0.1));
      kit.box(
        x,
        (y0 + lift + y1) / 2 - 0.05,
        z,
        0.42 + ((n * 0.23) % 0.14),
        y0 + lift - y1 + 0.1,
        len - 0.06,
        stones[n % stones.length],
        rot + ((n % 5) - 2) * 0.025,
      );
      s += len;
      n++;
    }
    // Planted bed behind each face; the coping is solid stone.
    if (k) {
      const [x, z] = at(0.5, (back + front - 0.45) / 2);
      kit.box(
        x,
        top(k, 0.5) - 0.45,
        z,
        front - back - 0.4,
        0.86,
        span,
        soil,
        rot,
      );
    }
  }
  // Stepped stone ends where the tiers meet the well and the east slope.
  for (const t of [0, 1])
    for (let k = 0; k < R.fronts.length; k++) {
      const back = k ? R.fronts[k - 1] : 0,
        [x, z] = at(t, (back + R.fronts[k]) / 2),
        y0 = top(k, t),
        y1 = garden(t);
      kit.box(
        x,
        (y0 + y1) / 2,
        z,
        R.fronts[k] - back,
        y0 - y1,
        0.5,
        stones[(k + 1) % stones.length],
        rot,
      );
    }
  walls.push(
    { a: at(0, 0.05), b: at(1, 0.05) },
    { a: at(0, depth), b: at(1, depth) },
    { a: at(0, 0.05), b: at(0, depth) },
    { a: at(1, 0.05), b: at(1, depth) },
  );
  // Court edge towards the old mill garden, continuing to the engine house
  // where the ground drops to No.5's garden; shrubs are in the planting.
  const east: P[] = [B, [75.4, 8.6], [75.61, 11.34]];
  kit.ribbon(east, 0.3, stones[1], (x, z) => surface.courtY(x, z) + 0.08);
  for (let i = 1; i < east.length; i++)
    walls.push({ a: east[i - 1], b: east[i] });

  // Three paved patios against the north wall.
  const slab = ['#a8a08c', '#9d9684', '#b0a893'].map((c, i) =>
    kit.mat(`courtPatioSlab${i}`, c),
  );
  const urot = Math.atan2(0.079, 0.997);
  for (let u = 0.3; u < 23.6; u += 0.6)
    for (let v = -7.76 - 0.3; v > -7.76 - G.patioDepth; v -= 0.6) {
      const [x, z] = world(u, v);
      kit.box(
        x,
        lawn(x, z) - 0.04,
        z,
        0.58,
        0.1,
        0.58,
        slab[((Math.floor(u * 7 - v * 3) % 3) + 3) % 3],
        urot,
      );
    }
  kit.batch(
    drape(G.terrace, (x, z) => lawn(x, z) + 0.01, 0.6),
    slab[1],
  );

  // Close-boarded screens between patios, lower fences between lawns and on
  // the outer boundary; the shared lawn and brook wall lie beyond.
  const fence = (a: P, b: P, h: number) =>
    walls.push(boardFence(kit, a, b, ground, h));
  const wall = -7.8,
    patioEnd = -7.76 - G.patioDepth - 0.1;
  for (const u of G.divisions) {
    fence(world(u, wall), world(u, patioEnd), 1.8);
    fence(world(u, patioEnd), world(u, G.outerV), 1.1);
  }
  fence(world(-0.05, wall), world(-0.05, G.outerV), 1.1);
  fence(world(-0.05, G.outerV), world(23.6, G.outerV), 1.1);
  for (let i = 1; i < G.sideHedge.length; i++)
    walls.push({ a: G.sideHedge[i - 1], b: G.sideHedge[i] });
  return walls;
}

/** Clipped boundary hedge around No.3's side garden and the tall shrubs between
 * the court and the old mill. Shapes from UP-003; species and sizes estimated. */
export function addCourtGardenPlanting(
  kit: Kit,
  { surface, leaf }: { surface: Surface; leaf: T.Material },
) {
  const ground = (x: number, z: number) => surface.terrain(x, z);
  for (let i = 1; i < G.sideHedge.length; i++)
    clippedHedge(
      kit,
      leaf,
      G.sideHedge[i - 1],
      G.sideHedge[i],
      ground,
      1.45,
      0.75,
    );
  const s = G.eastShrubs;
  for (let z = s.fromZ; z < s.toZ; z += 1.3) {
    const h = 2.1 + Math.sin(z * 1.7) * 0.5;
    crown(
      kit,
      leaf,
      s.x + Math.sin(z * 3) * 0.2,
      surface.courtY(s.x - 0.6, z) - 0.2,
      z,
      h,
      0.75,
    );
  }
  // Rockery planting: a few rounded shrubs and upright conifers on the tiers.
  for (let i = 0; i < 9; i++) {
    const t = 0.06 + i * 0.11 + Math.sin(i * 2.1) * 0.03,
      k = 1 + (i % 3),
      d = (R.fronts[k - 1] + R.fronts[k]) / 2 - 0.12,
      [x, z] = at(t, d),
      y = surface.courtY(...at(t, 0)) - R.drops[k];
    if (i % 4 === 1) crown(kit, leaf, x, y, z, 1.5, 0.3);
    else crown(kit, leaf, x, y, z, 0.6 + (i % 3) * 0.2, 0.42 + (i % 2) * 0.12);
  }
}

/** Rounded shrub: an irregular dark core under overlapping leaf cards. */
function crown(
  kit: Kit,
  leaf: T.Material,
  x: number,
  y: number,
  z: number,
  h: number,
  r: number,
) {
  const core = new T.IcosahedronGeometry(1, 1);
  core.scale(r * 0.85, h * 0.46, r * 0.85);
  core.translate(x, y + h * 0.5, z);
  kit.batch(core, kit.mat('courtShrubCore', '#3e4d31'));
  const n = Math.round(14 + 20 * r * h);
  for (let k = 0; k < n; k++) {
    const a = k * 2.399 + x,
      level = ((k * 0.618) % 1) * 2 - 1,
      ring = Math.sqrt(1 - level * level) * r,
      g = new T.PlaneGeometry(0.34, 0.34);
    g.rotateY(a);
    g.rotateX(Math.sin(k * 1.3) * 0.7);
    g.translate(
      x + Math.cos(a) * ring,
      y + h * 0.5 + level * h * 0.48,
      z + Math.sin(a) * ring,
    );
    kit.batch(g, leaf);
  }
}
