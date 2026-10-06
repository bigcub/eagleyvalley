import * as T from 'three';
import { densify, nearest, inPoly, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { addRoadsideShrubs } from '../vegetation/roadside-shrubs';
import { EAGLEY_WAY_BANK_PLANTING as D, OSM } from '../world/layout';
import type { WorldData } from '../world/data';
import type { Surface } from '../world/surface';

/** June2024 EAG-033 shows climbing ivy and loose bank undergrowth.
 * The mapped road locates this bounded stretch; specimens/coverage are fitted.
 * Existing solid wall and its collision stay in boundaries.ts. */
export function addEagleyWayBankPlanting(
  kit: Kit,
  {
    scene,
    surface,
    data,
    leaf,
    hitBuilding,
  }: {
    scene: T.Scene;
    surface: Surface;
    data: WorldData;
    leaf: T.Material;
    hitBuilding: (x: number, z: number, r: number) => boolean;
  },
) {
  const road = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const path = densify(road.points, D.spacing);
  const brow = surface.roadSeg
    .filter((s) => s.f.id === OSM.eagleyBrow)
    .slice(0, 1);
  const shrubs: { x: number; z: number; y: number; h: number }[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i];
    if (p[0] < D.startX || p[0] > D.endX) continue;
    const a = path[i - 1],
      b = path[i + 1];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / length,
      nz = (b[0] - a[0]) / length;
    const at = (offset: number): P => [p[0] + nx * offset, p[1] + nz * offset];
    for (const [band, offset] of D.bands.entries()) {
      const [x, z] = at(
        D.wallOffset + offset + Math.sin(i * 2.1 + band) * 0.15,
      );
      if (
        nearest(x, z, brow).d < 4 ||
        hitBuilding(x, z, 2) ||
        surface.inPassage(x, z) ||
        inPoly(x, z, surface.court)
      )
        continue;
      shrubs.push({
        x,
        z,
        y: surface.terrain(x, z),
        h: 1.3 + band * 0.65 + 0.25 * Math.sin(i * 1.7),
      });
    }
    // Small overlapping cards follow the road-facing wall, leaving its base
    // and intermittent masonry exposed. No ivy lies on the carriageway.
    const [x, z] = at(D.wallOffset - 0.32);
    const y = surface.roadY(...p) - 0.18;
    for (let j = 0; j < 24; j++) {
      const level = (j % 8) / 7;
      const across =
        (Math.floor(j / 8) - 1) * 0.31 + Math.sin(i + j * 2.1) * 0.08;
      const g = new T.PlaneGeometry(0.39, 0.34);
      g.rotateZ(Math.sin(i + j) * 0.2);
      g.rotateY(Math.atan2(-nx, -nz));
      g.translate(
        x + nz * across,
        y + 0.22 + level * (D.wallHeight - 0.08) + Math.sin(i * 1.3) * 0.07,
        z - nx * across,
      );
      kit.batch(g, leaf);
    }
  }
  // Separate instancing preserves the random sequence of older roadside plants.
  addRoadsideShrubs(scene, shrubs, leaf);
}
