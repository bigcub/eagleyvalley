import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { drape, sweep } from '../core/mesh';
import type { RoadNetwork } from '../world/road-network';

type Wall = { a: P; b: P };
type V = [number, number];

// Hough Lane / Threadfold Way junction, north end of the Hough Lane bridge.
// Road, kerbs and pavements come from the road network. This module adds what
// the network cannot know, from Street View:
//   DQl_iPlCOrF2ekkB6nUQbQ (June 2024) headings 65, 154, 250, 340
//   _odWeZzd3Ye8T0rGT_epug (June 2024) headings 20, 95
//   CD44JCXYHZPTLGAoXPEVlg (Aug 2022) heading 230, inside the old lane
//   J2OzBk7ztAD0mx85G5KuCg (Aug 2022) heading 230, Eagley Hall lane
// Positions are fitted to the modelled kerbs, not measured.

/** Ends of the pedestrian crossing beside the bollard line. */
const CROSSING: P[] = [
  [147.35, -27.6],
  [147.55, -17.9],
];

/** Paved island between the bridge, the old-lane mouth and the Hall lane. */
function islandOutline(net: RoadNetwork): P[] {
  // The island edge kerb curves from the Hall lane round to the bridge approach.
  const edge = net.kerbPaths.find((k) =>
    k.pts.some((p) => Math.hypot(p[0] - 149.3, p[1] + 19.8) < 0.8),
  );
  if (!edge) return [];
  const back = edge.pts.map(
    (p, i) => [p[0] + edge.out[i][0] * 0.15, p[1] + edge.out[i][1] * 0.15] as P,
  );
  // Continue 6m along the Hall lane kerb, which runs on to the car park.
  const lane = net.kerbPaths.find(
    (k) =>
      k !== edge && Math.hypot(k.pts[0][0] - 152.57, k.pts[0][1] + 17.77) < 0.3,
  );
  const along: P[] = lane
    ? lane.pts
        .slice(1, 4)
        .map((p, i) => [
          p[0] + lane.out[i + 1][0] * 0.15,
          p[1] + lane.out[i + 1][1] * 0.15,
        ])
    : [];
  // Back edge towards the brook: wooded bank, interpreted from _odWe heading 95.
  const outer: P[] = [
    [155.6, -11.9],
    [151.6, -12.3],
    [148.6, -13.2],
    [147.33, -14.04],
  ];
  const start =
    back[0][0] < back[back.length - 1][0] ? back : [...back].reverse();
  // start runs west to east; the island closes back along the outer edge.
  return [...start, ...along, ...outer];
}

/** Register the island with the network so walking height follows it. */
export function registerHoughIsland(net: RoadNetwork) {
  const outline = islandOutline(net);
  if (outline.length > 3) net.addPaved(outline);
  // Dropped kerbs where pedestrians cross the old-lane mouth (CD44 tactile).
  for (const [x, z] of CROSSING) net.addDroppedKerb(x, z);
  return outline;
}

export function addHoughJunction(
  kit: Kit,
  net: RoadNetwork,
  ground: (x: number, z: number) => number,
  island: P[],
) {
  const { box, batch, mat } = kit;
  const { dark, stone, trim, paving } = kit.m;
  const walls: Wall[] = [];

  // Island surface at pavement height, with a skirt round its open side.
  if (island.length > 3) {
    batch(
      drape(
        island,
        (x, z) => (net.pavement(x, z) ?? ground(x, z)) + 0.002,
        0.8,
      ),
      paving,
    );
    const rim = island.slice(-5);
    const outs: V[] = rim.map((p, i) => {
      const a = rim[Math.max(0, i - 1)],
        b = rim[Math.min(rim.length - 1, i + 1)];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [(b[1] - a[1]) / d, -(b[0] - a[0]) / d];
    });
    batch(
      sweep(rim, outs, (i) => ground(...rim[i]), [
        [0, 0],
        [0, -0.6],
      ]),
      paving,
    );
  }

  // Black bollards with a white band close the old lane between two stone
  // posts; red tactile paving marks the dropped crossing at both ends.
  const bollard = mat('bollardBlack', '#1d2120', 0.6),
    band = mat('bollardBand', '#e8e6de', 0.5),
    tactile = mat('tactileRed', '#8f3f36');
  const shaft = new T.CylinderGeometry(0.075, 0.09, 0.9, 12);
  for (const z of [-24.9, -23.7, -22.5, -21.3, -20.1]) {
    const x = 148.05,
      y = ground(x, z);
    const g = shaft.clone();
    g.translate(x, y + 0.45, z);
    batch(g, bollard);
    const ring = new T.CylinderGeometry(0.08, 0.08, 0.07, 12);
    ring.translate(x, y + 0.78, z);
    batch(ring, band);
    walls.push({ a: [x, z - 0.1], b: [x, z + 0.1] });
  }
  for (const [x, z] of [
    [147.95, -26.1],
    [148.4, -19.1],
  ] as P[]) {
    stonePost(x, z, 0.8);
    walls.push({ a: [x, z - 0.15], b: [x, z + 0.15] });
  }
  for (const [[x, z], rot] of [
    [CROSSING[0], 0.1],
    [CROSSING[1], -0.45],
  ] as [P, number][]) {
    const y = ground(x, z);
    box(x, y + 0.008, z, 1.2, 0.012, 0.8, tactile, rot);
  }

  // Four tapered stone posts along the Hall lane kerb stop vehicles entering
  // the island from the lane (J2Oz, Aug 2022).
  for (const [x, z] of [
    [150.3, -18.5],
    [151.6, -17.4],
    [152.9, -16.3],
    [154.2, -15.2],
  ] as P[]) {
    stonePost(x, z, 0.7, true);
    walls.push({ a: [x - 0.15, z], b: [x + 0.15, z] });
  }

  // Speed signs at the bridge mouth: 30 faces traffic heading south onto the
  // bridge, 20 faces traffic coming off it (_odWe heading 20, DQl heading 154).
  const face30 = signMaterial('30'),
    face20 = signMaterial('20');
  const north: V = [0.44, -0.9];
  for (const [x, z] of [
    [146.5, -15.35],
    [139.6, -19.0],
  ] as P[]) {
    const y = ground(x, z);
    box(x, y + 1.35, z, 0.065, 2.7, 0.065, trim);
    for (const [m, d] of [
      [face30, north],
      [face20, [-north[0], -north[1]]],
    ] as [T.Material, V][]) {
      const g = new T.CircleGeometry(0.3, 32);
      g.rotateY(Math.atan2(d[0], d[1]));
      g.translate(x + d[0] * 0.04, y + 2.4, z + d[1] * 0.04);
      batch(g, m);
    }
    walls.push({ a: [x - 0.05, z], b: [x + 0.05, z] });
  }
  // "CHANGED PRIORITIES" plate beside the east parapet (_odWe heading 95).
  const plate = textMaterial(['CHANGED', 'PRIORITIES'], '#b8322b', '#f4f1ea');
  {
    const x = 147.7,
      z = -13.95,
      y = ground(x, z);
    box(x, y + 0.75, z, 0.06, 1.5, 0.06, trim);
    const g = new T.PlaneGeometry(0.75, 0.3);
    g.rotateY(Math.atan2(-north[0], -north[1]));
    g.translate(x - north[0] * 0.04, y + 1.45, z - north[1] * 0.04);
    batch(g, plate);
  }

  // Galvanised pedestrian guardrail round the north corner: along Threadfold
  // Way's east pavement and into the old lane (DQl headings 65 and 340).
  const rail = mat('guardrail', '#8e9a92', 0.55);
  const tip = net.kerbPaths.find((k) =>
    k.pts.some((p) => Math.hypot(p[0] - 148.2, p[1] + 26.7) < 0.6),
  );
  if (tip) {
    const line = tip.pts
      .map(
        (p, i) => [p[0] + tip.out[i][0] * 1.7, p[1] + tip.out[i][1] * 1.7] as P,
      )
      // The rail stops short of the dropped crossing at the tip.
      .filter(
        (p) =>
          p[1] < -25.8 &&
          p[1] > -35 &&
          Math.hypot(p[0] - CROSSING[0][0], p[1] - CROSSING[0][1]) > 2.4,
      );
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1],
        b = line[i];
      const ya = ground(...a),
        yb = ground(...b);
      for (const h of [0.15, 0.95])
        kit.beam(
          new T.Vector3(a[0], ya + h, a[1]),
          new T.Vector3(b[0], yb + h, b[1]),
          0.045,
          0.045,
          rail,
        );
      const n = Math.max(
        1,
        Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.13),
      );
      for (let k = 0; k < n; k++) {
        const t = k / n;
        box(
          a[0] + (b[0] - a[0]) * t,
          T.MathUtils.lerp(ya, yb, t) + 0.55,
          a[1] + (b[1] - a[1]) * t,
          0.018,
          0.8,
          0.018,
          rail,
        );
      }
      if (i % 4 === 1) box(a[0], ya + 0.5, a[1], 0.06, 1.0, 0.06, rail);
      walls.push({ a, b });
    }
  }
  // Black heritage lamp on Threadfold Way's east pavement (DQl heading 340).
  {
    const x = 148.2,
      z = -31.6,
      y = ground(x, z);
    box(x, y + 2.1, z, 0.12, 4.2, 0.12, dark);
    box(x, y + 0.2, z, 0.24, 0.4, 0.24, dark);
    box(x, y + 4.35, z, 0.34, 0.45, 0.34, dark);
    box(x, y + 4.35, z, 0.28, 0.36, 0.28, mat('lampGlass', '#e9e3c8', 0.3));
    walls.push({ a: [x - 0.1, z], b: [x + 0.1, z] });
  }
  return walls;

  function stonePost(x: number, z: number, h: number, tapered = false) {
    const y = ground(x, z);
    const g = new T.CylinderGeometry(tapered ? 0.12 : 0.15, 0.17, h, 10);
    g.translate(x, y + h / 2, z);
    batch(g, stone);
    const cap = new T.SphereGeometry(
      tapered ? 0.12 : 0.15,
      10,
      6,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    cap.translate(x, y + h, z);
    batch(cap, stone);
  }
}

function signMaterial(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#a73d36';
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e4e2d7';
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#252b2a';
  ctx.font = 'bold 53px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 67);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  return new T.MeshStandardMaterial({ map, roughness: 0.8 });
}

function textMaterial(lines: string[], bg: string, fg: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 102;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 102);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 244, 90);
  ctx.fillStyle = fg;
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, 128, 36 + i * 32));
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  return new T.MeshStandardMaterial({ map, roughness: 0.7 });
}

// Separate mapped pedestrian bridge 655432306. Metal rails, not stone parapets.
export function addHoughFootbridge(
  kit: Kit,
  ground: (x: number, z: number) => number,
  points: P[],
) {
  const { box, batch } = kit;
  const { dark } = kit.m;
  const a = points[0],
    b = points[points.length - 1],
    dx = b[0] - a[0],
    dz = b[1] - a[1],
    len = Math.hypot(dx, dz),
    nx = -dz / len,
    nz = dx / len,
    n = Math.ceil(len / 1.6);
  const barriers: Wall[] = [];
  function beam(a: T.Vector3, b: T.Vector3, w: number, m: T.Material) {
    const delta = b.clone().sub(a),
      g = new T.BoxGeometry(w, delta.length(), w);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.normalize(),
      ),
    );
    const mid = a.clone().add(b).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    batch(g, m);
  }
  for (const side of [-1, 1]) {
    let prev: P | undefined;
    for (let k = 0; k <= n; k++) {
      const t = k / n,
        x = a[0] + dx * t + nx * 0.87 * side,
        z = a[1] + dz * t + nz * 0.87 * side,
        y = ground(x, z);
      box(x, y + 0.56, z, 0.055, 1.12, 0.055, dark);
      if (prev) {
        for (const h of [0.18, 0.54, 1.08])
          beam(
            new T.Vector3(prev[0], ground(...prev) + h, prev[1]),
            new T.Vector3(x, y + h, z),
            0.036,
            dark,
          );
        barriers.push({ a: prev, b: [x, z] });
      }
      prev = [x, z];
    }
  }
  return barriers;
}
