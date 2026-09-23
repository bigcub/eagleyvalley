import * as T from 'three';
// Procedural surface study from the user's wet, weathered passage photographs.
// No photograph is embedded. Reuse these seven materials across batched setts.
export function settMaterials() {
  const palette = [
    '#766956',
    '#817360',
    '#6b6b61',
    '#8b7b68',
    '#706b5c',
    '#827e70',
    '#686454',
  ];
  return palette.map((color, index) => {
    let seed = 817 + index * 193;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 5200; i++) {
      ctx.fillStyle = random() > 0.5 ? '#e5decd20' : '#26261f26';
      const size = random() * 2 + 0.3;
      ctx.fillRect(random() * 128, random() * 128, size, size);
    }
    for (let i = 0; i < 24; i++) {
      ctx.strokeStyle = '#393c2a28';
      ctx.lineWidth = 0.5 + random();
      const x = random() * 128,
        y = random() * 128;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + random() * 14 - 7, y + random() * 9);
      ctx.stroke();
    }
    const edge = ctx.createRadialGradient(64, 64, 32, 64, 64, 86);
    edge.addColorStop(0, '#34402b00');
    edge.addColorStop(1, '#34402b66');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, 128, 128);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    return new T.MeshStandardMaterial({
      map,
      bumpMap: map,
      bumpScale: 0.018,
      color: '#ddd8cc',
      roughness: 0.82,
    });
  });
}
