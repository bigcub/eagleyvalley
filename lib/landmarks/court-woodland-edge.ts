import * as T from 'three';
import { densify, inPoly, nearest } from '../core/geo';
import type { Kit } from '../core/kit';
import { roadWidth, type WorldData } from '../world/data';
import { BRIDGE_PARKING, COURT_WOODLAND_EDGE as D, OSM } from '../world/layout';
import type { Surface } from '../world/surface';
import { addRoadsideShrubs } from '../vegetation/roadside-shrubs';
import { clippedHedge, clippedLeafMaterial } from './garden-fences';

/** August2022 F136 entrance view shows a broad clipped island hedge and
 * dense wooded bank above the garage range. Traces/sizes are fitted estimates.
 * Keep the court lawns, parking bays and the upper road/steps clear. */
export function addCourtEdgePlanting(
  kit: Kit,
  {
    scene,
    surface,
    data,
    leaf,
    hitBuilding,
    existingShrubs,
  }: {
    scene: T.Scene;
    surface: Surface;
    data: WorldData;
    leaf: T.Material;
    hitBuilding: (x: number, z: number, r: number) => boolean;
    existingShrubs: { x: number; z: number }[];
  },
) {
  const h = BRIDGE_PARKING.hedge;
  clippedHedge(
    kit,
    leaf,
    [h.x, h.fromZ],
    [h.x, h.toZ],
    surface.courtY,
    h.height,
    h.width,
    clippedLeafMaterial(kit, 'bridgeCourtHedge'),
  );
  const road = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const points = densify(road.points, D.spacing);
  const shrubs: { x: number; y: number; z: number; h: number }[] = [];
  points.forEach((p, i) => {
    if (p[0] < D.startX || p[0] > D.endX) return;
    const a = points[Math.max(0, i - 1)],
      b = points[Math.min(points.length - 1, i + 1)];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (const band of D.bands) {
      // Uphill side only. Canopy trees already supply the tall layer.
      const offset = band + Math.sin(i * 1.9 + band) * 0.45;
      const x = p[0] - ((b[1] - a[1]) / length) * offset,
        z = p[1] + ((b[0] - a[0]) / length) * offset;
      const near = nearest(x, z, surface.roadSeg);
      if (
        near.d < roadWidth(near.s.f) / 2 + 2.7 ||
        hitBuilding(x, z, 2.5) ||
        existingShrubs.some((s) => Math.hypot(s.x - x, s.z - z) < 2.8)
      )
        continue;
      shrubs.push({
        x,
        z,
        y: surface.terrain(x, z),
        h: 1.1 + (1 + Math.sin(i * 1.13 + band)) * 0.65,
      });
    }
  });
  // The entrance view also shows woodland reaching the lower court edge west
  // of the garages. This is the bank, not either internal lawn island.
  for (let x = 12; x < 34; x += 3.1)
    for (let z = 32; z < 52; z += 2.8) {
      if (!inPoly(x, z, D.lowerBank)) continue;
      const near = nearest(x, z, surface.roadSeg);
      if (
        near.d < roadWidth(near.s.f) / 2 + 2.7 ||
        hitBuilding(x, z, 2.5) ||
        existingShrubs.some((s) => Math.hypot(s.x - x, s.z - z) < 2.8) ||
        shrubs.some((s) => Math.hypot(s.x - x, s.z - z) < 2.8)
      )
        continue;
      shrubs.push({
        x,
        z,
        y: surface.terrain(x, z),
        h: 1.8 + (1 + Math.sin(x * 1.2 + z)) * 0.6,
      });
    }
  addRoadsideShrubs(scene, shrubs, leaf);
}
