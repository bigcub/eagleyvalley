import { addCourtEdgePlanting } from '../landmarks/court-woodland-edge';
import { addBridgeGatePlanting } from '../landmarks/bridge-gate-planting';
import {
  woodedBankPlan,
  addHoughBankPlanting,
} from '../landmarks/hough-wooded-banks';
import { inBridgeParkingIsland } from '../landmarks/bridge-parking';
import {
  BROOK_WATER_WIDTH,
  SCHOOL_STREET_PARKING,
  BROOK_EAST_PARKING,
} from './layout';
import {
  addBlackburnEntranceHedge,
  inBlackburnEntrance,
} from '../landmarks/blackburn-entrance';
import * as T from 'three';
import { inPoly, nearest } from '../core/geo';
import type { Kit } from '../core/kit';
import { addTrees } from '../vegetation/realistic-trees';
import { addWoodlandFerns } from '../vegetation/woodland-ferns';
import { addBrookFrontageShrubs } from '../vegetation/brook-frontage-shrubs';
import { addRoadsideShrubs } from '../vegetation/roadside-shrubs';
import { brookParking } from '../landmarks/brook-mill-grounds';
import { addBrookParkingPlanting } from '../landmarks/brook-parking-planting';
import { addBridgeGardens } from '../landmarks/bridge-gardens';
import { addBridgeGardenHedges } from '../landmarks/bridge-garden-fences';
import { addCourtGardenPlanting } from '../landmarks/court-gardens';
import { inTurningCircle } from '../landmarks/turning-circle';
import { addTurningCirclePlanting } from '../landmarks/turning-circle-details';
import { passageWallZ } from '../landmarks/bridge-passage';
import { roadWidth, type WorldData } from './data';
import { BRIDGE_ROAD_WALL } from './layout';
import type { PlantingHints } from './boundaries';
import type { Surface } from './surface';

// Trees come from canopy peaks in the survey (inferred, not surveyed trunks).
// Hedges, ivy and shrubs are placed from boundary hints and user photos.
export function addVegetation(
  scene: T.Scene,
  kit: Kit,
  surface: Surface,
  data: WorldData,
  plants: PlantingHints,
  hitBuilding: (x: number, z: number, r: number) => boolean,
) {
  const { batch } = kit;
  const { terrain, roadSeg, court, inPassage, passageY } = surface;
  const trees = data.survey.trees
    .map(([x, z, h]) => ({ x, z, h }))
    .filter((t) => {
      const rd = nearest(t.x, t.z, roadSeg);
      return (
        // Canopy peaks are not surveyed trunks. Keep a small trunk clearance
        // outside the rendered water, rather than inventing a bank position.
        nearest(t.x, t.z, surface.riverSeg).d > BROOK_WATER_WIDTH / 2 + 0.4 &&
        !inBlackburnEntrance(t.x, t.z, surface.blackburnEntrancePlan) &&
        rd.d > roadWidth(rd.s.f) / 2 + 1.5 &&
        !hitBuilding(t.x, t.z, 3) &&
        !inPoly(t.x, t.z, court) &&
        !inPoly(t.x, t.z, brookParking) &&
        !inPoly(t.x, t.z, SCHOOL_STREET_PARKING.outline) &&
        !inPoly(t.x, t.z, BROOK_EAST_PARKING.outline) &&
        (!inTurningCircle(t.x, t.z, surface.turningCirclePlan) ||
          inPoly(t.x, t.z, surface.turningCirclePlan.grass))
      );
    });
  const bank = woodedBankPlan(surface, data, hitBuilding);
  // Canopy peaks already represented nearby take precedence over fitted trunks.
  for (const t of bank.trees)
    if (!trees.some((other) => Math.hypot(other.x - t.x, other.z - t.z) < 4))
      trees.push(t);
  const leaf = addTrees(
    scene,
    trees.filter((t) => !inPassage(t.x, t.z)),
    (x, z) =>
      inBridgeParkingIsland(x, z)
        ? surface.courtY(x, z) + 0.025
        : terrain(x, z),
    (t) => inPoly(t.x, t.z, surface.turningCirclePlan.island),
  );
  addHoughBankPlanting(kit, {
    scene,
    surface,
    data,
    leaf,
    shrubs: bank.shrubs,
  });
  addCourtEdgePlanting(kit, {
    scene,
    surface,
    data,
    leaf,
    hitBuilding,
    existingShrubs: plants.shrubs,
  });
  addTurningCirclePlanting(kit, { scene, surface, leaf });
  addBlackburnEntranceHedge(kit, { surface, leaf });

  // Small overlapping foliage cards form hanging ivy on the retaining wall face.
  for (const [i, p] of plants.ivy.entries())
    for (let k = 0; k < 12; k++) {
      const level = k / 11,
        drop = 0.65 + 0.3 * Math.sin(i * 1.71),
        g = new T.PlaneGeometry(0.42, 0.36);
      g.rotateZ(Math.sin(i * 3 + k) * 0.32);
      g.rotateY(p.heading);
      const across = Math.sin(i * 7 + k * 3) * 0.14;
      g.translate(
        p.x + Math.cos(p.heading) * across,
        p.y + p.h + 0.12 - level * p.h * drop,
        p.z - Math.sin(p.heading) * across,
      );
      batch(g, leaf);
    }

  // Dense hedge on the landward side of the riverside path (user's path photo).
  // Behind the modern block UP-003 shows open shared lawn instead.
  const riverside = surface.riversideSeg;
  for (let x = 29; x < 38; x += 0.65) {
    const n = nearest(x, -9, riverside),
      z = n.z + 2.65,
      y = terrain(x, z);
    for (let k = 0; k < 32; k++) {
      const a = k * 2.399 + x,
        r = 0.45 + 0.25 * Math.sin(k * 13.1 + x),
        g = new T.PlaneGeometry(0.45, 0.55);
      g.rotateY(a);
      g.rotateX(Math.sin(k) * 0.5);
      g.translate(
        x + Math.cos(a) * r,
        y + 0.25 + (k % 8) * 0.22,
        z + Math.sin(a) * r,
      );
      batch(g, leaf);
    }
  }

  addWoodlandFerns(scene, plants.ferns);
  addRoadsideShrubs(scene, plants.shrubs, leaf);
  addBrookParkingPlanting(kit, { scene, surface });
  addBrookFrontageShrubs(kit, { scene, surface });
  addBridgeGardens(kit, { leaf, terrain, passageY });
  addBridgeGardenHedges(kit, { surface, leaf });
  addBridgeGatePlanting(kit, { surface, leaf });
  addCourtGardenPlanting(kit, { surface, leaf });
  // Ivy tufts along the top of the passage retaining wall.
  for (let x = 75; x < 109; x += 1.25) {
    if (Math.sin(x * 2.3) < -0.35) continue;
    const ivy = new T.PlaneGeometry(0.85, 0.65);
    ivy.rotateZ(Math.sin(x) * 0.12);
    ivy.translate(
      x,
      passageY + surface.passageWallHeight(x) - 0.65,
      passageWallZ(x) - 0.32,
    );
    batch(ivy, leaf);
  }
}

/** Street lights along Eagley Way and Threadfold Way, every ~34m of centreline. */
export function addStreetLights(kit: Kit, surface: Surface, data: WorldData) {
  const { dark, trim } = kit.m;
  for (const f of data.roads.filter((f) =>
    ['Eagley Way', 'Threadfold Way'].includes(f.name),
  )) {
    let d = 0;
    for (let i = 1; i < f.points.length; i++) {
      const a = f.points[i - 1],
        b = f.points[i];
      d += Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d < 34) continue;
      d = 0;
      const th = Math.atan2(b[0] - a[0], b[1] - a[1]),
        x = b[0] + Math.cos(th) * 5,
        z = b[1] - Math.sin(th) * 5,
        y = surface.ground(x, z);
      // M05 places the lamp beside the coping drop on the road-side datum.
      if (
        f.name === 'Eagley Way' &&
        Math.abs(x - BRIDGE_ROAD_WALL.lamp.point[0]) < 2
      )
        continue;
      kit.box(x, y + 3.5, z, 0.1, 7, 0.1, dark);
      kit.box(x, y + 7, z, 0.7, 0.13, 0.3, trim, th);
    }
  }
}
