# Status

Updated 23 September 2026. World v0.4.0.

## Where it stands

The game plays end to end. You can drive from Blackburn Road down Eagley Way, round Threadfold Way and into the Bridge Mill court, swap cars, walk the passage, fly in bird mode, drop feedback flags and use the map. There's no traffic, no pedestrians and no interiors.

Geographically it's unfinished and the user has rejected parts of it. Mapped road centrelines and EA terrain are sound. Road widths, kerb radii, wall heights and most building details are estimates. Most houses still come from the generic generator: a red brick box with a hipped roof and windows spaced by wall length. Those are placeholders, not models.

The engine was restructured on 23 September 2026 (see `AGENTS.md` for the layout). Roads now come from one network generated from the OSM centrelines (v0.4.0): junctions, kerbs, pavements, markings and walking height all come from the same geometry, so the old overlapping strips and floating pavement lobes are gone. Road widths and pavements use a per-road spec in `lib/world/road-spec.ts`; most entries are still defaults.

## Rejected by the user, still open

- The Hough Lane/Threadfold Way junction (flag 9217d4a4). v0.4.0 rebuilt it as one connected layout from four Street View panoramas; it needs the user's review before it counts as accepted.
- The Bridge Mill wall as seen from Eagley Way. The road-facing boundary and the passage retaining face need auditing separately.
- The bus turning circle (flag 34419932) has one rough pass and needs a real island outline, hedge and furniture.
- The Blackburn Road junction (flag 88bc3dbf). The wall no longer sticks into the road, but the corner, pavement and markings are unchecked.
- The Brook Mill car park, the bushes, and window counts on every building.

## Next, in order

1. **Hough Lane junction review.** v0.4.0 is built; get the user's verdict, then fix what they flag. Review the Eagley Hall model against references at the same time.
2. **Bridge Mill boundaries and entrances.** Both gates and their approaches, the sloping roadside wall, engine house, turning circle, garage court and the court-house door bridges. Use user photos where Street View can't reach.
3. **Continuous route audit.** Resume at EAG-026 (below), finish lower Eagley Way, then the Hough and Threadfold loop and the mill approaches, backfilling side and reverse views. Correct one section fully before moving on.
4. **Buildings and landscape.** Per-building massing and opening schedules, starting with Brook Mill, the School House and the gatehouse. Then walls, brook edges, and tree and shrub positions. Replace the generic foliage only once positions and sizes are known.
5. **Rendering.** Sky, lighting, ground and road materials, better trees and a proper car. This lifts the whole map but shouldn't come before the layout fixes above.

For each pass, name the evidence and the scope, build it, check the changed views and movement, then update TODO.md, progress.md and the sources file. Leave unverified details marked open.

## Street View coverage

No section is accepted as accurate. [SURVEY.md](../SURVEY.md) is the panorama-by-panorama register.

| Area | Inspected | Missing |
| --- | --- | --- |
| Blackburn entrance, upper and middle Eagley Way | EAG-001 to 026 plus 002A/B/C, June 2024. Forward sequence, some side and reverse views | All four directions at every panorama, object inventory, matched game views |
| Lower Eagley Way past EAG-026 | Isolated mill-end views only | Continuous sequence to Bridge Mill; where the plain wall really ends |
| Bridge Mill roadside and passage boundary | Views around X76, 97 and 116 (June 2024); user passage photos | Every intermediate and reverse view, heights, joins, gate alignment |
| Hough Lane bridge and junction | GXaLJ6-lQQXM-ZBvWlBeyw, DQl_iPlCOrF2ekkB6nUQbQ (June 2024); CD44JCXYHZPTLGAoXPEVlg (Aug 2022); three approach panoramas; aerial bend | Full approach, reverse and side sequence; overhead kerb trace |
| Bus turning circle | o630WlJgG1IIouCJdb9kHw (Aug 2022), one June 2024 view | Full loop, island trace, bus furniture, trees |
| Threadfold Way | Isolated north-boundary and junction views | Whole loop, every frontage, entrance, wall and planting |
| Mill courts, garages, gardens | User photos, aerial interpretation | Boundaries, bay counts, hidden elevations, levels. Street View doesn't reach the private court |
| Wider area | Mapped footprints, terrain, a few landmarks | Systematic street, building and vegetation audit |

Forward resume point: **EAG-026**, June 2024, camera 53.6131045, -2.4285779 (about X-38, Z77), panorama `RJ78tVUTMnIxHbpiwCJFJQ`, headings 82 and 172 done. [Open it](https://www.google.com/maps/@?api=1&map_action=pano&pano=RJ78tVUTMnIxHbpiwCJFJQ&heading=82). The modelled plain retaining wall ends at an estimated X-40. Don't extend the yellow lines into this stretch by guesswork.

Junction references: [Hough/Threadfold junction](https://www.google.com/maps/@?api=1&map_action=pano&pano=DQl_iPlCOrF2ekkB6nUQbQ&heading=154), [bridge reverse view](https://www.google.com/maps/@?api=1&map_action=pano&pano=GXaLJ6-lQQXM-ZBvWlBeyw&heading=349), [Bridge Mill gates](https://www.google.com/maps/@?api=1&map_action=pano&pano=Ol5x2LtTib6ZgLsg_puNUA&heading=315).

A section is finished when every available panorama and direction is recorded with its gaps, features are inventoried, geometry is rebuilt as one connected piece, matching road-level screenshots are compared both ways, driving and walking pass, and the user has reviewed it. Track inspected, modelled, tested and accepted separately.

## Publishing and local state

Sites publishing has been paused since 10 September 2026. The live site is v0.3.3 (Sites version 9). GitHub `origin` is a private backup, updated only when the user asks. `npm run preview` serves `dist/client` on port 3000; rebuild after source changes and check the visible world version.
