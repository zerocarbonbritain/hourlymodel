# HeatpumpMonitor heat demand profiles

The heat demand profile option (`heat_profile`, in the space and water heat section) selects between the default profile and profiles measured by [HeatpumpMonitor.org](https://heatpumpmonitor.org/aggregation). The default is `"default"`. `"heatpumpmonitor"` changes four things:

- Space heat uses the HeatpumpMonitor base temperature, 15.5 °C.
- Space heat follows a measured hourly shape that depends on the daily mean outside temperature.
- Hot water follows its own measured hourly shape.
- Heat pumps use measured efficiencies in place of the scenario's heat pump efficiencies.

Annual heat demand does not change. The GW/K values are scaled so that space heat over the run equals that at the scenario's base temperature, and water heating demand comes from the scenario. Flat demand profiles take precedence over this option.

The values are written into defaults.js by [build_heatpumpmonitor_profiles.py](build_heatpumpmonitor_profiles.py):

```
python3 -I docs/build_heatpumpmonitor_profiles.py
```

## Source

All data are from HeatpumpMonitor MID metered systems.

- Hourly shapes use the aggregate feeds on emoncms.org (548548, 548550, 548553 and 548554): heat output, electricity use, outside temperature and number of systems, divided by the number of systems. They cover 1 October 2023 to 1 October 2026, 1,096 days with 55 to 565 systems. Earlier data has too few systems. The all systems group gives nearly the same results.
- Efficiencies use the latest twelve months, 1 November 2025 to 1 November 2026, to match the current HeatpumpMonitor figures. They combine the same aggregate feeds with the space heat and hot water split of each system (heatpumpmonitor.org/system/stats). 223 systems have 90% data cover and a split within 10% of their total heat.

Hours are UTC, as in the model's weather data. The solar PV capacity factors peak at the same UTC hour in summer and winter.

HeatpumpMonitor is a self-selected group of well-installed systems in homes above typical UK size, and many of its users are on time of use tariffs.

## Base temperature

Daily heat output per system is fitted to daily mean outside temperature as a constant plus a slope times the degrees below a base temperature. The best fit is 15.5 °C (R² 0.94), against 0.90 at the zcb_2024 value of 13.07 °C. The zcb_2024 value comes from DECC 2050, with an average internal temperature of 16.7 °C, which suits intermittently heated homes. Heat pump homes are heated continuously, which raises the base temperature. Retrofit lowers it, and HeatpumpMonitor homes are not deeply retrofitted.

The higher base temperature spreads space heat over more days. On the model's weather, with annual space heat held, the zcb_2024 GW/K values fall by a factor of 0.668 and the high demand values by 0.970.

## Hourly shapes

The hot water shape comes from the 255 days with a daily mean outside temperature of 16 °C or more, taken as having no space heat. Most hot water runs at 03:00, 12:00 to 13:00 and 23:00 UTC, the cheap windows of time of use tariffs.

Space heat is the hourly heat less hot water at its warm day level and shape. It is averaged over seven bands of daily mean temperature. The model interpolates between band means and holds the end bands outside them.

| Band (°C) | Days | Band mean (°C) | Highest hour ÷ lowest hour |
|---|---|---|---|
| 2 or below | 32 | 0.49 | 1.39 |
| 2 to 4 | 51 | 3.23 | 1.45 |
| 4 to 6 | 91 | 5.01 | 1.55 |
| 6 to 8 | 127 | 7.07 | 1.66 |
| 8 to 10 | 165 | 9.06 | 1.94 |
| 10 to 12 | 144 | 10.92 | 2.20 |
| 12 to 14 | 121 | 12.94 | 2.83 |
| Default profile | | | 1.62 |

The shape flattens as it gets colder. Mild days have a strong morning peak and a dip from 15:00 to 18:00 UTC.

## Efficiencies

Heat pump efficiency keeps the model's form: space heat COP linear in daily mean temperature and a fixed hot water COP.

The per system split gives a hot water COP of 3.01, with hot water 15.4% of heat. Across the same systems space heat COP is 4.23 and SPF 3.93. The average of each system's SPF, as HeatpumpMonitor reports it, is 3.96.

The space heat line is fitted to the aggregate daily electricity use on days below 14 °C. Hot water is spread evenly over the days at 15.4% of heat and a COP of 3.01. The result is 286% at 0 °C and 472% at 10 °C. Over the twelve months the aggregate SPF is 3.88, and the model's form with these values gives 3.90.

Below the coldest measured day (-1.6 °C) the space heat efficiency falls by 13 percentage points per K, the zcb_2024 slope, in place of the fitted 18.6. The fitted line extrapolated to the coldest model day (-6.4 °C, 19 December 2010) gives a COP of 1.66, which is too low. With the shallower slope it is 1.93, against 1.96 for the zcb_2024 line. The measured cold end is steep: over the three years space heat COP falls from 3.08 at 1.5 °C to 2.70 at -1.0 °C, and there is no data below -1.6 °C.

| | Hot water | 0 °C | 10 °C | Below -1.6 °C |
|---|---|---|---|---|
| zcb_2024 | 280% | 280% | 410% | 13 per K |
| HeatpumpMonitor | 301% | 286% | 472% | 13 per K |

## Results

Ten year runs, default profile against HeatpumpMonitor profile.

| | zcb_2024 | | High demand | |
|---|---|---|---|---|
| | Default | HPM | Default | HPM |
| Base temperature (°C) | 13.07 | 15.5 | 15.3 | 15.5 |
| Space heat (TWh/yr) | 159.1 | 159.1 | 322.9 | 322.9 |
| Heat pump SPF | 3.20 | 3.55 | 3.35 | 3.66 |
| Heat pump space heat COP | 3.37 | 3.81 | 3.47 | 3.81 |
| Heat pump electricity (TWh/yr) | 54.7 | 48.8 | 94.2 | 86.0 |
| Peak electricity for heat (GW) | 59.9 | 42.9 | 91.9 | 85.7 |
| Peak electricity demand (GW) | 95.2 | 77.8 | 143.5 | 136.1 |
| Backup capacity requirement (GW) | 43.7 | 36.7 | 71.9 | 71.0 |
| Methane store minimum (TWh) | 8.6 | 17.2 | 9.9 | 23.8 |
| Liquid store minimum (TWh) | 9.4 | 13.4 | 19.6 | 26.0 |
| Society cost (£bn/yr) | 108.69 | 106.72 | 162.11 | 161.52 |

Supply capacities are not re-optimised, so the larger store minimums are spare margin.

In zcb_2024 most of the fall in peak comes from the base temperature. Before it was added, the shapes and efficiencies alone gave a peak of 56.7 GW and an SPF of 3.46. At 15.5 °C the same annual heat is spread over more days, so the coldest days carry less of it. The measured shapes lower the peak further, as cold days have a flatter shape. At the coldest model hours the efficiency is close to the zcb_2024 line, so the efficiency gain is mostly in mild weather.

## Why model SPF is below the HeatpumpMonitor figure

The model's SPF is lower than HeatpumpMonitor's 3.9 because of weather and the scenario's heat demand, not the efficiencies. Neither temperature series is offset. Against ERA5 daily mean temperature (Open-Meteo) averaged over eight UK cities, the model's 2002 to 2011 series is 0.01 °C lower and the HeatpumpMonitor outside temperature from October 2023 is 0.2 °C higher. A daily calculation with the HeatpumpMonitor efficiencies shows the steps:

| Weather | Base temperature | Hot water share | SPF |
|---|---|---|---|
| HeatpumpMonitor, last twelve months (12.0 °C mean) | 15.5 °C | 15.4% | 3.86 |
| Model, 2002 to 2011 (10.0 °C mean) | 15.5 °C | 15.4% | 3.70 |
| Model | 15.3 °C (high demand) | 22.0% | 3.62 |
| Model | 13.07 °C (zcb_2024) | 37.9% | 3.40 |

- The model's weather years are colder, and include the winter of 2010.
- A lower base temperature, from retrofit, leaves space heat only on colder days.
- Hot water has the lowest COP, and zcb_2024 has more than twice the HeatpumpMonitor share.

The option now sets the base temperature to 15.5 °C, so only the weather and hot water steps remain. The model runs give 3.66 for high demand and 3.55 for zcb_2024. Hot water is 26% of heat pump heat in zcb_2024 and 16% in high demand, including services. HeatpumpMonitor homes with 5,000 to 10,000 kWh/yr of space heat have an SPF of about 3.75.

## Hot water share

HeatpumpMonitor hot water is 15.4% of heat, about 2,200 kWh/yr per system (median 1,800). Domestic hot water is 22.0% of domestic heat in zcb_2024_high_demand, deployed_tech, clean_power_2030 and baseline_2024, which use 2024 building fabric, and 2,010 kWh/yr per home. It is 37.9% in zcb_2024, where retrofit halves space heat and hot water is unchanged, at 2,090 kWh/yr per home. Hot water per home is close to HeatpumpMonitor. The difference in share comes from space heat, which is larger in HeatpumpMonitor homes.

## Limits

- The profiles describe homes. The model applies the space heat shape to services and industry space heat as well.
- The model uses daily mean temperature from its own weather data. HeatpumpMonitor temperatures are local to each system.
- Hot water is spread evenly over the days in the efficiency fit. In practice it rises in winter, with colder mains water.
- The daily demand law stays linear in degree days. HeatpumpMonitor demand rises less steeply than the line below about 2 °C.
- The base temperature is the same for homes, services and industry, and for retrofitted and existing buildings.
