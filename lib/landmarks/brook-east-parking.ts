import type { Kit } from '../core/kit';
import { drape } from '../core/mesh';
import { BROOK_EAST_PARKING as P } from '../world/layout';
import type { Surface } from '../world/surface';

/** Asphalt court and open entrance; concealed markings remain unmodelled. */
export function addBrookEastParking(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  kit.batch(
    drape(P.outline, (x, z) => surface.ground(x, z) + 0.026, 0.5),
    kit.m.asphalt,
  );
}
