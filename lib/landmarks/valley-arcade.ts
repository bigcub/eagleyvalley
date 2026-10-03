import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { VALLEY_MILL } from '../world/layout';

/** May 2012 north street views and July 2012 south photos; dimensions fitted, concealed base unresolved. */
export function addValleyArcade(
  kit: Kit,
  {
    base,
    facade,
  }: {
    base: number;
    facade: typeof VALLEY_MILL.north | typeof VALLEY_MILL.south;
  },
) {
  const N = facade;
  const angle = Math.atan2(N.to[0] - N.from[0], N.to[1] - N.from[1]);
  const length = Math.hypot(N.to[0] - N.from[0], N.to[1] - N.from[1]);
  const p = (u: number, d: number): P => [
    N.from[0] + Math.sin(angle) * u + Math.cos(angle) * d,
    N.from[1] + Math.cos(angle) * u - Math.sin(angle) * d,
  ];
  const B = (
    u: number,
    y: number,
    d: number,
    width: number,
    height: number,
    depth: number,
    m: T.Material,
  ) => {
    const [x, z] = p(u, d);
    kit.box(x, base + y, z, depth, height, width, m, angle);
  };
  const frame = kit.mat('valleyEastFrames', '#414e50', 0.6);
  const glass = kit.mat('valleyEastGlazing', '#96aaaf', 0.35);
  const stone = kit.mat('valleyEastStone', '#c6bca6');
  const archBrick = kit.mat('valleyArchBrick', '#b57a57');
  const shadow = kit.mat('valleyNorthRecess', '#26272a');
  for (const m of [frame, glass, archBrick, shadow]) m.side = T.DoubleSide;
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
      pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const [x, z] = p(u + pos.getX(i), d);
      pos.setXYZ(i, x, base + pos.getY(i), z);
    }
    g.computeVertexNormals();
    kit.batch(g, m);
  };
  for (const opening of N.positions) {
    for (let row = 0; row < 4; row++) {
      const spec = row === 0 ? N.ground : N.window,
        y = row * 3.6;
      const bottom = y + spec.bottom,
        top = y + spec.top;
      const balcony = N.balconyRows.includes(row) && opening.top === 'balcony',
        u = opening.u;
      panel(
        shape(spec.width + 0.26, bottom - 0.07, top + 0.13, spec.rise + 0.13),
        u,
        0.08,
        archBrick,
      );
      panel(
        shape(spec.width + 0.1, bottom - 0.03, top + 0.04, spec.rise + 0.04),
        u,
        0.1,
        frame,
      );
      panel(
        shape(spec.width, bottom, top, spec.rise),
        u,
        0.12,
        balcony ? shadow : glass,
      );
      B(u, bottom - 0.1, 0.14, spec.width + 0.25, 0.16, 0.3, stone);
      if (balcony) {
        // Dark back, inset paired doors and iron rail at the opening face.
        B(u, y + 1.55, 0.14, 1.65, 2.2, 0.02, glass);
        for (const du of [-0.8, 0, 0.8])
          B(u + du, y + 1.55, 0.16, 0.045, 2.2, 0.03, frame);
        for (const dy of [0.45, 1.3, 2.65])
          B(u, y + dy, 0.16, 1.65, 0.05, 0.03, frame);
        for (const dy of [0.43, 1.2])
          B(u, y + dy, 0.34, spec.width, 0.045, 0.055, kit.m.dark);
        for (let i = 0; i <= 14; i++)
          B(
            u - spec.width / 2 + (spec.width * i) / 14,
            y + 0.8,
            0.34,
            0.023,
            0.78,
            0.025,
            kit.m.dark,
          );
        for (const side of [-1, 1])
          B(
            u + side * (spec.width / 2 + 0.065),
            y + 1.65,
            0.21,
            0.12,
            2.85,
            0.46,
            kit.m.brick,
          );
      } else {
        for (const du of [-spec.width / 6, spec.width / 6]) {
          const head =
            top -
            spec.rise +
            spec.rise * Math.sqrt(1 - (du / (spec.width / 2)) ** 2);
          B(
            u + du,
            (bottom + head) / 2,
            0.16,
            0.055,
            head - bottom,
            0.04,
            frame,
          );
        }
        for (const fraction of [0, 0.32, 0.64])
          B(
            u,
            bottom + (top - bottom) * fraction,
            0.16,
            spec.width,
            0.055,
            0.04,
            frame,
          );
      }
    }
  }
  // No broad horizontal bands between upper floors. Stone blocks mark pilasters.
  for (const u of N.piers) {
    B(u, 7.2, 0.04, 0.55, 14.4, 0.22, kit.m.brick);
    for (const y of [3.48, 7.2, 10.8, 14.1])
      B(u, y, 0.16, 0.68, 0.15, 0.38, stone);
  }
  B(length / 2, 3.48, 0.12, length, 0.18, 0.36, stone);
  B(N.division, 7.2, 0.08, 0.72, 14.4, 0.32, kit.m.brick);
  for (const y of [3.5, 7.2, 10.8, 14.1])
    B(N.division, y, 0.23, 0.86, 0.22, 0.45, stone);
}
