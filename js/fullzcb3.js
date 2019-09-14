/*
---------------------------------------------------
ZeroCarbonBritain hourly energy model v3
---------------------------------------------------

CHANGE LOG
---------------------------------------------------

- Hour for day temperatures roll over at 23:00 in spreadsheet model, adjusted to roll over at midnight but could this be DST related? removed temperature set to zero on last hour due to roll over.

- Addition of gas boiler heating option to explore biogas+sabatier heating option

- Heatstore averaging did not roll over -12h at the start in the same way as the other stores, modified to wrap around for consistency

- Modified heatstore storage model to use the average of the heat demand rather than the average of the electricity balance in order to focus on removing the heat demand peaks, reduces max elec heat demand from ~80GW to 67GW. Looking at the heat store operation visually on the new 'heat' tab also suggest better peak removal. The previous implementation also ran the store prior to industrial electricity demand and so the electricity balance was more often positive which meant the store was perhaps not as utilised as it could have been. 8h forward sum removed, not entirely sure what this was doing, I may well have missed something here. Ideally more research on this would be good to really understand what is the best appraoch.

- EV store added limit to check that charge is not larger than available balance and discharge not larger than negative balance. EV driving demand modified to subtract before the smart V2G discharge.

- Final elec store added limits to check that it does not discharge more than negative balance and does not charge at a rate higher than the surplus available.

- Modifications to stores removes the imbalance in the model that caused dips and peaks above and below the supply line

- Detailed transport model

- ITHEM

- Hydrogen storage

Store performance, matching addition
---------------------------------------------------
- heatstore:OFF  EVstore:OFF  elecstore:OFF: 81.6 %
- heatstore:ON   EVstore:OFF  elecstore:OFF: 82.0 %
- heatstore:ON   EVstore:ON   elecstore:OFF: 89.7 %
- heatstore:ON   EVstore:OFF  elecstore:ON:  86.1 %
- heatstore:ON   EVstore:ON   elecstore:ON:  91.9 %

Issues to fix
---------------------------------------------------
- no storage losses
- methane losses from store capping, if biogas feed is set too high
- search MFIX to find notes

*/

function fullzcb3_init()
{
    population_2030 = 70499802
    households_2030 = 29941701
    units_mode = "TWhyr"
    unitsmode = "GW"   
    
    number_of_households = 29941701
    // ---------------------------------------------------------------------------
    // dataset index:
    // 0:onshore wind, 1:offshore wind, 2:wave, 3:tidal, 4:solar, 5:traditional electricity
    offshore_wind_capacity = 150.0
    onshore_wind_capacity = 20.0
    wave_capacity = 10.0
    tidal_capacity = 20.0
    hydro_capacity = 3.0
    solarpv_capacity = 90.0
    solarthermal_capacity = 30.0
    geothermal_elec_capacity = 3.0
    geothermal_heat_capacity = 2.0
    nuclear_capacity = 0.0
    grid_loss_prc = 0.07
    
    // Availability factors
    offshore_wind_availability = 0.9
    onshore_wind_availability = 0.9
    nuclear_availability = 0.9
    
    // Capacity factors
    // All other technologies based on hourly datasets
    hydro_cf = 0.3
    geothermal_elec_cf = 0.9
    geothermal_heat_cf = 0.9
    // ---------------------------------------------    
    // Traditional electricity demand
    // column 5 trad elec demand: 331.033 TWh/yr, normalised and scaled to:
    
    trad_elec_domestic_appliances = 38.59 // TWh/yr (45% of 2007 figure, does not include cooking)
    trad_elec_services_appliances = 41.41 // TWh/yr
    trad_elec_services_cooling = 4.55     // TWh/yr
    
    // ---------------------------------------------
    // Space & water heating demand
    // ---------------------------------------------
    // domestic simple house model
    total_floor_area = 85 // m2
    storey_height = 2.2
    wall_ins_thickness = 0.1
    floor_ins_thickness = 0.1
    loft_ins_thickness = 0.3
    window_type = 2
    glazing_extent = 0.2
    air_change_per_hour = 0.54 // non pressurised air change rate
    
    domestic_space_heat_demand_WK = 114.6 // W/K (DECC 2050 Pathway level 4) x number of households 2030 = 3.548 GW/K
    services_space_heat_demand_GWK = 1.486 // GW/K
    industry_space_heat_demand_GWK = 0.502 // GW/K
    space_heat_base_temperature = 13.07               // Uses 16.7°C as average internal temp. and gains & losses from DECC 2050
    
    domestic_water_heating = 40.80 // TWh
    services_water_heating = 15.99 // TWh
        
    // Heating system efficiencies
    heatpump_COP = 3.0
    elres_efficiency = 1.0
    biomass_efficiency = 0.9
    methane_boiler_efficiency = 0.9
    
    // Heating system share of demand
    spacewater_share_heatpumps = 0.8
    spacewater_share_elres = 0.15
    spacewater_share_biomass = 0.05
    spacewater_share_methane = 0.00
    
    // Heatstore
    heatstore_enabled = 1
    heatstore_storage_cap = 100.0
    heatstore_charge_cap = 50.0
    // ---------------------------------------------
    // Industrial & cooking
    // ---------------------------------------------
    annual_cooking_elec = 27.32
    annual_high_temp_process = 49.01          // 26.3% elec, 73.7% gas in original model
    annual_low_temp_dry_sep = 117.78          // 66% elec, 11% gas, 22% biomass CHP in original model

    high_temp_process_fixed_elec_prc = 0.125
    high_temp_process_fixed_gas_prc = 0.375
    high_temp_process_fixed_biomass_prc = 0.0
    high_temp_process_DSR_prc = 0.5

    low_temp_process_fixed_elec_prc = 0.3
    low_temp_process_fixed_gas_prc = 0.1
    low_temp_process_fixed_biomass_prc = 0.2
    low_temp_process_DSR_prc = 0.4
            
    annual_non_heat_process_elec = 88.00
    annual_non_heat_process_biogas = 13.44
    annual_non_heat_process_biomass = 5.58
    
    industrial_biofuel = 13.44
    // ---------------------------------------------
    // Transport
    // ---------------------------------------------
    electrains_demand = 12.22 // and ships?
    
    // Electric cars
    BEV_demand = 49.53
    electric_car_battery_capacity = 513.0    // GWh
    electric_car_max_charge_rate = 73.3      // GW
    smart_charging_enabled = 1
    
    // H2 and synthetic fuels
    transport_H2_demand = 9.61
    transport_CH4_demand = 0.0
    transport_biofuels_demand = 33.45
    transport_kerosene_demand = 40.32

    // ---------------------------------------------
    // Storage
    // ---------------------------------------------    
    // Synth fuel production
    synth_fuel_capacity = 9.25      // GW
    synth_fuel_store_SOC_start = 5000.0 // GWh
    FT_process_biomass_req = 1.3   // GWh/GWh fuel
    FT_process_hydrogen_req = 0.61 // GWh/GWh fuel
    
    // Electricity Storage
    electricity_storage_enabled = 1
    elec_store_storage_cap = 50.0
    elec_store_charge_cap = 10.0
    
    // Hydrogen
    electrolysis_cap = 20.4
    electrolysis_eff = 0.8
    hydrogen_storage_cap = 18000.0
    minimum_hydrogen_store_level = 0.1

    // biogas
    biomass_for_biogas = 55.0    
    anaerobic_digestion_efficiency = 0.6                                     // HHV, originally 0.5747
    co2_tons_per_gwh_methane = (1000.0/15.4)*((0.40*44.009)/(0.60*16.0425))  // 15.4 kWh/kg, MWh/ton HHV, proportion by molar mass
    
    // Methanation
    methanation_capacity = 3.1
    methane_SOC_start = 10000.0
    methane_store_capacity = 80000.0

    // IHTEM Methanation
    IHTEM_cap = 8.5         // GW
    IHTEM_efficiency = 0.70  // mid range between store & go and helmeth
    
    // Dispatchable
    dispatch_gen_cap = 45.0
    dispatchable_gen_eff = 0.50
    
    // Profiles
    cooking_profile = [0.00093739, 0.00093739, 0.00093739, 0.005002513, 0.015325386, 0.034557134, 0.075528659, 0.10242465, 0.112118681, 0.068802784, 0.046286663, 0.030023072, 0.019077393, 0.019077393, 0.021108649, 0.029555111, 0.069742295, 0.077562688, 0.071150746, 0.058327514, 0.044879681, 0.037216907, 0.032212599, 0.027207312];
    
    hot_water_profile = [0.00093739, 0.00093739, 0.00093739, 0.005002513, 0.015325386, 0.034557134, 0.075528659, 0.10242465, 0.112118681, 0.068802784, 0.046286663, 0.030023072, 0.019077393, 0.019077393, 0.021108649, 0.029555111, 0.069742295, 0.077562688, 0.071150746, 0.058327514, 0.044879681, 0.037216907, 0.032212599, 0.027207312];

    space_heat_profile = [0.008340899, 0.008340899, 0.008340899, 0.008340866, 0.016680908, 0.06511456, 0.076803719, 0.083470637, 0.0751301, 0.06009123, 0.04593692, 0.040060611, 0.0350685, 0.033362773, 0.033394683, 0.034247234, 0.036743141, 0.040881845, 0.05175043, 0.06264997, 0.064292437, 0.060849104, 0.04176657, 0.008341064];

    // space_heat_profile = [0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667];

    elec_trains_use_profile = [0.004268293, 0.002439024, 0.001829268, 0.001219512, 0.003658536, 0.009756097, 0.025609755, 0.061585364, 0.054878047, 0.048780486, 0.058536584, 0.066463413, 0.07317073, 0.065853657, 0.07317073, 0.082317071, 0.077439022, 0.079268291, 0.067073169, 0.051219511, 0.038414633, 0.02804878, 0.015853658, 0.009146341];
    
    high_temp_process_profile = [0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667];
    
    low_temp_process_profile = [0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667];
    
    not_heat_process_profile = [0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667];
    
    BEV_use_profile = [0.004268293, 0.002439024, 0.001829268, 0.001219512, 0.003658536, 0.009756097, 0.025609755, 0.061585364, 0.054878047, 0.048780486, 0.058536584, 0.066463413, 0.07317073, 0.065853657, 0.07317073, 0.082317071, 0.077439022, 0.079268291, 0.067073169, 0.051219511, 0.038414633, 0.02804878, 0.015853658, 0.009146341];
    
    BEV_charge_profile = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05, 0.05, 0.05, 0.05, 0.1];
    
    BEV_plugged_in_profile = [0.873684211, 0.889473684, 0.894736842, 0.9, 0.878947368, 0.826315789, 0.689473684, 0.378947368, 0.436842105, 0.489473684, 0.405263158, 0.336842105, 0.278947368, 0.342105263, 0.278947368, 0.2, 0.242105263, 0.226315789, 0.331578947, 0.468421053, 0.578947368, 0.668421053, 0.773684211, 0.831578947];

    // -----------------------------------------------------------------------------
    // Transport model
    // -----------------------------------------------------------------------------
    km_per_mile = 1.609344
    
    // zcb figures
    walking_miles_pp = 186
    cycling_miles_pp = 168
    ebikes_miles_pp = 155
    rail_miles_pp = 808
    bus_miles_pp = 1150
    motorbike_miles_pp = 186
    carsvans_miles_pp = 4350
    aviation_miles_pp = 1118

    // 2016 figures
    /*walking_miles_pp = 198
    cycling_miles_pp = 48
    ebikes_miles_pp = 0
    rail_miles_pp = 754
    bus_miles_pp = 325
    motorbike_miles_pp = 46
    carsvans_miles_pp = 6299
    aviation_miles_pp = 3438*/
    
    // Mechanical assumed 80% of electric vehicle economy including charging losses, trains 90%
    ebikes_mechanical_kwhppkm_full = 0.0081
    rail_mechanical_kwhppkm_full = 0.027
    bus_mechanical_kwhppkm_full = 0.016
    motorbike_mechanical_kwhppkm_full = 0.054
    carsvans_mechanical_kwhppkm_full = 0.031
    aviation_mechanical_kwhppkm_full = 0.070
    
    // Includes 10% charging loss apart from rail + 10% conv loss
    ebikes_electric_kwhppkm_full = ebikes_mechanical_kwhppkm_full / 0.8
    rail_electric_kwhppkm_full = rail_mechanical_kwhppkm_full / 0.9
    bus_electric_kwhppkm_full = bus_mechanical_kwhppkm_full / 0.8
    motorbike_electric_kwhppkm_full = motorbike_mechanical_kwhppkm_full / 0.8
    carsvans_electric_kwhppkm_full = carsvans_mechanical_kwhppkm_full / 0.8
    aviation_electric_kwhppkm_full = aviation_mechanical_kwhppkm_full / 0.8    

    // Fuel cell vehicle efficiency 90% + fuel cell efficiency 55% + transport 80% + compression 90% (liquefaction assumed for aircraft)
    rail_hydrogen_kwhppkm_full = rail_mechanical_kwhppkm_full / (0.9*0.55*0.8*0.9)
    bus_hydrogen_kwhppkm_full = bus_mechanical_kwhppkm_full / (0.9*0.55*0.8*0.9)
    motorbike_hydrogen_kwhppkm_full = motorbike_mechanical_kwhppkm_full / (0.9*0.55*0.8*0.9)
    carsvans_hydrogen_kwhppkm_full = carsvans_mechanical_kwhppkm_full / (0.9*0.55*0.8*0.9)
    aviation_hydrogen_kwhppkm_full = aviation_mechanical_kwhppkm_full / (0.9*0.55*0.9*0.65)

    // Aircraft efficiency here is 20% to match similar today
    // note that fleet average cars & vans here is 30% lower than fleet average in 2016
    rail_ice_kwhppkm_full = rail_mechanical_kwhppkm_full / 0.3
    bus_ice_kwhppkm_full = bus_mechanical_kwhppkm_full / 0.3
    motorbike_ice_kwhppkm_full = motorbike_mechanical_kwhppkm_full / 0.3
    carsvans_ice_kwhppkm_full = carsvans_mechanical_kwhppkm_full / 0.3
    aviation_ice_kwhppkm_full = aviation_mechanical_kwhppkm_full / 0.2

    // Load factors (zcb)
    rail_load_factor = 0.42
    bus_load_factor = 0.42
    motorbike_load_factor = 1.1
    carsvans_load_factor = 0.4
    aviation_load_factor = 0.85

    // Load factors (2016)
    /*rail_load_factor = 0.324
    bus_load_factor = 0.1432
    motorbike_load_factor = 1.071
    carsvans_load_factor = 0.3288
    aviation_load_factor = 0.85*/
    
    // PRC of different powertrains
    rail_prc_EV = 0.9
    rail_prc_H2 = 0.04
    rail_prc_ICE = 0.06

    bus_prc_EV = 0.9
    bus_prc_H2 = 0.04
    bus_prc_ICE = 0.06

    motorbike_prc_EV = 0.9
    motorbike_prc_H2 = 0.0
    motorbike_prc_ICE = 0.1

    carsvans_prc_EV = 0.9
    carsvans_prc_H2 = 0.04
    carsvans_prc_ICE = 0.06

    aviation_prc_EV = 0.2
    aviation_prc_H2 = 0.0
    aviation_prc_ICE = 0.8
    
    rail_freight_elec_demand = 2.0
    freight_BEV_demand = 10.5
    freight_H2_demand = 4.06
    freight_ICE_demand = 20.58
    // -------------------
}

function fullzcb3_run()
{
    // ---------------------------------------------
    // Supply totals
    // ---------------------------------------------
    total_offshore_wind_supply = 0
    total_onshore_wind_supply = 0
    total_solar_supply = 0
    total_solarthermal = 0
    total_wave_supply = 0
    total_geothermal_heat = 0
    total_tidal_supply = 0
    total_geothermal_elec = 0
    total_nuclear_supply = 0
    total_hydro_supply = 0
    total_biomass_used = 0
    total_supply = 0
    total_ambient_heat_supply = 0

  
    prc_reduction_domestic_appliances = 1.0 - (trad_elec_domestic_appliances / 86.0)
    prc_reduction_services_appliances = 1.0 - (trad_elec_services_appliances / 59.0)
    prc_reduction_services_cooling = 1.0 - (trad_elec_services_cooling / 9.0)
    
    domestic_appliances_kwh = trad_elec_domestic_appliances * 1000000000.0 / households_2030
    trad_elec_demand = trad_elec_domestic_appliances + trad_elec_services_appliances + trad_elec_services_cooling 
    // ---------------------------------------------------------------------------------------------  
    // Building energy model (domestic only)
    // ---------------------------------------------------------------------------------------------
    // 3. Solar gains calculator from window areas and orientations
    // 4. Seperate out cooking, lighting and appliances and water heating demand.
    
    floor_area = total_floor_area / 2.0 
    side = Math.sqrt(floor_area)
         
    walls_uvalue = 1/((1/1.5)+(1/(0.03/wall_ins_thickness))) // Base U-value is uninsulated cavity wall
    floor_uvalue = 1/((1/0.7)+(1/(0.04/floor_ins_thickness))) // Base U-value is uninsulated solid floor
    loft_uvalue = 1/((1/2.0)+(1/(0.03/loft_ins_thickness))) // Base U-value is uninsulated loft
    
    if (window_type==1) window_uvalue = 4.8 // single
    if (window_type==2) window_uvalue = 1.9 // double
    if (window_type==3) window_uvalue = 1.3 // triple

    total_wall_area = (side * storey_height * 2) * 4
    total_window_area = total_wall_area * glazing_extent
    
    windows_south = total_window_area * 0.4
    windows_west = total_window_area * 0.2
    windows_east = total_window_area * 0.2
    windows_north = total_window_area * 0.2
    
    solar_gains_capacity = total_window_area / 3.0

    floor_WK = floor_uvalue * floor_area
    loft_WK = loft_uvalue * floor_area
    
    wall_south_WK = walls_uvalue * ((side * storey_height * 2) - windows_south)
    wall_west_WK = walls_uvalue * ((side * storey_height * 2) - windows_west)
    wall_east_WK = walls_uvalue * ((side * storey_height * 2) - windows_east)
    wall_north_WK = walls_uvalue * ((side * storey_height * 2) - windows_north)
    
    window_WK = (windows_south + windows_west + windows_east + windows_north) * window_uvalue
    
    fabric_WK = floor_WK + loft_WK + wall_south_WK + wall_west_WK + wall_east_WK + wall_north_WK + window_WK
    
    building_volume = floor_area * storey_height * 2.0
    infiltration_WK = 0.33 * air_change_per_hour * building_volume
    
    domestic_space_heat_demand_WK = fabric_WK + infiltration_WK
    // ---------------------------------------------------------------------------------------------    
    // ---------------------------------------------------------------------------------------------
    domestic_space_heat_demand_GWK = (domestic_space_heat_demand_WK * households_2030) / 1000000000.0
    space_heat_demand_GWK = domestic_space_heat_demand_GWK + services_space_heat_demand_GWK + industry_space_heat_demand_GWK
    water_heating = domestic_water_heating + services_water_heating
    
    domestic_water_heating_kwh = domestic_water_heating * 1000000000.0 / households_2030
    prc_reduction_domestic_water_heating = 1.0 - (domestic_water_heating / 71.0)
    prc_reduction_services_water_heating = 1.0 - (services_water_heating / 16.0)

    // ---------------------------------------------------------------------------------------------    
    // Transport model
    // --------------------------------------------------------------------------------------------- 
    // 1. Convert miles to km
    walking_km_pp = walking_miles_pp * km_per_mile
    cycling_km_pp = cycling_miles_pp * km_per_mile
    ebikes_km_pp = ebikes_miles_pp * km_per_mile
    rail_km_pp = rail_miles_pp * km_per_mile
    bus_km_pp = bus_miles_pp * km_per_mile
    motorbike_km_pp = motorbike_miles_pp * km_per_mile
    carsvans_km_pp = carsvans_miles_pp * km_per_mile
    aviation_km_pp = aviation_miles_pp * km_per_mile
    
    // 2. kWh per person _km_ taking into account load factor per mode and power train
    rail_electric_kwhppkm = rail_electric_kwhppkm_full / rail_load_factor
    bus_electric_kwhppkm = bus_electric_kwhppkm_full / bus_load_factor
    motorbike_electric_kwhppkm = motorbike_electric_kwhppkm_full / motorbike_load_factor
    carsvans_electric_kwhppkm = carsvans_electric_kwhppkm_full / carsvans_load_factor
    aviation_electric_kwhppkm = aviation_electric_kwhppkm_full / aviation_load_factor    

    rail_hydrogen_kwhppkm = rail_hydrogen_kwhppkm_full / rail_load_factor
    bus_hydrogen_kwhppkm = bus_hydrogen_kwhppkm_full / bus_load_factor
    motorbike_hydrogen_kwhppkm = motorbike_hydrogen_kwhppkm_full / motorbike_load_factor
    carsvans_hydrogen_kwhppkm = carsvans_hydrogen_kwhppkm_full / carsvans_load_factor
    aviation_hydrogen_kwhppkm = aviation_hydrogen_kwhppkm_full / aviation_load_factor

    rail_ice_kwhppkm = rail_ice_kwhppkm_full / rail_load_factor
    bus_ice_kwhppkm = bus_ice_kwhppkm_full / bus_load_factor
    motorbike_ice_kwhppkm = motorbike_ice_kwhppkm_full / motorbike_load_factor
    carsvans_ice_kwhppkm = carsvans_ice_kwhppkm_full / carsvans_load_factor
    aviation_ice_kwhppkm = aviation_ice_kwhppkm_full / aviation_load_factor
    
    // 2. kWh per person per mode and power train
    ebikes_kwhpp = ebikes_electric_kwhppkm_full * ebikes_km_pp
    rail_kwhpp_EV = rail_electric_kwhppkm*rail_prc_EV*rail_km_pp
    bus_kwhpp_EV = bus_electric_kwhppkm*bus_prc_EV*bus_km_pp
    motorbike_kwhpp_EV = motorbike_electric_kwhppkm*motorbike_prc_EV*motorbike_km_pp
    carsvans_kwhpp_EV = carsvans_electric_kwhppkm*carsvans_prc_EV*carsvans_km_pp
    aviation_kwhpp_EV = aviation_electric_kwhppkm*aviation_prc_EV*aviation_km_pp

    rail_kwhpp_H2 = rail_hydrogen_kwhppkm*rail_prc_H2*rail_km_pp
    bus_kwhpp_H2 = bus_hydrogen_kwhppkm*bus_prc_H2*bus_km_pp
    motorbike_kwhpp_H2 = motorbike_hydrogen_kwhppkm*motorbike_prc_H2*motorbike_km_pp
    carsvans_kwhpp_H2 = carsvans_hydrogen_kwhppkm*carsvans_prc_H2*carsvans_km_pp
    aviation_kwhpp_H2 = aviation_hydrogen_kwhppkm*aviation_prc_H2*aviation_km_pp
    
    rail_kwhpp_ICE = rail_ice_kwhppkm*rail_prc_ICE*rail_km_pp
    bus_kwhpp_ICE = bus_ice_kwhppkm*bus_prc_ICE*bus_km_pp
    motorbike_kwhpp_ICE = motorbike_ice_kwhppkm*motorbike_prc_ICE*motorbike_km_pp
    carsvans_kwhpp_ICE = carsvans_ice_kwhppkm*carsvans_prc_ICE*carsvans_km_pp
    aviation_kwhpp_ICE = aviation_ice_kwhppkm*aviation_prc_ICE*aviation_km_pp

    // 3. National TWh of demand per mode and powertrain
    kwpp_to_TWh = population_2030 * 0.000000001

    ebikes_TWh = ebikes_kwhpp * kwpp_to_TWh
    rail_EV_TWh = rail_kwhpp_EV * kwpp_to_TWh
    bus_EV_TWh = bus_kwhpp_EV * kwpp_to_TWh
    motorbike_EV_TWh = motorbike_kwhpp_EV * kwpp_to_TWh
    carsvans_EV_TWh = carsvans_kwhpp_EV * kwpp_to_TWh
    aviation_EV_TWh = aviation_kwhpp_EV * kwpp_to_TWh

    rail_H2_TWh = rail_kwhpp_H2 * kwpp_to_TWh
    bus_H2_TWh = bus_kwhpp_H2 * kwpp_to_TWh
    motorbike_H2_TWh = motorbike_kwhpp_H2 * kwpp_to_TWh
    carsvans_H2_TWh = carsvans_kwhpp_H2 * kwpp_to_TWh
    aviation_H2_TWh = aviation_kwhpp_H2 * kwpp_to_TWh

    rail_ICE_TWh = rail_kwhpp_ICE * kwpp_to_TWh
    bus_ICE_TWh = bus_kwhpp_ICE * kwpp_to_TWh
    motorbike_ICE_TWh = motorbike_kwhpp_ICE * kwpp_to_TWh
    carsvans_ICE_TWh = carsvans_kwhpp_ICE * kwpp_to_TWh
    aviation_ICE_TWh = aviation_kwhpp_ICE * kwpp_to_TWh

    /*
    rail_kwhpp = rail_kwhpp_EV + rail_kwhpp_H2 + rail_kwhpp_ICE
    bus_kwhpp = bus_kwhpp_EV + bus_kwhpp_H2 + bus_kwhpp_ICE
    motorbike_kwhpp = motorbike_kwhpp_EV + motorbike_kwhpp_H2 + motorbike_kwhpp_ICE
    carsvans_kwhpp = carsvans_kwhpp_EV + carsvans_kwhpp_H2 + carsvans_kwhpp_ICE
    aviation_kwhpp = aviation_kwhpp_EV + aviation_kwhpp_H2 + aviation_kwhpp_ICE
    
    ebikes_TWh = ebikes_kwhpp * kwpp_to_TWh
    rail_TWh = rail_kwhpp * kwpp_to_TWh
    bus_TWh = bus_kwhpp * kwpp_to_TWh
    motorbike_TWh = motorbike_kwhpp * kwpp_to_TWh
    carsvans_TWh = carsvans_kwhpp * kwpp_to_TWh
    aviation_TWh = aviation_kwhpp * kwpp_to_TWh
    
    kwhpp_EV = ebikes_kwhpp + rail_kwhpp_EV + bus_kwhpp_EV + motorbike_kwhpp_EV + carsvans_kwhpp_EV + aviation_kwhpp_EV
    kwhpp_H2 = rail_kwhpp_H2 + bus_kwhpp_H2 + motorbike_kwhpp_H2 + carsvans_kwhpp_H2 + aviation_kwhpp_H2    
    kwhpp_ICE = rail_kwhpp_ICE + bus_kwhpp_ICE + motorbike_kwhpp_ICE + carsvans_kwhpp_ICE + aviation_kwhpp_ICE
    */
    
    BEV_demand = ebikes_TWh + bus_EV_TWh + motorbike_EV_TWh + carsvans_EV_TWh + aviation_EV_TWh + freight_BEV_demand
    electrains_demand = rail_EV_TWh + rail_freight_elec_demand
    transport_H2_demand = rail_H2_TWh + bus_H2_TWh + motorbike_H2_TWh + carsvans_H2_TWh + aviation_H2_TWh + freight_H2_demand
    transport_biofuels_demand = rail_ICE_TWh + bus_ICE_TWh + motorbike_ICE_TWh + carsvans_ICE_TWh + freight_ICE_demand
    transport_kerosene_demand = aviation_ICE_TWh
    transport_bioliquid_demand = transport_biofuels_demand + transport_kerosene_demand
        
    // ---------------------------------------------------------------------------------------------    
    // Hourly model totals
    // ---------------------------------------------------------------------------------------------  
    total_domestic_space_heat_demand = 0
    total_services_space_heat_demand = 0
    total_industry_space_heat_demand = 0
    total_space_heat_demand = 0
    
    total_water_heat_demand = 0
    total_unmet_heat_demand = 0
    unmet_heat_demand_count = 0
    total_biomass_for_spacewaterheat_loss = 0
    total_methane_for_spacewaterheat_loss = 0
    total_heat_spill = 0
    max_heat_demand_elec = 0 
    
    // ---------------------------------------------
    // Store SOC's
    // ---------------------------------------------
    heatstore_SOC_start = heatstore_storage_cap * 0.5
    BEV_Store_SOC_start = electric_car_battery_capacity * 0.5
    elecstore_SOC_start = elec_store_storage_cap * 1.0
    hydrogen_SOC_start = hydrogen_storage_cap * 0.5
    // methane_SOC_start = methane_store_capacity * 0.5
    // synth_fuel_store_SOC_start = 10000.0
    
    heatstore_SOC = heatstore_SOC_start
    BEV_Store_SOC = BEV_Store_SOC_start
    elecstore_SOC = elecstore_SOC_start
    hydrogen_SOC = hydrogen_SOC_start
    methane_SOC = methane_SOC_start
    synth_fuel_store_SOC = synth_fuel_store_SOC_start
    // ---------------------------------------------
    // Transport
    // ---------------------------------------------
    total_EV_charge = 0
    total_EV_demand = 0
    total_elec_trains_demand = 0

    total_hydrogen_produced = 0
    total_hydrogen_demand = 0
    total_hydrogen_for_hydrogen_vehicles = 0
    unmet_hydrogen_demand = 0
    unmet_synth_fuel_demand = 0
    
    // --------------------------------------------- 
    // Final balance
    // ---------------------------------------------
    initial_elec_balance_positive = 0
    final_elec_balance_negative = 0
    final_elec_balance_positive = 0
    total_initial_elec_balance_positive = 0
    total_final_elec_balance_negative = 0
    total_final_elec_balance_positive = 0

    methane_store_empty_count = 0
    methane_store_full_count = 0
    hydrogen_store_empty_count = 0
    hydrogen_store_full_count = 0
    total_synth_fuel_produced = 0
    total_synth_fuel_biomass_used = 0
    total_methane_made = 0
    total_electricity_from_dispatchable = 0
    max_dispatchable_capacity = 0
    total_methane_for_transport = 0
    total_methane_demand = 0
        
    // demand totals
    total_traditional_elec = 0
    total_industrial_elec_demand = 0
    total_industrial_methane_demand = 0
    total_industrial_biomass_demand = 0
    total_industrial_liquid_demand = 0
    
    total_grid_losses = 0
    total_electrolysis_losses = 0
    total_CCGT_losses = 0
    total_sabatier_losses = 0
    total_anaerobic_digestion_losses = 0
    total_FT_losses = 0
    total_IHTEM_losses = 0
    
    total_synth_fuel_demand = 0
    methane_store_vented = 0
    
    // ---------------------------------------------
    // Convert to daily demand, used with daily usage profiles
    // ---------------------------------------------
    
    daily_trad_elec_demand = trad_elec_demand * 1000.0 / 365.25
    
    water_heating_daily_demand = water_heating * 1000.0 / 365.25    
    
    daily_BEV_demand = BEV_demand * 1000.0 / 365.25
    daily_elec_trains_demand = electrains_demand * 1000.0 / 365.25
    daily_transport_H2_demand = transport_H2_demand * 1000.0 / 365.25
    daily_transport_CH4_demand = transport_CH4_demand * 1000.0 / 365.25
    daily_transport_biofuels_demand = transport_biofuels_demand * 1000.0 / 365.25
    daily_transport_kerosene_demand = transport_kerosene_demand * 1000.0 / 365.25
    daily_transport_liquid_demand = transport_bioliquid_demand * 1000.0 / 365.25

    daily_cooking_elec = annual_cooking_elec * 1000.0 / 365.25
    daily_high_temp_process = annual_high_temp_process * 1000.0 / 365.25
    daily_low_temp_dry_sep = annual_low_temp_dry_sep * 1000.0 / 365.25
          
    daily_non_heat_process_elec = annual_non_heat_process_elec * 1000.0 / 365.25
    daily_non_heat_process_biogas = annual_non_heat_process_biogas * 1000.0 / 365.25
    daily_non_heat_process_biomass = annual_non_heat_process_biomass * 1000.0 / 365.25
        
    daily_industrial_biofuel = industrial_biofuel * 1000.0 / 365.25
    daily_biomass_for_biogas = biomass_for_biogas * 1000.0 / 365.25
    hourly_biomass_for_biogas = daily_biomass_for_biogas / 24.0
    
    var check = [];
    
    data = {
        s1_total_variable_supply: [],
        s1_traditional_elec_demand: [],
        industry_elec: [],
        spacewater_elec: [],
        trad_heat_transport_elec: [],
        heatstore: [],
        heatstore_SOC: [],
        BEV_Store_SOC: [],
        elecstore_SOC: [],
        hydrogen_SOC: [],
        methane_SOC: [],
        electricity_from_dispatchable: [],
        elec_store_charge: [],
        elec_store_discharge: [],
        EV_smart_discharge: [],
        EV_charge: [],
        EL_transport: [],
        electricity_for_electrolysis: [],
        export_elec:[],
        unmet_elec:[],
        heatstore_discharge_GWth:[],
        spacewater_balance:[],
        spacewater_heat:[],
        electricity_for_IHTEM:[],
        synth_fuel_store_SOC:[]
    }
    
    // move to hourly model if needed
    // heatpump_COP_hourly = heatpump_COP
    // GWth_GWe = (heatpump_COP_hourly * spacewater_share_heatpumps) + (elres_efficiency * spacewater_share_elres) + (methane_boiler_efficiency * spacewater_share_methane)
    
    var capacityfactors_all = [];
    for (var hour = 0; hour < hours; hour++) {
        var capacityfactors = tenyearsdatalines[hour].split(",");
        for (var i=0; i<capacityfactors.length; i++) {
            capacityfactors[i] = parseFloat(capacityfactors[i]);
        }
        capacityfactors_all.push(capacityfactors)
    }
    
    // --------------------------------------------------------------------------------------------------------------
    // Stage 1: First run calculates arrays used for second stage in +-12h storage models
    // --------------------------------------------------------------------------------------------------------------
    s1_spacewater_demand_before_heatstore = []
    
    for (var hour = 0; hour < hours; hour++) {
        var capacityfactors = capacityfactors_all[hour]
        var day = parseInt(Math.floor(hour / 24))
        var temperature = parseFloat(temperaturelines[day].split(",")[1]);
        
        var time = datastarttime + (hour * 3600 * 1000);
        // --------------------------------------------------------------------------------------------------------------
        // Electricity Supply
        // --------------------------------------------------------------------------------------------------------------
        // variable supply
        offshore_wind_power_supply = offshore_wind_capacity * capacityfactors[1] * offshore_wind_availability
        onshore_wind_power_supply = onshore_wind_capacity * capacityfactors[0] * onshore_wind_availability
        wave_power_supply = wave_capacity * capacityfactors[2]
        tidal_power_supply = tidal_capacity * capacityfactors[3]
        pv_power_supply = solarpv_capacity * capacityfactors[4]
        geothermal_power_supply = geothermal_elec_capacity * geothermal_elec_cf
        hydro_power_supply = hydro_capacity * hydro_cf

        // non-variable non-backup electricity supply
        nuclear_power_supply = nuclear_capacity * nuclear_availability
        chp_power_supply = 0.0

        // totals        
        total_offshore_wind_supply += offshore_wind_power_supply
        total_onshore_wind_supply += onshore_wind_power_supply
        total_solar_supply += pv_power_supply
        total_wave_supply += wave_power_supply
        total_tidal_supply += tidal_power_supply
        total_geothermal_elec += geothermal_power_supply
        total_hydro_supply += hydro_power_supply
        total_nuclear_supply += nuclear_power_supply
        
        // total supply
        electricity_supply = offshore_wind_power_supply + onshore_wind_power_supply + wave_power_supply + tidal_power_supply + pv_power_supply + geothermal_power_supply + hydro_power_supply + chp_power_supply + nuclear_power_supply
        total_supply += electricity_supply
        
        // supply after losses
        supply = electricity_supply * (1.0-grid_loss_prc)
        data.s1_total_variable_supply.push([time,supply])
        // total losses
        total_grid_losses += electricity_supply - supply

        // ---------------------------------------------------------------------------
        // Traditional electricity demand
        // ---------------------------------------------------------------------------
        normalised_trad_elec = capacityfactors[5]/331.033
        traditional_elec_demand = normalised_trad_elec * trad_elec_demand
        
        data.s1_traditional_elec_demand.push([time,traditional_elec_demand])
        total_traditional_elec += traditional_elec_demand
        // ---------------------------------------------------------------------------
        // Space & Water Heat part 1
        // ---------------------------------------------------------------------------
        // space heat
        degree_hours = space_heat_base_temperature - temperature
        if (degree_hours<0) degree_hours = 0
        
        // Domestic space heat
        domestic_space_heat_demand = degree_hours * domestic_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]
        total_domestic_space_heat_demand += domestic_space_heat_demand
        // Services space heat        
        services_space_heat_demand = degree_hours * services_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]
        total_services_space_heat_demand += services_space_heat_demand
        // Industry space heat        
        industry_space_heat_demand = degree_hours * industry_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]        
        total_industry_space_heat_demand += industry_space_heat_demand
        // Combined space heat         
        space_heat_demand = domestic_space_heat_demand + services_space_heat_demand + industry_space_heat_demand
        total_space_heat_demand += space_heat_demand
        
        // water heat
        hot_water_demand = hot_water_profile[hour%24] * water_heating_daily_demand
        total_water_heat_demand += hot_water_demand       
        
        // solar thermal
        solarthermal_supply = solarthermal_capacity * capacityfactors[4]
        total_solarthermal += solarthermal_supply
        
        // geothermal
        geothermal_heat_supply = geothermal_heat_capacity * geothermal_heat_cf
        total_geothermal_heat += geothermal_heat_supply
        
        spacewater_demand_before_heatstore = space_heat_demand + hot_water_demand - geothermal_heat_supply - solarthermal_supply
        s1_spacewater_demand_before_heatstore.push(spacewater_demand_before_heatstore)
    }
    
    domestic_space_heating_kwh = total_domestic_space_heat_demand*0.1*1000000 / households_2030
    
    prc_reduction_domestic_space_heat_demand = 1.0 - ((total_domestic_space_heat_demand*0.0001) / 266.0)
    prc_reduction_services_space_heat_demand = 1.0 - ((total_services_space_heat_demand*0.0001) / 83.0)
    prc_reduction_industry_space_heat_demand = 1.0 - ((total_industry_space_heat_demand*0.0001) / 28.0)
    prc_reduction_space_heat_demand = 1.0 - ((total_space_heat_demand*0.0001) / (266.0+83.0+28.0))
    
    loading_prc(40,"model stage 1");
    
    // --------------------------------------------------------------------------------------------------------------
    // Stage 2: Heatstore
    // --------------------------------------------------------------------------------------------------------------
    s2_deviation_from_mean_GWth = []
    for (var hour = 0; hour < hours; hour++) {
        var time = datastarttime + (hour * 3600 * 1000);
        
        var sum = 0; var n = 0;
        for (var i=-12; i<12; i++) {
            var index = hour + i
            if (index>=hours) index-=hours
            if (index<0) index += hours
            sum += s1_spacewater_demand_before_heatstore[index]
            n++;
        }
        average_12h_balance_heat = sum / n;
        
        deviation_from_mean_GWe = s1_spacewater_demand_before_heatstore[hour] - average_12h_balance_heat
        deviation_from_mean_GWth = deviation_from_mean_GWe //* GWth_GWe
        
        s2_deviation_from_mean_GWth.push(deviation_from_mean_GWth)
    }
    loading_prc(50,"model stage 2");
    
    s3_heatstore_SOC = []
    s3_balance_before_BEV_storage = []
    s3_spacewater_elec_demand = []
    s3_methane_for_spacewaterheat = []
    
    for (var hour = 0; hour < hours; hour++) {
        var time = datastarttime + (hour * 3600 * 1000);
        var day = parseInt(Math.floor(hour / 24))
        var temperature = parseFloat(temperaturelines[day].split(",")[1]);
        
        spacewater_balance = s1_spacewater_demand_before_heatstore[hour]
        data.spacewater_balance.push([time,spacewater_balance])  
        
        // ---------------------------------------------------------------------------------------------
        // HEATSTORE
        // ---------------------------------------------------------------------------------------------
        heatstore_charge_GWth = 0
        heatstore_discharge_GWth = 0
        
        if (heatstore_enabled) {
            // CHARGE
            if (s2_deviation_from_mean_GWth[hour]<0.0) {
                heatstore_charge_GWth = -s2_deviation_from_mean_GWth[hour] * 0.40 * (heatstore_storage_cap / 100.0)
                //heatstore_charge_GWth = (heatstore_storage_cap-heatstore_SOC)*-s2_deviation_from_mean_GWth[hour]/(heatstore_storage_cap*0.5)
            }
            if (heatstore_charge_GWth>heatstore_charge_cap) heatstore_charge_GWth = heatstore_charge_cap
            if ((heatstore_charge_GWth+heatstore_SOC)>heatstore_storage_cap) heatstore_charge_GWth = heatstore_storage_cap - heatstore_SOC
            
            spacewater_balance += heatstore_charge_GWth
            heatstore_SOC += heatstore_charge_GWth
            
            // DISCHARGE
            if (s2_deviation_from_mean_GWth[hour]>=0.0) {  
                heatstore_discharge_GWth = s2_deviation_from_mean_GWth[hour] * 0.32 * (heatstore_storage_cap / 100.0)
                //heatstore_discharge_GWth = heatstore_SOC*s2_deviation_from_mean_GWth[hour]/(heatstore_storage_cap*0.5)
                if (heatstore_discharge_GWth>spacewater_balance) heatstore_discharge_GWth = spacewater_balance
            }
            if (heatstore_discharge_GWth>heatstore_charge_cap) heatstore_discharge_GWth = heatstore_charge_cap
            if (heatstore_discharge_GWth>heatstore_SOC)  heatstore_discharge_GWth = heatstore_SOC
            
            spacewater_balance -= heatstore_discharge_GWth
            heatstore_SOC -= heatstore_discharge_GWth
        }
        
        data.heatstore_discharge_GWth.push([time,heatstore_discharge_GWth])        
        // ---------------------------------------------------------------------------------------------
        if (spacewater_balance<0.0) {
            total_heat_spill += -spacewater_balance
            spacewater_balance = 0
        }
        
        
        s3_heatstore_SOC.push(heatstore_SOC)
        data.heatstore_SOC.push([time,heatstore_SOC])
        data.spacewater_heat.push([time,spacewater_balance])
        // space & water heat tab
        spacewater_demand_after_heatstore = spacewater_balance
        if (spacewater_demand_after_heatstore<0.0) spacewater_demand_after_heatstore = 0.0
        
        // electric resistance
        heat_from_elres = spacewater_demand_after_heatstore * spacewater_share_elres
        elres_elec_demand = heat_from_elres / elres_efficiency
        
        // heatpumps
        heatpump_COP = 1.8+(temperature+15.0)*0.05
        if (temperature<-15.0) heatpump_COP = 1.8
                
        heat_from_heatpumps = spacewater_demand_after_heatstore * spacewater_share_heatpumps
        heatpump_elec_demand = heat_from_heatpumps / heatpump_COP
        ambient_heat_used = heat_from_heatpumps * (1.0-1.0/heatpump_COP)
        total_ambient_heat_supply += ambient_heat_used
        
        // biomass heat
        heat_from_biomass = spacewater_demand_after_heatstore * spacewater_share_biomass
        biomass_for_spacewaterheat = heat_from_biomass / biomass_efficiency
        total_biomass_used += biomass_for_spacewaterheat
        total_biomass_for_spacewaterheat_loss += biomass_for_spacewaterheat - heat_from_biomass
        
        // methane/gas boiler heat
        heat_from_methane = spacewater_demand_after_heatstore * spacewater_share_methane
        methane_for_spacewaterheat = heat_from_methane / methane_boiler_efficiency
        s3_methane_for_spacewaterheat.push(methane_for_spacewaterheat)
        total_methane_for_spacewaterheat_loss += methane_for_spacewaterheat - heat_from_methane
        
        // check for unmet heat
        unmet_heat_demand = spacewater_demand_after_heatstore - heat_from_heatpumps - heat_from_elres - heat_from_biomass - heat_from_methane
        if (unmet_heat_demand.toFixed(3)>0) {
            unmet_heat_demand_count++
            total_unmet_heat_demand += unmet_heat_demand
        }
        
        spacewater_elec_demand = heatpump_elec_demand + elres_elec_demand // electricity tab
        if (spacewater_elec_demand>max_heat_demand_elec) max_heat_demand_elec = spacewater_elec_demand
        
        s3_spacewater_elec_demand.push(spacewater_elec_demand)
        data.spacewater_elec.push([time,spacewater_elec_demand])
        
    }
    loading_prc(60,"model stage 3");

    // ---------------------------------------------------------------------------
    // Industrial
    // ---------------------------------------------------------------------------
    s1_industrial_elec_demand = []
    s1_methane_for_industry = []
    
    for (var hour = 0; hour < hours; hour++)
    {
        var time = datastarttime + (hour * 3600 * 1000);
        
        // electric demand
        cooking_elec = cooking_profile[hour%24] * daily_cooking_elec
        non_heat_process_elec = not_heat_process_profile[hour%24] * daily_non_heat_process_elec

        // balance including non DSR industrial load
        balance = data.s1_total_variable_supply[hour][1] - data.s1_traditional_elec_demand[hour][1] - s3_spacewater_elec_demand[hour] - cooking_elec - non_heat_process_elec

        // High temp process: 25% elec, 75% gas in original model
        // Low temp process: 66% elec, 11% gas, 22% biomass CHP in original model
        
        // Here we implement a mixed fixed elec/gas heat supply and an extended DSR elec/gas supply
        // The DSR supply uses electricity when there is excess renewable supply available and gas 
        // originally produced from excess renewable supply when direct supply is not sufficient
                
        // industry heat demand
        high_temp_process = high_temp_process_profile[hour%24] * daily_high_temp_process
        low_temp_process = low_temp_process_profile[hour%24] * daily_low_temp_dry_sep
        
        heat_process_fixed_elec = (high_temp_process*high_temp_process_fixed_elec_prc) + (low_temp_process*low_temp_process_fixed_elec_prc)
        heat_process_fixed_gas = (high_temp_process*high_temp_process_fixed_gas_prc) + (low_temp_process*low_temp_process_fixed_gas_prc)
        heat_process_fixed_biomass = (high_temp_process*high_temp_process_fixed_biomass_prc) + (low_temp_process*low_temp_process_fixed_biomass_prc)
        heat_process_DSR = (high_temp_process*high_temp_process_DSR_prc) + (low_temp_process*low_temp_process_DSR_prc)
        
        // Industrial DSR
        heat_process_DSR_elec = heat_process_DSR                                    // 1. provide all heat demand with direct elec resistance heaters
        if (heat_process_DSR_elec>balance) heat_process_DSR_elec = balance          // 2. limited to available electricity balance
        if (heat_process_DSR_elec<0) heat_process_DSR_elec = 0                      // 3. -- should never happen --
        heat_process_DSR_gas = heat_process_DSR - heat_process_DSR_elec             // 4. if there is not enough elec to meet demand, use gas
        
        industrial_elec_demand = cooking_elec + non_heat_process_elec + heat_process_fixed_elec + heat_process_DSR_elec
        
        s1_industrial_elec_demand.push(industrial_elec_demand)
        total_industrial_elec_demand += industrial_elec_demand 
        data.industry_elec.push([time,industrial_elec_demand])
        
        // methane demand
        non_heat_process_biogas = not_heat_process_profile[hour%24] * daily_non_heat_process_biogas
        industrial_methane_demand = non_heat_process_biogas + heat_process_fixed_gas + heat_process_DSR_gas
        
        s1_methane_for_industry.push(industrial_methane_demand)
        total_industrial_methane_demand += industrial_methane_demand
        
        // Balance calculation for BEV storage stage
        s3_balance_before_BEV_storage.push(data.s1_total_variable_supply[hour][1] - data.s1_traditional_elec_demand[hour][1] - s3_spacewater_elec_demand[hour] - industrial_elec_demand)
        
        // Not heat biomass demand
        non_heat_process_biomass = not_heat_process_profile[hour%24] * daily_non_heat_process_biomass
        
        total_industrial_biomass_demand += non_heat_process_biomass
        total_industrial_biomass_demand += heat_process_fixed_biomass
        
        total_biomass_used += non_heat_process_biomass
        total_biomass_used += heat_process_fixed_biomass
    }
    
    // -------------------------------------------------------------------------------------
    // Elec transport
    // -------------------------------------------------------------------------------------
    s4_BEV_Store_SOC = []
    s4_balance_before_elec_store = []
    for (var hour = 0; hour < hours; hour++)
    {
        var time = datastarttime + (hour * 3600 * 1000);
        balance = s3_balance_before_BEV_storage[hour]
        
        // ---------------------------------------------
        // +- 12 h average of balance before BEV Storage
        var sum = 0; var n = 0;
        for (var i=-24; i<24; i++) {
            var index = hour + i
            if (index>=hours) index-=hours
            if (index<0) index += hours
            sum += s3_balance_before_BEV_storage[index]
            n++;
        }
        average_12h_balance_before_BEV_storage = sum / n;
        deviation_from_mean_BEV = balance - average_12h_balance_before_BEV_storage   
        // ---------------------------------------------
        
        // Electric trains
        elec_trains_demand = elec_trains_use_profile[hour%24] * daily_elec_trains_demand
        total_elec_trains_demand += elec_trains_demand
        balance -= elec_trains_demand 
        
        // Standard EV charge
        EV_charge = BEV_charge_profile[hour%24] * daily_BEV_demand
        
        max_charge_rate = BEV_plugged_in_profile[hour%24] * electric_car_max_charge_rate
        
        // SMART CHARGE --------------------------------
        if (smart_charging_enabled && balance>EV_charge) {
            // EV_charge = balance // simple smart charge
            if (deviation_from_mean_BEV>0.0) {
                EV_charge = (electric_car_battery_capacity-BEV_Store_SOC)*deviation_from_mean_BEV/(electric_car_battery_capacity*0.5)
                if (EV_charge>balance) EV_charge = balance
            }
        }
        // Charging rate & quantity limits
        if (EV_charge>max_charge_rate) EV_charge = max_charge_rate
        if ((BEV_Store_SOC+EV_charge)>electric_car_battery_capacity) EV_charge = electric_car_battery_capacity - BEV_Store_SOC
        // Subtract EV charge from balance and add to SOC
        balance -= EV_charge
        BEV_Store_SOC += EV_charge
        total_EV_charge += EV_charge
        data.EV_charge.push([time,EV_charge])
        
        // EV DEMAND -----------------------------------
        EV_demand = BEV_use_profile[hour%24] * daily_BEV_demand
        BEV_Store_SOC -= EV_demand
        total_EV_demand += EV_demand
        
        // SMART DISCHARGE -----------------------------
        EV_smart_discharge = 0.0
        if (smart_charging_enabled && balance<0.0) {
            // EV_smart_discharge = -balance
            if (deviation_from_mean_BEV<0.0) {
                EV_smart_discharge = BEV_Store_SOC*-deviation_from_mean_BEV/(electric_car_battery_capacity*0.5)
                if (EV_smart_discharge>-balance) EV_smart_discharge = -balance
            }
        }

        // Discharge rate & quantity limits
        if (EV_smart_discharge>max_charge_rate) EV_smart_discharge = max_charge_rate
        if (EV_smart_discharge>BEV_Store_SOC) EV_smart_discharge = BEV_Store_SOC
        // Apply to SOC and balance
        BEV_Store_SOC -= EV_smart_discharge
        balance += EV_smart_discharge
        
        // Timeseries
        data.EV_smart_discharge.push([time,EV_smart_discharge])
        s4_BEV_Store_SOC.push(BEV_Store_SOC)
        data.BEV_Store_SOC.push([time,BEV_Store_SOC])
        data.EL_transport.push([time,elec_trains_demand + EV_charge])
        s4_balance_before_elec_store.push(balance)        
    }
    loading_prc(70,"model stage 4");
    
    // -------------------------------------------------------------------------------------
    // Elec Store
    // -------------------------------------------------------------------------------------
    s5_elecstore_SOC = []
    s5_hydrogen_SOC = []
    s5_methane_SOC = []
    s5_final_balance = []
    for (var hour = 0; hour < hours; hour++)
    {
        var time = datastarttime + (hour * 3600 * 1000);
        
        var balance = s4_balance_before_elec_store[hour]
        
        elec_store_charge = 0
        elec_store_discharge = 0
        
        // ---------------------------------------------------------------------------
        // 12 h average store implementation
        // ---------------------------------------------------------------------------
        // +- 12 h average of balance
        var sum = 0; var n = 0;
        for (var i=-12; i<12; i++) {
            var index = hour + i
            if (index>=hours) index-=hours
            if (index<0) index += hours
            sum += s4_balance_before_elec_store[index]
            n++;
        }
        average_12h_balance_before_elec_storage = sum / n;
        deviation_from_mean_elec = balance - average_12h_balance_before_elec_storage
        
        if (electricity_storage_enabled) {
            store_type = "average"
        
            if (store_type=="basic") {
                store_charge = 0
                store_discharge = 0
                if (balance>0) {
                    elec_store_charge = balance                                                                                                // Charge by extend of available oversupply
                    if (elec_store_charge>elec_store_charge_cap) elec_store_charge = elec_store_charge_cap                                     // Limit by max charge rate 
                    if (elec_store_charge>(elec_store_storage_cap-elecstore_SOC)) elec_store_charge = elec_store_storage_cap - elecstore_SOC   // Limit by available SOC
                    elecstore_SOC += elec_store_charge
                    balance -= elec_store_charge
                } else {
                    elec_store_discharge = -1*balance                                                                                          // Discharge by extent of unmet demand
                    if (elec_store_discharge>elec_store_charge_cap) elec_store_discharge = elec_store_charge_cap                               // Limit by max discharge rate
                    if (elec_store_discharge>elecstore_SOC) elec_store_discharge = elecstore_SOC                                               // Limit by available SOC
                    elecstore_SOC -= elec_store_discharge
                    balance += elec_store_discharge
                }
            }
            
            if (store_type=="average") {
                if (balance>=0.0) {
                    if (deviation_from_mean_elec>=0.0) {
                        // charge
                        elec_store_charge = (elec_store_storage_cap-elecstore_SOC)*deviation_from_mean_elec/(elec_store_storage_cap*0.5)
                        if (elec_store_charge>(elec_store_storage_cap - elecstore_SOC)) elec_store_charge = elec_store_storage_cap - elecstore_SOC   // Limit to available SOC
                        if (elec_store_charge>elec_store_charge_cap) elec_store_charge = elec_store_charge_cap                                       // Limit to charge capacity
                        if (elec_store_charge>balance) elec_store_charge = balance
                        balance -= elec_store_charge
                        elecstore_SOC += elec_store_charge
                    }
                } else {
                    if (deviation_from_mean_elec<0.0) {
                        // discharge
                        elec_store_discharge = elecstore_SOC*-deviation_from_mean_elec/(elec_store_storage_cap*0.5)
                        if (elec_store_discharge>elecstore_SOC) elec_store_discharge = elecstore_SOC                      // Limit to elecstore SOC
                        if (elec_store_discharge>elec_store_charge_cap) elec_store_discharge = elec_store_charge_cap      // Limit to discharge capacity
                        if (elec_store_discharge>-balance) elec_store_discharge = -balance
                        balance += elec_store_discharge
                        elecstore_SOC -= elec_store_discharge
                    }
                }
            }
        }
        if (elecstore_SOC<0) elecstore_SOC = 0                                                              // limits here can loose energy in the calc
        if (elecstore_SOC>elec_store_storage_cap) elecstore_SOC = elec_store_storage_cap                    // limits here can loose energy in the calc
        // ----------------------------------------------------------------------------
          
        s5_elecstore_SOC.push(elecstore_SOC)
        data.elecstore_SOC.push([time,elecstore_SOC])        
        data.elec_store_charge.push([time,elec_store_charge])
        data.elec_store_discharge.push([time,elec_store_discharge])
        
        if (balance>=0.0) {
            total_initial_elec_balance_positive += balance
            initial_elec_balance_positive++
        }

        // ----------------------------------------------------------------------------
        // Biogas
        // ----------------------------------------------------------------------------
        // The first stage here covers methane produced directly from biogas
        // A biogas methane content by volume of 60% is assumed
        // The remainder is CO2 which is used here as a feed for further methanation using hydrogen
        biogas_supply = hourly_biomass_for_biogas * anaerobic_digestion_efficiency                   // biogas supply from biomass input
        methane_from_biogas = biogas_supply                                                          // energy content of methane in biogas is same as biogas itself
        total_anaerobic_digestion_losses += hourly_biomass_for_biogas - biogas_supply                // biogas AD losses
        co2_from_biogas = co2_tons_per_gwh_methane * biogas_supply                                   // biogas co2 content in tons
                        
        // ----------------------------------------------------------------------------
        // Hydrogen
        // ----------------------------------------------------------------------------
        // 1. Electrolysis input
        electricity_for_electrolysis = 0
        if (balance>=0.0) {
            electricity_for_electrolysis = balance
            // Limit by hydrogen electrolysis capacity
            if (electricity_for_electrolysis>electrolysis_cap) electricity_for_electrolysis = electrolysis_cap
            // Limit by hydrogen store capacity
            if (electricity_for_electrolysis>((hydrogen_storage_cap-hydrogen_SOC)/electrolysis_eff)) electricity_for_electrolysis = (hydrogen_storage_cap-hydrogen_SOC)/electrolysis_eff
        }
        
        hydrogen_from_electrolysis = electricity_for_electrolysis * electrolysis_eff
        total_electrolysis_losses += electricity_for_electrolysis - hydrogen_from_electrolysis
        data.electricity_for_electrolysis.push([time,electricity_for_electrolysis])
        balance -= electricity_for_electrolysis
        
        hydrogen_balance = hydrogen_from_electrolysis
        total_hydrogen_produced += hydrogen_from_electrolysis
                
        // 2. Hydrogen vehicle demand
        hydrogen_for_hydrogen_vehicles = daily_transport_H2_demand / 24.0
        total_hydrogen_for_hydrogen_vehicles += hydrogen_for_hydrogen_vehicles
        hydrogen_balance -= hydrogen_for_hydrogen_vehicles
        
        // 3. Hydrogen to synthetic liquid fuels
        hourly_biomass_for_biofuel = 0.0
        hydrogen_to_synth_fuel = 0.0
        if ((hydrogen_SOC>hydrogen_storage_cap*minimum_hydrogen_store_level) && hydrogen_balance>0.0) {
            hydrogen_to_synth_fuel = hydrogen_balance
            if (hydrogen_to_synth_fuel>synth_fuel_capacity) hydrogen_to_synth_fuel = synth_fuel_capacity
            hourly_biomass_for_biofuel = (hydrogen_to_synth_fuel/FT_process_hydrogen_req)*FT_process_biomass_req
            hydrogen_balance -= hydrogen_to_synth_fuel
        }
        
        // 4. Hydrogen to Methanation
        co2_for_sabatier = co2_from_biogas
        hydrogen_for_sabatier = co2_for_sabatier * (8.064/44.009) * 39.4 * 0.001                     // 1000 tCO2, requires 7.2 GWh of H2 (HHV)
        
        available_hydrogen = hydrogen_SOC-(hydrogen_storage_cap*minimum_hydrogen_store_level)        // calculate available hydrogen
        if (hydrogen_for_sabatier>available_hydrogen) hydrogen_for_sabatier = available_hydrogen     // limit by available hydrogen
        if (hydrogen_for_sabatier>methanation_capacity) hydrogen_for_sabatier = methanation_capacity // limit by methanation capacity
        if (hydrogen_for_sabatier<0.0) hydrogen_for_sabatier = 0.0
        hydrogen_balance -= hydrogen_for_sabatier                                                    // subtract from hydrogen store
        // Methanation process itself
        methane_from_sabatier = hydrogen_for_sabatier * (889.0/1144.0)                               // 78% efficiency based on HHV kj/mol of CH4/4H2
        total_sabatier_losses += hydrogen_for_sabatier - methane_from_sabatier
        
        hydrogen_SOC += hydrogen_balance
        
        if (hydrogen_SOC<0.0) {
            unmet_hydrogen_demand += -1*hydrogen_SOC
            hydrogen_SOC = 0.0
        }

        total_hydrogen_demand += hydrogen_for_hydrogen_vehicles + hydrogen_to_synth_fuel + hydrogen_for_sabatier
             
        // ----------------------------------------------------------------------------
        // Integrated High-Temperature Electrolysis and Methanation (IHTEM)
        // Pilot projects include Helmeth ~76% efficiency and Store & Go ~59% efficiency
        // assumes integrated DAC of CO2
        // DAC relatively low energy requirement compared to electrolysis and heat recovery possible
        // ----------------------------------------------------------------------------        
        electricity_for_IHTEM = 0
        if (balance>=0.0) {
            electricity_for_IHTEM = balance
            if (electricity_for_IHTEM>IHTEM_cap) electricity_for_IHTEM = IHTEM_cap
        }
        
        methane_from_IHTEM = electricity_for_IHTEM * IHTEM_efficiency
        balance -= electricity_for_IHTEM
        
        total_IHTEM_losses += electricity_for_IHTEM - methane_from_IHTEM
        data.electricity_for_IHTEM.push([time,electricity_for_IHTEM])
        
        // ----------------------------------------------------------------------------
        // Dispatchable (backup power via CCGT gas turbines)
        // ---------------------------------------------------------------------------- 
        electricity_from_dispatchable = 0       
        if (balance<0.0) electricity_from_dispatchable = -balance
        // Limit by methane availability
        if (electricity_from_dispatchable>(methane_SOC*dispatchable_gen_eff)) electricity_from_dispatchable = methane_SOC*dispatchable_gen_eff
        // Limit by CCGT capacity
        if (electricity_from_dispatchable>dispatch_gen_cap) electricity_from_dispatchable = dispatch_gen_cap
        // Totals, losses and max capacity utilisation
        total_CCGT_losses += ((1.0/dispatchable_gen_eff)-1.0) * electricity_from_dispatchable
        total_electricity_from_dispatchable += electricity_from_dispatchable
        if (electricity_from_dispatchable>max_dispatchable_capacity) max_dispatchable_capacity = electricity_from_dispatchable
        data.electricity_from_dispatchable.push([time,electricity_from_dispatchable])
        
        // Final electricity balance
        balance += electricity_from_dispatchable
        s5_final_balance.push(balance)

        export_elec = 0.0
        unmet_elec = 0.0
        if (balance>=0.0) {
            export_elec = balance
            total_final_elec_balance_positive += export_elec
            final_elec_balance_positive++
        } else {
            unmet_elec = -balance
            total_final_elec_balance_negative += unmet_elec
            final_elec_balance_negative++
        }
        data.export_elec.push([time,export_elec])
        data.unmet_elec.push([time,unmet_elec])
        
        // ----------------------------------------------------------------------------
        // Methane
        // ---------------------------------------------------------------------------- 
        // Total methane production
        methane_production = methane_from_sabatier + methane_from_biogas + methane_from_IHTEM
        total_methane_made += methane_production
        methane_to_dispatchable = electricity_from_dispatchable / dispatchable_gen_eff

        methane_for_transport = daily_transport_CH4_demand / 24.0
        total_methane_for_transport += methane_for_transport
        // s1_methane_for_industry: calculated in stage 1
        // s1_methane_for_industryCHP
        methane_for_industryCHP = 0 // MFIX: add this in!!
        
        methane_demand = methane_to_dispatchable + s3_methane_for_spacewaterheat[hour] + s1_methane_for_industry[hour] + methane_for_industryCHP + methane_for_transport
        total_methane_demand += methane_demand
        
        methane_balance = methane_production - methane_demand
                
        methane_SOC += methane_balance
        if (methane_SOC>methane_store_capacity) {
            methane_store_vented += methane_SOC - methane_store_capacity
            methane_SOC = methane_store_capacity
        }

        s5_methane_SOC.push(methane_SOC)
        data.methane_SOC.push([time,methane_SOC])
        if ((methane_SOC/methane_store_capacity)<0.01) methane_store_empty_count ++
        if ((methane_SOC/methane_store_capacity)>0.99) methane_store_full_count ++
        
        // ------------------------------------------------------------------------------------
        // Synth fuel
        synth_fuel_produced = hydrogen_to_synth_fuel / FT_process_hydrogen_req
        total_synth_fuel_produced += synth_fuel_produced
        total_synth_fuel_biomass_used += hourly_biomass_for_biofuel
        
        synth_fuel_store_SOC += synth_fuel_produced
        
        total_FT_losses += (hydrogen_to_synth_fuel + hourly_biomass_for_biofuel) - synth_fuel_produced
        
        synth_fuel_demand = (daily_transport_liquid_demand + daily_industrial_biofuel) / 24.0
        total_industrial_liquid_demand += daily_industrial_biofuel / 24.0
        
        synth_fuel_store_SOC -= synth_fuel_demand

        if (synth_fuel_store_SOC<0.0) {
            unmet_synth_fuel_demand += -1*synth_fuel_store_SOC
            synth_fuel_store_SOC = 0.0
        }
        
        total_synth_fuel_demand += synth_fuel_demand

        data.synth_fuel_store_SOC.push([time,synth_fuel_store_SOC])        
        // ------------------------------------------------------------------------------------
        // Biomass
        total_biomass_used += biogas_supply / anaerobic_digestion_efficiency 
        total_biomass_used += hourly_biomass_for_biofuel
        
        // Hydrogen SOC data
        s5_hydrogen_SOC.push(hydrogen_SOC)
        data.hydrogen_SOC.push([time,hydrogen_SOC])
        if ((hydrogen_SOC/hydrogen_storage_cap)<0.01) hydrogen_store_empty_count ++
        if ((hydrogen_SOC/hydrogen_storage_cap)>0.99) hydrogen_store_full_count ++
    }
    loading_prc(80,"model stage 5");

    // -------------------------------------------------------------------------------
    
    total_unmet_demand = total_final_elec_balance_negative
    
    total_supply += total_ambient_heat_supply
    total_supply += total_solarthermal
    total_supply += total_geothermal_heat
    total_supply += total_biomass_used
    
    total_demand = 0
    total_demand += total_traditional_elec 
    total_demand += total_space_heat_demand
    total_demand += total_water_heat_demand
    total_demand += total_industrial_elec_demand
    total_demand += total_industrial_methane_demand
    total_demand += total_industrial_biomass_demand
    
    total_demand += total_EV_demand
    total_demand += total_elec_trains_demand
    total_demand += total_hydrogen_for_hydrogen_vehicles
    total_demand += total_methane_for_transport
    total_demand += total_synth_fuel_demand
    
    // -------------------------------------------------------------------------------------------------
    final_store_balance = 0
    
    heatstore_additions =  heatstore_SOC - heatstore_SOC_start
    console.log("heatstore_additions: "+heatstore_additions)
    final_store_balance += heatstore_additions

    BEV_store_additions =  BEV_Store_SOC - BEV_Store_SOC_start
    console.log("BEV_store_additions: "+BEV_store_additions)
    final_store_balance += BEV_store_additions

    elecstore_additions =  elecstore_SOC - heatstore_SOC_start
    console.log("elecstore_additions: "+elecstore_additions)
    final_store_balance += elecstore_additions
        
    hydrogen_store_additions = hydrogen_SOC - hydrogen_SOC_start
    console.log("hydrogen_store_additions: "+hydrogen_store_additions)
    final_store_balance += hydrogen_store_additions
    
    methane_store_additions = methane_SOC - methane_SOC_start
    console.log("methane_store_additions: "+methane_store_additions)
    final_store_balance += methane_store_additions

    synth_fuel_store_additions = synth_fuel_store_SOC - synth_fuel_store_SOC_start
    console.log("synth_fuel_store_additions: "+synth_fuel_store_additions)
    final_store_balance += synth_fuel_store_additions

    console.log("final_store_balance: "+final_store_balance)
    
    console.log("total_heat_spill: "+total_heat_spill);
        
    console.log("unmet_hydrogen_demand: "+unmet_hydrogen_demand)
    console.log("unmet_synth_fuel_demand: "+unmet_synth_fuel_demand)
    total_unmet_demand += unmet_hydrogen_demand + unmet_synth_fuel_demand
    
    total_spill = methane_store_vented + total_heat_spill
    
    // -------------------------------------------------------------------------------------------------
    total_exess = total_final_elec_balance_positive + final_store_balance; //total_supply - total_demand
    total_losses = total_grid_losses + total_electrolysis_losses + total_CCGT_losses + total_anaerobic_digestion_losses + total_sabatier_losses + total_FT_losses + total_spill + total_IHTEM_losses
    total_losses += total_biomass_for_spacewaterheat_loss
    total_losses += total_methane_for_spacewaterheat_loss
    
    unaccounted_balance = total_supply + total_unmet_demand - total_demand - total_losses - total_exess
    console.log("unaccounted_balance: "+unaccounted_balance.toFixed(6))
    // -------------------------------------------------------------------------------------------------
    
    console.log("max heat elec demand: "+max_heat_demand_elec);
    
    primary_energy_factor = total_supply / total_demand
    
    // -------------------------------------------------------------------------------
    
    total_initial_elec_balance_positive = total_initial_elec_balance_positive / 10000.0
    total_final_elec_balance_negative = total_final_elec_balance_negative / 10000.0
    total_final_elec_balance_positive = total_final_elec_balance_positive / 10000.0
    total_unmet_heat_demand = (total_unmet_heat_demand/ 10000.0).toFixed(3);
    total_synth_fuel_biomass_used = total_synth_fuel_biomass_used / 10000.0
    total_electricity_from_dispatchable /= 10000.0
    total_biomass_used /= 10000.0
    total_other_biomass_used = total_biomass_used - biomass_for_biogas - total_synth_fuel_biomass_used
    
    liquid_fuel_produced_prc_diff = 100 * (total_synth_fuel_produced - (transport_bioliquid_demand+industrial_biofuel)) / (transport_bioliquid_demand+industrial_biofuel)

    initial_elec_balance_positive_prc = 100*initial_elec_balance_positive / hours
    final_elec_balance_negative_prc = 100*final_elec_balance_negative / hours
    final_elec_balance_positive_prc = 100*final_elec_balance_positive / hours
    unmet_heat_demand_prc = 100*unmet_heat_demand_count / hours
    methane_store_empty_prc = 100*methane_store_empty_count / hours
    methane_store_full_prc = 100*methane_store_full_count / hours
    hydrogen_store_empty_prc = 100*hydrogen_store_empty_count / hours
    hydrogen_store_full_prc = 100*hydrogen_store_full_count / hours
    
    var out = "";
    var error = 0
    for (var hour = 0; hour < hours; hour++) {
        
        //var test = testlines[hour].split(",");
        //var heatstore_SOC = parseFloat(test[1]);
        //var BEV_Store_SOC = parseFloat(test[2]);
        //var hydrogen_SOC = parseFloat(test[4]);
        //var methane_SOC = parseFloat(test[5]);
        //var final_balance = parseFloat(test[6]);
        
        //error = Math.abs(final_balance-s5_final_balance[hour])
        
        //if (error>1) {
            //out += (hour+2)+"\t"+final_balance.toFixed(1)+"\t"+s5_final_balance[hour].toFixed(1)+"\t"+error+"\n";
        //}
        
        supply = data.s1_total_variable_supply[hour][1]
        demand = data.s1_traditional_elec_demand[hour][1] + data.spacewater_elec[hour][1] + data.industry_elec[hour][1] + data.EL_transport[hour][1] + data.electricity_for_electrolysis[hour][1] + data.elec_store_charge[hour][1] + data.electricity_for_IHTEM[hour][1]
        balance = (supply + data.unmet_elec[hour][1] + data.electricity_from_dispatchable[hour][1] + data.elec_store_discharge[hour][1]) + data.EV_smart_discharge[hour][1] - demand-data.export_elec[hour][1]
        error += Math.abs(balance)
    } 
    
    console.log("balance error: "+error.toFixed(12));

    // ----------------------------------------------------------------------------
    // Land area factors
    // ----------------------------------------------------------------------------
    uk_landarea = 242495000000                                     // m2
    landarea_per_household = uk_landarea/households_2030           // m2 x 26 million households is 24 Mha

    // Biogas
    biomass_landarea_factor = ((0.1/365)/0.024) / 0.51
    landarea_for_biogas = biomass_for_biogas * biomass_landarea_factor
    prc_landarea_for_biogas = 100 * landarea_for_biogas / 24.2495
    
    // Synth fuel
    biomass_landarea_factor = ((0.1/365)/0.024) / 0.975
    landarea_for_synth_fuel = total_synth_fuel_biomass_used * biomass_landarea_factor
    prc_landarea_for_synth_fuel = 100 * landarea_for_synth_fuel / 24.2495
    
    // Other
    biomass_landarea_factor = ((0.1/365)/0.024) / 0.975
    landarea_for_other_biomass = total_other_biomass_used * biomass_landarea_factor
    prc_landarea_for_other_biomass = 100 * landarea_for_other_biomass / 24.2495
    
    landarea_for_biomass = landarea_for_biogas + landarea_for_synth_fuel + landarea_for_other_biomass    
    prc_landarea_for_biomass = 100 * landarea_for_biomass / 24.2495
    
    // prc_landarea_for_FT = 100 * landarea_for_FT / landarea_per_household


    // prc_landarea_for_sabatier = 100 * landarea_for_sabatier / landarea_per_household

    // ----------------------------------------------------------------------------
    // Scaled up to village, town, country scale
    // ----------------------------------------------------------------------------
    scaled_onshorewind_capacity = 1000000 * onshore_wind_capacity * number_of_households / households_2030
    scaled_offshorewind_capacity = 1000000 * offshore_wind_capacity * number_of_households / households_2030
    scaled_solarpv_capacity = 1000000 * solarpv_capacity * number_of_households / households_2030
    scaled_hydro_capacity = 1000000 * hydro_capacity * number_of_households / households_2030
    scaled_tidal_capacity = 1000000 * tidal_capacity * number_of_households / households_2030
    scaled_wave_capacity = 1000000 * wave_capacity * number_of_households / households_2030
    scaled_nuclear_capacity = 1000000 * nuclear_capacity * number_of_households / households_2030   
    scaled_CCGT_capacity = 1000000 * dispatch_gen_cap * number_of_households / households_2030
    
    scaled_electrolysis_capacity = 1000000 * electrolysis_cap * number_of_households / households_2030
    scaled_hydrogen_storage_cap = 1000000 * hydrogen_storage_cap * number_of_households / households_2030
    scaled_methanation_capacity = 1000000 * methanation_capacity * number_of_households / households_2030
    scaled_IHTEM_cap = 1000000 * IHTEM_cap * number_of_households / households_2030
    scaled_methane_store_capacity = 1000000 * methane_store_capacity * number_of_households / households_2030
    scaled_synth_fuel_capacity = 1000000 * synth_fuel_capacity * number_of_households / households_2030
    scaled_elec_store_storage_cap = 1000000 * elec_store_storage_cap * number_of_households / households_2030
    
    scaled_electric_car_battery_capacity = 1000000 * electric_car_battery_capacity * number_of_households / households_2030
    scaled_landarea_for_biomass = 1000000 * 10000 * landarea_for_biomass * number_of_households / households_2030
    
    // ----------------------------------------------------------------------------
        
    $(".modeloutput").each(function(){
        var type = $(this).attr("type");
        var key = $(this).attr("key");
        var dp = $(this).attr("dp");
        var scale = $(this).attr("scale");
        var units = $(this).attr("units");
        
        if (type==undefined) {
            if (scale==undefined) scale = 1;
            if (units==undefined) units = ""; else units = " "+units;
        } else if(type=="10y") {
            if (unitsmode=="kwhd") {
                scale = 1.0 / 3650
                units = " kWh/d"
                dp = 1
            } else if (unitsmode=="kwhy") {
                scale = 1.0 / 10
                units = " kWh/y"
                dp = 0
            } else if (unitsmode=="GW") {
                scale = (1.0 / 10)*0.001
                units = " TWh"
                dp = 0
            }
        } else if(type=="1y") {
            if (unitsmode=="kwhd") {
                scale = 1.0 / 365
                units = " kWh/d"
                dp = 1
            } else if (unitsmode=="kwhy") {
                scale = 1.0
                units = " kWh/y"
                dp = 0
            }
        } else if(type=="1d") {
            if (unitsmode=="kwhd") {
                scale = 1.0
                units = " kWh/d"
                dp = 2
            } else if (unitsmode=="kwhy") {
                scale = 1.0 * 365
                units = " kWh/y"
                dp = 0
            }
        } else if(type=="auto") {
            var baseunit = $(this).attr("baseunit");
            
            if (baseunit=="kW") {
                scale = 1; units = " kW"; dp = 0;
                if (window[key]>=10000) {scale=0.001; units=" MW"; dp=0;}
                if (window[key]>=10000000) {scale=0.000001; units=" GW"; dp=0;}
            }
            
            if (baseunit=="kWh") {
                scale = 1; units = " kWh"; dp = 0;
                if (window[key]>=10000) {scale=0.001; units=" MWh"; dp=0;}
                if (window[key]>=10000000) {scale=0.000001; units=" GWh"; dp=0;}
                if (window[key]>=10000000000) {scale=0.000000001; units=" TWh"; dp=0;}
            }

            if (baseunit=="m2") {
                scale = 1; units = " m2"; dp = 0;
                if (window[key]>=10000*10) {scale=0.0001; units=" ha"; dp=0;}
                if (window[key]>=10000*10*1000) {scale=0.0001*0.001; units=" kha"; dp=0;}
                if (window[key]>=10000*10*1000*1000) {scale=0.0001*0.001*0.001; units=" Mha"; dp=0;}
            } 
        } else if(type=="%") {
            scale = 100.0
            units = "%"
            dp = 0
        } 
        
        $(this).html("<span>"+(1*window[key]*scale).toFixed(dp)+"</span><span style='font-size:90%'>"+units+"</span>");
    });

    // Energy stacks visualisation definition
    var scl = 1.0/10000.0;
    var units = "TWh/yr";
    
    if (units_mode=="kwhdperperson") {
        units = "kWh/d.p"
        // GWh converted to kWh x 1000 x 1000, per day divide by 365 & 10 years
        scl = (1000.0*1000.0) / (10*365.0*population_2030)
    }
    
    if (units_mode=="kwhdperhousehold") {
        units = "kWh/d.h"
        // GWh converted to kWh x 1000 x 1000, per day divide by 365 & 10 years
        scl = (1000.0*1000.0) / (10*365.0*households_2030)
    }
    
    var stacks = [
      {"name":"Supply","height":(total_supply+total_unmet_demand)*scl,"saving":0,
        "stack":[
          {"kwhd":total_supply*scl,"name":"Supply","color":1},
          {"kwhd":total_unmet_demand*scl,"name":"Unmet","color":3}
        ]
      },
      {"name":"Supply","height":(total_supply+total_unmet_demand)*scl,"saving":0,
        "stack":[
          {"kwhd":total_offshore_wind_supply*scl,"name":"Offshore Wind","color":1},
          {"kwhd":total_onshore_wind_supply*scl,"name":"Onshore Wind","color":1},
          {"kwhd":total_solar_supply*scl,"name":"Solar PV","color":1},
          {"kwhd":total_solarthermal*scl,"name":"Solar Thermal","color":1},
          {"kwhd":total_wave_supply*scl,"name":"Wave","color":1},
          {"kwhd":total_tidal_supply*scl,"name":"Tidal","color":1},
          {"kwhd":total_hydro_supply*scl,"name":"Hydro","color":1},
          {"kwhd":total_geothermal_elec*scl,"name":"Geo Thermal Elec","color":1},
          {"kwhd":total_geothermal_heat*scl,"name":"Geo Thermal Heat","color":1},
          {"kwhd":total_nuclear_supply*scl,"name":"Nuclear","color":1},
          {"kwhd":10000*total_biomass_used*scl,"name":"Biomass","color":1},
          {"kwhd":total_ambient_heat_supply*scl,"name":"Ambient","color":1},
          {"kwhd":total_unmet_demand*scl,"name":"Unmet","color":3}
        ]
      },
      
      {"name":"Demand","height":(total_demand+total_losses+total_exess)*scl,"saving":0,
        "stack":[
          {"kwhd":total_demand*scl,"name":"Demand","color":0},
          {"kwhd":total_losses*scl,"name":"Losses","color":2},
          {"kwhd":total_exess*scl,"name":"Exess","color":3}
        ]
      },

      {"name":"Demand","height":(total_demand+total_losses)*scl,"saving":0,
        "stack":[
          {"kwhd":total_traditional_elec*scl,"name":"Trad Elec","color":0},
          {"kwhd":total_space_heat_demand*scl,"name":"Space Heat","color":0},
          {"kwhd":total_water_heat_demand*scl,"name":"Water Heat","color":0},
          {"kwhd":(total_EV_demand+total_elec_trains_demand)*scl,"name":"Electric Transport","color":0},
          {"kwhd":total_hydrogen_for_hydrogen_vehicles*scl,"name":"Hydrogen Transport","color":0},
          {"kwhd":10000*transport_CH4_demand*scl,"name":"Methane Transport","color":0},
          {"kwhd":10000*transport_biofuels_demand*scl,"name":"Biofuel Transport","color":0},
          {"kwhd":10000*transport_kerosene_demand*scl,"name":"Aviation","color":0},
          // Industry
          {"kwhd":total_industrial_elec_demand*scl,"name":"Industry Electric","color":0},
          {"kwhd":total_industrial_methane_demand*scl,"name":"Industry Methane","color":0},
          {"kwhd":total_industrial_biomass_demand*scl,"name":"Industry Biomas","color":0},
          {"kwhd":10000*industrial_biofuel*scl,"name":"Industry Biofuel","color":0},/*
          {"kwhd":total_industry_solid/3650,"name":"Industry Biomass","color":0},
          // Backup, liquid and gas processes*/
          {"kwhd":total_grid_losses*scl,"name":"Grid losses","color":2},
          {"kwhd":total_electrolysis_losses*scl,"name":"H2 losses","color":2},
          {"kwhd":total_CCGT_losses*scl,"name":"CCGT losses","color":2},
          {"kwhd":total_FT_losses*scl,"name":"FT losses","color":2},
          {"kwhd":(total_sabatier_losses+total_IHTEM_losses)*scl,"name":"Sabatier losses","color":2},
          {"kwhd":total_anaerobic_digestion_losses*scl,"name":"AD losses","color":2},
          {"kwhd":(total_biomass_for_spacewaterheat_loss+total_methane_for_spacewaterheat_loss)*scl,"name":"Boiler loss","color":2},
          {"kwhd":total_spill*scl,"name":"Total spill","color":2},

          /*
          {"kwhd":total_direct_gas_losses/3650,"name":"Direct gas loss","color":2},
          {"kwhd":total_direct_liquid_losses/3650,"name":"Direct liquid loss","color":2},

          {"kwhd":total_liion_losses/3650,"name":"Liion losses","color":2},
          {"kwhd":total_losses*scl,"name":"Losses","color":2},*/
          {"kwhd":total_exess*scl,"name":"Exess","color":3}
        ]
      }
    ];
    draw_stacks(stacks,"stacks",1000,600,units)   
}
// ---------------------------------------------------------------------------    
	
function fullzcb3_view(start,end,interval)
{
    var dataout = data_view(start,end,interval);
    if (view_mode=="")
    {
        $.plot("#placeholder", [

            // {label: "Heatstore", data:dataout.heatstore, color:"#cc3311"},

            {stack:true, label: "Traditional", data:dataout.s1_traditional_elec_demand, color:"#0044aa"},
            {stack:true, label: "Industry & Cooking", data:dataout.industry_elec, color:"#1960d5"},
            {stack:true, label: "Electric Heat", data:dataout.spacewater_elec, color:"#cc6622"},
            {stack:true, label: "Electric Transport", data:dataout.EL_transport, color:"#aac15b"},
            {stack:true, label: "Elec Store Charge", data:dataout.elec_store_charge, color:"#006a80"},
            {stack:true, label: "Electrolysis", data:dataout.electricity_for_electrolysis, color:"#00aacc"},
            {stack:true, label: "IHTEM", data:dataout.electricity_for_IHTEM, color:"#00bbdd"},
            {stack:true, label: "Exess", data:dataout.export_elec, color:"#33ccff", lines: {lineWidth:0, fill: 0.4 }},            
            {stack:false, label: "Supply", data:dataout.s1_total_variable_supply, color:"#000000", lines: {lineWidth:0.2, fill: false }}

            ], {
                canvas: true,
                series: {lines: {lineWidth:0, fill: 1.0 } },
                xaxis:{mode:"time", min:start, max:end, minTickSize: [1, "hour"]},
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
    if (view_mode=="stores")
    {
        $.plot("#placeholder", [
                {stack:true, label: "Battery Store", data:dataout.elecstore_SOC, yaxis:3, color:"#1960d5", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "Heat Store", data:dataout.heatstore_SOC, yaxis:3, color:"#cc3311", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "BEV Store", data:dataout.BEV_Store_SOC, yaxis:3, color:"#aac15b", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "Hydrogen Store", data:dataout.hydrogen_SOC, yaxis:3, color:"#97b5e7", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "Synth Fuel Store", data:dataout.synth_fuel_store_SOC, yaxis:3, color:"#cb9950", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "Methane Store", data:dataout.methane_SOC, yaxis:3, color:"#ccaa00", lines: {lineWidth:0, fill: 0.8 }}
            ], {
                xaxis:{mode:"time", min:start, max:end, minTickSize: [1, "hour"]},
                yaxes: [{},{min: 0},{}],
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
    if (view_mode=="backup")
    {
        $.plot("#placeholder", [
                {stack:true, label: "CCGT output", data:dataout.electricity_from_dispatchable, yaxis:1, color:"#ccaa00", lines: {lineWidth:0, fill: 1.0 }},
                {stack:true, label: "Elec Store discharge", data:dataout.elec_store_discharge, yaxis:1, color:"#1960d5", lines: {lineWidth:0, fill: 1.0 }},
                {stack:true, label: "EV Smart discharge", data:dataout.EV_smart_discharge, yaxis:1, color:"#aac15b", lines: {lineWidth:0, fill: 1.0 }},
                {stack:false, label: "Heat Store", data:dataout.heatstore_SOC, yaxis:2, color:"#cc3311", lines: {lineWidth:1, fill: false }},
                {stack:false, label: "Battery Store", data:dataout.elecstore_SOC, yaxis:2, color:"#1960d5", lines: {lineWidth:1, fill: false }},
                {stack:false, label: "BEV Store", data:dataout.BEV_Store_SOC, yaxis:2, color:"#aac15b", lines: {lineWidth:1, fill: false }},       
            ], {
                xaxis:{mode:"time", min:start, max:end, minTickSize: [1, "hour"]},
                yaxes: [{},{min: 0},{}],
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
    if (view_mode=="heat")
    {
        $.plot("#placeholder", [
                {stack:true, label: "Direct heat", data:dataout.spacewater_heat, color:"#cc6622", lines: {lineWidth:0, fill: 1.0 }},
                {stack:true, label: "Heatstore discharge", data:dataout.heatstore_discharge_GWth, color:"#a3511b", lines: {lineWidth:0, fill: 1.0 }} ,
                {stack:false, label: "Heatstore SOC", data:dataout.heatstore_SOC, yaxis:2, color:"#cc3311", lines: {lineWidth:1, fill: false }},
                {stack:false, label: "Electric for heat", data:dataout.spacewater_elec, color:"#97b5e7", lines: {lineWidth:0, fill: 0.8 }},
                {stack:false, label: "Heat Demand", data:dataout.spacewater_balance, yaxis:1, color:"#000", lines: {lineWidth:1, fill: false }}
            ], {
                xaxis:{mode:"time", min:start, max:end, minTickSize: [1, "hour"]},
                yaxes: [{},{min: 0},{}],
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
}
