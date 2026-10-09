import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Feature, P } from '../core/geo';
import { housingBrick, housingUV } from '../materials/housing-brick';
import { roofUV, slateMaterial } from '../materials/building-surfaces';
import {
  WAKEFIELD_HOUSES as H,
  WAKEFIELD_LOW_WING,
  WAKEFIELD_SOUTH_END,
  WAKEFIELD_TOWN_PAIR as TP,
} from '../world/layout';

/** Dedicated courtyard housing. Photographed fronts, mapped footprints;
 * hidden rear openings and fitted heights are provisional. */
export function addWakefieldHouses(
  kit: Kit,
  {
    buildings,
    ground,
  }: { buildings: Feature[]; ground: (x: number, z: number) => number },
) {
  const red = housingBrick(kit, 'wakefieldRedBrick', 'red');
  const buff = housingBrick(kit, 'wakefieldBuffBrick', 'buff');
  const pale = kit.mat('wakefieldStone', '#c9c2ad');
  const frames = kit.mat('wakefieldFrames', '#e2e3da');
  const glass = kit.mat('wakefieldGlass', '#81969c', 0.35);
  const dark = kit.mat('wakefieldIron', '#30332f');
  const render = kit.mat('wakefieldRender', '#dedbc9');
  const door = kit.mat('wakefieldDoor', '#778679');
  const roof = slateMaterial();
  const models = H.map((h) => {
    const f = buildings.find((f) => f.id === h.id)!;
    const width = Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1]);
    const along: P = [(h.b[0] - h.a[0]) / width, (h.b[1] - h.a[1]) / width];
    const normal: P = [-along[1], along[0]];
    const towardCourt =
      normal[0] * (-64 - (h.a[0] + h.b[0]) / 2) +
      normal[1] * (-6 - (h.a[1] + h.b[1]) / 2);
    const out: P = towardCourt >= 0 ? normal : [-normal[0], -normal[1]];
    const points =
      h.id === '727427306' ? WAKEFIELD_SOUTH_END : f.points.slice(0, -1);
    const depth = Math.max(
      ...points.map(
        (p) => -(p[0] - h.a[0]) * out[0] - (p[1] - h.a[1]) * out[1],
      ),
    );
    const base = ground((h.a[0] + h.b[0]) / 2, (h.a[1] + h.b[1]) / 2);
    return { ...h, width, along, out, points, depth, base };
  });
  const bases = new Map<string, number>();
  for (const h of models)
    bases.set(h.group, Math.max(bases.get(h.group) ?? -Infinity, h.base));
  for (const h of models) {
    const base = bases.get(h.group)!;
    const town = h.kind === 'town',
      tall = h.kind === 'garageTown',
      height = town ? 8.3 : tall ? TP.eaves : 5.85;
    const material = town ? red : buff;
    const rot = Math.atan2(-h.along[1], h.along[0]);
    const world = (u: number, v: number): P => [
      h.a[0] + h.along[0] * u + h.out[0] * v,
      h.a[1] + h.along[1] * u + h.out[1] * v,
    ];
    const B = (
      u: number,
      y: number,
      v: number,
      w: number,
      hh: number,
      d: number,
      m: T.Material,
    ) => {
      const [x, z] = world(u, v);
      const g = new T.BoxGeometry(w, hh, d);
      g.rotateY(rot);
      g.translate(x, base + y, z);
      if (m === material) housingUV(g, h.a, h.along);
      kit.batch(g, m);
    };
    const wall = (points: P[], hh: number) => {
      const bottom = Math.min(
        base - 0.3,
        ...points.map((p) => ground(...p) - 0.25),
      );
      const shape = new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1])));
      const g = new T.ExtrudeGeometry(shape, {
        depth: base + hh - bottom,
        bevelEnabled: false,
      });
      g.rotateX(-Math.PI / 2);
      g.translate(0, bottom, 0);
      housingUV(g, h.a, h.along);
      kit.batch(g, material);
    };
    wall(h.points, height);
    const roofPart = (
      u0: number,
      u1: number,
      depth: number,
      eave: number,
      rise: number,
    ) => {
      const vertices: number[] = [];
      for (const [u, y, v] of [
        [u0 - 0.15, eave, 0.2],
        [u1 + 0.15, eave, 0.2],
        [u0 - 0.15, eave + rise, -depth / 2],
        [u1 + 0.15, eave + rise, -depth / 2],
        [u0 - 0.15, eave, -depth - 0.2],
        [u1 + 0.15, eave, -depth - 0.2],
      ]) {
        const p = world(u, v);
        vertices.push(p[0], base + y, p[1]);
      }
      const make = (indices: number[], m: T.Material) => {
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
        g.setIndex(indices);
        const flat = g.toNonIndexed();
        flat.computeVertexNormals();
        if (m === material) housingUV(flat, h.a, h.along);
        else roofUV(flat);
        kit.batch(flat, m);
        g.dispose();
      };
      make([0, 2, 3, 0, 3, 1, 2, 4, 5, 2, 5, 3], roof);
      make([0, 4, 2, 1, 3, 5], material);
      B((u0 + u1) / 2, eave, 0.25, u1 - u0 + 0.35, 0.13, 0.16, dark);
      B((u0 + u1) / 2, eave, -depth - 0.25, u1 - u0 + 0.35, 0.13, 0.16, dark);
    };
    roofPart(0, h.width, h.depth, height, town ? 1.9 : tall ? TP.rise : 1.75);
    const window = (
      u: number,
      bottom: number,
      w: number,
      hh: number,
      panes = 2,
      v = 0.16,
    ) => {
      B(u, bottom + hh / 2, v, w + 0.12, hh + 0.12, 0.12, frames);
      B(u, bottom + hh / 2, v + 0.08, w, hh, 0.04, glass);
      for (let p = 1; p < panes; p++)
        B(
          u - w / 2 + (w * p) / panes,
          bottom + hh / 2,
          v + 0.11,
          0.045,
          hh,
          0.025,
          frames,
        );
      B(u, bottom + hh - 0.32, v + 0.11, w, 0.04, 0.025, frames);
      B(u, bottom - 0.1, v, w + 0.25, 0.14, 0.23, pale);
    };
    const entrance = (u: number) => {
      B(u, 1.1, 0.18, 1.05, 2.25, 0.1, pale);
      B(u, 1.07, 0.25, 0.9, 2.14, 0.04, door);
      window(u, 1.2, 0.5, 0.68, 2, 0.28);
      B(u, 2.36, 0.55, 1.65, 0.12, 1.0, dark);
    };
    if (town) {
      B(h.width / 2, 7.35, 0.07, h.width, 1.78, 0.14, render);
      for (let course = 0.18; course < 2.85; course += 0.34)
        B(h.width / 2, course, 0.13, h.width, 0.27, 0.22, pale);
      B(h.width / 2, 2.97, 0.15, h.width, 0.18, 0.28, pale);
      B(3.3, 1.18, 0.2, 2.42, 2.36, 0.1, frames);
      for (let k = -1.1; k < 1.15; k += 0.14)
        B(3.3 + k, 1.18, 0.27, 0.015, 2.25, 0.02, pale);
      B(0.82, 1.08, 0.21, 0.9, 2.16, 0.1, dark);
      for (const u of [1.25, 3.85]) {
        window(u, 3.18, 0.95, 1.86);
        window(u, 6.56, 1.03, 1.27);
        B(u, 5.2, 0.15, 1.25, 0.22, 0.23, pale);
        for (const y of [3.0, 3.98]) B(u, y, 0.55, 1.45, 0.06, 0.06, dark);
        for (const du of [-0.7, 0.7])
          B(u + du, 3.49, 0.55, 0.06, 0.98, 0.06, dark);
        for (let offset = -1.1; offset < 1.2; offset += 0.28)
          for (const slope of [-1, 1]) {
            const lo = Math.max(-0.7, slope === 1 ? -offset : offset - 0.98),
              hi = Math.min(0.7, slope === 1 ? 0.98 - offset : offset);
            if (hi > lo) {
              const a = world(u + lo, 0.55),
                b = world(u + hi, 0.55);
              kit.beam(
                new T.Vector3(a[0], base + 3 + slope * lo + offset, a[1]),
                new T.Vector3(b[0], base + 3 + slope * hi + offset, b[1]),
                0.024,
                0.024,
                dark,
              );
            }
          }
      }
    } else if (h.kind === 'arched') {
      entrance(h.width - 0.85);
      window(1.8, 0.72, 2.1, 1.35, 3);
      window(1.85, 3.62, 1.13, 1.37);
      window(h.width - 0.95, 3.83, 0.65, 1.0, 1);
      // Photographed semicircular stone cap, not a rectangular generic head.
      const points: number[] = [];
      for (let k = 0; k <= 20; k++) {
        const t = (k * Math.PI) / 20,
          p = world(1.85 + Math.cos(t) * 0.61, 0.25);
        points.push(p[0], base + 5.1 + Math.sin(t) * 0.61, p[1]);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
      const ix: number[] = [];
      for (let k = 1; k < 20; k++) {
        const facing = -h.along[1] * h.out[0] + h.along[0] * h.out[1];
        ix.push(0, facing > 0 ? k : k + 1, facing > 0 ? k + 1 : k);
      }
      g.setIndex(ix);
      g.computeVertexNormals();
      roofUV(g);
      kit.batch(g, pale);
    } else {
      // Two photographed main windows and an entrance; narrower small lights on the returns.
      entrance(1.05);
      window(h.width * 0.67, 0.7, 1.95, 1.4, 3);
      window(h.width * 0.67, 3.63, 1.25, 1.35);
      window(1.05, 3.86, 0.68, 1.05, 1);
      if (h.kind === 'bay') {
        window(h.width - 1.5, 3.38, 2.75, 1.24, 4, 0.7);
        B(
          h.width - 1.5,
          2.97,
          0.62,
          2.96,
          0.78,
          1.0,
          kit.mat('wakefieldTimberBay', '#655747'),
        );
        B(h.width - 1.5, 4.72, 0.6, 3.14, 0.13, 1.18, dark);
      }
    }
    B(h.width - 0.09, height / 2, 0.2, 0.07, height, 0.07, dark);
    if (tall) {
      // Road-facing front on the far side of the court-side line.
      const face = -h.depth,
        out = (v: number) => face - v;
      const red = kit.mat('wakefieldTownRed', '#b9705a');
      red.map = kit.m.brick.map;
      const [s1, s2] = TP.storeys;
      B(h.width / 2, (s1 + s2) / 2, out(0.03), h.width, s2 - s1, 0.06, red);
      for (let course = 0.18; course < s1 - 0.1; course += 0.34)
        B(h.width / 2, course, out(0.06), h.width, 0.27, 0.12, pale);
      for (const y of [s1, s2])
        B(h.width / 2, y, out(0.1), h.width, 0.18, 0.2, pale);
      const opening = (
        u: number,
        bottom: number,
        w: number,
        hh: number,
        m: T.Material,
      ) => {
        B(u, bottom + hh / 2, out(0.1), w + 0.16, hh + 0.12, 0.08, frames);
        B(u, bottom + hh / 2, out(0.14), w, hh, 0.04, m);
      };
      const g = TP.ground[h.id];
      const white = kit.mat('wakefieldGarageDoor', '#e6e6df');
      opening(g.garage, 0.02, 2.3, 2.1, white);
      for (let k = 1; k < 6; k++)
        B(g.garage, 0.02 + (k * 2.1) / 6, out(0.17), 2.3, 0.025, 0.02, frames);
      opening(g.door, 0.05, 0.95, 2.1, door);
      window(g.door, 1.75, 0.5, 0.32, 1, out(0.2));
      B(g.door, 2.35, out(0.2), 1.35, 0.14, 0.3, pale);
      // French windows with Juliet balconies; small top-floor windows above.
      for (const t of TP.frenchDoors) {
        const u = h.width * t;
        opening(u, s1 + 0.2, 1.0, 2.1, glass);
        B(u, s1 + 0.2 + 1.05, out(0.17), 0.04, 2.1, 0.02, frames);
        B(u, s1 + 0.14, out(0.12), 1.25, 0.1, 0.24, pale);
        B(u, s1 + 2.42, out(0.12), 1.3, 0.18, 0.18, pale);
        for (const y of [s1 + 0.32, s1 + 1.15])
          B(u, y, out(0.32), 1.2, 0.04, 0.04, dark);
        for (let k = 0; k <= 8; k++)
          B(u - 0.6 + k * 0.15, s1 + 0.74, out(0.32), 0.02, 0.84, 0.02, dark);
        opening(u, s2 + 0.75, 0.85, 1.05, glass);
        B(u, s2 + 0.68, out(0.12), 1.05, 0.1, 0.22, pale);
      }
      B(h.width - 0.05, height / 2, out(0.08), 0.08, height, 0.08, dark);
      if (h.id === '727427304') {
        const [cx, cz] = world(0.45, -h.depth / 2);
        kit.box(
          cx,
          base + height + TP.rise + 0.55,
          cz,
          0.7,
          1.6,
          1.1,
          pale,
          rot,
        );
      }
    }
    if (h.id === '727427306') {
      const endWindow = (
        v: number,
        bottom: number,
        w: number,
        hh: number,
        panes = 2,
      ) => {
        B(
          h.width + 0.08,
          bottom + hh / 2,
          v,
          0.12,
          hh + 0.12,
          w + 0.12,
          frames,
        );
        B(h.width + 0.15, bottom + hh / 2, v, 0.04, hh, w, glass);
        for (let k = 1; k < panes; k++)
          B(
            h.width + 0.18,
            bottom + hh / 2,
            v - w / 2 + (w * k) / panes,
            0.025,
            hh,
            0.045,
            frames,
          );
        B(h.width + 0.18, bottom + hh - 0.3, v, 0.025, 0.04, w, frames);
        B(h.width + 0.1, bottom - 0.1, v, 0.23, 0.14, w + 0.25, pale);
      };
      endWindow(-h.depth * 0.68, 0.65, 1.8, 1.35, 3);
      endWindow(-h.depth * 0.68, 3.7, 1.35, 1.3);
      B(h.width + 0.13, 1.1, -h.depth * 0.2, 0.12, 2.24, 1.0, pale);
      B(h.width + 0.21, 1.08, -h.depth * 0.2, 0.05, 2.14, 0.86, door);
      B(h.width + 0.54, 2.37, -h.depth * 0.2, 0.85, 0.12, 1.65, dark);
      // Round stair light is visible in the Threadfold-facing side reference.
      const circle = (r: number, offset: number, m: T.Material) => {
        const p = world(h.width + offset, -h.depth * 0.32);
        const g = new T.CircleGeometry(r, 32);
        const normal = new T.Vector3(h.along[0], 0, h.along[1]);
        g.applyQuaternion(
          new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), normal),
        );
        g.translate(p[0], base + 3.05, p[1]);
        kit.batch(g, m);
      };
      circle(0.48, 0.13, pale);
      circle(0.39, 0.16, glass);

      wall(WAKEFIELD_LOW_WING, 2.8);
      // Lower east wing faces Threadfold, with a hipped roof and one three-part window.
      const centre: P = [-29.53, 18.11];
      const corners = WAKEFIELD_LOW_WING;
      const vertices: number[] = [];
      for (const p of corners) vertices.push(p[0], base + 2.82, p[1]);
      vertices.push(centre[0], base + 4.35, centre[1]);
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      const ix: number[] = [];
      for (let k = 0; k < corners.length; k++)
        ix.push(k, (k + 1) % corners.length, corners.length);
      g.setIndex(ix);
      const flat = g.toNonIndexed();
      flat.computeVertexNormals();
      roofUV(flat);
      kit.batch(flat, roof);
      g.dispose();
      const a: P = [-25.67, 16.22],
        b: P = [-27.84, 22.04];
      const x = (a[0] + b[0]) / 2,
        z = (a[1] + b[1]) / 2,
        r = Math.atan2(b[0] - a[0], b[1] - a[1]);
      kit.box(x, base + 1.5, z, 0.15, 1.5, 2.75, frames, r);
      kit.box(x + 0.06, base + 1.5, z, 0.18, 1.34, 2.59, glass, r);
    }
  }
}
