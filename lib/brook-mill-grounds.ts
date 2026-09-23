import * as T from 'three';
type P = [number, number];
const plantingRuns = [
  { a: [17, -42], b: [30, -55.5], w: 1.2, h: 1.45 },
  { a: [30, -55.5], b: [40, -55.5], w: 1.2, h: 1.15 },
  { a: [23, -26], b: [61, -23], w: 1, h: 0.8 },
  { a: [62, -28], b: [63, -33], w: 1.25, h: 1 },
  { a: [63, -37], b: [64, -42], w: 1.25, h: 1 },
  { a: [34, -36], b: [34, -32], w: 2, h: 0.9 },
  { a: [30, -46], b: [31, -44], w: 2, h: 0.8 },
];
// Approximate overhead trace, tied to OSM access ways 762841712–715.
// These are landscape edges, not surveyed ownership boundaries.
export const brookParking: P[] = [
  [15, -43],
  [29, -57],
  [41, -57],
  [42, -62],
  [47, -62],
  [47, -56],
  [63, -54],
  [63, -24],
  [22, -27],
  [17, -32],
];
// One footprint test keeps parking paint out of the planted islands and perimeter beds.
function inPlanting(x: number, z: number) {
  return plantingRuns.some((r) => {
    const dx = r.b[0] - r.a[0],
      dz = r.b[1] - r.a[1],
      length2 = dx * dx + dz * dz;
    const t = Math.max(
      0,
      Math.min(1, ((x - r.a[0]) * dx + (z - r.a[1]) * dz) / length2),
    );
    return (
      Math.hypot(x - r.a[0] - t * dx, z - r.a[1] - t * dz) < r.w / 2 + 0.18
    );
  });
}
export function addBrookParking(
  batch: (g: T.BufferGeometry, m: T.Material) => void,
  box: (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
    rot?: number,
  ) => void,
  height: (x: number, z: number) => number,
  asphalt: T.Material,
  paint: T.Material,
  kerb: T.Material,
) {
  const shape = new T.Shape(brookParking.map(([x, z]) => new T.Vector2(x, -z))),
    source = new T.ShapeGeometry(shape).toNonIndexed(),
    pos = source.getAttribute('position'),
    verts: number[] = [],
    uv: number[] = [];
  const tri = (a: P, b: P, c: P, level = 0) => {
    if (
      level < 6 &&
      Math.max(
        Math.hypot(a[0] - b[0], a[1] - b[1]),
        Math.hypot(a[0] - c[0], a[1] - c[1]),
        Math.hypot(c[0] - b[0], c[1] - b[1]),
      ) > 1.5
    ) {
      const ab: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
        bc: P = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2],
        ca: P = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
      tri(a, ab, ca, level + 1);
      tri(ab, b, bc, level + 1);
      tri(ca, bc, c, level + 1);
      tri(ab, bc, ca, level + 1);
    } else
      for (const [x, z] of [a, b, c]) {
        verts.push(x, height(x, z) + 0.02, z);
        uv.push(x / 8, z / 8);
      }
  };
  for (let i = 0; i < pos.count; i += 3)
    tri(
      [pos.getX(i), -pos.getY(i)],
      [pos.getX(i + 1), -pos.getY(i + 1)],
      [pos.getX(i + 2), -pos.getY(i + 2)],
    );
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  batch(g, asphalt);
  source.dispose();
  // Give the existing overhead-interpreted planting runs actual beds, rather than asphalt beneath leaves.
  const soil = new T.MeshStandardMaterial({ color: '#514b3c', roughness: 1 });
  for (const r of plantingRuns) {
    const dx = r.b[0] - r.a[0],
      dz = r.b[1] - r.a[1],
      len = Math.hypot(dx, dz),
      nx = dz / len,
      nz = -dx / len,
      rot = Math.atan2(dx, dz),
      n = Math.ceil(len / 0.4);
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n,
        x = r.a[0] + dx * t,
        z = r.a[1] + dz * t;
      box(x, height(x, z) + 0.065, z, r.w, 0.07, len / n + 0.015, soil, rot);
      for (const side of [-1, 1]) {
        const xx = x + side * nx * (r.w / 2 + 0.06),
          zz = z + side * nz * (r.w / 2 + 0.06);
        box(
          xx,
          height(xx, zz) + 0.1,
          zz,
          0.12,
          0.16,
          len / n + 0.015,
          kerb,
          rot,
        );
      }
    }
  }
  // Rows follow the overhead arrangement; exact bay totals await close photographs.
  for (const row of [
    { x: 30, z: -52, n: 4, yaw: -0.085 },
    { x: 48, z: -51, n: 5, yaw: -0.085 },
    { x: 46, z: -44, n: 6, yaw: -Math.PI / 2 - 0.085 },
    { x: 37, z: -44, n: 5, yaw: -Math.PI / 2 - 0.085 },
    { x: 60, z: -42, n: 5, yaw: -Math.PI / 2 - 0.085 },
  ]) {
    for (let k = 0; k <= row.n; k++) {
      const x = row.x + Math.cos(row.yaw) * k * 2.45,
        z = row.z - Math.sin(row.yaw) * k * 2.45;
      for (let d = -2.25; d < 2.3; d += 0.15) {
        const xx = x + Math.sin(row.yaw) * d,
          zz = z + Math.cos(row.yaw) * d;
        if (!inPlanting(xx, zz))
          box(
            xx,
            height(xx, zz) + 0.045,
            zz,
            0.075,
            0.025,
            0.16,
            paint,
            row.yaw,
          );
      }
    }
  }
  for (let i = 0; i < brookParking.length; i++) {
    if (i === 3) continue;
    const a = brookParking[i],
      b = brookParking[(i + 1) % brookParking.length],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]),
      n = Math.ceil(len);
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n,
        x = a[0] + (b[0] - a[0]) * t,
        z = a[1] + (b[1] - a[1]) * t;
      box(
        x,
        height(x, z) + 0.05,
        z,
        0.16,
        0.15,
        len / n + 0.02,
        kerb,
        Math.atan2(b[0] - a[0], b[1] - a[1]),
      );
    }
  }
}
export function addBrookHedges(
  scene: T.Scene,
  leaf: T.Material,
  height: (x: number, z: number) => number,
) {
  const runs = plantingRuns;
  const clusters: { x: number; z: number; h: number; w: number }[] = [];
  for (const r of runs) {
    const n = Math.ceil(Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]) * 3);
    for (let j = 0; j < n; j++) {
      const t = j / n;
      clusters.push({
        x: r.a[0] + (r.b[0] - r.a[0]) * t,
        z: r.a[1] + (r.b[1] - r.a[1]) * t,
        h: r.h,
        w: r.w,
      });
    }
  }
  const mesh = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      leaf,
      clusters.length * 36,
    ),
    o = new T.Object3D();
  let seed = 930;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  clusters.forEach((c, i) => {
    for (let j = 0; j < 36; j++) {
      o.position.set(
        c.x + (rand() - 0.5) * c.w,
        height(c.x, c.z) + 0.15 + rand() * c.h,
        c.z + (rand() - 0.5) * c.w,
      );
      o.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      o.scale.setScalar(0.22 + rand() * 0.18);
      o.updateMatrix();
      mesh.setMatrixAt(i * 36 + j, o.matrix);
    }
  });
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  const stems = new T.InstancedMesh(
    new T.CylinderGeometry(0.008, 0.025, 1, 5),
    new T.MeshStandardMaterial({ color: '#655749', roughness: 1 }),
    clusters.length,
  );
  clusters.forEach((c, i) => {
    o.position.set(c.x, height(c.x, c.z) + c.h * 0.4, c.z);
    o.rotation.set(0.12 * Math.sin(i), 0, 0.15 * Math.cos(i));
    o.scale.set(1, c.h * 0.8, 1);
    o.updateMatrix();
    stems.setMatrixAt(i, o.matrix);
  });
  stems.castShadow = true;
  scene.add(stems);
}
