# Backlog

Open work only. Order and priorities are in [docs/STATUS.md](docs/STATUS.md). Finished items and the old section-by-section checklist are in Git history (commit d809cf0 and earlier).

Nothing here is accepted as accurate until the user has reviewed it.

## User location flags

Original wording kept. Positions are game metres; headings are viewing directions.

- [ ] **88bc3dbf-9522-4dc7-8032-360131516d24, Blackburn Road/Eagley Way junction.** v0.3.29, X-289.6 Z158.0, ground Y44.4, heading 74°, driving. "why the hell is this wall extending out into the road. get the whole junction correct". v0.3.30 removed the wall from the carriageway. Still open: curved corner return, pavement shape, road join, markings, planting.
- [ ] **34419932-5612-483f-8db5-91f162263206, bus turning circle.** v0.3.29, X132.6 Z34.6, ground Y18.9, heading 68°. "this is known as the turning circle and it where the bus turns around. it looks a complete joke right now, no detail at all". v0.3.30 added block paving, kerbs and a low island hedge at an estimated 6.4m width. Still open: island outline, clipped hedge shape, trees, bus stop furniture, edge paint, a bus turning check.
- [ ] **ae46b280-22e3-4388-9178-9650d042680a, Hough Lane side of Bridge Mill.** v0.3.29, X114.5 Z25.6, ground Y19.3, heading 267°. "what on earth is going on here at side of Bridge Mill - there are two gates and the wall sections should be completed". v0.3.31/32 connected the frontage wall and added the separate passage gate. Positions and dimensions of both gates remain interpreted.
- [ ] **2c38ae18-90f7-4282-898b-d92ba0f3bc6d, Hough Lane road dip.** v0.3.30, X132.5 Z6.6, ground Y17.5, heading 169°. "strange dip in road". v0.3.31 samples the deck beyond both abutments, and rendering and movement share it. Deck levels are estimates. Needs the user to confirm.
- [ ] **9217d4a4-b7d3-41cd-9c9a-c4fbfe51a208, Threadfold Way/Hough Lane junction.** v0.3.30, X146.4 Z-28.7, ground Y16.4, heading 154°. "this bit where is meets Hough Lane is awful - nothing like real life. model is properly with detail". Rejected again after v0.3.36. See the junction section below.

Flags cd3dbd08 (X-272.2 Z136) and e0f140d7 (X55.9 Z31.6), pale strips in the road, were fixed in v0.3.30.

## Hough Lane and the Threadfold Way junction

- [ ] Trace the exact kerb outline, pavement radii and old-lane mouth from DQl_iPlCOrF2ekkB6nUQbQ, CD44JCXYHZPTLGAoXPEVlg and aerial imagery, then rebuild road, pavement, kerbs and walls as one layout.
- [ ] Model the four tapered stone posts on the footbridge approach (SURVEY.md, v0.3.38 references).
- [ ] Verify bollard line and angle, railing and parapet joins, double yellow returns, tactile paving and signs beyond the 30mph pair.
- [ ] Eagley Hall (lib/landmarks/eagley-hall.ts): user comparison. Interpreted: 16m plan depth, storey heights, bay spacing, tower size, porch position, gable shapes, unlettered name board.
- [ ] Wooded and ivy corner planting from references, not guessed clusters.

## Eagley Way

- [ ] Resume the forward survey at EAG-026 and continue to Bridge Mill. Backfill side and reverse views for EAG-001 to 026, especially 014 to 025.
- [ ] Find where the plain retaining wall really ends (currently estimated at X-40), and verify the X94 step in the mill wall.
- [ ] Map the grassy opening at EAG-002/003, individual trunks, lamp positions and the flowering banks at EAG-008 to 011. Check drain positions and panel seams on the retaining wall, and the lean of the left fence.
- [ ] Record wall height against the pavement at several points, not one constant height. Fix banks poking through walls.
- [ ] Gatehouse: reverse and side survey, roof junctions, thresholds and frontage levels against closer photos.

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
- [ ] Rebuild road surfaces, kerbs and pavements from centrelines plus a per-road width spec, with proper junction meshes, so the Hough and Blackburn junctions come out of one system rather than patches.
- [ ] A spatial index for `nearest()` if load time grows. It's about 2.5s now.
- [ ] Photo requests, one group at a time as each section starts: both directions along the passage; wide court and garage views; engine house from court and brook; wide rear elevation and gardens; School House forecourt and sides.
