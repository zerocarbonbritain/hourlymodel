# Clean Power 2030

[clean_power_2030.json](../scenarios/clean_power_2030.json) represents the UK government's Clean Power 2030 target for 2030. It follows the NESO Further Flex and Renewables pathway, which sits at the upper end of the capacity ranges in the DESNZ Clean Power 2030 Action Plan (December 2024). It is built by [build_clean_power_2030.py](build_clean_power_2030.py) from the [2024 baseline](baseline-2024-notes.md):

```
python3 -I docs/build_clean_power_2030.py
```

Edit the script, not the scenario file. Rebuild after a baseline change.

## Sources

- NESO, Clean Power 2030: Advice on achieving clean power for Great Britain by 2030, November 2024. Table 2 (capacities) and section 3.3.
- NESO, Clean Power 2030 data workbook (neso.energy document 346781). Sheet ES1 gives capacity, generation, curtailment, storage, interconnector flows and electrolysis for 2030. Sheet ED1 gives demand by sector for 2023 to 2030.
- NESO, Annex 4: Costs and benefit analysis, figure 7 (2030 energy flow).
- DESNZ, Clean Power 2030 Action Plan, table 1 (capacity ranges).

NESO figures are for Great Britain. The model covers the UK. NESO modelled one weather year (2013). The model uses its ten year dataset.

## Method

Supply follows the NESO pathway. Demand is the 2024 baseline plus the NESO change in demand from 2024 to 2030, scaled from GB to the UK by population (factor 1.029). Using the change keeps the baseline's calibration to 2024 statistics.

Supply:

- Offshore wind 50.65 GW, onshore wind 27.33 GW plus 1.4 GW in Northern Ireland, held at its current level. Solar 47.35 GW, nuclear 3.52 GW at NESO's 82% load factor. Marine 0.25 GW, as tidal.
- Wind availability is set so output before curtailment matches NESO: offshore 44.5% and onshore 29.3% load factor. NESO's solar load factor of 12.0% would need an availability of 1.27, above the potential in the weather data. Solar availability is capped at 1, which gives 9.4%.
- Batteries (27.4 GW, 48.9 GWh) and long duration storage (7.9 GW, 98.9 GWh) form one store of 35.2 GW and 147.8 GWh. Charge and discharge efficiencies are 0.837, from NESO's combined round trip of 70%.
- Interconnectors 12.45 GW. Unabated gas capacity 35 GW, as CCGT.
- Dispatchable output is split as in NESO: gas including CHP and the small hydrogen and CCS output 45.1%, bioenergy 44.3%, non-biodegradable waste 10.6% (energy from waste, the baseline's other thermal share). There is no coal. Half of energy from waste is taken as biodegradable. NESO's other renewables (mainly landfill and sewage gas) count as bioenergy, as in the baseline.

Demand:

- Residential demand outside heat falls by 21.0 TWh, mostly through lighting and appliance efficiency. Domestic lighting, appliances and electric cooking are scaled down by 27%.
- Industrial and commercial demand outside heat rises by 19.2 TWh, mostly from data centres. It is added to services lighting and appliances.
- Heat pump and district heat electricity rises by 10.4 TWh. The heat pump share of heat is calibrated to this and replaces gas boilers: 6.0% to 13.4%.
- Road transport electricity rises by 22.5 TWh. The car and van EV share is calibrated to this: 5% to 33%. The EV fleet battery and charge rate scale with EV demand, and smart charging is on.
- Network losses equal NESO's system demand less consumer demand, 28.7 TWh. Own use is set to zero, and the grid loss share is calibrated to 8.44%. It applies to delivered electricity, not to excess.

Electrolysis is 3.65 GW and runs on surplus electricity, as in NESO. Its hydrogen replaces gas in low temperature industrial process heat. NESO expects no large hydrogen storage by 2030. With a 1 TWh store, a flat industrial demand can use 7.4 TWh/yr of electrolysis electricity before shortfalls appear. Industrial hydrogen demand is set to that level (10.8% of low temperature process heat).

The share of the backup requirement met by imports is calibrated to NESO's gross imports of 21.6 TWh. The model has no exports. Surplus electricity is excess, which covers both NESO's exports and its curtailment.

Other inputs stay at 2024 levels, including population, travel, building fabric, industrial output and all non-electric demand except what heat pumps, EVs and hydrogen displace.

## Results

Model values are UK, ten year averages. NESO values are GB, 2030, in TWh/yr unless stated.

| | Model | NESO |
|---|---|---|
| Offshore wind, before curtailment | 197.4 | 197.5 |
| Onshore wind, before curtailment | 73.8 | 70.2 (GB only) |
| Solar, before curtailment | 39.2 | 49.7 |
| Nuclear | 25.3 | 25.3 |
| Gas | 14.0 | 15.1, plus 11.8 CHP |
| Bioenergy | 13.7 | 26.7 |
| Non-biodegradable waste | 3.3 | 6.4 |
| Imports | 21.6 | 21.6 |
| Excess (exports and curtailment) | 53.9 | 85.8 (57.6 exports, 28.2 curtailment) |
| Network losses | 28.7 | 27.9 (28.7 scaled to UK) |
| Electrolysis | 7.4 | 14.9 |
| Storage charge | 13.7 | 40.5 |
| Gas share of generation | 3.7% | 4% |
| Peak electricity demand (GW) | 60.6 | 62.4 (ACS peak) |
| Grid CO2 intensity (gCO2/kWh) | 25.5 | 15 (excluding BECCS) |

Consumer demand in the model is 300.4 TWh. This is the 2024 baseline's 269.2 TWh plus NESO's change of 31.1 TWh. NESO has 287.2 TWh for GB.

The model meets the Clean Power 2030 tests. Gas is below 5% of generation, and clean generation after excess is above consumer demand. There is no unmet demand.

## Differences from NESO

- Dispatchable plant runs only when wind, solar and nuclear fall short. In NESO, CHP and energy from waste run all year, including at times of surplus. This explains most of the lower bioenergy, waste and excess.
- Solar output is 10.5 TWh lower, because the weather data gives a lower load factor.
- Storage cycles less. The model's store dispatch minimises backup and peaks. NESO's batteries also trade with interconnectors.
- Electrolysis is about half of NESO's, because of the hydrogen storage limit described above.
- Gas CCS and hydrogen to power (0.3 GW in this pathway) are counted as gas.
- Grid losses apply to delivered electricity only. To match NESO's losses, the share is 8.44%, above the 2024 share. NESO's losses may include some on exports, which the model counts in excess.
- Generation prices blend 2024 prices for existing plant with AR7 strike prices for new capacity. See costs below.

The NESO New Dispatch pathway (43 GW offshore wind, 2.7 GW gas CCS and hydrogen to power) is not built. It would need gas CCS to be represented in the model.

## Costs

[clean_power_2030_costs.js](clean_power_2030_costs.js) compares the model's costs with the NESO cost analysis (Annex 4, data workbook CP.13 and CP.14):

```
node docs/clean_power_2030_costs.js
```

### NESO's measure

NESO gives a 2030 system cost for GB in real 2024 prices of £132.66/MWh for this pathway (range £125 to £147 across its sensitivities). It counts:

- capital for capacity added since 2023, annualised at each technology's DESNZ WACC over its life
- fixed and variable O&M on all capacity
- fuel with gas at about 100 p/therm, and carbon at £147/tCO2
- thermal and voltage constraint costs
- net imports less exports, at the hourly wholesale price
- annualised new network investment plus network O&M

It divides by consumer load plus electrolysis, about 304 TWh, so the total is about £40bn/yr. Existing plant carries no capital cost, and existing networks carry only O&M. NESO notes that the measure cannot be compared directly with the cost of today's system.

### The model on NESO's boundary

The script uses the model's flows and its own cost inputs ([cost-assumptions.md](cost-assumptions.md)). Capacity above NESO's 2023 values (table 2, plus Northern Ireland onshore wind) is new. Capital uses a simple annuity at each technology's hurdle rate, as NESO does. Constraint and network costs are NESO's, as the model has no equivalent on this boundary.

| £bn/yr (£/MWh) | NESO | Model |
|---|---|---|
| Capacity | 26.1 (86.0) | 26.7 (86.7) |
| Fuel | 3.4 (11.2) | 2.7 (8.9) |
| Carbon at £147/t | 2.3 (7.7) | 1.3 (4.1) |
| Constraints | 3.7 (12.1) | NESO value |
| Net import and export | -0.7 (-2.2) | 1.7 (5.3) |
| Network | 5.5 (18.0) | NESO value |
| Total | 40.3 (132.7) | 41.5 (134.8) |

Model values are per MWh of 307.7 TWh of useful energy (UK). The totals agree within 2%. The components differ:

- **Capacity.** The model's £26.6bn is £15.1bn of capital on new capacity, £10.9bn of fixed O&M and £0.5bn of variable O&M. Offshore wind is £15.1bn of it. NESO does not publish its capacity cost by technology, so the close match may hide offsetting differences. NESO counts interconnector capital as generation capital. The model has no interconnector cost, but prices the 99 GWh of long duration storage at battery cost per kWh (£147/kWh), well above pumped hydro. It also includes the 1 TWh hydrogen store (£0.2bn). With the DESNZ levelised method that the model uses by default, capital is £1.0bn higher, because it charges interest during pre-development and construction.
- **Fuel and carbon.** The model burns about half as much gas and biomass as NESO, because its CHP and energy from waste run only when renewables fall short (see differences above). Gas is priced at the same 100 p/therm. Emissions are 9.0 MtCO2 against NESO's 5.2 Mt excluding BECCS. The model's waste efficiency is the 2024 value of 21.8%, and it counts non-biodegradable waste CO2 at the 2024 inventory factor of 0.247 kgCO2/kWh.
- **Trade.** The model buys 21.6 TWh of imports at the scenario's import price (£76/MWh) and has no exports. NESO earns enough from 57.6 TWh of exports to be a net earner. The model's 51.6 TWh of excess has no value.

### Investment

NESO puts average investment from 2025 to 2030 at £34.0bn/yr for generation and £14.4bn/yr for networks. The DESNZ Action Plan rounds this to about £40bn/yr. The model's overnight cost of capacity added since 2023 is £170bn, or £28.4bn/yr over six years. NESO's figure also includes interconnectors and capital costs adjusted up to recent auction prices.

### Network

The scenario uses the component network basis ([cost-assumptions.md](cost-assumptions.md), network cost), as baseline_2024 and zcb_2024 do. [clean_power_2030_costs.js](clean_power_2030_costs.js) compares it with NESO's 2030 annuitised network and constraint costs (CP.31):

| £bn/yr | NESO | Model |
|---|---|---|
| Onshore transmission | 1.37 | 3.36 (47.0 GW of wind at £1,100/kW) |
| Constraints above 2024/25 thermal constraints (£1.7bn) | 1.98 | 0 |
| Transmission and constraints | 3.35 | 3.36 |
| Offshore network | 1.48 | in offshore wind costs |
| Distribution and network O&M | 2.56 | 0.34 (5.4 GW of peak at £980/kW) |
| Hydrogen and CO2 infrastructure | 0.07 | none |
| 2024 network | | 14.29 |
| Total | 9.15 | 18.00 |

Transmission and constraints agree. The model costs the finished network for 2030 wind with no constraint growth. NESO's 2030 network is still behind the wind: its £28.1bn of onshore transmission from 2025 to 2030 is annualised at £1.37bn, and constraints rise to £3.68bn. The two ways cost about the same in 2030. At the model's annuity the NESO build would cost £1.83bn, which makes NESO's total £0.45bn higher. The 2024/25 constraint figure is thermal only, so the constraint growth is an upper value.

Distribution does not compare directly. NESO's £3.39bn/yr of distribution investment includes replacement and connections, which the model holds within the 2024 network. NESO does not split its distribution annuity from network O&M. The model's distribution cost covers 5.4 GW of peak growth.

The 2024 network is 2024/25 network revenue from users. NESO counts existing networks at O&M only, so its total is not a network bill.

Electrolysis (3.65 GW) pays £0.26bn of the total, at £1,100/kW. Generators pay £0.07bn through wider transmission charges within their prices, on output above 2024. Homes pay £7.50bn and other electricity users £10.17bn.

### The model's own measures

| | £bn/yr | £/MWh |
|---|---|---|
| Blended fleet prices (the scenario) | 48.8 | 159 |
| Every plant at its 2024 price | 61.2 | 199 |
| Build-up, every plant at new-build cost | 46.2 | 150 |
| NESO boundary, model components | 41.4 | 135 |

All figures are before networks and constraints, except the NESO boundary row, which includes NESO's £9.1bn for them.

NESO's boundary leaves out the capital of existing plant, which consumers still pay for through RO, CfD and Feed-in Tariff payments. These run above new-build prices. The scenario therefore uses blended prices for a fleet of existing and new plant. Plant in the 2024 baseline keeps its 2024 price, the capture price plus RO and CfD support from `baseline/inputs/13-prices.json`. Capacity added since then is paid the AR7 strike price. The blend is weighted by capacity:

| | Existing share | 2024 price | AR7 | Blended £/MWh |
|---|---|---|---|---|
| Offshore wind | 31.9% | 163.44 | 91.20 | 114.22 |
| Onshore wind | 56.4% | 121.16 | 72.24 | 99.82 |
| Solar PV | 41.0% | 108.42 | 65.23 | 82.95 |
| Tidal | 0% | | 265.00 | 265.00 |

Nuclear, hydro, gas, bioenergy, waste and imports keep their 2024 prices, as all their 2030 capacity already exists. The £3.0bn of Feed-in Tariff and capacity market payments also stays. Storage, electrolysis and the hydrogen store use the build-up.

On this basis generation costs £48.8bn/yr, £159/MWh of useful energy. With NESO's network and constraint costs (£9.1bn) it is £58.0bn, £188/MWh, against NESO's £132.7/MWh. Most of the £56/MWh gap is the existing fleet's capital and support.

The blend overstates 2030 costs in four ways:

- New offshore wind runs at higher load factors than old, so a capacity weighting gives existing plant too large a share of output.
- The 2024 prices include 2024 wholesale capture prices of about £66/MWh, which gas set. NESO expects gas to set prices less often by 2030, which it puts at £10/MWh across demand.
- RO support lasts 20 years, so the earliest plants lose it before 2030. NESO puts falling legacy costs at another £10/MWh.
- Storage is at new-build cost, including existing pumped hydro, and long duration storage is priced per kWh as batteries.

The build-up values every plant at new-build cost, including existing nuclear and wind. On that basis, and before networks, the 2024 baseline costs £144.0/MWh and this scenario £151.2/MWh. With carbon at NESO's £147/t for both, the baseline is £157.6/MWh and this scenario £153.8/MWh. NESO puts its New Dispatch pathway £10/MWh above today's system, including about £5/MWh for networks and constraints. It does not give this figure for Further Flex and Renewables. Its own pathway costs suggest about £7/MWh more. The model's build-up shows a smaller rise because it charges the existing fleet at new-build cost in both years.

### AR7 strike prices

The zcb_2024 preset holds AR7 strike prices for wind, solar and tidal (£91.20, £72.24, £65.23 and £265/MWh) and the Hinkley Point C price for nuclear (£124.70/MWh). Applied in two ways:

- **On the output of new capacity only.** Output is shared between new and existing plant by capacity. New output is paid the strike price, and existing plant keeps its O&M. This is NESO's boundary. Capacity costs £26.17bn against NESO's £26.12bn, and the total is £133.2/MWh against £132.7/MWh. Offshore wind costs £0.28bn less than its build-up, because AR7 is £91.20/MWh against a build-up of £99/MWh at the model's load factor. Solar costs £0.24bn less and onshore wind £0.08bn more.
- **On the whole fleet.** Gas, biomass and waste plant use the build-up, with gas at 100 p/therm and carbon at £147/t. Imports keep their 2024 price. Generation costs £45.4bn/yr, £147/MWh before networks and constraints, or £177/MWh with NESO's network and constraint costs. Existing wind, solar, nuclear, gas turbines and storage are paid new-build prices, which adds about £13.5bn/yr of capital that NESO does not count.

NESO's comparison with today uses AR6 strike prices: £72 (onshore), £83 (offshore) and £71/MWh (solar) in 2024 prices (Annex 4, figure 4). AR7 offshore wind is £8/MWh higher.

## Retail electricity price

The model's retail unit rate is the generation cost per kWh billed, plus the wholesale adjustment, the homes' network share and ECO, then the supplier margin and 5% VAT. Supplier costs per customer and the Warm Home Discount are on the standing charge. The supplier margin is 4.24% here against 5.75% in 2024, as it leaves out the 2024 adjustment allowance. The 2024 wholesale adjustment (3.19 p/kWh for electricity, 0.197 p/kWh for gas) reflects power and gas bought forward in 2023 and the cost of the domestic profile. It is specific to 2024, so it is zero in this scenario, as in other scenarios. Gas and carbon stay at 2024 prices. Homes pay their share of the network on the unit rate, with no network standing charge.

| p/kWh | baseline_2024 | clean_power_2030 |
|---|---|---|
| Generation cost | 13.55 | 15.85 |
| Wholesale adjustment | 3.19 | 0 |
| Network | 6.57 | 8.89 |
| Policy (ECO) | 0.83 | 0.97 |
| Supplier margin | 1.39 | 1.09 |
| Unit rate with VAT | 26.80 | 28.13 |
| Standing charge with VAT | £147 | £145 |
| Household electricity bill | £1,074 | £980 |
| Household energy and car fuel | £3,215 | £2,823 |

Generation costs £48.8bn over 300 TWh billed, against £36.5bn over 269 TWh. Networks cost £18.00bn against £14.29bn. The unit rate rises 1.3 p/kWh, but the household electricity bill falls £94, because household use falls 14% with NESO's appliance efficiency. Of the 2.32 p/kWh rise in the network rate, about 1.1 p/kWh is the 2024 network spread over fewer domestic kWh, and the rest is growth in transmission and distribution. Spending on home energy and car fuel falls £392 a year on average, as electric cars replace petrol and diesel.

The blended prices leave out effects that NESO expects by 2030. Applied to the unit rate, at £/MWh across demand with the supplier margin and VAT:

| p/kWh | |
|---|---|
| clean_power_2030 as modelled | 28.13 |
| Export earnings, the £2.3bn/yr gap to NESO's net trade | -0.85 |
| Lower wholesale prices for RO plant (NESO, £10/MWh) | -1.09 |
| RO and Feed-in Tariff contracts expiring (NESO, £10/MWh) | -1.09 |
| Adjusted | 25.09 |

With these, the unit rate is 1.7 p/kWh below 2024 and the household electricity bill is £890, £184 below 2024. Network growth is in the model, so NESO's £5/MWh for network and constraint growth is no longer added. NESO's own comparison with today is close to flat: its New Dispatch pathway costs £10/MWh more, lower wholesale prices for older plant offset this, and Further Flex and Renewables costs £7/MWh more than New Dispatch. Most of the model's fall is the 2024 wholesale adjustment, which is not carried into 2030.

Two things are not in the adjusted figure:

- **Storage.** It is at new-build cost of £4.1bn/yr, with 99 GWh of long duration storage priced per kWh as batteries. A lower cost for pumped hydro would reduce the unit rate.
- **Gas price exposure.** The 2024 system burned 168 TWh of gas for power, and gas set the wholesale price in most hours. This scenario burns 29 TWh. A 1 p/kWh rise in the gas price adds 0.10 p/kWh to this scenario's unit rate through fuel. It adds 0.66 p/kWh to the 2024 system through fuel alone, before its effect on the price paid to other plant.

[clean_power_2030_retail.py](clean_power_2030_retail.py) gives the sensitivities around the adjusted unit rate (23.6 to 31.9 p/kWh at 2024 gas prices, a bill of £846 to £1,092) and the unit rate at gas prices from 60 to 200 p/therm. Keeping the 2024 wholesale adjustment adds up to 3.49 p/kWh. Part of it is the cost of the domestic profile, which persists, but the baseline does not split it out. Replacing the model's transmission with NESO's 2030 build and constraint growth adds up to 0.16 p/kWh. Each 1 p/kWh rise in gas adds 2.60 p/kWh to the 2024 system and 0.20 to 0.65 p/kWh to this scenario. The range depends on whether gas runs in 15% of hours (NESO) or 46% (this model). Plant exposed to the market is assumed to be paid the cost of a gas turbine in those hours.
