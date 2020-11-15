var scenarios = {
  main: {
    // ---------------------------------------------------------------------------
    // dataset index:
    // 0:onshore wind, 1:offshore wind, 2:wave, 3:tidal, 4:solar, 5:traditional electricity
    offshore_wind_capacity: 134.0,
    onshore_wind_capacity: 30.0,
    wave_capacity: 10.0,
    tidal_capacity: 20.0,
    hydro_capacity: 3.0,
    solarpv_capacity: 90.0,
    solarthermal_capacity: 30.0,
    geothermal_elec_capacity: 3.0,
    geothermal_heat_capacity: 2.0,
    nuclear_capacity: 0.0,
    grid_loss_prc: 0.07,

    // Availability factors,
    offshore_wind_availability: 0.9,
    onshore_wind_availability: 0.9,
    nuclear_availability: 0.9,

    // Capacity factors
    // All other technologies based on hourly datasets
    hydro_cf: 0.3,
    geothermal_elec_cf: 0.9,
    geothermal_heat_cf: 0.9,
    // ---------------------------------------------
    // Traditional electricity demand
    // column 5 trad elec demand: 331.033 TWh/yr, normalised and scaled to:

    // Lights, Appliances and Cooking
    LAC_number_of_lights: 10.0,
    LAC_lights_power: 11.0,
    lighting_hours: 10.0,

    LAC_alwayson: 10.0,
    LAC_fridgefreezer: 262.0,
    LAC_washingmachine: 136.0,
    LAC_cooking: 350.0,
    LAC_computing: 212.0,
    LAC_other: 200.0,

    annual_cooking_elec_services: 16.85,

    // trad_elec_domestic_appliances: 38.59 // TWh/yr (45% of 2007 figure, does not include cooking)
    trad_elec_services_appliances: 41.41, // TWh/yr
    trad_elec_services_cooling: 4.55,     // TWh/yr

    use_flat_profiles: false,

    // ---------------------------------------------
    // Space & water heating demand
    // ---------------------------------------------
    // domestic simple house model
    total_floor_area: 85, // m2
    storey_height: 2.2,
    wall_ins_thickness: 0.1,
    floor_ins_thickness: 0.1,
    loft_ins_thickness: 0.3,
    window_type: 2,
    glazing_extent: 0.2,
    air_change_per_hour: 0.54, // non pressurised air change rate

    // domestic_space_heat_demand_WK: 114.6, // W/K (DECC 2050 Pathway level 4) x number of households 2030: 3.548 GW/K
    services_space_heat_demand_GWK: 1.486, // GW/K,
    industry_space_heat_demand_GWK: 0.502, // GW/K,
    space_heat_base_temperature: 13.07,               // Uses 16.7°C as average internal temp. and gains & losses from DECC 2050

    // Simple Domestic Hot Water Demand calculator
    number_showers_per_day: 1.5,
    number_baths_per_day: 0.8,
    number_kitchen_sink: 2.2,
    number_bathroom_sink: 1.0,
    shower_kwh: 1.125, // 7.5 mins at 9kW,
    bath_kwh: 1.35,   // uses 20% more water than shower at same temperature
    sink_kwh: 0.3,   // 6.3L × 40K × 4200 (assuming 50C water, 70% of typical bowl)

    // domestic_water_heating: 40.80, // TWh
    services_water_heating: 15.99, // TWh

    // Heating system efficiencies
    heatpump_COP: 3.0,
    elres_efficiency: 1.0,
    biomass_efficiency: 0.9,
    methane_boiler_efficiency: 0.95,
    hydrogen_boiler_efficiency: 0.95,

    // Heating system share of demand
    spacewater_share_heatpumps: 0.9,
    spacewater_share_elres: 0.05,
    spacewater_share_biomass: 0.05,
    spacewater_share_methane: 0.00,
    spacewater_share_hydrogen: 0.00,

    // Heatstore
    heatstore_enabled: 1,
    heatstore_storage_cap: 100.0,
    heatstore_charge_cap: 50.0,
    // ---------------------------------------------
    // Industrial
    // ---------------------------------------------
    annual_high_temp_process: 49.01,
    annual_low_temp_dry_sep: 117.78,

    high_temp_process_fixed_elec_prc: 0.125,
    high_temp_process_fixed_gas_prc: 0.375,
    high_temp_process_fixed_biomass_prc: 0.0,
    high_temp_process_DSR_prc: 0.5,

    low_temp_process_fixed_elec_prc: 0.3,
    low_temp_process_fixed_gas_prc: 0.1,
    low_temp_process_fixed_biomass_prc: 0.2,
    low_temp_process_DSR_prc: 0.4,

    annual_non_heat_process_elec: 88.00,
    annual_non_heat_process_biogas: 13.44,
    annual_non_heat_process_biomass: 5.58,

    industrial_biofuel: 13.44,
    
    // ---------------------------------------------
    // Transport
    // ---------------------------------------------
    // electrains_demand: 12.22, // and ships?

    // Electric cars
    // BEV_demand: 49.53,
    electric_car_battery_capacity: 513.0,    // GWh
    electric_car_max_charge_rate: 73.3,      // GW
    smart_charging_enabled: 1,

    // H2 and synthetic fuels
    // transport_H2_demand: 9.61,
    transport_CH4_demand: 0.0,
    // transport_biofuels_demand: 33.45,
    // transport_kerosene_demand: 40.32,

    // ---------------------------------------------
    // Storage
    // ---------------------------------------------
    // Synth fuel production
    synth_fuel_capacity: 9.4,           // GW
    synth_fuel_store_SOC_start: 5000.0, // GWh
    FT_process_biomass_req: 1.3,        // GWh/GWh fuel
    FT_process_hydrogen_req: 0.61,      // GWh/GWh fuel

    // Electricity Storage
    elec_store_type: "average",
    elec_store_storage_cap: 50.0,
    elec_store_charge_cap: 10.0,
    store_roundtrip_efficiency: 0.9,

    // Hydrogen
    electrolysis_cap: 25.0,
    electrolysis_eff: 0.8,
    hydrogen_storage_cap: 18000.0,
    minimum_hydrogen_store_level: 0.1,
    
    // biogas
    biomass_for_biogas: 74.0,
    anaerobic_digestion_efficiency: 0.6,                                     // HHV, originally 0.5747
    co2_tons_per_gwh_methane: (1000.0/15.4)*((0.40*44.009)/(0.60*16.0425)),  // 15.4 kWh/kg, MWh/ton HHV, proportion by molar mass

    // Methanation
    methanation_capacity: 5.0,
    methane_SOC_start: 10000.0,
    methane_store_capacity: 80000.0,

    // Power to Gas and Liquids including integrated DAC of CO2
    power_to_X_cap: 0.0,

    // store & go inc DAC,
    power_to_X_prc_gas: 0.44,
    power_to_X_gas_efficiency: 0.6,

    // Power to Liquids (e.g for aviation)
    // High temperature electrolysis & DAC
    // Efficiencies range from 45% to 46%
    // With CO2 from exhaust gas this can increase to 60% - 61%
    // https://www.umweltbundesamt.de/sites/default/files/medien/377/publikationen/161005_uba_hintergrund_ptl_barrierrefrei.pdf
    power_to_X_prc_liquid: 0.56,
    power_to_X_liquid_efficiency: 0.6,

    // Dispatchable
    dispatch_gen_cap: 45.0,
    dispatchable_gen_eff: 0.50,

    // -----------------------------------------------------------------------------
    // Transport model,
    // -----------------------------------------------------------------------------
    walking_miles_pp: 186,
    cycling_miles_pp: 168,
    ebikes_miles_pp: 155,
    rail_miles_pp: 808,
    bus_miles_pp: 1150,
    motorbike_miles_pp: 186,
    carsvans_miles_pp: 4350,
    aviation_miles_pp: 1118,
    
    // Mechanical assumed 80% of electric vehicle economy including charging losses, trains 90%
    ebikes_mechanical_kwhppkm_full: 0.0081,
    rail_mechanical_kwhppkm_full: 0.027,
    bus_mechanical_kwhppkm_full: 0.016,
    motorbike_mechanical_kwhppkm_full: 0.054,
    carsvans_mechanical_kwhppkm_full: 0.031,
    aviation_mechanical_kwhppkm_full: 0.070,

    // Load factors (zcb),
    rail_load_factor: 0.42,
    bus_load_factor: 0.42,
    motorbike_load_factor: 1.1,
    carsvans_load_factor: 0.4,
    aviation_load_factor: 0.85,

    rail_prc_EV: 0.9,
    rail_prc_H2: 0.04,
    rail_prc_ICE: 0.06,

    bus_prc_EV: 0.9,
    bus_prc_H2: 0.04,
    bus_prc_ICE: 0.06,
    
    motorbike_prc_EV: 0.9,
    motorbike_prc_H2: 0.0,
    motorbike_prc_ICE: 0.1,

    carsvans_prc_EV: 0.9,
    carsvans_prc_H2: 0.04,
    carsvans_prc_ICE: 0.06,

    aviation_prc_EV: 0.2,
    aviation_prc_H2: 0.0,
    aviation_prc_ICE: 0.8,

    rail_freight_elec_demand: 2.0,
    freight_BEV_demand: 10.5,
    freight_H2_demand: 4.06,
    freight_ICE_demand: 20.58,

    EE_onshorewind_GWh_per_GW: 1435.0,
    EE_offshorewind_GWh_per_GW: 2700.0,
    EE_solarpv_GWh_per_GW: 1680.0,

    EE_onshorewind_lifespan: 25.0,
    EE_offshorewind_lifespan: 25.0,
    EE_solarpv_lifespan: 30.0
  },
  
  more_ebike_less_car: {
    offshore_wind_capacity: 126.0,
    ebikes_miles_pp: 1155,
    carsvans_miles_pp: 3350,
  },
  
  RE_100_zero_biomass: {
    offshore_wind_capacity: 194,
    spacewater_share_heatpumps: 0.95,
    spacewater_share_biomass: 0,
    low_temp_process_fixed_biomass_prc: 0,
    low_temp_process_DSR_prc: 0.6,
    annual_non_heat_process_biogas: 19.02,
    annual_non_heat_process_biomass: 0,
    synth_fuel_capacity: 0,
    electrolysis_cap: 1.7,
    biomass_for_biogas: 0,
    methanation_capacity: 0,
    power_to_X_cap: 46.5,
    power_to_X_prc_gas: 0.435,
    power_to_X_prc_liquid: 0.565
  },
  
  RE_100_zero_biomass_2: {
    "offshore_wind_capacity": 184,
    "spacewater_share_heatpumps": 0.95,
    "spacewater_share_biomass": 0,
    "low_temp_process_fixed_biomass_prc": 0,
    "low_temp_process_DSR_prc": 0.6,
    "annual_non_heat_process_biogas": 19.02,
    "annual_non_heat_process_biomass": 0,
    "synth_fuel_capacity": 0,
    "electrolysis_cap": 1.73,
    "hydrogen_storage_cap": 5000,
    "biomass_for_biogas": 0,
    "methanation_capacity": 0,
    "methane_store_capacity": 50000,
    "power_to_X_cap": 50,
    "power_to_X_prc_gas": 0.442,
    "power_to_X_prc_liquid": 0.558
  }
}
