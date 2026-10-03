import * as T from 'three';
import { inPoly, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { drape } from '../core/mesh';
import { BRIDGE_PARKING as D } from '../world/layout';
import { courtDoorPositions } from './court-houses';
import type { Surface } from '../world/surface';

export const inBridgeParkingIsland = (x: number, z: number) =>
  D.islands.some((p) => inPoly(x, z, p));

/** One court surface, excluding the frontage well and photographed grass islands.
 * Bay groups fitted from aerial references; paint condition and dimensions estimated. */
export function addBridgeParking(kit: Kit, { surface }: { surface: Surface }) {
  const { courtY } = surface;
  // Following the well edge as part of the perimeter avoids triangles dropping
  // through its retaining face. Door bridges already supply the crossings.
  const edge = D.surface;
  kit.batch(
    drape(edge, (x, z) => courtY(x, z) + 0.018, 0.6),
    kit.m.asphalt,
  );
  for (const island of D.islands) {
    kit.batch(
      drape(island, (x, z) => courtY(x, z) + 0.025, 0.6),
      kit.mat('bridgeCourtGrass', '#758456'),
    );
    kit.ribbon(
      [...island, island[0]],
      0.16,
      kit.m.kerb,
      (x, z) => courtY(x, z) + 0.035,
    );
  }
  // A separate low terrace floor, never an asphalt slope through the well.
  for (let start = 0; start < 23.6; start += 0.5) {
    const x = 40.42 + start * 0.997 + 1.55 * 0.079,
      z = 7.45 - start * 0.079 + 1.55 * 0.997;
    if (courtDoorPositions.some((d) => Math.abs(start - d) < 0.85)) continue;
    kit.box(
      x,
      surface.houseEntry - 2.36,
      z,
      0.5,
      0.035,
      2.75,
      kit.m.paving,
      Math.atan2(0.079, 0.997),
    );
  }
  for (const row of D.rows) {
    const along: P = [Math.cos(row.angle), -Math.sin(row.angle)];
    const inward: P = [Math.sin(row.angle), Math.cos(row.angle)];
    const p = (k: number, d: number): P => [
      row.start[0] + along[0] * k * row.width + inward[0] * d,
      row.start[1] + along[1] * k * row.width + inward[1] * d,
    ];
    for (let k = 0; k <= row.count; k++) {
      const a = p(k, 0),
        b = p(k, row.depth);
      kit.ribbon(
        [a, b],
        0.065,
        kit.mat('bridgeCourtWornPaint', '#c8c5ae'),
        (x, z) => courtY(x, z) + 0.037,
      );
    }
    kit.ribbon(
      [p(0, 0), p(row.count, 0)],
      0.065,
      kit.mat('bridgeCourtWornPaint', '#c8c5ae'),
      (x, z) => courtY(x, z) + 0.037,
    );
  }
  // Join the ramp to the door bridges with a narrow, continuous paved edge.
  kit.ribbon(D.houseWalk, 0.75, kit.m.paving, (x, z) => courtY(x, z) + 0.025);
  for (const p of D.edges)
    kit.ribbon(p, 0.15, kit.m.kerb, (x, z) => courtY(x, z) + 0.035);
  // The shared lower formation is used by grass and player movement as well.
}

/** Existing retaining rail, with the three entrance crossings kept open. */
export function bridgeParkingWalls(): { a: P; b: P }[] {
  const world = (u: number): P => [
    40.42 + u * 0.997 + 3.1 * 0.079,
    7.45 - u * 0.079 + 3.1 * 0.997,
  ];
  const lines: { a: P; b: P }[] = [];
  let previous = 0;
  for (const door of courtDoorPositions) {
    lines.push({ a: world(previous), b: world(door - 0.83) });
    previous = door + 0.83;
  }
  lines.push({ a: world(previous), b: world(23.6) });
  return lines;
}

/** Only the photographed western clipped hedge; crowns and species fitted. */
export function addBridgeParkingPlanting(
  kit: Kit,
  { surface, leaf }: { surface: Surface; leaf: T.Material },
) {
  const h = D.hedge;
  const core = kit.mat('bridgeCourtHedge', '#45543a');
  for (let z = h.fromZ; z < h.toZ; z += 0.7) {
    const y = surface.courtY(h.x, z);
    kit.box(h.x, y + h.height / 2, z, h.width, h.height, 0.75, core);
    for (let k = 0; k < 28; k++) {
      const angle = k * 2.399 + z;
      const g = new T.PlaneGeometry(0.24, 0.25);
      g.rotateY(angle);
      g.rotateX(Math.sin(k + z) * 0.6);
      g.translate(
        h.x + Math.cos(angle) * 0.48,
        y + 0.18 + (k % 6) * 0.14,
        z + Math.sin(angle) * 0.38,
      );
      kit.batch(g, leaf);
    }
  }
}
