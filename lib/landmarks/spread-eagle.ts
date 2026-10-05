import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { masonryTexture } from '../materials/masonry-texture';
import { housingUV } from '../materials/housing-brick';
import { roofUV, slateMaterial } from '../materials/building-surfaces';
import { SPREAD_EAGLE as H } from '../world/layout';

/** Individually counted street front and south gable. Mapped outline;
 * fitted dimensions, concealed rear roof divisions/openings unresolved. */
export function addSpreadEagle(
  kit: Kit,
  {
    footprint,
    ground,
  }: { footprint: P[]; ground: (x: number, z: number) => number },
) {
  const width = Math.hypot(H.b[0] - H.a[0], H.b[1] - H.a[1]);
  const along: P = [(H.b[0] - H.a[0]) / width, (H.b[1] - H.a[1]) / width];
  const out: P = [along[1], -along[0]];
  const rot = Math.atan2(-along[1], along[0]);
  const world = (u: number, v: number): P => [
    H.a[0] + along[0] * u + out[0] * v,
    H.a[1] + along[1] * u + out[1] * v,
  ];
  const local = (p: P): P => [
    (p[0] - H.a[0]) * along[0] + (p[1] - H.a[1]) * along[1],
    (p[0] - H.a[0]) * out[0] + (p[1] - H.a[1]) * out[1],
  ];
  const base = ground(...world(H.entrance, 0.8)) + 0.08;
  const texture = masonryTexture();
  const stone = kit.mat('spreadEagleStone', '#d9ceb6');
  stone.map = texture;
  stone.bumpMap = texture;
  stone.bumpScale = 0.04;
  const paint = kit.mat('spreadEaglePaint', '#353e42');
  const gable = kit.mat('spreadEagleGable', '#83b2cb');
  gable.map = texture;
  gable.bumpMap = texture;
  gable.bumpScale = 0.035;
  const frame = kit.mat('spreadEagleFrames', '#e0e4df');
  const glass = kit.mat('spreadEagleGlass', '#829396', 0.35);
  const gold = kit.mat('spreadEagleGold', '#b5a26b');
  const step = kit.mat('spreadEagleThreshold', '#875f4e');
  const slate = slateMaterial();
  slate.color.set('#b8ab95');
  const uv = (g: T.BufferGeometry) => {
    housingUV(g, H.a, along);
    const a = g.getAttribute('uv');
    for (let i = 0; i < a.count; i++)
      a.setXY(i, (a.getX(i) * 1.8) / 3.2, (a.getY(i) * 1.8) / 3.2);
  };
  const mesh = (vertices: number[][], ix: number[], material: T.Material) => {
    const g = new T.BufferGeometry();
    g.setAttribute(
      'position',
      new T.Float32BufferAttribute(
        vertices.flatMap(([u, y, v]) => {
          const p = world(u, v);
          return [p[0], base + y, p[1]];
        }),
        3,
      ),
    );
    g.setIndex(ix);
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    if (material === slate) roofUV(flat);
    else uv(flat);
    kit.batch(flat, material);
    g.dispose();
  };
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const p = world(u, v);
    const g = new T.BoxGeometry(w, h, d);
    g.rotateY(rot);
    g.translate(p[0], base + y, p[1]);
    if (m === stone || m === gable) uv(g);
    kit.batch(g, m);
  };
  const clip = (p: P[], keep: (q: P) => number) => {
    const result: P[] = [];
    for (let j = 0; j < p.length; j++) {
      const a = p[j],
        b = p[(j + 1) % p.length],
        da = keep(a),
        db = keep(b);
      if (da >= 0) result.push(a);
      if (da * db < 0) {
        const t = da / (da - db);
        result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return result;
  };
  const poly = footprint.map(local);
  const bottom = Math.min(
    base - 0.3,
    ...footprint.map((p) => ground(...p) - 0.3),
  );
  const shell = (p: P[], height: number) => {
    if (p.length < 3) return;
    const points = p.map((q) => world(...q));
    const g = new T.ExtrudeGeometry(
      new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1]))),
      { depth: base + height - bottom, bevelEnabled: false },
    );
    g.rotateX(-Math.PI / 2);
    g.translate(0, bottom, 0);
    uv(g);
    kit.batch(g, stone);
  };
  shell(
    clip(poly, (p) => p[0] - H.southExtent),
    H.eave,
  );
  shell(
    clip(poly, (p) => H.southExtent - p[0]),
    H.southEave,
  );
  const eave = (u: number) => (u < H.southExtent ? H.southEave : H.eave);
  const rise = (v: number) =>
    H.rise *
    Math.max(
      0,
      1 -
        Math.abs(v + (v >= -H.depth ? H.depth / 2 : H.rearRidge)) /
          (v >= -H.depth ? H.depth / 2 : H.rearHalf),
    );
  // Roof pieces follow the mapped outline, with separate front/rear ridges.
  for (const raised of [false, true])
    for (const rear of [false, true])
      for (const side of [-1, 1]) {
        let p = clip(poly, (q) =>
          raised ? H.southExtent - q[0] : q[0] - H.southExtent,
        );
        p = clip(p, (q) => (rear ? -H.depth - q[1] : q[1] + H.depth));
        const ridge = rear ? -H.rearRidge : -H.depth / 2;
        p = clip(p, (q) => side * (q[1] - ridge));
        if (p.length < 3) continue;
        const tris = T.ShapeUtils.triangulateShape(
          p.map((q) => new T.Vector2(...q)),
          [],
        );
        mesh(
          p.map(([u, v]) => [
            u,
            (raised ? H.southEave : H.eave) + rise(v) + 0.03,
            v,
          ]),
          tris.flat(),
          slate,
        );
      }
  // Outer gable infill, split at changes of roof slope and volume height.
  for (let j = 0; j < poly.length; j++) {
    const a = poly[j],
      b = poly[(j + 1) % poly.length],
      cuts = [0, 1];
    for (const [axis, value] of [
      [0, H.southExtent],
      [1, -H.depth / 2],
      [1, -H.depth],
      [1, -H.rearRidge],
    ]) {
      const d = b[axis] - a[axis];
      if (Math.abs(d) > 0.0001) {
        const t = (value - a[axis]) / d;
        if (t > 0 && t < 1) cuts.push(t);
      }
    }
    cuts.sort((a, b) => a - b);
    for (let k = 0; k < cuts.length - 1; k++) {
      const at = (t: number): P => [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
      ];
      const p = at(cuts[k]),
        q = at(cuts[k + 1]),
        h = eave((p[0] + q[0]) / 2);
      const painted = Math.abs(p[0]) < 0.03 && Math.abs(q[0]) < 0.03;
      mesh(
        [
          [p[0], h, p[1]],
          [q[0], h, q[1]],
          [q[0], h + rise(q[1]), q[1]],
          [p[0], h + rise(p[1]), p[1]],
        ],
        [0, 2, 1, 0, 3, 2],
        painted ? gable : stone,
      );
    }
  }
  // Internal raised south roof return, above the adjoining lower roof.
  mesh(
    [
      [H.southExtent, H.eave, 0],
      [H.southExtent, H.southEave, 0],
      [H.southExtent, H.southEave + H.rise, -H.depth / 2],
      [H.southExtent, H.southEave, -H.depth],
      [H.southExtent, H.eave, -H.depth],
    ],
    [0, 1, 2, 0, 2, 3, 0, 3, 4],
    stone,
  );
  for (const [lo, hi, y] of [
    [0, H.southExtent, H.southEave],
    [H.southExtent, width, H.eave],
  ]) {
    B((lo + hi) / 2, y + 0.04, 0.16, hi - lo, 0.17, 0.18, stone);
    B((lo + hi) / 2, y - 0.13, 0.18, hi - lo, 0.1, 0.15, paint);
  }
  const window = (
    u: number,
    y: number,
    w: number,
    h: number,
    narrow = false,
  ) => {
    B(u, y + h / 2, 0.12, w + 0.18, h + 0.16, 0.12, frame);
    B(u, y + h / 2, 0.19, w, h, 0.03, glass);
    B(u, y + h * (narrow ? 0.45 : 0.55), 0.22, w, 0.055, 0.025, frame);
    if (narrow) B(u, y + h * 0.72, 0.22, 0.04, h * 0.55, 0.025, frame);
    B(u, y - 0.12, 0.15, w + 0.36, 0.18, 0.27, paint);
    // Tapered painted stone head observed above each main opening.
    mesh(
      [
        [u - w / 2 - 0.25, y + h + 0.18, 0.15],
        [u + w / 2 + 0.25, y + h + 0.18, 0.15],
        [u + w / 2 + 0.16, y + h - 0.06, 0.15],
        [u - w / 2 - 0.16, y + h - 0.06, 0.15],
      ],
      [0, 1, 2, 0, 2, 3],
      narrow ? stone : paint,
    );
  };
  for (const u of H.upper)
    window(
      u,
      u < H.southExtent ? 3.8 : 3.45,
      u < H.southExtent ? 1.3 : 1.15,
      1.65,
    );
  for (const { u, w } of H.lower)
    window(u, ground(...world(u, 0.8)) + 0.72 - base, w, 1.65, u === 10.46);
  const door = (u: number, decorated: boolean) => {
    const lift = ground(...world(u, 0.8)) + 0.08 - base;
    const D = (...args: Parameters<typeof B>) => {
      args[1] += lift;
      B(...args);
    };

    D(u, 1.12, 0.15, 1.16, 2.3, 0.16, decorated ? paint : stone);
    D(u, 1.08, 0.26, 0.92, 2.16, 0.045, paint);
    D(u, 2.3, 0.26, 0.88, 0.32, 0.04, glass);
    if (decorated) {
      for (const s of [-0.72, 0.72]) {
        D(u + s, 1.4, 0.23, 0.25, 2.8, 0.26, paint);
        D(u + s, 0.17, 0.25, 0.34, 0.34, 0.3, paint);
      }
      D(u, 2.91, 0.25, 1.75, 0.33, 0.33, paint);
      D(u, 3.15, 0.3, 2.05, 0.14, 0.42, paint);
      mesh(
        [
          [u - 0.72, 3.22, 0.28],
          [u - 0.3, 3.25, 0.28],
          [u, 3.53, 0.28],
          [u + 0.3, 3.25, 0.28],
          [u + 0.72, 3.22, 0.28],
        ],
        [0, 2, 1, 0, 2, 4, 2, 4, 3],
        paint,
      );
      for (const yy of [0.55, 1.32])
        for (const uu of [-0.22, 0.22]) {
          D(u + uu, yy, 0.3, 0.35, 0.57, 0.045, paint);
          D(u + uu, yy, 0.33, 0.26, 0.48, 0.025, glass);
        }
      D(u, 0.055, 0.31, 1.14, 0.11, 0.48, step);
      D(u, 2.66, 0.55, 0.28, 0.42, 0.28, gold);
      D(u, 2.9, 0.55, 0.38, 0.08, 0.38, paint);
    }
  };
  door(H.entrance, true);
  door(H.serviceDoor, false);
  for (const u of [0.12, H.southExtent - 0.12, width - 0.1])
    B(u, eave(u) / 2, 0.17, 0.075, eave(u), 0.075, paint);
  // Painted south gable, one separately observed upper opening.
  mesh(
    [
      [-0.01, 2.8, 0],
      [-0.01, 2.8, -H.depth],
      [-0.01, H.southEave, -H.depth],
      [-0.01, H.southEave, 0],
    ],
    [0, 1, 2, 0, 2, 3],
    gable,
  );
  const sideBox = (
    v: number,
    y: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const p = world(-0.06, v);
    const g = new T.BoxGeometry(d, h, w);
    g.rotateY(rot);
    g.translate(p[0], base + y, p[1]);
    kit.batch(g, m);
  };
  sideBox(-4.9, 4.6, 1.06, 1.62, 0.12, frame);
  sideBox(-4.9, 4.6, 0.94, 1.5, 0.2, glass);
  sideBox(-4.9, 4.6, 0.96, 0.045, 0.24, frame);
  sideBox(-4.9, 4.6, 0.045, 1.5, 0.24, frame);
  sideBox(-4.9, 3.69, 1.3, 0.18, 0.22, paint);
  // Procedural text/sign art, not pixels from the references.
  const label = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    north: boolean,
    colour: string,
    eagle = false,
  ) => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    if (eagle) {
      ctx.fillStyle = '#323b3c';
      ctx.fillRect(0, 0, 1024, 512);
      ctx.strokeStyle = '#b7a775';
      ctx.lineWidth = 18;
      ctx.strokeRect(15, 15, 994, 482);
      ctx.fillStyle = '#b7a775';
      ctx.beginPath();
      ctx.moveTo(512, 360);
      ctx.lineTo(260, 125);
      ctx.lineTo(430, 200);
      ctx.lineTo(512, 245);
      ctx.lineTo(590, 190);
      ctx.lineTo(765, 120);
      ctx.lineTo(535, 365);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = colour;
    ctx.font = '500 130px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPREAD', 512, eagle ? 65 : 160);
    if (!eagle) ctx.fillText('EAGLE', 512, 340);
    const map = new T.CanvasTexture(c);
    map.colorSpace = T.SRGBColorSpace;
    const m = new T.MeshStandardMaterial({
      map,
      transparent: !eagle,
      roughness: 0.85,
      side: T.DoubleSide,
    });
    const g = new T.PlaneGeometry(w, h);
    const normal: P = north ? [-along[0], -along[1]] : out;
    g.rotateY(Math.atan2(normal[0], normal[1]));
    const p = world(u, v);
    g.translate(p[0], base + y, p[1]);
    kit.batch(g, m);
  };
  label(H.entrance, 4.5, 0.2, 2.8, 1.05, false, '#e2e2d6');
  label(-0.06, 4.35, -1.5, 2.5, 1.0, true, '#b7a775');
  for (const u of [0.65, width - 0.5]) {
    B(u, 4.3, 0.65, 0.07, 0.08, 1.3, paint);
    B(u, 4.15, 1.05, 0.06, 0.55, 0.06, paint);
    label(u, 3.73, 1.03, 0.78, 1.05, true, '#c9bc8b', true);
  }
  for (const u of H.chimneys) {
    const h = eave(u) + H.rise;
    B(u, h + 0.48, -H.depth / 2, 0.7, 1.1, 0.78, stone);
    B(u, h + 1.08, -H.depth / 2, 0.9, 0.12, 0.94, paint);
  }
  const leaves = kit.mat('spreadEagleBasketLeaves', '#496345'),
    flowers = kit.mat('spreadEagleFlowers', '#bb5b86'),
    basket = kit.mat('spreadEagleBaskets', '#645746');
  for (const u of H.baskets) {
    B(u, 2.92, 0.43, 0.04, 0.35, 0.04, paint);
    const p = world(u, 0.49);
    const bowl = new T.SphereGeometry(
      0.25,
      8,
      4,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    bowl.rotateX(Math.PI);
    bowl.translate(p[0], base + 2.63, p[1]);
    kit.batch(bowl, basket);
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI * 2) / 12,
        r = 0.17;
      const g = new T.SphereGeometry(k % 3 ? 0.07 : 0.12, 6, 4);
      g.translate(
        p[0] + Math.cos(a) * r,
        base + 2.63 + (k % 3) * 0.05,
        p[1] + Math.sin(a) * r,
      );
      kit.batch(g, k % 3 ? flowers : leaves);
    }
  }
}
