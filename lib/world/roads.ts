import * as T from 'three';
import { densify, nearest, segments, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { gravelTexture } from '../materials/gravel-texture';
import { addBrookParking } from '../landmarks/brook-mill-grounds';
import { roadWidth, type WorldData } from './data';
import { OSM } from './layout';
import { KERB, isCarriageway } from './road-spec';
import {
  normalAt,
  pointAt,
  stations,
  type KerbPath,
  type RoadNetwork,
} from './road-network';
import type { Surface } from './surface';
import { drape, strip, sweep } from '../core/mesh';

// Draws the carriageway network (surfaces, kerbs, pavements, markings),
// footways, the Bridge Mill parking court and the Brook Mill car park.
export function addRoads(
  kit: Kit,
  surface: Surface,
  data: WorldData,
  net: RoadNetwork,
) {
  const { box, mat, m } = kit;
  const { courtY } = surface;
  const { asphalt, blockPaving, paving, kerb, paint, soil } = m;
  const yellow = mat('yellowLines', '#c7af65');

  // ---- Carriageways ----
  for (const e of net.edges) {
    const s0 = e.trim[0],
      s1 = e.length - e.trim[1];
    if (s1 - s0 < 0.05) continue;
    const left: P[] = [],
      right: P[] = [],
      ys: [number, number][] = [];
    for (const s of stations(e, s0, s1)) {
      const at = pointAt(e, s),
        n = normalAt(e, s),
        hw = e.spec.width(...at.p) / 2;
      const l: P = [at.p[0] - n[0] * hw, at.p[1] - n[1] * hw],
        r: P = [at.p[0] + n[0] * hw, at.p[1] + n[1] * hw];
      left.push(l);
      right.push(r);
      ys.push([net.edgeY(e, ...l), net.edgeY(e, ...r)]);
    }
    kit.batch(
      strip(left, right, ys),
      e.spec.surface === 'blocks' ? blockPaving : asphalt,
    );
    // Dashed centre line, kept clear of junction mouths.
    if (e.spec.centreDashes)
      for (let s = s0 + 1.5; s + 3 < s1 - 1.5; s += 10) {
        const pts = [0, 1, 2, 3].map((k) => pointAt(e, s + k).p);
        const outs = [0, 1, 2, 3].map((k) => normalAt(e, s + k));
        kit.batch(
          sweep(pts, outs, (i) => net.edgeY(e, ...pts[i]) + 0.02, [
            [-0.05, 0],
            [0.05, 0],
          ]),
          paint,
        );
      }
  }
  for (const j of net.junctions) {
    const main = j.arms.reduce((a, b) => (b.hw > a.hw ? b : a)).edge;
    kit.batch(
      drape(j.polygon, (x, z) => net.junctionY(j, x, z), 1),
      main.spec.surface === 'blocks' ? blockPaving : asphalt,
    );
  }

  // ---- Kerbs, pavements, skirts and yellow lines ----
  for (const k of net.kerbPaths) addKerbPath(k);
  function addKerbPath(k: KerbPath) {
    const base = k.pts.map((p, i) => net.kerbBaseY(p, k.out[i]) ?? 0);
    // Profiles use the full kerb height; dropped crossings shift them down.
    const lift = k.pts.map((p) => net.kerbLift(...p) - KERB.height);
    const y = (i: number) => base[i] + (k.kerb ? lift[i] : 0);
    const h = KERB.height,
      w = KERB.width;
    if (k.kerb) {
      kit.batch(
        sweep(k.pts, k.out, y, [
          [0, -0.3],
          [0, h],
          [w, h],
        ]),
        kerb,
      );
      if (k.pavement) {
        const outer = w + k.pavement;
        kit.batch(
          sweep(k.pts, k.out, y, [
            [w, h],
            [outer, h],
            [outer, h - 0.55],
          ]),
          paving,
        );
      } else
        kit.batch(
          sweep(k.pts, k.out, y, [
            [w, h],
            [w, -0.45],
          ]),
          kerb,
        );
    } else if (!k.service) {
      // Unkerbed edge: a skirt hides the gap to lower ground. Service roads
      // mostly run inside paved courts, where a skirt would show.
      kit.batch(
        sweep(k.pts, k.out, y, [
          [0, 0],
          [0, -0.5],
        ]),
        soil,
      );
    }
    // Double yellow lines, 0.12m and 0.31m in from the kerb face.
    let run: number[] = [];
    const flush = () => {
      if (run.length > 1) {
        const pts = run.map((i) => k.pts[i]),
          outs = run.map((i) => k.out[i]),
          ys = run.map((i) => base[i] + 0.012);
        for (const d of [0.12, 0.31])
          kit.batch(
            sweep(pts, outs, (i) => ys[i], [
              [-d - 0.0375, 0],
              [-d + 0.0375, 0],
            ]),
            yellow,
          );
      }
      run = [];
    };
    k.yellow.forEach((on, i) => (on ? run.push(i) : flush()));
    flush();
  }

  // ---- Footways and paths ----
  const gravel = mat('riversideGravel', '#aaa99a');
  gravel.map = gravelTexture();
  gravel.bumpMap = gravel.map;
  gravel.bumpScale = 0.025;
  const onNetwork = (x: number, z: number) =>
    net.carriageway(x, z) !== undefined || net.nearPavement(x, z, 0.6);
  for (const f of data.roads) {
    if (isCarriageway(f) || f.id === OSM.houghJunctionFootway) continue;
    const own = segments([f]);
    // The footbridge deck follows the walking surface, which eases it onto
    // the pavement at its north end.
    const yfn =
      f.id === OSM.houghFootbridge
        ? surface.ground
        : (x: number, z: number) => surface.roadY(x, z, nearest(x, z, own));
    kit.ribbon(
      densify(f.points, 0.35),
      roadWidth(f),
      f.id === OSM.riversidePath ? gravel : paving,
      yfn,
      0,
      (a, b) => {
        // Footways stop where any part meets a carriageway or pavement; OSM
        // often maps pavements again as separate footways.
        const mx = (a[0] + b[0]) / 2,
          mz = (a[1] + b[1]) / 2;
        if (f.id === OSM.houghFootbridge) return true;
        if (
          f.id === OSM.riversidePath &&
          surface.gateApproach(mx, mz) !== undefined
        )
          return false;
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1,
          nx = (-(b[1] - a[1]) / d) * 0.9,
          nz = ((b[0] - a[0]) / d) * 0.9;
        return ![
          [mx, mz],
          [mx + nx, mz + nz],
          [mx - nx, mz - nz],
          [a[0], a[1]],
          [b[0], b[1]],
        ].some(([x, z]) => onNetwork(x, z));
      },
    );
  }

  // Generic stone parapets on mapped road bridges without a dedicated model.
  for (const e of net.edges) {
    if (!e.f.tags.bridge || e.f.id === OSM.houghRoadBridge) continue;
    for (let i = 1; i < e.pts.length; i++) {
      const a = e.pts[i - 1],
        b = e.pts[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz),
        rot = Math.atan2(dx, dz),
        w = e.spec.width(...a);
      for (const side of [-1, 1]) {
        const x = (a[0] + b[0]) / 2 + Math.cos(rot) * (w / 2 + 0.45) * side,
          z = (a[1] + b[1]) / 2 - Math.sin(rot) * (w / 2 + 0.45) * side;
        box(x, net.edgeY(e, x, z) + 0.7, z, 0.55, 1.4, len + 0.1, m.stone, rot);
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

/** Graded Bridge Mill parking surface with three bay groups. */
function addParkingCourt(kit: Kit, surface: Surface) {
  const { court, courtY } = surface;
  kit.batch(
    drape(court, (x, z) => courtY(x, z) + 0.05, 2),
    kit.m.asphalt,
  );
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
