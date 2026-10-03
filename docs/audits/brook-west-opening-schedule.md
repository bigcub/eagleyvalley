# Brook Mill west opening schedule

3 October 2026, M12b, local v0.3.53. UP-001 aerial and UP-002 close photograph are reference only. Neither has a capture date or GPS. This schedule records visible openings; hidden wall areas do not establish a full elevation count. No dimensions are measured. The mapped main footprint and existing main-block height are retained.

| Volume and tier | Photographed evidence | Modelled openings | Limits |
| --- | --- | --- | --- |
| Lower wing, stone base | UP-002 has two small windows and a taller glazed door beneath the three tall upper openings | 2 windows, 1 glazed door | Cars, hedge and notice obscure lower portions; leaf arrangement and threshold estimated |
| Lower wing, brick tier | UP-001/002 clearly show three narrow, tall openings | 3 windows with dark paired panes, horizontal divisions, pale lintels and sills | Width, height and individual pane heights estimated |
| Lower wing, slate roof | UP-001 shows three rooflights; UP-002 crops the right-hand part | 3 rooflights on one slope rising back to the main mill | Rear roof join, rooflight sizes and pitch estimated; finial remains M12c |
| Gabled projection | UP-001/002 show continuous three-column arched stair glazing, two upper flank windows and doorway below | M12a retained: 1 arched glazed stack, 2 flank windows, 1 doorway | Arch blocks and hidden door divisions unresolved |
| Main block, top brick tier | UP-001 shows four openings to the left of the plain right-hand part and one on the right | 4 left windows, 1 right window | Sizes and spacing estimated; separate roof setback rooms remain M12d |
| Main block, next brick tier | UP-001 shows two openings on the left before the projecting gable obscures the wall; one on the right | 2 visible left windows, 1 right window | No extrapolation behind the gable |
| Main block, next brick tier | UP-001/002 show a single right-hand opening; lower wing/gable conceal the left and centre | 1 right window | Concealed openings unresolved |
| Main block, lowest brick tier | UP-001/002 show a single right-hand opening | 1 right window | Concealed left/centre unresolved |
| Main block, right stone base | UP-001/002 show masonry; no opening established in the visible area | No invented openings | Further south is cropped in UP-002 |

Positions are in the west entrance's local frame in `BROOK_WEST` in `lib/world/layout.ts`. The estimated lower wing runs u=-11.4 to -3.3, width 8.1m and depth 2.5m. Eaves are 8.1m above fitted entry level; roof rises 1.9m towards the mapped main wall. Upper wing openings run 3.8m to 7.6m above entry and are 1.05m wide. These are interpreted proportions, not exact survey dimensions.

Narrow masonry bands replace generic floor-wide strips on the west wall and continue onto the wing and gable. Stone bases meet the same fitted datum. Blue-grey frames, paired panes, lintels, projecting sills, wing gutter and two photographed join downpipes replace generic pale frames and rainwater goods. Stone weathering, colours, band heights and moulding profiles remain approximate. Lettering, lantern, finial and visible fixtures are modelled locally in M12c, v0.3.54; the roof/tower audit is next, M12d. No unreadable notice text is invented.

A named lower-wing approach now blends the fitted entry level into the existing car park plane; rendering, ground and terrain share that grade. The lower wing registers its solid footprint. The main mapped shell and independently modelled north/south/east elevations remain; this pass does not resolve their opening counts. User acceptance is open.

Validation: Build, TypeScript, oxlint and whitespace checks pass. Normal-input parking drive 54/54, marked-bay parking, reverse/exit and extended west frontage walk 27/27 pass. Largest 50ms height change on the rebuilt approach is 0.0044m. Full journey 55/55, car switch, frontage walk/reset, locations and Hough drive/bridge/crossing walks pass. Ride 46/46: route jerk 0.0196m and pitch step 0.26 degrees, Hough 0.0074m/0.16 degrees, unchanged. Step/render means 0.215/5.346ms, load 3265ms; no browser errors. Final west close/aerial and skill-client gameplay screenshots inspected; visible version v0.3.53. Regression differences in ground/terrain are confined to X62..65.5 Z-52.5..-39; collision changes to X64.5..67.5 Z-53..-44.5 for the wing. Other sampled movement/terrain/collision values are unchanged. User review remains open.
