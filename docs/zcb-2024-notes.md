# ZeroCarbonBritain from the 2024 baseline

[zcb_2024.json](../scenarios/zcb_2024.json) applies the ZeroCarbonBritain scenario to the [2024 baseline](baseline-2024-notes.md). Like the other scenarios it overrides [zerocarbonbritain.json](../scenarios/zerocarbonbritain.json), so every input it does not set keeps its ZCB value.

## Method

The 2019 ZCB scenario used baselines from 2007, 2010 or 2017 depending on the sector, and a 2030 population of 70.5 million ([methodology papers](../ZCB-Methodology-Papers-2019.pdf), section 1). Its inputs do not share definitions with the rebuilt baselines. For example ZCB industry demand is 1.3 times the 2018 baseline. The 2018 baseline is used below as the nearest rebuilt equivalent. Copying ZCB demand values next to 2024 values would mix the two bases, so demand quantities are rebased:

new value = ZCB value × 2024 baseline value / 2018 baseline value

This keeps the change ZCB makes relative to current demand. Where the baseline splits a quantity into electric and gas parts (cooking, catering, cooling, services lighting and appliances) the ratio uses the sum of both.

Rebased inputs:

- Lighting, appliances, cooking, catering and cooling.
- Space heating GW/K for each sector. Both baselines use a 15.3 °C base temperature, so the GW/K ratio equals the heat demand ratio. The ZCB base temperature of 13.07 °C is kept.
- Water heating.
- Industry end use demand.
- Freight demand, scaled by the change in freight IC demand.
- Positive non-energy emissions where the 2018 baseline is also positive. Zero and negative ZCB values (wetland restoration, landfill carbon capture) are kept.

Population and households are the 2024 baseline values.

Kept from ZCB without change:

- Per person travel by mode. Car and van travel is 4,350 miles per person against 6,049 in 2024, and aviation is 1,118 against 3,116.
- Heating system shares and efficiencies, transport drive train shares, industry fuel shares and demand side response.
- Storage, electrolysis and hydrogen storage. Methane comes from anaerobic digestion with the biogas upgraded by methanation. Power to X stays at zero.
- Land use, hydro and geothermal.
- No nuclear, no imports and no fossil fuel backup.

## Supply

Wave is reduced from 10 GW to 0.1 GW and tidal from 20 GW to 0.5 GW, removing 65.5 TWh/yr. Onshore wind rises from 30 GW to 45 GW (+38.3 TWh/yr) and solar PV from 90 GW to 130 GW (+33.1 TWh/yr).

Rebased demand is lower than ZCB, so supply is trimmed until the stores no longer fill well beyond their starting levels:

- Offshore wind 140 GW to 120 GW.
- Biomass for biogas 88 TWh/yr to 85 TWh/yr, with methanation scaled from 4.93 GW to 4.76 GW to match the biogas CO2. At 80 TWh/yr the methane store runs empty.
- FT synthetic fuel capacity is 9.7 GW, the same as ZCB. At 9.6 GW or below the synthetic fuel store empties in the first winters and leaves demand unmet.

## Changes to the ZCB default

The same store balancing was applied to [zerocarbonbritain.json](../scenarios/zerocarbonbritain.json). With the original values the methane store finished at 37.7 TWh from a 10 TWh start, and the FT plant (9.15 GW) left 4.0 TWh/yr of synthetic fuel demand unmet.

- Biomass for biogas 92 TWh/yr to 88 TWh/yr, with methanation from 5.15 GW to 4.93 GW. At 85 TWh/yr the methane store runs empty.
- FT synthetic fuel capacity 9.15 GW to 9.7 GW.
- Offshore wind stays at 140 GW. At 135 GW the methane store runs empty.

The only other scenario affected is `fes_2022`, which inherits methanation capacity. Its biogas input is small enough that methanation output is unchanged, so only the methanation cost changes (£0.01bn/yr).

## Results

| | ZCB | ZCB 2024 |
|---|---|---|
| Electricity demand (TWh/yr) | 645.6 | 586.4 |
| Space heat demand (TWh/yr) | 181.9 | 159.1 |
| Industry demand (TWh/yr) | 288.0 | 248.9 |
| Excess electricity (TWh/yr) | 147.9 | 138.9 |
| Backup generation (TWh/yr) | 14.6 | 16.1 |
| Peak backup (GW) | 47.6 | 45.7 |
| Unmet synthetic fuel (TWh/yr) | 0 | 0 |
| Methane store end, start 10 TWh (TWh) | 23.7 | 24.0 |
| Methane store minimum (TWh) | 7.3 | 5.8 |
| Synthetic fuel store end, start 5 TWh (TWh) | 12.3 | 15.5 |
| Spare land (kha) | 82 | 290 |
| Net emissions (MtCO2e) | 0.0 | -6.3 |

All electricity, heat, methane, hydrogen and synthetic fuel demand is met.
