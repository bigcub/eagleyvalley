import type { Kit } from '../core/kit';
import { inPoly, type P } from '../core/geo';
import { drape, sweep } from '../core/mesh';
import { BROOK_EAST_BEDS as D } from '../world/layout';
import type { PlantingHints } from '../world/boundaries';
import type { Surface } from '../world/surface';

/** Mulched entrance beds with clipped shrubs and sign posts. Trees are
 * added with the other trees in vegetation.ts. Layout estimated. */
export function addBrookEastBeds(
  kit: Kit,
  { surface, plants }: { surface: Surface; plants: PlantingHints },
) {
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
    // Clipped shrubs on a loose grid, clear of the tree trunk.
    const xs = bed.map((p) => p[0]),
      zs = bed.map((p) => p[1]);
    let k = 0;
    for (let x = Math.min(...xs) + 0.6; x < Math.max(...xs); x += 1.1)
      for (let z = Math.min(...zs) + 0.6; z < Math.max(...zs); z += 1.1) {
        k++;
        if (!inPoly(x, z, bed)) continue;
        if (D.trees.some((t) => Math.hypot(t.x - x, t.z - z) < 0.9)) continue;
        plants.shrubs.push({
          x,
          z,
          y: y(x, z),
          h: 0.55 + 0.3 * ((k * 7) % 5) * 0.25,
        });
      }
  }
  const post = kit.mat('brookEastSignPost', '#9aa0a0', 0.5);
  const board = kit.mat('brookEastSignBoard', '#e9ece6');
  for (const [x, z] of D.signs) {
    const base = y(x, z);
    kit.box(x, base + 0.75, z, 0.06, 1.5, 0.06, post);
    kit.box(x, base + 1.25, z + 0.04, 0.42, 0.55, 0.03, board);
  }
}
