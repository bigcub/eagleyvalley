import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Feature, P } from '../core/geo';
import { masonryTexture } from '../materials/masonry-texture';
import { housingUV } from '../materials/housing-brick';
import { slateMaterial, roofUV } from '../materials/building-surfaces';
import {
  OSM,
  VALE_VIEW_FRONTS as H,
  VALE_VIEW_CHIMNEYS,
} from '../world/layout';

/** Older stone row beside Vale View. Front groups individually observed;
 * tree-hidden openings/rears unresolved, all dimensions fitted estimates. */
export function addValeViewTerrace(
  kit: Kit,
  {
    buildings,
    ground,
  }: { buildings: Feature[]; ground: (x: number, z: number) => number },
) {
  const map = masonryTexture();
  const stone = kit.mat('valeViewStone', '#ded7bd');
  stone.map = map;
  stone.bumpMap = map;
  stone.bumpScale = 0.035;
  const surround = kit.mat('valeViewSurround', '#c3bca5');
  const white = kit.mat('valeViewWhite', '#e2e5df');
  const dark = kit.mat('valeViewDark', '#35403b');
  const glass = kit.mat('valeViewGlass', '#758a8d', 0.35);
  const brown = kit.mat('valeViewBrownDoor', '#785343');
  const burgundy = kit.mat('valeViewRedDoor', '#563b38');
  const grey = kit.mat('valeViewGreyDoor', '#929a92');
  const pots = kit.mat('valeViewChimneyPots', '#835847');
  const roof = slateMaterial();
  const base = Math.max(
    ...H.map((h) => ground((h.a[0] + h.b[0]) / 2, (h.a[1] + h.b[1]) / 2)),
  );
  const along: P = [0.906, 0.423];
  // Facade-local stone courses: 16 courses per texture, estimated 180mm high.
  const stoneUV = (g: T.BufferGeometry) => {
    housingUV(g, H[0].a, along);
    const uv = g.getAttribute('uv');
    for (let k = 0; k < uv.count; k++)
      uv.setXY(k, (uv.getX(k) * 1.8) / 2.88, (uv.getY(k) * 1.8) / 2.88);
  };
  const shell = (points: P[], height: number) => {
    const bottom = Math.min(
      base - 0.25,
      ...points.map((p) => ground(...p) - 0.25),
    );
    const g = new T.ExtrudeGeometry(
      new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1]))),
      { depth: base + height - bottom, bevelEnabled: false },
    );
    g.rotateX(-Math.PI / 2);
    g.translate(0, bottom, 0);
    stoneUV(g);
    kit.batch(g, stone);
  };
  for (const id of OSM.valeViewTerrace) {
    const f = buildings.find((f) => f.id === id);
    if (f) shell(f.points.slice(0, -1), 5.5);
  }
  const roofPart = (a: P, b: P, depth: number, hip: boolean) => {
    const w = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const u: P = [(b[0] - a[0]) / w, (b[1] - a[1]) / w],
      n: P = [-u[1], u[0]];
    const to = (s: number, y: number, v: number) => [
      a[0] + u[0] * s + n[0] * v,
      base + y,
      a[1] + u[1] * s + n[1] * v,
    ];
    const inset = hip ? 1.8 : 0;
    const vs = [
      to(-0.15, 5.5, 0.2),
      to(w + 0.15, 5.5, 0.2),
      to(inset, 6.6, -depth / 2),
      to(w - inset, 6.6, -depth / 2),
      to(-0.15, 5.5, -depth - 0.2),
      to(w + 0.15, 5.5, -depth - 0.2),
    ];
    const make = (ix: number[], m: T.Material) => {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(vs.flat(), 3));
      g.setIndex(ix);
      const flat = g.toNonIndexed();
      flat.computeVertexNormals();
      if (m === stone) stoneUV(flat);
      else roofUV(flat);
      kit.batch(flat, m);
      g.dispose();
    };
    make([0, 3, 2, 0, 1, 3, 2, 5, 4, 2, 3, 5], roof);
    make([0, 2, 4, 1, 5, 3], hip ? roof : stone);
  };
  roofPart(H[0].a, H[0].b, 9.7, true);
  roofPart(H[1].a, H[5].b, 9.7, true);
  // Concealed roof portions stay inside their mapped outlines. A shallow
  // slate cap is provisional until the rear pitch/joins can be established.
  for (const id of OSM.valeViewTerrace) {
    const f = buildings.find((f) => f.id === id);
    if (!f) continue;
    const g = new T.ShapeGeometry(
      new T.Shape(f.points.slice(0, -1).map((p) => new T.Vector2(p[0], -p[1]))),
    );
    g.rotateX(-Math.PI / 2);
    g.translate(0, base + 5.53, 0);
    roofUV(g);
    kit.batch(g, roof);
  }
  for (const h of H) {
    const w = Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1]);
    const u: P = [(h.b[0] - h.a[0]) / w, (h.b[1] - h.a[1]) / w],
      n: P = [-u[1], u[0]];
    const rot = Math.atan2(-u[1], u[0]);
    const B = (
      s: number,
      y: number,
      v: number,
      ww: number,
      hh: number,
      d: number,
      m: T.Material,
    ) => {
      const g = new T.BoxGeometry(ww, hh, d);
      g.rotateY(rot);
      g.translate(
        h.a[0] + u[0] * s + n[0] * v,
        base + y,
        h.a[1] + u[1] * s + n[1] * v,
      );
      if (m === stone) stoneUV(g);
      kit.batch(g, m);
    };
    B(w / 2, 5.44, 0.12, w, 0.14, 0.22, surround);
    B(w / 2, 5.58, 0.19, w + 0.15, 0.1, 0.14, dark);
    const window = (
      s: number,
      bottom: number,
      ww: number,
      hh: number,
      frame: T.Material,
      cols: number,
      rows: number,
    ) => {
      B(s, bottom + hh / 2, 0.12, ww + 0.26, hh + 0.28, 0.14, surround);
      B(s, bottom + hh / 2, 0.21, ww + 0.09, hh + 0.09, 0.09, frame);
      B(s, bottom + hh / 2, 0.27, ww, hh, 0.03, glass);
      for (let k = 1; k < cols; k++)
        B(
          s - ww / 2 + (ww * k) / cols,
          bottom + hh / 2,
          0.29,
          0.04,
          hh,
          0.025,
          frame,
        );
      for (let k = 1; k < rows; k++)
        B(s, bottom + (hh * k) / rows, 0.29, ww, 0.04, 0.025, frame);
      B(s, bottom - 0.12, 0.19, ww + 0.36, 0.14, 0.28, surround);
    };
    const door = (s: number, m: T.Material) => {
      B(s, 1.1, 0.14, 1.14, 2.3, 0.14, surround);
      B(s, 1.04, 0.24, 0.9, 2.07, 0.04, m);
      B(s, 2.16, 0.25, 0.83, 0.2, 0.025, glass);
      for (const y of [0.58, 1.37]) B(s, y, 0.27, 0.65, 0.6, 0.02, m);
      B(s + 0.3, 1.0, 0.29, 0.06, 0.06, 0.03, dark);
    };
    if (h.style === 'west') {
      window(w * 0.7, 3.65, 1.15, 1.3, white, 3, 4);
      // Ground head visible, opening count/extent hidden by hedge.
    } else if (h.style === 'sash') {
      window(1.15, 3.65, 1.15, 1.3, white, 3, 4);
      window(1.15, 0.72, 1.15, 1.65, white, 3, 4);
      for (const y of [2.59, 5.17]) B(1.15, y, 0.23, 1.45, 0.15, 0.24, white);
      door(w - 0.7, burgundy);
    } else if (h.style === 'dark') {
      window(w * 0.69, 3.65, 1.18, 1.3, dark, 3, 2);
      window(w * 0.69, 0.7, 1.2, 1.68, dark, 2, 2);
      door(0.65, grey);
    } else if (h.style === 'white') {
      window(1.2, 3.7, 1.1, 1.2, white, 2, 2);
      window(1.2, 0.7, 1.12, 1.7, white, 2, 2);
      door(w - 0.65, brown);
    } else if (h.style === 'hidden') {
      window(w * 0.35, 3.65, 1.1, 1.3, dark, 3, 2);
    } else {
      window(w * 0.35, 0.8, 1.35, 1.55, white, 2, 2);
      // Upper/end glimpses do not establish independent opening counts.
    }
    B(0.08, 2.75, 0.2, 0.065, 5.5, 0.065, dark);
  }
  for (const {
    point: [x, z],
    pots: count,
  } of VALE_VIEW_CHIMNEYS) {
    const g = new T.BoxGeometry(0.9, 1.25, 0.8);
    g.translate(x, base + 6.85, z);
    stoneUV(g);
    kit.batch(g, stone);
    kit.box(x, base + 7.51, z, 1.04, 0.13, 0.94, surround);
    for (let k = 0; k < count; k++) {
      const dx = (k - (count - 1) / 2) * 0.3;
      const p = new T.CylinderGeometry(0.115, 0.14, 0.42, 8);
      p.translate(x + dx, base + 7.77, z);
      kit.batch(p, pots);
    }
  }
}
