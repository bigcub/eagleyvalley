// Ad-hoc screenshots from fixed cameras, for comparing changes.
//   node scripts/shot.mjs <out-prefix> "x,z,h,tx,tz,th" ["x,z,h,tx,tz,th" ...]
// h and th are metres above the movement surface at camera and target.
// Files: outputs/<out-prefix>-<n>.png
import { chromium } from 'playwright';
import fs from 'node:fs';

const [prefix, ...views] = process.argv.slice(2);
if (!prefix || !views.length) {
  console.log('usage: shot.mjs <prefix> "x,z,h,tx,tz,th" ...');
  process.exit(1);
}
fs.mkdirSync('outputs', { recursive: true });
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
await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000');
await page.waitForFunction(() => window.eagley_debug, null, {
  timeout: 120000,
});
await page.addStyleTag({
  content:
    'body *{visibility:hidden!important} canvas{visibility:visible!important}',
});
for (const [i, v] of views.entries()) {
  const args = v.split(',').map(Number);
  await page.evaluate((a) => window.eagley_debug.view(...a), args);
  const path = `outputs/${prefix}-${i + 1}.png`;
  await page.locator('canvas').first().screenshot({ path });
  console.log(path);
}
if (errors.length) console.log('ERRORS', errors);
await browser.close();
