import * as T from 'three';
import type { Kit } from '../core/kit';
import type { P } from '../core/geo';
import { EAGLEY_HALL_BLOCK as B } from '../world/layout';
import { hallWorld } from './eagley-hall';

/** Modern red brick apartment block attached to the east of Eagley Hall
 * (remainder of OSM 549512305). Aug 2022 Street View cgRt7RN-SkuArMGhJI5aOw
 * headings 340/40 from the car-park road: three storeys, stepped south front,
 * flat roof with a dark coping, grey-framed wide and tall windows, stacked
 * steel-and-glass balconies, undercroft parking at the west end. EA 2022 DSM
 * puts the parapet about 10.3-11m above the car-park side. Openings only on
 * the photographed faces; bay rhythm and sizes are interpreted. */
export function addEagleyHallBlock(
  kit: Kit,
  {
    points,
    terrain,
  }: { points: P[]; terrain: (x: number, z: number) => number },
) {
  const brick = kit.mat('hallBlockBrick', '#ffcbb0');
  brick.map = kit.m.brick.map;
  const coping = kit.mat('hallBlockCoping', '#3d4243');
  const roof = kit.mat('hallBlockRoof', '#5b6061');
  const frame = kit.mat('hallBlockFrames', '#575e60', 0.6);
  const glass = kit.mat('hallBlockGlass', '#4e6469', 0.25);
  const steel = kit.mat('hallBlockSteel', '#6c7376', 0.5);
  const panel = kit.mat('hallBlockBalconyGlass', '#9fb3b6', 0.2);
  panel.transparent = true;
  panel.opacity = 0.35;
  const shade = kit.mat('hallBlockUndercroft', '#1f2322');

  const base = Math.min(...points.map((p) => terrain(...p)));
  const footing = base - 1.5;
  const top = base + B.parapet;
  const shape = new T.Shape(points.map(([x, z]) => new T.Vector2(x, -z)));
  // Courtyard hole, wound opposite to the outline.
  const { u, v } = B.courtyard;
  const court: P[] = [
    hallWorld(u[0], v[0]),
    hallWorld(u[0], v[1]),
    hallWorld(u[1], v[1]),
    hallWorld(u[1], v[0]),
  ];
  const signedArea = (q: P[]) =>
    q.reduce((s, a, i) => {
      const b = q[(i + 1) % q.length];
      return s + a[0] * -b[1] - b[0] * -a[1];
    }, 0);
  const hole =
    signedArea(court) * signedArea(points) > 0 ? [...court].reverse() : court;
  shape.holes.push(new T.Path(hole.map(([x, z]) => new T.Vector2(x, -z))));
  const walls = new T.ExtrudeGeometry(shape, {
    depth: top - footing,
    bevelEnabled: false,
  });
  walls.rotateX(-Math.PI / 2);
  walls.translate(0, footing, 0);
  const uv = walls.getAttribute('uv');
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
  kit.batch(walls, brick);
  const roofGeometry = new T.ShapeGeometry(shape);
  roofGeometry.rotateX(-Math.PI / 2);
  roofGeometry.translate(0, top + 0.01, 0);
  kit.batch(roofGeometry, roof);
  // Courtyard floor and coping round its walls.
  const courtCentre = hallWorld((u[0] + u[1]) / 2, (v[0] + v[1]) / 2);
  kit.polygon(
    [...court, court[0]],
    kit.m.paving,
    terrain(...courtCentre) + 0.03,
  );
  court.forEach((a, i) => {
    const b = court[(i + 1) % court.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    kit.box(
      (a[0] + b[0]) / 2,
      top - 0.17,
      (a[1] + b[1]) / 2,
      0.14,
      0.36,
      len + 0.1,
      coping,
      Math.atan2(b[0] - a[0], b[1] - a[1]),
    );
  });

  // Low wing against the north-east edge, seen from Hough Lane.
  const wing = B.lowWing;
  const wingBase = Math.min(...wing.points.map((p) => terrain(...p)));
  const wingShape = new T.Shape(
    wing.points.map(([x, z]) => new T.Vector2(x, -z)),
  );
  const wingWalls = new T.ExtrudeGeometry(wingShape, {
    depth: wingBase + wing.height - footing,
    bevelEnabled: false,
  });
  wingWalls.rotateX(-Math.PI / 2);
  wingWalls.translate(0, footing, 0);
  const wuv = wingWalls.getAttribute('uv');
  for (let i = 0; i < wuv.count; i++)
    wuv.setXY(i, wuv.getX(i) / 2, wuv.getY(i) / 2);
  kit.batch(wingWalls, brick);
  kit.polygon(
    [...wing.points, wing.points[0]],
    roof,
    wingBase + wing.height + 0.01,
  );
  {
    // Coping and the wide dark window on the Hough Lane (north-west) face.
    const [a, b] = [wing.points[1], wing.points[2]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const rot = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const t: P = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const n: P = [t[1], -t[0]];
    const out = (u: number, d: number): P => [
      a[0] + t[0] * u + n[0] * d,
      a[1] + t[1] * u + n[1] * d,
    ];
    const [wx, wz] = out(len * 0.55, 0.06);
    kit.box(wx, wingBase + 1.6, wz, 0.08, 1.0, 2.6, frame, rot);
    const [gx, gz] = out(len * 0.55, 0.1);
    kit.box(gx, wingBase + 1.6, gz, 0.03, 0.88, 2.48, glass, rot);
    wing.points.forEach((p, i) => {
      const q = wing.points[(i + 1) % wing.points.length];
      const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      kit.box(
        (p[0] + q[0]) / 2,
        wingBase + wing.height - 0.12,
        (p[1] + q[1]) / 2,
        0.14,
        0.3,
        l + 0.1,
        coping,
        Math.atan2(q[0] - p[0], q[1] - p[1]),
      );
    });
  }

  // Centroid decides which side of each edge is outside.
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length,
    cz = points.reduce((s, p) => s + p[1], 0) / points.length;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t: P = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    let n: P = [t[1], -t[0]];
    const mx = (a[0] + b[0]) / 2,
      mz = (a[1] + b[1]) / 2;
    if (n[0] * (cx - mx) + n[1] * (cz - mz) > 0) n = [-n[0], -n[1]];
    const rot = Math.atan2(t[0], t[1]);
    const at = (u: number, d: number): P => [
      a[0] + t[0] * u + n[0] * d,
      a[1] + t[1] * u + n[1] * d,
    ];
    const box = (
      u: number,
      y: number,
      d: number,
      w: number,
      h: number,
      depth: number,
      m: T.Material,
    ) => {
      const [x, z] = at(u, d);
      kit.box(x, base + y, z, depth, h, w, m, rot);
    };
    // Dark coping round every wall except the party wall with the hall.
    if (i !== points.length - 1)
      box(len / 2, B.parapet - 0.17, 0.04, len + 0.1, 0.36, 0.14, coping);
    if (!B.photographedEdges.includes(i) || len < 2.4) return;

    const bays = Math.max(1, Math.round(len / B.bay));
    for (let k = 0; k < bays; k++) {
      const u = ((k + 0.5) * len) / bays;
      const tall = (k + i) % 2 === 0;
      for (const [floor, y0] of B.floors.entries()) {
        if (floor === 0 && B.undercroftEdges.includes(i)) {
          // Undercroft parking: dark recess between brick piers.
          box(
            u,
            y0 + 1.15,
            0.02,
            Math.min(2.4, len / bays - 0.6),
            2.3,
            0.04,
            shade,
          );
          continue;
        }
        const w = tall ? 0.95 : Math.min(2.1, len / bays - 0.5),
          h = tall ? 1.85 : 0.9,
          sill = tall ? 0.55 : 1.2;
        box(u, y0 + sill + h / 2, 0.05, w + 0.12, h + 0.12, 0.08, frame);
        box(u, y0 + sill + h / 2, 0.09, w, h, 0.03, glass);
        if (!tall) box(u, y0 + sill + h / 2, 0.11, 0.05, h, 0.03, frame);
        // Stacked balconies on the tall-window bays of the upper floors.
        if (tall && floor > 0 && k % 2 === 0) {
          const depth = 1.1,
            width = 2.2;
          box(u, y0 + 0.08, depth / 2, width, 0.16, depth, steel);
          for (const side of [-1, 1])
            box(
              u + (side * width) / 2,
              y0 + 0.62,
              depth / 2,
              0.05,
              1.0,
              depth,
              steel,
            );
          box(u, y0 + 1.12, depth, width, 0.05, 0.05, steel);
          box(u, y0 + 0.62, depth, width - 0.1, 0.9, 0.02, panel);
        }
      }
    }
  });
}
