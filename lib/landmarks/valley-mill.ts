import { addValleyArcade } from './valley-arcade';
import { addValleyEngineHouse } from './valley-engine-house';
import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { VALLEY_MILL as V } from '../world/layout';
import { masonryUV } from '../materials/building-surfaces';

/** East/north/south facades photographed; other facades retain unsurveyed placeholders. */
export function addValleyMill(
  kit: Kit,
  { base, points }: { base: number; points: P[] },
) {
  const { brick, stone, trim, glass, dark, slate } = kit.m;
  const shell = new T.Shape(points.map(([x, z]) => new T.Vector2(x, -z)));
  const g = new T.ExtrudeGeometry(shell, {
    depth: V.height,
    bevelEnabled: false,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, base, 0);
  masonryUV(g, 2);
  kit.batch(g, brick);
  kit.polygon([...points, points[0]], slate, base + V.height + 0.04);
  addValleyArcade(kit, { base, facade: V.north });
  addValleyArcade(kit, { base, facade: V.south });
  addValleyEngineHouse(kit, { base });
  // Retain the previous profiles on uncounted elevations; no new survey claim.
  for (const edge of V.provisionalEdges) {
    const a = points[edge.edge],
      b = points[(edge.edge + 1) % points.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]),
      angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const B = (
      u: number,
      y: number,
      depth: number,
      h: number,
      width: number,
      m: T.Material,
    ) => {
      kit.box(
        a[0] + Math.sin(angle) * u,
        base + y,
        a[1] + Math.cos(angle) * u,
        depth,
        h,
        width,
        m,
        angle,
      );
    };
    B(length / 2, 0.65, 0.3, 1.3, length, stone);
    for (const u of edge.centres)
      for (let floor = 0; floor < 4; floor++) {
        const y = floor * 3.6 + 1.65;
        B(u, y, 0.19, 2.48, 1.77, trim);
        B(u, y + 0.04, 0.22, 2.25, 1.55, glass);
        B(u, y + 0.04, 0.25, 0.045, 1.55, trim);
        B(u, y + 0.04, 0.25, 2.25, 0.045, trim);
        for (const f of [-0.25, 0.25]) {
          B(u + 1.55 * f, y + 0.04, 0.26, 2.25, 0.035, trim);
          B(u, y + 0.04 + 2.25 * f, 0.26, 0.035, 1.55, trim);
        }
      }
    for (let floor = 1; floor <= 4; floor++)
      B(length / 2, floor * 3.6 - 0.12, 0.48, 0.32, length + 0.12, trim);
    // Existing structural strips also provisional, not a counted arcade.
    const cuts = [
      0,
      ...edge.centres.slice(1).map((u, i) => (u + edge.centres[i]) / 2),
      length,
    ];
    for (const u of cuts) B(u, V.height / 2, 0.35, V.height, 0.35, brick);
  }
  const a = V.east.from,
    b = V.east.to,
    angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const point = (u: number, d: number): P => [
    a[0] + Math.sin(angle) * u + Math.cos(angle) * d,
    a[1] + Math.cos(angle) * u - Math.sin(angle) * d,
  ];
  const B = (
    u: number,
    y: number,
    d: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const [x, z] = point(u, d);
    kit.box(x, base + y, z, depth, h, w, m, angle);
  };
  const frame = kit.mat('valleyEastFrames', '#414e50', 0.6);
  const glazing = kit.mat('valleyEastGlazing', '#96aaaf', 0.35);
  const surround = kit.mat('valleyEastStone', '#c6bca6');
  const archBrick = kit.mat('valleyArchBrick', '#b57a57');
  for (const m of [frame, glazing, surround, archBrick]) m.side = T.DoubleSide;
  // Segmental heads on upper rows; semicircular heads on the ground arcade.
  const shape = (width: number, bottom: number, top: number, rise: number) => {
    const s = new T.Shape(),
      r = width / 2;
    s.moveTo(-r, bottom);
    s.lineTo(r, bottom);
    s.lineTo(r, top - rise);
    for (let i = 0; i <= 24; i++) {
      const t = (i * Math.PI) / 24;
      s.lineTo(Math.cos(t) * r, top - rise + Math.sin(t) * rise);
    }
    s.closePath();
    return s;
  };
  const panel = (s: T.Shape, u: number, d: number, m: T.Material) => {
    const g = new T.ShapeGeometry(s),
      p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const [x, z] = point(u + p.getX(i), d);
      p.setXYZ(i, x, base + p.getY(i), z);
    }
    g.computeVertexNormals();
    kit.batch(g, m);
  };
  const opening = (
    u: number,
    bottom: number,
    top: number,
    width: number,
    rise: number,
    columns: number,
  ) => {
    panel(
      shape(width + 0.24, bottom - 0.08, top + 0.12, rise + 0.12),
      u,
      0.08,
      archBrick,
    );
    panel(
      shape(width + 0.1, bottom - 0.04, top + 0.04, rise + 0.04),
      u,
      0.1,
      frame,
    );
    panel(shape(width, bottom, top, rise), u, 0.12, glazing);
    for (let k = 1; k < columns; k++) {
      const du = width * (k / columns - 0.5);
      const head = top - rise + rise * Math.sqrt(1 - (du / (width / 2)) ** 2);
      B(u + du, (bottom + head) / 2, 0.16, 0.055, head - bottom, 0.04, frame);
    }
    for (const y of [
      bottom,
      bottom + (top - bottom) * 0.32,
      bottom + (top - bottom) * 0.64,
    ])
      B(u, y, 0.16, width, 0.055, 0.04, frame);
    B(u, bottom - 0.1, 0.15, width + 0.25, 0.16, 0.28, surround);
  };
  for (const u of V.eastStacks)
    for (let floor = 0; floor < 4; floor++)
      opening(
        u,
        floor * 3.6 + 0.45,
        floor * 3.6 + 3.08,
        2.12,
        floor === 0 ? 1.06 : 0.2,
        3,
      );
  const stair = V.stair;
  opening(stair.u, stair.lowerBottom, stair.lowerTop, stair.width, 0.42, 4);
  opening(
    stair.u,
    stair.upperBottom,
    stair.upperTop,
    stair.width,
    stair.width / 2,
    4,
  );
  // The broad stair bay has projecting brick pilasters and a stepped architrave.
  for (const side of [-1, 1]) {
    B(stair.u + side * 2.25, 7.4, 0.08, 0.72, 14.4, 0.28, brick);
    for (const y of [3.5, 7.2, 10.6, 14.2])
      B(stair.u + side * 2.25, y, 0.2, 0.86, 0.18, 0.42, surround);
  }
  // Two glazed entrance groups flank the central decorated masonry pier.
  for (const side of [-1, 1]) {
    const u = stair.u + side * 1.05;
    B(u, 1.42, 0.1, 1.65, 2.75, 0.12, frame);
    B(u, 1.42, 0.18, 1.51, 2.6, 0.045, glazing);
    B(u, 1.42, 0.22, 0.055, 2.6, 0.045, frame);
    for (const y of [0.65, 2.05]) B(u, y, 0.22, 1.51, 0.055, 0.045, frame);
  }
  for (const u of [stair.u - 2.03, stair.u, stair.u + 2.03]) {
    B(u, 1.5, 0.18, 0.36, 3, 0.36, surround);
    B(u, 0.24, 0.23, 0.5, 0.48, 0.46, surround);
    B(u, 2.8, 0.23, 0.54, 0.24, 0.46, surround);
  }
  B(stair.u, 3.12, 0.18, 4.8, 0.28, 0.45, surround);
  B(stair.u, 3.35, 0.22, 5.1, 0.14, 0.55, surround);
  B(length / 2, 3.48, 0.12, length, 0.18, 0.36, surround);
  // Continuous top cornice/parapet fitted to every mapped wall, keeping flat roof.
  for (let j = 0; j < points.length; j++) {
    const a = points[j],
      b = points[(j + 1) % points.length],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const rot = Math.atan2(b[0] - a[0], b[1] - a[1]),
      x = (a[0] + b[0]) / 2,
      z = (a[1] + b[1]) / 2;
    kit.box(x, base + 14.25, z, 0.42, 0.24, len + 0.08, surround, rot);
    kit.box(x, base + 14.63, z, 0.32, 0.52, len, brick, rot);
    kit.box(x, base + 14.94, z, 0.45, 0.12, len + 0.08, surround, rot);
  }
  B(stair.u, 15.12, -0.55, 2.25, 0.35, 1.1, brick);
  // Square open cupola and four-sided cap replace the spherical bell/octagonal cone.
  const c = V.cupola,
    d = -c.inset,
    roof = V.height + 0.48;
  B(c.u, roof + c.baseHeight / 2, d, c.width, c.baseHeight, c.width, brick);
  B(
    c.u,
    roof + c.baseHeight + 0.08,
    d,
    c.width + 0.32,
    0.16,
    c.width + 0.32,
    surround,
  );
  for (const du of [-c.width / 2 + 0.18, c.width / 2 - 0.18])
    for (const dd of [-c.width / 2 + 0.18, c.width / 2 - 0.18])
      B(
        c.u + du,
        roof + c.baseHeight + c.openHeight / 2,
        d + dd,
        0.16,
        c.openHeight,
        0.16,
        surround,
      );
  B(
    c.u,
    roof + c.baseHeight + c.openHeight,
    d,
    c.width + 0.35,
    0.16,
    c.width + 0.35,
    surround,
  );
  const cap = new T.ConeGeometry((c.width + 0.75) / Math.sqrt(2), c.capRise, 4);
  cap.rotateY(Math.PI / 4 + angle);
  const [x, z] = point(c.u, d),
    top = roof + c.baseHeight + c.openHeight;
  cap.translate(x, base + top + c.capRise / 2 + 0.08, z);
  kit.batch(cap, slate);
  kit.box(x, base + top + c.capRise + 0.35, z, 0.055, 0.5, 0.055, dark);
  // Bell presence supported by the listing; silhouette and fittings estimated.
  const bell = new T.LatheGeometry(
    [
      new T.Vector2(0.38, 0),
      new T.Vector2(0.32, 0.1),
      new T.Vector2(0.22, 0.36),
      new T.Vector2(0.12, 0.48),
    ],
    12,
  );
  bell.translate(x, base + roof + c.baseHeight + 0.4, z);
  kit.batch(bell, dark);
}
