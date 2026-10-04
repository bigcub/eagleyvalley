import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { masonryUV } from '../materials/building-surfaces';
import { HOUGH_TERRACE_ROAD } from '../world/layout';
import type { Surface } from '../world/surface';

type Wall = { a: P; b: P };

/** Dry-stone retaining wall behind the west pavement on the terrace stretch. */
export function addHoughTerraceWall(
  kit: Kit,
  { surface, stone }: { surface: Surface; stone: T.Material },
) {
  const W = HOUGH_TERRACE_ROAD.westWall;
  const line = surface.roadSeg.filter(
    (s) =>
      s.f.id === HOUGH_TERRACE_ROAD.id &&
      Math.max(s.a[1], s.b[1]) > W.z1 &&
      Math.min(s.a[1], s.b[1]) < W.z0,
  );
  const walls: Wall[] = [];
  const coping = kit.mat('houghWallCope', '#7c7b6c');
  let run: P[] = [];
  const flush = () => {
    for (let i = 1; i < run.length; i++)
      walls.push({ a: run[i - 1], b: run[i] });
    run = [];
  };
  for (const s of line) {
    const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]),
      t: P = [(s.b[0] - s.a[0]) / len, (s.b[1] - s.a[1]) / len];
    let n: P = [t[1], -t[0]];
    if (n[0] > 0) n = [-n[0], -n[1]];
    const pieces = Math.ceil(len / 1.2);
    for (let k = 0; k < pieces; k++) {
      const u = (k + 0.5) / pieces,
        cx = s.a[0] + (s.b[0] - s.a[0]) * u,
        cz = s.a[1] + (s.b[1] - s.a[1]) * u;
      if (cz > W.z0 || cz < W.z1) continue;
      const x = cx + n[0] * W.offset,
        z = cz + n[1] * W.offset,
        foot = surface.ground(x - n[0] * 0.4, z - n[1] * 0.4),
        bank = surface.sampledTerrain(x + n[0] * 0.8, z + n[1] * 0.8);
      if (bank - foot < W.minRise) {
        flush();
        continue;
      }
      const top = Math.min(bank + 0.25, foot + W.maxHeight),
        g = new T.BoxGeometry(0.45, top - foot + 0.3, len / pieces + 0.02);
      g.rotateY(Math.atan2(t[0], t[1]));
      g.translate(x, (top + foot - 0.3) / 2, z);
      masonryUV(g, 1.2);
      kit.batch(g, stone);
      kit.box(
        x,
        top + 0.06,
        z,
        0.5,
        0.12,
        len / pieces + 0.03,
        coping,
        Math.atan2(t[0], t[1]),
      );
      run.push([x, z]);
    }
  }
  flush();
  return walls;
}
