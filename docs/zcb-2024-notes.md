# ZeroCarbonBritain from the 2024 baseline

[zcb_2024.json](../scenarios/zcb_2024.json) applies the ZeroCarbonBritain scenario to the [2024 baseline](baseline-2024-notes.md). It is the default scenario and sets every input. Other scenarios override it.

It was first written as a set of overrides on the 2019 ZCB scenario, then merged with it into one file. The 2019 scenario and the older scenarios are kept in [scenarios/archive](../scenarios/archive/). Comparison with the published 2019 results is done outside this repository.

## Method

The 2019 ZCB scenario used baselines from 2007, 2010 or 2017 depending on the sector, and a 2030 population of 70.5 million ([methodology papers](../ZCB-Methodology-Papers-2019.pdf), section 1). Its inputs do not share definitions with the rebuilt baselines. For example ZCB industry demand is 1.3 times the 2018 baseline. The 2018 baseline is used below as the nearest rebuilt equivalent. Copying ZCB demand values next to 2024 values would mix the two bases, so demand quantities are rebased:

new value = ZCB value × 2024 baseline value / 2018 baseline value

This keeps the change ZCB makes relative to current demand. Where the baseline splits a quantity into electric and gas parts (cooking, catering, cooling, services lighting and appliances) the ratio uses the sum of both.

Rebased inputs:

- Lighting, appliances, cooking, catering and cooling.
- Space heating GW/K for each sector. Both baselines use a 15.3 °C base temperature, so the GW/K ratio equals the heat demand ratio. The ZCB base temperature of 13.07 °C is kept.
- Water heating.
- Freight demand, scaled by the change in freight IC demand.
- Positive non-energy emissions where the 2018 baseline is also positive. Zero and negative ZCB values (wetland restoration, landfill carbon capture) are kept.

Population and households are the 2024 baseline values.

Kept from ZCB without change:

- Per person travel by mode. Car and van travel is 4,350 miles per person against 6,049 in 2024, and aviation is 1,118 against 3,116.
- Heating system shares and efficiencies, transport drive train shares.
- Storage, electrolysis and hydrogen storage. Methane comes from anaerobic digestion with the biogas upgraded by methanation. Power to X stays at zero.
- Land use, hydro and geothermal.
- No nuclear, no imports and no fossil fuel backup.

## Industry

Industry no longer uses the rebased 2019 values. The 2019 scenario took 2007 industrial demand (331 TWh), scaled it by 1.16 for population growth and onshoring and by 0.75 for lower energy intensity, giving 288 TWh, 0.87 times 2007 demand but 1.5 times 2024 demand. Rebased to 2024 this was 248.9 TWh, 30% above 2024 demand.

Heat end uses are now useful heat, with a conversion efficiency for electricity and for fuels. Demand starts from the 2024 baseline: useful heat for high temperature process (21.7 TWh), low temperature process (43.3), drying and separation (11.1) and other heat (22.1), and final energy for the other end uses. Refineries stay at 0. Three levers scale every end use:

- `activity_prc`, industrial output relative to 2024: 120.
- `material_efficiency_prc`, the demand reduction from material efficiency (fewer tonnes): 5.
- `energy_efficiency_prc`, the demand reduction from heat recovery and process improvements other than fuel switching: 5.

Together they scale demand by 1.2 × 0.95 × 0.95 = 1.08. Population is held at 2024, so the 20% growth in output stands for more manufacturing in the UK, mainly materials and equipment for the energy system, as the 2019 scenario also assumed. It is below the CCC Balanced Pathway, where industrial GVA grows 28% to 2050, and GVA usually grows faster than the output of energy intensive industry. The efficiency savings are modest. In the CCC pathway resource efficiency and energy efficiency each give 6 to 7% of the industry abatement in 2040. They are kept separate because they will apply at different points once steel and cement have material based models.

Fuel efficiencies are the baseline values. Electric efficiencies stand for the zero carbon technologies:

| End use | Fuel | Electric | Basis |
|---|---|---|---|
| High temperature process | 60% | 75% | Electric furnaces, about 80% of fuel fired final energy (JRC-IDEES 2021) |
| Low temperature process | 80% | 195% | 80% of heat from heat pumps at COP 2.55 (CCC 2025), 20% from electric boilers |
| Drying and separation | 65% | 130% | Half heat pump or MVR drying at COP 3, half direct electric at 83% |
| Other heat | 80% | 100% | Electric boilers |

The ZCB fuel shares and demand side response are kept, now as shares of useful heat. Demand side response heat uses the same efficiencies, so for low temperature process heat it is a heat pump with a fuel backup.

Industry final energy falls from 248.9 to 173.5 TWh/yr, of which electricity 106.9 (was 170.4), methane 40.7 (48.3), synthetic fuel 6.5 (7.5) and biomass 19.4 (22.7). This is 10% below 2024 industrial final energy (191.7 TWh). The CCC Balanced Pathway has 196 TWh in 2050, 73% electricity.

## Supply

Wave is reduced from 10 GW to 0.1 GW and tidal from 20 GW to 0.5 GW, removing 65.5 TWh/yr. Onshore wind rises from 30 GW to 45 GW (+38.3 TWh/yr) and solar PV from 90 GW to 130 GW (+33.1 TWh/yr).

Before the industry change, rebased demand was lower than ZCB, so supply was trimmed until the stores no longer fill well beyond their starting levels:

- Offshore wind 140 GW to 120 GW.
- Biomass for biogas 88 TWh/yr to 85 TWh/yr, with methanation scaled from 4.93 GW to 4.76 GW to match the biogas CO2. At 80 TWh/yr the methane store runs empty.
- FT synthetic fuel capacity is 9.7 GW, the same as ZCB. At 9.6 GW or below the synthetic fuel store empties in the first winters and leaves demand unmet.

The industry change lowered demand again, and supply was trimmed with the same aim:

- Offshore wind 120 GW to 100 GW.
- Biomass for biogas 85 TWh/yr to 72 TWh/yr, with methanation from 4.76 GW to 4.03 GW. At 70 TWh/yr the methane store falls to 2.1 TWh, and at 65 TWh/yr it runs empty.
- FT synthetic fuel capacity 9.7 GW to 9.2 GW. At 9.0 GW the synthetic fuel store runs empty and leaves 0.9 TWh/yr unmet.

## Results

| | Before industry change | Now |
|---|---|---|
| Electricity demand (TWh/yr) | 586.4 | 509.9 |
| Space heat demand (TWh/yr) | 159.1 | 159.1 |
| Industry final energy (TWh/yr) | 248.9 | 173.5 |
| Excess electricity (TWh/yr) | 138.9 | 136.9 |
| Backup generation (TWh/yr) | 16.1 | 13.3 |
| Peak backup (GW) | 45.7 | 43.5 |
| Methane store end, start 10 TWh (TWh) | 24.0 | 25.0 |
| Methane store minimum (TWh) | 5.8 | 6.3 |
| Synthetic fuel store end, start 5 TWh (TWh) | 15.5 | 15.5 |
| Synthetic fuel store minimum (TWh) | | 3.9 |
| Spare land (kha) | 290 | 642 |
| Net emissions (MtCO2e) | -6.3 | -6.3 |

All electricity, heat, methane, hydrogen and synthetic fuel demand is met.
