# Progress

One entry per world version, newest first. Add a line for every user-visible change, plus what you checked. The full earlier log, with validation details, is in Git history up to commit 83b7520.

## Unreleased (no world change)

- 23 September 2026. Engine restructure. `lib/eagley-game.ts` went from 3,100 lines to a 230-line orchestrator over `lib/core`, `lib/world`, `lib/game` and `lib/landmarks`. Ground heights live in one module as named zones, landmarks share a kit, and OSM IDs have names. `lib/`, `app/` and the review component pass oxlint. Added `scripts/regress.mjs`. Checked: the regression capture is identical to v0.3.40 (geometry per material, about 160,000 ground, terrain and collision samples, twelve fixed views). Journey, locations and Hough tests pass with the same final walk position (X92.877, Z23.809) and footbridge height steps (0.095m). The flag dialog opens and closes, and storage is untouched. Docs cut down to AGENTS.md, docs/STATUS.md, TODO.md, SURVEY.md and this file.

## World versions

- **v0.3.41** (28 Sep). v0.4.0 road network reverted (car rocked, slower). Hough Lane / Threadfold Way junction rebuilt locally instead: one asphalt surface over the junction mouth, kerbs with a face and 1.1m pavements following filleted corners, paved island by the footbridge, five bollards between stone posts with dropped kerbs, four tapered posts on the Eagley Hall lane, guardrail and heritage lamp; west parapet return moved behind the pavement. The junction road is one smooth fitted plane blending into each approach over 7 to 14m. All double yellow lines and the junction's road signs removed. Checked with the new `npm run test:ride`: through the junction the worst height jolt fell from 0.190 to 0.007 and the worst pitch change per frame from 3.66 to 0.16 degrees; whole route worst 0.032 (was 0.190). Journey 55/55 with unchanged frontage position, car switch, locations, Hough walk both ways (largest step 0.066m). Ground changes confined to x137 to 160, z-40 to -9. Load CPU time indistinguishable from v0.3.40.

- **v0.3.40** (19 Sep). Bridge Mill rear: paired French doors with transoms, sashes, lanterns, flag patios and timber dividers with collision, from IMG_8274. Plot widths estimated.
- **v0.3.39** (19 Sep). Merged the Claude branch: dedicated Eagley Hall stone model and brick block; generic buildings get one road-facing door instead of doors on every wall.
- **v0.3.38** (19 Sep). Separated the 3.8m road bridge from the footbridge, joined approach levels, dropped kerbs. Added `npm run test:hough`.
- **v0.3.37** (19 Sep). Footbridge metal rails, shared bridge datum, junction pavement lobes.
- **v0.3.31 to v0.3.36** (14 to 18 Sep). Hough gate and junction passes: connected the frontage wall, added the separate passage gate, three bollards, stone posts, railing and 30mph pair, then revised the bollard angle. User still rejects the junction.
- **v0.3.30** (13 Sep). Acted on the first five flags: fixed the pale road strips and the Blackburn wall, first turning circle pass.
- **v0.3.29** (13 Sep). Location feedback flags with export.
- **v0.3.22 to v0.3.28** (12 to 13 Sep). Street View register EAG-001 to 026. Upper Eagley Way barriers, mesh, retaining wall, ivy and ferns; Eagley Way plate moved onto the gatehouse.
- **v0.3.21** (11 Sep). Pavement and kerb clipping at junctions, canopy and bark detail, grass texture, slate on landmark roofs.
- **v0.3.19, v0.3.20** (11 Sep). Bird mode, overhead view, height readout, soft parking edges.
- **v0.3.14 to v0.3.18** (11 Sep). Garage approach edge, Brook parking planting and boundaries, Bridge court north edge.
- **v0.3.12, v0.3.13** (11 Sep). World-scale masonry UVs, slate roof courses, passage trellis and pots.
- **v0.3.9 to v0.3.11** (10 to 11 Sep). Riverside path at X24 Z-4 with gravel, mesh fence and gate; Brook Mill south terrace; court-house rear glazing fix.
- **v0.3.8** (10 Sep). User correction: Bridge Mill east end blank, west windows restored.
- **v0.3.6, v0.3.7** (10 Sep). Brook Mill tower circular glazing and south facade.
- **v0.3.4, v0.3.5** (10 Sep). Objective card removed, finer topiary, transverse sett courses and moss, door 3 transom. Sites publishing paused from here.
- **v0.3.3** (10 Sep). Varied passage setts and rubble courses. This is the live Sites version.
- **v0.3.0 to v0.3.2** (9 to 10 Sep). Brook Mill north front, roof, stair tower, porch and west parking; one retaining wall for road and passage.
- **v0.2.5 to v0.2.9** (9 Sep). Mill roadside wall, curved Hough gate returns, gate approach paving, Brook Mill upper windows.
- **v0.2.0 to v0.2.4** (8 Sep). World version display, gatehouse model and datum, branched roadside shrubs, angled passage wall, side gate, three-storey court houses, court terrain.
- **Before v0.2** (5 to 7 Sep). OSM map and EA 2022 terrain, first Street View pass, Bridge Mill south frontage from photos, engine house, rear stone correction, gardens, School House, photo coordinate readout.
