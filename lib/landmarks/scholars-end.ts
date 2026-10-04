import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Feature, P } from '../core/geo';
import { OSM, SCHOLARS_ANGLED_PAIR as H } from '../world/layout';
import { housingBrick, housingUV } from '../materials/housing-brick';
import { slateMaterial, roofUV } from '../materials/building-surfaces';

/** Counted front and outer-return groups. Rear openings remain unsurveyed. */
export function addScholarsEnd(
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
  const width = Math.hypot(H.to[0] - H.from[0], H.to[1] - H.from[1]);
  const along: P = [
    (H.to[0] - H.from[0]) / width,
    (H.to[1] - H.from[1]) / width,
  ];
  const rot = Math.atan2(-along[1], along[0]);
  const point = (u: number, v: number): P => [
    H.from[0] + along[0] * u - along[1] * v,
    H.from[1] + along[1] * u + along[0] * v,
  ];
  const frontCentres = [width / 4, (width * 3) / 4];
  const datum = Math.max(...frontCentres.map((u) => ground(...point(u, 0.3))));
  const brick = housingBrick(kit, 'scholarsRowBrick', 'red');
  const white = kit.mat('scholarsRowFrames', '#e1e5df');
  const stone = kit.mat('scholarsRowBands', '#c6b798');
  const glass = kit.mat('scholarsRowGlass', '#84999e', 0.35);
  const dark = kit.mat('scholarsRowIron', '#303734');
  const ribs = kit.mat('scholarsGarageRibs', '#48514c');
  const roof = slateMaterial();
  const box = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    mat: T.Material,
    angle = 0,
  ) => {
    const [x, z] = point(u, v);
    if (mat === brick) {
      const g = new T.BoxGeometry(w, h, d);
      g.rotateY(rot + angle);
      g.translate(x, datum + y, z);
      housingUV(g, H.from, along);
      kit.batch(g, mat);
    } else kit.box(x, datum + y, z, w, h, d, mat, rot + angle);
  };
  const polygon = (vertices: number[], indices: number[], mat: T.Material) => {
    const pos: number[] = [];
    for (let i = 0; i < vertices.length; i += 3) {
      const [x, z] = point(vertices[i], vertices[i + 2]);
      pos.push(x, datum + vertices[i + 1], z);
    }
    const indexed = new T.BufferGeometry();
    indexed.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    indexed.setIndex(indices);
    const g = indexed.toNonIndexed();
    g.computeVertexNormals();
    if (mat === brick) housingUV(g, H.from, along);
    else roofUV(g);
    kit.batch(g, mat);
    indexed.dispose();
  };
  const beam = (a: number[], b: number[], mat: T.Material) => {
    const p = point(a[0], a[2]),
      q = point(b[0], b[2]);
    kit.beam(
      new T.Vector3(p[0], datum + a[1], p[1]),
      new T.Vector3(q[0], datum + b[1], q[1]),
      0.12,
      0.12,
      mat,
    );
  };
  for (const f of buildings.filter((f) =>
    OSM.scholarsAngledPair.includes(f.id),
  )) {
    const p = f.points.slice(0, -1);
    const bottom = Math.min(...p.map((q) => terrain(...q))) - 0.15;
    const g = new T.ExtrudeGeometry(
      new T.Shape(p.map(([x, z]) => new T.Vector2(x, -z))),
      { depth: datum + H.eaves - bottom, bevelEnabled: false },
    );
    g.rotateX(-Math.PI / 2);
    g.translate(0, bottom, 0);
    housingUV(g, H.from, along);
    kit.batch(g, brick);
  }
  // A shared front gable and ridge across the pair, independent of the straight row.
  polygon(
    [0, H.eaves, 0, width, H.eaves, 0, width / 2, H.ridge, 0],
    [0, 1, 2],
    brick,
  );
  polygon(
    [
      0,
      H.eaves,
      -H.depth,
      width,
      H.eaves,
      -H.depth,
      width / 2,
      H.ridge,
      -H.depth,
    ],
    [0, 2, 1],
    brick,
  );
  polygon(
    [
      0,
      H.eaves,
      0,
      width,
      H.eaves,
      0,
      width / 2,
      H.ridge,
      0,
      0,
      H.eaves,
      -H.depth,
      width,
      H.eaves,
      -H.depth,
      width / 2,
      H.ridge,
      -H.depth,
    ],
    [0, 2, 3, 2, 5, 3, 2, 1, 5, 1, 4, 5],
    roof,
  );
  for (const u of [0, width])
    beam([u, H.eaves, 0.12], [width / 2, H.ridge, 0.12], white);
  for (const u of [0, width]) {
    const back = H.backGableCentre,
      span = H.backGableWidth / 2;
    polygon(
      [
        u,
        H.eaves,
        back - span,
        u,
        H.eaves,
        back + span,
        u,
        H.eaves + H.backGableRise,
        back,
      ],
      u === 0 ? [0, 1, 2] : [0, 2, 1],
      brick,
    );
    polygon(
      [
        u,
        H.eaves,
        back - span,
        u,
        H.eaves,
        back + span,
        u,
        H.eaves + H.backGableRise,
        back,
        width / 2,
        H.ridge,
        back - span,
        width / 2,
        H.ridge,
        back + span,
        width / 2,
        H.ridge,
        back,
      ],
      [0, 2, 3, 2, 5, 3, 2, 1, 5, 1, 4, 5],
      roof,
    );
    for (const z of [back - span, back + span])
      beam([u, H.eaves, z], [u, H.eaves + H.backGableRise, back], white);
    const v = H.returnCentre,
      half = H.returnGableWidth / 2;
    polygon(
      [
        u,
        H.eaves,
        v - half,
        u,
        H.eaves,
        v + half,
        u,
        H.eaves + H.returnGableRise,
        v,
      ],
      u === 0 ? [0, 1, 2] : [0, 2, 1],
      brick,
    );
    polygon(
      [
        u,
        H.eaves,
        v - half,
        u,
        H.eaves,
        v + half,
        u,
        H.eaves + H.returnGableRise,
        v,
        width / 2,
        H.ridge,
        v - half,
        width / 2,
        H.ridge,
        v + half,
        width / 2,
        H.ridge,
        v,
      ],
      [0, 2, 3, 2, 5, 3, 2, 1, 5, 1, 4, 5],
      roof,
    );
    for (const z of [v - half, v + half])
      beam([u, H.eaves, z], [u, H.eaves + H.returnGableRise, v], white);
  }
  // A face-local coordinate frame keeps return glazing in its own wall plane.
  const face =
    (u: number, v: number, angle: number) =>
    (
      l: number,
      y: number,
      q: number,
      w: number,
      h: number,
      d: number,
      mat: T.Material,
    ) =>
      box(
        u + Math.cos(angle) * l + Math.sin(angle) * q,
        y,
        v - Math.sin(angle) * l + Math.cos(angle) * q,
        w,
        h,
        d,
        mat,
        angle,
      );
  const window = (
    B: ReturnType<typeof face>,
    y: number,
    w: number,
    columns: number,
    h = 1.35,
  ) => {
    B(0, y + h / 2, 0.08, w + 0.13, h + 0.12, 0.1, white);
    B(0, y + h / 2, 0.16, w, h, 0.04, glass);
    for (let i = 1; i < columns; i++)
      B(w * (i / columns - 0.5), y + h / 2, 0.2, 0.045, h, 0.035, white);
    B(0, y + h - 0.32, 0.2, w, 0.04, 0.035, white);
    B(0, y - 0.1, 0.17, w + 0.24, 0.13, 0.24, stone);
    B(0, y + h + 0.16, 0.08, w + 0.24, 0.18, 0.14, stone);
  };
  for (const u of frontCentres) {
    const B = face(u, 0, 0),
      y = ground(...point(u, 0.3)) - datum;
    window(B, 7.03, 1.05, 2);
    window(B, 4.2, 1.05, 2);
    B(0, y + 1.05, 0.09, 1.2, 2.1, 0.12, white);
    B(0, y + 1.03, 0.18, 1.02, 2.02, 0.06, dark);
    for (const dx of [-0.29, 0.29])
      B(dx, y + 1.34, 0.22, 0.3, 0.65, 0.03, glass);
    B(0.38, y + 1, 0.24, 0.045, 0.17, 0.04, stone);
    for (const dx of [-0.85, 0.85])
      B(dx, y + 1.25, 0.7, 0.11, 2.5, 0.11, white);
    polygon(
      [u - 1.02, y + 2.45, 1.1, u + 1.02, y + 2.45, 1.1, u, y + 3.4, 1.1],
      [0, 1, 2],
      white,
    );
    polygon(
      [
        u - 1.12,
        y + 2.47,
        1.18,
        u + 1.12,
        y + 2.47,
        1.18,
        u,
        y + 3.46,
        1.18,
        u - 1.12,
        y + 2.47,
        0,
        u + 1.12,
        y + 2.47,
        0,
        u,
        y + 3.46,
        0,
      ],
      [0, 2, 3, 2, 5, 3, 2, 1, 5, 1, 4, 5],
      roof,
    );
  }
  for (const [u, angle] of [
    [0, -Math.PI / 2],
    [width, Math.PI / 2],
  ]) {
    const B = face(u, H.returnCentre, angle),
      y = ground(...point(u, H.returnCentre)) - datum;
    window(B, 7.03, 2.1, 3);
    window(B, 4.2, 2.1, 3);
    B(0, 3.17, 0.42, 4.4, 0.11, 0.6, stone);
    B(0, 3.61, 0.72, 4.4, 0.88, 0.14, brick);
    B(0, 4.06, 0.72, 4.45, 0.09, 0.2, stone);
    for (const h of [4.1, 4.45]) B(0, h, 0.72, 4.4, 0.045, 0.045, dark);
    for (let k = 0; k <= 16; k++)
      B(-2.2 + (4.4 * k) / 16, 4.27, 0.72, 0.025, 0.35, 0.025, dark);
    for (const side of [-1, 1]) {
      B(side * 2.2, 3.61, 0.42, 0.14, 0.88, 0.6, brick);
      B(side * 2.2, 4.27, 0.42, 0.04, 0.35, 0.6, dark);
    }
    B(0, y + 1.15, 0.07, 4.4, 2.3, 0.13, white);
    B(0, y + 1.13, 0.16, 4.2, 2.2, 0.06, dark);
    for (let k = 1; k < 16; k++)
      B(0, y + 0.05 + (2.16 * k) / 16, 0.2, 4.2, 0.015, 0.02, ribs);
    for (const h of [3.05, 6])
      box(u, h, -H.depth / 2, H.depth, 0.18, 0.13, stone, angle);
    box(u, H.eaves, -H.depth / 2, H.depth, 0.1, 0.16, dark, angle);
  }
  // One further tall white group is visible on the eastern outer return.
  // Its leaves and threshold are concealed; do not mirror it onto the west.
  const g = H.easternTallGroup;
  window(face(width, g.v, Math.PI / 2), g.bottom, g.width, 2, g.height);
  for (const y of [3.05, 6]) box(width / 2, y, 0.06, width, 0.18, 0.13, stone);
}
