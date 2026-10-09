import * as T from 'three';
import type { Kit } from './kit';

/** Height above `base` after keeping the lowest `keep` metres and stretching
 * everything above by `scale`. */
export function stretchedY(y: number, keep: number, scale: number) {
  return y <= keep ? y : keep + (y - keep) * scale;
}

/** Run `build` and stretch what it batches above `base + keep` by `scale`.
 * Used to fit modelled storeys to measured heights without moving ground-level
 * parts. Normals follow the vertical stretch. */
export function stretchAbove<R>(
  kit: Kit,
  { base, keep, scale }: { base: number; keep: number; scale: number },
  build: () => R,
) {
  const done = new WeakSet<T.BufferGeometry>();
  return kit.transformed((g) => {
    if (done.has(g)) return;
    done.add(g);
    const p = g.getAttribute('position'),
      n = g.getAttribute('normal');
    const v = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) - base;
      if (y <= keep) continue;
      p.setY(i, base + stretchedY(y, keep, scale));
      if (n) {
        v.fromBufferAttribute(n, i);
        v.y /= scale;
        v.normalize();
        n.setXYZ(i, v.x, v.y, v.z);
      }
    }
    p.needsUpdate = true;
    g.computeBoundingBox();
  }, build);
}
