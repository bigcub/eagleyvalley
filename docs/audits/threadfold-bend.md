# Eastern Threadfold pavement

4 October2026, M26c first repair, local v0.3.119.

The generic outside pavement left grass between its back edge and the retained north wall. Coarse terrain triangles also crossed the slabs at the wall end. This pass fills that strip and clears the terrain beneath it; it does not complete the whole eastern bend survey.

June2024 Street View [u-FH305](https://www.google.com/maps/@?api=1&map_action=pano&pano=u-FH1MjEtHPsiNovCT23tQ&heading=305&pitch=0&fov=90) and VID-00112:57/13:18 show a continuous pavement outside the bend, with the planted retaining boundary behind it. The mapped road655432303 supplies the centreline. The source canopy conceals wall details. Widths, ends and terrain-cut depth are fitted estimates, not measured dimensions. The video's pale bins remain separate from permanent boundaries. [Route audit](onward-video-route.md).

Dedicated `lib/landmarks/threadfold-bend.ts` builds the shared pavement/formation plan from the mapped road. Named `THREADFOLD_BEND` dimensions taper the pavement from1.1m to1.45m between X100 and110 and back to1.1m at the existing junction radius10m, with full width outside14m. The inner edge stays3.35m from the centreline. The retained wall stays at its existing alignment and height; visible pavement reaches its road-facing foot. No raised movement kerb is added. The overlay is5mm above the old slabs to avoid flicker.

Named terrain and ground zones use the same plan. Movement follows the existing carriageway datum; grass is held below the rendered slabs and under the wall. The formation starts0.6m from the centreline and extends2.25m behind the pavement so2m terrain cells cannot cut across it. These are implementation clearances, not surveyed bank extents. Carriageway centreline levels, wall/rail/lamp collisions, mill parking mouth and mapped north footpath are retained.

Open: exact road/pavement edges, wall profile and endpoints, transition beside footway727434504, drains/slab pattern, planting and review. Walking validation exposed tight clearance between the existing junction rail and lamp near X147 Z-30. That needs a separate reference-based M26c follow-up. The current test uses the public road side of that rail, then reaches the repaired pavement beyond its end. Do not claim an uninterrupted pavement-only walk through that junction.

Reference media stay browser-only. OpenStreetMap and Environment Agency attribution retained. Nothing published.

## Checks run

Final v0.3.119 approach/reverse and overhead views inspected; no grass through the repaired strip. Full journey55/55, vehicle switch, frontage walk/reset pass. Extended Hough check passes its approach24/24, both bridge walks, filtered crossing and repaired strip28/28 with normal inputs; maximum strip walking step0.00875m. Earlier pavement-only attempts hit the existing lamp and rail. Final successful route uses the road side of the rail before joining the repaired strip; those collisions remain unchanged.

Ride46/46 passes, maximum height jerk0.0196m and pitch step0.26degrees; Hough0.0074m/0.16degrees, matching the previous world. Build, TypeScript, oxlint, document/code format and whitespace checks pass. Three flagged-viewpoint checks pass with no browser errors. Game-skill controls, screenshot and text state inspected, no error file. No browser errors in the completed gameplay checks.

Both sampled collision grids are identical to v0.3.118. Wide-grid terrain/ground changes stay within X106..144 Z-68..-38, maximum1.3519m; core-grid terrain bounds X119.5..147.5 Z-60..-31.5, ground X122.5..146.5 Z-60..-34.5, maximum0.6588m. These include the cut behind the wall, not a change to carriageway grade. Sampling and movement checks establish continuity, not local accuracy or user acceptance.

## Junction rail and lamp follow-up, v0.3.120

DQl June2024 headings340 and20 were rechecked on4 October2026. The wider20 view shows pavement on the Threadfold carriageway side of the rail, with the old-lane opening behind it. The heritage lamp is aligned with the rail. The previous model cut the walking strip with both objects. This correction moves the five-point rail trace to the back edge and aligns the lamp with its middle segment. Collision lines move with the visible objects; none are removed. Lamp position is now in the shared layout record.

The junction pavement join widens from1.1m to1.7m, tapering to the existing1.45m bend strip by radius14m. Its shared plan still supplies rendered paving, the named walking zone and the terrain formation. The Hough module also fills the polygon between its existing eastern kerb and the fitted rail, including the short return seam. The fill uses the existing Threadfold road datum, which also drives the bend walking zone. The established Hough return and terrain formation remain in place. The rail end stops before the walked return. These widths and furniture coordinates are fitted estimates. Mapped road centrelines and north-footpath geometry are retained. The fill and bend pavement use the same smooth Threadfold arm datum for rendering and walking. An intermediate attempt to use the nearest carriageway switched between arm heights and produced a walking step; that attempt was removed. The separate return remains paved. Exact alignment, wall profile, north-footpath join and user review remain open.

The earlier road-side detour remains a regression check. A new normal-input out-and-back route follows the pavement on the carriageway side of the rail. The final18-point route passes out and back with maximum walking step0.00777m. The retained28-point road-side route passes with maximum step0.00872m. Hough approach24/24, both bridge walks and filtered crossing pass, with no browser errors. Final forward/reverse/overhead views inspected. The adjoining old-lane mouth and exact kerb/pavement edge remain open for the wider junction survey. Both terrain sample grids match v0.3.119; wide ground matches, four core ground samples change around X147..147.5 Z-34..-32.5, maximum0.2544m. Furniture collisions move with the fitted rail/lamp.

Full journey55/55 with vehicle switch/frontage walk/reset passes. Ride46/46 matches119: maximum height jerk0.0196m, pitch step0.26degrees; Hough0.0074m/0.16degrees. Build, TypeScript and oxlint pass. Checks establish continuity, not measured local accuracy. Nothing pushed.

Three flagged-viewpoint checks pass with no browser errors. Game-skill controls, screenshot and text state inspected, no error file. Code/document formatting and whitespace checks pass.
