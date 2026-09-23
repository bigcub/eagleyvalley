import * as T from 'three';
import type { Feature } from '../core/geo';
import { roadWidth } from '../world/data';
import type { ReviewFlag } from '../review-flags';

/** Corner map: mapped roads, brook and the player arrow. */
export function createMapOverlay(
  host: HTMLElement,
  roads: Feature[],
  water: Feature[],
) {
  const el = document.createElement('div');
  el.className = 'map-overlay';
  Object.assign(el.style, {
    position: 'absolute',
    right: '38px',
    top: '115px',
    width: '270px',
    height: '235px',
    background: '#18352eef',
    border: '1px solid #ffffff30',
    borderRadius: '8px',
    display: 'none',
    pointerEvents: 'none',
    overflow: 'hidden',
  });
  host.appendChild(el);
  const line = (f: Feature, stroke: string, width: number) =>
    `<polyline points="${f.points.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`;
  const svgRoads = roads
    .map((f) =>
      line(
        f,
        f.name === 'Eagley Way' || f.name === 'Threadfold Way'
          ? '#e7d797'
          : '#718374',
        roadWidth(f),
      ),
    )
    .join('');
  const svgWater = water.map((f) => line(f, '#79b7b6', 8)).join('');
  let visible = false;
  return {
    get visible() {
      return visible;
    },
    show(v: boolean) {
      visible = v;
      el.style.display = v ? 'block' : 'none';
    },
    update(x: number, z: number, yaw: number) {
      if (!visible) return;
      el.innerHTML = `<svg viewBox="-365 -170 580 470" width="100%" height="100%" role="img" aria-label="Map of Eagley roads and brook">${svgWater}${svgRoads}<circle cx="86" cy="16" r="6" fill="#e9dba8"/><text x="100" y="22" fill="#fff8dc" font-size="17">Bridge Mill</text><path d="M0 -9 L6 7 L0 4 L-6 7Z" fill="white" transform="translate(${x} ${z}) rotate(${180 - (yaw * 180) / Math.PI})"/><text x="-330" y="-126" fill="#e9dba8" font-size="18">N ↑</text></svg>`;
    },
  };
}

/** Numbered 3D flags for the user's location feedback notes. */
export function createReviewMarkers(
  scene: T.Scene,
  ground: (x: number, z: number) => number,
) {
  const group = new T.Group();
  scene.add(group);
  function clear() {
    group.traverse((o) => {
      const m = o as T.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material)
        for (const material of Array.isArray(m.material)
          ? m.material
          : [m.material]) {
          (material as T.MeshBasicMaterial).map?.dispose();
          material.dispose();
        }
    });
    group.clear();
  }
  function label(n: number) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#17342c';
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff4d0';
    ctx.font = 'bold 65px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), 64, 67);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map: texture, depthTest: false }),
    );
    sprite.position.y = 3.2;
    sprite.scale.set(0.85, 0.85, 1);
    return sprite;
  }
  return function set(flags: ReviewFlag[]) {
    clear();
    flags.forEach((f, i) => {
      const g = new T.Group();
      g.position.set(f.x, ground(f.x, f.z) + 0.05, f.z);
      const pole = new T.Mesh(
        new T.CylinderGeometry(0.025, 0.025, 2.8, 6),
        new T.MeshBasicMaterial({ color: '#fff0bd' }),
      );
      pole.position.y = 1.4;
      g.add(pole);
      const cloth = new T.Mesh(
        new T.PlaneGeometry(0.9, 0.5),
        new T.MeshBasicMaterial({ color: '#ed863c', side: T.DoubleSide }),
      );
      cloth.position.set(0.45, 2.5, 0);
      g.add(cloth);
      g.add(label(i + 1));
      group.add(g);
    });
  };
}

/** Optional engine drone; silent until the user unmutes. */
export function createEngineSound() {
  let audio: AudioContext | undefined,
    osc: OscillatorNode | undefined,
    gain: GainNode | undefined,
    muted = true;
  return {
    setMuted(m: boolean) {
      muted = m;
      if (!muted && !audio) {
        audio = new AudioContext();
        osc = audio.createOscillator();
        gain = audio.createGain();
        osc.type = 'triangle';
        gain.gain.value = 0.025;
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start();
      }
      if (audio) audio.resume();
      if (gain) gain.gain.value = muted ? 0 : 0.025;
    },
    update(mode: string, speed: number) {
      if (!osc || !gain) return;
      osc.frequency.value = mode === 'drive' ? 45 + Math.abs(speed) * 7 : 25;
      gain.gain.value = muted
        ? 0
        : mode === 'drive'
          ? 0.018 + Math.abs(speed) * 0.001
          : 0;
    },
    close() {
      audio?.close();
    },
  };
}
