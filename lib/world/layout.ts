import type { P } from '../core/geo';

// OpenStreetMap way IDs the world treats specially. Names describe the feature,
// not necessarily the OSM name tag.
export const OSM = {
  eagleyWay: '155008522',
  /** Short approach between the mill and the turning-circle junction. */
  houghMillApproach: '120133751',
  houghTurningApproach: '681379569',
  /** Old cobbled woodland lane; motor vehicles prohibited in the map. */
  eagleyBrow: '61983043',
  /** Woodland steps at the uphill wall end opposite Bridge Mill. */
  millWoodlandSteps: '655432308',
  threadfoldWayLoop: '655432303',
  /** Narrow Hough Lane road bridge over Eagley Brook. */
  houghRoadBridge: '73858744',
  /** Hough Lane approaches either side of the road bridge; tapered widths. */
  houghLaneSouth: '681379568',
  houghLaneNorth: '727434505',
  /** Filtered old Hough Lane link, now a cycleway crossing. */
  houghOldLane: '655432304',
  houghJunctionFootway: '655432305',
  houghFootbridge: '655432306',
  houghFootbridgeSouthPath: '655432307',
  riversidePath: '655432309',
  bridgeMillCourtAccess: '655432311',
  busTurningLoop: '549204394',
  gatehouse: '571633838',
  schoolHouse: '727404344',
  eagleyHall: '549512305',
  /** Three attached houses opposite the Bridge Mill garages. */
  courtHouses: ['727427311', '727427312', '727427313'],
  garageRange: '727427314',
  separateGarage: '727427315',
};

/**
 * Western Bridge Mill parking court, traced from aerial imagery. Interpreted,
 * not surveyed; the access lane to the garages must stay connected.
 */
export const BRIDGE_MILL_COURT: P[] = [
  [6, 2],
  [24, 2],
  [35, 5],
  [37, 7],
  [40, 9],
  [69, 6],
  [73, 9],
  [73, 23],
  [41, 26],
  [36, 23],
  [31, 30],
  [12, 30],
  [7, 23],
  [6, 2],
];

/**
 * Bridge Mill main block. Replaces the OSM outline so the south frontage and
 * passage align with the user's photographs.
 */
export const BRIDGE_MILL_FOOTPRINT: P[] = [
  [78.79, 9.43],
  [106.95, 10.6],
  [106.55, 20.66],
  [77.87, 19.51],
];

/** M05. June 2024 road views EAG-038..043. Heights, coping drop and
 * gate-return bends are visual estimates; the road centreline remains mapped. */
export const BRIDGE_ROAD_WALL = {
  startX: 59,
  endX: 110,
  offset: 3.7,
  thickness: 0.55,
  copingDropX: 89.7,
  // Height of masonry above the road, before the coping stones.
  uprightProfile: [
    [59, 1.14],
    [74, 1.1],
    [89.7, 1.06],
  ] as P[],
  flatProfile: [
    [89.7, 0.72],
    [99.1, 0.7],
    [110, 0.68],
  ] as P[],
  corner: [
    [112, 26.38],
    [114, 25.8],
    [115.65, 25.15],
  ] as P[],
  // Column is the visual anchor beside the coping drop. No sign plates.
  lamp: { point: [89.1, 28.93] as P, height: 6.8 },
};

/** Hough Lane road-bridge deck ends, sampled beyond both abutments. */
export const HOUGH_DECK_SOUTH: P = [128.32, 13.36];
export const HOUGH_DECK_NORTH: P = [146.1, -20];
/** North end of the Hough footbridge, where it lands on the junction island. */
export const HOUGH_FOOTBRIDGE_NORTH: P = [145.9, -13.64];

/** M04, June 2024 and August 2022 Street View. Visually fitted to mapped
 * approaches, not measured. Keep the filtered crossing and separate bridge. */
export const HOUGH_JUNCTION = {
  crossingEnds: [
    [147.9, -26.55],
    [148.35, -19.65],
  ] as P[],
  bollards: [
    [148.05, -24.9],
    [148.15, -22.9],
    [148.25, -20.9],
  ] as P[],
  crossingPosts: [
    [147.95, -26.1],
    [148.4, -19.1],
  ] as P[],
  hallPosts: [
    [150.3, -18.5],
    [151.6, -17.4],
    [152.9, -16.3],
    [154.2, -15.2],
  ] as P[],
  // Boundary behind the asphalt landing; canopy conceals the far return.
  islandBack: [
    [158.6, -11.9],
    [154.8, -14.6],
    [151.2, -16.1],
    [148.7, -14.6],
    [146.6, -14.2],
  ] as P[],
  // The north return is paved right across, with no grass triangle inside it.
  northBack: [
    [150.39, -30.71],
    [148.1, -30.8],
    [147.81, -30.54],
  ] as P[],
  rail: [
    [147.28, -27.7],
    [147.2, -29.7],
    [147.03, -31.3],
    [146.19, -33.1],
    [144.71, -36.08],
  ] as P[],
  wallHeight: 0.8,
  // Stop before the bridge mouth, rather than closing the walked connection.
  wallEnd: [147.8, -14.1] as P,
};

/** Playable limits for walking and driving. */
export const WORLD_LIMITS = { x0: -420, x1: 340, z0: -250, z1: 260 };

/**
 * June 2024 Street View EAG-027..040, inspected 2 October 2026.
 * Camera positions are recorded in SURVEY.md. These feature endpoints and
 * dimensions are visual interpretations against the mapped road, not surveys.
 */
export const LOWER_EAGLEY = {
  plainWallEnd: 12, // Ends at the Eagley Brow mouth; opening clips this run.
  valleyBarrierEnd: 18,
  uphillPavementStart: 55,
  uphillLowWallStart: 61, // Leave the photographed woodland-step opening.
  uphillLowWallOffset: 4.75,
  uphillLowWallHeight: 0.8,
};

/** Entrance posts are interpreted, including their count and spacing. */
export const EAGLEY_BROW_ENTRANCE = {
  width: 3.2,
  formationLength: 14,
  formationBounds: { x0: 4, x1: 23, z0: 54, z1: 64 },
  // [metres along mapped lane, lateral metres, height]. Keep the centre open.
  posts: [
    [4.8, -2.4, 0.62],
    [6.4, -2.3, 0.68],
    [8.1, -2.1, 0.6],
    [4.8, 2.4, 0.65],
    [6.4, 2.3, 0.58],
    [8.1, 2.1, 0.7],
  ],
};

/**
 * EAG-041..044, June 2024. Continuous uphill pavement, low wall ending
 * before a rounded, wider apron towards the bus loop. Kerb trace, widths
 * and wall end are interpreted against OSM, not measured. M02 owns the
 * rest of the turning circle. Coordinates here describe the kerb centre.
 */
export const EAGLEY_HOUGH_BEND = {
  startX: 99.36,
  wallEndX: 113.7,
  wallThickness: 0.55,
  wallHeight: 0.8,
  bounds: { x0: 98, x1: 129, z0: 10, z1: 40 },
  gradeBlend: {
    west0: 99.36,
    west1: 104,
    east0: 124,
    east1: 129,
    north0: 13.36,
    north1: 20,
  },
  kerb: [
    [99.48, 34.918],
    [107.5, 34.07],
    [110.5, 33.75],
    [113.7, 32.17],
    [115.6, 31.23],
    [116.7, 30.81],
    [117.45, 30.62],
    [118, 30.67],
    [118.5, 30.92],
    [119.08, 31.42],
    [121.6, 33.82],
    [125.91, 34.925],
  ] as P[],
  backEdge: [
    [99.523, 36.087],
    [107.623, 35.233],
    [111.027, 34.796],
    [114.477, 33.765],
    [116.3, 33.8],
    [117, 33.42],
    [117.7, 33.5],
    [118.3, 33.7],
    [118.85, 34.01],
    [119.5, 34.55],
    [121.5, 36.4],
    [125.275, 37.44],
  ] as P[],
};

/**
 * M02: EAG-045..049, August 2022, plus June 2024 approach views and a
 * north-up aerial view. Traces are interpreted against OSM and the displayed
 * scale, not surveyed. Canopy obscures parts of the island's grass edge.
 */
export const TURNING_CIRCLE = {
  bounds: { x0: 116, x1: 160, z0: 9, z1: 45 },
  gradeBlend: { west0: 124, west1: 132, north0: 13.36, north1: 20 },
  // Open outer kerb, from the M01 pavement seam to the bridge-side mouth.
  outer: [
    [125.91, 34.925],
    [130, 38],
    [135, 40],
    [140.4, 40.9],
    [146.8, 40.1],
    [151.9, 37.3],
    [154.3, 33.6],
    [154.7, 29.9],
    [154.1, 25.4],
    [151, 21.2],
    [143, 17.2],
    [136, 13.6],
    // Meet the first retained bridge-approach kerb segment. The discarded
    // segments overlap the loop mouth; extending to its centre crosses asphalt.
    [132.732, 12.08],
  ] as P[],
  pavementWidths: [2.6, 2.1, 2, 2, 1.6, 1.1, 0.9, 0, 0, 0, 0, 0, 0],
  // The short closure follows the main-road mouth, not a kerb across it.
  mouth: [
    [125.45, 11.84],
    [122, 17],
    [116.4, 23],
    [117.8, 26],
  ] as P[],
  island: [
    [129.3, 25.4],
    [130.2, 23.1],
    [132.1, 20.5],
    [135, 20],
    [139, 21.1],
    [143.3, 23],
    [146.3, 25],
    [146.8, 27.4],
    [145.3, 30.4],
    [142, 32],
    [138, 31.5],
    [133.2, 29.6],
    [130.5, 27.8],
  ] as P[],
  asphaltMouth: [
    [116.4, 23],
    [125.45, 11.84],
    [134, 12.7],
    [133, 17.3],
    [129.1, 25],
    [129, 28.5],
    [126, 33.3],
    [125.91, 34.925],
    [117.8, 26],
  ] as P[],
};

/** M03: EAG-045..049 and the aerial outline. Every dimension/position is
 * interpreted, not measured. Tree entries describe visible crown groups;
 * concealed stems are not surveyed trunks. No road signs are included. */
export const TURNING_CIRCLE_DETAILS = {
  hedge: [
    [132.1, 24.8],
    [133.9, 22.2],
    [136.9, 21.9],
    [141.7, 24],
    [144.7, 26.4],
    [144.1, 28.8],
    [141.6, 30.2],
    [138.5, 29.8],
    [134.3, 28.2],
    [132.7, 26.9],
  ] as P[],
  hedgeWidth: 1.05,
  hedgeHeight: 1.05,
  crowns: [
    { x: 134.9, z: 24.6, h: 7.5, radius: 2.05 },
    { x: 138.5, z: 25.7, h: 8.5, radius: 2.4 },
    { x: 142, z: 27.1, h: 7, radius: 1.95 },
  ],
  understorey: [
    { x: 134.2, z: 25.5, h: 3.1, radius: 1.4 },
    { x: 139.7, z: 26.3, h: 3.6, radius: 1.8 },
  ],
  shelter: {
    centre: [131.425, 40.965] as P,
    rotation: -0.4,
    width: 3.2,
    depth: 0.85,
    height: 2.15,
  },
  bin: {
    centre: [136.9, 42.1] as P,
    rotation: -0.1,
    width: 0.72,
    depth: 0.6,
    height: 1.15,
  },
  // Start/end are positions along the M02 outer control points. This keeps
  // the bed behind the same pavement instead of tracing a competing edge.
  bed: { start: 1, end: 4, width: 1.45, height: 0.42 },
  bollard: { centre: [131.4, 20.75] as P, width: 0.24, height: 0.65 },
  lamps: [
    { centre: [118.9, 34.1] as P, height: 8, rotation: -0.2 },
    { centre: [147.8, 18.4] as P, height: 8, rotation: 0.3 },
    { centre: [147.5, 42.3] as P, height: 8, rotation: 2.8 },
  ],
};
