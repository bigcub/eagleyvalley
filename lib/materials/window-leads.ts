import type { Kit } from '../core/kit';
import type { Vector3 } from 'three';

/** Clipped leads on observed glazing. Pitch/thickness interpreted,
 * not a measured pane count. Caller supplies the front elevation transform. */
export function addWindowLeads(
  kit: Kit,
  {
    pattern = 'diamond',
    width,
    height,
    point,
  }: {
    pattern?: 'diamond' | 'rectangular';
    width: number;
    height: number;
    point: (x: number, y: number) => Vector3;
  },
) {
  const lead = kit.mat('streetWindowLead', '#747c75', 0.65);
  const half = width / 2;
  if (pattern === 'rectangular') {
    // Fine rectangular leads observed on house537; spacing is estimated.
    for (let x = -half + 0.16; x < half; x += 0.16)
      kit.beam(point(x, 0), point(x, height), 0.012, 0.012, lead);
    for (let y = 0.2; y < height; y += 0.2)
      kit.beam(point(-half, y), point(half, y), 0.012, 0.012, lead);
    return;
  }
  for (const m of [-1.3, 1.3]) {
    for (let c = -1.3 * half; c <= height + 1.3 * half; c += 0.28) {
      const lo = Math.max(-half, Math.min(-c / m, (height - c) / m));
      const hi = Math.min(half, Math.max(-c / m, (height - c) / m));
      if (hi <= lo) continue;
      kit.beam(
        point(lo, m * lo + c),
        point(hi, m * hi + c),
        0.012,
        0.012,
        lead,
      );
    }
  }
}
