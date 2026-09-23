import { slateMaterial, roofUV } from '../materials/building-surfaces';
import * as T from 'three';
import type { Kit } from '../core/kit';
export const courtHouseLocal = (x: number, z: number) => [
  (x - 40.42) * 0.997 - (z - 7.45) * 0.079,
  (x - 40.42) * 0.079 + (z - 7.45) * 0.997,
];
export const courtDoorPositions = [1.7, 14.1, 22.0];
export function courtHouseGround(
  x: number,
  z: number,
  entry: number,
): number | undefined {
  const [u, v] = courtHouseLocal(x, z);
  if (u < 0 || u > 23.6 || v < 0 || v > 3.05) return;
  return courtDoorPositions.some((d) => Math.abs(u - d) < 0.62)
    ? entry
    : entry - 2.35;
}
// Three attached homes opposite the garages. User confirms three storeys and door bridges.
// June 2024 Eagley Way panorama informs visible upper windows and entrance arrangement.
export function addCourtHouses(kit: Kit, entry: number) {
  const { box, batch } = kit;
  const { stone, trim, dark, glass } = kit.m;
  const base = entry - 2.7,
    rot = Math.atan2(0.079, 0.997),
    world = (u: number, v: number) => [
      40.42 + u * 0.997 + v * 0.079,
      7.45 - u * 0.079 + v * 0.997,
    ];
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = world(u, v);
    if (m === stone) {
      const g = new T.BoxGeometry(w, h, d),
        p = g.getAttribute('position'),
        n = g.getAttribute('normal'),
        uv = g.getAttribute('uv');
      for (let i = 0; i < p.count; i++)
        uv.setXY(
          i,
          (Math.abs(n.getX(i)) > 0.5 ? p.getZ(i) : p.getX(i)) / 2,
          (Math.abs(n.getY(i)) > 0.5 ? p.getZ(i) : p.getY(i)) / 2,
        );
      g.rotateY(rot);
      g.translate(x, y, z);
      batch(g, m);
    } else box(x, y, z, w, h, d, m, rot);
  };
  B(11.8, base + 4.1, -3.88, 23.6, 8.2, 7.76, stone);
  const roof = new T.BufferGeometry(),
    verts = [
      -0.25, 0, 0.25, 23.85, 0, 0.25, 3.6, 1.65, -3.88, 20, 1.65, -3.88, -0.25,
      0, -8.01, 23.85, 0, -8.01,
    ],
    p: number[] = [];
  for (let i = 0; i < verts.length; i += 3) {
    const [x, z] = world(verts[i], verts[i + 2]);
    p.push(x, base + 8.2 + verts[i + 1], z);
  }
  roof.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  roof.setIndex([0, 2, 3, 0, 3, 1, 4, 5, 3, 4, 3, 2, 0, 4, 2, 1, 3, 5]);
  roof.computeVertexNormals();
  roofUV(roof);
  batch(roof, slateMaterial());
  function window(u: number, y: number, v: number, w = 1.05) {
    const outward = v < 0 ? -1 : 1;
    B(u, y, v, w + 0.18, 1.45, 0.16, trim);
    B(u, y, v + outward * 0.09, w, 1.29, 0.12, glass);
    B(u, y, v + outward * 0.17, 0.055, 1.3, 0.05, trim);
    B(u, y + 0.12, v + outward * 0.17, w, 0.045, 0.05, trim);
    B(u, y - 0.8, v, w + 0.3, 0.14, 0.3, stone);
  }
  const bays = [1.7, 3.65, 6.05, 8.95, 11.35, 14.1, 17.0, 19.5, 22.0];
  for (const u of bays) {
    window(u, entry + 4.05, 0.08, courtDoorPositions.includes(u) ? 0.7 : 1.05);
    if (!courtDoorPositions.includes(u)) window(u, entry + 1.35, 0.08);
    window(u, base + 1.35, 0.08);
  }
  // Rear openings are provisional pending a closer view.
  for (const u of [2, 5.7, 9.9, 13.6, 17.8, 21.5])
    for (const y of [base + 1.35, entry + 1.35, entry + 4.05])
      window(u, y, -7.9);
  const door = new T.MeshStandardMaterial({
    color: '#313343',
    roughness: 0.75,
  });
  for (const u of courtDoorPositions) {
    B(u, entry + 1.04, 0.15, 0.9, 2.08, 0.16, door);
    B(u, entry + 2.18, 0.12, 1.1, 0.18, 0.2, stone);
    B(u + 0.28, entry + 1.03, 0.26, 0.045, 0.12, 0.05, trim);
    B(u, entry - 0.11, 1.5, 1.2, 0.22, 3.0, stone);
    for (const side of [-1, 1]) {
      for (let k = 0; k < 10; k++)
        B(
          u + side * 0.59,
          entry + 0.55,
          0.15 + k * 0.3,
          0.025,
          1.1,
          0.025,
          dark,
        );
      for (const y of [0.24, 0.98])
        B(u + side * 0.59, entry + y, 1.5, 0.045, 0.045, 3, dark);
    }
  }
  // Retain the sunken strip, leaving one crossing to each entrance.
  for (let u = 0.2; u < 23.5; u += 0.4) {
    if (courtDoorPositions.some((d) => Math.abs(u - d) < 0.8)) continue;
    B(u, entry - 1.15, 3.1, 0.42, 2.3, 0.28, stone);
    B(u, entry + 0.03, 3.1, 0.43, 0.13, 0.36, stone);
    B(u, entry + 0.52, 3.1, 0.025, 1, 0.025, dark);
    B(u, entry + 0.98, 3.1, 0.43, 0.035, 0.04, dark);
  }
  for (const u of [0, 7.86, 15.72, 23.6])
    B(u, entry + 2.7, 0.18, 0.075, 5.4, 0.075, dark);
}
