import * as T from 'three';
import type { Kit } from '../core/kit';

export type DoorDetail =
  | 'oval-glazed'
  | 'paired-glazed'
  | 'paired-panelled'
  | 'arched-glazed';

/** Observed door composition; all sizes and relief depths are estimates. */
export function addDoorDetails(
  kit: Kit,
  {
    style,
    width,
    colour,
    glass,
    box,
    point,
  }: {
    style: DoorDetail;
    width: number;
    colour: T.Material;
    glass: T.Material;
    box: (
      x: number,
      y: number,
      depth: number,
      w: number,
      h: number,
      d: number,
      material: T.Material,
    ) => void;
    point: (x: number, y: number, depth: number) => T.Vector3;
  },
) {
  const recess = kit.mat('streetDoorPanelRecess', '#25292a');
  const brass = kit.mat('streetDoorBrass', '#aa9460', 0.45);
  const panel = (x: number, y: number, w: number, h: number) => {
    box(x, y, 0.084, w, h, 0.01, recess);
    box(x, y, 0.091, w - 0.025, h - 0.025, 0.008, colour);
  };
  const glaze = (shape: T.Shape, depth = 0.087) => {
    const geometry = new T.ShapeGeometry(shape, 24);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const p = point(positions.getX(i), positions.getY(i), depth);
      positions.setXYZ(i, p.x, p.y, p.z);
    }
    geometry.computeVertexNormals();
    kit.batch(geometry, glass);
  };
  if (style === 'oval-glazed') {
    const rx = width * 0.19,
      ry = 0.37,
      cy = 1.44;
    const shape = new T.Shape();
    shape.absellipse(0, cy, rx, ry, 0, Math.PI * 2, false, 0);
    glaze(shape);
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16,
        b = ((i + 1) * Math.PI) / 16;
      kit.beam(
        point(Math.cos(a) * rx, cy + Math.sin(a) * ry, 0.09),
        point(Math.cos(b) * rx, cy + Math.sin(b) * ry, 0.09),
        0.025,
        0.025,
        colour,
      );
    }
    for (const s of [-1, 1]) panel(s * width * 0.22, 0.46, width * 0.3, 0.65);
    box(-width * 0.37, 0.98, 0.105, 0.035, 0.16, 0.025, brass);
    box(0, 0.91, 0.105, width * 0.34, 0.065, 0.02, brass);
  } else if (style === 'arched-glazed') {
    const r = width * 0.3,
      base = 1.59;
    const shape = new T.Shape();
    shape.moveTo(-r, base);
    shape.absarc(0, base, r, Math.PI, 0, true);
    shape.lineTo(-r, base);
    glaze(shape);
    box(0, base, 0.1, r * 2, 0.025, 0.018, colour);
    for (const angle of [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4])
      kit.beam(
        point(0, base, 0.1),
        point(Math.cos(angle) * r, base + Math.sin(angle) * r, 0.1),
        0.022,
        0.022,
        colour,
      );
    for (const side of [-1, 1]) {
      panel(side * width * 0.22, 1.24, width * 0.3, 0.48);
      panel(side * width * 0.22, 0.45, width * 0.3, 0.64);
    }
    box(-width * 0.37, 1.0, 0.105, 0.035, 0.16, 0.025, brass);
    box(0, 0.9, 0.105, width * 0.36, 0.065, 0.02, brass);
  } else if (style === 'paired-panelled') {
    for (const side of [-1, 1]) {
      const x = side * width * 0.22,
        half = width * 0.11;
      panel(x, 1.39, width * 0.3, 0.97);
      const shape = new T.Shape();
      shape.moveTo(x - half, 0.98);
      shape.lineTo(x - half, 1.76);
      shape.quadraticCurveTo(x, 1.86, x + half, 1.76);
      shape.lineTo(x + half, 0.98);
      shape.closePath();
      glaze(shape, 0.103);
      panel(x, 0.43, width * 0.3, 0.58);
    }
    box(-width * 0.37, 0.98, 0.115, 0.035, 0.16, 0.025, brass);
    box(0, 0.85, 0.115, width * 0.42, 0.065, 0.02, brass);
  } else {
    // Lower door partly obscured: retain the plain provisional leaf there.
    for (const s of [-1, 1])
      box(s * width * 0.22, 1.43, 0.087, width * 0.34, 0.9, 0.01, glass);
    box(0, 0.92, 0.105, width * 0.36, 0.065, 0.02, brass);
  }
}
