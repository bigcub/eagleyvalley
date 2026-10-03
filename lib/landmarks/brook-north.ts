import * as T from 'three';
import type { Kit } from '../core/kit';
import { BROOK_NORTH } from '../world/layout';
import { masonryUV } from '../materials/building-surfaces';

// May 2012/June 2024 north elevation. Schedule and limits in brook-north-openings.md.
// Dimensions and obscured western openings remain interpreted.
export function addBrookNorth(kit: Kit, { base }: { base: number }) {
  const { box } = kit;
  const { stone, brick, trim, glass, dark } = kit.m;
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
  const frame = kit.mat('brookNorthFrames', '#515a58', 0.65);
  const shade = kit.mat('brookNorthRecess', '#292924', 1);
  for (let floor = 0; floor < 5; floor++) {
    const y = floor * 3.6,
      material = floor === 0 ? stone : brick;
    for (const opening of BROOK_NORTH.openings) {
      const u = opening.u,
        loading = opening.kind === 'loading',
        balcony = opening.kind === 'balcony';
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
        const door = BROOK_NORTH.balconyDoors;
        b(
          u,
          y + (door.bottom + door.top) / 2,
          -0.19,
          door.width,
          door.top - door.bottom,
          0.035,
          glass,
        );
        if (opening.evidence === 'photographed') {
          for (const du of [-door.width / 2, 0, door.width / 2])
            b(
              u + du,
              y + (door.bottom + door.top) / 2,
              -0.22,
              0.055,
              door.top - door.bottom,
              0.045,
              frame,
            );
          for (const dy of door.rails)
            b(u, y + dy, -0.22, door.width, 0.055, 0.045, frame);
        }
      } else {
        for (const du of [-1.16, -0.39, 0.39, 1.16])
          b(u + du, y + 1.7, -0.2, 0.065, 2.85, 0.07, frame);
        for (const dy of [0.32, 1.23, 2.16, 3.08])
          b(u, y + dy, -0.2, 2.35, 0.065, 0.07, frame);
      }
      if (floor === 3) {
        for (let s = 0; s < 18; s++) {
          const du = -1.25 + ((s + 0.5) * 2.5) / 18,
            yy = y + 3.0 + 0.22 * (1 - Math.pow(du / 1.25, 2));
          b(u + du, yy, -0.26, 2.5 / 18 + 0.01, 0.22, 0.65, brick);
        }
      } else
        b(u, y + 3.18, -0.24, 2.65, 0.25, 0.64, floor === 4 ? brick : trim);
      // East loading stack is glazed on every floor, never a balcony.
      if (loading && floor === 0) {
        for (const side of [-1, 1]) {
          b(u + side * 1.45, 1.65, -0.33, 0.4, 3.3, 0.66, trim);
          b(u + side * 1.45, 3.3, -0.33, 0.56, 0.24, 0.66, trim);
        }
        b(u, 3.45, -0.33, 3.48, 0.28, 0.66, trim);
        b(u, 3.64, -0.33, 3.7, 0.12, 0.66, trim);
      }
    }
    for (let k = 0; k <= 14; k++)
      b(k * pitch, y + 1.8, -0.19, 0.6, 3.6, 0.58, material);
    b(length / 2, y + 3.48, -0.23, length, 0.16, 0.66, trim);
  }
  const courses = kit.mat('brookNorthStoneCourses', '#d4d0bf');
  courses.map = kit.m.stone.map;
  const course = (lo: number, hi: number, y: number) => {
    if (hi <= lo) return;
    const [x, z] = p((lo + hi) / 2, -0.53),
      g = new T.BoxGeometry(hi - lo, 0.16, 0.1);
    g.rotateY(angle);
    g.translate(x, base + y, z);
    masonryUV(g, 2);
    kit.batch(g, courses);
  };
  for (const y of BROOK_NORTH.courses) {
    let start = 0;
    for (const opening of BROOK_NORTH.openings) {
      course(start, opening.u - 1.205, y);
      start = opening.u + 1.205;
    }
    course(start, length, y);
  }
  // Strong cornice above the third storey and a continuous parapet.
  b(length / 2, 10.8, -0.3, length + 0.25, 0.32, 0.85, trim);
  b(length / 2, 18.3, 0, length, 0.65, 0.5, brick);
  b(length / 2, 18.65, 0, length + 0.18, 0.14, 0.65, trim);
  // Solid portal piers share the outermost facade depth; register their footprint.
  const u = BROOK_NORTH.openings[BROOK_NORTH.openings.length - 1].u;
  return [
    p(u - 1.85, -0.66),
    p(u + 1.85, -0.66),
    p(u + 1.85, 0),
    p(u - 1.85, 0),
  ];
}
