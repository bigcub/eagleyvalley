# Bridge Mill showcase pass

Local v0.3.157, 7 October 2026. User photos supplied today, reference only and not saved in the repo: No.3's front door (front-on and both directions along the frontage), the view left, right and straight ahead from No.3's door, No.3's rear garden from the house, and the rear elevation from the back of No.3's garden.

## Measured from the photos

Scale is taken from No.3's door, assumed 2.05m tall in the front-on view (about 284px/m at the wall plane). Dimensions are scaled from that, not surveyed.

| Feature                       | Photo                                                                                                                                                                                        | Before                                     | Now                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Walling                       | Coursed rock-faced sandstone, blocks about 0.15–0.22m high and 0.3–0.7m long, buff to grey with some ochre and green-grey stones, pitted faces, pale recessed joints, greener near the base  | Generic 0.25m courses of large flat blocks | `bridgeStone` procedural texture with bump map (3m tile), moss wash on the lower 1.3m front and 1.0m rear |
| Sashes, front                 | 15-over-15: five panes across, three rows per sash, white frames straight into the stone                                                                                                     | 12-over-12 with a dark border              | Five-pane width, white frames, tooled lintels and sills (`bridgeDressing`)                                |
| Ground-floor front windows    | Sill about 1.0m above the flags, top about 3.15m                                                                                                                                             | About 0.5m lower                           | Raised (centre 2.08m above the passage)                                                                   |
| Doors                         | Six-panel leaf about 0.88 x 2.0m, white pilasters 0.30m wide with three panels, rail, 5x2 transom across the full surround, tooled lintel, carriage lantern on the lintel, single stone step | 1.22m leaf, smaller surround               | Rebuilt to these proportions for all four doors                                                           |
| No.3 pots                     | Two black glazed planters                                                                                                                                                                    | Potted topiary                             | Black glazed planters; other doors keep topiary                                                           |
| Setts                         | Small domed setts about 0.14m wide and 0.2–0.3m long, laid end-on in staggered lines running towards the retaining wall, strong green moss in every joint                                    | 0.23–0.30 x 0.33–0.53m rounded boxes       | Low-poly domed setts at that size and orientation over a green moss bed, greyer palette                   |
| Retaining wall and raised bed | Dark grey slatey dry-stone in thin courses, some paler and brownish stones, flat coping                                                                                                      | Near-black rubble texture                  | `bridgePassageWall` (2.5m tile) on the retaining face, upper wall body and raised bed                     |
| Rear                          | White frames into the stone, pale lintels and sills, single No.3 downpipe, grey painted patio screens                                                                                        | Dark frame surrounds, near-black screens   | White frames, dressed lintels and sills, lighter blue-grey screens                                        |
| Brook-end hedge               | About 2.7m, scaled from the 1.0m iron gate                                                                                                                                                   | 1.95m                                      | 2.7m, lighter green                                                                                       |
| No.3 garden                   | All lawn (user: ignore the bark, just turf it); apple tree back left, about 3.8m tall with a 5m crown                                                                                        | No tree                                    | Apple tree at about X90.3 Z-4.2 with fruit                                                                |

## v0.3.158 passage planting and props

From the left, right and straight-ahead views from No.3's door: pieris, box balls and ferns in the raised bed (X82.4–89.7); ivy spilling over the coping at about X89.3–90.8 and X85.6–87.2; two terracotta pots and a dark grey rattan storage box against the wall between the bed and the trellis (about X90–91.6); Virginia creeper, mostly green with some yellow and a few red leaves, over the trellis opposite No.2. The bed coping is dark slatey stone. Level ray picks show the rendered retaining face 0.28m in front of `passageWallZ` along X86–98, so props are placed from the face. Plant sizes, counts and exact positions are estimated.

## v0.3.159 frontage pots

The doorway topiary from the earlier frontage photos is kept. From today's views along the frontage, added in the free gaps between light-well copings and doorway pots: two blue glazed pots at about X84.4–84.8, a dark green planter with a young multi-stem tree at X93.8, and hydrangea pots at X96.9–97.3, 99.95 and 103.2. Plant species and sizes are estimates.

## Not established

- The yellow marks drawn on the garden photo (two vertical lines at the edge of the curved lawn): meaning asked.
- Rear sash pane counts: the rear photo is too small to count; rear sashes keep four panes across.
- Eaves: the EA 2022 DSM suggests the south eaves about 6.7–6.9m above the passage against the modelled 7.2m; not changed, because the rear openings confirmed from IMG_8691 depend on it.
- West-end window count still derives from wall length.
- Whether the ochre topiary pots are still there (today's photos show blue, grey and planted pots near the doors).

## Validation

Build, TypeScript and oxlint pass. Game views were matched to each photo viewpoint and inspected. Journey 55/55 with vehicle switch, frontage walk and reset; garden walk 66/66 with maximum height step 0.078m (unchanged); passage gate walk 24/24; ride 46/46 with jerk 0.0196m and pitch step 0.26°, render 8.0ms against 8.6ms before (the new setts use far fewer vertices).
