# Backlog

Open work only. Order and priorities are in [docs/STATUS.md](docs/STATUS.md). Finished items and the old section-by-section checklist are in Git history (commit 83b7520 and earlier).

Nothing here is accepted as accurate until the user has reviewed it.

## Ordered modelling jobs

Next job: **M06**. M01 to M05 are modelled and tested locally, through v0.3.47; user acceptance remains open. Work through this queue one job at a time. Each job includes inspecting its available reference views, recording gaps in SURVEY.md, updating the model and comparing matching game views. Modelled and tested does not mean accepted by the user. Dimensions remain labelled estimated unless supported by measurement.

| Job | Place and bounded change | Completion check |
| --- | --- | --- |
| M01, modelled/tested v0.3.43 | Eagley Way/Hough Lane bend. EAG-041..044 inspected in all four directions; joined road edge, uphill paving, kerb and wall end. Return reaches the west bus-loop edge near X126, beyond the initial X119 boundary. | Both approach views and overhead compared; normal-input walk to X124 and back passes; full journey, Hough, locations and ride checks. Widths and levels interpreted; user acceptance open. |
| M02, modelled/tested v0.3.44 | Bus turning circle at X132.6 Z34.6. EAG-045..049 inspected all around; joined block-paved lane, island/nose, outer south footway and kerbs to both asphalt approaches. | Complete normal-input circuit and return, pavement/island walks, journey, Hough, locations and ride checks pass. Geometry and levels estimated; user acceptance open. |
| M03, modelled/tested v0.3.45 | Turning-circle closed hedge and mixed-height planting; opaque shelter, bin, low brick bed, concrete island post and lamps from EAG-045..049. Shelter recess shares the loop grade. | Matched views, full circuit/return, pavement and shelter entrance/exit checks. Dimensions, hidden trunks and rear bed remain estimates; user acceptance open. |
| M04, modelled/tested v0.3.46 | Hough Lane/Threadfold Way junction, flag 9217d4a4. Filled the north pavement return, narrowed the asphalt footbridge landing to a low stone back boundary, corrected three removable bollards and flat-topped stone posts, and aligned the rail along Threadfold pavement. | Reference-coordinate views from both roads and old/Hall lanes; both bridge walks and a walk through the bollard gap pass, with full journey, locations and ride checks. Widths and wall alignment estimated. Planting, tactile paving, exact kerb trace and user acceptance remain open; flag stays open. |
| M05, modelled/tested v0.3.47 | Bridge Mill road-facing wall. Separate road-relative height profiles, upright-to-flat coping drop estimated at X89.7, narrow gutter, road-level lamp and continuous gate-side return. June 2024 EAG-038..043 rechecked; EAG-039 side/reverse gap filled. | Both road directions, side, ends and overhead inspected; journey, frontage walk, locations, Hough and ride pass. Ground/terrain samples unchanged; lamp collision added locally. Wall dimensions, alignment and coping-drop position estimated; user acceptance open. Lower passage face remains M06. |
| M06 | Bridge Mill passage retaining face. Rebuild its separate tall face, slope and steps using passage photos and levels, keeping it distinct from M05. | Views along the passage both ways; continuous frontage walk, no gaps or traps. Ask for a specific photo only if the available evidence cannot establish the geometry. |
| M07 | Hough-end passage gate. Reconstruct this gate's piers, opening, ironwork and cobbled threshold. | Correct connection to the passage and continuous approach levels; check walking clearance. |
| M08 | Hough-end landscaping gate. Give the second gate its own model and connect it to shared landscaping behind the private gardens. | Compare its position relative to M07; verify the route and garden boundaries. |
| M09 | Woodland steps opposite Bridge Mill, EAG-037/038. Establish the visible flight, wall returns and upper connection, then replace the generic path strip. | Compare road-level and side views; walk up and down with matching rendered and movement heights. Concealed steps remain explicitly unresolved if evidence is missing. |
| M10 | Brook Mill car park layout. Trace its entrance, aisles, parking bays, islands and retaining edges; replace the generated parking arrangement. | Matching entrance and internal views; drive in, turn, park and reverse out. |
| M11 | Brook Mill north elevation. Record openings by floor, then correct its bays, windows and doors from the schedule. | Each modelled opening matches a recorded reference or is marked unresolved; straight and oblique views. |
| M12 | Brook Mill west elevation. Record and rebuild this elevation's openings and entrance separately. | Per-floor opening schedule and matching views; verify car-park entrance clearance. |
| M13 | Brook Mill south elevation and terrace. Record this elevation's openings and terrace division, then correct their geometry and levels. | Per-floor schedule; matching frontage views and a terrace walk. |
| M14 | Brook Mill east elevation. Record its openings and upper arches and correct this elevation. | Per-floor schedule and matching views; concealed details explicitly unresolved. |
| M15 | Long garage range. Verify the five door bays, roof form and end returns, then rebuild this range. | Front and end comparisons; each bay remains accessible from the narrow garage lane. |
| M16 | Court-house entrance bridges, OSM 727427311/312/313. Correct each bridge, door threshold and partly sunken lower-floor edge. | Compare each entrance; continuous walks to the doors without sinking or clipping. |
| M17 | Bridge Mill garage court ground layout. Join the western parking court, narrow garage lane and rise towards the passage; correct perimeter and parking positions. | Drive in, park, reverse, exit and walk to the passage; no disconnected surfaces. |
| M18 | Blackburn Road/Eagley Way entrance, flag 88bc3dbf. Trace and rebuild the corner pavement, curved wall return and road join. | Reference comparisons from Blackburn Road and Eagley Way; drive and walk through the entrance. |
| M19 | Gatehouse elevations. Audit the roof junctions, openings, name plate and thresholds; correct the building against side and reverse views. | Recorded opening schedule and matching approach views; clear road entrance. |
| M20 | School House front and forecourt. Reconstruct the Gothic front gables, porch, tall windows and entrance levels from available views. | Front and oblique comparisons and a walk to the entrance; hidden side/rear elevations remain separate work. |

After these jobs, split the remaining Threadfold frontages, rear gardens, engine house, brook edges and wider streets into equivalent jobs by building or bounded stretch. Do not replace that missing inventory with a general "add detail" task.

## User location flags

Original wording kept. Positions are game metres; headings are viewing directions.

- [ ] **88bc3dbf-9522-4dc7-8032-360131516d24, Blackburn Road/Eagley Way junction.** v0.3.29, X-289.6 Z158.0, ground Y44.4, heading 74°, driving. "why the hell is this wall extending out into the road. get the whole junction correct". v0.3.30 removed the wall from the carriageway. Still open: curved corner return, pavement shape, road join, markings, planting.
- [ ] **34419932-5612-483f-8db5-91f162263206, bus turning circle.** v0.3.29, X132.6 Z34.6, ground Y18.9, heading 68°. "this is known as the turning circle and it where the bus turns around. it looks a complete joke right now, no detail at all". v0.3.30 added block paving, kerbs and a low island hedge at an estimated 6.4m width. v0.3.44 rebuilds the connected road/island/kerb layout from EAG-045..049; a full car circuit and return pass. M03 in v0.3.45 adds the closed hedge, mixed planting, shelter, bin, low brick bed, concrete post and lamps. Still open: user acceptance, present-day changes, measured outline/dimensions, concealed trunks/rear bed, drains and herringbone paving pattern. A bus-sized swept-path check is not established by the car test. No road signs or yellow lines.
- [ ] **ae46b280-22e3-4388-9178-9650d042680a, Hough Lane side of Bridge Mill.** v0.3.29, X114.5 Z25.6, ground Y19.3, heading 267°. "what on earth is going on here at side of Bridge Mill - there are two gates and the wall sections should be completed". v0.3.31/32 connected the frontage wall and added the separate passage gate. Positions and dimensions of both gates remain interpreted.
- [ ] **2c38ae18-90f7-4282-898b-d92ba0f3bc6d, Hough Lane road dip.** v0.3.30, X132.5 Z6.6, ground Y17.5, heading 169°. "strange dip in road". v0.3.31 samples the deck beyond both abutments, and rendering and movement share it. Deck levels are estimates. Needs the user to confirm.
- [ ] **9217d4a4-b7d3-41cd-9c9a-c4fbfe51a208, Threadfold Way/Hough Lane junction.** v0.3.30, X146.4 Z-28.7, ground Y16.4, heading 154°. "this bit where is meets Hough Lane is awful - nothing like real life. model is properly with detail". Rejected again after v0.3.36. v0.3.41 rebuilt it as one connected layout from four Street View panoramas, with a smooth driving surface. Needs the user's review.

Flags cd3dbd08 (X-272.2 Z136) and e0f140d7 (X55.9 Z31.6), pale strips in the road, were fixed in v0.3.30.

## Hough Lane and the Threadfold Way junction

- [x] One connected layout of road, kerbs, pavements and island (v0.3.41, lib/landmarks/hough-junction.ts).
- [x] Four tapered stone posts along the Eagley Hall lane kerb (v0.3.41).
- [ ] User review of v0.3.41. Interpreted: pavement widths, corner radii, bollard line position, island edge towards the brook.
- [ ] West corner raised shrub bed and its large tree.
- [ ] Eagley Hall (lib/landmarks/eagley-hall.ts): user comparison. Interpreted: 16m plan depth, storey heights, bay spacing, tower size, porch position, gable shapes, unlettered name board.
- [ ] Wooded and ivy corner planting from references, not guessed clusters.

## Eagley Way

- [x] M02: full loop sequence EAG-045..049, August 2022, all four directions recorded; joins EAG-044 and returns to EAG-043 (June 2024). v0.3.44 connects the road, island, pavement and kerbs. M03 models planting/furniture in v0.3.45; user acceptance open.
- [ ] Backfill EAG-033 reverse/uphill side and EAG-034/036 sides/reverse (EAG-039 backfilled in M05). Backfill side and reverse views for EAG-001 to 026, especially 014 to 025.
- [ ] Verify the interpreted plain-wall end at the Eagley Brow opening, and the mill-wall coping step (M05 moves the estimate from X94 to X89.7). EAG-030..032 confirms the opening; v0.3.42 removes its blocking wall, but dimensions remain estimated.
- [ ] Map the grassy opening at EAG-002/003, individual trunks, lamp positions and the flowering banks at EAG-008 to 011. Check drain positions and panel seams on the retaining wall, and the lean of the left fence.
- [ ] Record wall height against the pavement at several points, not one constant height. Fix banks poking through walls.
- [ ] Gatehouse: reverse and side survey, roof junctions, thresholds and frontage levels against closer photos.

- [ ] Eagley Brow entrance, EAG-030..032: verify post count/positions, opening width, worn paving and the rising lane beyond its first bend. v0.3.42 is an interpreted connected first pass.
- [ ] Woodland steps and uphill pavement, EAG-037/038: stair count, width, levels and upper connection; trace the low bank wall and pavement all the way to Hough Lane. v0.3.42 removes the unsupported tall wall, restores the pavement and leaves the step opening; the flight remains unmodelled.
- [x] M01: connect the uphill pavement around the Eagley Way/Hough Lane bend near X110 Z34. v0.3.43 joins the road edge, pavement, kerb and low wall end from EAG-041..044. Normal-input walking now reaches X124 and returns; dimensions and grade remain estimates. User acceptance open.

## Bridge Mill

- [ ] Road-facing wall from Eagley Way (rejected): alignment, height profile against the road, coping, both ends, the intervening bank and planting. Match wide views both ways before surface detail.
- [ ] Hough Lane gates: exact positions, widths, piers, ironwork pattern, thresholds and approach levels. The landscaping gate needs a dedicated reference-based model.
- [ ] Passage: true width and lengthwise fall, sett course direction at both ends and at doorsteps, wall heights at known points.
- [ ] Frontage: door colours from current photos, lantern shapes, IMG_9028 raised stone planter and storage chest, IMG_9029 trellis, climber and pots, ivy against the far-end falling wall.
- [ ] Rear: count the houses and check door and window positions, patio widths and fence lengths. The five plot divisions are estimates.
- [ ] Main building: roof ridge, hips and eaves from several views, window bay counts per elevation, sash proportions.
- [ ] Engine house: present-day footprint, levels, roof and north windows from user photos.
- [ ] Gardens: real boundaries, planting positions, the second (landscaping) access, hedge collision.

## Garage court and houses opposite

- [ ] Wide photos from the court entrance in and out, each garage range straight on and each end.
- [ ] Confirm the five-door range dimensions and the separate garage's door count and orientation. Roof forms and ridge heights.
- [ ] Court perimeter, bay count and markings, and the level change up to the passage. Drive in, park, reverse and get out without clipping.
- [ ] X59 Z14 photo: parking edge and low kerb, buff-stone building and lower gable, the drop and small parapet beside it, layered hedge and multi-stem tree.
- [ ] Court houses: concealed rear windows, door positions, bridge dimensions, sunken-strip landscaping.

## Brook Mill and its car park

- [ ] Car park plan: entrances, aisles, bay count and angles, markings, kerbs, islands, retaining walls, planted edges. Test turning and parking.
- [ ] Opening schedule for every floor and elevation from current views. The historic 14 by 6 bays don't establish present-day openings; west and south schedules are partly inferred.
- [ ] Tower roof, mouldings, porch proportions and the east upper arches from closer photos.
- [ ] South terrace width, level, division count and end connections.
- [ ] X24 Z-4 riverside path: gate position and width, hedge extent, gate collision both ways, the higher court-side bank and parking slope.

## Threadfold Way, School House, Valley Mill and wider area

- [ ] Threadfold Way loop: every frontage by footprint ID, storeys, roof, materials, openings, gardens, driveways and boundaries; extent of block paving; yellow line ends.
- [ ] Generic buildings: door position within the road-facing elevation is unsurveyed.
- [ ] School House: side and rear elevations, forecourt, steps, ironwork, lamp.
- [ ] Valley Mill and Cottonfields: proportions, cupola, window rhythm, parking and river edge.
- [ ] Brook and bridges: channel width, banks, weirs and outfalls, each bridge's deck, parapets and approaches.
- [ ] Nearby streets inside the boundary: School Street, Scholars Rise, Eagley Brow, Hough Lane and back lanes, Park Row, Vale View, Ollerton Street, Paper Mill Road, Blackburn Road frontage. Mark which parts are actually visible first.
- [ ] Street name plates on Threadfold Way and the mills: survey before replacing the removed boards.

## Materials, planting and rendering

- [ ] Replace the bushes: real branching, smaller leaves, clipped hedges versus loose shrubs, sizes from references.
- [ ] Audit canopy-peak trees against current imagery; remove false trees and add missing major ones.
- [ ] Distinct materials for dressed sandstone, rubble, brick, slate, asphalt, block paving and setts at consistent metre scale.
- [ ] Sky, sun, ground and road textures, contact shadows, water and a proper car. Measure frame rate on the user's machine before and after.

## Engineering

- [ ] Move remaining hand-placed coordinates in `lib/world/boundaries.ts` and the landmark modules into named records in `lib/world/layout.ts` with their evidence.
- [ ] Other junctions (Blackburn Road first) could reuse the Hough approach: layout as fixed data, smooth road plane, pavements walked at road level. A map-wide generated network (reverted v0.4.0, commit 8cc9bfe) made the car rock and must not return in that form.
- [ ] Ride continuity after further road/terrain work (`npm run test:ride`). M02 reduces the whole-route worst jolt to 0.0196, now near X6.5 Z57.2; the separate turning-circle circuit improves from 0.1773 to 0.00047. Continue checking the approach joins after later layout changes.
- [ ] A spatial index for `nearest()` if load time grows. It's about 2.5s now.
- [ ] Photo requests, one group at a time as each section starts: both directions along the passage; wide court and garage views; engine house from court and brook; wide rear elevation and gardens; School House forecourt and sides.
