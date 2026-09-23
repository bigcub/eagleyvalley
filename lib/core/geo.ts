import * as T from 'three';

// World coordinates are metres: x east, z south, origin 53.6138, -2.428.
export type P = [number, number];
export type Feature = {
  id: string;
  name: string;
  tags: Record<string, string>;
  points: P[];
};
export type Segment = { a: P; b: P; f: Feature };
export type Nearest = {
  d: number;
  x: number;
  z: number;
  t: number;
  s: Segment;
};

export function segments(features: Feature[]): Segment[] {
  return features.flatMap((f) =>
    f.points.slice(1).map((b, i) => ({ a: f.points[i], b, f })),
  );
}

/** Closed outline of a polygon as segments, for edge-distance queries. */
export function outline(points: P[]): Segment[] {
  return segments([{ points: [...points, points[0]] } as Feature]);
}

export function nearest(
  x: number,
  z: number,
  segs: { a: P; b: P; f?: Feature }[],
): Nearest {
  let best = { d: Infinity, x: 0, z: 0, t: 0, s: segs[0] } as Nearest;
  for (const s of segs) {
    const dx = s.b[0] - s.a[0],
      dz = s.b[1] - s.a[1],
      t = T.MathUtils.clamp(
        ((x - s.a[0]) * dx + (z - s.a[1]) * dz) / (dx * dx + dz * dz || 1),
        0,
        1,
      ),
      px = s.a[0] + dx * t,
      pz = s.a[1] + dz * t,
      d = Math.hypot(px - x, pz - z);
    if (d < best.d) best = { d, x: px, z: pz, t, s: s as Segment };
  }
  return best;
}

export function inPoly(x: number, z: number, p: P[]) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const a = p[i],
      b = p[j];
    if (
      a[1] > z !== b[1] > z &&
      x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]
    )
      c = !c;
  }
  return c;
}

/** Resample a polyline so no step exceeds `step` metres. */
export function densify(p: P[], step = 3) {
  const out: P[] = [];
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1],
      b = p[i],
      n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < n; j++)
      out.push([
        a[0] + ((b[0] - a[0]) * j) / n,
        a[1] + ((b[1] - a[1]) * j) / n,
      ]);
  }
  out.push(p[p.length - 1]);
  return out;
}

export type Bounds = {
  p: P[];
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};
export function bounds(p: P[]): Bounds {
  return {
    p,
    minX: Math.min(...p.map((v) => v[0])),
    maxX: Math.max(...p.map((v) => v[0])),
    minZ: Math.min(...p.map((v) => v[1])),
    maxZ: Math.max(...p.map((v) => v[1])),
  };
}

/** Seeded linear congruential generator, matching the world's existing sequences. */
export function lcg(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
