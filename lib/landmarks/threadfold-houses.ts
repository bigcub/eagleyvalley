import * as T from 'three';
import type { Kit } from '../core/kit';
import { nearest, type P, type Segment } from '../core/geo';
import { drape } from '../core/mesh';
import {
  roofUV,
  slateMaterial,
} from '../materials/building-surfaces';
import { housingBrick, housingUV } from '../materials/housing-brick';
import { OSM, THREADFOLD_HOUSES as H } from '../world/layout';

export const threadfoldHouseWorld = (u: number, v: number): P => [
  H.from[0] + H.along[0] * u + H.out[0] * v,
  H.from[1] + H.along[1] * u + H.out[1] * v,
];

/** Eight mapped houses. Front counts photographed August 2022/June 2024;
 * dimensions fitted. Hidden rear openings remain unsurveyed. */
export function addThreadfoldHouses(
  kit: Kit,
  {
    ground,
    roadSeg,
  }: { ground: (x: number, z: number) => number; roadSeg: Segment[] },
) {
  const frontageRoad = roadSeg.filter((s) =>
    [OSM.threadfoldTownhouseRoad, OSM.threadfoldBrookReturn].includes(s.f.id),
  );
  const apronEdge = (u: number): P => {
    const p = threadfoldHouseWorld(u, 0);
    const n = nearest(...p, frontageRoad);
    const t = Math.max(0, (n.d - H.pavementInset) / n.d);
    return [p[0] + (n.x - p[0]) * t, p[1] + (n.z - p[1]) * t];
  };
  const rot = Math.atan2(-H.along[1], H.along[0]);
  const bases = H.homes.map((h) =>
    ground(...threadfoldHouseWorld(h.u + h.width / 2, 0.35)),
  );
  const datum = Math.max(...bases);
  const brick = housingBrick(kit, 'threadfoldHouseBrick', 'red');
  const pale = kit.mat('threadfoldHouseAshlar', '#c6bc9e');
  const render = kit.mat('threadfoldHouseRender', '#d8d6c7');
  const white = kit.mat('threadfoldHouseFrames', '#e1e4dd');
  const iron = kit.mat('threadfoldHouseIron', '#252b2b');
  const glass = kit.mat('threadfoldHouseGlass', '#819b9f', 0.35);
  const recess = kit.mat('threadfoldHouseRecess', '#363b36');
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = threadfoldHouseWorld(u, v);
    if (m === brick) {
      const g = new T.BoxGeometry(w, h, d);
      g.rotateY(rot);
      g.translate(x, y, z);
      housingUV(g, H.from, H.along);
      kit.batch(g, m);
    } else kit.box(x, y, z, w, h, d, m, rot);
  };
  const geometry = (
    vertices: number[],
    indices: number[],
    material: T.Material,
  ) => {
    const g = new T.BufferGeometry(),
      pos: number[] = [];
    for (let i = 0; i < vertices.length; i += 3) {
      const [x, z] = threadfoldHouseWorld(vertices[i], vertices[i + 2]);
      pos.push(x, datum + vertices[i + 1], z);
    }
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(indices);
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    if (material === brick) housingUV(flat, H.from, H.along);
    else roofUV(flat);
    kit.batch(flat, material);
    g.dispose();
  };
  const roof = slateMaterial();
  const window = (
    u: number,
    bottom: number,
    height: number,
    width: number,
    v = 0.14,
  ) => {
    B(u, bottom + height / 2, v, width + 0.12, height + 0.12, 0.12, white);
    B(u, bottom + height / 2, v + 0.075, width, height, 0.04, glass);
    B(u, bottom + height / 2, v + 0.105, 0.045, height, 0.03, white);
    B(u, bottom + height - 0.34, v + 0.105, width, 0.035, 0.03, white);
    B(u, bottom - 0.1, v + 0.04, width + 0.25, 0.14, 0.25, pale);
  };
  const balcony = (u: number, width: number) => {
    const bottom = datum + 3.06,
      top = datum + 4.03,
      v = 0.57;
    for (const y of [bottom, top]) B(u, y, v, width, 0.055, 0.055, iron);
    for (const du of [-width / 2, width / 2]) {
      B(u + du, (bottom + top) / 2, v, 0.065, top - bottom, 0.065, iron);
      B(u + du, bottom + 0.5, 0.36, 0.045, 0.96, 0.44, iron);
    }
    B(u, bottom - 0.07, 0.34, width + 0.1, 0.12, 0.62, iron);
    // Photographed diagonal lattice, clipped to the rectangular railing face.
    for (const slope of [-1, 1])
      for (let offset = -width; offset <= width + 1; offset += 0.29) {
        const ends: [number, number][] = [];
        for (const x of [-width / 2, width / 2]) {
          const y = slope * x + offset;
          if (y >= 0 && y <= top - bottom) ends.push([x, y]);
        }
        for (const y of [0, top - bottom]) {
          const x = (y - offset) / slope;
          if (x > -width / 2 && x < width / 2) ends.push([x, y]);
        }
        if (ends.length === 2) {
          const a = threadfoldHouseWorld(u + ends[0][0], v),
            b = threadfoldHouseWorld(u + ends[1][0], v);
          kit.beam(
            new T.Vector3(a[0], bottom + ends[0][1], a[1]),
            new T.Vector3(b[0], bottom + ends[1][1], b[1]),
            0.024,
            0.024,
            iron,
          );
        }
      }
  };
  for (const [i, home] of H.homes.entries()) {
    const { u, width, gable } = home,
      centre = u + width / 2,
      base = bases[i];
    B(
      centre,
      (base - 0.35 + datum + 8.45) / 2,
      -H.depth / 2,
      width,
      datum + 8.45 - base + 0.35,
      H.depth,
      brick,
    );
    if (!gable) B(centre, datum + 7.38, 0.06, width, 1.98, 0.15, render);
    // Rusticated pale ground storey, with narrow exposed brick joints.
    for (let y = base + 0.12; y < datum + 2.96; y += 0.34)
      B(centre, y, 0.13, width, 0.27, 0.22, pale);
    B(centre, datum + 3.02, 0.2, width, 0.22, 0.37, pale);
    B(centre, datum + 6.31, 0.15, width, 0.18, 0.3, pale);
    B(centre, datum + 8.43, 0.13, width + 0.03, 0.22, 0.35, pale);
    // Door on the south side of each photographed garage bay.
    const door = u + 0.79,
      garage = u + 3.35;
    B(door, base + 1.17, 0.28, 1.15, 2.4, 0.08, recess);
    B(
      door,
      base + 1.12,
      0.34,
      0.88,
      2.18,
      0.06,
      kit.mat(`threadfoldDoor${i}`, H.doorColours[i]),
    );
    B(door, base + 1.59, 0.38, 0.46, 0.85, 0.025, glass);
    B(door, base + 0.42, 0.38, 0.6, 0.46, 0.025, recess);
    B(door + 0.3, base + 1.1, 0.41, 0.025, 0.18, 0.03, pale);
    B(garage, base + 1.19, 0.28, 2.59, 2.39, 0.08, recess);
    B(garage, base + 1.17, 0.34, 2.4, 2.28, 0.05, white);
    for (let du = -1.12; du < 1.2; du += 0.14)
      B(garage + du, base + 1.17, 0.375, 0.013, 2.25, 0.016, render);
    B(garage, base + 1.15, 0.4, 0.08, 0.045, 0.025, iron);
    if (gable) {
      for (const du of [-0.9, 0, 0.9])
        window(centre + du, datum + 3.24, 1.91, 0.79);
      B(centre, datum + 5.32, 0.12, 3.12, 0.25, 0.3, pale);
      balcony(centre, 3.13);
      window(centre, datum + 6.52, 1.4, 1.12);
      for (const du of [-0.93, 0.93])
        window(centre + du, datum + 6.52, 1.08, 0.65);
      B(centre, datum + 8.03, 0.15, 1.32, 0.18, 0.28, pale);
      // Small round stone tympanum above the tall central upper window.
      const archVertices: number[] = [centre, 8.12, 0.23];
      const archIndices: number[] = [];
      for (let j = 0; j <= 20; j++) {
        const t = (j * Math.PI) / 20;
        archVertices.push(
          centre + Math.cos(t) * 0.43,
          8.12 + Math.sin(t) * 0.43,
          0.23,
        );
        if (j) archIndices.push(0, j, j + 1);
      }
      geometry(archVertices, archIndices, pale);
      geometry(
        [
          u,
          8.45,
          0.05,
          u + width,
          8.45,
          0.05,
          centre,
          10.58,
          0.05,
          u,
          8.45,
          -2.9,
          u + width,
          8.45,
          -2.9,
          centre,
          10.58,
          -2.9,
        ],
        [0, 1, 2, 3, 5, 4, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4],
        brick,
      );
      geometry(
        [
          u - 0.1,
          8.45,
          0.28,
          centre,
          10.68,
          0.28,
          u + width + 0.1,
          8.45,
          0.28,
          u - 0.1,
          8.45,
          -3.1,
          centre,
          10.68,
          -3.1,
          u + width + 0.1,
          8.45,
          -3.1,
        ],
        [0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4],
        roof,
      );
    } else {
      for (const du of [-1.4, 1.12]) {
        window(centre + du, datum + 3.24, 1.91, 0.95);
        B(centre + du, datum + 5.32, 0.12, 1.28, 0.25, 0.3, pale);
        balcony(centre + du, 1.52);
        window(centre + du, datum + 6.61, 1.35, 1.04);
      }
    }
    // Rear type is provisional. No.8 brochure confirms two first-floor windows
    // and garden doors. Other houses, top and ground divisions are interpreted,
    // not individually photographed counts. Keep separate from the front survey.
    const rearWindow = (u: number, bottom: number, height: number, width: number, panes = 2) => {
      const v = -H.depth - 0.08;
      B(u, bottom + height / 2, v, width + 0.12, height + 0.12, 0.12, white);
      B(u, bottom + height / 2, v - 0.075, width, height, 0.04, glass);
      for (let k = 1; k < panes; k++)
        B(u - width / 2 + width * k / panes, bottom + height / 2, v - 0.105, 0.045, height, 0.03, white);
      B(u, bottom + height - 0.33, v - 0.105, width, 0.035, 0.03, white);
      B(u, bottom - 0.1, v - 0.04, width + 0.25, 0.14, 0.25, pale);
      B(u, bottom + height + 0.1, v - 0.01, width + 0.18, 0.16, 0.16, pale);
    };
    for (const du of [-1.28, 1.22])
      rearWindow(centre + du, datum + 3.34, 1.46, 1.25);
    rearWindow(centre - 0.93, datum + 6.63, 1.28, 1.56, 3);
    rearWindow(centre + 1.32, datum + 6.9, 0.96, 0.61, 1);
    rearWindow(centre - 0.85, base + 0.1, 2.15, 1.68);
    rearWindow(centre + 1.39, base + 0.94, 1.12, 0.9);
    B(u + width - 0.09, datum + 4.25, -H.depth - 0.22, 0.075, 8.36, 0.08, iron);

    // Pipes and small lights occupy recorded party lines; fitted profiles.
    B(u + width - 0.09, datum + 4.25, 0.24, 0.075, 8.36, 0.08, iron);
    for (const du of [1.45, 3.8])
      B(u + du, datum + 5.12, 0.25, 0.16, 0.3, 0.1, white);
    const apron = [
      threadfoldHouseWorld(u, 0.38),
      threadfoldHouseWorld(u + width, 0.38),
      apronEdge(u + width),
      apronEdge(u),
    ];
    kit.batch(
      drape(apron, (x, z) => ground(x, z) + 0.018, 0.65),
      kit.m.blockPaving,
    );
    const approach = [
      threadfoldHouseWorld(door - 0.57, 0.4),
      threadfoldHouseWorld(door + 0.57, 0.4),
      apronEdge(door + 0.57),
      apronEdge(door - 0.57),
    ];
    kit.batch(
      drape(approach, (x, z) => ground(x, z) + 0.024, 0.5),
      kit.m.paving,
    );
  }
  // One ridge and two continuous slate slopes, with blank brick end triangles.
  const L = H.length,
    D = H.depth;
  geometry(
    [
      -0.2,
      8.5,
      0.25,
      L + 0.2,
      8.5,
      0.25,
      -0.2,
      10.3,
      -D / 2,
      L + 0.2,
      10.3,
      -D / 2,
      -0.2,
      8.5,
      -D - 0.25,
      L + 0.2,
      8.5,
      -D - 0.25,
    ],
    [0, 2, 3, 0, 3, 1, 2, 4, 5, 2, 5, 3],
    roof,
  );
  for (const u of [0, L])
    geometry([u, 8.45, 0, u, 8.45, -D, u, 10.25, -D / 2], [0, 1, 2], brick);
  B(L / 2, datum + 8.5, 0.3, L + 0.4, 0.12, 0.17, iron);
  B(L / 2, datum + 8.5, -D - 0.28, L + 0.4, 0.12, 0.17, iron);
}
