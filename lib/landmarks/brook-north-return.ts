import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Surface } from '../world/surface';
import {
  BROOK_NORTH_RETURN as R,
  BROOK_WEST as W,
  BROOK_WEST_ENTRANCE as E,
} from '../world/layout';
import { brookWestPoint } from './brook-west-entrance';

/** Both slopes and the finial share this interpreted north-end gable profile. */
export function brookWingRoofY(d: number) {
  const wing = W.wing;
  return (
    wing.eaves +
    wing.roofRise * (1 - Math.abs(d + wing.depth / 2) / (wing.depth / 2))
  );
}

/** Details on the existing lower wing, not a second building or an accessible interior. */
export function addBrookNorthReturn(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const wing = W.wing,
    o = R.opening,
    r = o.width / 2,
    spring = o.top - r;
  const stone = kit.mat('brookWestSurround', '#c4bfae');
  const frame = kit.mat('brookWestFrames', '#384851', 0.65);
  const glass = kit.mat('brookWestGlazing', '#91a9b1', 0.35);
  for (const m of [stone, frame, glass]) m.side = T.DoubleSide;
  const B = (
    d: number,
    y: number,
    width: number,
    height: number,
    m: T.Material,
  ) => {
    const [x, z] = brookWestPoint(wing.from - 0.055, d);
    kit.box(x, surface.brookWestEntry + y, z, width, height, 0.11, m, E.angle);
  };
  const panel = (shape: T.Shape, offset: number, m: T.Material) => {
    const g = new T.ShapeGeometry(shape),
      p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const [x, z] = brookWestPoint(wing.from - offset, o.depth + p.getX(i));
      p.setXYZ(i, x, surface.brookWestEntry + p.getY(i), z);
    }
    g.computeVertexNormals();
    kit.batch(g, m);
  };
  const arch = (radius: number, bottom: number) => {
    const s = new T.Shape();
    s.moveTo(-radius, bottom);
    s.lineTo(radius, bottom);
    s.lineTo(radius, spring);
    for (let i = 0; i <= 24; i++) {
      const a = (i * Math.PI) / 24;
      s.lineTo(Math.cos(a) * radius, spring + Math.sin(a) * radius);
    }
    s.closePath();
    return s;
  };
  panel(arch(r + 0.055, o.bottom - 0.055), 0.07, frame);
  panel(arch(r, o.bottom), 0.09, glass);
  // An uninterrupted arched stone head, with jambs down to the base.
  const ring = new T.Shape();
  ring.moveTo(r, spring);
  ring.lineTo(r + R.surround, spring);
  for (let i = 0; i <= 24; i++) {
    const a = (i * Math.PI) / 24;
    ring.lineTo(
      Math.cos(a) * (r + R.surround),
      spring + Math.sin(a) * (r + R.surround),
    );
  }
  ring.lineTo(-r, spring);
  for (let i = 24; i >= 0; i--) {
    const a = (i * Math.PI) / 24;
    ring.lineTo(Math.cos(a) * r, spring + Math.sin(a) * r);
  }
  ring.closePath();
  panel(ring, 0.12, stone);
  for (const d of [o.depth - r - R.surround / 2, o.depth + r + R.surround / 2])
    B(d, (o.bottom + spring) / 2, R.surround, spring - o.bottom, stone);
  B(o.depth, o.bottom - 0.07, o.width + R.surround * 2, 0.14, stone);
  B(o.depth, (o.bottom + o.top) / 2, 0.055, o.top - o.bottom, frame);
  for (const y of R.rails) B(o.depth, y, o.width, 0.06, frame);
  // Courses stop at the opening rather than passing across its glazing.
  const band = kit.mat('brookWestBands', '#aca99a');
  const side = (wing.depth - o.width - R.surround * 2) / 2;
  for (const y of W.bands.filter((y) => y < wing.eaves)) {
    if (y > o.top + R.surround) B(-wing.depth / 2, y, wing.depth, 0.16, band);
    else
      for (const d of [-side / 2, -wing.depth + side / 2])
        B(d, y, side, 0.16, band);
  }
  // Stone coping follows each north rake and meets the relocated ridge finial.
  const u = wing.from - 0.04;
  for (const [d0, d1] of [
    [0, -wing.depth / 2],
    [-wing.depth / 2, -wing.depth],
  ]) {
    const [x0, z0] = brookWestPoint(u, d0),
      [x1, z1] = brookWestPoint(u, d1);
    kit.beam(
      new T.Vector3(x0, surface.brookWestEntry + brookWingRoofY(d0) + 0.12, z0),
      new T.Vector3(x1, surface.brookWestEntry + brookWingRoofY(d1) + 0.12, z1),
      R.coping.width,
      R.coping.height,
      stone,
    );
  }
}
