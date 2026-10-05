# Spread Eagle reconstruction

4 October 2026, local v0.3.106. Flagbc6a9e99-20ff-448c-b69d-40fe560a5ce3 at X213.9 Z-94.7: "do the pub properly".

## References and count

August 2022 Street View: [qhk1TO3wrs1KF3ACqP29Ig headings300/245](https://www.google.com/maps/@?api=1&map_action=pano&pano=qhk1TO3wrs1KF3ACqP29Ig&heading=300), [YS-tSL7ja6wSlHszJFFsOA headings243/300](https://www.google.com/maps/@?api=1&map_action=pano&pano=YS-tSL7ja6wSlHszJFFsOA&heading=300), and [v8FsQn8ubQHvjC1ISd-kGQ headings210/260](https://www.google.com/maps/@?api=1&map_action=pano&pano=v8FsQn8ubQHvjC1ISd-kGQ&heading=260). Camera positions establish the higher painted end as the south end. The first game alignment reversed it; corrected after matching those coordinates. Imagery is historical and does not establish today's paint or fittings.

The [pub's official site](https://www.spreadeaglepub.co.uk/) confirms the identity/address at126 Hough Lane. Its website text was not used to infer opening counts or dimensions. No reference images downloaded, embedded or distributed.

| Elevation | Individually observed groups represented | Limits |
| --- | --- | --- |
| Main lower street section, north of the raised end | Three upper windows, four ground windows including one narrow light, decorative main entrance. | Centres/dimensions and glazing divisions fitted. |
| Higher southern street section | Two upper windows, one broad ground window and a plain service door. | Height difference, split position and threshold fit estimated. |
| Blue-grey south gable | One white upper window, gold pub lettering, painted masonry and pitched profile. | Lower end hidden by garden wall; no additional opening count assigned. |
| Rear/wings | Mapped wall outline and clipped roof volumes retained. | No verified rear opening inventory; pitches, wing divisions, levels and joins provisional. |

Total street front is five upper windows, five ground windows and two doors. Counts come from overlapping views, not wall length. Main entrance has broad painted posts, base blocks, transom, cornice/crest and a lantern. Painted tapered heads and dark sills, white frames, name lettering, two projecting pub signs, three visible chimney stacks and four fitted hanging baskets distinguish the pub from a house template. Eagle sign art is a simplified procedural interpretation. No copied reference pixels. Small notices, temporary furniture and blind/awning states not reproduced.

## Model and limits

Dedicated `lib/landmarks/spread-eagle.ts` replaces the former typed pub shell. OSM727434553 and fitted front schedule live in `lib/world/layout.ts`; the old street-house entry is removed. Main and raised south parts use the mapped footprint, split at an estimated6.46m from its south front corner. Roof slopes clip to that outline. Heights, widths, masonry scale, sign sizes and every interpreted dimension remain estimates. Ground windows and doors follow existing pavement heights; the model does not establish an interior floor plan or accessible entrance.

Existing terrain, roads, building colliders and boundaries retained. Geometry batches through the kit and uses normal resource cleanup. Rear openings, measured footprint/levels, true wing roofs, front setback/threshold, adjoining cottage, garden wall/gate and planting remain open. The original flag remains open for user review.

## Validation

Build, TypeScript and oxlint pass. Full journey55/55, switching cars, frontage walk/reset pass. Pub approach/return drive8/8 and pavement walk9/9 reach every target, zero browser errors. Maximum sampled height step0.01959m drive and0.06244m walk. Movement after guarded setup uses normal controls. Final flag, front, south-gable and roof views inspected at visible v0.3.106, plus bundled skill input screenshot/text state, without browser errors. Both final sample grids retain identical ground, terrain and collisions against v0.3.105. Tests prove operation, not local accuracy.
