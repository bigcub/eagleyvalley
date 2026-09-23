import { inPoly, nearest, outline, type Bounds, type P } from '../core/geo';
import { roadWidth } from './data';
import { WORLD_LIMITS } from './layout';
import type { Surface } from './surface';

// Movement blockers: building footprints, registered wall lines and the brook
// (except where a mapped bridge carries a road over it).
export function createCollision(
  surface: Surface,
  buildings: Bounds[],
  walls: { a: P; b: P }[],
) {
  function hitBuilding(x: number, z: number, r = 0.4) {
    return buildings.some(
      (b) =>
        x > b.minX - r &&
        x < b.maxX + r &&
        z > b.minZ - r &&
        z < b.maxZ + r &&
        (inPoly(x, z, b.p) || nearest(x, z, outline(b.p)).d < r),
    );
  }
  function canStand(x: number, z: number, r: number) {
    const L = WORLD_LIMITS;
    if (
      x < L.x0 ||
      x > L.x1 ||
      z < L.z0 ||
      z > L.z1 ||
      hitBuilding(x, z, r) ||
      nearest(x, z, walls).d < r + 0.25
    )
      return false;
    const rn = nearest(x, z, surface.riverSeg),
      rd = nearest(x, z, surface.roadSeg);
    if (rn.d < 4.2 && !(rd.s?.f.tags.bridge && rd.d < roadWidth(rd.s.f) / 2))
      return false;
    return true;
  }
  return { hitBuilding, canStand };
}
