import * as T from 'three';
import { densify, nearest, segments, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { drape } from '../core/mesh';
import { OSM, THREADFOLD_BEND } from '../world/layout';
import type { WorldData } from '../world/data';
import type { Surface } from '../world/surface';

/** Outside pavement fitted to the retained wall and M04 junction.
 * June2024 u-FH305 and VID-001 support the connected strip; widths estimated. */
export function createThreadfoldBendPlan(data: WorldData) {
  const D = THREADFOLD_BEND;
  const feature = data.roads.find((f) => f.id === OSM.threadfoldWayLoop)!;
  const road = segments([feature]);
  const path = densify(feature.points, 0.35);
  const formationInner: P[] = [];
  const inner: P[] = [],
    outer: P[] = [],
    formationOuter: P[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i];
    const radius = Math.hypot(p[0] - D.junction[0], p[1] - D.junction[1]);
    if (p[0] < D.startX || radius < D.junctionRadius) continue;
    const a = path[i - 1],
      b = path[i + 1];
    const dx = b[0] - a[0],
      dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const n: P = [-dz / len, dx / len];
    const amount =
      T.MathUtils.smoothstep(p[0], D.startX, D.fullWidthX) *
      T.MathUtils.smoothstep(radius, D.junctionRadius, D.fullWidthRadius);
    const width = T.MathUtils.lerp(D.joinWidth, D.width, amount);
    const at = (offset: number): P => [
      p[0] + n[0] * offset,
      p[1] + n[1] * offset,
    ];
    inner.push(at(D.innerOffset));
    formationInner.push(at(D.terrainInnerOffset));
    outer.push(at(D.innerOffset + width));
    formationOuter.push(at(D.innerOffset + width + D.terrainMargin));
  }
  return {
    road,
    pavement: [...inner, ...outer.reverse()],
    formation: [...formationInner, ...formationOuter.reverse()],
  };
}

export function addThreadfoldBendPavement(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  kit.batch(
    drape(
      surface.threadfoldBendPlan.pavement,
      (x, z) =>
        surface.roadY(x, z, nearest(x, z, surface.threadfoldBendPlan.road)) +
        THREADFOLD_BEND.renderHeight,
      0.6,
    ),
    kit.m.paving,
  );
}
