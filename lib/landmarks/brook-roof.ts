import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { BROOK_ROOF as R, BROOK_WEST_ENTRANCE as E } from '../world/layout';
import { brookWestPoint } from './brook-west-entrance';

/** UP-001 supports visible west composition. Hidden roof edges/openings estimated. */
export function addBrookRoof(
  kit: Kit,
  { base, points }: { base: number; points: P[] },
) {
  const roof = kit.mat('brookRoofSheet', '#929697', 0.85);
  const frame = kit.mat('brookRoofFrames', '#525d61', 0.7);
  const glass = kit.mat('brookRoofGlazing', '#819ca8', 0.4);
  const B = (
    u: number,
    y: number,
    d: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const [x, z] = brookWestPoint(u, d);
    kit.box(x, base + y, z, depth, h, w, m, E.angle);
  };
  kit.polygon([...points, points[0]], roof, base + 18.08);
  // Existing mapped parapet and independent east tower cap retained.
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
    kit.box(
      (a[0] + b[0]) / 2,
      base + 18.3,
      (a[1] + b[1]) / 2,
      0.5,
      0.65,
      len,
      kit.m.brick,
      angle,
    );
    kit.box(
      (a[0] + b[0]) / 2,
      base + 18.65,
      (a[1] + b[1]) / 2,
      0.65,
      0.14,
      len + 0.1,
      kit.m.trim,
      angle,
    );
  }
  const u = (R.from + R.to) / 2,
    d = (R.front + R.back) / 2,
    w = R.to - R.from,
    depth = R.front - R.back;
  B(u, R.floor + R.height / 2, d, w, R.height, depth, roof);
  B(u, R.floor + R.height + 0.045, d, w + 0.12, 0.09, depth + 0.12, roof);
  for (const o of R.westOpenings) {
    const y = R.floor + 0.62;
    B(o.u, y, R.front + 0.045, o.width + 0.1, 0.86, 0.07, frame);
    B(o.u, y, R.front + 0.095, o.width, 0.76, 0.04, glass);
    for (let i = 1; i < o.panes; i++)
      B(
        o.u - o.width / 2 + (o.width * i) / o.panes,
        y,
        R.front + 0.13,
        0.04,
        0.76,
        0.035,
        frame,
      );
    B(o.u, y - 0.41, R.front + 0.13, o.width + 0.12, 0.065, 0.18, frame);
  }
  // Break the former regular grid; exact machinery types and hidden count unresolved.
  for (const [i, [eu, ed]] of R.equipment.entries()) {
    const h = i % 3 === 0 ? 0.35 : 0.18;
    B(eu, R.floor + R.height + h / 2, ed, 0.62, h, 0.8, kit.m.dark);
    B(eu, R.floor + R.height + h + 0.035, ed, 0.7, 0.07, 0.87, roof);
  }
  const cap = new T.ConeGeometry(3.65, 2.05, 4);
  cap.rotateY(Math.PI / 4 - 0.086);
  cap.scale(0.62, 1, 1);
  cap.translate(113.2, base + 22.05, -35.3);
  kit.batch(cap, roof);
}
