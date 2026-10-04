import * as T from 'three';
import type { Kit } from '../core/kit';
import { densify, type P } from '../core/geo';
import { VALLEY_MILL, VALLEY_ENTRANCE as E } from '../world/layout';
import type { Surface } from '../world/surface';

const a = VALLEY_MILL.east.from,
  b = VALLEY_MILL.east.to;
const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
const ux = (b[0] - a[0]) / length,
  uz = (b[1] - a[1]) / length;

export function valleyEntranceWorld(u: number, d: number): P {
  return [a[0] + ux * u + uz * d, a[1] + uz * u - ux * d];
}
export function valleyEntranceLocal(x: number, z: number): P {
  const dx = x - a[0],
    dz = z - a[1];
  return [dx * ux + dz * uz, dx * uz - dz * ux];
}
export function inValleyEntrance(x: number, z: number) {
  const [u, d] = valleyEntranceLocal(x, z);
  return u >= E.u0 - 1e-6 && u <= E.u1 + 1e-6 && d >= -0.15 && d <= 12;
}

/** Lower threshold photographed. The hidden descent is provisionally smooth;
 * no photographed ramp or step count is claimed. The road datum is retained. */
export function valleyEntranceLevel(
  x: number,
  z: number,
  base: number,
  road: (x: number, z: number) => number,
  depth: (u: number) => number,
) {
  if (!inValleyEntrance(x, z)) return undefined;
  const [u, d] = valleyEntranceLocal(x, z);
  const edgeDepth = depth(u);
  if (d > edgeDepth + 1e-6) return undefined;
  return T.MathUtils.lerp(
    base + E.thresholdRise,
    road(x, z),
    T.MathUtils.smoothstep(d, E.apronDepth, edgeDepth - E.pavementWidth),
  );
}

/** One connected threshold, provisional approach and earth-retaining returns. */
export function addValleyEntrance(kit: Kit, { surface }: { surface: Surface }) {
  const walls: { a: P; b: P }[] = [];
  const paving = kit.mat('valleyEntrancePaving', '#a69f8e');
  paving.map = kit.m.paving.map;
  paving.bumpMap = paving.map;
  paving.bumpScale = 0.018;
  const brick = kit.mat('valleyEntranceBrick', '#9e806d');
  brick.map = kit.m.brick.map;
  brick.bumpMap = brick.map;
  brick.bumpScale = 0.035;
  const cap = kit.mat('valleyEntranceCoping', '#a09b8b');
  const level = (x: number, z: number) =>
    surface.valleyEntranceY(x, z) ?? surface.ground(x, z);
  // Structured grid keeps the curved apron small. Polygon subdivision made
  // skinny triangles along the road edge and needlessly multiplied geometry.
  const apron = new T.PlaneGeometry(E.u1 - E.u0, 1, 34, 32);
  apron.rotateX(-Math.PI / 2);
  const v = apron.getAttribute('position'),
    uv = apron.getAttribute('uv');
  for (let i = 0; i < v.count; i++) {
    const u = E.u1 - (v.getX(i) + (E.u1 - E.u0) / 2);
    const d =
      (v.getZ(i) + 0.5) * (surface.valleyEntranceDepth(u) + 0.12) - 0.12;
    const p = valleyEntranceWorld(u, d);
    v.setXYZ(i, p[0], level(...p) + 0.015, p[1]);
    uv.setXY(i, u / 2, d / 2);
  }
  apron.computeVertexNormals();
  kit.batch(apron, paving);

  // Tops follow the unexcavated bank. Wall dimensions are estimates.
  for (const u of [E.u0, E.u1]) {
    const from = valleyEntranceWorld(u, 0.02),
      to = valleyEntranceWorld(
        u,
        surface.valleyEntranceDepth(u) - E.pavementWidth,
      );
    const points = densify([from, to], 0.35);
    const upper = (p: P) =>
      Math.max(level(...p) + 0.1, surface.sampledTerrain(...p) + 0.13);
    for (let i = 1; i < points.length; i++) {
      const p = points[i - 1],
        q = points[i],
        len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const g = new T.BoxGeometry(0.34, 1, len + 0.025),
        v = g.getAttribute('position'),
        uv = g.getAttribute('uv');
      for (let j = 0; j < v.count; j++) {
        const t = (v.getZ(j) + len / 2) / len;
        const bottom = T.MathUtils.lerp(level(...p), level(...q), t) - 0.25;
        const top = T.MathUtils.lerp(upper(p), upper(q), t);
        v.setY(j, T.MathUtils.lerp(bottom, top, v.getY(j) + 0.5));
        uv.setXY(j, (v.getZ(j) + len / 2 + i * len) / 2, v.getY(j) / 2);
      }
      g.rotateY(Math.atan2(q[0] - p[0], q[1] - p[1]));
      g.translate((p[0] + q[0]) / 2, 0, (p[1] + q[1]) / 2);
      g.computeVertexNormals();
      kit.batch(g, brick);
      kit.beam(
        new T.Vector3(p[0], upper(p) + 0.04, p[1]),
        new T.Vector3(q[0], upper(q) + 0.04, q[1]),
        0.41,
        0.08,
        cap,
      );
    }
    walls.push({ a: from, b: to });
  }
  return walls;
}
