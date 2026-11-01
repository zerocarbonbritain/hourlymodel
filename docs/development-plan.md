# Development plan

Brings together the cost model work, the heat pump SPF study, the ZCB PyPSA project (/opt/openenergymonitor/ZCB_PyPSA) and the open items. Work through the phases in order, apart from phase 7, which runs alongside. Tick items off here and record results in the documents named.

Earlier handovers this plan replaces as the pick-up point:

- /home/trystan/hourlymodel-costwork/HANDOVER.md (cost model, SPF study, price prototype).
- ZCB_PyPSA/HANDOVER.md (PyPSA status and the 12 item list from docs/pypsa-practice.md).

## Where things stand (2026-11-01)

- **Baselines.** 2024 and 2018 are built from sources by baseline/build.py and validated against observed statistics. Remaining differences are recorded in baseline/open-items.md.
- **Cost model.** DESNZ levelised cost method, generation at prices or the build-up, presets, hydro build-up. The three changes planned in the cost work handover (FT from the H2 store, biogas cost, hourly price) are not in model.js yet.
- **Heat pump SPF study.** SPF 2.8 against 3.8 costs £2.2bn to £5.7bn/yr, and about 18 peak hours a year carry a third of it. The price prototype recovered only half the system cost, mainly because of the FT same-hour limit and free biogas. The blog post draft is parked.
- **PyPSA.** The replay matches ZCB within 0.001 GWh. Optimised dispatch at ZCB capacities saves 0.9 TWh/yr of methane. Ten year expansion at ZCB costs is 16% cheaper than ZCB's capacities (less offshore wind, a much smaller H2 store, biogas at the land limit, methane carried between years). It sheds 119 GWh in December 2010 at a £10,000/MWh value of lost load.
- **Weather data.** ERA5 cutout scripts, a ZCB region layout and a profile builder are written but uncommitted. The local cutout build stopped at its first request. A server download script exists. The download status is unknown.

The PyPSA results are now the strongest evidence for changing zcb_2024. Several of them still depend on choices in the PyPSA set-up (lost load value, foresight over ten years, missing flexibility). The plan firms these up before using PyPSA capacities as targets. It also makes the model.js changes that alter dispatch before retuning zcb_2024, so the scenario is retuned once.

## Decisions

Decided 2026-11-01.

- [x] **D1. Electrolysis and methanation costs.** Use technology-data v0.15.0. Applied in phase 1. Efficiencies are left to the D2 work stream.
- [x] **D2. Heating value basis.** Move to LHV, as a separate work stream with its implications checked first. See the LHV work stream below.
- [x] **D3. Role of the optimiser.** zcb_2024 stays a rule-based scenario. PyPSA validates it, and validation reporting states how close the rules come to the PyPSA optimum.
- [x] **D4. Isolated GB.** zcb_2024 stays without interconnection. This is a scenario constraint. An interconnected run is a comparison only.
- [x] **D5. Lost load and reliability.** Value of lost load at the GB reliability standard's £17,000/MWh (set in 2013, so uplifted to 2024 prices once the base year is confirmed), plus a no-shedding run to match the rules. Backup capacity is costed with a de-rating margin for outages (phase 1).

## Phase 0. Tidy up

- [ ] Commit the uncommitted work: the FT open item in baseline/open-items.md and CLAUDE.md here, and the atlite scripts, profiles.py, layouts and export change in ZCB_PyPSA.
- [x] ERA5 download running on the server (2026-11-01). Parked until phase 7.
- [ ] Decide on a GitHub remote for ZCB_PyPSA.

## Phase 1. Cost what is free

Changes to `cost_model` and the `costs` inputs only. Dispatch is unchanged, so no retuning is needed. Document in docs/cost-assumptions.md.

- [x] **Electrolysis and methanation at technology-data costs** (D1). Done 2026-11-01: zcb_2024 total annual cost £74.1bn to £79.4bn, generation cost 14.7 to 15.9 p/kWh. Same CEPA 10.1% hurdle rate and 1 year build. Methanation is per kW of H2 in at HHV until the LHV work stream.

  | | Capex £/kW | Fixed O&M £/kW/yr | Life y | Annual £/kW/yr | Was |
  |---|---|---|---|---|---|
  | Electrolysis, per kW electricity | 1,563 | 62.5 (4%) | 25 | 236.1 | 46.5 |
  | Methanation, per kW H2 (HHV) | 468 | 14.1 (3%) | 20 | 69.5 | 36.0 |

  Technology-data gives methanation as €856/kW of CH4 out. At 1.282 kWh of H2 (LHV) per kWh of CH4 that is £554/kW of H2 LHV, or £468/kW of H2 HHV.

- [x] **Biogas.** Done 2026-11-01: anaerobic digestion as a plant (GGSS 13 MW reference, 7.5%, 20 years, GDP deflator) with free waste feedstock and grass at the GGSS maize price. zcb_2024 £79.4bn to £83.5bn/yr, generation cost 15.9 to 16.8 p/kWh. Decided: uplift by the deflator the source used. Charging fuel production to electricity is a new open item for phase 5.
- [x] **FT plant and stores.** Done 2026-11-01: FT £2,681/kW of H2 in (technology-data electrobiofuels, 10.1%), H2 store £2.217/kWh, CH4 £0.2465/kWh, liquid £0.0181/kWh (8.9%). Zero in the baselines, where the stores stand in for fossil supply. zcb_2024 £83.5bn to £92.7bn/yr, generation cost 16.8 to 18.7 p/kWh. Store power is not costed.
- [x] **Single discount rate option.** Done 2026-11-01: `annualisation.method` "annuity" at `annualisation.discount_rate`. zcb_2024 £92.7bn/yr by the DESNZ method, £82.9bn at a 7% annuity.
- [x] **Backup de-rating margin.** Done 2026-11-01: `electric_backup.derating_factor` 0.9048 (CCGT, T-4 2030/31, NESO). zcb_2024 +£0.63bn/yr (48.0 GW costed), baseline_2024 +£0.44bn/yr. No weather margin. Closed the open item "No reserve margin".
- [x] **Network cost by peak.** Done 2026-11-01: `retail.electricity.network_basis` "peak" scales the 2024 network charge with peak demand over delivered electricity (option A). zcb_2024 uses it: 3.40 p/kWh, unchanged on average, about £1.7bn/yr per 10 GW of peak.
- [ ] Rebuild the baselines and confirm the validation report is unchanged apart from cost lines.

Done when every technology in the PyPSA network has a cost in the hourly model on the same basis, and zcb_2024's total cost matches the PyPSA costing of ZCB capacities (£87.8bn/yr) or the difference is explained.

Phase 1 done 2026-11-01. zcb_2024 costs £93.34bn/yr. Against the PyPSA costing of ZCB capacities (£87.8bn/yr), the difference is technology-data electrolysis (+£5.12bn) and methanation (+£0.14bn), turbine de-rating (+£0.63bn) and the GGSS plant basis for biogas (−£0.35bn), which sum to £93.33bn.

## Phase 2. PyPSA tooling

In ZCB_PyPSA. Done 2026-11-01. The long runs move to phase 3b, once both models have the same plumbing.

- [x] **Align PyPSA costs with the hourly model.** All costs come from the exported `costs` block, biogas uses the plant and crop feedstock basis, and turbine capital cost is divided by the de-rating factor.
- [x] **Value of lost load** £22,985/MWh (the reliability standard's £16,940, uplifted from 2013 by the GDP deflator), and a `noshed` option.
- [x] **Limited foresight.** The `yearly` option makes the H2, CH4 and liquid stores end each weather year at their starting level.
- [x] **Rules at the optimum.** scripts/rules_at_optimum.py runs the hourly model at the capacities an expansion chose.
- [ ] Reference runs at today's plumbing: ten year expansion with the value of lost load, with `noshed` and with `yearly`. Recorded as a before point, not as targets. Check that `yearly` holds each store's year-end level.

## Phase 3. Shared model plumbing

Each feature goes into the PyPSA network and model.js together. For each, check that the PyPSA dispatch at fixed capacities and the hourly model's rules agree over a short window (2010 at 3 hour steps, which includes the December 2010 event and solves in about 15 s), then commit both. Ask before changing scenario values. Update baseline/open-items.md as items close.

- [ ] **FT draws on the H2 store** (open item). In zcb_2024 at PyPSA's one-year capacities, the same-hour rule leaves 43.6 TWh/yr of synthetic fuel unmet.
- [ ] **Enforce the synthetic fuel store capacity** (open item).
- [ ] **CO2 buffer for methanation**, so methanation follows the H2 surplus. A CO2 store in both models.
- [ ] **Two turbine classes**, OCGT and CCGT in merit order, with their own efficiency, cost and de-rating factor (0.9297 and 0.9048).
- [ ] **Battery power and energy** costed separately, with duration as an input. A separate inverter in PyPSA.
- [ ] **Demand flexibility** at modest participation: smart charging, V2G and the heat store, in both models. Propose shares from PyPSA-Eur practice (half of EVs smart charging) first.
- [ ] Generalise the ten year assumption (the 0.0001 factors in model.js and cost_model, 87,648 in runners). Needed by phase 7 and costs little now.

Done when the PyPSA optimised dispatch and the ZCB rules agree on backup, curtailment and store use within an agreed margin at the same capacities.

## Phase 3b. Long runs and target table

Once the plumbing is shared.

- [ ] Ten year expansion with the value of lost load, with `noshed` and with `yearly`.
- [ ] One year hourly against 3 hourly, to size the battery and turbine error.
- [ ] Rules at the optimum for each result: whether the rules balance (nothing unmet, stores back to their start levels), their cost against the optimum, and their dispatch against the optimised dispatch. This is the core validation measure for D3.
- [ ] Variant `free` with onshore and offshore resource limits.
- [ ] A target table: capacities and store sizes for each run, with the ZCB values beside them, in ZCB_PyPSA/docs/results.md.

Done when the target table no longer changes much with the lost load value, foresight and resolution.

## Phase 4. Retune zcb_2024 once

- [ ] Propose new values for offshore wind, electrolysis, methanation, FT, turbines (by class), battery, stores and biogas, guided by the phase 3b targets, with the store criteria in docs/zcb-2024-notes.md (methane and synthetic fuel stores end near their start levels, nothing unmet). The rules decide the values (D3).
- [ ] Apply after agreement and update docs/zcb-2024-notes.md with the before and after results.
- [ ] Export the retuned scenario to ZCB_PyPSA and rerun replay, dispatch and expansion.
- [ ] **Validation report.** Retuned zcb_2024 against the PyPSA optimum: total cost gap, each capacity, curtailment, backup output and store use, and the dispatch gap at equal capacities. Keep it in ZCB_PyPSA/docs/results.md and summarise it in docs/zcb-2024-notes.md.

## LHV work stream (D2)

Separate from the phases. Check the implications before changing anything.

- [ ] Include the FT hydrogen ratio (0.61 per unit of fuel) and the costs converted with it.
- [ ] List every H2 and methane quantity and efficiency in model.js, the scenarios, the baselines and the land model, and its current basis.
- [ ] Work out what changes: efficiencies (electrolysis 0.80 HHV is about 0.68 LHV), store sizes and demands in TWh, emission factors per kWh, fuel prices per MWh, costs per kW of H2, and the baseline's DUKES gross energy figures.
- [ ] Decide where conversions sit (inputs, or a factor at the boundary with the baseline statistics) and set out the effect on zcb_2024 results before applying.

## Phase 5. Hourly prices and cost recovery

- [ ] Take marginal prices from the phase 3b cost optimal network and check cost recovery for every extendable technology.
- [ ] Add an hourly marginal electricity price to model.js outputs, using the hour class method from the cost work handover, calibrated against the PyPSA prices.
- [ ] Checks: electricity and fuel revenue against total system cost, offshore wind revenue against its cost, and the series valuation of the SPF penalty against resizing.
- [ ] **Fuel prices for end users.** Once fuel production cost is split between electricity and fuels (open item), report the cost of synthetic fuel, hydrogen and methane per kWh and per litre, and compare zcb_2024 aviation and shipping fuel with 2024 jet fuel and marine gas oil prices.
- [ ] Rerun the SPF 2.8 against 3.8 study in both models. Decide whether to finish the blog post (/var/www/trystan2/pages/en/heatpump_spf_system.html).

## Phase 6. Industry

The remaining steps of the industry rework. Step 4 depends on phase 3 flexibility.

- [ ] Heat by temperature band (<100, 100 to 200, 200 to 500, >500 °C) with technologies per band.
- [ ] Material sub-models for steel, cement, ammonia and chemicals, and glass. These replace the fixed blast furnace fuel and address the reductant coal open item.
- [ ] Flexible industrial heat as heater GW plus thermal storage GWh in the hourly dispatch, replacing instant fuel switching. Test in PyPSA first.
- [ ] Source the 65% drying fuel efficiency and convert the JRC-IDEES NCV values to gross.

## Phase 7. Weather data (runs alongside)

In ZCB_PyPSA, docs/datasets.md. Start the download in phase 0.

- [ ] ERA5 at the ZCB region centres with the Siemens SWT-3.6, to separate the change of reanalysis from the change of method. Compare with highresolution.csv.zip.
- [ ] PyPSA-Eur turbines, wake losses and eligible areas. Decide on the 0.9 onshore availability.
- [ ] Bias correct against Elexon or NESO metered output (2015 to 2024).
- [ ] Hourly heat demand and heat pump COP from hourly temperature. Test against the "Peak demand is high" open item (55.2 GW against 47.4 GW observed).
- [ ] Hydro inflow profiles and pumped hydro.
- [ ] Extend beyond ten years (needs the phase 3 generalisation). More scarcity events will change turbine and storage sizing, so rerun phases 2 and 4 checks on the longer record.
- [ ] Keep wave, tidal and the demand shape from the current dataset.

## Phase 8. Scope and boundary

- [ ] Interconnected sensitivity (D4), to compare with PyPSA-Eur GB results.
- [ ] International shipping demand and fuel in zcb_2024, to match the baseline boundary.
- [ ] Land model choices in zcb_2024: existing woodland sink, imported biomass share, landfill biochar.

## Backlog

Baseline open items that don't block the phases above. See baseline/open-items.md for detail.

- Sector specific heating system shares.
- Final bioenergy 13% high (cause not traced).
- Harvested wood products as a pool with decay.
- Storage arbitrage in the baseline (needs phase 5 prices).
- Scripted fetch for capture prices and CfD payments.
- Biomass fuel price and 2018 carbon price series.
