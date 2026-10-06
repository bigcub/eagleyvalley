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
    null,
    { timeout: 60000 },
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
        if (
          Math.hypot(p.x - t[0], p.z - t[1]) <
          (mode === 'walk' ? 0.2 : index === route.length - 1 ? 0.6 : 1.2)
        ) {
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

await start();
await page.evaluate(() => window.eagley_debug.driveFrom(104.5, -62.4, Math.PI));
const results = {};
results.in = await follow(
  [
    [104.5, -65],
    [104.5, -68.3],
  ],
  'drive',
);
assert.equal(results.in.index, results.in.total, 'Mini parking entry blocked');
await page.screenshot({ path: 'outputs/threadfold-mini-parking-drive.png' });
results.out = await follow(
  [
    [104.5, -65],
    [104.5, -62.4],
  ],
  'drive',
  true,
);
assert.equal(
  results.out.index,
  results.out.total,
  'Mini parking reversing blocked',
);
assert.ok(
  results.in.maxStep < 0.02 && results.out.maxStep < 0.02,
  'Mini parking grade step',
);
await page.keyboard.press('e');
results.walk = await follow(
  [
    [111, -63.5],
    [113, -62.9],
    [118, -60.7],
    [125, -57.8],
    [118, -60.7],
    [113, -62.9],
    [111, -63.5],
    [104.5, -64.3],
    [104.5, -68],
  ],
  'walk',
);
assert.equal(
  results.walk.index,
  results.walk.total,
  'Bank pavement/parking walk blocked',
);
assert.ok(results.walk.maxStep < 0.02, 'Bank pavement height discontinuity');
await page.screenshot({ path: 'outputs/threadfold-mini-parking-walk.png' });
console.log(JSON.stringify({ results, errors }));
assert.deepEqual(errors, []);
await browser.close();
