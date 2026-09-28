import * as T from 'three';
import { createKit } from './core/kit';
import { installDebugProbe } from './debug-probe';
import { createPlay, type Hud } from './game/play';
import { createReviewMarkers } from './game/overlays';
import type { ReviewFlag } from './review-flags';
import { modelContext, testHooks } from './game/hooks';
import { addBoundaries } from './world/boundaries';
import { addBuildings } from './world/buildings';
import { createCollision } from './world/collision';
import { loadWorldData } from './world/data';
import { addLand, addWater } from './world/land';
import { addRoads } from './world/roads';
import { createSurface } from './world/surface';
import { addStreetLights, addVegetation } from './world/vegetation';

// Builds the Eagley world into `host` and returns the controls used by the page.
export async function createGame(host: HTMLElement, onHud: (s: Hud) => void) {
  const data = await loadWorldData();

  const scene = new T.Scene();
  scene.background = new T.Color('#c9d5da');
  scene.fog = new T.FogExp2('#c9d5da', 0.0012);
  const renderer = new T.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  host.appendChild(renderer.domElement);
  const camera = new T.PerspectiveCamera(
    52,
    host.clientWidth / host.clientHeight,
    0.2,
    1700,
  );
  scene.add(new T.HemisphereLight('#e1f2f3', '#777a68', 1.65));
  // The sun and its shadow box follow the player once play starts.
  const sun = new T.DirectionalLight('#fff3df', 2.3);
  sun.position.set(-170, 240, 110);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -160,
    right: 160,
    top: 160,
    bottom: -160,
    near: 1,
    far: 600,
  });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.2;
  scene.add(sun, sun.target);

  // ---- World ----
  const surface = createSurface(data);
  const kit = createKit();
  addLand(scene, surface);
  const water = addWater(scene, kit, surface, data);
  addRoads(kit, surface, data);
  const buildingBounds = addBuildings(kit, surface, data);
  const { walls, plants } = addBoundaries(kit, surface, data);
  const collision = createCollision(surface, buildingBounds, walls);
  addVegetation(scene, kit, surface, data, plants, collision.hitBuilding);
  addStreetLights(kit, surface, data);
  const { asphalt, paint, paving, kerb, soil } = kit.m;
  kit.flush(scene, [asphalt, water.material, paint, paving, kerb, soil]);

  // ---- Play ----
  const play = createPlay({
    host,
    scene,
    camera,
    sun,
    canvas: renderer.domElement,
    kit,
    surface,
    data,
    canStand: collision.canStand,
    onHud,
  });
  const { state } = play;
  const setMarkers = createReviewMarkers(scene, surface.ground);
  let reviewFlags: ReviewFlag[] = [];

  function render() {
    renderer.render(scene, camera);
  }
  function step(dt: number) {
    play.step(dt);
    water.animate(state.time);
  }
  let manualTime = false,
    disposed = false,
    frame = 0,
    last = performance.now();
  function loop(now: number) {
    if (disposed) return;
    const dt = Math.min((now - last) / 1000, 0.04);
    last = now;
    if (!manualTime) step(dt);
    render();
    frame = requestAnimationFrame(loop);
  }
  function resize() {
    renderer.setSize(host.clientWidth, host.clientHeight);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  const lifecycle = new AbortController();
  const api = {
    reviewLock: play.reviewLock,
    reviewSpot: play.reviewSpot,
    setReviewFlags(flags: ReviewFlag[]) {
      reviewFlags = flags;
      setMarkers(flags);
    },
    start: play.start,
    interact: play.interact,
    bird: play.bird,
    overhead: play.overhead,
    reset: play.reset,
    resume: play.resume,
    sound: play.sound,
    fullscreen: play.fullscreen,
    key: play.key,
    setMap: (v: boolean) => play.toggleMap(v),
    dispose() {
      lifecycle.abort();
      disposed = true;
      cancelAnimationFrame(frame);
      play.dispose();
      window.removeEventListener('resize', resize);
      renderer.dispose();
      scene.traverse((o) => {
        if ((o as T.Mesh).geometry) (o as T.Mesh).geometry.dispose();
      });
      host.replaceChildren();
    },
  };

  // ---- Deterministic hooks for automated checks ----
  const w = testHooks();
  w.render_game_to_text = () =>
    JSON.stringify({
      coordinates: 'Metres; x east, z south; origin 53.6138,-2.428',
      reviewing: state.reviewing,
      reviewFlags: reviewFlags.map((f) => ({
        id: f.id,
        x: f.x,
        z: f.z,
        comment: f.comment,
      })),
      started: state.started,
      paused: state.paused,
      mode: state.mode,
      player: {
        ...state.player,
        y:
          state.mode === 'bird'
            ? state.flightY
            : surface.ground(state.player.x, state.player.z),
      },
      activeCar: state.active,
      cars: play.cars.map((c) => ({ id: c.id, x: c.x, z: c.z })),
      road: play.roadName(state.player.x, state.player.z),
      arrived: state.arrived,
      map: play.mapVisible,
      camera: state.camMode,
      lookPitch: state.lookPitch,
    });
  // Advancing time switches to manual stepping until reload.
  w.advanceTime = (ms: number, renderFrame = true) => {
    manualTime = true;
    for (let i = 0; i < Math.ceil(ms / 16.667); i++) step(1 / 60);
    if (renderFrame) render();
  };
  installDebugProbe({
    scene,
    camera,
    render,
    freeze: () => (manualTime = true),
    follow(x, z) {
      sun.target.position.set(x, surface.ground(x, z), z);
      sun.position.set(x - 170, 240, z + 110);
    },
    ground: surface.ground,
    terrain: surface.terrain,
    canStand: collision.canStand,
  });
  const context = modelContext();
  if (context?.registerTool) {
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'read_eagley_game',
            description:
              'Read the current player location, vehicle, road and journey state.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute(input: unknown) {
              if (
                !input ||
                typeof input !== 'object' ||
                Object.keys(input).length
              )
                throw Error('Expected an empty object');
              return JSON.parse(w.render_game_to_text!()) as unknown;
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
  }

  play.updateCamera(1);
  play.updateHud();
  render();
  frame = requestAnimationFrame(loop);
  return api;
}
