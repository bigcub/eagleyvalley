# Current project context

Handover updated 23 September 2026. World v0.3.40. Latest pass separates the narrow road bridge from the footbridge, joins walking levels through its approaches and crossing, adds dropped kerb edges and removes duplicate north paving. The junction remains unfinished. Eagley Hall now has Claude Fable's dedicated first-pass stone model and separate brick block, still awaiting local accuracy review. Four tapered approach posts, exact kerbs and planting remain open.

## Product and current state

The user wants a recognisable reconstruction of their neighbourhood, not generic decoration. Driving, exiting/re-entering cars, walking, camera/map/pause/reset, bird mode, coordinates and exported location feedback work. No traffic, pedestrians or interiors. The scene is still visibly simplified.

Most recent user rejection: the whole Hough Lane/Threadfold Way junction looks wrong, with random objects and wrongly angled bollards. v0.3.36 changed the provisional bollard row, railing and wall returns and removed guessed shrub clusters. **This has not been accepted as accurate.** Do not stack further props on an unverified layout. Reconstruct the connected road/pavement/walls first.

## Confirmed user corrections

- Bridge Mill front and rear use the same buff stone.
- The east end facing the turning circle is blank. Earlier removal of west windows was wrong; keep west windows.
- The passage retaining wall slopes/steps; its road-facing side remains a priority and has been rejected repeatedly.
- There are two gates at the Hough Lane end: one for the cobbled passage, one for shared landscaping behind the gardens. The second is not a private garden entrance. Both model locations/proportions remain interpreted.
- Houses opposite the garages are three storeys; only the bottom floor is partly sunken. Small bridges reach the doors.
- The start building is the gatehouse. Eagley Way's street-name plate is mounted on it.
- Bridge Mill's former engine/boiler house and the Old School House need distinct models.
- The bus turning circle is at roughly X132.6,Z34.6.
- Remove the old “Find your way to Bridge Mill” box; do not reintroduce it.

## Review flags and status

Original wording, UUIDs, dates and coordinates are preserved in TODO.md.

| Location | Current status |
| --- | --- |
| X-289.6,Z158 Blackburn junction | Protruding wall clipped; full junction still open |
| X-272.2,Z136 and X55.9,Z31.6 | Reported pale path strips clipped in v0.3.30 |
| X132.6,Z34.6 turning circle | First paving/hedge pass only; still open |
| X114.5,Z25.6 Bridge Mill gates | Two entrances modelled provisionally; wall/approach accuracy open |
| X132.5,Z6.6 Hough dip | Deck uses anchors beyond abutments; gameplay passed, levels remain estimated |
| X146.4,Z-28.7 Hough/Threadfold | Rejected by user; next major correction |

## Evidence and technical cautions

Road centrelines are mapped, widths/kerb radii often guessed. Bare-earth terrain is not bridge-deck survey. Rendered surfaces, ground sampling and collisions must agree. Existing overlays and generic road-edge generation have produced overlapping white strips, gaps and inconsistent levels.

Photographs supplied in conversation show Bridge Mill doors/passage, walls, rear gardens/shared landscape, Brook Mill and river path. Recorded viewpoints include X59,Z14; interpreted X24,Z-4; X127,Z27. Original temporary photo paths may no longer exist on another machine. Ask for missing evidence instead of inventing details. Never commit personal photos without permission.

User prefers action and concise updates. They recently requested small passes because credits were low. Make each pass coherent, report limitations plainly, and do not call a passing test proof of geographic accuracy.

## Repository and local state

This repository root was originally `.../i/game`; it already had Git history before handover. Preserve that history and existing work. The parent `work/` contains historical local-only artifacts. Portable copies of the journey/location checks are now in scripts/.

World version is lib/world-version.ts, separate from package version. Increment only for visible game changes. Sites publishing remains paused; User requested no GitHub push for this pass on19September; keep changes local unless asked to push. Browser review notes belong to the user; never clear their storage during testing.

Local preview for the19September v0.3.38 pass is port3001. Port3000 was serving an older checkout; verify the visible world version before testing.

Integrated claude/discussion-bcee90 into codex/integrate-fable as v0.3.39. Generic buildings now use one inferred road-facing door rather than doors overlapping windows on every elevation. Branch-local v0.3.37 entries in progress/sources refer to Claude's separate version sequence.

World v0.3.40 adds Bridge Mill rear French doors, transoms, adjacent sash windows, lanterns, flagstone patios and solid timber dividers from user photo IMG_8274. Each house's door and patio division are user-confirmed; the five existing modelled plots and dimensions remain estimates. Dedicated module lib/bridge-rear.ts shares patio formation with terrain and registers fence collision lines.
