import { passageWallZ } from './bridge-passage';
import { PASSAGE_BED } from '../world/layout';
import * as T from 'three';
import type { Kit } from '../core/kit';

// Planting is interpreted from the supplied passage photos and brook-side reference.
// These are small borders and lawns, not surveyed property boundaries.
export function addBridgeGardens(
  kit: Kit,
  {
    leaf,
    terrain,
    passageY,
  }: {
    leaf: T.Material;
    terrain: (x: number, z: number) => number;
    passageY: number;
  },
) {
  const { box, batch } = kit;
  const { stone, dark } = kit.m;
  const earth = new T.MeshStandardMaterial({ color: '#494637', roughness: 1 });
  const grass = new T.MeshStandardMaterial({ color: '#637449', roughness: 1 });
  const petals = ['#c391a6', '#e4d7bf', '#b3a4bd'].map(
    (color) => new T.MeshStandardMaterial({ color, roughness: 0.9 }),
  );
  function patch(
    x: number,
    z: number,
    w: number,
    d: number,
    m: T.Material,
    floor: (x: number, z: number) => number,
  ) {
    const g = new T.PlaneGeometry(w, d, 8, 4);
    g.rotateX(-Math.PI / 2);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const px = x + p.getX(i),
        pz = z + p.getZ(i);
      p.setXYZ(i, px, floor(px, pz) + 0.035, pz);
    }
    g.computeVertexNormals();
    batch(g, m);
  }
  function shrub(x: number, z: number, h: number, y: number, flowers = false) {
    let seed = (Math.round(x * 103 + z * 211) + 94031) >>> 0;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let k = 0; k < 4; k++) {
      const g = new T.CylinderGeometry(0.008, 0.018, h * 0.6, 5);
      g.rotateZ((rand() - 0.5) * 0.65);
      g.translate(
        x + (rand() - 0.5) * h * 0.2,
        y + h * 0.3,
        z + (rand() - 0.5) * h * 0.2,
      );
      batch(g, dark);
    }
    for (let k = 0; k < 48; k++) {
      const a = rand() * Math.PI * 2,
        level = rand(),
        r =
          Math.sqrt(rand()) *
          h *
          0.42 *
          Math.sqrt(1 - Math.pow(level - 0.35, 2));
      const px = x + Math.sin(a) * r,
        pz = z + Math.cos(a) * r,
        py = y + 0.08 + level * h * 0.8;
      const size = 0.2 + rand() * 0.14,
        g = new T.PlaneGeometry(size, size);
      g.rotateX((rand() - 0.5) * 1.2);
      g.rotateY(a);
      g.rotateZ((rand() - 0.5) * 0.7);
      g.translate(px, py, pz);
      batch(g, leaf);
      if (flowers && k % 9 === 0) {
        for (let j = 0; j < 4; j++) {
          const f = new T.SphereGeometry(0.025, 5, 3);
          f.scale(1, 0.5, 1);
          f.translate(
            px + Math.sin(j * 2.4) * 0.035,
            py + 0.04,
            pz + Math.cos(j * 2.4) * 0.035,
          );
          batch(f, petals[k % 3]);
        }
      }
    }
  }
  // M06: one raised dry-stone bed at the wall foot opposite Nos.3-4 (user
  // passage photos); elsewhere the setts run to the wall with pots.
  const B = PASSAGE_BED;
  const bedStone = kit.mat('passageBedStone', '#66665a');
  bedStone.map = stone.map;
  const rot = (x: number) =>
    -Math.atan((passageWallZ(x + 0.1) - passageWallZ(x - 0.1)) / 0.2);
  for (let x = B.x0 + 0.3; x < B.x1; x += 0.6) {
    const back = passageWallZ(x),
      front = back - B.depth;
    box(
      x,
      passageY + B.height / 2,
      front + 0.2,
      0.6,
      B.height,
      0.4,
      bedStone,
      rot(x),
    );
    box(
      x,
      passageY + B.height + 0.04,
      front + 0.2,
      0.62,
      0.09,
      0.46,
      stone,
      rot(x),
    );
    patch(
      x,
      (front + back) / 2 + 0.2,
      0.6,
      B.depth - 0.4,
      earth,
      () => passageY + B.height - 0.05,
    );
    if (Math.floor(x * 10) % 3 !== 0)
      shrub(
        x,
        (front + back) / 2 + 0.15,
        0.7 + (Math.sin(x * 1.3) * 0.5 + 0.5) * 0.6,
        passageY + B.height - 0.05,
        Math.floor(x) % 3 === 0,
      );
  }
  for (const x of [B.x0, B.x1]) {
    const back = passageWallZ(x);
    box(
      x,
      passageY + B.height / 2,
      back - B.depth / 2,
      0.4,
      B.height,
      B.depth,
      bedStone,
      rot(x),
    );
  }
  // IMG_9029: weathered square trellis and clustered glazed pots against the wall.
  // Location and dimensions are interpreted; keep all additions within the existing border.
  const timber = new T.MeshStandardMaterial({ color: '#777260', roughness: 1 });
  const potMaterials = ['#244c83', '#999589', '#77513d', '#35574a'].map(
    (color) => new T.MeshStandardMaterial({ color, roughness: 0.48 }),
  );
  const tx = 103.3,
    tz = passageWallZ(tx) - 0.34;
  for (let i = 0; i < 8; i++)
    box(tx - 1.05 + i * 0.3, passageY + 1.45, tz, 0.045, 1.95, 0.055, timber);
  for (let i = 0; i < 7; i++)
    box(tx, passageY + 0.5 + i * 0.3, tz - 0.025, 2.16, 0.045, 0.045, timber);
  for (let i = 0; i < 24; i++) {
    const x = tx - 1 + ((i * 7) % 23) / 11,
      z = tz - 0.08;
    const g = new T.PlaneGeometry(0.31, 0.37);
    g.rotateY(Math.sin(i) * 0.35);
    g.rotateZ(Math.sin(i * 2) * 0.4);
    g.translate(x, passageY + 0.65 + i * 0.065, z);
    batch(g, leaf);
  }
  for (const [i, x] of [101.8, 102.5, 103.2, 104, 104.65].entries()) {
    const z = passageWallZ(x) - 0.73,
      h = 0.4 + (i % 3) * 0.08,
      r = 0.23 + (i % 2) * 0.055;
    const pot = new T.CylinderGeometry(r, r * 0.7, h, 12, 1, true);
    pot.translate(x, passageY + h / 2, z);
    batch(pot, potMaterials[i % 4]);
    const rim = new T.TorusGeometry(r, 0.025, 5, 12);
    rim.rotateX(Math.PI / 2);
    rim.translate(x, passageY + h, z);
    batch(rim, potMaterials[i % 4]);
    const soil = new T.CircleGeometry(r - 0.025, 12);
    soil.rotateX(-Math.PI / 2);
    soil.translate(x, passageY + h - 0.04, z);
    batch(soil, earth);
    shrub(x, z, 0.65 + (i % 2) * 0.2, passageY + h - 0.03, true);
  }
  // Frontage photos show light wells and pots at the window bays, not beds.
  // Approximate visible garden edges traced from north-up Google aerial imagery.
  // Roof corners anchor the trace; the mapped riverside path remains outside it.
  // These are landscape outlines, not surveyed ownership boundaries.
  const plots: number[][][] = [
    [
      [70, -5.5],
      [83, -6],
      [83, 9.6],
      [78.8, 9.4],
      [78.8, 0],
      // Below the court rockery and east shrubs (UP-003).
      [76.4, -0.4],
      [75.4, -2.8],
      [70, -2.35],
    ],
    [
      [83, -6],
      [88.7, -6.5],
      [88.7, 9.85],
      [83, 9.6],
    ],
    [
      [88.7, -6.5],
      [94, -6.1],
      [94, 10.07],
      [88.7, 9.85],
    ],
    [
      [94, -6.1],
      [100.3, -5.7],
      [100.3, 10.33],
      [94, 10.07],
    ],
    [
      [100.3, -5.7],
      [111.5, -4.3],
      [113.1, -1.8],
      [113.4, 10.8],
      [100.3, 10.33],
    ],
  ];
  function lawn(points: number[][]) {
    const contour = points.map(([x, z]) => new T.Vector2(x, z));
    const triangles = T.ShapeUtils.triangulateShape(contour, []),
      positions: number[] = [];
    // Subdivide each triangle so lawns follow the same sampled terrain as movement.
    function triangle(a: number[], b: number[], c: number[], depth: number) {
      if (depth) {
        const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
          bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2],
          ca = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
        triangle(a, ab, ca, depth - 1);
        triangle(ab, b, bc, depth - 1);
        triangle(ca, bc, c, depth - 1);
        triangle(ab, bc, ca, depth - 1);
        return;
      }
      for (const [x, z] of [a, c, b])
        positions.push(x, terrain(x, z) + 0.055, z);
    }
    for (const [a, b, c] of triangles)
      triangle(points[a], points[b], points[c], 3);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    batch(g, grass);
  }
  for (const plot of plots) lawn(plot);
  // Divisions and brook-end gates are in bridge-garden-fences.ts; the eastern
  // clipped hedge and gate-side bed are in bridge-gate-planting.ts.
  // Rear patios and solid dividers are modelled in bridge-rear.ts from IMG_8274.
}

/** Front and ends of the raised passage bed, for collision. */
export function passageBedWalls() {
  const B = PASSAGE_BED;
  const a: [number, number] = [B.x0, passageWallZ(B.x0) - B.depth],
    b: [number, number] = [B.x1, passageWallZ(B.x1) - B.depth];
  return [
    { a, b },
    { a, b: [B.x0, passageWallZ(B.x0)] as [number, number] },
    { a: b, b: [B.x1, passageWallZ(B.x1)] as [number, number] },
  ];
}
