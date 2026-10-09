import * as T from 'three';
import type { Kit } from '../core/kit';
import { PASSAGE_BED as BED } from '../world/layout';

// Passage planting and props from the user's photos from No.3's front door,
// 7 October 2026 (left, right and straight ahead). Reference only; positions
// are scaled from the views and the door, not surveyed.
//  - Raised dry-stone bed: pieris with red new growth, box balls, ferns and
//    low shrubs; ivy curtains down the retaining wall above it.
//  - Between the bed's east end and the trellis: two terracotta pots and a
//    dark grey rattan storage box against the wall; Virginia creeper over
//    the trellis.
type WallZ = (x: number) => number;
/** The rendered retaining face stands 0.28m in front of passageWallZ
 * (level ray picks at X86-98, v0.3.158). */
const FACE = 0.28;

export function addBridgePassagePlanting(
  kit: Kit,
  {
    passageY,
    wallZ: lineZ,
    trellisX,
  }: { passageY: number; wallZ: WallZ; trellisX: number },
) {
  const wallZ = (x: number) => lineZ(x) - FACE;
  let seed = 2741;
  const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const mat = (name: string, colour: string, rough = 0.9) => {
    const m = kit.mat(name, colour, rough);
    m.side = T.DoubleSide;
    return m;
  };
  const boxGreen = [
    mat('passageBox1', '#34502a'),
    mat('passageBox2', '#41602f'),
  ];
  const pierisGreen = [
    mat('passagePieris1', '#3f5a2e'),
    mat('passagePieris2', '#4c6936'),
  ];
  const pierisRed = [
    mat('passagePierisRed', '#b5425a'),
    mat('passagePierisPink', '#cd7377'),
  ];
  const fern = mat('passageFern', '#5c7c33');
  const ivy = [mat('passageIvy1', '#2f4a27'), mat('passageIvy2', '#3c5a2e')];
  const creeper = [
    mat('passageCreeper1', '#a2a844'),
    mat('passageCreeper2', '#6f8a35'),
    mat('passageCreeper3', '#b0563a'),
  ];
  const card = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    m: T.Material,
  ) => {
    const g = new T.PlaneGeometry(w, h);
    g.rotateX((r() - 0.5) * 2.2);
    g.rotateY(r() * Math.PI * 2);
    g.translate(x, y, z);
    kit.batch(g, m);
  };
  /** Dense clipped ball of small leaves. */
  const boxBall = (x: number, z: number, y: number, radius: number) => {
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2,
        e = Math.acos(1 - r() * 1.6),
        d = radius * (0.85 + r() * 0.15);
      card(
        x + Math.cos(a) * Math.sin(e) * d,
        y + radius * 0.85 + Math.cos(e) * d * 0.9,
        z + Math.sin(a) * Math.sin(e) * d,
        0.12,
        0.1,
        boxGreen[i % 2],
      );
    }
  };
  /** Pieris: loose upright shrub, red-pink young leaves at the top. */
  const pieris = (x: number, z: number, y: number, height: number) => {
    for (let i = 0; i < 260; i++) {
      const t = Math.pow(r(), 0.7),
        a = r() * Math.PI * 2,
        spread = 0.25 + 0.35 * Math.sin(t * Math.PI * 0.9);
      const top = t > 0.78 && r() < 0.45;
      card(
        x + Math.cos(a) * spread * r(),
        y + 0.1 + t * height,
        z + Math.sin(a) * spread * r(),
        0.16,
        0.07,
        top ? pierisRed[i % 2] : pierisGreen[i % 2],
      );
    }
  };
  /** Fern: arching fronds from a crown. */
  const fernClump = (x: number, z: number, y: number, size: number) => {
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + r() * 0.4;
      const g = new T.PlaneGeometry(0.16 * size, 0.7 * size);
      g.translate(0, 0.35 * size, 0);
      g.rotateX(-0.9 - r() * 0.3);
      g.rotateY(a);
      g.translate(x, y, z);
      kit.batch(g, fern);
    }
  };

  // Bed planting, east to west (straight-ahead and right views).
  const top = passageY + BED.height - 0.05;
  const bedZ = (x: number, inset: number) => lineZ(x) - inset;
  const plan: [number, 'pieris' | 'box' | 'fern', number, number][] = [
    [89.15, 'pieris', 0.55, 1.25],
    [88.45, 'box', 0.5, 0.36],
    [87.9, 'fern', 0.45, 1],
    [87.2, 'box', 0.55, 0.42],
    [86.55, 'pieris', 0.5, 1.1],
    [85.95, 'fern', 0.6, 1.1],
    [85.35, 'box', 0.5, 0.34],
    [84.6, 'pieris', 0.55, 0.95],
    [83.95, 'box', 0.45, 0.38],
    [83.3, 'fern', 0.5, 0.9],
    [82.75, 'box', 0.5, 0.3],
  ];
  for (const [x, kind, inset, size] of plan) {
    const z = bedZ(x, inset);
    if (kind === 'box') boxBall(x, z, top, size);
    else if (kind === 'pieris') pieris(x, z, top, size);
    else fernClump(x, z, top, size);
  }
  // Ivy spilling over the coping and hanging in ragged tongues (ahead view).
  for (const [xc, half, y1] of [
    [90.0, 0.75, 2.6],
    [86.4, 0.8, 2.9],
  ]) {
    // A few tongues of different lengths make the lower edge ragged.
    const tongues = Array.from({ length: 5 }, () => [
      xc + (r() - 0.5) * half * 1.8,
      0.25 + r() * 0.35,
      0.5 + r() * 0.5,
    ]);
    for (let i = 0; i < 700; i++) {
      const [tx, tw, reach] = tongues[i % tongues.length];
      const drop = Math.pow(r(), 1.4) * reach;
      const width = tw * (1 - drop * 0.6) + (1 - drop) * half * 0.6;
      const x = tx + (r() - 0.5) * 2 * width,
        y = passageY + y1 + 0.1 - drop * (y1 - BED.height);
      const g = new T.PlaneGeometry(0.11, 0.1);
      g.rotateZ(r() * Math.PI);
      g.rotateY((r() - 0.5) * 0.6);
      g.translate(x, y, wallZ(x) - 0.02 - r() * 0.09);
      kit.batch(g, ivy[i % 2]);
    }
  }

  // Pots and box between the bed and the trellis (left and ahead views).
  const terracotta = kit.mat('passageTerracotta', '#a8673f', 0.75);
  const earth = kit.mat('passagePotEarth', '#3e3428');
  const pot = (x: number, radius: number, height: number, m: T.Material) => {
    const z = wallZ(x) - radius - 0.06;
    const body = new T.CylinderGeometry(radius, radius * 0.72, height, 18);
    body.translate(x, passageY + height / 2, z);
    kit.batch(body, m);
    const rim = new T.TorusGeometry(radius, 0.022, 5, 18);
    rim.rotateX(Math.PI / 2);
    rim.translate(x, passageY + height, z);
    kit.batch(rim, m);
    const soil = new T.CircleGeometry(radius - 0.02, 16);
    soil.rotateX(-Math.PI / 2);
    soil.translate(x, passageY + height - 0.05, z);
    kit.batch(soil, earth);
  };
  pot(89.95, 0.2, 0.36, terracotta);
  pot(90.5, 0.24, 0.42, terracotta);
  // Dark grey rattan-effect storage box.
  {
    const x = 91.35,
      z = wallZ(x) - 0.3;
    const rattan = kit.mat('passageStorageBox', '#3a404a', 0.85);
    kit.box(x, passageY + 0.26, z, 0.78, 0.52, 0.45, rattan);
    kit.box(x, passageY + 0.535, z, 0.8, 0.04, 0.47, rattan);
    for (let k = 1; k < 6; k++)
      kit.box(x, passageY + k * 0.085, z - 0.23, 0.78, 0.008, 0.01, kit.m.dark);
  }
  // Virginia creeper over the trellis: densest at the top, spilling above,
  // thinner low down so the lattice shows; mostly green with some yellow and
  // a few red leaves (left view).
  for (let i = 0; i < 900; i++) {
    const v = Math.pow(r(), 0.6),
      y = passageY + 0.7 + v * 2.25,
      spread = 0.55 + v * 0.75;
    if (r() > 0.35 + v * 0.65) continue;
    const x = trellisX + (r() - 0.5) * 2 * spread;
    const g = new T.PlaneGeometry(0.1, 0.09);
    g.rotateZ(r() * Math.PI);
    g.rotateY((r() - 0.5) * 0.9);
    g.translate(x, y, wallZ(x) - 0.08 - r() * 0.14);
    const pick = r();
    kit.batch(g, creeper[pick < 0.03 ? 2 : pick < 0.45 ? 0 : 1]);
  }
}
