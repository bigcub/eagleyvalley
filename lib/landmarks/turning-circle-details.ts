import * as T from 'three';
import { densify, inPoly, outline, type P } from '../core/geo';
import { canvasTexture, type Kit } from '../core/kit';
import { drape, sweep } from '../core/mesh';
import { masonryUV } from '../materials/building-surfaces';
import { TURNING_CIRCLE_DETAILS as D } from '../world/layout';
import type { Surface } from '../world/surface';

type Wall = { a: P; b: P };

/** EAG-048/049 shelter, bin and brick bed, EAG-045 nose post and loop lamps.
 * Dimensions and concealed supports are estimates. Reference images stay out
 * of the model; the shelter notice board is unlettered. */
export function addTurningCircleFurniture(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const walls: Wall[] = [];
  const pale = kit.mat('turningShelterPanels', '#d6d8d0');
  const steel = kit.mat('turningShelterFrame', '#3b403c');
  const column = kit.mat('turningLampColumns', '#9b9f92', 0.65);
  const black = kit.mat('turningBin', '#303633');
  const brick = kit.mat('turningBedBrick', '#d5ae91');
  brick.map = canvasTexture('brick');
  brick.bumpMap = brick.map;
  brick.bumpScale = 0.02;
  const earth = kit.mat('turningBedSoil', '#4c4838');
  const y = surface.turningCircleY;
  const bed = surface.turningCirclePlan.bed;
  kit.batch(
    drape(
      surface.turningCirclePlan.shelterApron,
      (x, z) => y(x, z) + 0.073,
      0.5,
    ),
    kit.m.blockPaving,
  );
  kit.batch(
    drape(bed, (x, z) => y(x, z) + D.bed.height, 0.8),
    earth,
  );
  for (const edge of outline(bed)) {
    const [a, b] = [edge.a, edge.b];
    const h = D.bed.height - 0.07;
    const g = new T.BoxGeometry(
      0.24,
      h,
      Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.025,
    );
    g.rotateY(Math.atan2(b[0] - a[0], b[1] - a[1]));
    g.translate(
      (a[0] + b[0]) / 2,
      (y(...a) + y(...b)) / 2 + 0.07 + h / 2,
      (a[1] + b[1]) / 2,
    );
    masonryUV(g, 1.2);
    kit.batch(g, brick);
    walls.push({ a, b });
  }

  function local(centre: P, rotation: number, u: number, v: number): P {
    return [
      centre[0] + Math.cos(rotation) * u + Math.sin(rotation) * v,
      centre[1] - Math.sin(rotation) * u + Math.cos(rotation) * v,
    ];
  }
  const s = D.shelter;
  const base = y(...s.centre) + 0.07;
  const at = (u: number, v: number) => local(s.centre, s.rotation, u, v);
  const box = (
    u: number,
    h: number,
    v: number,
    w: number,
    height: number,
    depth: number,
    material: T.Material,
  ) => {
    const p = at(u, v);
    kit.box(
      ...([
        p[0],
        base + h,
        p[1],
        w,
        height,
        depth,
        material,
        s.rotation,
      ] as const),
    );
  };
  // Opaque three-bay back and side panels, open towards the carriageway.
  for (let i = 0; i < 3; i++)
    box(
      ((i - 1) * s.width) / 3,
      s.height / 2,
      s.depth / 2,
      s.width / 3 - 0.055,
      s.height - 0.12,
      0.055,
      pale,
    );
  for (const u of [-s.width / 2, s.width / 2]) {
    box(u, s.height / 2, 0, 0.055, s.height - 0.12, s.depth, pale);
    for (const v of [-s.depth / 2, s.depth / 2]) {
      box(u, s.height / 2, v, 0.07, s.height, 0.07, steel);
      const p = at(u, v);
      walls.push({ a: p, b: p });
    }
    walls.push({ a: at(u, -s.depth / 2), b: at(u, s.depth / 2) });
  }
  walls.push({
    a: at(-s.width / 2, s.depth / 2),
    b: at(s.width / 2, s.depth / 2),
  });
  box(0, s.height + 0.035, 0, s.width + 0.2, 0.12, s.depth + 0.2, steel);
  for (const u of [-s.width / 6, s.width / 6])
    box(
      u,
      s.height / 2,
      s.depth / 2 - 0.034,
      0.025,
      s.height - 0.13,
      0.018,
      steel,
    );
  box(0, 1.25, s.depth / 2 - 0.045, 0.73, 0.86, 0.025, steel);
  box(0, 1.25, s.depth / 2 - 0.062, 0.64, 0.77, 0.015, kit.m.trim);

  const bin = D.bin;
  const binY = y(...bin.centre) + 0.07;
  kit.box(
    bin.centre[0],
    binY + bin.height / 2,
    bin.centre[1],
    bin.width,
    bin.height,
    bin.depth,
    black,
    bin.rotation,
  );
  kit.box(
    bin.centre[0],
    binY + bin.height,
    bin.centre[1],
    bin.width + 0.06,
    0.07,
    bin.depth + 0.06,
    steel,
    bin.rotation,
  );
  const face = local(bin.centre, bin.rotation, 0, -bin.depth / 2 - 0.004);
  kit.box(
    face[0],
    binY + 0.95,
    face[1],
    bin.width * 0.55,
    0.13,
    0.013,
    kit.mat('turningBinOpening', '#131914'),
    bin.rotation,
  );
  const binOutline = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([u, v]) =>
    local(bin.centre, bin.rotation, (u * bin.width) / 2, (v * bin.depth) / 2),
  );
  walls.push(...outline(binOutline));

  const post = D.bollard;
  kit.box(
    post.centre[0],
    y(...post.centre) + 0.08 + post.height / 2,
    post.centre[1],
    post.width,
    post.height,
    post.width,
    kit.mat('turningConcretePost', '#9b9b87'),
  );
  walls.push({ a: post.centre, b: post.centre });
  for (const lamp of D.lamps) {
    const base = surface.ground(...lamp.centre) + 0.07;
    const g = new T.CylinderGeometry(0.055, 0.095, lamp.height, 8);
    g.translate(lamp.centre[0], base + lamp.height / 2, lamp.centre[1]);
    kit.batch(g, column);
    const end = local(lamp.centre, lamp.rotation, 0, -0.9);
    kit.beam(
      new T.Vector3(lamp.centre[0], base + lamp.height - 0.12, lamp.centre[1]),
      new T.Vector3(end[0], base + lamp.height + 0.03, end[1]),
      0.065,
      0.065,
      column,
    );
    kit.box(
      end[0],
      base + lamp.height,
      end[1],
      0.28,
      0.12,
      0.65,
      column,
      lamp.rotation,
    );
    kit.box(
      end[0],
      base + lamp.height - 0.062,
      end[1],
      0.21,
      0.018,
      0.45,
      kit.m.trim,
      lamp.rotation,
    );
    walls.push({ a: lamp.centre, b: lamp.centre });
  }
  // Supports of the interpreted crown groups, not a surveyed trunk inventory.
  D.crowns.forEach((t) => walls.push({ a: [t.x, t.z], b: [t.x, t.z] }));
  return walls;
}

/** Continuous clipped outline with fine leaves, plus taller mixed planting.
 * Uses one instanced leaf mesh; the existing landscape foliage texture is shared. */
export function addTurningCirclePlanting(
  kit: Kit,
  {
    scene,
    surface,
    leaf,
  }: { scene: T.Scene; surface: Surface; leaf: T.Material },
) {
  const foliage = kit.mat('turningCircleFoliage', '#bac49a');
  foliage.map = (leaf as T.MeshStandardMaterial).map;
  foliage.alphaTest = 0.42;
  foliage.side = T.DoubleSide;
  const bark = kit.mat('turningSlenderStems', '#93917e');
  const darkBark = kit.mat('turningUnderstoreyStems', '#655f47');
  let seed = 73049;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const leaves: {
    x: number;
    z: number;
    y: number;
    size: number;
    yaw: number;
    tilt: number;
    colour: T.Color;
  }[] = [];
  function card(x: number, y: number, z: number, size: number, bright = 0) {
    leaves.push({
      x,
      y,
      z,
      size,
      yaw: rand() * Math.PI * 2,
      tilt: (rand() - 0.5) * 1.6,
      colour: new T.Color().setHSL(
        0.22 + rand() * 0.04,
        0.26 + rand() * 0.13,
        0.43 + rand() * 0.15 + bright,
      ),
    });
  }
  const path = new T.CatmullRomCurve3(
    D.hedge.map(([x, z]) => new T.Vector3(x, 0, z)),
    true,
    'centripetal',
  );
  const samples = Math.ceil(path.getLength() / 0.22);
  const hedgePoints = path.getSpacedPoints(samples).map((p): P => [p.x, p.z]);
  const normals = hedgePoints.map((_, i): P => {
    const t = path.getTangentAt(i / samples);
    return [-t.z, t.x];
  });
  // The trimmed body stays continuous under its fine leaf silhouette.
  const core = kit.mat('turningClippedHedge', '#52613b');
  // Fine mottled leaves on the closed body, without storing reference imagery.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#637640';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3600; i++) {
    const shade = rand();
    ctx.fillStyle = `rgb(${50 + shade * 65},${70 + shade * 65},${32 + shade * 35})`;
    ctx.beginPath();
    ctx.ellipse(
      rand() * 256,
      rand() * 256,
      1 + rand() * 2,
      2 + rand() * 3,
      rand() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  const hedgeMap = new T.CanvasTexture(canvas);
  hedgeMap.wrapS = hedgeMap.wrapT = T.RepeatWrapping;
  hedgeMap.colorSpace = T.SRGBColorSpace;
  core.color.set('#c2cca8');
  core.map = hedgeMap;
  core.bumpMap = hedgeMap;
  core.bumpScale = 0.015;
  kit.batch(
    sweep(
      hedgePoints,
      normals,
      (i) => surface.turningCircleY(...hedgePoints[i]) + 0.08,
      [
        [-0.43, 0.06],
        [-0.43, 0.6],
        [-0.3, 0.91],
        [0, 0.97],
        [0.3, 0.91],
        [0.43, 0.6],
        [0.43, 0.06],
      ],
    ),
    core,
  );
  for (let i = 0; i < samples; i++) {
    const p = path.getPointAt(i / samples),
      t = path.getTangentAt(i / samples);
    const h = D.hedgeHeight + 0.08 * Math.sin(i * 0.13);
    for (let j = 0; j < 18; j++) {
      const across = (rand() - 0.5) * D.hedgeWidth;
      const x = p.x - t.z * across,
        z = p.z + t.x * across;
      if (!inPoly(x, z, surface.turningCirclePlan.grass)) continue;
      const level = j < 3 ? 0.85 + rand() * 0.13 : 0.1 + rand() * 0.9;
      card(
        x,
        surface.turningCircleY(x, z) + 0.08 + h * level,
        z,
        0.23 + rand() * 0.14,
      );
    }
  }
  for (const crown of [...D.crowns, ...D.understorey]) {
    const y = surface.turningCircleY(crown.x, crown.z) + 0.08;
    const isTree = D.crowns.includes(crown);
    const material = isTree ? bark : darkBark;
    const stem = new T.CylinderGeometry(
      isTree ? 0.045 : 0.035,
      isTree ? 0.12 : 0.08,
      crown.h * 0.72,
      7,
    );
    stem.translate(crown.x, y + crown.h * 0.36, crown.z);
    kit.batch(stem, material);
    for (let k = 0; k < 7; k++) {
      const a = k * 2.399,
        level = 0.26 + k * 0.055;
      kit.beam(
        new T.Vector3(crown.x, y + crown.h * level, crown.z),
        new T.Vector3(
          crown.x + Math.sin(a) * crown.radius * 0.68,
          y + crown.h * (level + 0.18),
          crown.z + Math.cos(a) * crown.radius * 0.68,
        ),
        0.035,
        0.035,
        material,
      );
    }
    for (let j = 0; j < (isTree ? 200 : 160); j++) {
      const level = rand(),
        a = rand() * Math.PI * 2;
      const width =
        crown.radius *
        Math.sqrt(Math.max(0, 1 - Math.pow((level - 0.42) * 1.65, 2)));
      const r = width * Math.sqrt(rand());
      const x = crown.x + Math.cos(a) * r,
        z = crown.z + Math.sin(a) * r;
      if (!inPoly(x, z, surface.turningCirclePlan.grass)) continue;
      card(
        x,
        y + crown.h * (isTree ? 0.35 + 0.65 * level : 0.12 + 0.88 * level),
        z,
        isTree ? 0.6 + rand() * 0.55 : 0.65 + rand() * 0.45,
        isTree ? 0.03 : -0.03,
      );
    }
  }
  // Leafy planting behind the low brick wall, not more generic roadside bushes.
  for (const [i, p] of densify(
    surface.turningCirclePlan.bedFront,
    0.7,
  ).entries()) {
    const x = p[0],
      z = p[1] + 0.45;
    if (!inPoly(x, z, surface.turningCirclePlan.bed)) continue;
    for (let j = 0; j < 18; j++)
      card(
        x + (rand() - 0.5) * 0.65,
        surface.turningCircleY(x, z) + D.bed.height + 0.2 + rand() * 0.9,
        z + (rand() - 0.5) * 0.5,
        0.28 + rand() * 0.2,
        0.02 * Math.sin(i),
      );
  }
  const mesh = new T.InstancedMesh(
    new T.PlaneGeometry(1, 1),
    foliage,
    leaves.length,
  );
  const o = new T.Object3D();
  leaves.forEach((c, i) => {
    o.position.set(c.x, c.y, c.z);
    o.rotation.set(c.tilt, c.yaw, 0);
    o.scale.set(c.size, c.size, 1);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    mesh.setColorAt(i, c.colour);
  });
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
}
