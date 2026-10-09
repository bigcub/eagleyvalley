import * as T from 'three';
import type { Kit } from '../core/kit';
import { PARK_VILLA as V } from '../world/layout';
import { roofUV, slateMaterial } from '../materials/building-surfaces';

type Rect = number[];

/** Half-timbered red brick villa, OSM 573645273, from one Apr 2023 view of
 * its south and east sides. Volumes follow the mapped footprint; heights are
 * fitted to the EA 2022 DSM. Openings are placed only on photographed faces;
 * sizes and timber spacing are interpreted. */
export function addParkVilla(
  kit: Kit,
  { terrain }: { terrain: (x: number, z: number) => number },
) {
  const brick = kit.mat('parkVillaBrick', '#ffd5c2');
  brick.map = kit.m.brick.map;
  const render = kit.mat('parkVillaRender', '#ece7da');
  const timber = kit.mat('parkVillaTimber', '#2b2624');
  const frame = kit.mat('parkVillaFrames', '#eceee8');
  const glass = kit.mat('parkVillaGlass', '#5d7378', 0.3);
  const roof = slateMaterial();
  const [mx0, mx1, mz0, mz1] = V.main.rect;
  const base = Math.min(
    ...[
      [mx0, mz0],
      [mx1, mz0],
      [mx0, mz1],
      [mx1, mz1],
    ].map(([x, z]) => terrain(x, z)),
  );
  const footing =
    Math.min(
      ...[V.main, V.south, V.east, V.west].flatMap(
        ({ rect: [x0, x1, z0, z1] }) =>
          [
            [x0, z0],
            [x1, z0],
            [x0, z1],
            [x1, z1],
          ].map(([x, z]) => terrain(x, z)),
      ),
    ) - 2;

  const block = ([x0, x1, z0, z1]: Rect, eaves: number, m: T.Material) =>
    kit.box(
      (x0 + x1) / 2,
      (footing + base + eaves) / 2,
      (z0 + z1) / 2,
      x1 - x0,
      base + eaves - footing,
      z1 - z0,
      m,
    );

  /** Pitched roof over an axis-aligned rectangle. `axis` is the ridge
   * direction; gable triangles close both ends in `gableMaterial`. */
  const pitched = (
    [x0, x1, z0, z1]: Rect,
    eaves: number,
    rise: number,
    axis: 'x' | 'z',
    gableMaterial: T.Material,
  ) => {
    const y0 = base + eaves,
      y1 = y0 + rise,
      over = 0.3;
    const v: number[] = [];
    const quad = (a: number[], b: number[], c: number[], d: number[]) =>
      v.push(...a, ...b, ...c, ...a, ...c, ...d);
    if (axis === 'x') {
      const zm = (z0 + z1) / 2;
      quad(
        [x0 - over, y0, z0 - over],
        [x1 + over, y0, z0 - over],
        [x1 + over, y1, zm],
        [x0 - over, y1, zm],
      );
      quad(
        [x1 + over, y0, z1 + over],
        [x0 - over, y0, z1 + over],
        [x0 - over, y1, zm],
        [x1 + over, y1, zm],
      );
    } else {
      const xm = (x0 + x1) / 2;
      quad(
        [x0 - over, y0, z1 + over],
        [x0 - over, y0, z0 - over],
        [xm, y1, z0 - over],
        [xm, y1, z1 + over],
      );
      quad(
        [x1 + over, y0, z0 - over],
        [x1 + over, y0, z1 + over],
        [xm, y1, z1 + over],
        [xm, y1, z0 - over],
      );
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    roofUV(g);
    const back = g.clone();
    const idx = back.getAttribute('position');
    // Underside of the overhang, so the eaves aren't see-through from below.
    for (let i = 0; i < idx.count; i += 3) {
      const ax = idx.getX(i),
        ay = idx.getY(i),
        az = idx.getZ(i);
      idx.setXYZ(i, idx.getX(i + 1), idx.getY(i + 1), idx.getZ(i + 1));
      idx.setXYZ(i + 1, ax, ay, az);
    }
    back.computeVertexNormals();
    kit.batch(g, roof);
    kit.batch(back, timber);
    const ends = axis === 'x' ? [x0, x1] : [z0, z1];
    for (const e of ends)
      gable(
        axis,
        e,
        axis === 'x' ? [z0, z1] : [x0, x1],
        y0,
        rise,
        gableMaterial,
      );
  };

  /** Vertical gable triangle at `at` across `span`, facing along `axis`. */
  const gable = (
    axis: 'x' | 'z',
    at: number,
    [s0, s1]: number[],
    y0: number,
    rise: number,
    m: T.Material,
  ) => {
    const shape = new T.Shape([
      new T.Vector2(s0, 0),
      new T.Vector2(s1, 0),
      new T.Vector2((s0 + s1) / 2, rise),
    ]);
    const g = new T.ShapeGeometry(shape);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const s = p.getX(i),
        y = p.getY(i);
      if (axis === 'x') p.setXYZ(i, at, y0 + y, s);
      else p.setXYZ(i, s, y0 + y, at);
    }
    g.computeVertexNormals();
    kit.batch(g, m === render ? doubleRender : doubleBrick);
  };
  const doubleRender = render.clone();
  doubleRender.side = T.DoubleSide;
  const doubleBrick = brick.clone();
  doubleBrick.side = T.DoubleSide;

  /** Black timbers over a white gable on a face. `out` is the outward
   * direction (+1/-1) along the face normal axis. */
  const timbers = (
    axis: 'x' | 'z',
    at: number,
    out: number,
    [s0, s1]: number[],
    y0: number,
    rise: number,
    band = 0,
  ) => {
    const p = (s: number, y: number, d = 0.06) =>
      axis === 'x'
        ? new T.Vector3(at + out * d, y, s)
        : new T.Vector3(s, y, at + out * d);
    const sm = (s0 + s1) / 2,
      half = (s1 - s0) / 2;
    const top = y0 + rise;
    // Bargeboards and tie beam.
    kit.beam(
      p(s0 - 0.25, y0 - 0.12, 0.12),
      p(sm, top + 0.1, 0.12),
      0.22,
      0.06,
      timber,
    );
    kit.beam(
      p(s1 + 0.25, y0 - 0.12, 0.12),
      p(sm, top + 0.1, 0.12),
      0.22,
      0.06,
      timber,
    );
    kit.beam(p(s0, y0), p(s1, y0), 0.16, 0.05, timber);
    // Studs, with diagonal braces in the outer bays.
    const studs = Math.max(3, Math.round((s1 - s0) / 0.55));
    for (let k = 1; k < studs; k++) {
      const s = s0 + ((s1 - s0) * k) / studs;
      const h = rise * (1 - Math.abs(s - sm) / half);
      if (h > 0.25) kit.beam(p(s, y0), p(s, y0 + h), 0.09, 0.05, timber);
    }
    for (const side of [-1, 1]) {
      const sa = sm + side * half * 0.75,
        sb = sm + side * half * 0.35;
      kit.beam(p(sa, y0), p(sb, y0 + rise * 0.55), 0.08, 0.05, timber);
    }
    // Optional half-timbered band below the gable (first floor).
    if (band > 0) {
      const b = (x0: number, x1: number, y: number, h: number) => {
        const c = p((x0 + x1) / 2, y + h / 2, 0.04);
        kit.box(
          c.x,
          c.y,
          c.z,
          axis === 'x' ? 0.03 : x1 - x0,
          h,
          axis === 'x' ? x1 - x0 : 0.03,
          render,
        );
      };
      b(s0, s1, y0 - band, band);
      kit.beam(p(s0, y0 - band), p(s1, y0 - band), 0.14, 0.05, timber);
      for (let k = 0; k <= studs; k++) {
        const s = s0 + ((s1 - s0) * k) / studs;
        kit.beam(p(s, y0 - band), p(s, y0), 0.09, 0.05, timber);
      }
    }
  };

  /** White-framed window on a face. */
  const window = (
    axis: 'x' | 'z',
    at: number,
    out: number,
    s: number,
    bottom: number,
    w: number,
    h: number,
    lights = 2,
  ) => {
    const box = (
      u: number,
      y: number,
      d: number,
      ww: number,
      hh: number,
      dd: number,
      m: T.Material,
    ) =>
      axis === 'x'
        ? kit.box(at + out * d, base + y, s + u, dd, hh, ww, m)
        : kit.box(s + u, base + y, at + out * d, ww, hh, dd, m);
    box(0, bottom + h / 2, 0.05, w + 0.14, h + 0.14, 0.08, frame);
    box(0, bottom + h / 2, 0.09, w, h, 0.03, glass);
    for (let k = 1; k < lights; k++)
      box(
        -w / 2 + (w * k) / lights,
        bottom + h / 2,
        0.11,
        0.05,
        h,
        0.03,
        frame,
      );
    box(0, bottom + h * 0.7, 0.11, w, 0.045, 0.03, frame);
    box(0, bottom - 0.08, 0.1, w + 0.25, 0.1, 0.18, render);
  };

  // Walls.
  block(V.main.rect, V.main.eaves, brick);
  block(V.south.rect, V.south.eaves, brick);
  block(V.east.rect, V.east.eaves, brick);
  block(V.west.rect, V.west.eaves, brick);

  // Roofs: main ridge east-west, south wing north-south, low wings.
  pitched(V.main.rect, V.main.eaves, V.main.rise, 'x', render);
  pitched(V.south.rect, V.south.eaves, V.south.rise, 'z', render);
  pitched(V.east.rect, V.east.eaves, V.east.rise, 'z', brick);
  pitched(V.west.rect, V.west.eaves, V.west.rise, 'z', brick);

  // Photographed half-timbered gables: south wing (south) and main (east).
  const [sx0, sx1, , sz1] = V.south.rect;
  timbers('z', sz1, 1, [sx0, sx1], base + V.south.eaves, V.south.rise, 1.4);
  timbers('x', mx1, 1, [mz0, mz1], base + V.main.eaves, V.main.rise);

  // Cross-gable dormer on the main block's south face, east of the wing.
  const d = V.dormer;
  const dx0 = d.x - d.width / 2,
    dx1 = d.x + d.width / 2;
  pitched([dx0, dx1, mz1 - 2.2, mz1], V.main.eaves, d.rise, 'z', render);
  timbers('z', mz1, 1, [dx0, dx1], base + V.main.eaves, d.rise);
  window('z', mz1, 1, d.x, V.main.eaves + 0.25, 1.1, 1.0);

  // Openings on photographed faces only.
  const sm = (sx0 + sx1) / 2;
  window('z', sz1, 1, sm, 0.7, 2.4, 1.6, 3);
  window('z', sz1, 1, sm, 4.2, 1.6, 1.05, 2);
  window('z', mz1, 1, d.x, 0.75, 1.5, 1.55, 2);
  window('z', mz1, 1, d.x, 3.35, 1.2, 1.25, 2);
  const em = (mz0 + mz1) / 2;
  // The low east wing covers the ground floor; first-floor lights only.
  for (const u of [-2.5, 2.5]) window('x', mx1, 1, em + u, 3.4, 1.2, 1.3, 2);
  window('x', mx1, 1, em, V.main.eaves + 0.6, 1.0, 1.0, 2);

  // Tall stacks with oversailing caps and pots.
  for (const [x, z] of V.stacks) {
    const top = base + V.stackTop - 0.55;
    const bottom = base + V.main.eaves;
    kit.box(x, (top + bottom) / 2, z, 0.95, top - bottom, 0.62, brick);
    kit.box(x, top + 0.05, z, 1.15, 0.12, 0.8, brick);
    for (const off of [-0.22, 0.22]) {
      const pot = new T.CylinderGeometry(0.11, 0.13, 0.42, 10);
      pot.translate(x + off, top + 0.32, z);
      kit.batch(pot, kit.mat('parkVillaPots', '#9a5a43'));
    }
  }
}
