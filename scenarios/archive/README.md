# Archived scenarios

These scenarios are no longer maintained. The model has changed since they were written, so results differ from those published with them.

[zerocarbonbritain.json](zerocarbonbritain.json) is the 2019 ZeroCarbonBritain scenario. The other files are overrides on it. `docs/run_scenario.js` uses it as the default for any scenario in this folder:

```
node docs/run_scenario.js archive/baseline_2018
```

The web tool only lists the scenarios in `scenarios/available.json`.

`baseline_2018.json` can still be rebuilt with `python3 -I baseline/build.py 2018 scenarios/archive/baseline_2018.json`.

## Changes after 2019

The store balancing done for `zcb_2024` was also applied to `zerocarbonbritain.json`. With the original values the methane store finished at 37.7 TWh from a 10 TWh start, and the FT plant (9.15 GW) left 4.0 TWh/yr of synthetic fuel demand unmet.

- Biomass for biogas 92 TWh/yr to 88 TWh/yr, with methanation from 5.15 GW to 4.93 GW. At 85 TWh/yr the methane store runs empty.
- FT synthetic fuel capacity 9.15 GW to 9.7 GW.
- Offshore wind stays at 140 GW. At 135 GW the methane store runs empty.

The industry efficiency and lever inputs added later are set in `zerocarbonbritain.json` to 100% efficiency, 100% activity and 0% material efficiency. With these values the model gives the same results as before the change.
