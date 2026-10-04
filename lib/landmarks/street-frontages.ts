import * as T from 'three';
import type { Kit } from '../core/kit';
import { nearest, type P } from '../core/geo';
import { drape } from '../core/mesh';
import { masonryUV } from '../materials/building-surfaces';
import { housingBrick } from '../materials/housing-brick';
import { roadWidth, type WorldData } from '../world/data';
import { STREET_HOUSES } from '../world/layout';
import type { Surface } from '../world/surface';
import { streetFrontRoads, streetHousePlan } from './street-houses';

type Wall = { a: P; b: P };

// Back edge of the 1.1m pavement drawn in roads.ts (centre + w/2 + 1.25).
const PAVEMENT_BACK = 1.25;
// Wall heights, drive and path widths are typical, not measured.
const GARDEN_WALL = 0.8;
const GATE = 1.5;

/** Drives, door paths and low front-garden walls for the typed street houses. */
export function addStreetFrontages(
  kit: Kit,
  { surface, data }: { surface: Surface; data: WorldData },
) {
  const { ground } = surface;
  const fronts = streetFrontRoads(surface.roadSeg);
  const others = surface.roadSeg.filter(
    (s) => !fronts.includes(s) && roadWidth(s.f) > 2,
  );
  const walls: Wall[] = [];
  const flags = kit.mat('streetFlags', '#a9a596');
  const brick = housingBrick(kit, 'streetRedBrick', 'red');
  const grit = kit.mat('streetGritstone', '#d9ceb6');
  const coping = kit.mat('streetCoping', '#bdb5a0');

  const pave = (poly: P[], material = kit.m.blockPaving, lift = 0.022) => {
    if (poly.some((q) => !Number.isFinite(q[0]))) return;
    kit.batch(
      drape(poly, (x, z) => ground(x, z) + lift, 0.6),
      material,
    );
  };

  // Low wall in short level pieces that follow the ground.
  const lowWall = (a: P, b: P, material: typeof brick) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!(len >= 0.3 && len < 30)) return;
    const rot = Math.atan2(b[0] - a[0], b[1] - a[1]),
      pieces = Math.ceil(len / 1.2);
    for (let k = 0; k < pieces; k++) {
      const s = (k + 0.5) / pieces,
        x = a[0] + (b[0] - a[0]) * s,
        z = a[1] + (b[1] - a[1]) * s,
        y = ground(x, z);
      const g = new T.BoxGeometry(0.22, GARDEN_WALL + 0.3, len / pieces + 0.01);
      g.rotateY(rot);
      g.translate(x, y + GARDEN_WALL / 2 - 0.15, z);
      masonryUV(g, material === brick ? 1.8 : 4);
      kit.batch(g, material);
      kit.box(
        x,
        y + GARDEN_WALL + 0.03,
        z,
        0.3,
        0.07,
        len / pieces + 0.02,
        coping,
        rot,
      );
    }
    walls.push({ a, b });
  };

  for (const f of data.buildings) {
    const house = STREET_HOUSES[f.id];
    if (!house || house.style === 'pub') continue;
    const plan = streetHousePlan(f.points.slice(0, -1), house, fronts);
    const { fa, t, n, L } = plan;
    const at = (u: number, v = 0.03): P => [
      fa[0] + t[0] * u + n[0] * v,
      fa[1] + t[1] * u + n[1] * v,
    ];
    // Where the line from the house wall meets the back of the pavement.
    // Straight out from the wall to the back of the pavement.
    const reach = (q: P, extra = 0) => {
      for (let d = 0; d < 12; d += 0.05) {
        const x = q[0] + n[0] * d,
          z = q[1] + n[1] * d,
          r = nearest(x, z, fronts);
        if (r.d <= roadWidth(r.s.f) / 2 + PAVEMENT_BACK + extra) return d;
        // Never carry a frontage across another carriageway.
        const o = nearest(x, z, others);
        if (o.d < roadWidth(o.s.f) / 2 + 0.3) return Infinity;
      }
      return Infinity;
    };
    const back = (q: P, extra = 0): P => {
      const d = reach(q, extra);
      return [q[0] + n[0] * d, q[1] + n[1] * d];
    };
    const gap = reach(at(L / 2));
    // Skip fronts that sit on the pavement or are set far back (unseen drives).
    if (gap < 0.8 || gap > 12) continue;

    if (house.style === 'townhouse') {
      pave([at(0), at(L), back(at(L)), back(at(0))]);
    } else if (house.style === 'estate') {
      for (const g of plan.garages) {
        const a = at(g.u - 1.5),
          b = at(g.u + 1.5);
        pave([a, b, back(b), back(a)]);
      }
      for (const u of plan.doors) {
        const a = at(u - 0.55),
          b = at(u + 0.55);
        pave([a, b, back(b), back(a)], flags, 0.03);
      }
    } else {
      // Terraces and the cottage: walled garden with a gate gap and path.
      const material =
        house.face === 'grit' || house.face === 'buff' ? grit : brick;
      const line = (u: number): P => back(at(u), 0.35);
      for (const u of plan.doors) {
        const a = at(u - 0.55),
          b = at(u + 0.55);
        pave([a, b, back(b), back(a)], flags, 0.03);
      }
      const cuts = plan.doors
        .map((u) => [u - GATE / 2, u + GATE / 2])
        .sort((x, y) => x[0] - y[0]);
      let u0 = 0;
      for (const [c0, c1] of cuts) {
        if (c0 > u0) lowWall(line(u0), line(c0), material);
        u0 = Math.max(u0, c1);
      }
      if (u0 < L) lowWall(line(u0), line(L), material);
      // Party-wall divider at the start of each frontage.
      if (gap > 1.2) lowWall(at(0, 0.1), line(0), material);
    }
  }
  return walls;
}
