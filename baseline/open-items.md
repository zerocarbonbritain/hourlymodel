# Open items

Items found while building and validating baselines that need further attention. Remove an item once it is resolved. `baseline/validate.py` refers to these sections from checks that fail for a known reason (see [reports/validation_baseline_2024.md](reports/validation_baseline_2024.md)).

## Model

- **Storage cycles less than real storage.** The optimal dispatch charges from backup to shave backup peaks, giving 0.96 TWh in 2024 and 0.25 TWh in 2018 against 3.5 and 2.5 TWh in DUKES 5.16. Real storage also arbitrages against prices, which the model does not include. A higher `electric_storage.peak_weight` raises output (3.2 TWh at 50 in 2024) but has no source. The build reports this as a failed `check` on `electric_storage.capacity_GWh`.
- **Baseline LCOE leaves out carbon prices and biomass fuel.** Fuel prices for gas, oil and coal are included (DESNZ QEP 3.2.1, which excludes carbon prices). The model now takes a `carbon_price`, but build assumptions cannot vary by year, so the baselines set it to 0 until an annual UK ETS (EU ETS for 2018) plus Carbon Price Support series is sourced. There is no official series for biomass fuel prices paid by generators.
- **Baseline LCOE values the existing fleet at 2024 new-build costs** (see [docs/cost-assumptions.md](../docs/cost-assumptions.md)). Existing nuclear is costed at Sizewell C prices. Imports, hydro and biomass plant capital are not costed.
- **Biofuel supply is flat.** It feeds the liquid fuel store, so the profile has little effect.
- **Resource cost is 31% below what households paid for generation in 2024.** The resource cost (the 2024 fleet at new-build costs) is 11.3 p/kWh delivered, against 16.4 p/kWh for wholesale, capacity market, RO and FiT in the 2024 Ofgem cap. The price view closes the gap in two steps: generation at 2024 capture prices plus £12.8bn of support gives 13.6 p/kWh, and the domestic wholesale adjustment (3.2 p/kWh, forward purchasing in 2023 and the domestic profile) gives 16.8. Retail prices now use the price view. The resource cost check stays as a known difference between cost and price.
- **Price view inputs entered as published values.** Capture prices (LCCC day-ahead price weighted by Elexon FUELHH and NESO embedded generation) and CfD payments by technology (LCCC daily data summed over 2024) were derived from API series and entered with a citation. A script that fetches and derives them would make them reproducible. Scheme years (RO, FiT) and delivery years (capacity market) are weighted to calendar 2024 by quarters. Onshore wind uses the transmission wind capture price, coal and waste use the CCGT capture price, and imports the demand weighted price.
- **ZCB price view uses AR7 strike prices.** Offshore wind £91.20, onshore £72.24, solar £65.23, tidal £265 and nuclear £124.7/MWh (2024 prices, [docs/cost-assumptions.md](../docs/cost-assumptions.md)), with backup, storage and other plant at resource cost. This gives 14.5 p/kWh against a resource cost of 15.7, because strike prices assume higher load factors than the model's weather data gives. Strike prices pay for metered output, but the model's output is before curtailment, and curtailment and balancing payments are not included. Network costs are kept at 2024 levels.
- **Storage in the price view uses resource cost.** Modelled storage output is low, so in the 2024 baseline its resource cost is £1,076/MWh of output (£1.0bn). Real storage earns an arbitrage spread, which needs charge and discharge prices.
- **One heating system mix for all sectors.** Shares come from the all sector ECUK total, so the model gives homes less gas (230 against 256 TWh) and services more (125 against 109 TWh) than DUKES, and homes 6% more electricity. Sector specific shares would fix this.
- **Harvested wood products are credited at harvest.** The model counts 95% of harvested carbon as stored (3.0 MtCO2 in 2024). The inventory reports the net change in the wood products pool, 2.2 MtCO2, which subtracts the decay of older products. A pool with a decay rate would fix this, and matters for ZCB scenarios that rely on timber.
- **ZCB land model defaults keep the old behaviour.** `land_model` in zcb_2024.json credits no existing woodland sink (`existing_woodland_tCO2_per_ha` 0), grows all direct use biomass on UK land (`uk_crop_biomass_prc` 100), keeps 1.29 MtCO2 of landfill biochar and the 24,728 kha UK area. The 2024 baseline sets 5.47 tCO2/ha, 0.45%, 0 and 24,417 kha. Whether ZCB should credit the existing forest sink, how much of its biomass is imported, and whether landfill biochar is a real option are scenario decisions.
- **ZCB leaves out international shipping.** `transport.international_shipping_TWhy` is 0 in zcb_2024.json, as before it was an input, while the 2024 baseline includes 23.9 TWh of marine bunkers (5.8 MtCO2). Baseline and ZCB emissions are not on the same boundary until ZCB sets a shipping demand and fuel.
- **No reserve margin for backup capacity.** Backup is sized to the highest hourly need (30.2 GW) against 46.2 GW of fossil and bioenergy capacity in DUKES 5.7, which also covers outages and reserve. Backup capital cost in scenarios is understated by the same margin.
- **Peak demand is high.** The highest modelled hour is 55.2 GW against a 2024 simultaneous maximum load of 47.4 GW (DUKES 5.10). The model peak covers ten weather years and includes demand met by embedded generation, but it is above every year since 2010, which suggests the space heat profile is too peaky.
- **Backup generation is 6% low.** Gas, bioenergy and coal plus other generation are each about 6.4% below DUKES 5.6, because modelled electricity demand is 2.4% low at final consumption.
- **Final bioenergy is 13% high.** Bioenergy, ambient and solar heat in final consumption is 65.5 TWh against 57.8 TWh. The cause has not been traced.

## Industry

- **High temperature process coal is mostly a reductant.** Coke and coal in blast furnaces cannot be replaced by heat. Steel, cement, ammonia and glass need material based sub models.
- **Blast furnace fuel is a fixed input.** `industry.blast_furnace_coal_TWhy` (12.5 TWh in 2024, 23.9 in 2018) carries DUKES coke oven and blast furnace fuel as energy industry use, with a CO2 factor taken from the inventory (0.38 kgCO2/kWh). It does not respond to steel output or to the industry levers. ZCB sets it to 0. A steel sub model should replace it.
- **Drying fuel efficiency (65%) has no source.** The electric to fuel ratios come from JRC-IDEES 2021, which is EU data. The sources quote net calorific values and ECUK is gross.
- **Industry demand is flat.** Heat end uses use the flat high temperature profile and demand side response switches fuel instantly, with no heater capacity or thermal storage.

## Inputs

- **DUKES 6.1 commercial ambient heat** (12.0 TWh) includes reversible air conditioning, which inflates the heat pump share.
- **Boiler and heat pump efficiencies** are carried from the 2018 baseline.
- **Assumed per unit values:** EV battery 60 kWh and charger 7 kW per car, car EV miles at 1.32 times the battery electric stock share, battery storage duration 1.3 hours, pumped hydro energy 24 GWh.
- **Interconnector capacity** sums the interconnectors listed in DUKES 5.13A by commissioning year. The table lists current links only, so a closed link would be missed for a past year.
- **Land use areas with no cached source.** Urban (1,459 kha), coastal and freshwater (692) and semi natural grassland (155) are ZCB values, and mountain, heath and bog is the remainder of the UK area (2,080 kha), so it carries their error. The natural and productive woodland split keeps the ZCB proportions. Woodland area is a published value from the Forest Research PDF.
- **baseline_2018 keeps the old land use.** The land inputs are limited to 2024 because woodland area is a 2024 published value. The 2018 baseline still has 1,475 kha of new woodland standing in for the forest sink and ZCB areas elsewhere.
- **Gas households exclude Northern Ireland.** The share of households with gas is GB domestic meters over UK households (86.3% in 2024).
- **baseline_2018 miles per person are anchored to the original 2018 values.** The transport formulas scale the original 2018 baseline by passenger km and population, so the rebuilt 2018 values are the original ones with revisions applied, not an independent derivation.

## Build

- **Households source URL is not versioned.** ONS only offers a `current` link for families and households, so the file will change when the 2026 edition is published. The hash check will catch it.
- **NTS0303 covers England only.** Walking and cycling `miles_pp` use it as a UK proxy, as in the 2018 baseline.
- **Ofgem refuses scripted downloads.** `ofgem_cap` is marked `manual` in `sources.json` and has to be downloaded in a browser.
- **Some sources are 2024 only.** The Ofgem cap model is read by cell range, woodland area is a published value and the DESNZ conversion factors file is the 2024 edition. Those inputs and checks apply to 2024 only, and baseline_2018 takes the archived default for them (the old single oil CO2 factor among them).

## Observed data

- **International shipping fuel differs between DUKES and the inventory.** DUKES 1.1 marine bunkers (23.9 TWh in 2024) give 5.8 MtCO2 at the marine gas oil factor. The inventory estimates shipping from vessel activity and gives 5.0 MtCO2. The baseline follows DUKES so the energy balance holds.
- **ONS household energy spend is below DUKES use at QEP prices.** For 2024, ONS gives £26.3bn for electricity and £14.6bn for gas, against £30.1bn and £19.2bn from DUKES domestic use at DESNZ average prices. Both are reported, and the DUKES based figure is the primary check.
