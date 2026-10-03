import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { GARAGE_COURT } from '../world/layout';
import { masonryUV, slateMaterial } from '../materials/building-surfaces';

/** UP-003 roof forms; mapped footprint and existing court datum retained.
 * Five long bays user-confirmed, separate two bays photographed. Sizes estimated. */
export function addCourtGarage(
  kit: Kit,
  { id, base }: { id: string; base: number },
) {
  const D = GARAGE_COURT.find((g) => g.id === id)!;
  const [a, b, c, d] = D.points;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const depth = Math.hypot(d[0] - a[0], d[1] - a[1]);
  const point = (u: number, v: number): P => [
    a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v,
    a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v,
  ];
  const height = (v: number) =>
    D.eaves + D.rise * (D.roof === 'mono' ? v : 1 - Math.abs(2 * v - 1));
  const wall = new T.Shape(D.points.map(([x, z]) => new T.Vector2(x, -z)));
  const shell = new T.ExtrudeGeometry(wall, {
    depth: D.eaves,
    bevelEnabled: false,
  });
  shell.rotateX(-Math.PI / 2);
  shell.translate(0, base, 0);
  masonryUV(shell, 2);
  kit.batch(shell, kit.m.stone);
  const triangle = (
    coords: [number, number, number][],
    material: T.Material,
  ) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(coords.flat(), 3));
    g.setIndex(coords.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]);
    g.computeVertexNormals();
    masonryUV(g, 2);
    kit.batch(g, material);
  };
  const end = kit.mat('courtGarageEndStone', '#b8ad91');
  end.map = kit.m.stone.map;
  end.side = T.DoubleSide;
  for (const u of [0, 1]) {
    const [x0, z0] = point(u, 0),
      [x1, z1] = point(u, 1),
      [xm, zm] = point(u, 0.5);
    triangle(
      D.roof === 'mono'
        ? [
            [x0, base + D.eaves, z0],
            [x1, base + D.eaves, z1],
            [x1, base + height(1), z1],
          ]
        : [
            [x0, base + D.eaves, z0],
            [x1, base + D.eaves, z1],
            [xm, base + height(0.5), zm],
          ],
      end,
    );
  }
  if (D.roof === 'mono')
    triangle(
      [
        [d[0], base + D.eaves, d[1]],
        [c[0], base + D.eaves, c[1]],
        [c[0], base + height(1), c[1]],
        [d[0], base + height(1), d[1]],
      ],
      end,
    );
  const roof = slateMaterial();
  const slope = (from: number, to: number) => {
    const coords: number[] = [];
    for (const [u, v] of [
      [-0.008, from],
      [1.008, from],
      [-0.008, to],
      [1.008, to],
    ]) {
      const [x, z] = point(u, v);
      coords.push(x, base + height(v) + 0.04, z);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(coords, 3));
    g.setAttribute(
      'uv',
      new T.Float32BufferAttribute(
        [
          0,
          (from * depth) / 2,
          len / 2,
          (from * depth) / 2,
          0,
          (to * depth) / 2,
          len / 2,
          (to * depth) / 2,
        ],
        2,
      ),
    );
    g.setIndex([0, 2, 1, 1, 2, 3]);
    g.computeVertexNormals();
    kit.batch(g, roof);
  };
  if (D.roof === 'mono') slope(-0.025, 1.025);
  else {
    slope(-0.025, 0.5);
    slope(0.5, 1.025);
  }
  const door = kit.mat('courtGarageDoor', '#363b37');
  const rib = kit.mat('courtGarageDoorRibs', '#4e534d');
  const angle = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    thick: number,
    m: T.Material,
  ) => {
    const [x, z] = point(u, v);
    kit.box(x, base + y, z, w, h, thick, m, angle);
  };
  for (const u of D.doors) {
    const w = D.doorWidth;
    B(u, 1.14, -0.015, w + 0.16, 2.28, 0.12, kit.m.dark);
    B(u, 1.14, -0.028, w, 2.15, 0.12, door);
    for (let k = 1; k < 12; k++)
      B(u + ((k / 12 - 0.5) * w) / len, 1.14, -0.043, 0.018, 2.1, 0.045, rib);
    B(u, 1.0, -0.05, 0.22, 0.04, 0.05, kit.m.trim);
    B(u, 2.37, -0.03, w + 0.3, 0.16, 0.2, kit.m.stone);
  }
  B(0.5, D.eaves, -0.038, len + 0.25, 0.1, 0.12, kit.m.dark);
  return D.points;
}
