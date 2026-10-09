import * as T from 'three';
import { drape } from '../core/mesh';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import type { Surface } from '../world/surface';
import { BROOK_WEST as W, BROOK_WEST_ENTRANCE as D } from '../world/layout';
import { masonryUV, slateMaterial } from '../materials/building-surfaces';
import { brookWestPoint } from './brook-west-entrance';
import { brookWingRoofY } from './brook-north-return';
import { brookUpper } from './brook-mill';

/** Mapped main shell retained; west schedule and lower wing from UP-001/002.
 * No guessed windows on concealed parts. All dimensions interpreted. */
export function addBrookWest(
  kit: Kit,
  { surface, points }: { surface: Surface; points: P[] },
) {
  const entry = surface.brookWestEntry,
    base = surface.brookDatum;
  const frame = kit.mat('brookWestFrames', '#384851', 0.65);
  const glass = kit.mat('brookWestGlazing', '#91a9b1', 0.35);
  const stone = kit.mat('brookWestSurround', '#c4bfae');
  const bands = kit.mat('brookWestBands', '#aca99a');
  const masonry = kit.m.stone;
  const shell = new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1])));
  const extrude = (height: number, y: number, m: T.Material) => {
    const g = new T.ExtrudeGeometry(shell, {
      depth: height,
      bevelEnabled: false,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y, 0);
    const uv = g.getAttribute('uv');
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
    kit.batch(g, m);
  };
  const foot = Math.min(...points.map((p) => surface.sampledTerrain(...p)));
  // Main block only: the lower wing and entrance gable keep their heights.
  const upper = (build: () => void) => brookUpper(kit, base, build);
  upper(() => {
    extrude(base - foot + 3.6, foot, masonry);
    extrude(14.4, base + 3.6, kit.m.brick);
  });
  const B = (
    u: number,
    y: number,
    d: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const [x, z] = brookWestPoint(u, d),
      g = new T.BoxGeometry(depth, h, w);
    g.rotateY(D.angle);
    g.translate(x, entry + y, z);
    masonryUV(g, 2);
    kit.batch(g, m);
  };
  // Intersect each opening with the mapped stepped west facade, not a flat overlay.
  const local = points.slice(0, 6).map(([x, z]) => {
    const dx = x - D.centre[0],
      dz = z - D.centre[1];
    return {
      u: dx * Math.sin(D.angle) + dz * Math.cos(D.angle),
      d: -dx * Math.cos(D.angle) + dz * Math.sin(D.angle),
    };
  });
  const face = (u: number) => {
    for (let i = 0; i < local.length - 1; i++) {
      const a = local[i],
        b = local[i + 1];
      if (
        u >= Math.min(a.u, b.u) &&
        u <= Math.max(a.u, b.u) &&
        Math.abs(b.u - a.u) > 1
      )
        return a.d + ((b.d - a.d) * (u - a.u)) / (b.u - a.u);
    }
    return 0;
  };
  const opening = (
    u: number,
    d: number,
    bottom: number,
    top: number,
    width: number,
    door = false,
  ) => {
    const h = top - bottom,
      y = (bottom + top) / 2;
    B(u, y, d + 0.08, width + 0.12, h + 0.12, 0.12, frame);
    B(u, y, d + 0.16, width, h, 0.045, glass);
    B(u, y, d + 0.2, 0.05, h, 0.045, frame);
    // Photographed paired panes and alternating tall/short sections.
    for (const t of door ? [0.2, 0.83] : [0.17, 0.35, 0.52, 0.83])
      B(u, bottom + h * t, d + 0.2, width, 0.055, 0.045, frame);
    B(u, bottom - 0.07, d + 0.13, width + 0.24, 0.12, 0.32, stone);
    B(u, top + 0.13, d + 0.04, width + 0.25, 0.2, 0.2, stone);
    if (door) B(u + 0.15, 1.1, d + 0.24, 0.025, 0.22, 0.06, kit.m.dark);
  };
  // Main block: only the visible photographed openings, independently of wall length.
  upper(() => {
    for (const row of W.mainRows)
      for (const u of row.us)
        opening(u, face(u), row.bottom, row.top, row.width);
  });
  upper(() => mainFaces());
  function mainFaces() {
    for (let i = 0; i < 5; i++) {
      const a = points[i],
        b = points[i + 1],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
      kit.box(
        (a[0] + b[0]) / 2,
        entry + 1.6,
        (a[1] + b[1]) / 2,
        0.1,
        3.2,
        len,
        masonry,
        angle,
      );
      for (const y of W.bands)
        kit.box(
          (a[0] + b[0]) / 2,
          entry + y,
          (a[1] + b[1]) / 2,
          0.1,
          0.16,
          len,
          bands,
          angle,
        );
      kit.box(
        (a[0] + b[0]) / 2,
        entry + 3.08,
        (a[1] + b[1]) / 2,
        0.23,
        0.22,
        len,
        stone,
        angle,
      );
    }
  }
  // Retain the independently modelled north/south/east rainwater geometry.
  upper(() => rainwater());
  function rainwater() {
    for (let i = 5; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
      kit.box(
        (a[0] + b[0]) / 2,
        base + 17.92,
        (a[1] + b[1]) / 2,
        0.13,
        0.14,
        len + 0.16,
        kit.m.dark,
        angle,
      );
      if (i % 2 === 0) {
        kit.box(a[0], base + 9, a[1], 0.08, 18, 0.08, kit.m.dark);
        kit.box(a[0], base + 0.18, a[1], 0.2, 0.25, 0.2, kit.m.dark);
      }
    }
  }
  const wing = W.wing,
    middle = (wing.from + wing.to) / 2,
    width = wing.to - wing.from;
  B(middle, 1.6, -wing.depth / 2, width, 3.2, wing.depth, masonry);
  B(
    middle,
    (3.2 + wing.eaves) / 2,
    -wing.depth / 2,
    width,
    wing.eaves - 3.2,
    wing.depth,
    kit.m.brick,
  );
  // North-end photographs resolve the gable; three rooflights remain on its west slope.
  const roofY = brookWingRoofY;
  const slope = (
    u0: number,
    u1: number,
    d0: number,
    d1: number,
    offset: number,
    m: T.Material,
  ) => {
    const vertices: number[] = [];
    for (const [u, d] of [
      [u0, d0],
      [u1, d0],
      [u0, d1],
      [u1, d1],
    ]) {
      const [x, z] = brookWestPoint(u, d);
      vertices.push(x, entry + roofY(d) + offset, z);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    g.setAttribute(
      'uv',
      new T.Float32BufferAttribute(
        [
          0,
          0,
          (u1 - u0) / 2,
          0,
          0,
          (d0 - d1) / 2,
          (u1 - u0) / 2,
          (d0 - d1) / 2,
        ],
        2,
      ),
    );
    g.setIndex([0, 1, 2, 2, 1, 3]);
    g.computeVertexNormals();
    kit.batch(g, m);
  };
  // Close the triangular end beneath the slope.
  const shape = new T.Shape([
    new T.Vector2(0, wing.eaves),
    new T.Vector2(-wing.depth, wing.eaves),
    new T.Vector2(-wing.depth / 2, wing.eaves + wing.roofRise),
  ]);
  for (const u of [wing.from, wing.to]) {
    const g = new T.ShapeGeometry(shape),
      p = g.getAttribute('position');
    for (let j = 0; j < p.count; j++) {
      const [x, z] = brookWestPoint(u, p.getX(j));
      p.setXYZ(j, x, entry + p.getY(j), z);
    }
    g.computeVertexNormals();
    masonryUV(g, 2);
    const wall = kit.mat('brookWingEnd', '#e4b99b');
    wall.side = T.DoubleSide;
    wall.map = kit.m.brick.map;
    kit.batch(g, wall);
  }
  slope(
    wing.from - 0.12,
    wing.to + 0.1,
    0.18,
    -wing.depth / 2,
    0.045,
    slateMaterial(),
  );
  slope(
    wing.from - 0.12,
    wing.to + 0.1,
    -wing.depth / 2,
    -wing.depth - 0.1,
    0.045,
    slateMaterial(),
  );
  for (const u of W.rooflights) {
    slope(u - 0.36, u + 0.36, -0.2, -1.08, 0.065, frame);
    slope(u - 0.29, u + 0.29, -0.27, -1.01, 0.085, glass);
  }
  for (const y of W.bands.filter((y) => y < wing.eaves))
    B(middle, y, 0.055, width, 0.16, 0.12, bands);
  B(middle, 3.08, 0.13, width + 0.1, 0.22, 0.25, stone);
  B(middle, wing.eaves - 0.12, 0.16, width + 0.16, 0.16, 0.27, stone);
  B(middle, wing.eaves, 0.28, width + 0.2, 0.12, 0.14, kit.m.dark);
  for (const u of W.wingWindows) opening(u, 0, 3.8, 7.6, 1.05);
  for (const o of W.groundOpenings)
    opening(o.u, 0, o.bottom, o.top, o.width, o.door);
  // Downpipes at the photographed wing/gable and gable/main-block joins.
  for (const u of [wing.to - 0.08, D.width / 2 + 0.15]) {
    const height = u < 0 ? wing.eaves : 13.1,
      depth = u < 0 ? 0.25 : face(u) + 0.22;
    B(u, height / 2, depth, 0.085, height, 0.085, kit.m.dark);
    B(u, 0.12, depth + 0.07, 0.13, 0.2, 0.22, kit.m.dark);
  }
  kit.batch(
    drape(W.apron, (x, z) => surface.brookWestApproachY(x, z) + 0.02, 0.4),
    kit.m.asphalt,
  );
  return [
    brookWestPoint(wing.from, 0),
    brookWestPoint(wing.to, 0),
    brookWestPoint(wing.to, -wing.depth),
    brookWestPoint(wing.from, -wing.depth),
  ];
}
