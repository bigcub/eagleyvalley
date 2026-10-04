import * as T from 'three';
import type { Kit } from '../core/kit';
import { VALLEY_ENGINE_WEST as V } from '../world/layout';
import { VALLEY_ENGINE_SOUTH as S } from '../world/layout';
import { masonryUV } from '../materials/building-surfaces';

/** Photographed west/south conversion faces. Mapped shell/roof stays with
 * Valley Mill. North return and obscured lower details remain open. */
export function addValleyEngineHouse(kit: Kit, { base }: { base: number }) {
  const length = Math.hypot(V.to[0] - V.from[0], V.to[1] - V.from[1]);
  const ux = (V.to[0] - V.from[0]) / length,
    uz = (V.to[1] - V.from[1]) / length;
  const angle = Math.atan2(ux, uz);
  const frame = kit.mat('valleyEngineFrames', '#b6bcb7', 0.7);
  const glass = kit.mat('valleyEngineGlazing', '#99a9ad', 0.35);
  const stone = kit.mat('valleyEngineStone', '#bcb59e');
  const box = (
    u: number,
    y: number,
    d: number,
    w: number,
    h: number,
    depth: number,
    material: T.Material,
  ) =>
    kit.box(
      V.from[0] + ux * u + uz * d,
      base + y,
      V.from[1] + uz * u - ux * d,
      depth,
      h,
      w,
      material,
      angle,
    );
  for (const group of V.groups) {
    for (const [i, row] of V.rows.entries()) {
      // Broad top glazing is visible; middle/base use ordinary paired groups.
      // Two lower central stacks repeat that composition provisionally.
      const w = i === 2 ? group.width : 1.65;
      const columns = i === 2 ? group.columns : 2;
      const h = row.top - row.bottom,
        cy = (row.top + row.bottom) / 2;
      box(group.u, cy, 0.08, w + 0.12, h + 0.1, 0.055, frame);
      box(group.u, cy, 0.12, w, h, 0.045, glass);
      for (let k = 1; k < columns; k++)
        box(
          group.u + w * (k / columns - 0.5),
          cy,
          0.16,
          0.045,
          h,
          0.035,
          frame,
        );
      for (let k = 1; k <= row.divisions; k++)
        box(
          group.u,
          row.bottom + (h * k) / (row.divisions + 1),
          0.16,
          w,
          0.045,
          0.035,
          frame,
        );
      box(group.u, row.bottom - 0.11, 0.14, w + 0.3, 0.16, 0.27, stone);
      box(group.u, row.top + 0.13, 0.1, w + 0.32, 0.18, 0.2, stone);
    }
  }
  for (const y of V.bands) {
    box(length / 2, y, 0.12, length + 0.1, 0.17, 0.29, stone);
    box(length / 2, y + 0.17, 0.08, length + 0.1, 0.08, 0.19, stone);
  }
  addSouthReturn(kit, base, frame, glass, stone);
}

function addSouthReturn(
  kit: Kit,
  base: number,
  frame: T.Material,
  glass: T.Material,
  stone: T.Material,
) {
  const length = Math.hypot(S.to[0] - S.from[0], S.to[1] - S.from[1]);
  const ux = (S.to[0] - S.from[0]) / length,
    uz = (S.to[1] - S.from[1]) / length;
  const point = (u: number, d: number) => [
    S.from[0] + ux * u + uz * d,
    S.from[1] + uz * u - ux * d,
  ];
  const box = (
    u: number,
    y: number,
    d: number,
    w: number,
    h: number,
    m: T.Material,
  ) => {
    const [x, z] = point(u, d);
    kit.box(x, base + y, z, 0.05, h, w, m, Math.atan2(ux, uz));
  };
  const panel = (
    u: number,
    bottom: number,
    top: number,
    width: number,
    rise: number,
    d: number,
    material: T.Material,
  ) => {
    const shape = new T.Shape(),
      r = width / 2;
    shape.moveTo(-r, bottom);
    shape.lineTo(r, bottom);
    shape.lineTo(r, top - rise);
    for (let i = 0; i <= 24; i++) {
      const t = (i * Math.PI) / 24;
      shape.lineTo(r * Math.cos(t), top - rise + rise * Math.sin(t));
    }
    shape.closePath();
    const g = new T.ShapeGeometry(shape),
      p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const [x, z] = point(u + p.getX(i), d);
      p.setXYZ(i, x, base + p.getY(i), z);
    }
    // Local u/y projects clockwise when viewed from outside this return.
    const indices = g.getIndex()!;
    for (let i = 0; i < indices.count; i += 3) {
      const b = indices.getX(i + 1);
      indices.setX(i + 1, indices.getX(i + 2));
      indices.setX(i + 2, b);
    }
    g.computeVertexNormals();
    masonryUV(g, 2);
    kit.batch(g, material);
  };
  const recess = kit.mat('valleyEngineRecess', '#57473c');
  recess.side = T.DoubleSide;
  // This is a brick-filled lunette over rectangular glazing, not a doorway.
  const a = S.arch;
  panel(
    a.u,
    S.bottom - 0.12,
    a.top + 0.12,
    a.width + 0.24,
    a.width / 2 + 0.12,
    0.07,
    stone,
  );
  panel(a.u, S.bottom, a.top, a.width, a.width / 2, 0.09, recess);
  panel(
    a.u,
    S.bottom,
    a.top - 0.16,
    a.width - 0.3,
    (a.width - 0.3) / 2,
    0.11,
    kit.m.brick,
  );
  for (const [i, group] of S.tall.entries()) {
    const h = group.top - S.bottom,
      cy = (group.top + S.bottom) / 2;
    if (i !== 1) {
      panel(
        group.u,
        S.bottom - 0.06,
        group.top + 0.28,
        group.width + 0.22,
        0.28,
        0.08,
        stone,
      );
      panel(
        group.u,
        S.bottom,
        group.top + 0.15,
        group.width + 0.08,
        0.2,
        0.1,
        recess,
      );
    }
    box(group.u, cy, 0.14, group.width + 0.12, h + 0.1, frame);
    box(group.u, cy, 0.18, group.width, h, glass);
    box(group.u, cy, 0.22, 0.05, h, frame);
    for (let k = 1; k <= (i === 1 ? 3 : 5); k++) {
      const count = i === 1 ? 4 : 6;
      box(group.u, S.bottom + (h * k) / count, 0.22, group.width, 0.05, frame);
    }
    box(group.u, S.bottom - 0.12, 0.2, group.width + 0.3, 0.16, stone);
  }
  // Shallow blind panel in the raised upper wall; no invented upper windows.
  const p = S.upperPanel;
  panel(p.u, p.bottom, p.top, p.width, 0, 0.06, recess);
  panel(
    p.u,
    p.bottom + 0.07,
    p.top - 0.12,
    p.width - 0.22,
    0,
    0.08,
    kit.m.brick,
  );
  for (const opening of S.base) {
    const rise = opening.arched ? opening.width / 2 : 0;
    panel(
      opening.u,
      opening.bottom - 0.06,
      opening.top + 0.1,
      opening.width + 0.16,
      rise + (opening.arched ? 0.08 : 0),
      0.08,
      stone,
    );
    panel(
      opening.u,
      opening.bottom,
      opening.top,
      opening.width,
      rise,
      0.12,
      recess,
    );
    if (opening.arched) {
      box(
        opening.u,
        (opening.bottom + opening.top - rise) / 2,
        0.17,
        opening.width - 0.14,
        opening.top - rise - opening.bottom,
        glass,
      );
      box(opening.u, 1.0, 0.21, opening.width - 0.14, 0.05, frame);
      box(opening.u, 1.1, 0.21, 0.05, 1.4, frame);
    }
  }
  for (const y of S.bands) {
    box(length / 2, y, 0.13, length + 0.1, 0.17, stone);
    box(length / 2, y + 0.17, 0.08, length + 0.1, 0.08, stone);
  }
}
