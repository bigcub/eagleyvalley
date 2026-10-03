import * as T from 'three';
import type { Kit } from '../core/kit';
import { densify } from '../core/geo';
import type { Surface } from '../world/surface';
import { gravelTexture } from '../materials/gravel-texture';
import { masonryTexture } from '../materials/masonry-texture';
import { retainingTexture } from '../materials/landscape-materials';
import { masonryUV } from '../materials/building-surfaces';
import { LANDSCAPING_GATE as D, PASSAGE_GATE } from '../world/layout';
type P = [number, number];
export const gateWorld = (u: number, v: number): P => [
  115.41 + u * 0.595 + v * 0.804,
  21.28 - u * 0.804 + v * 0.595,
];
export function gateLocal(x: number, z: number): P {
  const dx = x - 115.41,
    dz = z - 21.28;
  return [
    (dx * 0.595 - dz * 0.804) / 1.000441,
    (dx * 0.804 + dz * 0.595) / 1.000441,
  ];
}
// June 2024 Hough Lane/Eagley Way view. Approximate position on mapped access 655432309.
export function addBridgeSideGate(
  kit: Kit,
  {
    surface,
  }: {
    surface: Surface;
  },
): { a: P; b: P }[] {
  const { box, batch } = kit;
  const ground = surface.ground;
  const stone = kit.mat('landscapingGateStone', '#a1a398');
  stone.map = masonryTexture(true);
  stone.bumpMap = stone.map;
  stone.bumpScale = 0.035;
  const coping = kit.mat('landscapingGateCoping', '#b1b2a4');
  coping.map = retainingTexture();
  coping.bumpMap = coping.map;
  coping.bumpScale = 0.02;
  function wallUV(g: T.BufferGeometry) {
    masonryUV(g, 2);
    const p = g.getAttribute('position'),
      n = g.getAttribute('normal'),
      uv = g.getAttribute('uv');
    // Sloping caps need both horizontal axes; projecting z twice streaks them.
    for (let i = 0; i < p.count; i++)
      if (Math.abs(n.getY(i)) > 0.7) uv.setXY(i, p.getX(i) / 2, p.getZ(i) / 2);
  }
  const worn = kit.mat('landscapingGatePath', '#696a60');
  worn.map = gravelTexture();
  worn.bumpMap = worn.map;
  worn.bumpScale = 0.015;
  const world = gateWorld,
    barriers: { a: P; b: P }[] = [],
    rot = Math.atan2(0.804, 0.595),
    floor = ground(115.41, 21.28);
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = world(u, v);
    box(x, y, z, w, h, d, m, rot);
  };
  // June 2024 view: entrance widens toward the road, with curved low returns.
  // Positions and dimensions remain interpreted from the view and mapped path.
  for (const side of [-1, 1])
    for (let j = 0; j < 14; j++) {
      const rawV0 = (j * 3.2) / 14,
        v1 = ((j + 1) * 3.2) / 14;
      if (side === -1 && v1 <= PASSAGE_GATE.returnOpening) continue;
      const v0 =
        side === -1 ? Math.max(rawV0, PASSAGE_GATE.returnOpening) : rawV0;
      const edge = (v: number) => side * (0.9 + 0.7 * Math.pow(v / 3.2, 2));
      const a = world(edge(v0), v0),
        b = world(edge(v1), v1),
        ya = ground(...a),
        yb = ground(...b),
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
      barriers.push({ a, b });
      for (const cap of [false, true]) {
        const g = new T.BoxGeometry(
            cap ? 0.58 : 0.48,
            cap ? 0.12 : 0.86,
            len + 0.025,
          ),
          pos = g.getAttribute('position');
        for (let k = 0; k < pos.count; k++) {
          const t = (pos.getZ(k) + len / 2) / len;
          pos.setY(
            k,
            pos.getY(k) + T.MathUtils.lerp(ya, yb, t) + (cap ? 0.9 : 0.43),
          );
        }
        g.rotateY(angle);
        g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
        g.computeVertexNormals();
        wallUV(g);
        batch(g, cap ? coping : stone);
      }
    }
  const hinge = world(D.halfWidth, 0),
    latch = world(-D.halfWidth, 0);
  // The game holds this leaf open onto the lawn side for exploration.
  // Both reference views show it closed. Dimensions and bar count estimated.
  const leaf = (t: number): P =>
    world(
      D.halfWidth - 2 * D.halfWidth * t * Math.cos(D.openAngle),
      -2 * D.halfWidth * t * Math.sin(D.openAngle),
    );
  const iron = kit.mat('landscapingGateIron', '#343d36', 0.68);
  for (const p of [hinge, latch]) {
    const post = new T.CylinderGeometry(0.027, 0.036, 1.3, 8);
    post.translate(p[0], floor + 0.68, p[1]);
    batch(post, iron);
    const ball = new T.SphereGeometry(0.045, 8, 5);
    ball.translate(p[0], floor + 1.36, p[1]);
    batch(ball, iron);
    barriers.push({ a: [p[0] - 0.03, p[1]], b: [p[0] + 0.03, p[1]] });
  }
  const top = (t: number) =>
    floor + D.leafHeight + D.archRise * Math.sin(Math.PI * t);
  const vec = (t: number, y: number) => {
    const p = leaf(t);
    return new T.Vector3(p[0], y, p[1]);
  };
  for (const t of [0, 1])
    kit.beam(vec(t, floor + 0.08), vec(t, top(t)), 0.032, 0.032, iron);
  for (const y of [0.12, 0.49])
    kit.beam(vec(0, floor + y), vec(1, floor + y), 0.03, 0.03, iron);
  for (let j = 0; j < 18; j++)
    kit.beam(
      vec(j / 18, top(j / 18)),
      vec((j + 1) / 18, top((j + 1) / 18)),
      0.03,
      0.03,
      iron,
    );
  for (let j = 1; j <= 9; j++)
    kit.beam(
      vec(j / 10, floor + 0.12),
      vec(j / 10, top(j / 10)),
      0.017,
      0.017,
      iron,
    );
  for (const y of [0.25, 0.97])
    B(D.halfWidth, floor + y, 0, 0.11, 0.055, 0.08, iron);
  kit.beam(vec(0.9, floor + 0.77), vec(0.96, floor + 0.77), 0.05, 0.05, iron);
  barriers.push({ a: leaf(0), b: leaf(1) });
  // Inner lawn edge beside the mapped path. Trace/height estimated from views;
  // it does not divide or open into the private patios behind the mill.
  const bed = densify(D.bedBoundary, 0.4);
  for (let j = 1; j < bed.length; j++) {
    const a = bed[j - 1],
      b = bed[j],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]),
      angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
    for (const cap of [false, true]) {
      const g = new T.BoxGeometry(
          cap ? 0.5 : 0.42,
          cap ? 0.1 : 0.76,
          len + 0.015,
        ),
        p = g.getAttribute('position');
      for (let k = 0; k < p.count; k++) {
        const t = T.MathUtils.clamp((p.getZ(k) + len / 2) / len, 0, 1),
          x = T.MathUtils.lerp(a[0], b[0], t),
          z = T.MathUtils.lerp(a[1], b[1], t);
        p.setY(
          k,
          p.getY(k) + surface.landscapePathLevel(x, z) + (cap ? 0.81 : 0.38),
        );
      }
      g.rotateY(angle);
      g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
      g.computeVertexNormals();
      wallUV(g);
      batch(g, cap ? coping : stone);
    }
    barriers.push({ a, b });
  }
  // Paving shares the same level function as walking and underlying terrain.
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let j = 0; j <= 16; j++) {
    const v = (j * 3.2) / 16,
      w = 0.9 + 0.7 * Math.pow(v / 3.2, 2) - 0.22;
    for (const u of [-w, w]) {
      const [x, z] = world(u, v);
      // Keep the backing plane below the rounded passage setts at the shared threshold.
      positions.push(x, ground(x, z) - 0.04, z);
      uv.push(u, v);
    }
    if (j) {
      const k = j * 2;
      indices.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  batch(g, worn);
  kit.ribbon(
    densify(surface.landscapePathPoints, 0.2),
    D.pathWidth,
    worn,
    (x, z) => surface.ground(x, z) - 0.015,
  );

  return barriers;
}
