import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Feature, P } from '../core/geo';
import { housingBrick, housingUV } from '../materials/housing-brick';
import { roofUV, slateMaterial } from '../materials/building-surfaces';
import { WAKEFIELD_WEST } from '../world/layout';

/** Mapped west group; front features counted in August 2022 imagery.
 * Dimensions/roof intersections fitted; concealed fronts and rears unresolved. */
export function addWakefieldWest(
  kit: Kit,
  {
    buildings,
    ground,
  }: { buildings: Feature[]; ground: (x: number, z: number) => number },
) {
  const buff = housingBrick(kit, 'wakefieldWestBuff', 'buff');
  const trim = kit.mat('wakefieldWestTrim', '#e4e5df');
  const glass = kit.mat('wakefieldWestGlass', '#71858b', 0.35);
  const dark = kit.mat('wakefieldWestDark', '#343b3a');
  const stone = kit.mat('wakefieldWestSills', '#bdb59f');
  const roof = slateMaterial();
  const rowBase = Math.max(
    ...WAKEFIELD_WEST.filter((h) => h.kind !== 'garage').map((h) =>
      ground((h.a[0] + h.b[0]) / 2, (h.a[1] + h.b[1]) / 2),
    ),
  );
  for (const h of WAKEFIELD_WEST) {
    const f = buildings.find((f) => f.id === h.id);
    if (!f) continue;
    const points = f.points.slice(0, -1);
    const width = Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1]);
    const along: P = [(h.b[0] - h.a[0]) / width, (h.b[1] - h.a[1]) / width];
    const out: P = [-along[1], along[0]];
    const depth = Math.max(
      ...points.map(
        (p) => -(p[0] - h.a[0]) * out[0] - (p[1] - h.a[1]) * out[1],
      ),
    );
    const base = rowBase;
    const eave = h.kind === 'garage' ? 2.45 : 5.5;
    const rise = h.kind === 'garage' ? 1.2 : 1.8;
    const world = (u: number, v: number): P => [
      h.a[0] + along[0] * u + out[0] * v,
      h.a[1] + along[1] * u + out[1] * v,
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
      g.rotateY(Math.atan2(-along[1], along[0]));
      g.translate(x, base + y, z);
      if (m === buff) housingUV(g, h.a, along);
      kit.batch(g, m);
    };
    const mesh = (verts: number[][], ix: number[], material: T.Material) => {
      const g = new T.BufferGeometry();
      g.setAttribute(
        'position',
        new T.Float32BufferAttribute(
          verts.flatMap(([u, y, v]) => {
            const p = world(u, v);
            return [p[0], base + y, p[1]];
          }),
          3,
        ),
      );
      g.setIndex(ix);
      const flat = g.toNonIndexed();
      flat.computeVertexNormals();
      if (material === buff) housingUV(flat, h.a, along);
      else roofUV(flat);
      kit.batch(flat, material);
      g.dispose();
    };
    const bottom = Math.min(
      base - 0.3,
      ...points.map((p) => ground(...p) - 0.3),
    );
    const shape = new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1])));
    const wall = new T.ExtrudeGeometry(shape, {
      depth: base + eave - bottom,
      bevelEnabled: false,
    });
    wall.rotateX(-Math.PI / 2);
    wall.translate(0, bottom, 0);
    housingUV(wall, h.a, along);
    kit.batch(wall, buff);
    const verts = [
      [-0.15, eave, 0.2],
      [width + 0.15, eave, 0.2],
      [-0.15, eave + rise, -depth / 2],
      [width + 0.15, eave + rise, -depth / 2],
      [-0.15, eave, -depth - 0.2],
      [width + 0.15, eave, -depth - 0.2],
    ];
    mesh(verts, [2, 4, 5, 2, 5, 3], roof);
    if (h.kind === 'gable' || h.kind === 'hidden') {
      // Clip the main front slope to the cross-gable valleys. Overlapping
      // full roof planes leave exposed slivers at their intersection.
      mesh(
        [
          [-0.15, eave, 0.22],
          [0.3, eave, 0.22],
          [2.1, eave + rise, -depth / 2],
          [-0.15, eave + rise, -depth / 2],
          [3.9, eave, 0.22],
          [width + 0.15, eave, 0.22],
          [width + 0.15, eave + rise, -depth / 2],
        ],
        [0, 3, 2, 0, 2, 1, 4, 2, 6, 4, 6, 5],
        roof,
      );
    } else mesh(verts, [0, 2, 3, 0, 3, 1], roof);
    mesh(verts, [0, 2, 4, 1, 5, 3], buff);
    for (const v of [0.24, -depth - 0.24])
      B(width / 2, eave, v, width + 0.35, 0.12, 0.14, dark);
    const window = (
      u: number,
      y: number,
      w: number,
      hh: number,
      panes = 2,
      v = 0.14,
    ) => {
      B(u, y + hh / 2, v, w + 0.12, hh + 0.12, 0.1, trim);
      B(u, y + hh / 2, v + 0.065, w, hh, 0.035, glass);
      for (let k = 1; k < panes; k++)
        B(
          u - w / 2 + (w * k) / panes,
          y + hh / 2,
          v + 0.09,
          0.045,
          hh,
          0.025,
          trim,
        );
      B(u, y + hh - 0.27, v + 0.09, w, 0.04, 0.025, trim);
      B(u, y - 0.08, v, w + 0.22, 0.13, 0.24, stone);
    };
    const entrance = (u: number) => {
      B(u, 1.1, 0.15, 1.0, 2.2, 0.12, trim);
      B(u, 1.08, 0.23, 0.83, 2.06, 0.035, dark);
      window(u, 1.28, 0.48, 0.6, 1, 0.26);
    };
    if (h.kind === 'garage') {
      for (const u of [width * 0.25, width * 0.75]) {
        B(u, 1.12, 0.14, 2.25, 2.2, 0.1, trim);
        for (let y = 0.15; y < 2.2; y += 0.18)
          B(u, y, 0.2, 2.12, 0.025, 0.025, stone);
      }
      continue;
    }
    if (h.kind === 'round') {
      window(1.65, 0.8, 2.05, 1.3, 2);
      window(1.65, 3.7, 0.95, 1.2, 1);
      entrance(width - 1.0);
      // One circular stair opening, separate from the counted rectangular windows.
      const p = world(width * 0.55, 0.18);
      const disk = (r: number, m: T.Material, v: number) => {
        const g = new T.CircleGeometry(r, 32);
        g.rotateY(Math.atan2(out[0], out[1]));
        g.translate(p[0] + out[0] * v, base + 3.1, p[1] + out[1] * v);
        kit.batch(g, m);
      };
      disk(0.5, trim, 0);
      disk(0.43, glass, 0.015);
      B(width * 0.55, 3.1, 0.21, 0.035, 0.86, 0.025, trim);
    } else {
      // Cross gable on the south half; its short roof meets the longitudinal roof.
      const c = 2.1,
        half = 1.8;
      mesh(
        [
          [c - half, eave, 0.16],
          [c + half, eave, 0.16],
          [c, eave + rise, 0.16],
        ],
        [0, 1, 2],
        buff,
      );
      mesh(
        [
          [c - half, eave, 0.22],
          [c, eave + rise, 0.22],
          [c + half, eave, 0.22],
          [c - half, eave, -depth / 2],
          [c, eave + rise, -depth / 2],
          [c + half, eave, -depth / 2],
        ],
        [0, 4, 1, 1, 4, 2],
        roof,
      );
      window(c, 3.6, 0.95, 1.35, 2, 0.2);
      if (h.kind === 'gable') {
        for (const u of [c - 1.05, c, c + 1.05])
          window(u, 0.65, 0.53, 1.55, 1, 0.2);
        entrance(4.2);
        window(6.3, 0.85, 2.0, 1.3, 3);
        // Two individually visible upper lights with rounded stone heads.
        for (const u of [5.9, 6.8]) {
          window(u, 3.7, 0.65, 1.05, 1);
          const arc = Array.from({ length: 17 }, (_, k) => [
            u + Math.cos((k * Math.PI) / 16) * 0.43,
            4.82 + Math.sin((k * Math.PI) / 16) * 0.43,
            0.16,
          ]);
          mesh(
            arc,
            Array.from({ length: 14 }, (_, k) => [0, k + 1, k + 2]).flat(),
            stone,
          );
        }
      } else {
        // Only these ground openings can be separated from the tree canopy.
        window(1.55, 0.7, 1.75, 1.35, 2);
        entrance(4.1);
      }
    }
    for (const u of [0.12, width - 0.12])
      B(u, 2.7, 0.18, 0.07, 5.4, 0.07, dark);
  }
}
