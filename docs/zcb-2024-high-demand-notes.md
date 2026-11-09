# ZeroCarbonBritain supply with 2024 demand levels

[zcb_2024_high_demand.json](../scenarios/zcb_2024_high_demand.json) overrides [zcb_2024](zcb-2024-notes.md). It keeps the ZCB technology mix but drops the ZCB demand reductions. Travel, flying, building fabric and industrial output stay at 2024 levels, and more renewables and biomass meet the higher demand. Land is not a constraint.

## Method

Activity, behaviour and building fabric come from the [2024 baseline](baseline-2024-notes.md). Technology comes from zcb_2024.

From the 2024 baseline:

- Lighting, appliances, cooking, catering and cooling. Gas end uses move to electricity one for one, the same sum the zcb_2024 rebasing uses.
- Space heating GW/K for each sector and the 15.3 °C base temperature, so there is no retrofit. Water heating.
- Miles per person and load factors for every passenger mode. Cars and vans 6,049 miles per person (ZCB 4,350), aviation 3,116 (ZCB 1,118).
- Industry activity at 100% with no material or energy efficiency savings (zcb_2024 has 120%, 5% and 5%).
- Land use and the UK area, so there is no new woodland, short rotation forestry, hemp or release of grazing land. This shows how much extra land the bioenergy needs.
- Agriculture, biomass burning, land use change and land use N2O emissions, which follow from 2024 land use and diet.

From zcb_2024:

- Heating system shares and heat pump efficiencies, drive train shares and efficiencies, industrial fuel shares and electric efficiencies.
- No nuclear, imports or fossil fuel. Hydro, geothermal, wave and tidal unchanged.
- Waste and process emissions, landfill biochar, and no sequestration counted for existing woodland, so emissions are on the same basis as zcb_2024.

Freight keeps 2024 activity with the ZCB drive train split. The ZCB freight inputs are scaled so their mechanical energy equals that of the 2024 freight IC demand (167.8 TWh/yr), with IC at 30%, battery electric at 80%, hydrogen at 35.64% and electric rail at 90%. The factor is 2.92.

The electric car fleet battery and charge rate scale with car miles, by 1.39.

## Supply

Offshore wind, onshore wind, solar PV and solar thermal are the zcb_2024 values times 1.48, so their proportions match ZCB. The other capacities come from a coordinate search of ten year runs that minimised total annual cost against the zcb_2024 store requirements in the [development plan](development-plan.md), phase 5: nothing unmet, methane and liquid store minimums of at least 8 TWh, a combined minimum of at least 15 TWh (tested here as the sum of the two minimums) and both stores ending at or above their start levels. Methanation keeps the zcb_2024 ratio to biogas feedstock. The results were then rounded and the H2 store kept at 10 TWh for a margin similar to zcb_2024.

| Input | zcb_2024 | High demand |
|---|---|---|
| Offshore wind (GW) | 97.4 | 144 |
| Onshore wind (GW) | 45 | 67 |
| Solar PV (GW) | 130 | 192 |
| Solar thermal (GW) | 30 | 44 |
| Electrolysis (GW) | 27 | 55 |
| H2 store (TWh) | 8 | 10 |
| Biogas feedstock (TWh/yr) | 72 | 110 |
| Methanation (GW) | 5 | 7.64 |
| Methane store, start (TWh) | 65, 20 | 100, 30 |
| FT (GW) | 10 | 26 |
| Liquid store, start and target (TWh) | 50, 20 | 100, 43 |
| Battery (GWh) | 200 | 230 |
| Battery charge and discharge (GW) | 26 | 28 |

## Results

| | zcb_2024 | High demand |
|---|---|---|
| Electricity demand (TWh/yr) | 519.4 | 830.9 |
| Of which electrolysis (TWh/yr) | 135.6 | 259.6 |
| Peak electricity demand (GW) | 95.2 | 143.5 |
| Space heat demand (TWh/yr) | 159.1 | 322.9 |
| Industry final energy (TWh/yr) | 174.1 | 161.5 |
| Liquid fuel demand (TWh/yr) | 101.9 | 217.1 |
| Methane demand (TWh/yr) | 64.8 | 93.3 |
| Biomass used (TWh/yr) | 235.8 | 432.7 |
| Excess electricity (TWh/yr) | 116.5 | 104.8 |
| Backup output (TWh/yr) | 12.3 | 28.3 |
| Peak backup (GW) | 43.7 | 71.9 |
| Methane store minimum, end (TWh) | 8.56, 29.47 | 9.91, 43.92 |
| Liquid store minimum, end (TWh) | 9.41, 25.26 | 19.57, 60.50 |
| H2 store minimum (TWh) | 0.56 | 0.32 |
| Unmet demand (TWh/yr) | 0 | 0 |
| Land used (kha) | 24,538 | 30,912 |
| UK area (kha) | 24,728 | 24,417 |
| Carbon sequestration (MtCO2e) | 41.3 | 4.4 |
| Net emissions (MtCO2e) | -6.3 | 86.3 |
| Total cost (£bn/yr) | 92.41 | 144.33 |

Biomass rises by 1.83 times against 1.48 for wind and solar, because liquid fuel demand doubles, mostly from aviation.

2024 land use already covers 24,404 kha of the 24,417 kha UK area, so all energy crops need extra land. Land use is 6.5 Mha (27%) above the UK area: miscanthus for FT 4.2 Mha, ryegrass for biogas 1.6 Mha and short rotation coppice for heat 0.7 Mha. Coppice rises from 0.4 Mha because there is no short rotation forestry.

Net emissions are 92.6 MtCO2e above zcb_2024:

- Sequestration falls by 36.9 MtCO2e with no new woodland, short rotation forestry or hemp.
- Agriculture, land use change and biomass burning emissions at 2024 levels add 42.2 MtCO2e.
- The model counts the non-CO2 effects of aviation per mile flown, 21.1 MtCO2e against 7.6.

As in zcb_2024, the first fill of the stores is not costed, so the store margins cost nothing in the model.
