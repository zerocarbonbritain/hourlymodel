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

  The hourly model can run 2010 alone with `hours` 8760 and `start_hour` 70128. Set `methane.SOC_start` and `synth_fuel.store_start_GWh` to the levels at the end of 2009, or fuel demand goes unmet.
- Ask before changing scenario values, and propose numbers with sources first.
- Record every cost source and decision in docs/cost-assumptions.md, and every PyPSA practice difference in ZCB_PyPSA/docs/pypsa-practice.md.
- After a change to inputs, rebuild the baselines (`python3 -I baseline/build.py 2024 scenarios/baseline_2024.json --write`, the same for 2018) and validate (`python3 -I baseline/validate.py 2024 scenarios/baseline_2024.json`). The current result is 58 ok, 4 warnings, 14 known issues.

## Where things stand (2026-11-06)

- **Baselines.** 2024 and 2018 are built from sources by baseline/build.py and validated against observed statistics. Remaining differences are in baseline/open-items.md.
- **Cost model.** Everything in the system now has a cost (phase 1 below). zcb_2024 cost £93.34bn/yr after phase 1, generation cost 18.9 p/kWh, household electricity bill £1,080. Phase 3 items 1 to 3 change dispatch: FT draws on the H2 store, methanation has a CO2 store, and backup has CCGT (now 54%) and OCGT classes. Battery power is costed separately (item 4). FT biomass and store power are now costed, international shipping is in zcb_2024, and fuel users pay for fuel at their values (items 9, 11 and 12). A provisional retune on 2026-11-06 (see below) brings zcb_2024 to £91.91bn/yr, generation cost 12.25 p/kWh, household electricity bill £857, with nothing unmet.
- **PyPSA.** Costs come from the hourly model's exported scenario. The biogas feedstock limit is removed, so land is reported in both models and enforced in neither. The figures from before that change and the retune are: the 2010 expansion gives £95.75bn/yr, with nothing unmet, against £94.88bn for the ZCB capacities, which leave fuel unmet. At those PyPSA capacities the rules leave 5.19 TWh/yr of synthetic fuel unmet over ten years. The 2010 replay matches ZCB within 0.001 GWh on every store but liquid, which runs empty and differs by up to 93 GWh.
- **Heat pump SPF study.** SPF 2.8 against 3.8 costs £2.2bn to £5.7bn/yr. The blog post draft is parked until prices exist (phase 6).
- **Weather data.** ERA5 cutouts are downloading on a server. Postponed to phase 7.

## Decisions

- [x] **D1. Electrolysis and methanation costs.** Technology-data v0.15.0. Applied.
- [x] **D2. Heating value basis.** Move to LHV, after an inventory and impact check (phase 3, item 10).
- [x] **D3. Role of the optimiser.** zcb_2024 stays a rule-based scenario. PyPSA validates it, and validation reporting states how close the rules come to the PyPSA optimum.
- [x] **D4. Isolated GB.** zcb_2024 stays without interconnection. An interconnected run is a comparison only.
- [x] **D5. Lost load and reliability.** Value of lost load £22,985/MWh, plus a no-shedding run. Backup capacity is costed with a de-rating factor for outages and no weather margin.
- [x] **D6. FT rule.** FT uses the same-hour hydrogen surplus first, and tops up from the H2 store (above its floor, within FT capacity) when the liquid store is below a target level.
- [x] **D7. Industry.** Changed 2026-11-05: heat by temperature band and the material sub-models follow an initial release, so zcb_2024 is retuned again after them.
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

## Initial release

Agreed 2026-11-05. Items 14, 12, 9 and 8 of phase 3 and international shipping (item 11) come first. Items 5 and 6 follow the release. Phases 4 and 5 are part of the release. Ask before starting the long runs. Land is reported and not enforced: a scenario uses the land it needs, and a user can reduce demand or accept biomass imports (decided 2026-11-05). scripts/expand.py prints the land spare or short for each run. The fixed 97.3 TWh/yr biogas feedstock limit in PyPSA was removed on 2026-11-05. Items 7, 10 and 13 and the land model part of item 11 are still to be placed.

## Phase 3. Shared model plumbing

For each item, add it to the PyPSA network and to model.js together. Check that the PyPSA optimised dispatch at fixed capacities and the hourly model's rules agree on 2010, then commit both. Update baseline/open-items.md as items close.

1. [x] **FT draws on the H2 store** (D6, open item). Add `synth_fuel.store_target_GWh` (default the start level). Enforce `synth_fuel.store_capacity_GWh`, which is costed but never applied (open item). In PyPSA FT already takes hydrogen from the H2 bus, so check the dispatch comparison only.
   Done 2026-11-02. The top-up fills the liquid store to the target and no further. FT output is also limited by the space left in the liquid store. Results on 2010:
   - zcb_2024: replay matches within 0.001 GWh, and FT hydrogen is 37.20 TWh in both models. FT draws 0.66 TWh from the H2 store over ten years, all in 2002, so the 2010 liquid store ends at 11.84 TWh against 10.77. Cost is unchanged at £93.34bn/yr.
   - Rules at the 2010 expansion capacities: unmet synthetic fuel falls from 8.42 to 0 TWh/yr, with 6.1 TWh/yr from the H2 store. The methane store now reaches empty and 0.01 TWh/yr of electricity is unmet.
   - A 30 TWh target holds the liquid store at the target at the end of 2010, and both models give 37.84 TWh of FT hydrogen.
   - Above the target FT still takes the whole surplus, so the liquid store drifts up (new open item).
2. [x] **CO2 buffer for methanation**, so methanation follows the H2 surplus. A CO2 store in both models, with a cost.
   Done 2026-11-02. `methane.co2_store_capacity_t` and `methane.co2_store_target_t` (zcb_2024 100 kt and 50 kt, £0.03bn/yr, docs/cost-assumptions.md). Methanation uses the H2 surplus left after FT first, and tops up from the H2 store while the CO2 store is above its target, down to the target. CO2 above the capacity is vented. Results on 2010:
   - zcb_2024 (4.03 GW of methanation): no change in dispatch. The CO2 flow needs 4.22 GW, so the store stays full and 0.24 Mt/yr is vented in both models. Replay matches within 0.001 on every store. Cost £93.37bn/yr.
   - At 6 GW of methanation, both models use all the CO2 (36.98 TWh/yr of hydrogen). 60% of ZCB methanation falls in electrolysis hours (51% of hours), against 45 to 48% in PyPSA, where timing does not change the cost while the H2 store is large.
   - The 2010 expansion builds a 1.67 Mt CO2 store and 11.4 GW of methanation, and cuts the H2 store from 3.45 to 1.44 TWh and the liquid store from 20.5 to 5.0 TWh. Total £92.73bn/yr against £93.22bn. Storing CO2 in tanks costs about a fifth of storing the matching hydrogen in salt caverns.
   - Rules at those capacities leave 2.68 TWh/yr of synthetic fuel unmet. The H2 store is too small for the rules, a matter for phase 5.
3. [x] **Two turbine classes**, OCGT and CCGT in merit order, each with its own efficiency, cost and de-rating factor (0.9297 and 0.9048). PyPSA chooses the mix.
   Done 2026-11-02. CCGT runs first up to `electric_backup.ccgt_capacity_GW`, then OCGT. DESNZ 2025 costs, OCGT 300 MW at 35%, and CCGT moved from 50% to the DESNZ 54%. The "Gas turbines" cost is now "CCGT" and `derating_factor` is `ccgt_derating_factor`. zcb_2024 stays all CCGT. Results:
   - zcb_2024: cost unchanged at £93.37bn/yr. At 54% backup uses less methane, so the methane store ends ten years at 34.2 TWh against 25.0, and spill rises from 1.84 to 2.89 TWh/yr. Replay matches on 2010.
   - At 30 GW of CCGT, OCGT covers 13.45 GW of peak and gives 1.26 TWh in 2010 against 1.24 in PyPSA. The cost falls by £0.79bn/yr.
   - The 2010 expansion chooses 26.2 GW of CCGT and 16.9 GW of OCGT, £91.37bn/yr against £92.73bn with CCGT only.
4. [x] **Battery power and energy** costed separately, with duration as an input. A separate inverter cost in PyPSA.
   Done 2026-11-02. The hourly model already has separate charge, discharge and energy inputs, so the change is in costing: £147/kWh of energy and £166/kW of inverter (the larger of charge and discharge), the Modo 2 hour price split in technology-data proportions. zcb_2024 falls from £93.37bn to £92.35bn/yr (generation cost 18.65 p/kWh). In PyPSA the charge and discharge links are extendable with one inverter (charge power equals discharge power) costed on discharge, so the optimiser chooses the duration. Results on 2010:
   - Replay and the fixed capacity dispatch are unchanged.
   - The expansion chooses 205 GWh with a 26.2 GW inverter (7.8 hours), against 164 GWh held to 2 hours before. Total £90.11bn/yr against £91.37bn. At 3 hour steps daily cycling is smoothed, which undervalues power, so phase 4's hourly run should check the duration.
   - Validation of baseline_2024 is unchanged in status. Its storage build-up falls from £1,076 to £917/MWh.
5. [ ] **After the initial release. Industry heat by temperature band** (<100, 100 to 200, 200 to 500, >500 °C) with technologies per band.
6. [ ] **After the initial release. Industry material sub-models** for steel, cement, ammonia and chemicals, and glass. They replace the fixed blast furnace fuel and address the reductant coal open item. Source the 65% drying fuel efficiency and convert the JRC-IDEES NCV values to gross.
7. [ ] **Demand flexibility** at modest participation: smart charging, V2G, the heat store, and flexible industrial heat as heater GW plus thermal storage GWh (replacing instant fuel switching). Propose shares from PyPSA-Eur practice (half of EVs smart charging) first.
8. [x] **Generalise the ten year assumption** (the 0.0001 factors in model.js and cost_model, 87,648 in runners), so the hourly model can also run 2010 alone.
   Done 2026-11-05. `o.years`, `o.per_year`, `o.GWh_to_TWhy` and `o.TWhy_to_GWh` replace the fixed factors in model.js, model.html and ui/zcem.js, and a new `start_hour` input sets the first hour. `o.years` rounds to whole years, so runs must be whole weather years. Results:
   - zcb_2024, baseline_2024 and baseline_2018: every numeric output is unchanged, except electrolysis capacity factor in zcb_2024 (49.79% to 49.77%), which now divides by `i.hours` and not 87,600. The PyPSA export is byte identical.
   - 2010 alone from the 2010 store levels: nothing unmet, offshore wind 327.41 TWh in both, electrolysis 98.19 against 98.25 TWh and excess 77.72 against 77.66 TWh in the ten year run's 2010 slice.
9. [x] **Cost-only items.** Biomass for FT (free at present) and store power (compressors, injection and withdrawal: technology-data gives about £16/kW charging and £5/kW discharging for gas storage).
   Done 2026-11-05. Biomass at £20/MWh, a hydrogen compressor, and methane store charging and discharging, in docs/cost-assumptions.md. In zcb_2024 biomass costs £2.60bn/yr and store power £0.32bn/yr. In PyPSA the H2 and methane stores sit on their own buses with extendable links. The 2010 expansion chooses 8.7 GW of compressor against 20.5 GW in the rules, and every extendable technology still recovers its cost.
10. [ ] **LHV (D2).** List every H2 and methane quantity and efficiency in model.js, the scenarios, the baselines and the land model, with its basis. Work out what changes:
    - efficiencies (electrolysis 0.80 HHV is about 0.68 LHV);
    - store sizes and demands in TWh;
    - emission factors and fuel prices per kWh;
    - costs per kW of H2, and the FT ratio (0.61 H2 per unit of fuel);
    - the baseline's DUKES gross energy figures.
    
    Decide where conversions sit. Set out the effect on zcb_2024 before applying.
11. [ ] **Scope decisions** for zcb_2024, to propose to the user:
    - [x] international shipping demand and fuel, about 24 TWh/yr, to match the baseline boundary. Done 2026-11-05: 23.9 TWh/yr of FT liquid fuel, with an input in the UI. It left 1.98 TWh/yr unmet at the capacities of that date, since closed by the provisional retune. Total cost +£0.04bn/yr at fixed capacities, before biomass;
    - land model choices: the existing woodland sink, the imported biomass share, landfill biochar.
12. [x] **Hourly prices.**
    - [x] Take marginal prices from a 2010 PyPSA expansion and check cost recovery. Done 2026-11-05 with scripts/prices.py, at 3 hour steps and before item 9:
      - Extendable technologies without a binding limit recover their cost (ratio 1.000). Consumers pay £101.74bn/yr against a system cost of £90.11bn. The £11.63bn difference is biogas supply limit rents (£7.45bn), fixed plant (£2.93bn net) and the uncosted industrial heat link (£1.24bn).
      - Mean prices are electricity £189/MWh (£226 weighted by load, zero in 26% of steps), hydrogen £145, methane £216 and liquid fuel £116/MWh, with biomass free. Hydrogen and methane are about twice the fuel values in the cost work handover.
      - Fuel users pay £17.4bn/yr, and £24.1bn with industrial heat.
    - [x] Add an hourly marginal electricity price to model.js (the hour class method in the cost work handover), calibrated against them. Done 2026-11-05. At equal capacities on 2010 the mean is £184.5 against £190.2/MWh in PyPSA, correlation 0.90, and revenue over cost 1.127 against 1.126. Method in docs/cost-assumptions.md.
    - [x] Split fuel production cost between electricity and fuel users (open item, £20bn/yr now charged to electricity). Done 2026-11-05. Fuel users pay £26.65bn/yr at their values in zcb_2024.
    - [x] Report synthetic fuel, hydrogen and methane per kWh and per litre, with aviation and shipping fuel against 2024 jet fuel and marine gas oil prices. Done 2026-11-05. Synthetic fuel is 15.4 p/kWh (161 p/litre) against 50 p/litre for jet fuel and 53 for marine gas oil.
13. [x] **Resource limits** for onshore and offshore wind, for the `free` variant. Done 2026-11-06, see phase 4.
14. [x] **Fix the linopy warning** in `yearly_stores` (zcb_pypsa/expand.py): select with `drop=True` so both sides share coordinates. Then check that the stores hold their year-end levels.
    Done 2026-11-05. On 2009 and 2010 the warning is gone, and the objective (£68.08bn/yr) and store levels are unchanged. H2, methane and liquid stores each end both years at the same level.

Done when the PyPSA optimised dispatch and the ZCB rules agree on backup, curtailment and store use within 10% on 2010.

Result 2026-11-05, with shipping set to zero until the retune (ZCB_PyPSA/docs/results.md): curtailment 1.6%, battery charge 1.9%, methane store 9.1% and backup 10.2%. DSR timing caused almost all of the backup gap.

Result 2026-11-06, with shipping, at the provisional retune below: curtailment 0.2%, battery charge 4.2%, electrolysis 0.1%, methanation hydrogen 0.0%, backup 0.6% and methane store end 1.3%. The test is met. It pins PyPSA's H2 and liquid store ends to the rules' levels, so it shows the rules leave little to gain in total over 2010, not that they match hour by hour. Repeat after phase 5.

Two rule changes led to this result:

- The battery schedule now comes before DSR. DSR takes the surplus left in each hour, and the battery can discharge into DSR.
- The battery schedule now values surplus up to electrolysis capacity, at the backup output of the methane its hydrogen makes. Without this the rules made 29% less methanation hydrogen than PyPSA and curtailed 27% more, and an H2 store at its floor stopped methanation. Battery charge rises from about 20 to 33 TWh/yr over ten years. Battery wear is not costed.

Letting the lower of the liquid and methane stores have first call on hydrogen surplus made almost no difference, so it was not kept.

## Phase 4. Long runs and target table

- [x] Ten year expansion with the value of lost load, with `noshed` and with `yearly`. With HiPO (`highspy-extras`) and the `tol` option each takes 8 to 16 minutes at 3 hour steps and about 5 GB. The old solver had not finished after 3.7 hours.
  Done 2026-11-06. The lost load run stalled at a gap of about 7e-4 and `yearly` solved. `noshed` stalled far from a solution (gap 0.15, £114.59bn/yr) and is not usable. Ten times the lost load value stands in for it: £80.66bn/yr with 0.002 GWh/yr unmet.
- [x] One year hourly against 3 hourly, to size the battery and turbine error. On 2010 hourly raises the inverter 12%, battery energy 6% and cost 0.2%, and lowers turbines 0.3%.
- [x] Rules at the optimum for each result: whether the rules balance (nothing unmet, stores back to their start levels), their cost against the optimum, and their dispatch against the optimised dispatch. This is the core validation measure for D3.
  Done 2026-11-06. The rules do not balance at these capacities: 10.36 TWh/yr of synthetic fuel and 0.52 TWh/yr of electricity are unmet at the lost load optimum. Backup is within 4% and curtailment about 6% higher.
- [x] Variant `free` with the resource limits: 105 GW onshore and 245 GW offshore (agreed 2026-11-06, provisional, in ZCB_PyPSA/docs/costs.md). Neither binds. £80.59bn/yr, or £82.86bn/yr with the land limit.
- [x] Land-limited comparison, added 2026-11-06. It holds the optimum to the available land, for comparison only. £83.41bn/yr, and £86.18bn/yr with `yearly`. The `yearly` version is the fairest target for phase 5. The rules leave 2.36 TWh/yr of synthetic fuel and 0.22 TWh/yr of electricity unmet at its capacities.
- [x] No unmet demand. scripts/verify_noshed.py fixes an expansion's capacities and removes shedding. The lost load and land-limited capacities pass with no margin. `yearly` alone needs 0.3%.
- [x] A target table: capacities and store sizes for each run, with the ZCB values beside them, in ZCB_PyPSA/docs/results.md.

Done when the target table no longer changes much with the lost load value, foresight and resolution. The lost load value and resolution meet this. Foresight moves the liquid store from 71 to 25 TWh and the methane store from 66 to 54 TWh. Without the land limit every optimum uses far more biogas than the land allows (183 against 72 TWh/yr of feedstock, about 2,160 kha short), so use the land-limited columns as targets for the retune.

## Phase 5. Retune zcb_2024 once

A provisional retune was applied on 2026-11-06, ahead of the phase 4 long runs, with results in docs/zcb-2024-notes.md. It came from a coarse search of ten year runs, so phase 4 may change it. It uses these requirements, which the final retune should keep (agreed 2026-11-06):

- Unmet liquid fuel is exactly zero.
- The lowest combined level across all stores is at least 15 TWh, about 3 times the level before the requirement.
- Liquid fuel and methane minimums are balanced, near 8 TWh each or more.
- Liquid fuel and methane stores end at or above their start levels.

The H2 store stays at a 10% floor for FT and methanation, and direct hydrogen demand may draw below it (agreed 2026-11-06).

- [x] Propose new values for offshore wind, electrolysis, methanation, FT, turbines by class, battery, stores and biogas. Use the phase 4 targets as a guide and the store criteria in docs/zcb-2024-notes.md (methane and synthetic fuel stores end near their start levels, nothing unmet). The rules decide the values (D3).
  Done 2026-11-06. The candidate is scenarios/zcb_2024_retune.json, an override on zcb_2024 that can be selected in the UI. £89.13bn/yr. See docs/zcb-2024-notes.md.
- [ ] Apply after agreement and update docs/zcb-2024-notes.md with before and after results. On hold (decided 2026-11-06): zcb_2024 and zcb_2024_retune both stay in place, and zcb_2024 stays the default.
- [x] Export the retuned scenario and rerun replay and dispatch. The expansion does not depend on the scenario's capacities, so the phase 4 results stand unless costs change. Replay matches within 0.002 GWh over ten years, and the 2010 dispatch test is within 2.2% on every measure.
- [ ] **Validation report.** Retuned zcb_2024 against the PyPSA optimum: total cost gap, each capacity, curtailment, backup output, store use, and the dispatch gap at equal capacities. Keep it in ZCB_PyPSA/docs/results.md and summarise it in docs/zcb-2024-notes.md.

## Phase 6. Prices and the heat pump study

- [ ] Calibrate the hourly price on the ten year cost-optimal network and check cost recovery for every extendable technology.
- [ ] Checks: electricity and fuel revenue against total system cost, offshore wind revenue against its cost, and the series valuation of the SPF penalty against resizing.
- [ ] Rerun the SPF 2.8 against 3.8 study in both models. Decide whether to finish the blog post (/var/www/trystan2/pages/en/heatpump_spf_system.html).
  Hourly model done 2026-11-07, PyPSA not yet. Scripts and results are in /home/trystan/hourlymodel-costwork/spf_study_2026-11-07. Each case is re-optimised on supply plus network cost against the phase 5 store requirements, in zcb_2024 and zcb_2024_high_demand. SPF is fleet wide (homes and services). Results, as differences in supply plus network cost:
  - SPF 2.8 against 3.8: £9.34bn/yr (zcb_2024), £14.50bn/yr (high demand).
  - Same SPF, COP at −5 °C of 1.8 against 2.5: £4.92bn/yr, £9.54bn/yr.
  - Domestic space heat at 204 against 98 TWh/yr, with services and industry heat unchanged: £11.83bn/yr, £9.31bn/yr.
  - Restarts from other offshore wind levels agree within £0.3bn/yr.
  - Hourly prices value the SPF penalty at 61% (zcb_2024) and 77% (high demand) of the re-optimised supply cost difference, before networks.
  The blog post draft is rewritten with these results and is still marked draft.
- [x] HeatpumpMonitor heat demand profiles (2026-11-09). A `heat_profile` option selects the HeatpumpMonitor base temperature (15.5 °C, with GW/K scaled so annual space heat is unchanged), measured space heat shapes by daily mean temperature, a separate hot water shape and measured heat pump efficiencies. Shapes and base temperature use three years of the MID metered aggregate. Efficiencies use the latest twelve months and the per system space and hot water split: 301% hot water, 286% at 0 °C and 472% at 10 °C, with the zcb_2024 slope below the coldest measured day (-1.6 °C). They reproduce the measured SPF (3.90 against 3.88). Built by docs/build_heatpumpmonitor_profiles.py. In zcb_2024 heat pump SPF rises from 3.20 to 3.55, peak electricity demand falls from 95.2 to 77.8 GW and the society cost from £113.69bn to £111.70bn/yr, with supply unchanged. It stays below HeatpumpMonitor's 3.9 because of colder weather years and a larger hot water share. The default is unchanged. Results in docs/heatpumpmonitor-profiles-notes.md.

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
- [x] Clean Power 2030 (2026-11-08). scenarios/clean_power_2030.json follows the NESO Further Flex and Renewables pathway, built from the 2024 baseline by docs/build_clean_power_2030.py. On NESO's boundary it costs £132.0/MWh against NESO's £132.7/MWh. Method, cost comparison and retail price are in docs/clean-power-2030-notes.md.
- [x] Deployed technologies (2026-11-09). scenarios/deployed_tech.json follows zcb_2024_high_demand with only technologies deployed at scale today, and fossil fuel for what is not electrified. Built from the 2024 baseline by docs/build_deployed_tech.py. Energy emissions fall 63% from 2024 to 129 MtCO2e, and the society cost is £166.75bn/yr against £170.89bn for zcb_2024_high_demand. Results in docs/deployed-tech-notes.md.

## Network cost

A review on 2026-11-08 compared the network cost with NESO Clean Power 2030 and wider work. Method and sources are in docs/cost-assumptions.md, network cost.

1. [x] **Network by component** (2026-11-09). `network_basis` "components" replaces "peak": the 2024 network held flat, distribution at £980/kW of peak above 2024, transmission at £1,100/kW of wind above 2024, an annuity at 4.6% over 45 years plus 1.2% O&M, and constraints above 2024 as an input. The UI has an electricity networks section with each part, its driver, capital and annual cost. zcb_2024 networks go from £20.68bn to £19.56bn/yr before standing charges. The 2024 network was then set from 2024/25 revenue (£14.29bn with standing charges, against £12.5bn from the cap rate), which takes it to £21.39bn, or £24.71bn with standing charges. The total is now shared between fuel users, homes and other users, and homes pay their share on the unit rate with no network standing charge. baseline_2024 moved to this basis: its 2024 bill at 3,400 kWh is within 1.7% of DESNZ quarterly energy prices. The cost of peak falls from £166 to £64/kW/yr. The deployed_tech search was redone with it on 2026-11-09, with gas for all backup: wind and solar fall from 0.8 to 0.72 times zcb_2024 and networks are £24.6bn/yr. Not yet redone with it: the SPF study, where networks were £2.86bn of the £9.34bn penalty, and the zcb_2024_retune search.
2. [x] **Electrolysis pays per kW** (2026-11-09). £1,100/kW of electrolysis and power to X capacity, the transmission rate, in place of the 20% share. zcb_2024 fuel users pay £1.93bn/yr against £4.94bn, hydrogen's network share falls from £53 to £21/MWh, and the household electricity bill rises from £1,130 to £1,184.
3. [x] **Clean Power 2030 test** (2026-11-09). clean_power_2030 now uses the component basis. Its transmission at £1,100/kW with no constraint growth costs £3.36bn/yr, against £3.35bn for NESO's 2030 transmission annuity plus constraint growth above 2024/25 (CP.31). Networks cost £17.95bn/yr against £13.52bn on the per kWh basis. The household bill is £1,084 against £1,083 in baseline_2024, and £997 with NESO's wholesale, legacy and trade adjustments. NESO's £5/MWh for network growth is no longer added, and the peak scaling sensitivity is replaced by NESO's 2030 build and constraints (up to +0.16 p/kWh). Distribution does not compare directly. Details in docs/clean-power-2030-notes.md, network. The 2024 wholesale adjustments (3.19 p/kWh electricity, 0.197 p/kWh gas) are now zero in clean_power_2030, with the electricity value as a retail sensitivity: the unit rate falls from 33.58 to 30.23 p/kWh and the bill to £986. The NESO comparison does not use them.
4. [ ] **A steadier peak**, such as the mean of annual maxima. Recheck after hourly heat demand (phase 7).
5. [ ] **Zonal check in ZCB_PyPSA.** Two or three GB zones with the B4 and B6 boundaries as extendable links, to test the £1,100/kW transmission cost and the zero constraint cost for a finished system. A two zone constraint method in the hourly model was considered and dropped, as curtailment is already costed.
6. [x] **Small fixes** (2026-11-09). Grid losses now apply to delivered electricity only. Excess is curtailed or exported at the generator, so it is reported before losses: zcb_2024 losses fall from 44.5 to 36.4 TWh/yr and excess rises from 108.3 to 116.5 TWh/yr, with no change to dispatch or cost. clean_power_2030 recalibrates its loss share from 7.32% to 8.44% to keep NESO's 28.7 TWh of losses. Generators pay £1.51/MWh of wider TNUoS on output above 2024 (NESO Final TNUoS Tariffs 2024/25, table 17), within their prices, so retail network costs leave it out: £0.37bn/yr in zcb_2024, £0.84bn in zcb_2024_high_demand and £0.07bn in clean_power_2030. The zcb_2024 bill falls from £1,184 to £1,181. Earlier search tables report excess after losses.
7. [x] **Transmission by technology** (2026-11-09). NESO's £89bn beyond 2030 includes the coordinated offshore network, which is within offshore wind capex, so the £1,100/kW wind rate counted it twice. Transmission is now a rate per kW above 2024 for each driver: offshore wind £700, onshore wind £600, nuclear £250 (Hinkley to Seabank), transmission connected solar £0 (25% of solar, FES 2025). Distribution connected solar has its own rate, £0 by default, with £120 to £200/kW from Imperial (2015) as a sensitivity. zcb_2024_high_demand transmission falls from £12.78bn to £7.80bn/yr. deployed_tech was searched again: wind and solar 0.76 times zcb_2024. A national test of solar export against the peak was tried and dropped, as net export stays below peak demand in every scenario.

## Cost model review

A review of cost_model.js on 2026-11-09.

1. [x] **Turbine capacity at the plant** (2026-11-09). Backup capacity was costed on the peak need at the user. Costs are per kW at the plant, so the need is now divided by the share of generation that reaches users before de-rating. The scarcity adder in the hourly price uses the same basis. zcb_2024 costs 52.0 GW against 48.3 GW, +£0.50bn/yr (system cost £86.85bn, bill £1,185). zcb_2024_high_demand +£0.82bn, deployed_tech +£0.99bn. baseline_2024 and clean_power_2030 keep thermal plant on 2024 prices, so only their build-up and society cost change (+£0.64bn and +£0.37bn at hurdle rates). Dispatch is unchanged. Method in docs/cost-assumptions.md, gas turbines.
2. [x] **The same change in ZCB_PyPSA** (2026-11-09). `zcb_pypsa/expand.py` now costs turbines on output at the plant. The 2010 expansion at 3 hours goes from £91.60bn to £92.04bn/yr, and the ZCB capacities on the same basis from £91.73bn to £92.23bn. CCGT falls from 26.35 to 25.08 GW and OCGT rises from 20.13 to 21.29 GW. Turbines still recover their cost exactly. The ten year tables in ZCB_PyPSA/docs/results.md predate the change. The price check at this optimum gives a rules mean of £235.4 against £172.6/MWh in PyPSA, before and after alike, because `fuel_values` come from an earlier expansion with a biogas limit (phase 6).
3. [x] **Peak at the turbine in the UI** (2026-11-09). The backup table shows the peak at the turbine in brackets (`electric_backup.max_capacity_requirement_at_turbine`), 47.0 GW in zcb_2024 against 43.7 GW at the user.
4. [x] **Supplier and policy costs by driver** (2026-11-09). The domestic cap rates (3.176 and 0.878 p/kWh) were applied to every kWh of end use. Supplier cost is now £121.29 per customer (28.6 million homes and 2.5 million non-domestic meters) plus a margin on the rest of the bill (5.75% in 2024 with the adjustment allowance, 4.24% in scenarios). ECO is a fixed £0.82bn/yr paid by homes, and the Warm Home Discount stays per home. Supplier and policy costs fall from £16.38bn to £8.85bn/yr in zcb_2024 and from £23.06bn to £10.24bn in zcb_2024_high_demand. In baseline_2024, electricity users' spend before VAT is now 8.5% below DUKES use at QEP prices (a known issue): the old rates had closed the gap for non-domestic users for the wrong reason.
5. [x] **Fuel values derived** (2026-11-09). `fuel_values` is no longer an input. Hydrogen is worth the electrolysers' break-even value (plant cost over hydrogen made in zero price hours), methane its cost from methanation, and turbine fuel that or fossil gas at its price plus carbon. zcb_2024: hydrogen £108/MWh and methane £177, against inputs of £150 and £235. Hydrogen now costs what it is worth. Fossil scenarios get an hourly price (baseline_2024 mean £131/MWh, recovery 102%). At the land-limited 2010 PyPSA optimum the derived hydrogen value is £130.5/MWh against PyPSA's £130.5. zcb_2024 recovery at marginal prices falls from 92% to 73%.
6. [x] **Who pays table** (2026-11-09). `retail.electricity.who_pays` holds generation, network, policy, customer and margin costs for homes, other users and fuel users, and adds up to the electricity layers of the cost to consumers. Car charging pays other users' rate, as it is billed with them, which removes £2.3bn/yr of double counted network cost from household totals in zcb_2024.
7. [x] **One network basis, shared by energy** (2026-11-09). The `per_kWh` basis is removed. Fuel users pay a share of transmission and constraints by energy delivered (£2.12bn/yr in zcb_2024, against £1.93bn at £1,100/kW of electrolysis), and generators' charges come off transmission first.
8. [x] **Smaller fixes** (2026-11-09). `o.LCOE` and `o.backup_LCOE` are removed, as nothing used them. `resource_p_kWh` is the build-up less what fuel users pay, over end use. Electricity is billed on end use in every scenario.
9. [ ] **Profile weighted generation rate.** Homes and industry pay one rate. Decide whether bills should follow hourly prices by user profile.
10. [ ] **Rerun the ten year PyPSA tables** with turbines costed at the plant, and compare fuel prices with the derived values at each optimum.

zcb_2024 after items 4 to 8: cost to consumers £129.70bn/yr before tax (£137.23bn), household electricity bill £1,189 (£1,185), unit rate 33.23 p/kWh with a £145 standing charge (34.88 p/kWh and £89), cost to society £108.69bn/yr (£114.01bn).

## Backlog

Baseline open items that don't block the phases above. See baseline/open-items.md for detail.

- Sector specific heating system shares.
- Final bioenergy 13% high (cause not traced).
- Harvested wood products as a pool with decay.
- Storage arbitrage in the baseline (needs phase 6 prices).
- Scripted fetch for capture prices and CfD payments.
- Biomass fuel price and 2018 carbon price series.
- Battery wear is not costed, and matters more now that the battery charges about 33 TWh/yr in zcb_2024.
- First fill of the fuel stores is not costed, so a higher start level gives margin at no modelled cost.
- The network cost uses baseline_2024 values (55.19 GW peak, 2024 offshore wind, onshore wind, nuclear and solar capacities, 273.58 TWh of generation) typed in as inputs. Update them when the baseline changes.
