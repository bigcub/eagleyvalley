# Bridge Mill parking court — M24

Local v0.3.81, 3 October 2026. User requested corrected spaces, removal of the mess at the house ramp and improvements across the court.

## Evidence and limits

Google Maps aerial views centred at 53.61366,-2.42752 and 53.61374,-2.42770 were inspected in the browser. Acquisition date was not displayed; 2026 is the copyright date, not a verified photography date. Separate western, northern, eastern and southern parking groups surround lawn islands. Five occupied western positions, five northern and three eastern are visible. Cars do not establish exact painted counts. The southern three-position group is fitted provisionally beneath canopy. Bay widths/depths, island outlines, hedge and tree positions/sizes are estimates.

UP-003 is the Bridge Mill side, with modern court houses central and old Bridge Mill just off left. It supports the garage lane, door bridges and retaining relationships. It does not measure heights or cover the entire western court. The mapped court/access outline is retained; new internal outlines are interpreted. June 2024 Street View CDfj9dBpFTJh0SR2xJQ_DA heading85 supplies external Eagley Way context only. References remain reference-only, without embedded imagery. Source URLs and limits are in public/survey-sources.txt.

## Connected corrections

The former bay groups put western lines outside the court and buried some strips. A dedicated bridge-parking landmark now paints explicit fitted rows over the shared surface. Parked cars occupy southern bays. Two lawn islands, a low western hedge and one small island tree follow the aerial arrangement.

The former asphalt triangulated into the sunken house frontage. Its nearest-access-lane height also switched abruptly across the winding lane. Asphalt now follows a perimeter outside the well; the well has its own lower paving. A continuous formation rises from the court to the existing house-entry datum, shared by rendered road, terrain and movement. A misplaced stone edge and its shrubs were removed. Existing well rails block movement except at the three door bridges.

The higher passage joins through a smooth local blend. Garage-back formation yields to that blend, fixing the walking step found in testing. Heights and grades are fitted estimates, not surveyed levels.

## Checks run

Build, TypeScript and oxlint pass. Full normal-input journey passes 55/55 including vehicle switch, frontage walk and reset; garage walk 26/26 passes with maximum height step 0.05480m. Locations and Hough checks pass. Ride passes 46/46 with route jerk 0.0196m and pitch step 0.26 degrees, unchanged from v0.3.80. Timing during concurrent checks is not a performance benchmark.

New test:bridge-parking uses normal inputs for reverse parking in a marked western bay, departure, ramp drive, reverse out of the garage lane, exit and twelve door-bridge/entrance walk targets. All pass; maximum walking height step 0.02524m, no browser errors. It does not teleport to the court.

Final entrance, ramp, overhead and gameplay screenshots were inspected, with visible HUD v0.3.81. Regression confirms expected surface/collision changes locally; changed sampled heights are confined to X3..74, Z-4..42. Passing operation checks does not establish geographic accuracy. Exact bay survey, concealed planting/edges and user acceptance remain open.

## User-requested recheck, 4 October2026, v0.3.121

The user returned to the Bridge Mill car park and asked for Maps and Street View comparison. The previous M24 pass had misread the internal groups. Google Maps north-up aerial at53.61372,-2.4275, zoom19, and53.61374,-2.42778, zoom20, now distinguishes five occupied northern positions, five western positions, three central positions cut into the lawn and a separate three-position eastern row beside the modern block's west end. Occupied cars do not prove a painted count. The southern group remains provisional under canopy. The aerial acquisition date is not displayed.

Street View F136hyzlH4_-hMOcwoLSpA, displayed6 Threadfold Way, August2022, was inspected at headings90,120,155 and reverse300. Its displayed URL position53.6138813,-2.4280293 places the viewpoint near X-1.94 Z-9.05. The dates panel offers2022,2012 and2009;2022 is the latest available at this panorama. It shows the open entrance, low lawn/kerb corners, parking around the lawns, and the continuous curved rise towards the garages. It provides a better entrance reference than CDfj, which shows external Eagley Way context. No internal Street View survey or present-day confirmation is claimed.

The three central bays now point into an asphalt cut-out in the lawn, instead of projecting north into the circulation aisle. The unsupported small tree in that parking cut-out is removed. The separate eastern three-bay group is added, and the court's northern/eastern outline reaches it beside the modern block. Rendering and the existing named court terrain/ground zones use that revised outline and court formation. The narrow access ribbon is also replaced by a broad fitted entrance apron following mapped655432310 into the court. A named bridge-court-entrance-apron zone supplies terrain and movement; rendered apron and intersecting road meshes use the same grade. It blends from the sampled road datum to the existing court formation and meets that formation at the court edge. Door bridges, sunken frontage, garage lane and passage connection are retained. Bay widths/depths, cut-out and court outline are fitted estimates. Exact paint condition/counts, drain positions, boundary vegetation and levels remain open.

The parking test now drives into the central and eastern groups and reverses out, as well as retaining western parking, ramp/garage reversing and door-bridge walking. Final test drives55/55 from the start into the court, reverses into the central and eastern groups, departs, drives/reverses the garage lane and walks all12 door-bridge/ramp/exit targets. Maximum walking step0.00612m, no browser errors. Tight automated approach attempts were revised to allow turning room; the final bay targets use0.3m tolerance and correct north/south versus east/west orientation. User acceptance remains open. Reference media remain browser-only; nothing pushed.

Final entrance, ramp and aerial game views inspected at visible v0.3.121. Full journey55/55 with car switch/frontage walk/reset passes. Ride46/46 retains0.0196m maximum jerk and0.26degree pitch step; Hough0.0074m/0.16degree, matching120. Build, TypeScript, oxlint and format/whitespace checks pass. Both sampled collision grids match120. Ground/terrain changes stay at the apron/eastern court: wide bounds X-2..38 Z-12..6, core X0..39.5 Z-12.5..8.5, maximum ground1.7477m and terrain1.6977m. These cuts replace estimated grass/bank heights with the fitted formation; they do not establish surveyed accuracy.

Final Hough approach/bridge/crossing/pavement checks and three flagged-viewpoint checks pass, no browser errors. Game-skill input, screenshot and text state inspected, no error file. Nothing published.
