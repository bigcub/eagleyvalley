import { createHallWoodlandPlan } from '../landmarks/hall-woodland-entrance';
import { createThreadfoldBendPlan } from '../landmarks/threadfold-bend';
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
  bounds,
  inPoly,
  nearest,
  outline,
  segments,
  type Feature,
  type Nearest,
  type P,
} from '../core/geo';
import { roadWidth, type WorldData } from './data';
import {
  BRIDGE_MILL_COURT,
  BRIDGE_PARKING,
  BRIDGE_JUNCTION,
  BRIDGE_PASSAGE_RISE,
  inBridgeJunction,
  BROOK_WEST_ENTRANCE,
  BROOK_WEST,
  BROOK_PARKING_ENTRY,
  BROOK_EAST_PARKING,
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
  VALLEY_ENTRANCE,
  SCHOOL_STREET,
  SCHOOL_STREET_WEST,
  SCHOOL_STREET_PARKING,
  HOUGH_TERRACE_ROAD,
  HOUGH_BRIDGE_SOUTH,
  THREADFOLD_MINI_PARKING,
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
  valleyEntranceLevel,
  valleyEntranceWorld,
} from '../landmarks/valley-entrance';
import {
  courtRockeryTerrain,
  courtSideGardenTerrain,
} from '../landmarks/court-gardens';
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
  const hallWoodlandPlan = createHallWoodlandPlan(data);
  function hallWoodlandY(x: number, z: number) {
    const n = nearest(x, z, hallWoodlandPlan.spine);
    return sampledTerrain(n.x, n.z) + 0.38;
  }
  const threadfoldBendPlan = createThreadfoldBendPlan(data);
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
  // Fixed EA datum prevents the new excavation moving the mill shell.
  const valleyMillBase = Math.min(
    ...buildings
      .find((f) => f.id === OSM.valleyMill)!
      .points.map((p) => sampledTerrain(...p)),
  );
  // Fit the apron boundary to the mapped road bend, just behind its kerb.
  // A dense table gives a continuous edge without repeatedly searching roads.
  const valleyDepths = Array.from({ length: 69 }, (_, i) => {
    const u = lerp(VALLEY_ENTRANCE.u0, VALLEY_ENTRANCE.u1, i / 68);
    let low = 0,
      high = 12;
    for (let j = 0; j < 20; j++) {
      const d = (low + high) / 2;
      const p = valleyEntranceWorld(u, d),
        n = nearest(...p, gateRoadSegments);
      if (n.d > roadWidth(n.s.f) / 2 + VALLEY_ENTRANCE.roadMargin) low = d;
      else high = d;
    }
    return (low + high) / 2;
  });
  function valleyEntranceDepth(u: number) {
    const t = clamp(
      ((u - VALLEY_ENTRANCE.u0) / (VALLEY_ENTRANCE.u1 - VALLEY_ENTRANCE.u0)) *
        68,
      0,
      68,
    );
    const i = Math.min(67, Math.floor(t));
    return lerp(valleyDepths[i], valleyDepths[i + 1], t - i);
  }
  function valleyEntranceY(x: number, z: number) {
    return valleyEntranceLevel(
      x,
      z,
      valleyMillBase,
      vehicleRoadY,
      valleyEntranceDepth,
    );
  }
  const bridgeBase = Math.min(
    ...buildings
      .find((f) => f.name === 'Bridge Mill')!
      .points.map((p) => sampledTerrain(...p)),
  );
  // M06: the level passage sits 2.8m above the rear gardens, not 3.6m. EA
  // terrain at the west end, the court's slight fall (user), the retaining
  // wall heights in the user's passage photos and the light-well depth all
  // place it about 0.8m below the earlier datum. Fitted, not surveyed.
  const passageY = bridgeBase + BRIDGE_PASSAGE_RISE;
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
  /** Level cobbled passage along the frontage. West of BRIDGE_JUNCTION.x1
   * the setts follow the court's slope instead. */
  function inPassage(x: number, z: number) {
    return (
      x > BRIDGE_JUNCTION.x1 &&
      x < 110 &&
      z > 12 &&
      z < passageWallZ(x) + 0.35 &&
      z > 19.55 + (x - 80) * 0.041
    );
  }
  /** User, 3 October: the court falls on a slight slope from the passage at
   * the mill's west end towards the modern block; EA terrain agrees. The rise
   * is spread across the east court instead of a 4.5m ramp. Fitted. */
  function junctionWeight(x: number, z: number) {
    const J = BRIDGE_JUNCTION;
    return smoothstep(x, J.x0, J.x1) * smoothstep(z, J.z0, J.z1);
  }
  /** Paved junction outside the court outline: setts in front of the engine
   * house, round No.5's door and along the road wall to the frontage. */
  function passageApproach(x: number, z: number) {
    if (!inBridgeJunction(x, z, court, passageWallZ)) return undefined;
    return courtY(x, z);
  }
  /** Enclosed planting bed blended into the passage, not a terrain cliff. */
  function millCornerGround(x: number, z: number) {
    if (x < 109 || x > 114.3 || z < 20.8 || z > 26.8) return undefined;
    const weight = (1 - smoothstep(x, 110, 114.3)) * smoothstep(z, 20.8, 21.5);
    // The bed also rises to the Hough bend pavement it adjoins, so the
    // pavement edge never stands proud of the lower passage datum.
    const bed = Math.max(passageY - 0.18, vehicleRoadY(x, z) - 0.12);
    return lerp(sampledTerrain(x, z), bed, weight);
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
  /** Old mill gardens: the lawn falls to the shared path's level over 2m
   * outside its verge, so the brook-end gates have no step. Estimated. */
  function gardenPathBank(x: number, z: number) {
    if (x < 70 || x > 112 || z > 0) return undefined;
    const n = nearest(x, z, riversideSeg);
    if (z < n.z || !n.s) return undefined;
    const verge = roadWidth(n.s.f) / 2 + 1.3;
    if (n.d <= verge || n.d > verge + 2) return undefined;
    return lerp(
      roadY(n.x, n.z, n) - 0.13,
      sampledTerrain(x, z),
      smoothstep(n.d, verge, verge + 2),
    );
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
  const brookEastEdge = outline(BROOK_EAST_PARKING.outline);
  const brookEastBounds = bounds(BROOK_EAST_PARKING.outline);
  const brookEastDatum = sampledTerrain(...BROOK_EAST_PARKING.datum) + 0.13;
  function brookEastParkingY(x: number, z: number) {
    const B = brookEastBounds;
    if (x < B.minX || x > B.maxX || z < B.minZ || z > B.maxZ) return undefined;
    if (!inPoly(x, z, BROOK_EAST_PARKING.outline)) return undefined;
    const n = nearest(x, z, brookEntryRoad);
    // Keep the existing carriageway grade; the apron eases down behind it.
    const road = vehicleRoadY(x, z);
    const fit = lerp(
      road,
      brookEastDatum,
      smoothstep(n.d, ...BROOK_EAST_PARKING.roadBlend),
    );
    const old =
      n.d < roadWidth(n.s.f) / 2 + 1.3 ? road : sampledTerrain(x, z) + 0.13;
    return lerp(
      old,
      fit,
      smoothstep(
        nearest(x, z, brookEastEdge).d,
        0,
        BROOK_EAST_PARKING.edgeBlend,
      ),
    );
  }
  // Small car park cut into the Threadfold north bank: road level at the
  // kerb, rising gently towards the School Street wall.
  const miniParkingBounds = bounds(THREADFOLD_MINI_PARKING.outline);
  function miniParkingY(x: number, z: number) {
    const B = miniParkingBounds;
    if (x < B.minX || x > B.maxX || z < B.minZ || z > B.maxZ) return undefined;
    if (!inPoly(x, z, THREADFOLD_MINI_PARKING.outline)) return undefined;
    const n = nearest(x, z, brookEntryRoad);
    return (
      roadY(n.x, n.z, n) +
      Math.max(0, n.d - THREADFOLD_MINI_PARKING.entranceFlatDistance) *
        smoothstep(
          n.d,
          THREADFOLD_MINI_PARKING.entranceFlatDistance,
          THREADFOLD_MINI_PARKING.entranceFlatDistance +
            THREADFOLD_MINI_PARKING.entranceBlend,
        ) *
        THREADFOLD_MINI_PARKING.fall
    );
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
    return lerp(courtFormation(x, z), passageY, junctionWeight(x, z));
  }
  const courtApronStart = sampledTerrain(...BRIDGE_PARKING.entranceRoad) + 0.38;
  function courtApronY(x: number, z: number) {
    if (inPoly(x, z, court)) return courtY(x, z);
    const a = BRIDGE_PARKING.entranceRoad,
      b = BRIDGE_PARKING.entrance;
    const dx = b[0] - a[0],
      dz = b[1] - a[1];
    const t = clamp(
      ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz),
      0,
      1,
    );
    const entry = lerp(courtApronStart, courtEntryY, smoothstep(t, 0, 1));
    return lerp(
      courtY(x, z),
      entry,
      smoothstep(nearest(x, z, courtOutline).d, 0, 3),
    );
  }
  /** Side-garden ground at the open north end of the east well. */
  const wellGarden = () => sampledTerrain(66, -6) + 0.13;
  function garageBackingLevel(x: number, z: number) {
    const D = GARAGE_BACKING;
    // The east end follows the court's slope up to the passage junction
    // rather than fading back to raw terrain.
    const weight = smoothstep(x, D.startX, D.coreStartX);
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

  // M25b west square and bay: the EA grid carries the raised School House
  // plot into the paving. One plane fitted to the surrounding road heights
  // (setts end, south stub, path at the bollards) replaces it; the bay rises
  // gently from its mouth. Open edges blend back over 1.5m. Uses sampled
  // terrain only, so road heights that read terrain cannot recurse here.
  const schoolBayWall = SCHOOL_STREET_WEST.wall
    .slice(1)
    .map((b, i) => ({ a: SCHOOL_STREET_WEST.wall[i], b }));
  function unzonedGround(x: number, z: number) {
    const r = nearest(x, z, roadSeg);
    return r.d < roadWidth(r.s.f) / 2 + 1.3
      ? sampledTerrain(r.x, r.z) + 0.38
      : sampledTerrain(x, z) + 0.13;
  }
  let schoolSquarePlane: number[] | undefined;
  function schoolSquareFit(x: number, z: number) {
    const W = SCHOOL_STREET_WEST;
    if (!schoolSquarePlane) {
      // Least-squares plane y = a + b(x - x0) + c(z - z0) through the anchors.
      const [x0, z0] = W.mouth;
      const M = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        v = [0, 0, 0];
      for (const [ax, az] of W.anchors) {
        const row = [1, ax - x0, az - z0],
          y = unzonedGround(ax, az);
        for (let r = 0; r < 3; r++) {
          v[r] += row[r] * y;
          for (let c = 0; c < 3; c++) M[r][c] += row[r] * row[c];
        }
      }
      const det = (m: number[][]) =>
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      const d = det(M);
      schoolSquarePlane = [0, 1, 2].map(
        (k) =>
          det(M.map((row, r) => row.map((c, j) => (j === k ? v[r] : c)))) / d,
      );
    }
    const [a, b, c] = schoolSquarePlane,
      s = (x - W.mouth[0]) * W.axis[0] + (z - W.mouth[1]) * W.axis[1];
    return (
      a + b * (x - W.mouth[0]) + c * (z - W.mouth[1]) + W.rise * Math.max(0, s)
    );
  }
  // Height a point would have without the square, except that roads whose
  // centreline lies in the square take the square's level. The terrain zone
  // sits 0.38m under the paving, so road heights read from terrain there
  // (centreline + 0.38) land exactly on the square on both sides of its edge.
  function schoolSquareOriginal(x: number, z: number) {
    // The former nearest-road switch sat in open ground west of the square.
    // Its footpath and frontage-road datums disagree. Now this is paved,
    // carry the square's fitted grade through that short connecting throat.
    if (
      x >= SCHOOL_STREET_PARKING.squareBlend[1] &&
      inPoly(x, z, SCHOOL_STREET_PARKING.outline)
    )
      return schoolSquareFit(x, z);
    const r = nearest(x, z, roadSeg);
    if (r.d >= roadWidth(r.s.f) / 2 + 1.3) return sampledTerrain(x, z) + 0.13;
    return inPoly(r.x, r.z, SCHOOL_STREET_WEST.paving)
      ? schoolSquareFit(r.x, r.z)
      : sampledTerrain(r.x, r.z) + 0.38;
  }
  function schoolBayY(x: number, z: number, seams = false) {
    const W = SCHOOL_STREET_WEST;
    if (inPoly(x, z, W.paving)) {
      // One grade across the parking/bollard join and square. The old blend
      // to whichever mapped path was nearest produced steep triangles here.
      // Retain the blend only at the eastern sett-road connection.
      return lerp(
        schoolSquareFit(x, z),
        schoolSquareOriginal(x, z),
        smoothstep(x, W.settBlend[0], W.settBlend[1]),
      );
    }
    if (
      seams &&
      schoolBayWall.some((s, i) => nearest(x, z, [s]).d < W.seams[i])
    )
      return schoolSquareFit(x, z);
    return undefined;
  }
  const schoolParkingRoad = roadSeg.filter(
      (s) => s.f.id === OSM.schoolStreetFront,
    ),
    schoolParkingEdge = outline(SCHOOL_STREET_PARKING.outline),
    schoolParkingBounds = bounds(SCHOOL_STREET_PARKING.outline);
  function schoolParkingY(x: number, z: number) {
    const P = SCHOOL_STREET_PARKING;
    const B = schoolParkingBounds;
    if (x < B.minX || x > B.maxX || z < B.minZ || z > B.maxZ) return undefined;
    if (!inPoly(x, z, P.outline)) return undefined;
    const n = nearest(x, z, schoolParkingRoad),
      edge = nearest(x, z, schoolParkingEdge).d;
    const roadLevel = sampledTerrain(n.x, n.z) + 0.38,
      east = smoothstep(x, P.squareBlend[0], P.squareBlend[1]);
    // Retain the road's EA centreline grade and ease the parking onto it.
    // The square and School House pavement own their existing edge levels.
    return lerp(
      lerp(schoolSquareOriginal(x, z), schoolSquareFit(x, z), east),
      lerp(roadLevel, schoolSquareFit(x, z), east),
      smoothstep(edge, 0, P.blend),
    );
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
      name: 'hall-woodland-entrance-formation',
      y: (x, z) =>
        inPoly(x, z, hallWoodlandPlan.formation)
          ? Math.min(sampledTerrain(x, z), hallWoodlandY(x, z) - 0.16)
          : undefined,
    },
    {
      name: 'bridge-court-entrance-apron',
      y: (x, z) =>
        inPoly(x, z, BRIDGE_PARKING.apron)
          ? Math.min(sampledTerrain(x, z), courtApronY(x, z) - 0.18)
          : undefined,
    },
    {
      name: 'threadfold-east-bend-pavement-formation',
      y: (x, z) => {
        if (!inPoly(x, z, threadfoldBendPlan.formation)) return undefined;
        const n = nearest(x, z, threadfoldBendPlan.road);
        return Math.min(sampledTerrain(x, z), roadY(x, z, n) - 0.08);
      },
    },
    {
      // The corrected Hough Lane centreline runs into the west bank; keep
      // grass under the carriageway and pavements. Centrelines keep their
      // own datum, so road heights are unchanged.
      name: 'hough-terrace-formation',
      y: (x, z) => {
        const F = HOUGH_TERRACE_ROAD.formation;
        if (z > F.z0 || z < F.z1) return undefined;
        const n = nearest(x, z, roadSeg);
        if (n.s?.f.id !== HOUGH_TERRACE_ROAD.id || n.d <= 0.5) return undefined;
        const W = HOUGH_TERRACE_ROAD.westWall,
          west = x < n.x && z <= W.z0 && z >= W.z1;
        const datum = sampledTerrain(n.x, n.z) + 0.03;
        if (n.d < F.reach) return Math.min(sampledTerrain(x, z), datum);
        // Behind the west wall the 2m terrain cells must stay low or their
        // triangles cross the wall onto the pavement; the wall hides the cut.
        return west && n.d < F.westReach
          ? Math.min(sampledTerrain(x, z), datum)
          : undefined;
      },
    },
    {
      name: 'school-street-west-bay',
      y: (x, z) => offset(schoolBayY(x, z, true), -0.38),
    },
    {
      name: 'school-street-parking-formation',
      y: (x, z) => {
        const y = schoolParkingY(x, z);
        if (y === undefined) return undefined;
        // Preserve centreline terrain so roadY cannot read back the parking
        // excavation. The surface still covers the narrow retained strip.
        return nearest(x, z, schoolParkingRoad).d < 0.5 ? undefined : y - 0.38;
      },
    },
    {
      name: 'threadfold-mini-parking-formation',
      y: (x, z) => {
        if (nearest(x, z, brookEntryRoad).d < 3) return undefined;
        // Grow the cut by a cell so coarse grass cannot cross the tarmac.
        for (const [dx, dz] of [
          [0, 0],
          [1.2, 0],
          [-1.2, 0],
          [0, 1.2],
          [0, -1.2],
        ]) {
          const y = miniParkingY(x + dx, z + dz);
          if (y !== undefined) return Math.min(sampledTerrain(x, z), y - 0.12);
        }
        return undefined;
      },
    },
    {
      name: 'brook-east-parking-formation',
      y: (x, z) => {
        // Centreline samples remain unchanged, avoiding terrain/road recursion.
        if (nearest(x, z, brookEntryRoad).d < 0.5) return undefined;
        return offset(brookEastParkingY(x, z), -0.38);
      },
    },
    {
      // Keep grass below the fitted narrow slab pavements; centreline heights
      // retain their existing EA datum. No raised movement kerb.
      name: 'school-street-pavement-formation',
      y: (x, z) => {
        const n = nearest(x, z, roadSeg);
        return OSM.schoolStreetSetts.includes(n.s?.f.id) &&
          n.d > SCHOOL_STREET.width / 2 &&
          n.d < SCHOOL_STREET.width / 2 + SCHOOL_STREET.formationMargin
          ? sampledTerrain(n.x, n.z) + 0.03
          : undefined;
      },
    },
    {
      name: 'valley-mill-entrance',
      y: (x, z) => offset(valleyEntranceY(x, z), -0.13),
    },
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
    { name: 'bridge-garden-path-bank', y: gardenPathBank },
    {
      name: 'brook-parking',
      y: (x, z) =>
        inPoly(x, z, brookParking) ? brookParkingY(x, z) - 0.13 : undefined,
    },
    { name: 'landscape-gate', y: (x, z) => offset(gateApproach(x, z), -0.08) },
    {
      name: 'court-house-wells',
      y: (x, z) => {
        const y = courtHouseGround(x, z, houseEntry, wellGarden);
        if (y === undefined) return undefined;
        // Door bridges span the well; the grass stays at well-floor level.
        return (y > houseEntry - 1 ? houseEntry - 2.35 : y) - 0.16;
      },
    },
    {
      name: 'court-rockery',
      y: (x, z) => courtRockeryTerrain(x, z, courtY, sampledTerrain),
    },
    {
      name: 'court-side-garden',
      y: (x, z) => courtSideGardenTerrain(x, z, sampledTerrain),
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
    if (
      [OSM.hallLane, OSM.northWoodlandPath].includes(r.s?.f.id) &&
      inPoly(x, z, hallWoodlandPlan.formation)
    )
      return hallWoodlandY(x, z);
    if (inPoly(x, z, BRIDGE_PARKING.apron)) return courtApronY(x, z);
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
    {
      name: 'hall-woodland-entrance',
      y: (x, z) =>
        inPoly(x, z, hallWoodlandPlan.paving) ? hallWoodlandY(x, z) : undefined,
    },
    {
      name: 'bridge-court-entrance-apron',
      y: (x, z) =>
        inPoly(x, z, BRIDGE_PARKING.apron) ? courtApronY(x, z) : undefined,
    },
    { name: 'threadfold-mini-parking', y: miniParkingY },
    {
      name: 'threadfold-east-bend-pavement',
      y: (x, z) =>
        inPoly(x, z, threadfoldBendPlan.pavement)
          ? roadY(x, z, nearest(x, z, threadfoldBendPlan.road))
          : undefined,
    },
    { name: 'valley-mill-entrance', y: valleyEntranceY },
    { name: 'school-forecourt', y: schoolGround },
    { name: 'school-street-west-bay', y: schoolBayY },
    { name: 'school-street-parking', y: schoolParkingY },
    { name: 'brook-east-parking', y: brookEastParkingY },
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
      y: (x, z) => courtHouseGround(x, z, houseEntry, wellGarden),
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
  // Lawn behind the Hough bridge-south wall keeps grass level instead of the
  // carriageway formation that used to carry a pavement there.
  const houghLawnWall = segments([
    {
      points: [[121.2, 19.05], [122.5, 17.1], ...HOUGH_BRIDGE_SOUTH.westWall],
    } as Feature,
  ]);
  groundZones.push({
    name: 'hough-bridge-south-lawn',
    y: (x, z) => {
      const n = nearest(x, z, houghLawnWall);
      if (n.d < 0.32 || n.d > HOUGH_BRIDGE_SOUTH.lawnReach) return undefined;
      const { a, b } = n.s,
        west = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]) < 0;
      return west ? terrain(x, z) + 0.13 : undefined;
    },
  });
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
    hallWoodlandPlan,
    hallWoodlandY,
    threadfoldBendPlan,
    valleyMillBase,
    valleyEntranceDepth,
    valleyEntranceY,
    schoolForecourtPlan,
    schoolPavementY,
    schoolHouseBase,
    blackburnEntrancePlan,
    blackburnEntranceY,
    miniParkingY,
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
    courtApronY,
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
