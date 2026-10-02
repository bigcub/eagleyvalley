import * as T from 'three';
import { inPoly, type P } from '../core/geo';
import { drape, strip, sweep } from '../core/mesh';
import type { Kit } from '../core/kit';
import { EAGLEY_HOUGH_BEND as B, OSM } from '../world/layout';
import type { WorldData } from '../world/data';
import type { Surface } from '../world/surface';

type Options = { surface: Surface };

/** One shared trace for paving, kerbs, wall and walking formation. */
export function createEagleyHoughBendPlan() {
  const kerb: P[] = [],
    back: P[] = [];
  B.kerb.slice(1).forEach((b, i) => {
    const a = B.kerb[i];
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25);
    for (let j = i === 0 ? 0 : 1; j <= steps; j++) {
      const t = j / steps;
      kerb.push([
        T.MathUtils.lerp(a[0], b[0], t),
        T.MathUtils.lerp(a[1], b[1], t),
      ]);
      back.push([
        T.MathUtils.lerp(B.backEdge[i][0], B.backEdge[i + 1][0], t),
        T.MathUtils.lerp(B.backEdge[i][1], B.backEdge[i + 1][1], t),
      ]);
    }
  });
  const outs = kerb.map((p, i): P => {
    const a = kerb[Math.max(0, i - 1)],
      b = kerb[Math.min(kerb.length - 1, i + 1)];
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dx, dz);
    // At the west seam match the previous generated pavement's end normal.
    if (i === 0) return [0.0364925, 0.9993339];
    return [-dz / length, dx / length];
  });
  // The existing paving starts 0.07m behind the kerb centre. Its outer edge
  // is 1.17m out. Preserve those seams at the narrow west end.
  const inner = kerb.map(
    (p, i): P => [p[0] + outs[i][0] * 0.07, p[1] + outs[i][1] * 0.07],
  );
  const outer = back;
  const outline = [...inner, ...outer.toReversed()];
  const line = kerb.slice(1).map((b, i) => ({ a: kerb[i], b }));
  return { kerb, outs, inner, outer, outline, line };
}

export type EagleyHoughBendPlan = ReturnType<typeof createEagleyHoughBendPlan>;

export function inEagleyHoughBendPavement(
  x: number,
  z: number,
  plan: EagleyHoughBendPlan,
) {
  const b = B.bounds;
  if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return false;
  return inPoly(x, z, plan.outline);
}

export function addEagleyHoughBend(
  kit: Kit,
  { surface, data }: Options & { data: WorldData },
) {
  const plan = surface.eagleyHoughBendPlan;
  const y = surface.eagleyHoughBendY;
  kit.batch(
    strip(
      plan.inner,
      plan.outer,
      plan.kerb.map((_, i) => [
        y(...plan.inner[i]) + 0.07,
        y(...plan.outer[i]) + 0.07,
      ]),
    ),
    kit.m.paving,
  );
  kit.batch(
    sweep(plan.kerb, plan.outs, (i) => y(...plan.kerb[i]), [
      [-0.08, 0.005],
      [-0.08, 0.07],
      [0.08, 0.07],
    ]),
    kit.m.kerb,
  );
  // One road-edge polygon closes the triangular gaps left by independently
  // generated carriageways and reaches the rounded pavement return.
  const mill = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const approach = data.roads.find((f) => f.id === OSM.houghMillApproach)!;
  const loop = data.roads.find((f) => f.id === OSM.busTurningLoop)!;
  const centres = [
    ...mill.points.slice(-2),
    ...approach.points.slice(1),
    loop.points.at(-2)!,
  ];
  kit.batch(
    drape(
      [...centres, ...plan.kerb.toReversed()],
      (x, z) => surface.roadY(x, z) + 0.012,
      1,
    ),
    kit.m.asphalt,
  );
}

/** Low bank wall ends before the widened apron. Every segment collides. */
export function addEagleyHoughBendWall(kit: Kit, { surface }: Options) {
  const plan = surface.eagleyHoughBendPlan;
  const path: P[] = [],
    outs: P[] = [];
  plan.kerb.forEach((p, i) => {
    if (p[0] > B.wallEndX) return;
    path.push([
      plan.outer[i][0] + (plan.outs[i][0] * B.wallThickness) / 2,
      plan.outer[i][1] + (plan.outs[i][1] * B.wallThickness) / 2,
    ]);
    outs.push(plan.outs[i]);
  });
  const stone = kit.mat('passageRubble', '#777b6c');
  kit.batch(
    sweep(path, outs, (i) => surface.eagleyHoughBendY(...path[i]) - 0.16, [
      [-B.wallThickness / 2, 0],
      [-B.wallThickness / 2, B.wallHeight],
      [B.wallThickness / 2, B.wallHeight],
      [B.wallThickness / 2, 0],
    ]),
    stone,
  );
  // Close the visible end, rather than leaving an open extrusion face.
  const last = path.length - 1;
  kit.box(
    path[last][0],
    surface.eagleyHoughBendY(...path[last]) - 0.16 + B.wallHeight / 2,
    path[last][1],
    B.wallThickness,
    B.wallHeight,
    0.05,
    stone,
    Math.atan2(outs[last][0], outs[last][1]) - Math.PI / 2,
  );
  return path.slice(1).map((b, i) => ({ a: path[i], b }));
}
