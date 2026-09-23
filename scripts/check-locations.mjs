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
await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000', {
  waitUntil: 'domcontentloaded',
});
await page.waitForFunction(
  () => typeof window.render_game_to_text === 'function',
  null,
  { timeout: 60000 },
);
await page.waitForFunction(
  () => !document.querySelector('#start-btn').disabled,
);
await page.screenshot({ path: 'outputs/title-final.png' });
await page.locator('#start-btn').click();
await page.keyboard.press('b');
await page.mouse.move(700, 400);
await page.mouse.down();
await page.mouse.move(700, 275);
await page.mouse.up();
const spots = [
  [119, 27, 225],
  [132.5, 6.6, 11],
  [146.4, -28.7, 26],
];
for (let index = 0; index < spots.length; index++) {
  const result = await page.evaluate(([x, z, heading]) => {
    const press = (code, down) =>
      window.dispatchEvent(
        new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
      );
    for (let n = 0; n < 1800; n++) {
      const p = JSON.parse(window.render_game_to_text()).player,
        dx = x - p.x,
        dz = z - p.z;
      if (Math.hypot(dx, dz) < 0.5) break;
      const err = Math.atan2(
        Math.sin(Math.atan2(dx, dz) - p.yaw),
        Math.cos(Math.atan2(dx, dz) - p.yaw),
      );
      press('ArrowLeft', err > 0.02);
      press('ArrowRight', err < -0.02);
      press('ArrowUp', Math.abs(err) < 0.15);
      window.advanceTime(16.667, false);
    }
    for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp']) press(k, false);
    press('KeyQ', true);
    window.advanceTime(4000, false);
    press('KeyQ', false);
    for (let n = 0; n < 300; n++) {
      const p = JSON.parse(window.render_game_to_text()).player,
        err = Math.atan2(
          Math.sin((heading * Math.PI) / 180 - p.yaw),
          Math.cos((heading * Math.PI) / 180 - p.yaw),
        );
      press('ArrowLeft', err > 0.02);
      press('ArrowRight', err < -0.02);
      window.advanceTime(16.667, false);
    }
    for (const k of ['ArrowLeft', 'ArrowRight']) press(k, false);
    window.advanceTime(200);
    return JSON.parse(window.render_game_to_text());
  }, spots[index]);
  console.log(index + 1, result.player);
  await page.screenshot({ path: `outputs/location-${index + 1}.png` });
}
console.log('ERRORS', errors);
await browser.close();
assert.equal(errors.length, 0, errors.join('\n'));
