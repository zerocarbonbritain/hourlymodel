# Tutorial: creating an up to date baseline scenario

The current baseline scenario, [baseline_2018.json](../scenarios/baseline_2018.json), reflects UK energy use and emissions in 2018. This tutorial explains where every number in that scenario came from and how to build a new baseline (for example a 2024 baseline) from the latest UK energy statistics.

## How the 2018 baseline was built

The 2018 baseline was derived in the spreadsheet [baseline2018.ods](../baseline2018.ods), which is checked into the repository. It has seven sheets:

| Sheet | Purpose | Main sources |
|---|---|---|
| Domestic | Household lighting, appliances, cooking, space and water heating by fuel | ECUK end use tables, DUKES 6.2 |
| Services | Service sector demands by end use and fuel | ECUK end use tables, DUKES 6.2 |
| Industry | Industrial demand by end use and fuel | ECUK table U4 |
| Transport | Passenger miles, load factors, fuel splits, freight | National Travel Survey, ECUK table C8, DUKES energy balance |
| Energy Balance | Whole system cross check, electricity supply, energy industry use | DUKES aggregate energy balance, DUKES chapter 5 |
| GHG | Emissions by source category, mapped to the model's emissions balance inputs | UK territorial greenhouse gas emissions statistics |
| ZCB_Model_Helper | Converts the sheet outputs into the exact values used in the scenario JSON | - |

The recommended approach is to copy this spreadsheet, replace the source data with the latest year, and read the new scenario values off the helper sheet. The rest of this tutorial walks through each part.

## How scenario files work

Scenario JSON files in [scenarios/](../scenarios/) are applied as overrides on top of the default scenario, [zerocarbonbritain.json](../scenarios/zerocarbonbritain.json) (see `load_scenario` in [index.php](../index.php)). Any field you do not set inherits the ZeroCarbonBritain value. For a baseline this matters: start by copying `baseline_2018.json` in full rather than writing a sparse file, so that no ZCB assumptions leak in.

To add the new scenario to the tool:

1. Save it as `scenarios/baseline_2024.json`.
2. Add an entry to [scenarios/available.json](../scenarios/available.json):

```json
"baseline_2024": {
    "name": "2024 baseline"
}
```

## Step 1: choose the baseline year and gather sources

Every source file used is registered in [baseline/sources.json](../baseline/sources.json) with its direct download link and sha256. `baseline/build.py` downloads them to `baseline/cache/` and stops if a file has changed.

As of September 2026 the latest editions are:

| Publication | Latest edition | Data year | Link |
|---|---|---|---|
| DUKES (Digest of UK Energy Statistics) | DUKES 2026, July 2026 | 2025 | [gov.uk](https://www.gov.uk/government/statistics/digest-of-uk-energy-statistics-dukes-2026) |
| ECUK (Energy Consumption in the UK) | ECUK 2025, September 2025 | 2024 | [gov.uk](https://www.gov.uk/government/statistics/energy-consumption-in-the-uk-2025) |
| Final UK territorial greenhouse gas emissions | 1990 to 2024, February 2026 | 2024 | [gov.uk](https://www.gov.uk/government/statistics/final-uk-greenhouse-gas-emissions-statistics-1990-to-2024) |
| National Travel Survey | NTS 2024, August 2025 | 2024 | [gov.uk](https://www.gov.uk/government/statistics/national-travel-survey-2024) |
| ONS population estimate | Mid 2025 release, includes revised mid 2024 | 2025 | [ons.gov.uk](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland) |
| ONS families and households | 2025 edition | 2025 | [ons.gov.uk](https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/families/datasets/familiesandhouseholdsfamiliesandhouseholds) |
| Energy Trends weather (degree days, ET 7.1) | Monthly | Current | [gov.uk](https://www.gov.uk/government/statistics/energy-trends-section-7-weather) |

DUKES covers 2025 but ECUK end use tables and final GHG statistics only reach 2024, so **2024 is the latest year with full coverage** and is the recommended baseline year. All DUKES tables carry time series, so 2024 values are available in the 2026 edition.

Table numbering has changed since the 2018 workbook was built:

- The renewables commodity balance used as "6.2 Commodity balances" in the workbook is now **DUKES table 6.1**. Table 6.2 is now capacity and generation from renewables, and 6.3 is renewable load factors ([chapter 6 tables](https://www.gov.uk/government/statistics/renewable-sources-of-energy-chapter-6-digest-of-united-kingdom-energy-statistics-dukes)).
- The aggregate energy balance is still **table 1.1**. Electricity fuel use and generation is **5.6**, plant capacity **5.7**, plant loads and efficiency **5.10** ([chapter 5 tables](https://www.gov.uk/government/statistics/electricity-chapter-5-digest-of-united-kingdom-energy-statistics-dukes)).
- ECUK **table U4** (industry by end use and two digit SIC) still exists, in the [End Use tables workbook](https://assets.publishing.service.gov.uk/media/69e6362644a079b27f997f8d/ECUK_2025_End_Use_tables_200426.xlsx). ECUK **table C8** (road transport by vehicle type) is in the Consumption tables workbook and currently lags a further year, running to 2023.
- NTS average miles per person by mode is table **NTS0303** in [modal comparisons](https://www.gov.uk/government/statistical-data-sets/nts03-modal-comparisons). Note the NTS covers England only, the 2018 workbook used its per person figures as a UK proxy.
- GHG emissions by source category and by fuel are in the final figures data tables of the emissions statistics.

## Step 2: population and households

Set `population_2030` and `households_2030` to the population and household count for the baseline year, from the latest releases. Take the baseline year column, not the latest year: the families and households tables run a year ahead of the energy data. Despite the field names these are just the population and household count for the scenario year. They are used for per person transport demand and per household reporting.

## Step 3: electricity supply

The supply section defines installed capacity in GW. Wind and solar output is calculated hourly from a normalised 10 year weather dataset ([model.js:150](../model.js#L150)):

```
output = capacity_GW x dataset_capacity_factor x availability
```

This step is scripted. `python3 -I baseline/build.py <year> scenarios/<scenario>.json` derives the supply inputs below from DUKES and writes a report of every source cell. See [baseline/README.md](../baseline/README.md). The manual method follows.

The `availability` fields calibrate the weather dataset to the real observed fleet capacity factor for the baseline year. To set them:

1. Take end of year installed capacity and generation for the baseline year. For renewables both are in DUKES table 6.2. For nuclear, capacity is in 5.7 and generation in 5.6. (DUKES editions before 2023 used 6.4 for renewable capacity and 6.6 for generation.)
2. Compute the observed capacity factor: generation / (capacity x 8766). Do not use the DUKES 6.3 load factors. They are based on average capacity over the year, so applying them to end of year capacity overstates generation when capacity is growing.
3. Run the model with `availability` set to 1 and note the modelled capacity factor, or read it from the "Renewable and carbon free electricity supply" section of the tool.
4. Set `availability` = observed CF / dataset CF.

For the 2018 baseline this gave offshore 0.774 and onshore 0.785, which reproduce observed capacity factors of 37.1% and 25.4%. `solarpv_availability` works the same way for solar. It was added after the 2018 baseline, where the dataset gave about 9.4% against an observed 11%. The build calibrates all three against the model directly.

`imports_TWhy` is net interconnector imports (DUKES 1.1 electricity imports less exports), added as a flat supply. `solarthermal_capacity` is calibrated so modelled solar thermal heat equals DUKES 6.1 solar thermal final consumption, the same heat that step 5 adds to water heating demand.

Hydro and nuclear are flat outputs: set `hydro_capacity` and `nuclear_capacity` to installed GW and the `_capacity_factor` fields to the observed annual capacity factor.

## Step 4: lighting, appliances and cooking (LAC)

This step is scripted in `baseline/build.py`. All values come from ECUK table U2, which is in ktoe (1 ktoe = 0.01163 TWh). The model uses the cooking and catering values directly as fuel demand, so take fuel input from U2.

From the ECUK end use tables, domestic and services sheets of the workbook:

- `LAC.domestic.lighting_and_appliances_TWhy`: domestic electricity for lights and appliances.
- `LAC.domestic.cooking_TWhy` and `cooking_gas_TWhy`: domestic cooking split electric and gas. The workbook assumed a 52%/48% demand split with 85%/60% efficiencies, tuned so fuel input matches the ECUK cooking totals.
- `LAC.services.*`: services lighting and appliances, catering and cooling, each split electric and gas. In the workbook, services "Other" and "Computing" demands are folded into `lighting_and_appliances_TWhy` (electric part) and `lighting_and_appliances_gas_TWhy` (gas part).

## Step 5: space and water heating

The model generates hourly space heating demand from outdoor temperature ([model.js:277](../model.js#L277)):

```
demand_GW = (base_temperature - outdoor_temperature) x demand_GWK
```

Steps 5 and 6 are scripted in `baseline/inputs/05-heating.json`.

`domestic_demand_GWK`, `services_demand_GWK` and `industry_demand_GWK` are whole stock heat loss coefficients in GW per Kelvin. They are calibration values, not published statistics. To derive them:

1. From ECUK table U2 get annual space heating fuel demand per sector and convert it to heat with the workbook efficiencies (gas and oil boilers 82.5%, solid fuel 75%, wood 70%, direct electric and heat sold 100%).
2. Add heat pump ambient heat from DUKES 6.1, split between space and water in proportion to each sector's U2 electricity use. Services ambient heat is the commercial, public administration, agriculture and miscellaneous rows. U2 has no industry water heating, so industry ambient heat goes to space heat.
3. Set `demand_GWK` so the model's annual space heat for that sector matches the target. Space heat is linear in GW/K, so one run at 1 GW/K gives the answer. The bundled temperature dataset is fixed, so degree days for the baseline year are not needed.

`water_heating.domestic_TWhy` and `services_TWhy` are annual heat (not fuel) demands from the same tables, with ambient heat added as above and DUKES 6.1 solar thermal added to water heating.

## Step 6: heating system shares

`heating_systems.*.share` is the percentage of total space and water heat demand (domestic, services and industry combined) met by each system type. The workbook's ZCB_Model_Helper sheet combines the per sector, per fuel heat demand tables into one row and normalises it. Notes:

- Use the U2 total space heating and water heating rows.
- Oil heating maps to `synthfuel` (the model treats liquid fuel boilers as one category).
- Heat pump heat is 1.5 x DUKES 6.1 ambient heat and direct electric is U2 electricity minus ambient / 2. This assumes a seasonal performance factor of 3, as in the workbook.
- "Heat sold" (district and communal heat) and solar hot water are reallocated in proportion to the other fuels.
- Set every share explicitly, including zeros such as `hydrogen.share`, so no ZCB default leaks in.
- Efficiencies (`efficiency_hot_water`, `efficiency_0C`, `efficiency_10C`) only need revisiting if the stock changes materially, for example the growing heat pump fleet.

## Step 7: transport

This step is scripted in `baseline/inputs/07-transport.json`.

- `modes.*.miles_pp`: miles per person per year. The model multiplies it by population, so it must follow passenger kilometres per person. For cars, rail, bus and motorbike, scale the 2018 value by TSGB0101 passenger kilometres (baseline year over 2018) and by population (2018 over baseline year). Aviation uses AVI0201c the same way. Walking and cycling come from NTS0303, which covers England only.
- `load_factor`: average occupancy as a fraction of full (workbook: cars 0.33, bus 0.14, rail 0.32).
- `prc.EV / H2 / IC`: drive train shares of miles travelled. This is the field that has moved most since 2018 (EV share of car miles was 1.25%). Licensed fleet shares from VEH1103 are the evidence.
- `efficiency.IC`: an engine efficiency divisor, not kWh per vehicle km. Calibrate each mode against the model's fuel use for that mode, which is inversely proportional to it. Cars, buses and motorcycles: DUKES 1.1 road petroleum plus bioenergy times their ECUK C8 share of road fuel. Diesel rail: DUKES 1.1 rail petroleum. Aviation: DUKES 1.1 air.
- `synth_fuel.biofuel_supply_TWhy`: DUKES 1.1 transport bioenergy. The model supplies it to the liquid fuel store, so fossil oil falls by the same amount.
- Freight: `freight_IC_demand` (TWh) is DUKES 1.1 road liquid fuel times the C8 HGV plus LGV share, plus DUKES national navigation.

ECUK C8 runs a year behind the other sources, so use its previous year row for the shares.

Validate against ECUK table C8 (road transport fuel by vehicle type) and the DUKES aggregate balance transport rows, as done at the bottom of the Transport sheet.

## Step 8: industry

This step is scripted in `baseline/inputs/08-industry.json`. From ECUK table U4 (industrial consumption by end use and fuel), total industries:

- `industry.*_TWhy`: total demand per end use category (high temperature process, low temperature process, drying and separation, other heat, motors, compressed air, lighting, refrigeration, other non heat).
- `*_fixed_elec_prc`, `*_fixed_CH4_prc`, `*_fixed_liquid_prc`, `*_fixed_coal_prc`, `*_fixed_biomass_prc`: fuel shares within each end use, in percent. Rows should sum to 100 with the `_DSR_` fields at 0 for a baseline.
- U4 is in ktoe and has no bioenergy column. Motors, compressed air, lighting and refrigeration are all electric.
- Round gas, oil and coal shares to one decimal place and give electricity the remainder, so each end use sums to 100.
- `other_heat_TWhy` is the U2 industry "unknown (heat)" row, with heat sold mapped to methane and bioenergy as the remainder.
- `other_non_heat_TWhy` is the U4 "other" end use.
- `refinery_electric_TWhy` is DUKES 5.1 energy industry use less electricity generation and energy storage.
- Industry space heating goes into `space_heating.industry_demand_GWK`, not this section.

The workbook's Industry sheet shows the full U4 aggregation and the resulting percentage table.

## Step 9: backup electricity, energy industry use and fossil fuels

The baseline represents today's fossil generation as "backup" filling the gap left by renewables and nuclear:

This step is scripted in `baseline/inputs/09-electricity-fuels.json`.

- `electric_backup.prc_methane / prc_biomass / prc_coal / prc_synth_fuel`: shares of dispatchable generation (all thermal generation except nuclear) from the DUKES 5.6 annual summaries, all generating companies. `prc_coal` covers coal plus other thermal (mainly waste) and is the remainder, so the shares sum to 100. `_efficiency` values are generation over fuel used from the same table.
- `synth_fuel_efficiency` is oil generation over fuel used. `coal_efficiency` covers coal and other thermal together, to match `prc_coal`.
- `fossil_fuels.allow_use_for_backup` must be 1 for a baseline.
- `fossil_fuels.other_gas_use`: the ECUK U2 industry "unknown (other)" gas. `other_oil_use` and `other_coal_use`: the oil and coal of that row. Do not include gas losses here, the model calculates them.
- `energy_industry_use.refineries_*_prc`, `oil_gas_extraction_*_prc` and `gas_losses_prc`: energy industry own use and gas losses as percentages of modelled oil and gas demand. Calibrate each so the model reproduces the DUKES 1.1 energy industry use row.
- `energy_industry_use.electricity_grid_loss_prc` and `electricity_own_use_prc`: losses and generation own use over total supply, from DUKES 5.1.

Storage, hydrogen, methanation and synthetic fuel sections stay at or near zero for a baseline, apart from `electric_storage` (pumped hydro plus batteries) and `methane.storage_capacity_GWh` (gas network storage).

## Step 10: emissions balance and land use

This step is scripted in `baseline/inputs/10-emissions.json`.

`emissions_balance.*` values are MtCO2e by source category, summed from the by source dataset of the UK greenhouse gas emissions statistics (sheet `UK_by_source`, one row per source, gas and fuel). The GHG sheet of the workbook maps inventory line items to the model's input fields, most are direct copies (cement, landfill, agriculture_total and so on), with fossil fuel combustion emissions calculated by the model itself from fuel use, using factors of 0.184 (gas), 0.268 (oil) and 0.317 (coal) kgCO2 per kWh. Two points need care:

- Combustion categories contribute CH4 and N2O only, since the model calculates fuel CO2.
- The land use fields must exclude burning and mineralisation N2O, which have their own fields (`biomass_burning`, `land_use_n2o`). Forest land and harvested wood products are left to the land use model.

Ammonia production ceased in 2023, so `ammonia` is 0 from then.

`land_use.*` areas (in thousands of hectares) come from the ZCB land use model and change little for a baseline update; check woodland creation statistics if you want them current.

## Step 11: validate the new scenario

Run the scenario from the command line before adding it to the UI. Note that [run.js](../run.js) needs `normalise_profile` defined before `defaults.js` loads (it currently lives in index.php), the snippet below includes it:

```bash
npm install
node docs/run_scenario.js baseline_2024
```

[run_scenario.js](run_scenario.js) loads the default scenario, merges the named scenario over it exactly as the web tool does, runs the 10 year simulation and prints headline outputs. For `baseline_2018` it prints:

```
Electricity demand (TWh/yr): 160.4
Onshore wind CF: 25.4%
Offshore wind CF: 37.1%
Solar PV CF: 9.4%
Space heating demand (TWh/yr): 373.9
Water heating demand (TWh/yr): 82.2
Industry demand (TWh/yr): 228.9
Total emissions (MtCO2e): 519.6
```

Cross check the outputs against the statistics, as the Energy Balance sheet does for 2018:

| Model output | Compare against |
|---|---|
| Backup generation (sum of `electric_backup` turbine outputs) | DUKES 5.6 dispatchable generation |
| Offshore, onshore, solar capacity factors | DUKES 6.2 generation over end of year capacity |
| Space and water heating demand | ECUK end use tables |
| Industry total demand | ECUK table U4 total |
| Transport fuel demand | ECUK C8 and DUKES transport rows |
| Total emissions | UK GHG statistics grand total plus international bunkers |

The printed "Electricity demand" is fixed supply used (renewables, nuclear and imports), not total demand, so it does not compare with DUKES.

Aim for agreement within a few percent. The 2018 workbook achieved better than 1% on most totals. On emissions the model prints 519.6 MtCO2e for the 2018 baseline against 496.0 in the statistics (including international bunkers), the difference is the aviation non CO2 uplift the model adds, so expect the same offset for a new baseline.

## Starting values for a 2024 baseline

Headline figures gathered from the latest editions, to seed the workbook update. Capacity and load factors below are the published 2025 values from DUKES 2026 tables 6.2 and 6.3, use the 2024 column of the same tables for a 2024 baseline.

| Field | 2018 value | Latest value | Source |
|---|---|---|---|
| `population_2030` | 66,460,000 | 69,256,000 (mid 2024) | ONS |
| `households_2030` | 27,600,000 | 28,609,000 (2024) | ONS |
| `offshore_wind_capacity` | 8.2 | 16.6 GW (2025) | DUKES 6.2 |
| `onshore_wind_capacity` | 13.6 | 16.4 GW (2025) | DUKES 6.2 |
| `solarpv_capacity` | 15.4 * | 21.9 GW (2025) | DUKES 6.2 |
| `hydro_capacity` | 1.9 | 1.9 GW (2025) | DUKES 6.2 |
| Offshore wind load factor | 37.1% | 36.4% (2025) | DUKES 6.3 |
| Onshore wind load factor | 25.4% | 24.1% (2025) | DUKES 6.3 |
| Nuclear load factor | 83.5% | 64.0% (2025) | DUKES 5.10 |
| Electricity demand | 351 TWh | 323 TWh (2025) | DUKES ch. 5 |
| Coal generation | 17 TWh | 0 (2025, first full year) | DUKES 5.6 |
| Total territorial GHG | 452 MtCO2e | 373 MtCO2e (2024) | GHG statistics |
| Cycling `miles_pp` | 48 | 53 (2024) | NTS0303 |

\* The 2018 scenario file uses 15.4 GW against 13.1 GW in the workbook energy balance sheet, worth rechecking during the update.

Changes since 2018 that need more than a value refresh:

- **Coal.** `electric_backup.prc_coal` goes to 0 and gas takes the remaining dispatchable share.
- **EV shares.** `transport.modes.*.prc.EV` at 1.25% for cars is far below the current fleet share, take vehicle licensing statistics (DfT table VEH) or ECUK C8 fuel data.
- **Heat pumps.** `heating_systems.heatpump.share` (3.58% in 2018) should be rederived from the ECUK end use tables and DUKES 6.1 ambient heat rows.
- **Interconnector imports.** Net imports were 29.7 TWh in 2025 against 20.1 TWh in 2018. The 2018 workbook folded imports into backup generation. Use `supply.imports_TWhy` instead.
- **Emissions balance.** Copy the full source category table from the 2024 final statistics into the GHG sheet, all `emissions_balance` fields shift.
