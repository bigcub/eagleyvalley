// Drive normally to the woodland entrance, walk in and out, then follow the
// restored pavement beside Bridge Mill. No player teleport or collision bypass.
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

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
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
fs.mkdirSync('outputs', { recursive: true });
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000');
  await page.waitForFunction(
    () => window.eagley_debug && !document.querySelector('#start-btn').disabled,
    null,
    { timeout: 120000 },
  );
  const version = fs
    .readFileSync('lib/world-version.ts', 'utf8')
    .match(/WORLD_VERSION = '([^']+)'/)[1];
  assert.ok(
    (await page.getByLabel('World version').innerText()).includes(version),
    'Preview is serving a different world version',
  );
  await page.locator('#start-btn').click();
  const data = JSON.parse(fs.readFileSync('public/eagley-map.json', 'utf8'));
  const drive = data.roads
    .find((r) => r.id === '155008522')
    .points.slice(1, 14);
  async function travel(route, driving) {
    return page.evaluate(
      ({ route, driving }) => {
        const press = (code, down) =>
          window.dispatchEvent(
            new KeyboardEvent(down ? 'keydown' : 'keyup', {
              code,
              bubbles: true,
            }),
          );
        const keys = ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'Space'];
        const trace = [];
        let maxHeightStep = 0,
          worstHeightAt,
          oldY;
        for (const target of route) {
          let reached = false;
          for (let f = 0; f < 3000; f++) {
            const p = JSON.parse(window.render_game_to_text()).player;
            if (
              Math.hypot(target[0] - p.x, target[1] - p.z) <
              (driving ? 2.5 : 0.35)
            ) {
              reached = true;
              break;
            }
            const err = Math.atan2(
              Math.sin(Math.atan2(target[0] - p.x, target[1] - p.z) - p.yaw),
              Math.cos(Math.atan2(target[0] - p.x, target[1] - p.z) - p.yaw),
            );
            press('ArrowLeft', err > 0.035);
            press('ArrowRight', err < -0.035);
            press(
              'ArrowUp',
              driving
                ? p.speed < (Math.abs(err) > 0.3 ? 3 : 6)
                : Math.abs(err) < 0.15,
            );
            window.advanceTime(driving ? 100 : 50, false);
            const y = JSON.parse(window.render_game_to_text()).player.y;
            if (
              !driving &&
              oldY !== undefined &&
              Math.abs(y - oldY) > maxHeightStep
            ) {
              maxHeightStep = Math.abs(y - oldY);
              worstHeightAt = JSON.parse(window.render_game_to_text()).player;
            }
            oldY = y;
          }
          trace.push({
            target,
            reached,
            player: JSON.parse(window.render_game_to_text()).player,
          });
          if (!reached) break;
        }
        keys.forEach((k) => press(k, k === 'Space' && driving));
        window.advanceTime(driving ? 1600 : 1, false);
        keys.forEach((k) => press(k, false));
        window.advanceTime(1);
        return {
          trace,
          maxHeightStep,
          worstHeightAt,
          mode: JSON.parse(window.render_game_to_text()).mode,
        };
      },
      { route, driving },
    );
  }
  const approach = await travel(drive, true);
  assert.equal(approach.trace.length, drive.length);
  assert.ok(
    approach.trace.every((r) => r.reached),
    'Entrance approach drive blocked',
  );
  await page.keyboard.press('e');
  const entrance = await travel(
    [
      [6, 57],
      [11, 59.6],
      [16, 60.45],
      [22, 60.75],
    ],
    false,
  );
  await page.screenshot({ path: 'outputs/eagley-brow-walk.png' });
  assert.equal(entrance.mode, 'walk');
  assert.ok(
    entrance.trace.every((r) => r.reached),
    'Woodland entrance blocked',
  );
  const pavement = await travel(
    [
      [16, 60.45],
      [11, 59.6],
      [6, 57],
      [18, 48.7],
      [32, 39],
      [47, 32.7],
      [56, 31],
      [62, 34.8],
      [75, 35.2],
      [91, 35.8],
      [103, 35.1],
      [108, 34.65],
      [112.25, 33.55],
      [115.4, 32.55],
      [117, 32.05],
      [118.5, 32.7],
      [121.6, 35.2],
      [124.45, 35.93],
    ],
    false,
  );
  await page.screenshot({ path: 'outputs/mill-pavement-walk.png' });
  const returnBend = await travel(
    [
      [121.6, 35.2],
      [118.5, 32.7],
      [117, 32.05],
      [115.4, 32.55],
      [112.25, 33.55],
      [108, 34.65],
      [103, 35.1],
    ],
    false,
  );
  await page.screenshot({ path: 'outputs/mill-pavement-return.png' });
  const result = { entrance, pavement, returnBend, errors };
  fs.writeFileSync(
    'outputs/eagley-brow-result.json',
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
  assert.equal(pavement.trace.length, 18);
  assert.ok(
    pavement.trace.every((r) => r.reached),
    'Return or restored pavement blocked',
  );
  assert.ok(
    entrance.maxHeightStep < 0.2,
    'Entrance has a foot-height discontinuity',
  );
  assert.ok(
    pavement.maxHeightStep < 0.2,
    'Pavement has a foot-height discontinuity',
  );
  assert.equal(returnBend.trace.length, 7);
  assert.ok(
    returnBend.trace.every((r) => r.reached),
    'Pavement bend return blocked',
  );
  assert.ok(
    returnBend.maxHeightStep < 0.2,
    'Bend return has a foot-height discontinuity',
  );
  assert.equal(errors.length, 0, errors.join('\n'));
} finally {
  await browser.close();
}
