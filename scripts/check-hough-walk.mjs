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
await page.screenshot({ path: 'outputs/hough-title.png' });
const expectedVersion = fs
  .readFileSync('lib/world-version.ts', 'utf8')
  .match(/WORLD_VERSION = ['"]([^'"]+)['"]/)[1];
assert.ok(
  (await page.locator('body').innerText()).includes(expectedVersion),
  'Wrong preview world',
);
await page.locator('#start-btn').click();
const state = () =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));
await page.keyboard.press('e');
if ((await state()).mode !== 'walk') throw Error('Exit car failed');
await page.keyboard.press('e');
if ((await state()).mode !== 'drive') throw Error('Re-enter failed');
await page.keyboard.press('c');
if ((await state()).camera !== 1) throw Error('Camera failed');
await page.keyboard.press('c');
await page.keyboard.press('c');
await page.keyboard.press('Escape');
if (!(await state()).paused) throw Error('Pause failed');
await page.getByRole('button', { name: 'Continue exploring' }).click();
await page.keyboard.press('m');
if (!(await state()).map) throw Error('Map failed');
await page.keyboard.press('m');
const data = JSON.parse(fs.readFileSync('public/eagley-map.json', 'utf8'));
const get = (id) => data.roads.find((r) => r.id === id).points;
const route = [
  ...get('155008522').slice(1),
  ...get('120133751').slice(1),
  ...get('681379569').slice(1),
];
const result = await page.evaluate(
  ({ route }) => {
    const press = (code, down) =>
      window.dispatchEvent(
        new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
      );
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
    const set = (arr) => keys.forEach((k) => press(k, arr.includes(k)));
    let index = 0,
      steps = 0,
      stuck = 0,
      old = null,
      trace = [];
    while (index < route.length && steps < 4000) {
      const s = JSON.parse(window.render_game_to_text()),
        p = s.player,
        t = route[index],
        d = Math.hypot(t[0] - p.x, t[1] - p.z);
      if (d < 3) {
        index++;
        continue;
      }
      const wanted = Math.atan2(t[0] - p.x, t[1] - p.z),
        err = Math.atan2(Math.sin(wanted - p.yaw), Math.cos(wanted - p.yaw));
      let arr = [];
      if (err > 0.035) arr.push('ArrowLeft');
      if (err < -0.035) arr.push('ArrowRight');
      const target = Math.abs(err) > 0.5 ? 3 : Math.abs(err) > 0.2 ? 4.5 : 7;
      if (p.speed < target) arr.push('ArrowUp');
      else if (p.speed > target + 1) arr.push('Space');
      set(arr);
      window.advanceTime(100, false);
      steps++;
      if (old && Math.hypot(p.x - old.x, p.z - old.z) < 0.008) stuck++;
      else stuck = 0;
      old = p;
      if (steps % 200 === 0) trace.push({ index, steps, p, d, err });
      if (stuck > 60) break;
    }
    set(['Space']);
    window.advanceTime(1600, false);
    set([]);
    window.advanceTime(1);
    return {
      index,
      total: route.length,
      steps,
      trace,
      state: JSON.parse(window.render_game_to_text()),
    };
  },
  { route },
);
console.log(JSON.stringify(result));
fs.writeFileSync(
  'outputs/hough-drive-result.json',
  JSON.stringify(result, null, 2),
);
await page.screenshot({ path: 'outputs/hough-drive-final.png' });
assert.equal(result.index, route.length, 'Driving route incomplete');
await page.keyboard.press('e');
assert.equal((await state()).mode, 'walk');
const north = [
  [132.46, 15.3],
  [134.1, 10.8],
  [135.83, 6.33],
  [138.35, 1.34],
  [140.865, -3.655],
  [143.38, -8.65],
  [145.9, -13.64],
  [146.4, -16.2],
  [146.8, -19],
  [146.6, -21.2],
  [146.6, -24.3],
  [146.5, -26.2],
  [147.15, -26.9],
  [148.1, -27.1],
  [147.25, -28.5],
];
// The filtered old-lane crossing and rebuilt pavement returns, using normal
// walking controls. Pass between the removable bollards, then leave between
// the stone posts onto the separate bridge landing.
const crossing = [
  ...north,
  [148.8, -27.1],
  [149.2, -29.2],
  [150.2, -28.5],
  [150.1, -23.9],
  [147.1, -23.9],
  [149.8, -23.9],
  [149.6, -20.8],
  [149.3, -18.6],
  [148.3, -16.8],
  [146.1, -14.9],
];
for (const [label, points] of [
  ['north', north],
  ['south', north.slice().reverse()],
  ['crossing', crossing],
  [
    'hall-lane-out-back',
    [
      [148.3, -16.8],
      [149.3, -18.6],
      [149.6, -20.8],
      [150.1, -23.9],
      [152.0, -21.2],
      [158, -16.3],
      [166, -9.7],
      [174, -3.2],
      [182, 3.4],
      [190, 10],
      [198, 16.5],
      [206, 23.1],
      [212.4232, 27.3955],
      [213.9463, 28.6365],
      [213.4175, 29.2693],
      [212.6388, 29.8987],
      [211.908, 30.6787],
      [212.2504, 31.2335],
      [212.6736, 31.7293],
      [213.64, 31.2726],
      [214.4776, 30.724],
      [215.2419, 30.4145],
      [215.9568, 32.2445],
      [218, 35.1],
      [222.44, 41.15],
      [226, 46],
      [222.44, 41.15],
      [218, 35.1],
      [215.9568, 32.2445],
      [215.2419, 30.4145],
      [214.4776, 30.724],
      [213.64, 31.2726],
      [212.6736, 31.7293],
      [212.2504, 31.2335],
      [211.908, 30.6787],
      [212.6388, 29.8987],
      [213.4175, 29.2693],
      [213.9463, 28.6365],
      [212.4232, 27.3955],
      [206, 23.1],
      [198, 16.5],
      [190, 10],
      [182, 3.4],
      [174, -3.2],
      [166, -9.7],
      [158, -16.3],
      [152.0, -21.2],
      [150.1, -23.9],
      [146.6, -24.3],
    ],
  ],
  // Continuous pavement on the road side of the back-edge rail, out and back.
  [
    'threadfold-pavement',
    [
      [147.25, -28.5],
      [147.0, -30.1],
      [146.9, -32.1],
      [145.8, -34.3],
      [144.1, -37.0],
      [141.9, -40.9],
      [139.916, -43.731],
      [136.143, -48.025],
      [132.252, -51.536],
      [136.143, -48.025],
      [139.916, -43.731],
      [141.9, -40.9],
      [144.1, -37.0],
      [145.8, -34.3],
      [146.9, -32.1],
      [147.0, -30.1],
      [147.25, -28.5],
      [146.6, -24.3],
    ],
  ],
  // Retain the earlier road-side approach as a separate regression route.
  [
    'threadfold-outer',
    [
      [146.6, -19],
      [146.6, -24.3],
      [145.4, -25.5],
      [144.9, -28],
      [144.1, -31.5],
      [143.8, -35.4],
      [143.7, -38.5],
      [144, -39],
      [139.916, -43.731],
      [136.143, -48.025],
      [132.252, -51.536],
      [126.931, -56.303],
      [119.2, -62.007],
      [110.371, -65.662],
      [102, -66.65],
      [110.371, -65.662],
      [119.2, -62.007],
      [126.931, -56.303],
      [132.252, -51.536],
      [136.143, -48.025],
      [139.916, -43.731],
      [144, -39],
      [143.7, -38.5],
      [143.8, -35.4],
      [144.1, -31.5],
      [144.9, -28],
      [145.4, -25.5],
      [146.6, -24.3],
    ],
  ],
]) {
  const result = await page.evaluate((points) => {
    const press = (code, down) =>
      window.dispatchEvent(
        new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
      );
    const trace = [];
    let maxHeightStep = 0,
      previousY;
    for (const [x, z] of points) {
      let reached = false;
      for (let n = 0; n < 700; n++) {
        const p = JSON.parse(window.render_game_to_text()).player;
        if (previousY !== undefined)
          maxHeightStep = Math.max(maxHeightStep, Math.abs(p.y - previousY));
        previousY = p.y;
        if (Math.hypot(x - p.x, z - p.z) < 0.24) {
          reached = true;
          break;
        }
        const err = Math.atan2(
          Math.sin(Math.atan2(x - p.x, z - p.z) - p.yaw),
          Math.cos(Math.atan2(x - p.x, z - p.z) - p.yaw),
        );
        press('ArrowLeft', err > 0.025);
        press('ArrowRight', err < -0.025);
        press('ArrowUp', Math.abs(err) < 0.12);
        window.advanceTime(50, false);
      }
      trace.push({
        target: [x, z],
        reached,
        player: JSON.parse(window.render_game_to_text()).player,
      });
      if (!reached) break;
    }
    ['ArrowUp', 'ArrowLeft', 'ArrowRight'].forEach((k) => press(k, false));
    window.advanceTime(1);
    return { trace, maxHeightStep };
  }, points);
  console.log(label, JSON.stringify(result));
  fs.writeFileSync(
    `outputs/hough-walk-${label}.json`,
    JSON.stringify(result, null, 2),
  );
  await page.screenshot({ path: `outputs/hough-walk-${label}.png` });
  assert.equal(
    result.trace.length,
    points.length,
    'Footbridge route incomplete',
  );
  assert.ok(
    result.trace.every((t) => t.reached),
    'Footbridge blocked',
  );
  assert.ok(result.maxHeightStep < 0.12, 'Abrupt walking height change');
}
for (const [name, ...view] of [
  ['hall-entrance-approach', 204, 21.5, 1.7, 220, 38, 1.2],
  ['hall-entrance-reverse', 223, 43, 1.7, 209, 26, 1.2],
  ['hall-entrance-overhead', 216, 32, 22, 216, 32.1, 0],
]) {
  await page.evaluate((v) => window.eagley_debug.view(...v), view);
  await page.screenshot({ path: `outputs/${name}.png` });
}
console.log('ERRORS', errors);
await browser.close();
assert.equal(errors.length, 0, errors.join('\n'));
