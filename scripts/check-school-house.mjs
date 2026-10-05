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
assert.equal(
  results.walk.index,
  results.walk.total,
  'School pavement walk incomplete',
);
await page.screenshot({ path: 'outputs/m20b-school-walk.png' });
// Walk both fitted School Street pavements from the existing public approach,
// crossing only at the ends and returning to the parked car with normal inputs.
const street = (u, side) => [
  86.36 + u * 0.906 - side * (side < 0 ? 2.8 : 3.025) * 0.423,
  -87.94 + u * 0.423 + side * (side < 0 ? 2.8 : 3.025) * 0.906,
];
const link = [
  sw(20, -3.4),
  sw(25.5, -3.1),
  sw(26.6, -1.5),
  [74.22, -82.9],
  [77.4, -83.33],
  [80.69, -84.95],
  [85.15, -87.83],
  [86.36, -87.94],
];
const north = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 58].map((u) =>
  street(u, -1),
);
const south = [58, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5].map((u) =>
  street(u, 1),
);
results.streetWalk = await follow(
  [
    ...link,
    ...north,
    ...south,
    [86.36, -87.94],
    ...link.toReversed(),
    sw(8, -3.4),
  ],
  'walk',
);
assert.equal(
  results.streetWalk.index,
  results.streetWalk.total,
  'School Street pavement loop incomplete',
);
await page.screenshot({ path: 'outputs/school-street-pavement-walk.png' });
// Filtered Hough Lane link prevents a drive from the usual spawn. Set up
// on the eastern street, then drive and reverse with normal key inputs.
await start();
await page.evaluate(() =>
  window.eagley_debug.driveFrom(
    166,
    -50.85,
    Math.atan2(86.36 - 166, -87.94 + 50.85),
  ),
);
results.streetDrive = await follow(
  [
    [142.58, -61.75],
    [125, -69.94],
    [110, -76.93],
    [92, -85.31],
  ],
  'drive',
);
results.streetReverse = await follow(
  [
    [110, -76.93],
    [125, -69.94],
    [142.58, -61.75],
    [166, -50.85],
  ],
  'drive',
  true,
);
assert.equal(
  results.streetReverse.index,
  results.streetReverse.total,
  'School Street reverse return incomplete',
);
assert.equal(
  results.streetDrive.index,
  results.streetDrive.total,
  'School Street drive/return incomplete',
);
await page.screenshot({ path: 'outputs/school-street-drive.png' });
// Flag 56288c8a: enter the asphalt parking from the connected frontage,
// park beside its wooded edge, reverse out, then walk the apron both ways.
await start();
await page.evaluate(() =>
  window.eagley_debug.driveFrom(45.5, -93.64, Math.atan2(22, 10)),
);
const parking = [
  [54, -89.5],
  [62, -85.7],
  [71, -81.5],
  [75.5, -77.8],
];
results.parkingDrive = await follow(parking, 'drive');
assert.equal(
  results.parkingDrive.index,
  parking.length,
  'Parking drive incomplete',
);
await page.screenshot({ path: 'outputs/school-street-parked.png' });
results.parkingReverse = await follow(
  [...parking.slice(0, -1).toReversed(), [45.5, -93.64]],
  'drive',
  true,
);
assert.equal(results.parkingReverse.index, 4, 'Parking reverse incomplete');
await page.keyboard.press('e');
results.parkingWalk = await follow(
  [...parking, ...parking.toReversed(), [48, -92]],
  'walk',
);
assert.equal(results.parkingWalk.index, 9, 'Parking walk incomplete');
assert.ok(results.parkingWalk.maxStep < 0.18, 'Parking walking level jump');
assert.ok(results.parkingDrive.maxStep < 0.08, 'Parking driving level jump');
console.log(JSON.stringify({ results, errors }));
fs.writeFileSync(
  'outputs/m20b-movement.json',
  JSON.stringify({ results, errors }, null, 2),
);
await browser.close();
assert.equal(errors.length, 0);
