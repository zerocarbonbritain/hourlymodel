# Open items

Items found while building baselines that need further attention. Remove an item once it is resolved.

## Model

- **Storage only charges from surplus supply.** In a baseline there is little surplus, so modelled storage output is 0.03 TWh against 3.5 TWh in DUKES 5.16. Real storage also arbitrages against prices and supports the system. The build reports this as a failed `check` on `electric_storage.capacity_GWh`.
- **LCOE leaves out carbon prices and biomass fuel.** Fuel prices for gas, oil and coal are included (DESNZ QEP 3.2.1, which excludes carbon prices). There is no official series for biomass fuel prices paid by generators.
- **Biofuel supply is flat.** It feeds the liquid fuel store, so the profile has little effect.

## Inputs

- **DUKES 6.1 commercial ambient heat** (12.0 TWh) includes reversible air conditioning, which inflates the heat pump share.
- **Boiler and heat pump efficiencies** are carried from the 2018 baseline.
- **Assumed per unit values:** EV battery 60 kWh and charger 7 kW per car, car EV miles at 1.32 times the battery electric stock share, battery storage duration 1.3 hours, pumped hydro energy 24 GWh.
- **Interconnector capacity** sums the interconnectors listed in DUKES 5.13A by commissioning year. The table lists current links only, so a closed link would be missed for a past year.
- **`land_use` areas** are the 2018 values, and the existing woodland areas are inherited from the ZCB default.
- **baseline_2018 miles per person are anchored to the original 2018 values.** The transport formulas scale the original 2018 baseline by passenger km and population, so the rebuilt 2018 values are the original ones with revisions applied, not an independent derivation.

## Build

- **Households source URL is not versioned.** ONS only offers a `current` link for families and households, so the file will change when the 2026 edition is published. The hash check will catch it.
- **NTS0303 covers England only.** Walking and cycling `miles_pp` use it as a UK proxy, as in the 2018 baseline.
