import * as T from 'three';
// Upper-storey segmental heads described in Historic England 1388079.
// Dimensions are interpreted; present-day opening counts remain under review.
export function addBrookUpperWindow(
  x: number,
  y: number,
  z: number,
  rot: number,
  glass: T.Material,
  trim: T.Material,
  brick: T.Material,
  batch: (g: T.BufferGeometry, m: T.Material) => void,
) {
  const w = 1.55,
    h = 2.25,
    rise = 0.23;
  const place = (g: T.BufferGeometry, m: T.Material) => {
    g.rotateY(rot);
    g.translate(x, y, z);
    batch(g, m);
  };
  const box = (
    u: number,
    v: number,
    depth: number,
    ww: number,
    hh: number,
    m: T.Material,
  ) => {
    const g = new T.BoxGeometry(0.36, hh, ww);
    g.translate(depth, v, u);
    place(g, m);
  };
  // Both sides of the thin facade overlay are rendered, matching either polygon winding.
  const shape = new T.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2 - rise);
  for (let k = 1; k <= 16; k++) {
    const u = w / 2 - (w * k) / 16;
    shape.lineTo(u, h / 2 - rise + rise * (1 - Math.pow(u / (w / 2), 2)));
  }
  shape.closePath();
  for (const side of [-1, 1]) {
    const g = new T.ShapeGeometry(shape);
    g.rotateY((side * Math.PI) / 2);
    g.translate(side * 0.15, 0, 0);
    place(g, glass);
  }
  for (const u of [-w / 2, w / 2]) box(u, -rise / 2, 0, 0.055, h - rise, trim);
  box(0, -h / 2, 0, w + 0.16, 0.12, trim);
  for (const u of [-w / 4, 0, w / 4])
    box(u, -rise / 2, 0, 0.035, h - rise, trim);
  for (const v of [-h / 4, 0, h / 4]) box(0, v, 0, w, 0.035, trim);
  for (let k = 0; k < 14; k++) {
    const u = -w / 2 + ((k + 0.5) * w) / 14,
      v = h / 2 - rise + rise * (1 - Math.pow(u / (w / 2), 2));
    box(u, v + 0.045, 0, w / 14 + 0.006, 0.08, trim);
    box(u, v + 0.17, 0, w / 14 - 0.006, 0.16, brick);
  }
}

// June 2024 north elevation: alternating glazed bays and recessed balconies.
// Bay widths, recess depth and floor heights are interpreted from the street view.
export function addBrookNorth(
  base: number,
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
  brick: T.Material,
  trim: T.Material,
  glass: T.Material,
  dark: T.Material,
) {
  const length = 46.34,
    angle = -Math.atan2(3.95, 46.17),
    pitch = length / 14;
  const p = (u: number, v: number): [number, number] => [
    68.36 + u * Math.cos(angle) + v * Math.sin(angle),
    -52.24 - u * Math.sin(angle) + v * Math.cos(angle),
  ];
  const b = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = p(u, v);
    box(x, base + y, z, w, h, d, m, angle);
  };
  const frame = new T.MeshStandardMaterial({
    color: '#515a58',
    roughness: 0.65,
  });
  const shade = new T.MeshStandardMaterial({ color: '#292924', roughness: 1 });
  for (let floor = 0; floor < 5; floor++) {
    const y = floor * 3.6,
      material = floor === 0 ? stone : brick;
    for (let k = 0; k < 14; k++) {
      const u = (k + 0.5) * pitch,
        balcony = k % 2 === 1;
      b(u, y + 1.7, -0.13, 2.35, 2.85, 0.08, balcony ? shade : glass);
      // Projecting masonry reveals leave the dark balcony back behind its rail.
      for (const side of [-1, 1])
        b(u + side * 1.24, y + 1.7, -0.25, 0.18, 2.9, 0.62, material);
      b(u, y + 0.24, -0.25, 2.65, 0.17, 0.7, trim);
      if (balcony) {
        b(u, y + 1.22, -0.53, 2.35, 0.055, 0.055, dark);
        b(u, y + 0.4, -0.53, 2.35, 0.045, 0.045, dark);
        for (let n = 0; n <= 15; n++)
          b(
            u - 1.14 + (n * 2.28) / 15,
            y + 0.81,
            -0.53,
            0.025,
            0.84,
            0.025,
            dark,
          );
        b(u, y + 1.45, -0.19, 1.6, 2.2, 0.035, glass);
      } else {
        for (const du of [-1.16, 0, 1.16])
          b(u + du, y + 1.7, -0.2, 0.065, 2.85, 0.07, frame);
        for (const dy of [0.32, 1.23, 2.16, 3.08])
          b(u, y + dy, -0.2, 2.35, 0.065, 0.07, frame);
      }
      if (floor >= 3) {
        for (let s = 0; s < 18; s++) {
          const du = -1.25 + ((s + 0.5) * 2.5) / 18,
            yy = y + 3.0 + 0.22 * (1 - Math.pow(du / 1.25, 2));
          b(u + du, yy, -0.26, 2.5 / 18 + 0.01, 0.22, 0.65, brick);
        }
      } else b(u, y + 3.18, -0.24, 2.65, 0.25, 0.64, trim);
    }
    for (let k = 0; k <= 14; k++)
      b(k * pitch, y + 1.8, -0.19, 0.6, 3.6, 0.58, material);
    b(length / 2, y + 3.48, -0.23, length, 0.16, 0.66, trim);
  }
  // Strong cornice above the third storey and a continuous parapet.
  b(length / 2, 10.8, -0.3, length + 0.25, 0.32, 0.85, trim);
  b(length / 2, 18.3, 0, length, 0.65, 0.5, brick);
  b(length / 2, 18.65, 0, length + 0.18, 0.14, 0.65, trim);
}

// South elevation from user views X59,Z14 and X127,Z27.
// Fourteen-bay schedule follows the documented long elevation; obscured bays
// remain provisional. Penultimate floor has arches, top floor has flat heads.
export function addBrookSouth(
  base: number,
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
  brick: T.Material,
  trim: T.Material,
  glass: T.Material,
  dark: T.Material,
) {
  const length = Math.hypot(48.04, 4.12),
    angle = -Math.atan2(4.12, 48.04),
    pitch = length / 14;
  const p = (u: number, v: number): [number, number] => [
    64.26 + u * Math.cos(angle) + v * Math.sin(angle),
    -26.37 - u * Math.sin(angle) + v * Math.cos(angle),
  ];
  const b = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = p(u, v);
    box(x, base + y, z, w, h, d, m, angle);
  };
  const frame = new T.MeshStandardMaterial({
    color: '#515a58',
    roughness: 0.65,
  });
  const shade = new T.MeshStandardMaterial({ color: '#292924', roughness: 1 });
  for (let floor = 0; floor < 5; floor++) {
    const y = floor * 3.6,
      material = floor === 0 ? stone : brick;
    for (let k = 0; k < 14; k++) {
      const u = (k + 0.5) * pitch,
        balcony = k % 2 === 1;
      b(u, y + 1.7, 0.13, 2.35, 2.85, 0.08, balcony ? shade : glass);
      // Projecting masonry reveals leave the dark balcony back behind its rail.
      for (const side of [-1, 1])
        b(u + side * 1.24, y + 1.7, 0.25, 0.18, 2.9, 0.62, material);
      b(u, y + 0.24, 0.25, 2.65, 0.17, 0.7, trim);
      if (balcony) {
        b(u, y + 1.22, 0.53, 2.35, 0.055, 0.055, dark);
        b(u, y + 0.4, 0.53, 2.35, 0.045, 0.045, dark);
        for (let n = 0; n <= 15; n++)
          b(
            u - 1.14 + (n * 2.28) / 15,
            y + 0.81,
            0.53,
            0.025,
            0.84,
            0.025,
            dark,
          );
        b(u, y + 1.45, 0.19, 1.6, 2.2, 0.035, glass);
      } else {
        for (const du of [-1.16, -0.39, 0.39, 1.16])
          b(u + du, y + 1.7, 0.2, 0.065, 2.85, 0.07, frame);
        for (const dy of [0.32, 1.23, 2.16, 3.08])
          b(u, y + dy, 0.2, 2.35, 0.065, 0.07, frame);
      }
      if (floor === 3) {
        for (let s = 0; s < 18; s++) {
          const du = -1.25 + ((s + 0.5) * 2.5) / 18,
            yy = y + 3.0 + 0.22 * (1 - Math.pow(du / 1.25, 2));
          b(u + du, yy, 0.26, 2.5 / 18 + 0.01, 0.22, 0.65, brick);
        }
      } else b(u, y + 3.18, 0.24, 2.65, 0.25, 0.64, floor === 4 ? brick : trim);
    }
    for (let k = 0; k <= 14; k++)
      b(k * pitch, y + 1.8, 0.19, 0.6, 3.6, 0.58, material);
    b(length / 2, y + 3.48, 0.23, length, 0.16, 0.66, trim);
  }
  // Photo-visible cornice below the upper two storeys and continuous parapet.
  b(length / 2, 10.8, 0.3, length + 0.25, 0.32, 0.85, trim);
  b(length / 2, 18.3, 0, length, 0.65, 0.5, brick);
  b(length / 2, 18.65, 0, length + 0.18, 0.14, 0.65, trim);
}

export function addBrookRoof(
  base: number,
  points: [number, number][],
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
  brick: T.Material,
  trim: T.Material,
  dark: T.Material,
) {
  const roof = new T.MeshStandardMaterial({
    color: '#929697',
    roughness: 0.85,
    side: T.DoubleSide,
  });
  const shape = new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1]))),
    g = new T.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, base + 18.08, 0);
  batch(g, roof);
  for (let j = 0; j < points.length; j++) {
    const a = points[j],
      b = points[(j + 1) % points.length],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 0.1) continue;
    const rot = Math.atan2(b[0] - a[0], b[1] - a[1]);
    box(
      (a[0] + b[0]) / 2,
      base + 18.3,
      (a[1] + b[1]) / 2,
      0.5,
      0.65,
      len,
      brick,
      rot,
    );
    box(
      (a[0] + b[0]) / 2,
      base + 18.65,
      (a[1] + b[1]) / 2,
      0.65,
      0.14,
      len + 0.1,
      trim,
      rot,
    );
  }
  for (let row = 0; row < 2; row++)
    for (let k = 0; k < 4; k++) {
      const x = 77 + k * 7.2 - row * 2.5,
        z = -43 + row * 7.2 + k * 0.61;
      box(x, base + 18.25, z, 1, 0.32, 1.05, dark, -0.085);
      box(x, base + 18.44, z, 0.8, 0.09, 0.85, roof, -0.085);
    }
  // Four roof facets visible above the east stair tower in the overhead view.
  const cap = new T.ConeGeometry(3.65, 2.05, 4);
  cap.rotateY(Math.PI / 4 - 0.086);
  cap.scale(0.62, 1, 1);
  cap.translate(113.2, base + 22.05, -35.3);
  batch(cap, roof);
}
