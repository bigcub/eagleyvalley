import * as T from 'three';
import type { Kit } from '../core/kit';
import { drape, strip } from '../core/mesh';
import { HOUGH_BRIDGE_SOUTH as H } from '../world/layout';
import type { Surface } from '../world/surface';

/** Flush tarmac apron between the road and the footbridge, with a short
 * earth edge where the grass bank falls away. Outline estimated. */
export function addHoughBridgeSouthApron(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const y = (x: number, z: number) => surface.ground(x, z) + 0.03;
  kit.batch(drape(H.apron, y, 0.5), kit.m.asphalt);
  const edgeMaterial = kit.mat('houghApronEdge', '#4d4a3c');
  edgeMaterial.side = T.DoubleSide;
  const edge = H.apronBank.map((i) => H.apron[i]);
  kit.batch(
    strip(
      edge,
      edge,
      edge.map((p) => [
        y(...p),
        Math.min(y(...p), surface.terrain(...p)) - 0.1,
      ]),
    ),
    edgeMaterial,
  );
}
