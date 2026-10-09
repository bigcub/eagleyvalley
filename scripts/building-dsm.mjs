// Per-edge DSM heights for one mapped building, above the lowest DTM point
// round its footprint. Needs work/reference rasters.
//   node scripts/building-dsm.mjs <osm id>
// For each edge: median DSM 1.5m inside (eaves or parapet) and the DTM just
// outside; then the footprint's highest DSM point (ridge, tower or chimney).
import fs from 'node:fs';
import { dsm, dtm, at } from './ea-raster.mjs';

const id = process.argv[2];
const data = JSON.parse(fs.readFileSync('public/eagley-map.json', 'utf8'));
const f = data.buildings.find((b) => b.id === id);
if (!f) throw new Error(`no building ${id}`);
const p = f.points.slice(0, -1);
const h = (x, z, which) => {
  const [e, n] = at(x, z);
  return (which === 'dtm' ? dtm(e, n) : dsm(e, n)) - 100;
};
const ground = Math.min(...p.map(([x, z]) => h(x, z, 'dtm')));
const cx = p.reduce((s, v) => s + v[0], 0) / p.length,
  cz = p.reduce((s, v) => s + v[1], 0) / p.length;
console.log(`${id} ${f.name || ''} ground ${ground.toFixed(2)} (AOD-100)`);
for (let i = 0; i < p.length; i++) {
  const a = p[i],
    b = p[(i + 1) % p.length],
    L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (L < 3) continue;
  const inside = [],
    outside = [];
  for (let t = 0.15; t < 0.9; t += 0.1) {
    const x = a[0] + (b[0] - a[0]) * t,
      z = a[1] + (b[1] - a[1]) * t,
      l = Math.hypot(cx - x, cz - z);
    inside.push(h(x + ((cx - x) * 1.5) / l, z + ((cz - z) * 1.5) / l) - ground);
    outside.push(
      h(x - ((cx - x) * 3) / l, z - ((cz - z) * 3) / l, 'dtm') - ground,
    );
  }
  inside.sort((u, v) => u - v);
  outside.sort((u, v) => u - v);
  console.log(
    `edge ${i} [${a.map(Math.round).join(',')}]->[${b.map(Math.round).join(',')}] len ${L.toFixed(1)} inside ${inside[inside.length >> 1].toFixed(1)} outsideGround ${outside[outside.length >> 1].toFixed(1)}`,
  );
}
const xs = p.map((q) => q[0]),
  zs = p.map((q) => q[1]);
let top = -Infinity,
  topAt = null;
for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.5)
  for (let z = Math.min(...zs); z <= Math.max(...zs); z += 0.5) {
    let c = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, zi] = p[i],
        [xj, zj] = p[j];
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi)
        c = !c;
    }
    if (!c) continue;
    const v = h(x, z) - ground;
    if (v > top) {
      top = v;
      topAt = [x, z];
    }
  }
console.log(
  `highest ${top.toFixed(1)} at ${topAt.map((v) => v.toFixed(1)).join(',')}`,
);
