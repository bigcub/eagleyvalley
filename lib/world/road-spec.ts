import * as T from 'three';
import type { Feature } from '../core/geo';
import { OSM } from './layout';

// Cross-section of each mapped carriageway. Sides are relative to the way's
// drawing direction: right is +normal (south when a way runs east).
//
// Unless a note says otherwise these are estimates: OSM has no width tags here,
// and 1.8m is the UK design pavement width. Street View notes are in SURVEY.md.
export type Side = {
  /** Pavement width beyond the kerb, metres. 0 for a verge or wall. */
  pavement: number;
  kerb: boolean;
  /** Double yellow lines along this edge, everywhere or where true. */
  yellow: boolean | ((x: number, z: number) => boolean);
  /** Optional limit on where this side's pavement and kerb exist. */
  where?: (x: number, z: number) => boolean;
};
export type RoadSpec = {
  /** Carriageway width at a point, kerb face to kerb face. */
  width: (x: number, z: number) => number;
  left: Side;
  right: Side;
  surface: 'asphalt' | 'blocks';
  centreDashes: boolean;
  /** Kerb radius at junction corners. */
  cornerRadius: number;
  /** Vertex spacing along the centreline for draping. */
  step: number;
};

const none: Side = { pavement: 0, kerb: false, yellow: false };
const kerbOnly: Side = { pavement: 0, kerb: true, yellow: false };
const footway = (yellow = false): Side => ({
  pavement: 1.8,
  kerb: true,
  yellow,
});

export const KERB = { width: 0.15, height: 0.12 };

const vehicle = ['trunk', 'unclassified', 'residential', 'service'];
export function isCarriageway(f: Feature) {
  return vehicle.includes(f.tags.highway) || f.id === OSM.houghOldLane;
}

/** Hough Lane narrows from 6.4m to the 3.8m bridge over its last 6m. */
function houghTaper(f: Feature) {
  const end =
    f.id === OSM.houghLaneSouth ? f.points[f.points.length - 1] : f.points[0];
  const a = f.points[0],
    b = f.points[f.points.length - 1];
  const run = Math.min(6, Math.hypot(a[0] - b[0], a[1] - b[1]));
  return (x: number, z: number) =>
    T.MathUtils.lerp(
      3.8,
      6.4,
      Math.min(1, Math.hypot(x - end[0], z - end[1]) / run),
    );
}

export function roadSpec(f: Feature): RoadSpec {
  const hw = f.tags.highway;
  const fixed = (w: number) => () => w;
  const base: RoadSpec = {
    width: fixed(6.4),
    left: footway(),
    right: footway(),
    surface: 'asphalt',
    centreDashes: false,
    cornerRadius: 4,
    step: 3,
  };
  if (hw === 'trunk')
    return { ...base, width: fixed(10), centreDashes: true, cornerRadius: 6 };
  if (hw === 'service')
    Object.assign(base, {
      width: fixed(4.6),
      left: none,
      right: none,
      cornerRadius: 2,
    });

  switch (f.id) {
    case OSM.eagleyWay:
      // June 2024 Street View: one pavement on the north (left) side, ending
      // near the Bridge Mill court; walls or fences stand at the south edge.
      // Double yellow lines only on the surveyed upper section.
      return {
        ...base,
        left: {
          pavement: 1.5,
          kerb: true,
          yellow: upper,
          where: (x) => x < 18,
        },
        right: { ...none, yellow: upper },
        centreDashes: true,
      };
    case OSM.houghRoadBridge:
      // Narrow carriageway between stone parapets; 3.8m interpreted, not measured.
      return { ...base, width: fixed(3.8), left: none, right: none };
    case OSM.houghLaneSouth:
      return { ...base, width: houghTaper(f) };
    case OSM.houghLaneNorth:
      // June 2024 _odWe/DQl views: kerbed pavements and double yellows both sides.
      return {
        ...base,
        width: houghTaper(f),
        left: footway(true),
        right: footway(true),
      };
    case OSM.houghOldLane:
      // Filtered old lane: guardrailed pavement on the north-west (right) side.
      // The south-east side opens onto the paved island by the footbridge.
      return {
        ...base,
        width: fixed(5.5),
        left: kerbOnly,
        right: footway(true),
        cornerRadius: 3,
      };
    case OSM.busTurningLoop:
      return {
        ...base,
        width: fixed(6.4),
        left: kerbOnly,
        right: kerbOnly,
        surface: 'blocks',
      };
    case OSM.cottageForecourt:
      // Aerial view: a paved forecourt ending at Threadfold Way's guardrail,
      // not a through road. No evidence of kerbs or pavements yet.
      return { ...base, width: fixed(5), left: none, right: none };
    case OSM.eagleyHallLane:
      // Aug 2022 J2Oz view: kerbs with double yellow lines, no pavement.
      return {
        ...base,
        left: { ...kerbOnly, yellow: true },
        right: { ...kerbOnly, yellow: true },
      };
  }
  if (f.name === 'Threadfold Way') {
    const yellow = { ...base, left: footway(true), right: footway(true) };
    return f.id === OSM.threadfoldWayLoop
      ? { ...yellow, step: 0.7 }
      : { ...yellow, surface: 'blocks' };
  }
  return base;
}

// Surveyed upper Eagley Way (EAG-001..013) has double yellow lines on both
// sides. Below X-118 they have not been checked, so none are drawn there.
const upper = (x: number) => x <= -118;
