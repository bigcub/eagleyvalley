import * as T from 'three';
import { densify, inPoly, nearest, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import { retainingTexture } from '../materials/landscape-materials';
import { roadWidth, type WorldData } from '../world/data';
import {
  BROOK_WATER_WIDTH,
  BRIDGE_GATE_PLANTING,
  HALL_WOODLAND_ENTRANCE,
  OSM,
} from '../world/layout';
import type { Surface } from '../world/surface';

/** June 2024 GXa bridge views and August 2022 J2Oz Hall lane show wooded
 * banks with dense undergrowth and a low ivy-covered lane wall. The mapped
 * brook/lane locate the groups; offsets, specimens and heights are estimates. */
function laneWall(data: WorldData) {
  const lane = data.roads.find((f) => f.id === OSM.hallLane)!;
  const [a, b] = lane.points;
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / length,
    dz = (b[1] - a[1]) / length;
  const offset =
    HALL_WOODLAND_ENTRANCE.laneWidth / 2 + HALL_WOODLAND_ENTRANCE.wallOffset;
  // Keep the junction open and join the existing final entrance wall.
  const at = (t: number): P => [
    a[0] + dx * t - dz * offset,
    a[1] + dz * t + dx * offset,
  ];
  return densify([at(8), at(length - HALL_WOODLAND_ENTRANCE.laneLead)], 0.8);
}

export function addHallLaneBoundary(
  kit: Kit,
  { surface, data }: { surface: Surface; data: WorldData },
) {
  const stone = kit.mat('hallBrookMossStone', '#737768');
  if (!stone.map) {
    stone.map = retainingTexture();
    stone.bumpMap = stone.map;
    stone.bumpScale = 0.035;
  }
  const points = laneWall(data),
    walls: { a: P; b: P }[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      x = (a[0] + b[0]) / 2,
      z = (a[1] + b[1]) / 2;
    const height = 0.55 + Math.sin(i * 0.57) * 0.035;
    kit.box(
      x,
      surface.roadY(x, z) + height / 2 - 0.08,
      z,
      HALL_WOODLAND_ENTRANCE.wallWidth,
      height,
      Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.02,
      stone,
      Math.atan2(b[0] - a[0], b[1] - a[1]),
    );
    walls.push({ a, b });
  }
  return walls;
}

export function woodedBankPlan(
  surface: Surface,
  data: WorldData,
  hitBuilding: (x: number, z: number, r: number) => boolean,
) {
  const shrubs: { x: number; z: number; h: number }[] = [],
    trees: { x: number; z: number; h: number }[] = [];
  const clear = (x: number, z: number, radius: number) => {
    const road = nearest(x, z, surface.roadSeg);
    return (
      road.d > roadWidth(road.s.f) / 2 + radius + 0.5 &&
      nearest(x, z, surface.riverSeg).d >
        BROOK_WATER_WIDTH / 2 + radius * 0.65 &&
      !hitBuilding(x, z, radius + 0.6) &&
      !surface.inPassage(x, z) &&
      !inPoly(x, z, BRIDGE_GATE_PLANTING.lawn) &&
      !inPoly(x, z, surface.turningCirclePlan.formation) &&
      !inPoly(x, z, surface.hallWoodlandPlan.formation)
    );
  };
  // Both banks visible from the bridge; continue downstream alongside Hall lane.
  // No planting is scattered into neighbouring gardens or unrelated streets.
  for (const water of data.water) {
    const points = densify(water.points, 2.2);
    points.forEach((p, i) => {
      if (p[0] < 104 || p[0] > 232) return;
      const a = points[Math.max(0, i - 1)],
        b = points[Math.min(points.length - 1, i + 1)];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = -(b[1] - a[1]) / length,
        nz = (b[0] - a[0]) / length;
      for (const side of [-1, 1]) {
        for (const band of [5.2, 7.6, 10.2]) {
          const offset = side * (band + Math.sin(i * 2.1 + band) * 0.4);
          const x = p[0] + nx * offset,
            z = p[1] + nz * offset;
          const h = 1.1 + (1 + Math.sin(i * 1.37 + band)) * 0.75;
          if (clear(x, z, 1.05)) shrubs.push({ x, z, h });
        }
        if (i % 4 !== 0) continue;
        const x = p[0] + nx * side * 8.8,
          z = p[1] + nz * side * 8.8;
        if (clear(x, z, 1.7))
          trees.push({ x, z, h: 9.5 + (1 + Math.sin(i * 0.8)) * 2.2 });
      }
    });
  }
  return { shrubs, trees };
}

export function addHoughBankPlanting(
  kit: Kit,
  {
    scene,
    surface,
    data,
    leaf,
    shrubs,
  }: {
    scene: T.Scene;
    surface: Surface;
    data: WorldData;
    leaf: T.Material;
    shrubs: { x: number; z: number; h: number }[];
  },
) {
  // Instanced foliage clusters with visible slender woody stems. Smaller cards
  // and irregular height layers distinguish loose bank growth from clipped hedges.
  const cards = new T.InstancedMesh(
    new T.PlaneGeometry(1, 1),
    leaf,
    shrubs.length * 72,
  );
  const dummy = new T.Object3D();
  const twig = kit.mat('houghBankTwigs', '#625d43');
  shrubs.forEach((p, i) => {
    const y = surface.terrain(p.x, p.z);
    for (let j = 0; j < 4; j++) {
      const angle = j * 2.399 + i;
      kit.beam(
        new T.Vector3(p.x, y, p.z),
        new T.Vector3(
          p.x + Math.sin(angle) * 0.5,
          y + p.h * 0.83,
          p.z + Math.cos(angle) * 0.5,
        ),
        0.023,
        0.023,
        twig,
      );
    }
    for (let j = 0; j < 72; j++) {
      const angle = j * 2.399 + i * 0.7;
      const level = (j % 12) / 11;
      const radius =
        (0.3 + 0.65 * Math.sin(Math.PI * (0.12 + level * 0.76))) *
        Math.sqrt(((j * 37 + i * 19) % 101) / 101);
      dummy.position.set(
        p.x + Math.sin(angle) * radius,
        y + 0.2 + level * p.h,
        p.z + Math.cos(angle) * radius,
      );
      dummy.rotation.set(Math.sin(j * 0.7) * 0.9, angle, Math.cos(i + j) * 0.3);
      const size = 0.65 + 0.22 * Math.sin(i + j * 0.9);
      dummy.scale.set(size, size * 0.85, 1);
      dummy.updateMatrix();
      cards.setMatrixAt(i * 72 + j, dummy.matrix);
      cards.setColorAt(
        i * 72 + j,
        new T.Color().setHSL(
          0.23 + 0.015 * Math.sin(i),
          0.32,
          0.47 + 0.1 * Math.sin(j + i),
        ),
      );
    }
  });
  cards.castShadow = cards.receiveShadow = true;
  scene.add(cards);
  // Hanging foliage follows the photographed wall rather than a ground hedge.
  const wall = laneWall(data);
  wall.forEach((p, i) => {
    if (i % 2) return;
    for (let j = 0; j < 4; j++) {
      const g = new T.PlaneGeometry(0.65, 0.52);
      g.rotateY(-0.69 + j * 0.7);
      g.translate(p[0], surface.roadY(...p) + 0.5 - j * 0.12, p[1]);
      kit.batch(g, leaf);
    }
  });
}
