import * as T from 'three';
import { densify, nearest, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { masonryTexture } from '../materials/masonry-texture';
import { retainingTexture } from '../materials/landscape-materials';
import { addBridgeRear } from '../landmarks/bridge-rear';
import {
  addBridgeSideGate,
  addPassageGate,
  gateWorld,
} from '../landmarks/bridge-side-gate';
import {
  addHoughFootbridge,
  addHoughJunction,
} from '../landmarks/hough-junction';
import { roadWidth, type WorldData } from './data';
import { OSM } from './layout';
import type { Surface } from './surface';

const { lerp, clamp } = T.MathUtils;
type Wall = { a: P; b: P };
export type PlantingHints = {
  ferns: { x: number; y: number; z: number; h: number }[];
  ivy: { x: number; y: number; z: number; heading: number; h: number }[];
  shrubs: { x: number; z: number; y: number; h: number; flowering?: boolean }[];
};

// Walls, fences, rails and gates. Every solid boundary registers a collision
// line in `walls`. Heights and offsets are interpreted from Street View unless
// a comment says otherwise.
export function addBoundaries(kit: Kit, surface: Surface, data: WorldData) {
  const { box, batch, beam, mat } = kit;
  const { stone, dark, trim, kerb } = kit.m;
  const {
    terrain,
    sampledTerrain,
    ground,
    roadY,
    courtY,
    riverY,
    roadSeg,
    riverSeg,
    passageY,
  } = surface;
  const walls: Wall[] = [];
  const plants: PlantingHints = { ferns: [], ivy: [], shrubs: [] };

  walls.push(...addBridgeRear(kit, surface.bridgeBase));

  const boundaryStone = mat('boundaryStone', '#b2ad98');
  boundaryStone.map = masonryTexture(true);
  boundaryStone.bumpMap = boundaryStone.map;
  boundaryStone.bumpScale = 0.095;
  const passageStone = mat('passageRubble', '#777b6c');
  passageStone.map = masonryTexture(true);
  passageStone.bumpMap = passageStone.map;
  passageStone.bumpScale = 0.16;
  const bendRetaining = mat('bendRetaining', '#969b83');
  bendRetaining.map = retainingTexture();
  bendRetaining.bumpMap = bendRetaining.map;
  bendRetaining.bumpScale = 0.008;
  const fenceWire = mat('weatheredFenceWire', '#51594e', 0.85);
  const weatheredTimber = mat('weatheredTimber', '#777566'),
    steel = mat('guardSteel', '#a8afaa', 0.5);

  /**
   * Straight wall run with linearly varying base and height, optionally with
   * upright (cock-and-hen) coping or a flat cap. Registers collision.
   */
  function masonry(
    a: P,
    b: P,
    ya: number,
    yb: number,
    ha: number,
    hb: number,
    material: T.Material = boundaryStone,
    uprightCoping = false,
    cap = true,
  ) {
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz),
      rot = Math.atan2(dx, dz),
      g = new T.BoxGeometry(0.55, 1, len + 0.04),
      v = g.getAttribute('position'),
      uv = g.getAttribute('uv');
    for (let j = 0; j < v.count; j++) {
      const t = (v.getZ(j) + len / 2) / len,
        base = lerp(ya, yb, t),
        height = lerp(ha, hb, t);
      v.setY(j, base + (v.getY(j) + 0.5) * height);
      uv.setXY(j, (uv.getX(j) * len) / 2, (uv.getY(j) * height) / 2);
    }
    g.rotateY(rot);
    g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
    g.computeVertexNormals();
    batch(g, material);
    if (uprightCoping) {
      const count = Math.ceil(len / 0.22);
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count;
        box(
          lerp(a[0], b[0], t),
          lerp(ya + ha, yb + hb, t) + 0.12,
          lerp(a[1], b[1], t),
          0.59,
          0.24 + Math.sin(k * 2.7 + a[0]) * 0.035,
          len / count - 0.015,
          material,
          rot,
        );
      }
    } else if (cap) {
      const capGeo = new T.BoxGeometry(0.68, 0.11, len + 0.025),
        positions = capGeo.getAttribute('position');
      for (let k = 0; k < positions.count; k++) {
        const t = (positions.getZ(k) + len / 2) / len;
        positions.setY(
          k,
          positions.getY(k) + lerp(ya + ha, yb + hb, t) + 0.055,
        );
      }
      capGeo.rotateY(rot);
      capGeo.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
      capGeo.computeVertexNormals();
      batch(capGeo, material);
    }
    walls.push({ a, b });
  }
  const v3 = (p: P, y: number) => new T.Vector3(p[0], y, p[1]);

  // ---- Eagley Way, both sides, from Blackburn Road to Bridge Mill ----
  // June 2024 Street View, EAG-001..026. Side +1 is uphill (right when
  // travelling from Blackburn Road); side -1 is the valley side.
  const eagley = data.roads.find((f) => f.name === 'Eagley Way')!,
    edgePath = densify(eagley.points, 2.3);
  function offsetRoadPoint(i: number, d: number): P {
    const before = edgePath[Math.max(0, i - 1)],
      after = edgePath[Math.min(edgePath.length - 1, i + 1)],
      dx = after[0] - before[0],
      dz = after[1] - before[1],
      l = Math.hypot(dx, dz);
    return [edgePath[i][0] - (dz / l) * d, edgePath[i][1] + (dx / l) * d];
  }
  const blackburn = roadSeg.filter((s) => s.f.name === 'Blackburn Road');
  for (let j = 1; j < edgePath.length; j++) {
    const a = edgePath[j - 1],
      b = edgePath[j],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz),
      nx = -dz / len,
      nz = dx / len,
      x = (a[0] + b[0]) / 2;
    for (const side of [-1, 1]) {
      const offset = side * (side === -1 && x < 18 ? 5.0 : 3.7),
        aa = offsetRoadPoint(j - 1, offset),
        bb = offsetRoadPoint(j, offset),
        ya = roadY(...a),
        yb = roadY(...b);
      // Clip the boundary to Blackburn Road's carriageway at the junction.
      if (
        x < -275 &&
        [aa, bb].some((p) => {
          const n = nearest(...p, blackburn);
          return n.s && n.d < roadWidth(n.s.f) / 2 + 0.6;
        })
      )
        continue;
      if (x < -279 && side === -1) continue; // Preserve gatehouse entrance; opposite corner has stone boundary.
      if (side === -1 && x >= -279 && x <= -40) {
        // EAG-002..006: steel rail stands in front of a separate timber fence.
        const fa = offsetRoadPoint(j - 1, offset - 0.22),
          fb = offsetRoadPoint(j, offset - 0.22),
          sa = offsetRoadPoint(j - 1, offset + 0.18),
          sb = offsetRoadPoint(j, offset + 0.18);
        for (const h of [0.55, 1.12])
          beam(v3(fa, ya + h), v3(fb, yb + h), 0.1, 0.12, weatheredTimber);
        box(fa[0], ya + 0.6, fa[1], 0.13, 1.2, 0.13, weatheredTimber);
        beam(v3(sa, ya + 0.62), v3(sb, yb + 0.62), 0.08, 0.26, steel);
        box(sa[0], ya + 0.35, sa[1], 0.09, 0.7, 0.09, steel);
        walls.push({ a: aa, b: bb });
      } else if (side === -1 && x < 18) {
        for (const h of [0.55, 1.12])
          beam(v3(aa, ya + h), v3(bb, yb + h), 0.11, 0.12, weatheredTimber);
        beam(v3(aa, ya + 0.62), v3(bb, yb + 0.62), 0.09, 0.3, steel);
        box(aa[0], ya + 0.6, aa[1], 0.13, 1.2, 0.13, weatheredTimber);
        walls.push({ a: aa, b: bb });
      } else if (side === 1 && x < -279) {
        masonry(aa, bb, ya - 0.18, yb - 0.18, 1.25, 1.25);
      } else if (side === 1 && x >= -279 && x <= -225) {
        // Mesh is visible in EAG-004 and partly obscured in EAG-005/006.
        box(aa[0], ya + 0.55, aa[1], 0.1, 1.1, 0.1, weatheredTimber);
        for (let h = 0.12; h <= 1.02; h += 0.15)
          beam(v3(aa, ya + h), v3(bb, yb + h), 0.006, 0.006, fenceWire);
        const wires = Math.ceil(len / 0.18);
        for (let k = 1; k < wires; k++) {
          const t = k / wires;
          box(
            lerp(aa[0], bb[0], t),
            lerp(ya, yb, t) + 0.57,
            lerp(aa[1], bb[1], t),
            0.006,
            0.9,
            0.006,
            fenceWire,
          );
        }
        walls.push({ a: aa, b: bb });
      } else if (side === 1 && x >= -181 && x < -40) {
        // EAG-012..019: plain retaining panels; height interpolation remains estimated.
        const retainingHeight = (px: number) =>
          0.82 + 0.33 * clamp((px + 145) / 33, 0, 1);
        masonry(
          aa,
          bb,
          ya - 0.16,
          yb - 0.16,
          retainingHeight(aa[0]),
          retainingHeight(bb[0]),
          bendRetaining,
          false,
          false,
        );
        // EAG-019..026: vertical joints in plain panels, spacing interpreted.
        if (x > -108 && j % 2 === 0) {
          const h = retainingHeight(aa[0]);
          box(
            aa[0] - nx * 0.283,
            ya - 0.16 + h / 2,
            aa[1] - nz * 0.283,
            0.013,
            h,
            0.014,
            dark,
          );
        }
        // Narrow raised drainage edge becomes clear in EAG-025/026.
        if (x > -55)
          beam(
            new T.Vector3(aa[0] - nx * 0.52, ya - 0.08, aa[1] - nz * 0.52),
            new T.Vector3(bb[0] - nx * 0.52, yb - 0.08, bb[1] - nz * 0.52),
            0.12,
            0.12,
            bendRetaining,
          );
        // Low fern layer on the open bank.
        if (x > -106 && x < -40 && j % 5 !== 0)
          for (let k = 0; k < 2; k++) {
            const t = (k + 0.5) / 2,
              d = 0.55 + 0.35 * Math.sin(j * 3.7 + k),
              fx = lerp(aa[0], bb[0], t) + nx * d,
              fz = lerp(aa[1], bb[1], t) + nz * d;
            plants.ferns.push({
              x: fx,
              z: fz,
              y: Math.max(terrain(fx, fz), lerp(ya, yb, t) + 1),
              h: 0.35 + 0.18 * (1 + Math.sin(j * 2.3 + k)),
            });
          }
        // EAG-015..019: curtains of ivy separated by exposed retaining panels.
        if (
          (x > -146 && x < -121) ||
          (x > -117 && x < -94) ||
          (x > -68 && x < -40)
        ) {
          const h = retainingHeight(x);
          for (let k = 0; k < 5; k++) {
            const t = (k + 0.5) / 5;
            plants.ivy.push({
              x: lerp(aa[0], bb[0], t) - nx * 0.3,
              y: lerp(ya, yb, t) - 0.16,
              z: lerp(aa[1], bb[1], t) - nz * 0.3,
              heading: Math.atan2(-nx, -nz),
              h,
            });
          }
        }
        // One visible weep opening in EAG-012. Position is interpreted, not measured.
        if (aa[0] <= -173 && bb[0] > -173) {
          const t = (-173 - aa[0]) / (bb[0] - aa[0]);
          const hole = new T.CircleGeometry(0.035, 12);
          hole.applyQuaternion(
            new T.Quaternion().setFromUnitVectors(
              new T.Vector3(0, 0, 1),
              new T.Vector3(-nx, 0, -nz),
            ),
          );
          hole.translate(
            -173 - nx * 0.281,
            lerp(ya, yb, t) + 0.1,
            lerp(aa[1], bb[1], t) - nz * 0.281,
          );
          batch(hole, dark);
        }
      } else if (side === 1 && x < -157) {
        box(aa[0], ya + 0.55, aa[1], 0.1, 1.1, 0.1, weatheredTimber);
        for (const h of [0.35, 0.7, 1])
          beam(v3(aa, ya + h), v3(bb, yb + h), 0.016, 0.016, dark);
        walls.push({ a: aa, b: bb });
      } else if (side === -1 && x > 59 && x < 110) {
        // Bridge Mill roadside wall, also the passage retaining face below.
        // June 2024 reverse view: upright coping on the taller west section, a
        // sharp drop beside the mill. The x94 transition is interpreted.
        const split = 94;
        const wallBase = (y: number) =>
          x >= 74 ? Math.min(passageY - 0.25, y - 0.18) : y - 0.18;
        const wallBaseA = wallBase(ya),
          wallBaseB = wallBase(yb);
        if (aa[0] < split && bb[0] > split) {
          const t = (split - aa[0]) / (bb[0] - aa[0]),
            mid: P = [split, lerp(aa[1], bb[1], t)],
            ym = lerp(ya, yb, t),
            midBase = lerp(wallBaseA, wallBaseB, t);
          masonry(
            aa,
            mid,
            wallBaseA,
            midBase,
            ya - 0.18 + 1.42 - wallBaseA,
            ym - 0.18 + 1.42 - midBase,
            passageStone,
            true,
          );
          masonry(
            mid,
            bb,
            midBase,
            wallBaseB,
            ym - 0.18 + 0.92 - midBase,
            yb - 0.18 + 0.92 - wallBaseB,
            passageStone,
          );
        } else {
          const top = x < split ? 1.42 : 0.92;
          masonry(
            aa,
            bb,
            wallBaseA,
            wallBaseB,
            ya - 0.18 + top - wallBaseA,
            yb - 0.18 + top - wallBaseB,
            passageStone,
            x < split,
          );
        }
      } else {
        const h = side === 1 ? (x < -115 ? 0.85 : x < 18 ? 1.45 : 1.7) : 1.3;
        masonry(aa, bb, ya - 0.18, yb - 0.18, h, h);
      }
      // Continuous understorey behind the roadside boundaries.
      if (x < 18 && j % 2 === 0) {
        const flowering =
          side === 1
            ? (x > -211 && x < -177) || (x > -80 && x < -72)
            : x > -201 && x < -184;
        const plantingOffset = flowering ? 1.4 : 2.4;
        const hx = (aa[0] + bb[0]) / 2 + nx * side * plantingOffset,
          hz = (aa[1] + bb[1]) / 2 + nz * side * plantingOffset;
        plants.shrubs.push({
          x: hx,
          z: hz,
          y: terrain(hx, hz),
          flowering,
          h: flowering
            ? 3.1 + 0.45 * Math.sin(j * 1.1)
            : side === 1
              ? x > -106 && x < -40
                ? 0.65 + 0.25 * Math.sin(j)
                : x > -269 && x < -252
                  ? 0.48 + 0.18 * Math.sin(j * 1.7)
                  : 2.1
              : 1.55,
        });
      }
    }
  }

  // ---- Bridge Mill gates at the Hough Lane end ----
  const gatePaving = mat('gatePaving', '#858477');
  gatePaving.side = T.DoubleSide;
  walls.push(
    ...addBridgeSideGate(kit, {
      wallStone: boundaryStone,
      paving: gatePaving,
      ground,
    }),
  );
  // June 2024: the low frontage wall wraps the planted corner into the gate returns.
  // Keep the exact existing wall endpoint, so separate spans cannot leave a gap.
  const cornerWall: P[] = [
    offsetRoadPoint(edgePath.length - 1, -3.7),
    [112, 26.38],
    [114, 25.8],
    [115.65, 25.15],
    gateWorld(-1.6, 3.2),
  ];
  const landscapeWall: P[] = [
    gateWorld(1.6, 3.2),
    [120.1, 20.6],
    [121.2, 19.05],
    [122.5, 17.1],
    [124.0, 14.8],
  ];
  for (const path of [cornerWall, landscapeWall])
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i];
      masonry(
        a,
        b,
        ground(...a) - 0.1,
        ground(...b) - 0.1,
        0.94,
        0.94,
        passageStone,
      );
    }
  // The other gate serves the cobbled passage, not a private garden.
  walls.push(...addPassageGate(kit, passageY));
  for (const path of [
    [
      [106.55, 20.66],
      [110, 21.9],
      [110, 23.05],
    ],
    [
      [110, 24.4],
      [110, 26.8],
    ],
  ] as P[][])
    for (let i = 1; i < path.length; i++)
      masonry(
        path[i - 1],
        path[i],
        passageY - 0.18,
        passageY - 0.18,
        1.08,
        1.08,
        passageStone,
      );
  // Shrubs occupy the enclosed corner, leaving the recessed gate approach clear.
  for (const [x, z, h] of [
    [111, 21.7, 1.1],
    [112.3, 21.5, 1.3],
    [113.4, 22.0, 1.15],
  ])
    plants.shrubs.push({ x, z, y: terrain(x, z), h });
  // Raised west passage apron, retained rather than floating above the bank. No collision.
  for (let z = 12; z < 27; z += 1) {
    const a: P = [71.8, z],
      b: P = [71.8, z + 1],
      ya = Math.min(sampledTerrain(...a) - 0.15, passageY - 0.3),
      yb = Math.min(sampledTerrain(...b) - 0.15, passageY - 0.3);
    masonry(a, b, ya, yb, passageY - 0.07 - ya, passageY - 0.07 - yb);
    walls.pop();
  }

  // ---- Hough Lane road bridge, junction and footbridge ----
  // Narrow road bridge and separate footbridge, checked in both directions in June 2024.
  // 3.8m carriageway is interpreted, not measured. Keep both parapets outside it.
  const bridgeEnds = data.roads.find(
    (f) => f.id === OSM.houghRoadBridge,
  )!.points;
  const ba = bridgeEnds[0],
    bb = bridgeEnds[bridgeEnds.length - 1],
    bl = Math.hypot(bb[0] - ba[0], bb[1] - ba[1]);
  const bnx = -(bb[1] - ba[1]) / bl,
    bnz = (bb[0] - ba[0]) / bl;
  for (const side of [-1, 1]) {
    const a: P = [ba[0] + bnx * 2.175 * side, ba[1] + bnz * 2.175 * side],
      b: P = [bb[0] + bnx * 2.175 * side, bb[1] + bnz * 2.175 * side];
    masonry(a, b, roadY(...a), roadY(...b), 1.05, 1.05, stone, false, false);
    // West parapet turns back along the end of the west pavement, which
    // stops at the bridge (DQl heading 250). The east side opens onto the
    // footbridge, so it has no return.
    if (side === -1)
      for (const [from, to] of [
        [b, [139.0, -15.0]],
        [
          [139.0, -15.0],
          [138.9, -16.5],
        ],
      ] as [P, P][])
        masonry(
          from,
          to,
          ground(...from) - 0.12,
          ground(...to) - 0.12,
          1.05,
          1.05,
          stone,
          false,
          false,
        );
  }
  walls.push(...addHoughJunction(kit, surface.vehicleRoadY, ground));
  walls.push(
    ...addHoughFootbridge(
      kit,
      ground,
      data.roads.find((f) => f.id === OSM.houghFootbridge)!.points,
    ),
  );

  // ---- Threadfold Way north boundary, checked against June 2024 Street View ----
  const threadPath = densify(
    data.roads.find((f) => f.id === OSM.threadfoldWayLoop)!.points,
    2,
  );
  for (let j = 1; j < threadPath.length; j++) {
    const a = threadPath[j - 1],
      b = threadPath[j],
      x = (a[0] + b[0]) / 2;
    if (x < 45 || x > 130) continue;
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz),
      nx = -dz / len,
      nz = dx / len,
      aa: P = [a[0] + nx * 5.1, a[1] + nz * 5.1],
      bb: P = [b[0] + nx * 5.1, b[1] + nz * 5.1],
      h = x > 104 ? 1.9 : 1.05;
    masonry(aa, bb, roadY(...a) - 0.2, roadY(...b) - 0.2, h, h);
  }

  // ---- Bridge Mill court: low stone parking edge above the garage approach ----
  // X59,Z14 photo. Follows the current court outline; precise trace provisional.
  for (let x = 41; x < 69; x += 1) {
    const z = (v: number) => 9 - ((v - 40) * 3) / 29;
    const a: P = [x, z(x)],
      b: P = [x + 1, z(x + 1)];
    const topA = courtY(...a) + 0.22,
      topB = courtY(...b) + 0.22;
    const bottomA = Math.min(sampledTerrain(a[0], a[1] - 1) - 0.2, topA - 0.45),
      bottomB = Math.min(sampledTerrain(b[0], b[1] - 1) - 0.2, topB - 0.45);
    masonry(a, b, bottomA, bottomB, topA - bottomA, topB - bottomB);
    const mx = x + 0.5,
      mz = z(mx);
    box(
      mx,
      (topA + topB) / 2 + 0.035,
      mz,
      1.04,
      0.09,
      0.48,
      kerb,
      Math.atan(3 / 29),
    );
    if (x % 2 === 0)
      plants.shrubs.push({
        x: mx,
        z: mz - 1.75,
        y: terrain(mx, mz - 1.75),
        h: 1.25 + 0.3 * Math.sin(x),
      });
  }

  // ---- Riverside path: steel mesh railing, stone retaining with iron rails ----
  const vehicleSeg = roadSeg.filter((s) => roadWidth(s.f) > 2);
  const riverSteel = mat('riversideSteel', '#859795', 0.6);
  for (const f of data.roads.filter((f) => f.id === OSM.riversidePath)) {
    const path = densify(f.points, 2);
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i],
        mx = (a[0] + b[0]) / 2,
        mz = (a[1] + b[1]) / 2,
        r = nearest(mx, mz, riverSeg),
        dist = Math.hypot(r.x - mx, r.z - mz) || 1;
      if (mx > 110 && mz > 12) continue; // Dedicated stone returns at the Hough Lane gate.
      const ox = ((r.x - mx) / dist) * 1.25,
        oz = ((r.z - mz) / dist) * 1.25,
        x = mx + ox,
        z = mz + oz,
        rd = nearest(x, z, vehicleSeg);
      if (rd.d < roadWidth(rd.s.f) / 2 + 1.7) continue;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        rot = Math.atan2(b[0] - a[0], b[1] - a[1]),
        top = roadY(mx, mz) + 0.12,
        base = Math.min(terrain(x, z) - 0.4, riverY(x, z)),
        height = Math.max(0.5, top - base);
      const railA = new T.Vector3(a[0] + ox, 0, a[1] + oz),
        railB = new T.Vector3(b[0] + ox, 0, b[1] + oz);
      const rail = (ya: number, yb: number, w: number, m: T.Material) =>
        beam(railA.clone().setY(ya), railB.clone().setY(yb), w, w, m);
      if (mx > 20 && mx < 70) {
        // Mesh railing along the residents' section (user photo X24,Z-4).
        box(x, roadY(mx, mz) + 0.7, z, 0.075, 1.4, 0.075, riverSteel);
        for (const yy of [0.15, 0.72, 1.32])
          rail(roadY(...a) + yy, roadY(...b) + yy, 0.035, riverSteel);
        const bars = Math.ceil(len / 0.14);
        for (let j = 0; j < bars; j++) {
          const t = j / bars,
            px = lerp(a[0], b[0], t) + ox,
            pz = lerp(a[1], b[1], t) + oz;
          box(
            px,
            roadY(px - ox, pz - oz) + 0.74,
            pz,
            0.012,
            1.08,
            0.012,
            riverSteel,
          );
        }
        for (const yy of [0.3, 0.45, 0.6, 0.9, 1.05, 1.2])
          rail(roadY(...a) + yy, roadY(...b) + yy, 0.009, riverSteel);
      } else {
        box(x, top - height / 2, z, 0.5, height, len + 0.12, stone, rot);
        box(x, top + 0.07, z, 0.62, 0.14, len + 0.15, trim, rot);
        box(x, top + 0.7, z, 0.075, 1.3, 0.075, dark);
        for (const y of [0.45, 1.05])
          rail(roadY(...a) + 0.12 + y, roadY(...b) + 0.12 + y, 0.055, dark);
      }
      walls.push({ a: [a[0] + ox, a[1] + oz], b: [b[0] + ox, b[1] + oz] });
    }
  }
  // Closed residents' gate in the supplied X24,Z-4 view; placement estimated.
  const gateX = 31.5,
    gateZ = -8.47,
    gateY = roadY(gateX, gateZ);
  for (const z of [gateZ - 1.2, gateZ + 1.2])
    box(gateX, gateY + 0.7, z, 0.09, 1.4, 0.09, riverSteel);
  for (const y of [0.15, 0.4, 0.65, 0.9, 1.2])
    box(gateX, gateY + y, gateZ, 0.055, 0.055, 2.4, riverSteel);
  box(gateX, gateY + 0.67, gateZ, 0.045, 1.08, 0.045, riverSteel);
  walls.push({ a: [gateX, gateZ - 1.2], b: [gateX, gateZ + 1.2] });

  return { walls, plants };
}
