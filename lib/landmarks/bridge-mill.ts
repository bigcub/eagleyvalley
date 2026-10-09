import { slateMaterial, roofUV } from '../materials/building-surfaces';
import { createPottedTopiary } from '../vegetation/potted-topiary';
import { settMaterials } from '../materials/sett-material';
import {
  bridgeDressing,
  bridgeMossWash,
  bridgeStone,
} from '../materials/bridge-stone';
import { passageWallZ } from './bridge-passage';
import {
  BRIDGE_JUNCTION,
  BRIDGE_MILL_FOOTPRINT,
  BRIDGE_NO5_DOOR,
  passageSettInset,
} from '../world/layout';
import { hoopRailing } from './garden-fences';
import * as T from 'three';
import type { Kit } from '../core/kit';
type P = [number, number];

/** User photos: a deep basement light well in front of each window bay
 * (even bays), with rubble walls, coping, a flagged floor and a tall
 * multi-pane window. Width, projection and depth estimated. */
const lightWells = [0, 2, 4, 6, 8].map((bay) => 79.7 + bay * 3.12);
const LIGHT_WELL = { width: 1.8, depth: 0.75, floor: 2.5 };
const NO3_WELL = lightWells[2];
const frontZ = (x: number) => 19.55 + (x - 80) * 0.041;
// Mapped south wall face (BRIDGE_MILL_FOOTPRINT), 0.02-0.04m in front of frontZ.
const [FA, FB] = [BRIDGE_MILL_FOOTPRINT[3], BRIDGE_MILL_FOOTPRINT[2]];
const FACE_SLOPE = (FB[1] - FA[1]) / (FB[0] - FA[0]);
const FACE_ROT = Math.atan(FACE_SLOPE);
const faceZ = (x: number) => FA[1] + (x - FA[0]) * FACE_SLOPE;
/** Open well, for cutting the fine grass mesh. */
export function inBridgeLightWell(x: number, z: number) {
  const w = LIGHT_WELL.width / 2;
  return lightWells.some(
    (c) =>
      Math.abs(x - c) < w &&
      z > frontZ(x) - 0.05 &&
      z < frontZ(x) + LIGHT_WELL.depth,
  );
}
/** Junction setts west of the level passage follow this sloping surface. */
type Junction = {
  inside: (x: number, z: number) => boolean;
  y: (x: number, z: number) => number;
};
export function addBridgeFront(kit: Kit, base: number, junction: Junction) {
  const { box, batch } = kit;
  const wells: P[][] = [];
  const { stone, dark, glass } = kit.m;
  const white = new T.MeshStandardMaterial({
      color: '#eeeae0',
      roughness: 0.72,
    }),
    brass = new T.MeshStandardMaterial({
      color: '#a68b51',
      metalness: 0.7,
      roughness: 0.3,
    });
  const topiary = createPottedTopiary(batch);
  const south = (x: number) => 19.55 + (x - 80) * 0.041;
  const B = (
    x: number,
    y: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
    offset = 0.12,
  ) =>
    box(
      x,
      base + y,
      south(x) + Math.max(0.015, offset - 0.17),
      w,
      h,
      Math.min(d, 0.11),
      m,
      -0.041,
    );
  const dressing = bridgeDressing(kit);
  const shadow = kit.mat('bridgeRevealShadow', '#4a4a40', 1);
  /** Box at `out` metres in front of the mapped wall face (its centre),
   * with real depth. The shell follows BRIDGE_MILL_FOOTPRINT's south edge. */
  const D = (
    x: number,
    y: number,
    w: number,
    h: number,
    out: number,
    depth: number,
    m: T.Material,
  ) => box(x, base + y, faceZ(x) + out, w, h, depth, m, -FACE_ROT);
  // User photos of No.3, 7 October 2026: 15-over-15 white sashes (five panes
  // across, three rows per sash) set straight into the stone, with tooled
  // lintels and projecting sills. Ground windows sit about 1.0m above the
  // flags and rise to about 3.15m. Sizes scaled from the door (2.05m).
  function sash(x: number, y: number) {
    const w = 1.43,
      h = 2.14,
      gw = 1.29,
      gh = 1.98;
    // Frame behind, glass in front of it, glazing bars in front of the glass.
    D(x, y, w + 0.04, h + 0.04, 0.004, 0.02, shadow);
    D(x, y, w, h, 0.012, 0.024, white);
    D(x, y, gw, gh, 0.03, 0.01, glass);
    for (let c = -2; c <= 2; c++)
      if (c)
        D(
          x + (c - Math.sign(c) * 0.5) * (gw / 5),
          y,
          0.032,
          gh,
          0.065,
          0.025,
          white,
        );
    for (const r of [-2, -1, 1, 2])
      D(x, y + r * 0.33, gw, 0.03, 0.065, 0.025, white);
    // Meeting rail and sash stiles.
    D(x, y, gw + 0.02, 0.07, 0.07, 0.04, white);
    for (const side of [-1, 1])
      D(x + side * (gw / 2 + 0.03), y, 0.06, gh, 0.07, 0.03, white);
    D(x, y - h / 2 - 0.07, w + 0.3, 0.12, 0.1, 0.22, dressing);
    D(x, y + h / 2 + 0.15, w + 0.34, 0.3, 0.04, 0.1, dressing);
  }
  // User frontage photos from No.3: four doors on odd bays, windows at both
  // ends. No.5 (west) has its red door on the side. West to east: No.4
  // plum, No.3 green, No.2 navy, No.1 dark grey. Shades matched by eye.
  const doorColours = ['#5a2a45', '#173f30', '#1f2850', '#34383c'];
  // No.3 photo, front-on: six-panel door 0.88 x 2.0m between white panelled
  // pilasters 0.30m wide, a rail, then a 5x2 transom light across the full
  // surround; tooled lintel above with a carriage lantern, single stone step.
  const DOOR = { w: 0.88, h: 2.0, sill: 0.13, pilaster: 0.3, transom: 0.76 };
  const panelled = (
    x: number,
    y0: number,
    w: number,
    h: number,
    out: number,
    face: T.Material,
    edge: T.Material,
  ) => {
    D(x, y0 + h / 2, w, h, out, 0.02, edge);
    D(x, y0 + h / 2, w - 0.05, h - 0.05, out + 0.008, 0.02, face);
  };
  for (let bay = 0; bay < 9; bay++) {
    const x = 79.7 + bay * 3.12;
    sash(x, 5.05);
    if (bay % 2 === 0) {
      sash(x, 2.08);
      continue;
    }
    const colour = doorColours[(bay - 1) / 2];
    const door = kit.mat(`bridgeDoor${colour}`, colour, 0.5);
    const doorEdge = kit.mat(
      `bridgeDoorEdge${colour}`,
      `#${new T.Color(colour).multiplyScalar(0.62).getHexString()}`,
      0.6,
    );
    const { w, h, sill, pilaster: pw, transom } = DOOR;
    const full = w + pw * 2;
    // Step, door leaf and its six raised-and-fielded panels.
    D(x, sill / 2, full + 0.08, sill, 0.17, 0.36, dressing);
    D(x, sill + h / 2, w, h, 0.02, 0.04, door);
    for (const side of [-1, 1])
      for (const [c, ph] of [
        [0.875, 0.28],
        [0.6, 0.6],
        [0.2, 0.62],
      ])
        panelled(
          x + side * 0.2,
          sill + h * c - ph / 2,
          0.32,
          ph,
          0.04,
          door,
          doorEdge,
        );
    D(x, sill + h * 0.41, 0.3, 0.065, 0.055, 0.02, brass);
    D(x + 0.33, sill + h * 0.46, 0.045, 0.22, 0.055, 0.02, brass);
    D(x + 0.31, sill + h * 0.5, 0.1, 0.025, 0.08, 0.04, brass);
    // Pilasters with three panels each.
    const off = kit.mat('bridgeDoorPanelShadow', '#cfccc2', 0.8);
    for (const side of [-1, 1]) {
      const px = x + side * (w / 2 + pw / 2);
      D(px, sill + h / 2, pw, h, 0.06, 0.1, white);
      for (const [lo, hi] of [
        [0.03, 0.21],
        [0.25, 0.82],
        [0.86, 0.98],
      ])
        panelled(px, sill + h * lo, pw - 0.1, h * (hi - lo), 0.11, white, off);
    }
    // Rail and transom light: five lights across, two high.
    const t0 = sill + h,
      ty = t0 + 0.09 + transom / 2;
    D(x, t0 + 0.045, full, 0.09, 0.06, 0.1, white);
    D(x, ty, full, transom, 0.012, 0.024, white);
    D(x, ty, full - 0.12, transom - 0.1, 0.03, 0.01, glass);
    for (const c of [-1.5, -0.5, 0.5, 1.5])
      D(
        x + (c * (full - 0.12)) / 5,
        ty,
        0.03,
        transom - 0.1,
        0.065,
        0.025,
        white,
      );
    D(x, ty, full - 0.12, 0.03, 0.065, 0.025, white);
    const lintelTop = t0 + 0.09 + transom + 0.3;
    D(x, lintelTop - 0.15, full + 0.3, 0.3, 0.04, 0.12, dressing);
    // Carriage lantern standing on the lintel.
    D(x, lintelTop + 0.05, 0.1, 0.1, 0.1, 0.18, dark);
    D(x, lintelTop + 0.27, 0.2, 0.32, 0.16, 0.2, dark);
    D(
      x,
      lintelTop + 0.27,
      0.16,
      0.26,
      0.16,
      0.21,
      kit.mat('bridgeLanternGlow', '#e4c47f'),
    );
    D(x, lintelTop + 0.46, 0.26, 0.05, 0.16, 0.26, dark);
    // Pots: No.3 has two black glazed planters (photo); the others keep their
    // potted topiary.
    for (const side of [-1, 1]) {
      const px = x + side * 1.04,
        pz = south(px) + 0.4;
      if (bay === 3) {
        const pot = new T.CylinderGeometry(0.22, 0.2, 0.4, 28);
        pot.translate(px, base + 0.2, pz);
        batch(pot, kit.mat('bridgeBlackGlaze', '#101112', 0.15));
        const lip = new T.CylinderGeometry(0.235, 0.235, 0.05, 28);
        lip.translate(px, base + 0.385, pz);
        batch(lip, kit.mat('bridgeBlackGlaze', '#101112', 0.15));
        const inside = new T.CircleGeometry(0.2, 24);
        inside.rotateX(-Math.PI / 2);
        inside.translate(px, base + 0.33, pz);
        batch(inside, kit.mat('bridgePotInside', '#3a2c22'));
      } else topiary(px, base, south(px) + 0.87, bay * 2 + side, false);
    }
  }
  // 7 October photos along the frontage from No.3: extra pots in the gaps
  // between the light wells and the doorway topiary. Two blue glazed pots
  // west of No.3's west well; a dark green planter with a young tree east of
  // its east well; pink hydrangeas in pots either side of Nos.2 and 1.
  // Positions scaled from the views; plants and sizes estimated.
  {
    let seed = 6113;
    const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const leafy = [
      kit.mat('frontPotLeaf1', '#3f5c2e', 0.9),
      kit.mat('frontPotLeaf2', '#527037', 0.9),
    ];
    for (const m of leafy) m.side = T.DoubleSide;
    const bloom = [
      kit.mat('hydrangeaPink', '#c97a9a', 0.9),
      kit.mat('hydrangeaMauve', '#a87fae', 0.9),
    ];
    const earth = kit.mat('frontPotEarth', '#3b3226');
    const foliage = (
      x: number,
      z: number,
      y: number,
      rad: number,
      h: number,
      flowers: boolean,
    ) => {
      for (let i = 0; i < 260; i++) {
        const a = r() * Math.PI * 2,
          d = Math.sqrt(r()) * rad;
        const g = new T.PlaneGeometry(0.07, 0.055);
        g.rotateX((r() - 0.5) * 2);
        g.rotateY(r() * 6.28);
        g.translate(x + Math.cos(a) * d, y + r() * h, z + Math.sin(a) * d);
        batch(g, leafy[i % 2]);
      }
      if (flowers)
        for (let k = 0; k < 7; k++) {
          const a = r() * Math.PI * 2,
            d = r() * rad * 0.8;
          const head = new T.IcosahedronGeometry(0.09 + r() * 0.04, 1);
          head.translate(
            x + Math.cos(a) * d,
            y + h * (0.7 + r() * 0.35),
            z + Math.sin(a) * d,
          );
          batch(head, bloom[k % 2]);
        }
    };
    const pot = (
      x: number,
      out: number,
      rad: number,
      h: number,
      colour: string,
      plant: 'hydrangea' | 'shrub' | 'none',
    ) => {
      const m = kit.mat(`frontPot${colour}`, colour, 0.35);
      const z = faceZ(x) + out;
      const body = new T.CylinderGeometry(rad, rad * 0.75, h, 20);
      body.translate(x, base + h / 2, z);
      batch(body, m);
      const rim = new T.TorusGeometry(rad, 0.02, 5, 20);
      rim.rotateX(Math.PI / 2);
      rim.translate(x, base + h, z);
      batch(rim, m);
      const soil = new T.CircleGeometry(rad - 0.02, 16);
      soil.rotateX(-Math.PI / 2);
      soil.translate(x, base + h - 0.04, z);
      batch(soil, earth);
      if (plant !== 'none')
        foliage(
          x,
          z,
          base + h - 0.03,
          rad * 1.5,
          plant === 'hydrangea' ? 0.55 : 0.4,
          plant === 'hydrangea',
        );
    };
    pot(84.35, 0.32, 0.2, 0.34, '#24508f', 'shrub');
    pot(84.75, 0.55, 0.16, 0.28, '#2c5c9c', 'none');
    // Dark green planter with a young multi-stem tree.
    {
      const x = 93.8,
        z = faceZ(x) + 0.42;
      const planter = kit.mat('frontPlanterGreen', '#2f4436', 0.6);
      box(x, base + 0.27, z, 0.75, 0.54, 0.45, planter, -FACE_ROT);
      foliage(x, z, base + 0.5, 0.35, 0.35, false);
      const bark = kit.mat('frontTreeBark', '#5b4f40');
      for (let k = 0; k < 3; k++) {
        const top = new T.Vector3(
          x + (r() - 0.5) * 0.5,
          base + 1.6 + r() * 0.5,
          z + (r() - 0.5) * 0.3,
        );
        kit.beam(new T.Vector3(x, base + 0.5, z), top, 0.03, 0.03, bark);
        foliage(top.x, top.z, top.y - 0.35, 0.35, 0.5, false);
      }
    }
    pot(96.85, 0.38, 0.22, 0.38, '#7d8285', 'hydrangea');
    pot(97.3, 0.62, 0.17, 0.3, '#d8d2c2', 'hydrangea');
    pot(99.95, 0.4, 0.22, 0.4, '#3c4a52', 'hydrangea');
    pot(103.2, 0.38, 0.2, 0.36, '#7d8285', 'hydrangea');
  }
  // No.3's downpipe runs east of its window into the light well (user photos).
  for (const x of [77.8, 92.96, 104.4]) {
    B(x, 3.6, 0.075, 7.3, 0.075, dark, 0.22);
    B(x, 7.1, 0.12, 0.12, 0.28, dark, 0.22);
  }
  // Green-grey weathering low on the front and rear walls (No.3 photos).
  const wash = bridgeMossWash(kit);
  const washWall = (
    x0: number,
    x1: number,
    z0: number,
    slope: number,
    y0: number,
    h: number,
    facing: 1 | -1,
  ) => {
    const len = (x1 - x0) * Math.hypot(1, slope);
    const g = new T.PlaneGeometry(len, h);
    const uv = g.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) * len) / 2.4);
    if (facing < 0) g.rotateY(Math.PI);
    g.rotateY(-Math.atan(slope));
    const xm = (x0 + x1) / 2;
    g.translate(xm, y0 + h / 2, z0 + (xm - x0) * slope + facing * 0.012);
    batch(g, wash);
  };
  {
    const [n0, n1] = [BRIDGE_MILL_FOOTPRINT[0], BRIDGE_MILL_FOOTPRINT[1]];
    washWall(FA[0], FB[0], FA[1], FACE_SLOPE, base, 1.3, 1);
    washWall(
      n0[0],
      n1[0],
      n0[1],
      (n1[1] - n0[1]) / (n1[0] - n0[0]),
      base - 2.8,
      1.0,
      -1,
    );
  }
  // Setts, No.3 photos (7 October 2026, front door looking left, right and
  // ahead): small domed stones about 0.14m wide and 0.2-0.3m long, laid
  // end-on in staggered lines running from the flags to the retaining wall,
  // with green moss in every joint. Sizes scaled from the door.
  const stones = settMaterials();
  const mossBed = kit.mat('bridgePassageMossBed', '#5a6a2c', 1);
  for (let x = BRIDGE_JUNCTION.x1; x < 109; x += 0.43) {
    const z0 = south(x) + 1.15,
      z1 = passageWallZ(x) - passageSettInset(x);
    box(x, base - 0.07, (z0 + z1) / 2, 0.45, 0.025, z1 - z0, mossBed);
  }
  let seed = 4107;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  /** Low-poly domed sett: straight sides, bevelled shoulders, raised crown. */
  const settGeometry = (w: number, l: number, h: number) => {
    const ring = (inset: number, y: number) => [
      [-w / 2 + inset, y, -l / 2 + inset],
      [w / 2 - inset, y, -l / 2 + inset],
      [w / 2 - inset, y, l / 2 - inset],
      [-w / 2 + inset, y, l / 2 - inset],
    ];
    const r0 = ring(0, 0),
      r1 = ring(0.008, h * 0.62),
      r2 = ring(0.04, h * 0.92),
      crown = [0, h * 1.06, 0];
    const pos: number[] = [];
    const quad = (a: number[], b: number[], c: number[], d: number[]) =>
      pos.push(...a, ...c, ...b, ...a, ...d, ...c);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      quad(r0[i], r0[j], r1[j], r1[i]);
      quad(r1[i], r1[j], r2[j], r2[i]);
      pos.push(...r2[i], ...crown, ...r2[j]);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const uv: number[] = [];
    for (let i = 0; i < pos.length; i += 3)
      uv.push(pos[i] * 3 + 0.5, pos[i + 2] * 3 + 0.5);
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return g;
  };
  for (let x = BRIDGE_JUNCTION.x1; x < 108.9;) {
    const width = 0.13 + random() * 0.035,
      cx = x + width / 2,
      end = passageWallZ(cx) - passageSettInset(cx);
    let z = faceZ(cx) + 1.15 - random() * 0.15;
    while (z < end - 0.08) {
      const len = Math.min(0.2 + random() * 0.12, end - z);
      const g = settGeometry(
        width - 0.02 - random() * 0.01,
        len - 0.02 - random() * 0.012,
        0.075,
      );
      g.rotateY(-FACE_ROT + (random() - 0.5) * 0.05);
      g.translate(cx, base - 0.07 + (random() - 0.5) * 0.006, z + len / 2);
      batch(g, stones[Math.floor(random() * stones.length)]);
      if (random() < 0.3) {
        const patch = new T.PlaneGeometry(
          width * (0.4 + random() * 0.5),
          0.024,
        );
        patch.rotateX(-Math.PI / 2);
        patch.translate(cx, base - 0.012, z + len - 0.006);
        batch(patch, kit.mat('bridgeSettMoss', '#5f6d2c', 1));
      }
      z += len;
    }
    x += width;
  }
  for (let x = BRIDGE_JUNCTION.x1 + 0.3; x < 108; x += 0.65) {
    // Flags stop at the light wells' railings.
    const well = lightWells.some((w) => Math.abs(x - w) < LIGHT_WELL.width / 2);
    const z0 = well ? LIGHT_WELL.depth + 0.05 : 0.1;
    box(
      x,
      base - 0.06,
      south(x) + (z0 + 1.2) / 2,
      0.62,
      0.12,
      1.2 - z0,
      stones[Math.floor(x) % 7],
      -0.041,
    );
  }
  // User frontage photos: a hoop-railed basement light well in front of each
  // window bay, none beside the doors. Well size and depth estimated.
  const rubble = kit.mat('bridgeLightWellRubble', '#8b8672');
  rubble.map = stone.map;
  const wellFlags = kit.mat('bridgeLightWellFloor', '#6d6a5e');
  const rot = -0.041;
  for (const x of lightWells) {
    const w = LIGHT_WELL.width / 2,
      d = LIGHT_WELL.depth,
      h = LIGHT_WELL.floor,
      z = south(x),
      corners: P[] = [
        [x - w, south(x - w) + 0.02],
        [x - w, south(x - w) + d],
        [x + w, south(x + w) + d],
        [x + w, south(x + w) + 0.02],
      ];
    // Rubble side and outer walls, coping slabs, flagged floor.
    for (const side of [-1, 1])
      box(
        x + side * (w + 0.08),
        base - h / 2,
        z + d / 2,
        0.16,
        h,
        d,
        rubble,
        rot,
      );
    box(x, base - h / 2, z + d + 0.08, w * 2 + 0.32, h, 0.16, rubble, rot);
    for (const side of [-1, 1])
      box(
        x + side * (w + 0.12),
        base - 0.04,
        z + d / 2,
        0.26,
        0.09,
        d + 0.1,
        stone,
        rot,
      );
    box(x, base - 0.04, z + d + 0.12, w * 2 + 0.5, 0.09, 0.26, stone, rot);
    box(x, base - h - 0.04, z + d / 2, w * 2, 0.08, d, wellFlags, rot);
    // Tall white multi-pane basement window and a downpipe in the corner.
    const sill = base - h + 0.35,
      top = base - 0.5,
      mid = (sill + top) / 2,
      wh = top - sill;
    box(x, mid, z + 0.03, 1.36, wh + 0.1, 0.08, white, rot);
    box(x, mid, z + 0.06, 1.22, wh - 0.06, 0.04, glass, rot);
    for (const dx of [-0.2, 0.2])
      box(x + dx, mid, z + 0.09, 0.035, wh - 0.06, 0.03, white, rot);
    for (let r = 1; r < 6; r++)
      box(x, sill + (r * wh) / 6, z + 0.09, 1.22, 0.035, 0.03, white, rot);
    // Only No.3's well (its window bay, east of the door) has the downpipe.
    if (x === NO3_WELL)
      box(x + w - 0.12, base - h / 2, z + 0.1, 0.1, h, 0.1, dark, rot);
    for (let i = 1; i < corners.length; i++)
      hoopRailing(kit, corners[i - 1], corners[i], base);
    wells.push(corners);
  }
  // Setts turn round the west end on the court's slope: in front of the engine
  // house, round No.5's door and along the road wall, meeting the asphalt.
  for (let x = 70.2; x < 78.8; x += 0.45)
    for (let z = 9.15; z < 28; z += 0.3)
      if (junction.inside(x, z))
        box(
          x,
          junction.y(x, z) - 0.1,
          z,
          0.42,
          0.12,
          0.27,
          stones[Math.floor(x + z) % 7],
        );
  return wells;
}

/** No.5's panelled red door on the west wall, with stone surround, transom,
 * step and lantern. Panel layout follows the frontage doors; estimated. */
export function addBridgeNo5Door(kit: Kit, base: number) {
  const D = BRIDGE_NO5_DOOR;
  const { stone, glass, dark } = kit.m;
  const red = kit.mat('bridgeNo5Door', '#8a2424', 0.55);
  const white = kit.mat('bridgeNo5Frame', '#eeeae0', 0.72);
  const dx = D.wallB[0] - D.wallA[0],
    dz = D.wallB[1] - D.wallA[1],
    len = Math.hypot(dx, dz),
    rot = Math.atan2(dx, dz),
    t = (D.wallA[1] - D.z) / (D.wallA[1] - D.wallB[1]),
    // Outward (west) normal of the wall.
    nx = dz / len,
    nz = -dx / len;
  const at = (out: number) =>
    [D.wallA[0] + dx * t + nx * out, D.wallA[1] + dz * t + nz * out] as const;
  const B = (
    out: number,
    y: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = at(out);
    kit.box(x, base + y, z, d, h, w, m, rot);
  };
  B(0.05, 1.3, 1.7, 2.75, 0.14, stone);
  B(0.1, 1.08, 1.12, 2.16, 0.1, white);
  B(0.14, 1.06, 0.94, 2.06, 0.06, red);
  for (const y of [0.45, 1.5]) B(0.18, y, 0.7, 0.03, 0.02, white);
  B(0.12, 2.42, 1.12, 0.44, 0.08, white);
  B(0.15, 2.42, 0.94, 0.32, 0.04, glass);
  B(0.12, 2.82, 1.5, 0.22, 0.2, stone);
  B(0.3, -0.03, 1.4, 0.12, 0.5, stone);
  B(0.2, 3.15, 0.16, 0.3, 0.16, dark);
}

// Original OSM western projection, retained separately from the main mill volume.
// Historic England identifies this as a former boiler house; roof height is estimated.
export function addBridgeEngineHouse(kit: Kit, base: number) {
  const { box, batch } = kit;
  const { stone, dark, glass } = kit.m;
  const p: P[] = [
    [75.61, 11.34],
    [78.7, 11.48],
    [78.46, 17.01],
    [75.38, 16.86],
  ];
  const floor = base - 0.55,
    eave = floor + 3.2;
  const shape = new T.Shape(p.map((q) => new T.Vector2(q[0], -q[1])));
  const body = new T.ExtrudeGeometry(shape, {
    depth: 6.25,
    bevelEnabled: false,
  });
  body.rotateX(-Math.PI / 2);
  body.translate(0, base - 3.6, 0);
  const walling = bridgeStone(kit);
  batch(body, walling);
  const roof = new T.BufferGeometry();
  roof.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [
        75.35,
        eave,
        11.1,
        78.95,
        eave,
        11.25,
        75.08,
        eave,
        17.08,
        78.72,
        eave,
        17.25,
        75.22,
        eave + 1.25,
        14.1,
        78.84,
        eave + 1.25,
        14.25,
      ],
      3,
    ),
  );
  roof.setIndex([0, 1, 5, 0, 5, 4, 2, 4, 5, 2, 5, 3]);
  roof.computeVertexNormals();
  roofUV(roof);
  batch(roof, slateMaterial());
  const gable = new T.BufferGeometry();
  gable.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [75.61, eave, 11.34, 75.38, eave, 16.86, 75.5, eave + 1.25, 14.1],
      3,
    ),
  );
  gable.setAttribute(
    'uv',
    new T.Float32BufferAttribute([0, 0, 2.76, 0, 1.38, 0.625], 2),
  );
  gable.computeVertexNormals();
  batch(gable, walling);
  const white = new T.MeshStandardMaterial({
    color: '#e2e2d8',
    roughness: 0.8,
  });
  for (const x of [76.3, 77.65]) {
    const z = 11.34 + (x - 75.61) * 0.045;
    box(x, floor + 1.64, z, 1.02, 2.15, 0.13, white, -0.045);
    box(x, floor + 1.64, z - 0.09, 0.86, 1.98, 0.06, glass, -0.045);
    for (const dx of [-0.21, 0, 0.21])
      box(x + dx, floor + 1.64, z - 0.14, 0.025, 1.98, 0.035, white);
    for (let j = -2; j <= 2; j++)
      box(x, floor + 1.64 + j * 0.33, z - 0.14, 0.87, 0.025, 0.035, white);
    box(x, floor + 0.51, z, 1.14, 0.13, 0.34, stone);
  }
  box(77, eave, 11.3, 3.55, 0.12, 0.14, dark, -0.045);
  box(75.65, floor + 1.6, 11.33, 0.08, 3.2, 0.08, dark);
  return p;
}
