No bugs in the model's arithmetic, the energy balance closes to rounding error in every run. But the compilation surfaced a few structural issues worth addressing, roughly in order of impact:

Hard-coded 2018 energy industry fractions. model.js:1418-1422 computes refinery and oil and gas extraction fuel use from fixed constants (refineries 5.76% of oil, extraction 3.34% of oil plus gas, gas losses 0.69%) calibrated to 2018. They cannot be set per scenario, and for 2024 they slightly overstate refinery use (42 TWh modelled against 38.5 in DUKES). Promoting them to scenario inputs with the current values as defaults would fix this cleanly.

No interconnector import category. Backup generation absorbs net imports (33.4 TWh in 2024, and growing). The gap widens each baseline, and it distorts backup fuel emissions because imports are mostly French nuclear and Norwegian hydro, not gas. Even a simple flat "imports_TWh" supply input would help.

No biofuel share in transport liquid fuel. All road fuel is emitted at the oil factor, but around 29 TWh of 2024 road fuel is biofuel, overstating emissions by roughly 8 MtCO2e. A biofuel percentage on liquid transport fuel would remove most of the residual gap between modelled and published totals.

No solar availability input. Offshore and onshore wind have availability fields for calibrating to observed capacity factors, solar does not. In 2024 the dataset's 9.4% happens to sit near the observed 9.2%, but there is no way to correct it when it drifts.

Likely double count in the 2018 baseline itself. refinery_electric_TWhy of 12.6 in baseline_2018 matches "electricity used by the electricity generation industry" from the workbook, which overlaps with electricity_own_use_prc of 4.4%. I set the 2024 value to the non-generation energy industry electricity (4.7 TWh) to avoid repeating it, but the 2018 file may deserve a recheck.

Tutorial errata (documentation, not model): step 7 describes efficiency.IC as kWh per vehicle km when it is an engine efficiency divisor, step 8 misattributes other_non_heat_TWhy to DUKES energy industry use, and the motorised miles_pp values come from TSGB0101 passenger kilometres rather than NTS.

One negligible oddity: the electric store ends the 10 year run 9 GWh below its start, which shows in the final_store_balance debug line but is immaterial at this scale.

Happy to fix any of these; items 1, 4 and 6 are small and self-contained, while 2 and 3 change model behaviour and would shift the ZCB scenarios as well, so they warrant a bit more care.