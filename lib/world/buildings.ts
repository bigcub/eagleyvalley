import * as T from 'three';
import {
  bounds,
  nearest,
  type Bounds,
  type Feature,
  type P,
} from '../core/geo';
import type { Kit } from '../core/kit';
import { slateTexture } from '../materials/building-surfaces';
import { addBridgeFront, addBridgeEngineHouse } from '../landmarks/bridge-mill';
import {
  addBrookNorth,
  addBrookRoof,
  addBrookSouth,
  addBrookUpperWindow,
} from '../landmarks/brook-mill';
import { addBrookEntrance } from '../landmarks/brook-mill-entrance';
import { addBrookTerrace, brookTerrace } from '../landmarks/brook-terrace';
import { addCourtHouses } from '../landmarks/court-houses';
import {
  addEagleyHall,
  hallBrickPolygon,
  hallCorners,
  hallWorld,
} from '../landmarks/eagley-hall';
import { addGatehouse } from '../landmarks/gatehouse';
import { addSchoolHouse } from '../landmarks/school-house';
import type { WorldData } from './data';
import { BRIDGE_MILL_FOOTPRINT, OSM } from './layout';
import type { Surface } from './surface';

// Buildings keep their mapped footprints. Landmarks have dedicated models;
// everything else uses the generic generator below, which is a placeholder:
// storey heights, roof pitch and window spacing are derived, not surveyed.
export function addBuildings(kit: Kit, surface: Surface, data: WorldData) {
  const { box, batch, polygon } = kit;
  const { stone, brick, slate, glass, trim, dark } = kit.m;
  const { terrain, sampledTerrain, ground, courtY, roadSeg } = surface;
  const colliders: Bounds[] = [];
  const roofMap = slateTexture();
  const roofMaterial = new T.MeshStandardMaterial({
    color: '#d4d9d8',
    map: roofMap,
    bumpMap: roofMap,
    bumpScale: 0.025,
    roughness: 0.88,
    side: T.DoubleSide,
  });
  roofMaterial.userData.pitchedRoof = true;
  const lowest = (p: P[]) => Math.min(...p.map((q) => terrain(...q)));

  for (const f of data.buildings) {
    let p =
      f.name === 'Bridge Mill' ? BRIDGE_MILL_FOOTPRINT : f.points.slice(0, -1);
    if (p.length < 3) continue;
    const cx = p.reduce((s, v) => s + v[0], 0) / p.length,
      cz = p.reduce((s, v) => s + v[1], 0) / p.length;
    if (cx < -460 || cx > 380 || cz < -290 || cz > 290) continue;
    colliders.push(bounds(p));

    // Dedicated landmark models.
    if (OSM.courtHouses.includes(f.id)) {
      if (f.id === OSM.courtHouses[0]) addCourtHouses(kit, surface.houseEntry);
      continue;
    }
    if (f.id === OSM.gatehouse) {
      addGatehouse(kit, {
        base: Math.max(ground(-288.5, 149.3), ground(-280.8, 140.7)) + 0.08,
        foundationBottom: lowest(p) - 0.3,
        points: p,
      });
      continue;
    }
    if (f.id === OSM.schoolHouse) {
      addSchoolHouse(kit, { base: lowest(p), points: p });
      continue;
    }
    // Eagley Hall: dedicated stone hall; the attached brick block stays generic with a flat roof.
    const flat = f.id === OSM.eagleyHall;
    if (flat) {
      addEagleyHall(
        kit,
        Math.max(...hallCorners().map((q) => terrain(...q))) - 0.7,
      );
      p = hallBrickPolygon();
      colliders.pop();
      colliders.push(
        bounds(hallCorners()),
        bounds(p),
        bounds([
          hallWorld(-1.8, 9.2),
          hallWorld(0, 9.2),
          hallWorld(0, 12.2),
          hallWorld(-1.8, 12.2),
        ]),
      );
    }

    // Generic building profile.
    const bridge = f.name === 'Bridge Mill',
      brookMill = f.name === 'Brook Mill',
      mill = f.name.includes('Mill'),
      garage = f.tags.building === 'garages' || f.tags.building === 'garage';
    const levels = bridge
      ? 3
      : brookMill
        ? 5
        : f.name === 'Valley Mill'
          ? 4
          : flat
            ? 3
            : Number(f.tags['building:levels']) || (garage ? 1 : 2);
    const h = levels * (mill ? 3.6 : 2.8),
      base = bridge
        ? surface.bridgeBase
        : brookMill
          ? surface.brookDatum
          : garage && [OSM.garageRange, OSM.separateGarage].includes(f.id)
            ? courtY(cx, cz)
            : lowest(p);
    const millCourt = [
      ...OSM.courtHouses,
      OSM.garageRange,
      OSM.separateGarage,
    ].includes(f.id);
    const material =
      bridge || millCourt || (!mill && cz < -140) ? stone : brick;

    // Walls: extruded footprint. Brook Mill's basement storey is stone.
    const shape = new T.Shape(p.map((v) => new T.Vector2(v[0], -v[1])));
    const extrude = (depth: number, y: number, m: T.Material) => {
      const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      g.translate(0, y, 0);
      const uv = g.getAttribute('uv');
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
      batch(g, m);
    };
    extrude(brookMill ? h - 3.6 : h, base + (brookMill ? 3.6 : 0), material);
    if (brookMill) {
      const foot = Math.min(...p.map((q) => sampledTerrain(...q)));
      extrude(base - foot + 3.6, foot, stone);
    }
    polygon([...p, p[0]], slate, base + h + 0.04);
    // Plinth on the other mills.
    if (mill && !bridge && !brookMill)
      for (let j = 0; j < p.length; j++) {
        const a = p[j],
          b = p[(j + 1) % p.length],
          len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        box(
          (a[0] + b[0]) / 2,
          base + 0.65,
          (a[1] + b[1]) / 2,
          0.3,
          1.3,
          len,
          stone,
          Math.atan2(b[0] - a[0], b[1] - a[1]),
        );
      }

    // Roof: hipped/gabled prism aligned with the longest wall.
    const frame = footprintFrame(p, cx, cz);
    if ((!mill || bridge) && !flat)
      batch(
        pitchedRoof(frame, garage ? 1.05 : bridge ? 1.8 : 1.7, base + h),
        roofMaterial,
      );

    if (garage) addGarageDoors(kit, f, p, base);

    const near = Math.hypot(cx, cz) < 470;
    // One entrance per generic building on the elevation nearest a road; other elevations get no invented doors.
    let doorEdge = -1;
    if (near && !mill && !garage) {
      let best = Infinity;
      for (let j = 0; j < p.length; j++) {
        const a = p[j],
          b = p[(j + 1) % p.length];
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 2.3) continue;
        const d = nearest((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, roadSeg).d;
        if (d < best) {
          best = d;
          doorEdge = j;
        }
      }
    }
    if (near && !garage)
      for (let j = 0; j < p.length; j++) {
        const a = p[j],
          b = p[(j + 1) % p.length];
        // Bridge Mill: south frontage and blank east end have dedicated models.
        if (bridge && ((a[1] + b[1]) / 2 > 17 || j === 1)) continue;
        if (brookMill && (j === 5 || j === 6 || j === 7)) continue;
        const dx = b[0] - a[0],
          dz = b[1] - a[1],
          len = Math.hypot(dx, dz);
        if (len < 2.3) continue;
        const rot = Math.atan2(dx, dz),
          n =
            bridge && len > 20
              ? 9
              : brookMill
                ? len > 30
                  ? 14
                  : len > 20
                    ? 6
                    : len > 7
                      ? 2
                      : 1
                : Math.max(1, Math.floor(len / (mill ? 3.3 : 3.1)));
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n,
            x = a[0] + dx * t,
            z = a[1] + dz * t;
          for (let level = 0; level < levels; level++) {
            // Bridge Mill rear ground floor: French doors in bridge-rear.ts.
            if (bridge && j === 0 && level === 0) continue;
            const yy = base + (level * h) / levels + 1.65,
              ww = mill ? 1.55 : 1.15,
              hh = mill ? 2.25 : 1.3;
            if (brookMill && level >= 3) {
              addBrookUpperWindow(kit, x, yy, z, rot);
              continue;
            }
            if (level === 0 && k === 0 && j === doorEdge) {
              box(x, base + 1.02, z, 0.19, 2.1, 1.06, trim, rot);
              box(x, base + 0.98, z, 0.25, 1.96, 0.88, dark, rot);
              continue;
            }
            box(x, yy, z, 0.19, hh + 0.23, ww + 0.22, trim, rot);
            box(x, yy + 0.04, z, 0.22, hh, ww, glass, rot);
            box(x, yy + 0.04, z, 0.25, 0.045, ww, trim, rot);
            box(x, yy + 0.04, z, 0.25, hh, 0.045, trim, rot);
            if (mill)
              for (const frac of [-0.25, 0.25]) {
                box(
                  x + Math.sin(rot) * ww * frac,
                  yy + 0.04,
                  z + Math.cos(rot) * ww * frac,
                  0.26,
                  hh,
                  0.035,
                  trim,
                  rot,
                );
                box(x, yy + 0.04 + hh * frac, z, 0.26, 0.035, ww, trim, rot);
              }
          }
        }
        const mx = (a[0] + b[0]) / 2,
          mz = (a[1] + b[1]) / 2;
        // Mill floor bands, cornice and pilasters.
        if (mill && !bridge)
          for (let floor = 1; floor <= levels; floor++)
            box(
              mx,
              base + (floor * h) / levels - 0.12,
              mz,
              0.48,
              0.32,
              len + 0.12,
              trim,
              rot,
            );
        if (mill) {
          box(mx, base + h - 0.15, mz, 0.4, 0.3, len + 0.15, trim, rot);
          if (!bridge)
            for (let k = 0; k <= n; k++) {
              const t = k / n;
              box(
                a[0] + dx * t,
                base + h / 2,
                a[1] + dz * t,
                0.35,
                h,
                0.35,
                material,
                rot,
              );
            }
        }
      }
    // Gutters, downpipes and shoes.
    for (let j = 0; j < p.length; j++) {
      const a = p[j],
        b = p[(j + 1) % p.length],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz),
        rot = Math.atan2(dx, dz);
      if (len < 2) continue;
      box(
        (a[0] + b[0]) / 2,
        base + h - 0.08,
        (a[1] + b[1]) / 2,
        0.13,
        0.14,
        len + 0.16,
        dark,
        rot,
      );
      if (j % 2 === 0) {
        box(a[0], base + h / 2, a[1], 0.08, h, 0.08, dark);
        box(a[0], base + 0.18, a[1], 0.2, 0.25, 0.2, dark);
      }
    }
    // Chimney on every third house, by OSM ID. Positions are not surveyed.
    if (!mill && !garage && Number(f.id) % 3 === 0)
      box(cx + 1, base + h + 1.7, cz, 1, 1.9, 0.75, brick, frame.theta);
  }

  // Bridge Mill frontage and engine house sit on the passage level.
  addBridgeFront(kit, surface.passageY);
  colliders.push(bounds(addBridgeEngineHouse(kit, surface.passageY)));

  // Brook Mill details, interpreted from Historic England listings and photographs.
  const brook = data.buildings.find((f) => f.name === 'Brook Mill')!;
  const brookBase = surface.brookDatum;
  addBrookNorth(kit, brookBase);
  addBrookSouth(kit, brookBase);
  addBrookTerrace(kit, brookBase, sampledTerrain);
  colliders.push(bounds(brookTerrace));
  addBrookRoof(kit, brookBase, brook.points.slice(0, -1));
  colliders.push(bounds(addBrookEntrance(kit, brookBase)));

  addValleyMillCupola(kit, data, terrain);
  return colliders;
}

type Frame = {
  cx: number;
  cz: number;
  theta: number;
  rw: number;
  rl: number;
  localX: number;
  localZ: number;
};

/** Local frame aligned with the footprint's longest wall. */
function footprintFrame(p: P[], cx: number, cz: number): Frame {
  let longest = 0,
    edge = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i],
      b = p[(i + 1) % p.length],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len > longest) {
      longest = len;
      edge = i;
    }
  }
  const pa = p[edge],
    pb = p[(edge + 1) % p.length],
    theta = Math.atan2(pb[0] - pa[0], pb[1] - pa[1]);
  const local = p.map((q) => {
    const dx = q[0] - cx,
      dz = q[1] - cz;
    return [
      dx * Math.cos(theta) - dz * Math.sin(theta),
      dx * Math.sin(theta) + dz * Math.cos(theta),
    ];
  });
  const xs = local.map((v) => v[0]),
    zs = local.map((v) => v[1]);
  return {
    cx,
    cz,
    theta,
    rw: Math.max(...xs) - Math.min(...xs),
    rl: Math.max(...zs) - Math.min(...zs),
    localX: (Math.min(...xs) + Math.max(...xs)) / 2,
    localZ: (Math.min(...zs) + Math.max(...zs)) / 2,
  };
}

/** Hipped roof over the footprint's bounding rectangle, rise `rh` metres. */
function pitchedRoof(f: Frame, rh: number, eave: number) {
  const { rw, rl } = f;
  const hip = Math.min(rw / 2, rl / 3);
  const verts = [
    -rw / 2,
    0,
    -rl / 2,
    rw / 2,
    0,
    -rl / 2,
    0,
    rh,
    -rl / 2 + hip,
    -rw / 2,
    0,
    rl / 2,
    rw / 2,
    0,
    rl / 2,
    0,
    rh,
    rl / 2 - hip,
  ];
  const roof = new T.BufferGeometry();
  roof.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  roof.setAttribute(
    'uv',
    new T.Float32BufferAttribute(
      verts.flatMap((_, i) =>
        i % 3 === 0 ? [verts[i] / 2, verts[i + 2] / 2] : [],
      ),
      2,
    ),
  );
  roof.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4]);
  roof.computeVertexNormals();
  roof.translate(f.localX, 0, f.localZ);
  roof.rotateY(f.theta);
  roof.translate(f.cx, eave, f.cz);
  return roof;
}

/** Ribbed up-and-over doors on the north-facing elevation. */
function addGarageDoors(kit: Kit, f: Feature, p: P[], base: number) {
  const { box, mat } = kit;
  const { dark, trim, stone } = kit.m;
  const northEdge = p
    .map((a, j) => ({ a, b: p[(j + 1) % p.length] }))
    .filter((e) => Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) > 3)
    .sort((a, b) => a.a[1] + a.b[1] - (b.a[1] + b.b[1]))[0];
  const a = northEdge.a,
    b = northEdge.b,
    dx = b[0] - a[0],
    dz = b[1] - a[1],
    len = Math.hypot(dx, dz),
    rot = Math.atan2(dx, dz),
    // The long range has five referenced bays; the separate garage two.
    n =
      f.id === OSM.garageRange
        ? 5
        : f.id === OSM.separateGarage
          ? 2
          : Math.max(1, Math.round(len / 3.4));
  const door = mat('garageDoor', '#363b37'),
    rib = mat('garageRib', '#4e534d');
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n,
      x = a[0] + dx * t,
      z = a[1] + dz * t,
      ww = Math.min(2.6, len / n - 0.38);
    box(x, base + 1.14, z, 0.21, 2.28, ww + 0.16, dark, rot);
    box(x, base + 1.14, z, 0.24, 2.15, ww, door, rot);
    for (let j = 1; j < 12; j++) {
      const d = (j / 12 - 0.5) * ww;
      box(
        x + Math.sin(rot) * d,
        base + 1.14,
        z + Math.cos(rot) * d,
        0.27,
        2.1,
        0.018,
        rib,
        rot,
      );
    }
    box(x, base + 1.0, z, 0.29, 0.04, 0.22, trim, rot);
    box(x, base + 2.37, z, 0.28, 0.16, ww + 0.3, stone, rot);
  }
}

/** Valley Mill: flat roof with a raised north-east bell cupola. */
function addValleyMillCupola(
  kit: Kit,
  data: WorldData,
  terrain: (x: number, z: number) => number,
) {
  const { box, batch } = kit;
  const { brick, trim, slate, dark } = kit.m;
  const valley = data.buildings.find((f) => f.name === 'Valley Mill')!,
    vy = Math.min(...valley.points.map((p) => terrain(...p))) + 14.4;
  box(11, vy + 1, -79, 4.2, 2, 4.2, brick, -0.34);
  box(11, vy + 2.1, -79, 4.6, 0.28, 4.6, trim, -0.34);
  for (const dx of [-1.25, 1.25])
    for (const dz of [-1.25, 1.25])
      box(11 + dx, vy + 3.1, -79 + dz, 0.24, 1.8, 0.24, trim);
  const cap = new T.ConeGeometry(2.3, 1.5, 8);
  cap.translate(11, vy + 4.4, -79);
  batch(cap, slate);
  const bell = new T.SphereGeometry(0.52, 8, 6);
  bell.scale(1, 1.25, 1);
  bell.translate(11, vy + 3.2, -79);
  batch(bell, dark);
}
