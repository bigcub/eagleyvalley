import * as T from 'three';
// Small mixed aggregate from the user's riverside reference; no photo asset.
export function gravelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#999789';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 96317;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const colours = [
    '#dddcd1',
    '#c3c1b6',
    '#888c84',
    '#75786f',
    '#b4b1a1',
    '#62665c',
  ];
  for (let i = 0; i < 10000; i++) {
    const x = random() * 256,
      y = random() * 256,
      r = 0.35 + random() * 1.25;
    ctx.fillStyle = colours[Math.floor(random() * colours.length)];
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      r,
      r * (0.5 + random() * 0.5),
      random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(3, 3);
  map.anisotropy = 4;
  return map;
}
