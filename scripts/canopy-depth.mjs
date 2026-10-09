// Continuous canopy depth beside Eagley Way, for EAGLEY_WAY_BANK_PLANTING.
// Needs work/reference rasters. Side 1 is uphill, -1 the valley side.
//   node scripts/canopy-depth.mjs [side=1] [x0=-180] [x1=20] [max=36] [start=4] [mode=run]
// mode run: continuous canopy in a 5m window (uphill table).
// mode cover: farthest 3m strip, 8m wide, with at least 60% of points over
// [threshold=3] metres.
import fs from 'node:fs';
import { dsm, dtm, at } from './ea-raster.mjs';
const data = JSON.parse(fs.readFileSync('public/eagley-map.json'));
const P = data.roads.find((r) => r.id === '155008522').points;
const chm = (x, z) => {
  const [e, n] = at(x, z);
  return dsm(e, n) - dtm(e, n);
};
const [side, x0, x1, max, start] = [1, -180, 20, 36, 4].map((v, i) =>
  process.argv[i + 2] === undefined ? v : Number(process.argv[i + 2]),
);
const mode = process.argv[7] ?? 'run';
const threshold = Number(process.argv[8] ?? 3);
const out = [];
for (let i = 1; i < P.length; i++) {
  const [a, b] = [P[i - 1], P[i]],
    L = Math.hypot(b[0] - a[0], b[1] - a[1]),
    n = [(-(b[1] - a[1]) / L) * side, ((b[0] - a[0]) / L) * side];
  for (let s = 0; s < L; s += 8) {
    const x = a[0] + ((b[0] - a[0]) * s) / L,
      z = a[1] + ((b[1] - a[1]) * s) / L;
    if (x < x0 || x > x1) continue;
    // Depth of continuous canopy (>4m in a 5m window) behind the road centre.
    let depth = start;
    if (mode === 'cover') {
      for (let d = start; d <= max; d += 3) {
        let hit = 0,
          all = 0;
        for (let dd = 0; dd < 3; dd++)
          for (let k = -4; k <= 4; k++) {
            all++;
            if (
              chm(
                x + n[0] * (d + dd) + n[1] * k,
                z + n[1] * (d + dd) - n[0] * k,
              ) > threshold
            )
              hit++;
          }
        // Farthest covered strip: clearings just behind the road don't end it.
        if (hit / all >= 0.6) depth = d + 3;
      }
    } else
      for (let d = start; d <= max; d += 1) {
        let m = 0;
        for (let k = -2; k <= 2; k++)
          m = Math.max(
            m,
            chm(x + n[0] * d + n[1] * k, z + n[1] * d - n[0] * k),
          );
        if (m < 4) break;
        depth = d;
      }
    out.push([Math.round(x), depth]);
  }
}
console.log(JSON.stringify(out));
