# Deployed technologies with 2024 demand levels

[deployed_tech.json](../scenarios/deployed_tech.json) follows [zcb_2024_high_demand](zcb-2024-high-demand-notes.md) but uses only technologies deployed at scale today. It electrifies heat, cars and freight, and builds wind, solar, batteries and the two new nuclear stations. It builds no electrolysis, methanation, synthetic fuel, wave, tidal, geothermal or new solar thermal, and no new bioenergy. Biomass power goes. Fossil fuel meets the demand that is not electrified, including aviation, shipping and part of industry. Gas turbines provide backup.

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
- Gas turbines at the zcb_2024 efficiencies (CCGT 54%) meet all backup. Biomass power (Drax and others) goes, to avoid burning wood from large areas of forest. Coal, oil and imports go too.
- Isolated GB, as zcb_2024 (decision D4). Electricity losses as zcb_2024: 7% grid loss and no power station own use.

Costs follow zcb_2024. New wind and solar are paid AR7 strike prices, and both nuclear stations the Hinkley Point C price (£124.70/MWh). Retail settings for a future system also follow zcb_2024. The oil and gas supply chain shares of energy industry use stay at 2024 levels. Refinery electricity, upstream methane leakage, flaring and coal mining emissions scale with fossil fuel volumes.

## Wind, solar and battery sizes

The build minimises the cost to society: real resources plus energy emissions at the £302/tCO2e appraisal value, with capital at the 3.5% social discount rate. With fossil gas available, the system has no unmet demand at any size, so cost and emissions alone set the sizes.

With biomass power at its 2024 share, a free search of offshore wind, onshore wind and solar ends at 20 GW offshore and 105 GW onshore, the resource limit. The cost surface is flat: offshore wind falls from 64 to 20 GW, with onshore wind and solar rising, for a saving of £1.8bn/yr. Wind and solar therefore keep the zcb_2024 proportions and scale together, as in zcb_2024_high_demand. The search then sets the scale and the battery.

Scale against zcb_2024 wind and solar, at the final battery size:

| Scale | Offshore, onshore, solar (GW) | Backup (TWh/yr) | Excess (TWh/yr) | Grid (gCO2/kWh) | Energy emissions (MtCO2e) | Society cost (£bn/yr) | Consumer cost (£bn/yr) |
|---|---|---|---|---|---|---|---|
| 0.5 | 49, 22, 65 | 197.7 | 4.5 | 123.9 | 176.9 | 156.00 | 120.76 |
| 0.6 | 58, 27, 78 | 158.4 | 19.6 | 98.4 | 161.6 | 152.95 | 122.16 |
| 0.7 | 68, 32, 91 | 128.4 | 45.0 | 79.2 | 149.7 | 151.74 | 124.59 |
| **0.72** | **70, 32, 94** | **123.5** | **50.9** | **76.0** | **147.8** | **151.68** | **125.17** |
| 0.8 | 78, 36, 104 | 105.7 | 78.0 | 64.8 | 140.7 | 152.05 | 127.94 |
| 0.9 | 88, 40, 117 | 87.8 | 116.8 | 53.6 | 133.5 | 153.41 | 131.89 |
| 1.0 | 97, 45, 130 | 73.8 | 159.6 | 44.9 | 127.9 | 155.51 | 136.21 |
| 1.25 | 122, 56, 162 | 49.8 | 279.4 | 30.1 | 118.1 | 163.06 | 148.26 |
| 1.5 | 146, 68, 195 | 35.2 | 410.1 | 21.2 | 112.1 | 172.56 | 161.34 |

The lowest cost is at 0.72: 70.1 GW offshore wind, 32.4 GW onshore and 93.6 GW solar. The battery is 95.7 GWh with 18.2 GW of charge and discharge. From 0.6 to 0.9 the cost changes by less than £1.8bn/yr. Larger scales add more excess than they save in gas, and energy emissions fall slowly, since most of what remains is outside power. Consumer cost is lowest at a smaller scale, because it values carbon only at the £68/t ETS price on power.

## Results

| | baseline_2024 | Deployed tech | zcb_2024_high_demand | zcb_2024 |
|---|---|---|---|---|
| Electricity demand (TWh/yr) | 307.0 | 553.5 | 830.9 | 519.4 |
| Peak electricity demand (GW) | 55.2 | 144.8 | 143.5 | 95.2 |
| Wind, solar, nuclear and hydro (TWh/yr) | 144.9 | 481.0 | 907.3 | 623.6 |
| Excess electricity (TWh/yr) | 0.0 | 50.9 | 104.8 | 116.5 |
| Backup output (TWh/yr) | 128.7 | 123.5 | 28.3 | 12.3 |
| Peak backup (GW) | 30.2 | 89.1 | 71.9 | 43.7 |
| Grid CO2 intensity (gCO2/kWh) | 130.4 | 76.0 | 0 | 0 |
| Fossil oil (TWh/yr) | 727.7 | 245.8 | 0 | 0 |
| Fossil gas (TWh/yr) | 668.2 | 329.3 | 0 | 0 |
| Fossil coal (TWh/yr) | 53.4 | 0.1 | 0 | 0 |
| Biomass used (TWh/yr) | 189.4 | 60.4 | 432.7 | 235.8 |
| Final energy (TWh/yr) | 1,507 | 1,136 | 1,098 | 689 |
| Energy emissions (MtCO2e) | 347.1 | 147.8 | 21.1 | 7.6 |
| Net emissions (MtCO2e) | 433.2 | 227.9 | 86.3 | -6.3 |
| Supply cost (£bn/yr) | 38.75 | 77.00 | 144.33 | 92.41 |
| Consumer cost before tax (£bn/yr) | 143.30 | 125.17 | 191.46 | 129.70 |
| Of which fossil fuel (£bn/yr) | 72.35 | 18.61 | 0 | 0 |
| Of which networks (£bn/yr) | 14.29 | 24.59 | 31.85 | 24.34 |
| Society resource cost (£bn/yr) | 127.66 | 107.06 | 155.74 | 106.40 |
| Society carbon cost (£bn/yr) | 104.83 | 44.62 | 6.36 | 2.28 |
| Society total (£bn/yr) | 232.49 | 151.68 | 162.11 | 108.69 |
| Household electricity bill (£/yr) | 1,074 | 1,489 | 1,742 | 1,189 |
| Household energy and car fuel (£/yr) | 3,215 | 2,113 | 2,562 | 1,686 |

Energy emissions are fossil CO2 plus the non CO2 effect of aviation. Net emissions also include agriculture, land use, waste and process emissions, all at 2024 levels here, and the existing woodland sink.

Energy emissions fall 57% from 2024, and net emissions 47%. What remains, in MtCO2e:

| Source | MtCO2e |
|---|---|
| Aviation CO2 | 30.5 |
| Aviation non CO2 | 26.4 |
| Gas for power | 43.5 |
| Road, rail and domestic shipping oil | 15.6 |
| Industrial gas, including other use | 14.2 |
| Industrial oil | 6.2 |
| International shipping | 5.3 |
| Oil and gas supply chain | 6.1 |

Aviation is 39% of the remaining energy emissions, and gas for power 29%.

Against 2024, resources cost £20.6bn/yr less (£107.1bn against £127.7bn/yr). Spending moves from imported fossil fuel (down £54bn/yr) to supply plant and networks. Consumer cost before tax is £18.1bn/yr lower. Network cost rises from £14.3bn to £24.6bn/yr, because the model scales it with peak demand, which rises from 55 to 145 GW with heat pumps and electric vehicles and no smart charging. The household electricity bill rises, but households stop buying gas and most car fuel, so their energy and car fuel spend falls by £1,102 a year.

Against zcb_2024_high_demand, the society total is £10.4bn/yr lower. This scenario carries £38.3bn/yr more carbon cost and avoids £48.7bn/yr of resources, mostly electrolysis, synthetic fuel and the wind and solar to supply them. It uses 372 TWh/yr less biomass and no extra land. At the appraisal carbon value, fully zero carbon synthetic fuel and biomethane are not yet cheaper than the fossil fuel they replace.

## Sensitivities

- **Biomass power at its 2024 share.** The build before 2026-11-09 kept biomass at 29% of backup, with wind and solar at 0.8. Biomass use was 147.8 TWh/yr against 60.4. Energy emissions were 18.3 MtCO2e lower and the society cost £1.5bn/yr lower. Consumer cost before tax was £3.6bn/yr higher. The model counts biomass power as zero carbon and gives its wood no UK land, so neither its stack emissions nor its land show here.
- **Wind and solar scale.** See the table above. At zcb_2024 levels (scale 1.0) the grid is 45 gCO2/kWh, for £3.8bn/yr more.

## Limits

- The cost leaves out demand side equipment: heat pumps, electric vehicles and industrial plant. This favours scenarios that change more equipment.
- First fill of the stores is not costed, as elsewhere. This scenario holds no fuel stores.
- Smart charging and vehicle to grid are off, as in zcb_2024 (phase 3, item 7). Both would reduce peak demand, network cost and battery size.
- Without interconnectors, the 51 TWh/yr of excess electricity has no value, and imports cannot replace gas backup.
- The model has no exports and no gas CCS.
