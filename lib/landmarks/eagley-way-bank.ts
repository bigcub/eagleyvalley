import * as T from 'three';
import { densify, nearest, inPoly, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { addRoadsideShrubs } from '../vegetation/roadside-shrubs';
import {
  EAGLEY_HOUGH_BEND,
  EAGLEY_WAY_BANK_PLANTING as D,
  LOWER_EAGLEY,
  OSM,
  WOODLAND_STEPS,
} from '../world/layout';
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
    ferns,
  }: {
    scene: T.Scene;
    surface: Surface;
    data: WorldData;
    leaf: T.Material;
    hitBuilding: (x: number, z: number, r: number) => boolean;
    ferns: { x: number; y: number; z: number; h: number }[];
  },
) {
  const road = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const path = densify(road.points, D.spacing);
  const brow = surface.roadSeg
    .filter((s) => s.f.id === OSM.eagleyBrow)
    .slice(0, 1);
  const shrubs: {
    x: number;
    z: number;
    y: number;
    h: number;
    flowering?: boolean;
  }[] = [];
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
  }
  // Separate instancing preserves the random sequence of older roadside plants.
  addRoadsideShrubs(scene, shrubs, leaf);
  const lower: typeof shrubs = [];
  addLowerBank({ surface, data, hitBuilding, ferns, shrubs: lower });
  // The lower bank already sits in tree shade; skipping its shadow pass keeps
  // the dense scrub from adding a second full leaf render.
  addRoadsideShrubs(scene, lower, leaf, false);
  addRoadsideShrubs(
    scene,
    upperBankShrubs(surface, data, hitBuilding),
    leaf,
    false,
  );
  addUphillIvy(kit, { scene, surface, data });
  addRoadsideShrubs(
    scene,
    valleyBank(surface, data, hitBuilding, ferns),
    leaf,
    false,
  );
}

/** Valley-side woodland floor from the fence down to the measured canopy
 * edge. Existing roadside shrubs and flowering groups in boundaries.ts stay. */
function valleyBank(
  surface: Surface,
  data: WorldData,
  hitBuilding: (x: number, z: number, r: number) => boolean,
  ferns: { x: number; y: number; z: number; h: number }[],
) {
  const V = D.valleyBank;
  const road = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const path = densify(road.points, V.spacing);
  const otherRoads = surface.roadSeg.filter((s) => s.f.id !== OSM.eagleyWay);
  const blocked = (x: number, z: number) =>
    nearest(x, z, otherRoads).d < 3.5 ||
    nearest(x, z, surface.riverSeg).d < 4 ||
    hitBuilding(x, z, 4);
  const out: { x: number; z: number; y: number; h: number }[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i];
    if (p[0] < V.startX || p[0] > V.endX) continue;
    const a = path[i - 1],
      b = path[i + 1];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Valley side is the negative road normal.
    const nx = (b[1] - a[1]) / length,
      nz = -(b[0] - a[0]) / length;
    const at = (d: number): P => [p[0] + nx * d, p[1] + nz * d];
    // Ferns under the fence, with gaps.
    if (Math.sin(i * 1.7) > -0.5) {
      const [x, z] = at(V.fernOffset + Math.sin(i * 2.3) * 0.25);
      if (!blocked(x, z))
        ferns.push({
          x,
          z,
          y: surface.terrain(x, z),
          h: 0.45 + 0.2 * (1 + Math.sin(i * 3.1)),
        });
    }
    const depth = Math.min(V.maxDepth, tableAt(V.canopyDepth, p[0]));
    // Near scrub band right behind the fence on alternate stations.
    if (i % 2 === 0) {
      const [x, z] = at(V.near + Math.sin(i * 1.9) * 0.4);
      if (!blocked(x, z))
        out.push({
          x,
          z,
          y: surface.terrain(x, z),
          h: 2.2 + 0.5 * Math.sin(i * 1.1),
        });
    }
    for (
      let d = V.deepStart, band = 0;
      d < depth - 1;
      d += V.deepStep, band++
    ) {
      if ((i + band) % 3) continue;
      const [x, z] = at(d + Math.sin(i * 2.9 + band) * 0.9);
      if (blocked(x, z)) continue;
      out.push({
        x,
        z,
        y: surface.terrain(x, z),
        h: 1.7 + 0.5 * Math.sin(i * 1.3 + band * 2.1) + 0.4 * ((band + i) % 2),
      });
    }
  }
  return out;
}

function tableAt(t: [number, number][], x: number) {
  if (x <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++)
    if (x <= t[i][0]) {
      const f = (x - t[i - 1][0]) / (t[i][0] - t[i - 1][0]);
      return t[i - 1][1] + f * (t[i][1] - t[i - 1][1]);
    }
  return t[t.length - 1][1];
}

/** EAG-033..036 June2024 reverse views: ivy and spilling foliage bury the
 * uphill wall face down to the gutter; EAG-036 side view and EAG-038/041
 * show more exposed stone and patchy ivy further down. Small instanced leaves
 * form a bulging mat in front of the face and over the coping. Coverage
 * pattern and thickness are fitted, not surveyed. */
function addUphillIvy(
  kit: Kit,
  {
    scene,
    surface,
    data,
  }: { scene: T.Scene; surface: Surface; data: WorldData },
) {
  const I = D.ivy;
  let seed = 2207;
  const rand = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
  const road = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const path = densify(road.points, 0.25);
  const steps = surface.roadSeg.filter((s) => s.f.id === OSM.millWoodlandSteps);
  type Run = { p: P; n: P; y: number; h: number; face: number; cover: number };
  const runs: Run[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i];
    const stretch = I.stretches.find((r) => p[0] >= r.x0 && p[0] < r.x1);
    if (!stretch) continue;
    const a = path[i - 1],
      b = path[i + 1];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n: P = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
    const low = p[0] >= LOWER_EAGLEY.uphillLowWallStart;
    const offset = low ? LOWER_EAGLEY.uphillLowWallOffset : D.wallOffset;
    const face = offset - 0.275;
    if (nearest(p[0] + n[0] * face, p[1] + n[1] * face, steps).d < 1.2)
      continue;
    runs.push({
      p,
      n,
      y: surface.roadY(...p) - (low ? 0.16 : 0.18),
      h: low ? LOWER_EAGLEY.uphillLowWallHeight : D.wallHeight + 0.11,
      face,
      cover: stretch.cover,
    });
  }
  // Leaf count follows covered face area so density is even along the wall.
  const counts = runs.map((r) =>
    Math.round(0.25 * (r.h + I.overTop) * I.leavesPerM2),
  );
  const total = counts.reduce((s, c) => s + c, 0);
  const shape = new T.Shape();
  shape.absellipse(0, 0, 0.055, 0.045, 0, Math.PI * 2, false, 0);
  const mat = kit.mat('eagleyWayIvy', '#55703a');
  mat.side = T.DoubleSide;
  const leaves = new T.InstancedMesh(new T.ShapeGeometry(shape, 3), mat, total);
  const o = new T.Object3D();
  let index = 0;
  runs.forEach((r, i) => {
    for (let k = 0; k < counts[i]; k++) {
      // Curtains: a coverage mask leaves bare stone between mats.
      const along = (rand() - 0.5) * 0.25,
        level = rand() * (r.h + I.overTop);
      const u = r.p[0] + along;
      const mask =
        0.5 +
        0.5 *
          Math.sin(u * 0.83 + Math.sin(u * 0.21) * 3) *
          Math.cos(level * 1.3 - u * 0.17);
      if (mask > r.cover) {
        rand();
        continue;
      }
      const over = level > r.h;
      // Bulge thickest at mid height; over the top the mat lies on the coping.
      const bulge = over
        ? -rand() * 0.45
        : I.thickness * Math.sin((level / r.h) * Math.PI * 0.9 + 0.2) * rand();
      const d = r.face - 0.02 - bulge;
      const x = r.p[0] + r.n[0] * d + r.n[1] * along,
        z = r.p[1] + r.n[1] * d - r.n[0] * along;
      const y = r.y + (over ? r.h + (level - r.h) * 0.6 : level);
      o.position.set(x, y, z);
      o.rotation.set(
        (rand() - 0.5) * 1.6,
        Math.atan2(-r.n[0], -r.n[1]) + (rand() - 0.5) * 1.4,
        rand() * Math.PI * 2,
      );
      o.scale.setScalar(0.8 + rand() * 0.6);
      o.updateMatrix();
      leaves.setMatrixAt(index, o.matrix);
      leaves.setColorAt(
        index++,
        new T.Color().setHSL(
          0.24 + rand() * 0.04,
          0.32 + rand() * 0.14,
          0.36 + rand() * 0.22,
        ),
      );
    }
  });
  leaves.count = index;
  leaves.receiveShadow = true;
  scene.add(leaves);
}

/** Woodland layers up the bank behind the upper retaining panels. The
 * existing roadside fringe and ferns in boundaries.ts stay unchanged. */
function upperBankShrubs(
  surface: Surface,
  data: WorldData,
  hitBuilding: (x: number, z: number, r: number) => boolean,
) {
  const U = D.upperBank;
  const road = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const path = densify(road.points, U.spacing);
  const brow = surface.roadSeg.filter((s) => s.f.id === OSM.eagleyBrow);
  const otherRoads = surface.roadSeg.filter((s) => s.f.id !== OSM.eagleyWay);
  const out: {
    x: number;
    z: number;
    y: number;
    h: number;
    flowering?: boolean;
  }[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i];
    if (p[0] < U.startX || p[0] > U.endX) continue;
    const a = path[i - 1],
      b = path[i + 1];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / length,
      nz = (b[0] - a[0]) / length;
    for (const [band, offset] of U.bands.entries()) {
      if ((i + band) % 2) continue;
      const d = D.wallOffset + offset + Math.sin(i * 1.7 + band) * 0.4;
      const x = p[0] + nx * d,
        z = p[1] + nz * d;
      if (
        nearest(x, z, brow).d < 4 ||
        nearest(x, z, otherRoads).d < 3.5 ||
        hitBuilding(x, z, 2.5)
      )
        continue;
      out.push({
        x,
        z,
        y: surface.terrain(x, z),
        h: 1.9 + band * 0.45 + 0.4 * Math.sin(i * 2.1 + band),
        flowering: band === 0 && p[0] > U.flowering[0] && p[0] < U.flowering[1],
      });
    }
    // Sparser woodland-floor understorey under the measured canopy, up to
    // the garden edge. No shadow pass.
    const depth = canopyDepthAt(p[0]);
    for (
      let d = U.deepStart, band = 0;
      d < depth - 1;
      d += U.deepStep, band++
    ) {
      if ((i + band) % 3) continue;
      const r = d + Math.sin(i * 2.9 + band) * 0.9;
      const x = p[0] + nx * r,
        z = p[1] + nz * r;
      if (
        nearest(x, z, brow).d < 4 ||
        nearest(x, z, otherRoads).d < 3.5 ||
        hitBuilding(x, z, 4)
      )
        continue;
      out.push({
        x,
        z,
        y: surface.terrain(x, z),
        h: 1.5 + 0.5 * Math.sin(i * 1.3 + band * 2.1) + 0.4 * ((band + i) % 2),
      });
    }
  }
  return out;
}

function canopyDepthAt(x: number) {
  return tableAt(D.upperBank.canopyDepth, x);
}

type Station = { i: number; c: P; n: P; y: number; h: number; tall: boolean };

/** Wall stations from the woodland steps to the low wall's end at the Hough
 * bend: centre line, uphill normal, base level and height of the built wall. */
function lowerWallStations(surface: Surface, data: WorldData): Station[] {
  const road = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const path = densify(road.points, D.spacing);
  const out: Station[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i];
    const tall = p[0] >= D.rhododendron.startX && p[0] < D.rhododendron.endX;
    const low = p[0] >= D.lowBank.startX && p[0] < EAGLEY_HOUGH_BEND.startX;
    if (!tall && !low) continue;
    const a = path[i - 1],
      b = path[i + 1];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n: P = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
    const offset = tall ? D.wallOffset : LOWER_EAGLEY.uphillLowWallOffset;
    out.push({
      i,
      c: [p[0] + n[0] * offset, p[1] + n[1] * offset],
      n,
      y: surface.roadY(...p) - (tall ? 0.18 : 0.16),
      h: tall ? D.wallHeight : LOWER_EAGLEY.uphillLowWallHeight,
      tall,
    });
  }
  // The bend wall shares the pavement plan; follow its swept centre line.
  const plan = surface.eagleyHoughBendPlan;
  const half = EAGLEY_HOUGH_BEND.wallThickness / 2;
  let last: P | undefined;
  plan.kerb.forEach((k, j) => {
    if (k[0] > EAGLEY_HOUGH_BEND.wallEndX - 0.4) return;
    const n = plan.outs[j];
    const c: P = [
      plan.outer[j][0] + n[0] * half,
      plan.outer[j][1] + n[1] * half,
    ];
    if (last && Math.hypot(c[0] - last[0], c[1] - last[1]) < D.spacing) return;
    last = c;
    out.push({
      i: 200 + j,
      c,
      n,
      y: surface.eagleyHoughBendY(...c) - 0.16,
      h: EAGLEY_HOUGH_BEND.wallHeight,
      tall: false,
    });
  });
  return out;
}

function addLowerBank({
  surface,
  data,
  hitBuilding,
  ferns,
  shrubs,
}: {
  surface: Surface;
  data: WorldData;
  hitBuilding: (x: number, z: number, r: number) => boolean;
  ferns: { x: number; y: number; z: number; h: number }[];
  shrubs: {
    x: number;
    z: number;
    y: number;
    h: number;
    flowering?: boolean;
  }[];
}) {
  const steps = surface.roadSeg.filter((s) => s.f.id === OSM.millWoodlandSteps);
  const flight = [{ a: WOODLAND_STEPS.bottom, b: WOODLAND_STEPS.top }];
  const otherRoads = surface.roadSeg.filter(
    (s) => s.f.id !== OSM.eagleyWay && s.f.id !== OSM.millWoodlandSteps,
  );
  const open = (x: number, z: number, r: number) =>
    nearest(x, z, steps).d < D.stepsClearance + r ||
    nearest(x, z, flight).d < D.stepsClearance + r ||
    nearest(x, z, otherRoads).d < 4 + r ||
    hitBuilding(x, z, 2) ||
    surface.inPassage(x, z) ||
    inPoly(x, z, surface.court);
  for (const s of lowerWallStations(surface, data)) {
    const { i, c, n, y, h, tall } = s;
    const at = (d: number): P => [c[0] + n[0] * d, c[1] + n[1] * d];
    const top = y + h + (tall ? 0.11 : 0);
    // Shrub bands: rhododendron before the steps, broadleaf scrub after.
    const bands = tall ? D.rhododendron.bands : D.lowBank.bands;
    for (const [band, offset] of bands.entries()) {
      // Crowns are ~3.8m wide; staggering the scrub bands keeps the layered
      // bank closed with half the leaf cards.
      if (!tall && (i + band) % 2) continue;
      const [x, z] = at(offset + Math.sin(i * 2.3 + band) * 0.2);
      if (open(x, z, 0.4)) continue;
      shrubs.push({
        x,
        z,
        y: Math.max(surface.terrain(x, z), top - 0.4),
        h: tall
          ? 2.6 + band * 0.6 + 0.35 * Math.sin(i * 1.9)
          : 1.7 + band * 0.6 + 0.35 * Math.sin(i * 1.3 + band),
        flowering: tall && (band === 0 || i % 3 !== 0),
      });
    }
    // Fern clumps along the wall top; tall wall only near the steps (EAG-036/037).
    if (!tall || c[0] > 44)
      for (let k = 0; k < (tall ? 1 : 2); k++) {
        if (Math.sin(i * 1.3 + k * 2.1) < -0.6) continue;
        const [x, z] = at(0.1 + k * 0.5 + Math.sin(i + k) * 0.1);
        if (open(x, z, 0)) continue;
        ferns.push({
          x,
          z,
          y: Math.max(surface.terrain(x, z), top),
          h: 0.5 + 0.18 * (1 + Math.sin(i * 2.7 + k)),
        });
      }
  }
}
