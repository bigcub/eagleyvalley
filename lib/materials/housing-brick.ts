import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';

/** Procedural material, fitted to photographed housing; no reference pixels. */
export function housingBrick(kit: Kit, name: string, tone: 'red' | 'buff') {
  const m = kit.mat(name, '#ffffff');
  if (m.map) return m;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = tone === 'red' ? '#a69b8b' : '#bbb09a';
  ctx.fillRect(0, 0, 512, 512);
  let seed = 812;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const rgb = tone === 'red' ? [147, 112, 86] : [181, 157, 115];
  for (let row = 0; row < 24; row++)
    for (let col = -1; col < 9; col++) {
      const shade = Math.floor(random() * 25) - 12;
      ctx.fillStyle = `rgb(${rgb[0] + shade},${rgb[1] + shade},${rgb[2] + shade})`;
      ctx.fillRect(
        col * 64 + (row % 2) * 32 + 2,
        (row * 512) / 24 + 1.5,
        60,
        512 / 24 - 3,
      );
    }
  for (let i = 0; i < 18000; i++) {
    ctx.fillStyle = random() > 0.5 ? '#ffffff0c' : '#0000000c';
    ctx.fillRect(random() * 512, random() * 512, 1, 1);
  }
  m.map = new T.CanvasTexture(c);
  m.map.wrapS = m.map.wrapT = T.RepeatWrapping;
  m.map.colorSpace = T.SRGBColorSpace;
  m.map.anisotropy = 8;
  return m;
}

/** Horizontal courses use facade-local distance, including rotated end walls. */
export function housingUV(g: T.BufferGeometry, origin: P, along: P) {
  const p = g.getAttribute('position'),
    n = g.getAttribute('normal');
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) - origin[0],
      z = p.getZ(i) - origin[1];
    const end = Math.abs(n.getX(i) * along[0] + n.getZ(i) * along[1]) > 0.7;
    uv[i * 2] =
      (end ? -x * along[1] + z * along[0] : x * along[0] + z * along[1]) / 1.8;
    uv[i * 2 + 1] = p.getY(i) / 1.8;
  }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2));
}
