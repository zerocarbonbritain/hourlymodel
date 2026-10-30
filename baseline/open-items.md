# Open items

Items found while building and validating baselines that need further attention. Remove an item once it is resolved. `baseline/validate.py` refers to these sections from checks that fail for a known reason (see [reports/validation_baseline_2024.md](reports/validation_baseline_2024.md)).

## Model

- **Storage cycles less than real storage.** The optimal dispatch charges from backup to shave backup peaks, giving 0.96 TWh in 2024 and 0.25 TWh in 2018 against 3.5 and 2.5 TWh in DUKES 5.16. Real storage also arbitrages against prices, which the model does not include. A higher `electric_storage.peak_weight` raises output (3.2 TWh at 50 in 2024) but has no source. The build reports this as a failed `check` on `electric_storage.capacity_GWh`.
- **Baseline LCOE leaves out carbon prices and biomass fuel.** Fuel prices for gas, oil and coal are included (DESNZ QEP 3.2.1, which excludes carbon prices). The model now takes a `carbon_price`, but build assumptions cannot vary by year, so the baselines set it to 0 until an annual UK ETS (EU ETS for 2018) plus Carbon Price Support series is sourced. There is no official series for biomass fuel prices paid by generators.
- **Baseline LCOE values the existing fleet at 2024 new-build costs** (see [docs/cost-assumptions.md](../docs/cost-assumptions.md)). Existing nuclear is costed at Sizewell C prices. Imports, hydro and biomass plant capital are not costed.
- **Biofuel supply is flat.** It feeds the liquid fuel store, so the profile has little effect.
- **Generation cost is 31% below what households paid in 2024.** The modelled system cost is 11.3 p/kWh delivered, against 16.4 p/kWh for wholesale, capacity market, RO and FiT in the 2024 Ofgem cap. The domestic unit rate is therefore 19.7 p/kWh against 25.8 (DESNZ QEP 2.2.4), and the bill at 3,400 kWh £882 against £1,083. Causes: the fleet is costed at new-build costs, consumers pay wholesale prices set by gas plant, the 2024 caps passed through gas bought forward in 2023, RO and FiT support older and costlier renewables, and imports are not costed. A cost based model will sit below prices while gas sets them, but scenario costs should be read against this gap. One option is a price view for baselines: wholesale price times volume plus support scheme costs.
- **One heating system mix for all sectors.** Shares come from the all sector ECUK total, so the model gives homes less gas (230 against 256 TWh) and services more (125 against 109 TWh) than DUKES, and homes 6% more electricity. Sector specific shares would fix this.
- **One oil CO2 factor.** 0.2678 kgCO2/kWh is close to fuel oil. Petrol, diesel and jet fuel are about 0.24 to 0.25 kgCO2/kWh gross, so domestic transport CO2 is 8% high and aviation 6% high. Total oil CO2 is 4% high.
- **No reserve margin for backup capacity.** Backup is sized to the highest hourly need (30.2 GW) against 46.2 GW of fossil and bioenergy capacity in DUKES 5.7, which also covers outages and reserve. Backup capital cost in scenarios is understated by the same margin.
- **Peak demand is high.** The highest modelled hour is 55.2 GW against a 2024 simultaneous maximum load of 47.4 GW (DUKES 5.10). The model peak covers ten weather years and includes demand met by embedded generation, but it is above every year since 2010, which suggests the space heat profile is too peaky.
- **Backup generation is 6% low.** Gas, bioenergy and coal plus other generation are each about 6.4% below DUKES 5.6, because modelled electricity demand is 2.4% low at final consumption.
- **Final bioenergy is 13% high.** Bioenergy, ambient and solar heat in final consumption is 65.5 TWh against 57.8 TWh. The cause has not been traced.

## Industry

- **High temperature process coal is mostly a reductant.** Coke and coal in blast furnaces cannot be replaced by heat. Steel, cement, ammonia and glass need material based sub models.
- **Blast furnace and coke oven fuel is missing.** About 12 TWh of coal and coke used in blast furnaces and coke ovens is transformation in DUKES and is not modelled. Coal and other thermal fuel demand is 30% below DUKES, and CO2 from coal, solid fuels, blast furnace gases and waste is 11.0 Mt against 21.5 Mt in the inventory. The coal plus waste backup factor (0.254) is also an average of coal and waste.
- **Drying fuel efficiency (65%) has no source.** The electric to fuel ratios come from JRC-IDEES 2021, which is EU data. The sources quote net calorific values and ECUK is gross.
- **Industry demand is flat.** Heat end uses use the flat high temperature profile and demand side response switches fuel instantly, with no heater capacity or thermal storage.

## Inputs

- **DUKES 6.1 commercial ambient heat** (12.0 TWh) includes reversible air conditioning, which inflates the heat pump share.
- **Boiler and heat pump efficiencies** are carried from the 2018 baseline.
- **Assumed per unit values:** EV battery 60 kWh and charger 7 kW per car, car EV miles at 1.32 times the battery electric stock share, battery storage duration 1.3 hours, pumped hydro energy 24 GWh.
- **Interconnector capacity** sums the interconnectors listed in DUKES 5.13A by commissioning year. The table lists current links only, so a closed link would be missed for a past year.
- **Land use does not reproduce 2024.** The baseline allocates 29,950 kha against a UK area of 24,417 kha (Defra), and the model's fixed UK area is 24,728 kha. Specific errors:
  - Existing woodland (2,894 kha), hemp (320 kha), mountain, heath and bog, semi-natural grassland, coastal and urban areas are inherited from the ZCB default.
  - 1,475 kha of new natural broadleaf woodland stands in for the existing forest sink. Woodland totals 4,369 kha against 3,286 kha (Forest Research, March 2025). Broadleaf is 2,861 against 1,710 kha.
  - The land use model grows all direct use biomass on UK short rotation coppice (2,753 kha). Most biomass for power is imported, which the model does not represent. Croppable land is 8,187 against 6,167 kha.
  - The land sink total (-22.3 MtCO2e) is close to the inventory (-20.2) only by offsetting errors: forest -13.0 against -18.0, harvested wood -8.0 against -2.2 (5.3 of it from ZCB hemp), plus 1.3 Mt of landfill biochar with no counterpart.
  - Grassland (11,522 kha) and food and feed crops (2,557 kha each) are 2018 values. Defra 2024 gives 10,577 kha of permanent grassland and rough grazing, 3,466 kha of crops and temporary grass fed to livestock and 2,701 kha for other uses.
- **Retail assumptions without a cached source:** 84% of households with gas (about 24 million GB domestic meters), and road fuel energy per litre (9.69 kWh petrol, 10.69 kWh diesel, gross, DUKES Annex A).
- **baseline_2018 miles per person are anchored to the original 2018 values.** The transport formulas scale the original 2018 baseline by passenger km and population, so the rebuilt 2018 values are the original ones with revisions applied, not an independent derivation.

## Build

- **Households source URL is not versioned.** ONS only offers a `current` link for families and households, so the file will change when the 2026 edition is published. The hash check will catch it.
- **NTS0303 covers England only.** Walking and cycling `miles_pp` use it as a UK proxy, as in the 2018 baseline.
- **Calibration runs archived scenarios against the wrong default.** `run_model` writes the scenario to a temporary file, so `docs/run_scenario.js` does not see `archive/` in the path and merges an archived baseline onto `zcb_2024.json` instead of `archive/zerocarbonbritain.json`. `validate.py` runs the scenario file in place and is not affected.
- **baseline_2018 is out of date.** Rebuilding it adds the industry useful heat inputs and changes the industry values, so `--write` has not been run since that change.
- **Ofgem refuses scripted downloads.** `ofgem_cap` is marked `manual` in `sources.json` and has to be downloaded in a browser.
- **The Ofgem cap and Forest Research values are 2024 only.** The cap model is read by cell range and woodland area is a published value from a PDF, so those checks and the retail inputs apply to 2024 only.

## Observed data

- **ONS household energy spend is below DUKES use at QEP prices.** For 2024, ONS gives £26.3bn for electricity and £14.6bn for gas, against £30.1bn and £19.2bn from DUKES domestic use at DESNZ average prices. Both are reported, and the DUKES based figure is the primary check.
