# Eagley Valley

A browser prototype for driving, walking and flying around Eagley, Bolton. The route starts at Blackburn Road/Eagley Way, runs down the valley and round Threadfold Way, and ends at Bridge Mill's car park and cobbled passage.

**World v0.3.40.** Playable, but geographically unfinished. The user has rejected the Hough Lane junction and several walls, car parks and planting areas. Passing the tests doesn't mean it's accurate.

## Run locally

Needs Node.js 22.13 or newer, npm, and Python 3 for the static preview. No API keys.

```sh
npm ci
npm run build
npm run preview
```

Open http://localhost:3000. The preview serves `dist/client`, so rebuild after source changes. `npm run dev` also works for development. `npm start` is the old Wrangler preview; don't use it.

## Controls

| Action | Control |
| --- | --- |
| Drive, walk, fly and turn | WASD or arrow keys |
| Brake | Space while driving |
| Get out, or get into a nearby car | E |
| Bird mode on and off | B |
| Fly up and down | Space and Q |
| Walk or fly faster | Shift |
| Look around | Drag |
| Bird's-eye overhead view | V |
| Camera, map, reset | C, M, R |
| Pause, fullscreen | Escape, F |

**Flag this spot** saves a comment at your position, and **Export notes** copies every note as text to paste into the project conversation. Notes live in that browser only, under `eagley-review-flags-v1`. Export them before switching browser or host.

## Project docs

- [AGENTS.md](AGENTS.md): working rules, confirmed user corrections, code layout, validation.
- [docs/STATUS.md](docs/STATUS.md): current state, rejected areas, next steps, Street View coverage.
- [TODO.md](TODO.md): open backlog, including the user's location flags.
- [SURVEY.md](SURVEY.md): every inspected panorama.
- [progress.md](progress.md): one line per world version.
- [public/survey-sources.txt](public/survey-sources.txt): map, terrain and visual sources, with limits.

## Code

TypeScript, React 19, Three.js, Vinext (Vite) static export. `lib/eagley-game.ts` builds the scene from `lib/world/` (data, ground heights, roads, buildings, boundaries, vegetation, collision) and runs the game from `lib/game/`. Distinctive buildings and places each have a module in `lib/landmarks/`. AGENTS.md has the full map.

Data in `public/`:

- `eagley-map.json`: OpenStreetMap roads, water and building footprints.
- `eagley-terrain.bin`: little-endian uint16 elevations, centimetres above 100m AOD.
- `eagley-survey.json`: terrain grid origin, step and size, plus inferred canopy peaks.

Coordinates are metres, x east, z south, origin 53.6138, -2.428. Height is metres above 100m AOD.

## Tests

With the preview running:

```sh
npx playwright install chromium
npm run test:journey
npm run test:locations
npm run test:hough
node scripts/regress.mjs capture <label>
node scripts/regress.mjs compare <a> <b>
```

The first three drive and walk with normal inputs and fail on browser errors. The journey test also fails if the route, car switch or frontage arrival doesn't complete. The regression script proves a refactor left the world unchanged. Outputs go to `outputs/`, which Git ignores. macOS runs use Metal flags; other platforms use Playwright defaults and haven't been tried. Set `GAME_URL` for another port.

## Publishing and rights

GitHub is a private source backup. Sites deployment is paused until the user resumes it; the live site is v0.3.3. `.openai/hosting.json` is Sites project metadata, not a credential.

Keep the OpenStreetMap and Environment Agency attribution. Google Street View and the user's photos are references only, never game textures. There is no software licence yet, so don't assume the code or references can be distributed publicly.
