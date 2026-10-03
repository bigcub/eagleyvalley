import { inPoly, type P } from '../core/geo';

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
  schoolStreetFront: '73858752',
  eagleyHall: '549512305',
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
  wakefieldHouses: ['727427283', '727427284', '727427285', '727427286', '727427287', '727427290', '727427291', '727427292', '727427293', '727427294', '727427303', '727427304', '727427305', '727427306', '727427307', '727427308', '727427309', '727427310'],
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
    [16, -3.2],
    [10, -3.2],
    [8.2, -3.45],
    [6.9, -4.2],
    [6.4, -5.5],
    [6.15, -8.5],
    [6.7, -14],
  ] as P[],
  hillKerb: [
    [16, 3.2],
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
  // Preserved generic opening centres, NOT a counted survey. These five
  // other mapped edges are placeholders pending M21e, not historic bay counts.
  provisionalEdges: [
    { edge: 0, centres: [3.1044] },
    { edge: 4, centres: [1.7167, 5.15] },
    { edge: 5, centres: [1.8271, 5.4813, 9.1355] },
    {
      edge: 6,
      centres: [
        1.685, 5.0549, 8.4249, 11.7948, 15.1647, 18.5347, 21.9046, 25.2746,
        28.6445,
      ],
    },
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
 * Western five/northern five/eastern three positions visible in aerial;
 * southern three positions partly canopy-hidden, provisional. */
export const BRIDGE_PARKING = {
  tree: { x: 34.5, z: 18.0, h: 5.4 },
  hedge: { x: 7.6, fromZ: 8.4, toZ: 22.2, width: 0.9, height: 0.95 },
  rampStartX: 28,
  rampEndX: 43,
  entrance: [13.67, -3.73] as P,
  surface: [
    [6, 2],
    [24, 2],
    [35, 5],
    [37, 7],
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
      start: [37, 14.1] as P,
      count: 3,
      width: 2.6,
      depth: 4.8,
      angle: Math.PI,
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

/** M25 mapped courtyard front edges. Counts from August 2022 panoramas;
 * dimensions and concealed elevations remain fitted/provisional. */
export const WAKEFIELD_HOUSES: {
  id: string; a: P; b: P; group: string; kind: 'town' | 'arched' | 'plain' | 'bay';
}[] = [
  {id:'727427283',a:[-82.28,-32.39],b:[-77.34,-30.61],group:'north',kind:'town'},
  {id:'727427284',a:[-77.34,-30.61],b:[-72.38,-28.87],group:'north',kind:'town'},
  {id:'727427285',a:[-72.38,-28.87],b:[-67.46,-27.07],group:'north',kind:'town'},
  {id:'727427286',a:[-67.46,-27.07],b:[-62.54,-25.29],group:'north',kind:'town'},
  {id:'727427287',a:[-88.54,-38.83],b:[-80.98,-36.09],group:'north-west',kind:'plain'},
  {id:'727427290',a:[-61.21,-29],b:[-53.66,-26.29],group:'north-east',kind:'plain'},
  {id:'727427291',a:[-50.99,-21.94],b:[-44.98,-19.8],group:'east',kind:'plain'},
  {id:'727427292',a:[-53.03,-16.24],b:[-50.99,-21.94],group:'east',kind:'arched'},
  {id:'727427293',a:[-55.08,-10.51],b:[-53.03,-16.24],group:'east',kind:'arched'},
  {id:'727427294',a:[-57.12,-4.8],b:[-55.08,-10.51],group:'east',kind:'arched'},
  {id:'727427303',a:[-55.23,8.32],b:[-48.91,10.62],group:'south',kind:'plain'},
  {id:'727427304',a:[-48.75,10.17],b:[-43.97,11.94],group:'south',kind:'plain'},
  {id:'727427305',a:[-43.97,11.94],b:[-39.17,13.73],group:'south',kind:'plain'},
  {id:'727427306',a:[-39.33,14.22],b:[-32.12,16.91],group:'south',kind:'plain'},
  {id:'727427307',a:[-66.99,-6.16],b:[-70.9,4.73],group:'west',kind:'bay'},
  {id:'727427308',a:[-70.9,4.73],b:[-74.83,15.63],group:'west',kind:'bay'},
  {id:'727427309',a:[-74.83,15.63],b:[-77.13,21.8],group:'west-end',kind:'plain'},
  {id:'727427310',a:[-72.98,17.13],b:[-62.81,20.96],group:'west-return',kind:'arched'},
];
export const WAKEFIELD_LOW_WING: P[] = [
 [-32.12,16.91],[-31.1,14.19],[-25.67,16.22],[-27.84,22.04],[-33.16,20.05],
];
export const WAKEFIELD_SOUTH_END: P[] = [
 [-41.43,19.81],[-39.33,14.22],[-32.12,16.91],[-33.16,20.05],[-34.1,22.55],
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
  if (x < 70 || z < 9 || z > wallZ(x) + 0.35 || inPoly(x, z, court))
    return false;
  const D = BRIDGE_NO5_DOOR;
  return z < D.forecourtZ ? x < 75.4 : x < no5WallX(z);
}
