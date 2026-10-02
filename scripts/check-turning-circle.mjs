// Normal-input approach, complete clockwise circuit, return and island walk.
// Save the same check before/after a layout change; no teleport or collision bypass.
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const label = process.argv[2] || 'latest';
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
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
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
    'Preview world version differs',
  );
  await page.locator('#start-btn').click();
  const data = JSON.parse(fs.readFileSync('public/eagley-map.json', 'utf8'));
  async function travel(route, driving, arrival = 1.3) {
    return page.evaluate(
      ({ route, driving, arrival }) => {
        const press = (code, down) =>
          window.dispatchEvent(
            new KeyboardEvent(down ? 'keydown' : 'keyup', {
              code,
              bubbles: true,
            }),
          );
        const keys = [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Space',
        ];
        const trace = [],
          rows = [];
        for (const target of route) {
          let reached = false,
            stuck = 0;
          for (let frame = 0; frame < 18000; frame++) {
            const p = JSON.parse(window.render_game_to_text()).player;
            const distance = Math.hypot(target[0] - p.x, target[1] - p.z);
            if (distance < arrival) {
              reached = true;
              break;
            }
            const err = Math.atan2(
              Math.sin(Math.atan2(target[0] - p.x, target[1] - p.z) - p.yaw),
              Math.cos(Math.atan2(target[0] - p.x, target[1] - p.z) - p.yaw),
            );
            const speed = driving ? (Math.abs(err) > 0.35 ? 2.2 : 4) : 0;
            press('ArrowLeft', err > 0.025);
            press('ArrowRight', err < -0.025);
            press('ArrowUp', driving ? p.speed < speed : Math.abs(err) < 0.12);
            press('Space', driving && p.speed > speed + 0.6);
            window.advanceTime(16.667, false);
            const q = JSON.parse(window.render_game_to_text()).player;
            stuck = Math.hypot(q.x - p.x, q.z - p.z) < 0.0001 ? stuck + 1 : 0;
            const fx = Math.sin(q.yaw) * 1.5,
              fz = Math.cos(q.yaw) * 1.5;
            const at = (x, z) => window.eagley_debug.at(x, z).ground;
            rows.push([
              q.x,
              q.z,
              q.y,
              Math.atan2(at(q.x + fx, q.z + fz) - at(q.x - fx, q.z - fz), 3),
            ]);
            if (stuck > 180) break;
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
        let maxJerk = 0,
          maxPitchStepDeg = 0,
          maxHeightStep = 0,
          worstAt;
        for (let i = 2; i < rows.length; i++) {
          const jerk = Math.abs(
            rows[i][2] - 2 * rows[i - 1][2] + rows[i - 2][2],
          );
          if (jerk > maxJerk) {
            maxJerk = jerk;
            worstAt = rows[i].slice(0, 2);
          }
          maxHeightStep = Math.max(
            maxHeightStep,
            Math.abs(rows[i][2] - rows[i - 1][2]),
          );
          maxPitchStepDeg = Math.max(
            maxPitchStepDeg,
            (Math.abs(rows[i][3] - rows[i - 1][3]) * 180) / Math.PI,
          );
        }
        return {
          trace,
          frames: rows.length,
          maxJerk,
          maxPitchStepDeg,
          maxHeightStep,
          worstAt,
          mode: JSON.parse(window.render_game_to_text()).mode,
        };
      },
      { route, driving, arrival },
    );
  }
  const approach = await travel(
    [
      ...data.roads.find((r) => r.id === '155008522').points.slice(1),
      [115.51, 27.81],
      [119.73, 24.48],
    ],
    true,
    2.5,
  );
  assert.ok(
    approach.trace.every((r) => r.reached),
    'Approach blocked',
  );
  const circuitRoute = [
    [125, 29.5],
    [129, 33.1],
    [135, 36.1],
    [140.5, 37.2],
    [146, 36.1],
    [150, 33.5],
    [151.1, 29.6],
    [150.2, 25.8],
    [147.2, 22.9],
    [141, 19.8],
    [134.5, 16.5],
    [130, 16.5],
    [126, 18.5],
    [124.32, 19.58],
    [119.73, 24.48],
  ];
  const circuit = await travel(circuitRoute, true);
  await page.screenshot({ path: `outputs/turning-circle-${label}-drive.png` });
  const returnDrive = await travel(
    [
      [115.51, 27.81],
      [110.16, 30.5],
      [105, 31],
    ],
    true,
    2,
  );
  await page.keyboard.press('e');
  const walkRoute = [
    [108, 34.65],
    [112.25, 33.55],
    [115.4, 32.55],
    [117, 32.05],
    [118.5, 32.7],
    [121.6, 35.2],
    [124.45, 35.93],
    [125.6, 36.3],
    [129.49, 38.92],
    [134.9, 40.4],
    [140.4, 41.55],
    [147.1, 40.82],
    [152.29, 37.69],
    [154.73, 33.73],
  ];
  const pavement = await travel(walkRoute, false, 0.35);
  await page.screenshot({ path: `outputs/turning-circle-${label}-walk.png` });
  const islandRoute = [
    [152.29, 37.69],
    [147.1, 40.82],
    [140.4, 41.55],
    [134.9, 40.4],
    [129.49, 38.92],
    [125.6, 36.3],
    [125, 30.5],
    [128, 27.5],
    [130.4, 25.2],
    [131, 23.4],
    [132.4, 21.2],
  ];
  const island = await travel(islandRoute, false, 0.35);
  await page.screenshot({ path: `outputs/turning-circle-${label}-island.png` });
  const shelterEnter = await travel(
    [
      [131, 23.4],
      [130.4, 25.2],
      [128, 27.5],
      [125, 30.5],
      [125.6, 36.3],
      [129.49, 38.92],
      [132, 40.2],
      [131.6, 40.65],
    ],
    false,
    0.12,
  );
  const shelterBack = await travel([[131.425, 41.5]], false, 0.12);
  const shelterExit = await travel(
    [
      [132, 40.2],
      [134.9, 40.4],
    ],
    false,
    0.12,
  );
  await page.screenshot({
    path: `outputs/turning-circle-${label}-shelter.png`,
  });
  const result = {
    version,
    approach,
    circuit,
    returnDrive,
    pavement,
    island,
    shelterEnter,
    shelterBack,
    shelterExit,
    errors,
  };
  fs.writeFileSync(
    `outputs/turning-circle-${label}.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify({
      version,
      circuit: {
        ...circuit,
        trace: circuit.trace.map((r) => ({
          target: r.target,
          reached: r.reached,
        })),
      },
      returnDrive: returnDrive.trace.every((r) => r.reached),
      pavement: {
        targets: pavement.trace.length,
        reached: pavement.trace.every((r) => r.reached),
        maxHeightStep: pavement.maxHeightStep,
      },
      island: {
        targets: island.trace.length,
        reached: island.trace.every((r) => r.reached),
        maxHeightStep: island.maxHeightStep,
      },
      shelter: {
        entered: shelterEnter.trace.every((r) => r.reached),
        backBlocked: !shelterBack.trace[0].reached,
        exited: shelterExit.trace.every((r) => r.reached),
      },
      errors,
    }),
  );
  assert.equal(circuit.trace.length, circuitRoute.length);
  assert.ok(
    circuit.trace.every((r) => r.reached),
    'Turning circuit blocked',
  );
  assert.ok(
    returnDrive.trace.every((r) => r.reached),
    'Return drive blocked',
  );
  assert.equal(pavement.mode, 'walk');
  assert.equal(pavement.trace.length, walkRoute.length);
  assert.ok(
    pavement.trace.every((r) => r.reached),
    'Pavement connection blocked',
  );
  assert.ok(circuit.maxJerk < 0.05, 'Turning circuit height discontinuity');
  assert.ok(pavement.maxHeightStep < 0.1, 'Pavement height discontinuity');
  assert.equal(island.mode, 'walk');
  assert.equal(island.trace.length, islandRoute.length);
  assert.ok(
    island.trace.every((r) => r.reached),
    'Island approach blocked',
  );
  assert.ok(island.maxHeightStep < 0.1, 'Island approach height discontinuity');
  assert.ok(
    shelterEnter.trace.every((r) => r.reached),
    'Shelter entrance blocked',
  );
  assert.ok(
    !shelterBack.trace[0].reached,
    'Shelter back panel has no collision',
  );
  assert.ok(
    shelterExit.trace.every((r) => r.reached),
    'Cannot leave shelter',
  );
  assert.equal(errors.length, 0, errors.join('\n'));
} finally {
  await browser.close();
}
