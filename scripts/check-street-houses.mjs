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

const hough = road('626124394').filter((p) => p[1] < -80 && p[1] > -240);
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
  if (hough[i][1] < -170 && hough[i][1] > -240)
    for (const s of [0, 0.5]) pavement.push(east(hough[i], hough[i + 1], s));
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
for (const r of Object.values(results).flat()) if (r.state) delete r.state;
console.log(JSON.stringify({ results, errors }, null, 1));
await browser.close();
assert.equal(errors.length, 0);
