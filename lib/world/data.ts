import { densify, type Feature, type P } from '../core/geo';
import { HOUGH_TERRACE_ROAD, OSM, SCHOOL_STREET } from './layout';

export type Survey = {
  x0: number;
  z0: number;
  step: number;
  cols: number;
  rows: number;
  trees: number[][];
};
export type WorldData = {
  roads: Feature[];
  water: Feature[];
  buildings: Feature[];
  survey: Survey;
  elevations: Uint16Array;
};

async function fetchOk(url: string, what: string) {
  const r = await fetch(url);
  if (!r.ok) throw Error(`${what} unavailable`);
  return r;
}

export async function loadWorldData(): Promise<WorldData> {
  const map = await fetchOk('/eagley-map.json', 'Map').then(
    (r) =>
      r.json() as Promise<{
        roads: Feature[];
        water: Feature[];
        buildings: Feature[];
      }>,
  );
  const [survey, terrain] = await Promise.all([
    fetchOk('/eagley-survey.json', 'Survey').then(
      (r) => r.json() as Promise<Survey>,
    ),
    fetchOk('/eagley-terrain.bin', 'Terrain').then((r) => r.arrayBuffer()),
  ]);
  return {
    roads: map.roads.map(correctHoughTerrace),
    water: map.water.filter((w: Feature) => w.name === 'Eagley Brook'),
    buildings: map.buildings,
    survey,
    elevations: new Uint16Array(terrain),
  };
}

/** Moves the mapped Hough Lane centreline west along the terrace stretch so
 * the photographed east pavement fits in front of the doors (layout.ts). */
function correctHoughTerrace(f: Feature): Feature {
  if (f.id !== HOUGH_TERRACE_ROAD.id) return f;
  const S = HOUGH_TERRACE_ROAD.shift;
  const shift = (z: number) => {
    for (let i = 1; i < S.length; i++) {
      const [z0, a] = S[i - 1],
        [z1, b] = S[i];
      if (z <= z0 && z >= z1) return a + ((b - a) * (z - z0)) / (z1 - z0);
    }
    return 0;
  };
  const p = densify(f.points, 4);
  const points = p.map((q, i): P => {
    const s = shift(q[1]);
    if (!s) return q;
    const a = p[Math.max(0, i - 1)],
      b = p[Math.min(p.length - 1, i + 1)],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Unit normal pointing west of the southbound line.
    let n: P = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
    if (n[0] > 0) n = [-n[0], -n[1]];
    return [q[0] + n[0] * s, q[1] + n[1] * s];
  });
  return { ...f, points };
}

/** Carriageway or path width in metres. Mostly inferred from highway class. */
export function roadWidth(f: Feature) {
  if (OSM.schoolStreetSetts.includes(f.id)) return SCHOOL_STREET.width;
  if (f.id === OSM.houghRoadBridge) return 3.8;
  if (f.id === OSM.busTurningLoop) return 6.4;
  return f.tags.highway === 'trunk'
    ? 10
    : ['footway', 'steps', 'cycleway', 'path'].includes(f.tags.highway)
      ? 1.8
      : f.tags.highway === 'service'
        ? 4.6
        : 6.4;
}
