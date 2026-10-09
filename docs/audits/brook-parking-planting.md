# Brook Mill parking planting

B04 first pass, local v0.3.128, 5 October 2026.

## Evidence and limits

Rechecked Google Street View June2024 panorama2KUSm8cfYQCSi6Fy7CH-YA, headings125 and215. The roadside bed has a low clipped broadleaf hedge, with an open asphalt entrance between two narrow conifers. Mature broadleaf trees also stand in the roadside strip. A separate v0.3.132 pass rechecked headings125/215 and fitted three distinct visible trunks. The visible internal planted islands support rounded low planting, but do not establish individual plant counts or every concealed edge. Existing M10 aerial interpretation supplies the bed outlines. Reference imagery is not embedded or distributed.

The former four solid green bed extrusions and smooth conifer shells are replaced by instanced small leaves, fitted crowns with branches, and feathery conifer sprays. The perimeter crowns meet along the existing bed traces; two island groups remain inside their existing rims. The four UP001/002 west-frontage shrubs retain their previous geometry. This replaces represented planting rather than extending it across parking or entrances.

Dimensions and crown centres are estimated. The roadside hedge retains its fitted1.05m height. Island groups are0.85–0.95m; conifers5.1m tall with1.05m maximum fitted radius. These are not measured sizes or a plant census. Existing bed rims register collision lines; heights, parking surfaces, movement and collision code are unchanged. At v0.3.128, eastern parking planting and mature roadside trees remained open. Eastern beds were added in v0.3.129; the roadside tree pass is recorded below. Measured bed outlines and user review remain open.

## Validation

Build, TypeScript, oxlint and whitespace checks pass. Four fixed game views inspected at visible world0.3.128, including the entrance, roadside hedge, islands and overhead. No browser errors in those captures. The game skill client completed two input bursts; screenshots and text state inspected, with no error files.

Brook parking drive54/54, reversing and exit pass. West entrance walk27/27 passes with maximum height step0.00435m and no browser errors. Full journey55/55, car switch/frontage walk/reset and isolated ride46/46 pass with no browser errors. Ride maximum height jerk0.0196m/pitch step0.26° unchanged; Hough0.0074m/0.16°. Mean render7.066ms versus the preceding isolated5.958ms sample, about1.1ms higher. These are single local samples, not an FPS guarantee.

## Roadside trees, v0.3.132

Rechecked the June2024 entrance panorama on6October2026 at125° and215°. Three distinct broadleaf trunks are visible along the roadside hedge, separate from the two narrow entrance conifers. They are represented at estimated centresX32/Z-57, X54/Z-56.5 andX61.5/Z-55.8 with fitted heights11.5m,12.5m and10.5m. These are not surveyed trunks, a species identification or a census of the whole car park. The EA canopy-peak dataset has no trunk candidates in these narrow beds; it does not establish their absence.

Each fitted trunk sits in an existing roadside planting bed, rooted at its rendered parking/bed datum. Existing road, pavement, bay layout, hedges, conifers, terrain and movement heights are retained. New trees append to the existing instanced model, preserving procedural geometry of earlier trees. Building clearance and nearby-tree duplication filters remain in place. Only reference-derived parameters are used; no source image is stored or distributed. Measured trunk locations/crown dimensions, concealed groups and user review remain open.

Build, TypeScript, oxlint, formatter and whitespace checks pass. Four fixed planting views inspected at visible WORLDv0.3.132, with no browser errors. Two skill-client driving bursts completed; screenshots and text state inspected, no error files. Brook parking54/54 with reverse/exit, west entrance walk27/27 (maximum height step0.00435m), and full journey55/55 with car switch/frontage walk/reset pass. Isolated ride46/46 passes with no errors: maximum height jerk0.0196m/pitch step0.26°, Hough0.0074m/0.16°, unchanged. Mean render7.279ms versus7.105ms in v0.3.131, simulation0.282ms, load21845ms; single local samples, not an FPS guarantee. Nothing committed or pushed.

## v0.3.135 east entrance clipped beds

Flag c70cde16. June2024 NrBn7lFZ84Dc1-Ddye6W_g headings245/285/325 show both east entrance beds filled with low, flat-topped clipped masses: broad ground cover in the south bed, lumpier shrubs round the signs in the north bed. The v0.3.129 generic shrub crowns rendered as 1.5–2m blobs. They are replaced by instanced small leaves (650/m²) on a rounded profile: 0.12m inset, 0.55m shoulder, mass heights 0.85m (north) and 0.6m (south), gentle lumps, 0.35m clear of each trunk. Bed outlines, edging, trees and signs are unchanged. Heights and profile are estimates. Still open: the car-park island tree's shrub ring, measured bed outlines and user review.
