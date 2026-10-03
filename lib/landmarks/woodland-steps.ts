import * as T from 'three';
import type { Kit } from '../core/kit';
import { densify, type P } from '../core/geo';
import type { Surface } from '../world/surface';
import { WOODLAND_STEPS as D } from '../world/layout';
import { retainingTexture } from '../materials/landscape-materials';
import { masonryTexture } from '../materials/masonry-texture';
import { masonryUV } from '../materials/building-surfaces';

export function stairLocal(x: number, z: number): P {
  const dx = D.top[0] - D.bottom[0],
    dz = D.top[1] - D.bottom[1],
    l = Math.hypot(dx, dz);
  return [
    ((x - D.bottom[0]) * dx + (z - D.bottom[1]) * dz) / l,
    (-(x - D.bottom[0]) * dz + (z - D.bottom[1]) * dx) / l,
  ];
}
/** Lower flight visible in June 2024. Count, trace and dimensions estimated;
 * the mapped upper route is retained provisionally rather than inventing stairs. */
export function addWoodlandSteps(kit: Kit, { surface }: { surface: Surface }) {
  const walls: { a: P; b: P }[] = [];
  const stone = kit.mat('woodlandStepStone', '#77796c');
  stone.map = retainingTexture();
  stone.bumpMap = stone.map;
  stone.bumpScale = 0.025;
  const wall = kit.mat('woodlandStepWall', '#93968a');
  wall.map = masonryTexture(true);
  wall.bumpMap = wall.map;
  wall.bumpScale = 0.04;
  const dx = D.top[0] - D.bottom[0],
    dz = D.top[1] - D.bottom[1],
    length = Math.hypot(dx, dz),
    angle = Math.atan2(dx, dz);
  kit.ribbon([D.bottom, D.top], D.width + 0.6, kit.m.soil, (x, z) => {
    const [d] = stairLocal(x, z),
      t = T.MathUtils.clamp(d / length, 0, 0.99999);
    const px = T.MathUtils.lerp(D.bottom[0], D.top[0], t),
      pz = T.MathUtils.lerp(D.bottom[1], D.top[1], t);
    return surface.woodlandStepsY(px, pz)! - 0.22;
  });
  for (let i = 0; i < D.count; i++) {
    const t = (i + 0.5) / D.count,
      x = T.MathUtils.lerp(D.bottom[0], D.top[0], t),
      z = T.MathUtils.lerp(D.bottom[1], D.top[1], t);
    const y = surface.woodlandStepsY(x, z)!;
    const g = new T.BoxGeometry(D.width, 0.22, length / D.count + 0.012);
    g.rotateY(angle);
    g.translate(x, y - 0.11, z);
    masonryUV(g, 1.6);
    const n = g.getAttribute('normal'),
      p = g.getAttribute('position'),
      uv = g.getAttribute('uv');
    for (let j = 0; j < p.count; j++)
      if (Math.abs(n.getY(j)) > 0.7)
        uv.setXY(j, p.getX(j) / 1.6, p.getZ(j) / 1.6);
    kit.batch(g, stone);
  }
  const path = kit.mat('woodlandUpperPath', '#827f6a');
  path.map = retainingTexture();
  kit.ribbon(
    densify(surface.woodlandUpperPoints, 0.25),
    D.width,
    path,
    (x, z) => surface.woodlandUpperY(x, z) - 0.015,
  );
  // Small flat apron joins the first tread to the existing pavement.
  const back: P = [
    D.bottom[0] - (dx / length) * 0.65,
    D.bottom[1] - (dz / length) * 0.65,
  ];
  kit.ribbon(
    [back, D.bottom],
    D.width,
    path,
    (x, z) => surface.woodlandStepsY(x, z) ?? surface.vehicleRoadY(x, z),
  );
  // Rounded terminal beside the lower opening, with a low return to the bank wall.
  const points = densify(D.returnWall, 0.5);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const g = new T.BoxGeometry(0.42, 0.8, len + 0.015),
      p = g.getAttribute('position');
    for (let j = 0; j < p.count; j++)
      p.setY(
        j,
        p.getY(j) +
          T.MathUtils.lerp(
            surface.vehicleRoadY(...a),
            surface.vehicleRoadY(...b),
            (p.getZ(j) + len / 2) / len,
          ) +
          0.4,
      );
    g.rotateY(Math.atan2(b[0] - a[0], b[1] - a[1]));
    g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
    g.computeVertexNormals();
    masonryUV(g, 2);
    kit.batch(g, wall);
    walls.push({ a, b });
  }
  const end = D.returnWall[0],
    y = surface.vehicleRoadY(...end);
  const cap = new T.CylinderGeometry(
    0.22,
    0.22,
    0.42,
    12,
    1,
    false,
    0,
    Math.PI,
  );
  cap.rotateZ(Math.PI / 2);
  cap.rotateY(angle);
  cap.translate(end[0], y + 0.8, end[1]);
  kit.batch(cap, stone);
  return walls;
}
