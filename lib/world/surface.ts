import * as T from 'three';
import {
  inPoly,
  nearest,
  outline,
  segments,
  type Nearest,
  type P,
} from '../core/geo';
import { roadWidth, type WorldData } from './data';
import {
  BRIDGE_MILL_COURT,
  HOUGH_DECK_NORTH,
  HOUGH_DECK_SOUTH,
  HOUGH_JUNCTION_BOX,
  OSM,
} from './layout';
import { rearFormation } from '../landmarks/bridge-rear';
import { passageWallZ } from '../landmarks/bridge-passage';
import { gateLocal, gateWorld } from '../landmarks/bridge-side-gate';
import { brookTerrace } from '../landmarks/brook-terrace';
import { brookParking } from '../landmarks/brook-mill-grounds';
import { courtHouseGround } from '../landmarks/court-houses';
import {
  onJunctionPavement,
  junctionGroundWeight,
} from '../landmarks/hough-junction';

// One place for every height in the world.
//
//   sampledTerrain  bare Environment Agency 2m grid (metres above 100m AOD)
//   terrain         landform after local earthworks; drives the grass mesh
//   roadY           finished carriageway and path surfaces
//   ground          the walkable/drivable surface the player stands on
//
// terrain and ground are ordered lists of named zones: the first zone that
// claims a point decides its height. Order is significant.

type Zone = { name: string; y: (x: number, z: number) => number | undefined };
const { lerp, smoothstep, clamp } = T.MathUtils;

export function createSurface(data: WorldData) {
  const { roads, water, buildings, survey, elevations } = data;
  const roadSeg = segments(roads),
    riverSeg = segments(water),
    eagleySegments = segments(roads.filter((f) => f.name === 'Eagley Way')),
    courtAccess = segments(
      roads.filter((f) => f.id === OSM.bridgeMillCourtAccess),
    ),
    riversideSeg = segments(roads.filter((f) => f.id === OSM.riversidePath)),
    houghFootSegments = roadSeg.filter((s) =>
      [OSM.houghFootbridge, OSM.houghFootbridgeSouthPath].includes(s.f.id),
    ),
    court = BRIDGE_MILL_COURT,
    courtOutline = outline(court),
    brookOutline = outline(brookParking);

  function sampledTerrain(x: number, z: number) {
    const u = clamp((x - survey.x0) / survey.step, 0, survey.cols - 1.001),
      v = clamp((z - survey.z0) / survey.step, 0, survey.rows - 1.001),
      i = Math.floor(u),
      j = Math.floor(v),
      a = j * survey.cols + i;
    return (
      lerp(
        lerp(elevations[a], elevations[a + 1], u - i),
        lerp(
          elevations[a + survey.cols],
          elevations[a + survey.cols + 1],
          u - i,
        ),
        v - j,
      ) / 100
    );
  }

  // Datums for the terraced mill sites.
  const brookDatum = sampledTerrain(91, -55) - 0.35;
  const bridgeBase = Math.min(
    ...buildings
      .find((f) => f.name === 'Bridge Mill')!
      .points.map((p) => sampledTerrain(...p)),
  );
  const passageY = bridgeBase + 3.6;
  const houseEntry = sampledTerrain(52, 11) + 0.38;

  /** Retaining height follows the road above the passage. */
  function passageWallHeight(x: number) {
    const n = nearest(x, passageWallZ(x) + 4, eagleySegments);
    return Math.max(
      0.7,
      sampledTerrain(n.x, n.z) +
        0.2 +
        (x < 94 ? 1.42 : 0.92) -
        (passageY - 0.25),
    );
  }
  function inPassage(x: number, z: number) {
    return (
      x > 71 &&
      x < 110 &&
      z > 12 &&
      z < passageWallZ(x) + 0.35 &&
      (x < 76 || z > 19.55 + (x - 80) * 0.041)
    );
  }
  /** Ramp from the court access lane up to the passage level. */
  function passageApproach(x: number, z: number) {
    if (x < 68 || x > 72.5 || z < 11 || z > 23) return undefined;
    const weight =
      smoothstep(x, 68, 72) *
      smoothstep(z, 11, 13) *
      (1 - smoothstep(z, 21, 23));
    const n = nearest(x, z, courtAccess),
      courtHeight = sampledTerrain(n.x, n.z) + 0.38;
    return lerp(courtHeight, passageY, weight);
  }
  /** Enclosed planting bed blended into the passage, not a terrain cliff. */
  function millCornerGround(x: number, z: number) {
    if (x < 109 || x > 114.3 || z < 20.8 || z > 26.8) return undefined;
    const weight = (1 - smoothstep(x, 110, 114.3)) * smoothstep(z, 20.8, 21.5);
    return lerp(sampledTerrain(x, z), passageY - 0.18, weight);
  }
  /** Path from Hough Lane down through the landscaping gate. */
  function gateApproach(x: number, z: number) {
    const [u, v] = gateLocal(x, z);
    if (
      v < 0 ||
      v > 3.2 ||
      Math.abs(u) > 0.9 + 0.7 * Math.pow(v / 3.2, 2) + 0.25
    )
      return undefined;
    const end = gateWorld(0, 3.2),
      n = nearest(...end, roadSeg),
      roadLevel = sampledTerrain(n.x, n.z) + 0.38,
      gateLevel = sampledTerrain(115.41, 21.28) + 0.13;
    return lerp(gateLevel, roadLevel, v / 3.2);
  }
  function riversideFormation(x: number, z: number) {
    if (x < 18 || x > 70 || z > 1) return undefined;
    const n = nearest(x, z, riversideSeg);
    if (n.d > 3) return undefined;
    const weight =
      (1 - smoothstep(n.d, 1, 3)) *
      smoothstep(x, 18, 23) *
      (1 - smoothstep(x, 65, 70));
    return lerp(sampledTerrain(x, z), sampledTerrain(n.x, n.z), weight);
  }
  function brookParkingY(x: number, z: number) {
    return (
      sampledTerrain(44, -50) +
      0.38 +
      ((z + 50) * (sampledTerrain(42, -30) - sampledTerrain(44, -50))) / 20
    );
  }
  function courtY(x: number, z: number) {
    const well = courtHouseGround(x, z, houseEntry);
    if (well !== undefined) return houseEntry - 2.35;
    const approach = passageApproach(x, z);
    if (approach !== undefined) return approach;
    const n = nearest(x, z, courtAccess);
    return sampledTerrain(n.x, n.z) + 0.38;
  }
  /** Soft landscape edges around both car parks; roads and brook excluded. */
  function parkingBank(x: number, z: number) {
    if (
      !(
        (x < 35 && x > 4 && z < 6 && z > -2) ||
        (x > 12 && x < 40 && z < -25 && z > -59)
      )
    )
      return undefined;
    const rd = nearest(x, z, roadSeg);
    if (rd.d < roadWidth(rd.s.f) / 2 + 1 || nearest(x, z, riverSeg).d < 5)
      return undefined;
    const brook = z < -25,
      n = nearest(x, z, brook ? brookOutline : courtOutline);
    if (n.d >= 2) return undefined;
    const edge = brook
      ? brookParkingY(n.x, n.z) - 0.13
      : courtY(n.x, n.z) - 0.18;
    return lerp(edge, sampledTerrain(x, z), smoothstep(n.d, 0, 2));
  }
  /** Eagley Way formation: flatten the verge across the carriageway. */
  function eagleyCutting(x: number, z: number) {
    if (!(x > -310 && x < 120 && z > 15 && z < 180)) return undefined;
    const n = nearest(x, z, eagleySegments);
    if (n.d < 5.4) return sampledTerrain(n.x, n.z);
    if (n.d < 7)
      return lerp(
        sampledTerrain(n.x, n.z),
        sampledTerrain(x, z),
        (n.d - 5.4) / 1.6,
      );
    return undefined;
  }

  const terrainZones: Zone[] = [
    {
      name: 'bridge-rear-patios',
      y: (x, z) => rearFormation(x, z, bridgeBase, sampledTerrain(x, z)),
    },
    { name: 'mill-corner-bed', y: millCornerGround },
    {
      name: 'brook-terrace',
      y: (x, z) =>
        inPoly(x, z, brookTerrace)
          ? Math.min(sampledTerrain(x, z), brookDatum - 0.1)
          : undefined,
    },
    { name: 'riverside-path', y: riversideFormation },
    {
      name: 'brook-parking',
      y: (x, z) =>
        inPoly(x, z, brookParking) ? brookParkingY(x, z) - 0.13 : undefined,
    },
    { name: 'landscape-gate', y: (x, z) => offset(gateApproach(x, z), -0.08) },
    {
      name: 'court-house-wells',
      y: (x, z) =>
        courtHouseGround(x, z, houseEntry) !== undefined
          ? houseEntry - 2.51
          : undefined,
    },
    {
      name: 'passage-approach',
      y: (x, z) => offset(passageApproach(x, z), -0.18),
    },
    {
      name: 'passage',
      y: (x, z) => (inPassage(x, z) ? passageY - 0.18 : undefined),
    },
    {
      name: 'bridge-mill-court',
      y: (x, z) => (inPoly(x, z, court) ? courtY(x, z) - 0.18 : undefined),
    },
    { name: 'parking-banks', y: parkingBank },
    { name: 'eagley-way-cutting', y: eagleyCutting },
  ];
  function terrain(x: number, z: number) {
    for (const zone of terrainZones) {
      const y = zone.y(x, z);
      if (y !== undefined) return y;
    }
    return sampledTerrain(x, z);
  }

  function riverY(x: number, z: number) {
    const n = nearest(x, z, riverSeg);
    return terrain(n.x, n.z) + 0.12;
  }
  // Bridge deck datum: sample beyond both abutments, never the bare-earth river bank.
  // June 2024 GXaLJ6-lQQXM-ZBvWlBeyw shows a continuous modest descent northward.
  function houghDeck(x: number, z: number) {
    const n = nearest(x, z, [{ a: HOUGH_DECK_SOUTH, b: HOUGH_DECK_NORTH }]);
    if (n.d > 5.8 || z > HOUGH_DECK_SOUTH[1] || z < HOUGH_DECK_NORTH[1])
      return undefined;
    return (
      lerp(
        sampledTerrain(...HOUGH_DECK_SOUTH),
        sampledTerrain(...HOUGH_DECK_NORTH),
        n.t,
      ) + 0.38
    );
  }
  function rawRoadY(x: number, z: number, r: Nearest) {
    if (r.s?.f.id === OSM.houghFootbridgeSouthPath) {
      const p: P[] = r.s.f.points,
        a = p[0],
        b = p[p.length - 1];
      return lerp(
        houghDeck(...a)!,
        sampledTerrain(...b) + 0.38,
        nearest(x, z, [{ a, b }]).t,
      );
    }
    const deck =
      r.s?.f.name === 'Hough Lane' ||
      [OSM.houghJunctionFootway, OSM.houghFootbridge].includes(r.s?.f.id)
        ? houghDeck(x, z)
        : undefined;
    if (deck !== undefined) return deck;
    if (r.s?.f.id === OSM.riversidePath && x > 18 && x < 70)
      return terrain(r.x, r.z) + 0.13;
    if (inPoly(x, z, brookParking)) return brookParkingY(x, z) + 0.025;
    if (r.s?.f.tags.bridge) {
      const p = r.s.f.points,
        a = p[0],
        b = p[p.length - 1],
        n = nearest(x, z, [{ a, b }]);
      return lerp(terrain(a[0], a[1]), terrain(b[0], b[1]), n.t) + 0.38;
    }
    return terrain(r.x, r.z) + 0.38;
  }
  const J = HOUGH_JUNCTION_BOX;
  function inJunctionBox(x: number, z: number) {
    return x > J.x0 && x < J.x1 && z > J.z0 && z < J.z1;
  }
  function junctionBaseY(z: number) {
    const n = nearest(143.4, -38.8, roadSeg);
    return lerp(
      terrain(n.x, n.z) + 0.38,
      houghDeck(145.9, -13.64)!,
      clamp((z + 38.8) / 25.16, 0, 1),
    );
  }
  function junctionPavementY(x: number, z: number) {
    const drop =
      smoothstep(z, -27.5, -26.7) * (1 - smoothstep(z, -20.4, -19.6));
    return junctionBaseY(z) + 0.08 * (1 - drop);
  }
  function roadY(x: number, z: number, r = nearest(x, z, roadSeg)) {
    const original = rawRoadY(x, z, r);
    if (
      !(x >= J.x0 && x <= J.x1 && z >= J.z0 && z <= J.z1) ||
      [OSM.houghFootbridge, OSM.houghFootbridgeSouthPath].includes(r.s?.f.id)
    )
      return original;
    return lerp(original, junctionBaseY(z), junctionGroundWeight(x, z));
  }

  const groundZones: Zone[] = [
    {
      name: 'hough-footbridge',
      y: (x, z) => {
        const foot = nearest(x, z, houghFootSegments);
        return foot.d <= 0.95 ? roadY(x, z, foot) : undefined;
      },
    },
    {
      name: 'hough-junction-pavement',
      y: (x, z) =>
        onJunctionPavement(x, z) ? junctionPavementY(x, z) : undefined,
    },
    {
      name: 'hough-junction-road',
      y: (x, z) =>
        inJunctionBox(x, z) && junctionGroundWeight(x, z) > 0
          ? roadY(x, z)
          : undefined,
    },
    {
      name: 'brook-parking',
      y: (x, z) =>
        inPoly(x, z, brookParking) ? brookParkingY(x, z) : undefined,
    },
    { name: 'landscape-gate', y: gateApproach },
    {
      name: 'court-house-wells',
      y: (x, z) => courtHouseGround(x, z, houseEntry),
    },
    { name: 'passage-approach', y: passageApproach },
    { name: 'passage', y: (x, z) => (inPassage(x, z) ? passageY : undefined) },
    {
      name: 'bridge-mill-court',
      y: (x, z) => (inPoly(x, z, court) ? courtY(x, z) : undefined),
    },
  ];
  function ground(x: number, z: number) {
    for (const zone of groundZones) {
      const y = zone.y(x, z);
      if (y !== undefined) return y;
    }
    const r = nearest(x, z, roadSeg);
    return r.d < roadWidth(r.s.f) / 2 + 1.3
      ? roadY(x, z, r)
      : terrain(x, z) + 0.13;
  }

  return {
    roadSeg,
    riverSeg,
    eagleySegments,
    riversideSeg,
    court,
    brookDatum,
    bridgeBase,
    passageY,
    houseEntry,
    sampledTerrain,
    terrain,
    ground,
    roadY,
    riverY,
    courtY,
    brookParkingY,
    junctionPavementY,
    gateApproach,
    inPassage,
    passageWallHeight,
  };
}

function offset(y: number | undefined, d: number) {
  return y === undefined ? undefined : y + d;
}

export type Surface = ReturnType<typeof createSurface>;
