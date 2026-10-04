import * as T from 'three';
import type { Kit } from '../core/kit';
import {
  BRIDGE_REAR_OPENINGS as R,
  BRIDGE_PASSAGE_RISE,
  BRIDGE_EAVES_ABOVE_PASSAGE,
} from '../world/layout';
type P = [number, number];
// Existing five garden divisions, not surveyed property boundaries. IMG_8274 confirms
// one pair of French doors per house and solid timber dividers at the patios.
export const rearDivisions = [78.79, 83, 88.7, 94, 100.3, 106.95];
export const rearWallZ = (x: number) => 9.43 + (x - 78.79) * (1.17 / 28.16);
export function rearFormation(
  x: number,
  z: number,
  base: number,
  natural: number,
) {
  if (x < rearDivisions[0] || x > rearDivisions[5]) return undefined;
  const depth = rearWallZ(x) - z;
  if (depth < 0 || depth > 4.5) return undefined;
  return T.MathUtils.lerp(
    base,
    natural,
    T.MathUtils.smoothstep(depth, 2.9, 4.5),
  );
}
export function addBridgeRear(kit: Kit, base: number) {
  const { box, batch } = kit;
  const { stone, dark, glass } = kit.m;
  const white = new T.MeshStandardMaterial({
    color: '#eeeae2',
    roughness: 0.72,
  });
  const metal = new T.MeshStandardMaterial({
    color: '#8f8974',
    metalness: 0.65,
    roughness: 0.4,
  });
  // Painted dark blue-grey in the user's view from No.3; earlier IMG_8274 grey.
  const timber = new T.MeshStandardMaterial({ color: '#363c46', roughness: 1 });
  const timberLight = new T.MeshStandardMaterial({
    color: '#414854',
    roughness: 1,
  });
  const lanternGlass = new T.MeshStandardMaterial({
    color: '#9b9a83',
    roughness: 0.6,
  });
  const joints = new T.MeshStandardMaterial({ color: '#666657', roughness: 1 });
  const slabs = ['#aba28a', '#a59e89', '#b2aa93', '#989580'].map(
    (color) => new T.MeshStandardMaterial({ color, roughness: 1 }),
  );
  const rot = -Math.atan(1.17 / 28.16),
    floor = base + 0.13;
  // North-facing layers move north toward the viewer, so glazing/bars are not buried.
  const B = (
    x: number,
    y: number,
    w: number,
    h: number,
    m: T.Material,
    offset = 0.12,
    d = 0.055,
  ) => box(x, floor + y, rearWallZ(x) - offset, w, h, d, m, rot);
  function opening(x: number, width: number, height: number, bottom: number) {
    B(x, bottom + height / 2, width + 0.18, height + 0.15, dark, 0.06, 0.09);
    B(x, bottom + height / 2, width, height, white, 0.13, 0.12);
    B(x, bottom + height / 2, width - 0.15, height - 0.14, glass, 0.205, 0.045);
    B(x, bottom + height + 0.18, width + 0.42, 0.29, stone, 0.1, 0.23);
    B(x, bottom - 0.055, width + 0.28, 0.13, stone, 0.2, 0.36);
  }
  for (let i = 0; i < 5; i++) {
    const a = rearDivisions[i],
      b = rearDivisions[i + 1],
      span = b - a;
    // The photo shows a sash beside each paired door. Spacing within each plot is inferred.
    // No.5 (west, beside the engine house) is narrower: French doors only (user).
    const { door, window } = R.homes[i];
    opening(door, 1.5, 2.65, 0.08);
    // Two glazed leaves, central meeting stiles, low rails and separate transom.
    B(door, 1.13, 0.09, 2.1, white, 0.255);
    for (const side of [-1, 1]) {
      const x = door + side * 0.365;
      B(x, 1.1, 0.034, 1.87, white, 0.257);
      for (let row = 1; row <= 5; row++)
        B(x, 0.2 + row * 0.34, 0.65, 0.03, white, 0.257);
      B(x, 0.18, 0.66, 0.18, white, 0.26);
      B(door + side * 0.105, 1.02, 0.025, 0.19, metal, 0.295, 0.045);
    }
    B(door, 2.22, 1.42, 0.1, white, 0.26);
    for (const dx of [-0.45, -0.15, 0.15, 0.45])
      B(door + dx, 2.49, 0.025, 0.4, white, 0.255);
    // Tall neighbouring multi-pane sash, above the patio rather than down to the ground.
    if (window !== null) {
      const { bottom, height } = R.groundSash;
      const cy = bottom + height / 2;
      opening(window, 1.4, height, bottom);
      for (const dx of [-0.32, 0, 0.32])
        B(window + dx, cy, 0.028, height - 0.14, white, 0.255);
      for (let row = 1; row < 6; row++)
        B(window, bottom + (row * height) / 6, 1.26, 0.027, white, 0.255);
      B(window, cy, 1.34, 0.07, white, 0.27);
    }
    // One shared centre schedule keeps sashes above their ground-floor groups.
    for (const x of window === null ? [door] : [door, window])
      for (const row of R.upperRows) {
        opening(x, 1.4, row.height, row.bottom);
        const cy = row.bottom + row.height / 2;
        for (const dx of [-0.32, 0, 0.32])
          B(x + dx, cy, 0.028, row.height - 0.14, white, 0.255);
        for (let k = 1; k < 6; k++)
          B(x, row.bottom + (row.height * k) / 6, 1.26, 0.027, white, 0.255);
        B(x, cy, 1.34, 0.07, white, 0.27);
      }
    // Black lantern above the door, as in the photograph.
    B(door, 3.1, 0.12, 0.32, dark, 0.18, 0.12);
    B(door, 3.12, 0.11, 0.19, lanternGlass, 0.27, 0.08);
    const cap = new T.ConeGeometry(0.115, 0.14, 4);
    cap.rotateY(Math.PI / 4);
    cap.translate(door, floor + 3.3, rearWallZ(door) - 0.23);
    batch(cap, dark);
    // Weathered rectangular flags with dark joints. No user photo is used as a texture.
    const depth = 2.85;
    box(
      (a + b) / 2,
      floor - 0.08,
      rearWallZ((a + b) / 2) - depth / 2,
      span - 0.08,
      0.12,
      depth,
      joints,
      rot,
    );
    const columns = Math.ceil(span / 0.72),
      rows = 4;
    for (let c = 0; c < columns; c++)
      for (let r = 0; r < rows; r++) {
        const x = a + ((c + 0.5) * span) / columns,
          z = rearWallZ(x) - ((r + 0.5) * depth) / rows;
        box(
          x,
          floor - 0.035,
          z,
          span / columns - 0.018,
          0.065,
          depth / rows - 0.018,
          slabs[(c * 3 + r + i) % slabs.length],
          rot,
        );
      }
  }
  const barriers: { a: P; b: P }[] = [];
  // Four solid grey timber screens, one at each shared patio edge, extending to lawn.
  for (const x of rearDivisions.slice(1, -1)) {
    const wall = rearWallZ(x),
      end = wall - 3.05;
    for (let k = 0; k < 23; k++) {
      const z = wall - 0.07 - ((k + 0.5) * 2.98) / 23;
      box(
        x,
        floor + 0.83,
        z,
        0.07,
        1.66,
        2.98 / 23 - 0.003,
        k % 4 === 0 ? timberLight : timber,
      );
    }
    for (const z of [wall - 0.08, end])
      box(x, floor + 0.89, z, 0.12, 1.78, 0.12, timber);
    box(x, floor + 1.69, (wall + end) / 2, 0.12, 0.065, 3.05, timberLight);
    for (const y of [0.25, 1.25])
      box(x + 0.055, floor + y, (wall + end) / 2, 0.06, 0.09, 3, timber);
    barriers.push({ a: [x, wall - 0.06], b: [x, end] });
  }
  const gutterY = BRIDGE_PASSAGE_RISE + BRIDGE_EAVES_ABOVE_PASSAGE - 0.13;
  B(
    (rearDivisions[0] + rearDivisions[5]) / 2,
    gutterY,
    rearDivisions[5] - rearDivisions[0],
    0.12,
    dark,
    0.22,
    0.14,
  );
  // Only No.3's rear pipe, from patio level to the eaves gutter (user).
  B(
    R.downpipeX,
    (gutterY + 0.08) / 2,
    0.075,
    gutterY - 0.08,
    dark,
    0.18,
    0.075,
  );
  for (const y of [1, 3.5, 6, 8.5])
    B(R.downpipeX, y, 0.11, 0.045, dark, 0.18, 0.1);
  B(R.downpipeX, gutterY - 0.03, 0.1, 0.12, dark, 0.23, 0.17);
  return barriers;
}
