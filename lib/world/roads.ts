import { addBridgeParking } from '../landmarks/bridge-parking';
import {
  addBlackburnEntrance,
  blackburnLocal,
} from '../landmarks/blackburn-entrance';
import * as T from 'three';
import { densify, nearest, segments, type Feature, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { gravelTexture } from '../materials/gravel-texture';
import { addBrookParking } from '../landmarks/brook-mill-grounds';
import { addEagleyBrowSurface } from '../landmarks/eagley-brow';
import { addEagleyHoughBend } from '../landmarks/eagley-hough-bend';
import { addTurningCircle } from '../landmarks/turning-circle';
import {
  HOUGH_CENTRE,
  HOUGH_RADIUS,
  inHoughCarriageway,
} from '../landmarks/hough-junction';
import { roadWidth, type WorldData } from './data';
import { EAGLEY_HOUGH_BEND, LOWER_EAGLEY, OSM } from './layout';
import type { Surface } from './surface';

const { lerp } = T.MathUtils;

// Carriageways, footways, kerbs, markings and parking surfaces, generated from
// OSM centrelines. Widths are inferred; see roadWidth().
export function addRoads(kit: Kit, surface: Surface, data: WorldData) {
  const { ribbon, box, mat, m } = kit;
  const { roadY, roadSeg, gateApproach } = surface;
  const { asphalt, blockPaving, paving, kerb, paint } = m;
  const gravel = mat('riversideGravel', '#aaa99a');
  gravel.map = gravelTexture();
  gravel.bumpMap = gravel.map;
  gravel.bumpScale = 0.025;

  // Trim pavement/marking segments wherever another mapped carriageway joins them.
  function roadEdge(
    points: P[],
    w: number,
    material: T.Material,
    yfn: (x: number, z: number) => number,
    offset: number,
    f: Feature,
  ) {
    const others = roadSeg.filter((s) => s.f.id !== f.id && roadWidth(s.f) > 2);
    ribbon(points, w, material, yfn, offset, (a, b) => {
      const dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz) || 1;
      const x = (a[0] + b[0]) / 2 - (dz / len) * offset,
        z = (a[1] + b[1]) / 2 + (dx / len) * offset;
      const [eu, ev] = blackburnLocal(x, z);
      if (
        eu > -14 &&
        eu < 16 &&
        Math.abs(ev) < 14.2 &&
        (f.name === 'Blackburn Road' || f.id === OSM.eagleyWay)
      ) {
        if (f.id === OSM.eagleyWay || (offset !== 0 && eu > 0)) return false;
      }
      // M01 draws the connected outer kerb up to this loop's west node.
      if (f.id === OSM.busTurningLoop && offset < 0 && x < 126.8 && z > 26)
        return false;
      // The Hough junction draws its own kerbs and pavements.
      if (
        (material === paving || material === kerb) &&
        Math.hypot(x - HOUGH_CENTRE[0], z - HOUGH_CENTRE[1]) < HOUGH_RADIUS
      )
        return false;
      const n = nearest(
        x,
        z,
        others.filter((s) => {
          const ox = s.b[0] - s.a[0],
            oz = s.b[1] - s.a[1];
          return (
            Math.abs((dx * ox + dz * oz) / (len * (Math.hypot(ox, oz) || 1))) <
            0.96
          );
        }),
      );
      return !n.s || n.d >= roadWidth(n.s.f) / 2 + w / 2 + 0.15;
    });
  }

  /** Hough Lane narrows from 6.4m to the 3.8m bridge over the last 6m. */
  function taperedWidth(f: Feature) {
    const end =
      f.id === OSM.houghLaneSouth ? f.points[f.points.length - 1] : f.points[0];
    const run = Math.min(
      6,
      Math.hypot(
        f.points[0][0] - f.points[f.points.length - 1][0],
        f.points[0][1] - f.points[f.points.length - 1][1],
      ),
    );
    return (x: number, z: number) =>
      lerp(3.8, 6.4, Math.min(1, Math.hypot(x - end[0], z - end[1]) / run));
  }

  function surfaceMaterial(f: Feature, foot: boolean) {
    if (foot) return f.id === OSM.riversidePath ? gravel : paving;
    return f.id === OSM.schoolStreetFront ||
      (f.name === 'Threadfold Way' && f.id !== OSM.threadfoldWayLoop)
      ? blockPaving
      : asphalt;
  }

  for (const f of data.roads) {
    if (
      f.id === OSM.brookParkingAccess ||
      OSM.brookParkingAisles.includes(f.id)
    )
      continue;
    if (f.id === OSM.millWoodlandSteps) continue;
    if (f.id === OSM.busTurningLoop) continue; // M02 draws one connected loop.
    if (f.id === OSM.eagleyBrow) continue; // Dedicated woodland entrance below.
    if ([OSM.houghOldLane, OSM.houghJunctionFootway].includes(f.id)) continue;
    const w = roadWidth(f),
      foot = w < 2,
      p = densify(f.points, foot || f.id === OSM.threadfoldWayLoop ? 0.35 : 3);
    const own = segments([f]);
    // The footbridge deck follows the walking surface, which eases it onto
    // the junction island at its north end.
    const yfn =
      f.id === OSM.houghFootbridge
        ? surface.ground
        : (x: number, z: number) =>
            f.id === OSM.riversidePath && x > 110 && z > 8
              ? surface.ground(x, z)
              : roadY(x, z, nearest(x, z, own));

    // EAG-032..040: the valley pavement ends before the mill; the uphill
    // pavement starts at the woodland steps and continues beside the low bank.
    if (!foot && f.id !== OSM.houghRoadBridge) {
      for (const side of [-1, 1]) {
        if (f.id === OSM.houghMillApproach && side === 1) continue;
        if (f.id === OSM.houghTurningApproach && side === 1) continue;
        if (f.tags.highway === 'service' && f.id !== OSM.busTurningLoop)
          continue;
        const walkPoints =
          f.name === 'Eagley Way'
            ? p.filter((q) =>
                side === -1
                  ? q[0] < LOWER_EAGLEY.valleyBarrierEnd
                  : q[0] >= LOWER_EAGLEY.uphillPavementStart &&
                    q[0] <= EAGLEY_HOUGH_BEND.startX,
              )
            : p;
        if (walkPoints.length < 2) continue;
        // The mill-side edge of the Hough approach is the M05 road wall's
        // corner return; a pavement there lay behind it, over the passage.
        const millSide = f.id === OSM.houghMillApproach && side === -1;
        if (f.id !== OSM.busTurningLoop && !millSide)
          roadEdge(
            walkPoints,
            1.1,
            paving,
            (x, z) => yfn(x, z) + 0.07,
            side * (w / 2 + 0.7),
            f,
          );
        roadEdge(
          walkPoints,
          0.16,
          kerb,
          (x, z) => yfn(x, z) + 0.08,
          side * (w / 2 + 0.08),
          f,
        );
      }
    }

    ribbon(
      p,
      f.id === OSM.houghLaneSouth || f.id === OSM.houghLaneNorth
        ? taperedWidth(f)
        : w,
      surfaceMaterial(f, foot),
      yfn,
      0,
      foot
        ? (a, b) => {
            // OSM paths meet road centrelines; their paving must stop at the carriageway edge.
            const mx = (a[0] + b[0]) / 2,
              mz = (a[1] + b[1]) / 2;
            if (f.id === OSM.houghFootbridge) return true;
            if (
              f.id === OSM.riversidePath &&
              (gateApproach(mx, mz) !== undefined || (mx > 110 && mz > 15.42))
            )
              return false;
            const n = nearest(
              mx,
              mz,
              roadSeg.filter((s) => roadWidth(s.f) > 2),
            );
            return !n.s || n.d > roadWidth(n.s.f) / 2 + 0.12;
          }
        : (a, b) =>
            // The Hough junction surface replaces road strips wholly inside it.
            !(inHoughCarriageway(...a) && inHoughCarriageway(...b)),
    );

    // Dashed centre line.
    if (f.tags.highway === 'trunk' || f.name === 'Eagley Way') {
      let walked = 0;
      for (let i = 1; i < p.length; i++) {
        walked += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        if (walked % 10 < 3)
          roadEdge(
            [p[i - 1], p[i]],
            0.1,
            paint,
            (x, z) => yfn(x, z) + 0.035,
            0,
            f,
          );
      }
    }
    // Generic stone parapets on mapped bridges without a dedicated model.
    if (
      f.tags.bridge &&
      ![OSM.houghFootbridge, OSM.houghRoadBridge].includes(f.id)
    ) {
      for (let i = 1; i < p.length; i++) {
        const a = p[i - 1],
          b = p[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          len = Math.hypot(dx, dz),
          rot = Math.atan2(dx, dz);
        for (const side of [-1, 1]) {
          const x = (a[0] + b[0]) / 2 + Math.cos(rot) * (w / 2 + 0.45) * side,
            z = (a[1] + b[1]) / 2 - Math.sin(rot) * (w / 2 + 0.45) * side;
          box(x, yfn(x, z) + 0.7, z, 0.55, 1.4, len + 0.1, m.stone, rot);
        }
      }
    }
  }

  addBlackburnEntrance(kit, { surface });
  addBridgeParking(kit, { surface });
  addEagleyBrowSurface(kit, { surface, data });
  addEagleyHoughBend(kit, { surface, data });
  addTurningCircle(kit, { surface });
  addBrookParking(kit, { surface });
}
