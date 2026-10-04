import * as T from 'three';
import type { Kit } from '../core/kit';
import {
  inPoly,
  nearest,
  type Feature,
  type P,
  type Segment,
} from '../core/geo';
import {
  masonryUV,
  roofUV,
  slateMaterial,
} from '../materials/building-surfaces';
import { housingBrick } from '../materials/housing-brick';
import {
  STREET_HOUSES,
  type StreetHouse,
  type StreetHouseFace,
  type StreetHouseStyle,
} from '../world/layout';

// Storey heights and roof pitches are typical for each type, not measured.
const TYPE: Record<
  StreetHouseStyle,
  { floors: number[]; pitch: number; maxRise: number }
> = {
  estate: { floors: [2.65, 2.6], pitch: 0.72, maxRise: 3.3 },
  townhouse: { floors: [2.7, 2.75, 2.6], pitch: 0.62, maxRise: 3 },
  terrace: { floors: [2.85, 2.75], pitch: 0.68, maxRise: 2.9 },
  cottage: { floors: [2.7], pitch: 0.78, maxRise: 2.6 },
  pub: { floors: [3, 2.85], pitch: 0.68, maxRise: 3 },
  cottageRow: { floors: [2.7, 2.5], pitch: 0.7, maxRise: 2.7 },
};

const FRONT_ROADS = /^(Threadfold Way|Cottonfields|Hough Lane|School Street)$/;
export const streetFrontRoads = (roadSeg: Segment[]) =>
  roadSeg.filter(
    (s) =>
      FRONT_ROADS.test(s.f.name) &&
      !['cycleway', 'path', 'footway', 'service'].includes(s.f.tags.highway),
  );

/** Typed houses on outer Threadfold Way, Cottonfields and Hough Lane. */
export function addStreetHouses(
  kit: Kit,
  {
    buildings,
    ground,
    terrain,
    roadSeg,
  }: {
    buildings: Feature[];
    ground: (x: number, z: number) => number;
    terrain: (x: number, z: number) => number;
    roadSeg: Segment[];
  },
) {
  const { box } = kit;
  const fronts = streetFrontRoads(roadSeg);
  const stone = (name: string, colour: string) => {
    const m = kit.mat(name, colour);
    m.map = m.bumpMap = kit.m.stone.map;
    m.bumpScale = 0.04;
    return m;
  };
  const brick = (name: string, colour: string) => {
    const m = housingBrick(kit, name, 'red');
    m.color.set(colour);
    return m;
  };
  const faces: Record<StreetHouseFace, T.MeshStandardMaterial> = {
    buff: stone('streetBuffStone', '#f7e3b2'),
    grit: stone('streetGritstone', '#d9ceb6'),
    red: brick('streetRedBrick', '#ffd2bd'),
    dark: brick('streetDarkBrick', '#a08e84'),
    white: kit.mat('streetWhiteRender', '#ecebe4'),
    cream: kit.mat('streetCreamRender', '#e9dcbc'),
    sandstone: stone('streetSandstone', '#e9dab4'),
    painted: stone('streetPaintedStone', '#fbf8ef'),
  };
  const frameColours = {
    white: kit.mat('streetFrames', '#e8eae4'),
    brown: kit.mat('streetFramesBrown', '#5b3b27'),
    dark: kit.mat('streetFramesDark', '#2a2c2b'),
  };
  const uvMetres = (m: T.Material) =>
    m === faces.red || m === faces.dark ? 1.8 : 4;
  const slate = slateMaterial();
  const stoneSlate = slateMaterial();
  stoneSlate.color.set('#b8ab95');
  const whiteFrame = frameColours.white;
  const glass = kit.mat('streetGlass', '#7f979b', 0.35);
  const garageDoor = kit.mat('streetGarageDoor', '#e6e6de');
  const iron = kit.mat('streetIron', '#24292a');
  const gutter = kit.mat('streetGutter', '#2b2f30');
  const buffDressing = kit.mat('streetBuffDressing', '#e6d6aa');
  const gritDressing = kit.mat('streetGritDressing', '#cbbfa5');
  const pubPaint = kit.mat('streetPubPaint', '#3a4145');
  const doors = ['#2d3337', '#e4e4dc', '#5a2b2b', '#273749', '#3c4a3a'].map(
    (c, i) => kit.mat(`streetDoor${i}`, c),
  );

  const add = (g: T.BufferGeometry, m: T.Material) => {
    const flat = g.index ? g.toNonIndexed() : g;
    flat.computeVertexNormals();
    masonryUV(flat, uvMetres(m));
    kit.batch(flat, m);
  };

  for (const f of buildings) {
    const house = STREET_HOUSES[f.id];
    if (!house) continue;
    addHouse(f.points.slice(0, -1), house, Number(f.id));
  }

  function addHouse(p: P[], house: StreetHouse, id: number) {
    const type = TYPE[house.style];
    const wall = faces[house.face];
    const frame = frameColours[house.frames ?? 'white'];
    const sill = house.blackSills ? pubPaint : null;
    const dressing =
      house.face === 'buff'
        ? buffDressing
        : house.style === 'pub'
          ? pubPaint
          : house.face === 'white' ||
              house.face === 'cream' ||
              house.face === 'painted'
            ? whiteFrame
            : gritDressing;

    const plan = streetHousePlan(p, house, fronts);
    const { fa, fb, L, t, n, outward } = plan;
    const depth = (q: P) => -((q[0] - fa[0]) * n[0] + (q[1] - fa[1]) * n[1]);
    const ds = p.map(depth),
      dMin = Math.min(...ds),
      dMax = Math.max(...ds),
      ridgeD = (dMin + dMax) / 2,
      half = (dMax - dMin) / 2,
      rise = Math.min(half * type.pitch, type.maxRise);
    const roofH = (q: P) =>
      rise * Math.max(0, 1 - Math.abs(depth(q) - ridgeD) / half);

    const doorY = ground(
      (fa[0] + fb[0]) / 2 + n[0] * 1.2,
      (fa[1] + fb[1]) / 2 + n[1] * 1.2,
    );
    const base = doorY + (house.style === 'terrace' ? 0.18 : 0.08);
    const eaves = type.floors.reduce((s, h) => s + h, 0);
    const top = base + eaves;
    const bottom = Math.min(...p.map((q) => terrain(...q))) - 0.3;
    const floorY = (k: number) =>
      base + type.floors.slice(0, k).reduce((s, h) => s + h, 0);

    // Walls. Townhouses have a buff stone garage storey under the brick.
    const extrude = (y0: number, y1: number, m: T.Material) => {
      const shape = new T.Shape(p.map((v) => new T.Vector2(v[0], -v[1])));
      const g = new T.ExtrudeGeometry(shape, {
        depth: y1 - y0,
        bevelEnabled: false,
      });
      g.rotateX(-Math.PI / 2);
      g.translate(0, y0, 0);
      add(g, m);
    };
    if (house.style === 'townhouse') {
      extrude(bottom, floorY(1), faces.buff);
      extrude(floorY(1), top, wall);
    } else extrude(bottom, top, wall);

    // Dual-pitch roof clipped to the footprint, ridge parallel to the front.
    const clip = (poly: P[], keep: (q: P) => number) => {
      const out: P[] = [];
      for (let j = 0; j < poly.length; j++) {
        const a = poly[j],
          b = poly[(j + 1) % poly.length],
          da = keep(a),
          db = keep(b);
        if (da >= 0) out.push(a);
        if (da * db < 0) {
          const s = da / (da - db);
          out.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]);
        }
      }
      return out;
    };
    for (const side of [1, -1]) {
      const part = clip(p, (q) => side * (ridgeD - depth(q)));
      if (part.length < 3) continue;
      const tris = T.ShapeUtils.triangulateShape(
        part.map((q) => new T.Vector2(q[0], q[1])),
        [],
      );
      const pos: number[] = [];
      for (const tri of tris)
        for (const k of tri) {
          const q = part[k];
          pos.push(q[0], top + roofH(q) + 0.03, q[1]);
        }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      roofUV(g);
      kit.batch(
        g,
        house.style === 'cottage' || house.style === 'pub' ? stoneSlate : slate,
      );
    }
    // Gable infill and eaves gutters, edge by edge.
    for (let j = 0; j < p.length; j++) {
      const a = p[j],
        b = p[(j + 1) % p.length],
        da = depth(a) - ridgeD,
        db = depth(b) - ridgeD;
      const pieces: [P, P][] =
        da * db < 0
          ? (() => {
              const s = da / (da - db),
                m: P = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
              return [
                [a, m],
                [m, b],
              ];
            })()
          : [[a, b]];
      for (const [q, r] of pieces) {
        const hq = roofH(q),
          hr = roofH(r);
        if (hq + hr > 0.05) {
          const g = new T.BufferGeometry();
          g.setAttribute(
            'position',
            new T.Float32BufferAttribute(
              [
                q[0],
                top,
                q[1],
                r[0],
                top,
                r[1],
                r[0],
                top + hr,
                r[1],
                q[0],
                top,
                q[1],
                r[0],
                top + hr,
                r[1],
                q[0],
                top + hq,
                q[1],
              ],
              3,
            ),
          );
          add(g, wall);
        }
      }
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len > 1.5 && roofH(a) < 0.05 && roofH(b) < 0.05) {
        const o = outward(a, b);
        box(
          (a[0] + b[0]) / 2 + o[0] * 0.08,
          top - 0.06,
          (a[1] + b[1]) / 2 + o[1] * 0.08,
          0.14,
          0.13,
          len + 0.1,
          gutter,
          Math.atan2(b[0] - a[0], b[1] - a[1]),
        );
      }
    }

    // Openings on a face: u along the edge from `a`, v outwards.
    const face = (a: P, b: P) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        d: P = [(b[0] - a[0]) / len, (b[1] - a[1]) / len],
        o = outward(a, b),
        rot = Math.atan2(d[0], d[1]);
      const B = (
        u: number,
        y: number,
        v: number,
        along: number,
        h: number,
        out: number,
        m: T.Material,
      ) =>
        box(
          a[0] + d[0] * u + o[0] * v,
          y,
          a[1] + d[1] * u + o[1] * v,
          out,
          h,
          along,
          m,
          rot,
        );
      const window = (u: number, sillY: number, w: number, h: number) => {
        const cy = sillY + h / 2;
        B(u, cy, 0.02, w + 0.12, h + 0.12, 0.1, frame);
        B(u, cy, 0.05, w - 0.06, h - 0.06, 0.04, glass);
        B(u, cy, 0.08, 0.05, h - 0.06, 0.03, frame);
        if (h > 1.2) B(u, sillY + h * 0.7, 0.08, w - 0.06, 0.05, 0.03, frame);
        B(u, sillY - 0.06, 0.08, w + 0.26, 0.1, 0.18, sill ?? dressing);
        if (house.face !== 'buff' || house.style !== 'estate')
          B(u, sillY + h + 0.13, 0.04, w + 0.26, 0.2, 0.1, sill ?? dressing);
      };
      const door = (u: number, y: number, w = 0.95, fan = false) => {
        const colour = house.door
          ? kit.mat(`streetDoor${house.door}`, house.door)
          : doors[(id + Math.round(u * 7)) % doors.length];
        B(u, y + 1.03, 0.02, w + 0.14, 2.12, 0.1, frame);
        B(u, y + 1.0, 0.05, w, 2.0, 0.05, colour);
        if (fan) {
          B(u, y + 2.32, 0.03, w + 0.14, 0.42, 0.1, frame);
          B(u, y + 2.32, 0.05, w - 0.04, 0.32, 0.05, glass);
        }
        B(u, y + (fan ? 2.66 : 2.25), 0.04, w + 0.3, 0.2, 0.1, dressing);
        B(u, y - 0.08, 0.25, w + 0.3, 0.16, 0.5, dressing);
      };
      const garage = (u: number, y: number, w = 2.3) => {
        B(u, y + 1.05, 0.02, w + 0.14, 2.14, 0.1, frame);
        B(u, y + 1.04, 0.05, w, 2.06, 0.05, garageDoor);
        for (let k = 1; k < 6; k++)
          B(u, y + (k * 2.06) / 6, 0.08, w, 0.025, 0.02, frame);
        B(u, y + 2.24, 0.04, w + 0.3, 0.2, 0.1, dressing);
      };
      const canopy = (u: number, y: number) => {
        B(u, y + 2.45, 0.42, 1.5, 0.1, 0.8, gutter);
        for (const s of [-0.6, 0.6])
          B(u + s, y + 2.25, 0.72, 0.06, 0.06, 0.06, iron);
      };
      const juliet = (u: number, y: number, w: number) => {
        B(u, y + 1.0, 0.2, w + 0.1, 0.05, 0.05, iron);
        B(u, y + 0.08, 0.2, w + 0.1, 0.05, 0.05, iron);
        for (let k = 0; k <= Math.round(w / 0.12); k++)
          B(
            u - w / 2 + (k * w) / Math.round(w / 0.12),
            y + 0.54,
            0.2,
            0.02,
            0.92,
            0.02,
            iron,
          );
      };
      const band = (y: number, h = 0.16) =>
        B(len / 2, y, 0.04, len + 0.08, h, 0.1, dressing);
      return { len, B, window, door, garage, canopy, juliet, band };
    };

    const F = face(fa, fb);
    const g0 = floorY(0),
      g1 = floorY(1),
      g2 = floorY(2);
    if (house.style === 'estate') {
      const garaged = plan.garages.length > 0;
      const span = garaged ? L - 2.9 : L;
      if (garaged) {
        F.garage(plan.garages[0].u, g0);
        F.window(plan.garages[0].u, g1 + 0.85, 1.2, 1.15);
      }
      const doorU = plan.doors[0];
      F.door(doorU, g0);
      F.canopy(doorU, g0);
      F.window(doorU, g1 + 0.95, 0.7, 1.05);
      if (house.oculus) {
        const [x, z] = [
          fa[0] + t[0] * (doorU + 0.95) + n[0] * 0.06,
          fa[1] + t[1] * (doorU + 0.95) + n[1] * 0.06,
        ];
        const ring = new T.CylinderGeometry(0.3, 0.3, 0.1, 18);
        ring.rotateX(Math.PI / 2);
        ring.rotateY(Math.atan2(n[0], n[1]));
        ring.translate(x, g0 + 1.55, z);
        kit.batch(ring, frame);
      }
      if (span - doorU > 2.2) {
        const u = (doorU + 0.6 + span) / 2;
        F.window(u, g0 + 0.85, Math.min(1.7, span - doorU - 1.3), 1.2);
        F.window(u, g1 + 0.85, Math.min(1.4, span - doorU - 1.5), 1.15);
      }
    } else if (house.style === 'townhouse') {
      F.band(g1, 0.2);
      F.band(g2, 0.14);
      for (const [k, du] of plan.doors.entries()) {
        const gu = plan.garages[k].u;
        F.garage(gu, g0, plan.garages[k].w);
        F.door(du, g0, 0.9);
        F.window(gu, g1 + 0.12, 1.3, 2.05);
        F.juliet(gu, g1 + 0.12, 1.3);
        F.window(du, g1 + 0.8, 0.8, 1.35);
        F.window(gu, g2 + 0.75, 1.0, 1.25);
        F.window(du, g2 + 0.75, 0.8, 1.25);
      }
    } else if (house.style === 'terrace') {
      for (const du of plan.doors) {
        const wu = du - 0.85 + Math.max(2.4, plan.unit * 0.62);
        F.door(du, g0, 0.9, true);
        F.window(wu, g0 + 0.8, 1.25, 1.5);
        F.window(du, g1 + 0.75, 0.75, 1.25);
        F.window(wu, g1 + 0.75, 1.15, 1.35);
        if (house.porch) {
          F.B(du, g0 + 1.3, 0.75, 1.5, 2.6, 1.3, wall);
          F.B(du, g0 + 2.75, 0.75, 1.6, 0.18, 1.45, slate);
        }
      }
    } else if (house.style === 'cottageRow') {
      // Window then door, one upper window over the ground window.
      const du = plan.doors[0],
        wu = plan.windows[0];
      F.door(du, g0, 0.86);
      for (const s of [-0.53, 0.53])
        F.B(du + s, g0 + 1.05, 0.06, 0.18, 2.2, 0.14, dressing);
      F.window(wu, g0 + 0.8, 1.15, 1.35);
      F.window(wu, g1 + 0.6, 1.1, 1.25);
      if (house.overDoor) F.window(du, g1 + 0.95, 0.5, 0.6);
    } else if (house.style === 'cottage') {
      const du = plan.doors[0];
      F.door(du, g0, 0.85);
      F.window(du + 1.6, g0 + 0.95, 0.9, 1.0);
      if (L > 6) F.window(L - 1.3, g0 + 0.95, 0.9, 1.0);
    } else {
      // Spread Eagle: central door with dark painted surround, dark heads.
      const mid = plan.doors[0];
      F.door(mid, g0, 1.0, true);
      for (const s of [-0.72, 0.72])
        F.B(mid + s, g0 + 1.35, 0.1, 0.24, 2.7, 0.16, pubPaint);
      F.B(mid, g0 + 2.85, 0.12, 1.9, 0.32, 0.22, pubPaint);
      for (const s of [-1, 1]) {
        F.window(mid + s * Math.min(3.2, L / 3.2), g0 + 0.8, 1.2, 1.45);
        F.window(mid + s * Math.min(3.2, L / 3.2), g1 + 0.7, 1.2, 1.35);
      }
    }
    // Downpipe at the front corner (positions not surveyed).
    F.B(
      0.18,
      (bottom + top) / 2 + 0.15,
      0.1,
      0.08,
      top - bottom - 0.3,
      0.08,
      gutter,
    );

    // Rear: one window per floor per unit, placeholders until rear views exist.
    let rear = -1,
      rearScore = 0.7;
    for (let j = 0; j < p.length; j++) {
      const a = p[j],
        b = p[(j + 1) % p.length],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 3) continue;
      const o = outward(a, b),
        s = -(o[0] * n[0] + o[1] * n[1]) * Math.min(1, len / 5);
      if (s > rearScore) {
        rearScore = s;
        rear = j;
      }
    }
    if (rear >= 0) {
      const R = face(p[rear], p[(rear + 1) % p.length]);
      const units = Math.max(1, Math.round(R.len / 5.2));
      for (let k = 0; k < units; k++) {
        const u = ((k + 0.5) * R.len) / units;
        for (let floor = 0; floor < type.floors.length; floor++)
          R.window(
            u,
            floorY(floor) + 0.9,
            Math.min(1.2, R.len / units - 1),
            1.2,
          );
      }
    }

    // Chimney stacks on the ridge (positions estimated).
    if (house.style !== 'townhouse' && !(house.style === 'estate' && id % 2)) {
      const at = (u: number) => {
        const x = fa[0] + t[0] * u - n[0] * ridgeD,
          z = fa[1] + t[1] * u - n[1] * ridgeD;
        box(
          x,
          top + rise + 0.45,
          z,
          0.62,
          1.5,
          0.95,
          wall === faces.white || wall === faces.cream ? faces.dark : wall,
          Math.atan2(t[0], t[1]),
        );
        box(x, top + rise + 1.3, z, 0.2, 0.3, 0.2, gutter);
      };
      if (house.style === 'terrace' || house.style === 'cottageRow') at(0.3);
      else if (house.style === 'pub') {
        at(0.3);
        at(L - 0.3);
      } else at(house.style === 'cottage' ? L - 0.4 : L * 0.3);
    }
  }
}

export type StreetHousePlan = ReturnType<typeof streetHousePlan>;

/** Street-facing edge and the door/garage positions along it (u from `fa`). */
export function streetHousePlan(p: P[], house: StreetHouse, fronts: Segment[]) {
  const outward = (a: P, b: P): P => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let n: P = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
    const mx = (a[0] + b[0]) / 2,
      mz = (a[1] + b[1]) / 2;
    if (inPoly(mx + n[0] * 0.1, mz + n[1] * 0.1, p)) n = [-n[0], -n[1]];
    return n;
  };
  // Front: the edge that faces its street most directly.
  let front = 0,
    best = -Infinity;
  for (let j = 0; j < p.length; j++) {
    const a = p[j],
      b = p[(j + 1) % p.length],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 2.5) continue;
    const mx = (a[0] + b[0]) / 2,
      mz = (a[1] + b[1]) / 2,
      r = nearest(mx, mz, fronts),
      n = outward(a, b),
      facing = house.front
        ? n[0] * house.front[0] + n[1] * house.front[1]
        : (n[0] * (r.x - mx) + n[1] * (r.z - mz)) / (r.d || 1),
      score = facing * Math.min(len, 8) - 0.05 * r.d;
    if (score > best) {
      best = score;
      front = j;
    }
  }
  const fa = p[front],
    fb = p[(front + 1) % p.length],
    L = Math.hypot(fb[0] - fa[0], fb[1] - fa[1]),
    t: P = [(fb[0] - fa[0]) / L, (fb[1] - fa[1]) / L],
    n = outward(fa, fb);
  const doors: number[] = [],
    windows: number[] = [],
    garages: { u: number; w: number }[] = [];
  let unit = L;
  if (house.style === 'estate') {
    const garaged = house.garage && L >= 6.4;
    if (garaged) garages.push({ u: L - 1.5, w: 2.3 });
    doors.push(Math.min(1.1, (garaged ? L - 2.9 : L) / 3));
  } else if (house.style === 'townhouse') {
    const units = Math.max(1, Math.round(L / 5.3));
    unit = L / units;
    for (let k = 0; k < units; k++) {
      doors.push(k * unit + Math.min(1.0, unit - 3.1));
      garages.push({ u: (k + 1) * unit - 1.45, w: Math.min(2.3, unit - 2.1) });
    }
  } else if (house.style === 'terrace') {
    const units = Math.max(1, Math.round(L / 5));
    unit = L / units;
    for (let k = 0; k < units; k++) doors.push(k * unit + 0.85);
  } else if (house.style === 'cottageRow') {
    // Door on the right as seen from the street, window on the left.
    const right = t[0] * n[1] - t[1] * n[0] > 0;
    doors.push(right ? L - 0.85 : 0.85);
    windows.push(right ? (L - 1.3) / 2 : L - (L - 1.3) / 2);
  } else if (house.style === 'cottage') doors.push(Math.min(1.2, L / 3));
  else doors.push(L / 2);
  return { fa, fb, L, t, n, outward, doors, windows, garages, unit };
}
