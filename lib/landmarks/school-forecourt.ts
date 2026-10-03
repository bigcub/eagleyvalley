import { grassTexture } from '../materials/landscape-materials';
import * as T from 'three';
import { inPoly, type P } from '../core/geo';
import { drape, strip, sweep } from '../core/mesh';
import type { Kit } from '../core/kit';
import { SCHOOL_FORECOURT as D } from '../world/layout';
import type { Surface } from '../world/surface';
export function schoolWorld(u: number, v: number): P {
  return [
    D.origin[0] + u * D.direction[0] + v * D.direction[1],
    D.origin[1] + u * D.direction[1] - v * D.direction[0],
  ];
}
export function schoolLocal(x: number, z: number): P {
  const dx = x - D.origin[0],
    dz = z - D.origin[1],
    a = D.direction[0],
    b = D.direction[1],
    q = a * a + b * b;
  return [(dx * a + dz * b) / q, (dx * b - dz * a) / q];
}
export function createSchoolForecourtPlan() {
  const kerb: P[] = [],
    back: P[] = [];
  for (let i = 1; i < D.kerb.length; i++) {
    const a = D.kerb[i - 1],
      b = D.kerb[i],
      n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25);
    for (let j = i === 1 ? 0 : 1; j <= n; j++) {
      const t = j / n;
      kerb.push(
        schoolWorld(
          T.MathUtils.lerp(a[0], b[0], t),
          T.MathUtils.lerp(a[1], b[1], t),
        ),
      );
      back.push(
        schoolWorld(
          T.MathUtils.lerp(D.back[i - 1][0], D.back[i][0], t),
          T.MathUtils.lerp(D.back[i - 1][1], D.back[i][1], t),
        ),
      );
    }
  }
  const outs = kerb.map((p, i): P => {
    const b = back[i],
      d = Math.hypot(b[0] - p[0], b[1] - p[1]);
    return [(b[0] - p[0]) / d, (b[1] - p[1]) / d];
  });
  return {
    kerb,
    back,
    outs,
    pavement: [...kerb, ...back.toReversed()],
    garden: D.garden.map((p) => schoolWorld(...p)),
  };
}
export type SchoolForecourtPlan = ReturnType<typeof createSchoolForecourtPlan>;
export function inSchoolPavement(x: number, z: number, p: SchoolForecourtPlan) {
  const [u, v] = schoolLocal(x, z);
  return u > -1 && u < 29 && v > -5 && v < 1 && inPoly(x, z, p.pavement);
}
export function inSchoolGarden(x: number, z: number, p: SchoolForecourtPlan) {
  const [u, v] = schoolLocal(x, z);
  return u >= 0 && u <= 25 && v >= -2.1 && v <= 1.5 && inPoly(x, z, p.garden);
}
export function addSchoolForecourt(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const p = surface.schoolForecourtPlan,
    y = surface.schoolPavementY;
  const lawn = kit.mat('schoolFrontLawn', '#6f8150');
  lawn.map = grassTexture();
  kit.batch(
    drape(p.garden, () => surface.schoolHouseBase - 0.13, 0.5),
    lawn,
  );
  // Close the exposed vertical earth under the raised lawn at each end.
  // The private entrance arrangement is still unresolved; this is ground fill.
  const earth = kit.mat('schoolGardenEarth', '#70694e');
  earth.side = T.DoubleSide;
  // The cut crosses coarse terrain cells beyond the lawn's exact outline.
  // A buried backing closes the underside while paving/lawn retain their levels.
  kit.batch(
    drape(
      [
        [-2, -5],
        [28, -5],
        [28, 2],
        [-2, 2],
      ].map(([u, v]) => schoolWorld(u, v)),
      (x, z) => surface.terrain(x, z) - 0.25,
      0.5,
    ),
    earth,
  );
  for (const u of [0, 25]) {
    const outside = u === 0 ? -0.01 : 25.01;
    for (let v = -2.1; v < 2; v += 0.25) {
      const end = Math.min(2, v + 0.25),
        a = schoolWorld(u, v),
        b = schoolWorld(u, end),
        ya = surface.terrain(...schoolWorld(outside, v)) - 0.2,
        yb = surface.terrain(...schoolWorld(outside, end)) - 0.2,
        top = (v: number) =>
          v <= 0
            ? surface.schoolHouseBase - 0.13
            : Math.max(
                surface.terrain(...schoolWorld(u, v)),
                surface.terrain(...schoolWorld(outside, v)),
              ),
        g = new T.BufferGeometry();
      g.setAttribute(
        'position',
        new T.Float32BufferAttribute(
          [
            a[0],
            ya,
            a[1],
            b[0],
            yb,
            b[1],
            b[0],
            top(end),
            b[1],
            a[0],
            top(v),
            a[1],
          ],
          3,
        ),
      );
      g.setAttribute(
        'uv',
        new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
      );
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.computeVertexNormals();
      kit.batch(g, earth);
    }
  }
  for (const [lo, hi] of [
    [D.seamEnds[0], D.seamEnds[1]],
    [D.seamEnds[2], D.seamEnds[3]],
  ]) {
    kit.batch(
      drape(
        [
          [lo, -5],
          [hi, -5],
          [hi, 2],
          [lo, 2],
        ].map(([u, v]) => schoolWorld(u, v)),
        (x, z) => {
          const [u, v] = schoolLocal(x, z);
          // Sample just outside the raised garden at its vertical end edge.
          const sampleU = hi === 0 ? Math.min(u, -0.002) : Math.max(u, 25.002);
          return surface.terrain(...schoolWorld(sampleU, v)) + 0.01;
        },
        0.25,
      ),
      lawn,
    );
  }
  const paving = kit.mat('schoolSlabPaving', '#bcb8a5');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#a9aa9c';
  ctx.fillRect(0, 0, 1024, 1024);
  for (let row = 0; row < 16; row++)
    for (let col = 0; col < 16; col++) {
      const shade = 145 + Math.sin(row * 13.7 + col * 9.1) * 11;
      ctx.fillStyle = `rgb(${shade + 7},${shade + 7},${shade})`;
      ctx.fillRect(col * 64 + 2, row * 64 + 2, 60, 60);
    }
  paving.map = new T.CanvasTexture(canvas);
  paving.map.wrapS = paving.map.wrapT = T.RepeatWrapping;
  paving.map.colorSpace = T.SRGBColorSpace;
  kit.batch(
    strip(
      p.back,
      p.kerb,
      p.kerb.map((q, i) => [y(...p.back[i]) + 0.07, y(...q) + 0.07]),
    ),
    paving,
  );
  kit.batch(
    sweep(p.kerb, p.outs, (i) => y(...p.kerb[i]), [
      [-0.08, 0],
      [-0.08, 0.07],
      [0.08, 0.07],
    ]),
    kit.m.kerb,
  );
  // Low retaining foundation meets the pavement grade below the existing rail.
  const wall = D.frontWall.map((q) => schoolWorld(...q)),
    a = wall[0],
    b = wall[1],
    n = 120;
  const path = Array.from(
    { length: n + 1 },
    (_, i): P => [
      T.MathUtils.lerp(a[0], b[0], i / n),
      T.MathUtils.lerp(a[1], b[1], i / n),
    ],
  );
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1],
      b = path[i],
      ya = y(...a) - 0.14,
      yb = y(...b) - 0.14,
      top = surface.schoolHouseBase + 0.05,
      g = new T.BoxGeometry(
        0.4,
        1,
        Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.01,
      ),
      v = g.getAttribute('position');
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let k = 0; k < v.count; k++) {
      const t = (v.getZ(k) + len / 2) / len,
        base = T.MathUtils.lerp(ya, yb, t);
      v.setY(k, T.MathUtils.lerp(base, top, v.getY(k) + 0.5));
    }
    g.rotateY(Math.atan2(b[0] - a[0], b[1] - a[1]));
    g.translate((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
    g.computeVertexNormals();
    kit.batch(g, kit.m.stone);
  }
  return [{ a, b }];
}
