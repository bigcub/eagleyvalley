import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { drape } from '../core/mesh';
import { masonryUV } from '../materials/building-surfaces';
import { SCHOOL_STREET_WEST as W } from '../world/layout';
import type { Surface } from '../world/surface';

type Wall = { a: P; b: P };

/** M25b west end: block-paved square, walled bay with railings, bollards. */
export function addSchoolStreetWest(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const { ground, sampledTerrain } = surface;
  const walls: Wall[] = [];
  const sandstone = kit.mat('streetSandstone', '#e9dab4');
  sandstone.map ??= kit.m.stone.map;
  const coping = kit.mat('schoolWestCoping', '#cfc3a4');
  const iron = kit.mat('streetIron', '#24292a');
  const utility = kit.mat('schoolWestUtilityDoor', '#6a3f2a');

  kit.batch(
    drape(W.paving, (x, z) => ground(x, z) + 0.026, 0.5),
    kit.m.blockPaving,
  );

  // Retaining walls: top sits above the raised plot behind and at least
  // 1.25m above the paving. Pieces follow the paving, so the base never
  // floats where the bay rises.
  // Unit normal pointing into the bay (the wall runs round it clockwise).
  const intoBay = (a: P, b: P): P => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
  };
  for (let i = 0; i < W.wall.length - 1; i++) {
    const a = W.wall[i],
      b = W.wall[i + 1],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]),
      rot = Math.atan2(b[0] - a[0], b[1] - a[1]),
      bay = intoBay(a, b),
      pieces = Math.ceil(len / 1.5);
    for (let k = 0; k < pieces; k++) {
      const s = (k + 0.5) / pieces,
        x = a[0] + (b[0] - a[0]) * s,
        z = a[1] + (b[1] - a[1]) * s,
        paving = ground(x + bay[0] * 0.5, z + bay[1] * 0.5),
        base = Math.min(paving, sampledTerrain(x - bay[0], z - bay[1])),
        top = Math.max(
          paving + 1.25,
          sampledTerrain(x - bay[0] * 1.5, z - bay[1] * 1.5) + 0.45,
        ),
        bottom = base - 0.4,
        g = new T.BoxGeometry(0.42, top - bottom, len / pieces + 0.02);
      g.rotateY(rot);
      g.translate(x, (top + bottom) / 2, z);
      masonryUV(g, 4);
      kit.batch(g, sandstone);
      kit.box(x, top + 0.05, z, 0.5, 0.1, len / pieces + 0.03, coping, rot);
      // Railings: rails, bars and posts on the coping.
      kit.box(x, top + 0.18, z, 0.04, 0.04, len / pieces + 0.03, iron, rot);
      kit.box(x, top + 1.02, z, 0.05, 0.05, len / pieces + 0.03, iron, rot);
      const bars = Math.round(len / pieces / 0.13);
      for (let j = 0; j < bars; j++) {
        const t = (j + 0.5) / bars - 0.5,
          d = (len / pieces) * t;
        kit.box(
          x + Math.sin(rot) * d,
          top + 0.6,
          z + Math.cos(rot) * d,
          0.022,
          0.86,
          0.022,
          iron,
        );
      }
      kit.box(
        x - Math.sin(rot) * (len / pieces) * 0.5,
        top + 0.6,
        z - Math.cos(rot) * (len / pieces) * 0.5,
        0.06,
        1.0,
        0.06,
        iron,
      );
      kit.box(
        x - Math.sin(rot) * (len / pieces) * 0.5,
        top + 1.14,
        z - Math.cos(rot) * (len / pieces) * 0.5,
        0.09,
        0.12,
        0.09,
        iron,
      );
    }
    walls.push({ a, b });
  }

  // Square stone pier at No.34's corner, with the low brown utility door
  // on the bay face of the wall beside it.
  const pier = W.wall[W.wall.length - 1],
    py = ground(pier[0] - 0.6, pier[1]);
  const pierTop = py + 1.75;
  const pg = new T.BoxGeometry(0.62, pierTop - py + 0.4, 0.62);
  pg.translate(pier[0], (pierTop + py - 0.4) / 2, pier[1]);
  masonryUV(pg, 4);
  kit.batch(pg, sandstone);
  kit.box(pier[0], pierTop + 0.07, pier[1], 0.74, 0.14, 0.74, coping);
  const last = W.wall[W.wall.length - 2],
    len = Math.hypot(pier[0] - last[0], pier[1] - last[1]),
    dir: P = [(pier[0] - last[0]) / len, (pier[1] - last[1]) / len];
  const door: P = [pier[0] - dir[0] * 1.1 - 0.23, pier[1] - dir[1] * 1.1];
  kit.box(
    door[0],
    ground(...door) + 0.62,
    door[1],
    0.04,
    0.75,
    0.45,
    utility,
    Math.atan2(dir[0], dir[1]),
  );

  // Black cast bollards along the edge of the block paving.
  const B = W.bollards;
  for (const t of B.at) {
    const x = B.from[0] + (B.to[0] - B.from[0]) * t,
      z = B.from[1] + (B.to[1] - B.from[1]) * t,
      y = ground(x, z);
    const post = new T.CylinderGeometry(0.075, 0.09, 0.9, 12);
    post.translate(x, y + 0.45, z);
    kit.batch(post, iron);
    const cap = new T.SphereGeometry(
      0.085,
      12,
      6,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    cap.translate(x, y + 0.9, z);
    kit.batch(cap, iron);
    walls.push({ a: [x, z], b: [x, z] });
  }
  return walls;
}
