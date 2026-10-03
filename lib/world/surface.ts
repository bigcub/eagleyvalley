import {
  createSchoolForecourtPlan,
  inSchoolPavement,
  inSchoolGarden,
  schoolWorld,
} from '../landmarks/school-forecourt';
import {
  createBlackburnEntrancePlan,
  inBlackburnEntrance,
} from '../landmarks/blackburn-entrance';
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
  BRIDGE_PARKING,
  BROOK_WEST_ENTRANCE,
  BROOK_WEST,
  BROOK_PARKING_ENTRY,
  GARAGE_BACKING,
  EAGLEY_BROW_ENTRANCE,
  EAGLEY_HOUGH_BEND,
  HOUGH_DECK_NORTH,
  HOUGH_DECK_SOUTH,
  HOUGH_FOOTBRIDGE_NORTH,
  LOWER_EAGLEY,
  WOODLAND_STEPS,
  LANDSCAPING_GATE,
  OSM,
  PASSAGE_GATE,
  TURNING_CIRCLE,
  TURNING_CIRCLE_DETAILS,
} from './layout';
import {
  createEagleyHoughBendPlan,
  inEagleyHoughBendPavement,
} from '../landmarks/eagley-hough-bend';
import {
  createTurningCirclePlan,
  inTurningCircle,
  turningCircleEdgeDistance,
} from '../landmarks/turning-circle';
import { rearFormation } from '../landmarks/bridge-rear';
import { passageWallZ } from '../landmarks/bridge-passage';
import { bridgeRoadWallHeight } from '../landmarks/bridge-road-wall';
import { stairLocal } from '../landmarks/woodland-steps';
import { gateLocal, gateWorld } from '../landmarks/bridge-side-gate';
import { brookTerrace } from '../landmarks/brook-terrace';
import { brookParking } from '../landmarks/brook-mill-grounds';
import { courtHouseGround } from '../landmarks/court-houses';
import {
  HOUGH_CENTRE,
  PAVE_H,
  inHoughArea,
  inHoughFoundation,
  outsideIsland,
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
    gateRoadSegments = roadSeg.filter((s) => roadWidth(s.f) > 2),
    passageGateOutline = outline(PASSAGE_GATE.approach),
    riverSeg = segments(water),
    eagleySegments = segments(roads.filter((f) => f.name === 'Eagley Way')),
    browSegments = segments(roads.filter((f) => f.id === OSM.eagleyBrow)),
    riversideSeg = segments(roads.filter((f) => f.id === OSM.riversidePath)),
    houghFootSegments = roadSeg.filter((s) =>
      [OSM.houghFootbridge, OSM.houghFootbridgeSouthPath].includes(s.f.id),
    ),
    court = BRIDGE_MILL_COURT,
    courtOutline = outline(court),
    brookOutline = outline(brookParking),
    brookEntryRoad = segments(
      roads.filter((f) => f.id === OSM.threadfoldWayLoop),
    );

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
        (bridgeRoadWallHeight(x) + 0.18) -
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
    if (x < 66.5 || x > 73 || z < 11 || z > 25) return undefined;
    const weight = smoothstep(x, 66.5, 71) * smoothstep(z, 11, 12);
    return lerp(courtFormation(x, z), passageY, weight);
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
      v < -0.001 ||
      v > 3.201 ||
      Math.abs(u) > 0.9 + 0.7 * Math.pow(v / 3.2, 2) + 0.25
    )
      return undefined;
    return gatePathLevel(v);
  }
  let gateRoadLevel: number | undefined;
  function gatePathLevel(v: number) {
    const end = gateWorld(0, 3.2),
      n = nearest(...end, gateRoadSegments),
      roadLevel = (gateRoadLevel ??= roadY(...end, n)),
      // M07: the shared entrance meets the passage datum. The coarse EA
      // point previously put the gate nearly 2m below that entrance.
      // This fitted threshold level is provisional pending closer evidence.
      gateLevel = passageY;
    return lerp(gateLevel, roadLevel, clamp(v / 3.2, 0, 1));
  }
  // M07. Existing passage and gate/road end datums joined over the left
  // entrance branch. This formation is estimated, not a surveyed ramp.
  function passageGateLevel(x: number, z: number) {
    const [, v] = gateLocal(x, z);
    return lerp(
      passageY,
      gatePathLevel(v),
      smoothstep(x, ...PASSAGE_GATE.gradeBlend),
    );
  }
  function passageGateGround(x: number, z: number) {
    return inPoly(x, z, PASSAGE_GATE.approach)
      ? passageGateLevel(x, z)
      : undefined;
  }
  function passageGateFoundation(x: number, z: number) {
    if (x < 108.1 || x > 117.65 || z < 21.3 || z > 25.7) return undefined;
    const edge = nearest(x, z, passageGateOutline);
    if (!inPoly(x, z, PASSAGE_GATE.approach) && edge.d > 0.45) return undefined;
    const road = nearest(x, z, gateRoadSegments);
    if (road.d <= roadWidth(road.s.f) / 2 + 0.15) return undefined;
    return passageGateLevel(x, z) - 0.08;
  }
  // M08. First part of the mapped shared path, with an estimated grade
  // from the retained passage threshold back to the coarse EA formation.
  const landscapeSegments = segments(
    roads
      .filter((f) => f.id === OSM.riversidePath)
      .map((f) => ({
        ...f,
        points: [...LANDSCAPING_GATE.pathLead, ...f.points.slice(2, 4)],
      })),
  );
  function landscapePathLevel(x: number, z: number) {
    const n = nearest(x, z, landscapeSegments);
    const d = Math.hypot(n.x - 115.41, n.z - 21.28);
    return lerp(
      passageY,
      sampledTerrain(n.x, n.z) + 0.38,
      smoothstep(d, 0, LANDSCAPING_GATE.gradeLength),
    );
  }
  function landscapePathGround(x: number, z: number) {
    const b = LANDSCAPING_GATE.pathBounds;
    if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return undefined;
    return nearest(x, z, landscapeSegments).d <=
      LANDSCAPING_GATE.pathWidth / 2 + 0.08
      ? landscapePathLevel(x, z)
      : undefined;
  }
  function landscapePathFormation(x: number, z: number) {
    const b = LANDSCAPING_GATE.pathBounds;
    if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return undefined;
    const n = nearest(x, z, landscapeSegments);
    if (n.d > 1.3) return undefined;
    return lerp(
      landscapePathLevel(x, z) - 0.38,
      sampledTerrain(x, z),
      smoothstep(n.d, 0.7, 1.3),
    );
  }
  const woodlandUpperPoints = [
    WOODLAND_STEPS.top,
    ...roads.find((f) => f.id === OSM.millWoodlandSteps)!.points.slice(1),
  ];
  const woodlandSeg = segments([
    {
      ...roads.find((f) => f.id === OSM.millWoodlandSteps)!,
      points: woodlandUpperPoints,
    },
  ]);
  const woodlandBounds = {
    minX:
      Math.min(
        ...woodlandUpperPoints.map((p) => p[0]),
        WOODLAND_STEPS.bottom[0],
      ) - 1.3,
    maxX:
      Math.max(
        ...woodlandUpperPoints.map((p) => p[0]),
        WOODLAND_STEPS.bottom[0],
      ) + 1.3,
    minZ: WOODLAND_STEPS.bottom[1] - 2.1,
    maxZ: Math.max(...woodlandUpperPoints.map((p) => p[1])) + 2.1,
  };
  const inWoodlandBounds = (x: number, z: number) =>
    x >= woodlandBounds.minX &&
    x <= woodlandBounds.maxX &&
    z >= woodlandBounds.minZ &&
    z <= woodlandBounds.maxZ;
  let woodlandBase: number | undefined;
  function woodlandStepsY(x: number, z: number) {
    const [d, side] = stairLocal(x, z),
      length = Math.hypot(
        WOODLAND_STEPS.top[0] - WOODLAND_STEPS.bottom[0],
        WOODLAND_STEPS.top[1] - WOODLAND_STEPS.bottom[1],
      );
    if (
      d < -0.65 ||
      d > length ||
      Math.abs(side) > WOODLAND_STEPS.width / 2 + 0.1
    )
      return undefined;
    const base = (woodlandBase ??= vehicleRoadY(...WOODLAND_STEPS.bottom));
    return (
      base +
      WOODLAND_STEPS.rise *
        (d < 0
          ? 0
          : Math.min(
              WOODLAND_STEPS.count,
              Math.floor((d / length) * WOODLAND_STEPS.count) + 1,
            ))
    );
  }
  function woodlandUpperY(x: number, z: number) {
    const n = nearest(x, z, woodlandSeg),
      d = Math.hypot(n.x - WOODLAND_STEPS.top[0], n.z - WOODLAND_STEPS.top[1]);
    const start =
      (woodlandBase ??= vehicleRoadY(...WOODLAND_STEPS.bottom)) +
      WOODLAND_STEPS.count * WOODLAND_STEPS.rise;
    return lerp(start, sampledTerrain(n.x, n.z) + 0.38, smoothstep(d, 0, 5));
  }
  function woodlandGround(x: number, z: number) {
    if (!inWoodlandBounds(x, z)) return undefined;
    const stair = woodlandStepsY(x, z);
    if (stair !== undefined) return stair;
    const n = nearest(x, z, woodlandSeg);
    return n.d < WOODLAND_STEPS.width / 2 + 0.1
      ? woodlandUpperY(x, z)
      : undefined;
  }
  function woodlandFormation(x: number, z: number) {
    if (!inWoodlandBounds(x, z)) return undefined;
    const road = nearest(x, z, gateRoadSegments);
    if (road.d <= roadWidth(road.s.f) / 2 + 0.35) return undefined;
    const lower = nearest(x, z, [
        { a: WOODLAND_STEPS.bottom, b: WOODLAND_STEPS.top },
      ]),
      upper = nearest(x, z, woodlandSeg);
    const n = lower.d < upper.d ? lower : upper;
    if (n.d > 2) return undefined;
    const y =
      lower.d < upper.d
        ? (woodlandStepsY(lower.x, lower.z) ?? woodlandUpperY(lower.x, lower.z))
        : woodlandUpperY(n.x, n.z);
    return lerp(
      Math.min(sampledTerrain(x, z), y - 0.65),
      sampledTerrain(x, z),
      smoothstep(n.d, 0.8, 2),
    );
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
  function brookParkingPlane(x: number, z: number) {
    return (
      sampledTerrain(44, -50) +
      0.38 +
      ((z + 50) * (sampledTerrain(42, -30) - sampledTerrain(44, -50))) / 20
    );
  }
  function brookEntryY(x: number, z: number) {
    const n = nearest(x, z, brookEntryRoad);
    return lerp(
      sampledTerrain(n.x, n.z) + 0.38,
      brookParkingPlane(x, z),
      smoothstep(
        Math.max(0, z - n.z),
        BROOK_PARKING_ENTRY.blendStart,
        BROOK_PARKING_ENTRY.blendEnd,
      ),
    );
  }
  function brookParkingY(x: number, z: number) {
    return inPoly(x, z, BROOK_PARKING_ENTRY.outline)
      ? brookEntryY(x, z)
      : brookParkingPlane(x, z);
  }
  const brookWestEntry = brookParkingY(...BROOK_WEST_ENTRANCE.centre) + 0.02;
  function brookWestApproachY(x: number, z: number) {
    const distance = Math.max(
      0,
      -(x - BROOK_WEST_ENTRANCE.centre[0]) *
        Math.cos(BROOK_WEST_ENTRANCE.angle) +
        (z - BROOK_WEST_ENTRANCE.centre[1]) *
          Math.sin(BROOK_WEST_ENTRANCE.angle),
    );
    return lerp(
      brookWestEntry,
      brookParkingY(x, z),
      smoothstep(distance, 0.4, 1.8),
    );
  }
  // M24: one smooth court formation. Keep the house wells in their own
  // named zone; they must never drag the carriageway into the basement strip.
  const courtEntryY = sampledTerrain(...BRIDGE_PARKING.entrance) + 0.38;
  function courtFormation(x: number, z: number) {
    const west =
      courtEntryY +
      0.02 * (z - BRIDGE_PARKING.entrance[1]) +
      0.006 * (x - BRIDGE_PARKING.entrance[0]);
    return lerp(
      west,
      houseEntry,
      smoothstep(x, BRIDGE_PARKING.rampStartX, BRIDGE_PARKING.rampEndX),
    );
  }
  function courtY(x: number, z: number) {
    return passageApproach(x, z) ?? courtFormation(x, z);
  }
  function garageBackingLevel(x: number, z: number) {
    const D = GARAGE_BACKING;
    const weight =
      smoothstep(x, D.startX, D.coreStartX) *
      (1 - smoothstep(x, D.coreEndX, D.endX));
    return lerp(sampledTerrain(x, z) + 0.13, courtY(x, z), weight);
  }
  function garageBackingY(x: number, z: number) {
    if (passageApproach(x, z) !== undefined || inPassage(x, z))
      return undefined;
    const D = GARAGE_BACKING;
    if (x < D.startX || x > D.endX) return undefined;
    const edge = D.back.findIndex((p, i) => i > 0 && x <= p[0]);
    if (edge < 1) return undefined;
    const a = D.back[edge - 1],
      b = D.back[edge];
    const backZ = lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
    const road = nearest(x, z, eagleySegments);
    if (z < backZ || z > road.z - D.offset + 0.15) return undefined;
    return garageBackingLevel(x, z);
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

  const schoolForecourtPlan = createSchoolForecourtPlan();
  // Photographed level front garden, fitted to its west EA anchor. Estimated.
  const schoolHouseBase = sampledTerrain(...schoolWorld(0, 0)) + 0.15;
  function schoolPavementY(x: number, z: number) {
    const n = nearest(x, z, gateRoadSegments);
    return sampledTerrain(n.x, n.z) + 0.38;
  }
  function schoolGround(x: number, z: number) {
    if (inSchoolGarden(x, z, schoolForecourtPlan)) return schoolHouseBase;
    if (inSchoolPavement(x, z, schoolForecourtPlan))
      return schoolPavementY(x, z);
    return undefined;
  }
  const blackburnEntrancePlan = createBlackburnEntrancePlan();
  const entranceRoads = roadSeg.filter(
    (s) => s.f.name === 'Blackburn Road' || s.f.id === OSM.eagleyWay,
  );
  const entranceArms = [...new Set(entranceRoads.map((s) => s.f.id))].map(
    (id) => entranceRoads.filter((s) => s.f.id === id),
  );
  // Keep each arm's centreline datum. Blend the two nearest arms only where
  // their distance difference is under 2m, avoiding the former nearest switch.
  function blackburnEntranceY(x: number, z: number) {
    const arms = entranceArms
      .map((segs) => nearest(x, z, segs))
      .sort((a, b) => a.d - b.d);
    const level = (n: Nearest) =>
      (eagleyCutting(n.x, n.z) ?? sampledTerrain(n.x, n.z)) + 0.38;
    const weight = 0.5 + 0.5 * smoothstep(arms[1].d - arms[0].d, 0, 2);
    return lerp(level(arms[1]), level(arms[0]), weight);
  }
  function entranceGround(x: number, z: number) {
    return inBlackburnEntrance(x, z, blackburnEntrancePlan)
      ? blackburnEntranceY(x, z)
      : undefined;
  }

  const entranceEdges = [
    blackburnEntrancePlan.road,
    blackburnEntrancePlan.gate.outline,
    blackburnEntrancePlan.hill.outline,
  ].flatMap((p) => p.map((a, i) => ({ a, b: p[(i + 1) % p.length] })));
  function entranceFormation(x: number, z: number) {
    const ground = entranceGround(x, z);
    if (ground !== undefined) return ground - 0.38;
    if (
      x < -309 ||
      x > -275 ||
      z < 143 ||
      z > 174 ||
      nearest(x, z, entranceEdges).d > 1.4
    )
      return undefined;
    return Math.min(
      eagleyCutting(x, z) ?? sampledTerrain(x, z),
      blackburnEntranceY(x, z) - 0.38,
    );
  }
  const eagleyHoughBendPlan = createEagleyHoughBendPlan();
  const bendRoads = roadSeg.filter((s) =>
    [
      OSM.eagleyWay,
      OSM.houghMillApproach,
      OSM.houghTurningApproach,
      OSM.busTurningLoop,
    ].includes(s.f.id),
  );
  // Local grade fitted to existing approach-end levels. Blend it into the
  // original roads; do not carry the old cutting's flat shelf into the bend.
  const mill = roads.find((f) => f.id === OSM.eagleyWay)!;
  const hough = roads.find((f) => f.id === OSM.houghTurningApproach)!;
  const loop = roads.find((f) => f.id === OSM.busTurningLoop)!;
  const bendAnchors = [
    mill.points.at(-2)!,
    hough.points.at(-1)!,
    loop.points.at(-2)!,
  ];
  const bendOrigin = mill.points.at(-1)!;
  function originalBendY(x: number, z: number, n = nearest(x, z, bendRoads)) {
    const deck = n.s.f.name === 'Hough Lane' ? houghDeck(x, z) : undefined;
    return deck ?? (eagleyCutting(n.x, n.z) ?? sampledTerrain(n.x, n.z)) + 0.38;
  }
  const bendPlane = solve3(
    bendAnchors.flatMap(([x, z]) => [1, x - bendOrigin[0], z - bendOrigin[1]]),
    bendAnchors.map((p) => originalBendY(...p)),
  );
  function bendLevel(x: number, z: number, supplied?: Nearest) {
    const b = EAGLEY_HOUGH_BEND.bounds;
    if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return undefined;
    const n = supplied ?? nearest(x, z, bendRoads);
    if (!bendRoads.some((s) => s.f.id === n.s.f.id)) return undefined;
    const blend = EAGLEY_HOUGH_BEND.gradeBlend;
    const weight =
      smoothstep(x, blend.west0, blend.west1) *
      (1 - smoothstep(x, blend.east0, blend.east1)) *
      smoothstep(z, blend.north0, blend.north1);
    const [a, dx, dz] = bendPlane;
    return lerp(
      originalBendY(x, z, n),
      a + dx * (x - bendOrigin[0]) + dz * (z - bendOrigin[1]),
      weight,
    );
  }
  function eagleyHoughBendY(x: number, z: number) {
    return circleLevel(x, z) ?? bendLevel(x, z) ?? originalBendY(x, z);
  }
  function bendFormation(x: number, z: number) {
    const b = EAGLEY_HOUGH_BEND.bounds;
    if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return undefined;
    if (inEagleyHoughBendPavement(x, z, eagleyHoughBendPlan))
      return eagleyHoughBendY(x, z) - 0.38;
    const n = nearest(x, z, bendRoads);
    return n.d < roadWidth(n.s.f) / 2 + 0.4
      ? eagleyHoughBendY(x, z) - 0.38
      : undefined;
  }

  const turningCirclePlan = createTurningCirclePlan();
  // One grade across both arms and the exit. The previous nearest-centreline
  // switch dropped the car at the exit. These EA-derived datums are estimated,
  // not surveyed road levels; the east anchor retains the loop's existing level.
  const circleOrigin = TURNING_CIRCLE.outer[0];
  const circleAnchors = [circleOrigin, HOUGH_DECK_SOUTH, loop.points[4]];
  const circlePlane = solve3(
    circleAnchors.flatMap(([x, z]) => [
      1,
      x - circleOrigin[0],
      z - circleOrigin[1],
    ]),
    [
      bendLevel(...circleOrigin) ?? originalBendY(...circleOrigin),
      sampledTerrain(...HOUGH_DECK_SOUTH) + 0.38,
      sampledTerrain(...loop.points[4]) + 0.38,
    ],
  );
  function circleLevel(x: number, z: number) {
    const b = TURNING_CIRCLE.bounds;
    if (x < b.x0 || x > b.x1 || z < HOUGH_DECK_SOUTH[1] || z > b.z1)
      return undefined;
    const blend = TURNING_CIRCLE.gradeBlend;
    const [a, dx, dz] = circlePlane;
    const flat = a + dx * (x - circleOrigin[0]) + dz * (z - circleOrigin[1]);
    const [ba, bx, bz] = bendPlane;
    const west = ba + bx * (x - bendOrigin[0]) + bz * (z - bendOrigin[1]);
    const across = lerp(west, flat, smoothstep(x, blend.west0, blend.west1));
    const mouth = nearest(x, HOUGH_DECK_SOUTH[1], [
      { a: HOUGH_DECK_SOUTH, b: HOUGH_DECK_NORTH },
    ]);
    return lerp(
      // Match the inclined deck across the whole mouth, including its east
      // kerb. A single centreline datum left a small overlapping surface seam.
      lerp(
        sampledTerrain(...HOUGH_DECK_SOUTH),
        sampledTerrain(...HOUGH_DECK_NORTH),
        mouth.t,
      ) + 0.38,
      across,
      smoothstep(z, blend.north0, blend.north1),
    );
  }
  function turningCircleY(x: number, z: number) {
    return circleLevel(x, z) ?? houghDeck(x, z) ?? originalBendY(x, z);
  }
  function circleFormation(x: number, z: number) {
    if (inTurningCircle(x, z, turningCirclePlan))
      return (
        turningCircleY(x, z) +
        (inPoly(x, z, turningCirclePlan.grass) ? 0.04 : -0.35)
      );
    const distance = turningCircleEdgeDistance(x, z, turningCirclePlan);
    if (distance > 2) return undefined;
    return lerp(
      turningCircleY(x, z) - 0.35,
      sampledTerrain(x, z),
      smoothstep(distance, 0, 2),
    );
  }
  const bedBounds = {
    x0: Math.min(...turningCirclePlan.bed.map((p) => p[0])),
    x1: Math.max(...turningCirclePlan.bed.map((p) => p[0])),
    z0: Math.min(...turningCirclePlan.bed.map((p) => p[1])),
    z1: Math.max(...turningCirclePlan.bed.map((p) => p[1])),
  };
  function circleBedLevel(x: number, z: number) {
    const b = bedBounds;
    if (
      x < b.x0 ||
      x > b.x1 ||
      z < b.z0 ||
      z > b.z1 ||
      !inPoly(x, z, turningCirclePlan.bed)
    )
      return undefined;
    return turningCircleY(x, z) + TURNING_CIRCLE_DETAILS.bed.height;
  }
  const bedFace = turningCirclePlan.bedFront.slice(1).map((b, i) => ({
    a: turningCirclePlan.bedFront[i],
    b,
  }));
  function bedFoundation(x: number, z: number) {
    const b = bedBounds;
    if (x < b.x0 - 1.5 || x > b.x1 + 1.5 || z < b.z0 - 1.5 || z > b.z1 + 1.5)
      return undefined;
    if (!inPoly(x, z, turningCirclePlan.bed) && nearest(x, z, bedFace).d > 1.5)
      return undefined;
    // Include the grid cells beside the wall, so their triangles cannot rise
    // through the footway when an adjoining terrain vertex is on the bank.
    return Math.min(sampledTerrain(x, z), turningCircleY(x, z) - 0.35);
  }
  function shelterApronLevel(x: number, z: number) {
    const s = TURNING_CIRCLE_DETAILS.shelter;
    if (Math.abs(x - s.centre[0]) > 3 || Math.abs(z - s.centre[1]) > 3)
      return undefined;
    return inPoly(x, z, turningCirclePlan.shelterApron)
      ? turningCircleY(x, z)
      : undefined;
  }

  /**
   * EAG-030..032: the old lane rises out of the cutting. Ease its first 14m
   * onto the carriageway edge, using EA levels beyond the mouth. The blend
   * and width are estimates, not measured path levels. Never claims the road.
   */
  function browRoadY(x: number, z: number) {
    const lane = nearest(x, z, browSegments);
    const road = nearest(lane.x, lane.z, eagleySegments);
    const original = sampledTerrain(lane.x, lane.z) + 0.38;
    const edge = sampledTerrain(road.x, road.z) + 0.38;
    return lerp(edge, original, smoothstep(road.d, 3.4, 10));
  }
  function browApproach(x: number, z: number) {
    const b = EAGLEY_BROW_ENTRANCE.formationBounds;
    if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return undefined;
    const road = nearest(x, z, eagleySegments);
    if (road.d <= 3.4 || road.d > 16) return undefined;
    const lane = nearest(x, z, browSegments);
    if (lane.d > EAGLEY_BROW_ENTRANCE.width / 2 + 0.2) return undefined;
    let along = 0;
    for (const s of browSegments) {
      const length = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      if (s === lane.s) {
        along += length * lane.t;
        break;
      }
      along += length;
    }
    if (along > EAGLEY_BROW_ENTRANCE.formationLength) return undefined;
    return browRoadY(x, z);
  }

  // Guards the junction terrain zone against re-entry: road heights sample
  // terrain on centrelines that lie inside the junction.
  let inJunctionTerrain = false;
  const terrainZones: Zone[] = [
    {
      name: 'school-front-garden',
      y: (x, z) =>
        inSchoolGarden(x, z, schoolForecourtPlan)
          ? schoolHouseBase - 0.13
          : undefined,
    },
    {
      name: 'school-front-pavement',
      y: (x, z) =>
        inSchoolPavement(x, z, schoolForecourtPlan)
          ? schoolPavementY(x, z) - 0.38
          : undefined,
    },
    {
      name: 'blackburn-entrance',
      y: entranceFormation,
    },
    {
      name: 'garage-back-formation',
      y: (x, z) =>
        offset(garageBackingY(x, z), inPoly(x, z, court) ? -0.18 : -0.13),
    },
    {
      name: 'brook-parking-entry',
      y: (x, z) =>
        inPoly(x, z, BROOK_PARKING_ENTRY.outline)
          ? brookEntryY(x, z) - (inPoly(x, z, brookParking) ? 0.13 : 0.38)
          : undefined,
    },
    {
      name: 'hough-junction',
      y: (x, z) => {
        if (inJunctionTerrain || !inHoughFoundation(x, z)) return undefined;
        inJunctionTerrain = true;
        const y = Math.min(sampledTerrain(x, z), vehicleRoadY(x, z) - 0.35);
        inJunctionTerrain = false;
        return y;
      },
    },
    {
      // Grass rises to meet the island's brook-side edge over 2m.
      name: 'hough-island-bank',
      y: (x, z) => {
        const d = outsideIsland(x, z);
        if (d === undefined || d > 2.2 || inJunctionTerrain) return undefined;
        inJunctionTerrain = true;
        const edge = vehicleRoadY(x, z) + PAVE_H - 0.06;
        inJunctionTerrain = false;
        return lerp(edge, sampledTerrain(x, z), smoothstep(d, 0.2, 2.2));
      },
    },
    {
      name: 'bridge-rear-patios',
      y: (x, z) => rearFormation(x, z, bridgeBase, sampledTerrain(x, z)),
    },
    {
      name: 'brook-west-entrance',
      y: (x, z) =>
        inPoly(x, z, BROOK_WEST_ENTRANCE.apron)
          ? brookWestApproachY(x, z) - 0.1
          : undefined,
    },
    {
      name: 'brook-west-wing-approach',
      y: (x, z) =>
        inPoly(x, z, BROOK_WEST.apron)
          ? brookWestApproachY(x, z) - 0.1
          : undefined,
    },
    { name: 'woodland-steps', y: woodlandFormation },
    { name: 'shared-landscaping-path', y: landscapePathFormation },
    { name: 'passage-gate-approach', y: passageGateFoundation },
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
    {
      name: 'eagley-brow-entrance',
      y: (x, z) => offset(browApproach(x, z), -0.18),
    },
    {
      // The earth plate supplies the raised bed. Keep the coarse 2m grass
      // mesh below the adjacent paving rather than interpolating through it.
      name: 'turning-circle-brick-bed-foundation',
      y: bedFoundation,
    },
    {
      name: 'turning-circle-shelter-apron',
      y: (x, z) => offset(shelterApronLevel(x, z), -0.35),
    },
    { name: 'bus-turning-circle', y: circleFormation },
    { name: 'eagley-hough-bend', y: bendFormation },
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
    if (
      r.s?.f.id === OSM.riversidePath &&
      landscapePathGround(x, z) !== undefined
    )
      return landscapePathLevel(x, z);
    if (r.s?.f.id === OSM.eagleyBrow) return browRoadY(x, z);
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
  // Hough junction: one smooth surface. Arm heights come from different
  // sources (bridge deck, terrain under each centreline), which disagree where
  // the arms meet and jolted the car. Inside 7m the road follows a plane
  // fitted to the arms between 7m and 14m out; it blends back to each arm's
  // own height by 14m.
  const JR0 = 7,
    JR1 = 14;
  const vehicleSeg = roadSeg.filter((s) => roadWidth(s.f) > 2);
  let plane: [number, number, number] | undefined;
  function junctionPlane() {
    if (plane) return plane;
    inJunctionTerrain = true;
    const rows: [number, number, number][] = [];
    for (const s of vehicleSeg) {
      const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      for (let d = 0; d <= len; d += 0.5) {
        const x = s.a[0] + ((s.b[0] - s.a[0]) * d) / (len || 1),
          z = s.a[1] + ((s.b[1] - s.a[1]) * d) / (len || 1);
        const r = Math.hypot(x - HOUGH_CENTRE[0], z - HOUGH_CENTRE[1]);
        if (r < JR0 || r > JR1) continue;
        rows.push([
          x - HOUGH_CENTRE[0],
          z - HOUGH_CENTRE[1],
          rawRoadY(x, z, nearest(x, z, [s])),
        ]);
      }
    }
    inJunctionTerrain = false;
    // Least squares for y = a + b*dx + c*dz.
    const m = [0, 0, 0, 0, 0, 0, 0, 0, 0],
      v = [0, 0, 0];
    for (const [dx, dz, y] of rows) {
      const f = [1, dx, dz];
      for (let r = 0; r < 3; r++) {
        v[r] += f[r] * y;
        for (let c = 0; c < 3; c++) m[r * 3 + c] += f[r] * f[c];
      }
    }
    plane = solve3(m, v);
    return plane;
  }
  function roadY(x: number, z: number, r = nearest(x, z, roadSeg)) {
    if (inPoly(x, z, court) && r.s?.f.id === OSM.bridgeMillCourtAccess)
      return courtY(x, z);
    const entrance = entranceGround(x, z);
    if (entrance !== undefined) return entrance;
    if (inPoly(x, z, BROOK_PARKING_ENTRY.outline)) return brookEntryY(x, z);
    // All overlapping approach meshes share the finished formation, including
    // the narrow bridge-side mouth north of the loop's grade blend.
    if (inTurningCircle(x, z, turningCirclePlan)) return turningCircleY(x, z);
    const circle = circleLevel(x, z);
    if (
      circle !== undefined &&
      [
        OSM.eagleyWay,
        OSM.houghMillApproach,
        OSM.houghTurningApproach,
        OSM.busTurningLoop,
      ].includes(r.s?.f.id)
    )
      return circle;
    const bend = bendLevel(x, z, r);
    if (bend !== undefined) return bend;
    const original = rawRoadY(x, z, r);
    const d = Math.hypot(x - HOUGH_CENTRE[0], z - HOUGH_CENTRE[1]);
    if (
      d >= JR1 ||
      [OSM.houghFootbridge, OSM.houghFootbridgeSouthPath].includes(r.s?.f.id)
    )
      return original;
    const [a, b, c] = junctionPlane();
    const flat = a + b * (x - HOUGH_CENTRE[0]) + c * (z - HOUGH_CENTRE[1]);
    return lerp(flat, original, smoothstep(d, JR0, JR1));
  }
  /** Road height using the nearest carriageway, ignoring paths. */
  function vehicleRoadY(x: number, z: number) {
    return roadY(x, z, nearest(x, z, vehicleSeg));
  }

  const groundZones: Zone[] = [
    { name: 'school-forecourt', y: schoolGround },
    { name: 'blackburn-entrance', y: entranceGround },
    { name: 'garage-back-formation', y: garageBackingY },
    {
      name: 'brook-parking-entry',
      y: (x, z) =>
        inPoly(x, z, BROOK_PARKING_ENTRY.outline)
          ? brookEntryY(x, z)
          : undefined,
    },
    {
      name: 'brook-west-entrance',
      y: (x, z) =>
        inPoly(x, z, BROOK_WEST_ENTRANCE.apron)
          ? brookWestApproachY(x, z)
          : undefined,
    },
    {
      name: 'brook-west-wing-approach',
      y: (x, z) =>
        inPoly(x, z, BROOK_WEST.apron) ? brookWestApproachY(x, z) : undefined,
    },
    { name: 'woodland-steps', y: woodlandGround },
    { name: 'passage-gate-approach', y: passageGateGround },
    { name: 'landscape-gate', y: gateApproach },
    { name: 'shared-landscaping-path', y: landscapePathGround },
    { name: 'turning-circle-shelter-apron', y: shelterApronLevel },
    {
      name: 'turning-circle-brick-bed',
      y: circleBedLevel,
    },
    {
      name: 'bus-turning-circle-road-and-pavement',
      y: (x, z) =>
        inTurningCircle(x, z, turningCirclePlan)
          ? turningCircleY(x, z)
          : undefined,
    },
    {
      name: 'hough-footbridge',
      y: (x, z) => {
        const foot = nearest(x, z, houghFootSegments);
        if (foot.d > 0.95) return undefined;
        // The deck eases onto the junction pavement at its north end.
        const deck = roadY(x, z, foot);
        if (!inHoughArea(x, z)) return deck;
        const fromEnd = Math.hypot(
          x - HOUGH_FOOTBRIDGE_NORTH[0],
          z - HOUGH_FOOTBRIDGE_NORTH[1],
        );
        return lerp(vehicleRoadY(x, z), deck, smoothstep(fromEnd, 0.5, 3));
      },
    },
    // Junction carriageway, island and pavements: walked and driven at road
    // level, like pavements elsewhere.
    {
      name: 'hough-junction',
      y: (x, z) => (inHoughArea(x, z) ? vehicleRoadY(x, z) : undefined),
    },
    {
      name: 'brook-parking',
      y: (x, z) =>
        inPoly(x, z, brookParking) ? brookParkingY(x, z) : undefined,
    },
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
    { name: 'eagley-brow-entrance', y: browApproach },
    {
      name: 'eagley-hough-bend-pavement',
      y: (x, z) =>
        inEagleyHoughBendPavement(x, z, eagleyHoughBendPlan)
          ? eagleyHoughBendY(x, z)
          : undefined,
    },
    {
      // EAG-037..040 pavement and its carriageway use the Eagley datum.
      // The nearest woodland-step centreline previously stole ground here,
      // causing a 0.37m drop through the newly opened pavement approach.
      // Existing eagley-way-cutting terrain already uses this same centreline.
      name: 'lower-eagley-road-and-pavement',
      y: (x, z) => {
        if (
          x < LOWER_EAGLEY.uphillPavementStart ||
          x > eagleySegments[eagleySegments.length - 1].b[0]
        )
          return undefined;
        const n = nearest(x, z, eagleySegments);
        return n.d < roadWidth(n.s.f) / 2 + 1.3 ? roadY(x, z, n) : undefined;
      },
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
    schoolForecourtPlan,
    schoolPavementY,
    schoolHouseBase,
    blackburnEntrancePlan,
    blackburnEntranceY,
    roadSeg,
    riverSeg,
    eagleySegments,
    riversideSeg,
    court,
    brookDatum,
    brookWestEntry,
    brookWestApproachY,
    bridgeBase,
    passageY,
    houseEntry,
    garageBackingLevel,
    sampledTerrain,
    terrain,
    ground,
    roadY,
    riverY,
    courtY,
    brookParkingY,
    browRoadY,
    eagleyHoughBendPlan,
    eagleyHoughBendY,
    turningCirclePlan,
    turningCircleY,
    vehicleRoadY,
    gateApproach,
    inPassage,
    passageWallHeight,
    passageGateLevel,
    woodlandStepsY,
    woodlandUpperY,
    woodlandUpperPoints,
    landscapePathLevel,
    landscapePathPoints: [
      ...LANDSCAPING_GATE.pathLead,
      ...roads.find((f) => f.id === OSM.riversidePath)!.points.slice(2, 3),
    ],
  };
}

function offset(y: number | undefined, d: number) {
  return y === undefined ? undefined : y + d;
}

export type Surface = ReturnType<typeof createSurface>;

/** Solve a 3x3 linear system (row-major m) by Cramer's rule. */
function solve3(m: number[], v: number[]): [number, number, number] {
  const det = (a: number[]) =>
    a[0] * (a[4] * a[8] - a[5] * a[7]) -
    a[1] * (a[3] * a[8] - a[5] * a[6]) +
    a[2] * (a[3] * a[7] - a[4] * a[6]);
  const d = det(m) || 1;
  const col = (k: number) =>
    m.map((x, i) => (i % 3 === k ? v[Math.floor(i / 3)] : x));
  return [det(col(0)) / d, det(col(1)) / d, det(col(2)) / d];
}
