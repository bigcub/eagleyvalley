import {
  slateMaterial,
  roofUV,
  masonryUV,
} from '../materials/building-surfaces';
import { masonryTexture } from '../materials/masonry-texture';
import * as T from 'three';
import type { Kit } from '../core/kit';
type P = [number, number];
// Eagley Hall: the stone western part of OSM footprint 549512305 at the Hough Lane /
// Threadfold Way junction. Evidence: Google Street View June 2024 (DQl_iPlCOrF2ekkB6nUQbQ,
// headings 62-65) from the junction; August 2022 panoramas on Hough Lane (138/139 Hough Ln)
// and on the car-park service road; Google aerial imagery for the roof outline.
// Observed: coursed rock-faced sandstone with smooth bands and dressings, three storeys,
// dark window frames, a corner tower rising above the eaves with shaped gables and a round
// window, slate hipped roof, stepped entrance porch on the car-park side, "Eagley Hall" board
// on the Hough Lane face, and a modern red-brick apartment block attached to the east.
// Interpreted, not measured: plan depth (16 m), storey heights, bay spacing, tower size,
// porch position. The south-east face is hidden by the brick block and is left plain.
export const HALL_ORIGIN: P = [156.3, -22.6];
export const HALL_U: P = [0.643, -0.765]; // along the Hough Lane facade, south corner to north-east
export const HALL_V: P = [0.766, 0.643]; // along the car-park facade, south corner to south-east
export const HALL_W = 19.6,
  HALL_D = 16;
export function hallWorld(u: number, v: number): P {
  return [
    HALL_ORIGIN[0] + u * HALL_U[0] + v * HALL_V[0],
    HALL_ORIGIN[1] + u * HALL_U[1] + v * HALL_V[1],
  ];
}
export function hallCorners(): P[] {
  return [
    hallWorld(0, 0),
    hallWorld(HALL_W, 0),
    hallWorld(HALL_W, HALL_D),
    hallWorld(0, HALL_D),
  ];
}
// Remaining part of the mapped footprint, handled as a flat-roofed brick block.
export function hallBrickPolygon(): P[] {
  const c = hallWorld(HALL_W, HALL_D),
    d = hallWorld(0, HALL_D);
  return [
    d,
    [179, -3.5],
    [182, -7.1],
    [186, -3.7],
    [189.2, -7.4],
    [193, -4.2],
    [199.7, -12.1],
    [195.6, -15.5],
    [199, -19.5],
    [177.8, -37.3],
    [174.3, -33.1],
    c,
  ];
}

export function addEagleyHall(kit: Kit, base: number) {
  const { batch } = kit;
  const { glass } = kit.m;
  const rot = Math.atan2(-HALL_U[1], HALL_U[0]);
  const W = HALL_W,
    D = HALL_D,
    eave = 10.4;
  const rockMap = masonryTexture();
  const rock = new T.MeshStandardMaterial({
    color: '#b5ad98',
    map: rockMap,
    bumpMap: rockMap,
    bumpScale: 0.16,
    roughness: 0.96,
  });
  const dress = new T.MeshStandardMaterial({
    color: '#cdc5b0',
    roughness: 0.85,
    side: T.DoubleSide,
  });
  const frame = new T.MeshStandardMaterial({
    color: '#2b2e2c',
    roughness: 0.6,
  });
  const pipe = new T.MeshStandardMaterial({ color: '#24262a', roughness: 0.7 });
  const board = new T.MeshStandardMaterial({
    color: '#e9e4d6',
    roughness: 0.7,
  });
  const slate = slateMaterial();
  const world3 = (u: number, y: number, v: number) => {
    const [x, z] = hallWorld(u, v);
    return new T.Vector3(x, base + y, z);
  };
  const interior = world3(W / 2, 5, D / 2),
    towerCentre = world3(2.65, 11.5, 2.65);
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
    uvm = 0,
  ) => {
    const g = new T.BoxGeometry(w, h, d);
    g.rotateY(rot);
    const p = world3(u, y, v);
    g.translate(p.x, p.y, p.z);
    if (uvm) masonryUV(g, uvm);
    batch(g, m);
  };
  // Planar polygon in local (u,y,v); winding is flipped so the normal faces away from `inside`.
  function face(pts: number[][], m: T.Material, inside = interior, uvm = 2) {
    const w = pts.map(([u, y, v]) => world3(u, y, v));
    const n = new T.Vector3().crossVectors(
      w[1].clone().sub(w[0]),
      w[2].clone().sub(w[0]),
    );
    const c = w
      .reduce((s, p) => s.add(p), new T.Vector3())
      .multiplyScalar(1 / w.length);
    if (n.dot(c.clone().sub(inside)) < 0) w.reverse();
    const pos: number[] = [];
    for (let i = 1; i < w.length - 1; i++)
      for (const p of [w[0], w[i], w[i + 1]]) pos.push(p.x, p.y, p.z);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    if (m === slate) roofUV(g);
    else masonryUV(g, uvm);
    batch(g, m);
  }
  function beam(a: number[], b: number[], w: number, m: T.Material) {
    const s = world3(a[0], a[1], a[2]),
      e = world3(b[0], b[1], b[2]),
      delta = e.clone().sub(s),
      g = new T.BoxGeometry(w, delta.length(), w);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.clone().normalize(),
      ),
    );
    const mid = s.clone().add(e).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    batch(g, m);
  }
  function disc(
    u: number,
    y: number,
    v: number,
    outward: number,
    r: number,
    m: T.Material,
    ring = false,
  ) {
    const g = ring
      ? new T.RingGeometry(r, r + 0.16, 28)
      : new T.CircleGeometry(r, 28);
    g.rotateY(outward);
    const p = world3(u, y, v);
    g.translate(p.x, p.y, p.z);
    batch(g, m);
  }
  const outNW = rot + Math.PI,
    outSW = rot - Math.PI / 2;

  // Main body with a buried foundation so the lower ground stays closed on the falling side.
  B(W / 2, (eave - 1.8) / 2, D / 2, W, eave + 1.8, D, rock, 3);
  // Smooth plinth, sill bands and eaves cornice.
  B(W / 2, 0.32, D / 2, W + 0.16, 0.64, D + 0.16, dress);
  for (const y of [1.12, 4.48, 7.9])
    B(W / 2, y, D / 2, W + 0.12, 0.3, D + 0.12, dress);
  B(W / 2, eave - 0.18, D / 2, W + 0.34, 0.36, D + 0.34, dress);

  // Corner tower, slightly proud, rising above the eaves with a gable to each street face.
  B(2.65, 5.5, 2.65, 5.4, 14.4, 5.4, rock, 3);
  for (const y of [1.12, 4.48, 7.9, eave - 0.18])
    B(2.65, y, 2.65, 5.56, y === eave - 0.18 ? 0.36 : 0.3, 5.56, dress);
  face(
    [
      [-0.05, 12.7, -0.05],
      [-0.05, 12.7, 5.35],
      [-0.05, 14.7, 2.65],
    ],
    rock,
    towerCentre,
    3,
  );
  face(
    [
      [-0.05, 12.7, -0.05],
      [5.35, 12.7, -0.05],
      [2.65, 14.7, -0.05],
    ],
    rock,
    towerCentre,
    3,
  );
  for (const [a, b] of [
    [
      [-0.05, 12.7, -0.05],
      [-0.05, 14.7, 2.65],
    ],
    [
      [-0.05, 14.7, 2.65],
      [-0.05, 12.7, 5.35],
    ],
    [
      [-0.05, 12.7, -0.05],
      [2.65, 14.7, -0.05],
    ],
    [
      [2.65, 14.7, -0.05],
      [5.35, 12.7, -0.05],
    ],
  ])
    beam(a, b, 0.24, dress);
  B(2.65, 12.72, 5.35, 5.6, 0.22, 0.3, dress);
  B(5.35, 12.72, 2.65, 0.3, 0.22, 5.6, dress);
  face(
    [
      [0.35, 12.7, 0.35],
      [4.95, 12.7, 0.35],
      [2.65, 14.9, 2.65],
    ],
    slate,
    towerCentre,
  );
  face(
    [
      [4.95, 12.7, 0.35],
      [4.95, 12.7, 4.95],
      [2.65, 14.9, 2.65],
    ],
    slate,
    towerCentre,
  );
  face(
    [
      [4.95, 12.7, 4.95],
      [0.35, 12.7, 4.95],
      [2.65, 14.9, 2.65],
    ],
    slate,
    towerCentre,
  );
  face(
    [
      [0.35, 12.7, 4.95],
      [0.35, 12.7, 0.35],
      [2.65, 14.9, 2.65],
    ],
    slate,
    towerCentre,
  );
  disc(-0.12, 13.25, 2.65, outSW, 0.42, dress, true);
  disc(-0.1, 13.25, 2.65, outSW, 0.43, glass);
  disc(2.65, 13.25, -0.12, outNW, 0.42, dress, true);
  disc(2.65, 13.25, -0.1, outNW, 0.43, glass);

  // Hipped slate roof with a short ridge along the Hough Lane axis.
  const E00 = [-0.35, eave, -0.35],
    E10 = [W + 0.35, eave, -0.35],
    E11 = [W + 0.35, eave, D + 0.35],
    E01 = [-0.35, eave, D + 0.35],
    R0 = [D / 2, 13.3, D / 2],
    R1 = [W - D / 2, 13.3, D / 2];
  face([E00, E10, R1, R0], slate);
  face([E01, E11, R1, R0], slate);
  face([E00, R0, E01], slate);
  face([E10, R1, E11], slate);

  // Windows sit proud of the solid wall: smooth surround, dark frame, glazing, mullion and transom.
  type Side = 'NW' | 'SW' | 'NE';
  function win(
    side: Side,
    along: number,
    y: number,
    w: number,
    h: number,
    lights: number,
  ) {
    const at = (off: number): [number, number] =>
      side === 'NW'
        ? [along, -off]
        : side === 'SW'
          ? [-off, along]
          : [W + off, along];
    const box = (
      off: number,
      y: number,
      width: number,
      height: number,
      depth: number,
      m: T.Material,
    ) => {
      const [u, v] = at(off);
      if (side === 'NW') B(u, y, v, width, height, depth, m);
      else B(u, y, v, depth, height, width, m);
    };
    box(0.05, y, w + 0.36, h + 0.36, 0.1, dress);
    box(0.09, y, w, h, 0.12, frame);
    box(0.13, y, w - 0.14, h - 0.14, 0.08, glass);
    if (lights > 1)
      for (let i = 1; i < lights; i++) {
        const [u, v] = at(0.15);
        const d = (i / lights - 0.5) * w;
        if (side === 'NW') B(u + d, y, v, 0.07, h - 0.1, 0.1, frame);
        else B(u, y, v + d, 0.1, h - 0.1, 0.07, frame);
      }
    box(0.15, y + h * 0.18, w - 0.1, 0.07, 0.1, frame);
    box(0.08, y + h / 2 + 0.17, w + 0.5, 0.32, 0.16, dress);
    box(0.1, y - h / 2 - 0.08, w + 0.4, 0.15, 0.22, dress);
  }
  const floorsY = [2.3, 5.45, 8.85],
    floorsH = [1.9, 2.3, 2.2];
  // Hough Lane face: tower bay plus four bays.
  for (let f = 0; f < 3; f++) {
    win('NW', 2.65, floorsY[f], 1.8, floorsH[f], 2);
    for (const u of [7.1, 10.7, 14.3, 17.9])
      win('NW', u, floorsY[f], 1.7, floorsH[f], 2);
  }
  B(2.65, 3.62, -0.09, 2.6, 0.5, 0.12, board);
  // Car-park face: tower bay, two bays and the entrance bay behind a single-storey porch.
  for (let f = 0; f < 3; f++) {
    win('SW', 2.65, floorsY[f], 1.8, floorsH[f], 2);
    for (const v of [7.1, 14.3]) win('SW', v, floorsY[f], 1.7, floorsH[f], 2);
    if (f > 0) win('SW', 10.7, floorsY[f], 1.7, floorsH[f], 2);
  }
  B(-0.9, 2.1, 10.7, 1.8, 4.2, 3.0, rock, 3);
  B(-0.9, 4.32, 10.7, 2.1, 0.26, 3.3, dress);
  B(-0.9, 0.3, 10.7, 1.96, 0.6, 3.16, dress);
  B(-1.86, 1.2, 10.7, 0.12, 2.3, 1.3, frame);
  B(
    -1.9,
    1.15,
    10.7,
    0.08,
    2.2,
    1.1,
    new T.MeshStandardMaterial({ color: '#1f2a2b', roughness: 0.6 }),
  );
  disc(-1.86, 3.25, 10.7, outSW, 0.5, dress, true);
  disc(-1.84, 3.25, 10.7, outSW, 0.5, frame, true);
  disc(-1.86, 3.25, 10.7, outSW, 0.42, glass);
  B(-2.15, 0.16, 10.7, 0.7, 0.32, 2.0, dress);
  B(-2.7, 0.06, 10.7, 0.5, 0.12, 2.2, dress);
  // North-east gable end: two bays on the part not hidden by the brick block.
  for (let f = 0; f < 3; f++)
    for (const v of [2.2, 5.0]) win('NE', v, floorsY[f], 1.5, floorsH[f], 2);
  // Downpipes at the tower junctions and the north-east corner.
  for (const [u, v] of [
    [-0.14, 5.55],
    [5.55, -0.14],
    [W + 0.14, 7.2],
    [-0.14, 16.2],
  ])
    B(u, eave / 2, v, 0.13, eave, 0.13, pipe);
}
