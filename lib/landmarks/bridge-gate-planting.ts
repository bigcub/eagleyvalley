import * as T from 'three';
import type { Kit } from '../core/kit';
import { BRIDGE_GATE_PLANTING as D } from '../world/layout';
import type { Surface } from '../world/surface';
import { clippedHedge, clippedLeafMaterial } from './garden-fences';

/** Solid garden edge only. Neither shared entrance gets a hedge across it. */
export function bridgeGateHedgeWalls() {
  return D.hedge.slice(1).map((b, i) => ({ a: D.hedge[i], b }));
}

/** June2024 EAG-043 shows clipped garden planting behind the left return,
 * a mixed bed beside the passage and open lawn around a mature tree on right.
 * Plant positions/heights and the hedge trace are fitted estimates. */
export function addBridgeGatePlanting(
  kit: Kit,
  { surface, leaf }: { surface: Surface; leaf: T.Material },
) {
  const core = clippedLeafMaterial(kit, 'bridgeGateClippedLeaves');
  for (let i = 1; i < D.hedge.length; i++)
    clippedHedge(
      kit,
      leaf,
      D.hedge[i - 1],
      D.hedge[i],
      surface.terrain,
      D.hedgeHeight,
      D.hedgeWidth,
      core,
    );
  const twig = kit.mat('bridgeGateShrubTwigs', '#615b43');
  D.bed.forEach(([x, z, h], i) => {
    const y = surface.terrain(x, z);
    for (let j = 0; j < 5; j++) {
      const angle = j * 2.399 + i;
      kit.beam(
        new T.Vector3(x, y, z),
        new T.Vector3(
          x + Math.sin(angle) * 0.4,
          y + h * 0.85,
          z + Math.cos(angle) * 0.4,
        ),
        0.025,
        0.025,
        twig,
      );
    }
    for (let j = 0; j < 80; j++) {
      const angle = j * 2.399 + i * 0.6,
        level = (j % 13) / 12;
      const radius =
        Math.sqrt(((j * 29 + i * 17) % 83) / 83) *
        0.65 *
        Math.sin(Math.PI * (0.13 + level * 0.74));
      const g = new T.PlaneGeometry(0.52 + 0.15 * Math.sin(j + i), 0.6);
      g.rotateX(j % 3 === 0 ? -Math.PI / 2 : Math.sin(j) * 0.6);
      g.rotateY(angle);
      g.translate(
        x + Math.sin(angle) * radius,
        y + 0.15 + level * h,
        z + Math.cos(angle) * radius,
      );
      kit.batch(g, leaf);
    }
  });
}
