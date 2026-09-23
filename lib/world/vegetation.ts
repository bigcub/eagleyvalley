import * as T from 'three';
import { densify, inPoly, nearest } from '../core/geo';
import type { Kit } from '../core/kit';
import { addTrees } from '../vegetation/realistic-trees';
import { addWoodlandFerns } from '../vegetation/woodland-ferns';
import { addRoadsideShrubs } from '../vegetation/roadside-shrubs';
import { addBrookHedges, brookParking } from '../landmarks/brook-mill-grounds';
import { addBridgeGardens } from '../landmarks/bridge-gardens';
import { passageWallZ } from '../landmarks/bridge-passage';
import { roadWidth, type WorldData } from './data';
import { OSM } from './layout';
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
        rd.d > roadWidth(rd.s.f) / 2 + 1.5 &&
        !hitBuilding(t.x, t.z, 3) &&
        !inPoly(t.x, t.z, court) &&
        !inPoly(t.x, t.z, brookParking)
      );
    });
  const leaf = addTrees(
    scene,
    trees.filter((t) => !inPassage(t.x, t.z)),
    terrain,
  );

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
  const riverside = surface.riversideSeg;
  for (let x = 29; x < 66; x += 0.65) {
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

  // Bus turning island: clipped hedge inside the mapped loop, per 2022/2024 views.
  const turning = data.roads.find((f) => f.id === OSM.busTurningLoop);
  if (turning) {
    const path = densify(turning.points, 1.6);
    const vehicleSeg = roadSeg.filter((s) => roadWidth(s.f) > 2);
    for (let i = 1; i < path.length - 1; i++) {
      const a = path[i - 1],
        b = path[i + 1],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz) || 1;
      const x = path[i][0] - (dz / len) * 5.1,
        z = path[i][1] + (dx / len) * 5.1;
      if (x < 128 || nearest(x, z, vehicleSeg).d < 4.2) continue;
      plants.shrubs.push({
        x,
        z,
        y: terrain(x, z),
        h: 0.85 + 0.08 * Math.sin(i * 2.1),
      });
    }
  }
  addWoodlandFerns(scene, plants.ferns);
  addRoadsideShrubs(scene, plants.shrubs, leaf);
  addBrookHedges(scene, leaf, surface.brookParkingY);
  addBridgeGardens({
    box: kit.box,
    batch,
    leaf,
    stone: kit.m.stone,
    dark: kit.m.dark,
    terrain,
    passageY,
  });
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
      kit.box(x, y + 3.5, z, 0.1, 7, 0.1, dark);
      kit.box(x, y + 7, z, 0.7, 0.13, 0.3, trim, th);
    }
  }
}
