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
- Battery wear is not costed, and matters more now that the battery charges about 33 TWh/yr in zcb_2024.
- First fill of the fuel stores is not costed, so a higher start level gives margin at no modelled cost.
- The peak scaled network cost uses baseline_2024 outputs (55.19 GW, 269.39 TWh) typed in as inputs. Update them when the baseline changes.
