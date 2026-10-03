import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { drape } from '../core/mesh';
import {
  masonryUV,
  roofUV,
  slateMaterial,
} from '../materials/building-surfaces';
import { BROOK_WEST_ENTRANCE as D } from '../world/layout';
import type { Surface } from '../world/surface';

export function brookWestPoint(u: number, d: number): P {
  return [
    D.centre[0] + Math.sin(D.angle) * u - Math.cos(D.angle) * d,
    D.centre[1] + Math.cos(D.angle) * u + Math.sin(D.angle) * d,
  ];
}
/** Photo-supported composition; dimensions and concealed threshold estimated. */
export function addBrookWestEntrance(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const entry = surface.brookWestEntry;
  const frame = kit.mat('brookWestFrames', '#384851', 0.65);
  const glass = kit.mat('brookWestGlazing', '#91a9b1', 0.35);
  const surround = kit.mat('brookWestSurround', '#c4bfae');
  const band = kit.mat('brookWestBands', '#aca99a');
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
    const n = g.getAttribute('normal'),
      p = g.getAttribute('position'),
      uv = g.getAttribute('uv');
    for (let j = 0; j < p.count; j++)
      if (Math.abs(n.getY(j)) > 0.7) uv.setXY(j, p.getX(j) / 2, p.getZ(j) / 2);
    kit.batch(g, m);
  };
  // Projecting body masks the old generic central west openings.
  B(0, 1.6, -D.depth / 2, D.width, 3.2, D.depth, kit.m.stone);
  B(
    0,
    (3.2 + D.eaves) / 2,
    -D.depth / 2,
    D.width,
    D.eaves - 3.2,
    D.depth,
    kit.m.brick,
  );
  const shape = new T.Shape([
    new T.Vector2(-D.width / 2, D.eaves),
    new T.Vector2(D.width / 2, D.eaves),
    new T.Vector2(0, D.eaves + D.rise),
  ]);
  const gable = new T.ExtrudeGeometry(shape, {
    depth: D.depth,
    bevelEnabled: false,
  });
  // Shape x runs along the elevation; its extrusion runs into the main mill.
  gable.scale(-1, 1, 1);
  const gp = gable.getAttribute('position');
  for (let j = 0; j < gp.count; j++) {
    const [x, z] = brookWestPoint(gp.getX(j), -gp.getZ(j));
    gp.setXYZ(j, x, entry + gp.getY(j), z);
  }
  gable.computeVertexNormals();
  masonryUV(gable, 2);
  kit.batch(gable, kit.m.brick);
  const roof = new T.BufferGeometry(),
    verts: number[] = [];
  for (const [u, y, d] of [
    [-D.width / 2 - 0.18, D.eaves + 0.06, 0.16],
    [0, D.eaves + D.rise + 0.06, 0.16],
    [D.width / 2 + 0.18, D.eaves + 0.06, 0.16],
    [-D.width / 2 - 0.18, D.eaves + 0.06, -D.depth - 0.15],
    [0, D.eaves + D.rise + 0.06, -D.depth - 0.15],
    [D.width / 2 + 0.18, D.eaves + 0.06, -D.depth - 0.15],
  ]) {
    const [x, z] = brookWestPoint(u, d);
    verts.push(x, entry + y, z);
  }
  roof.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  roof.setIndex([0, 1, 3, 3, 1, 4, 1, 2, 4, 4, 2, 5]);
  roof.computeVertexNormals();
  roofUV(roof);
  kit.batch(roof, slateMaterial());
  // Narrow photographed masonry bands, including the returns.
  for (const y of [3.2, 4.4, 5.6, 6.8, 8.0, 9.2, 10.4]) {
    B(0, y, 0.045, D.width, 0.16, 0.1, band);
    for (const u of [-D.width / 2, D.width / 2])
      B(u, y, -D.depth / 2, 0.1, 0.16, D.depth, band);
  }
  B(0, 3.07, 0.13, D.width + 0.15, 0.2, 0.26, surround);
  // Rectangular stone doorway surround, with a dark glazed door and transom.
  for (const u of [-D.doorWidth / 2 - 0.17, D.doorWidth / 2 + 0.17])
    B(u, D.doorHeight / 2, 0.14, 0.3, D.doorHeight, 0.3, surround);
  B(0, D.doorHeight + 0.15, 0.14, D.doorWidth + 0.65, 0.3, 0.3, surround);
  B(0, D.doorHeight / 2, 0.19, D.doorWidth, D.doorHeight, 0.06, frame);
  B(
    0,
    D.doorHeight / 2 + 0.025,
    0.23,
    D.doorWidth - 0.12,
    D.doorHeight - 0.13,
    0.025,
    glass,
  );
  B(0, D.doorHeight / 2, 0.27, 0.055, D.doorHeight, 0.035, frame);
  B(0, 0.5, 0.27, D.doorWidth, 0.055, 0.035, frame);
  B(0, D.doorHeight - 0.42, 0.27, D.doorWidth, 0.07, 0.035, frame);
  B(0.12, 1.15, 0.29, 0.035, 0.25, 0.055, kit.m.dark);
  // Continuous arched stair glazing, independently scheduled from ordinary floors.
  const bottom = D.glazingBottom,
    top = D.glazingTop,
    w = D.glazingWidth,
    r = w / 2;
  const arch = (width: number, b: number, t: number) => {
    const rad = width / 2,
      spring = t - rad,
      s = new T.Shape();
    s.moveTo(-rad, b);
    s.lineTo(rad, b);
    s.lineTo(rad, spring);
    for (let i = 0; i <= 24; i++) {
      const a = (i * Math.PI) / 24;
      s.lineTo(Math.cos(a) * rad, spring + Math.sin(a) * rad);
    }
    s.lineTo(-rad, b);
    return s;
  };
  const panel = (s: T.Shape, d: number, m: T.Material) => {
    const g = new T.ShapeGeometry(s),
      p = g.getAttribute('position');
    for (let j = 0; j < p.count; j++) {
      const [x, z] = brookWestPoint(p.getX(j), d);
      p.setXYZ(j, x, entry + p.getY(j), z);
    }
    g.computeVertexNormals();
    kit.batch(g, m);
  };
  // Double-sided planes are needed because the west facade faces negative x.
  frame.side = T.DoubleSide;
  glass.side = T.DoubleSide;
  panel(arch(w + 0.12, bottom - 0.06, top + 0.06), 0.14, frame);
  panel(arch(w, bottom, top), 0.18, glass);
  for (const u of [-w / 6, w / 6]) {
    const head = top - r + Math.sqrt(r * r - u * u);
    B(u, (bottom + head) / 2, 0.22, 0.055, head - bottom, 0.045, frame);
  }
  for (const y of [
    bottom,
    bottom + 0.85,
    bottom + 2.45,
    bottom + 3.25,
    bottom + 4.75,
    bottom + 5.55,
    top - r,
  ])
    B(0, y, 0.22, w, 0.055, 0.045, frame);
  // Pale voussoirs wrap the rounded head; returns remain brick.
  const ring = new T.Shape();
  const outer = r + 0.22,
    spring = top - r;
  ring.moveTo(r, spring);
  ring.lineTo(outer, spring);
  for (let i = 0; i <= 24; i++) {
    const a = (i * Math.PI) / 24;
    ring.lineTo(Math.cos(a) * outer, spring + Math.sin(a) * outer);
  }
  ring.lineTo(-r, spring);
  for (let i = 24; i >= 0; i--) {
    const a = (i * Math.PI) / 24;
    ring.lineTo(Math.cos(a) * r, spring + Math.sin(a) * r);
  }
  surround.side = T.DoubleSide;
  panel(ring, 0.23, surround);
  // Two small flanking windows visible high on the gable front.
  for (const u of [-2.15, 2.15]) {
    B(u, 9.4, 0.14, 0.68, 1.75, 0.07, surround);
    B(u, 9.4, 0.19, 0.56, 1.61, 0.04, glass);
    B(u, 9.4, 0.24, 0.045, 1.61, 0.035, frame);
    B(u, 9.4, 0.24, 0.56, 0.045, 0.035, frame);
  }
  kit.batch(drape(D.apron, surface.brookWestApproachY, 0.4), kit.m.paving);
  return [
    brookWestPoint(-D.width / 2, 0),
    brookWestPoint(D.width / 2, 0),
    brookWestPoint(D.width / 2, -D.depth),
    brookWestPoint(-D.width / 2, -D.depth),
  ];
}
