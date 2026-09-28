import * as T from 'three';
import type { Kit } from '../core/kit';
import { inPoly, type P } from '../core/geo';
import { drape, sweep } from '../core/mesh';

type Wall = { a: P; b: P };
type V = [number, number];
type KerbLine = { pavement: boolean; pts: P[]; out: V[] };

// Hough Lane / Threadfold Way junction at the north end of the Hough Lane
// bridge. Layout from Street View (SURVEY.md, 23 September 2026):
//   DQl_iPlCOrF2ekkB6nUQbQ (June 2024) headings 65, 154, 250, 340
//   _odWeZzd3Ye8T0rGT_epug (June 2024) headings 20, 95
//   CD44JCXYHZPTLGAoXPEVlg (Aug 2022) heading 230, inside the old lane
//   J2OzBk7ztAD0mx85G5KuCg (Aug 2022) heading 230, Eagley Hall lane
// Kerb lines follow the OSM centrelines with 6.4m roads (5.5m old lane),
// filleted corners and 1.1m pavements; widths and radii are estimates.
//
// Pavements here, as elsewhere in the game, are drawn raised but walked at
// road level, so nothing in this module changes how the car rides.

export const HOUGH_CENTRE: P = [146.8, -21.0];
/** Generic road edges give way to this module inside this radius. */
export const HOUGH_RADIUS = 10;
const PAVEMENT = 1.1,
  KERB_W = 0.15,
  KERB_H = 0.09;
export const PAVE_H = 0.08;
/** Ends of the pedestrian crossing beside the bollard line (dropped kerbs). */
const CROSSING: P[] = [
  [147.35, -27.6],
  [147.55, -17.9],
];

// Generated from the v0.4.0 road network (commit 8cc9bfe), heights removed.
export const JUNCTION_OUTLINE: P[] = [
  [140.52, -27.33],
  [146.85, -28.27],
  [146.9, -27.97],
  [147.64, -27.37],
  [147.7, -27.04],
  [147.91, -26.79],
  [148.22, -26.67],
  [148.55, -26.71],
  [148.81, -26.9],
  [149.11, -27.25],
  [149.41, -27.6],
  [149.7, -27.96],
  [150, -28.31],
  [150.29, -28.66],
  [155.19, -24.54],
  [155, -24.31],
  [154.8, -24.03],
  [154.65, -23.71],
  [154.57, -23.38],
  [154.54, -23.03],
  [154.57, -22.69],
  [154.66, -22.35],
  [154.81, -22.04],
  [155.01, -21.76],
  [155.26, -21.51],
  [155.49, -21.32],
  [152.57, -17.77],
  [152.2, -18.07],
  [151.83, -18.38],
  [151.45, -18.69],
  [151.08, -18.99],
  [150.71, -19.3],
  [150.33, -19.6],
  [149.96, -19.91],
  [149.7, -20.09],
  [149.4, -20.21],
  [149.09, -20.26],
  [148.78, -20.26],
  [148.47, -20.19],
  [148.18, -20.06],
  [147.92, -19.88],
  [147.7, -19.65],
  [147.54, -19.38],
  [146.79, -16.27],
  [146.45, -15.89],
  [146.11, -15.52],
  [145.78, -15.14],
  [145.44, -14.76],
  [145.1, -14.39],
  [144.77, -14.01],
  [144.43, -13.64],
  [140.41, -15.6],
  [140.47, -15.91],
  [140.3, -15.99],
  [140.43, -16.28],
  [140.53, -16.58],
  [140.61, -16.89],
  [140.67, -17.21],
  [140.7, -17.53],
  [140.71, -17.84],
  [140.74, -18.33],
  [140.77, -18.81],
  [140.79, -19.29],
  [140.82, -19.78],
  [140.84, -20.26],
  [140.87, -20.75],
  [140.9, -21.23],
  [140.92, -21.71],
  [140.95, -22.2],
  [140.97, -22.68],
  [141, -23.17],
  [141.03, -23.65],
  [141.02, -23.97],
  [140.95, -24.45],
  [140.88, -24.93],
  [140.81, -25.41],
  [140.73, -25.89],
  [140.66, -26.37],
  [140.59, -26.85],
];
export const KERB_LINES: KerbLine[] = [
  // north corner, Threadfold Way east to old lane north-west
  {
    pavement: true,
    pts: [
      [146.85, -28.27],
      [146.9, -27.97],
      [147.64, -27.37],
      [147.7, -27.04],
      [147.91, -26.79],
      [148.22, -26.67],
      [148.55, -26.71],
      [148.81, -26.9],
      [149.11, -27.25],
      [149.41, -27.6],
      [149.7, -27.96],
      [150, -28.31],
      [150.29, -28.66],
    ],
    out: [
      [0.989, -0.147],
      [0.989, -0.147],
      [0.999, 0.054],
      [0.902, -0.431],
      [0.586, -0.811],
      [0.126, -0.992],
      [-0.364, -0.931],
      [-0.766, -0.643],
      [-0.766, -0.643],
      [-0.766, -0.643],
      [-0.766, -0.643],
      [-0.766, -0.643],
      [-0.766, -0.643],
    ],
  },
  // old lane south-east to Eagley Hall lane
  {
    pavement: false,
    pts: [
      [155.19, -24.54],
      [155, -24.31],
      [154.8, -24.03],
      [154.65, -23.71],
      [154.57, -23.38],
      [154.54, -23.03],
      [154.57, -22.69],
      [154.66, -22.35],
      [154.81, -22.04],
      [155.01, -21.76],
      [155.26, -21.51],
      [155.49, -21.32],
    ],
    out: [
      [0.766, 0.643],
      [0.766, 0.643],
      [0.866, 0.499],
      [0.94, 0.34],
      [0.985, 0.17],
      [1, -0.005],
      [0.984, -0.179],
      [0.937, -0.349],
      [0.862, -0.507],
      [0.76, -0.65],
      [0.634, -0.773],
      [0.634, -0.773],
    ],
  },
  // island edge, Hall lane round to the bridge approach
  {
    pavement: false,
    pts: [
      [152.57, -17.77],
      [152.2, -18.07],
      [151.83, -18.38],
      [151.45, -18.69],
      [151.08, -18.99],
      [150.71, -19.3],
      [150.33, -19.6],
      [149.96, -19.91],
      [149.7, -20.09],
      [149.4, -20.21],
      [149.09, -20.26],
      [148.78, -20.26],
      [148.47, -20.19],
      [148.18, -20.06],
      [147.92, -19.88],
      [147.7, -19.65],
      [147.54, -19.38],
      [146.79, -16.27],
      [146.45, -15.89],
      [146.11, -15.52],
      [145.78, -15.14],
      [145.44, -14.76],
      [145.1, -14.39],
      [144.77, -14.01],
      [144.43, -13.64],
    ],
    out: [
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.468, 0.884],
      [-0.282, 0.959],
      [-0.086, 0.996],
      [0.114, 0.993],
      [0.31, 0.951],
      [0.493, 0.87],
      [0.656, 0.754],
      [0.793, 0.609],
      [0.899, 0.438],
      [0.899, 0.438],
      [0.899, 0.438],
      [0.899, 0.438],
      [0.899, 0.438],
      [0.899, 0.438],
      [0.899, 0.438],
      [0.899, 0.438],
      [0.899, 0.438],
    ],
  },
  // west corner, bridge approach to Threadfold Way
  {
    pavement: true,
    pts: [
      [140.41, -15.6],
      [140.47, -15.91],
      [140.3, -15.99],
      [140.43, -16.28],
      [140.53, -16.58],
      [140.61, -16.89],
      [140.67, -17.21],
      [140.7, -17.53],
      [140.71, -17.84],
      [140.74, -18.33],
      [140.77, -18.81],
      [140.79, -19.29],
      [140.82, -19.78],
      [140.84, -20.26],
      [140.87, -20.75],
      [140.9, -21.23],
      [140.92, -21.71],
      [140.95, -22.2],
      [140.97, -22.68],
      [141, -23.17],
      [141.03, -23.65],
      [141.02, -23.97],
      [140.95, -24.45],
      [140.88, -24.93],
      [140.81, -25.41],
      [140.73, -25.89],
      [140.66, -26.37],
      [140.59, -26.85],
      [140.52, -27.33],
    ],
    out: [
      [-0.899, -0.438],
      [-0.899, -0.438],
      [-0.899, -0.438],
      [-0.931, -0.365],
      [-0.957, -0.29],
      [-0.977, -0.212],
      [-0.991, -0.133],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.999, -0.054],
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.989, 0.147],
    ],
  },
  // Eagley Hall lane, north-east kerb
  {
    pavement: false,
    pts: [
      [155.49, -21.32],
      [157.81, -19.42],
      [160.13, -17.52],
    ],
    out: [
      [0.634, -0.773],
      [0.634, -0.773],
      [0.634, -0.773],
    ],
  },
  // Eagley Hall lane, south-west kerb
  {
    pavement: false,
    pts: [
      [152.57, -17.77],
      [154.89, -15.86],
      [157.21, -13.96],
      [159.53, -12.06],
    ],
    out: [
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.634, 0.773],
      [-0.634, 0.773],
    ],
  },
  // Threadfold Way, west kerb
  {
    pavement: true,
    pts: [
      [140.52, -27.33],
      [140.42, -28.02],
      [140.32, -28.72],
      [140.21, -29.41],
      [140.23, -29.58],
      [140.1, -29.74],
      [139.79, -30.36],
      [139.48, -30.99],
      [139.17, -31.62],
      [138.85, -32.24],
      [138.54, -32.87],
      [138.23, -33.49],
      [137.92, -34.12],
    ],
    out: [
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.989, 0.147],
      [-0.954, 0.3],
      [-0.895, 0.447],
      [-0.895, 0.447],
      [-0.895, 0.447],
      [-0.895, 0.447],
      [-0.895, 0.447],
      [-0.895, 0.447],
      [-0.895, 0.447],
      [-0.895, 0.447],
    ],
  },
  // Threadfold Way, east kerb
  {
    pavement: true,
    pts: [
      [146.85, -28.27],
      [146.75, -28.96],
      [146.65, -29.65],
      [146.54, -30.35],
      [146.33, -31.5],
      [145.83, -32.6],
      [145.52, -33.22],
      [145.21, -33.85],
      [144.89, -34.47],
      [144.58, -35.1],
      [144.27, -35.73],
      [143.95, -36.35],
    ],
    out: [
      [0.989, -0.147],
      [0.989, -0.147],
      [0.989, -0.147],
      [0.989, -0.147],
      [0.954, -0.3],
      [0.895, -0.447],
      [0.895, -0.447],
      [0.895, -0.447],
      [0.895, -0.447],
      [0.895, -0.447],
      [0.895, -0.447],
      [0.895, -0.447],
    ],
  },
  // bridge approach, west kerb
  {
    pavement: true,
    pts: [
      [140.19, -14.38],
      [140.41, -15.6],
    ],
    out: [
      [-0.898, -0.439],
      [-0.899, -0.438],
    ],
  },
  // bridge approach, east kerb
  {
    pavement: true,
    pts: [
      [143.61, -12.72],
      [144.43, -13.64],
    ],
    out: [
      [0.898, 0.439],
      [0.899, 0.438],
    ],
  },
  // old lane, north-west kerb
  {
    pavement: true,
    pts: [
      [150.29, -28.66],
      [151.35, -29.91],
    ],
    out: [
      [-0.766, -0.643],
      [-0.766, -0.643],
    ],
  },
  // old lane, south-east kerb
  {
    pavement: true,
    pts: [
      [155.19, -24.54],
      [156.25, -25.8],
    ],
    out: [
      [0.766, 0.643],
      [0.766, 0.643],
    ],
  },
];

const lines = KERB_LINES.map((k) => clip(k));
const island = islandOutline();

/** Clip a kerb line to the module's radius. */
function clip(k: KerbLine): KerbLine {
  const inside = (p: P) =>
    Math.hypot(p[0] - HOUGH_CENTRE[0], p[1] - HOUGH_CENTRE[1]) <= HOUGH_RADIUS;
  const keep = k.pts.map(inside);
  const a = keep.indexOf(true),
    b = keep.lastIndexOf(true);
  return { ...k, pts: k.pts.slice(a, b + 1), out: k.out.slice(a, b + 1) };
}

/** Paved island between the bridge, the old-lane mouth and the Hall lane. */
function islandOutline(): P[] {
  const edge = KERB_LINES[2],
    lane = KERB_LINES[5];
  const back = edge.pts.map(
    (p, i) =>
      [p[0] + edge.out[i][0] * KERB_W, p[1] + edge.out[i][1] * KERB_W] as P,
  );
  const along = lane.pts
    .slice(1, 4)
    .map(
      (p, i) =>
        [
          p[0] + lane.out[i + 1][0] * KERB_W,
          p[1] + lane.out[i + 1][1] * KERB_W,
        ] as P,
    );
  // Back edge towards the brook, interpreted from _odWe heading 95.
  const outer: P[] = [
    [155.6, -11.9],
    [151.6, -12.3],
    [148.6, -13.2],
    [146.6, -14.2],
  ];
  const start =
    back[0][0] < back[back.length - 1][0] ? back : [...back].reverse();
  return [...start, ...along, ...outer];
}

/** Carriageway surface of the junction (between the kerbs). */
export function inHoughCarriageway(x: number, z: number) {
  return inPoly(x, z, JUNCTION_OUTLINE);
}

/**
 * Inside the area this module surfaces: carriageway, island or within the
 * pavement strip behind any of its kerbs. Walking height here is road level.
 */
export function inHoughArea(x: number, z: number) {
  if (Math.hypot(x - HOUGH_CENTRE[0], z - HOUGH_CENTRE[1]) > HOUGH_RADIUS + 4)
    return false;
  if (inPoly(x, z, JUNCTION_OUTLINE) || inPoly(x, z, island)) return true;
  for (const k of lines)
    for (let i = 1; i < k.pts.length; i++) {
      const a = k.pts[i - 1],
        b = k.pts[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(
          1,
          ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1),
        ),
      );
      const px = a[0] + dx * t,
        pz = a[1] + dz * t,
        o = k.out[i];
      const along = (x - px) * o[0] + (z - pz) * o[1];
      const reach = KERB_W + (k.pavement ? PAVEMENT : 0);
      if (
        along >= -0.05 &&
        along <= reach &&
        Math.hypot(x - px, z - pz) <= reach + 0.05
      )
        return true;
    }
  return false;
}

/** Distance outside the island's brook-side edge, or undefined if inside it. */
export function outsideIsland(x: number, z: number) {
  if (x < 143 || x > 160 || z < -22 || z > -9) return Infinity;
  if (inPoly(x, z, island)) return undefined;
  let best = Infinity;
  const rim = island.slice(-5);
  for (let i = 1; i < rim.length; i++) {
    const a = rim[i - 1],
      b = rim[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(
        1,
        ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1),
      ),
    );
    best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t));
  }
  return best;
}

/** Kerb height, falling to 20mm at the dropped crossing. */
function kerbHeight(x: number, z: number) {
  let f = 1;
  for (const [cx, cz] of CROSSING)
    f = Math.min(f, Math.max(0, Math.hypot(x - cx, z - cz) - 1.2));
  f = Math.min(1, f);
  return 0.02 + (KERB_H - 0.02) * f * f * (3 - 2 * f);
}

export function addHoughJunction(
  kit: Kit,
  roadY: (x: number, z: number) => number,
  ground: (x: number, z: number) => number,
) {
  const { box, batch, mat } = kit;
  const { dark, stone, kerb, paving, asphalt } = kit.m;
  const walls: Wall[] = [];

  // Carriageway fill over the whole junction mouth, just above the road
  // ribbons it overlaps.
  batch(
    drape(JUNCTION_OUTLINE, (x, z) => roadY(x, z) + 0.012, 1),
    asphalt,
  );

  // Kerbs with a face, pavements behind them, skirts on their open edge.
  for (const k of lines) {
    if (k.pts.length < 2) continue;
    const base = k.pts.map((p) => roadY(...p));
    const lift = k.pts.map((p) => kerbHeight(...p) - KERB_H);
    const y = (i: number) => base[i] + lift[i];
    batch(
      sweep(k.pts, k.out, y, [
        [0, -0.2],
        [0, KERB_H],
        [KERB_W, KERB_H],
      ]),
      kerb,
    );
    if (k.pavement)
      batch(
        sweep(k.pts, k.out, y, [
          [KERB_W, PAVE_H],
          [KERB_W + PAVEMENT, PAVE_H],
          [KERB_W + PAVEMENT, PAVE_H - 0.5],
        ]),
        paving,
      );
    else
      batch(
        sweep(k.pts, k.out, y, [
          [KERB_W, KERB_H],
          [KERB_W, -0.35],
        ]),
        kerb,
      );
  }

  // Paved island with a skirt along its brook side.
  batch(
    drape(island, (x, z) => roadY(x, z) + PAVE_H + 0.004, 0.8),
    paving,
  );
  const rim = island.slice(-5);
  const rimOut: V[] = rim.map((_, i) => {
    const a = rim[Math.max(0, i - 1)],
      b = rim[Math.min(rim.length - 1, i + 1)];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[1] - a[1]) / d, -(b[0] - a[0]) / d];
  });
  batch(
    sweep(rim, rimOut, (i) => roadY(...rim[i]) + PAVE_H, [
      [0, 0],
      [0, -0.6],
    ]),
    paving,
  );

  // Black bollards with a white band close the old lane between two stone
  // posts (CD44, DQl heading 65).
  const bollard = mat('bollardBlack', '#1d2120', 0.6),
    band = mat('bollardBand', '#e8e6de', 0.5);
  for (const z of [-24.9, -23.7, -22.5, -21.3, -20.1]) {
    const x = 148.05,
      y = ground(x, z);
    const g = new T.CylinderGeometry(0.075, 0.09, 0.9, 12);
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
  // Four tapered stone posts along the Hall lane kerb stop vehicles entering
  // the island from the lane (J2Oz).
  for (const [x, z] of [
    [150.3, -18.5],
    [151.6, -17.4],
    [152.9, -16.3],
    [154.2, -15.2],
  ] as P[]) {
    stonePost(x, z, 0.7, true);
    walls.push({ a: [x - 0.15, z], b: [x + 0.15, z] });
  }

  // Galvanised guardrail round the north corner, stopping short of the
  // crossing (DQl headings 65 and 340).
  const rail = mat('guardrail', '#8e9a92', 0.55);
  const tip = lines[0];
  const railLine = tip.pts
    .map(
      (p, i) => [p[0] + tip.out[i][0] * 1.05, p[1] + tip.out[i][1] * 1.05] as P,
    )
    .filter(
      (p) => Math.hypot(p[0] - CROSSING[0][0], p[1] - CROSSING[0][1]) > 2.4,
    );
  for (let i = 1; i < railLine.length; i++) {
    const a = railLine[i - 1],
      b = railLine[i];
    const ya = roadY(...a) + PAVE_H,
      yb = roadY(...b) + PAVE_H;
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
  // Black heritage lamp on Threadfold Way's east pavement (DQl heading 340).
  {
    const x = 147.7,
      z = -31.2,
      y = roadY(x, z) + PAVE_H;
    box(x, y + 2.1, z, 0.12, 4.2, 0.12, dark);
    box(x, y + 0.2, z, 0.24, 0.4, 0.24, dark);
    box(x, y + 4.35, z, 0.34, 0.45, 0.34, dark);
    box(x, y + 4.35, z, 0.28, 0.36, 0.28, mat('lampGlass', '#e9e3c8', 0.3));
    walls.push({ a: [x - 0.1, z], b: [x + 0.1, z] });
  }
  return walls;

  function stonePost(x: number, z: number, h: number, tapered = false) {
    const y = roadY(x, z) + PAVE_H;
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

// Separate mapped pedestrian bridge655432306. The old generic renderer incorrectly
// enclosed this narrow deck with the road bridge's stone walls.
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
  const barriers: { a: P; b: P }[] = [];
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
