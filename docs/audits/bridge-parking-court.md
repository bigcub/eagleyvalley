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
