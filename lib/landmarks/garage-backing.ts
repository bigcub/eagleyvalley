import * as T from 'three';
import type { Kit } from '../core/kit';
import { densify, nearest, type P } from '../core/geo';
import type { Surface } from '../world/surface';
import type { WorldData } from '../world/data';
import { GARAGE_BACKING as D, OSM } from '../world/layout';
import { masonryUV } from '../materials/building-surfaces';
import { masonryTexture } from '../materials/masonry-texture';

/** Lower face beneath the retained road wall. UP-003 composition;
 * alignment/formation/height fitted to mapped road and existing court datum. */
export function addGarageBacking(
  kit: Kit,
  { surface, data }: { surface: Surface; data: WorldData },
) {
  const path = densify(
    data.roads.find((f) => f.id === OSM.eagleyWay)!.points,
    2.3,
  );
  const edge = (i: number): P => {
    const a = path[Math.max(0, i - 1)],
      b = path[Math.min(path.length - 1, i + 1)];
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz);
    return [
      path[i][0] + (dz / len) * D.offset,
      path[i][1] - (dx / len) * D.offset,
    ];
  };
  const stone = kit.mat('garageBackingRubble', '#77776c', 1);
  stone.map = masonryTexture(true);
  stone.bumpMap = stone.map;
  stone.bumpScale = 0.12;
  const earth = kit.mat('garageBackingEarth', '#59543d', 1);
  earth.side = T.DoubleSide;
  const walls: { a: P; b: P }[] = [];
  for (let i = 1; i < path.length; i++) {
    let a = edge(i - 1),
      b = edge(i);
    if (b[0] < D.startX || a[0] > D.endX) continue;
    if (a[0] < D.startX)
      a = [
        D.startX,
        T.MathUtils.lerp(a[1], b[1], (D.startX - a[0]) / (b[0] - a[0])),
      ];
    if (b[0] > D.endX)
      b = [
        D.endX,
        T.MathUtils.lerp(a[1], b[1], (D.endX - a[0]) / (b[0] - a[0])),
      ];
    const roadY = (p: P) =>
      surface.roadY(...p, nearest(...p, surface.eagleySegments));
    const topA = roadY(a) - 0.18,
      topB = roadY(b) - 0.18;
    const bottomA = Math.min(
      topA - 0.05,
      surface.garageBackingLevel(...a) - 0.25,
    );
    const bottomB = Math.min(
      topB - 0.05,
      surface.garageBackingLevel(...b) - 0.25,
    );
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const g = new T.BoxGeometry(0.55, 1, len + 0.03),
      p = g.getAttribute('position');
    for (let k = 0; k < p.count; k++) {
      const t = T.MathUtils.clamp((p.getZ(k) + len / 2) / len, 0, 1);
      const bottom = T.MathUtils.lerp(bottomA, bottomB, t),
        top = T.MathUtils.lerp(topA, topB, t);
      p.setY(k, T.MathUtils.lerp(bottom, top, p.getY(k) + 0.5));
    }
    g.rotateY(Math.atan2(b[0] - a[0], b[1] - a[1]));
    g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
    g.computeVertexNormals();
    masonryUV(g, 2);
    kit.batch(g, stone);
    // Close the grass-mesh cut on both sides and at its end joins.
    const nx = -(b[1] - a[1]) / len,
      nz = (b[0] - a[0]) / len;
    const offset = (p: P, d: number): P => [p[0] + nx * d, p[1] + nz * d];
    const vertex = (p: P, d: number, y?: number): [number, number, number] => {
      const q = offset(p, d);
      return [q[0], y ?? surface.terrain(...q), q[1]];
    };
    const quad = (vertices: [number, number, number][]) => {
      const g = new T.BufferGeometry();
      g.setAttribute(
        'position',
        new T.Float32BufferAttribute(vertices.flat(), 3),
      );
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.computeVertexNormals();
      masonryUV(g, 2);
      kit.batch(g, earth);
    };
    const la = vertex(a, -0.275, surface.garageBackingLevel(...a) - 0.13);
    const lb = vertex(b, -0.275, surface.garageBackingLevel(...b) - 0.13);
    const ha = vertex(a, 0.275, topA - 0.2),
      hb = vertex(b, 0.275, topB - 0.2);
    quad([vertex(a, -0.95), vertex(b, -0.95), lb, la]);
    quad([ha, hb, vertex(b, 0.95), vertex(a, 0.95)]);
    if (a[0] === D.startX) quad([vertex(a, -0.95), la, ha, vertex(a, 0.95)]);
    if (b[0] === D.endX) quad([vertex(b, -0.95), lb, hb, vertex(b, 0.95)]);
    walls.push({ a, b });
  }
  return walls;
}
