import * as T from 'three';
type Box = (
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  m: T.Material,
  rot?: number,
) => void;
// East elevation from the local Geograph reference and Historic England 1388079.
// Three bays each side of the stair tower. Dimensions remain interpreted.
export function addBrookEntrance(
  base: number,
  box: Box,
  batch: (g: T.BufferGeometry, m: T.Material) => void,
  stone: T.Material,
  brick: T.Material,
  trim: T.Material,
  glass: T.Material,
  dark: T.Material,
) {
  const rot = -0.0854,
    cx = 113.42,
    cz = -35.27;
  const point = (u: number, d: number): [number, number] => [
    cx + Math.sin(rot) * u + Math.cos(rot) * d,
    cz + Math.cos(rot) * u - Math.sin(rot) * d,
  ];
  const b = (
    u: number,
    y: number,
    d: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const [x, z] = point(u, d);
    box(x, base + y, z, depth, h, w, m, rot);
  };
  const shape = (
    points: [number, number][],
    u: number,
    y: number,
    d: number,
    m: T.Material,
  ) => {
    const s = new T.Shape(points.map((p) => new T.Vector2(...p))),
      g = new T.ShapeGeometry(s);
    g.rotateY(Math.PI / 2);
    g.rotateY(rot);
    const [x, z] = point(u, d);
    g.translate(x, base + y, z);
    batch(g, m);
  };
  const framed = (
    u: number,
    y: number,
    w: number,
    h: number,
    d: number,
    arched = false,
  ) => {
    if (arched) {
      const arch = (ww: number, hh: number): [number, number][] => {
        const p: [number, number][] = [
          [-ww / 2, -hh / 2],
          [ww / 2, -hh / 2],
          [ww / 2, hh / 2 - 0.22],
        ];
        for (let k = 1; k <= 16; k++) {
          const x = ww / 2 - (ww * k) / 16;
          p.push([x, hh / 2 - 0.22 + 0.22 * (1 - Math.pow(x / (ww / 2), 2))]);
        }
        return p;
      };
      shape(arch(w + 0.2, h + 0.2), u, y, d + 0.06, trim);
      shape(arch(w, h), u, y, d + 0.13, glass);
    } else {
      b(u, y, d, w + 0.2, h + 0.2, 0.12, trim);
      b(u, y, d + 0.08, w, h, 0.08, glass);
    }
    for (const du of [-w / 2, 0, w / 2])
      b(
        u + du,
        y - (arched ? 0.11 : 0),
        d + 0.16,
        0.05,
        h - (arched ? 0.22 : 0),
        0.04,
        dark,
      );
    for (const dy of [-h / 2, -h / 4, 0, h / 4])
      b(u, y + dy, d + 0.16, w, 0.045, 0.04, dark);
  };

  // Solid tower front masks the former evenly spaced central pair of openings.
  b(0, 9, 0.26, 5.5, 18, 0.75, brick);
  b(0, 1.8, 0.28, 5.5, 3.6, 0.8, stone);
  for (const u of [-11, -7.7, -4.4, 4.4, 7.7, 11])
    for (let floor = 0; floor < 5; floor++)
      framed(u, floor * 3.6 + 1.75, 1.65, 2.55, 0.16, floor === 3);
  for (let floor = 1; floor < 5; floor++)
    framed(0, floor * 3.6 + 1.75, 1.95, 2.7, 0.7);
  for (const u of [-2.55, 2.55]) {
    b(u, 9, 0.75, 0.4, 18, 0.3, brick);
    for (let y = 0.5; y < 18; y += 1.15) b(u, y, 0.93, 0.46, 0.17, 0.12, trim);
  }
  for (let floor = 1; floor <= 5; floor++) {
    b(0, floor * 3.6 - 0.1, 0.79, 5.9, 0.24, 0.35, trim);
    for (const side of [-1, 1])
      b(side * 8, floor * 3.6 - 0.1, 0.16, 10, 0.18, 0.4, trim);
  }
  // Clock stage with brick pediment and small corner finials.
  b(0, 19.55, -1.2, 4.65, 3.1, 4.65, brick);
  b(0, 18.2, -1.2, 6.05, 0.5, 4.9, trim);
  b(0, 21.14, -1.2, 4.95, 0.18, 4.95, trim);
  const pedimentMat = new T.MeshStandardMaterial({
    color: '#9a5946',
    side: T.DoubleSide,
    roughness: 1,
  });
  shape(
    [
      [-2.5, 0],
      [2.5, 0],
      [0, 1.75],
    ],
    0,
    21.2,
    1.27,
    pedimentMat,
  );
  for (const u of [-2.5, 2.5]) {
    b(u, 21.4, 1.23, 0.16, 0.65, 0.16, trim);
    const finial = new T.SphereGeometry(0.18, 8, 6);
    const [x, z] = point(u, 1.23);
    finial.translate(x, base + 21.8, z);
    batch(finial, trim);
  }
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e5dfc9';
  ctx.beginPath();
  ctx.arc(128, 128, 123, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#343735';
  ctx.lineWidth = 7;
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(128 + Math.sin(a) * 99, 128 - Math.cos(a) * 99);
    ctx.lineTo(128 + Math.sin(a) * 112, 128 - Math.cos(a) * 112);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(75, 90);
  ctx.lineTo(128, 128);
  ctx.lineTo(173, 59);
  ctx.stroke();
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  const face = new T.CircleGeometry(1.02, 48);
  face.rotateY(Math.PI / 2 + rot);
  const [fx, fz] = point(0, 1.15);
  face.translate(fx, base + 19.75, fz);
  batch(face, new T.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
  // User winter reference from X127,Z27 shows a circular glazed south face,
  // distinct from the east clock. Stage depth and moulding sizes are estimated.
  const [sx, sz] = point(2.36, -1.2);
  const side = (g: T.BufferGeometry, m: T.Material) => {
    g.rotateY(rot);
    g.translate(sx, base + 19.75, sz);
    batch(g, m);
  };
  side(new T.CircleGeometry(0.82, 40), glass);
  side(new T.RingGeometry(0.83, 1.06, 40), trim);
  side(new T.RingGeometry(0.39, 0.45, 32), dark);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const bar = new T.BoxGeometry(0.38, 0.045, 0.055);
    bar.rotateZ(a);
    bar.translate(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.018);
    side(bar, dark);
  }
  const sidePediment = new T.Shape([
    new T.Vector2(-2.5, 0),
    new T.Vector2(2.5, 0),
    new T.Vector2(0, 1.75),
  ]);
  const ped = new T.ShapeGeometry(sidePediment);
  ped.rotateY(rot);
  ped.translate(sx, base + 21.2, sz);
  batch(ped, pedimentMat);
  for (const sign of [-1, 1]) {
    const edge = new T.BoxGeometry(Math.hypot(2.5, 1.75), 0.12, 0.14);
    edge.rotateZ(-sign * Math.atan2(1.75, 2.5));
    edge.translate(sign * 1.25, 2.325, 0.06);
    side(edge, trim);
  }
  // Offset pointed porch, visible at the left of the east-facing reference.
  const porch = 4.1;
  b(porch, 1.65, 1.0, 2.65, 3.3, 1.8, stone);
  const stoneFace = new T.MeshStandardMaterial({
    color: '#b1a38a',
    roughness: 1,
    side: T.DoubleSide,
  });
  shape(
    [
      [-1.52, 0],
      [1.52, 0],
      [0, 1.3],
    ],
    porch,
    3.3,
    1.93,
    stoneFace,
  );
  shape(
    [
      [-0.73, 0],
      [0.73, 0],
      [0.73, 2.2],
      [0, 2.85],
      [-0.73, 2.2],
    ],
    porch,
    0.1,
    1.96,
    dark,
  );
  b(porch, 0.1, 2.0, 2.8, 0.2, 1.05, trim);
  b(porch, 1.1, 2.02, 0.04, 1.9, 0.04, trim);
  framed(-1.25, 1.8, 1.0, 2.15, 0.81);
  framed(1.25, 1.8, 1.0, 2.15, 0.81);
  return [
    point(porch - 1.4, 0.1),
    point(porch + 1.4, 0.1),
    point(porch + 1.4, 2.5),
    point(porch - 1.4, 2.5),
  ];
}
