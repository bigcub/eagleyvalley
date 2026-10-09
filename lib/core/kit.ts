import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { P } from './geo';
import { masonryUV } from '../materials/building-surfaces';
import { masonryTexture } from '../materials/masonry-texture';

// The kit collects static geometry per material and merges it into one mesh
// per material at the end of world construction.
export type Box = (
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  m: T.Material,
  rot?: number,
) => void;
export type Batch = (g: T.BufferGeometry, m: T.Material) => void;

export function canvasTexture(kind: 'brick' | 'road' | 'stone') {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.fillStyle =
    kind === 'stone' ? '#766f60' : kind === 'road' ? '#535957' : '#96715d';
  ctx.fillRect(0, 0, 256, 256);
  if (kind !== 'road') {
    const bh = kind === 'stone' ? 27 : 16,
      bw = kind === 'stone' ? 65 : 41;
    for (let y = 0; y < 256; y += bh)
      for (let x = -bw; x < 256; x += bw) {
        const v = Math.floor(rand() * 23);
        ctx.fillStyle =
          kind === 'stone'
            ? `rgb(${141 + v},${134 + v},${112 + v})`
            : `rgb(${130 + v},${76 + v},${54 + v})`;
        ctx.fillRect(x + (((y / bh) % 2) * bw) / 2 + 1, y + 1, bw - 2, bh - 2);
      }
  }
  for (let i = 0; i < 13000; i++) {
    ctx.fillStyle = rand() > 0.5 ? '#ffffff0a' : '#0000000a';
    ctx.fillRect(rand() * 256, rand() * 256, 1, 1);
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function blockPavingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const bc = canvas.getContext('2d')!;
  bc.fillStyle = '#595b58';
  bc.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 16; row++)
    for (let col = -1; col < 9; col++) {
      const shade = 104 + ((row * 13 + col * 7) % 17);
      bc.fillStyle = `rgb(${shade},${shade + 2},${shade - 1})`;
      bc.fillRect(col * 32 + (row % 2) * 16 + 1, row * 16 + 1, 30, 14);
    }
  const map = new T.CanvasTexture(canvas);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(4, 4);
  map.colorSpace = T.SRGBColorSpace;
  return map;
}

export function createKit() {
  const mats: Record<string, T.Material> = {},
    batches: Record<string, T.BufferGeometry[]> = {};

  /** Shared named material; the first call fixes its colour and roughness. */
  function mat(key: string, color: string, rough = 1) {
    if (!mats[key])
      mats[key] = new T.MeshStandardMaterial({ color, roughness: rough });
    return mats[key] as T.MeshStandardMaterial;
  }

  const stone = mat('stone', '#eee7d8');
  stone.map = masonryTexture();
  stone.bumpMap = stone.map;
  stone.bumpScale = 0.055;
  const brick = mat('brick', '#e4b99b');
  brick.map = canvasTexture('brick');
  const asphalt = mat('asphalt', '#c4c8bf');
  asphalt.map = canvasTexture('road');
  const blockPaving = mat('threadfoldBlocks', '#bebdb4');
  blockPaving.map = blockPavingTexture();
  blockPaving.bumpMap = blockPaving.map;
  blockPaving.bumpScale = 0.016;

  const m = {
    stone,
    brick,
    asphalt,
    blockPaving,
    slate: mat('slate', '#48575a'),
    glass: mat('glass', '#46666b', 0.28),
    trim: mat('trim', '#d5cbb3'),
    dark: mat('dark', '#263a36'),
    kerb: mat('kerb', '#b9b8a8'),
    paint: mat('paint', '#e0dfc8'),
    soil: mat('soil', '#586b49'),
    paving: mat('paving', '#999789'),
  };

  // Optional remap applied to every batched geometry while `transformed` runs.
  let transform: ((g: T.BufferGeometry) => void) | undefined;

  function batch(g: T.BufferGeometry, material: T.Material) {
    transform?.(g);
    if (material.userData.pitchedRoof) {
      if (g.index) g = g.toNonIndexed();
      g.computeVertexNormals();
    }
    if (material === stone || material === brick)
      masonryUV(g, material === stone ? 4 : 1.2);
    else if (material.userData.masonryMetres)
      masonryUV(g, material.userData.masonryMetres as number);
    const key = material.uuid;
    mats[key] = material;
    (batches[key] ??= []).push(g.index ? g.toNonIndexed() : g);
  }

  const box: Box = (x, y, z, w, h, d, material, rot = 0) => {
    const g = new T.BoxGeometry(w, h, d);
    g.rotateY(rot);
    g.translate(x, y, z);
    batch(g, material);
  };

  /** A box stretched between two points, e.g. a rail or wire. */
  function beam(
    a: T.Vector3,
    b: T.Vector3,
    w: number,
    d: number,
    material: T.Material,
  ) {
    const delta = b.clone().sub(a),
      g = new T.BoxGeometry(w, delta.length(), d);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.normalize(),
      ),
    );
    const mid = a.clone().add(b).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    batch(g, material);
  }

  /** Flat horizontal polygon at a fixed height. */
  function polygon(points: P[], material: T.Material, y: number) {
    const shape = new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1])));
    const g = new T.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    g.translate(0, y, 0);
    batch(g, material);
  }

  /**
   * Strip of constant or varying width along a polyline, draped by `yFn`.
   * `keep` can drop individual quads, e.g. where another road crosses.
   */
  function ribbon(
    points: P[],
    width: number | ((x: number, z: number) => number),
    material: T.Material,
    yFn: (x: number, z: number) => number,
    offset = 0,
    keep?: (a: P, b: P) => boolean,
  ) {
    const p: number[] = [],
      uv: number[] = [],
      idx: number[] = [];
    let dist = 0;
    points.forEach((a, i) => {
      const before = points[Math.max(0, i - 1)],
        after = points[Math.min(points.length - 1, i + 1)],
        dx = after[0] - before[0],
        dz = after[1] - before[1],
        l = Math.hypot(dx, dz) || 1,
        nx = -dz / l,
        nz = dx / l;
      if (i) dist += Math.hypot(a[0] - before[0], a[1] - before[1]);
      const half = (typeof width === 'number' ? width : width(...a)) / 2;
      for (const side of [-1, 1]) {
        const x = a[0] + nx * (half * side + offset),
          z = a[1] + nz * (half * side + offset);
        p.push(x, yFn(x, z), z);
        uv.push((side + 1) / 2, dist / 8);
      }
      if (i && (!keep || keep(points[i - 1], a))) {
        const k = i * 2;
        idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
      }
    });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    batch(g, material);
  }

  /** Run `build` with each geometry it batches passed through `t` first.
   * Box, beam, polygon and ribbon all batch, so they are covered too. */
  function transformed<R>(t: (g: T.BufferGeometry) => void, build: () => R) {
    const previous = transform;
    transform = t;
    try {
      return build();
    } finally {
      transform = previous;
    }
  }

  /** Merge collected geometry into one mesh per material and add to the scene. */
  function flush(scene: T.Scene, noShadow: T.Material[]) {
    for (const [key, geos] of Object.entries(batches)) {
      if (!geos.length) continue;
      const g = mergeGeometries(geos, false);
      if (g) {
        const mesh = new T.Mesh(g, mats[key]);
        mesh.castShadow = !noShadow.includes(mats[key]);
        mesh.receiveShadow = true;
        scene.add(mesh);
      }
      geos.forEach((g) => g.dispose());
    }
  }

  return { m, mat, batch, box, beam, polygon, ribbon, transformed, flush };
}
export type Kit = ReturnType<typeof createKit>;
export type Materials = Kit['m'];
