# Brook Mill height and east front

Local v0.3.140, 6 October 2026. M14 east elevation and a whole-block height correction.

## Evidence

- `work/reference/brook-mill-front.jpg`: front-on east view, capture date unknown. Three bays each side of the stair tower; buff stone ground storey; red brick above with buff stripes every few courses; floors 2, 3 and 5 flat-headed and floor 4 round-headed; the tower has paired tall stair lights stepped half a storey, a wide three-light top-floor window, an open stage with corner pinnacles above the cornice, a clock stage and a pediment; ball finials at both cornice corners; two downpipes between the inner and middle bays. Ground floor: two windows and the pedimented porch on the south half, two round-arched windows in the tower, three windows on the north half.
- EA 2022 1m DSM minus DTM (`scripts/ea-raster.mjs`): parapet 38.4m (AOD-100) on the north and east edges, inner roof 40.7m, tower 46.2–46.7m; ground in front of the east face 15.5m; the game's datum is 15.69m. The main block is therefore about 22.7m to the parapet and the tower about 31m, against the model's 18.7m and 23m. The lower west wing's roof (about 10m) already matched and is unchanged.

## Model

- `brookUpper` in `lib/landmarks/brook-mill.ts` stretches the main block's upper storeys from 3.6m to about 4.55m, keeping the photographed 3.6m ground storey, so ground-level parts, the porch, the terrace and walking heights are untouched. It applies to the shell, north, south and east fronts and the roof. The lower west wing, west entrance gable, steps, terrace and fixtures are not stretched. `kit.transformed` provides the scoped remap.
- East front rebuilt from the photo schedule (`BROOK_EAST_BANDS`): bay centres ±5.15/7.95/10.75m, tower 6m wide, buff stripes 0.55m apart in the older frame (about 0.7m after stretching) broken only at windows, round-headed floor 4, paired stair lights, three-light top window, downpipes, cornice and parapet.
- `addBrookTowerTop` builds at true heights: open stage (2.3m) with a pierced band and corner pinnacles, clock stage (3.4m) with buff corner pilasters and bands, the east clock and existing south roundel, pediments on each face over a low pyramid roof, apex and corner finials, top about 30.9m. Corner finials stand on the front's parapet ends.

Positions are scaled from one photograph; sizes, stripe spacing, stage heights and finial shapes are interpreted. Storey heights are an even split of the DSM height, not measured floor levels. The north and south fronts keep their earlier schedules and only gain height. Concealed tower faces are inferred from the east and south faces.

## Validation

Build, TypeScript and oxlint pass. East, oblique, north, south, west and overhead views inspected at v0.3.140. Journey 55/55 with car switch, frontage walk and reset; Brook parking with reverse and exit; locations check; ride 46/46 with jerk 0.0196m and pitch step 0.26°, render 8.56–8.58ms. Colliders and ground heights are unchanged.
