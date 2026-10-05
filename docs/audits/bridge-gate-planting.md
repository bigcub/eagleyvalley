# Bridge Mill gate-side planting

B02, local world0.3.126,5October2026. This pass continues the user's priority of missing walls, hedges and trees.

## Reference

June2024 [EAG-043, heading350](https://www.google.com/maps/@?api=1&map_action=pano&pano=Ol5x2LtTib6ZgLsg_puNUA&heading=350&pitch=0&fov=90) was rechecked. The shared landscaping gate has a clipped hedge beside its inner path, fuller mixed planting behind the passage-side return, and an open lawn with a mature tree on the other side. The [bridge reverse view, heading205](https://www.google.com/maps/@?api=1&map_action=pano&pano=GXaLJ6-lQQXM-ZBvWlBeyw&heading=205&pitch=0&fov=90) confirms open grass between the low road boundary and inner hedge, with the tree on the lawn.

Neither photograph establishes a surveyed hedge trace, property boundary, species or precise height. The near-gate hedge endpoint and bed specimen positions are estimates. Existing survey canopy peakX118Z12 already represents the lawn tree; this pass retains it rather than adding another trunk. The references are June2024, not confirmation of present-day conditions. No reference images are stored or distributed.

## Change

`BRIDGE_GATE_PLANTING` in layout.ts records the fitted hedge line, open-lawn exclusion and eight mixed-bed groups. A dedicated landmark module builds them. The sparse eastern garden shrubs are replaced by a continuous clipped hedge, approximately25m total, extending to the gate bed. Estimated height1.45m and width0.65m. A procedural leaf texture and silhouette cards distinguish it from the loose woodland growth. This material is confined to this hedge.

The hedge registers collision along its centreline. Both existing entrances stay open. The bed is behind the existing passage-side boundary and adds no new closed access. The photographed lawn excludes fitted woodland specimens added in the preceding bank pass. The existing canopy-peak tree remains. No road, terrain or movement height changes.

The garden/path/road-facing wall levels and dimensions are earlier fitted estimates, still open for review. The hedge is visible in the close entrance view but is concealed by the existing wall from portions of the bridge approach. This pass does not accept or repair the rejected long roadside/passage retaining-wall profiles. Keep those audits separate.

## Checks

Before/after entrance, bridge reverse and overhead screenshots inspected with visible WORLD0.3.126. Build, TypeScript and oxlint pass. Full journey55/55, vehicle switching, frontage walk and reset pass in each gate scenario. Normal-input landscaping gate out/back56/56 passes, maximum height step0.0672m. Passage gate out/back24/24 passes, maximum step0.00795m. Both report no browser errors. Final material-only adjustment leaves geometry and collisions unchanged. Two final skill-client driving bursts report no browser errors; screenshots/state inspected. Ride46/46 passes, max jerk0.0196m and pitch step0.26degrees unchanged; Hough jerk0.0074m/pitch0.16degrees. Isolated mean render5.893ms and simulation step0.307ms, compared with the preceding isolated pass5.935ms/0.297ms. Single automated samples do not establish sustained FPS.

User review, measurements and concealed planting remain open. Next are the court and garage planted edges, using the supplied court references before adding anything.
