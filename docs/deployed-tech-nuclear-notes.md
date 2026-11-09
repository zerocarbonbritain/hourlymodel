# Deployed technologies with nuclear in place of wind and solar

[deployed_tech_nuclear.json](../scenarios/deployed_tech_nuclear.json) is [deployed_tech](deployed-tech-notes.md) with all wind and solar removed. Nuclear is the only new generation. It is built by [build_deployed_tech_nuclear.py](build_deployed_tech_nuclear.py), which reuses the deployed_tech demand and supply steps:

```
python3 -I docs/build_deployed_tech_nuclear.py
```

## Method

- Demand side as deployed_tech.
- Offshore wind, onshore wind and solar PV are zero. Hydro (1.9 GW) and solar thermal (0.5 GW) stay at 2024 levels.
- Nuclear runs flat at the EPR load factor of 0.875, as in deployed_tech. It is paid the Hinkley Point C strike price (£124.70/MWh) on all output, including output curtailed as excess. The society cost uses the Sizewell C build-up (£11,900/kW) at 3.5%.
- Gas turbines meet all backup, as in deployed_tech.
- The search sets nuclear capacity and the battery on the cost to society, as in deployed_tech.

## Nuclear capacity

At the final battery size:

| Nuclear (GW) | Backup (TWh/yr) | Excess (TWh/yr) | Energy emissions (MtCO2e) | Society cost (£bn/yr) | Consumer cost (£bn/yr) |
|---|---|---|---|---|---|
| 50 | 149.5 | 0.0 | 160.8 | 157.66 | 128.66 |
| 60 | 85.3 | 2.9 | 135.2 | 151.73 | 130.39 |
| 65 | 62.6 | 13.6 | 125.6 | 150.43 | 132.15 |
| **69.0** | **47.9** | **26.0** | **119.4** | **150.10** | **133.92** |
| 75 | 30.6 | 50.4 | 111.8 | 150.59 | 137.13 |
| 80 | 20.4 | 75.2 | 107.2 | 151.83 | 140.23 |
| 90 | 8.3 | 135.2 | 101.5 | 156.18 | 147.41 |

The lowest cost is 69.0 GW of nuclear, about 21 Hinkley Point C sized stations. The battery is 34.9 GWh with 7.75 GW of charge and discharge. Flat output cannot follow the winter heat pump peak, so gas covers winter and nuclear is curtailed in summer.

## Comparison with deployed_tech

| | Deployed tech | Nuclear | Difference |
|---|---|---|---|
| Wind and solar (GW) | 74, 34, 99 | 0 | |
| Nuclear (GW) | 6.5 | 69.0 | +62.5 |
| Battery (GWh) | 106.6 | 34.9 | -71.7 |
| Wind, solar, nuclear and hydro (TWh/yr) | 504.6 | 534.7 | +30.0 |
| Excess electricity (TWh/yr) | 62.8 | 26.0 | -36.7 |
| Backup output (TWh/yr) | 113.1 | 47.9 | -65.2 |
| Peak backup (GW) | 87.7 | 70.3 | -17.5 |
| Fossil gas (TWh/yr) | 307.3 | 175.9 | -131.3 |
| Energy emissions (MtCO2e) | 143.7 | 119.4 | -24.3 |
| Supply cost (£bn/yr) | 71.90 | 83.65 | +11.75 |
| Networks (£bn/yr) | 22.92 | 20.60 | -2.32 |
| Consumer cost before tax (£bn/yr) | 124.40 | 133.92 | +9.52 |
| Electricity unit rate (p/kWh) | 22.66 | 24.55 | +1.89 |
| Society resource cost (£bn/yr) | 106.17 | 114.05 | +7.88 |
| Society carbon cost (£bn/yr) | 43.39 | 36.05 | -7.34 |
| Society total (£bn/yr) | 149.56 | 150.10 | +0.54 |
| Society total at hurdle rates (£bn/yr) | 170.38 | 192.64 | +22.26 |

The society cost is £0.54bn/yr higher. Nuclear avoids 131 TWh/yr of gas and 24.3 MtCO2e, worth £7.3bn/yr at the appraisal carbon value, but its resources cost £7.9bn/yr more. Network cost falls by £2.3bn/yr, as nuclear has a lower transmission rate than offshore wind. At hurdle rates, nuclear is £22.3bn/yr dearer, since its capital cost is a larger share of its total. Consumers pay £9.5bn/yr more, as the strike price is paid on curtailed output and the backup turbines run fewer hours.

## Nuclear capital cost

Society cost at 69.0 GW, other sizes unchanged:

| Capex (£/kW) | Society cost (£bn/yr) | At hurdle rates (£bn/yr) |
|---|---|---|
| 11,900 (Sizewell C) | 150.10 | 192.64 |
| 10,900 | 146.86 | 186.22 |
| 8,000 | 137.45 | 167.58 |

Each £1,000/kW changes the society cost by about £3.2bn/yr. The two scenarios break even at about £11,700/kW. At £8,000/kW the nuclear scenario is £12.1bn/yr below deployed_tech.

## Limits

- Nuclear output is flat. The model has no planned outage season or load following, so refuelling outages are not moved to summer and nuclear cannot ramp down at times of excess.
- The strike price applies to all output, including curtailed output. A contract that paid only on delivered output would raise the price per MWh.
- 69 GW is about 21 EPR stations. Sites, build rate and supply chain are not modelled.
- The limits of deployed_tech also apply.
