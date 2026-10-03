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
const loop = get('655432303');
const route = [
  ...get('155008522').slice(1),
  ...get('120133751').slice(1),
  ...get('681379569').slice(1),
  ...get('681379568').slice(1),
  ...get('73858744').slice(1),
  ...get('727434505').slice(1),
  ...loop.slice(1, loop.findIndex((p) => p[0] === 44.88) + 1),
  [43.95, -53],
  [43.1, -47.5],
  [40.7, -44.3],
  [31.5, -44.2],
  [27.3, -40.2],
  [25.4, -33.5],
  [28, -29.4],
  [30.2, -28.6],
  [42.5, -27.8],
  [53.8, -27.2],
  [58.2, -29.5],
  [58.8, -40.5],
  [57.7, -46.2],
  [57.2, -50.5],
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
      old = null;
    const trace = [];
    while (index < route.length && steps < 4000) {
      const s = JSON.parse(window.render_game_to_text()),
        p = s.player,
        t = route[index],
        d = Math.hypot(t[0] - p.x, t[1] - p.z);
      if (d < (index === route.length - 1 ? 0.75 : 3)) {
        index++;
        continue;
      }
      const wanted = Math.atan2(t[0] - p.x, t[1] - p.z),
        err = Math.atan2(Math.sin(wanted - p.yaw), Math.cos(wanted - p.yaw));
      const arr = [];
      if (err > 0.035) arr.push('ArrowLeft');
      if (err < -0.035) arr.push('ArrowRight');
      const target =
        index >= route.length - 2
          ? 2
          : Math.abs(err) > 0.5
            ? 3
            : Math.abs(err) > 0.2
              ? 4.5
              : 7;
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
fs.writeFileSync('outputs/m10-drive.json', JSON.stringify(result, null, 2));
await page.screenshot({ path: 'outputs/journey-final.png' });
assert.equal(result.index, route.length, 'Driving route incomplete');

await page.screenshot({ path: 'outputs/m10-parked.png' });
const reverse = await page.evaluate(() => {
  const press = (code, down) =>
    window.dispatchEvent(
      new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
    );
  const before = JSON.parse(window.render_game_to_text()).player;
  press('ArrowDown', true);
  window.advanceTime(2800, false);
  press('ArrowDown', false);
  press('Space', true);
  window.advanceTime(1200, false);
  press('Space', false);
  return { before, after: JSON.parse(window.render_game_to_text()).player };
});
console.log('REVERSE', JSON.stringify(reverse));
assert.ok(
  Math.hypot(
    reverse.after.x - reverse.before.x,
    reverse.after.z - reverse.before.z,
  ) > 3,
  'Reverse manoeuvre blocked',
);
await page.screenshot({ path: 'outputs/m10-park-reverse.png' });
assert.ok(
  Math.hypot(reverse.before.x - 57.2, reverse.before.z + 50.5) < 1.5,
  'Car did not park in the northern bay',
);
const exit = await page.evaluate(() => {
  const press = (code, down) =>
    window.dispatchEvent(
      new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
    );
  let index = 0;
  const route = [
    [53, -32],
    [45, -34],
    [43.8, -42],
    [44, -50],
    [44.5, -57],
    [44.88, -66.5],
  ];
  for (let i = 0; i < 2000 && index < route.length; i++) {
    const target = route[index],
      p = JSON.parse(window.render_game_to_text()).player;
    if (
      Math.hypot(target[0] - p.x, target[1] - p.z) <
      (index === route.length - 1 ? 1.6 : 3)
    ) {
      index++;
      continue;
    }
    const e = Math.atan2(
      Math.sin(Math.atan2(target[0] - p.x, target[1] - p.z) - p.yaw),
      Math.cos(Math.atan2(target[0] - p.x, target[1] - p.z) - p.yaw),
    );
    press('ArrowLeft', e > 0.035);
    press('ArrowRight', e < -0.035);
    press('ArrowUp', p.speed < 3);
    press('Space', p.speed > 4);
    window.advanceTime(50, false);
  }
  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].forEach((k) =>
    press(k, false),
  );
  window.advanceTime(1);
  return {
    reached: index === route.length,
    state: JSON.parse(window.render_game_to_text()),
  };
});
console.log('EXIT', JSON.stringify(exit));
assert.ok(exit.reached, 'Car park exit blocked');
assert.ok(exit.state.player.z < -63, 'Car did not reach Threadfold Way');
fs.writeFileSync(
  'outputs/m10-manoeuvre.json',
  JSON.stringify({ reverse, exit, errors }, null, 2),
);
if (process.argv.includes('--west-entrance')) {
  await page.keyboard.down('Space');
  await page.evaluate(() => window.advanceTime(1800));
  await page.keyboard.up('Space');
  await page.keyboard.press('e');
  assert.equal(
    (await state()).mode,
    'walk',
    'Exit car for entrance walk failed',
  );
  const entranceWalk = await page.evaluate(() => {
    const press = (code, down) =>
      window.dispatchEvent(
        new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
      );
    const outward = [
      [44.5, -61],
      [44.1, -56],
      [44, -49],
      [51, -45],
      [58.5, -40],
      [61, -40],
      [63, -40],
      [64.15, -40.75],
      [61, -40],
      [61, -46],
      [63, -46],
      [64.45, -45.46],
      [64.68, -48.15],
      [64.91, -50.84],
    ];
    const route = [...outward, ...outward.slice(0, -1).reverse()];
    const reached = [];
    let previous = null,
      maxHeightStep = 0,
      maxStepAt = null,
      maxApproachStep = 0;
    for (const target of route) {
      let done = false;
      for (let i = 0; i < 1500; i++) {
        const p = JSON.parse(window.render_game_to_text()).player;
        if (previous !== null && Math.abs(p.y - previous) > maxHeightStep) {
          maxHeightStep = Math.abs(p.y - previous);
          maxStepAt = { ...p, previous };
        }
        if (previous !== null && p.x > 58.5)
          maxApproachStep = Math.max(maxApproachStep, Math.abs(p.y - previous));
        previous = p.y;
        if (Math.hypot(target[0] - p.x, target[1] - p.z) < 0.08) {
          done = true;
          break;
        }
        const e = Math.atan2(
          Math.sin(Math.atan2(target[0] - p.x, target[1] - p.z) - p.yaw),
          Math.cos(Math.atan2(target[0] - p.x, target[1] - p.z) - p.yaw),
        );
        press('ArrowLeft', e > 0.025);
        press('ArrowRight', e < -0.025);
        press('ArrowUp', Math.abs(e) < 0.15);
        window.advanceTime(50, false);
      }
      reached.push({
        target,
        done,
        player: JSON.parse(window.render_game_to_text()).player,
      });
      if (!done) break;
    }
    ['ArrowLeft', 'ArrowRight', 'ArrowUp'].forEach((k) => press(k, false));
    window.advanceTime(1);
    return {
      reached,
      total: route.length,
      maxHeightStep,
      maxApproachStep,
      maxStepAt,
      state: JSON.parse(window.render_game_to_text()),
    };
  });
  fs.writeFileSync(
    'outputs/m12a-entrance-walk.json',
    JSON.stringify(entranceWalk, null, 2),
  );
  console.log('ENTRANCE WALK', JSON.stringify(entranceWalk));
  assert.equal(
    entranceWalk.reached.filter((p) => p.done).length,
    entranceWalk.total,
    'Entrance walk blocked',
  );
  assert.ok(
    entranceWalk.maxHeightStep < 0.03,
    'Abrupt parking entry walking level',
  );
  assert.ok(
    entranceWalk.maxApproachStep < 0.03,
    'Abrupt entrance walking level',
  );
}
console.log('ERRORS', JSON.stringify(errors));
await browser.close();
assert.equal(errors.length, 0);
