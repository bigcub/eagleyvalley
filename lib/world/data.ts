import type { Feature } from '../core/geo';
import { OSM, SCHOOL_STREET } from './layout';

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
    roads: map.roads,
    water: map.water.filter((w: Feature) => w.name === 'Eagley Brook'),
    buildings: map.buildings,
    survey,
    elevations: new Uint16Array(terrain),
  };
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
