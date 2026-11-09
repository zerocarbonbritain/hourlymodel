# ZeroCarbonBritain high demand, v2

[zcb_2024_high_demand_v2.json](../scenarios/zcb_2024_high_demand_v2.json) overrides [zcb_2024](zcb-2024-notes.md). It is [zcb_2024_high_demand](zcb-2024-high-demand-notes.md) without geothermal, tidal, wave and new solar thermal. Solar thermal stays at its 2024 level (0.5 GW). The demand side is unchanged. [build_zcb_2024_high_demand_v2.py](build_zcb_2024_high_demand_v2.py) builds it.

## Method

Wind and solar keep the zcb_2024 proportions and scale together. The other capacities come from a coordinate search of ten year runs on the cost to society, against the zcb_2024 store requirements in the [development plan](development-plan.md), phase 5: nothing unmet, methane and liquid store minimums of at least 8 TWh, a combined minimum of at least 15 TWh and both stores ending at or above their start levels. Store start levels are held at the zcb_2024_high_demand values (30 and 43 TWh). The search covers electrolysis, the H2 store, biogas feedstock, FT, the battery, the CCGT share of backup and both store sizes. Methanation keeps the zcb_2024_high_demand ratio to biogas feedstock.

The wind and solar scale comes from a sweep, with the other inputs searched at each scale:

| Scale (times zcb_2024) | 1.626 | 1.58 | 1.54 | 1.50 | 1.47 | 1.44 |
|---|---|---|---|---|---|---|
| Society cost (£bn/yr) | 159.00 | 158.16 | 157.44 | 157.32 | 157.04 | 157.32 |

The optimum is flat. Lower scales use more biogas and FT, and so more land.

## Inputs

| Input | High demand | v2 |
|---|---|---|
| Offshore wind (GW) | 144 | 143.2 |
| Onshore wind (GW) | 67 | 66.2 |
| Solar PV (GW) | 192 | 191.1 |
| Solar thermal (GW) | 44 | 0.5 |
| Geothermal electric and heat (GW) | 3, 2 | 0 |
| Tidal, wave (GW) | 0.5, 0.1 | 0 |
| Electrolysis (GW) | 55 | 62.9 |
| H2 store (TWh) | 10 | 7.55 |
| Biogas feedstock (TWh/yr) | 110 | 139.8 |
| Methanation (GW) | 7.64 | 9.71 |
| Methane store (TWh) | 100 | 127 |
| FT (GW) | 26 | 30.6 |
| Liquid store (TWh) | 100 | 94.7 |
| Battery (GWh) | 230 | 221.5 |
| Battery charge and discharge (GW) | 28 | 24.95 |
| CCGT share of backup (GW) | 100 | 42.7 |

## Results

| | High demand | v2 |
|---|---|---|
| Excess electricity (TWh/yr) | 104.8 | 65.7 |
| Backup output (TWh/yr) | 28.3 | 36.9 |
| Biomass used (TWh/yr) | 432.7 | 464.8 |
| Land used (kha) | 30,912 | 31,586 |
| Ryegrass for biogas (kha) | 1,611 | 2,244 |
| System cost (£bn/yr) | 144.33 | 144.73 |
| Heat and biomass (£bn/yr) | 8.18 | 2.38 |
| Networks (£bn/yr) | 31.85 | 31.77 |
| Society cost (£bn/yr) | 162.11 | 156.90 |
| Consumer cost after tax (£bn/yr) | 196.73 | 188.79 |
| Retail unit rate (p/kWh) | 28.86 | 26.46 |
| Household electricity bill (£) | 1,742 | 1,703 |
| Methane store minimum, end above start (TWh) | 9.91, 13.92 | 8.09, 18.65 |
| Liquid store minimum, end above start (TWh) | 19.57, 17.50 | 8.62, 14.59 |
| Net emissions (MtCO2e) | 86.3 | 86.3 |

The cost to society falls £5.2bn/yr. Solar thermal, its heat network and geothermal cost £10.6bn/yr in zcb_2024_high_demand. Wind and solar stay about the same. More electrolysis, FT and biogas use the excess electricity that the heat technologies left spare, and heat pumps meet the heat. The system cost is about the same, as heat users no longer pay for solar thermal.

The unit rate falls 2.4 p/kWh. Excess electricity falls by 39 TWh/yr, so the same generation cost is spread over more useful output. Fuel users pay for more of it.

Emissions do not change. Energy CO2 is zero in both. The 21.1 MtCO2e in the cost to society is the non-CO2 effect of aviation, and the rest of the net 86.3 MtCO2e comes from 2024 land use and agriculture.

Both stores end well above their start levels. The minimums bind, so fuel is overproduced to hold them at fixed starts. Higher start levels would meet the minimums at lower cost, but only because the first fill is not costed.

Land use rises 674 kha, mostly ryegrass for biogas. It is 7.2 Mha (29%) above the UK area, against 6.5 Mha in zcb_2024_high_demand.
