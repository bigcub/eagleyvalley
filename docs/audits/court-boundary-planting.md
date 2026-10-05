# Court hedge and garage woodland edge

B03 first pass, local world0.3.127,5October2026. Missing boundaries and planting remain the user's highest priority.

## Evidence

August2022 [F136, heading120](https://www.google.com/maps/@?api=1&map_action=pano&pano=F136hyzlH4_-hMOcwoLSpA&heading=120&pitch=0&fov=90) and the same panorama at heading90 were rechecked. The entrance view shows a broad clipped hedge on the western parking island and a continuous wooded bank behind the garage range, reaching down towards the outer parking edge. The court's internal lawns are open. This reference does not count concealed specimens, establish present-day planting or measure wall/bank heights. The source's latest available capture is August2022.

OSM Eagley Way155008522 and the previously fitted parking island locate the planting. Existing EA2022 terrain supplies the bases; canopy peaks retain the tall tree layer. Individual shrub positions, planting bands, footprint and heights are estimates, not surveyed specimens or species. No new canopy trunks or island tree have been added. The unsupported central island tree removed in121 stays removed.

Earlier supplied-photo audits remain the evidence for the garage retaining face, door bridges and east rockery. This pass does not invent further retaining walls from foliage-hidden edges. Reference imagery remains browser-only and is not distributed.

## Model

The existing approximately14m western hedge was too narrow and low. It is replaced with a leaf-textured clipped hedge, fitted1.5m wide and1.25m high, centredX7.9 fromZ8.4 to22.2. This stays within the existing western grass island. Its centreline now registers collision; the western parking row startsX10.2 and remains usable.

A dedicated court-woodland-edge landmark adds instanced branching undergrowth on the uphill side of Eagley Way along the mappedX18..74 stretch. The tall layer uses existing canopy trees. A separately fitted lower-bank polygon west of the garage backing face adds court-side undergrowth. Generic shrub sizes are estimated; upper height1.1–2.4m, lower1.8–3.0m. Clearance filters keep foliage centres away from roads/paths/steps and buildings and avoid doubling up existing shrub groups. No internal court lawns, bays, ramp or garage lane are planted.

The prior Bridge Mill gate hedge's procedural leaf material is factored into a shared helper, preserving its texture recipe and material name. Only the intended court hedge adopts it. Terrain, road and movement heights are unchanged; the only added movement blocker is the western hedge line.

The coarse lower bank and garage backing joins remain fitted geometry. Planting is not proof of their accuracy; exposed steep formation ends and concealed wall limits need a separate connected layout check. The court and garage models remain open for user review.

## Validation

Build, TypeScript and oxlint pass. Entrance, garage bank, western hedge and overhead before/after game views inspected with visible WORLD0.3.127. The court parking check drives55/55 from the start, reverses into the western, central and eastern groups, drives/reverses the garage lane and walks all12 door-bridge/ramp/exit targets. Maximum walk step0.00612m. Full journey55/55, car switching, frontage walk and reset pass. Final lower-bank addition changes vegetation only. Two final skill-client driving bursts pass with no browser error files; screenshot and text state inspected. Ride46/46 passes with unchanged max jerk0.0196m and pitch step0.26degrees; Hough0.0074m/0.16degrees. Isolated mean render5.958ms and simulation step0.305ms, compared with the previous5.893ms/0.307ms. These single samples do not establish sustained FPS.

Remaining B03 work is the photographed drop and hedge/multi-stem group beside the lower gable, concealed garden edges and wall/bank level verification. Next priority is Brook Mill parking's planted boundaries and replacement of the rejected bushes, in a separate reference pass.
