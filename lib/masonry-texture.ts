import * as T from 'three';
export function masonryTexture(rubble = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d')!;
  let seed = 121;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.fillStyle = rubble ? '#484b3e' : '#8e897b';
  ctx.fillRect(0, 0, 1024, 1024);
  let row = 0;
  for (let y = 0; y < 1024; y += rubble ? 42 : 64) {
    let x = row++ % 2 ? -95 : -10;
    while (x < 1024) {
      const w = (rubble ? 48 : 95) + Math.floor(rnd() * (rubble ? 95 : 110)),
        v = rnd() * 27;
      ctx.fillStyle = `rgb(${(rubble ? 94 : 168) + v},${(rubble ? 92 : 159) + v},${(rubble ? 82 : 137) + v})`;
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + w - 3, y + 2 + rnd() * 3);
      ctx.lineTo(x + w - 2, y + (rubble ? 37 : 59));
      ctx.lineTo(x + 2, y + (rubble ? 39 : 61));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e3d9b866';
      ctx.lineWidth = 2;
      ctx.stroke();
      x += w;
    }
  }
  if (rubble) {
    // Uneven rubble courses, chipped corners and dark joints rather than ashlar blocks.
    ctx.fillStyle = '#46483d';
    ctx.fillRect(0, 0, 1024, 1024);
    let y = 0;
    while (y < 1024) {
      const h = 24 + Math.floor(rnd() * 35);
      let x = -Math.floor(rnd() * 100);
      while (x < 1024) {
        const w = 38 + Math.floor(rnd() * 105),
          v = rnd() * 34;
        ctx.fillStyle = `rgb(${91 + v},${89 + v},${78 + v})`;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 4);
        ctx.lineTo(x + w * 0.45, y + 2 + rnd() * 4);
        ctx.lineTo(x + w - 6, y + 3);
        ctx.lineTo(x + w - 2, y + h * 0.55);
        ctx.lineTo(x + w - 7, y + h - 4);
        ctx.lineTo(x + 8, y + h - 2 - rnd() * 3);
        ctx.lineTo(x + 2, y + h * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b6b09845';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        x += w;
      }
      y += h;
    }
  }
  const im = ctx.getImageData(0, 0, 1024, 1024);
  for (let i = 0; i < im.data.length; i += 4) {
    const n = (rnd() - 0.5) * (rubble ? 65 : 31);
    for (let k = 0; k < 3; k++) im.data[i + k] += n;
  }
  ctx.putImageData(im, 0, 0);
  for (let i = 0; i < 18000; i++) {
    ctx.strokeStyle = rnd() > 0.5 ? '#ffffff18' : '#302d241b';
    ctx.beginPath();
    const x = rnd() * 1024,
      y = rnd() * 1024;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2 + rnd() * 6, y + rnd() * 3);
    ctx.stroke();
  }
  const map = new T.CanvasTexture(c);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}
