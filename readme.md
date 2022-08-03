# ZeroCarbonBritain hourly energy model

**An open-source javascript implementation of the 10-year hourly cross sectoral UK energy model behind the ZeroCarbonBritain scenario.** 

The default scenario presented in the tool is the main ZeroCarbonBritain scenario as presented in the reports. The other scenario currently available is a baseline scenario reflecting current energy use and carbon emissions. Both scenarios can be used as starting points from which to explore different variants, either in terms of zero carbon end points or interim steps along the way.

### [Launch online tool: http://openenergymonitor.org/zcem](http://openenergymonitor.org/zcem)

![zcem.png](img/zcem.png)

**Zero carbon supply options**

- Variable renewables: Offshore wind, Onshore wind, solar PV & thermal, Wave and Tidal energy. 
- Fixed renewables: Hydro, Geothermal electricity and geothermal heat.
- Nuclear electricity (currently simple flat output)
- Biomass for heat and biomass for synthetic fuels (methane and liquid fuels).
- Backup electricity generation (options include hydrogen, synthetic methane & biomass)

**Demand model**

- Explore: electrification and cross sector integration.
- Domestic and service sector lighting, appliances and cooking demands
- Domestic, service and industry sectors space and water heating demand
- Heating system technologies: Heat pumps, direct electric, boilers (H2, CH4, Biomass, Oil) 
- Transport model based on passenger miles travelled, occupancy rates, vehicle efficiencies and drive train types. 
- Simple industry model
 
**Storage and Synthetic fuels**

- Electricity storage (e.g battery storage or pump hydro)
- Hydrogen production via electrolysis 
- Hydrogen storage (e.g large scale salt caverns)
- Synthetic methane production and storage
- Synthetic liquid fuels production and storage

**Variable renewable dataset**

At the heart of the model is a 10 year hourly offshore wind, onshore wind, solar, wave & tidal dataset, this dataset is derived from hourly weather data mapped to relevant offshore and onshore regions. These datasets are normalised and can be multiplied by an installed capacity in order to provide an expected output for a given installed capacity.

**Limitations & improvement wish list**

All models have limitations, here are a few limitations with this model to bear in mind. These could be improved in future.

- Flat plate grid model: There is no detailed spatial model of the grid that might explore related constraints and costs with increasing transmission and distribution capacities. The model does provide insight into the maximum amount of end use electricity demand, maximum generation and curtailment estimates. These give a rough idea of the extent to which grid capacity would need to be increased but not specifically where that should happen.

- No European or wider grid integration: Already a reality and likely to play a more significant role over time but would require substantial increase in complexity and scope of the model to include energy demand and supply in all countries in order to establish the extent of energy flow between countries. Other studies have shown that wider grid integration may provide in the order of a 9% reduction in cost (e.g Michael Child et al. (2019)). 

- Electricity and heat storage algorithms could be improved to allow better utilisation for backup fuel displacement and peak-shaving. Current implementation is limited to a simple 'flat-out' charge when surplus is available, discharge when not available, or a charge/discharge rate based on a +-12h average of energy surplus and deficit. 

- There are currently no limitations on backup methane or hydrogen gas turbine ramp rates and the model suggests a need for these resources to ramp up from zero to high outputs over relatively short timescales. 

- Cost model: there is currently no integrated cost model in the javascript implementation.

- Carbon capture and storage technology options not yet implemented, either using fossil fuels or bio-energy.


