# Cost assumptions

The cost model gives an annual cost for each technology and divides the total by electricity demand to give an LCOE. All costs are real 2024 prices. The inputs are in `costs`, `fuel_prices` and `carbon_price` in [scenarios/zcb_2024.json](../scenarios/zcb_2024.json), which other scenarios inherit.

## Method

The method is the one used by DESNZ Electricity Generation Costs and by `tools/lcoe/lcoe_lib.js` (used in `tools/ukgridsim`).

- Pre-development cost is spread evenly over `predev_years`, then construction cost (`capex`) over `build_years`.
- Fixed O&M is paid in each of the `lifespan` operating years.
- Costs are discounted annually at `hurdle_rate` (real, pre-tax) from the start of pre-development.
- Annual cost per kW is discounted costs over discounted operating years. This equals LCOE multiplied by annual output, so capacity that rarely runs still carries its full cost.
- Variable O&M is charged per MWh of output. Fuel and carbon are charged on modelled fuel use and backup CO2.

`annualisation.method` can instead be `annuity`, the PyPSA-Eur method: overnight cost (pre-development plus construction) times the annuity factor at one real discount rate for every technology (`annualisation.discount_rate`, 7% by default), plus fixed O&M. It has no interest during construction and no technology hurdle rates. It is a sensitivity and a basis for comparison with PyPSA results. The DESNZ method is the default. In zcb_2024 the annuity at 7% gives £82.9bn/yr against £92.7bn, with the largest falls for gas turbines, hydrogen storage and FT plant. Strike price calibration, implied hurdle rates and implied capital costs always use the DESNZ method.

Costs from older sources are uplifted to 2024 prices with the deflator the source itself used: the GDP deflator (ONS YBGB) for government appraisals that state GDP deflator prices, and CPI (ONS D7BT) otherwise.

Periods must be whole years. Decommissioning costs are left out (under £1/MWh for wind and solar in DESNZ 2025).

`capex` includes the DESNZ infrastructure cost per kW. `fixed_om` is DESNZ fixed O&M plus insurance plus connection and use of system charges. The connection charges include generator transmission charges, which also sit within the network charges in retail prices, so there is a small overlap. Strike prices include these charges, so keeping them makes the comparison like for like.

## Inputs

DESNZ values are the medium case for 2030 commissioning unless stated.

| Technology | Hurdle % | Pre-dev y, £/kW | Build y, £/kW | Fixed O&M £/kW/y | Var O&M £/MWh | Life y | Source |
|---|---|---|---|---|---|---|---|
| Onshore wind | 7.6 | 8, 80 | 2, 1,616 | 39.9 | 0 | 35 | DESNZ 2025 |
| Offshore wind | 7.3 | 7, 170 | 3, 2,500 | 141.6 | 0 | 30 | DESNZ 2025, low hurdle rate |
| Solar PV | 7.6 | 3, 30 | 1, 617 | 9.1 | 0 | 38 | DESNZ 2025 |
| Tidal | 10.5 | 12, 230 | 4, 4,200 | 235.4 | 0 | 25 | DESNZ 2025 FOAK, hurdle rate between low and medium |
| Wave | 11.4 | 12, 230 | 4, 4,200 | 235.4 | 0 | 25 | Tidal values, no DESNZ wave case |
| Geothermal electric | 8.9 | 2, 60 | 5, 5,980 | 125 | 26 | 30 | DESNZ 2025 deep geothermal, 2035 NOAK |
| Nuclear | 6.7 | 0, 0 | 10, 11,900 | 109 | 13 | 60 | Sizewell C, see below |
| Hydro | 7.6 | 3, 74 | 2, 3,961 | 60.3 | 7.9 | 40 | Arup 2016 hydro 5-16 MW, see below |
| Gas turbines | 8.9 | 2, 20 | 3, 1,015 | 22.9 | 5 | 25 | DESNZ 2025 CCGT |
| Electric storage (per kWh) | 8.9 | 0, 0 | 1, 230 | 5 | 0 | 15 | Modo Energy GB 2 hour survey, CEPA hurdle rate |
| H2 electrolysis (per kW electricity) | 10.1 | 0, 0 | 1, 1,564 | 62.5 | 0 | 25 | Technology-data 2030, CEPA hurdle rate, see below |
| Methanation (per kW H2 in, HHV) | 10.1 | 0, 0 | 1, 469 | 14.1 | 0 | 20 | Technology-data 2030, CEPA hurdle rate, see below |
| Anaerobic digestion (per kW methane) | 7.5 | 0, 0 | 1, 2,437 | 0 | 32.0 | 20 | GGSS impact assessment 13 MW reference plant, see below |
| FT synthetic fuel (per kW H2 in) | 10.1 | 0, 0 | 1, 2,681 | 71.5 | 2.15 | 25 | Technology-data 2030 electrobiofuels, see below |
| Hydrogen storage (per kWh) | 8.9 | 0, 0 | 1, 2.217 | 0 | 0 | 100 | Technology-data 2030 salt caverns |
| Methane storage (per kWh) | 8.9 | 0, 0 | 1, 0.2465 | 0.0013 | 0 | 100 | Technology-data 2030 underground gas storage |
| Synthetic fuel storage (per kWh) | 8.9 | 0, 0 | 1, 0.0181 | 0.0011 | 0 | 30 | Technology-data 2030 liquid product tanks |
| Power to X | 10.1 | 0, 0 | 1, 860 | 25.8 | 0 | 30 | ZCB capex and opex, CEPA hurdle rate |

`carbon_price` is £68/tCO2: the 2025 average UK ETS price (£50.16) plus Carbon Price Support (£18). Carbon Price Support is due to end in April 2028. The 2024 baseline uses £55.18/tCO2, the 2024 mean UK ETS auction price (£37.18) plus Carbon Price Support. The 2018 baseline sets it to 0.

### Electrolysis and methanation

From [PyPSA technology-data](https://github.com/PyPSA/technology-data) v0.15.0, `outputs/costs_2030.csv`, as used by PyPSA-Eur. Values are in 2025 euros and are converted to 2024 pounds by 0.829 (euro area HICP 128.75 to 126.07, then the 2024 ECB average rate of 0.8466).

- **Electrolysis.** €1,886/kW of electricity (IEA, The Role of E-fuels in Decarbonising Transport, and private communications). Fixed O&M 4% of capex and 25 year life (Danish Energy Agency, Technology Data for Renewable Fuels, 86 AEC 100 MW).
- **Methanation.** €856/kW of methane out (Agora Energiewende 2018, The Future Cost of Electricity-Based Synthetic Fuels, table 6). Fixed O&M 3% of capex (Agora, section 6.2.3.1). The 20 year life is an estimate in technology-data. The model sizes methanation by hydrogen in at HHV, so the cost is divided by 1.282 kWh of hydrogen (LHV) per kWh of methane and multiplied by 33.33/39.4 (hydrogen LHV over HHV per kg).

The original ZCB values were £328/kW for electrolysis and £236/kW for methanation. Technology-data's electrolysis capex rests partly on private communications and is the least certain of the two.

### FT synthetic fuel and fuel stores

From technology-data v0.15.0, converted as for electrolysis. Hurdle rates follow the nearest ZCB technology: 10.1% (CEPA power to X) for FT and 8.9% (electric storage) for the stores.

- **FT plant.** ZCB's FT takes 1.3 kWh of biomass and 0.61 kWh of hydrogen per kWh of fuel, closest to technology-data's electrobiofuels. Technology-data has no capex for electrobiofuels, so it is built as PyPSA-Eur does, from BtL plus the 0.731 share of BtL carbon not in its fuel times Fischer-Tropsch: (€3,929 × 0.383 + 0.731 × €2,139 × 0.704) / 1.322 = €1,972/kW of fuel, £1,635/kW. The model sizes FT by hydrogen in, so this is divided by 0.61, giving £2,681/kW. Fixed O&M is the electrobiofuels 2.67%, running cost is built the same way from the BtL and Fischer-Tropsch values (£2.15/MWh of fuel) and the life is the BtL 25 years. PyPSA-Eur marks electrobiofuels as experimental, and its blend (0.76 kWh of biomass and 0.94 of hydrogen per kWh of fuel) differs from ZCB's, so this is a proxy. Biomass for FT is not costed.
- **Hydrogen storage.** Salt caverns at €2.67/kWh of working gas (Danish Energy Agency), 100 year life. The full capacity is costed, although the model keeps a 10% floor (`hydrogen.minimum_store_level`).
- **Methane storage.** Underground gas storage at €0.297/kWh with 0.54% fixed O&M (Danish Energy Agency). Technology-data gives its 100 year life without a source. At 50 years the annual cost rises from £0.023 to £0.024/kWh.
- **Synthetic fuel storage.** Liquid product tanks at €218/m³ with 6.25% fixed O&M and a 30 year life (Stelter and Nishida 2013, IEA), at 10 MWh/m³. The model does not enforce `synth_fuel.store_capacity_GWh`, so the cost is on the input capacity, not the level reached.
- **Store power** (compressors, injection and withdrawal) is not costed. Technology-data gives about £16/kW for gas storage charging and £5/kW for discharging.

In zcb_2024 these add £9.2bn/yr: FT £3.6bn, hydrogen storage £3.9bn, methane storage £1.5bn and synthetic fuel storage £0.1bn. The hydrogen store is the largest because its 20 TWh is never more than half used.

In the baselines the methane and synthetic fuel stores stand in for fossil gas and oil supply, whose storage cost is within the fuel prices, so the build sets their costs to zero (baseline/inputs/11-costs.json).

### Anaerobic digestion and biogas feedstock

From the BEIS Green Gas Support Scheme final stage impact assessment (September 2021), which is in 2020 prices by the GDP deflator. Uplifted to 2024 by the GDP deflator (ONS YBGB, 100/84.9 = 1.178). CPI would give costs 4.6% higher.

- **Plant.** The 13 MW reference plant in Table D-2: £26.9m capital and £3.1m/yr operating cost at full load, which includes upgrading and propane. This gives £2,437/kW of methane. The 7.5 and 30 MW plants give £70 and £57/MWh of methane in all, against £62 for the 13 MW plant. Operating cost is proportional to output (paragraph D.2.1.6), so it is a variable cost of £32.0/MWh of methane.
- **Financing.** The impact assessment's 7.5% opportunity cost of capital, a 20 year economic life (paragraph 47) and construction in the year before production.
- **Capacity.** Biogas supply in the model is flat, so capacity is the mean methane output divided by an assumed 90% plant availability. The impact assessment uses a ramp-up profile instead.
- **Feedstock.** The first 34.15 TWh/yr of feedstock is waste, as in the land model, and is free. The impact assessment counts food waste gate fees as income and manure and sewage at no cost, so this is slightly cautious. Feedstock above that is grass, priced at the impact assessment's maize cost of £35/t at 642 kWh of biomethane per tonne (Annex C), £64.2/MWh of methane in 2024 prices (`biogas.crop_feedstock_gbp_MWh`). Maize stands in for grass as the energy crop the assessment sources.

In zcb_2024 (72 TWh/yr of feedstock, 43.2 TWh/yr of methane) the plant costs £2.7bn/yr and crop feedstock £1.5bn/yr: £62/MWh of methane from waste and £126/MWh from grass.

Anaerobic digestion and feedstock are in the generation cost with the other fuel production, so their cost is charged to electricity, although methane also supplies industry and heat (see [baseline/open-items.md](../baseline/open-items.md)).

## Calibration against strike prices

LCOE at the DESNZ or project load factor, compared with Allocation Round 7 (AR7) strike prices in 2024 prices:

| Technology | Load factor | Model £/MWh | Strike £/MWh |
|---|---|---|---|
| Solar PV | 11% | 64 | 65.23 (AR7) |
| Onshore wind | 30% | 72 | 72.24 (AR7) |
| Offshore wind | 49% | 90 | 91.20 (AR7, England and Wales) |
| Tidal | 37% | 268 | 265.00 (AR7) |
| Hydro | 35% | 138 | No CfD. Arup 2016 gives £130 at DECC hurdle rates |
| Nuclear | 90% | 168 | 124.7 (Hinkley Point C, £89.50 in 2012 prices) |
| CCGT with fuel and carbon | 30% | 143 | 147 (DESNZ 2025 LCOE) |

- **Solar and onshore wind** use DESNZ assumptions unchanged. DESNZ quotes £60 and £58/MWh at 12% and 37% load factors. AR7 prices match at load factors closer to GB fleet averages.
- **Offshore wind** uses the DESNZ low hurdle rate of 7.3%. At the medium 8.9% it is £101/MWh, above the AR7 price.
- **Tidal** uses the DESNZ 2025 first of a kind tidal stream costs and a 10.5% hurdle rate. At the medium 11.4% it is £286/MWh.
- **Hydro** has no DESNZ 2025 case. Costs are the Arup 2016 medium case for 5-16 MW run of river schemes (pre-development £55/kW, construction £2,958/kW, fixed O&M £45.1/kW/yr, variable O&M £5.9/MWh, 35% net load factor), in 2014 prices and uplifted to 2024 by CPI (133.9/100). Arup gives no hurdle rate, build period or lifetime, so these are the onshore wind hurdle rate of 7.6%, 3 and 2 years, and 40 years. This gives £138/MWh at 35%, against Arup's £130 at the updated DECC hurdle rates. Hydro has no CfD, so zcb_2024 prices it at this build-up cost. Most existing UK hydro is older and larger, so new-build costs overstate the 2024 fleet. 2024 prices imply a 4.8% hurdle rate.
- **Nuclear** uses the Sizewell C capital cost (about £38bn in 2024 prices for 3.2 GW, £11,900/kW) and its allowed return of 6.7% real. The Hinkley Point C strike price was set in 2013, before its cost overruns, and fell from £92.50 to £89.50 (2012 prices) when Sizewell C reached a final investment decision. Sizewell C costs reproduce the strike price at a hurdle rate of about 5%. Hinkley Point C is now estimated at £35bn in 2015 prices (EDF, February 2026), about £46bn in 2024 prices or £14,100/kW for 3.26 GW, with unit 1 due in 2030 after construction began in 2017. At 6.7% and a 13 year build that gives about £220/MWh. Sizewell C is used because it repeats the Hinkley design and is the more recent estimate. No scenario uses a lower nuclear cost. Nuclear O&M is taken from DESNZ 2020 and is unverified.

The model's own load factors come from the hourly dataset and are often lower than new-build project values. For example, ZCB offshore wind runs at 43% and tidal at 24%, giving £102 and £415/MWh. Technology LCOE in the model therefore sits above strike prices where the dataset load factor is low. The generation cost table shows each load factor.

### Tidal: strike price and build-up

In zcb_2024, tidal is £265/MWh at the AR7 price and £416/MWh on the build-up. The whole gap is load factor. The build-up reproduces the strike price at the DESNZ load factor of 37%, but the dataset tidal profile averages 23.9%, and 268 × 37 / 23.9 is about £415. A strike price is paid per MWh, so at the dataset's output it pays less than the plant costs. The price implies a 4.3% hurdle rate, against 10.5% in the build-up.

Which is right depends on the load factor real arrays achieve. DESNZ assumes 37% for new projects. MeyGen, the largest operating array (6 MW), generated 10.2 GWh in 2023, about 19%. If 37% is achievable, the dataset understates tidal output and the strike price is the better cost. If arrays run nearer 24%, the build-up is. In zcb_2024 tidal is 1.0 TWh, so the difference is £0.15bn a year.

## Generation cost

The generation cost is the cost per kWh that retail electricity prices start from. `generation_costs.basis` sets how it is built:

- `price`: a technology with a price in `generation_costs.price_gbp_MWh`, such as a CfD strike price or wholesale value plus support, is costed as output times that price. One without a price uses the build-up above.
- `lcoe`: every technology uses the build-up.

Imports have no build-up and always use their price. `generation_costs.other_support_gbp_bn` adds support that is not split by technology. Electrolysis, methanation and power to X always use the build-up. Both bases use output before curtailment.

Backup turbine capacity is shared between fuels by output, and each fuel adds its own fuel and carbon cost. Backup turbines and storage run as the rest of the system needs, so scenarios cost them on the build-up. A price for them only suits a baseline, where output is observed.

The build-up for every technology is also reported (`retail.electricity.resource_p_kWh`), as what the system would cost to build at today's costs.

### Presets

The UI has one setting for generation costs, with two price presets and the build-up. The presets are taken from the `generation_costs` block of a reference scenario:

- **2024 fleet prices** (baseline_2024): capture price plus support per MWh. Offshore wind £163, onshore £121, solar £108, hydro £106, nuclear £72, gas £85, bioenergy £131, oil £114 and imports £76/MWh, plus £3.0bn of Feed-in Tariff and capacity market payments. Built by `baseline/inputs/13-prices.json`, see [baseline-2024-notes.md](baseline-2024-notes.md).
- **New-build strike prices** (zcb_2024): AR7 strike prices for wind, solar and tidal, the Hinkley Point C strike price for nuclear, and the hydro build-up at its 35% reference load factor (£138), from the table above. Other plant uses the build-up.

Applied to another scenario, a preset sets only the fixed generators (wind, solar, marine, geothermal, nuclear, hydro and imports). Backup, storage and support not split by technology keep their current values. Editing a price shows the setting as custom. The build-up table shows only the components in use.

| Scenario | 2024 fleet prices | New-build strike prices | Build-up for every technology |
|---|---|---|---|
| baseline_2024 | 13.6 | 11.3 | 12.5 |
| zcb_2024 | 26.8 | 18.7 | 20.0 |

Generation cost in p/kWh delivered. In baseline_2024, thermal plant keeps 2024 prices under the second preset. The last column is `resource_p_kWh`, with imports at zero. In the UI, the build-up setting also counts imports at their price and adds support not split by technology.

### Implied hurdle rate and capital cost

For each fixed generator with a price and a build-up, the model reports the hurdle rate at which the build-up equals the price, and the construction cost that does at the input hurdle rate. At 2024 prices and 2024 output:

| Technology | Price £/MWh | Build-up £/MWh | Implied hurdle | Implied capex £/kW |
|---|---|---|---|---|
| Offshore wind | 163 | 128 | 10.8% | 3,705 |
| Onshore wind | 121 | 88 | 11.6% | 2,461 |
| Solar PV | 108 | 80 | 11.2% | 886 |
| Nuclear | 72 | 190 | 1.2% | 3,188 |

Wind and solar are paid as if they earn about 11% real, against 7.3 to 7.6% for new build. This is a mix of older, dearer plant and Renewables Obligation returns above cost. Existing nuclear is paid as if most of its capital were written off. In zcb_2024, AR7 prices imply 5.7% for offshore wind and 7.4% for onshore wind at the model's load factors, because strike prices assume higher load factors than the weather data gives.

## Sources

- DESNZ, [Electricity Generation Costs 2025](https://www.gov.uk/government/publications/electricity-generation-costs-2025), Annex A key assumptions, 2024 prices.
- CEPA for DESNZ, [Hurdle rates for electricity generation](https://assets.publishing.service.gov.uk/media/68cd1d818c44a661b4995d9f/cepa-desnz-hurdle-rates-electricity.pdf).
- DESNZ, [CfD Allocation Round 7 results](https://www.gov.uk/government/publications/contracts-for-difference-cfd-allocation-round-7-results/contracts-for-difference-allocation-round-7-results-accessible-webpage) (offshore wind) and Energy UK, [AR7 onshore results](https://www.energy-uk.org.uk/wp-content/uploads/2026/02/Energy-UK-explains-AR7-onshore-results-11-February-2026.pdf).
- DESNZ, [Sizewell C value for money assessment](https://assets.publishing.service.gov.uk/media/687f951dfdc190fb6b84689d/szc-fid-vfm-assessment.pdf) and Centrica, [Sizewell C announcement](https://www.centrica.com/media/tfnbsmm5/centrica-2025-sizewell-c-rns-announcement-final-220725.pdf).
- Low Carbon Contracts Company, [Hinkley Point C scheme register](https://register.lowcarboncontracts.uk/NUC-HPC-198), and New Civil Engineer, [Hinkley Point C's cost climbs to £35bn](https://www.newcivilengineer.com/latest/hinkley-point-cs-cost-climbs-to-35bn-with-confirmation-unit-1-will-power-up-in-2030-20-02-2026/).
- Arup for DECC, [Review of renewable electricity generation cost and technical assumptions](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/566718/Arup_Renewable_Generation_Cost_Report.pdf) (2016), section 19, hydro.
- ONS, [CPI index 00: all items, D7BT](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23), annual 2014, 2020 and 2024.
- ONS, [GDP at market prices: implied deflator, YBGB](https://www.ons.gov.uk/economy/grossdomesticproductgdp/timeseries/ybgb/ukea), annual 2020 and 2024.
- BEIS, [Green Gas Support Scheme final stage impact assessment](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1018133/green-gas-impact-assessment.pdf) (2021), paragraphs 47 and 55, Table D-2 and Annex C.
- PyPSA, [technology-data](https://github.com/PyPSA/technology-data) v0.15.0, `outputs/costs_2030.csv`, electrolysis, methanation, BtL, Fischer-Tropsch, electrobiofuels, hydrogen storage underground, gas storage and general liquid hydrocarbon storage (product).
- [MeyGen](https://en.wikipedia.org/wiki/MeyGen), 2023 net output.
- Modo Energy, [GB battery capex survey 2024](https://modoenergy.com/research/battery-energy-storage-capex-containerised-bess-development-costs-oem-balance-plant-bop-grid-connections-survey-2024) and [global battery capex September 2026](https://modoenergy.com/research/global-battery-capex-september-2026-research). £230/kWh is the 2024 median (£325/kWh) less the reported 29% fall.
- LSEG, [UKA price update Q1 2026](https://www.lseg.com/content/dam/data-analytics/en_us/documents/reports/lseg-q1-2026-eua-and-uka-price-update.pdf).
