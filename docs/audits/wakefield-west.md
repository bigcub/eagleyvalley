# Wakefield Mews west group

4 October 2026, local v0.3.104. Flag 6599a642-58d9-4493-8e2e-97aba86fbb26 at X-79.4 Z-21, heading269: "these houses are still unstyled". The earlier courtyard model omitted the western 727427279–281 row and attached garage727427282.

## Evidence and model

Re-inspected [August 2022 Street View](https://www.google.com/maps/@?api=1&map_action=pano&pano=0Yod2ZQokKJ2ZbLVcse4YA&heading=275), headings250,269,275 and0. Camera position about X-79.8 Z-16.9. Mapped footprints anchor the south-to-north assignment; GPS error and foliage limit it. This historical view does not establish present-day alterations. Reference imagery was viewed only, without downloading or distributing it.

| Footprint | Individually visible front features represented | Limits |
| --- | --- | --- |
| 727427279, southern house | Buff masonry, front gable; three separate narrow ground windows below one upper group; entry and broad three-light ground group to its right; two upper lights with rounded stone heads. | Opening dimensions, centres, gable width and roof pitch estimated. |
| 727427280, middle house | Buff masonry, second front gable, partly visible upper group and a ground group/entry. | Tree conceals much of the front. No inferred complete opening count. |
| 727427281, northern return | Two rectangular window groups (one ground, one upper), entry and a separate round stair window; plain pitched roof. | Round diameter and all spacing fitted estimates. |
| 727427282, attached garage | Lower pitched roof and two pale doors. | Heights, door dimensions and concealed return details estimated. |

The timber-clad bay further south is outside these four footprints. Northern 727427288/289 and the southern corner remain separate jobs. Hidden rear/end openings, rooflights, small vents, exact roof intersections, drives, garden edges and planting remain unresolved. No rear opening counts invented.

Dedicated module `lib/landmarks/wakefield-west.ts` replaces the four generic volumes; IDs and front edges live in `lib/world/layout.ts`. Front masonry UVs follow each facade. Geometry batches through the kit. Existing mapped building colliders and movement surfaces are retained. The maximum sampled front ground sets a shared fitted row datum; this is not a measured threshold level.

## Validation

Build, TypeScript, oxlint and whitespace pass. Full journey55/55, vehicle switch, frontage walk and reset pass. Wakefield drive4/4 and frontage walk7/7 pass with normal inputs after guarded setup, zero browser errors; maximum steps0.00544m driving and0.01890m walking. Both regression grids have identical terrain, ground and collision arrays; expected building/material geometry changes are reported. The gable-valley overlap and inward-facing roof-end masonry found in the first screenshots were corrected and rebuilt. Flag, matching street and south oblique views inspected at visible v0.3.104; bundled skill input screenshot/text state checked. Passing checks establish rendering and movement, not local accuracy or user acceptance. The original flag remains open for review.
