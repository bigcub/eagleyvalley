# Eagley Valley

A browser driving, walking and flying prototype of Eagley, Bolton. The route starts at Blackburn Road/Eagley Way, follows the valley around Threadfold Way, and reaches Bridge Mill's car park and cobbled passage.

**Current world: v0.3.40.** Playable, but geographically unfinished. The user has rejected the current Hough Lane junction and several walls, car parks and planting areas. Passing gameplay checks does not establish accuracy.

## Run locally

Requires Node.js22.13 or newer and npm. Python3 is used only for the static preview below. No API keys are needed to play.

```sh
npm ci
npm run build
npm run typecheck
npm run preview
```

Open http://localhost:3000. `preview` serves `dist/client`; rebuild after source changes. `npm run dev` is available for development. `npm start` is the legacy Wrangler preview and is not the preferred static preview.

## Controls

| Action | Control |
| --- | --- |
| Drive/walk/fly and turn | WASD or arrow keys |
| Brake | Space while driving |
| Get out / enter nearby car | E |
| Bird mode / return | B |
| Fly up / down | Space / Q |
| Faster walk or flight | Shift |
| Look around | Drag mouse |
| Bird overhead view | V |
| Camera / map / reset | C / M / R |
| Pause / fullscreen | Escape / F |

Use **Flag this spot** to add a comment, then **Export notes** to copy all feedback into the project conversation. Notes are local to that browser and origin, stored under `eagley-review-flags-v1`. They are not automatically uploaded or included in Git. Export before changing browser or host.

## Project handover

Read these in order:

1. [AGENTS.md](AGENTS.md): working rules and user corrections.
2. [Current context](docs/CONTEXT.md): current state, priorities and known failures.
3. [Street View status](docs/STREETVIEW_STATUS.md): exact audit coverage and where to resume.
4. [Plan](docs/PLAN.md): ordered work and acceptance criteria.
5. [TODO.md](TODO.md): detailed backlog and original coordinate-linked feedback.

[SURVEY.md](SURVEY.md) records inspected panoramas. [Earlier mill audit](docs/street-view-audit.md) is historical evidence. [progress.md](progress.md) is the chronological log, including superseded interpretations. [Source attribution](public/survey-sources.txt) records map, terrain and visual references.

## Code and data

React19, TypeScript, Three.js and Vinext/Vite. `lib/eagley-game.ts` assembles terrain, roads, buildings, collision and gameplay. Named model modules in `lib/` implement individual landmarks. `app/page.tsx` and `components/review-flags.tsx` provide the interface.

- `public/eagley-map.json`: mapped roads, water and footprints.
- `public/eagley-terrain.bin`: little-endian unsigned16 elevations in centimetres above100m AOD.
- `public/eagley-survey.json`: grid origin/step/dimensions and inferred canopy locations.
- Coordinates: metres, X east/Z south, origin53.6138,-2.428. Y is metres above100m AOD.

## Validation

With the static preview running:

```sh
npx playwright install chromium
npm run test:journey
npm run test:locations
npm run test:hough
```

These checked-in scripts use normal inputs and the deterministic game hooks. They write ignored artifacts under `outputs/`. macOS uses the existing Metal launch flags; other platforms use Playwright defaults and have not yet been verified. Set `GAME_URL` to test a different local port. All three scripts fail on browser errors; the journey also asserts route completion, car switching and frontage arrival. Inspect screenshots, not just exit codes.

Older research and screenshots remain in the original workspace's sibling `work/`, outside Git. Future agents must not depend on it. User photographs are reference-only and are not packaged as assets.

## Publication and rights

GitHub is a private source backup. **Sites deployment remains paused** until the user explicitly resumes it. Publishing this repository does not authorize a deployment. `.openai/hosting.json` is existing Sites project metadata, not a credential.

Retain OpenStreetMap and Environment Agency attribution. Google Street View and user photos are visual references, not redistributable game textures. No software licence has been selected; do not assume permission for public distribution of code or reference material.
