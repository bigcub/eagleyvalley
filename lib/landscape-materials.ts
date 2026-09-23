import * as T from 'three';

function surface(
  size: number,
  paint: (c: CanvasRenderingContext2D, random: () => number) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  let seed = 73021;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  paint(canvas.getContext('2d')!, random);
  const map = new T.CanvasTexture(canvas);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}
export function barkTexture() {
  return surface(256, (c, r) => {
    c.fillStyle = '#766d5d';
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) {
      const x = r() * 256,
        y = r() * 256;
      c.strokeStyle = r() > 0.5 ? '#423f3580' : '#b9ae8d65';
      c.lineWidth = 0.5 + r() * 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (r() - 0.5) * 5, y + 8 + r() * 65);
      c.stroke();
    }
  });
}
export function grassTexture() {
  return surface(512, (c, r) => {
    c.fillStyle = '#c2c6af';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16000; i++) {
      const x = r() * 512,
        y = r() * 512;
      c.strokeStyle = r() > 0.55 ? '#747e5930' : '#e3e4c53c';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (r() - 0.5) * 3, y - 1 - r() * 4);
      c.stroke();
    }
  });
}

// Plain retaining concrete with damp staining, distinct from coursed mill masonry.
export function retainingTexture() {
  return surface(512, (c, r) => {
    c.fillStyle = '#a2a393';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 180; i++) {
      const x = r() * 512,
        y = r() * 512;
      const g = c.createRadialGradient(x, y, 0, x, y, 18 + r() * 65);
      g.addColorStop(0, i % 3 === 0 ? '#50603920' : '#454b4118');
      g.addColorStop(1, '#59624700');
      c.fillStyle = g;
      c.fillRect(x - 90, y - 90, 180, 180);
    }
    for (let i = 0; i < 14000; i++) {
      c.fillStyle = r() > 0.5 ? '#e0ddc825' : '#30392c30';
      c.fillRect(r() * 512, r() * 512, 0.5 + r() * 1.5, 0.5 + r() * 1.5);
    }
  });
}
