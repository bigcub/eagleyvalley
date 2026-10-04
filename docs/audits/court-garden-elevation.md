# Modern Bridge Mill garden elevation and fences

3 October 2026. M16b / PA14, local v0.3.85; fence material follow-up, v0.3.86. User acceptance remains open.

## Evidence

UP-003 is the user's oblique photograph looking south-west from north-east of the modern block. The original attachment was found in the local temporary directory and inspected again. No photograph or cropped reference is included in the game or committed. The modern block is distinct from old Bridge Mill to the left.

The garden face has three homes with three opening groups on each of three storeys. Each home has two tall paired groups and one narrow light. This count comes from the photograph, independently of wall length and the garage-facing entrance schedule. Dark Juliet rails cross the paired groups on the upper two rows. The ground paired groups reach patio level and include glazed garden doors; the photograph does not establish which individual leaves open.

## Opening schedule

Local u runs west to east along the 23.6m modelled block. The photograph shows its east end nearest the camera. Positions and dimensions are fitted estimates.

| Home        | Ground row                           | Middle row                                 | Top row                                    | Estimated local centres |
| ----------- | ------------------------------------ | ------------------------------------------ | ------------------------------------------ | ----------------------- |
| West / far  | Narrow light, two tall glazed groups | Narrow light, two paired groups with rails | Narrow light, two paired groups with rails | 0.85, 3.1, 5.65m        |
| Middle      | Two tall glazed groups, narrow light | Two paired groups with rails, narrow light | Two paired groups with rails, narrow light | 9.4, 11.95, 14.35m      |
| East / near | Two tall glazed groups, narrow light | Two paired groups with rails, narrow light | Two paired groups with rails, narrow light | 17.25, 19.8, 22.25m     |

There are nine groups per row, twenty-seven in total. Six ground groups are represented with a glazed-door composition. Twelve shallow Juliet rails serve the paired upper groups. White frame divisions, sills, lintels and four downpipes are fitted interpretations. Heights of 2.06–2.25m and widths of 1.45m for paired groups, 0.55m for narrow lights, are estimates. Detailed glazing divisions, exact sill levels and present-day alterations need closer evidence.

The three storeys, continuous roof, buff stone, garage-side door bridges, east-end well, patios, boundaries and movement surfaces retain their existing geometry.

## Fence material

UP-003 supports vertical close boarding on the patio screens and lower garden fences. v0.3.86 replaces the flat brown panel material with generated board joints, varied weathering, vertical grain and faint knots. Each board is represented at an estimated 0.12m width. Grain, colour and bump relief are representative, not copied from reference pixels or measured. The material is shared through the kit and its texture follows existing GPU cleanup. No fence location, height or collision changes.

## Checks and remaining work

v0.3.85 build, TypeScript, oxlint and whitespace checks pass. Full normal-input journey reaches 55/55 targets, car switching, frontage walking and reset pass. Three garden viewpoints were captured; the oblique and patio-close screenshots were inspected. Regression against v0.3.84 reports expected material/geometry changes and identical ground, terrain and collision samples, with no browser errors. Visible built version checked as v0.3.85.

v0.3.86 build, TypeScript, oxlint and whitespace pass. Final full journey, car switch/frontage/reset, garden walk 66/66, court parking/reverse/ramp and entrance walk 12/12, all three flagged locations and Hough drive/bridge/crossing checks pass without browser errors. Garden walk max height step is 0.07848m; court walk 0.02524m, unchanged. Both fence faces and the game-skill gameplay screenshot were inspected, with visible WORLD v0.3.86. Regression against v0.3.85 changes only the fence material group; vertex counts/position sums and ground/terrain/collision samples are identical. Ride 46/46 retains route maximum jerk 0.0196m and pitch step 0.26 degrees, Hough 0.0074m/0.16 degrees. The isolated ride run reports mean step/render CPU 0.206/5.746ms and load 4300ms. These are single-run measurements, not a performance guarantee.

The unphotographed west boundary, shared-strip planting, exact opening/frame dimensions and user review remain open. Old mill garden interiors are a separate job. These checks establish operation and the model's opening count, not surveyed accuracy.
