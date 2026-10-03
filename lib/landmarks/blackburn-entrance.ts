import * as T from 'three';
import { inPoly, type P } from '../core/geo';
import { drape, strip, sweep } from '../core/mesh';
import type { Kit } from '../core/kit';
import { masonryTexture } from '../materials/masonry-texture';
import { BLACKBURN_ENTRANCE as D } from '../world/layout';
import type { Surface } from '../world/surface';

type Options = { surface: Surface };
export function blackburnWorld(u: number, v: number): P {
  const [dx, dz] = D.direction;
  return [D.origin[0] + u * dx - v * dz, D.origin[1] + u * dz + v * dx];
}
export function blackburnLocal(x: number, z: number): P {
  const [dx, dz] = D.direction,
    norm = dx * dx + dz * dz;
  return [
    ((x - D.origin[0]) * dx + (z - D.origin[1]) * dz) / norm,
    (-(x - D.origin[0]) * dz + (z - D.origin[1]) * dx) / norm,
  ];
}
export function createBlackburnEntrancePlan() {
  function corner(controls: P[], side: number) {
    const curve = new T.CatmullRomCurve3(
      controls.map((p) => new T.Vector3(p[0], 0, p[1])),
      false,
      'centripetal',
    );
    const kerb: P[] = curve
      .getSpacedPoints(Math.ceil(curve.getLength() / 0.25))
      .map((p) => blackburnWorld(p.x, p.z));
    const outs = kerb.map((_, i): P => {
      const a = kerb[Math.max(0, i - 1)],
        b = kerb[Math.min(kerb.length - 1, i + 1)],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz);
      return [(-side * dz) / len, (side * dx) / len];
    });
    const widths = kerb.map((p) =>
      side === 1
        ? D.gateWidth
        : D.hillWidth *
          T.MathUtils.smoothstep(blackburnLocal(...p)[1], 3.2, 5.8),
    );
    const inner = kerb.map(
      (p, i): P => [p[0] + outs[i][0] * 0.08, p[1] + outs[i][1] * 0.08],
    );
    const outer = kerb.map(
      (p, i): P => [
        p[0] + outs[i][0] * (0.08 + widths[i]),
        p[1] + outs[i][1] * (0.08 + widths[i]),
      ],
    );
    return {
      kerb,
      outs,
      inner,
      outer,
      outline: [...inner, ...outer.toReversed()],
    };
  }
  const gate = corner(D.gateKerb, 1),
    hill = corner(D.hillKerb, -1);
  const road = [
    ...gate.kerb,
    ...D.opposite.map((p) => blackburnWorld(...p)),
    ...hill.kerb.toReversed(),
  ];
  const hillGround = [
    ...hill.kerb,
    ...hill.outer
      .map(
        (p, i): P => [
          p[0] + hill.outs[i][0] * 0.15,
          p[1] + hill.outs[i][1] * 0.15,
        ],
      )
      .toReversed(),
  ];
  return { gate, hill, road, hillGround };
}
export type BlackburnEntrancePlan = ReturnType<
  typeof createBlackburnEntrancePlan
>;
export function inBlackburnEntrance(
  x: number,
  z: number,
  p: BlackburnEntrancePlan,
) {
  const [u, v] = blackburnLocal(x, z);
  if (u < -14 || u > 17 || Math.abs(v) > 16) return false;
  return (
    inPoly(x, z, p.road) ||
    inPoly(x, z, p.gate.outline) ||
    inPoly(x, z, p.hillGround)
  );
}
export function addBlackburnEntrance(kit: Kit, { surface }: Options) {
  const p = surface.blackburnEntrancePlan,
    y = surface.blackburnEntranceY;
  kit.batch(
    drape(p.road, (x, z) => y(x, z) + 0.012, 0.75),
    kit.m.asphalt,
  );
  const paving = kit.mat('blackburnFootway', '#737471');
  for (const c of [p.gate, p.hill]) {
    kit.batch(
      strip(
        c === p.hill ? c.outer : c.inner,
        c === p.hill ? c.inner : c.outer,
        c.kerb.map((_, i) => [
          y(...(c === p.hill ? c.outer[i] : c.inner[i])) + 0.07,
          y(...(c === p.hill ? c.inner[i] : c.outer[i])) + 0.07,
        ]),
      ),
      paving,
    );
    kit.batch(
      sweep(c.kerb, c.outs, (i) => y(...c.kerb[i]), [
        [-0.08, 0.005],
        [-0.08, 0.07],
        [0.08, 0.07],
      ]),
      kit.m.kerb,
    );
  }
  const gutterBack = p.hill.outer.map(
    (q, i): P => [
      q[0] + p.hill.outs[i][0] * 0.17,
      q[1] + p.hill.outs[i][1] * 0.17,
    ],
  );
  kit.batch(
    strip(
      gutterBack,
      p.hill.outer,
      p.hill.outer.map((q, i) => [y(...gutterBack[i]) + 0.07, y(...q) + 0.07]),
    ),
    paving,
  );
  // White broken give-way lines visible in the reverse June 2024 view.
  for (const u of [5.8, 6.2])
    for (const v of [-2.4, -0.8, 0.8, 2.4]) {
      const [x, z] = blackburnWorld(u, v);
      kit.box(
        x,
        y(x, z) + 0.04,
        z,
        1.1,
        0.012,
        0.12,
        kit.m.paint,
        Math.atan2(D.direction[0], D.direction[1]),
      );
    }
}
export function addBlackburnEntranceWall(kit: Kit, { surface }: Options) {
  const c = surface.blackburnEntrancePlan.hill,
    y = surface.blackburnEntranceY;
  const path = c.outer.map(
    (p, i): P => [p[0] + c.outs[i][0] * 0.42, p[1] + c.outs[i][1] * 0.42],
  );
  const stone = kit.mat('blackburnCornerStone', '#827f72');
  stone.map = masonryTexture(true);
  stone.bumpMap = stone.map;
  stone.bumpScale = 0.08;
  kit.batch(
    sweep(path, c.outs, (i) => y(...path[i]) - 0.16, [
      [-D.wallThickness / 2, 0],
      [-D.wallThickness / 2, D.wallHeight],
      [D.wallThickness / 2, D.wallHeight],
      [D.wallThickness / 2, 0],
    ]),
    stone,
  );
  kit.batch(
    sweep(path, c.outs, (i) => y(...path[i]) + D.wallHeight - 0.16, [
      [-0.29, 0],
      [-0.29, 0.09],
      [0.29, 0.09],
      [0.29, 0],
    ]),
    stone,
  );
  for (const i of [0, path.length - 1])
    kit.box(
      path[i][0],
      y(...path[i]) + D.wallHeight / 2 - 0.16,
      path[i][1],
      D.wallThickness,
      D.wallHeight,
      0.06,
      stone,
      Math.atan2(c.outs[i][0], c.outs[i][1]) - Math.PI / 2,
    );
  return path.slice(1).map((b, i) => ({ a: path[i], b }));
}

/** Visible clipped hedge follows the wall; concealed stems and depth estimated. */
export function addBlackburnEntranceHedge(
  kit: Kit,
  { surface, leaf }: Options & { leaf: T.Material },
) {
  const c = surface.blackburnEntrancePlan.hill,
    y = surface.blackburnEntranceY;
  let seed = 318;
  const rand = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < c.outer.length; i += 2) {
    const p = c.outer[i],
      n = c.outs[i];
    for (let k = 0; k < 140; k++) {
      const across = (rand() - 0.5) * 0.52,
        depth = 0.45 + rand() * 0.75;
      const g = new T.PlaneGeometry(0.16, 0.12);
      g.rotateX(rand() * Math.PI);
      g.rotateY(rand() * Math.PI * 2);
      const x = p[0] + n[0] * depth + n[1] * across,
        z = p[1] + n[1] * depth - n[0] * across;
      g.translate(x, y(x, z) + D.wallHeight - 0.2 + rand() * 0.8, z);
      kit.batch(g, leaf);
    }
  }
}
