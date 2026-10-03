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
const world = (u, v) => [
  -290.12 + u * 0.637 + v * 0.771,
  158.63 - u * 0.771 + v * 0.637,
];
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
const sw = (u, v) => [
  50.53 + u * 0.904 + v * 0.427,
  -98.6 + u * 0.427 - v * 0.904,
];
const drive = [
  ...road('155008522').slice(1),
  ...road('120133751').slice(1),
  ...road('681379569').slice(1),
  ...road('681379568').slice(1),
  ...road('73858744').slice(1),
  ...road('727434505').slice(1),
  ...road('655432303').slice(1, 17),
  ...road('73858749').slice(1),
  ...road('1234563552').slice(1),
  sw(8, -6.5),
];
await start();
const results = { drive: await follow(drive, 'drive') };
assert.equal(
  results.drive.index,
  results.drive.total,
  'School approach drive incomplete',
);
await page.keyboard.press('e');
const walk = [
  [8, -3.4],
  [4, -3.4],
  [0.5, -3.4],
  [4, -3.4],
  [8, -3.4],
  [12, -3.4],
  [16, -3.4],
  [20, -3.4],
  [23, -3.35],
  [25.5, -3.1],
  [26.6, -1.5],
  [26.65, 0.1],
  [26.6, -1.5],
  [25.5, -3.1],
  [23, -3.35],
  [20, -3.4],
  [16, -3.4],
  [12, -3.4],
  [8, -3.4],
];
results.walk = await follow(
  walk.map((p) => sw(...p)),
  'walk',
);
await page.screenshot({ path: 'outputs/m20b-school-walk.png' });
console.log(JSON.stringify({ results, errors }));
fs.writeFileSync(
  'outputs/m20b-movement.json',
  JSON.stringify({ results, errors }, null, 2),
);
await browser.close();
assert.equal(
  results.walk.index,
  results.walk.total,
  'School pavement walk incomplete',
);
assert.equal(errors.length, 0);
