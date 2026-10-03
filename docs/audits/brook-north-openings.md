# Brook Mill north opening schedule

Inspected 3 October 2026. Modelled/tested locally in v0.3.56, M11. User acceptance remains open.

Reference panoramas: June 2024 `xaYuynMv3Cyx3otNuvArCA` and May 2012 `iUgZFJv6UI8UDo-D-x9qKg`, 113 Threadfold Way. May 2012 headings 155, 191 and 225 give east, middle and west oblique views. The older image exposes more of the base behind planting. These are reference only; no imagery is included in the app.

The long north face has five main rows. The eastern end is a glazed loading stack with a broad stone portal at the bottom, rather than a balcony stack. The visible ordinary glazed bays have three columns. The penultimate row has shallow segmental brick heads; the top row has flat heads. Balcony recesses alternate with ordinary glazed stacks across the visible middle. Dimensions and relative positioning are interpreted.

| Main row, bottom upwards | Western four positions | Middle/eastern nine positions | East end |
| --- | --- | --- | --- |
| 0, stone base | Obscured, provisional alternating arrangement | Alternating glazed/recessed openings, base partly obscured by planting | Glazed loading opening, stone portal |
| 1 | Provisional | Alternating glazed windows/balconies, flat heads | Glazed loading stack |
| 2 | Provisional | Alternating glazed windows/balconies, flat heads | Glazed loading stack |
| 3 | Provisional | Alternating glazed windows/balconies, segmental heads | Glazed loading stack |
| 4 | Provisional | Alternating glazed windows/balconies, flat heads | Glazed loading stack |

The 14 structural positions retain the historic schedule in Historic England listing 1388079. This does not establish every current opening. `BROOK_NORTH.openings` records each position explicitly and labels the obscured western positions provisional. Five rows reuse this stack arrangement; hidden variations remain unresolved. Window positions are not calculated from wall length. Bay centres, widths, storey heights, reveals and portal dimensions are estimates.

Open follow-ups: northern lower gabled return visible at the western end, its relationship to the lower west wing; basement grilles and actual sunken levels; balcony door frame divisions; loading surround inscription and exact profile; concealed windows and planting. No invented text, stairs or basement excavation added.

Validation: build, TypeScript and oxlint pass. Full normal-input journey, car switch, frontage walk/reset, parking drive 54/54 with reverse/exit and west entrance walk 27/27 pass. Inspected two north oblique screenshots and skill-client gameplay screenshot, visible v0.3.56; no browser errors. Regression ground/terrain unchanged. Collision differences are confined to the loading portal projection. Portal collision footprint registered. This is a bounded correction, not a completed measured survey.

M11b v0.3.74: June 2024 xaYuynMv3Cyx3otNuvArCA headings 191/155 and May 2012 iUgZFJv6UI8UDo-D-x9qKg heading 155 rechecked 3 October 2026. Thin rough stone courses cross the brick piers/reveals between heavier floor bands. Eight represented courses, heights 4.75/5.9/8.35/9.5/11.95/13.1/15.55/16.7m above datum and thickness 0.16m interpreted. Western continuation partly concealed and provisional. Existing opening schedule retained. No imagery distributed. Ground/terrain/collision unchanged; build/type/lint, full journey and final north/skill views pass.
M11c audit started: May 2012 north heading 225 shows a lower western gabled return, slate roof, finial, arched opening, brick/stone courses and stone base. Roof depth, relationship to the modelled west wing, hidden side openings and threshold/ground levels remain unresolved. No new volume or basement excavation inferred in this pass.


M11c v0.3.75: May 2012 north panorama iUgZFJv6UI8UDo-D-x9qKg headings 225/235 and June 2024 entrance panorama 2KUSm8cfYQCSi6Fy7CH-YA heading 125 inspected. A tall stone-framed arch belongs to the north end of the existing lower west wing. Replaced its monopitch with two slate slopes, retained three west rooflights, fitted north rake coping and moved the finial to the ridge. One arched glazed opening, estimated width 1.42m, bottom 0.15m/top 7.35m above entry; pane divisions, 2.5m roof depth, 1.9m rise and all profiles interpreted. No duplicate building or new interior access. Concealed threshold, side openings and measured dimensions unresolved. Build/type/lint, full journey 55/55, car switch/frontage/reset and Brook parking 54/54, reverse/exit/west walk 27/27 pass. North-return/roof/west/skill views inspected, visible v0.3.75, no errors. Surface grids identical to v0.3.74; load 3815ms. Reference imagery not distributed.


M11d v0.3.76: May 2012 iUgZFJv6UI8UDo-D-x9qKg heading 155 and June 2024 xaYuynMv3Cyx3otNuvArCA heading 155, both fov35, inspected. North recessed balcony glazing has paired rear doors, dark perimeter/centre frames and lower rail divisions. Added frames to the four photographed balcony stacks, retaining the two concealed western stacks as provisional. Existing 1.6m width and 0.35/2.55m bottom/top retained; frame sizes, lower pane divisions and repeated upper-floor treatment interpreted. Side glazing, individual floor variations, hidden openings and basement levels unresolved. Build/type/lint, full journey 55/55, car switch/frontage/reset pass; north close/oblique and skill views inspected, visible v0.3.76, no errors. Ground/terrain/collision grids identical to v0.3.75. Regression load 4757ms during concurrent checks, not an isolated performance measurement. No reference imagery distributed.
