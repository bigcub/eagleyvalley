# Status

Updated 3 October 2026. Local world v0.3.47; public v0.3.41.

## Where it stands

The game plays end to end. You can drive from Blackburn Road down Eagley Way, round Threadfold Way and into the Bridge Mill court, swap cars, walk the passage, fly in bird mode, drop feedback flags and use the map. There's no traffic, no pedestrians and no interiors.

Geographically it's unfinished and the user has rejected parts of it. Mapped road centrelines and EA terrain are sound. Road widths, kerb radii, wall heights and most building details are estimates. Most houses still come from the generic generator: a red brick box with a hipped roof and windows spaced by wall length. Those are placeholders, not models.

The engine was restructured on 23 September 2026 (see `AGENTS.md` for the layout). The world is unchanged, and the regression capture confirms it. Ground heights now live in one module as named zones, and every landmark takes the same kit. Future fixes should be quicker and less likely to leave overlapping strips or mismatched levels.

Driving feel comes first. A generated road network with raised kerbs (v0.4.0) made the car rock and was reverted on 28 September. Road signs and double yellow lines are not modelled, at the user's request; posts, bollards, lamps and street name plates are fine. Run `npm run test:ride` before and after any road or terrain change.

## Rejected by the user, still open

- The Hough Lane/Threadfold Way junction (flag 9217d4a4). M04 in local v0.3.46 corrects the north pavement fill, narrower asphalt landing, low back wall, three bollards, stone posts and Threadfold rail. Both bridge directions and crossing walks pass. Exact widths, planting and the user's review remain open.
- The Bridge Mill wall as seen from Eagley Way. M05 in local v0.3.47 rebuilds the road-facing profile, coping transition and gate-side return. Dimensions and user acceptance remain open; M06 audits the separate passage retaining face.
- The bus turning circle (flag 34419932): M02 rebuilds the connected road, island and kerbs in local v0.3.44; estimated dimensions need user review. M03 adds the closed hedge, taller planting, shelter, bin, brick bed, post and lamps in v0.3.45. Their dimensions and concealed details remain estimates; review is open.
- The Blackburn Road junction (flag 88bc3dbf). The wall no longer sticks into the road, but the corner, pavement and markings are unchecked.
- The Brook Mill car park, the bushes, and window counts on every building.

## Next, in order

The ordered modelling jobs **M01 to M20** are in [TODO.md](../TODO.md), each with a bounded change and completion check. **M01 is modelled and tested locally in v0.3.43:** continuous pavement, kerb, low wall end and road-edge return at the Eagley Way/Hough bend. EAG-041..044 have all four directions recorded. Normal-input walking reaches X124 and returns; user acceptance remains open.

**M02 is modelled and tested locally in v0.3.44:** five August 2022 panoramas cover the complete loop in all four directions; the road, island, south footway and kerbs now join the asphalt approaches. Full car circuit/return and pavement/island walks pass. **M03 is modelled and tested locally in v0.3.45:** a continuous clipped hedge, mixed-height island planting, panelled shelter in a paved recess, bin, brick bed, concrete post and lamps. Hidden trunks and dimensions remain estimated. **M04 is modelled and tested locally in v0.3.46:** corrected asphalt pavement returns, bridge landing/back wall, three bollards, stone post tops and pedestrian rail. Both bridge walks and the filtered crossing pass. **M05 is modelled and tested locally in v0.3.47:** separate road-facing height profiles, coping drop estimated at X89.7, stone slabs, gutter, lamp and joined gate-side return. Road and passage movement heights remain unchanged. **M06 is next:** the separate tall passage retaining face, its slope and steps. The two gates follow as separate jobs. Woodland steps, Brook Mill parking and individual elevations, garages, court levels and the start buildings follow. Continue the route survey within each job and record missing views. Rendering improvements follow the layout and building corrections.

For each pass, name the evidence and the scope, build it, check the changed views and movement, then update TODO.md, progress.md and the sources file. Leave unverified details marked open.

## Street View coverage

No section is accepted as accurate. [SURVEY.md](../SURVEY.md) is the panorama-by-panorama register.

| Area | Inspected | Missing |
| --- | --- | --- |
| Blackburn entrance, upper and middle Eagley Way | EAG-001 to 044 plus 002A/B/C, June 2024. Forward sequence, some side and reverse views | All four directions at every earlier panorama, object inventory, matched game views |
| Lower Eagley Way EAG-027..040 | Continuous June 2024 forward sequence; both sides/reverse at main transitions. v0.3.42 corrects panels, Eagley Brow opening, barriers and mill-side pavement; M05 backfills all four EAG-039 directions | EAG-033 reverse/uphill side; 034/036 sides/reverse; stair flight and accurate dimensions |
| Eagley Way/Hough bend EAG-041..044, M01 | June 2024, all four directions at each panorama. v0.3.43 joins pavement, kerb, wall end and road formation | Measured widths/levels; exact drains and furniture; user acceptance; vegetation/furniture |
| Bridge Mill roadside and passage boundary | M05 rechecks June 2024 EAG-038..043, including four directions at 039/040; earlier four-direction coverage at 038/041..043. v0.3.47 road-facing profile and return; user passage photos | Measured alignment/heights, coping-drop position, passage face/steps, planting, gate thresholds and user acceptance |
| Hough Lane bridge and junction | M04 rechecks all four DQl directions, bridge reverse GXa, old-lane reverse CD44, Hall-lane reverse J2Oz and bridge-mouth sides _odWe. June 2024 and August 2022. v0.3.46 corrects pavement and boundary geometry | Full continuous four-direction approach sequence; measured kerb trace/widths, tactile paving and wooded planting; user acceptance |
| Bus turning circle, M02 | EAG-045..049, August 2022, all four directions; June 2024 asphalt approaches; north-up aerial trace. v0.3.44 connects road, island, paving and kerbs | Measured dimensions/levels, present-day surface confirmation, measured planting/furniture positions and dimensions, hidden trunks/rear bed, herringbone texture, drains; user acceptance |
| Threadfold Way | Isolated north-boundary and junction views | Whole loop, every frontage, entrance, wall and planting |
| Mill courts, garages, gardens | User photos, aerial interpretation | Boundaries, bay counts, hidden elevations, levels. Street View doesn't reach the private court |
| Wider area | Mapped footprints, terrain, a few landmarks | Systematic street, building and vegetation audit |

Next reference for **M06**: user passage photographs and the tall retaining face opposite the doors. Keep its passage-level base separate from M05’s road-relative height profile; compare the slope and steps from both passage directions. The existing lower datum is retained, not accepted. Check the western bank patch and gate-side joins while preserving the complete frontage walk. Earlier missing views and woodland steps remain provisional.

Junction references: [Hough/Threadfold junction](https://www.google.com/maps/@?api=1&map_action=pano&pano=DQl_iPlCOrF2ekkB6nUQbQ&heading=154), [bridge reverse view](https://www.google.com/maps/@?api=1&map_action=pano&pano=GXaLJ6-lQQXM-ZBvWlBeyw&heading=349), [Bridge Mill gates](https://www.google.com/maps/@?api=1&map_action=pano&pano=Ol5x2LtTib6ZgLsg_puNUA&heading=315).

A section is finished when every available panorama and direction is recorded with its gaps, features are inventoried, geometry is rebuilt as one connected piece, matching road-level screenshots are compared both ways, driving and walking pass, and the user has reviewed it. Track inspected, modelled, tested and accepted separately.

## Publishing and local state

The game is public at https://eagleyvalley.com, served by GitHub Pages from the public repo bigcub/eagleyvalley (`origin`); each push to `main` deploys. The old private repo is the `private` remote. OpenAI Sites stays paused at v0.3.3. `npm run preview` serves `dist/client` on port 3000; rebuild after source changes and check the visible world version.
