import * as T from 'three';
import type { P } from './geo';

type V = [number, number];

// Geometry builders for surfaces that follow paths and draped polygons.

/** Quad strip between two polylines, with world-space UVs (8m tiles). */
export function strip(left: P[], right: P[], ys: [number, number][]) {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  left.forEach((l, i) => {
    const r = right[i];
    pos.push(l[0], ys[i][0], l[1], r[0], ys[i][1], r[1]);
    uv.push(l[0] / 8, l[1] / 8, r[0] / 8, r[1] / 8);
    if (i) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  });
  return finish(pos, uv, idx);
}

/**
 * Extrude a cross-section profile along a path. Each profile point is
 * [offset along `out`, height above base]. Each consecutive pair of profile
 * points is its own face, so edges stay sharp. A face points to the left of
 * its profile direction: up for an outward run, outward for a downward drop.
 */
export function sweep(
  pts: P[],
  outs: V[],
  base: (i: number) => number,
  profile: [number, number][],
) {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  if (pts.length < 2) return finish(pos, uv, idx);
  for (let f = 1; f < profile.length; f++) {
    const start = pos.length / 3;
    const [o0, h0] = profile[f - 1],
      [o1, h1] = profile[f];
    pts.forEach((p, i) => {
      const n = outs[i],
        y = base(i);
      pos.push(p[0] + n[0] * o0, y + h0, p[1] + n[1] * o0);
      pos.push(p[0] + n[0] * o1, y + h1, p[1] + n[1] * o1);
      uv.push(p[0] / 2 + o0, p[1] / 2 + h0, p[0] / 2 + o1, p[1] / 2 + h1);
    });
    // Choose winding from the first quad so the face points the intended way.
    const v = (k: number) =>
      new T.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
    const n0 = outs[0];
    const want = new T.Vector3(-(h1 - h0) * n0[0], o1 - o0, -(h1 - h0) * n0[1]);
    const got = v(start + 2)
      .sub(v(start))
      .cross(v(start + 1).sub(v(start)));
    const flip = got.dot(want) < 0;
    for (let i = 1; i < pts.length; i++) {
      const k = start + i * 2;
      if (flip) idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
      else idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
    }
  }
  return finish(pos, uv, idx);
}

/** Flat polygon subdivided to `maxEdge` and draped on a height function. */
export function drape(
  polygon: P[],
  y: (x: number, z: number) => number,
  maxEdge: number,
) {
  const shape = new T.Shape(polygon.map((p) => new T.Vector2(p[0], -p[1])));
  const flat = new T.ShapeGeometry(shape).toNonIndexed();
  const src = flat.getAttribute('position');
  const pos: number[] = [],
    uv: number[] = [];
  function tri(a: P, b: P, c: P, depth: number) {
    const long = Math.max(
      Math.hypot(a[0] - b[0], a[1] - b[1]),
      Math.hypot(b[0] - c[0], b[1] - c[1]),
      Math.hypot(c[0] - a[0], c[1] - a[1]),
    );
    if (depth < 6 && long > maxEdge) {
      const ab: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
        bc: P = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2],
        ca: P = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
      tri(a, ab, ca, depth + 1);
      tri(ab, b, bc, depth + 1);
      tri(ca, bc, c, depth + 1);
      tri(ab, bc, ca, depth + 1);
      return;
    }
    for (const p of [a, b, c]) {
      pos.push(p[0], y(...p), p[1]);
      uv.push(p[0] / 8, p[1] / 8);
    }
  }
  for (let i = 0; i < src.count; i += 3)
    tri(
      [src.getX(i), -src.getY(i)],
      [src.getX(i + 1), -src.getY(i + 1)],
      [src.getX(i + 2), -src.getY(i + 2)],
      0,
    );
  flat.dispose();
  return finish(pos, uv);
}

export function finish(pos: number[], uv: number[], idx?: number[]) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  if (idx) g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
