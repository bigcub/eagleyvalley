import type { P } from '../core/geo';

// OpenStreetMap way IDs the world treats specially. Names describe the feature,
// not necessarily the OSM name tag.
export const OSM = {
  eagleyWay: '155008522',
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

/** Hough Lane road-bridge deck ends, sampled beyond both abutments. */
export const HOUGH_DECK_SOUTH: P = [128.32, 13.36];
export const HOUGH_DECK_NORTH: P = [146.1, -20];
/** North end of the Hough footbridge, where it lands on the junction island. */
export const HOUGH_FOOTBRIDGE_NORTH: P = [145.9, -13.64];

/** Playable limits for walking and driving. */
export const WORLD_LIMITS = { x0: -420, x1: 340, z0: -250, z1: 260 };
