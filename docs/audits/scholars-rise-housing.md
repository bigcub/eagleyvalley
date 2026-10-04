# Scholars Rise housing inventory, first M22a pass

Initial inventory, 4 October 2026, world v0.3.91. This is an evidence and identity inventory before a model change. OSM footprints establish positions, not storey counts or opening schedules. Street View address labels identify panoramas and do not assign house numbers to individual OSM polygons.

## Mapped groups

| Group                              | IDs in geographical order                                                   | Treatment / limit                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Modern south-facing row            | 727404354, 727404355, 727404357, 727404356, 727404358, 727404359, 727404360 | Two overlapping street views inspected; first upper-front schedule below.                                   |
| Angled east pair                   | 727404347, 727404348                                                        | M22a2 first front/return reconstruction v0.3.93; shared roof, rear/access details and current changes open. |
| Older southern terrace             | 727404361, 727404363, 727404364, 727404366, 727404365, 727404367            | Own count/roof audit needed; no repeated opening schedule assigned.                                         |
| Older terrace rear attachment      | 727404362                                                                   | Own count/roof audit needed; no repeated opening schedule assigned.                                         |
| Separate garages                   | 727404345, 727404346                                                        | Own count/roof audit needed; no repeated opening schedule assigned.                                         |
| Northwest terrace                  | 727404349, 727404350, 727404351, 727404353                                  | Own count/roof audit needed; no repeated opening schedule assigned.                                         |
| Northeast detached/irregular homes | 727404323, 727404324, 727404325                                             | Own count/roof audit needed; no repeated opening schedule assigned.                                         |

The School House 727404344 is a separate Gothic Revival landmark, already modelled. Do not absorb it into the housing row. The older terrace 361/363/364/366/365/367 is stone in the inspected views, with planting concealing much of the frontage; 362 is a different mapped attachment behind its west end. No independent lower count for that terrace is available from these views.

## Modern row first front schedule

The south-facing mapped line runs approximately from X50/Z-146 to X87/Z-133. From west to east its seven IDs are 354, 355, 357, 356, 358, 359, 360. The two camera locations calculated from the visible Google Maps URLs are approximately X54/Z-127 and X76/Z-125. These put the photographed row on the correct side of the road. Number suffixes are OSM IDs, not property numbers.

| Mapped ID suffix | Top opening group      | Middle opening group              | Roof above group                     |
| ---------------- | ---------------------- | --------------------------------- | ------------------------------------ |
| 354              | One narrow white group | One narrow white group            | Small gable                          |
| 355              | One broad white group  | One broad group with balcony rail | Small gable                          |
| 357              | One broad white group  | One broad group with balcony rail | Small gable                          |
| 356              | One narrow white group | One narrow white group            | West half of the broad central gable |
| 358              | One narrow white group | One narrow white group            | East half of the broad central gable |
| 359              | One broad white group  | One broad group with balcony rail | Small gable                          |
| 360              | One broad white group  | One broad group with balcony rail | Small gable                          |

Counts are observed per photographed group; widths, pane divisions and heights remain unmeasured. Three-storey red/brown brick, buff horizontal bands and a continuous slate-coloured roof are visible. Ground level has projecting white-trimmed gabled door canopies and two broad garage apertures under the broad-window pairs. Exact allocation of garage/entrance access within those paired properties remains unresolved; do not invent a private door behind the hedge. The angled end 347 has its own larger visible gable and porch but does not yet have a complete side/front schedule. Rear elevations are uninspected.

## References

- August 2022 panorama xFxIzPWOyyv4zVUZKhSAkg, heading 355, visible URL camera 53.6149389,-2.4271802. Wide south-facing row with the western end and central gable. https://www.google.com/maps/@?api=1&map_action=pano&pano=xFxIzPWOyyv4zVUZKhSAkg&heading=355&pitch=0
- August 2022 panorama ZxlHPLipqobEhV7tcrmH8g, heading 310, camera 53.61492,-2.4268379. Reverse oblique verifies the continuous roof, central door-canopy pair, garage aperture and balconies. Eastern end partly behind planting. https://www.google.com/maps/@?api=1&map_action=pano&pano=ZxlHPLipqobEhV7tcrmH8g&heading=310&pitch=0
- August 2022 pY_oVo7zbpeo2AduSqfSuQ, heading 40; June 2024 mXlXjufL7gQ3ULNuoYsDcA, heading 315. Older stone terrace/garden and retaining boundary, not enough for an independent concealed opening count.

All views inspected directly in the browser. No reference imagery downloaded, embedded or distributed. OpenStreetMap and Environment Agency attribution retained. This inventory makes no change to terrain, movement or building collision, so no game tests were run. Whitespace check passes.

Next bounded model job M22a1: the seven-house modern row, using a dedicated landmark module and shared roof rather than seven generic hipped boxes. Complete the angled east-end identification and ground garage/entry relation before modelling their concealed details. North-return M21e3 needs a clear north/northwest photo and remains separate.

## M22a1 first frontage model, local v0.3.92

The seven-home row now has its own landmark module. It uses seven counted groups on each upper floor, five small gables and one broad central gable over the paired narrow groups, a continuous slate roof and buff floor bands. Broad middle groups are ordinary-height glazing behind brick balcony fronts with short black rails above. Three visible entrance canopies are assigned to the western narrow group and the two central narrow groups. Two visible garage apertures lie beneath the eastern group of the western broad pair and the western group of the eastern broad pair. These are observed aperture locations, not verified ownership or internal access allocations. Concealed doors are not invented.

Footprints and collision bounds are mapped. The rendered front plane is fitted to the photographed straight row, removing small polygon jogs that otherwise bury windows. Widths, heights, roof pitches, panes, balcony projection, garage sizes, doorstep levels and canopy sizes are estimated. Shared upper rows use the highest sampled frontage level as a provisional datum; entry bases follow existing ground. Rear and end opening counts remain uninspected, and the angled eastern end 347 retains its generic placeholder independently. No terrain, road, pavement, apron, movement or collision change is part of this pass. These surfaces and threshold connections need their own survey.

Next M22a2, count the angled end front and exposed side and establish its roof join. P03 also asks for the ground-level garage/entry relation under both broad pairs. A rear/end view of the seven-home row is needed before adding those opening schedules.

Validation: build, TypeScript, oxlint and whitespace pass. Full journey 55/55, car switch, frontage walk/reset and nearby School House drive 55/55 and walk 19/19 pass. Three changed-location screenshots and the game skill capture inspected; visible world v0.3.92. Every sampled ground, terrain and collision value matches the v0.3.91 baseline; zero browser errors. This confirms runtime continuity, not local accuracy or measured dimensions. Not published.

## M22a2 angled pair, local v0.3.93

The initial inventory omitted adjoining footprint 727404348. Together 347 and 348 form the angled pair beside the seven-home row. A narrow gap separates their roofs from the straight row; the end is not another repeated straight-row house. OSM front anchors run X90.18/Z-134.19 to X98.28/Z-125.94. Satellite roof outlines and two street-level directions support this identity. Street View address labels are camera labels and are not assigned to individual polygons.

The May 2012 view pv7GCWQdiaXe9PoSnoEYXw, heading 20, shows two narrow front groups on each upper floor under a shared broad gable, with two door canopies below. The outer returns have one broad group on each upper floor under smaller projecting gables, brick balcony fronts and garage apertures beneath. August 2022 b_PXeub2nXlkaa3pdfkDwQ repeats the front arrangement but its tree hides some groups. August 2022 VcgR4tseNBfWGxWCzTJsMQ, heading 320, exposes the eastern return: larger blank upper gable farther back and one additional tall white group on the middle level. Its leaves/threshold and lower wall are concealed. That extra group is not mirrored onto the western return.

The dedicated model preserves both mapped collision bounds and footprint shells. Front/return openings and canopy/garage positions are fitted, using a common upper datum and existing ground for entry bases. Roof widths, heights, slopes, intersections, western back-gable envelope, pane divisions, bands, balcony sizes and the tall eastern group's type/level are interpreted estimates. The roof envelope is fitted from street and undated aerial views; rear notches, valleys and hidden upper surfaces are provisional. Rear opening counts, western back-return count, ground concealed by fencing, thresholds, connected driveways/pavements and gap/gate layout remain open. No movement/terrain/collision change or private access route is included.

References inspected directly, no imagery downloaded or distributed:

- August 2022 b_PXeub2nXlkaa3pdfkDwQ, camera 53.6148724,-2.4266921, heading 20. https://www.google.com/maps/@?api=1&map_action=pano&pano=b_PXeub2nXlkaa3pdfkDwQ&heading=20&pitch=0
- May 2012 pv7GCWQdiaXe9PoSnoEYXw, camera 53.6148894,-2.4267331, heading 20. Historical opening/porch/roof count; present-day changes unresolved. https://www.google.com/maps/@?api=1&map_action=pano&pano=pv7GCWQdiaXe9PoSnoEYXw&heading=20&pitch=0
- August 2022 VcgR4tseNBfWGxWCzTJsMQ, camera 53.6148118,-2.4265128, heading 320. Eastern return and concealed lower fence line. https://www.google.com/maps/@?api=1&map_action=pano&pano=VcgR4tseNBfWGxWCzTJsMQ&heading=320&pitch=0
- Google satellite roof view, inspected 4 October 2026; image acquisition date not established. https://www.google.com/maps/@53.6150,-2.4266,105m/data=!3m1!1e3

Next M22a3 older southern stone terrace and its separate rear attachment. P03 remains useful for the angled pair's hidden return/rear groups, current changes, apron and access; photographed front groups need not be repeated.

M22a2 validation: build, TypeScript, oxlint and whitespace pass. Full journey 55/55, vehicle switch, frontage walk/reset and the game skill client pass. Front, eastern return and elevated roof screenshots inspected with world v0.3.93; no browser errors. Every ground, terrain and collision sample matches v0.3.92. These checks establish runtime continuity, not surveyed dimensions. The existing grass/ground reaching the return garages is provisional pending the connected driveway/threshold layout. Not published.
