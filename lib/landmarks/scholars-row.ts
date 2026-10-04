import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Feature, P } from '../core/geo';
import { OSM, SCHOLARS_MODERN_ROW as H } from '../world/layout';
import { housingBrick, housingUV } from '../materials/housing-brick';
import { roofUV, slateMaterial } from '../materials/building-surfaces';

/** Seven photographed fronts. Rear/ends remain unsurveyed; no private entry route. */
export function addScholarsRow(
  kit: Kit,
  {
    buildings,
    ground,
    terrain,
  }: {
    buildings: Feature[];
    ground: (x: number, z: number) => number;
    terrain: (x: number, z: number) => number;
  },
) {
  const length = Math.hypot(H.to[0] - H.from[0], H.to[1] - H.from[1]);
  const along: P = [
    (H.to[0] - H.from[0]) / length,
    (H.to[1] - H.from[1]) / length,
  ];
  const rot = Math.atan2(-along[1], along[0]);
  const point = (u: number, v: number): P => [
    H.from[0] + along[0] * u - along[1] * v,
    H.from[1] + along[1] * u + along[0] * v,
  ];
  const floors = H.homes.map((h) => ground(...point(h.u, 0.3)));
  const datum = Math.max(...floors);
  const brick = housingBrick(kit, 'scholarsRowBrick', 'red');
  const stone = kit.mat('scholarsRowBands', '#c6b798');
  const white = kit.mat('scholarsRowFrames', '#e1e5df');
  const glass = kit.mat('scholarsRowGlass', '#84999e', 0.35);
  const dark = kit.mat('scholarsRowIron', '#303734');
  const roof = slateMaterial();
  const geometry = (
    vertices: number[],
    indices: number[],
    material: T.Material,
  ) => {
    const g = new T.BufferGeometry(),
      pos: number[] = [];
    for (let i = 0; i < vertices.length; i += 3) {
      const [x, z] = point(vertices[i], vertices[i + 2]);
      pos.push(x, datum + vertices[i + 1], z);
    }
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(indices);
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    if (material === brick) housingUV(flat, H.from, along);
    else roofUV(flat);
    kit.batch(flat, material);
    g.dispose();
  };
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
  ) => {
    const [x, z] = point(u, v);
    if (material === brick) {
      const g = new T.BoxGeometry(w, h, d);
      g.rotateY(rot);
      g.translate(x, datum + y, z);
      housingUV(g, H.from, along);
      kit.batch(g, material);
    } else kit.box(x, datum + y, z, w, h, d, material, rot);
  };
  for (const f of buildings.filter((f) =>
    OSM.scholarsModernRow.includes(f.id),
  )) {
    const p = f.points.slice(0, -1);
    const bottom = Math.min(...p.map((q) => terrain(...q))) - 0.15;
    // The photographed frontage is continuous. Small mapped polygon jogs
    // must not protrude through the fitted windows. Rear vertices and the
    // original movement colliders stay mapped; the front plane is estimated.
    const shape = new T.Shape(
      p.map(([x, z]) => {
        const v = -(x - H.from[0]) * along[1] + (z - H.from[1]) * along[0];
        return v > -1
          ? new T.Vector2(x + along[1] * v, -(z - along[0] * v))
          : new T.Vector2(x, -z);
      }),
    );
    const g = new T.ExtrudeGeometry(shape, {
      depth: datum + H.eaves - bottom,
      bevelEnabled: false,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bottom, 0);
    housingUV(g, H.from, along);
    kit.batch(g, brick);
  }
  geometry(
    [
      0,
      H.eaves,
      0,
      length,
      H.eaves,
      0,
      0,
      H.ridge,
      -H.depth / 2,
      length,
      H.ridge,
      -H.depth / 2,
      0,
      H.eaves,
      -H.depth,
      length,
      H.eaves,
      -H.depth,
    ],
    [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4],
    roof,
  );
  for (const u of [0, length])
    geometry(
      [u, H.eaves, 0, u, H.ridge, -H.depth / 2, u, H.eaves, -H.depth],
      u === 0 ? [0, 1, 2] : [0, 2, 1],
      brick,
    );
  // Cross-gable roofs meet the shared ridge, rather than seven unrelated hips.
  for (const g of H.gables) {
    const l = g.u - g.width / 2,
      r = g.u + g.width / 2;
    geometry(
      [l, H.eaves, 0, r, H.eaves, 0, g.u, H.eaves + g.rise, 0],
      [0, 1, 2],
      brick,
    );
    geometry(
      [
        l,
        H.eaves + 0.03,
        0.2,
        r,
        H.eaves + 0.03,
        0.2,
        g.u,
        H.eaves + g.rise + 0.03,
        0.2,
        l,
        H.ridge,
        -H.depth / 2,
        r,
        H.ridge,
        -H.depth / 2,
        g.u,
        H.ridge,
        -H.depth / 2,
      ],
      [0, 2, 3, 2, 5, 3, 2, 1, 5, 1, 4, 5],
      roof,
    );
    for (const u of [l, r]) {
      const a = point(u, 0.23),
        b = point(g.u, 0.23);
      kit.beam(
        new T.Vector3(a[0], datum + H.eaves, a[1]),
        new T.Vector3(b[0], datum + H.eaves + g.rise, b[1]),
        0.12,
        0.12,
        white,
      );
    }
  }
  const window = (
    u: number,
    bottom: number,
    height: number,
    width: number,
    columns: number,
  ) => {
    const cy = bottom + height / 2;
    B(u, cy, 0.08, width + 0.13, height + 0.12, 0.1, white);
    B(u, cy, 0.16, width, height, 0.04, glass);
    for (let c = 1; c < columns; c++)
      B(u + width * (c / columns - 0.5), cy, 0.2, 0.045, height, 0.035, white);
    B(u, bottom + height - 0.32, 0.2, width, 0.04, 0.035, white);
    B(u, bottom - 0.1, 0.17, width + 0.24, 0.13, 0.24, stone);
    B(u, bottom + height + 0.16, 0.08, width + 0.24, 0.18, 0.14, stone);
  };
  for (const [i, h] of H.homes.entries()) {
    window(h.u, 7.03, 1.35, h.width, h.balcony ? 3 : 2);
    window(h.u, 4.2, 1.35, h.width, h.balcony ? 3 : 2);
    if (h.balcony) {
      const w = 4.4;
      B(h.u, 3.17, 0.42, w, 0.11, 0.6, stone);
      B(h.u, 3.61, 0.72, w, 0.88, 0.14, brick);
      B(h.u, 4.06, 0.72, w + 0.05, 0.09, 0.2, stone);
      for (const y of [4.1, 4.45]) B(h.u, y, 0.72, w, 0.045, 0.045, dark);
      for (let k = 0; k <= 16; k++)
        B(h.u - w / 2 + (w * k) / 16, 4.27, 0.72, 0.025, 0.35, 0.025, dark);
      for (const side of [-1, 1]) {
        B(h.u + (side * w) / 2, 3.61, 0.42, 0.14, 0.88, 0.6, brick);
        B(h.u + (side * w) / 2, 4.27, 0.42, 0.04, 0.35, 0.6, dark);
      }
    }
    if (h.door) {
      const y = floors[i] - datum;
      B(h.u, y + 1.05, 0.09, 1.2, 2.1, 0.12, white);
      B(h.u, y + 1.03, 0.18, 1.02, 2.02, 0.06, dark);
      for (const dx of [-0.29, 0.29]) {
        B(h.u + dx, y + 1.34, 0.22, 0.3, 0.65, 0.03, glass);
        B(h.u + dx, y + 0.43, 0.22, 0.3, 0.55, 0.03, dark);
      }
      B(h.u + 0.38, y + 1, 0.24, 0.045, 0.17, 0.04, stone);
      for (const side of [-1, 1])
        B(h.u + side * 0.85, y + 1.25, 0.7, 0.11, 2.5, 0.11, white);
      geometry(
        [
          h.u - 1.02,
          y + 2.45,
          1.1,
          h.u + 1.02,
          y + 2.45,
          1.1,
          h.u,
          y + 3.4,
          1.1,
        ],
        [0, 1, 2],
        white,
      );
      geometry(
        [
          h.u - 1.12,
          y + 2.47,
          1.18,
          h.u + 1.12,
          y + 2.47,
          1.18,
          h.u,
          y + 3.46,
          1.18,
          h.u - 1.12,
          y + 2.47,
          0,
          h.u + 1.12,
          y + 2.47,
          0,
          h.u,
          y + 3.46,
          0,
        ],
        [0, 2, 3, 2, 5, 3, 2, 1, 5, 1, 4, 5],
        roof,
      );
    }
  }
  // Only the two visible apertures. No unobserved entry behind the hedges.
  for (const g of H.garages) {
    const y = ground(...point(g.u, 0.3)) - datum;
    B(g.u, y + 1.15, 0.07, g.width + 0.2, 2.3, 0.13, white);
    B(g.u, y + 1.13, 0.16, g.width, 2.2, 0.06, dark);
    for (let k = 1; k < 16; k++)
      B(
        g.u,
        y + 0.05 + (2.16 * k) / 16,
        0.2,
        g.width,
        0.015,
        0.02,
        kit.mat('scholarsGarageRibs', '#48514c'),
      );
  }
  for (const y of [3.05, 6.0])
    B(length / 2, y, 0.06, length, 0.18, 0.13, stone);
  B(length / 2, H.eaves, 0.13, length, 0.1, 0.16, dark);
}
