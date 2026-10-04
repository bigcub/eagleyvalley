import * as T from 'three';
import { densify, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { masonryUV } from '../materials/building-surfaces';
import { masonryTexture } from '../materials/masonry-texture';
import { SCHOOL_STREET as D } from '../world/layout';
import type { Surface } from '../world/surface';

/** Public south boundary. Video establishes its character; sizes are fitted.
 * Private School House access and hidden eastern recesses remain separate. */
export function addSchoolStreetWall(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const stone = kit.mat('schoolStreetWall', '#f0eee2');
  stone.map = masonryTexture(true);
  stone.bumpMap = stone.map;
  stone.bumpScale = 0.09;
  const surround = kit.mat('schoolStreetWallSurround', '#aaa693');
  surround.map = masonryTexture();
  surround.bumpMap = surround.map;
  surround.bumpScale = 0.045;
  const infill = kit.mat('schoolStreetBlindInfill', '#e0daca');
  infill.map = stone.map;
  infill.bumpMap = stone.map;
  infill.bumpScale = 0.09;
  const base = kit.mat('schoolStreetDampBase', '#777c65');
  base.map = stone.map;
  const cap = kit.mat('schoolStreetWallCap', '#777b75');
  const p = densify(D.southWall, 0.7);
  const walls: { a: P; b: P }[] = [];
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1],
      b = p[i],
      length = Math.hypot(b[0] - a[0], b[1] - a[1]),
      angle = Math.atan2(b[0] - a[0], b[1] - a[1]),
      ya = surface.roadY(...a) - 0.2,
      yb = surface.roadY(...b) - 0.2;
    // Sloped solid wall and cap: no stairs in the public pavement.
    const piece = (
      height: number,
      bottom: number,
      width: number,
      material: T.Material,
    ) => {
      const g = new T.BoxGeometry(width, height, length + 0.015);
      const v = g.getAttribute('position');
      for (let j = 0; j < v.count; j++) {
        const t = (v.getZ(j) + length / 2) / length;
        v.setY(
          j,
          v.getY(j) + T.MathUtils.lerp(ya, yb, t) + bottom + height / 2,
        );
      }
      g.rotateY(angle);
      g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
      g.computeVertexNormals();
      masonryUV(g, 2);
      kit.batch(g, material);
    };
    piece(D.wallHeight + 0.2, 0, 0.48, stone);
    piece(0.4, 0, 0.486, base);
    piece(0.09, D.wallHeight + 0.2, 0.55, cap);
    walls.push({ a, b });
  }
  const a = D.southWall[3],
    b = D.southWall[4],
    length = Math.hypot(b[0] - a[0], b[1] - a[1]),
    dx = (b[0] - a[0]) / length,
    dz = (b[1] - a[1]) / length,
    // Street is north of this run. Recess surrounds sit in front of the
    // inset infill: this is a blocked stone opening, never glazed or black.
    nx = dz,
    nz = -dx,
    angle = Math.atan2(-dz, dx);
  for (const u of D.recesses) {
    const x = a[0] + dx * u,
      z = a[1] + dz * u,
      y = surface.roadY(x, z);
    const block = (
      along: number,
      up: number,
      w: number,
      h: number,
      depth: number,
      material: T.Material,
      out: number,
    ) =>
      kit.box(
        x + dx * along + nx * out,
        y + up,
        z + dz * along + nz * out,
        w,
        h,
        depth,
        material,
        angle,
      );
    block(0, 1.31, 0.74, 1.48, 0.025, infill, 0.254);
    for (const side of [-1, 1])
      block(side * 0.47, 1.32, 0.2, 1.67, 0.12, surround, 0.28);
    block(0, 2.1, 1.13, 0.18, 0.15, surround, 0.3);
    block(0, 0.54, 1.17, 0.17, 0.2, surround, 0.31);
  }
  return walls;
}
