// Read the local EA 2022 1m DTM/DSM GeoTIFFs (work/reference, not committed)
// and convert game metres to British National Grid.
//   node scripts/ea-raster.mjs check   compare the DTM with eagley-terrain.bin
import fs from 'node:fs';
function raster(path) {
  const b = fs.readFileSync(path);
  const ifd = b.readUInt32BE(4),
    n = b.readUInt16BE(ifd),
    t = {};
  for (let i = 0; i < n; i++) {
    const o = ifd + 2 + i * 12;
    t[b.readUInt16BE(o)] = [
      b.readUInt16BE(o + 2),
      b.readUInt32BE(o + 4),
      o + 8,
    ];
  }
  const arr = (tag) => {
    const [, count, o] = t[tag];
    const at = count * 4 <= 4 ? o : b.readUInt32BE(o);
    return Array.from({ length: count }, (_, k) => b.readUInt32BE(at + k * 4));
  };
  const W = 1600,
    H = 1450,
    TW = 512,
    offs = arr(324),
    across = Math.ceil(W / TW);
  return (e, nn) => {
    const c = Math.floor(e - 371000),
      r = Math.floor(413850 - nn);
    if (c < 0 || r < 0 || c >= W || r >= H) return NaN;
    const ti = Math.floor(r / TW) * across + Math.floor(c / TW);
    return b.readFloatBE(offs[ti] + ((r % TW) * TW + (c % TW)) * 4);
  };
}
// WGS84 -> OSGB36 (Helmert) -> National Grid.
function toBNG(lat, lon) {
  const rad = Math.PI / 180;
  let a = 6378137,
    b = 6356752.3142,
    e2 = 1 - (b * b) / (a * a);
  const φ = lat * rad,
    λ = lon * rad,
    ν = a / Math.sqrt(1 - e2 * Math.sin(φ) ** 2);
  const x = ν * Math.cos(φ) * Math.cos(λ),
    y = ν * Math.cos(φ) * Math.sin(λ),
    z = (1 - e2) * ν * Math.sin(φ);
  const tx = -446.448,
    ty = 125.157,
    tz = -542.06,
    s = 20.4894e-6,
    rx = (-0.1502 / 3600) * rad,
    ry = (-0.247 / 3600) * rad,
    rz = (-0.8421 / 3600) * rad;
  const x2 = tx + (1 + s) * x - rz * y + ry * z,
    y2 = ty + rz * x + (1 + s) * y - rx * z,
    z2 = tz - ry * x + rx * y + (1 + s) * z;
  a = 6377563.396;
  b = 6356256.909;
  e2 = 1 - (b * b) / (a * a);
  const p = Math.hypot(x2, y2);
  let φ2 = Math.atan2(z2, p * (1 - e2));
  for (let i = 0; i < 10; i++) {
    const v = a / Math.sqrt(1 - e2 * Math.sin(φ2) ** 2);
    φ2 = Math.atan2(z2 + e2 * v * Math.sin(φ2), p);
  }
  const λ2 = Math.atan2(y2, x2);
  const F0 = 0.9996012717,
    φ0 = 49 * rad,
    λ0 = -2 * rad,
    N0 = -100000,
    E0 = 400000,
    n = (a - b) / (a + b);
  const sφ = Math.sin(φ2),
    cφ = Math.cos(φ2),
    tφ = Math.tan(φ2);
  const v = (a * F0) / Math.sqrt(1 - e2 * sφ * sφ),
    ρ = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sφ * sφ, 1.5),
    η2 = v / ρ - 1;
  const M =
    b *
    F0 *
    ((1 + n + 1.25 * n * n + 1.25 * n ** 3) * (φ2 - φ0) -
      (3 * n + 3 * n * n + 2.625 * n ** 3) *
        Math.sin(φ2 - φ0) *
        Math.cos(φ2 + φ0) +
      (1.875 * n * n + 1.875 * n ** 3) *
        Math.sin(2 * (φ2 - φ0)) *
        Math.cos(2 * (φ2 + φ0)) -
      (35 / 24) * n ** 3 * Math.sin(3 * (φ2 - φ0)) * Math.cos(3 * (φ2 + φ0)));
  const I = M + N0,
    II = (v / 2) * sφ * cφ,
    III = (v / 24) * sφ * cφ ** 3 * (5 - tφ ** 2 + 9 * η2),
    IIIA = (v / 720) * sφ * cφ ** 5 * (61 - 58 * tφ ** 2 + tφ ** 4);
  const IV = v * cφ,
    V = (v / 6) * cφ ** 3 * (v / ρ - tφ ** 2),
    VI =
      (v / 120) *
      cφ ** 5 *
      (5 - 18 * tφ ** 2 + tφ ** 4 + 14 * η2 - 58 * tφ ** 2 * η2);
  const dλ = λ2 - λ0;
  return [
    E0 + IV * dλ + V * dλ ** 3 + VI * dλ ** 5,
    I + II * dλ ** 2 + III * dλ ** 4 + IIIA * dλ ** 6,
  ];
}
const dsm = raster('work/reference/eagley-dsm.tif'),
  dtm = raster('work/reference/eagley-dtm.tif');
const at = (x, z) =>
  toBNG(
    53.6138 - z / 111320,
    -2.428 + x / (111320 * Math.cos((53.6138 * Math.PI) / 180)),
  );
export { dsm, dtm, at };
if (process.argv[2] === 'check') {
  const meta = JSON.parse(fs.readFileSync('public/eagley-survey.json'));
  const bin = new Uint16Array(
    fs.readFileSync('public/eagley-terrain.bin').buffer.slice(0),
  );
  let worst = 0;
  for (const [x, z] of [
    [-283, 149],
    [0, 0],
    [80, 14],
    [-100, 80],
    [140, -35],
  ]) {
    const [e, n] = at(x, z),
      r = Math.round((z - meta.z0) / meta.step),
      c = Math.round((x - meta.x0) / meta.step);
    const g = bin[r * meta.cols + c] / 100 + 100,
      d = dtm(e, n);
    worst = Math.max(worst, Math.abs(g - d));
    console.log(
      x,
      z,
      e.toFixed(1),
      n.toFixed(1),
      'dtm',
      d.toFixed(2),
      'game',
      g.toFixed(2),
    );
  }
  console.log('worst', worst.toFixed(2));
}
