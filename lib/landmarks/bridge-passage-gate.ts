import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Kit } from '../core/kit';
import { inPoly, type P } from '../core/geo';
import { drape } from '../core/mesh';
import { masonryUV } from '../materials/building-surfaces';
import { masonryTexture } from '../materials/masonry-texture';
import { retainingTexture } from '../materials/landscape-materials';
import { PASSAGE_GATE as D } from '../world/layout';
import type { Surface } from '../world/surface';
import { gateWorld } from './bridge-side-gate';

type Wall = { a: P; b: P };
export function passageGateEnds(): [P, P] {
  const v = D.returnOpening;
  return [gateWorld(-0.9, 0), gateWorld(-0.9 - 0.7 * (v / 3.2) ** 2, v)];
}

/** M07. Historical May 2012 view shows the small arched gate in the left
 * return beside the other gate. Hidden dimensions and the fitted grade are
 * estimates. The game holds the leaf open; this is not a reference-state claim. */
export function addBridgePassageGate(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const walls: Wall[] = [];
  const stone = kit.mat('passageGateStone', '#b1b1a6');
  stone.map = masonryTexture(true);
  stone.bumpMap = stone.map;
  stone.bumpScale = 0.065;
  const coping = kit.mat('passageGateCoping', '#b7b8a9');
  coping.map = retainingTexture();
  coping.bumpMap = coping.map;
  coping.bumpScale = 0.025;
  const iron = kit.mat('passageGateIron', '#303831', 0.65);
  const [hinge, latch] = passageGateEnds();
  const level = (p: P) => surface.passageGateLevel(...p);
  const width = Math.hypot(latch[0] - hinge[0], latch[1] - hinge[1]);
  const closedAngle = Math.atan2(latch[0] - hinge[0], latch[1] - hinge[1]);
  const leafAngle = closedAngle + D.openAngle;
  const leafPoint = (t: number): P => [
    hinge[0] + Math.sin(leafAngle) * width * t,
    hinge[1] + Math.cos(leafAngle) * width * t,
  ];
  const floor = level(hinge);
  const V = (p: P, y: number) => new T.Vector3(p[0], y, p[1]);
  function masonry(a: P, b: P) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
    for (const cap of [false, true]) {
      const g = new T.BoxGeometry(cap ? 0.53 : 0.44, 1, len + 0.025);
      const p = g.getAttribute('position');
      for (let j = 0; j < p.count; j++) {
        const t = T.MathUtils.clamp((p.getZ(j) + len / 2) / len, 0, 1);
        const x = T.MathUtils.lerp(a[0], b[0], t),
          z = T.MathUtils.lerp(a[1], b[1], t);
        const top = surface.passageGateLevel(x, z) + (cap ? 0.89 : 0.78);
        const base = cap
          ? top - 0.11
          : Math.min(
              surface.terrain(x, z) - 0.15,
              surface.passageGateLevel(x, z) - 0.12,
            );
        p.setY(j, T.MathUtils.lerp(base, top, p.getY(j) + 0.5));
      }
      g.rotateY(angle);
      g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
      g.computeVertexNormals();
      masonryUV(g, 2);
      kit.batch(g, cap ? coping : stone);
    }
    walls.push({ a, b });
  }
  // The inner bed boundary joins the mill end to the shared gate pier.
  const start = D.bedWallStart;
  const n = Math.ceil(
    Math.hypot(hinge[0] - start[0], hinge[1] - start[1]) / 0.7,
  );
  for (let i = 0; i < n; i++)
    masonry(
      [
        T.MathUtils.lerp(start[0], hinge[0], i / n),
        T.MathUtils.lerp(start[1], hinge[1], i / n),
      ],
      [
        T.MathUtils.lerp(start[0], hinge[0], (i + 1) / n),
        T.MathUtils.lerp(start[1], hinge[1], (i + 1) / n),
      ],
    );
  for (const p of [hinge, latch]) {
    const y = level(p);
    kit.box(
      p[0],
      y + D.pierHeight / 2,
      p[1],
      D.pierWidth,
      D.pierHeight,
      D.pierWidth,
      stone,
    );
    kit.box(p[0], y + D.pierHeight + 0.04, p[1], 0.42, 0.08, 0.42, coping);
    const column = new T.CylinderGeometry(0.028, 0.035, 1.3, 8);
    column.translate(p[0], y + 0.68, p[1]);
    kit.batch(column, iron);
    const ball = new T.SphereGeometry(0.047, 8, 5);
    ball.translate(p[0], y + 1.36, p[1]);
    kit.batch(ball, iron);
    walls.push({ a: [p[0] - 0.035, p[1]], b: [p[0] + 0.035, p[1]] });
  }
  // Small round-topped leaf, plain vertical bars, lower/middle rails and hinges.
  for (const t of [0.04, 0.96]) {
    const p = leafPoint(t);
    kit.box(p[0], floor + 0.65, p[1], 0.035, 1.16, 0.035, iron, leafAngle);
  }
  for (const y of [0.13, 0.5])
    kit.beam(
      V(leafPoint(0.04), floor + y),
      V(leafPoint(0.96), floor + y),
      0.035,
      0.035,
      iron,
    );
  const top = (t: number) => floor + 1.12 + 0.17 * Math.sin(Math.PI * t);
  for (let i = 0; i < 18; i++)
    kit.beam(
      V(leafPoint(i / 18), top(i / 18)),
      V(leafPoint((i + 1) / 18), top((i + 1) / 18)),
      0.035,
      0.035,
      iron,
    );
  // Bar count is a modelling estimate: planting conceals the current leaf.
  for (let i = 0; i < 8; i++) {
    const t = (i + 1) / 9,
      p = leafPoint(t),
      h = top(t) - floor - 0.12;
    kit.box(p[0], floor + 0.12 + h / 2, p[1], 0.022, h, 0.022, iron, leafAngle);
  }
  for (const y of [0.25, 1.0])
    kit.box(
      hinge[0],
      floor + y,
      hinge[1],
      0.12,
      0.055,
      0.08,
      iron,
      closedAngle,
    );
  const handle = leafPoint(0.91);
  kit.box(
    handle[0],
    floor + 0.81,
    handle[1],
    0.06,
    0.045,
    0.16,
    iron,
    leafAngle,
  );
  walls.push({ a: leafPoint(0), b: leafPoint(1) });

  const joints = kit.mat('passageGateJoints', '#4b4f41');
  kit.batch(
    drape(D.approach, (x, z) => surface.passageGateLevel(x, z) - 0.035, 0.35),
    joints,
  );
  const paving = ['#888477', '#7b7e73', '#969080', '#82796a'].map((c, i) => {
    const m = kit.mat(`passageGateSetts${i}`, c);
    m.map = coping.map;
    m.bumpMap = m.map;
    m.bumpScale = 0.015;
    return m;
  });
  let row = 0;
  for (let x = 108.65; x < 117; x += 0.27, row++)
    for (let z = 21.9 + (row % 2) * 0.2; z < 25.3; z += 0.41) {
      if (
        ![
          [x - 0.13, z - 0.2],
          [x + 0.13, z - 0.2],
          [x - 0.13, z + 0.2],
          [x + 0.13, z + 0.2],
        ].every((p) => inPoly(p[0], p[1], D.approach))
      )
        continue;
      const g = new RoundedBoxGeometry(0.256, 0.065, 0.396, 1, 0.012),
        p = g.getAttribute('position');
      for (let i = 0; i < p.count; i++)
        p.setY(
          i,
          p.getY(i) +
            surface.passageGateLevel(x + p.getX(i), z + p.getZ(i)) -
            0.0325,
        );
      g.translate(x, 0, z);
      masonryUV(g, 0.8);
      kit.batch(g, paving[(row + Math.floor(z * 7)) % paving.length]);
    }
  return walls;
}
