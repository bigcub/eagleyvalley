import * as T from 'three';
const length = Math.hypot(48.04, 4.12),
  angle = -Math.atan2(4.12, 48.04);
const point = (u: number, v: number): [number, number] => [
  64.26 + u * Math.cos(angle) + v * Math.sin(angle),
  -26.37 - u * Math.sin(angle) + v * Math.cos(angle),
];
export const brookTerrace = [
  point(0, 0),
  point(length, 0),
  point(length, 2.6),
  point(0, 2.6),
];
// User river views show a continuous raised terrace and dark privacy dividers.
// Width, level and individual patio divisions are interpreted, not surveyed.
export function addBrookTerrace(
  base: number,
  ground: (x: number, z: number) => number,
  box: (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
    rot?: number,
  ) => void,
  batch: (g: T.BufferGeometry, m: T.Material) => void,
  stone: T.Material,
  trim: T.Material,
  dark: T.Material,
) {
  const paving = new T.MeshStandardMaterial({
    color: '#85877c',
    roughness: 0.95,
  });
  const screen = new T.MeshStandardMaterial({
    color: '#3c4b43',
    roughness: 0.87,
    side: T.DoubleSide,
  });
  const b = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = point(u, v);
    box(x, y, z, w, h, d, m, angle);
  };
  for (let u = 0.3; u < length; u += 0.6) {
    const [x, z] = point(u, 2.45),
      bottom = Math.min(ground(x, z) - 0.25, base - 0.4),
      top = base + 0.18;
    b(u, (bottom + top) / 2, 2.45, 0.62, top - bottom, 0.35, stone);
    b(u, top + 0.035, 2.45, 0.62, 0.11, 0.46, trim);
    b(u, base + 0.12, 1.3, 0.62, 0.12, 2.35, paving);
  }
  for (let u = 0; u <= length; u += length / 14) {
    b(u, base + 0.72, 2.45, 0.035, 1.1, 0.035, dark);
  }
  for (const y of [0.35, 1.2])
    b(length / 2, base + y, 2.45, length, 0.04, 0.04, dark);
  for (let u = 0.16; u < length; u += 0.18)
    b(u, base + 0.77, 2.45, 0.018, 0.83, 0.018, dark);
  for (let k = 0; k <= 7; k++) {
    const u = (k * length) / 7;
    // Dividers fall toward the river edge, as visible in the supplied photo.
    const shape = new T.Shape([
      new T.Vector2(0.35, 0),
      new T.Vector2(2.38, 0),
      new T.Vector2(2.38, 0.72),
      new T.Vector2(1.75, 1.35),
      new T.Vector2(0.35, 1.35),
    ]);
    const g = new T.ShapeGeometry(shape);
    g.rotateY(-Math.PI / 2);
    g.rotateY(angle);
    const [x, z] = point(u, 0);
    g.translate(x, base + 0.22, z);
    batch(g, screen);
    for (const v of [0.35, 2.38])
      b(u, base + 0.75, v, 0.055, 1.12, 0.055, dark);
  }
  for (const u of [0, length]) {
    const [x, z] = point(u, 1.3),
      bottom = Math.min(ground(x, z) - 0.25, base - 0.4);
    b(
      u,
      (bottom + base + 0.18) / 2,
      1.3,
      0.32,
      base + 0.18 - bottom,
      2.6,
      stone,
    );
  }
}
