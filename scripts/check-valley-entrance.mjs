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

const data = JSON.parse(fs.readFileSync('public/eagley-map.json', 'utf8'));
const road = (id) => data.roads.find((f) => f.id === id).points;
const a = [17.39, -81.98],
  b = [7.44, -54.06];
const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
const ux = (b[0] - a[0]) / len,
  uz = (b[1] - a[1]) / len;
const at = (u, d) => [a[0] + ux * u + uz * d, a[1] + uz * u - ux * d];
const drive = [
  ...road('155008522').slice(1),
  ...road('120133751').slice(1),
  ...road('681379569').slice(1),
  ...road('681379568').slice(1),
  ...road('73858744').slice(1),
  ...road('727434505').slice(1),
  ...road('655432303').slice(1, 17),
  ...road('73858749').slice(1, 5),
];
await start();
const version = fs
  .readFileSync('lib/world-version.ts', 'utf8')
  .match(/WORLD_VERSION = '([^']+)'/)[1];
assert.ok(
  (await page.locator('body').innerText()).includes(version),
  'wrong preview version',
);
const results = { drive: await follow(drive, 'drive') };
assert.equal(
  results.drive.index,
  results.drive.total,
  'Valley approach drive incomplete',
);
await page.keyboard.press('e');
// Both doors, both retaining sides and the public pavement in both directions.
const route = [
  at(12.5, 6.4),
  at(14.8, 6.4),
  at(14.8, 5),
  at(14.8, 4),
  at(14.8, 3),
  at(14.8, 2),
  at(13.75, 1),
  at(13.75, 0.9),
  at(15.85, 0.9),
  at(17.3, 1),
  at(17.3, 3),
  at(17.3, 4.7),
  at(14.8, 5),
  at(12.3, 4),
  at(12.3, 2),
  at(13.75, 0.9),
  at(14.8, 2),
  at(14.8, 3),
  at(14.8, 4),
  at(14.8, 5),
  at(14.8, 6.4),
];
results.walk = await follow(route, 'walk');
await page.screenshot({ path: 'outputs/valley-entrance-walk.png' });
// Return to the same car, then reverse back down Scholars Rise.
const car = results.drive.state.player;
results.return = await follow([[car.x, car.z]], 'walk');
await page.keyboard.press('e');
const state = await page.evaluate(() =>
  JSON.parse(window.render_game_to_text()),
);
assert.equal(state.mode, 'drive', 'Valley car re-entry failed');
results.reverse = await follow(
  [
    [23.09, -65.28],
    [25.61, -60.03],
  ],
  'drive',
  true,
);
fs.writeFileSync(
  'outputs/valley-entrance-movement.json',
  JSON.stringify({ results, errors }, null, 2),
);
console.log(JSON.stringify({ results, errors }));
await browser.close();
assert.equal(
  results.walk.index,
  results.walk.total,
  'Valley entrance walk incomplete',
);
assert.ok(results.walk.maxStep < 0.1, 'Valley walk has an abrupt level join');
assert.equal(
  results.return.index,
  results.return.total,
  'Return walk incomplete',
);
assert.equal(
  results.reverse.index,
  results.reverse.total,
  'Valley reverse departure incomplete',
);
assert.equal(errors.length, 0);
