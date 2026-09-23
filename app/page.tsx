'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Compass,
  Car,
  Footprints,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Map,
  X,
} from 'lucide-react';
import { ReviewFlags } from '@/components/review-flags';
import { WORLD_VERSION } from '@/lib/world-version';
import { Button } from '@/components/ui/button';
export default function Home() {
  const mount = useRef<HTMLDivElement>(null);
  const engine = useRef<any>(null);
  const [ready, setReady] = useState(false),
    [started, setStarted] = useState(false),
    [error, setError] = useState('');
  const [hud, setHud] = useState({
    height: 0,
    x: 0,
    z: 0,
    latitude: 53.6138,
    longitude: -2.428,
    speed: 0,
    mode: 'drive',
    road: 'Eagley Way',
    distance: 0,
    arrived: false,
    paused: false,
    nearCar: true,
  });
  const [muted, setMuted] = useState(true),
    [map, setMap] = useState(false),
    [help, setHelp] = useState(false);
  useEffect(() => {
    let gone = false;
    import('../lib/eagley-game')
      .then(async ({ createGame }) => {
        const game = await createGame(mount.current!, setHud);
        if (gone) {
          game.dispose();
          return;
        }
        engine.current = game;
        setReady(true);
      })
      .catch((e) => setError(e.message));
    return () => {
      gone = true;
      engine.current?.dispose();
    };
  }, []);
  const action = (name: string) => engine.current?.[name]?.();
  return (
    <main className="world">
      <div className="world-version" aria-label="World version">
        WORLD v{WORLD_VERSION}
      </div>
      <div
        ref={mount}
        className="scene"
        aria-label="Interactive 3D Eagley Valley game"
      />
      <header className="topbar">
        <div className="wordmark">
          <span className="crest">
            <Compass size={22} />
          </span>
          <div>
            EAGLEY<span>VALLEY EXPLORER</span>
          </div>
        </div>
        <div className="topright">
          <span className="edition">
            BOLTON, LANCASHIRE <i /> SURVEY TERRAIN
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle sound"
            onClick={() => {
              setMuted(!muted);
              engine.current?.sound(!muted);
            }}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fullscreen"
            onClick={() => action('fullscreen')}
          >
            <Maximize />
          </Button>
        </div>
      </header>
      {!started && (
        <section className="start-panel">
          <div className="eyebrow">
            <span /> A LOCAL JOURNEY
          </div>
          <h1>
            Down to
            <br />
            <em>the mills.</em>
          </h1>
          <p>
            Take the winding road into Eagley Valley.
            <br />
            Park by Bridge Mill. Explore on foot.
          </p>
          <div className="route-summary">
            <span>01</span> Eagley Way <ArrowUpRight size={16} />
            <span>02</span> Threadfold Way <ArrowUpRight size={16} />
            <span>03</span> Bridge Mill
          </div>
          <Button
            id="start-btn"
            className="start-button"
            disabled={!ready}
            onClick={() => {
              setStarted(true);
              action('start');
            }}
          >
            {error
              ? 'Unable to load the valley'
              : ready
                ? 'Start driving'
                : 'Preparing the valley…'}
            <ArrowUpRight size={20} />
          </Button>
          {error && (
            <p role="alert">
              {error}. Try reloading in a browser with WebGL enabled.
            </p>
          )}
          <div className="start-controls">
            <span>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> Drive
            </span>
            <span>
              <kbd>E</kbd> Get out
            </span>
            <span>
              <kbd>C</kbd> Camera
            </span>
          </div>
        </section>
      )}
      {started && (
        <>
          <div
            className="photo-reference"
            aria-label="Photo location reference"
            title="Your position in the world. Include this reference with a photo taken nearby."
          >
            <span>PHOTO REF</span>
            <strong>
              X {Math.round(hud.x)} · Z {Math.round(hud.z)}
            </strong>
            {hud.mode === 'bird' && (
              <small>
                {Math.round(hud.height)} m above ground · V overhead
              </small>
            )}
            <small>
              {hud.latitude.toFixed(5)}, {hud.longitude.toFixed(5)}
            </small>
          </div>
          <div className="bottom-bar">
            <div className="location">
              <span className="location-dot" />
              <div>
                <span>
                  {hud.mode === 'bird'
                    ? 'BIRD MODE'
                    : hud.mode === 'drive'
                      ? 'DRIVING THROUGH'
                      : 'EXPLORING ON FOOT'}
                </span>
                <strong>{hud.road}</strong>
              </div>
            </div>
            <div className="quick-controls">
              <Button
                variant="ghost"
                disabled={
                  hud.mode === 'bird' || (hud.mode === 'walk' && !hud.nearCar)
                }
                onClick={() => action('interact')}
              >
                {hud.mode === 'drive' ? (
                  <Footprints size={17} />
                ) : (
                  <Car size={17} />
                )}
                <kbd>E</kbd>
                {hud.mode === 'drive' ? 'Get out' : 'Enter car'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMap(!map);
                  engine.current?.setMap(!map);
                }}
              >
                <Map size={17} />
                Map
              </Button>
              <Button variant="ghost" onClick={() => action('bird')}>
                <kbd>B</kbd>
                {hud.mode === 'bird' ? 'Return to ground' : 'Bird mode'}
              </Button>
              {hud.mode === 'bird' && (
                <Button variant="ghost" onClick={() => action('overhead')}>
                  <kbd>V</kbd>Overhead
                </Button>
              )}
              <Button variant="ghost" onClick={() => setHelp(!help)}>
                ?
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Reset to Eagley Way"
                onClick={() => action('reset')}
              >
                <RotateCcw size={17} />
              </Button>
            </div>
            <div className="speed">
              <strong>{Math.round(hud.speed)}</strong>
              <span>
                {hud.mode === 'bird'
                  ? 'FLYING'
                  : hud.mode === 'drive'
                    ? 'MPH'
                    : 'ON FOOT'}
              </span>
            </div>
          </div>
          <div className="touch-controls">
            <Button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                engine.current?.key('ArrowLeft', true);
              }}
              onPointerCancel={() => engine.current?.key('ArrowLeft', false)}
              onPointerUp={() => engine.current?.key('ArrowLeft', false)}
            >
              ←
            </Button>
            <Button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                engine.current?.key('ArrowRight', true);
              }}
              onPointerCancel={() => engine.current?.key('ArrowRight', false)}
              onPointerUp={() => engine.current?.key('ArrowRight', false)}
            >
              →
            </Button>
            <Button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                engine.current?.key('ArrowDown', true);
              }}
              onPointerCancel={() => engine.current?.key('ArrowDown', false)}
              onPointerUp={() => engine.current?.key('ArrowDown', false)}
            >
              ↓
            </Button>
            <Button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                engine.current?.key('ArrowUp', true);
              }}
              onPointerCancel={() => engine.current?.key('ArrowUp', false)}
              onPointerUp={() => engine.current?.key('ArrowUp', false)}
            >
              ↑
            </Button>
          </div>
        </>
      )}
      {started && engine.current && <ReviewFlags engine={engine.current} />}
      {help && (
        <div className="help-panel">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close controls"
            onClick={() => setHelp(false)}
          >
            <X />
          </Button>
          <h2>Take your time.</h2>
          <p>
            WASD or arrows · Drive / walk
            <br />
            Space · Brake / fly up
            <br />Q · Fly down
            <br />V · Overhead / angled view in bird mode
            <br />B · Bird mode / return to saved position
            <br />E · Exit / enter a nearby car
            <br />C · Change camera
            <br />
            Drag the scene · Look around
            <br />
            Shift · Walk / fly faster
            <br />R · Return to start
            <br />F · Fullscreen
            <br />
            Escape · Pause
          </p>
          <p className="small">
            Roads, buildings and brook follow OpenStreetMap. Heights, surfaces
            and architectural details are approximated.
          </p>
        </div>
      )}
      {started && hud.paused && (
        <div className="pause-panel">
          <h2>Taking a breather.</h2>
          <Button onClick={() => action('resume')}>Continue exploring</Button>
        </div>
      )}
      <footer className="credits">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap contributors
        </a>
        <a href="/survey-sources.txt" target="_blank" rel="noreferrer">
          {' '}
          · Terrain © Environment Agency 2022 · Sources
        </a>
      </footer>
    </main>
  );
}
