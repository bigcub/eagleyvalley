// Ride quality and frame cost along the full driving route.
//   node scripts/check-ride.mjs            report only
//   node scripts/check-ride.mjs --save x   also write outputs/ride-x.json
// Car height jerk (second difference of height per 1/60s step) and pitch
// change per step show rocking; step/render times show per-frame cost.
// Compare against a previous save before shipping road or terrain changes.
import { chromium } from 'playwright';
import fs from 'node:fs';

const save = process.argv.includes('--save')
  ? process.argv[process.argv.indexOf('--save') + 1]
  : undefined;
const browser = await chromium.launch({
  headless: true,
  args:
    process.platform === 'darwin'
      ? ['--use-gl=angle', '--use-angle=metal']
      : [],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const t0 = Date.now();
await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000');
await page.waitForFunction(() => window.eagley_debug, null, {
  timeout: 120000,
});
await page.waitForFunction(
  () => !document.querySelector('#start-btn').disabled,
);
const loadMs = Date.now() - t0;
await page.locator('#start-btn').click();
const data = JSON.parse(fs.readFileSync('public/eagley-map.json', 'utf8'));
const get = (id) => data.roads.find((r) => r.id === id).points;
// Blackburn Road down Eagley Way, over the Hough bridge and round Threadfold Way.
const route = [
  ...get('155008522').slice(1),
  ...get('120133751').slice(1),
  ...get('681379569').slice(1),
  ...get('681379568').slice(1),
  ...get('73858744').slice(1),
  ...get('727434505').slice(1),
  ...get('655432303').slice(1),
];
const r = await page.evaluate((route) => {
  const press = (code, down) =>
    window.dispatchEvent(
      new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
    );
  const at = (x, z) => window.eagley_debug.at(x, z).ground;
  const rows = [];
  let idx = 0;
  for (let f = 0; f < 6000 && idx < route.length; f++) {
    const p = JSON.parse(window.render_game_to_text()).player,
      t = route[idx];
    if (Math.hypot(t[0] - p.x, t[1] - p.z) < 3) {
      idx++;
      continue;
    }
    const want = Math.atan2(t[0] - p.x, t[1] - p.z),
      err = Math.atan2(Math.sin(want - p.yaw), Math.cos(want - p.yaw));
    press('ArrowLeft', err > 0.035);
    press('ArrowRight', err < -0.035);
    press('ArrowUp', p.speed < (Math.abs(err) > 0.3 ? 4 : 8));
    let s = performance.now();
    window.advanceTime(16.667, false);
    const step = performance.now() - s;
    s = performance.now();
    window.advanceTime(0, true);
    const render = performance.now() - s;
    // Same pitch the car model uses: ground 1.5m ahead and behind.
    const fx = Math.sin(p.yaw) * 1.5,
      fz = Math.cos(p.yaw) * 1.5;
    const pitch = Math.atan2(
      at(p.x + fx, p.z + fz) - at(p.x - fx, p.z - fz),
      3,
    );
    rows.push([p.x, p.z, p.y, pitch, step, render]);
  }
  return { rows, idx };
}, route);
await browser.close();

function ride(rows) {
  let jerk = 0,
    rough = 0,
    pitchStep = 0,
    worst = null;
  for (let i = 2; i < rows.length; i++) {
    const j = Math.abs(rows[i][2] - 2 * rows[i - 1][2] + rows[i - 2][2]);
    const dp = Math.abs(rows[i][3] - rows[i - 1][3]);
    rough += j;
    if (j > jerk) {
      jerk = j;
      worst = [+rows[i][0].toFixed(1), +rows[i][1].toFixed(1)];
    }
    pitchStep = Math.max(pitchStep, dp);
  }
  return {
    frames: rows.length,
    maxJerk: +jerk.toFixed(4),
    roughness: +rough.toFixed(3),
    maxPitchStepDeg: +((pitchStep * 180) / Math.PI).toFixed(2),
    worstAt: worst,
  };
}
const junction = r.rows.filter(
  ([x, z]) => x > 128 && x < 162 && z > -45 && z < 5,
);
const mean = (k) =>
  +(r.rows.reduce((s, row) => s + row[k], 0) / r.rows.length).toFixed(3);
const result = {
  loadMs,
  routeDone: `${r.idx}/${route.length}`,
  stepMs: mean(4),
  renderMs: mean(5),
  all: ride(r.rows),
  houghJunction: ride(junction),
  errors,
};
console.log(JSON.stringify(result, null, 1));
if (save)
  fs.writeFileSync(
    `outputs/ride-${save}.json`,
    JSON.stringify(result, null, 1),
  );
if (r.idx < route.length || errors.length) process.exitCode = 1;
