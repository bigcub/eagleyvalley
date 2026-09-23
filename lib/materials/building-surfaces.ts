import * as T from 'three';
// World-space masonry keeps courses consistent across separate wall pieces.
export function masonryUV(g: T.BufferGeometry, metres: number) {
  const p = g.getAttribute('position'),
    n = g.getAttribute('normal');
  if (!n) return;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)),
      ny = Math.abs(n.getY(i)),
      nz = Math.abs(n.getZ(i));
    uv[i * 2] = (nx > nz ? p.getZ(i) : p.getX(i)) / metres;
    uv[i * 2 + 1] = (ny > 0.7 ? p.getZ(i) : p.getY(i)) / metres;
  }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2));
}
export function slateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#343b3f';
  ctx.fillRect(0, 0, 512, 512);
  let seed = 1215;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let row = 0; row < 16; row++)
    for (let col = -1; col < 9; col++) {
      const x = col * 64 + (row % 2) * 32,
        y = row * 32,
        v = 64 + random() * 24;
      ctx.fillStyle = `rgb(${v},${v + 7},${v + 10})`;
      ctx.fillRect(x + 1, y + 1, 62, 29);
      ctx.fillStyle = '#bec6ca35';
      ctx.fillRect(x + 1, y + 28, 62, 2);
      for (let j = 0; j < 12; j++) {
        ctx.fillStyle = random() > 0.5 ? '#ffffff0c' : '#00000015';
        ctx.fillRect(
          x + random() * 62,
          y + random() * 28,
          1 + random() * 10,
          0.7,
        );
      }
    }
  const map = new T.CanvasTexture(canvas);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

export function slateMaterial() {
  const map = slateTexture();
  const material = new T.MeshStandardMaterial({
    color: '#d4d9d8',
    map,
    bumpMap: map,
    bumpScale: 0.025,
    roughness: 0.88,
    side: T.DoubleSide,
  });
  material.userData.pitchedRoof = true;
  return material;
}
// Use real lengths rather than the default full-image UV on each roof piece.
export function roofUV(g: T.BufferGeometry) {
  const p = g.getAttribute('position'),
    uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / 2;
    uv[i * 2 + 1] = p.getZ(i) / 2;
  }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2));
}
