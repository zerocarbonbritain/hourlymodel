# Cost assumptions

The cost model gives an annual cost for each technology and divides the total by electricity demand to give an LCOE. All costs are real 2024 prices. The inputs are in `costs`, `fuel_prices` and `carbon_price` in [scenarios/zcb_2024.json](../scenarios/zcb_2024.json), which other scenarios inherit.

## Method

The method is the one used by DESNZ Electricity Generation Costs and by `tools/lcoe/lcoe_lib.js` (used in `tools/ukgridsim`).

- Pre-development cost is spread evenly over `predev_years`, then construction cost (`capex`) over `build_years`.
- Fixed O&M is paid in each of the `lifespan` operating years.
- Costs are discounted annually at `hurdle_rate` (real, pre-tax) from the start of pre-development.
- Annual cost per kW is discounted costs over discounted operating years. This equals LCOE multiplied by annual output, so capacity that rarely runs still carries its full cost.
- Variable O&M is charged per MWh of output. Fuel and carbon are charged on modelled fuel use and backup CO2.

`annualisation.method` can instead be `annuity`, the PyPSA-Eur method: overnight cost (pre-development plus construction) times the annuity factor at one real discount rate for every technology (`annualisation.discount_rate`, 7% by default), plus fixed O&M. It has no interest during construction and no technology hurdle rates. It is a sensitivity and a basis for comparison with PyPSA results. The DESNZ method is the default. In zcb_2024 the annuity at 7% gives £85.5bn/yr against £95.3bn, with the largest falls for gas turbines, hydrogen storage and FT plant. Strike price calibration, implied hurdle rates and implied capital costs always use the DESNZ method.

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
| CCGT | 8.9 | 2, 20 | 3, 1,015 | 22.9 | 5 | 25 | DESNZ 2025 CCGT, de-rated capacity (see below) |
| OCGT | 8.9 | 2, 20 | 2, 644 | 16.4 | 5 | 25 | DESNZ 2025 OCGT 300 MW, de-rated capacity (see below) |
| Electric storage (per kWh) | 8.9 | 0, 0 | 1, 147 | 5 | 0 | 15 | Modo Energy GB 2 hour survey split by technology-data, CEPA hurdle rate, see below |
| Battery inverter (per kW) | 8.9 | 0, 0 | 1, 166 | 0 | 0 | 15 | As electric storage |
| H2 electrolysis (per kW electricity) | 10.1 | 0, 0 | 1, 1,564 | 62.5 | 0 | 25 | Technology-data 2030, CEPA hurdle rate, see below |
| Methanation (per kW H2 in, HHV) | 10.1 | 0, 0 | 1, 469 | 14.1 | 0 | 20 | Technology-data 2030, CEPA hurdle rate, see below |
| Anaerobic digestion (per kW methane) | 7.5 | 0, 0 | 1, 2,437 | 0 | 32.0 | 20 | GGSS impact assessment 13 MW reference plant, see below |
| FT synthetic fuel (per kW H2 in) | 10.1 | 0, 0 | 1, 2,681 | 71.5 | 2.15 | 25 | Technology-data 2030 electrobiofuels, see below |
| Hydrogen storage (per kWh) | 8.9 | 0, 0 | 1, 2.217 | 0 | 0 | 100 | Technology-data 2030 salt caverns |
| Methane storage (per kWh) | 8.9 | 0, 0 | 1, 0.2465 | 0.0013 | 0 | 100 | Technology-data 2030 underground gas storage |
| Synthetic fuel storage (per kWh) | 8.9 | 0, 0 | 1, 0.0181 | 0.0011 | 0 | 30 | Technology-data 2030 liquid product tanks |
| CO2 storage (per tCO2) | 8.9 | 0, 0 | 1, 2,710 | 27.1 | 0 | 25 | Technology-data 2030 CO2 storage tank |
| Hydrogen compressor (per kW H2 in, HHV) | 8.9 | 0, 0 | 1, 77.32 | 3.09 | 0 | 15 | Technology-data 2030, see below |
| Methane store charging (per kW) | 8.9 | 0, 0 | 1, 15.89 | 0 | 0 | 25 | Technology-data 2030, see below |
| Methane store discharging (per kW) | 8.9 | 0, 0 | 1, 5.30 | 0 | 0 | 25 | Technology-data 2030, see below |
| Power to X | 10.1 | 0, 0 | 1, 860 | 25.8 | 0 | 30 | ZCB capex and opex, CEPA hurdle rate |

`carbon_price` is £68/tCO2: the 2025 average UK ETS price (£50.16) plus Carbon Price Support (£18). Carbon Price Support is due to end in April 2028. The 2024 baseline uses £55.18/tCO2, the 2024 mean UK ETS auction price (£37.18) plus Carbon Price Support. The 2018 baseline sets it to 0.

### Gas turbines

Methane backup runs on CCGT first, up to `electric_backup.ccgt_capacity_GW`, and OCGT meets the rest. Both are DESNZ 2025 values for 2030 commissioning, medium case. OCGT is the 300 MW unit: £600/kW construction plus £13.2m of infrastructure over 299 MW (£644/kW), fixed O&M of £11.8 plus £1.5 insurance plus £3.1/kW/yr connection and use of system charges. Efficiencies are the DESNZ values, CCGT 54% (`methane_efficiency`, 50% before 2026-11-02) and OCGT 35% (`ocgt_efficiency`). DESNZ does not state the basis. They match the LeighFisher 2016 values for DECC (about 60% and 39% LHV) converted at 89.82% for gas, so they are HHV, as in the model. The 760 MW OCGT is £626/kW at 36%. zcb_2024 keeps all backup on CCGT (`ccgt_capacity_GW` 100) until the phase 5 retune.

Each class is costed at its peak output divided by its de-rating factor, so the fleet covers plant outages. OCGT runs only when CCGT is at capacity, so OCGT covers its own peak and CCGT the rest of the peak need. The factors are the Capacity Market de-rating factors in the T-4 auction for delivery year 2030/31: 0.9048 for CCGT (`ccgt_derating_factor`) and 0.9297 for OCGT and reciprocating engines (`ocgt_derating_factor`). Annual costs per de-rated kW are £151.9 for CCGT and £93.4 for OCGT. No further margin is added for weather: the model sizes backup to the worst hour in ten weather years with no demand unmet, which is stricter than the 3 hour loss of load expectation in the GB reliability standard. Costed capacity is 48.0 GW in zcb_2024 (peak need 43.45 GW, all CCGT, +£0.63bn/yr) and 33.4 GW in baseline_2024 (30.2 GW, against 46.2 GW of fossil and bioenergy capacity in DUKES 5.7). Dispatch is unchanged.

### Battery energy and power

Modo Energy's GB survey gives £230/kWh for a 2 hour system (the 2024 median of £325/kWh less the reported 29% fall). Technology-data v0.15.0 splits battery cost into storage at €190/kWh and the inverter at €214/kW, £157/kWh and £177/kW at the 0.829 conversion. For a 2 hour system that is £246/kWh. Both parts are scaled by 230/246 to the Modo total: £147/kWh of energy and £166/kW of inverter. A 2 hour battery costs the same as before, and longer batteries cost less per kWh. Fixed O&M of £5/kWh/yr stays on energy. Both parts use the 15 year life of the system price, not technology-data's 25 years for cells and 10 for the inverter. The inverter is sized to the larger of `electric_storage.charge_capacity_GW` and `discharge_capacity_GW`. zcb_2024 (200 GWh, 50 GW) goes from £6.67bn to £5.65bn/yr.

### Electrolysis and methanation

From [PyPSA technology-data](https://github.com/PyPSA/technology-data) v0.15.0, `outputs/costs_2030.csv`, as used by PyPSA-Eur. Values are in 2025 euros and are converted to 2024 pounds by 0.829 (euro area HICP 128.75 to 126.07, then the 2024 ECB average rate of 0.8466).

- **Electrolysis.** €1,886/kW of electricity (IEA, The Role of E-fuels in Decarbonising Transport, and private communications). Fixed O&M 4% of capex and 25 year life (Danish Energy Agency, Technology Data for Renewable Fuels, 86 AEC 100 MW).
- **Methanation.** €856/kW of methane out (Agora Energiewende 2018, The Future Cost of Electricity-Based Synthetic Fuels, table 6). Fixed O&M 3% of capex (Agora, section 6.2.3.1). The 20 year life is an estimate in technology-data. The model sizes methanation by hydrogen in at HHV, so the cost is divided by 1.282 kWh of hydrogen (LHV) per kWh of methane and multiplied by 33.33/39.4 (hydrogen LHV over HHV per kg).

The original ZCB values were £328/kW for electrolysis and £236/kW for methanation. Technology-data's electrolysis capex rests partly on private communications and is the least certain of the two.

### FT synthetic fuel and fuel stores

From technology-data v0.15.0, converted as for electrolysis. Hurdle rates follow the nearest ZCB technology: 10.1% (CEPA power to X) for FT and 8.9% (electric storage) for the stores, including the CO2 store.

- **FT plant.** ZCB's FT takes 1.3 kWh of biomass and 0.61 kWh of hydrogen per kWh of fuel, closest to technology-data's electrobiofuels. Technology-data has no capex for electrobiofuels, so it is built as PyPSA-Eur does, from BtL plus the 0.731 share of BtL carbon not in its fuel times Fischer-Tropsch: (€3,929 × 0.383 + 0.731 × €2,139 × 0.704) / 1.322 = €1,972/kW of fuel, £1,635/kW. The model sizes FT by hydrogen in, so this is divided by 0.61, giving £2,681/kW. Fixed O&M is the electrobiofuels 2.67%, running cost is built the same way from the BtL and Fischer-Tropsch values (£2.15/MWh of fuel) and the life is the BtL 25 years. PyPSA-Eur marks electrobiofuels as experimental, and its blend (0.76 kWh of biomass and 0.94 of hydrogen per kWh of fuel) differs from ZCB's, so this is a proxy.
- **Hydrogen storage.** Salt caverns at €2.67/kWh of working gas (Danish Energy Agency), 100 year life. The full capacity is costed, although the model keeps a 10% floor (`hydrogen.minimum_store_level`).
- **Methane storage.** Underground gas storage at €0.297/kWh with 0.54% fixed O&M (Danish Energy Agency). Technology-data gives its 100 year life without a source. At 50 years the annual cost rises from £0.023 to £0.024/kWh.
- **Synthetic fuel storage.** Liquid product tanks at €218/m³ with 6.25% fixed O&M and a 30 year life (Stelter and Nishida 2013, IEA), at 10 MWh/m³. The cost is on `synth_fuel.store_capacity_GWh`, which the model enforces (since 2026-11-02).
- **CO2 storage.** Pressurised steel tanks for liquid CO2 at €3,269/tCO2 with 1% fixed O&M and a 25 year life (Lauri et al. 2014, table 3, via technology-data), £2,710/t. The annual cost is £301/t/yr. Liquefaction is costed separately in technology-data (€21/tCO2/h and 0.123 MWh of electricity per tonne) and is left out, so the CO2 store has no energy use. At zcb_2024's biogas CO2 flow (585 t/h) liquefaction would use about 0.6 TWh/yr of electricity. zcb_2024 has a 100 kt store (£0.03bn/yr), about a week of biogas CO2. The baselines have none.
- **Store power.** Each is sized by the largest hourly flow into or out of the store, after any spill. Hurdle rate 8.9% as for the stores.
  - Hydrogen compressor: €110.26/kW of H2 with 4% fixed O&M and a 15 year life (Stöckl et al. 2021, via technology-data), £91.40/kW. Converted from LHV to HHV as for methanation (33.33/39.4), £77.32/kW. In zcb_2024 20.5 GW, £0.26bn/yr. The compressor's electricity use (0.05 MWh per MWh of H2) changes dispatch and is left out. Technology-data has no separate cost for withdrawing hydrogen.
  - Methane store charging and discharging: €19.17 and €6.39/kW (Danish Energy Agency), £15.89 and £5.30/kW. Technology-data gives no life or fixed O&M, so these use PyPSA-Eur's default 25 years and zero. In zcb_2024 4.4 GW (£0.007bn/yr) and 91.9 GW (£0.05bn/yr).
  - The baselines set the methane store costs to zero, as for the store itself.

In zcb_2024 these add £9.2bn/yr: FT £3.6bn, hydrogen storage £3.9bn, methane storage £1.5bn and synthetic fuel storage £0.1bn. The hydrogen store is the largest because its 20 TWh is never more than half used.

In the baselines the methane and synthetic fuel stores stand in for fossil gas and oil supply, whose storage cost is within the fuel prices, so the build sets their costs to zero (baseline/inputs/11-costs.json).

### FT biomass

Biomass for FT costs £20/MWh (`synth_fuel.biomass_gbp_MWh`). International Energy Crops offered £63/t delivered for 15% moisture miscanthus bales within 60 miles of Selby (Farmers Weekly, June 2012). At 4.44 MWh/t (NNFCC, under 16% moisture) this is £14.2/MWh, or £19.6/MWh in 2024 prices by the GDP deflator (ONS YBGB, 100/72.2 = 1.385). It is a contract price paid to a grower, and is 14 years old. Lower references are Wang et al. (2012), £40 per oven-dried tonne at the farm gate with no stated price year, and technology-data's biomass at €9.35/MWh (£7.75, IEA 2011). DESNZ's UK and Global Bioenergy Resource Model has a feedstock price section, which has not been checked. In zcb_2024 biomass costs £2.60bn/yr on 130 TWh/yr.

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

### Network cost

Network charges start from the 2024 Ofgem cap: 3.394 p/kWh and £116.23 per customer per year. They are in retail and fuel prices, not in the system cost.

With `retail.electricity.network_basis` `peak` (zcb_2024), the network total has two parts. Baselines use `per_kWh`, with neither part.

- **Peak scaling.** £bn/yr = 3.394 p/kWh × 269.39 TWh × (peak / 55.19 GW). The reference values are baseline_2024 model outputs (`balance.max_electricity_demand` and delivered electricity) and need updating when the baseline changes. Both peaks come from the same model, so its high peak (open item "Peak demand is high") partly cancels. The peak is end use and excludes electrolysis.
- **New transmission.** `network_investment_gbp_bn` as an annuity at `network_investment_return_prc` over `network_investment_life_years`. NESO identifies around £89bn of transmission investment beyond 2030. The return is 4.6%, within the 4.46 to 4.67% CPIH-real allowed return on capital under RIIO-T3 that NESO reports. The 40 year life is our assumption. NESO's annex gives no price base for the £89bn, and adds that it is not a full assessment, leaving out asset replacement, asset health and connection-specific works.

Fuel users pay `network_fuel_share_prc` of the total, 20% in zcb_2024. This is a judgement: electrolysis is likely to sit near generation, and NESO identifies up to 10 GW of flexible demand including electrolysers that could co-locate in North Scotland and Shetland. Electricity users pay the rest over end use. Network costs are outside the system cost.

In zcb_2024 peak demand is 95.2 GW (1.72 times 2024), so peak scaling gives £15.8bn/yr and new transmission £4.9bn/yr, £20.7bn in total. Fuel users pay £4.1bn and electricity users £16.6bn, 4.81 p/kWh over 344 TWh of end use. The standing charge adds £3.3bn across 28.6 million homes, giving £24.0bn. Non-domestic standing charges are not counted. Each 10 GW of peak reduction saves about £1.7bn/yr. A peak based on network capacity costs, such as technology-data's distribution grid at £554/kW, is an alternative not used yet.

The 2024 equivalent is £12.5bn (£9.1bn per kWh and £3.3bn standing). TNUoS target revenue was £3.13bn in 2024 and BSUoS was £7.63 to £14.03/MWh, as reported by Drax. A published total including DUoS has not been found. Peak scaling also grows the existing transmission share, a small overlap with new transmission. Offshore connection costs are within wind capex. No figure is included for distribution beyond peak scaling, as ED3 business plans are not due until December 2026, so the total may still be low. See the open item.

### Presets

The UI has one setting for generation costs, with two price presets and the build-up. The presets are taken from the `generation_costs` block of a reference scenario:

- **2024 fleet prices** (baseline_2024): capture price plus support per MWh. Offshore wind £163, onshore £121, solar £108, hydro £106, nuclear £72, gas £85, bioenergy £131, oil £114 and imports £76/MWh, plus £3.0bn of Feed-in Tariff and capacity market payments. Built by `baseline/inputs/13-prices.json`, see [baseline-2024-notes.md](baseline-2024-notes.md).
- **New-build strike prices** (zcb_2024): AR7 strike prices for wind, solar and tidal, the Hinkley Point C strike price for nuclear, and the hydro build-up at its 35% reference load factor (£138), from the table above. Other plant uses the build-up.

Applied to another scenario, a preset sets only the fixed generators (wind, solar, marine, geothermal, nuclear, hydro and imports). Backup, storage and support not split by technology keep their current values. Editing a price shows the setting as custom. The build-up table shows only the components in use.

| Scenario | 2024 fleet prices | New-build strike prices | Build-up for every technology |
|---|---|---|---|
| baseline_2024 | 13.6 | 11.3 | 12.6 |
| zcb_2024 | 29.5 | 18.8 | 20.4 |

Generation cost after fuel users pay their share, in p/kWh of end use for zcb_2024 and p/kWh delivered for baseline_2024. In baseline_2024, thermal plant keeps 2024 prices under the second preset, and the last column is `resource_p_kWh`, with imports at zero. In the UI, the build-up setting also counts imports at their price and adds support not split by technology.

### Fuel users and hourly prices

Fuel users pay the average production cost of hydrogen, methane and synthetic fuel, and electricity users pay the rest of the generation cost. Production cost covers plant, stores and feedstock, with electricity at the hourly price and hydrogen at its own production cost. Costs are shared over all fuel produced, so stores count fully in the fuel and turbine methane stays with electricity users. In zcb_2024 this is £121/MWh for hydrogen, £147 for methane and £139 for synthetic fuel. Fuel users pay £21.52bn/yr of £86.35bn. Electricity users pay £64.83bn over 344 TWh of end use, so the generation cost is 18.8 p/kWh. With network costs the unit rate is 29.07 p/kWh and the household electricity bill £1,125. Delivered electricity is 483 TWh: end use, 136 TWh of electrolysis and 3 TWh of battery losses. Baselines burn fossil fuel, so their fuel values are zero and their retail prices do not change.

Fuel prices add the fuel users' network share to production cost, shared by hydrogen content: 1 for hydrogen, 0.61 for synthetic fuel and 0.51 for methane in zcb_2024, where methanation hydrogen is 51% of methane produced. This is £44/MWh of hydrogen, giving prices of £165/MWh for hydrogen, £169 for methane and £166 for synthetic fuel (175 p/litre). Fuel sales in the system cost table leave out the network share, because network costs are outside the system cost.

`fuel_values` holds marginal values, which set hourly electricity prices and not fuel prices. They are in £/MWh, from the 2010 PyPSA expansion at 3 hour steps. They are provisional until phase 6 recalibrates them on the ten year optimum.

- **Hydrogen, £150.** The mean price in that run (£149), and the electricity price in electrolysis hours divided by 0.8 (£151).
- **Methane, £235.** The price weighted by turbine fuel use. End users' mean is £219, about 7% lower.
- **Synthetic fuel.** Hydrogen at 0.61 times its value, biomass at 1.3 times its price, and the FT plant cost per MWh. This marginal value is £156/MWh in zcb_2024 (15.6 p/kWh, 164 p/litre at the diesel energy density), and PyPSA gives £145.

### 2024 fossil fuel reference

`fossil_reference` in zcb_2024 holds 2024 fossil prices, taxes and volumes. baseline_2024 merges onto zcb_2024, so every scenario shows the same reference. It does not change the system cost or dispatch.

`fossil_bill` applies those prices and taxes to the scenario's own fossil fuel for final users. The fossil share of final gas and liquid demand comes from the dispatch: fossil fuel drawn when fuel stores run out, less fossil fuel for turbines, which is costed in the build-up. Biofuel counts with liquid fossil fuel, as it is bought on the same market and is priced as road fuel. Fuel users pay production cost only on the remaining share. All prices stay at 2024 levels, so a scenario for another year compares volumes and system choices at 2024 fossil prices. `fuel_prices` in zcb_2024 hold the 2024 prices from QEP 3.2.1 (3.499, 5.245 and 1.399 p/kWh). They have no effect until a variant burns fossil fuel in turbines. Fossil fuel for final users carries only the carbon costs paid in 2024, so a variant with fossil fuel can look cheaper than one without.

Volumes are baseline_2024 model outputs, fixed in TWh/yr. Validation compares them with a live baseline run. Refinery and extraction fuel is left out, as it is in product prices. Road fuel includes 32 TWh of biofuel, priced as fossil fuel.

Prices and taxes:

- **Petrol and diesel.** QEP 4.1.2 pump prices (`retail.road_fuel`), with duty of 52.95 p/litre and VAT of 20%. This gives 64.95 and 70.66 p/litre before tax, matching the annual averages on the QEP 4.1.2 excluding VAT sheet. Cars and vans pay duty and VAT. Other transport is at the diesel price with duty only, as businesses reclaim VAT. Rail and domestic shipping pay less duty than this and are not split out.
- **Jet fuel, £47.4/MWh.** $99/barrel (IATA), at $1.278/£ (2024 average), 159 litres per barrel and 46.2 GJ/t gross at 0.8 kg/litre. No duty or VAT.
- **Marine gas oil, £50.2/MWh.** $812/t, the Ship & Bunker average of 20 ports, at 45.6 GJ/t gross. No duty or VAT.
- **Heating oil.** Burning oil at 58.24 p/litre with 5% VAT (QEP 4.1.2), at 10.294 kWh/litre (DESNZ 2024 CO2 factors per litre and per kWh). VAT is applied to services use as well, which adds about £0.05bn.
- **Industry oil.** Gas oil at 72.32 p/litre with 5% VAT (QEP 4.1.2), at 10.742 kWh/litre. Rebated duty is 10.18 p/litre, from the QEP 4.1.2 excluding VAT sheet. VAT is reclaimed.
- **Household gas, delivered.** The Ofgem cap components and QEP 3.2.1 commodity price in baseline_2024, with the standing charge spread over use. Validation compares this with the baseline's household gas spend.
- **Services and industry gas, delivered.** QEP 3.4.1 and 3.4.2 average non-domestic prices: 5.376 p/kWh excluding Climate Change Levy and 5.667 p/kWh including it.
- **Coal outside power stations.** 1.399 p/kWh, the QEP 3.2.1 power station price. No retail or industrial price is sourced. At £0.3bn it has little effect on the total.
- **Power station fuel.** QEP 3.2.1 prices. The only carbon cost is the £55.18/tCO2 paid by power stations on 40.03 MtCO2.

UK ETS costs for industry and aviation also applied in 2024. They are left out, as free allocation means the net cost is not known from the sources used here. Road fuel and household gas paid no carbon price.

The result is £72bn/yr before tax and £105bn after for final users, and £79bn and £113bn with power station fuel. Power station fuel is in electricity bills, so it should not be added to them. Road fuel duty in the reference comes to £23.8bn.

The total cost card is the system cost plus electricity networks, including the fuel users' share. It also adds the scenario's fossil bill for final users. Power station fuel is already in the system cost. Tax is VAT on household electricity, VAT on synthetic car fuel, and the taxes on the fossil bill. Electricity policy, supplier and standing charges are left out (see Cost model in baseline/open-items.md). The carbon cost in baseline generation prices stays in the before tax figure.

The cost per kWh card divides total cost by final energy demand, including international shipping. This is `final_consumption`, so it counts heat pump ambient heat, solar thermal and geothermal heat as energy (161 TWh in zcb_2024 and 16 TWh in baseline_2024). Boilers count fuel in, and electric vehicles count electricity in, so a scenario with more electric vehicles shows a higher cost per kWh for the same travel.

The tax gap card is 2024 tax less the scenario's tax, using the taxes counted in total cost. 2024 tax is the final users' tax in this reference plus household electricity VAT of £1.48bn (`household_electricity_vat_bn`, 5/105 of baseline_2024 household electricity spend). Validation compares it with a live baseline run. The carbon cost in baseline generation prices is not counted, which leaves the gap about £2.2bn lower than it would be otherwise.

The fuel table shows each fuel price, with its network share, as a multiple of the bulk price it replaces, on energy and with no carbon price. The network share is electricity network cost for electrolysis and not fuel delivery, so bulk fossil prices are the like for like comparison. In zcb_2024 methane is 4.8 times power station gas (£34.99/MWh), and synthetic fuel 3.5 times jet fuel and 3.3 times marine gas oil. Hydrogen has no comparison, as it has no direct 2024 fossil equivalent.

The pump price comparison puts synthetic fuel at the diesel energy density, at 175 p/litre before tax. It is 210 p/litre with VAT and no duty, or 273 p/litre with road duty and VAT, against 148 p/litre for diesel. Fossil prices before tax include refining, distribution and retail margin. The synthetic price leaves out distribution and retail margin. Car fuel spend prices synthetic fuel with VAT and no duty, and its fossil and biofuel share at pump prices.

The exchange rate and calorific values for jet fuel and marine gas oil are recalled figures, not yet checked against the Bank of England and DUKES annex A. They affect only this reference.

The hourly electricity price (`d.electricity_price`, summarised in `o.prices`) follows what is at the margin:

| Hour | Price |
|---|---|
| Backup above 0.5 GW | (methane value / efficiency + running cost) / grid loss factor, for CCGT or OCGT, plus the scarcity adder |
| Curtailing | 0 |
| Electrolysis | efficiency x hydrogen value |
| Battery discharging | the next hour with a price set by the rows above, divided by round trip efficiency if that hour is not backup |
| Battery charging | as discharging, times round trip efficiency |

The scarcity adder spreads the annual cost of the peak turbine class over hours within 10% of peak backup, in proportion to depth. Backup below 0.5 GW covers 14% of hours but 1% of backup energy, with the battery discharging in 93% of them.

Check against PyPSA at equal capacities, 2010 alone at 3 hour steps (`scripts/price_check.py`). Mean price £184.5 against £190.2/MWh, weighted by load £221.5 against £227.0, correlation 0.90 (0.94 without the highest 1% of prices). In PyPSA's turbine hours the means are £566.8 and £556.3. Revenue over system cost is 1.127 against 1.126.

For zcb_2024 over ten years, revenue is £54.7bn from electricity and £26.7bn from fuel, 85% of system cost, and offshore wind earns 67% of its cost. This is before the phase 5 retune, on fuel values from a low wind year, so it does not yet pass the phase 6 checks.

The figures above compare revenue with the build-up. The page and `o.prices` now use the selected generation costs, so the system cost follows the choice between strike prices and the build-up. `o.total_annual_cost` stays on the build-up for comparison and for the PyPSA checks.

Bills do not use hourly revenue. `o.prices.recovery` is a check at marginal prices: hourly revenue plus fuel at its marginal values (`o.prices.fuel_value_sales`), over the selected system cost. In zcb_2024 with AR7 prices this is 92% of £86.3bn, with 72% of offshore wind's cost. On the build-up it is 86% of £91.9bn and 64%. `o.prices.bill_top_up` is what electricity users pay above hourly revenue, a top-up similar to Contract for Difference payments, calculated for the whole system: £12.9bn (3.7 p/kWh of end use) with AR7 prices and £18.4bn (5.3 p/kWh) on the build-up.

Selecting strike prices assumes generators accept them at the model's load factors, which are lower than AR7 assumes. Offshore wind is paid £91/MWh against a build-up of £102/MWh.

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

- NESO, [Beyond 2030 update, investor annex](https://www.neso.energy/document/385581/download), August 2026 (about £89bn of transmission investment, allowed returns, co-location).
- Drax, [Falling transmission charges](https://energy.drax.com/insights/tnuos-charges-falling) (2024 TNUoS and BSUoS).
- DESNZ, [Electricity Generation Costs 2025](https://www.gov.uk/government/publications/electricity-generation-costs-2025), Annex A key assumptions, 2024 prices.
- CEPA for DESNZ, [Hurdle rates for electricity generation](https://assets.publishing.service.gov.uk/media/68cd1d818c44a661b4995d9f/cepa-desnz-hurdle-rates-electricity.pdf).
- DESNZ, [CfD Allocation Round 7 results](https://www.gov.uk/government/publications/contracts-for-difference-cfd-allocation-round-7-results/contracts-for-difference-allocation-round-7-results-accessible-webpage) (offshore wind) and Energy UK, [AR7 onshore results](https://www.energy-uk.org.uk/wp-content/uploads/2026/02/Energy-UK-explains-AR7-onshore-results-11-February-2026.pdf).
- DESNZ, [Sizewell C value for money assessment](https://assets.publishing.service.gov.uk/media/687f951dfdc190fb6b84689d/szc-fid-vfm-assessment.pdf) and Centrica, [Sizewell C announcement](https://www.centrica.com/media/tfnbsmm5/centrica-2025-sizewell-c-rns-announcement-final-220725.pdf).
- Low Carbon Contracts Company, [Hinkley Point C scheme register](https://register.lowcarboncontracts.uk/NUC-HPC-198), and New Civil Engineer, [Hinkley Point C's cost climbs to £35bn](https://www.newcivilengineer.com/latest/hinkley-point-cs-cost-climbs-to-35bn-with-confirmation-unit-1-will-power-up-in-2030-20-02-2026/).
- Arup for DECC, [Review of renewable electricity generation cost and technical assumptions](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/566718/Arup_Renewable_Generation_Cost_Report.pdf) (2016), section 19, hydro.
- ONS, [CPI index 00: all items, D7BT](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23), annual 2014, 2020 and 2024.
- ONS, [GDP at market prices: implied deflator, YBGB](https://www.ons.gov.uk/economy/grossdomesticproductgdp/timeseries/ybgb/ukea), annual 2020 and 2024.
- BEIS, [Green Gas Support Scheme final stage impact assessment](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1018133/green-gas-impact-assessment.pdf) (2021), paragraphs 47 and 55, Table D-2 and Annex C.
- PyPSA, [technology-data](https://github.com/PyPSA/technology-data) v0.15.0, `outputs/costs_2030.csv`, electrolysis, methanation, BtL, Fischer-Tropsch, electrobiofuels, hydrogen storage underground, gas storage, general liquid hydrocarbon storage (product) and CO2 storage tank.
- [MeyGen](https://en.wikipedia.org/wiki/MeyGen), 2023 net output.
- Farmers Weekly, [Crops for fuel are big business at Cereals 2012](https://www.fwi.co.uk/business/crops-for-fuel-are-big-business-at-cereals-2012). NNFCC, [Miscanthus crop factsheet](https://www.nnfcc.co.uk/files/mydocs/miscanthus%20rev%20Feb%202011.pdf). Wang et al., [Economic and greenhouse gas costs of Miscanthus supply chains in the United Kingdom](https://researchonline.ljmu.ac.uk/id/eprint/4650/), GCB Bioenergy 2012.
- IATA, [Fuel fact sheet](https://www.iata.org/en/iata-repository/pressroom/fact-sheets/fact-sheet-fuel). Ship & Bunker, [Annual average bunker price at key hubs mostly flat in 2024](https://shipandbunker.com/news/world/424013-annual-average-bunker-price-at-key-hubs-mostly-flat-in-2024).
- Modo Energy, [GB battery capex survey 2024](https://modoenergy.com/research/battery-energy-storage-capex-containerised-bess-development-costs-oem-balance-plant-bop-grid-connections-survey-2024) and [global battery capex September 2026](https://modoenergy.com/research/global-battery-capex-september-2026-research). £230/kWh is the 2024 median (£325/kWh) less the reported 29% fall.
- NESO, [Capacity Market Register](https://www.neso.energy/data-portal/capacity-market-register), Capacity Market De-Rating Factors CSV (September 2026).
- LSEG, [UKA price update Q1 2026](https://www.lseg.com/content/dam/data-analytics/en_us/documents/reports/lseg-q1-2026-eua-and-uka-price-update.pdf).
