# Street View audit

## Bridge Mill road boundary, 9 September 2026

Status: partial survey. June 2024 imagery. These two inspected panoramas are not a frame-by-frame completion of the full route.

| Position | View | Observations | Remaining work |
| --- | --- | --- | --- |
| 53.6135722, -2.4262459, roughly X116 Z25 | West uphill, heading 285 | Low dark rubble boundary curves around planted gate approach. Broad flat stone coping with moss. Dense broadleaf shrubs behind it. | Match curved return and vegetation; retain separate passage levels. |
| 53.6135367, -2.4265370, roughly X97 Z29 | West uphill, heading 285 | Low wall beside the mill becomes taller further uphill. Thin roadside strip, no full pavement on mill side. Coping is broad and flat. Lamp column stands by wall. | Trace where height changes; compare reverse view and intermediate panoramas before altering profile again. |

References:
- https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=53.6135722,-2.4262459&heading=285
- https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=53.6135367,-2.426537&heading=285

The current v0.2.5 model removes the oversized wall but is not accepted as accurate. Do not infer a uniform height from these views. Continue uphill through each available panorama, inspect both sides and reverse views, and record matched game views before marking this section complete. Exact dimensions remain unmeasured.

## Uphill continuation and reverse view

Inspected the next navigated panorama at 53.6135558,-2.426847, June 2024, approximately X76 Z27. Forward uphill shows a taller dark wall with rough upright coping. Rotating toward the mill shows the taller section ending abruptly near the lamp/sign column, then a lower section with flat slabs. The mill and former engine-house roof are visible behind it. This resolves the coping distinction and confirms a step rather than a uniform low wall. The interpreted transition X94 and heights are not measured.

Reference: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=53.6135558,-2.426847&heading=30

v0.2.6 models the taller west roadside section, individual upright coping stones and lower flat-coped east section. Further intermediate panoramas, exact alignment/transition measurements and matching gate-end planting remain open.

## Gate returns, v0.2.7

Revisited June 2024 at 53.6135722,-2.4262459, rotating east from the uphill view. Narrow iron gate is recessed from the road; stone returns flare out and curve into the roadside boundary, with broad flat coping. Left bank is densely planted; right side is lawn around a mature tree. Model now flares the low returns rather than using parallel block rows. Exact entrance levels, paving and connection to the long boundary remain unresolved. The bank between mill wall faces now has an explicit continuous surface to eliminate terrain-grid gaps; this is a rendering correction, not a new elevation measurement.

## Brook Mill north and west, v0.3.0

Surveyed two consecutive June 2024 positions from the northeast bend to 53.6143587,-2.4265031, rotating south/up at the second. The street-facing north elevation has alternating windows and balcony recesses, stone lowest storey, dark frames, thin rails and a cornice above storey three. The near northeast road surface is asphalt. Foliage obscures some bays and the entrance; this is not an every-panorama completion.

Overhead view at 53.61412,-2.4267, zoom 20 and 19: low grey roof, perimeter parapet, eight fixtures, four-facet tower cap; west parking aisles, north entrance and hedge islands. Existing OSM access lanes provide the layout anchors. Modelled north elevation, roof details and initial parking formation. West/east/south opening schedules, exact tower/porch, all bay counts, drains and planted beds remain open. Do not mark Brook Mill fully accurate.
