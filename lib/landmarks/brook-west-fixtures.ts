import * as T from 'three';
import type { Kit } from '../core/kit';
import type { Surface } from '../world/surface';
import {
  BROOK_WEST_FIXTURES as D,
  BROOK_WEST_ENTRANCE as E,
} from '../world/layout';
import { brookWestPoint } from './brook-west-entrance';
import { brookWingRoofY } from './brook-north-return';

/** Reference-only UP-002. No image assets, unreadable labels or invented notices. */
export function addBrookWestFixtures(
  kit: Kit,
  { surface }: { surface: Surface },
) {
  const entry = surface.brookWestEntry,
    metal = kit.mat('brookFixtureIron', '#252f33', 0.7);
  const stone = kit.mat('brookFinialStone', '#aaa795');
  const B = (
    u: number,
    y: number,
    d: number,
    w: number,
    h: number,
    depth: number,
    m: T.Material,
  ) => {
    const [x, z] = brookWestPoint(u, d);
    kit.box(x, entry + y, z, depth, h, w, m, E.angle);
  };
  const place = (
    g: T.BufferGeometry,
    u: number,
    y: number,
    d: number,
    m: T.Material,
  ) => {
    g.rotateY(E.angle);
    const [x, z] = brookWestPoint(u, d);
    g.translate(x, entry + y, z);
    kit.batch(g, m);
  };
  // A single glyph atlas batches all nine letters. Alpha-cut planes give separate
  // red letters without a rectangular sign backing or an embedded photograph.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 210px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const word = 'BROOKMILL';
  for (let i = 0; i < word.length; i++)
    ctx.fillText(word[i], (i % 4) * 256 + 128, Math.floor(i / 4) * 256 + 132);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  const red = kit.mat('brookWestLetters', '#d53734', 0.7);
  red.map = map;
  red.alphaTest = 0.5;
  red.side = T.DoubleSide;
  for (let i = 0; i < word.length; i++) {
    const g = new T.PlaneGeometry(D.lettering.size, D.lettering.size);
    const uv = g.getAttribute('uv'),
      col = i % 4,
      row = Math.floor(i / 4);
    for (let j = 0; j < uv.count; j++)
      uv.setXY(j, (col + uv.getX(j)) / 4, 1 - (row + 1 - uv.getY(j)) / 4);
    g.rotateY(-Math.PI / 2);
    const y =
      D.lettering.top -
      i * D.lettering.step -
      (i >= 5 ? D.lettering.wordGap : 0);
    place(g, D.lettering.u, y, y < 3.3 ? 0.31 : 0.17, red);
  }
  const lamp = D.lantern;
  B(lamp.u, 2.05, 0.12, 0.12, 0.3, 0.16, metal);
  B(lamp.u, 2.18, 0.32, 0.045, 0.045, 0.42, metal);
  B(lamp.u, 2.3, lamp.depth, 0.06, 0.22, 0.06, metal);
  // Four-sided glazed lantern, pitched cap, top finial and lower collar.
  const panes = kit.mat('brookLanternGlass', '#9caeaf', 0.25);
  panes.transparent = true;
  panes.opacity = 0.35;
  panes.depthWrite = false;
  B(lamp.u, lamp.centre, lamp.depth, 0.31, 0.4, 0.31, panes);
  for (const u of [-0.17, 0.17])
    for (const d of [-0.17, 0.17])
      B(lamp.u + u, lamp.centre, lamp.depth + d, 0.025, 0.43, 0.025, metal);
  B(lamp.u, lamp.centre - 0.22, lamp.depth, 0.37, 0.045, 0.37, metal);
  B(lamp.u, lamp.centre + 0.22, lamp.depth, 0.39, 0.045, 0.39, metal);
  const cap = new T.ConeGeometry(0.29, 0.18, 4);
  cap.rotateY(Math.PI / 4);
  place(cap, lamp.u, lamp.centre + 0.32, lamp.depth, metal);
  place(
    new T.SphereGeometry(0.045, 8, 6),
    lamp.u,
    lamp.centre + 0.45,
    lamp.depth,
    metal,
  );
  B(lamp.u, lamp.centre - 0.31, lamp.depth, 0.065, 0.16, 0.065, metal);
  // Small dark entry panel photographed beside the door; no guessed labels.
  B(D.intercom.u, D.intercom.y, 0.2, 0.13, 0.27, 0.08, metal);
  B(
    D.intercom.u,
    D.intercom.y + 0.07,
    0.25,
    0.08,
    0.06,
    0.018,
    kit.mat('brookEntryPanel', '#767d79'),
  );
  for (const f of D.wallFittings) {
    B(f.u, f.y, f.depth, f.width, 0.12, 0.12, metal);
    B(
      f.u,
      f.y - 0.09,
      f.depth + 0.02,
      0.09,
      0.14,
      0.07,
      kit.mat('brookFixtureHousing', '#d3d3c6'),
    );
  }
  // The roof-edge ornament is visible, but its profile and exact fitting are estimated.
  const finial = D.finial,
    roofY = brookWingRoofY(finial.depth);
  B(finial.u, roofY + 0.14, finial.depth, 0.35, 0.28, 0.35, stone);
  const profile = [
    [0.15, 0],
    [0.15, 0.07],
    [0.08, 0.12],
    [0.055, 0.25],
    [0.085, 0.36],
    [0.13, 0.43],
    [0.14, 0.49],
    [0.12, 0.57],
    [0.07, 0.64],
    [0.04, 0.68],
  ];
  const urn = new T.LatheGeometry(
    profile.map(([r, y]) => new T.Vector2(r, y)),
    10,
  );
  place(urn, finial.u, roofY + 0.28, finial.depth, stone);
}
