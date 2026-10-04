import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser = await chromium.launch({
  headless: true,
  args:
    process.platform === 'darwin'
      ? ['--use-gl=angle', '--use-angle=metal']
      : [],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }),
  errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
async function start() {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000');
  await page.waitForFunction(
    () => window.eagley_debug && !document.querySelector('#start-btn').disabled,
  );
  await page.locator('#start-btn').click();
}
async function follow(route, mode, reverse = false) {
  return page.evaluate(
    ({ route, mode, reverse }) => {
      const key = (code, down) =>
        window.dispatchEvent(
          new KeyboardEvent(down ? 'keydown' : 'keyup', {
            code,
            bubbles: true,
          }),
        );
      let index = 0,
        maxStep = 0,
        old = null,
        worst = null;
      for (let f = 0; f < 24000 && index < route.length; f++) {
        const p = JSON.parse(window.render_game_to_text()).player,
          t = route[index];
        if (Math.hypot(p.x - t[0], p.z - t[1]) < (mode === 'walk' ? 0.2 : 3)) {
          index++;
          continue;
        }
        const want =
            Math.atan2(t[0] - p.x, t[1] - p.z) + (reverse ? Math.PI : 0),
          err = Math.atan2(Math.sin(want - p.yaw), Math.cos(want - p.yaw));
        key('ArrowLeft', reverse ? err < -0.035 : err > 0.035);
        key('ArrowRight', reverse ? err > 0.035 : err < -0.035);
        const speed = mode === 'walk' ? 2.3 : Math.abs(err) > 0.3 ? 2.5 : 7;
        key(
          'ArrowUp',
          !reverse &&
            (mode === 'walk' ? Math.abs(err) < 0.15 : p.speed < speed),
        );
        key('ArrowDown', reverse && p.speed > -speed);
        key('Space', mode === 'drive' && Math.abs(p.speed) > speed + 0.3);
        window.advanceTime(mode === 'walk' ? 50 : 16.667, false);
        if (old !== null)
          if (Math.abs(p.y - old) > maxStep) {
            maxStep = Math.abs(p.y - old);
            worst = { x: p.x, z: p.z, from: old, to: p.y };
          }
        old = p.y;
      }
      for (const code of [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Space',
      ])
        key(code, false);
      key('Space', true);
      window.advanceTime(1800, false);
      key('Space', false);
      window.advanceTime(0, true);
      return {
        index,
        total: route.length,
        maxStep,
        worst,
        state: JSON.parse(window.render_game_to_text()),
      };
    },
    { route, mode, reverse },
  );
}

fs.mkdirSync('outputs', { recursive: true });
// v0.3.97 street frontages: Hough Lane east pavement past the new garden
// walls, a walk through one terrace gate, and drives past the forecourts.
const data = JSON.parse(fs.readFileSync('public/eagley-map.json', 'utf8'));
const road = (id) => data.roads.find((f) => f.id === id).points;
const results = {};
await start();
const expected = fs
  .readFileSync('lib/world-version.ts', 'utf8')
  .match(/WORLD_VERSION = ['"]([^'"]+)['"]/)[1];
assert.ok(
  (await page.locator('body').innerText()).includes(expected),
  'Wrong preview world',
);

// Same centreline correction as HOUGH_TERRACE_ROAD in lib/world/layout.ts.
const terraceShift = [
  [-88, 0],
  [-96, 1.0],
  [-112, 1.0],
  [-125, 1.4],
  [-165, 1.4],
  [-178, 0],
];
const shiftAt = (z) => {
  for (let i = 1; i < terraceShift.length; i++) {
    const [z0, a] = terraceShift[i - 1],
      [z1, b] = terraceShift[i];
    if (z <= z0 && z >= z1) return a + ((b - a) * (z - z0)) / (z1 - z0);
  }
  return 0;
};
const densify = (p, step) =>
  p.flatMap((a, i) => {
    if (i === p.length - 1) return [a];
    const b = p[i + 1],
      n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    return Array.from({ length: n }, (_, j) => [
      a[0] + ((b[0] - a[0]) * j) / n,
      a[1] + ((b[1] - a[1]) * j) / n,
    ]);
  });
const houghRaw = densify(road('626124394'), 4);
const houghLine = houghRaw.map((q, i) => {
  const s = shiftAt(q[1]);
  if (!s) return q;
  const a = houghRaw[Math.max(0, i - 1)],
    b = houghRaw[Math.min(houghRaw.length - 1, i + 1)],
    len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let n = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  if (n[0] > 0) n = [-n[0], -n[1]];
  return [q[0] + n[0] * s, q[1] + n[1] * s];
});
const hough = houghLine.filter((p) => p[1] < -80 && p[1] > -240);
await page.evaluate(
  ([a, b]) =>
    window.eagley_debug.driveFrom(
      a[0],
      a[1],
      Math.atan2(b[0] - a[0], b[1] - a[1]),
    ),
  hough,
);
results.houghDrive = await follow(hough.slice(1), 'drive');
assert.equal(
  results.houghDrive.index,
  results.houghDrive.total,
  'Hough Lane drive incomplete',
);

// East pavement centre, 3.9m from the 6.4m carriageway centreline.
const east = (a, b, s) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let n = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
  if (n[0] < 0) n = [-n[0], -n[1]];
  return [
    a[0] + (b[0] - a[0]) * s + n[0] * 3.9,
    a[1] + (b[1] - a[1]) * s + n[1] * 3.9,
  ];
};
const pavement = [];
for (let i = 0; i < hough.length - 1; i++)
  if (hough[i][1] < -95 && hough[i][1] > -240)
    pavement.push(east(hough[i], hough[i + 1], 0));
const p0 = pavement.at(-1);
await page.evaluate(([x, z]) => window.eagley_debug.driveFrom(x - 4, z, 0), p0);
await page.keyboard.press('e');
results.pavement = await follow(
  [p0, ...pavement.slice().reverse(), ...pavement],
  'walk',
);
if (results.pavement.index !== results.pavement.total)
  console.log(
    'PAVEMENT',
    JSON.stringify(pavement),
    results.pavement.index,
    JSON.stringify(results.pavement.state.player),
  );
assert.equal(
  results.pavement.index,
  results.pavement.total,
  'Hough Lane pavement walk blocked',
);

// West pavement along the new dry-stone wall (corrected centreline).
const westOf = (a, b) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let n = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
  if (n[0] > 0) n = [-n[0], -n[1]];
  return [a[0] + n[0] * 3.9, a[1] + n[1] * 3.9];
};
const westPavement = [];
for (let i = 0; i < hough.length - 1; i++)
  if (hough[i][1] < -118 && hough[i][1] > -172)
    westPavement.push(westOf(hough[i], hough[i + 1]));
results.westPavement = await follow(
  [
    hough.find((p) => p[1] < -172),
    ...westPavement.toReversed(),
    ...westPavement,
  ],
  'walk',
);
if (results.westPavement.index !== results.westPavement.total)
  console.log(
    'WEST',
    JSON.stringify(westPavement),
    results.westPavement.index,
    JSON.stringify(results.westPavement.state.player),
  );
assert.equal(
  results.westPavement.index,
  results.westPavement.total,
  'Hough Lane west pavement walk blocked',
);
// Terrace 727575004: through its garden gate to the front door and back.
const house = data.buildings
  .find((b) => b.id === '727575004')
  .points.slice(0, -1);
const front = house
  .map((a, i) => [a, house[(i + 1) % house.length]])
  .filter(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]) > 4)
  .sort((x, y) => x[0][0] + x[1][0] - (y[0][0] + y[1][0]))[0];
const doorWays = [front, [front[1], front[0]]].map(([a, b]) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]),
    t = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  let n = [-t[1], t[0]];
  if (n[0] > 0) n = [-n[0], -n[1]];
  const at = (v) => [
    a[0] + t[0] * 0.85 + n[0] * v,
    a[1] + t[1] * 0.85 + n[1] * v,
  ];
  return [at(2.6), at(0.7), at(2.6)];
});
results.gate = [];
for (const route of doorWays) {
  const r = await follow(route, 'walk');
  results.gate.push({
    route,
    index: r.index,
    total: r.total,
    maxStep: r.maxStep,
  });
  if (r.index === r.total) break;
}
assert.ok(
  results.gate.some((g) => g.index === g.total),
  'Terrace gate not walkable',
);

// Forecourt drives: Cottonfields and the outer Threadfold loop.
await page.keyboard.press('e');
for (const [name, id] of [
  ['cottonfields', '61959585'],
  ['threadfold', '61959587'],
]) {
  const r = road(id);
  await page.evaluate(
    ([a, b]) =>
      window.eagley_debug.driveFrom(
        a[0],
        a[1],
        Math.atan2(b[0] - a[0], b[1] - a[1]),
      ),
    r,
  );
  results[name] = await follow(r.slice(1), 'drive');
  assert.equal(
    results[name].index,
    results[name].total,
    `${name} drive incomplete`,
  );
}
// M25b School Street west square: drive into the bay and reverse out, then
// walk into the bay, out through the bollard line and back.
await page.evaluate(() =>
  window.eagley_debug.driveFrom(104, -78.4, Math.atan2(92 - 104, -84.5 + 78.4)),
);
results.squareDrive = await follow(
  [
    [92, -84.6],
    [87.6, -89.5],
    [89.2, -94.5],
  ],
  'drive',
);
assert.equal(
  results.squareDrive.index,
  results.squareDrive.total,
  'Square drive incomplete',
);
results.squareReverse = await follow(
  [
    [87.6, -89.5],
    [92, -84.6],
    [100, -80.7],
  ],
  'drive',
  true,
);
assert.equal(
  results.squareReverse.index,
  results.squareReverse.total,
  'Square reverse incomplete',
);
await page.keyboard.press('e');
results.squareWalk = await follow(
  [
    [95, -83.5],
    [90, -87],
    [88.5, -93],
    [89.5, -97.6],
    [87.5, -90],
    [84, -86.5],
    [80.1, -84.8],
    [77.4, -83.3],
    [80.1, -84.8],
    [86, -85],
    [95, -83.5],
  ],
  'walk',
);
assert.equal(
  results.squareWalk.index,
  results.squareWalk.total,
  'Square walk blocked',
);
console.log(
  'SQUAREWALK',
  JSON.stringify(results.squareWalk.worst),
  results.squareWalk.maxStep,
);
assert.ok(results.squareWalk.maxStep < 0.12, 'Square walking step too large');
for (const r of Object.values(results).flat()) if (r.state) delete r.state;
console.log(JSON.stringify({ results, errors }, null, 1));
await browser.close();
assert.equal(errors.length, 0);
