# Open items

Items found while building baselines that need further attention. Remove an item once it is resolved.

## Model

- **LCOE leaves out fuel costs.** `o.LCOE` counts capital and operating costs only. That suits zero carbon scenarios, but for a baseline it leaves out fossil fuel, so baseline LCOE is not meaningful.
- **Imports and biofuel are flat.** `supply.imports_TWhy` and `synth_fuel.biofuel_supply_TWhy` have no hourly profile. Real interconnector flows respond to prices, so hourly backup patterns are approximate.
- **Coal backup share uses the coal emission factor for other thermal.** `prc_coal` is coal plus other thermal (mainly waste). Its efficiency now covers both, but fuel CO2 still uses the coal factor (0.317 kg/kWh). Municipal solid waste CO2 (7.07 Mt) is left to this route, not `emissions_balance`.

## Inputs

- **Heat pump SPF.** Heating shares use SPF 3 (heat = 1.5 x ambient) but the model's heat pump efficiencies are 240, 250 and 320%. DUKES 6.1 commercial ambient heat (12.0 TWh) includes reversible air conditioning.
- **Efficiencies carried from 2018:** heat pumps and boilers.
- **Rail electric share** (66%) is a judgement value. Modelled electric rail is 4.7 TWh against 5.1 TWh in DUKES 1.1.
- **EV battery store and charge rate** (75 GWh, 9 GW) are judgement values and do not scale consistently from 2018.
- **Grid battery capacity has no DUKES source.** `electric_storage` 30 GWh and 7 GW is pumped hydro (2.74 GW in DUKES 5.7) plus an estimate.
- **`land_use` areas** are the 2018 values, and the existing woodland areas are inherited from the ZCB default.
- **baseline_2018 has not been rebuilt.** It predates the fixes above (miles per person, gas losses double count, oil backup efficiency, imports, biofuel), its car efficiency rests on an older C8 edition, and `refinery_electric_TWhy` may double count generation own use. See [audits/errata.md](../audits/errata.md).

## Build

- **Households source URL is not versioned.** ONS only offers a `current` link for families and households, so the file will change when the 2026 edition is published. The hash check will catch it.
- **NTS0303 covers England only.** Walking and cycling `miles_pp` use it as a UK proxy, as in the 2018 baseline.
