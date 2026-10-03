import * as T from 'three';
import type { P } from '../core/geo';
import type { Kit } from '../core/kit';
import { drape } from '../core/mesh';
import { BRIDGE_GARDENS as G } from '../world/layout';
import type { Surface } from '../world/surface';
import { rearWallZ } from './bridge-rear';
import {
  clippedHedge,
  ironGate,
  trellisFence,
  type Wall,
} from './garden-fences';

// Old Bridge Mill rear gardens: trellis dividers, brook-end hedge and gates.
// User photos from No.3 and of the fences; positions follow the aerial plots.

/** Brook-end garden edge at x, interpolated along the traced plot corners. */
export function bridgeGardenEdgeZ(x: number) {
  const e = G.brookEdge;
  for (let i = 1; i < e.length; i++)
    if (x <= e[i][0] || i === e.length - 1) {
      const t = (x - e[i - 1][0]) / (e[i][0] - e[i - 1][0]);
      return e[i - 1][1] + (e[i][1] - e[i - 1][1]) * t;
    }
  return e[0][1];
}
const HEDGE_IN = 0.45,
  HEDGE_W = 0.85,
  GATE_W = 1.0;
const hedgeLine = (x: number): P => [x, bridgeGardenEdgeZ(x) + HEDGE_IN];

/** Brook-end hedge runs, split at the photographed gates. Collision stops
 * further back so the player's clearance fits through the opening. */
function hedgeRuns(gap = GATE_W) {
  const cuts = [
    G.brookEdge[0][0],
    ...G.gates.flatMap((g) => [g - gap / 2, g + gap / 2]),
    G.brookEdge[G.brookEdge.length - 1][0],
  ];
  const corners = G.brookEdge.map((p) => p[0]);
  const runs: P[][] = [];
  for (let i = 0; i < cuts.length; i += 2) {
    const xs = [
      cuts[i],
      ...corners.filter((x) => x > cuts[i] && x < cuts[i + 1]),
      cuts[i + 1],
    ];
    runs.push(xs.map(hedgeLine));
  }
  return runs;
}
const no3Hedge = (): [P, P] => [
  [G.no3WestHedgeX, rearWallZ(G.no3WestHedgeX) - 3.1],
  [
    G.no3WestHedgeX,
    bridgeGardenEdgeZ(G.no3WestHedgeX) + HEDGE_IN + HEDGE_W / 2,
  ],
];

export function addBridgeGardenFences(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const walls: Wall[] = [];
  const ground = (x: number, z: number) => surface.terrain(x, z);
  // Trellis continues each solid patio screen to the brook-end hedge.
  for (const x of G.fences)
    walls.push(
      trellisFence(
        kit,
        [x, rearWallZ(x) - 3.05],
        [x, bridgeGardenEdgeZ(x) + HEDGE_IN + HEDGE_W / 2],
        ground,
      ),
    );
  for (const g of G.gates) {
    const [hx, hz] = hedgeLine(g + GATE_W / 2),
      [lx, lz] = hedgeLine(g - GATE_W / 2);
    ironGate(kit, [hx, hz], [lx, lz], ground, 1);
  }
  for (const run of hedgeRuns(1.7))
    for (let i = 1; i < run.length; i++)
      walls.push({ a: run[i - 1], b: run[i] });
  const [a, b] = no3Hedge();
  walls.push({ a, b });

  // No.4: paved path beside the hedge to a paved seating area at the far end.
  const paving = kit.mat('bridgeGardenPaving', '#a59f8b');
  const p = G.no4Path;
  kit.ribbon(
    [
      [p.x, rearWallZ(p.x) - 2.95],
      [p.x, G.no4FarPatio[2][1]],
    ],
    p.width,
    paving,
    (x, z) => surface.ground(x, z) + 0.012,
  );
  kit.batch(
    drape(G.no4FarPatio, (x, z) => surface.ground(x, z) + 0.014, 0.6),
    paving,
  );
  return walls;
}

/** Tall clipped brook-end hedge and No.3's west hedge. */
export function addBridgeGardenHedges(
  kit: Kit,
  { surface, leaf }: { surface: Surface; leaf: T.Material },
) {
  const ground = (x: number, z: number) => surface.terrain(x, z);
  for (const run of hedgeRuns())
    for (let i = 1; i < run.length; i++)
      clippedHedge(kit, leaf, run[i - 1], run[i], ground, 1.95, HEDGE_W);
  const [a, b] = no3Hedge();
  clippedHedge(kit, leaf, a, b, ground, 1.6, 0.7);
}
