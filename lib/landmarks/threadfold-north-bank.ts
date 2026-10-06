import type { Kit } from '../core/kit';
import {
  densify,
  inPoly,
  nearest,
  outline,
  segments,
  type P,
} from '../core/geo';
import { drape } from '../core/mesh';
import {
  OSM,
  SCHOOL_STREET,
  THREADFOLD_MINI_PARKING as D,
} from '../world/layout';
import type { WorldData } from '../world/data';
import type { PlantingHints } from '../world/boundaries';
import type { Surface } from '../world/surface';

type Wall = { a: P; b: P };
type Masonry = (
  a: P,
  b: P,
  ya: number,
  yb: number,
  ha: number,
  hb: number,
) => void;

/** Tarmac of the small north-bank car park; drawn with the roads. */
export function addThreadfoldMiniParking(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  kit.batch(
    drape(D.outline, (x, z) => (surface.miniParkingY(x, z) ?? 0) + 0.03, 0.5),
    kit.m.asphalt,
  );
}

/** Retaining sides and back of the car park, the lamp, and the planted bank
 * between the pavement and the School Street wall. Sizes estimated. */
export function addThreadfoldNorthBank(
  kit: Kit,
  {
    surface,
    data,
    plants,
    masonry,
  }: {
    surface: Surface;
    data: WorldData;
    plants: PlantingHints;
    masonry: Masonry;
  },
): { walls: Wall[]; trees: { x: number; z: number; h: number }[] } {
  const { terrain } = surface;
  const floor = (p: P) => surface.miniParkingY(...p) ?? surface.ground(...p);
  const [front0, front1, back1, back0] = D.outline;
  // Side walls retain the bank; the west one stands a little above it with a
  // pier at the road end (heading 340). The back face continues the tall
  // School Street wall down to the tarmac.
  // Walls start behind the pavement line, leaving the footway open.
  const behind = (a: P, b: P): P => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a[0] + ((b[0] - a[0]) * 2.4) / l, a[1] + ((b[1] - a[1]) * 2.4) / l];
  };
  const pierAt = behind(front0, back0);
  for (const [a, b, extra] of [
    [pierAt, back0, 0.75],
    [behind(front1, back1), back1, 0.35],
  ] as [P, P, number][])
    for (const [p, q] of pairs(densify([a, b], 1.5))) {
      const tp = Math.max(terrain(...p), floor(p)) + extra,
        tq = Math.max(terrain(...q), floor(q)) + extra;
      masonry(
        p,
        q,
        floor(p) - 0.1,
        floor(q) - 0.1,
        tp - floor(p) + 0.1,
        tq - floor(q) + 0.1,
      );
    }
  const pier = kit.mat('threadfoldPier', '#8a8676');
  pier.map = kit.m.stone.map;
  kit.box(pierAt[0], floor(pierAt) + 0.6, pierAt[1], 0.6, 1.2, 0.6, pier);
  // Back retaining face up to the School Street wall's base.
  const top = (p: P) => surface.roadY(...p) - 0.2;
  for (const [p, q] of pairs(densify([back0, back1], 1.5)))
    masonry(
      p,
      q,
      floor(p) - 0.1,
      floor(q) - 0.1,
      top(p) - floor(p) + 0.1,
      top(q) - floor(q) + 0.1,
    );

  // Black heritage lamp on the pavement back edge (heading 40).
  const black = kit.mat('threadfoldLampBlack', '#1d2222', 0.4);
  const [lx, lz] = D.lamp,
    ly = surface.ground(lx, lz);
  kit.box(lx, ly + 0.25, lz, 0.22, 0.5, 0.22, black);
  kit.box(lx, ly + 2.1, lz, 0.1, 3.8, 0.1, black);
  kit.box(lx, ly + 4.15, lz, 0.34, 0.06, 0.34, black);
  kit.box(
    lx,
    ly + 4.4,
    lz,
    0.28,
    0.45,
    0.28,
    kit.mat('lampGlass', '#e9e3c8', 0.3),
  );
  kit.box(lx, ly + 4.68, lz, 0.38, 0.1, 0.38, black);

  // Planted bank: dense evergreens and ivy between the pavement and the wall,
  // with a few mature trees. Kept clear of the car park and the lamp.
  const road = segments(
    data.roads.filter((f) => f.id === OSM.threadfoldWayLoop),
  );
  const wall = segments([
    { points: SCHOOL_STREET_WALL(), id: 'w', name: '', tags: {} },
  ]);
  const parkingEdge = outline(D.outline);
  const trees: { x: number; z: number; h: number }[] = [];
  let k = 0;
  for (let x = D.bankX[0]; x <= D.bankX[1]; x += 1.15)
    for (let z = -80; z < -50; z += 1.15) {
      const r = nearest(x, z, road),
        w = nearest(x, z, wall);
      if (r.d < 5.1 || w.d < 0.9 || z < w.z) continue;
      // North side only: the wall is north of the road here.
      if (z > r.z) continue;
      if (inPoly(x, z, D.outline)) continue;
      if (D.outline.some((p) => Math.hypot(p[0] - x, p[1] - z) < 1.2)) continue;
      if (Math.hypot(x - D.lamp[0], z - D.lamp[1]) < 1.2) continue;
      k++;
      // East of the lamp the bank is leaf litter under mature trees
      // (heading 330); evergreens thin out.
      const woodland = x > 119;
      if (woodland && k % 3 !== 0) {
        if (k % 7 === 1 && w.d > 2) trees.push({ x, z, h: 12 + (k % 5) });
        continue;
      }
      const jx = x + Math.sin(k * 2.3) * 0.35,
        jz = z + Math.cos(k * 1.7) * 0.35;
      // Test the entire generated crown after jitter, not just its centre.
      if (nearest(jx, jz, parkingEdge).d < D.plantingClearance) continue;
      plants.shrubs.push({
        x: jx,
        z: jz,
        y: terrain(jx, jz),
        h: 1.3 + (1 + Math.sin(k * 0.9)) * 0.7,
      });
      if (k % 3 === 0)
        plants.ferns.push({
          x: jx + 0.5,
          y: terrain(jx + 0.5, jz),
          z: jz,
          h: 0.35,
        });
      if (k % 17 === 5 && w.d > 2)
        trees.push({ x: jx, z: jz, h: 11 + (k % 4) });
    }
  return { walls: [], trees };
}

function pairs<T>(p: T[]): [T, T][] {
  return p.slice(1).map((b, i) => [p[i], b]);
}
const SCHOOL_STREET_WALL = () => SCHOOL_STREET.southWall;
