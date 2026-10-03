import * as T from 'three';
import { inPoly, nearest, segments } from '../core/geo';
import type { Kit } from '../core/kit';
import { brookParking } from '../landmarks/brook-mill-grounds';
import type { WorldData } from '../world/data';
import { WORLD_LIMITS } from '../world/layout';
import type { Surface } from '../world/surface';
import { carModel } from './vehicles';
import { createEngineSound, createMapOverlay } from './overlays';

export type Hud = {
  height: number;
  x: number;
  z: number;
  latitude: number;
  longitude: number;
  speed: number;
  mode: string;
  road: string;
  distance: number;
  arrived: boolean;
  paused: boolean;
  nearCar: boolean;
};
type Mode = 'drive' | 'walk' | 'bird';

// Player state machine: drive, walk and bird (free flight). Owns the cars,
// camera placement, HUD reporting and keyboard/pointer input.
export function createPlay(opts: {
  host: HTMLElement;
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  sun: T.DirectionalLight;
  canvas: HTMLCanvasElement;
  kit: Kit;
  surface: Surface;
  data: WorldData;
  canStand: (x: number, z: number, r: number) => boolean;
  onHud: (s: Hud) => void;
}) {
  const { host, scene, camera, sun, kit, surface, data, canStand, onHud } =
    opts;
  const { ground, terrain, roadSeg, court } = surface;
  const L = WORLD_LIMITS;

  // Start 12m into Eagley Way from Blackburn Road, in the left-hand lane.
  const first = data.roads.find((f) => f.name === 'Eagley Way')!;
  const a = first.points[0],
    b = first.points[1],
    angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const spawn = {
    x: a[0] + Math.sin(angle) * 12 + Math.cos(angle) * 1.3,
    z: a[1] + Math.cos(angle) * 12 - Math.sin(angle) * 1.3,
    yaw: angle,
  };
  // The two parked cars sit in the Bridge Mill court.
  const cars = [
    { ...spawn, color: '#426d61' },
    { x: 17.2, z: 26, yaw: Math.PI, color: '#b9ad89' },
    { x: 20, z: 26, yaw: Math.PI, color: '#934f39' },
  ].map((v, i) => {
    const model = carModel(kit, v.color);
    model.g.position.set(v.x, ground(v.x, v.z), v.z);
    model.g.rotation.y = v.yaw;
    scene.add(model.g);
    return { ...v, ...model, id: i };
  });

  const s = {
    player: { x: spawn.x, z: spawn.z, yaw: spawn.yaw, speed: 0 },
    active: 0,
    mode: 'drive' as Mode,
    started: false,
    paused: false,
    reviewing: false,
    camMode: 0,
    look: 0,
    lookPitch: 0,
    time: 0,
    arrived: false,
    flightY: 80,
  };
  let returnState: {
    player: typeof s.player;
    mode: Mode;
    look: number;
    pitch: number;
  } | null = null;
  const keys = new Set<string>();
  const map = createMapOverlay(host, data.roads, data.water);
  const sound = createEngineSound();
  const bridgeMill = segments([
    data.buildings.find((f) => f.name === 'Bridge Mill')!,
  ]);

  function roadName(x: number, z: number) {
    return nearest(x, z, roadSeg).s?.f.name;
  }
  function updateHud() {
    const { player, mode } = s;
    const dest = nearest(player.x, player.z, bridgeMill).d;
    s.arrived = s.arrived || (mode === 'walk' && dest < 8);
    onHud({
      height: mode === 'bird' ? s.flightY - ground(player.x, player.z) : 0,
      x: player.x,
      z: player.z,
      latitude: 53.6138 - player.z / 111320,
      longitude:
        -2.428 + player.x / (111320 * Math.cos((53.6138 * Math.PI) / 180)),
      speed: Math.abs(player.speed) * 2.23694,
      mode,
      road:
        dest < 14
          ? 'Bridge Mill'
          : roadName(player.x, player.z) || 'Bridge Mill approach',
      distance: Math.round(dest),
      arrived: s.arrived,
      paused: s.paused,
      nearCar: cars.some((c) => Math.hypot(c.x - player.x, c.z - player.z) < 4),
    });
    map.update(player.x, player.z, player.yaw);
  }

  function updateCamera(dt: number) {
    const { player, mode, camMode, look, lookPitch } = s;
    cars.forEach(
      (c) =>
        (c.g.visible = !(
          s.started &&
          mode === 'drive' &&
          camMode === 2 &&
          c.id === s.active
        )),
    );
    let target: T.Vector3, position: T.Vector3;
    if (!s.started) {
      // Title screen: slow orbit over the valley.
      const t = s.time * 0.016;
      position = new T.Vector3(
        175 + Math.sin(t) * 12,
        115,
        153 + Math.cos(t) * 9,
      );
      target = new T.Vector3(15, terrain(15, -48) + 8, -48);
    } else {
      const y = ground(player.x, player.z),
        heading = player.yaw + look;
      if (mode === 'bird') {
        position = new T.Vector3(player.x, s.flightY, player.z);
        target = new T.Vector3(
          player.x +
            Math.sin(heading) * Math.max(0.001, Math.cos(lookPitch)) * 20,
          s.flightY + Math.sin(lookPitch) * 20,
          player.z +
            Math.cos(heading) * Math.max(0.001, Math.cos(lookPitch)) * 20,
        );
      } else if (mode === 'walk') {
        position = new T.Vector3(player.x, y + 1.72, player.z);
        target = new T.Vector3(
          player.x + Math.sin(heading) * 20,
          y + 1.72 + lookPitch * 15,
          player.z + Math.cos(heading) * 20,
        );
      } else if (camMode === 2) {
        // Driver's seat.
        position = new T.Vector3(
          player.x + Math.sin(heading) * 0.7,
          y + 1.7,
          player.z + Math.cos(heading) * 0.7,
        );
        target = new T.Vector3(
          player.x + Math.sin(heading) * 25,
          y + 1.5 + lookPitch * 15,
          player.z + Math.cos(heading) * 25,
        );
      } else {
        // Chase camera, near (0) or high (1).
        const d = camMode === 1 ? 16 : 9;
        position = new T.Vector3(
          player.x - Math.sin(heading) * d,
          y + (camMode === 1 ? 8 : 4.4) + lookPitch * 5,
          player.z - Math.cos(heading) * d,
        );
        position.y = Math.max(position.y, ground(position.x, position.z) + 1.5);
        target = new T.Vector3(
          player.x + Math.sin(player.yaw) * 6,
          y + 1.3,
          player.z + Math.cos(player.yaw) * 6,
        );
      }
    }
    camera.position.lerp(position, Math.min(1, dt * 7));
    camera.lookAt(target);
    if (s.started) {
      sun.target.position.set(player.x, ground(player.x, player.z), player.z);
      sun.position.set(player.x - 170, 240, player.z + 110);
    }
  }

  function syncCar() {
    if (s.mode !== 'drive') return;
    const { player } = s;
    const c = cars[s.active];
    c.x = player.x;
    c.z = player.z;
    c.yaw = player.yaw;
    c.g.position.set(player.x, ground(player.x, player.z), player.z);
    c.g.rotation.set(0, player.yaw, 0);
    // Pitch the body to the slope between front and rear axles.
    const front = ground(
        player.x + Math.sin(player.yaw) * 1.5,
        player.z + Math.cos(player.yaw) * 1.5,
      ),
      back = ground(
        player.x - Math.sin(player.yaw) * 1.5,
        player.z - Math.cos(player.yaw) * 1.5,
      );
    c.g.rotateX(-Math.atan2(front - back, 3));
    c.wheels.forEach((w) => (w.rotation.x += player.speed * 0.015));
  }

  function overhead() {
    if (s.mode !== 'bird') return;
    s.lookPitch = s.lookPitch < -1.4 ? -0.6 : -Math.PI / 2;
    updateCamera(1);
    updateHud();
  }
  function bird() {
    if (!s.started || s.paused) return;
    if (s.mode === 'bird' && returnState) {
      s.player = { ...returnState.player, speed: 0 };
      s.mode = returnState.mode;
      s.look = returnState.look;
      s.lookPitch = returnState.pitch;
      returnState = null;
    } else {
      returnState = {
        player: { ...s.player },
        mode: s.mode,
        look: s.look,
        pitch: s.lookPitch,
      };
      s.player.speed = 0;
      s.flightY = ground(s.player.x, s.player.z) + 45;
      s.mode = 'bird';
      s.look = 0;
      s.lookPitch = -0.6;
    }
    keys.clear();
    updateCamera(1);
    updateHud();
  }
  function reset() {
    returnState = null;
    keys.clear();
    s.active = 0;
    s.mode = 'drive';
    s.player = { ...spawn, speed: 0 };
    cars[0].x = spawn.x;
    cars[0].z = spawn.z;
    cars[0].yaw = spawn.yaw;
    s.look = 0;
    s.lookPitch = 0;
    s.arrived = false;
    s.paused = false;
    syncCar();
    updateHud();
    updateCamera(1);
  }
  /** E: get out beside the car, or get into the nearest car within 4m. */
  function interact() {
    if (!s.started || s.mode === 'bird') return;
    const { player } = s;
    if (s.mode === 'drive') {
      if (Math.abs(player.speed) > 1.2) return;
      for (const side of [1, -1, 2, -2]) {
        const x = player.x + Math.cos(player.yaw) * 2.15 * side,
          z = player.z - Math.sin(player.yaw) * 2.15 * side;
        if (canStand(x, z, 0.35)) {
          s.mode = 'walk';
          s.player = { x, z, yaw: player.yaw, speed: 0 };
          break;
        }
      }
    } else {
      const c = [...cars]
        .sort(
          (a, b) =>
            Math.hypot(a.x - player.x, a.z - player.z) -
            Math.hypot(b.x - player.x, b.z - player.z),
        )
        .find((c) => Math.hypot(c.x - player.x, c.z - player.z) < 4);
      if (c) {
        s.active = c.id;
        s.mode = 'drive';
        s.player = { x: c.x, z: c.z, yaw: c.yaw, speed: 0 };
      }
    }
    s.look = 0;
    updateHud();
  }

  const held = (...codes: string[]) => (codes.some((c) => keys.has(c)) ? 1 : 0);
  let hudTime = 0;
  function step(dt: number) {
    s.time += dt;
    if (s.started && !s.paused && !s.reviewing) {
      const gas = held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown'),
        steer = held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft'),
        shift = keys.has('ShiftLeft');
      const p = s.player;
      if (s.mode === 'bird') {
        p.yaw -= steer * 1.5 * dt;
        p.speed = gas * (shift ? 100 : 35);
        p.x = T.MathUtils.clamp(
          p.x + Math.sin(p.yaw) * p.speed * dt,
          L.x0,
          L.x1,
        );
        p.z = T.MathUtils.clamp(
          p.z + Math.cos(p.yaw) * p.speed * dt,
          L.z0,
          L.z1,
        );
        const rise = held('Space') - held('KeyQ');
        s.flightY = T.MathUtils.clamp(
          s.flightY + rise * (shift ? 65 : 25) * dt,
          ground(p.x, p.z) + 3,
          260,
        );
      } else if (s.mode === 'drive') {
        // Off-road (more than 6m from a mapped way, outside the car parks) caps speed.
        const off =
          nearest(p.x, p.z, roadSeg).d > 6 &&
          !inPoly(p.x, p.z, court) &&
          !inPoly(p.x, p.z, brookParking);
        p.speed += gas * 6.5 * dt;
        p.speed *= Math.exp(-(gas ? 0.14 : 1.0) * dt);
        if (keys.has('Space')) p.speed *= Math.exp(-8 * dt);
        p.speed = T.MathUtils.clamp(p.speed, -5, off ? 6 : 17);
        p.yaw -=
          steer * p.speed * (0.22 / (1 + Math.abs(p.speed) * 0.055)) * dt;
        const x = p.x + Math.sin(p.yaw) * p.speed * dt,
          z = p.z + Math.cos(p.yaw) * p.speed * dt;
        const hitCar = cars.some(
          (c) => c.id !== s.active && Math.hypot(c.x - x, c.z - z) < 2.3,
        );
        if (canStand(x, z, 1.0) && !hitCar) {
          p.x = x;
          p.z = z;
        } else p.speed *= -0.12;
        syncCar();
      } else {
        p.yaw -= steer * 1.8 * dt;
        p.speed = gas * (shift ? 4.2 : 2.3);
        const x = p.x + Math.sin(p.yaw) * p.speed * dt,
          z = p.z + Math.cos(p.yaw) * p.speed * dt;
        if (canStand(x, z, 0.35)) {
          p.x = x;
          p.z = z;
        }
      }
      sound.update(s.mode, p.speed);
    }
    updateCamera(dt);
    hudTime += dt;
    if (hudTime > 0.15) {
      hudTime = 0;
      updateHud();
    }
  }

  // ---- Input ----
  let dragging = false,
    px = 0,
    py = 0;
  function toggleMap(v = !map.visible) {
    map.show(v);
    map.update(s.player.x, s.player.z, s.player.yaw);
  }
  function fullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else host.parentElement?.requestFullscreen().catch(() => {});
  }
  function onKey(e: KeyboardEvent) {
    if (
      s.reviewing ||
      (e.target as HTMLElement)?.closest?.(
        'input,textarea,select,[contenteditable=true]',
      )
    ) {
      keys.delete(e.code);
      return;
    }
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(
        e.code,
      )
    )
      e.preventDefault();
    if (e.type === 'keyup') {
      keys.delete(e.code);
      return;
    }
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'KeyB') bird();
    if (e.code === 'KeyV') overhead();
    if (e.code === 'KeyE') interact();
    if (e.code === 'KeyC') {
      s.camMode = (s.camMode + 1) % 3;
      s.look = 0;
      s.lookPitch = 0;
    }
    if (e.code === 'KeyR') reset();
    if (e.code === 'KeyF') fullscreen();
    if (e.code === 'Escape') {
      s.paused = !s.paused;
      keys.clear();
      updateHud();
    }
    if (e.code === 'KeyM') toggleMap();
  }
  function down(e: PointerEvent) {
    if (s.reviewing) return;
    dragging = true;
    px = e.clientX;
    py = e.clientY;
    opts.canvas.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    const delta = (e.clientX - px) * 0.005;
    if (s.mode === 'walk' || s.mode === 'bird') s.player.yaw -= delta;
    else s.look -= delta;
    s.lookPitch = T.MathUtils.clamp(
      s.lookPitch - (e.clientY - py) * 0.004,
      s.mode === 'bird' ? -Math.PI / 2 : -0.6,
      s.mode === 'bird' ? 1.2 : 0.7,
    );
    px = e.clientX;
    py = e.clientY;
  }
  function up() {
    dragging = false;
  }
  function blur() {
    keys.clear();
    if (s.started) {
      s.paused = true;
      updateHud();
    }
  }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('blur', blur);
  opts.canvas.addEventListener('pointerdown', down);
  opts.canvas.addEventListener('pointermove', move);
  opts.canvas.addEventListener('pointerup', up);
  opts.canvas.addEventListener('pointercancel', up);

  return {
    state: s,
    cars,
    step,
    updateCamera,
    updateHud,
    interact,
    bird,
    overhead,
    reset,
    fullscreen,
    toggleMap,
    get mapVisible() {
      return map.visible;
    },
    sound: (m: boolean) => sound.setMuted(m),
    key: (code: string, down: boolean) => {
      if (down) keys.add(code);
      else keys.delete(code);
    },
    start: () => {
      s.started = true;
      s.paused = false;
      reset();
      updateCamera(1);
    },
    resume: () => {
      s.paused = false;
      keys.clear();
      updateHud();
    },
    reviewLock: (v: boolean) => {
      s.reviewing = v;
      keys.clear();
      dragging = false;
    },
    reviewSpot: () => {
      const { player, mode } = s;
      return {
        x: player.x,
        z: player.z,
        y: ground(player.x, player.z),
        heading:
          (((((player.yaw + s.look) * 180) / Math.PI) % 360) + 360) % 360,
        mode,
        road: roadName(player.x, player.z) || 'Off road',
      };
    },
    roadName,
    dispose() {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', blur);
      sound.close();
    },
  };
}
export type Play = ReturnType<typeof createPlay>;
