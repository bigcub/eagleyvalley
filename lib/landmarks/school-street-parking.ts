import type { Kit } from '../core/kit';
import { drape } from '../core/mesh';
import { SCHOOL_STREET_PARKING as P } from '../world/layout';
import type { Surface } from '../world/surface';

/** Connected asphalt apron and parking south of the School House.
 * Outline estimated from aerial/Street View; hidden bay counts stay open. */
export function addSchoolStreetParking(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  kit.batch(
    drape(P.outline, (x, z) => surface.ground(x, z) + 0.026, 0.7),
    kit.m.asphalt,
  );
}
