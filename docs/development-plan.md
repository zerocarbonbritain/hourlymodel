# Development plan

Brings together the cost model work, the heat pump SPF study, the ZCB PyPSA project (/opt/openenergymonitor/ZCB_PyPSA) and the open items. Work through the phases in order. Tick items off here and record results in the documents named.

Earlier handovers this plan replaces as the pick-up point:

- /home/trystan/hourlymodel-costwork/HANDOVER.md (cost model, SPF study, price prototype).
- ZCB_PyPSA/HANDOVER.md (PyPSA status and the 12 item list from docs/pypsa-practice.md).

## Working method

- Every feature that changes dispatch, demand or cost goes into both models before any long run, so the ten year runs are done once on shared plumbing.
- Develop and check on 2010 alone, at 3 hour steps. 2010 starts at hour 70,128 and includes the December 2010 event that sets turbine capacity. It solves in about 15 s:

  ```
  cd /opt/openenergymonitor/ZCB_PyPSA
  node export/export_zcb.js data/zcb_2024
  .venv/bin/python -m scripts.dispatch data/zcb_2024 70128 8760
  .venv/bin/python -m scripts.expand data/zcb_2024 70128 8760 offshore ipm 3
  ```

  The hourly model always runs all ten years, so the comparison uses its 2010 slice.
- Ask before changing scenario values, and propose numbers with sources first.
- Record every cost source and decision in docs/cost-assumptions.md, and every PyPSA practice difference in ZCB_PyPSA/docs/pypsa-practice.md.
- After a change to inputs, rebuild the baselines (`python3 -I baseline/build.py 2024 scenarios/baseline_2024.json --write`, the same for 2018) and validate (`python3 -I baseline/validate.py 2024 scenarios/baseline_2024.json`). The current result is 58 ok, 4 warnings, 14 known issues.

## Where things stand (2026-11-02)

- **Baselines.** 2024 and 2018 are built from sources by baseline/build.py and validated against observed statistics. Remaining differences are in baseline/open-items.md.
- **Cost model.** Everything in the system now has a cost (phase 1 below). zcb_2024 costs £93.34bn/yr, generation cost 18.9 p/kWh, household electricity bill £1,080. FT draws on the H2 store (phase 3, item 1), otherwise dispatch is unchanged.
- **PyPSA.** Costs come from the hourly model's exported scenario. The replay matches ZCB within 0.001 GWh. A one year expansion (2002) at today's costs gives £70.7bn/yr against £93.3bn for the ZCB capacities. At those PyPSA capacities the hourly model's rules leave 43.6 TWh/yr of synthetic fuel unmet, because FT only uses hydrogen made in the same hour.
- **Heat pump SPF study.** SPF 2.8 against 3.8 costs £2.2bn to £5.7bn/yr. The blog post draft is parked until prices exist (phase 6).
- **Weather data.** ERA5 cutouts are downloading on a server. Postponed to phase 7.

## Decisions

- [x] **D1. Electrolysis and methanation costs.** Technology-data v0.15.0. Applied.
- [x] **D2. Heating value basis.** Move to LHV, after an inventory and impact check (phase 3, item 10).
- [x] **D3. Role of the optimiser.** zcb_2024 stays a rule-based scenario. PyPSA validates it, and validation reporting states how close the rules come to the PyPSA optimum.
- [x] **D4. Isolated GB.** zcb_2024 stays without interconnection. An interconnected run is a comparison only.
- [x] **D5. Lost load and reliability.** Value of lost load £22,985/MWh, plus a no-shedding run. Backup capacity is costed with a de-rating factor for outages and no weather margin.
- [x] **D6. FT rule.** FT uses the same-hour hydrogen surplus first, and tops up from the H2 store (above its floor, within FT capacity) when the liquid store is below a target level.
- [x] **D7. Industry.** Heat by temperature band and the material sub-models go in before the long runs, so zcb_2024 is retuned once.
- [x] **D8. Weather data.** The long runs use the current dataset. ERA5 follows in phase 7, with a rerun.

## Done

- **Phase 0. Tidy up.** All work committed in both repositories. Still open: a GitHub remote for ZCB_PyPSA.
- **Phase 1. Cost what is free.** zcb_2024 went from £74.1bn to £93.34bn/yr. Details in docs/cost-assumptions.md:
  - electrolysis and methanation at technology-data costs (+£5.3bn);
  - anaerobic digestion as the GGSS 13 MW reference plant, crop feedstock at the GGSS maize price, GDP deflator (+£4.2bn);
  - FT plant, hydrogen, methane and synthetic fuel stores at technology-data costs (+£9.2bn), set to zero in the baselines;
  - an annuity option for annualisation (£82.9bn/yr at 7%);
  - gas turbine de-rating 0.9048 (+£0.63bn), which closed the open item on reserve margin;
  - network cost scaled by peak demand (`retail.electricity.network_basis` "peak").

  Against the PyPSA costing of ZCB capacities (£87.8bn/yr) the difference is fully explained by these changes.
- **Phase 2. PyPSA tooling** (ZCB_PyPSA):
  - costs from the exported scenario;
  - value of lost load £22,985/MWh (£16,940 from DECC 2013, uplifted by the GDP deflator);
  - `noshed` and `yearly` (limited foresight) options in scripts/expand.py;
  - scripts/rules_at_optimum.py, which runs the hourly model at an expansion's capacities.

## Phase 3. Shared model plumbing

For each item, add it to the PyPSA network and to model.js together. Check that the PyPSA optimised dispatch at fixed capacities and the hourly model's rules agree on 2010, then commit both. Update baseline/open-items.md as items close.

1. [x] **FT draws on the H2 store** (D6, open item). Add `synth_fuel.store_target_GWh` (default the start level). Enforce `synth_fuel.store_capacity_GWh`, which is costed but never applied (open item). In PyPSA FT already takes hydrogen from the H2 bus, so check the dispatch comparison only.
   Done 2026-11-02. The top-up fills the liquid store to the target and no further. FT output is also limited by the space left in the liquid store. Results on 2010:
   - zcb_2024: replay matches within 0.001 GWh, and FT hydrogen is 37.20 TWh in both models. FT draws 0.66 TWh from the H2 store over ten years, all in 2002, so the 2010 liquid store ends at 11.84 TWh against 10.77. Cost is unchanged at £93.34bn/yr.
   - Rules at the 2010 expansion capacities: unmet synthetic fuel falls from 8.42 to 0 TWh/yr, with 6.1 TWh/yr from the H2 store. The methane store now reaches empty and 0.01 TWh/yr of electricity is unmet.
   - A 30 TWh target holds the liquid store at the target at the end of 2010, and both models give 37.84 TWh of FT hydrogen.
   - Above the target FT still takes the whole surplus, so the liquid store drifts up (new open item).
2. [ ] **CO2 buffer for methanation**, so methanation follows the H2 surplus. A CO2 store in both models, with a cost.
3. [ ] **Two turbine classes**, OCGT and CCGT in merit order, each with its own efficiency, cost and de-rating factor (0.9297 and 0.9048). PyPSA chooses the mix.
4. [ ] **Battery power and energy** costed separately, with duration as an input. A separate inverter cost in PyPSA.
5. [ ] **Industry heat by temperature band** (<100, 100 to 200, 200 to 500, >500 °C) with technologies per band.
6. [ ] **Industry material sub-models** for steel, cement, ammonia and chemicals, and glass. They replace the fixed blast furnace fuel and address the reductant coal open item. Source the 65% drying fuel efficiency and convert the JRC-IDEES NCV values to gross.
7. [ ] **Demand flexibility** at modest participation: smart charging, V2G, the heat store, and flexible industrial heat as heater GW plus thermal storage GWh (replacing instant fuel switching). Propose shares from PyPSA-Eur practice (half of EVs smart charging) first.
8. [ ] **Generalise the ten year assumption** (the 0.0001 factors in model.js and cost_model, 87,648 in runners), so the hourly model can also run 2010 alone.
9. [ ] **Cost-only items.** Biomass for FT (free at present) and store power (compressors, injection and withdrawal: technology-data gives about £16/kW charging and £5/kW discharging for gas storage).
10. [ ] **LHV (D2).** List every H2 and methane quantity and efficiency in model.js, the scenarios, the baselines and the land model, with its basis. Work out what changes:
    - efficiencies (electrolysis 0.80 HHV is about 0.68 LHV);
    - store sizes and demands in TWh;
    - emission factors and fuel prices per kWh;
    - costs per kW of H2, and the FT ratio (0.61 H2 per unit of fuel);
    - the baseline's DUKES gross energy figures.
    
    Decide where conversions sit. Set out the effect on zcb_2024 before applying.
11. [ ] **Scope decisions** for zcb_2024, to propose to the user:
    - international shipping demand and fuel, about 24 TWh/yr, to match the baseline boundary;
    - land model choices: the existing woodland sink, the imported biomass share, landfill biochar.
12. [ ] **Hourly prices.**
    - Take marginal prices from a 2010 PyPSA expansion and check cost recovery.
    - Add an hourly marginal electricity price to model.js (the hour class method in the cost work handover), calibrated against them.
    - Split fuel production cost between electricity and fuel users (open item, £20bn/yr now charged to electricity).
    - Report synthetic fuel, hydrogen and methane per kWh and per litre, with aviation and shipping fuel against 2024 jet fuel and marine gas oil prices.
13. [ ] **Resource limits** for onshore and offshore wind, for the `free` variant.
14. [ ] **Fix the linopy warning** in `yearly_stores` (zcb_pypsa/expand.py): select with `drop=True` so both sides share coordinates. Then check that the stores hold their year-end levels.

Done when the PyPSA optimised dispatch and the ZCB rules agree on backup, curtailment and store use within an agreed margin on 2010.

## Phase 4. Long runs and target table

- [ ] Ten year expansion with the value of lost load, with `noshed` and with `yearly`. About 40 minutes each at 3 hour steps with the machine to itself. Run one at a time, or two at most (each uses about 3.5 GB).
- [ ] One year hourly against 3 hourly, to size the battery and turbine error.
- [ ] Rules at the optimum for each result: whether the rules balance (nothing unmet, stores back to their start levels), their cost against the optimum, and their dispatch against the optimised dispatch. This is the core validation measure for D3.
- [ ] Variant `free` with the resource limits.
- [ ] A target table: capacities and store sizes for each run, with the ZCB values beside them, in ZCB_PyPSA/docs/results.md.

Done when the target table no longer changes much with the lost load value, foresight and resolution.

## Phase 5. Retune zcb_2024 once

- [ ] Propose new values for offshore wind, electrolysis, methanation, FT, turbines by class, battery, stores and biogas. Use the phase 4 targets as a guide and the store criteria in docs/zcb-2024-notes.md (methane and synthetic fuel stores end near their start levels, nothing unmet). The rules decide the values (D3).
- [ ] Apply after agreement and update docs/zcb-2024-notes.md with before and after results.
- [ ] Export the retuned scenario and rerun replay, dispatch and expansion.
- [ ] **Validation report.** Retuned zcb_2024 against the PyPSA optimum: total cost gap, each capacity, curtailment, backup output, store use, and the dispatch gap at equal capacities. Keep it in ZCB_PyPSA/docs/results.md and summarise it in docs/zcb-2024-notes.md.

## Phase 6. Prices and the heat pump study

- [ ] Calibrate the hourly price on the ten year cost-optimal network and check cost recovery for every extendable technology.
- [ ] Checks: electricity and fuel revenue against total system cost, offshore wind revenue against its cost, and the series valuation of the SPF penalty against resizing.
- [ ] Rerun the SPF 2.8 against 3.8 study in both models. Decide whether to finish the blog post (/var/www/trystan2/pages/en/heatpump_spf_system.html).

## Phase 7. Weather data

In ZCB_PyPSA, docs/datasets.md. ERA5 cutouts are downloading on a server (server/README.md).

- [ ] ERA5 at the ZCB region centres with the Siemens SWT-3.6, to separate the change of reanalysis from the change of method. Compare with highresolution.csv.zip.
- [ ] PyPSA-Eur turbines, wake losses and eligible areas. Decide on the 0.9 onshore availability.
- [ ] Bias correct against Elexon or NESO metered output (2015 to 2024).
- [ ] Hourly heat demand and heat pump COP from hourly temperature. Test against the "Peak demand is high" open item (55.2 GW against 47.4 GW observed).
- [ ] Hydro inflow profiles and pumped hydro.
- [ ] Extend beyond ten years, then rerun phase 4 and check the phase 5 retune on the longer record.
- [ ] Keep wave, tidal and the demand shape from the current dataset.

## Phase 8. Comparisons

- [ ] Interconnected sensitivity (D4), to compare with PyPSA-Eur GB results.

## Backlog

Baseline open items that don't block the phases above. See baseline/open-items.md for detail.

- Sector specific heating system shares.
- Final bioenergy 13% high (cause not traced).
- Harvested wood products as a pool with decay.
- Storage arbitrage in the baseline (needs phase 6 prices).
- Scripted fetch for capture prices and CfD payments.
- Biomass fuel price and 2018 carbon price series.
- The peak scaled network cost uses baseline_2024 outputs (55.19 GW, 269.39 TWh) typed in as inputs. Update them when the baseline changes.
