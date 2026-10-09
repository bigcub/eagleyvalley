# Building height audit

Local v0.3.141, 7 October 2026. Compares every building within 90m of the driving route with the EA 2022 1m DSM.

## Method

`scripts/height-audit.mjs` samples each footprint's interior on a grid (at least 1m from the edges). For each point it takes the DSM roof height and the rendered roof height, found by ray-casting straight down in the running game. It reports the median of each above the lowest DTM point round the footprint, sorted by the difference. `scripts/building-dsm.mjs <id>` gives per-edge eaves or parapet heights and the highest point for one building. Both read the local rasters through `scripts/ea-raster.mjs`. The DSM includes trees and roof plant, and a footprint can cover lower wings, so a single median isn't a measurement of one roof; the per-edge profile and Street View decide each change.

## Results and changes

| Building                | DSM                                                 | Before             | After              | Change                                                                                     |
| ----------------------- | --------------------------------------------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------------ |
| Brook Mill 549512308    | parapet 22.7m, tower 31m                            | 18.7m / 23m        | 22.7m / 30.9m      | v0.3.140, see [east front audit](brook-east-elevation.md)                                  |
| Valley Mill 73858746    | parapet 16.7–16.9m on all long edges, highest 21.4m | parapet 14.9m      | 16.8m              | upper storeys stretched by 1.17; ground storey and arcades unchanged                       |
| Wakefield 727427304/305 | eaves about 10–11.6m, ridge 12.2–12.4m              | 2-storey "plain"   | 3-storey pair      | new `garageTown` kind with the road front from Aug 2022 Street View cDmLevKoRL-FRCH67TZLrw |
| 727427241, 248, 262     | ridge 7.6–9.1m                                      | 3-storey townhouse | 2-storey estate    | face and garage kept from the earlier typing                                               |
| 727427257               | eaves 11.3m, ridge 12.2m                            | 2-storey estate    | 3-storey townhouse | buff face kept                                                                             |

Buildings more than 2m off fell from 19 to 12. 241 and 248 still read about 2m high because their footprints include lower sections the house model extrudes at full height. The gatehouse (571633838) reads 2.1m high on the median, but its road-side eaves are 8.9–9.9m on the DSM and a lower rear section and an overhanging tree skew the median, so the user-corrected model is unchanged.

## v0.3.142 Back Park View and Playfair Street

Apr 2023 Street View jwVwrSwrYif_SpSinYdbNQ (20 Playfair St) headings 0, 95 and 180. 573645275–284 (Back Park View row, south-facing, seen), 573645286–291 (north–south row behind the alley, west-facing front inferred, not seen), 573645292 and 568264979–981 (south-facing onto Playfair Street), 574944695 and 568264929–931 (north-facing) become `terrace` street houses in a new `darkGrit` finish. Storey heights come from the DSM through a new per-house `floors` override: [2.55, 2.4] for the cottage rows (DSM ridge about 7.3m) and [3.1, 3.0] for the gabled corner houses (8.9–9.5m). All are now within about 1.2m. Opening positions follow the terrace type, not counted per house; the large half-timbered villa 573645273 stays generic and needs its own model.

## v0.3.143 Eagley Brow lane end

Aug 2022 Street View zmM6Nlhqi6vvVCOq2Hw9kA (37 Eagley Brow) headings 20, 70 and 345. East of the cobbled lane, 573645311–316 step down facing it behind low stone walls: white render (311 with a ground-floor bay, 312), cream render (313), red brick (314–316); 311 and 312 have roof dormers. Typed as terraces facing the lane with storeys [3.0, 2.85]. Park Terrace 568264983–985 is a light stone terrace facing Playfair Street, typed with [2.55, 2.4]. All within about 1.3m of the DSM. The bay and dormers aren't modelled; 573645317–321 are hidden by trees and stay generic.

## v0.3.144 half-timbered villa

OSM 573645273 gets a dedicated model (`lib/landmarks/park-villa.ts`, `PARK_VILLA`) from Apr 2023 Street View jwVwrSwrYif_SpSinYdbNQ heading 305, the only clear view (south-east, across gardens and conifers). Red brick; half-timbered gables facing south (south wing) and east (main block); a smaller half-timbered gable dormer on the main block's south face; steep slate roofs; four tall stacks. Footprint split into main block, south wing and two low wings; eaves and ridges fitted to the DSM (about 7m inside the main walls, 9m at the south gable, 12.3m at the highest stack); now within 0.9m. Openings are placed only on the photographed faces. Window sizes, timber spacing, stack positions and the concealed north and west faces are interpreted.

## v0.3.145 Ollerton Terrace

Jun 2024 Street View etWv8QQSttIC1k3csYdHTg (31 Kellett St) and 89TPhIEGrPCpm7kZQMJBFQ (19 Park Row), headings 60–70 and 330, on the road OSM names Ollerton Terrace (Google: Park Row). West side 574944678–691: light buff sandstone two-storey terrace, slate roofs, tall stone stacks, round-arched door heads, doors on the flagged pavement; typed `terrace`/`sandstone`, storeys [2.55, 2.4]. East side 573645245–252: red brick terrace behind small front gardens and low brick walls, one porch and a white-rendered end house; typed `terrace`/`red`, storeys [2.8, 2.7]. Checked houses are within 0.4m of the DSM. Gardens, walls, the porch, the rendered end house and arched door heads aren't modelled yet; the alternating east-side footprints may not be one house each.

## v0.3.146 row west of Park Row

574944697–712 run along the west side of the Park Row alley. Jun 2024 Street View 5ETPzpUhFTHBvs8kfb1HKg headings 260 and 330 shows only their backs: whitewashed and stone rear walls behind stone yard walls with doors, slate roofs and stacks, and a taller gabled stone house mid-row. Fronts face west and aren't covered, so finish and openings are inferred (`darkGrit` terrace, `seen: false`, front [-0.94, -0.34]). DSM: about 6.8m for most (storeys [2.55, 2.4]), 9.4–9.9m for 704–706 ([3.1, 3.0]), 11.2m peak on 712 ([3.4, 3.3]). Checked houses within 1.4m. The headings 90 view also shows Ollerton Terrace's backs: red brick outriggers on stone, not modelled. Apr 2023 3u4DRiiCdOKBNe_gJBn5Yw confirms The Gardens as modern brick bungalows with tiled roofs, still generic.

## v0.3.147 Eagley Hall brick block

The modern block attached east of the stone hall (`hallBrickPolygon`) gets its own module, `lib/landmarks/eagley-hall-block.ts`. Aug 2022 Street View cgRt7RN-SkuArMGhJI5aOw (car-park road south of the block) headings 340 and 40: three storeys of red brick, a stepped south front matching the footprint's zig-zag edges 1–5, flat roof with a dark coping, grey-framed wide horizontal and tall narrow windows, stacked steel-and-glass balconies, undercroft parking openings at the west end beside the hall tower. The DSM gives about 10.3–11m inside the block's walls above the car-park ground; parapet modelled at 10.6m. Openings are placed on photographed edges 0–7 only, at an interpreted 2.7m bay rhythm; the Hough Lane face (edges 8–10) isn't photographed and is plain brick. The west end may have an extra lower undercroft level that isn't modelled.

## v0.3.148 Paper Mill Road and Cross Street

Aug 2022 Street View XKhaVOUSGp06Eor80ThsJg (18 Paper Mill Rd) heading 240 and ztVhoCFAAnu1IkGlqhh6iw (32 Paper Mill Rd) heading 330; Apr 2023 Hn5PePpS7Q0nA0eP8vZvGQ (3 Cross St) headings 30/260/340. Cross Street cottages 727434510–516 and 511 typed light `grit` terraces; the Paper Mill Road row 727434517–532 `darkGrit`, south-east of the road and facing it (front [0.57, -0.83]); 727434509 was first read as a tall light grey stone house; v0.3.154 corrects this: that view showed 513/514 to the north, and 509 (south of the lane, behind 510) is unseen. Others [2.25, 2.15] from DSM peaks of 7.2–8.0m including stacks. Checked houses within 1.4m; the site slopes, so medians are approximate. 727434510 and 511 fronts are inferred; 727434533 and 534 stay generic.

## v0.3.149 Eagley Hall Hough Lane side

Aug 2022 Street View LbyMlfom-f_IC-Ej8mAmkg (138 Hough Ln) headings 110, 150 and 195; Google aerial (Airbus) at 53.61392, -2.42515. The aerial shows the apartment block as stepped flat-roofed wings running south-east from the hall, broadly matching the mapped footprint, with a dark courtyard between hall and wings that the solid model doesn't have. A low flat-roofed red brick wing stands against the block's north-east edge, outside the footprint (DSM cells 3.5–7m); from Hough Lane it sits in front of a large car-park tree that hides the block's north wing. Added as `EAGLEY_HALL_BLOCK.lowWing` (height 3.8m, one wide dark window to Hough Lane, coping). 727434508 is the stone Eagley School House Nursery with a small pitched porch; it was already typed stone.

## v0.3.150 Eagley Hall block courtyard

The DSM in the hall's own frame (u along the hall face, v outward from its south-east face at v=16) is at ground level for u 6–18m and v 17–25m, surrounded by 7–10m block wings; the aerial shows the same courtyard. `EAGLEY_HALL_BLOCK.courtyard` cuts it from the block extrusion and roof, with a paved floor and coping. Inner courtyard openings, paving material and any access are unknown.

## v0.3.151 valley-floor generics

Generic buildings left between x -130..330 and z -180..80: only 727434554, 727427288/289, three small garages and the north-slope groups (Lower Tong 727404323–332, High Bank 727574978–982, Scholars Rise north 727404349–351, Paper Mill Road end 727434533/534). 554 (136 Hough Lane, sandstone end-terrace), 508 (nursery, dark gritstone, brown frames) and 288/289 (buff estate, fronts inferred) are typed from Aug 2022 Street View. The Scholars Rise garages 345/346 already match the photographed red brick, hipped slate roof and north-facing doors.

## v0.3.154 gable-fronted houses

`gableFront` swaps the street-house roof axis so the ridge runs back from the front. 727434514 faces south down Cross Street with its gable; 727434510 (Hn5PePpS7Q0nA0eP8vZvGQ heading 170) has eaves along its nearly blank north wall and its gable and stack to the west. 509 is behind 510 and unseen.

## v0.3.155 ridge direction

For each typed street house the DSM-minus-DTM heights inside the footprint were correlated with distance from the mid-depth line (ridge parallel to the front) and from the mid-width line (ridge running back). Most scores are weak because 1m cells and trees blur small roofs, but 510 scores as gable-fronted, matching its photo. Street View checks: 236 gable-fronted (applied); 238 and 261 not (L-shaped and eaves-fronted); 262 buff brick, not red. The Playfair Street corner houses also score high but are up the slope (H01). The scan script is not kept in the repo; it reuses `scripts/ea-raster.mjs` and `streetHousePlan`.

## Remaining

The other outliers are generic placeholder houses: 573645317–321 behind the trees at the top of Eagley Brow, and Sandbanks House and 568264932 by Blackburn Road. They need a typed street-house pass from Street View rather than a height tweak. Storey heights from the DSM are even splits, not measured floor levels.
