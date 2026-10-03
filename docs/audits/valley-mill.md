# Valley Mill and Cottonfields jobs

Started 3 October 2026 at the user's request to give another area attention. M21a modelled/tested locally in v0.3.77. User acceptance remains open.

## Evidence

- OSM 73858746 supplies the irregular footprint and east-end anchors at X17.39 Z-81.98 and X7.44 Z-54.06. Mapped, not measured on site.
- June 2024 Street View CGJKJDqjUkB1pntPvj9yVQ, 113 Threadfold Way, heading 270, pitch 15, fov75. East-end oblique inspected. Southern three window stacks, ground arches, central entrance and stair glazing visible. Northern part and cupola obscured by trees.
- August 2022 Street View 2HagKCMcwxoWPiMKjnxJMA, 5 Scholars Rise, heading 250, pitch 10, fov90. North long elevation, trees, clipped hedge, grass strip and indented asphalt parking edge inspected. Foliage conceals many openings; this view does not establish a complete window schedule.
- [Alan Murray-Rust, Geograph 3075238](https://www.geograph.org.uk/photo/3075238), taken 25 July 2012. East-front close photograph inspected through its linked image. Broad central stair glazing, segmental upper heads, round ground heads, paired entrance groups and masonry pier visible. North/south ends partly cropped. Opening pane patterns and fine terracotta decoration still interpreted.
- [Valley Mill, Geograph 2730287](https://en.wikipedia.org/wiki/Eagley), linked Wikimedia image inspected, capture date/photographer not verified in this pass. Wider river/east view supports three flanking stacks each side of the central stair bay, square open corner cupola, pyramidal cap and stepped parapet. Old photograph, no claim about current garden fences or parking.
- [Historic England 1388078](https://historicengland.org.uk/listing/the-list/list-entry/1388078) supports four storeys, flat roof, historic arcade and northeast bell cupola. Its historic 16 by 4 structural bays do not establish present-day glazed opening counts. No present-day schedule derived from that count.

All photographs and Street View imagery are reference only. No image is included in public assets or distributed with the model.

## M21a correction and limits

A dedicated `valley-mill.ts` replaces the generic Valley Mill dispatch and old cupola helper. The existing mapped shell, 14.4m interpreted height and base are retained. Six ordinary east window stacks are explicitly scheduled, three each side. Ground heads are round; upper heads shallow segmental. The central bay has a lower broad stair window, taller upper arched glazing and two glazed entrance groups separated by a masonry pier. The upper stair window's pane pattern is estimated; fine decorative glazing, inscription and carved terracotta remain unmodelled rather than guessed as surveyed detail.

Flat roof retained, with a fitted cornice/parapet and small central parapet step. Square four-post cupola and four-sided slate cap replace the old octagonal cone, unrotated posts and spherical bell. Cupola position, 3.2m width, 0.9m base, 1.6m open stage and 1.05m cap rise are estimated from the photographs. Bell profile is estimated; its presence is supported by the listing.

The seven other mapped edges retain explicit placeholder opening centres copied from the previous generic model. These are not a counted survey, and are labelled provisional in layout. Their rectangular glazing and heavy floor bands still need correction. Neither current northern/southern openings nor concealed west conversion details are considered established. Existing terrain/ground, collision footprint, threshold grade and public movement are retained. The model's east road still masks part of the ground frontage in close views; correcting entrance levels and parking is M21d and requires connected layout evidence.

## Discrete next jobs

| Job | Bounded work | Completion check |
| --- | --- | --- |
| M21a, local v0.3.77 | East opening schedule, stair entrance composition, roof parapet and cupola. | East close/oblique and roof screenshots, full journey, unchanged surface/collision samples. Estimated dimensions and user acceptance open. |
| M21b, first correction local v0.3.78 | North long elevation along Scholars Rise. Survey each row and arcade separately, replace provisional centres, heads, pilasters and floor bands. | Recorded floor-by-floor schedule from more than one view; compare matching street views. Concealed bays labelled unresolved. |
| M21c, first correction local v0.3.79 | South river elevation. Count each floor, arcade and eastern return; correct windows and masonry. | River-side and oblique comparisons. Keep historic structural bays separate from present openings. |
| M21d | East entrance, adjacent retaining boundary and first parking/road connection. Trace connected pavement, threshold, walls and grade before planting. | Normal-input approach and return, parking/reverse where public access exists, ride checks after any road/level change. |
| M21e | West engine/boiler-house end and converted projections. Establish separate volumes, roofs and openings. | Mapped footprint plus current photographed evidence; no new interior or inferred private access. |
| M22a | Scholars Rise housing immediately north of Valley Mill. Inventory mapped building IDs against frontages before modelling roofs/openings. | Each building identified and an independent count schedule recorded. |
| M22b | Cottonfields parking and brook-side connection. Establish aisles, boundary and walkway as one layout. | Matching wide views, clear driving/parking and continuous walk. |

## Validation

`npm run build`, `npx tsc --noEmit`, `npx oxlint lib app components/review-flags.tsx` and whitespace checks pass. Full normal-input journey 55/55, vehicle switch, frontage walk and reset pass, no browser errors. East close, river oblique, roof and skill gameplay screenshots inspected, HUD v0.3.77. Regression ground, terrain and collision sample arrays identical to v0.3.76. Capture load 4111ms during concurrent checks, not an isolated performance measurement. Passing checks establish functionality, not geographical accuracy.


M21b Valley Mill north, v0.3.78, 3 October 2026. August2022 2HagKCMcwxoWPiMKjnxJMA heading205 and pY_oVo7zbpeo2AduSqfSuQ heading140 inspected, both heavily foliated. May2012 G83uwlRksK55KwwM9BDZow headings205/250/259 and j8azZD_3C5RetJYXDvcPwg headings140/200/250 inspected. Overlapping upper views support fifteen opening positions plus the blank eastern cupola corner, five top-floor balcony recesses and ordinary glazed rows below. Explicit fitted centres X-local2..58 in4m steps are estimates, not measured spacing or counts derived from wall length. Replaced nineteen generic north centres, broad floor bands and rectangular ground openings with the recorded top arrangement, segmental upper heads, round base arches, sills and narrow pilaster blocks. Base openings partly hedge-hidden; concealed variations, fitted levels and current balcony doors remain unresolved. Ground/terrain/collision unchanged. Build/type/lint/whitespace, full journey55/55, car switch/frontage/reset and north end/middle/skill screenshot checks pass. HUDv0.3.78, no errors. Regression load3964ms, not an isolated performance measurement. No reference imagery distributed. Next M21c river elevation audit.


North schedule, west to east, photographed in overlapping May 2012 views. Positions fitted, individual hedge-hidden ground openings remain uncertain.

| Row | Fitted local centres and treatment | Limits |
| --- | --- | --- |
| Top | Windows at 2/6/10/22/26/38/42/50/54/58m; balcony recesses at 14/18/30/34/46m. Eastern corner blank. | 2012 arrangement; 2022 vegetation conceals much of it. Frames and fitted positions estimated. |
| Middle two | Fifteen glazed positions, same explicit centres. Segmental heads, three pane columns represented. | Concealed variations unresolved; repeated dimensions interpreted. |
| Ground | Round arched positions at those centres, no opening in the blank corner. | Hedge conceals lower panes and some complete openings. Hidden treatment provisional; exact level relation unresolved. |

M21d must check the building base against the lawn, road and parking before refining this frontage's planting. Current lawn obscures the lower arches in game screenshots. No height or private access was inferred from the top-of-hedge photographs.


## M21c south correction and limits

M21c Valley Mill south river elevation, v0.3.79, 3 October 2026. Alan Murray-Rust's Geograph 3075244 and 3075248, both photographed 25 July 2012, inspected as overlapping close and wide references. Sixteen upper positions counted independently of the historic structural bay count. Explicit east-to-west schedule places balcony stacks at fitted local centres 5.79/13.51/17.37/28.95/32.81/44.39/48.25m on all three upper rows. Remaining positions have segmental glazed openings; base has round arches. Replaced eighteen generic centres and heavy upper floor bands with the photographed arrangement, sills and pilaster blocks. Centres, widths, pane divisions and repeated concealed lower details are estimated. Western lower openings and current conversion changes remain unresolved. Shared arcade module retains the north schedule. Ground, terrain and collision sample arrays identical to v0.3.78. Build, type, lint and full normal-input journey 55/55 pass, including vehicle switch, frontage walk and reset. South end/middle/oblique and gameplay screenshots inspected, HUD v0.3.79, no browser errors. Regression load 4295ms during concurrent checks, not an isolated performance measurement. No reference imagery distributed. M21d entrance and parking grade is next; the present lawn masks parts of the base arches.

| Row | East-to-west photographed schedule | Limits |
| --- | --- | --- |
| Top | W/B/W/B/B/W/W/B/B/W/W/B/B/W/W/W. Sixteen positions in overlapping July 2012 photographs. | Centres fitted to mapped anchors, all dimensions estimated. Historic arrangement, current changes unresolved. |
| Middle two | Same balcony stacks on both rows; visible eastern/central ordinary glazing follows the top positions. | Western trees conceal some individual openings. Concealed repeated glazing provisional. |
| Ground | Round arches represented at explicit fitted centres. | Foreground walls, hedge and trees conceal lower glazing and doors. No threshold or private access inferred. |

M21d begins with the east entrance, adjacent parking surface and boundary. The present base follows the lowest footprint sample while neighbouring roads/lawn use their own heights. Matching visible thresholds to the connected grade requires wide and close evidence; a global building lift would hide this problem rather than establish the ground relation.


## M21d connected-layout audit

M21d initial connected-layout audit, 3 October 2026. June 2024 Street View CGJKJDqjUkB1pntPvj9yVQ heading 270 and May 2012 g1IQT30BtGxwH8ZlMJ54bQ headings 270/285 inspected. Threadfold Way turns around the landscaped eastern island into Scholars Rise. The road rises northward across the mill frontage; paired entrance doors sit below the road edge. A brick retaining/garden wall and timber enclosure occupy the southern entrance return. Northern round ground windows are partly below road level. This is evidence for a lower entrance apron and retaining relation, not a global building lift. Exact descent, concealed steps, present-day enclosure changes and parking extents remain unresolved. No ground, road or boundary geometry changed in this audit.

Mapped anchors: Threadfold Way 655432303 meets Scholars Rise 73858749 at X25.61 Z-60.03. Scholars Rise bends past X21.89 Z-71.53 toward Vale View at X32.72 Z-84.78. The map does not supply the entrance apron or its retaining wall. Existing 2m regression samples near the east frontage range from terrain 17.23m at X10 Z-58 to 18.76m at X16 Z-82 above the game datum. These are model/DTM samples, not surveyed threshold levels. Existing road formation includes its usual centreline offset; a new apron must agree with ground and terrain and retain the road join.

Next bounded implementation: trace the lower entrance apron and its two wall returns, fit its height to the visible doors, and blend only its public approach into the existing carriageway. Verify close/oblique views and walk approach/return before extending parking or adding planting. Keep uncertain steps labelled provisional. Test ride before and after any carriageway/grade edit.
