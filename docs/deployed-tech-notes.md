# Deployed technologies with 2024 demand levels

[deployed_tech.json](../scenarios/deployed_tech.json) follows [zcb_2024_high_demand](zcb-2024-high-demand-notes.md) but uses only technologies deployed at scale today. It electrifies heat, cars and freight, and builds wind, solar, batteries and the two new nuclear stations. It builds no electrolysis, methanation, synthetic fuel, wave, tidal, geothermal or new solar thermal, and no new bioenergy. Fossil fuel meets the demand that is not electrified, including aviation, shipping and part of industry. Gas turbines provide backup.

It is built by [build_deployed_tech.py](build_deployed_tech.py) from the [2024 baseline](baseline-2024-notes.md):

```
python3 -I docs/build_deployed_tech.py
```

Edit the script, not the scenario file. Rebuild after a baseline change.

## Method

Activity, behaviour, building fabric, land use and agriculture come from the 2024 baseline, as in zcb_2024_high_demand.

Demand side technology:

- Gas cooking, catering, cooling and services appliances move to electricity one for one.
- Heating systems as zcb_2024: heat pumps 90%, resistance heating 5% and biomass 5%, at the zcb_2024 efficiencies.
- Drive train shares and efficiencies as zcb_2024, with the hydrogen share moved to battery electric. Cars and vans are 94% electric. Aviation stays on liquid fuel at the zcb_2024 efficiency of 20%, with no electric flight.
- Freight as zcb_2024_high_demand, with hydrogen trucks moved to battery electric at equal mechanical energy. Battery electric freight is 34.8 TWh/yr and IC freight 58.1 TWh/yr.
- Industry output at 2024 levels with no efficiency savings. Fuel shares and electric efficiencies as zcb_2024, including industrial heat pumps for low temperature heat and hybrid heat (electric in surplus hours, gas otherwise). The new biomass shares in zcb_2024 move to gas. Biomass stays only where the baseline already uses it (20% of other heat, against 74% in 2024). Steel moves to electric arc furnaces, so blast furnace coal and its process emissions go.
- International shipping (23.9 TWh/yr) stays on fossil fuel. Biofuel supply stays at 2024 levels (32 TWh/yr).

Supply:

- Nuclear 6.52 GW: Hinkley Point C and Sizewell C, two EPR units each at 3.26 GW. EDF expects Hinkley Point C to supply about 25 TWh/yr, a load factor of 0.875. The existing fleet has retired.
- Hydro 1.9 GW and solar thermal 0.5 GW at 2024 levels.
- Wind and solar at the zcb_2024 proportions, scaled together (see below). Availability as zcb_2024.
- Lithium ion batteries at 95% charge and discharge efficiency.
- Gas turbines at the zcb_2024 efficiencies (CCGT 54%). Existing biomass power keeps its 2024 share of backup output (29%). Coal, oil and imports go.
- Isolated GB, as zcb_2024 (decision D4). Electricity losses as zcb_2024: 7% grid loss and no power station own use.

Costs follow zcb_2024. New wind and solar are paid AR7 strike prices, and both nuclear stations the Hinkley Point C price (£124.70/MWh). Retail settings for a future system also follow zcb_2024. The oil and gas supply chain shares of energy industry use stay at 2024 levels. Refinery electricity, upstream methane leakage, flaring and coal mining emissions scale with fossil fuel volumes.

## Wind, solar and battery sizes

The build minimises the cost to society: real resources plus energy emissions at the £302/tCO2e appraisal value, with capital at the 3.5% social discount rate. With fossil gas available, the system has no unmet demand at any size, so cost and emissions alone set the sizes.

A free search of offshore wind, onshore wind and solar ends at 20 GW offshore and 105 GW onshore, the resource limit. The cost surface is flat: offshore wind falls from 64 to 20 GW, with onshore wind and solar rising, for a saving of £1.8bn/yr. Wind and solar therefore keep the zcb_2024 proportions and scale together, as in zcb_2024_high_demand. The search then sets the scale and the battery.

Scale against zcb_2024 wind and solar, at the final battery size:

| Scale | Offshore, onshore, solar (GW) | Backup (TWh/yr) | Excess (TWh/yr) | Grid (gCO2/kWh) | Energy emissions (MtCO2e) | Society cost (£bn/yr) | Consumer cost (£bn/yr) |
|---|---|---|---|---|---|---|---|
| 0.5 | 49, 23, 65 | 197.4 | 3.9 | 87.5 | 156.3 | 172.26 | 145.16 |
| 0.6 | 58, 27, 78 | 157.8 | 17.6 | 69.2 | 145.0 | 168.92 | 145.37 |
| 0.7 | 68, 32, 91 | 127.5 | 40.9 | 55.4 | 136.2 | 167.21 | 146.64 |
| **0.8** | **78, 36, 104** | **104.6** | **71.4** | **45.0** | **129.4** | **166.75** | **148.66** |
| 0.9 | 88, 41, 117 | 86.6 | 107.4 | 36.9 | 124.1 | 167.26 | 151.35 |
| 1.0 | 97, 45, 130 | 72.5 | 147.1 | 30.6 | 119.9 | 168.47 | 154.46 |
| 1.25 | 122, 56, 163 | 48.6 | 258.6 | 20.1 | 112.6 | 173.53 | 163.48 |
| 1.5 | 146, 68, 195 | 34.2 | 380.3 | 13.9 | 108.2 | 180.33 | 173.54 |

Excess in this search is after grid losses. Since 2026-11-09 the model reports it before grid losses, about 7% higher.

The lowest cost is at 0.8: 77.9 GW offshore wind, 36 GW onshore and 104 GW solar. The battery is 106 GWh with 19.7 GW of charge and discharge. From 0.7 to 1.0 the cost changes by less than £1.8bn/yr. Above 1.0 each step adds more excess than it saves in gas, and energy emissions fall slowly, since most of what remains is outside power. Consumer cost is lowest at a smaller scale, because it values carbon only at the £68/t ETS price on power.

## Results

| | baseline_2024 | Deployed tech | zcb_2024_high_demand | zcb_2024 |
|---|---|---|---|---|
| Electricity demand (TWh/yr) | 307.0 | 556.1 | 830.9 | 519.4 |
| Peak electricity demand (GW) | 55.2 | 144.8 | 143.5 | 95.2 |
| Wind, solar, nuclear and hydro (TWh/yr) | 144.9 | 528.3 | 907.3 | 623.6 |
| Excess electricity (TWh/yr) | 3.8 | 76.8 | 104.8 | 116.5 |
| Backup output (TWh/yr) | 128.7 | 104.6 | 28.3 | 12.3 |
| Peak backup (GW) | 30.2 | 86.7 | 71.9 | 43.7 |
| Grid CO2 intensity (gCO2/kWh) | 130.4 | 45.0 | 0 | 0 |
| Fossil oil (TWh/yr) | 727.7 | 245.4 | 0 | 0 |
| Fossil gas (TWh/yr) | 668.2 | 230.3 | 0 | 0 |
| Fossil coal (TWh/yr) | 53.4 | 0.1 | 0 | 0 |
| Biomass used (TWh/yr) | 189.4 | 147.8 | 432.7 | 235.8 |
| Final energy (TWh/yr) | 1,507 | 1,134 | 1,098 | 689 |
| Energy emissions (MtCO2e) | 347.1 | 129.4 | 21.1 | 7.6 |
| Net emissions (MtCO2e) | 433.2 | 209.2 | 86.3 | -6.3 |
| Supply cost (£bn/yr) | 38.75 | 80.25 | 144.33 | 92.41 |
| Consumer cost before tax (£bn/yr) | 146.23 | 148.66 | 203.60 | 136.40 |
| Of which fossil fuel (£bn/yr) | 72.35 | 18.40 | 0 | 0 |
| Of which networks (£bn/yr) | 12.47 | 32.22 | 32.00 | 24.01 |
| Society resource cost (£bn/yr) | 128.63 | 127.66 | 164.53 | 111.08 |
| Society carbon cost (£bn/yr) | 104.83 | 39.09 | 6.36 | 2.28 |
| Society total (£bn/yr) | 233.46 | 166.75 | 170.89 | 113.36 |
| Household electricity bill (£/yr) | 1,090 | 1,677 | 1,747 | 1,120 |
| Household energy and car fuel (£/yr) | 3,233 | 2,439 | 2,644 | |

Energy emissions are fossil CO2 plus the non CO2 effect of aviation. Net emissions also include agriculture, land use, waste and process emissions, all at 2024 levels here, and the existing woodland sink.

Energy emissions fall 63% from 2024, and net emissions 52%. What remains, in MtCO2e:

| Source | MtCO2e |
|---|---|
| Aviation CO2 | 30.5 |
| Aviation non CO2 | 26.4 |
| Gas for power | 25.3 |
| Road, rail and domestic shipping oil | 15.6 |
| Industrial gas, including other use | 14.2 |
| Industrial oil | 6.2 |
| International shipping | 5.3 |
| Oil and gas supply chain | 6.0 |

Aviation is 44% of the remaining energy emissions.

Against 2024, resources cost about the same (£127.7bn against £128.6bn/yr). Spending moves from imported fossil fuel (down £54bn/yr) to supply plant and networks. Consumer cost before tax is £2.4bn/yr higher. Network cost rises from £12.5bn to £32.2bn/yr, because the model scales it with peak demand, which rises from 55 to 145 GW with heat pumps and electric vehicles and no smart charging. The household electricity bill rises, but households stop buying gas and most car fuel, so their energy and car fuel spend falls by £794 a year.

Against zcb_2024_high_demand, the society total is £4.1bn/yr lower. This scenario carries £32.7bn/yr more carbon cost and avoids £36.9bn/yr of resources, mostly electrolysis, synthetic fuel and the wind and solar to supply them. It uses 285 TWh/yr less biomass and no extra land. At the appraisal carbon value, fully zero carbon synthetic fuel and biomethane are not yet cheaper than the fossil fuel they replace.

## Sensitivities

- **No biomass power.** Gas meets all backup. Biomass use falls from 148 to 60 TWh/yr. Energy emissions rise 11 MtCO2e and the society cost £1.8bn/yr. Consumer cost falls £0.8bn/yr.
- **Wind and solar scale.** See the table above. At zcb_2024 levels (scale 1.0) the grid is 31 gCO2/kWh, for £1.7bn/yr more.

## Limits

- The cost leaves out demand side equipment: heat pumps, electric vehicles and industrial plant. This favours scenarios that change more equipment.
- First fill of the stores is not costed, as elsewhere. This scenario holds no fuel stores.
- Smart charging and vehicle to grid are off, as in zcb_2024 (phase 3, item 7). Both would reduce peak demand, network cost and battery size.
- Without interconnectors, the 77 TWh/yr of excess electricity has no value, and imports cannot replace gas backup.
- The model has no exports and no gas CCS.
