import { inPoly, type P } from '../core/geo';

/** Rendered brook width, estimated from the mapped centreline. The same
 * footprint excludes inferred canopy-peak trunks, following flag efef2098. */
export const BROOK_WATER_WIDTH = 7;

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
  hallCottageLane: '727434502',
  threadfoldTownhouseRoad: '61959587',
  threadfoldBrookReturn: '73858737',
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
  brookParkingAccess: '762841712',
  brookParkingAisles: ['762841713', '762841714', '762841715'],
  busTurningLoop: '549204394',
  gatehouse: '571633838',
  schoolHouse: '727404344',
  valleyMill: '73858746',
  scholarsRise: '73858749',
  scholarsAngledPair: ['727404347', '727404348'],
  scholarsModernRow: [
    '727404354',
    '727404355',
    '727404357',
    '727404356',
    '727404358',
    '727404359',
    '727404360',
  ],
  schoolStreetFront: '73858752',
  schoolStreetMain: '549512306',
  schoolStreetCross: '727434561',
  /** Mapped paved path from the School Street end past the School House. */
  schoolStreetWestPath: '648996292',
  /** M25a wet-walk video 10:28 onward; mapped sett/cobblestone runs.
   * The School House forecourt block paving is a separate surface. */
  schoolStreetSetts: ['549512306', '727434561'],
  eagleyHall: '549512305',
  hallLane: '328981148',
  northWoodlandPath: '655432302',
  spreadEagle: '727434553',
  /** Three attached houses opposite the Bridge Mill garages. */
  courtHouses: ['727427311', '727427312', '727427313'],
  threadfoldHouses: [
    '727427295',
    '727427296',
    '727427298',
    '727427297',
    '727427302',
    '727427301',
    '727427300',
    '727427299',
  ],
  valeViewTerrace: [
    '727404361',
    '727404363',
    '727404364',
    '727404366',
    '727404365',
    '727404367',
    '727404362',
  ],
  wakefieldWest: ['727427279', '727427280', '727427281', '727427282'],
  wakefieldHouses: [
    '727427283',
    '727427284',
    '727427285',
    '727427286',
    '727427287',
    '727427290',
    '727427291',
    '727427292',
    '727427293',
    '727427294',
    '727427303',
    '727427304',
    '727427305',
    '727427306',
    '727427307',
    '727427308',
    '727427309',
    '727427310',
  ],
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
  [35, 0.5],
  [38.8, 0.5],
  [38.8, 7],
  [40, 9],
  // UP-003 and Google aerial: the court fills the gap between the modern
  // block's east well and the old mill, ending at the rockery near Z0.5.
  [65.59, 8.57],
  [64.95, 0.49],
  [75.2, -0.3],
  [75.4, 8.6],
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

/** M07: left branch of the shared Hough entrance, from May 2012 imagery
 * and the user's two-gate correction. Plan, widths and ironwork are estimates. */
export const PASSAGE_GATE = {
  returnOpening: 1.55,
  openAngle: (-148 * Math.PI) / 180,
  pierWidth: 0.34,
  pierHeight: 1.08,
  approach: [
    [108.6, 23.05],
    [110.6, 22.65],
    [114.8, 21.8],
    [116.1, 21.9],
    [117.15, 22.55],
    [116.9, 24.0],
    [113.0, 25.2],
    [108.6, 24.45],
  ] as P[],
  gradeBlend: [110, 114.5] as P,
  bedWallStart: [106.55, 20.66] as P,
};

/** Hough Lane road-bridge deck ends, sampled beyond both abutments. */
export const HOUGH_DECK_SOUTH: P = [128.32, 13.36];
export const HOUGH_DECK_NORTH: P = [146.1, -20];
/**
 * Hough Lane south of the road bridge. June 2024 Street View
 * GXaLJ6-lQQXM-ZBvWlBeyw (headings 40/200/260/320) and user flags bb2f09ad,
 * 315ad6f2: no west pavement; the lawn's dry-stone wall with large flat coping
 * runs along the carriageway edge into the west parapet, the lawn falling
 * behind it. East of the road a flush tarmac apron reaches the footbridge.
 * Points are fitted to the mapped centrelines; dimensions are estimates.
 */
export const HOUGH_BRIDGE_SOUTH = {
  /** Continues the shared-landscaping wall from [124.0, 14.8] to the parapet. */
  westWall: [
    [124.0, 14.8],
    [125.2, 11.9],
    [127.0, 8.6],
    [130.94, 3.95],
  ] as P[],
  /** Lawn behind the wall within this distance keeps grass level. */
  lawnReach: 3,
  // West edge overlaps the tapered carriageway by 0.4m to hide seams.
  apron: [
    [134.22, 5.61],
    [136.6, 6.71],
    [137.2, 9.6],
    [135.6, 12.6],
    [133.2, 12.3],
    [132.51, 11.51],
  ] as P[],
  /** Apron edges facing the lower grass bank (indices into apron). */
  apronBank: [1, 2, 3, 4],
};
/** North end of the Hough footbridge, where it lands on the junction island. */
export const HOUGH_FOOTBRIDGE_NORTH: P = [145.9, -13.64];

/**
 * Tall garden wall behind the Threadfold verge, from the existing north
 * boundary to the cottages (user flag ad4421ab; June 2024
 * NrBn7lFZ84Dc1-Ddye6W_g headings 30/330). Runs just behind mapped path
 * 727434504; end point against the cottage gable is fitted, not measured.
 */
export const THREADFOLD_COTTAGE_WALL = {
  points: [
    [133.4, -51.6],
    [137.5, -51.1],
    [141.9, -48.2],
  ] as P[],
  height: 1.9,
};

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
    [148.3, -28.5],
    [148.3, -29.9],
    [148.12, -31.85],
    [147.44, -33.74],
    [145.92, -36.78],
  ] as P[],
  // DQl headings340/20: lamp aligned with the back-edge rail. Fitted, not surveyed.
  lamp: [148.12, -31.85] as P,
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

/** EAG-033 June2024 uphill wall/bank. Extent and plant sizes fitted. */
export const EAGLEY_WAY_BANK_PLANTING = {
  startX: 20,
  endX: 34,
  wallOffset: 3.7,
  wallHeight: 1.7,
  spacing: 1.15,
  bands: [2.4, 4.2],
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
  // DQl headings340/20: lamp aligned with the back-edge rail. Fitted, not surveyed.
  lamp: [148.12, -31.85] as P,
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
  lamps: [
    { centre: [118.9, 34.1] as P, height: 8, rotation: -0.2 },
    { centre: [147.8, 18.4] as P, height: 8, rotation: 0.3 },
    { centre: [147.5, 42.3] as P, height: 8, rotation: 2.8 },
  ],
};

/** M08. June 2024 gate and May 2012 return; dimensions are estimates.
 * Shared landscaping is behind the private gardens, not a garden entrance. */
export const LANDSCAPING_GATE = {
  halfWidth: 0.75,
  leafHeight: 1.12,
  archRise: 0.19,
  openAngle: (5 * Math.PI) / 6,
  pathWidth: 1.2,
  boundaryEnd: [109.77, -8.25] as P,
  pathLead: [
    [115.41, 21.28],
    [114.5256, 20.6255],
    [115.1, 18.5],
  ] as P[],
  gradeLength: 12,
  pathBounds: { minX: 113, maxX: 117, minZ: 8, maxZ: 21.3 },
  bedBoundary: [
    [115.9455, 20.5564],
    [116.05, 18.4],
    [115.9, 15.4],
    [115.6, 12.0],
  ] as P[],
};

/** B02: June2024 EAG-043/GXa. Garden hedge and planted gate bed;
 * fitted offsets/heights, not surveyed property boundaries. */
export const BRIDGE_GATE_PLANTING = {
  hedge: [
    [111.5, -4.3],
    [113.1, -1.8],
    [113.4, 10.8],
    [113.4, 17.8],
    [113.65, 19.5],
  ] as P[],
  hedgeHeight: 1.45,
  hedgeWidth: 0.65,
  // Keep the photographed lawn around the existing canopy-peak tree open.
  lawn: [
    [116.3, 21.3],
    [116.1, 12],
    [119.2, 5.7],
    [125.0, 8.1],
    [122.9, 16.6],
    [119.1, 23.0],
  ] as P[],
  bed: [
    [108.0, 19.3, 1.8],
    [109.2, 19.8, 1.1],
    [110.3, 20.0, 0.8],
    [111.5, 20.2, 0.85],
    [112.1, 19.2, 1.15],
    [108.5, 17.6, 1.9],
    [110.0, 18.2, 1.6],
    [111.6, 17.7, 1.5],
  ],
};

/** M09. Visible lower flight only; six treads and dimensions are estimated.
 * The upper stair count and concealed connection remain unresolved. */
export const WOODLAND_STEPS = {
  bottom: [55.9, 35.21] as P,
  top: [54.06, 36.22] as P,
  count: 6,
  rise: 0.18,
  width: 1.15,
  returnWall: [
    [56.5, 36.1],
    [58.0, 36.2],
    [59.0, 36.1],
    [61.5, 35.9],
  ] as P[],
};

/** M10: north-up aerial trace checked against June 2024 entrance views.
 * OSM aisles anchor the plan; all edges, bay totals and dimensions are estimates. */
/** Marked bay rows: line i runs a→b offset by i·(dx,dz); n bays per row.
 * Provisional represented totals, not a surveyed capacity. */
export const BROOK_PARKING_ROWS: {
  a: P;
  b: P;
  n: number;
  dx: number;
  dz: number;
}[] = [
  { a: [29.8, -54.4], b: [29.4, -50], n: 4, dx: 2.45, dz: 0.2 },
  { a: [49, -53], b: [48.6, -48.6], n: 5, dx: 2.45, dz: 0.2 },
  { a: [37.8, -46.1], b: [41.8, -45.8], n: 7, dx: -0.2, dz: 2.45 },
  { a: [48.2, -46.3], b: [52.5, -45.9], n: 7, dx: -0.2, dz: 2.45 },
  { a: [59.8, -39.3], b: [63, -39], n: 5, dx: -0.2, dz: 2.45 },
  // Short fan along the diagonal western boundary.
  { a: [17.8, -41.5], b: [21.2, -38.1], n: 3, dx: 1.75, dz: -1.75 },
];
/** Parked residents' cars (flag 44044a67). Occupancy is illustrative:
 * [row, bay] pairs, nose towards the row's `a` end. Bays beside the
 * parking check's aisle (row 1 bay 3, row 2 bays
 * 0-1, row 3 and the short eastern row) stay free. */
export const BROOK_PARKED = [
  [0, 0],
  [0, 2],
  [0, 3],
  [1, 0],
  [1, 1],
  [2, 3],
  [5, 0],
  [5, 1],
  [5, 2],
] as [number, number][];
export const BROOK_PARKING = {
  outline: [
    [15, -43],
    [29, -57],
    [41, -57],
    [42, -62],
    [47, -62],
    [47, -56],
    [63, -54],
    [63, -24],
    [22, -27],
    [17, -32],
  ] as P[],
  beds: [
    // Separate perimeter beds stop at the central entrance.
    [
      [16.5, -42.5],
      [29.5, -56],
      [40, -56],
      [40, -58],
      [28.5, -58],
      [14.8, -44],
    ],
    [
      [48.5, -56],
      [63, -54.8],
      [63, -56.6],
      [48.5, -58],
    ],
    // Small rounded northern island and broader southern island.
    [
      [33.8, -48.2],
      [34.4, -50.1],
      [36, -50.8],
      [37.8, -50.2],
      [38.3, -48.1],
      [36.8, -47.5],
      [35, -47.5],
    ],
    [
      [32.3, -33.8],
      [32.8, -36],
      [35.3, -36.8],
      [37.7, -35.8],
      [38, -32],
      [37, -29.3],
      [33, -29.5],
      [32.1, -31],
    ],
    // Small beds beside the west elevation, separated by bays and doors.
    [
      [62.2, -52],
      [64, -51.8],
      [64, -48.8],
      [62.2, -49],
    ],
    [
      [62.2, -44.7],
      [64, -44.5],
      [64, -42.5],
      [62.2, -42.7],
    ],
  ] as P[][],
  brookEdge: [
    [22, -27],
    [63, -24],
  ] as P[],
  entranceTrees: [
    [40, -57.8],
    [48.3, -57],
  ] as P[],
};

/** June2024 entrance views: clipped roadside runs, rounded internal beds,
 * and two narrow conifers. Crown centres, dimensions and heights estimated.
 * Paths stay within the existing M10 beds; no extra hedge across the entrance. */
export const BROOK_PARKING_PLANTING = {
  hedges: [
    {
      path: [
        [15.8, -43.3],
        [29, -57],
        [39.8, -57],
      ] as P[],
      bed: 0,
      height: 1.05,
    },
    {
      path: [
        [48.7, -57],
        [62.5, -55.7],
      ] as P[],
      bed: 1,
      height: 1.05,
    },
  ],
  islands: [
    { x: 35.2, z: -49.2, height: 0.9, rx: 1.15, rz: 1.0, bed: 2 },
    { x: 37.0, z: -49.1, height: 0.85, rx: 1.0, rz: 1.0, bed: 2 },
    { x: 34.2, z: -34.8, height: 0.9, rx: 1.5, rz: 1.2, bed: 3 },
    { x: 36.3, z: -34.2, height: 0.95, rx: 1.35, rz: 1.5, bed: 3 },
    { x: 34.3, z: -31.4, height: 0.85, rx: 1.4, rz: 1.55, bed: 3 },
    { x: 36.4, z: -31.3, height: 0.9, rx: 1.1, rz: 1.5, bed: 3 },
  ],
  /** Three distinct broadleaf trunks in June2024, positions/heights fitted. */
  roadsideTrees: [
    { x: 32.0, z: -57.0, h: 11.5 },
    { x: 54.0, z: -56.5, h: 12.5 },
    { x: 61.5, z: -55.8, h: 10.5 },
  ],
  crownSpacing: 0.8,
  coniferHeight: 5.1,
  coniferRadius: 1.05,
};

/** M12a. UP-001/002 west gabled entrance. Dimensions/trace interpreted,
 * the photograph hides the threshold; the east porch is a separate feature. */
export const BROOK_WEST_ENTRANCE = {
  centre: [64.9, -40.8] as P,
  angle: -0.0854,
  width: 6.6,
  depth: 4.6,
  eaves: 10.8,
  rise: 2.0,
  doorWidth: 1.65,
  doorHeight: 2.8,
  glazingWidth: 1.85,
  glazingBottom: 3.45,
  glazingTop: 11.7,
  apron: [
    [60.8, -42.1],
    [65.5, -42.5],
    [65.2, -38.7],
    [60.5, -38.5],
  ] as P[],
};

/** M12b. UP-001/002 opening counts are photographed; positions and sizes
 * interpreted in the west entrance's local frame. Hidden openings unresolved. */
export const BROOK_WEST = {
  // Fitted strip outside the parking polygon, clipped to the M12a approach.
  apron: [
    [65.898, -52.458],
    [65.042, -42.461],
    [63, -42.287],
    [63, -52.706],
  ] as P[],
  wing: { from: -11.4, to: -3.3, depth: 2.5, eaves: 8.1, roofRise: 1.9 },
  wingWindows: [-10.0, -7.3, -4.6],
  rooflights: [-9.1, -6.4, -3.9], // Three visible in UP-001; UP-002 crops the third.
  groundOpenings: [
    { u: -10.0, width: 1.0, bottom: 0.45, top: 1.95, door: false },
    { u: -7.3, width: 1.15, bottom: 0.45, top: 1.95, door: false },
    { u: -4.6, width: 1.05, bottom: 0.0, top: 2.5, door: true },
  ],
  mainRows: [
    { bottom: 14.1, top: 16.35, us: [-10.0, -7.3, -4.6, -1.9], width: 1.65 },
    { bottom: 10.5, top: 13.3, us: [-10.0, -7.3], width: 1.7 },
    { bottom: 14.1, top: 16.35, us: [8.5], width: 1.25 },
    { bottom: 10.5, top: 13.3, us: [8.5], width: 1.25 },
    { bottom: 6.9, top: 9.7, us: [8.5], width: 1.25 },
    { bottom: 3.3, top: 6.1, us: [8.5], width: 1.25 },
  ],
  bands: [3.2, 4.4, 5.6, 6.8, 8.0, 9.2, 10.4, 11.6, 12.8, 14.0, 15.2, 16.4],
};

/** M11c. North end of the existing west wing, May 2012 and June 2024
 * Street View. One tall arched opening and gabled roof photographed;
 * all dimensions, pane divisions and threshold height interpreted. */
export const BROOK_NORTH_RETURN = {
  opening: { depth: -1.25, width: 1.42, bottom: 0.15, top: 7.35 },
  surround: 0.24,
  rails: [0.75, 2.65, 3.2, 4.65, 6.1],
  coping: { width: 0.19, height: 0.18 },
};

/** M12c. UP-002 west lettering and fixtures; UP-001/002 wing finial.
 * Positions, dimensions and concealed fittings are interpreted, not measured. */
export const BROOK_WEST_FIXTURES = {
  lettering: { u: -1.9, top: 7.8, step: 0.55, wordGap: 0.35, size: 0.55 },
  lantern: { u: 1.5, centre: 2.5, depth: 0.5 },
  intercom: { u: -1.35, y: 0.78 },
  finial: { u: -11.4, depth: -1.25 },
  // Visible silhouettes only; device types and tiny labels unresolved.
  wallFittings: [
    { u: -8.8, y: 2.95, depth: 0.18, width: 0.16 },
    { u: -2.1, y: 2.5, depth: 0.18, width: 0.27 },
    { u: 11.6, y: 3.8, depth: -0.42, width: 0.16 },
  ],
};

/** M12d. UP-001 visible setback roof, local west-entrance frame.
 * Height, setbacks, hidden edges and roof equipment positions estimated. */
export const BROOK_ROOF = {
  from: -10.4,
  to: 12.4,
  front: -6.8,
  back: -42.5,
  floor: 18.15,
  height: 1.45,
  westOpenings: [
    { u: -8.3, width: 1.9, panes: 3 },
    { u: -2.8, width: 1.55, panes: 2 },
    { u: 7.8, width: 1.7, panes: 2 },
  ],
  // Provisional roof equipment layout; visible object types/counts unresolved.
  equipment: [
    [-8.4, -11.2],
    [-5.1, -13.4],
    [-8.7, -19.6],
    [-3.8, -22.1],
    [-6.0, -27.8],
    [-1.7, -30.3],
    [3.2, -34.8],
    [7.5, -37.0],
  ] as P[],
};

/** M11 north opening schedule, west to east. Five visible rows.
 * Eastern glazed/loading bays and alternating balconies photographed in May 2012
 * and June 2024. Western concealed positions retain the provisional historic
 * 14-bay arrangement. Centres/widths/heights estimated, not surveyed. */
export const BROOK_NORTH = {
  // M11d photographed paired rear doors; dimensions/divisions interpreted.
  balconyDoors: {
    width: 1.6,
    bottom: 0.35,
    top: 2.55,
    rails: [0.35, 0.95, 1.25, 2.55],
  },
  // M11b two narrow courses within each brick row, May 2012/June 2024.
  // Heights/thickness interpreted; western continuation partly obscured.
  courses: [4.75, 5.9, 8.35, 9.5, 11.95, 13.1, 15.55, 16.7],
  openings: [
    { u: 1.655, kind: 'glazed', evidence: 'provisional' },
    { u: 4.965, kind: 'balcony', evidence: 'provisional' },
    { u: 8.275, kind: 'glazed', evidence: 'provisional' },
    { u: 11.585, kind: 'balcony', evidence: 'provisional' },
    { u: 14.895, kind: 'glazed', evidence: 'photographed' },
    { u: 18.205, kind: 'balcony', evidence: 'photographed' },
    { u: 21.515, kind: 'glazed', evidence: 'photographed' },
    { u: 24.825, kind: 'balcony', evidence: 'photographed' },
    { u: 28.135, kind: 'glazed', evidence: 'photographed' },
    { u: 31.445, kind: 'balcony', evidence: 'photographed' },
    { u: 34.755, kind: 'glazed', evidence: 'photographed' },
    { u: 38.065, kind: 'balcony', evidence: 'photographed' },
    { u: 41.375, kind: 'glazed', evidence: 'photographed' },
    { u: 44.685, kind: 'loading', evidence: 'photographed' },
  ],
};

/** Eastern Brook Mill court. Aerial/June 2024 entrance interpretation, not a
 * survey. Preserve the planted strip beside Threadfold and its open mouth. */
export const BROOK_EAST_PARKING = {
  outline: [
    [114.7, -46.8],
    [120, -46.3],
    [124.4, -42.7],
    [127.2, -38.5],
    [128.9, -34],
    [132, -33.8],
    [140, -36],
    [143, -31],
    [136, -28.5],
    [129, -26],
    [113.4, -27],
  ] as P[],
  datum: [114, -35] as P,
  edgeBlend: 1.5,
  roadBlend: [4.5, 11] as const,
};

/**
 * Planted beds either side of the Brook Mill east entrance (flag c70cde16;
 * June 2024 NrBn7lFZ84Dc1-Ddye6W_g heading 285): bark/gravel mulch, low
 * clipped shrubs, one tree each and two sign posts in the north bed.
 * Outlines fitted inside the existing verges; sizes estimated.
 */
export const BROOK_EAST_BEDS = {
  beds: [
    [
      [129.5, -34.4],
      [136.7, -35.5],
      [134.6, -38.4],
      [130.2, -37.6],
    ],
    [
      [131.2, -27.2],
      [138.5, -29.4],
      [138.3, -25.8],
      [132.2, -24.6],
    ],
  ] as P[][],
  trees: [
    { x: 132.6, z: -36.3, h: 7.5 },
    { x: 134.4, z: -26.6, h: 7 },
  ],
  signs: [
    [135.4, -35.6],
    [134.6, -35.8],
  ] as P[],
};

/**
 * Threadfold north bank (flag 1e384123). June 2024 Street View
 * T7eHk94lcG3DAz--2EFGdg (113 Threadfold Way) headings 40/290/340 and
 * egiISSG4D9coDLQvnYRnEg heading 330: narrow pavement, then a steep planted
 * bank (yews, ivy, mature trees, black lamp) up to the tall School Street
 * wall; no wall at the pavement east of the small car park. The car park is
 * cut into the bank at road level, open to the road, with a low stone wall
 * and pier on its west side. Under canopy on the aerial: outline, grade and
 * the lamp position are fitted from the panoramas, not measured.
 */
export const THREADFOLD_MINI_PARKING = {
  outline: [
    [100.6, -65.7],
    [108.9, -64.85],
    [108.9, -72.75],
    [100.9, -76.4],
  ] as P[],
  /** Rise per metre back from the kerb. */
  fall: 0.04,
  /** Keep the shared footway flat before easing into the parking rise. */
  entranceFlatDistance: 5.05,
  entranceBlend: 1,
  /** Full roadside-shrub crown plus leaf-card allowance. */
  plantingClearance: 2.65,
  /** North-boundary low walls are absent between these x values. */
  openWallX: [99.5, 131] as const,
  /** Bank planting runs between these x values, outside the car park. */
  bankX: [95, 133] as const,
  lamp: [113.6, -64.6] as P,
  cars: [
    { x: 102.6, z: -72.6, yaw: Math.PI * 0.95 },
    { x: 106.6, z: -70.4, yaw: Math.PI * 0.95 },
  ],
};

/** M10 entrance grade. Extent inferred from the mapped road and parking mouth;
 * grade is fitted for continuity, not a measured driveway profile. */
export const BROOK_PARKING_ENTRY = {
  outline: [
    [41, -66],
    [48, -66],
    [48, -55],
    [41, -55],
  ] as P[],
  blendStart: 2,
  blendEnd: 7,
};

/** M15 UP-003 photographed roof forms. Footprints mapped; dimensions estimated.
 * Long five bays confirmed by user; separate two bays visible in UP-003. */
export const GARAGE_COURT = [
  {
    id: OSM.garageRange,
    points: [
      [41.78, 18.36],
      [59.17, 16.64],
      [59.76, 22.7],
      [42.38, 24.4],
    ] as P[],
    roof: 'mono',
    eaves: 2.8,
    rise: 0.75,
    doors: [0.1, 0.3, 0.5, 0.7, 0.9],
    doorWidth: 2.6,
  },
  {
    id: OSM.separateGarage,
    points: [
      [62.4, 15.25],
      [68.24, 15.62],
      [67.9, 21.18],
      [62.05, 20.82],
    ] as P[],
    roof: 'gable',
    eaves: 2.8,
    rise: 0.85,
    doors: [0.25, 0.75],
    doorWidth: 2.5,
  },
];

/** M16b: the end of modern Bridge Mill facing the court (east, UP-003) has one
 * opening per storey, the lowest in the well. Panes and sizes interpreted. */
export const COURT_HOUSE_EAST_END = {
  u: 23.69,
  v: -4.2,
  width: 0.78,
  height: 1.65,
  rows: [1.35, 4.05, 6.75],
};

/** M17 garage-back retaining face in UP-003. Road wall alignment is retained;
 * court-side formation, back trace and end blends interpreted, not measured. */
export const GARAGE_BACKING = {
  startX: 34,
  coreStartX: 38,
  coreEndX: 70,
  endX: 74,
  offset: 3.7,
  back: [
    [34, 25.3],
    [42.38, 24.4],
    [59.76, 22.7],
    [68.24, 21.18],
    [74, 21.7],
  ] as P[],
};

/** PA13 UP-002: dark square posts, pale rails and sparse slim uprights.
 * Member sizes/spacing and ground-relative heights estimated. */
export const BROOK_PARKING_RAIL = {
  spacing: 2.2,
  postWidth: 0.13,
  height: 1.1,
  bars: [0.2, 0.58, 0.96],
  uprightSpacing: 0.75,
};

/** PA11 visible west frontage planting has separated irregular crowns.
 * Four represented clusters, centres/sizes estimated; not an individual plant census. */
export const BROOK_FRONTAGE_SHRUBS = [
  { x: 63.0, z: -51.0, height: 1.1, rx: 0.68, rz: 0.65, bed: 4 },
  { x: 63.0, z: -49.65, height: 0.9, rx: 0.65, rz: 0.62, bed: 4 },
  { x: 63.0, z: -44.0, height: 1.25, rx: 0.68, rz: 0.57, bed: 5 },
  { x: 63.0, z: -43.05, height: 0.85, rx: 0.6, rz: 0.52, bed: 5 },
];

/** M18: June 2024 EAG-001 and north-up aerial. Mapped junction anchor;
 * local corner controls, widths and wall dimensions are interpreted metres. */
export const BLACKBURN_ENTRANCE = {
  origin: [-290.12, 158.63] as P,
  direction: [0.637, -0.771] as P,
  gateKerb: [
    // Starts where the generic Eagley Way pavement resumes (densified node).
    [16.6, -3.2],
    [10, -3.2],
    [8.2, -3.45],
    [6.9, -4.2],
    [6.4, -5.5],
    [6.15, -8.5],
    [6.7, -14],
  ] as P[],
  hillKerb: [
    [16.6, 3.2],
    [10, 3.2],
    [7.8, 3.5],
    [5.6, 4.4],
    [3.7, 5.8],
    [1.8, 7.8],
    [-0.6, 10.2],
    [-2.02, 14],
  ] as P[],
  opposite: [
    [-3.285, -14],
    [-5, 0],
    [-12.5, 14],
  ] as P[],
  gateWidth: 1.1,
  hillWidth: 1.1,
  wallThickness: 0.5,
  wallHeight: 1.25,
};

/** M19 photographed lower hip; ridge setback and chimney dimensions estimated. */
export const GATEHOUSE_DETAILS = {
  lowerRidgeEnd: 10.2,
  chimney: { u: 10.35, v: 3.3, potBase: 5.87, potHeight: 0.34 },
};

/** M20 front rooflights counted in August 2022 JQPe panorama. Positions/sizes estimated. */
export const SCHOOL_FRONT_OPENINGS = {
  rooflights: [10.2, 12.5, 14.85],
  rooflightV: 4.8,
  width: 0.72,
  depth: 1.25,
  porches: [8.4, 16.6],
  // March 2024 oblique: two adjacent east-slope lights and one hall light.
  // Local centres and dimensions remain interpreted.
  eastRooflights: [
    [23.75, 9.8],
    [23.75, 11.35],
  ] as P[],
  hallRooflight: [26.2, 18.25] as P,
  // Narrow pointed gable recesses photographed; all profile sizes estimated.
  gableRecess: { bottom: 7.35, spring: 7.85, radius: 0.18, rise: 0.45 },
  // M20f March 2024: pitched pier caps and the exposed east side of west porch.
  // Counts/form photographed; centres, dimensions and profiles estimated.
  pierCap: { width: 0.52, depth: 0.54, eave: 1.95, rise: 0.3 },
  porchSideWindow: { u: 9.48, v: 0.6, y: 1.85, width: 0.58, height: 1.45 },
  // Three visible main east sashes in the March 2024 photograph, not a span count.
  // One column/two sash rows each; local centres and sizes estimated.
  eastWindows: {
    positions: [3, 6.2, 9.3],
    u: 25.18,
    y: 2.7,
    width: 1.37,
    height: 2.52,
  },
};

/** M20b School Street slab pavement and raised front garden. OSM anchor,
 * photograph-supported arrangement; controls, widths and levels estimated. */
export const SCHOOL_FORECOURT = {
  origin: [50.53, -98.6] as P,
  direction: [0.904, 0.427] as P,
  kerb: [
    [-0.5, -4.4],
    [22.5, -4.4],
    [24.5, -4.1],
    [26, -3.3],
    [27, -1.7],
    [27.5, 0.5],
  ] as P[],
  back: [
    [-0.5, -2.35],
    [22.5, -2.35],
    [24, -2.3],
    [24.9, -1.7],
    [25.6, -0.8],
    [25.8, 0.5],
  ] as P[],
  garden: [
    [0, -2.1],
    [25, -2.1],
    [25, 0],
    [16.6, 0],
    [16.6, 1.5],
    [8.4, 1.5],
    [8.4, 0],
    [0, 0],
  ] as P[],
  frontWall: [
    [0, -2.1],
    [25, -2.1],
  ] as P[],
  // Fill the coarse grass triangles clipped across the retaining wall ends.
  // These patches follow the existing terrain; they do not define access.
  seamEnds: [-2, 0, 25, 28],
};

/** M14 narrow east tower arches: two photographed, semicircular heads.
 * Profiles and dimensions estimated from the small east-elevation reference. */
export const BROOK_EAST_GROUND = {
  positions: [-1.25, 1.25],
  width: 1,
  height: 2.15,
  centreY: 1.8,
  depth: 0.81,
  rise: 0.5,
};

/** Two narrow courses per brick storey visible in the east photograph.
 * Course heights, thickness and face extents are interpreted, not measured. */
export const BROOK_EAST_BANDS = {
  heights: [4.05, 5.55, 7.65, 9.15, 11.25, 12.75, 14.85, 16.35],
  thickness: 0.16,
  flankEnds: [-13, -2.95, 2.95, 13],
  flankOpenings: [-11, -7.7, -4.4, 4.4, 7.7, 11],
};

/** M21d lower east entrance. Mapped facade/road, photographed level relation;
 * apron and retaining dimensions estimated, concealed descent provisional. */
export const VALLEY_ENTRANCE = {
  // June 2024 CGJK / May 2012 g1IQ: lower doors and retaining edges.
  // Local u runs south, d outward. Dimensions and descent estimated.
  u0: 11.4,
  u1: 18.2,
  apronDepth: 1.4,
  roadMargin: 0.32,
  pavementWidth: 1.1,
  thresholdRise: 0.13,
  landPatch: { x0: 8, z0: -76, width: 16, depth: 18 },
};

/** M22a1, August 2022 xFx / Zxl overlapping fronts. OSM front anchors;
 * seven counted upper groups. Dimensions, panes and foundation heights fitted.
 * Garage apertures are photographed groups, not inferred ownership/access. */
export const SCHOLARS_MODERN_ROW = {
  from: [50.01, -146.39] as P,
  to: [86.87, -133.34] as P,
  depth: 9.6,
  eaves: 8.65,
  ridge: 10.2,
  homes: [
    { u: 2.82, width: 1.05, balcony: false, door: true },
    { u: 8.46, width: 2.1, balcony: true, door: false },
    { u: 14.1, width: 2.1, balcony: true, door: false },
    { u: 19.74, width: 1.05, balcony: false, door: true },
    { u: 25.38, width: 1.05, balcony: false, door: true },
    { u: 31.02, width: 2.1, balcony: true, door: false },
    { u: 36.66, width: 2.1, balcony: true, door: false },
  ],
  gables: [
    { u: 2.82, width: 5.64, rise: 1.55 },
    { u: 8.46, width: 5.64, rise: 1.55 },
    { u: 14.1, width: 5.64, rise: 1.55 },
    { u: 22.56, width: 11.28, rise: 2.8 },
    { u: 31.02, width: 5.64, rise: 1.55 },
    { u: 36.66, width: 5.64, rise: 1.55 },
  ],
  garages: [
    { u: 14.1, width: 4.2 },
    { u: 31.02, width: 4.2 },
  ],
};

/** M22a2, May 2012 pv7 / August 2022 b_P and Vcg. The angled pair
 * is separate from the straight row. Front anchors mapped; dimensions fitted.
 * One narrow group per front/floor, one broad group per outer return/floor.
 * Garage and door positions are apertures, not an internal access survey. */
export const SCHOLARS_ANGLED_PAIR = {
  from: [90.18, -134.19] as P,
  to: [98.28, -125.94] as P,
  depth: 14.2,
  eaves: 8.65,
  ridge: 11.45,
  returnCentre: -2.9,
  returnGableWidth: 5.8,
  returnGableRise: 1.55,
  backGableCentre: -10,
  backGableWidth: 8.4,
  backGableRise: 2.8,
  easternTallGroup: { v: -11.8, bottom: 3.6, height: 1.95, width: 1.05 },
};

/** M21e1, Geograph 3075250, 25 July 2012. Six west conversion groups counted;
 * the central three are broad at the top. Lower central groups tree-hidden.
 * Mapped anchors, fitted centres/heights/widths; no threshold survey. */
export const VALLEY_ENGINE_WEST = {
  from: [-63.45, -72.02] as P,
  to: [-53.27, -100.59] as P,
  groups: [
    { u: 2.8, width: 1.65, columns: 2, concealedBase: false },
    { u: 8.2, width: 1.65, columns: 2, concealedBase: false },
    { u: 14.0, width: 3.15, columns: 3, concealedBase: true },
    { u: 19.0, width: 3.15, columns: 3, concealedBase: true },
    { u: 24.0, width: 3.15, columns: 3, concealedBase: false },
    { u: 28.2, width: 1.65, columns: 2, concealedBase: false },
  ],
  rows: [
    { bottom: 0.45, top: 6.15, divisions: 5 },
    { bottom: 6.95, top: 9.15, divisions: 2 },
    { bottom: 9.95, top: 13.95, divisions: 5 },
  ],
  bands: [6.55, 9.5],
};

/** M21e2 south return, Geograph 3075250, 25 July 2012. Three tall groups,
 * central blind arch head and blank upper panel photographed. Mapped endpoints;
 * fitted dimensions and partly obscured base openings remain estimates. */
export const VALLEY_ENGINE_SOUTH = {
  from: [-53.12, -68.35] as P,
  to: [-63.45, -72.02] as P,
  tall: [
    { u: 2.0, width: 1.65, top: 9.15 },
    { u: 5.5, width: 2.5, top: 7.15 },
    { u: 9.0, width: 1.65, top: 9.15 },
  ],
  bottom: 2.85,
  arch: { u: 5.5, width: 2.95, top: 9.2 },
  upperPanel: { u: 5.5, width: 7.1, bottom: 9.75, top: 12.35 },
  base: [
    { u: 1.25, width: 1.35, bottom: 0.35, top: 2.3, arched: true },
    { u: 9.0, width: 0.95, bottom: 0.35, top: 1.95, arched: false },
  ],
  bands: [2.65, 9.5],
};

/** M21a Valley Mill east elevation. OSM end anchors, 2012 Alan Murray-Rust
 * photographs and June 2024 CGJKJDqjUkB1pntPvj9yVQ. Counts photographed;
 * positions, heights, projections and cupola profile estimated. */
export const VALLEY_MILL = {
  east: { from: [17.39, -81.98] as P, to: [7.44, -54.06] as P },
  // M21c 25 July 2012 Geograph 3075244/3075248, east-to-west south face.
  // Sixteen upper positions counted from overlapping photos; lower western
  // details tree-hidden. All fitted centres and repeated low-row details estimated.
  south: {
    from: [7.44, -54.06] as P,
    to: [-50.82, -74.82] as P,
    balconyRows: [1, 2, 3],
    positions: [
      { u: 1.93, top: 'window' },
      { u: 5.79, top: 'balcony' },
      { u: 9.65, top: 'window' },
      { u: 13.51, top: 'balcony' },
      { u: 17.37, top: 'balcony' },
      { u: 21.23, top: 'window' },
      { u: 25.09, top: 'window' },
      { u: 28.95, top: 'balcony' },
      { u: 32.81, top: 'balcony' },
      { u: 36.67, top: 'window' },
      { u: 40.53, top: 'window' },
      { u: 44.39, top: 'balcony' },
      { u: 48.25, top: 'balcony' },
      { u: 52.11, top: 'window' },
      { u: 55.97, top: 'window' },
      { u: 59.83, top: 'window' },
    ],
    piers: [
      0, 3.86, 7.72, 11.58, 15.44, 19.3, 23.16, 27.02, 30.88, 34.74, 38.6,
      42.46, 46.32, 50.18, 54.04, 57.9, 61.85,
    ],
    division: 11.58,
    window: { width: 2.25, bottom: 0.45, top: 3.08, rise: 0.2 },
    ground: { width: 2.45, bottom: 0.35, top: 3.02, rise: 1.225 },
  },
  // M21b May 2012 overlapping north views. Explicit west-to-east positions;
  // centre spacing fitted, NOT measured or derived from wall length.
  north: {
    balconyRows: [3],
    from: [-42.52, -103.34] as P,
    to: [17.39, -81.98] as P,
    positions: [
      { u: 2, top: 'window' },
      { u: 6, top: 'window' },
      { u: 10, top: 'window' },
      { u: 14, top: 'balcony' },
      { u: 18, top: 'balcony' },
      { u: 22, top: 'window' },
      { u: 26, top: 'window' },
      { u: 30, top: 'balcony' },
      { u: 34, top: 'balcony' },
      { u: 38, top: 'window' },
      { u: 42, top: 'window' },
      { u: 46, top: 'balcony' },
      { u: 50, top: 'window' },
      { u: 54, top: 'window' },
      { u: 58, top: 'window' },
    ],
    piers: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 63.61],
    division: 51.5,
    window: { width: 2.25, bottom: 0.45, top: 3.08, rise: 0.2 },
    ground: { width: 2.45, bottom: 0.35, top: 3.02, rise: 1.225 },
  },
  height: 14.4,
  eastStacks: [3.4, 6.8, 10.2, 19.4, 22.8, 26.2],
  stair: {
    u: 14.8,
    width: 3.4,
    lowerBottom: 4.0,
    lowerTop: 6.9,
    upperBottom: 8.0,
    upperTop: 13.6,
  },
  cupola: {
    u: 2.3,
    inset: 2.1,
    width: 3.2,
    baseHeight: 0.9,
    openHeight: 1.6,
    capRise: 1.05,
  },
  // Preserved generic opening centres, NOT a counted survey. These three
  // other mapped edges are placeholders pending M21e, not historic bay counts.
  provisionalEdges: [
    { edge: 0, centres: [3.1044] },
    { edge: 4, centres: [1.7167, 5.15] },
    { edge: 7, centres: [2.3019, 6.9057] },
  ],
};

/** M23 eight Threadfold Way houses opposite Bridge Mill parking. Mapped anchors;
 * August 2022 front opening counts and central gables photographed.
 * Fitted dimensions/colours, no rear opening survey. South-to-north schedule. */
export const THREADFOLD_HOUSES = {
  from: [-23.34, 14.3] as P,
  along: [0.338, -0.941] as P,
  out: [0.941, 0.338] as P,
  length: 41.28,
  depth: 10.17,
  pavementInset: 4.45,
  homes: [
    { u: 0, width: 5.15, gable: false },
    { u: 5.15, width: 5.16, gable: false },
    { u: 10.31, width: 5.16, gable: false },
    { u: 15.47, width: 5.17, gable: true },
    { u: 20.64, width: 5.18, gable: true },
    { u: 25.82, width: 5.15, gable: false },
    { u: 30.97, width: 5.15, gable: false },
    { u: 36.12, width: 5.16, gable: false },
  ],
  doorColours: [
    '#626b65',
    '#646b61',
    '#747767',
    '#444b43',
    '#5f685e',
    '#252d2b',
    '#566658',
    '#6e776b',
  ],
};

/** M24 Bridge Mill court. Google aerial and UP-003, reference only.
 * Outlines, bay sizes, ramp extent and paint are fitted estimates.
 * Western five/northern five/central three/eastern three occupied positions visible;
 * southern three positions partly canopy-hidden, provisional. */
export const BRIDGE_PARKING = {
  // F136 Aug2022 and aerial: broad open entrance, not a narrow access ribbon.
  // Outline fitted against mapped access655432310, not surveyed.
  apron: [
    [-2.48, -5.33],
    [1.3, -4],
    [4.7, 0],
    [6, 8],
    [14, 7],
    [24, 2],
    [18, -4],
    [12, -8],
    [5, -11],
    [0.24, -12.85],
  ] as P[],
  entranceRoad: [-1.12, -9.09] as P,
  hedge: { x: 7.9, fromZ: 8.4, toZ: 22.2, width: 1.5, height: 1.25 },
  rampStartX: 28,
  rampEndX: 43,
  entrance: [13.67, -3.73] as P,
  surface: [
    [6, 2],
    [24, 2],
    [35, 0.5],
    [38.8, 0.5],
    [38.8, 7],
    [39.9, 10.54],
    [64.2, 8.65],
    [65.59, 8.57],
    [64.95, 0.49],
    [75.2, -0.3],
    [75.4, 8.6],
    [73, 9],
    [73, 23],
    [41, 26],
    [36, 23],
    [31, 30],
    [12, 30],
    [7, 23],
  ] as P[],
  islands: [
    [
      [6.7, 8],
      [10.1, 8],
      [10.2, 22.7],
      [8.4, 24],
      [7.1, 22],
    ] as P[],
    [
      [28.3, 14.1],
      // Three asphalt bays cut into the lawn from the north; aerial and F136.
      [29.2, 14.1],
      [29.2, 18.9],
      [37, 18.9],
      [37, 14.1],
      [37.7, 14.1],
      [37.3, 19.5],
      [35.1, 23.1],
      [30.6, 24],
      [27.3, 21.9],
      [26.1, 18.5],
      [26.6, 16],
    ] as P[],
  ],
  rows: [
    {
      start: [10.2, 22.25] as P,
      count: 5,
      width: 2.65,
      depth: 5,
      angle: Math.PI / 2,
    },
    { start: [12, 3.2] as P, count: 5, width: 2.6, depth: 4.8, angle: 0 },
    {
      start: [29.2, 14.1] as P,
      count: 3,
      width: 2.6,
      depth: 4.8,
      angle: 0,
    },
    {
      // Separate eastern row beside the block's west end. Fitted dimensions.
      start: [38.5, 0.8] as P,
      count: 3,
      width: 2.6,
      depth: 4.8,
      angle: -Math.PI / 2,
    },
    {
      start: [21.4, 28.5] as P,
      count: 3,
      width: 2.8,
      depth: 4.8,
      angle: Math.PI,
    },
  ],
  houseWalk: [
    [38, 11.2],
    [40.65, 10.84],
    [64.2, 8.97],
    [67.2, 9.1],
  ] as P[],
  edges: [
    [
      [6.7, 3],
      [6.7, 8],
    ],
    [
      [12, 29.2],
      [30.5, 29.2],
      [35.6, 23.5],
    ],
  ] as P[][],
};

/** B03 F136 Aug2022: continuous wooded bank above the garages. Mapped
 * road anchors the stretch; planting bands and specimens are fitted estimates. */
export const COURT_WOODLAND_EDGE = {
  // Court-side wooded bank west of the garage backing wall. F136 conceals
  // the precise slope/edge; this footprint is a fitted planting estimate.
  lowerBank: [
    [11, 33],
    [29, 32],
    [34, 27],
    [34, 34],
    [30, 46],
    [20, 52],
    [11, 52],
  ] as P[],
  startX: 18,
  endX: 74,
  bands: [7.8, 11.8, 15.8],
  spacing: 2.8,
};

/** M25 mapped courtyard front edges. Counts from August 2022 panoramas;
 * dimensions and concealed elevations remain fitted/provisional. */
export const WAKEFIELD_HOUSES: {
  id: string;
  a: P;
  b: P;
  group: string;
  kind: 'town' | 'arched' | 'plain' | 'bay';
}[] = [
  {
    id: '727427283',
    a: [-82.28, -32.39],
    b: [-77.34, -30.61],
    group: 'north',
    kind: 'town',
  },
  {
    id: '727427284',
    a: [-77.34, -30.61],
    b: [-72.38, -28.87],
    group: 'north',
    kind: 'town',
  },
  {
    id: '727427285',
    a: [-72.38, -28.87],
    b: [-67.46, -27.07],
    group: 'north',
    kind: 'town',
  },
  {
    id: '727427286',
    a: [-67.46, -27.07],
    b: [-62.54, -25.29],
    group: 'north',
    kind: 'town',
  },
  {
    id: '727427287',
    a: [-88.54, -38.83],
    b: [-80.98, -36.09],
    group: 'north-west',
    kind: 'plain',
  },
  {
    id: '727427290',
    a: [-61.21, -29],
    b: [-53.66, -26.29],
    group: 'north-east',
    kind: 'plain',
  },
  {
    id: '727427291',
    a: [-50.99, -21.94],
    b: [-44.98, -19.8],
    group: 'east',
    kind: 'plain',
  },
  {
    id: '727427292',
    a: [-53.03, -16.24],
    b: [-50.99, -21.94],
    group: 'east',
    kind: 'arched',
  },
  {
    id: '727427293',
    a: [-55.08, -10.51],
    b: [-53.03, -16.24],
    group: 'east',
    kind: 'arched',
  },
  {
    id: '727427294',
    a: [-57.12, -4.8],
    b: [-55.08, -10.51],
    group: 'east',
    kind: 'arched',
  },
  {
    id: '727427303',
    a: [-55.23, 8.32],
    b: [-48.91, 10.62],
    group: 'south',
    kind: 'plain',
  },
  {
    id: '727427304',
    a: [-48.75, 10.17],
    b: [-43.97, 11.94],
    group: 'south',
    kind: 'plain',
  },
  {
    id: '727427305',
    a: [-43.97, 11.94],
    b: [-39.17, 13.73],
    group: 'south',
    kind: 'plain',
  },
  {
    id: '727427306',
    a: [-39.33, 14.22],
    b: [-32.12, 16.91],
    group: 'south',
    kind: 'plain',
  },
  {
    id: '727427307',
    a: [-66.99, -6.16],
    b: [-70.9, 4.73],
    group: 'west',
    kind: 'bay',
  },
  {
    id: '727427308',
    a: [-70.9, 4.73],
    b: [-74.83, 15.63],
    group: 'west',
    kind: 'bay',
  },
  {
    id: '727427309',
    a: [-74.83, 15.63],
    b: [-77.13, 21.8],
    group: 'west-end',
    kind: 'plain',
  },
  {
    id: '727427310',
    a: [-72.98, 17.13],
    b: [-62.81, 20.96],
    group: 'west-return',
    kind: 'arched',
  },
];
export const WAKEFIELD_LOW_WING: P[] = [
  [-32.12, 16.91],
  [-31.1, 14.19],
  [-25.67, 16.22],
  [-27.84, 22.04],
  [-33.16, 20.05],
];
export const WAKEFIELD_SOUTH_END: P[] = [
  [-41.43, 19.81],
  [-39.33, 14.22],
  [-32.12, 16.91],
  [-33.16, 20.05],
  [-34.1, 22.55],
];

/** No.5 Bridge Mill: red front door on the main west wall, south of the
 * engine house, at passage level (user's 3D map view). Width estimated. */
export const BRIDGE_NO5_DOOR = {
  wallA: [77.87, 19.51] as P,
  wallB: [78.79, 9.43] as P,
  z: 18.15,
  /** Cobbled forecourt between the engine house and the frontage corner. */
  forecourtZ: 17.05,
};

/** M06, user passage photos from No.3: a raised dry-stone bed at the foot
 * of the taller retaining wall opposite Nos.3–4, west of the coping step;
 * elsewhere setts run to the wall foot. Extent and size estimated. */
export const PASSAGE_BED = { x0: 82.4, x1: 89.7, depth: 1.0, height: 0.75 };
/** Gap left between the setts and the passage wall line at x. */
export const passageSettInset = (x: number) =>
  x > PASSAGE_BED.x0 && x < PASSAGE_BED.x1 ? PASSAGE_BED.depth + 0.04 : 0.03;

/** Level frontage passage height above the rear gardens (bridgeBase). */
export const BRIDGE_PASSAGE_RISE = 2.8;
/** Old mill eaves above the passage: two storeys show on the frontage. */
export const BRIDGE_EAVES_ABOVE_PASSAGE = 7.2;

/** Court-to-passage junction west of old Bridge Mill. The court rises gently
 * east and south to passage level at x1 (user photos, EA terrain); the
 * engine house's north side drops to No.5's garden. Fitted, not surveyed. */
export const BRIDGE_JUNCTION = { x0: 62, x1: 77.6, z0: 4, z1: 16 };

/** Court-to-garden rockery north of the Bridge Mill court (UP-003): three
 * stepped tiers of large stones from court level down to the gardens. Edge
 * trace from Google aerial and the photo; tier depths and heights estimated. */
export const COURT_ROCKERY = {
  edge: [
    [64.95, 0.49],
    [75.2, -0.3],
  ] as P[],
  /** Tier fronts measured north from the court edge, metres. */
  fronts: [0.35, 1.05, 1.75, 2.45],
  /** Bed tops below court level for the coping and each tier. */
  drops: [-0.12, 0.45, 1.05, 1.6],
};

/** Modern block (court houses) rear gardens, UP-003. Local frame of
 * court-houses.ts: u along the north wall from the west end, v negative north.
 * Divisions follow the downpipes; depths from aerial and photo, estimated. */
export const COURT_GARDENS = {
  divisions: [7.86, 15.72],
  patioDepth: 3.0,
  /** Outer garden fence, beyond which shared lawn runs to the brook wall. */
  outerV: -13.0,
  /** No.3 side garden east of the block, closed by hedges to the rockery. */
  sideHedge: [
    [62.88, -7.4],
    [70, -5.5],
    [70, -2.35],
  ] as P[],
  terrace: [
    [65.6, -2.2],
    [69.5, -2.45],
    [69.5, -4.7],
    [65.6, -4.4],
  ] as P[],
  /** Tall shrubs between the court and the old mill's west garden. */
  eastShrubs: { x: 75.95, fromZ: -0.1, toZ: 10.8 },
};

/** PA14 / UP-003, garden face counted independently of the entrance face.
 * Each of three homes has two tall paired groups and one narrow side light
 * on each of three rows. The near/east and middle homes have the narrow
 * light towards their east ends; the far/west home has it at the west end.
 * Local u runs west to east. Centres, sizes and pane divisions are fitted
 * estimates; the photograph does not resolve which ground leaves open. */
export const COURT_GARDEN_OPENINGS = {
  groups: [
    { u: 0.85, kind: 'light' },
    { u: 3.1, kind: 'paired' },
    { u: 5.65, kind: 'paired' },
    { u: 9.4, kind: 'paired' },
    { u: 11.95, kind: 'paired' },
    { u: 14.35, kind: 'light' },
    { u: 17.25, kind: 'paired' },
    { u: 19.8, kind: 'paired' },
    { u: 22.25, kind: 'light' },
  ],
  rows: [
    { bottom: 0.2, height: 2.25, lightBottom: 0.72, lightHeight: 1.08 },
    { bottom: 3.02, height: 2.12, lightBottom: 3.52, lightHeight: 1.12 },
    { bottom: 5.78, height: 2.06, lightBottom: 6.25, lightHeight: 1.08 },
  ],
  pairedWidth: 1.45,
  lightWidth: 0.55,
  wallV: -7.76,
  downpipes: [0, 7.86, 15.72, 23.6],
} as const;

/** IMG_8691 and user's 4 October correction. Rear groups align vertically;
 * No.3 alone has a downpipe to the gutter. Centres/dimensions fitted, not measured.
 * West-to-east, No.5 to No.1; eastern groups retain earlier inferred spacing. */
export const BRIDGE_REAR_OPENINGS = {
  homes: [
    { door: 80.895, window: null },
    { door: 84.767, window: 87.218 },
    { door: 90.343, window: 92.622 },
    { door: 95.953, window: 98.662 },
    { door: 102.3615, window: 105.221 },
  ],
  upperRows: [
    { bottom: 4.0, height: 2.15 },
    { bottom: 7.33, height: 2.15 },
  ],
  downpipeX: 88.8,
  // 4 October close patio photo: sash sill well above the door threshold;
  // heads near the door transom head. Heights fitted to the photographed ratio.
  groundSash: { bottom: 0.68, height: 2.05 },
};

/** Old Bridge Mill rear gardens, numbered from the Hough Lane (east) end.
 * User photos from No.3 and of the fences: low trellis fences divide the
 * gardens, a tall clipped hedge closes the brook end with iron gates, and a
 * clipped hedge lines No.3's west side. Gate positions for Nos.3 and 4 are
 * photographed; the other gardens' brook-end access is unknown. */
export const BRIDGE_GARDENS = {
  fences: [83, 88.7, 94, 100.3],
  /** North (brook) edge, west to east, matching the lawn plots. */
  brookEdge: [
    [70, -5.5],
    [83, -6],
    [88.7, -6.5],
    [94, -6.1],
    [100.3, -5.7],
    [111.5, -4.3],
  ] as P[],
  gates: [87.4, 92.5],
  no3WestHedgeX: 89.1,
  /** No.4 paved path beside the hedge and far seating area, photographed. */
  no4Path: { x: 88.05, width: 0.95 },
  no4FarPatio: [
    [84.2, -5.45],
    [88.5, -5.6],
    [88.5, -3.1],
    [84.2, -2.95],
  ] as P[],
};

const no5WallX = (z: number) => {
  const D = BRIDGE_NO5_DOOR;
  return (
    D.wallA[0] +
    ((D.wallA[1] - z) * (D.wallB[0] - D.wallA[0])) / (D.wallA[1] - D.wallB[1])
  );
};
/** Setts between the court outline, the engine house, No.5's wall and the
 * road wall, west of the level frontage passage. */
export function inBridgeJunction(
  x: number,
  z: number,
  court: P[],
  wallZ: (x: number) => number,
) {
  // Run under the wall face: the mapped passage line sits short of the
  // road-offset wall at the west end, which left a grass ramp in view.
  if (x < 70 || z < 9 || z > wallZ(x) + 0.9 || inPoly(x, z, court))
    return false;
  const D = BRIDGE_NO5_DOOR;
  if (z < D.forecourtZ) return x < 75.4;
  // South of the mill corner there is no wall: meet the level passage.
  return x < (z < D.wallA[1] ? no5WallX(z) : BRIDGE_JUNCTION.x1 + 0.05);
}

/** M25b VID-001 10:54–11:15. Centreline mapped; offsets, height and
 * recess centres fitted from overlapping frames, not surveyed. */
export const SCHOOL_STREET = {
  width: 5.2,
  northPavement: 0.65,
  pavement: 0.85,
  formationMargin: 0.9,
  wallHeight: 2.45,
  southWall: [
    [87.59, -80.47],
    [87.29, -81.37],
    [87.39, -82.17],
    [88.09, -82.87],
    [141.99, -57.77],
    [144.29, -56.47],
    [145.77, -55.09],
  ] as P[],
  // Five identifiable recesses across overlapping western wall views.
  // The concealed eastern extent is deliberately not populated by a spacing rule.
  recesses: [5.5, 12.2, 19.4, 27.1, 34.0],
};

/**
 * Light first pass on the outer Threadfold Way loop, Cottonfields and Hough
 * Lane. Each house gets a type from Street View (Aug 2022, Jun 2024,
 * Apr 2023); `seen: false` means the type is carried from visible
 * neighbours. Openings follow the type, not a per-house count.
 */
export type StreetHouseStyle =
  | 'estate'
  | 'townhouse'
  | 'terrace'
  | 'cottage'
  | 'pub'
  | 'cottageRow';
export type StreetHouseFace =
  | 'buff'
  | 'grit'
  | 'red'
  | 'dark'
  | 'white'
  | 'cream'
  | 'sandstone'
  | 'painted';
export type StreetHouse = {
  style: StreetHouseStyle;
  face: StreetHouseFace;
  seen: boolean;
  garage?: boolean;
  oculus?: boolean;
  porch?: boolean;
  /** Outward facing, where the nearest street is ambiguous. */
  front?: P;
  /** cottageRow: photographed frame colour, door colour, sills and the
   * small window over the door. */
  frames?: 'white' | 'brown' | 'dark';
  /** Main front-window frame colours, ground then upper, observed separately. */
  glazingFrames?: [StreetHouse['frames'], StreetHouse['frames']];
  door?: string;
  /** Individually observed leaf detail; hidden doors retain plain leaves. */
  doorDetail?:
    | 'oval-glazed'
    | 'paired-glazed'
    | 'paired-panelled'
    | 'arched-glazed';
  blackSills?: boolean;
  /** Window sills only; lintels and door jambs retain their masonry. */
  windowSills?: string;
  overDoor?: boolean;
  /** Estimated width/height from the individual upper opening; top aligns
   * with the main upper window. Unspecified openings retain earlier sizes. */
  overDoorSize?: [number, number];
  /** Individually observed glazing of the smaller upper window. */
  overDoorGlazing?: StreetGlazing;
  /** Individually observed front glazing, ground then upper. Hidden groups
   * retain the existing provisional frame; lead spacing is interpreted. */
  glazing?: [StreetGlazing | undefined, StreetGlazing | undefined];
  /** Door end as seen from the street (cottageRow default right). */
  doorSide?: 'left' | 'right';
  /** Round-headed stone door arch. */
  arched?: boolean;
  /** Painted door surround, window heads and sills. */
  surround?: string;
  /** Street name plate beside the door. */
  plate?: string;
};
export type StreetGlazing =
  | 'six-pane'
  | 'four-pane'
  | 'top-light'
  | 'two-sash'
  | 'diamond-top-light'
  | 'diamond-leaded'
  | 'rectangular-leaded';
/** School Street north fronts face the street, square to 549512306. */
const SCHOOL_NORTH_FRONT: P = [-0.414, 0.91];
const houses = (ids: string[], house: StreetHouse) =>
  Object.fromEntries(ids.map((id) => [`727${id}`, house]));
const terrace = (faces: Record<string, StreetHouseFace>, seen: boolean) =>
  Object.fromEntries(
    Object.entries(faces).map(([id, face]) => [
      `727${id}`,
      { style: 'terrace', face, seen } as StreetHouse,
    ]),
  );
export const STREET_HOUSES: Record<string, StreetHouse> = {
  // Threadfold Way, panoramas 0N-Rpc4AFucYY_73dIp2FQ and gUumhreI878pOWaZQbFBXA.
  ...houses(['427252', '427253', '427254', '427255', '427257', '427273'], {
    style: 'estate',
    face: 'buff',
    seen: true,
    garage: true,
  }),
  ...houses(['427274'], {
    style: 'estate',
    face: 'buff',
    seen: true,
    garage: true,
    oculus: true,
  }),
  ...houses(['427258', '427259', '427260', '427261'], {
    style: 'estate',
    face: 'buff',
    seen: true,
  }),
  ...houses(['427269', '427270', '427271', '427272'], {
    style: 'estate',
    face: 'buff',
    seen: false,
    garage: true,
  }),
  ...houses(['427275', '427276', '427277', '427278'], {
    style: 'estate',
    face: 'buff',
    seen: false,
  }),
  ...houses(
    [
      '427256',
      '427262',
      '427263',
      '427264',
      '427266',
      '427265',
      '427268',
      '427267',
    ],
    { style: 'townhouse', face: 'red', seen: true },
  ),
  // Cottonfields, panorama fwT3uQd6UF-u5KE5s14CHg. The townhouse row faces
  // south onto Cottonfields; its ends also border the cul-de-sac spur.
  ...houses(
    ['427242', '427243', '427244', '427245', '427246', '427247', '427248'],
    { style: 'townhouse', face: 'red', seen: true, front: [0, 1] },
  ),
  ...houses(['427241'], {
    style: 'townhouse',
    face: 'red',
    seen: false,
    front: [0, 1],
  }),
  ...houses(['427234', '427235', '427236', '427237'], {
    style: 'estate',
    face: 'buff',
    seen: true,
    garage: true,
  }),
  ...houses(['427232', '427233', '427238', '427239', '427240'], {
    style: 'estate',
    face: 'buff',
    seen: false,
    garage: true,
  }),
  // Hough Lane, panoramas qhk1TO3wrs1KF3ACqP29Ig, P4nxuImCWrbU2pHtno5IQA,
  // k9fM7igas8BaGDksX4o9fQ and KnrG3stULULRcdylLOmhBw. Facing sequences
  // were read from oblique views and may be one house out.
  ...houses(['574973', '574974'], {
    style: 'cottage',
    face: 'grit',
    seen: true,
  }),
  ...terrace({ '574971': 'grit', '574988': 'white', '574989': 'grit' }, true),
  ...terrace(
    {
      '574977': 'white',
      '574996': 'white',
      '574997': 'grit',
      '574998': 'dark',
      '575000': 'grit',
      '575001': 'red',
      '575003': 'cream',
      '575002': 'white',
      '575005': 'red',
      '575004': 'red',
      '575009': 'red',
      '575008': 'white',
      '575007': 'white',
      '575006': 'red',
      '575012': 'red',
      '575014': 'cream',
      '575016': 'grit',
      '575015': 'red',
    },
    true,
  ),
  '727575013': { style: 'terrace', face: 'red', seen: true, porch: true },
  ...terrace(
    {
      '574972': 'grit',
      '434503': 'grit',
      '434508': 'grit',
      '434555': 'grit',
      '434556': 'grit',
      '434557': 'grit',
      '434558': 'grit',
      '574975': 'red',
      '574976': 'cream',
      '574999': 'dark',
      '575010': 'red',
      '575011': 'red',
      '575017': 'red',
      '575018': 'red',
      '574987': 'white',
    },
    false,
  ),
  // M25c School Street north terrace, panoramas jN_U7SXxNIvJqXyn7ELVQQ,
  // K6qWFaQ6dgfxczmN9uhxog, X5yQULEJTGPN-uEiQ7HdXg, nY89q8fiDj4U_s6NDYj3sQ
  // and YGooBqD1oEUGn0MV_Z9FXw (Aug 2022). Every visible front has one
  // window and the door to its east below, one upper window over the ground
  // window, and on some a small window over the door. Mapping of views to
  // IDs is by camera position and may be one house out.
  ...Object.fromEntries(
    (
      [
        [
          '536',
          'white',
          '#3f6273',
          {
            glazing: ['two-sash', 'two-sash'],
            overDoor: true,
            overDoorGlazing: 'two-sash',
          },
        ],
        [
          '537',
          'brown',
          '#5a3424',
          {
            glazing: ['rectangular-leaded', 'rectangular-leaded'],
            doorDetail: 'oval-glazed',
          },
        ],
        [
          '538',
          'white',
          '#8fa3a4',
          { glazing: ['six-pane', 'six-pane'], doorDetail: 'paired-glazed' },
        ],
        [
          '540',
          'brown',
          '#5a3424',
          { glazing: ['diamond-leaded', 'diamond-leaded'] },
        ],
        [
          '539',
          'dark',
          '#2d3135',
          {
            glazing: ['two-sash', 'two-sash'],
            overDoor: true,
            overDoorGlazing: 'top-light',
            overDoorSize: [0.8, 1.15],
          },
        ],
        ['544', 'brown', '#b9bcb6', { glazing: [undefined, 'four-pane'] }],
        [
          '543',
          'brown',
          '#e4e4dc',
          {
            glazing: ['top-light', 'top-light'],
            overDoor: true,
            overDoorGlazing: 'top-light',
            windowSills: '#242827',
          },
        ],
        [
          '542',
          'brown',
          '#6b3d22',
          {
            doorDetail: 'paired-panelled',
            overDoor: true,
            glazing: ['four-pane', 'four-pane'],
            overDoorGlazing: 'top-light',
            overDoorSize: [0.5, 0.8],
          },
        ],
        [
          '541',
          'white',
          '#1f2224',
          {
            doorDetail: 'arched-glazed',
            overDoor: true,
            glazing: ['two-sash', 'two-sash'],
            glazingFrames: ['dark', 'white'],
            overDoorGlazing: 'top-light',
            windowSills: '#242827',
          },
        ],
        [
          '547',
          'white',
          '#1f2224',
          {
            glazing: ['diamond-top-light', 'diamond-top-light'],
            windowSills: '#242827',
          },
        ],
        [
          '546',
          'dark',
          '#1f2224',
          {
            face: 'painted' as const,
            glazing: ['four-pane', 'four-pane'],
            windowSills: '#242827',
          },
        ],
        [
          '545',
          'dark',
          '#5a3424',
          {
            overDoor: true,
            glazing: ['top-light', 'top-light'],
            overDoorGlazing: 'top-light',
            windowSills: '#242827',
          },
        ],
      ] as [string, StreetHouse['frames'], string, Partial<StreetHouse>?][]
    ).map(([id, frames, door, extra]) => [
      `727434${id}`,
      {
        style: 'cottageRow',
        face: 'sandstone',
        seen: true,
        front: SCHOOL_NORTH_FRONT,
        frames,
        door,
        ...extra,
      } as StreetHouse,
    ]),
  ),
  // School Street beyond the alley (548–552) and the south corner houses
  // (499–503), panoramas 1iQy8MVIscmjrQHXftz_UQ and KaaGeWPfiZeRnwL60JUIog
  // (Aug 2022). North group: arched door to the west of one window. South
  // pairs: doors at the outer ends; 503 carries the street name plate.
  ...Object.fromEntries(
    (
      [
        ['548', { frames: 'white', seen: false }],
        ['549', { frames: 'white', door: '#b5bdb8' }],
        ['550', { frames: 'brown', door: '#5a3424' }],
        ['551', { frames: 'brown', door: '#6b4a2e' }],
        ['552', { frames: 'brown', door: '#5a2b2b', seen: false }],
      ] as [string, Partial<StreetHouse>][]
    ).map(([id, extra]) => [
      `727434${id}`,
      {
        style: 'cottageRow',
        face: 'sandstone',
        seen: true,
        doorSide: 'left',
        arched: true,
        front: SCHOOL_NORTH_FRONT,
        ...extra,
      } as StreetHouse,
    ]),
  ),
  ...Object.fromEntries(
    (
      [
        [
          '499',
          'right',
          { frames: 'brown', door: '#4a2a2a', surround: '#4d4a53' },
        ],
        [
          '500',
          'left',
          { frames: 'dark', door: '#2a2625', surround: '#9b4b3b' },
        ],
        [
          '501',
          'right',
          { frames: 'brown', door: '#5a3424', blackSills: true },
        ],
        [
          '503',
          'left',
          { frames: 'brown', door: '#8a5a32', plate: 'SCHOOL STREET' },
        ],
      ] as [string, 'left' | 'right', Partial<StreetHouse>][]
    ).map(([id, doorSide, extra]) => [
      `727434${id}`,
      {
        style: 'cottageRow',
        face: 'sandstone',
        seen: true,
        doorSide,
        front: [-SCHOOL_NORTH_FRONT[0], -SCHOOL_NORTH_FRONT[1]] as P,
        ...extra,
      } as StreetHouse,
    ]),
  ),
};

/**
 * M25b School Street west end: block-paved square and walled bay (OSM
 * cross-run 727434561) beside the School House. Traced from a Google aerial
 * scaled to the OSM terrace corners (about 20px/m) and checked against Aug
 * 2022 Street View u4WK-uzOE3KV1sbD3C8m2A and YGooBqD1oEUGn0MV_Z9FXw.
 * Positions, wall heights and the bay grade are estimates. The School House
 * forecourt strip west of the wall start is left unchanged (M20g/M25d).
 */
export const SCHOOL_STREET_WEST = {
  paving: [
    [86.0, -99.6],
    [93.4, -96.4],
    [93.0, -89.5],
    [92.9, -88.5],
    [90.0, -82.3],
    [88.3, -83.0],
    [87.6, -82.4],
    [87.5, -81.4],
    [87.8, -80.4],
    [84.5, -78.6],
    [78.6, -81.2],
    [82.0, -89.2],
    [79.4, -89.75],
  ] as P[],
  // Setts give way to block paving here; the street's slab pavements stop.
  settEndX: 91.6,
  // Render-only overlap closes the resampled road strip's short end gap.
  // Estimated 0.5m allowance along the mapped street; movement is unchanged.
  settJoinOverlap: [0.453, 0.211] as P,
  // August 2022 u4WK 270 / YGoo 290: square-side four-sided lantern.
  // Fitted beside the School House retaining return; position/size estimated.
  lamp: { point: [79.95, -89.75] as P, column: 4.5, lantern: 0.65 },
  // Retaining wall with railings: School House side, bay back, No.34 side.
  wall: [
    [78.7, -88.7],
    [86.0, -99.6],
    [93.4, -96.4],
    [93.0, -89.5],
  ] as P[],
  // Five bollards along the paving edge; the mapped path 648996292 crosses
  // the row through the gap between the third and fourth. Spacing estimated.
  bollards: {
    from: [82.0, -89.2] as P,
    to: [78.6, -81.2] as P,
    at: [0, 0.2, 0.42, 0.68, 0.92],
  },
  // Paving edges that meet other surfaces (indices into `paving`); the
  // rest are walls or the unmodelled raised corner by the wall start.
  openEdges: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  // Road heights the square's plane is fitted to: setts end, cross-run south
  // stub and the mapped path beside the bollards.
  anchors: [
    [91.6, -85.4],
    [86.0, -88.0],
    [84.6, -81.0],
    [80.0, -84.0],
    [78.6, -82.2],
  ] as P[],
  // Bay level: rises gently from its mouth on the cross-run centreline.
  mouth: [86.4, -89.0] as P,
  axis: [0.371, -0.928] as P,
  rise: 0.045,
  blend: 1.5,
  // Terrain behind each wall is lowered this far so coarse grass triangles
  // cannot cross the wall and show through the paving. Narrower on the School
  // House side, where mapped footway 727434562 runs about 1.4m behind it.
  seams: [1.0, 2.2, 2.2],
  /** Parking pass: retain the east blend into the sett-road datum. */
  settBlend: [90, 92.9],
};

/** Flag 56288c8a, Aug 2022 u4WK Street View and north-up Google aerial,
 * 4 October 2026. Asphalt south of the School House frontage joins the
 * west square's bollard line. Corners fitted to mapped roads and the square;
 * concealed bay totals and the wooded southern edge are not surveyed. */
export const SCHOOL_STREET_PARKING = {
  outline: [
    [43.8, -95.7],
    [48.2, -94.5],
    [60.0, -88.9],
    [69.2, -85.0],
    [74.2, -85.4],
    [82.0, -89.2],
    [78.6, -81.2],
    [79.0, -73.5],
    [76.0, -72.3],
    [62.0, -78.5],
    [56.0, -80.5],
    [50.3, -85.5],
    [46.2, -90.1],
    [42.8, -92.0],
  ] as P[],
  blend: 2.0,
  /** Ease from the frontage road grade to the square's fitted grade. */
  squareBlend: [72, 77],
};

/**
 * Hough Lane terrace stretch, road 626124394. With the mapped centreline the
 * fronts of 727574975–998 sat on the drawn east pavement (3.2–4.0m from the
 * centre). Apr/Aug 2022–2023 Street View P4nxuImCWrbU2pHtno5IQA shows a
 * roughly 6m two-lane road, a flagged east pavement of about 1.7m in front of
 * the doors and a narrow west pavement against a dry-stone wall. The
 * centreline is moved west by `shift` metres (piecewise linear in z, mapped
 * line kept outside the range). Estimated from footprint clearances.
 */
export const HOUGH_TERRACE_ROAD = {
  id: '626124394',
  shift: [
    [-88, 0],
    [-96, 1.0],
    [-112, 1.0],
    [-125, 1.4],
    [-165, 1.4],
    [-178, 0],
  ] as P[],
  // Bank cut back under the road and both pavements (named terrain zone).
  // Behind the west wall it reaches further, so coarse bank triangles cannot
  // cross the wall and show through the pavement.
  formation: { z0: -88, z1: -178, reach: 4.75, westReach: 7.4 },
  // Dry-stone retaining wall at the back of the west pavement, where the
  // bank stands above it (P4nxuImCWrbU2pHtno5IQA heading 340). Extent and
  // heights estimated; the wall keeps walkers on the pavement.
  westWall: { z0: -118, z1: -174, offset: 4.6, minRise: 0.3, maxHeight: 1.4 },
};

/** Western fronts facing flag 6599a642. Mapped edges, fitted opening centres;
 * August 2022 Street View. Tree-hidden openings are deliberately unresolved. */
export const WAKEFIELD_WEST: {
  id: string;
  a: P;
  b: P;
  kind: 'gable' | 'hidden' | 'round' | 'garage';
}[] = [
  {
    id: OSM.wakefieldWest[0],
    a: [-97.54, -1.15],
    b: [-94.57, -9.46],
    kind: 'gable',
  },
  {
    id: OSM.wakefieldWest[1],
    a: [-94.57, -9.46],
    b: [-91.58, -17.78],
    kind: 'hidden',
  },
  {
    id: OSM.wakefieldWest[2],
    a: [-93.89, -18.63],
    b: [-91.57, -25.24],
    kind: 'round',
  },
  {
    id: OSM.wakefieldWest[3],
    a: [-99.46, 4.16],
    b: [-97.54, -1.15],
    kind: 'garage',
  },
];

/** Vale View older stone fronts, west to east. Mapped edges; opening centres
 * fitted to individually inspected August 2022 views. Hidden counts unresolved. */
export const VALE_VIEW_FRONTS: {
  id: string;
  a: P;
  b: P;
  style: 'west' | 'sash' | 'dark' | 'white' | 'hidden' | 'east';
}[] = [
  {
    id: OSM.valeViewTerrace[0],
    a: [3.64, -120.29],
    b: [9.71, -117.45],
    style: 'west',
  },
  {
    id: OSM.valeViewTerrace[1],
    a: [10.17, -118.48],
    b: [13.78, -116.82],
    style: 'sash',
  },
  {
    id: OSM.valeViewTerrace[2],
    a: [13.78, -116.82],
    b: [17.4, -115.15],
    style: 'dark',
  },
  {
    id: OSM.valeViewTerrace[3],
    a: [17.4, -115.15],
    b: [21.01, -113.46],
    style: 'white',
  },
  {
    id: OSM.valeViewTerrace[4],
    a: [21.01, -113.46],
    b: [24.61, -111.81],
    style: 'hidden',
  },
  {
    id: OSM.valeViewTerrace[5],
    a: [24, -110.52],
    b: [30.25, -107.59],
    style: 'east',
  },
];
export const VALE_VIEW_CHIMNEYS: { point: P; pots: number }[] = [
  { point: [7, -124], pots: 1 },
  { point: [16, -120.5], pots: 2 },
  { point: [25, -116.5], pots: 3 },
];

/** Spread Eagle, mapped road-facing edge. Counts from Aug 2022 views;
 * all heights, opening centres, roof depths and split positions estimated. */
export const SPREAD_EAGLE = {
  a: [208.8, -105.28] as P,
  b: [196.53, -90.43] as P,
  southExtent: 6.46,
  depth: 8.2,
  rearRidge: 12.8,
  rearHalf: 4.62,
  eave: 5.8,
  southEave: 6.4,
  rise: 1.9,
  upper: [17.16, 12.66, 8.56, 4.76, 2.16],
  lower: [
    { u: 17.16, w: 1.25 },
    { u: 12.66, w: 1.45 },
    { u: 10.46, w: 0.68 },
    { u: 8.56, w: 1.25 },
    { u: 2.16, w: 1.5 },
  ],
  entrance: 14.96,
  serviceDoor: 4.76,
  chimneys: [16.86, 8.66, 1.76],
  baskets: [16.36, 13.46, 9.96, 3.96],
};

/** M26c outside eastern Threadfold bend. OSM655432303, June2024 u-FH305,
 * VID-00113:18. Fitted widths against retained wall, not measured. */
export const THREADFOLD_BEND = {
  startX: 100,
  fullWidthX: 110,
  joinWidth: 1.7,
  width: 1.45,
  innerOffset: 3.35,
  junction: [146.8, -21] as P,
  junctionRadius: 10,
  fullWidthRadius: 14,
  terrainInnerOffset: 0.6,
  terrainMargin: 2.25,
  renderHeight: 0.075,
};

/** M26d Aug2022 IjY135 and VID-00115:08/15:21. Estimated, not surveyed. */
export const HALL_WOODLAND_ENTRANCE = {
  laneLead: 12,
  laneWidth: 4.6,
  pathLength: 14,
  pathWidth: 1.8,
  taperStart: 5,
  formationMargin: 2.2,
  wallOffset: 0.6,
  wallWidth: 0.35,
  wallHeight: 0.48,
  gateCentre: [214.19, 29.82] as P,
  gateDirection: [18.67, 25.62] as P,
  gateLeft: -2.3,
  pedestrianHinge: 0.45,
  pedestrianLeaf: 1.2,
  enclosureDepth: 1.8,
  enclosureSide: 3.15,
  gateHeight: 1.1,
  pedestrianApronExtra: 1.1,
  boardAlong: 4.0,
  boardSide: 2.7,
};
