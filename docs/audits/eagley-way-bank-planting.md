# Eagley Way uphill bank planting

Local v0.3.133, 6 October 2026. B04 bounded follow-up beyond Eagley Brow.

## Evidence and limits

Rechecked June2024 Street View EAG-033, UbRrpbbLOlkG2eR0umRznw, camera53.6134153,-2.4277064, reverse235° and uphill145°. Ivy climbs the roadside stone wall and trunks, with loose broadleaf undergrowth above and behind it. The view shows occasional exposed stone and a narrow gutter. This is woodland growth, rather than a clipped hedge. It does not establish individual species, surveyed trunks, the concealed wall top or present-day conditions.

The bounded model stretch X20..34 follows the existing OSM Eagley Way road and uphill boundary. Existing wall height1.7m and offset3.7m are retained estimates. Small ivy cards cover much of its road face, with exposed stone at the base and intermittent gaps. Two fitted shrub bands2.4/4.2m behind the wall fill the low bank layer; heights1.05..2.2m and group spacing1.15m are rendering estimates. No new tree positions are asserted. Existing canopy trees and unrelated planting retain their geometry. Separate instancing preserves older procedural shrub sequences.

Road, pavement, wall, collision, terrain and movement heights are unchanged. New shrub centres remain beyond the wall and clear mapped buildings, the Brow entrance, court and passage. The stretch ends before the woodland-step opening. Further Eagley Way stretches, ivy on photographed trunks, the concealed wall profile, measured planting positions and user review remain open. Reference images are inspected only, not saved or distributed.

## Validation

Build, TypeScript, oxlint, formatter and whitespace checks pass. Four fixed views inspected before/after at visible worlds132/133 with no browser errors. Two game-skill input bursts completed; screenshots/text state inspected and no error files. Full journey55/55 with vehicle switch/frontage walk/reset passes. Brow entrance4/4, pavement18/18 and return bend7/7 pass without browser errors, maximum walking height steps0.02685/0.02683/0.00810m. Two isolated ride runs complete46/46 without errors. Maximum height jerk0.0196m/pitch step0.26°, Hough0.0074m/0.16°, unchanged. Mean render9.999ms then8.348ms, simulation0.407ms then0.329ms, loads22007/21925ms. The preceding132 render sample was7.279ms; current samples are higher and variable, so unchanged FPS is not claimed. Further comparable performance sampling remains open.

## v0.3.134 lower bank and rhododendron stretch

Rechecked June2024 EAG-035 p9XQKhi9VZ2U7dRp_853dQ heading145, EAG-038 WNZds2hA-h9WhfqPErPzSA heading180 and EAG-041 1C8-EXAtxTMXqMeoaPEYaw heading180. EAG-035 shows a dense flowering rhododendron bank almost hiding the tall uphill wall, with dark ivy at its base. EAG-038 and 041 show the low dry-stone wall behind the pavement with large fern clumps along its top, patchy ivy, and dense broadleaf scrub and saplings under the trees. The game showed a bare grass slope from the steps to the bend.

Model: X34..54 tall wall gets flowering shrubs at 1.6/3.4m behind the wall centre (2.6..4.2m tall), ivy over the lower 60% of the face where present, and coping ferns from X44. X61.5..99.4 along Eagley Way, then along the Hough-bend wall to 0.4m short of its X113.7 end: fern clumps on the wall top, ivy patches over the 0.8m face, and broadleaf scrub in three staggered bands 1.4/3.0/4.7m behind (1.7..3.4m tall). The scrub doesn't cast shadows. Clearance of 1.6m from the woodland-step flight and OSM path 655432308; shrubs keep 4m from other roads. Species, specimen positions, heights and coverage are estimates; no surveyed trunks or present-day claim.

Still open: EAG-034/036 side views, the concealed tall-wall profile near the steps, measured planting positions and user review.

## v0.3.136 upper bank layers

June2024 EAG-016 7dgMGZ9YiK_xAAqGshJAcg heading200 and EAG-024 hO1DwmriYxTXMf91-q8JYw heading172 show the bank above the plain retaining panels filled with dense broadleaf scrub, saplings, ivy curtains and, at EAG-024, flowering rhododendron. The game had mown grass behind a single low fringe. Three staggered layers of instanced scrub now sit 3.9/5.7/7.5m behind the wall from X-175 to X18, 1.5..2.8m tall, with flowering shrubs in the front layer at X-80..-55. They keep 4m from the Eagley Brow lane, 3.5m from other mapped roads and paths, and 2.5m from buildings. No shadow pass. The roadside fringe, ferns and ivy from boundaries.ts are unchanged. The EAG-003 grass opening and the upper slope towards the houses stay open, because the woodland's upper extent and garden boundaries aren't established. Positions and heights are estimates.

## v0.3.137 uphill ivy mats (EAG-034/036 backfill)

Backfilled June2024 EAG-034 KeWipU0MUauQQDZGH_S1ow headings145/235 and EAG-036 CDfj9dBpFTJh0SR2xJQ_DA headings170/255. From EAG-033 to 035 the uphill wall is buried under bulging ivy and rhododendron spill down to the gutter, with fallen petals at the edge. At EAG-036 more of the low dry-stone face and rounded mossy coping shows, with ferns on top. The valley wall's rubble face and coping match the existing model. The earlier flat ivy cards were too sparse and dark to read from the road.

The flat cards on the tall wall (X20..55) and low wall are replaced by instanced ivy mats: small leaves in a layer up to 0.32m thick in front of the face, rising 0.3m over the coping. A coverage mask leaves bare stone between mats: about 90% cover X15..42, 50% X42..55, 40% on the low wall X61.5..99.4. The mats are kept 1.2m from the woodland-step path and receive but don't cast shadows. Thickness, coverage and pattern are fitted, not surveyed. EAG-036's apparent wall height wasn't measurable from the camera, so the 1.7m estimate stands.

## v0.3.138 woodland extent from canopy height

The EA 2022 1m DSM and DTM in `work/reference` (local only) give canopy height. `scripts/ea-raster.mjs` reads the tiled big-endian GeoTIFFs and converts game metres to British National Grid (Helmert to OSGB36, then Transverse Mercator); the DTM matches `eagley-terrain.bin` within 0.08m at five checkpoints. `scripts/canopy-depth.mjs` finds, every 8m along Eagley Way, how far behind the road centre canopy over 4m stays continuous in a 5m window. From about X-140 to X20 it reaches 26–32m+, up to the gardens and houses; X-180..-145 stops at 18–26m. Two single-sample breaks (X-104, X-65) were smoothed from neighbours, and depth is capped at 32m.

Sparser understorey now fills from 14m back to that depth on alternate thirds of stations, 1.0..2.4m tall, 4m clear of buildings and 3.5m from other roads (leaving the verge along the upper street). The DSM records canopy only; understorey under it is inferred from the roadside Street View, not observed.

## v0.3.139 valley-side woodland floor

June2024 EAG-005 JjEoK8rYW_wLeQ7mU15YhQ heading330, EAG-016 7dgMGZ9YiK_xAAqGshJAcg heading20 and EAG-026 RJ78tVUTMnIxHbpiwCJFJQ heading0 show the valley side beyond the barrier and timber fence: ivy over the barrier at EAG-005, ferns under the fence, dense broadleaf scrub and saplings under tall trees, and no view of the estate below. The game had a grass slope with scattered trees and the estate in full view.

`scripts/canopy-depth.mjs` gained a cover mode: the farthest 3m strip, 8m wide, with at least 60% of points above a height threshold. On the valley side (`-1 -280 20 33 6 cover`) canopy over 3m reaches at least 33m behind the road almost everywhere. The Blackburn corner (15m) and short eastern stretches (27m) are the exceptions. Height profiles show gaps in the tall canopy just behind the barrier at about X-137..-133 and X-25, with growth up to about 2m there and tall trees from about 12m on. With a 1m threshold, vegetation covers at least 33m behind the road along the whole stretch except near X19 (27m), so those gaps hold low scrub, consistent with EAG-016.

Model, X-275..18: fern clumps 5.9m from the road centre with gaps; a near scrub band at 7.2m on alternate stations (2.2m tall); deeper understorey every 3m from 10.5m to the canopy depth capped at 30m, on a third of stations per band (1.2..2.6m). Plants keep 3.5m from other roads, 4m from the brook and 4m from buildings, with no shadow pass. Existing roadside shrubs and flowering groups are unchanged. Densities and heights are fitted; the ivy over the barrier at EAG-004..006 isn't modelled yet.
