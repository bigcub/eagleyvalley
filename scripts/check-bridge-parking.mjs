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
  ...get('681379568').slice(1),
  ...get('73858744').slice(1),
  ...get('727434505').slice(1),
  ...get('655432303').slice(1),
  ...get('727427321').slice(1),
  ...get('73858737').slice().reverse().slice(1),
  ...get('61959587').slice().reverse().slice(1, 2),
  ...get('655432310').slice(1),
  ...get('655432311').slice(1, 6),
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
  'outputs/journey-result.json',
  JSON.stringify(result, null, 2),
);
await page.screenshot({ path: 'outputs/journey-final.png' });
assert.equal(result.index, route.length, 'Driving route incomplete');

const manoeuvres = await page.evaluate(() => {
  const press = (code, down) =>
    window.dispatchEvent(
      new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
    );
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
  const set = (arr) => keys.forEach((k) => press(k, arr.includes(k)));
  const read = () => JSON.parse(window.render_game_to_text());
  const brake = () => {
    set(['Space']);
    window.advanceTime(1600, false);
    set([]);
  };
  const drive = (targets, reversing = false, tolerance = 1.1) => {
    const reached = [];
    for (const t of targets) {
      let done = false;
      for (let n = 0; n < 1200; n++) {
        const p = read().player;
        if (Math.hypot(t[0] - p.x, t[1] - p.z) < tolerance) {
          done = true;
          break;
        }
        const sign = reversing ? -1 : 1;
        const want = Math.atan2(sign * (t[0] - p.x), sign * (t[1] - p.z)),
          e = Math.atan2(Math.sin(want - p.yaw), Math.cos(want - p.yaw));
        const a = [];
        if (e * sign > 0.03) a.push('ArrowLeft');
        if (e * sign < -0.03) a.push('ArrowRight');
        const target = Math.abs(e) > 0.4 ? 2 : 3.2;
        if (p.speed * sign < target)
          a.push(reversing ? 'ArrowDown' : 'ArrowUp');
        if (p.speed * sign > target + 0.4) a.push('Space');
        set(a);
        window.advanceTime(50, false);
      }
      reached.push({ t, done, player: read().player });
      if (!done) break;
    }
    brake();
    return reached;
  };
  const parking = drive(
    [
      [22, 12],
      [12.7, 15.6],
    ],
    true,
  );
  const parked = read().player;
  const departure = drive([[20, 15.6]]);
  const reverse = read().player;
  const centralApproach = drive([
    [33.1, 15.6],
    [33.1, 3],
  ]);
  const central = drive([[33.1, 16.5]], true, 0.3);
  const centralExit = drive([[33.1, 9]]);
  const easternApproach = drive([[20, 4.7]]);
  const eastern = drive([[35.8, 4.7]], true, 0.3);
  const easternExit = drive([[25, 4.7]]);
  const ramp = drive([
    [25, 14],
    [43, 13],
    [56, 12],
    [64, 11.5],
  ]);
  const rampEnd = read().player;
  set(['ArrowDown']);
  for (let n = 0; n < 600 && read().player.x > 44; n++)
    window.advanceTime(50, false);
  brake();
  set([]);
  window.advanceTime(1);
  return {
    parking,
    centralApproach,
    central,
    centralExit,
    easternApproach,
    eastern,
    easternExit,
    parked,
    departure,
    reverse,
    ramp,
    rampEnd,
    back: read().player,
  };
});
console.log('MANOEUVRES', JSON.stringify(manoeuvres));
fs.writeFileSync(
  'outputs/bridge-manoeuvres.json',
  JSON.stringify(manoeuvres, null, 2),
);
assert.equal(
  manoeuvres.parking.filter((p) => p.done).length,
  2,
  'Reverse parking approach failed',
);
assert.ok(manoeuvres.reverse.x > 18.8, 'Departure from bay failed');
for (const label of [
  'centralApproach',
  'central',
  'centralExit',
  'easternApproach',
  'eastern',
  'easternExit',
])
  assert.ok(
    manoeuvres[label].every((p) => p.done),
    `${label} parking manoeuvre blocked`,
  );
assert.equal(
  manoeuvres.ramp.filter((p) => p.done).length,
  4,
  'Ramp/garage approach failed',
);
assert.ok(manoeuvres.back.x < 45, 'Reverse out of garage lane failed');
await page.keyboard.press('e');
assert.equal((await state()).mode, 'walk');
const walk = await page.evaluate(() => {
  const press = (code, down) =>
    window.dispatchEvent(
      new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
    );
  const targets = [
    [42, 11.3],
    [42.35, 10.1],
    [42.35, 9.1],
    [42.3, 8.4],
    [42.35, 9.1],
    [42.35, 10.1],
    [42, 11.3],
    [36, 12],
    [28, 13],
    [20, 13],
    [13, 6],
    [12, -1],
  ];
  const reached = [];
  let maxStep = 0,
    previous = null;
  for (const t of targets) {
    let done = false;
    for (let n = 0; n < 1800; n++) {
      const p = JSON.parse(window.render_game_to_text()).player;
      if (previous !== null)
        maxStep = Math.max(maxStep, Math.abs(p.y - previous));
      previous = p.y;
      if (Math.hypot(t[0] - p.x, t[1] - p.z) < 0.25) {
        done = true;
        break;
      }
      const e = Math.atan2(
        Math.sin(Math.atan2(t[0] - p.x, t[1] - p.z) - p.yaw),
        Math.cos(Math.atan2(t[0] - p.x, t[1] - p.z) - p.yaw),
      );
      press('ArrowLeft', e > 0.025);
      press('ArrowRight', e < -0.025);
      press('ArrowUp', Math.abs(e) < 0.15);
      window.advanceTime(50, false);
    }
    reached.push({
      t,
      done,
      player: JSON.parse(window.render_game_to_text()).player,
    });
    if (!done) break;
  }
  for (const k of ['ArrowUp', 'ArrowLeft', 'ArrowRight']) press(k, false);
  window.advanceTime(1);
  return { reached, maxStep };
});
console.log('COURT WALK', JSON.stringify(walk));
assert.equal(
  walk.reached.filter((p) => p.done).length,
  12,
  'Door bridge/ramp/exit walk failed',
);
assert.ok(walk.maxStep < 0.08, 'Walking surface has an abrupt step');
await page.screenshot({ path: 'outputs/bridge-parking-walk.png' });
fs.writeFileSync(
  'outputs/bridge-parking-check.json',
  JSON.stringify({ manoeuvres, walk, errors }, null, 2),
);
await browser.close();
assert.equal(errors.length, 0);
