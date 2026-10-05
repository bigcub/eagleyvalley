# Brook Mill eastern parking

4 October 2026, local world v0.3.107. User flag46ea7b10-1403-4467-a153-4a4dd89f034e at X131.1 Z-35.6, groundY15.8, heading304, bird. Original comment "missing car park here". Bird position marks ground below the player.

The existing western Brook Mill parking model does not cover this eastern court. June2024 Street View shows asphalt beside the mill's east front, an open entrance at the Threadfold bend and a planted strip between the parking and the pavement. North-up aerial supports the separate outline and entrance. Trees conceal parts of the perimeter and parked cars hide markings; no capacity or bay count is claimed.

## Evidence and limits

- [June2024 north approach](https://www.google.com/maps/@?api=1&map_action=pano&pano=u-FH1MjEtHPsiNovCT23tQ&heading=245), also inspected at304. Open asphalt mouth, planted strip and parking against the east mill front.
- [June2024 junction view](https://www.google.com/maps/@?api=1&map_action=pano&pano=DQl_iPlCOrF2ekkB6nUQbQ&heading=270). Reverse view of the planting and entrance, with canopy obscuring the southern edge.
- [May2012 historical view](https://www.google.com/maps/@?api=1&map_action=pano&pano=s7X6pb71bnaHl9akbNQk8Q&heading=270). Entrance context only; does not establish current planting or markings.
- [North-up aerial](https://www.google.com/maps/@53.61414,-2.42610,20z/data=!3m1!1e3). Airbus attribution2026 is not a capture date. Mill footprint and road bend are mapped OSM anchors; paved boundary is an interpretation limited by canopy, image alignment and roof displacement.
- EA2022 DTM supplies the fitted datum. Flat inner court and smooth road connection are estimates, not a measured level survey.

Reference media were inspected in the browser, not downloaded or included in the game.

## Model

Dedicated `lib/landmarks/brook-east-parking.ts` renders the asphalt court and entrance from the shared layout outline. Named terrain and ground zones fit the inner court to its existing EA datum and blend toward the unchanged Threadfold carriageway. Perimeter levels blend to existing ground. Generic road kerbs/pavements and the junction's west kerb stop at the mouth; no raised movement kerb crosses it. Inferred canopy trunks inside asphalt are excluded. The mill footprint, existing solid boundaries and collision lines are unchanged. Road-side grass strip is preserved; detailed planting and bay markings remain queued.

## Validation

Build, TypeScript and oxlint pass. Visible world v0.3.107 confirmed. Flag, road, entrance and overhead renders inspected. Normal-control entry5/5, reverse exit5/5 and walk11/11 pass without browser errors. Maximum sampled frame height changes were0.02138m entering,0.02292m reversing and0.02903m walking. A first attempted tight U-turn reached the mill collision; final check uses parking entry and reverse exit.

Full journey55/55, vehicle switching, frontage walk and reset pass with no browser errors. Hough approach24/24, both footbridge walks and crossing checks pass with no browser errors. Bundled web-game skill client input screenshot and state inspected at v0.3.107; no error file. Ride46/46 passes with no browser errors; maximum height jerk0.0196m and pitch step0.26°, Hough0.0074m/0.16°, unchanged from the previous world. Load timing under concurrent checks is not a benchmark.

Both before/after sample grids retain identical collision arrays. Ground/terrain differences are confined to the eastern court outline, X113.5..142 Z-46.5..-26.5 on the core grid; maxima0.3004m ground and0.5393m terrain. Tests establish movement continuity, not accuracy or user acceptance. Not published.
