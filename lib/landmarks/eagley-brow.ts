import * as T from 'three';
import { densify, nearest, segments, type P } from '../core/geo';
import type { Kit } from '../core/kit';
import type { WorldData } from '../world/data';
import { EAGLEY_BROW_ENTRANCE, OSM } from '../world/layout';
import type { Surface } from '../world/surface';

type Options = { surface: Surface; data: WorldData };

// EAG-030..032, June 2024. The mouth is photographed; the route beyond it
// follows OSM 61983043. Width, post count/spacing and concealed paving remain
// interpreted. No imagery is used as an asset.
function lane(data: WorldData) {
  return data.roads.find((f) => f.id === OSM.eagleyBrow)!;
}

function trackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#484b3d';
  c.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 18; row++)
    for (let col = -1; col < 12; col++) {
      const noise = Math.sin(row * 19.7 + col * 7.3);
      const shade = 98 + Math.round(noise * 14);
      c.fillStyle = `rgb(${shade + 4},${shade + 3},${shade - 5})`;
      c.beginPath();
      c.roundRect(
        col * 24 + (row % 2) * 12 + 2,
        row * 15 + 1,
        20 + noise,
        12,
        3,
      );
      c.fill();
    }
  // Damp earth and litter obscure parts of the worn setts at the entrance.
  for (let i = 0; i < 1600; i++) {
    const x = (i * 73.13) % 256,
      y = (i * 41.77) % 256;
    c.fillStyle = i % 3 ? '#423d2e45' : '#a29d7340';
    c.fillRect(x, y, 1 + (i % 3), 1 + (i % 2));
  }
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = 4;
  return map;
}

/** Dedicated old-lane surface, attached to the same formation as movement. */
export function addEagleyBrowSurface(kit: Kit, { surface, data }: Options) {
  const f = lane(data),
    points = densify(f.points, 0.5);
  const material = kit.mat('eagleyBrowWornSetts', '#c4bfb0');
  material.map = trackTexture();
  material.bumpMap = material.map;
  material.bumpScale = 0.018;
  const width = (x: number) =>
    T.MathUtils.lerp(
      EAGLEY_BROW_ENTRANCE.width,
      4.6,
      T.MathUtils.smoothstep(x, 14, 22),
    );
  kit.ribbon(
    points,
    (x) => width(x),
    material,
    (x, z) => surface.browRoadY(x, z) + 0.025,
    0,
    (a, b) =>
      nearest((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, surface.eagleySegments).d >=
      3.2,
  );
}

/** Short weathered posts leave a clear central path; each registers collision. */
export function addEagleyBrowPosts(kit: Kit, { surface, data }: Options) {
  const path = segments([lane(data)]);
  const timber = kit.mat('eagleyBrowPostTimber', '#6d6a59');
  return EAGLEY_BROW_ENTRANCE.posts.map(([distance, across, h], index) => {
    let run = distance,
      s = path[0];
    for (const candidate of path) {
      s = candidate;
      const length = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      if (run <= length) break;
      run -= length;
    }
    const dx = s.b[0] - s.a[0],
      dz = s.b[1] - s.a[1];
    const length = Math.hypot(dx, dz),
      t = run / length;
    const x = T.MathUtils.lerp(s.a[0], s.b[0], t) - (dz / length) * across;
    const z = T.MathUtils.lerp(s.a[1], s.b[1], t) + (dx / length) * across;
    const y = surface.ground(x, z);
    const g = new T.CylinderGeometry(0.075, 0.09, h, 7);
    g.rotateZ(Math.sin(index * 2.3) * 0.045);
    g.translate(x, y + h / 2, z);
    kit.batch(g, timber);
    const a: P = [x - 0.06, z],
      b: P = [x + 0.06, z];
    return { a, b };
  });
}
