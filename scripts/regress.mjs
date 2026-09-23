// Structural regression check for refactors.
//   node scripts/regress.mjs capture <label>   record scene, surface and views
//   node scripts/regress.mjs compare <a> <b>    report differences between two captures
// Captures live in outputs/regress/<label>/ (ignored by Git).
import { chromium } from 'playwright';
import fs from 'node:fs';

const [mode, a, b] = process.argv.slice(2);
const root = 'outputs/regress';

// Fixed viewpoints: [name, x, z, eye height, target x, target z, target height]
export const VIEWS = [
  ['start-gatehouse', -276, 136, 1.7, -287, 150, 3],
  ['eagley-upper', -245, 106, 1.7, -205, 78, 1.2],
  ['eagley-026', -45, 80, 1.7, 0, 60, 1],
  ['mill-wall-road', 60, 32, 1.7, 100, 30, 0.5],
  ['court-garages', 20, 14, 1.7, 60, 12, 2],
  ['passage', 76, 22, 1.7, 106, 23.3, 1.5],
  ['rear-patios', 92, 2, 1.7, 92, 10, 2],
  ['hough-bridge', 131, 22, 1.7, 142, -10, 1.5],
  ['hough-junction', 140, -40, 1.7, 147, -15, 1.5],
  ['turning-circle', 118, 40, 1.7, 135, 33, 1],
  ['brook-mill', 0, -20, 12, 35, -55, 6],
  ['overview', 175, 150, 110, 15, -48, 8],
];

async function open() {
  const browser = await chromium.launch({
    headless: true,
    args:
      process.platform === 'darwin'
        ? ['--use-gl=angle', '--use-angle=metal']
        : [],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const t0 = Date.now();
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(() => window.eagley_debug, null, {
    timeout: 120000,
  });
  const loadMs = Date.now() - t0;
  return { browser, page, errors, loadMs };
}

async function capture(label) {
  const dir = `${root}/${label}`;
  fs.mkdirSync(`${dir}/views`, { recursive: true });
  const { browser, page, errors, loadMs } = await open();
  const fingerprint = await page.evaluate(() =>
    window.eagley_debug.fingerprint(),
  );
  const wide = await page.evaluate(() => window.eagley_debug.surface('wide'));
  const core = await page.evaluate(() => window.eagley_debug.surface('core'));
  await page.addStyleTag({
    content:
      'body *{visibility:hidden!important} canvas{visibility:visible!important}',
  });
  for (const [name, ...v] of VIEWS) {
    await page.evaluate((v) => window.eagley_debug.view(...v), v);
    await page
      .locator('canvas')
      .first()
      .screenshot({ path: `${dir}/views/${name}.png` });
  }
  fs.writeFileSync(
    `${dir}/fingerprint.json`,
    JSON.stringify(fingerprint, null, 1),
  );
  fs.writeFileSync(`${dir}/surface.json`, JSON.stringify({ wide, core }));
  fs.writeFileSync(
    `${dir}/meta.json`,
    JSON.stringify({ loadMs, errors }, null, 1),
  );
  await browser.close();
  console.log(`captured ${label}: load ${loadMs}ms, errors ${errors.length}`);
  if (errors.length) console.log(errors.join('\n'));
}

function compare(x, y) {
  const read = (l, f) =>
    JSON.parse(fs.readFileSync(`${root}/${l}/${f}`, 'utf8'));
  let problems = 0;
  const fa = read(x, 'fingerprint.json'),
    fb = read(y, 'fingerprint.json');
  for (const key of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
    const p = fa[key],
      q = fb[key];
    if (!p || !q) {
      problems++;
      console.log(`${p ? 'removed' : 'added'} group ${key}`, p || q);
      continue;
    }
    const drift = p.sum.map(
      (s, i) => Math.abs(s - q.sum[i]) / Math.max(1, Math.abs(s)),
    );
    if (
      p.meshes !== q.meshes ||
      p.vertices !== q.vertices ||
      p.instances !== q.instances ||
      drift.some((d) => d > 1e-6)
    ) {
      problems++;
      console.log(
        `changed group ${key}\n  ${JSON.stringify(p)}\n  ${JSON.stringify(q)}`,
      );
    }
  }
  const sa = read(x, 'surface.json'),
    sb = read(y, 'surface.json');
  for (const grid of ['wide', 'core']) {
    const p = sa[grid],
      q = sb[grid];
    for (const field of ['ground', 'terrain']) {
      let n = 0,
        worst = 0,
        at = -1;
      p[field].forEach((v, i) => {
        const d = Math.abs(v - q[field][i]);
        if (d > 1e-3) n++;
        if (d > worst) {
          worst = d;
          at = i;
        }
      });
      if (n) {
        problems++;
        const cols = Math.round((p.x1 - p.x0) / p.step) + 1;
        console.log(
          `${grid} ${field}: ${n} samples differ, worst ${worst.toFixed(3)}m at x ${p.x0 + (at % cols) * p.step}, z ${p.z0 + Math.floor(at / cols) * p.step}`,
        );
      }
    }
    let diff = 0;
    p.stand.forEach((row, i) => {
      for (let j = 0; j < row.length; j++) if (row[j] !== q.stand[i][j]) diff++;
    });
    if (diff) {
      problems++;
      console.log(`${grid} collision: ${diff} samples differ`);
    }
  }
  const ma = read(x, 'meta.json'),
    mb = read(y, 'meta.json');
  console.log(
    `load ${ma.loadMs}ms -> ${mb.loadMs}ms; errors ${ma.errors.length} -> ${mb.errors.length}`,
  );
  if (mb.errors.length) problems++;
  console.log(
    problems
      ? `${problems} difference(s)`
      : 'IDENTICAL geometry, surface and collisions',
  );
  process.exitCode = problems ? 1 : 0;
}

if (mode === 'capture' && a) await capture(a);
else if (mode === 'compare' && a && b) compare(a, b);
else console.log('usage: regress.mjs capture <label> | compare <a> <b>');
