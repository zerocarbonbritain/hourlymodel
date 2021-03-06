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

    // Availability factors
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

    // Lights, Appliances and Cooking,
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

    // trad_elec_domestic_appliances: 38.59, // TWh/yr (45% of 2007 figure, does not include cooking)
    trad_elec_services_appliances: 41.41,    // TWh/yr
    trad_elec_services_cooling: 4.55,        // TWh/yr

    use_flat_profiles: 0,

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

    // domestic_space_heat_demand_WK: 114.6,  // W/K (DECC 2050 Pathway level 4) x number of households 2030: 3.548 GW/K
    services_space_heat_demand_GWK: 1.486, // GW/K
    industry_space_heat_demand_GWK: 0.502, // GW/K
    space_heat_base_temperature: 13.07,    // Uses 16.7°C as average internal temp. and gains & losses from DECC 2050

    // Simple Domestic Hot Water Demand calculator
    number_showers_per_day: 1.5,
    number_baths_per_day: 0.8,
    number_kitchen_sink: 2.2,
    number_bathroom_sink: 1.0,
    shower_kwh: 1.125, // 7.5 mins at 9kW
    bath_kwh: 1.35,   // uses 20% more water than shower at same temperature
    sink_kwh: 0.3,   // 6.3L × 40K × 4200 (assuming 50C water, 70% of typical bowl)

    // domestic_water_heating: 40.80, // TWh
    services_water_heating: 15.99, // TWh

    // Heating system efficiencies,
    heatpump_COP: 3.0,
    elres_efficiency: 1.0,
    biomass_efficiency: 0.9,
    methane_boiler_efficiency: 0.95,
    hydrogen_boiler_efficiency: 0.95,

    // Heating system share of demand,
    spacewater_share_heatpumps: 0.9,
    spacewater_share_elres: 0.05,
    spacewater_share_biomass: 0.05,
    spacewater_share_methane: 0.00,
    spacewater_share_hydrogen: 0.00,

    // Heatstore,
    heatstore_enabled: 1,
    heatstore_storage_cap: 100.0,
    heatstore_charge_cap: 50.0,
    // ---------------------------------------------
    // Industrial
    // ---------------------------------------------
    annual_high_temp_process: 49.01,     // 26.3% elec, 73.7% gas in original model
    annual_low_temp_dry_sep: 117.78,     // 66% elec, 11% gas, 22% biomass CHP in original model

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

    // Electric cars,
    // BEV_demand: 49.53,
    electric_car_battery_capacity: 513.0,    // GWh
    electric_car_max_charge_rate: 73.3,      // GW

    smart_charging_enabled: 1,
    smart_charge_type: "average",  // or flatout

    V2G_enabled: 1,
    V2G_discharge_type: "average", // or flatout

    // H2 and synthetic fuels,
    // transport_H2_demand: 9.61,
    transport_CH4_demand: 0.0,
    // transport_biofuels_demand: 33.45,
    // transport_kerosene_demand: 40.32,

    // ---------------------------------------------
    // Storage
    // ---------------------------------------------
    // Synth fuel production,
    synth_fuel_capacity: 9.4,      // GW
    synth_fuel_store_SOC_start: 5000.0, // GWh
    FT_process_biomass_req: 1.3,   // GWh/GWh fuel
    FT_process_hydrogen_req: 0.61, // GWh/GWh fuel

    // Electricity Storage,
    elec_store_type: "average",
    elec_store_storage_cap: 50.0,
    elec_store_charge_cap: 10.0,
    store_roundtrip_efficiency: 0.9,

    // Hydrogen,
    electrolysis_cap: 25.0,
    electrolysis_eff: 0.8,
    hydrogen_storage_cap: 15000.0,
    minimum_hydrogen_store_level: 0.1,

    // biogas,
    biomass_for_biogas: 74.0,
    anaerobic_digestion_efficiency: 0.6,                                     // HHV, originally 0.5747
    co2_tons_per_gwh_methane: (1000.0/15.4)*((0.40*44.009)/(0.60*16.0425)),  // 15.4 kWh/kg, MWh/ton HHV, proportion by molar mass
    
    // Methanation,
    methanation_capacity: 5.0,
    methane_SOC_start: 10000.0,
    methane_store_capacity: 52000.0,

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

    // Dispatchable,
    dispatch_gen_cap: 45.0,
    dispatchable_gen_eff: 0.50,

    // -----------------------------------------------------------------------------
    // Transport model
    // -----------------------------------------------------------------------------

    // zcb figures
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

    // Load factors (zcb)
    rail_load_factor: 0.42,
    bus_load_factor: 0.42,
    motorbike_load_factor: 1.1,
    carsvans_load_factor: 0.4,
    aviation_load_factor: 0.85,

    // PRC of different powertrains
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
  more_bus_less_car: {
    offshore_wind_capacity:130,
    bus_miles_pp:2150,
    carsvans_miles_pp:3350
  },
  tesla_model_3_car_fleet_efficiency: {
    offshore_wind_capacity:126,
    carsvans_mechanical_kwhppkm_full: 0.02477
  },
  passivhaus_15_kwh_m2: {
    offshore_wind_capacity: 116,
    wall_ins_thickness: 0.3,
    floor_ins_thickness: 0.3,
    window_type: 3,
    air_change_per_hour: 0.03,
    services_space_heat_demand_GWK: 0.38,
    industry_space_heat_demand_GWK: 0.125,
    electrolysis_cap: 23,
    hydrogen_storage_cap: 12000,
    biomass_for_biogas: 64.5,
    methane_store_capacity: 22000
  },
  electric_air_travel: {
    offshore_wind_capacity:128.4,
    synth_fuel_capacity:4.88,
    electrolysis_cap:20,
    biomass_for_biogas:83,
    aviation_prc_EV:1,
    aviation_prc_ICE:0
  },
  radical_power_down_and_efficiency: {
    offshore_wind_capacity: 63,
    onshore_wind_capacity: 20,
    wave_capacity: 5,
    tidal_capacity: 10,
    hydro_capacity: 2,
    solarpv_capacity: 62,
    solarthermal_capacity: 5,
    geothermal_elec_capacity: 2,
    geothermal_heat_capacity: 1,
    annual_cooking_elec_services: 15.5,
    trad_elec_services_appliances: 22.5,
    wall_ins_thickness: 0.3,
    floor_ins_thickness: 0.3,
    air_change_per_hour: 0.03,
    services_space_heat_demand_GWK: 0.6,
    industry_space_heat_demand_GWK: 0.2,
    services_water_heating: 9.1,
    spacewater_share_heatpumps: 0.95,
    spacewater_share_biomass: 0,
    heatstore_storage_cap: 200,
    heatstore_charge_cap: 100,
    annual_high_temp_process: 20.5,
    annual_low_temp_dry_sep: 41,
    annual_non_heat_process_elec: 48.5,
    annual_non_heat_process_biogas: 7.4,
    annual_non_heat_process_biomass: 3.1,
    industrial_biofuel: 7.4,
    electric_car_battery_capacity: 260,
    electric_car_max_charge_rate: 60,
    synth_fuel_capacity: 0.9,
    elec_store_storage_cap: 200,
    elec_store_charge_cap: 100,
    electrolysis_cap: 9,
    hydrogen_storage_cap: 12000,
    biomass_for_biogas: 52,
    methanation_capacity: 4,
    methane_store_capacity: 50000,
    dispatch_gen_cap: 32,
    ebikes_miles_pp: 2500,
    rail_miles_pp: 1400,
    carsvans_miles_pp: 2500,
    aviation_miles_pp: 200,
    rail_prc_EV: 1,
    rail_prc_H2: 0,
    rail_prc_ICE: 0,
    bus_prc_EV: 1,
    bus_prc_H2: 0,
    bus_prc_ICE: 0,
    motorbike_prc_EV: 1,
    motorbike_prc_ICE: 0,
    carsvans_prc_EV: 1,
    carsvans_prc_H2: 0,
    carsvans_prc_ICE: 0,
    aviation_prc_EV: 1,
    aviation_prc_ICE: 0,
    freight_BEV_demand: 9.86,
    freight_H2_demand: 0,
    freight_ICE_demand: 0
  },
  transport_2016: {
    offshore_wind_capacity: 150,
    synth_fuel_capacity: 10.1,
    electrolysis_cap: 28,
    biomass_for_biogas: 82,
    walking_miles_pp: 198,
    cycling_miles_pp: 48,
    rail_miles_pp: 754,
    bus_miles_pp: 325,
    motorbike_miles_pp: 46,
    carsvans_miles_pp: 6299,
    rail_load_factor: 0.324,
    bus_load_factor: 0.1432,
    motorbike_load_factor: 1.071,
    carsvans_load_factor: 0.3288
  },
  transport_2016_inc_aviation: {
    offshore_wind_capacity: 170,
    synth_fuel_capacity: 19.5,
    electrolysis_cap: 40,
    biomass_for_biogas: 76,
    walking_miles_pp: 198,
    cycling_miles_pp: 48,
    rail_miles_pp: 754,
    bus_miles_pp: 325,
    motorbike_miles_pp: 46,
    carsvans_miles_pp: 6299,
    aviation_miles_pp: 3438,
    rail_load_factor: 0.324,
    bus_load_factor: 0.1432,
    motorbike_load_factor: 1.071,
    carsvans_load_factor: 0.3288
  },
  no_reduction_space_heat: {
    offshore_wind_capacity: 160,
    wall_ins_thickness: 0,
    floor_ins_thickness: 0,
    loft_ins_thickness: 0.1,
    air_change_per_hour: 0.68,
    services_space_heat_demand_GWK: 2.474,
    industry_space_heat_demand_GWK: 0.834,
    electrolysis_cap: 31,
    biomass_for_biogas: 100,
    methanation_capacity: 6,
    methane_store_capacity: 120000,
    dispatch_gen_cap: 85
  },
  gas_boilers_with_enhanced_biogas: {
    "spacewater_share_heatpumps": 0,
    "spacewater_share_methane": 0.9,
    "synth_fuel_capacity": 8.4,
    "electrolysis_cap": 50,
    "biomass_for_biogas": 255,
    "methanation_capacity": 15,
    "methane_SOC_start": 30000,
    "methane_store_capacity": 200000,
    "dispatch_gen_cap": 23
  },
  hydrogen_boilers: {
    "offshore_wind_capacity": 175,
    "spacewater_share_heatpumps": 0,
    "spacewater_share_hydrogen": 0.9,
    "synth_fuel_capacity": 10.8,
    "electrolysis_cap": 70,
    "hydrogen_storage_cap": 200000,
    "biomass_for_biogas": 50,
    "methanation_capacity": 3
  },
  storage_200GW_flatout:
  {
    "synth_fuel_capacity": 9.8,
    "elec_store_type": "basic",
    "elec_store_storage_cap": 200,
    "elec_store_charge_cap": 100,
    "electrolysis_cap": 24,
    "biomass_for_biogas": 68.5
  },
  storage_200GW_peaker:
  {
    "synth_fuel_capacity": 9.42,
    "elec_store_storage_cap": 200,
    "elec_store_charge_cap": 100,
    "electrolysis_cap": 24,
    "biomass_for_biogas": 69.5
  },
  very_large_4300_GWh_battery: {
    "synth_fuel_capacity": 10.3,
    "elec_store_type": "basic",
    "elec_store_storage_cap": 4300,
    "elec_store_charge_cap": 500,
    "electrolysis_cap": 23,
    "hydrogen_storage_cap": 15000,
    "biomass_for_biogas": 50.5,
    "methanation_capacity": 3,
    "dispatch_gen_cap": 0.001
  },
  flat_demand_profile: {
    "use_flat_profiles": 1,
    "electrolysis_cap": 24.5,
    "biomass_for_biogas": 73.5,
    "dispatch_gen_cap": 39.5
  },
  offshore_wind_solarpv_1: {
    "offshore_wind_capacity": 160,
    "onshore_wind_capacity": 0,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "hydro_capacity": 0,
    "solarpv_capacity": 160,
    "solarthermal_capacity": 0,
    "geothermal_elec_capacity": 0,
    "geothermal_heat_capacity": 0,
    "synth_fuel_capacity": 10.5,
    "elec_store_type": "basic",
    "elec_store_storage_cap": 200,
    "elec_store_charge_cap": 100,
    "electrolysis_cap": 30,
    "biomass_for_biogas": 82
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
    offshore_wind_capacity: 184,
    spacewater_share_heatpumps: 0.95,
    spacewater_share_biomass: 0,
    low_temp_process_fixed_biomass_prc: 0,
    low_temp_process_DSR_prc: 0.6,
    annual_non_heat_process_biogas: 19.02,
    annual_non_heat_process_biomass: 0,
    synth_fuel_capacity: 0,
    electrolysis_cap: 1.73,
    hydrogen_storage_cap: 5000,
    biomass_for_biogas: 0,
    methanation_capacity: 0,
    methane_store_capacity: 50000,
    power_to_X_cap: 50,
    power_to_X_prc_gas: 0.442,
    power_to_X_prc_liquid: 0.558
  },
  nuclear_19GW: {
    "offshore_wind_capacity": 93.8,
    "nuclear_capacity": 19.25,
    "synth_fuel_capacity": 8.4,
    "electrolysis_cap": 19,
    "hydrogen_storage_cap": 10000,
    "biomass_for_biogas": 55.3,
    "methanation_capacity": 3.8,
    "methane_store_capacity": 40000,
    "dispatch_gen_cap": 33.8
  },
  nuclear_19GW_v2: {
    "offshore_wind_capacity": 73,
    "nuclear_capacity": 19.25,
    "synth_fuel_capacity": 9.7,
    "electrolysis_cap": 25,
    "hydrogen_storage_cap": 15000,
    "biomass_for_biogas": 64,
    "methanation_capacity": 3.8,
    "methane_store_capacity": 52000,
    "dispatch_gen_cap": 37
  },
  nuclear_48GW_50prc: {
    "offshore_wind_capacity": 61,
    "onshore_wind_capacity": 15,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "solarpv_capacity": 60,
    "solarthermal_capacity": 15,
    "nuclear_capacity": 48,
    "synth_fuel_capacity": 7.46,
    "electrolysis_cap": 16.3,
    "hydrogen_storage_cap": 10000,
    "biomass_for_biogas": 48,
    "methanation_capacity": 3.8,
    "methane_store_capacity": 40000,
    "dispatch_gen_cap": 33
  },
  nuclear_99GW_100prc_zero_biomass: {
    "offshore_wind_capacity": 0,
    "onshore_wind_capacity": 0,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "hydro_capacity": 0,
    "solarpv_capacity": 0,
    "solarthermal_capacity": 0,
    "geothermal_elec_capacity": 0,
    "geothermal_heat_capacity": 0,
    "nuclear_capacity": 99.6,
    "spacewater_share_heatpumps": 0.95,
    "spacewater_share_biomass": 0,
    "low_temp_process_fixed_biomass_prc": 0,
    "low_temp_process_DSR_prc": 0.6,
    "annual_non_heat_process_biogas": 19.02,
    "annual_non_heat_process_biomass": 0,
    "synth_fuel_capacity": 0,
    "electrolysis_cap": 1.41,
    "hydrogen_storage_cap": 2000,
    "biomass_for_biogas": 0,
    "methanation_capacity": 0,
    "methane_store_capacity": 20000,
    "power_to_X_cap": 38,
    "power_to_X_prc_gas": 0.365,
    "power_to_X_prc_liquid": 0.635,
    "dispatch_gen_cap": 0
  },
  space_heating_only: {
    "offshore_wind_capacity": 24.6,
    "onshore_wind_capacity": 0,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "hydro_capacity": 0,
    "solarpv_capacity": 0,
    "solarthermal_capacity": 0,
    "geothermal_elec_capacity": 0,
    "geothermal_heat_capacity": 0,
    "LAC_number_of_lights": 0,
    "LAC_lights_power": 0,
    "lighting_hours": 0,
    "LAC_alwayson": 0,
    "LAC_fridgefreezer": 0,
    "LAC_washingmachine": 0,
    "LAC_cooking": 0,
    "LAC_computing": 0,
    "LAC_other": 0,
    "annual_cooking_elec_services": 0,
    "trad_elec_services_appliances": 0,
    "trad_elec_services_cooling": 0,
    "number_showers_per_day": 0,
    "number_baths_per_day": 0,
    "number_kitchen_sink": 0,
    "number_bathroom_sink": 0,
    "services_water_heating": 0,
    "spacewater_share_heatpumps": 1,
    "spacewater_share_elres": 0,
    "spacewater_share_biomass": 0,
    "heatstore_storage_cap": 0,
    "heatstore_charge_cap": 0,
    "annual_high_temp_process": 0,
    "annual_low_temp_dry_sep": 0,
    "annual_non_heat_process_elec": 0,
    "annual_non_heat_process_biogas": 0,
    "annual_non_heat_process_biomass": 0,
    "industrial_biofuel": 0,
    "electric_car_battery_capacity": 0,
    "smart_charging_enabled": 0,
    "V2G_enabled": 0,
    "synth_fuel_capacity": 0,
    "synth_fuel_store_SOC_start": 0,
    "electrolysis_cap": 0,
    "hydrogen_storage_cap": 0,
    "biomass_for_biogas": 0,
    "methanation_capacity": 0,
    "methane_SOC_start": 40000,
    "methane_store_capacity": 200000,
    "power_to_X_cap": 100,
    "power_to_X_prc_gas": 1,
    "power_to_X_gas_efficiency": 0.8,
    "power_to_X_prc_liquid": 0,
    "dispatch_gen_cap": 100,
    "ebikes_miles_pp": 0,
    "rail_miles_pp": 0,
    "bus_miles_pp": 0,
    "motorbike_miles_pp": 0,
    "carsvans_miles_pp": 0,
    "aviation_miles_pp": 0,
    "rail_freight_elec_demand": 0,
    "freight_BEV_demand": 0,
    "freight_H2_demand": 0,
    "freight_ICE_demand": 0
  },
  space_heating_only2: {
    "offshore_wind_capacity": 21.3,
    "onshore_wind_capacity": 0,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "hydro_capacity": 0,
    "solarpv_capacity": 10,
    "solarthermal_capacity": 0,
    "geothermal_elec_capacity": 0,
    "geothermal_heat_capacity": 0,
    "LAC_number_of_lights": 0,
    "LAC_lights_power": 0,
    "lighting_hours": 0,
    "LAC_alwayson": 0,
    "LAC_fridgefreezer": 0,
    "LAC_washingmachine": 0,
    "LAC_cooking": 0,
    "LAC_computing": 0,
    "LAC_other": 0,
    "annual_cooking_elec_services": 0,
    "trad_elec_services_appliances": 0,
    "trad_elec_services_cooling": 0,
    "number_showers_per_day": 0,
    "number_baths_per_day": 0,
    "number_kitchen_sink": 0,
    "number_bathroom_sink": 0,
    "services_water_heating": 0,
    "spacewater_share_heatpumps": 1,
    "spacewater_share_elres": 0,
    "spacewater_share_biomass": 0,
    "heatstore_enabled": 0,
    "heatstore_storage_cap": 0,
    "heatstore_charge_cap": 0,
    "annual_high_temp_process": 0,
    "annual_low_temp_dry_sep": 0,
    "annual_non_heat_process_elec": 0,
    "annual_non_heat_process_biogas": 0,
    "annual_non_heat_process_biomass": 0,
    "industrial_biofuel": 0,
    "electric_car_battery_capacity": 0,
    "smart_charging_enabled": 0,
    "V2G_enabled": 0,
    "synth_fuel_capacity": 0,
    "synth_fuel_store_SOC_start": 0,
    "elec_store_type": "nostore",
    "elec_store_storage_cap": 0,
    "elec_store_charge_cap": 0,
    "electrolysis_cap": 0,
    "hydrogen_storage_cap": 0,
    "biomass_for_biogas": 0,
    "methanation_capacity": 0,
    "methane_SOC_start": 30000,
    "methane_store_capacity": 95000,
    "power_to_X_cap": 16,
    "power_to_X_prc_gas": 1,
    "power_to_X_gas_efficiency": 0.75,
    "power_to_X_prc_liquid": 0,
    "dispatch_gen_cap": 33,
    "dispatchable_gen_eff": 0.64,
    "ebikes_miles_pp": 0,
    "rail_miles_pp": 0,
    "bus_miles_pp": 0,
    "motorbike_miles_pp": 0,
    "carsvans_miles_pp": 0,
    "aviation_miles_pp": 0,
    "rail_freight_elec_demand": 0,
    "freight_BEV_demand": 0,
    "freight_H2_demand": 0,
    "freight_ICE_demand": 0
  },
  space_heating_only_nuclear: {
    "offshore_wind_capacity": 0,
    "onshore_wind_capacity": 0,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "hydro_capacity": 0,
    "solarpv_capacity": 0,
    "solarthermal_capacity": 0,
    "geothermal_elec_capacity": 0,
    "geothermal_heat_capacity": 0,
    "nuclear_capacity": 11,
    "LAC_number_of_lights": 0,
    "LAC_lights_power": 0,
    "lighting_hours": 0,
    "LAC_alwayson": 0,
    "LAC_fridgefreezer": 0,
    "LAC_washingmachine": 0,
    "LAC_cooking": 0,
    "LAC_computing": 0,
    "LAC_other": 0,
    "annual_cooking_elec_services": 0,
    "trad_elec_services_appliances": 0,
    "trad_elec_services_cooling": 0,
    "number_showers_per_day": 0,
    "number_baths_per_day": 0,
    "number_kitchen_sink": 0,
    "number_bathroom_sink": 0,
    "services_water_heating": 0,
    "spacewater_share_heatpumps": 1,
    "spacewater_share_elres": 0,
    "spacewater_share_biomass": 0,
    "heatstore_enabled": 0,
    "heatstore_storage_cap": 0,
    "heatstore_charge_cap": 0,
    "annual_high_temp_process": 0,
    "annual_low_temp_dry_sep": 0,
    "annual_non_heat_process_elec": 0,
    "annual_non_heat_process_biogas": 0,
    "annual_non_heat_process_biomass": 0,
    "industrial_biofuel": 0,
    "electric_car_battery_capacity": 0,
    "smart_charging_enabled": 0,
    "V2G_enabled": 0,
    "synth_fuel_capacity": 0,
    "synth_fuel_store_SOC_start": 0,
    "elec_store_type": "nostore",
    "elec_store_storage_cap": 0,
    "elec_store_charge_cap": 0,
    "electrolysis_cap": 0,
    "hydrogen_storage_cap": 0,
    "biomass_for_biogas": 0,
    "methanation_capacity": 0,
    "methane_SOC_start": 30000,
    "methane_store_capacity": 95000,
    "power_to_X_cap": 9.2,
    "power_to_X_prc_gas": 1,
    "power_to_X_gas_efficiency": 0.75,
    "power_to_X_prc_liquid": 0,
    "dispatch_gen_cap": 27,
    "dispatchable_gen_eff": 0.64,
    "ebikes_miles_pp": 0,
    "rail_miles_pp": 0,
    "bus_miles_pp": 0,
    "motorbike_miles_pp": 0,
    "carsvans_miles_pp": 0,
    "aviation_miles_pp": 0,
    "rail_freight_elec_demand": 0,
    "freight_BEV_demand": 0,
    "freight_H2_demand": 0,
    "freight_ICE_demand": 0
  },
  household_only: {
    "offshore_wind_capacity": 36,
    "onshore_wind_capacity": 0,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "hydro_capacity": 0,
    "solarpv_capacity": 36,
    "solarthermal_capacity": 0,
    "geothermal_elec_capacity": 0,
    "geothermal_heat_capacity": 0,
    "annual_cooking_elec_services": 0,
    "trad_elec_services_appliances": 0,
    "trad_elec_services_cooling": 0,
    "use_flat_profiles": 1,
    "services_space_heat_demand_GWK": 0,
    "industry_space_heat_demand_GWK": 0,
    "services_water_heating": 0,
    "spacewater_share_heatpumps": 1,
    "spacewater_share_elres": 0,
    "spacewater_share_biomass": 0,
    "annual_high_temp_process": 0,
    "annual_low_temp_dry_sep": 0,
    "annual_non_heat_process_elec": 0,
    "annual_non_heat_process_biogas": 0,
    "annual_non_heat_process_biomass": 0,
    "industrial_biofuel": 0,
    "electric_car_battery_capacity": 0.01,
    "electric_car_max_charge_rate": 0.01,
    "smart_charging_enabled": 0,
    "V2G_enabled": 0,
    "synth_fuel_capacity": 0,
    "synth_fuel_store_SOC_start": 0,
    "electrolysis_cap": 2,
    "hydrogen_storage_cap": 5000,
    "biomass_for_biogas": 17.5,
    "methanation_capacity": 2,
    "methane_SOC_start": 15000,
    "methane_store_capacity": 50000,
    "dispatch_gen_cap": 30,
    "walking_miles_pp": 0,
    "cycling_miles_pp": 0,
    "ebikes_miles_pp": 0,
    "rail_miles_pp": 0,
    "bus_miles_pp": 0,
    "motorbike_miles_pp": 0,
    "carsvans_miles_pp": 0,
    "aviation_miles_pp": 0,
    "motorbike_prc_EV": 1,
    "motorbike_prc_ICE": 0,
    "carsvans_prc_EV": 1,
    "carsvans_prc_H2": 0,
    "carsvans_prc_ICE": 0,
    "rail_freight_elec_demand": 0,
    "freight_BEV_demand": 0,
    "freight_H2_demand": 0,
    "freight_ICE_demand": 0
  },
  household_only2: {
    "offshore_wind_capacity": 26.6,
    "onshore_wind_capacity": 0,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "hydro_capacity": 0,
    "solarpv_capacity": 26.6,
    "solarthermal_capacity": 0,
    "geothermal_elec_capacity": 0,
    "geothermal_heat_capacity": 0,
    "annual_cooking_elec_services": 0,
    "trad_elec_services_appliances": 0,
    "trad_elec_services_cooling": 0,
    "use_flat_profiles": 1,
    "services_space_heat_demand_GWK": 0,
    "industry_space_heat_demand_GWK": 0,
    "services_water_heating": 0,
    "spacewater_share_heatpumps": 1,
    "spacewater_share_elres": 0,
    "spacewater_share_biomass": 0,
    "annual_high_temp_process": 0,
    "annual_low_temp_dry_sep": 0,
    "annual_non_heat_process_elec": 0,
    "annual_non_heat_process_biogas": 0,
    "annual_non_heat_process_biomass": 0,
    "industrial_biofuel": 0,
    "electric_car_battery_capacity": 0.01,
    "electric_car_max_charge_rate": 0.01,
    "smart_charging_enabled": 0,
    "V2G_enabled": 0,
    "synth_fuel_capacity": 0,
    "synth_fuel_store_SOC_start": 0,
    "elec_store_type": "basic",
    "elec_store_storage_cap": 60,
    "elec_store_charge_cap": 60,
    "electrolysis_cap": 0,
    "hydrogen_storage_cap": 0,
    "biomass_for_biogas": 0,
    "methanation_capacity": 0,
    "methane_SOC_start": 15000,
    "methane_store_capacity": 70000,
    "power_to_X_cap": 16,
    "power_to_X_prc_gas": 1,
    "power_to_X_gas_efficiency": 0.75,
    "power_to_X_prc_liquid": 0,
    "dispatch_gen_cap": 50,
    "dispatchable_gen_eff": 0.64,
    "walking_miles_pp": 0,
    "cycling_miles_pp": 0,
    "ebikes_miles_pp": 0,
    "rail_miles_pp": 0,
    "bus_miles_pp": 0,
    "motorbike_miles_pp": 0,
    "carsvans_miles_pp": 0,
    "aviation_miles_pp": 0,
    "motorbike_prc_EV": 1,
    "motorbike_prc_ICE": 0,
    "carsvans_prc_EV": 1,
    "carsvans_prc_H2": 0,
    "carsvans_prc_ICE": 0,
    "rail_freight_elec_demand": 0,
    "freight_BEV_demand": 0,
    "freight_H2_demand": 0,
    "freight_ICE_demand": 0
  }
}
