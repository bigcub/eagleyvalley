import { slateMaterial, roofUV } from '../materials/building-surfaces';
import * as T from 'three';
import type { Kit } from '../core/kit';
type P = [number, number];
// Public June 2024 Eagley Way panorama: rendered gable, cross windows and lower porch.
// Footprint is mapped; heights, roof pitch and concealed elevations remain estimates.
export function addGatehouse(
  kit: Kit,
  {
    base,
    foundationBottom,
    points,
  }: { base: number; foundationBottom: number; points: P[] },
) {
  const { box, batch } = kit;
  const { glass, dark, stone } = kit.m;
  const ux = 0.662,
    uz = -0.749,
    rot = Math.atan2(-uz, ux),
    world = (u: number, v: number): P => [
      -288.91 + u * ux + v * uz,
      148.86 + u * uz - v * ux,
    ];
  const cream = new T.MeshStandardMaterial({
    color: '#d7d5c7',
    roughness: 0.97,
    side: T.DoubleSide,
  });
  const frame = new T.MeshStandardMaterial({
    color: '#deded4',
    roughness: 0.8,
  });
  const slate = slateMaterial();
  const wood = new T.MeshStandardMaterial({
    color: '#302426',
    roughness: 0.85,
  });
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = world(u, v);
    box(x, base + y, z, w, h, d, m, rot);
  };
  function mesh(coords: number[], indices: number[], m: T.Material) {
    const g = new T.BufferGeometry(),
      p: number[] = [];
    for (let i = 0; i < coords.length; i += 3) {
      const [x, z] = world(coords[i], coords[i + 2]);
      p.push(x, base + coords[i + 1], z);
    }
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setAttribute(
      'uv',
      new T.Float32BufferAttribute(
        coords.flatMap((_, i) =>
          i % 3 === 0 ? [coords[i] / 2, coords[i + 1] / 2] : [],
        ),
        2,
      ),
    );
    g.setIndex(indices);
    g.computeVertexNormals();
    if (m === slate) roofUV(g);
    batch(g, m);
  }
  const footprint = new T.Shape(points.map(([x, z]) => new T.Vector2(x, -z))),
    body = new T.ExtrudeGeometry(footprint, {
      depth: base - foundationBottom + 3.2,
      bevelEnabled: false,
    });
  body.rotateX(-Math.PI / 2);
  body.translate(0, foundationBottom, 0);
  batch(body, cream);
  // Taller entrance gable and a lower slate crosswing.
  B(2.75, 4.6, 3.7, 5.5, 2.8, 7.4, cream);
  mesh(
    [0, 6, 0, 5.5, 6, 0, 2.75, 8.3, 0, 0, 6, 7.4, 5.5, 6, 7.4, 2.75, 8.3, 7.4],
    [0, 1, 2, 3, 5, 4],
    cream,
  );
  mesh(
    [
      -0.18, 6, -0.18, 5.68, 6, -0.18, 2.75, 8.3, -0.18, -0.18, 6, 7.6, 5.68, 6,
      7.6, 2.75, 8.3, 7.6,
    ],
    [0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2],
    slate,
  );
  mesh(
    [
      5.4, 3.2, -0.18, 11.7, 3.2, -0.18, 5.4, 5.4, 2.8, 11.7, 5.4, 2.8, 5.4,
      3.2, 5.6, 11.7, 3.2, 5.6,
    ],
    [0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4],
    slate,
  );
  mesh([11.5, 3.2, 0, 11.5, 5.4, 2.8, 11.5, 3.2, 5.6], [0, 1, 2], cream);
  function window(u: number, y: number, w: number, h: number, columns: number) {
    B(u, y, -0.09, w + 0.17, h + 0.13, 0.16, dark);
    B(u, y, -0.19, w, h, 0.08, glass);
    for (let i = 0; i <= columns; i++)
      B(u - w / 2 + (w * i) / columns, y, -0.26, 0.08, h, 0.07, frame);
    for (const yy of [y - h / 2, y, y + h / 2])
      B(u, yy, -0.26, w, 0.08, 0.07, frame);
    B(u, y + h / 2 + 0.15, -0.12, w + 0.45, 0.22, 0.22, dark);
    B(u, y - h / 2 - 0.13, -0.17, w + 0.4, 0.16, 0.32, dark);
  }
  // EAG-001, June 2024, heading310: small wall plate left of lower window.
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 768;
  signCanvas.height = 160;
  const ctx = signCanvas.getContext('2d')!;
  ctx.fillStyle = '#e7e5dc';
  ctx.fillRect(0, 0, 768, 160);
  ctx.strokeStyle = '#292b29';
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, 758, 150);
  ctx.fillStyle = '#222421';
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EAGLEY WAY', 384, 84, 720);
  for (const x of [18, 750]) {
    ctx.beginPath();
    ctx.arc(x, 80, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const signTexture = new T.CanvasTexture(signCanvas);
  signTexture.colorSpace = T.SRGBColorSpace;
  const signMaterial = new T.MeshStandardMaterial({
    map: signTexture,
    roughness: 0.9,
  });
  const plate = new T.PlaneGeometry(0.8, 0.167);
  plate.rotateY(rot);
  const signPosition = world(0.55, -0.105);
  plate.translate(signPosition[0], base + 2.5, signPosition[1]);
  batch(plate, signMaterial);
  window(2.75, 1.7, 2.7, 2.25, 3);
  window(2.75, 5.2, 2.7, 2.3, 3);
  window(6.75, 1.65, 0.75, 1.95, 1);
  B(8.65, 1.2, -0.12, 1.25, 2.4, 0.17, dark);
  B(8.65, 1.17, -0.23, 1.05, 2.3, 0.1, wood);
  for (const y of [0.6, 1.55, 2.05])
    for (const u of [8.38, 8.92])
      B(u, y, -0.3, 0.43, y === 2.05 ? 0.3 : 0.65, 0.07, wood);
  B(
    8.65,
    1.08,
    -0.36,
    0.4,
    0.055,
    0.04,
    new T.MeshStandardMaterial({
      color: '#96846a',
      metalness: 0.55,
      roughness: 0.4,
    }),
  );
  B(8.2, 2.8, -0.1, 5.4, 0.28, 0.2, dark);
  B(2.75, 0.15, -0.1, 5.5, 0.23, 0.17, dark);
  for (const u of [0, 5.55, 11.4]) B(u, 1.6, -0.13, 0.075, 3.2, 0.075, dark);
  B(5.5, 4.5, -0.13, 0.075, 2.6, 0.075, dark);
  B(8.4, 3.18, -0.23, 6, 0.1, 0.12, dark);
  B(10.35, 5.3, 3.3, 0.55, 1.15, 0.55, stone);
  // Low frontage wall and narrow pedestrian gate, clear of the pavement and doorway.
  for (let u = 0.1; u < 11.4; u += 0.5) {
    if (Math.abs(u - 8.65) < 0.75) continue;
    B(u, 0.3, -0.8, 0.5, 0.6, 0.27, stone);
    B(u, 0.76, -0.8, 0.52, 0.055, 0.055, dark);
  }
  for (const u of [0.1, 5.6, 7.8, 9.5, 11.3])
    B(u, 0.55, -0.8, 0.33, 1.1, 0.33, stone);
  for (let u = 8; u <= 9.3; u += 0.16)
    B(u, 0.57, -0.81, 0.025, 1.03, 0.035, dark);
  for (const y of [0.22, 0.83]) B(8.65, y, -0.81, 1.3, 0.035, 0.045, dark);
}
