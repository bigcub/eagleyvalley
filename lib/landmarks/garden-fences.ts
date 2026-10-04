import * as T from 'three';
import type { P } from '../core/geo';
import type { Kit } from '../core/kit';

type Ground = (x: number, z: number) => number;
export type Wall = { a: P; b: P };

/** Diagonal timber lattice with open diamonds, as in the user's fence photos. */
function latticeMaterial(kit: Kit) {
  const m = kit.mat('gardenTrellisLattice', '#8d8370');
  if (m.map) return m;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#b7ab92';
  g.lineWidth = 9;
  // One strip each way per tile, drawn across the wrap so diamonds tile cleanly.
  for (const o of [-64, 0, 64]) {
    g.beginPath();
    g.moveTo(o, 0);
    g.lineTo(o + 64, 64);
    g.moveTo(o + 64, 0);
    g.lineTo(o, 64);
    g.stroke();
  }
  const lattice = new T.CanvasTexture(c);
  lattice.wrapS = lattice.wrapT = T.RepeatWrapping;
  lattice.colorSpace = T.SRGBColorSpace;
  m.map = lattice;
  m.alphaTest = 0.5;
  m.side = T.DoubleSide;
  return m;
}

/** UP-003 supports close boarding. Board widths, grain and weathering are
 * representative estimates, generated here without using reference pixels. */
function closeBoardMaterial(kit: Kit) {
  const m = kit.mat('gardenCloseBoard', '#ffffff');
  if (m.map) return m;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1024;
  const ctx = c.getContext('2d')!;
  let seed = 4187;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let board = 0; board < 4; board++) {
    const x = board * 128,
      shade = Math.round(128 + rand() * 20);
    ctx.fillStyle = `rgb(${shade + 10},${shade - 5},${shade - 29})`;
    ctx.fillRect(x, 0, 128, c.height);
    // Dark joint and pale edge make separate vertical boards readable.
    ctx.fillStyle = '#3d352b';
    ctx.fillRect(x, 0, 3, c.height);
    ctx.fillStyle = '#c6b49766';
    ctx.fillRect(x + 3, 0, 2, c.height);
    for (let line = 0; line < 70; line++) {
      const gx = x + 6 + rand() * 117,
        wave = rand() * 3,
        phase = rand() * Math.PI * 2;
      ctx.strokeStyle = line % 3 ? '#31291e16' : '#eee3ce19';
      ctx.lineWidth = 0.5 + rand() * 1.1;
      ctx.beginPath();
      for (let y = 0; y <= c.height; y += 16) {
        const px = gx + Math.sin((y / c.height) * Math.PI * 4 + phase) * wave;
        if (y === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
    }
    const kx = x + 32 + rand() * 64,
      ky = 180 + rand() * 650;
    ctx.strokeStyle = '#55473630';
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      ctx.ellipse(kx, ky, 2 + ring * 1.6, 5 + ring * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const texture = new T.CanvasTexture(c);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  m.map = m.bumpMap = texture;
  m.bumpScale = 0.008;
  return m;
}

/** A vertical quad from a to b with UVs in metres / tile. */
function panel(
  a: P,
  b: P,
  ya: number,
  yb: number,
  bottom: number,
  top: number,
  tile: number,
  tileHeight = tile,
) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const g = new T.BufferGeometry();
  g.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [
        a[0],
        ya + bottom,
        a[1],
        b[0],
        yb + bottom,
        b[1],
        b[0],
        yb + top,
        b[1],
        a[0],
        ya + top,
        a[1],
      ],
      3,
    ),
  );
  g.setAttribute(
    'uv',
    new T.Float32BufferAttribute(
      [
        0,
        0,
        len / tile,
        0,
        len / tile,
        (top - bottom) / tileHeight,
        0,
        (top - bottom) / tileHeight,
      ],
      2,
    ),
  );
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

function bays(a: P, b: P, spacing: number) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(len / spacing));
  return Array.from(
    { length: n + 1 },
    (_, i): P => [
      a[0] + ((b[0] - a[0]) * i) / n,
      a[1] + ((b[1] - a[1]) * i) / n,
    ],
  );
}

/** Old mill garden divider: square posts, boarded plinth, lattice panel and a
 * heavy capping rail with metal post brackets. Proportions from user photos;
 * about 1.15m high, not measured. */
export function trellisFence(kit: Kit, a: P, b: P, ground: Ground): Wall {
  const timber = kit.mat('gardenTrellisTimber', '#857a66');
  const board = kit.mat('gardenTrellisBoard', '#6f6656');
  const bracket = kit.mat('gardenTrellisBracket', '#a3a6a2', 0.5);
  const mesh = latticeMaterial(kit);
  const posts = bays(a, b, 1.85);
  const rot = Math.atan2(b[0] - a[0], b[1] - a[1]);
  for (const [i, p] of posts.entries()) {
    const y = ground(...p);
    kit.box(p[0], y + 0.5, p[1], 0.1, 1.12, 0.1, timber, rot);
    kit.box(p[0], y + 1.1, p[1], 0.13, 0.09, 0.16, bracket, rot);
    if (!i) continue;
    const q = posts[i - 1],
      yq = ground(...q),
      mx = (p[0] + q[0]) / 2,
      mz = (p[1] + q[1]) / 2,
      my = (y + yq) / 2,
      len = Math.hypot(p[0] - q[0], p[1] - q[1]);
    kit.box(mx, my + 0.16, mz, 0.035, 0.3, len - 0.1, board, rot);
    kit.batch(panel(q, p, yq, y, 0.33, 0.97, 0.16), mesh);
    for (const h of [0.32, 0.98])
      kit.box(mx, my + h, mz, 0.05, 0.045, len - 0.1, timber, rot);
    kit.box(mx, my + 1.07, mz, 0.15, 0.09, len + 0.06, timber, rot);
  }
  return { a, b };
}

/** Close-boarded timber fence with posts and a capping strip. */
export function boardFence(
  kit: Kit,
  a: P,
  b: P,
  ground: Ground,
  height: number,
): Wall {
  const boards = closeBoardMaterial(kit);
  const post = kit.mat('gardenFencePost', '#6e6250');
  const posts = bays(a, b, 1.8);
  const rot = Math.atan2(b[0] - a[0], b[1] - a[1]);
  for (const [i, p] of posts.entries()) {
    const y = ground(...p);
    kit.box(p[0], y + height / 2, p[1], 0.1, height + 0.05, 0.1, post, rot);
    if (!i) continue;
    const q = posts[i - 1],
      yq = ground(...q),
      len = Math.hypot(p[0] - q[0], p[1] - q[1]);
    const g = panel(q, p, yq, y, 0.05, height, 0.48, 2.4);
    kit.batch(g, boards);
    // Thin rear layer so the panel reads from both sides without DoubleSide.
    const back = panel(p, q, y, yq, 0.05, height, 0.48, 2.4);
    kit.batch(back, boards);
    kit.box(
      (p[0] + q[0]) / 2,
      (y + yq) / 2 + height,
      (p[1] + q[1]) / 2,
      0.07,
      0.04,
      len,
      post,
      rot,
    );
  }
  return { a, b };
}

/** Clipped hedge: dense core with leaf cards breaking the outline. */
export function clippedHedge(
  kit: Kit,
  leaf: T.Material,
  a: P,
  b: P,
  ground: Ground,
  height: number,
  width: number,
) {
  const core = kit.mat('gardenClippedHedge', '#3f5034');
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const rot = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(len / 0.7));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n,
      x = a[0] + (b[0] - a[0]) * t,
      z = a[1] + (b[1] - a[1]) * t,
      y = ground(x, z),
      h = height;
    kit.box(x, y + h / 2, z, width * 0.86, h, len / n + 0.02, core, rot);
    for (let k = 0; k < 18; k++) {
      const side = k % 2 ? 1 : -1,
        along = Math.sin(k * 2.3 + i) * 0.3,
        g = new T.PlaneGeometry(0.3, 0.3);
      g.rotateY(rot + Math.sin(k + i) * 0.7);
      g.rotateX(Math.sin(k * 3.1) * 0.5);
      const top = k > 13;
      g.translate(
        x +
          Math.sin(rot) * along +
          Math.cos(rot) * side * (top ? 0.15 : width * 0.44),
        y + (top ? h : 0.2 + ((k * 0.37) % 1) * (h - 0.3)),
        z +
          Math.cos(rot) * along -
          Math.sin(rot) * side * (top ? 0.15 : width * 0.44),
      );
      kit.batch(g, leaf);
    }
  }
}

/** Low black iron pedestrian gate, leaf stood open into the garden. */
export function ironGate(
  kit: Kit,
  hinge: P,
  latch: P,
  ground: Ground,
  openTo: 1 | -1,
) {
  const { dark } = kit.m;
  const w = Math.hypot(latch[0] - hinge[0], latch[1] - hinge[1]);
  const base = Math.atan2(latch[0] - hinge[0], latch[1] - hinge[1]);
  for (const p of [hinge, latch])
    kit.box(p[0], ground(...p) + 0.6, p[1], 0.09, 1.2, 0.09, dark, base);
  const angle = base + openTo * 1.35,
    y = ground(...hinge),
    at = (d: number): P => [
      hinge[0] + Math.sin(angle) * d,
      hinge[1] + Math.cos(angle) * d,
    ];
  for (const h of [0.12, 0.98]) {
    const [x, z] = at(w / 2);
    kit.box(x, y + h, z, 0.04, 0.04, w - 0.1, dark, angle);
  }
  for (let k = 1; k < 9; k++) {
    const [x, z] = at((k * w) / 9);
    kit.box(x, y + 0.55, z, 0.02, 0.86, 0.02, dark, angle);
  }
}

/** Hoop-topped iron railing, as at the Bridge Mill light wells and the
 * modern block's well (user photos): close bars, a low rail and overlapping
 * half-loops along the top. Spacing and height estimated. */
export function hoopRailing(
  kit: Kit,
  a: P,
  b: P,
  base: number,
  height = 0.95,
): Wall {
  const { dark } = kit.m;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.round(len / 0.12)),
    step = len / n,
    r = step,
    rot = Math.atan2(b[0] - a[0], b[1] - a[1]),
    turn = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
  const at = (i: number): P => [
    a[0] + ((b[0] - a[0]) * i) / n,
    a[1] + ((b[1] - a[1]) * i) / n,
  ];
  for (let i = 0; i <= n; i++) {
    const [x, z] = at(i);
    kit.box(x, base + (height - r) / 2, z, 0.018, height - r, 0.018, dark);
    if (i + 2 > n) continue;
    const arc = new T.TorusGeometry(r, 0.009, 3, 8, Math.PI);
    arc.rotateY(turn);
    const [cx, cz] = at(i + 1);
    arc.translate(cx, base + height - r, cz);
    kit.batch(arc, dark);
  }
  const [mx, mz] = at(n / 2);
  kit.box(mx, base + 0.1, mz, 0.03, 0.03, len, dark, rot);
  return { a, b };
}
