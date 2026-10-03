# Three-photo review, 3 October 2026

Compared with local world v0.3.51. This is an evidence audit, not completed modelling or user acceptance. No world geometry changed in this pass.

## References and location

- **UP-001, photo 1:** aerial view of Brook Mill's west entrance elevation, western car park, roof and brook edge. Clipboard filename `codex-clipboard-a79af81a-f387-4c1e-a8a3-8294121fca22.png`, 1024 × 683.
- **UP-002, photo 2:** closer view of the same west entrance, its lower wing, glazing, masonry, planting and brook-side rail. Clipboard filename `codex-clipboard-90640b4d-91c1-4aca-aa6d-7a915e2e890e.png`, 1618 × 1080.
- **UP-003, photo 3:** the Bridge Mill side of Eagley Brook. The modern Bridge Mill building is central; the old Bridge Mill building is just off to the left, with a cropped part visible. The view also shows the garage court, long and separate garages, modern block's garden elevation, terraces, roadside retaining wall and woodland steps. Clipboard filename `codex-clipboard-55df2782-9e5a-41a8-8f13-45f67583f88e.png`, 1024 × 683.

All three PNGs have no EXIF GPS or capture date. Locations are identified visually from the buildings, mapped footprints and surroundings. These are reference-only user-supplied images: neither the originals nor derivatives belong in public assets or commits. The temporary attachments may disappear; filenames and written observations do not preserve the image itself. Differing vegetation/season and parked cars cannot establish current-day changes or measured dimensions.

Brook west model anchor is roughly X64..69, Z-52..-26. The modern Bridge Mill block is around X40..64, Z0..8; the code calls it `court-houses.ts` (OSM 727427311/312/313). References to court houses below mean this modern block on the Bridge Mill side, not Brook Mill or the opposite bank. These are model/map anchors, not camera GPS or measured photo coordinates.

Current-world comparison screenshots were captured and inspected under ignored `outputs/`: `photo-audit-current-brook-west-aerial.png`, `photo-audit-current-brook-west-close.png`, `photo-audit-current-court-gardens.png`; also M10 interior/brook-edge views and the fixed court-garages regression view. Camera matching is approximate, not photogrammetry.

**User location clarification:** photo 3 is entirely a Bridge Mill-side reference. Its modern building and the old mill to the left must stay distinct; none of its facade, garden or court observations should be applied to Brook Mill.

## Findings and bounded jobs

“Confirmed” means a visible difference from the current model. It does not establish metres, hidden details or acceptance.

| ID | Evidence and model discrepancy | Discrete job and check |
| --- | --- | --- |
| PA01, confirmed | UP-001/002: main entrance is beneath the west projecting gable, with a tall dark-framed glazed opening and substantial rectangular stone surround. Current west elevation has generic basement windows and no main entrance. The existing east porch is a separate feature. | **M12a, first:** build the west entrance and clear approach. Match door/surround position; walk from the parking aisle to the threshold and back. Bottom of the door is partly obscured, so threshold and leaf details remain estimated. |
| PA02, confirmed | UP-001/002: the entrance sits in a projecting brick gabled block with visible side returns and a slate roof. The current footprint recess/windows do not form this volume. | **M12a:** rebuild the connected gabled volume before inserting door detail; compare frontal and oblique silhouette. |
| PA03, confirmed | UP-002: tall continuous stair glazing above the entrance, with a rounded arched head, pale stone voussoirs and dark mullions/transoms. Current west windows are disconnected generic openings with pale frames. | **M12a:** record the visible pane divisions and reconstruct the full glazed stack. Do not imitate it with one ordinary window per floor. |
| PA04, confirmed | UP-001/002: separate lower slate-roofed wing to the left, three tall brick-level windows and visible rooflights. Current west model is full height at that end. | **M12b:** rebuild the lower wing, roof, eaves and three photographed openings; schedule its ground openings separately. Rooflight total is unresolved where the roof is cropped/obscured. |
| PA05, confirmed | UP-001/002: west openings are asymmetrical around the gable/wing. Upper main-block openings and the right-hand vertical stack differ from the generic per-edge counts and spacing. | **M12b:** make a per-floor, per-volume west opening schedule. Record visible counts directly; do not extrapolate across concealed wall portions. |
| PA06, confirmed | UP-002: narrow repeated pale masonry bands cross brickwork, with weathered stone base, heavier cornice and different surround types. Current model has broad uniform pale floor strips and repeated pale window surrounds. | **M12b:** rebuild west masonry bands and surrounds after the volume/opening schedule. Match rhythm and material changes; colours and thicknesses remain interpreted. |
| PA07, confirmed | UP-002: blue-grey/dark frames, specific tall pane divisions, projecting sills, gutters and black downpipes. Current west windows use a repeated white multi-pane style. | **M12b:** replace the west frame/pane schedule and then place photographed rainwater goods. Reflections are not opaque painted panels. |
| PA08, confirmed | UP-002: vertical red BROOK MILL lettering beside the gable, entrance lantern and small wall-mounted fixtures. Missing on the west model. | **M12c:** add lettering, lantern and identifiable fixtures after the entrance is correct. Tiny labels and notice text are unreadable and need no invented content. |
| PA09, confirmed | UP-001: a grey roof extension/setback with windows and roof fixtures rises behind the parapet. Current roof is a flat grey polygon with a regular fixture grid. | **M12d, roof:** trace the visible setback roof volumes and openings; compare an aerial silhouette. Hidden roof edges and fixture counts remain unresolved. |
| PA10, audit needed | UP-001: circular opening visible on the far tower face. Current west-facing tower view is largely plain. Photo does not clearly establish whether this face is glazed or carries a clock. | **M12d / M14:** audit each visible tower face separately; retain the independently referenced east clock and south circular glazing until contradicted by evidence. |
| PA11, confirmed | UP-001/002: shrubs beside the west wall are compact irregular crowns with gaps and different heights. M10 uses continuous rectangular hedge volumes for the west-elevation beds. | **M10 follow-up:** place bounded individual crowns around the rebuilt wing/door, clear the entrance route and preserve both parking aisles. Reuse the corrected bed layout; do not multiply the old bushes. |
| PA12, audit needed | UP-001/002: bay heads, hatch zones, worn/coloured paint and parking immediately beside the entrance. M10 bay groups and small hatches remain approximate. Cars obscure many lines. | **M10 follow-up:** trace only visible markings and entrance clearance; mark hidden bay divisions unresolved. Keep drive/park/reverse/exit check passing. Parked car positions do not define the bay capacity. |
| PA13, confirmed | UP-002: brook-side barrier has dark substantial posts with pale horizontal rails and thinner uprights, on visible masonry; planting runs inside it. M10 is uniformly dark, thin picket rail, with no matching low planted strip or detailed retaining base. | **M10 follow-up:** rebuild rail/post sections and local inside planting from the photo; record visible retaining face separately. Top/base heights remain estimates, and the submerged/lower face is unseen. |
| PA14, confirmed | UP-003: court-house garden elevation has tall grouped white openings and ground-level garden doors. Current rear is six uniformly spaced ordinary windows per floor and no garden doors. | **M16b:** schedule this garden elevation independently of the garage-side entrance bridges, then rebuild photographed openings. Preserve three storeys and continuous roof. |
| PA15, confirmed | UP-003: court houses have separate paved patios, private lawns and timber dividing fences. Current model has an undivided grass slope beside the rear wall. | **M16b:** build three connected garden/terrace groups and timber divisions from the visible trace; walk each accessible garden-level route without sinking. Ownership edges and dimensions are not surveyed. |
| PA16, confirmed | UP-003: court-house end elevation has white openings; current west end is blank in the inspected views. | **M16b:** record the visible end openings by floor and add them. Do not invent concealed openings on the opposite end. |
| PA17, confirmed | UP-003: separate garage has two visible dark door bays and a pitched slate roof; long range has a different low roof profile with weathering/moss. Current generic generator applies a hipped roof to both. | **M15:** give both ranges dedicated roof/door schedules. The separate two-door arrangement now has photographic support. Keep the user's confirmed five long-range bays; this oblique view does not justify overriding that count. |
| PA18, confirmed | UP-003: tall roadside retaining face behind the garages, with road above and planting over it. Current garage backdrop is largely an exposed green bank with a separate dark road wall. | **M15/M17:** reconstruct the garage-back retaining section and its joins as a named level/boundary zone; keep the garage lane clear. This is not the deferred M06 passage wall. |
| PA19, confirmed | UP-003: stepped retaining beds between the higher court, lower private terraces and brook-side route. Current court edge is one low run and a grass slope. | **M17:** rebuild connected terrace levels and retaining steps before adding planting. Match overhead outlines and test court driving plus walks between the accessible levels. |
| PA20, confirmed | UP-003: brook-side garden boundary uses substantial posts/rails on a masonry retaining edge. Current scene uses a broad mesh fence and plain verge. | **M17:** audit and replace this specific boundary section, preserving the public path and keeping private garden access separate. |
| PA21, new evidence | UP-003: woodland stair route visible above the road behind the garages. M09's upper continuation is a provisional smooth path. | **M09 follow-up:** use this wider view to locate visible upper stair sections and their relationship to the road wall. Resolution/foliage still prevent a complete riser schedule or exact upper connection. |
| PA22, audit needed | UP-003: individual garden trees, clipped hedges, shrubs, lawn strips and paving occupy specific terraces. Current planting does not follow these divisions. | **M17 planting pass:** replace planting after PA15/PA19/PA20 levels and boundaries; place visible masses individually. Species, trunks behind crowns and present-day seasonal state remain estimated. |

## Work order

1. **M12a: west entrance, projecting gable, tall arched glazing and walkable threshold.** This supersedes M11 as the next modelling task because the user identified the missing entrance and supplied direct evidence.
2. **M12b: lower wing, west opening schedule and masonry.** Then M12c west fixtures and M12d roof/tower audit, each a separate pass.
3. **M10 follow-up:** correct the rail, inside strip, frontage planting and visible markings against the new photos after entrance/wing geometry is established.
4. Return to M11/M13/M14 elevation schedules; these photos do not establish complete north, south or east opening counts.
5. M15 garages, M16b photographed garden/end elevations and terraces, then M17 connected retaining levels and planting. M16's garage-side bridges remain a separate required check.

Keep confirmed corrections: buff-stone court houses, three storeys with only the lowest floor partly sunken at the entrance side, continuous roof, five long garage bays, lower separate engine house, and smooth driving. UP-003 does not show the deferred passage retaining face opposite Bridge Mill's doors, so M06 remains deferred. Photos 1/2 do not justify deleting the existing east porch or moving the east clock to the west entrance.


### M12a implementation update, local v0.3.52

PA01–03 are modelled locally: west doorway and stone surround, gabled projection with slate roof, continuous three-column arched glazing and two upper flank windows. A fitted paved approach joins the existing parking plane, and the adjacent bed ends before the entrance. Dimensions, exact threshold, arch block count and concealed door arrangement remain estimated or unresolved. User acceptance remains open. M12b is next; PA04–22 remain open. The original photo observations above describe the v0.3.51 audit baseline.


### M12b implementation update, local v0.3.53

PA04–07 are modelled locally with the lower wing, three rooflights, explicit photographed west opening schedule, dark frames, narrow masonry bands, stone base joins, sills/lintels, wing gutter and two join downpipes. [Opening schedule and evidence limits](brook-west-opening-schedule.md). Hidden openings, precise proportions, materials and user acceptance remain open. PA08–22 remain open; M12c is next.


### M12c implementation update, local v0.3.54

PA08 modelled locally: vertical red lettering, wall lantern, small entry panel, three photographed wall-fitting silhouettes and lower-wing roof ornament. Letterforms are generated text; fixture profiles, types and dimensions remain interpreted. Unreadable notice labels and ambiguous notice installation omitted. No change to movement heights or collision. User acceptance open. PA09–22 remain open; M12d roof/tower audit is next.
