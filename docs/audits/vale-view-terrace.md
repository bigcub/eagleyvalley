# Vale View older stone terrace

4 October 2026, local v0.3.105. Flag9d77d535-f252-474a-aa7a-909d27b4a6fc at X20.7 Z-98.5: "these are still unstyled". The older terrace is the remaining generic housing beside the flag. Bird-mode position marks the ground; the exported player heading does not establish which facade the camera showed.

## Evidence and limits

August 2022 Street View inspected from [TTJ3jDkACncqYtbPaqDTRQ, heading15](https://www.google.com/maps/@?api=1&map_action=pano&pano=TTJ3jDkACncqYtbPaqDTRQ&heading=15), 2HagKCMcwxoWPiMKjnxJMA headings330/35, My54pQbbQXB0bYCk59XQYw headings169/10 and PWYUl7JHrk11fjUKM1hdyA heading325. May 2012 panorama5bAOuuHMUJgzyFnZPFtqCw heading325 confirms the eastern roof/end context but does not expose the hidden lower fronts. Historical views do not establish current alterations. No imagery downloaded or distributed.

Mapped front assignment, west to east, is 361/363/364/366/365/367. IDs are OSM suffixes, not house numbers. Camera GPS, small mapped offsets and planting limit assignment certainty.

| ID suffix | Visible groups represented | Still concealed |
| --- | --- | --- |
| 361 | One white multi-pane upper group; separate roof/cornice profile. | Lower front and entry behind hedge. |
| 363 | One upper and one ground white multi-pane group with pale heads; burgundy entrance to their right. | Rear/return counts. |
| 364 | One upper dark-framed group with top lights; one tall ground group; pale grey entrance to its left. | Exact glazing divisions and rear. |
| 366 | One white upper and one white ground group; brown entrance to their right. | Rear and small concealed fittings. |
| 365 | One partly visible dark upper group. | Ground front and door. |
| 367 | One partly visible white ground group. | Independent upper/entry/end counts. |

Two-storey buff stone, low pitched slate roofs, pale stone lintels/sills and three identifiable chimney stacks replace generic repeated windows/roof volumes. Chimney positions and pot spacing are fitted estimates. The western end has a separate estimated hipped roof; middle/eastern fronts share one roof, with an estimated eastern hip. Mapped rear attachment362 receives stone walls and a provisional shallow slate cap. Concealed eastern/rear roof portions stay inside mapped footprints. Their pitches and joins are unresolved.

All opening centres, dimensions, glazing subdivisions, roof heights and front datum are estimates. Counts above come from visible groups, never wall length. No hidden opening schedule repeated. Front gardens, boundary ironwork/posts/gates, planting, threshold levels and rear/end elevations need their own connected pass. The flag remains open for user review.

Dedicated model `lib/landmarks/vale-view-terrace.ts`; IDs/front edges in `lib/world/layout.ts`. Existing mapped building colliders, road surfaces, terrain and movement heights retained. Shared procedural material and kit batching preserve normal resource cleanup. No reference image pixels used.

## Validation

Build, TypeScript, oxlint, format and whitespace pass. Full normal-input journey55/55, vehicle switching, frontage walking and reset pass. Vale View drive4/4 and walk8/8 reach every target with no browser errors. The drive's largest sampled height step is0.02319m. The walk crosses an existing verge transition near X1.8 Z-104.6, giving a0.19086m step; it is not evidence of a smooth pavement route. That road/grass join is queued separately.

Front, east, flag and roof views inspected at visible v0.3.105. Initial overhead capture exposed uncovered irregular rear strips, now capped provisionally within mapped footprints. Final roof, east/street and flag captures inspected after the cap correction. Bundled skill input screenshot and text state inspected at visible v0.3.105, with no error file. Both regression grids have identical ground, terrain and collision arrays. Material/geometry comparison reports the expected removed generic volumes and added terrace groups. Passing checks establish rendering and movement, not local accuracy.
