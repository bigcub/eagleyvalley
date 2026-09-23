import * as T from 'three';
import type { Kit } from '../core/kit';
type P = [number, number];
// Shared polygons for paving and walking. Estimated from mapped road/footbridge anchors,
// June2024 street view and the reverse Aug2022 view; no survey dimensions claimed.
export const junctionPavements: P[][] = [
  [
    [146.7, -26.7],
    [146.4, -30.8],
    [145.3, -34.6],
    [142.8, -38],
    [144, -38.8],
    [146.5, -35.1],
    [147.6, -31],
    [148, -26.7],
  ],
  [
    [146.6, -20.4],
    [145.2, -17.3],
    [145.1, -14.05],
    [146.7, -13.25],
    [147.6, -17.4],
    [148.2, -20.1],
  ],
  [
    [146.7, -26.7],
    [148, -26.7],
    [151.3, -24.6],
    [148.2, -20.1],
    [146.6, -20.4],
  ],
];
export function onJunctionPavement(x: number, z: number) {
  return junctionPavements.some((poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i],
        b = poly[j];
      if (
        a[1] > z !== b[1] > z &&
        x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]
      )
        inside = !inside;
    }
    return inside;
  });
}
// Blend the road immediately beside the pavement to its datum, avoiding a height
// discontinuity when walking across the polygon edge. No road centreline is moved.
export function junctionGroundWeight(x: number, z: number) {
  if (onJunctionPavement(x, z)) return 1;
  let distance = Infinity;
  for (const polygon of junctionPavements)
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        b = polygon[(i + 1) % polygon.length],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = T.MathUtils.clamp(
        ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz),
        0,
        1,
      );
      distance = Math.min(
        distance,
        Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t),
      );
    }
  return 1 - T.MathUtils.smoothstep(distance, 0, 1);
}
// June2024 DQl_iPlCOrF2ekkB6nUQbQ headings65/154. Positions interpreted against OSM.
export function addHoughJunction(
  kit: Kit,
  ground: (x: number, z: number) => number,
  pavementY: (x: number, z: number) => number,
) {
  const { box, batch } = kit;
  const { dark, stone, trim, kerb } = kit.m;
  // The junction carriageway continues the Hough Lane asphalt.
  const paving = kit.m.asphalt;
  const barriers: { a: P; b: P }[] = [];
  for (const outline of junctionPavements) {
    const shape = new T.Shape(outline.map(([x, z]) => new T.Vector2(x, -z))),
      g = new T.ShapeGeometry(shape);
    // Subdivide before sampling so interior heights follow the same ground as the player.
    const source = g.toNonIndexed(),
      pos = source.getAttribute('position'),
      vertices: number[] = [];
    function triangle(a: T.Vector2, b: T.Vector2, c: T.Vector2) {
      if (Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)) > 0.4) {
        const ab = a.clone().add(b).multiplyScalar(0.5),
          bc = b.clone().add(c).multiplyScalar(0.5),
          ca = c.clone().add(a).multiplyScalar(0.5);
        triangle(a, ab, ca);
        triangle(ab, b, bc);
        triangle(ca, bc, c);
        triangle(ab, bc, ca);
        return;
      }
      for (const v of [a, b, c])
        vertices.push(v.x, pavementY(v.x, -v.y) + 0.018, -v.y);
    }
    for (let i = 0; i < pos.count; i += 3)
      triangle(
        ...([0, 1, 2].map(
          (k) => new T.Vector2(pos.getX(i + k), pos.getY(i + k)),
        ) as [T.Vector2, T.Vector2, T.Vector2]),
      );
    const surface = new T.BufferGeometry();
    surface.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    surface.setAttribute(
      'uv',
      new T.Float32BufferAttribute(
        vertices.flatMap((_, i) =>
          i % 3 === 0 ? [vertices[i] / 3, vertices[i + 2] / 3] : [],
        ),
        2,
      ),
    );
    surface.computeVertexNormals();
    batch(surface, paving);
    g.dispose();
    source.dispose();
  }
  // Kerbs follow the same pavement outline and fall flush at the crossing ends.
  for (const edge of [
    junctionPavements[0].slice(0, 4),
    junctionPavements[1].slice(0, 3),
  ]) {
    for (let i = 1; i < edge.length; i++) {
      const a = edge[i - 1],
        b = edge[i],
        length = Math.hypot(b[0] - a[0], b[1] - a[1]),
        n = Math.ceil(length / 0.3);
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n,
          x = T.MathUtils.lerp(a[0], b[0], t),
          z = T.MathUtils.lerp(a[1], b[1], t);
        box(
          x,
          pavementY(x, z) - 0.035,
          z,
          0.14,
          0.1,
          length / n + 0.015,
          kerb ?? stone,
          Math.atan2(b[0] - a[0], b[1] - a[1]),
        );
      }
    }
  }
  // The dropped crossing uses asphalt and flush socket collars, not raised square plinths.

  // Three removable black bollards across the old lane, not the driving bend.
  for (const t of [-1.55, 0, 1.55]) {
    const x = 147.9 + t * 0.12,
      z = -23.1 + t * 0.993,
      y = ground(x, z);
    box(x, y + 0.012, z, 0.29, 0.024, 0.29, stone);
    box(x, y + 0.52, z, 0.13, 0.95, 0.13, dark);
    box(x, y + 1.02, z, 0.18, 0.045, 0.18, trim);
    barriers.push({ a: [x - 0.09, z], b: [x + 0.09, z] });
  }
  // Short stone posts beside the protected pavement.
  for (const [x, z] of [
    [147.55, -26.7],
    [148.2, -20.1],
  ]) {
    const y = ground(x, z);
    box(x, y + 0.4, z, 0.26, 0.8, 0.28, stone);
    barriers.push({ a: [x - 0.14, z], b: [x + 0.14, z] });
  }
  // Pedestrian railing follows the bend, with a gap at the old-lane entrance.
  const rail: P[] = [
    [147.55, -26.7],
    [147.6, -31],
    [146.5, -35.1],
    [144, -38.8],
  ];
  for (let j = 1; j < rail.length; j++) {
    const a = rail[j - 1],
      b = rail[j],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]),
      rot = Math.atan2(b[0] - a[0], b[1] - a[1]),
      n = Math.ceil(len / 0.16);
    for (let k = 0; k <= n; k++) {
      const t = k / n,
        x = T.MathUtils.lerp(a[0], b[0], t),
        z = T.MathUtils.lerp(a[1], b[1], t);
      box(x, pavementY(x, z) + 0.55, z, 0.018, 1.05, 0.018, dark);
    }
    for (const h of [0.2, 1.05]) {
      const g = new T.BoxGeometry(0.035, 0.035, len);
      const p = g.getAttribute('position');
      for (let k = 0; k < p.count; k++) {
        const t = (p.getZ(k) + len / 2) / len;
        p.setY(
          k,
          p.getY(k) + T.MathUtils.lerp(pavementY(...a), pavementY(...b), t) + h,
        );
      }
      g.rotateY(rot);
      g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
      batch(g, dark);
    }
    barriers.push({ a, b });
  }
  // Paired 30mph signs observed at the bridge mouth.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#a73d36';
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e4e2d7';
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#252b2a';
  ctx.font = 'bold 53px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('30', 64, 67);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  const face = new T.MeshStandardMaterial({
    map,
    roughness: 0.8,
    side: T.FrontSide,
  });
  for (const [x, z] of [
    [140.4, -18.9],
    [147.9, -16.1],
  ]) {
    const y = ground(x, z);
    box(x, y + 1.45, z, 0.065, 2.9, 0.065, trim);
    const g = new T.CircleGeometry(0.3, 32);
    g.rotateY(Math.PI + 0.45);
    g.translate(
      x - Math.sin(0.45) * 0.065,
      y + 2.55,
      z - Math.cos(0.45) * 0.065,
    );
    batch(g, face);
    const back = g.clone();
    const backMaterial = new T.MeshStandardMaterial({
      color: '#737a76',
      side: T.BackSide,
      roughness: 0.8,
    });
    batch(back, backMaterial);
  }
  return barriers;
}

// Separate mapped pedestrian bridge655432306. The old generic renderer incorrectly
// enclosed this narrow deck with the road bridge's stone walls.
export function addHoughFootbridge(
  kit: Kit,
  ground: (x: number, z: number) => number,
  points: P[],
) {
  const { box, batch } = kit;
  const { dark } = kit.m;
  const a = points[0],
    b = points[points.length - 1],
    dx = b[0] - a[0],
    dz = b[1] - a[1],
    len = Math.hypot(dx, dz),
    nx = -dz / len,
    nz = dx / len,
    n = Math.ceil(len / 1.6);
  const barriers: { a: P; b: P }[] = [];
  function beam(a: T.Vector3, b: T.Vector3, w: number, m: T.Material) {
    const delta = b.clone().sub(a),
      g = new T.BoxGeometry(w, delta.length(), w);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.normalize(),
      ),
    );
    const mid = a.clone().add(b).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    batch(g, m);
  }
  for (const side of [-1, 1]) {
    let prev: P | undefined;
    for (let k = 0; k <= n; k++) {
      const t = k / n,
        x = a[0] + dx * t + nx * 0.87 * side,
        z = a[1] + dz * t + nz * 0.87 * side,
        y = ground(x, z);
      box(x, y + 0.56, z, 0.055, 1.12, 0.055, dark);
      if (prev) {
        for (const h of [0.18, 0.54, 1.08])
          beam(
            new T.Vector3(prev[0], ground(...prev) + h, prev[1]),
            new T.Vector3(x, y + h, z),
            0.036,
            dark,
          );
        barriers.push({ a: prev, b: [x, z] });
      }
      prev = [x, z];
    }
  }
  return barriers;
}
