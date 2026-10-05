# Hall lane woodland entrance

5 October 2026. M26d first surface and boundary pass, local v0.3.122.

Rechecked Aug2022 Street View panorama `IjY_jWwNLb7UgTDPmcNvFg`, heading135, fields of view90 and50. [Entrance reference](https://www.google.com/maps/@?api=1&map_action=pano&pano=IjY_jWwNLb7UgTDPmcNvFg&heading=135&pitch=-5&fov=50). The broader view shows the asphalt lane, parking and timber fence on the left, brook edge on the right, closed metal vehicle gate, separate pedestrian kissing gate, black-framed noticeboard and broad route beyond. The closer view distinguishes the gates. Neither gate state nor planting is established as current by 2022 imagery. VID-00115:08/15:21, reviewed in the [route audit](onward-video-route.md), supports the low mossy brook-side wall and entrance narrowing.

This bounded pass joins the last12m of mapped service road328981148 to the first14m of path655432302. The fitted4.6m entrance width holds for5m beyond the mapped join, then narrows to the existing1.8m path. Dedicated `lib/landmarks/hall-woodland-entrance.ts` supplies the rendered outline, terrain formation and walking zone. The surface uses the EA centreline samples plus the existing0.38m road clearance. It does not change the rest of the lane grade. A2.2m terrain margin holds grass below the paving; this is a mesh clearance, not an observed bank extent. The overlay is25mm above the movement datum to separate overlapping meshes.

A low moss-coloured stone wall follows the brook side of this stretch, with collision lines matching the rendered segments. Estimated height0.48m, width0.35m and offset0.6m from the surface edge. The wall endpoints and taper are fitted interpretations, not measured traces. Mapped centrelines are evidence for the route, not exact surface boundaries. No user acceptance is recorded.

Still open: full lane-edge trace, cabinet clearance, left parking/fence/kerb and drain, vehicle gate and working pedestrian kissing-gate access, noticeboard, precise surface change from asphalt to worn/muddy path, grass opening, first woodland wall endpoints, bank levels and surveyed dimensions. The currently pale generic path beyond this short entrance remains queued under M26e. Do not model the gate as an impenetrable bar across the public walking route. Uncertain board text stays out of the model. The entrance is not a completed reconstruction.

## Checks run

Build, TypeScript and oxlint pass. Visible world0.3.122 confirmed. Extended Hough test follows the public route from the bridge/junction into the Hall lane, through the entrance and onto the existing narrow path, then returns. All29 targets pass with normal walking inputs; maximum50ms height step0.01373m. The first test approach intersected an existing junction post; the final approach retraces the already tested gaps between the posts, without changing their collisions. Hough approach24/24, both bridge walks, filtered crossing, pavement18/18 out/back and earlier outside strip28/28 pass, browser errors empty.

Full journey55/55, car switch, frontage walk and reset pass. Ride46/46 passes, maximum height jerk0.0196m, pitch step0.26degrees; Hough0.0074m/0.16degrees. Final approach, reverse and overhead screenshots inspected. These checks establish movement continuity, not local accuracy. Reference imagery remained in the browser and was not saved or distributed. OpenStreetMap and Environment Agency attribution retained. Nothing pushed.

Three flagged-viewpoint checks pass with no browser errors. Game-skill control burst, screenshot and text state inspected, no error file. The workspace client copy uses the installed Playwright, macOS Metal renderer and world-load wait; original dependency resolution failed and the SwiftShader run timed out. Code/document formatting and whitespace checks pass.

## Gates and noticeboard, v0.3.123

5 October2026. Rechecked loaded Aug2022 IjY heading135, pitch-5, fov50 in the browser. Vehicle leaf has six horizontal bars and a middle stiffener; the pedestrian gate has a curved five-rail enclosure on the brook side. The black-framed noticeboard stands just beyond it. Five pale sheet groups are distinguishable, but their text is not modelled. Gate location follows the mapped lane/path join; size, enclosure plan, board position and sheet dimensions are fitted estimates. No measured accuracy or current gate state is claimed.

The vehicle leaf is closed and solid. The pedestrian leaf is held pointing into the enclosure, with a walk around its free end. This fixed leaf position is a game choice, following the existing passage-gate approach; no swinging interaction is added. Every rail run/leaf and the board register collision lines. The enclosure is fitted to give the controller clearance; exact real dimensions remain open. It is not presented as a surveyed accessibility width.

The brook-side paving gains a fitted1.1m local bulge at the gate, tapering away by3.8m. The terrain formation, movement outline and low wall follow that same change. The rest of the entrance retains v0.3.122 heights. The bulge is a gameplay/reference fit, not a newly surveyed edge.

Final Hough/Hall walk completes49/49 targets through the pedestrian enclosure out and back with normal inputs, max50ms height step0.01452m. Early test approaches cut the cage-mouth post and leaf corner; the final route walks around both. Their collisions are retained. Hough approach24/24, both bridge walks, filtered crossing, pavement18/18 and outside strip28/28 pass. Full journey55/55, car switch/frontage/reset pass. Ride46/46 retains0.0196m maximum jerk/0.26degrees pitch step; Hough0.0074m/0.16degrees. Three flagged viewpoints pass, browser errors empty. Build/TypeScript/oxlint pass. Game-skill controls, screenshot and text state inspected, no error file, using the previously adapted workspace client.

Still open: hinges/latch shape, exact gate/enclosure dimensions and position, sheet layout/board size, lamp/bin/left fence and parking boundary, full lane edges/cabinet, actual worn path transition and user comparison. M26e remains the next connected surface/bank job. Reference media remain browser-only. Nothing pushed.

Dedicated `npm run test:hall-gate` passes. Direct normal-input car approach stops1.25003m before the vehicle leaf, speed below0.1m/s, browser errors empty. Final unobstructed approach/reverse/overhead views inspected after resetting the test car. Format/whitespace checks pass.
