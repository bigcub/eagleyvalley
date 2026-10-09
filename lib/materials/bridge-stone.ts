import * as T from 'three';
import type { Kit } from '../core/kit';

// Old Bridge Mill walling from the user's No.3 frontage photos (7 October
// 2026): coursed, rock-faced sandstone in small blocks, about 0.15–0.22m high
// and 0.3–0.7m long, buff to grey with some ochre and green-grey stones,
// pitted faces and pale recessed joints. No photograph is embedded; the
// texture is drawn procedurally. One tile covers TILE metres of wall.
const TILE = 3;
const SIZE = 1024;

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Weighted palette: mostly buff-grey, some cream, ochre and green-grey stones.
const PALETTE: [number, number, number, number][] = [
  [184, 176, 152, 5],
  [174, 169, 149, 4],
  [194, 186, 162, 3],
  [190, 172, 132, 0.6],
  [166, 166, 146, 0.8],
  [168, 157, 132, 1.2],
];

type Block = { x: number; y: number; w: number; h: number; c: number[] };

/** Courses tile vertically and blocks wrap horizontally. */
function layout(random: () => number) {
  const heights: number[] = [];
  let total = 0;
  while (total < SIZE - 70) {
    const h = Math.round((SIZE * (0.15 + random() * 0.07)) / TILE);
    heights.push(h);
    total += h;
  }
  heights[heights.length - 1] += SIZE - total;
  const weight = PALETTE.reduce((s, p) => s + p[3], 0);
  const pick = () => {
    let r = random() * weight;
    for (const p of PALETTE) if ((r -= p[3]) <= 0) return p;
    return PALETTE[0];
  };
  const blocks: Block[] = [];
  let y = 0;
  for (const h of heights) {
    const start = random() * SIZE;
    let x = start;
    while (x < start + SIZE - 1) {
      let w = Math.round((SIZE * (0.3 + random() * 0.4)) / TILE);
      const left = start + SIZE - x;
      if (left - w < 70) w = left;
      const base = pick(),
        v = (random() - 0.5) * 14;
      blocks.push({
        x,
        y,
        w,
        h,
        c: [base[0] + v, base[1] + v, base[2] + v * 0.8],
      });
      x += w;
    }
    y += h;
  }
  return blocks;
}

/** Draw each block twice when it wraps past the right edge. */
function eachWrapped(blocks: Block[], draw: (b: Block, x: number) => void) {
  for (const b of blocks) {
    const x = b.x % SIZE;
    draw(b, x);
    if (x + b.w > SIZE) draw(b, x - SIZE);
  }
}

function textures() {
  const random = rng(5531);
  const blocks = layout(random);
  const colour = document.createElement('canvas'),
    bump = document.createElement('canvas');
  colour.width = colour.height = bump.width = bump.height = SIZE;
  const c = colour.getContext('2d')!,
    b = bump.getContext('2d')!;
  // Pale lime mortar in the colour map, deep joints in the bump map.
  c.fillStyle = '#c3bba5';
  c.fillRect(0, 0, SIZE, SIZE);
  b.fillStyle = '#202020';
  b.fillRect(0, 0, SIZE, SIZE);
  const joint = 4;
  eachWrapped(blocks, (k, x) => {
    const r = rng(Math.floor(k.x * 7 + k.y * 13));
    const x0 = x + joint / 2 + r() * 1.5,
      y0 = k.y + joint / 2 + r() * 1.5,
      w = k.w - joint - r() * 2,
      h = k.h - joint - r() * 2;
    // Stone face: slight top-light gradient, then pitting.
    const g = c.createLinearGradient(0, y0, 0, y0 + h);
    const [cr, cg, cb] = k.c;
    g.addColorStop(0, `rgb(${cr + 10},${cg + 10},${cb + 8})`);
    g.addColorStop(1, `rgb(${cr - 14},${cg - 14},${cb - 12})`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x0 + r() * 3, y0);
    c.lineTo(x0 + w - r() * 3, y0 + r() * 2);
    c.lineTo(x0 + w, y0 + h - r() * 3);
    c.lineTo(x0 + r() * 2, y0 + h);
    c.closePath();
    c.fill();
    b.fillStyle = '#b4b4b4';
    b.fill();
    c.save();
    b.save();
    c.clip();
    b.clip();
    // Rock-faced pitting: dark pits and pale grains, stronger in the bump.
    const pits = Math.floor((w * h) / 26);
    for (let i = 0; i < pits; i++) {
      const px = x0 + r() * w,
        py = y0 + r() * h,
        s = 1 + r() * 3.5,
        dark = r() < 0.55;
      c.fillStyle = dark ? 'rgba(60,55,40,0.16)' : 'rgba(255,250,232,0.12)';
      c.fillRect(px, py, s, s * (0.6 + r()));
      b.fillStyle = dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)';
      b.fillRect(px, py, s, s * (0.6 + r()));
    }
    // Rounded rock face: edges fall away towards the joints.
    const edge = b.createRadialGradient(
      x0 + w / 2,
      y0 + h / 2,
      Math.min(w, h) * 0.2,
      x0 + w / 2,
      y0 + h / 2,
      Math.max(w, h) * 0.62,
    );
    edge.addColorStop(0, 'rgba(255,255,255,0.18)');
    edge.addColorStop(1, 'rgba(0,0,0,0.45)');
    b.fillStyle = edge;
    b.fillRect(x0, y0, w, h);
    // Occasional weathering: ochre staining and grey-green lichen.
    if (r() < 0.12) {
      c.fillStyle =
        r() < 0.5 ? 'rgba(150,125,75,0.12)' : 'rgba(95,105,75,0.12)';
      c.fillRect(x0, y0 + h * r() * 0.5, w, h * (0.4 + r() * 0.6));
    }
    c.restore();
    b.restore();
  });
  const make = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const t = new T.CanvasTexture(canvas);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    if (srgb) t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: make(colour, true), bumpMap: make(bump, false) };
}

let cached: ReturnType<typeof textures> | undefined;

/** Rock-faced coursed walling for the old mill's walls and engine house. */
export function bridgeStone(kit: Kit) {
  const m = kit.mat('bridgeMillStone', '#ffffff', 0.95);
  if (!m.map) {
    cached ??= textures();
    m.map = cached.map;
    m.bumpMap = cached.bumpMap;
    m.bumpScale = 0.9;
    m.userData.masonryMetres = TILE;
  }
  return m;
}

/** Tooled sandstone for lintels, sills and steps: smoother and greyer. */
export function bridgeDressing(kit: Kit) {
  const m = kit.mat('bridgeMillDressing', '#c2bba6', 0.9);
  if (!m.map) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const random = rng(907);
    ctx.fillStyle = '#d8d2c0';
    ctx.fillRect(0, 0, 256, 256);
    // Fine vertical tooling and speckle.
    for (let x = 0; x < 256; x += 3) {
      ctx.fillStyle = `rgba(90,85,70,${0.04 + random() * 0.05})`;
      ctx.fillRect(x, 0, 1, 256);
    }
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = random() < 0.5 ? '#ffffff14' : '#3c382c18';
      ctx.fillRect(random() * 256, random() * 256, 1.5, 1.5);
    }
    const t = new T.CanvasTexture(canvas);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.colorSpace = T.SRGBColorSpace;
    m.map = t;
    m.bumpMap = t;
    m.bumpScale = 0.03;
    m.userData.masonryMetres = 1;
  }
  return m;
}

/** Green-grey weathering low on the walls, fading upwards (No.3 photos). */
export function bridgeMossWash(kit: Kit) {
  const m = kit.mat('bridgeMillMossWash', '#ffffff', 1);
  if (!m.map) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const random = rng(3301);
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, 'rgba(84,96,58,0.55)');
    g.addColorStop(0.35, 'rgba(96,104,70,0.28)');
    g.addColorStop(1, 'rgba(110,112,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
    // Patchy streaks so the wash isn't a uniform band.
    for (let i = 0; i < 90; i++) {
      const x = random() * 256,
        h = 20 + random() * 70;
      ctx.fillStyle = `rgba(70,82,48,${0.05 + random() * 0.12})`;
      ctx.fillRect(x, 128 - h, 2 + random() * 10, h);
    }
    const t = new T.CanvasTexture(canvas);
    t.wrapS = T.RepeatWrapping;
    t.colorSpace = T.SRGBColorSpace;
    m.map = t;
    m.transparent = true;
    m.depthWrite = false;
    m.polygonOffset = true;
    m.polygonOffsetFactor = -2;
  }
  return m;
}

/** Passage retaining wall and raised bed, No.3 photos (7 October 2026): dark
 * grey slatey dry-stone in thin courses, 0.05-0.16m high and 0.15-0.6m
 * long, with some paler and brownish stones and dark joints. 2.5m tile. */
export function bridgePassageWall(kit: Kit) {
  const m = kit.mat('bridgePassageWall', '#ffffff', 0.97);
  if (!m.map) {
    const size = 1024,
      tile = 2.5,
      random = rng(7717);
    const colour = document.createElement('canvas'),
      bump = document.createElement('canvas');
    colour.width = colour.height = bump.width = bump.height = size;
    const c = colour.getContext('2d')!,
      b = bump.getContext('2d')!;
    c.fillStyle = '#2b2c28';
    c.fillRect(0, 0, size, size);
    b.fillStyle = '#101010';
    b.fillRect(0, 0, size, size);
    const px = size / tile;
    let y = 0;
    while (y < size) {
      const h = Math.min(size - y, Math.round(px * (0.05 + random() * 0.11)));
      const start = random() * size;
      let x = start;
      while (x < start + size) {
        const w = Math.round(px * (0.15 + random() * 0.45)),
          v = random(),
          g = v < 0.05 ? 124 : v < 0.22 ? 70 : 84 + random() * 30,
          tint = random() < 0.15 ? [8, 4, -4] : [0, 0, 1];
        for (const dx of [0, -size]) {
          const x0 = (x % size) + dx + 1 + random() * 2,
            y0 = y + 1 + random() * 2,
            ww = w - 3 - random() * 3,
            hh = h - 3 - random() * 2;
          c.fillStyle = `rgb(${g + tint[0]},${g + tint[1]},${g + tint[2]})`;
          c.beginPath();
          c.moveTo(x0 + random() * 4, y0);
          c.lineTo(x0 + ww, y0 + random() * 3);
          c.lineTo(x0 + ww - random() * 4, y0 + hh);
          c.lineTo(x0, y0 + hh - random() * 3);
          c.closePath();
          c.fill();
          b.fillStyle = `rgb(${150 + random() * 60},${150},${150})`;
          b.fill();
          // Split-face streaks along the bedding.
          for (let i = 0; i < ww / 6; i++) {
            c.fillStyle =
              random() < 0.5 ? 'rgba(255,255,250,0.07)' : 'rgba(0,0,0,0.12)';
            c.fillRect(
              x0 + random() * ww,
              y0 + random() * hh,
              3 + random() * 14,
              1 + random() * 2,
            );
          }
        }
        x += w;
      }
      y += h;
    }
    const make = (canvas: HTMLCanvasElement, srgb: boolean) => {
      const t = new T.CanvasTexture(canvas);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    m.map = make(colour, true);
    m.bumpMap = make(bump, false);
    m.bumpScale = 0.9;
    m.userData.masonryMetres = tile;
  }
  return m;
}
