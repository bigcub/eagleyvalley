import * as T from 'three';
import type { Kit } from '../core/kit';

/** M25a, walking video ssAMAbSna_c from 10:28. Rounded, weathered setts,
 * not photographed pixels. Sizes/tones interpreted; wet lighting is not a
 * measured stone colour. Bump-map relief leaves movement surfaces flat. */
export function schoolStreetSetts(kit: Kit) {
  const material = kit.mat('schoolStreetSetts', '#d5d3c8', 0.93);
  if (material.map) return material;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  let seed = 252810;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.fillStyle = '#43483e';
  ctx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 16; row++) {
    for (let col = -1; col < 9; col++) {
      const x = col * 64 + (row % 2) * 32;
      const y = row * 32;
      const shade = Math.floor(random() * 31) - 15;
      ctx.fillStyle = `rgb(${114 + shade},${111 + shade},${99 + shade})`;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, 60, 28, 3 + random() * 3);
      ctx.fill();
      ctx.strokeStyle = '#bbb9a31f';
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let i = 0; i < 65; i++) {
        ctx.fillStyle = random() > 0.5 ? '#e6e1ca20' : '#22251e28';
        ctx.fillRect(
          x + 5 + random() * 54,
          y + 5 + random() * 22,
          1 + random() * 2,
          1,
        );
      }
      if (random() < 0.28) {
        ctx.strokeStyle = '#515a3b70';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 30);
        ctx.lineTo(x + 24 + random() * 35, y + 30);
        ctx.stroke();
      }
    }
  }
  const map = new T.CanvasTexture(canvas);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  // Road ribbons cover their width with U=0..1 and length with V=metres/8.
  // On the fitted 5.2m width, setts fit about .33m by .25m.
  map.repeat.set(2, 2);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  material.map = map;
  material.bumpMap = map;
  material.bumpScale = 0.022;
  return material;
}
