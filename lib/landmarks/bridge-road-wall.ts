import { bridgePassageWall } from '../materials/bridge-stone';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { densify, nearest, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { masonryUV } from '../materials/building-surfaces';
import { retainingTexture } from '../materials/landscape-materials';
import { BRIDGE_ROAD_WALL as D, OSM } from '../world/layout';
import type { WorldData } from '../world/data';
import type { Surface } from '../world/surface';
import { gateWorld } from './bridge-side-gate';

type Wall = { a: P; b: P };
const { lerp } = T.MathUtils;

function profile(x: number, points: P[]) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    if (x <= b[0])
      return lerp(
        a[1],
        b[1],
        T.MathUtils.clamp((x - a[0]) / (b[0] - a[0]), 0, 1),
      );
  }
  return points.at(-1)![1];
}

/** Masonry above the road. The much taller face below it has its own datum. */
export function bridgeRoadWallHeight(x: number) {
  return profile(x, x < D.copingDropX ? D.uprightProfile : D.flatProfile);
}

/** Same mapped road edge as the adjoining wall. Width is an estimate. Keep
 * the original end anchors so the new body cannot leave a gap at either end. */
function wallTrace(data: WorldData): P[] {
  const road = data.roads.find((f) => f.id === OSM.eagleyWay)!;
  const path = densify(road.points, 2.3);
  const point = (i: number): P => {
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
  const out: P[] = [];
  for (let i = 1; i < path.length; i++) {
    const x = (path[i - 1][0] + path[i][0]) / 2;
    if (x <= D.startX || x >= D.endX) continue;
    if (!out.length) out.push(point(i - 1));
    out.push(point(i));
  }
  // Put the sharp coping change on one shared vertex, not a broad blend.
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1],
      b = out[i];
    if (a[0] < D.copingDropX && b[0] > D.copingDropX) {
      out.splice(i, 0, [
        D.copingDropX,
        lerp(a[1], b[1], (D.copingDropX - a[0]) / (b[0] - a[0])),
      ]);
      break;
    }
  }
  return out;
}

/** M05 roadside body, coping, narrow gutter and gate-side return. The existing
 * lower retaining base is carried through; its reconstruction is M06. */
export function addBridgeRoadWall(
  kit: Kit,
  {
    surface,
    data,
    lowerStone,
  }: {
    surface: Surface;
    data: WorldData;
    lowerStone: T.Material;
  },
) {
  const walls: Wall[] = [];
  // Same dark grey dry-stone as the retaining face below (No.3 photos and
  // EAG-039 from the road).
  const stone = bridgePassageWall(kit);
  const cap = kit.mat('bridgeRoadCoping', '#bcbaac');
  cap.map = retainingTexture();
  cap.bumpMap = cap.map;
  cap.bumpScale = 0.04;
  const gutter = kit.mat('bridgeRoadGutter', '#86857b');
  const trace = wallTrace(data);
  const roadLevel = (p: P) =>
    surface.roadY(...p, nearest(...p, surface.eagleySegments));

  // A wedge with independent base and top at each end. World UVs keep stone
  // courses the same size when the wall spans change length or slope.
  function body(
    a: P,
    b: P,
    baseA: number,
    baseB: number,
    topA: number,
    topB: number,
    material: T.Material,
  ) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const g = new T.BoxGeometry(D.thickness, 1, len + 0.025);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const t = T.MathUtils.clamp((pos.getZ(i) + len / 2) / len, 0, 1);
      pos.setY(
        i,
        lerp(lerp(baseA, baseB, t), lerp(topA, topB, t), pos.getY(i) + 0.5),
      );
    }
    g.rotateY(Math.atan2(b[0] - a[0], b[1] - a[1]));
    g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
    g.computeVertexNormals();
    masonryUV(g, 2.8);
    kit.batch(g, material);
  }
  function coping(a: P, b: P, topA: number, topB: number, upright: boolean) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const rotation = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const n = Math.ceil(len / (upright ? 0.24 : 0.78));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n,
        x = lerp(a[0], b[0], t),
        z = lerp(a[1], b[1], t);
      const h = upright ? 0.16 + 0.065 * (0.5 + 0.5 * Math.sin(x * 7.1)) : 0.1;
      const g = new RoundedBoxGeometry(
        upright ? 0.57 : 0.64,
        h,
        len / n - 0.012,
        1,
        0.02,
      );
      g.rotateX(-Math.atan2(topB - topA, len));
      g.rotateY(rotation);
      g.translate(x, lerp(topA, topB, t) + h / 2, z);
      masonryUV(g, 2.8);
      const position = g.getAttribute('position'),
        normal = g.getAttribute('normal'),
        uv = g.getAttribute('uv');
      // Rounded upper faces need X/Z projection even when the wall runs east:
      // choosing its horizontal normal can collapse both UV axes onto Z.
      for (let j = 0; j < position.count; j++)
        if (Math.abs(normal.getY(j)) > 0.7)
          uv.setXY(j, position.getX(j) / 1.5, position.getZ(j) / 1.5);
      kit.batch(g, cap);
    }
  }
  for (let i = 1; i < trace.length; i++) {
    const a = trace[i - 1],
      b = trace[i];
    const ra = roadLevel(a),
      rb = roadLevel(b);
    const upright = (a[0] + b[0]) / 2 < D.copingDropX;
    const shape = upright ? D.uprightProfile : D.flatProfile;
    const ta = ra + profile(a[0], shape),
      tb = rb + profile(b[0], shape);
    // Keep the lower retaining datum and through-wall connection. Its face,
    // levels and passage finishes remain separate work, not accepted here.
    const oldBase = (r: number) =>
      (a[0] + b[0]) / 2 >= 74
        ? Math.min(surface.passageY - 0.25, r - 0.18)
        : r - 0.18;
    if (oldBase(ra) < ra - 0.18 || oldBase(rb) < rb - 0.18)
      body(a, b, oldBase(ra), oldBase(rb), ra - 0.18, rb - 0.18, lowerStone);
    body(a, b, ra - 0.18, rb - 0.18, ta, tb, stone);
    coping(a, b, ta, tb, upright);
    walls.push({ a, b });
    // A narrow drainage strip, not a full pavement on the mill side.
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]),
      nx = -(b[1] - a[1]) / len,
      nz = (b[0] - a[0]) / len;
    const from: P = [a[0] + nx * 0.36, a[1] + nz * 0.36];
    const to: P = [b[0] + nx * 0.36, b[1] + nz * 0.36];
    kit.beam(
      new T.Vector3(from[0], ra + 0.012, from[1]),
      new T.Vector3(to[0], rb + 0.012, to[1]),
      0.18,
      0.025,
      gutter,
    );
  }

  const corner = [trace.at(-1)!, ...D.corner, gateWorld(-1.6, 3.2)];
  const startLevel = roadLevel(corner[0]),
    endLevel = surface.ground(...corner.at(-1)!);
  const lengths = corner
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - corner[i][0], p[1] - corner[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let distance = 0;
  for (let i = 1; i < corner.length; i++) {
    const a = corner[i - 1],
      b = corner[i];
    const t0 = distance / total;
    distance += lengths[i - 1];
    const t1 = distance / total;
    const baseA = lerp(startLevel - 0.18, endLevel, t0),
      baseB = lerp(startLevel - 0.18, endLevel, t1);
    const topA = lerp(
      startLevel + D.flatProfile.at(-1)![1],
      endLevel + 0.86,
      t0,
    );
    const topB = lerp(
      startLevel + D.flatProfile.at(-1)![1],
      endLevel + 0.86,
      t1,
    );
    body(
      a,
      b,
      Math.min(baseA, surface.terrain(...a) - 0.15),
      Math.min(baseB, surface.terrain(...b) - 0.15),
      topA,
      topB,
      stone,
    );
    coping(a, b, topA, topB, false);
    walls.push({ a, b });
  }

  const [x, z] = D.lamp.point,
    y = roadLevel(D.lamp.point);
  const metal = kit.mat('bridgeRoadLamp', '#8b9190', 0.5);
  const column = new T.CylinderGeometry(0.045, 0.085, D.lamp.height, 10);
  column.translate(x, y + D.lamp.height / 2, z);
  kit.batch(column, metal);
  kit.beam(
    new T.Vector3(x, y + D.lamp.height, z),
    new T.Vector3(x, y + D.lamp.height + 0.18, z + 0.45),
    0.07,
    0.07,
    metal,
  );
  kit.box(x, y + D.lamp.height + 0.18, z + 0.63, 0.27, 0.09, 0.66, metal);
  walls.push({ a: [x - 0.085, z], b: [x + 0.085, z] });
  return walls;
}
