import { slateMaterial, roofUV } from '../materials/building-surfaces';
import { createPottedTopiary } from '../vegetation/potted-topiary';
import { settMaterials } from '../materials/sett-material';
import { passageWallZ } from './bridge-passage';
import * as T from 'three';
import type { Kit } from '../core/kit';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
type P = [number, number];
export function addBridgeFront(kit: Kit, base: number) {
  const { box, batch } = kit;
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
  const doorColours = ['#274c70', '#503447', '#164d38', '#273b52', '#344d43'];
  for (let bay = 0; bay < 9; bay++) {
    const x = 79.7 + bay * 3.12;
    sash(x, 5.05);
    if (bay % 2) {
      sash(x, 1.54);
      continue;
    }
    const door = new T.MeshStandardMaterial({
      color: doorColours[bay / 2],
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
    // Small front gates and potted topiary flank each entrance.
    for (const side of [-1, 1]) {
      const px = x + side * 1.04,
        pz = south(px) + 0.87;
      topiary(px, base, pz, bay * 2 + side, bay === 4);
      for (let n = 0; n < 5; n++)
        box(
          px,
          base + 0.53,
          south(px) + 0.23 + n * 0.22,
          0.025,
          1.02,
          0.025,
          dark,
        );
      for (const y of [0.22, 0.85])
        box(px, base + y, south(px) + 0.67, 0.035, 0.035, 1.05, dark);
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
  for (const x of [77.8, 90.8, 104.4]) {
    B(x, 3.6, 0.075, 7.3, 0.075, dark, 0.22);
    B(x, 7.1, 0.12, 0.12, 0.28, dark, 0.22);
  }
  // Individual flags at the doorstep; irregular setts fill the shared passage.
  const stones = settMaterials();
  const joints = new T.MeshStandardMaterial({ color: '#454638', roughness: 1 });
  for (let x = 74; x < 109; x += 0.43) {
    const z0 = south(x) + 1.15,
      z1 = passageWallZ(x) - 0.7;
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
  for (let x = 74; x < 108.9;) {
    const width = 0.23 + random() * 0.07,
      cx = x + width / 2,
      start = south(cx) + 1.2,
      end = passageWallZ(cx) - 0.76;
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
  for (let x = 75; x < 108; x += 0.65)
    box(
      x,
      base - 0.06,
      south(x) + 0.65,
      0.62,
      0.12,
      1.1,
      stones[Math.floor(x) % 7],
      -0.041,
    );
  // The passage turns around the western end to the garage court.
  for (let x = 72; x < 76; x += 0.45)
    for (let z = 12; z < 27; z += 0.3)
      box(x, base - 0.1, z, 0.42, 0.12, 0.27, stones[Math.floor(x + z) % 7]);
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
