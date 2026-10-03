import { slateMaterial, roofUV } from '../materials/building-surfaces';
import { createPottedTopiary } from '../vegetation/potted-topiary';
import { settMaterials } from '../materials/sett-material';
import { passageWallZ } from './bridge-passage';
import {
  BRIDGE_JUNCTION,
  BRIDGE_NO5_DOOR,
  passageSettInset,
} from '../world/layout';
import { hoopRailing } from './garden-fences';
import * as T from 'three';
import type { Kit } from '../core/kit';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
type P = [number, number];

/** User photos: a deep basement light well in front of each window bay
 * (even bays), with rubble walls, coping, a flagged floor and a tall
 * multi-pane window. Width, projection and depth estimated. */
const lightWells = [0, 2, 4, 6, 8].map((bay) => 79.7 + bay * 3.12);
const LIGHT_WELL = { width: 1.8, depth: 0.75, floor: 2.5 };
const NO3_WELL = lightWells[2];
const frontZ = (x: number) => 19.55 + (x - 80) * 0.041;
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
  const { stone, trim, dark, glass } = kit.m;
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
  function sash(x: number, y: number) {
    B(x, y, 1.53, 2.24, 0.16, dark, 0.04);
    B(x, y, 1.43, 2.14, 0.15, white, 0.13);
    B(x, y, 1.29, 1.98, 0.16, glass, 0.22);
    for (let c = -1; c <= 1; c++)
      B(x + c * 0.32, y, 0.035, 1.98, 0.035, white, 0.32);
    for (let r = -2; r <= 2; r++)
      B(x, y + r * 0.33, 1.29, 0.032, 0.035, white, 0.32);
    B(x, y, 1.38, 0.065, 0.05, white, 0.35);
    B(x, y - 1.18, 1.75, 0.13, 0.43, stone, 0.16);
    B(x, y + 1.23, 1.8, 0.25, 0.18, stone, 0.08);
  }
  // User frontage photos from No.3: four doors on odd bays, windows at both
  // ends. No.5 (west) has its red door on the side. West to east: No.4
  // plum, No.3 green, No.2 navy, No.1 dark grey. Shades matched by eye.
  const doorColours = ['#5a2a45', '#173f30', '#1f2850', '#34383c'];
  for (let bay = 0; bay < 9; bay++) {
    const x = 79.7 + bay * 3.12;
    sash(x, 5.05);
    if (bay % 2 === 0) {
      sash(x, 1.54);
      continue;
    }
    const door = new T.MeshStandardMaterial({
      color: doorColours[(bay - 1) / 2],
      roughness: 0.55,
    });
    B(x, 1.15, 1.72, 2.38, 0.2, white, 0.12);
    B(x, 1.15, 1.22, 2.22, 0.18, door, 0.24);
    for (const side of [-1, 1]) {
      B(x + side * 0.74, 1.16, 0.22, 2.3, 0.08, white, 0.26);
      for (const [y, h] of [
        [0.24, 0.3],
        [1.1, 1.22],
        [2.02, 0.27],
      ]) {
        B(x + side * 0.74, y, 0.17, h, 0.035, trim, 0.32);
        B(x + side * 0.74, y, 0.125, h - 0.055, 0.025, white, 0.35);
      }
      for (const [y, h] of [
        [0.43, 0.58],
        [1.24, 0.67],
        [1.96, 0.3],
      ])
        B(x + side * 0.3, y, 0.48, h, 0.05, door, 0.36);
    }
    B(x, 2.73, 1.66, 0.86, 0.17, white, 0.16);
    B(x, 2.73, 1.5, 0.72, 0.17, glass, 0.26);
    for (const c of [-1.5, -0.5, 0.5, 1.5])
      B(x + c * 0.3, 2.73, 0.026, 0.72, 0.035, white, 0.36);
    B(x, 2.73, 1.5, 0.025, 0.035, white, 0.36);
    B(x, 3.28, 1.96, 0.3, 0.2, stone, 0.13);
    B(x, 0.72, 0.37, 0.09, 0.045, brass, 0.39);
    B(x + 0.48, 1.04, 0.06, 0.19, 0.04, brass, 0.4);
    B(x, -0.02, 1.98, 0.17, 0.65, stone, 0.34);
    // Potted topiary flanks each entrance.
    for (const side of [-1, 1]) {
      const px = x + side * 1.04,
        pz = south(px) + 0.87;
      topiary(px, base, pz, bay * 2 + side, bay === 3);
    }
    B(x, 3.7, 0.17, 0.32, 0.18, dark, 0.18);
    B(
      x,
      3.7,
      0.12,
      0.22,
      0.17,
      new T.MeshStandardMaterial({
        color: '#e4c47f',
        emissive: '#cf9a43',
        emissiveIntensity: 0.3,
      }),
      0.27,
    );
  }
  // No.3's downpipe runs east of its window into the light well (user photos).
  for (const x of [77.8, 92.96, 104.4]) {
    B(x, 3.6, 0.075, 7.3, 0.075, dark, 0.22);
    B(x, 7.1, 0.12, 0.12, 0.28, dark, 0.22);
  }
  // Individual flags at the doorstep; irregular setts fill the shared passage.
  const stones = settMaterials();
  const joints = new T.MeshStandardMaterial({ color: '#454638', roughness: 1 });
  for (let x = BRIDGE_JUNCTION.x1; x < 109; x += 0.43) {
    const z0 = south(x) + 1.15,
      z1 = passageWallZ(x) - passageSettInset(x);
    box(x, base - 0.1, (z0 + z1) / 2, 0.45, 0.025, z1 - z0, joints);
  }
  // Cross-passage courses, with variable stone lengths and staggered joints.
  // Tops stay within a few millimetres of the existing walking surface.
  let seed = 4107;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const sett = new RoundedBoxGeometry(1, 0.08, 1, 2, 0.013);
  const moss = new T.MeshStandardMaterial({ color: '#4b5231', roughness: 1 });
  let course = 0;
  for (let x = BRIDGE_JUNCTION.x1; x < 108.9;) {
    const width = 0.23 + random() * 0.07,
      cx = x + width / 2,
      start = south(cx) + 1.2,
      end = passageWallZ(cx) - passageSettInset(cx);
    let z = start;
    while (z < end - 0.055) {
      const length = Math.min(
        (z === start && course % 2 ? 0.19 : 0.33) + random() * 0.2,
        end - z,
      );
      const gap = 0.01 + random() * 0.009,
        g = sett.clone();
      g.scale(width - 0.012, 1, length - gap);
      g.rotateY((random() - 0.5) * 0.025);
      g.translate(cx, base - 0.04 + (random() - 0.5) * 0.005, z + length / 2);
      batch(g, stones[Math.floor(random() * stones.length)]);
      if (random() < 0.38) {
        const patch = new T.PlaneGeometry(
          width * (0.35 + random() * 0.5),
          gap * 0.85,
        );
        patch.rotateX(-Math.PI / 2);
        patch.translate(cx, base - 0.025, z + length - gap * 0.4);
        batch(patch, moss);
      }
      z += length;
    }
    x += width;
    course++;
  }
  sett.dispose();
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
  const uv = body.getAttribute('uv');
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
  batch(body, stone);
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
  batch(gable, stone);
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
