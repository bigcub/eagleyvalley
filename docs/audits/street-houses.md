# Outer Threadfold Way, Cottonfields and Hough Lane houses

First light pass, local v0.3.96. 84 mapped houses that used the generic generator now have a house type from Street View. Model: `lib/landmarks/street-houses.ts`; per-ID table `STREET_HOUSES` in `lib/world/layout.ts`.

## Sources

| Panorama               | Date     | Camera (game X, Z) | Directions      | Used for                                                                   |
| ---------------------- | -------- | ------------------ | --------------- | -------------------------------------------------------------------------- |
| 0N-Rpc4AFucYY_73dIp2FQ | Aug 2022 | -160, -40          | 0, 90, 180, 270 | Outer Threadfold north townhouse row, western estate houses, 258/259 gable |
| gUumhreI878pOWaZQbFBXA | Aug 2022 | -140, -9           | 90, 270         | 255/256/257 and 273/274 (oculus, attached garage)                          |
| fwT3uQd6UF-u5KE5s14CHg | Jun 2024 | -124, -86          | 0, 90, 270      | Cottonfields townhouse row, cul-de-sac end houses                          |
| qhk1TO3wrs1KF3ACqP29Ig | Aug 2022 | 205, -93           | 120, 300        | Spread Eagle front, low stone cottage                                      |
| P4nxuImCWrbU2pHtno5IQA | Apr 2023 | 234, -161          | 80              | Hough Lane east terrace 975–998                                            |
| k9fM7igas8BaGDksX4o9fQ | Aug 2022 | 229, -196          | 90              | Hough Lane east terrace 575000–575009                                      |
| KnrG3stULULRcdylLOmhBw | Aug 2022 | 235, -241          | 60, 250         | Terrace 575012–575018; west-side 574987–989                                |

Camera coordinates are converted from the panorama position, not surveyed.

## Types

| Type      | What is modelled                                                                                                              | Evidence                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| estate    | Two-storey buff reconstituted stone, grey roof, white frames, door canopy, white garage door where marked and wide enough     | Photographed type             |
| townhouse | Three storeys: buff stone garage storey, red brick above, stone bands, Juliet balcony over the garage, door beside it         | Photographed type             |
| terrace   | Two-storey Victorian terrace, facade per house (red/dark brick, gritstone, white/cream render), stone heads and sills, stacks | Photographed type and facings |
| cottage   | Single-storey gritstone, stone-slate roof, gable stack                                                                        | Photographed (574974)         |
| pub       | Spread Eagle: two-storey gritstone, dark painted door surround and window dressings, end stacks                               | Photographed front            |

## Limits

- Opening counts follow the type, not a count per house. Rear windows are placeholders: no rear views were taken.
- `seen: false` houses carry their type from visible neighbours.
- Hough Lane facing sequences were read from oblique views and may be one house out.
- Storey heights, roof pitch, opening sizes, chimney and downpipe positions, door colours: estimated.
- The roof is a dual pitch clipped to the mapped footprint, ridge parallel to the front. Set-back parts of L-shaped plans get a raised wall to meet it; real garage wings are often lower.
- v0.3.97 frontages (`lib/landmarks/street-frontages.ts`): townhouse forecourts, estate drives and door paths, terrace/cottage garden walls with gate gaps. Wall height 0.8m, widths and the extent of block paving are estimates; the panoramas show paving in front of the townhouses but no measured edges. Houses less than 0.8m or more than 12m from the pavement, and frontages that would cross another road, have none.
- Not yet modelled: arched eyebrow dormers and front gables on the Threadfold estate houses, bays, porches beyond 727575013, dormers, garden planting, side windows at row ends, the Spread Eagle signage and full window count.
- 727427256 is modelled as one 5.2m townhouse facing east; the panorama suggests a wider three-storey front. Check before the next pass.
- Collisions, ground and terrain are unchanged.
