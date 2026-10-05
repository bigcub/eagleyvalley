# Hough bridge and Hall lane wooded banks

The user identified missing walls, hedges and trees as the largest model problem on5October2026. This is the first bounded pass under that priority, local world0.3.125. The wider boundary backlog remains open.

## Evidence and limits

- June2024 [bridge Street View](https://www.google.com/maps/@?api=1&map_action=pano&pano=GXaLJ6-lQQXM-ZBvWlBeyw&heading=45&pitch=0&fov=90) shows trees and dense lower vegetation on both brook banks, with canopy above the approaches.
- August2022 [Hall lane Street View](https://www.google.com/maps/@?api=1&map_action=pano&pano=J2OzBk7ztAD0mx85G5KuCg&heading=125&pitch=0&fov=90) shows a low moss/ivy-covered stone wall along the brook side and thick trees/undergrowth. VID-00114:12 onward corroborates it. The video's capture date is unknown.
- OSM lane328981148 and the brook centreline locate the stretch. EA2022 terrain supplies ground heights. Canopy peaks infer existing tree positions, not surveyed trunks.

The photos establish woodland groups and a wall, not individual specimens or measured geometry. Wall endpoints, offset, width0.35m and height about0.55m are fitted estimates. Added tree heights about9.5–13.9m and shrub heights1.1–2.6m are estimates. No species identification or claim of current conditions.

## Model

A dedicated `hough-wooded-banks.ts` module builds the lane wall from8m beyond the junction to the existing final12m entrance wall. Its base follows the lane grade. Every wall segment registers collision. The public junction and gate enclosure remain clear. Hanging foliage follows the wall.

Both brook banks between approximatelyX104 and232 get low, middle and taller understory groups. Clearance filters exclude buildings, carriageways, footpaths, the turning-circle and woodland entrance formations. Trunks remain outside water and at least4m from represented canopy peaks or previously fitted additions. Tree foliage can overhang the bank. Shrubs use instanced foliage cards and narrow branched stems, with shared foliage material. The planting does not change terrain, walking or driving heights. There are no added closed hedge lines in this pass.

## Validation

Four before/after views at the bridge, Hall lane, gate and overhead were inspected with visible WORLD0.3.125. The lane wall is connected, the public lane and gate are clear, and the wooded bank has much more cover. Wider lawns and concealed garden fences remain unfinished.

Build, TypeScript and oxlint pass. Full journey55/55, car switching, passage/frontage walking and reset pass. Hough approach24/24, both footbridge directions, crossing, Hall gate49/49, pavement18/18 and outer bend28/28 pass through normal inputs with no browser errors. Passing checks establish movement and rendering, not accuracy. Ride46/46 passes with unchanged maximum height jerk0.0196m and pitch step0.26degrees; Hough jerk0.0074m/pitch0.16degrees. An isolated browser run reports mean render5.935ms and simulation step0.297ms; the recorded v0.3.124 run was5.851ms/0.298ms. These are single automated samples, not a sustained FPS guarantee. All three flagged location views and two skill-client driving bursts pass without browser errors; screenshot/state inspected.

## Next bounded jobs

The bridge reverse view shows a clipped hedge behind the Bridge Mill gate-side low wall and a mature garden tree. Fit these to the shared landscaping access without blocking either gate. Continue with the court/garage planted edges, Brook Mill parking boundary and Eagley Way bank gaps using their supplied references. Keep user review and measurements open.
