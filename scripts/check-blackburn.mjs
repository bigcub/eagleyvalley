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
      for (let f = 0; f < 5000 && index < route.length; f++) {
        const p = JSON.parse(window.render_game_to_text()).player,
          t = route[index];
        if (
          Math.hypot(p.x - t[0], p.z - t[1]) < (mode === 'walk' ? 0.2 : 1.8)
        ) {
          index++;
          continue;
        }
        const want =
            Math.atan2(t[0] - p.x, t[1] - p.z) + (reverse ? Math.PI : 0),
          err = Math.atan2(Math.sin(want - p.yaw), Math.cos(want - p.yaw));
        key('ArrowLeft', reverse ? err < -0.035 : err > 0.035);
        key('ArrowRight', reverse ? err > 0.035 : err < -0.035);
        const speed = mode === 'walk' ? 2.3 : Math.abs(err) > 0.3 ? 2 : 3.5;
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
const results = {};
for (const [name, path] of [
  [
    'north',
    [
      [5, 0],
      [0, 3],
      [-4, 9],
      [-8, 18],
      [-12, 27],
    ],
  ],
  [
    'south',
    [
      [5, 0],
      [1, -3],
      [0, -9],
      [0, -18],
      [0, -27],
    ],
  ],
]) {
  await start();
  results[name] = await follow(
    path.map((p) => world(...p)),
    'drive',
    true,
  );
  await page.screenshot({ path: `outputs/m18-${name}-drive.png` });
  assert.equal(
    results[name].index,
    results[name].total,
    `${name} mouth blocked`,
  );
}
await start();
await page.keyboard.press('e');
const gate = [
  [12, -3.8],
  [9, -3.8],
  [7, -4.6],
  [7, -6],
  [7, -9],
  [7.5, -13],
];
const hill = [
  [-0.8, 12],
  [1.4, 9],
  [3, 6.2],
  [5.3, 4],
  [8, 2.6],
  [12, 2.6],
];
const route = [
  ...gate,
  ...gate.toReversed(),
  [9, 0],
  ...hill.toReversed(),
  ...hill,
  [9, 0],
  ...gate,
];
results.walk = await follow(
  route.map((p) => world(...p)),
  'walk',
);
await page.screenshot({ path: 'outputs/m18-corner-walk.png' });
console.log(JSON.stringify({ results, errors }));
fs.writeFileSync(
  'outputs/m18-movement.json',
  JSON.stringify({ results, errors }, null, 2),
);
await browser.close();
assert.equal(results.walk.index, results.walk.total, 'Corner walk blocked');
assert.ok(results.walk.maxStep < 0.03, 'Corner walk height discontinuity');
assert.equal(errors.length, 0);
