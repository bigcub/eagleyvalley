import * as T from 'three';
import { densify, segments, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { drape } from '../core/mesh';
import type { WorldData } from '../world/data';
import { HALL_WOODLAND_ENTRANCE as D, OSM } from '../world/layout';
import type { Surface } from '../world/surface';
import { retainingTexture } from '../materials/landscape-materials';

/** M26d first surface pass. Mapped spine, photographed broad entrance;
 * widths, taper, wall extent and height are fitted estimates. */
export function createHallWoodlandPlan(data: WorldData) {
  const lane = data.roads.find((f) => f.id === OSM.hallLane)!;
  const path = data.roads.find((f) => f.id === OSM.northWoodlandPath)!;
  const join = lane.points.at(-1)!;
  const along = (a: P, b: P, distance: number): P => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [
      a[0] + ((b[0] - a[0]) * distance) / length,
      a[1] + ((b[1] - a[1]) * distance) / length,
    ];
  };
  const start = along(join, lane.points[0], D.laneLead);
  const end = along(join, path.points[1], D.pathLength);
  const points = densify([start, join, end], 0.5);
  const left: P[] = [],
    right: P[] = [],
    outerLeft: P[] = [],
    outerRight: P[] = [];
  const wall: P[] = [];
  points.forEach((p, i) => {
    const a = points[Math.max(0, i - 1)],
      b = points[Math.min(points.length - 1, i + 1)];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Right side travelling downstream, towards the brook.
    const n: P = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
    const downstream =
      Math.max(
        0,
        (p[0] - join[0]) * (end[0] - join[0]) +
          (p[1] - join[1]) * (end[1] - join[1]),
      ) / D.pathLength;
    const half = T.MathUtils.lerp(
      D.laneWidth / 2,
      D.pathWidth / 2,
      T.MathUtils.smoothstep(downstream, D.taperStart, D.pathLength),
    );
    const at = (offset: number): P => [
      p[0] + n[0] * offset,
      p[1] + n[1] * offset,
    ];
    const gateDistance = Math.hypot(p[0] - join[0], p[1] - join[1]);
    const apron =
      D.pedestrianApronExtra *
      (1 - T.MathUtils.smoothstep(gateDistance, 1.8, 3.8));
    const brookHalf = half + apron;
    left.push(at(-half));
    right.push(at(brookHalf));
    outerLeft.push(at(-half - D.formationMargin));
    outerRight.push(at(brookHalf + D.formationMargin));
    wall.push(at(brookHalf + D.wallOffset));
  });
  return {
    spine: segments([{ ...lane, points: [start, join, end] }]),
    paving: [...left, ...right.slice().reverse()],
    formation: [...outerLeft, ...outerRight.reverse()],
    wall,
  };
}

export function addHallWoodlandSurface(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  kit.batch(
    drape(
      surface.hallWoodlandPlan.paving,
      (x, z) => surface.hallWoodlandY(x, z) + 0.025,
      0.5,
    ),
    kit.m.asphalt,
  );
}

export function addHallWoodlandWall(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const stone = kit.mat('hallBrookMossStone', '#737768');
  stone.map = retainingTexture();
  stone.bumpMap = stone.map;
  stone.bumpScale = 0.035;
  const points = surface.hallWoodlandPlan.wall;
  const walls: { a: P; b: P }[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const x = (a[0] + b[0]) / 2,
      z = (a[1] + b[1]) / 2;
    kit.box(
      x,
      surface.hallWoodlandY(x, z) + D.wallHeight / 2 - 0.08,
      z,
      D.wallWidth,
      D.wallHeight,
      Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.02,
      stone,
      Math.atan2(b[0] - a[0], b[1] - a[1]),
    );
    walls.push({ a, b });
  }
  return walls;
}

/** Local coordinates: t downstream, s towards the brook. Fitted gate location. */
export function hallGateWorld(s: number, t: number): P {
  const length = Math.hypot(...D.gateDirection);
  const dx = D.gateDirection[0] / length,
    dz = D.gateDirection[1] / length;
  return [D.gateCentre[0] + dx * t - dz * s, D.gateCentre[1] + dz * t + dx * s];
}

/** Closed vehicle gate, pedestrian leaf held open inside its curved enclosure.
 * Open leaf angle is a game choice, not the photographed/current gate state. */
export function addHallWoodlandGates(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const steel = kit.mat('hallGateGalvanised', '#a4aaa5', 0.55);
  const walls: { a: P; b: P }[] = [];
  const floor = surface.hallWoodlandY(...D.gateCentre);
  const vector = (p: P, h: number) => new T.Vector3(p[0], floor + h, p[1]);
  function rail(a: P, b: P, h: number, width = 0.036) {
    kit.beam(vector(a, h), vector(b, h), width, width, steel);
  }
  function post(p: P) {
    kit.box(
      p[0],
      floor + D.gateHeight / 2,
      p[1],
      0.065,
      D.gateHeight + 0.08,
      0.065,
      steel,
    );
  }
  function leaf(a: P, b: P) {
    post(a);
    post(b);
    for (const h of [0.1, 0.3, 0.5, 0.7, 0.9, 1.1]) rail(a, b, h);
    const middle: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    kit.beam(vector(middle, 0.1), vector(middle, 1.1), 0.026, 0.026, steel);
    walls.push({ a, b });
  }
  const hinge = hallGateWorld(D.pedestrianHinge, 0);
  leaf(hallGateWorld(D.gateLeft, 0), hinge);
  // Leaf points into the enclosure; walkers go around its free end.
  leaf(hinge, hallGateWorld(D.pedestrianHinge + D.pedestrianLeaf, 0));
  const cage: P[] = Array.from({ length: 17 }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.PI * i) / 16;
    return hallGateWorld(
      D.pedestrianHinge +
        (D.enclosureSide - D.pedestrianHinge) * Math.cos(angle),
      D.enclosureDepth * Math.sin(angle),
    );
  });
  for (let i = 1; i < cage.length; i++) {
    for (const h of [0.12, 0.38, 0.64, 0.9, 1.1]) rail(cage[i - 1], cage[i], h);
    walls.push({ a: cage[i - 1], b: cage[i] });
  }
  for (const i of [0, 4, 8, 12, 16]) post(cage[i]);

  const frame = kit.mat('hallNoticeFrame', '#282e29', 0.8);
  const backing = kit.mat('hallNoticeBacking', '#80775f');
  const paper = kit.mat('hallNoticePaper', '#d1cdbb');
  const yaw = Math.atan2(D.gateDirection[0], D.gateDirection[1]);
  const board = (
    s: number,
    t: number,
    h: number,
    w: number,
    height: number,
    depth: number,
    material: T.Material,
  ) => {
    const p = hallGateWorld(s, t);
    kit.box(
      p[0],
      surface.hallWoodlandY(...p) + h,
      p[1],
      w,
      height,
      depth,
      material,
      yaw,
    );
  };
  // Frame faces the lane. Five pale notice sheets are visually distinguishable;
  // their content is deliberately omitted, dimensions remain estimates.
  for (const s of [-0.55, 0.55]) {
    const p = hallGateWorld(D.boardSide + s, D.boardAlong);
    board(D.boardSide + s, D.boardAlong, 0.95, 0.07, 1.9, 0.07, frame);
    walls.push({ a: [p[0] - 0.035, p[1]], b: [p[0] + 0.035, p[1]] });
  }
  board(D.boardSide, D.boardAlong, 1.6, 1.3, 0.85, 0.12, frame);
  board(D.boardSide, D.boardAlong - 0.07, 1.6, 1.17, 0.72, 0.015, backing);
  for (const [s, h, height] of [
    [-0.38, 1.79, 0.22],
    [-0.38, 1.49, 0.22],
    [-0.02, 1.79, 0.22],
    [-0.02, 1.49, 0.22],
    [0.37, 1.64, 0.49],
  ])
    board(D.boardSide + s, D.boardAlong - 0.085, h, 0.25, height, 0.008, paper);
  // The board itself, as well as its supports, is solid.
  walls.push({
    a: hallGateWorld(D.boardSide - 0.65, D.boardAlong),
    b: hallGateWorld(D.boardSide + 0.65, D.boardAlong),
  });
  return walls;
}
