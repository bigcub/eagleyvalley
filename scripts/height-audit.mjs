// Compare each building's rendered roof height with the EA 2022 DSM.
// Needs work/reference rasters and a running build (GAME_URL, default :3000).
//   node scripts/height-audit.mjs [maxRouteDistance=90]
// Prints buildings sorted by the size of the difference. Heights are metres
// above the lowest DTM point round the footprint. The DSM includes trees, so
// overhanging canopy can inflate its value; both use interior sample points.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { dsm, dtm, at } from './ea-raster.mjs';

const maxDistance = Number(process.argv[2] ?? 90);
const data = JSON.parse(fs.readFileSync('public/eagley-map.json', 'utf8'));
const route = [
  '155008522',
  '120133751',
  '681379569',
  '681379568',
  '73858744',
  '727434505',
  '655432303',
  '61959587',
];
const segs = data.roads
  .filter((r) => route.includes(r.id))
  .flatMap((r) => r.points.slice(1).map((b, i) => [r.points[i], b]));
const routeDistance = (x, z) =>
  Math.min(
    ...segs.map(([a, b]) => {
      const dx = b[0] - a[0],
        dz = b[1] - a[1],
        t = Math.max(
          0,
          Math.min(
            1,
            ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz),
          ),
        );
      return Math.hypot(a[0] + t * dx - x, a[1] + t * dz - z);
    }),
  );
const inPoly = (x, z, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i],
      [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi)
      c = !c;
  }
  return c;
};
const median = (v) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? s[s.length >> 1] : NaN;
};

// Interior sample points: a grid inside the footprint, at least 1m from edges.
const buildings = [];
for (const f of data.buildings) {
  const p = f.points.slice(0, -1);
  if (p.length < 3) continue;
  const cx = p.reduce((s, v) => s + v[0], 0) / p.length,
    cz = p.reduce((s, v) => s + v[1], 0) / p.length;
  const d = routeDistance(cx, cz);
  if (d > maxDistance) continue;
  const xs = p.map((q) => q[0]),
    zs = p.map((q) => q[1]);
  const pts = [];
  const step = Math.max(
    1.5,
    Math.min(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...zs) - Math.min(...zs),
    ) / 5,
  );
  for (let x = Math.min(...xs) + 1; x < Math.max(...xs) - 1; x += step)
    for (let z = Math.min(...zs) + 1; z < Math.max(...zs) - 1; z += step)
      if (
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].every(([a, b]) => inPoly(x + a, z + b, p))
      )
        pts.push([x, z]);
  if (!pts.length) continue;
  let ground = Infinity;
  for (const [x, z] of p) {
    const [e, n] = at(x, z);
    ground = Math.min(ground, dtm(e, n) - 100);
  }
  const roof = median(
    pts.map(([x, z]) => {
      const [e, n] = at(x, z);
      return dsm(e, n) - 100;
    }),
  );
  buildings.push({
    id: f.id,
    name: f.name || '',
    d: Math.round(d),
    cx,
    cz,
    pts: pts.slice(0, 9),
    ground,
    dsm: roof - ground,
  });
}

const browser = await chromium.launch({
  headless: true,
  args:
    process.platform === 'darwin'
      ? ['--use-gl=angle', '--use-angle=metal']
      : [],
});
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000');
await page.waitForFunction(() => window.eagley_debug, null, {
  timeout: 120000,
});
for (const b of buildings) {
  b.game = await page.evaluate((pts) => {
    const ys = [];
    for (const [x, z] of pts) {
      window.eagley_debug.view(x, z, 90, x + 0.001, z + 0.001, 0);
      const hit = window.eagley_debug.pick(0, 0);
      if (hit) ys.push(hit.point[1]);
    }
    ys.sort((a, b) => a - b);
    return ys.length ? ys[ys.length >> 1] : null;
  }, b.pts);
}
await browser.close();
const rows = buildings
  .filter((b) => b.game !== null)
  .map((b) => ({
    ...b,
    gameH: b.game - b.ground,
    diff: b.game - b.ground - b.dsm,
  }))
  .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
console.log('id\tname\troute_m\tx\tz\tdsm_h\tgame_h\tdiff');
for (const r of rows)
  console.log(
    [
      r.id,
      r.name,
      r.d,
      Math.round(r.cx),
      Math.round(r.cz),
      r.dsm.toFixed(1),
      r.gameH.toFixed(1),
      r.diff.toFixed(1),
    ].join('\t'),
  );
