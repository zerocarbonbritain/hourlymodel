# Cost assumptions

The cost model gives an annual cost for each technology and divides the total by electricity demand to give an LCOE. All costs are real 2024 prices. The inputs are in `costs`, `fuel_prices` and `carbon_price` in [scenarios/zerocarbonbritain.json](../scenarios/zerocarbonbritain.json), which other scenarios inherit.

## Method

The method is the one used by DESNZ Electricity Generation Costs and by `tools/lcoe/lcoe_lib.js` (used in `tools/ukgridsim`).

- Pre-development cost is spread evenly over `predev_years`, then construction cost (`capex`) over `build_years`.
- Fixed O&M is paid in each of the `lifespan` operating years.
- Costs are discounted annually at `hurdle_rate` (real, pre-tax) from the start of pre-development.
- Annual cost per kW is discounted costs over discounted operating years. This equals LCOE multiplied by annual output, so capacity that rarely runs still carries its full cost.
- Variable O&M is charged per MWh of output. Fuel and carbon are charged on modelled fuel use and backup CO2.

Periods must be whole years. Decommissioning costs are left out (under £1/MWh for wind and solar in DESNZ 2025).

`capex` includes the DESNZ infrastructure cost per kW. `fixed_om` is DESNZ fixed O&M plus insurance plus connection and use of system charges. The connection charges include generator transmission charges, which also sit within the separate £50/MWh network cost, so there is a small overlap. Strike prices include these charges, so keeping them makes the comparison like for like.

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
| Gas turbines | 8.9 | 2, 20 | 3, 1,015 | 22.9 | 5 | 25 | DESNZ 2025 CCGT |
| Electric storage (per kWh) | 8.9 | 0, 0 | 1, 230 | 5 | 0 | 15 | Modo Energy GB 2 hour survey, CEPA hurdle rate |
| H2 electrolysis | 10.1 | 0, 0 | 1, 328 | 11.4 | 0 | 30 | ZCB capex and opex, CEPA hurdle rate |
| Methanation | 10.1 | 0, 0 | 1, 236 | 10.8 | 0 | 30 | ZCB capex and opex, CEPA hurdle rate |
| Power to X | 10.1 | 0, 0 | 1, 860 | 25.8 | 0 | 30 | ZCB capex and opex, CEPA hurdle rate |

`carbon_price` is £68/tCO2: the 2025 average UK ETS price (£50.16) plus Carbon Price Support (£18). Carbon Price Support is due to end in April 2028. The baselines set `carbon_price` to 0 (see [baseline/open-items.md](../baseline/open-items.md)).

## Calibration against strike prices

LCOE at the DESNZ or project load factor, compared with Allocation Round 7 (AR7) strike prices in 2024 prices:

| Technology | Load factor | Model £/MWh | Strike £/MWh |
|---|---|---|---|
| Solar PV | 11% | 64 | 65.23 (AR7) |
| Onshore wind | 30% | 72 | 72.24 (AR7) |
| Offshore wind | 49% | 90 | 91.20 (AR7, England and Wales) |
| Tidal | 37% | 268 | 265.00 (AR7) |
| Nuclear | 90% | 168 | 128.9 (Hinkley Point C, £92.50 in 2012 prices) |
| CCGT with fuel and carbon | 30% | 143 | 147 (DESNZ 2025 LCOE) |

- **Solar and onshore wind** use DESNZ assumptions unchanged. DESNZ quotes £60 and £58/MWh at 12% and 37% load factors. AR7 prices match at load factors closer to GB fleet averages.
- **Offshore wind** uses the DESNZ low hurdle rate of 7.3%. At the medium 8.9% it is £101/MWh, above the AR7 price.
- **Tidal** uses a 10.5% hurdle rate. At the medium 11.4% it is £286/MWh.
- **Nuclear** uses the Sizewell C capital cost (about £38bn in 2024 prices for 3.2 GW) and its allowed return of 6.7% real. The Hinkley Point C strike price was set in 2013, before its cost overruns. Sizewell C costs reproduce £129/MWh at a hurdle rate of about 5%. Nuclear O&M is taken from DESNZ 2020 and is unverified.

The model's own load factors come from the hourly dataset and are often lower than new-build project values. For example, ZCB offshore wind runs at 43% and tidal at 24%, giving £102 and £415/MWh. Technology LCOE in the model therefore sits above strike prices where the dataset load factor is low.

## Sources

- DESNZ, [Electricity Generation Costs 2025](https://www.gov.uk/government/publications/electricity-generation-costs-2025), Annex A key assumptions, 2024 prices.
- CEPA for DESNZ, [Hurdle rates for electricity generation](https://assets.publishing.service.gov.uk/media/68cd1d818c44a661b4995d9f/cepa-desnz-hurdle-rates-electricity.pdf).
- DESNZ, [CfD Allocation Round 7 results](https://www.gov.uk/government/publications/contracts-for-difference-cfd-allocation-round-7-results/contracts-for-difference-allocation-round-7-results-accessible-webpage) (offshore wind) and Energy UK, [AR7 onshore results](https://www.energy-uk.org.uk/wp-content/uploads/2026/02/Energy-UK-explains-AR7-onshore-results-11-February-2026.pdf).
- DESNZ, [Sizewell C value for money assessment](https://assets.publishing.service.gov.uk/media/687f951dfdc190fb6b84689d/szc-fid-vfm-assessment.pdf) and Centrica, [Sizewell C announcement](https://www.centrica.com/media/tfnbsmm5/centrica-2025-sizewell-c-rns-announcement-final-220725.pdf).
- Modo Energy, [GB battery capex survey 2024](https://modoenergy.com/research/battery-energy-storage-capex-containerised-bess-development-costs-oem-balance-plant-bop-grid-connections-survey-2024) and [global battery capex September 2026](https://modoenergy.com/research/global-battery-capex-september-2026-research). £230/kWh is the 2024 median (£325/kWh) less the reported 29% fall.
- LSEG, [UKA price update Q1 2026](https://www.lseg.com/content/dam/data-analytics/en_us/documents/reports/lseg-q1-2026-eua-and-uka-price-update.pdf).
