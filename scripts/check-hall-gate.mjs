import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('outputs', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args:
    process.platform === 'darwin'
      ? ['--use-gl=angle', '--use-angle=metal']
      : [],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000');
await page.waitForFunction(
  () => window.eagley_debug && !document.querySelector('#start-btn').disabled,
  null,
  { timeout: 60000 },
);
const version = fs
  .readFileSync('lib/world-version.ts', 'utf8')
  .match(/WORLD_VERSION = ['"]([^'"]+)['"]/)[1];
assert.ok(
  (await page.locator('body').innerText()).includes(version),
  'Wrong world',
);
await page.locator('#start-btn').click();
const result = await page.evaluate(() => {
  const length = Math.hypot(18.67, 25.62),
    dx = 18.67 / length,
    dz = 25.62 / length;
  window.eagley_debug.driveFrom(
    214.19 - dx * 5 + dz * 1.3,
    29.82 - dz * 5 - dx * 1.3,
    Math.atan2(dx, dz),
  );
  const key = (down) =>
    window.dispatchEvent(
      new KeyboardEvent(down ? 'keydown' : 'keyup', {
        code: 'ArrowUp',
        bubbles: true,
      }),
    );
  key(true);
  window.advanceTime(4000);
  key(false);
  const p = JSON.parse(window.render_game_to_text()).player;
  return { player: p, along: (p.x - 214.19) * dx + (p.z - 29.82) * dz };
});
console.log('CAR', result);
assert.ok(
  result.along < -1.2 &&
    result.along > -1.5 &&
    Math.abs(result.player.speed) < 0.1,
  'Vehicle gate must stop approach',
);
await page.screenshot({ path: 'outputs/hall-closed-gate-car.png' });
await page.reload();
await page.waitForFunction(
  () => window.eagley_debug && !document.querySelector('#start-btn').disabled,
  null,
  { timeout: 60000 },
);
await page.locator('#start-btn').click();
for (const [name, ...view] of [
  ['hall-gate-approach', 209, 24.0, 1.7, 215, 33, 1.1],
  ['hall-gate-reverse', 216, 34.7, 1.7, 212, 27, 1.1],
  ['hall-gate-overhead', 214, 30, 15, 214, 30.1, 0],
]) {
  await page.evaluate((v) => window.eagley_debug.view(...v), view);
  await page.screenshot({ path: `outputs/${name}.png` });
}
console.log(JSON.stringify({ result, errors }));
await browser.close();
assert.equal(errors.length, 0, errors.join('\n'));
