import { SCHOOL_FRONT_OPENINGS as D } from '../world/layout';
import { slateMaterial, roofUV } from '../materials/building-surfaces';
import * as T from 'three';
import type { Kit } from '../core/kit';
type P = [number, number];

// OSM footprint 727404344, with roof and facade composition interpreted from
// Historic England 1388260 and Sarah Bowles' March 2024 photograph.
export function addSchoolHouse(
  kit: Kit,
  { base, points }: { base: number; points: P[] },
) {
  const { box, batch } = kit;
  const { stone, trim, dark, glass } = kit.m;
  const rot = -Math.atan2(0.427, 0.904),
    world = (u: number, v: number): P => [
      50.53 + u * 0.904 + v * 0.427,
      -98.6 + u * 0.427 - v * 0.904,
    ];
  const B = (
    u: number,
    y: number,
    v: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
  ) => {
    const [x, z] = world(u, v);
    box(x, base + y, z, w, h, d, m, rot);
  };
  // Local v points north-west. Transform each vertex explicitly to avoid reflected normals.
  function mesh(vertices: number[], indices: number[], material: T.Material) {
    const g = new T.BufferGeometry(),
      coords: number[] = [],
      uv: number[] = [];
    for (let i = 0; i < vertices.length; i += 3) {
      const [x, z] = world(vertices[i], vertices[i + 2]);
      coords.push(x, base + vertices[i + 1], z);
      uv.push(vertices[i] / 2, vertices[i + 1] / 2);
    }
    g.setAttribute('position', new T.Float32BufferAttribute(coords, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    if (material === slate) roofUV(g);
    batch(g, material);
  }
  const shape = new T.Shape(points.map((p) => new T.Vector2(p[0], -p[1])));
  const body = new T.ExtrudeGeometry(shape, {
    depth: 5.4,
    bevelEnabled: false,
  });
  body.rotateX(-Math.PI / 2);
  body.translate(0, base, 0);
  const uv = body.getAttribute('uv');
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
  batch(body, stone);
  const slate = slateMaterial();
  const gableStone = (stone as T.MeshStandardMaterial).clone();
  gableStone.side = T.DoubleSide;
  const dress = new T.MeshStandardMaterial({
    color: '#b9b098',
    roughness: 0.9,
    side: T.DoubleSide,
  });
  function beam(
    u1: number,
    y1: number,
    v1: number,
    u2: number,
    y2: number,
    v2: number,
    w: number,
    m: T.Material,
  ) {
    const a = world(u1, v1),
      b = world(u2, v2),
      start = new T.Vector3(a[0], base + y1, a[1]),
      end = new T.Vector3(b[0], base + y2, b[1]),
      delta = end.clone().sub(start),
      g = new T.BoxGeometry(w, delta.length(), w);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.normalize(),
      ),
    );
    g.translate(...start.add(end).multiplyScalar(0.5).toArray());
    batch(g, m);
  }
  function roof(
    u: number,
    v: number,
    w: number,
    d: number,
    eave: number,
    rise: number,
  ) {
    mesh(
      [
        u - w / 2,
        eave,
        v,
        u + w / 2,
        eave,
        v,
        u,
        eave + rise,
        v,
        u - w / 2,
        eave,
        v + d,
        u + w / 2,
        eave,
        v + d,
        u,
        eave + rise,
        v + d,
      ],
      [0, 1, 2, 3, 5, 4],
      gableStone,
    );
    mesh(
      [
        u - w / 2 - 0.18,
        eave,
        v - 0.18,
        u + w / 2 + 0.18,
        eave,
        v - 0.18,
        u,
        eave + rise,
        v - 0.18,
        u - w / 2 - 0.18,
        eave,
        v + d + 0.18,
        u + w / 2 + 0.18,
        eave,
        v + d + 0.18,
        u,
        eave + rise,
        v + d + 0.18,
      ],
      [0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2],
      slate,
    );
    for (const end of [v - 0.22, v + d + 0.22]) {
      beam(u - w / 2, eave, end, u, eave + rise, end, 0.2, dress);
      beam(u, eave + rise, end, u + w / 2, eave, end, 0.2, dress);
    }
    for (const side of [-1, 1])
      B(u + (side * w) / 2, eave - 0.05, v + d / 2, 0.13, 0.13, d, dark);
  }
  // Two advanced front wings and a lower recessed connecting range.
  roof(4.5, 0, 9, 17.1, 5.4, 5.6);
  roof(20.57, -0.12, 9.1, 17.22, 5.4, 5.6);
  mesh(
    [
      9, 5.4, 1.5, 16.05, 5.4, 1.5, 9, 8.4, 9.3, 16.05, 8.4, 9.3, 9, 5.4, 17.1,
      16.05, 5.4, 17.1,
    ],
    [0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4],
    slate,
  );
  // Three photographed front rooflights, rather than counts derived from span.
  function rooflight(
    u: number,
    v: number,
    w: number,
    d: number,
    offset: number,
    m: T.Material,
  ) {
    const v0 = v - d / 2,
      v1 = v + d / 2;
    const y0 = 5.4 + ((v0 - 1.5) * 3) / 7.8 + offset,
      y1 = 5.4 + ((v1 - 1.5) * 3) / 7.8 + offset;
    mesh(
      [
        u - w / 2,
        y0,
        v0,
        u + w / 2,
        y0,
        v0,
        u + w / 2,
        y1,
        v1,
        u - w / 2,
        y1,
        v1,
      ],
      [0, 1, 2, 0, 2, 3],
      m,
    );
  }
  for (const u of D.rooflights) {
    rooflight(u, D.rooflightV, D.width + 0.14, D.depth + 0.14, 0.025, dark);
    rooflight(
      u,
      D.rooflightV,
      D.width,
      D.depth,
      0.04,
      kit.mat('schoolRooflightGlass', '#afc1c8'),
    );
    rooflight(u, D.rooflightV, 0.035, D.depth, 0.05, trim);
  }
  // Rear linear hall has its own steep roof and pointed five-light end windows.
  mesh(
    [
      -3.2, 5.4, 16.9, 28.8, 5.4, 16.9, -3.2, 8.5, 19.5, 28.8, 8.5, 19.5, -3.2,
      5.4, 22.05, 28.8, 5.4, 22.05,
    ],
    [0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4],
    slate,
  );
  mesh(
    [
      -3.03, 5.4, 17.1, -3.03, 5.4, 21.86, -3.03, 8.5, 19.5, 28.61, 5.4, 17.1,
      28.61, 5.4, 21.86, 28.61, 8.5, 19.5,
    ],
    [0, 1, 2, 3, 5, 4],
    gableStone,
  );
  function slopedRooflight(
    u: number,
    v: number,
    width: number,
    depth: number,
    height: (u: number, v: number) => number,
  ) {
    const pane = (
      w: number,
      d: number,
      offset: number,
      material: T.Material,
    ) => {
      const corners = [
        [u - w / 2, v - d / 2],
        [u + w / 2, v - d / 2],
        [u + w / 2, v + d / 2],
        [u - w / 2, v + d / 2],
      ];
      mesh(
        corners.flatMap(([a, b]) => [a, height(a, b) + offset, b]),
        [0, 1, 2, 0, 2, 3],
        material,
      );
    };
    pane(width + 0.14, depth + 0.14, 0.025, dark);
    pane(width, depth, 0.04, kit.mat('schoolRooflightGlass', '#afc1c8'));
    pane(width, 0.035, 0.05, trim);
  }
  // Fitted to the existing east wing plane, not horizontal plates above it.
  const eastRoofY = (u: number) => 11 - ((u - 20.57) * 5.6) / 4.73;
  for (const [u, v] of D.eastRooflights)
    slopedRooflight(u, v, 0.8, 0.9, eastRoofY);
  slopedRooflight(
    ...D.hallRooflight,
    0.95,
    0.7,
    (_u, v) => 5.4 + ((v - 16.9) * 3.1) / 2.6,
  );
  function light(
    u: number,
    v: number,
    y: number,
    w: number,
    h: number,
    columns = 2,
  ) {
    B(u, y, v - 0.08, w + 0.28, h + 0.28, 0.16, dress);
    B(u, y, v - 0.18, w, h, 0.12, glass);
    for (const side of [-1, 1])
      B(u + (side * w) / 2, y, v - 0.27, 0.065, h, 0.07, trim);
    if (columns === 2) B(u, y, v - 0.27, 0.055, h, 0.07, trim);
    B(u, y, v - 0.27, w, 0.055, 0.07, trim);
    B(u, y - h / 2 - 0.15, v - 0.18, w + 0.45, 0.17, 0.35, dress);
  }
  for (const u of [4.5, 20.57]) {
    for (let k = -1; k <= 1; k++) {
      const h = k === 0 ? 3.75 : 2.95;
      light(u + k * 1.0, -0.15, 1.25 + h / 2, 0.78, h, 1);
      B(u + k, 1.25 + h + 0.32, -0.34, 1.08, 0.12, 0.18, dress);
    }
    // Narrow pointed recess with a dressed surround, rather than a triangle.
    const recess = D.gableRecess;
    const panel = (
      radius: number,
      bottom: number,
      rise: number,
      v: number,
      material: T.Material,
    ) => {
      const outline = [
        new T.Vector2(-radius, bottom),
        new T.Vector2(radius, bottom),
      ];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        outline.push(
          new T.Vector2(
            radius * (1 - t * t),
            recess.spring + rise * (1.2 * (1 - t) * t + t * t),
          ),
        );
      }
      for (let k = 11; k >= 0; k--) {
        const t = k / 12;
        outline.push(
          new T.Vector2(
            -radius * (1 - t * t),
            recess.spring + rise * (1.2 * (1 - t) * t + t * t),
          ),
        );
      }
      mesh(
        outline.flatMap((p) => [u + p.x, p.y, v]),
        T.ShapeUtils.triangulateShape(outline, []).flat(),
        material,
      );
    };
    panel(
      recess.radius + 0.09,
      recess.bottom - 0.1,
      recess.rise + 0.12,
      -0.24,
      dress,
    );
    panel(
      recess.radius,
      recess.bottom,
      recess.rise,
      -0.27,
      kit.mat('schoolGableRecess', '#615c4e'),
    );
    B(u, recess.bottom - 0.12, -0.28, 0.6, 0.12, 0.13, dress);
  }
  for (const u of [10.6, 14.2]) light(u, 1.68, 2.8, 1.35, 2.6);
  function archPanel(
    u: number,
    v: number,
    bottom: number,
    spring: number,
    radius: number,
    m: T.Material,
  ) {
    const outline = [
      new T.Vector2(-radius, bottom),
      new T.Vector2(radius, bottom),
    ];
    for (let i = 0; i <= 20; i++) {
      const a = (i * Math.PI) / 20;
      outline.push(
        new T.Vector2(Math.cos(a) * radius, spring + Math.sin(a) * radius),
      );
    }
    const faces = T.ShapeUtils.triangulateShape(outline, []).flat();
    mesh(
      outline.flatMap((p) => [u + p.x, p.y, v]),
      faces,
      m,
    );
  }
  const porchDoor = kit.mat('schoolPorchDoor', '#e0ded4');
  for (const u of D.porches) {
    B(u, 1.65, 0.8, 2.1, 3.3, 2.1, stone);
    roof(u, -0.25, 2.1, 2.1, 3.3, 1.65);
    archPanel(u, -0.39, 0.02, 2.03, 0.65, dress);
    archPanel(u, -0.42, 0.05, 2.03, 0.54, trim);
    archPanel(u, -0.45, 0.07, 2.03, 0.5, porchDoor);
    B(u, 2.86, -0.42, 1.55, 0.12, 0.16, dress);
    B(u, 3.06, -0.46, 0.18, 0.09, 0.08, dark);
  }
  // Only the exposed west porch side is supported by the oblique photograph.
  const sideWindow = D.porchSideWindow;
  B(
    sideWindow.u,
    sideWindow.y,
    sideWindow.v,
    0.12,
    sideWindow.height + 0.22,
    sideWindow.width + 0.22,
    dress,
  );
  B(
    sideWindow.u + 0.08,
    sideWindow.y,
    sideWindow.v,
    0.05,
    sideWindow.height,
    sideWindow.width,
    glass,
  );
  for (const side of [-1, 1])
    B(
      sideWindow.u + 0.12,
      sideWindow.y,
      sideWindow.v + (side * sideWindow.width) / 2,
      0.04,
      sideWindow.height,
      0.045,
      trim,
    );
  B(
    sideWindow.u + 0.12,
    sideWindow.y,
    sideWindow.v,
    0.04,
    0.045,
    sideWindow.width,
    trim,
  );
  B(
    sideWindow.u + 0.04,
    sideWindow.y - sideWindow.height / 2 - 0.12,
    sideWindow.v,
    0.24,
    0.12,
    sideWindow.width + 0.3,
    dress,
  );
  const east = D.eastWindows;
  for (const v of east.positions) {
    // Stepped architrave, white sash edges and one horizontal meeting rail.
    // The photograph does not support the former central vertical bar.
    B(east.u, east.y, v, 0.16, east.height + 0.5, east.width + 0.5, dress);
    B(
      east.u + 0.07,
      east.y,
      v,
      0.14,
      east.height + 0.3,
      east.width + 0.3,
      trim,
    );
    B(east.u + 0.14, east.y, v, 0.08, east.height, east.width, glass);
    for (const side of [-1, 1])
      B(
        east.u + 0.2,
        east.y,
        v + (side * east.width) / 2,
        0.06,
        east.height,
        0.065,
        trim,
      );
    for (const y of [
      east.y - east.height / 2,
      east.y,
      east.y + east.height / 2,
    ])
      B(east.u + 0.2, y, v, 0.06, 0.065, east.width, trim);
    B(
      east.u + 0.1,
      east.y - east.height / 2 - 0.18,
      v,
      0.35,
      0.14,
      east.width + 0.64,
      dress,
    );
    B(
      east.u + 0.04,
      east.y + east.height / 2 + 0.28,
      v,
      0.25,
      0.1,
      east.width + 0.64,
      dress,
    );
  }
  // Pointed five-light glazing to the old hall's exposed end.
  mesh(
    [
      28.72, 1.3, 17.6, 28.72, 1.3, 21.4, 28.72, 4.55, 21.4, 28.72, 6.8, 19.5,
      28.72, 4.55, 17.6,
    ],
    [0, 1, 2, 0, 2, 3, 0, 3, 4],
    glass,
  );
  for (let k = -2; k <= 2; k++) {
    const h = 5.25 - Math.abs(k) * 0.65;
    B(28.8, 1.3 + h / 2, 19.5 + k * 0.69, 0.09, h, 0.08, trim);
  }
  for (const y of [2.6, 3.85]) B(28.8, y, 19.5, 0.09, 0.08, 3.8, trim);
  for (const u of [0, 9, 16.05, 25.1]) B(u, 2.7, 0.03, 0.09, 5.4, 0.09, dark);
  // Low stone forecourt boundary with continuous slender iron railings.
  for (let u = 0; u < 25; u += 0.45) {
    // Reference shows continuous railing along the two porch fronts.
    B(u, 0.25, -2.1, 0.46, 0.5, 0.4, stone);
    B(u, 0.9, -2.1, 0.035, 1.1, 0.035, dark);
    for (const y of [0.56, 1.24]) B(u, y, -2.1, 0.46, 0.035, 0.035, dark);
  }
  for (const u of [0, 7.25, 9.55, 15.45, 17.75, 25]) {
    B(u, 0.95, -2.1, 0.4, 1.9, 0.4, stone);
    const cap = D.pierCap,
      w = cap.width / 2,
      d = cap.depth / 2;
    B(u, cap.eave - 0.04, -2.1, cap.width, 0.08, cap.depth, dress);
    mesh(
      [
        u - w,
        cap.eave,
        -2.1 - d,
        u + w,
        cap.eave,
        -2.1 - d,
        u,
        cap.eave + cap.rise,
        -2.1 - d,
        u - w,
        cap.eave,
        -2.1 + d,
        u + w,
        cap.eave,
        -2.1 + d,
        u,
        cap.eave + cap.rise,
        -2.1 + d,
      ],
      [0, 1, 2, 3, 5, 4, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2],
      dress,
    );
  }
}
