import * as T from 'three';
import { densify, nearest, segments, type Feature, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { gravelTexture } from '../materials/gravel-texture';
import { addBrookParking } from '../landmarks/brook-mill-grounds';
import {
  HOUGH_CENTRE,
  HOUGH_RADIUS,
  inHoughCarriageway,
} from '../landmarks/hough-junction';
import { roadWidth, type WorldData } from './data';
import { OSM } from './layout';
import type { Surface } from './surface';

const { lerp } = T.MathUtils;

// Carriageways, footways, kerbs, markings and parking surfaces, generated from
// OSM centrelines. Widths are inferred; see roadWidth().
export function addRoads(kit: Kit, surface: Surface, data: WorldData) {
  const { ribbon, box, mat, m } = kit;
  const { roadY, courtY, roadSeg, gateApproach } = surface;
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
    return f.id === OSM.busTurningLoop ||
      (f.name === 'Threadfold Way' && f.id !== OSM.threadfoldWayLoop)
      ? blockPaving
      : asphalt;
  }

  for (const f of data.roads) {
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
        : (x: number, z: number) => roadY(x, z, nearest(x, z, own));

    // Footways and kerbs. Eagley Way has a single north-side pavement near the mill.
    if (!foot && f.id !== OSM.houghRoadBridge) {
      for (const side of [-1, 1]) {
        if (
          (f.tags.highway === 'service' && f.id !== OSM.busTurningLoop) ||
          (f.name === 'Eagley Way' && side === 1)
        )
          continue;
        const walkPoints =
          f.name === 'Eagley Way' ? p.filter((q) => q[0] < 18) : p;
        if (walkPoints.length < 2) continue;
        if (f.id !== OSM.busTurningLoop)
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
              gateApproach(mx, mz) !== undefined
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

  addParkingCourt(kit, surface);
  addBrookParking(kit, surface.brookParkingY);

  // Grass-island kerbs and the short perimeter at the western court.
  for (const p of [
    [
      [11, 2],
      [24, 2],
      [35, 5],
    ],
    [
      [12, 29],
      [31, 29],
      [35, 24],
    ],
    [
      [35, 1],
      [38, 6],
      [39, 9],
    ],
  ] as P[][])
    for (let j = 1; j < p.length; j++)
      kit.beam(
        new T.Vector3(p[j - 1][0], courtY(...p[j - 1]) + 0.07, p[j - 1][1]),
        new T.Vector3(p[j][0], courtY(...p[j]) + 0.07, p[j][1]),
        0.18,
        0.15,
        kerb,
      );
}

/** Triangulated, graded Bridge Mill parking surface with three bay groups. */
function addParkingCourt(kit: Kit, surface: Surface) {
  const { court, courtY } = surface;
  const shape = new T.Shape(court.map((p) => new T.Vector2(p[0], -p[1]))),
    raw = new T.ShapeGeometry(shape).toNonIndexed(),
    rawPos = raw.getAttribute('position'),
    pv: number[] = [],
    pu: number[] = [];
  // Subdivide until triangles are under 2m so the surface follows the grade.
  function triangle(a: P, b: P, c: P, depth = 0) {
    if (
      depth < 4 &&
      Math.max(
        Math.hypot(a[0] - b[0], a[1] - b[1]),
        Math.hypot(a[0] - c[0], a[1] - c[1]),
        Math.hypot(c[0] - b[0], c[1] - b[1]),
      ) > 2
    ) {
      const ab: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
        bc: P = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2],
        ca: P = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
      triangle(a, ab, ca, depth + 1);
      triangle(ab, b, bc, depth + 1);
      triangle(ca, bc, c, depth + 1);
      triangle(ab, bc, ca, depth + 1);
    } else
      for (const p of [a, b, c]) {
        pv.push(p[0], courtY(...p) + 0.05, p[1]);
        pu.push(p[0] / 8, p[1] / 8);
      }
  }
  for (let i = 0; i < rawPos.count; i += 3)
    triangle(
      [rawPos.getX(i), -rawPos.getY(i)],
      [rawPos.getX(i + 1), -rawPos.getY(i + 1)],
      [rawPos.getX(i + 2), -rawPos.getY(i + 2)],
    );
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pv, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(pu, 2));
  g.computeVertexNormals();
  kit.batch(g, kit.m.asphalt);
  raw.dispose();

  // Three short parking groups leave the eastern garage lane clear.
  for (const row of [
    { x: 13, z: 5, n: 6, yaw: 0 },
    { x: 13, z: 25, n: 6, yaw: Math.PI },
    { x: 8, z: 6, n: 4, yaw: Math.PI / 2 },
  ])
    for (let k = 0; k <= row.n; k++) {
      const x = row.x + Math.cos(row.yaw) * k * 2.6,
        z = row.z - Math.sin(row.yaw) * k * 2.6;
      kit.box(x, courtY(x, z) + 0.08, z, 0.07, 0.02, 4.7, kit.m.paint, row.yaw);
    }
}
