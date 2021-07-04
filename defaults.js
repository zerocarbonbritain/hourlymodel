var i = {
    hours: 87648,
    population_2030: 70499802,
    households_2030: 29941701,
    number_of_households: 29941701,
    
    supply: {
        offshore_wind_capacity: 134.0,
        offshore_wind_availability: 0.9,
        onshore_wind_capacity: 30.0,
        onshore_wind_availability: 0.9,
        wave_capacity: 10.0,
        tidal_capacity: 20.0,
        solarpv_capacity: 90.0,
        solarthermal_capacity: 30.0,
        hydro_capacity: 3.0,
        hydro_capacity_factor: 0.3,
        geothermal_elec_capacity: 3.0,
        geothermal_elec_capacity_factor: 0.9,
        geothermal_heat_capacity: 2.0,
        geothermal_heat_capacity_factor: 0.9,
        nuclear_capacity: 0.0,
        nuclear_capacity_factor: 0.9,
        grid_loss_prc: 0.07
    },
    
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

    trad_elec_services_appliances: 41.41,
    trad_elec_services_cooling: 4.55,

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

    //domestic_space_heat_demand_WK: 114.6 // W/K (DECC 2050 Pathway level 4) x number of households 2030: 3.548 GW/K,
    services_space_heat_demand_GWK: 1.486, // GW/K,
    industry_space_heat_demand_GWK: 0.502, // GW/K,
    space_heat_base_temperature: 13.07,               // Uses 16.7°C as average internal temp. and gains & losses from DECC 2050,

    // Simple Domestic Hot Water Demand calculator,
    number_showers_per_day: 1.5,
    number_baths_per_day: 0.8,
    number_kitchen_sink: 2.2,
    number_bathroom_sink: 1.0,
    shower_kwh: 1.125, // 7.5 mins at 9kW,
    bath_kwh: 1.35,   // uses 20% more water than shower at same temperature,
    sink_kwh: 0.3,   // 6.3L × 40K × 4200 (assuming 50C water, 70% of typical bowl),

    // domestic_water_heating: 40.80 // TWh,
    services_water_heating: 15.99, // TWh,

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
    ipr: 1.0, // industry prc reduction,

    high_temp_process_fixed_elec_prc: 0.125,
    high_temp_process_fixed_gas_prc: 0.375,
    high_temp_process_fixed_biomass_prc: 0.0,
    high_temp_process_DSR_prc: 0.5,

    low_temp_process_fixed_elec_prc: 0.3,
    low_temp_process_fixed_gas_prc: 0.1,
    low_temp_process_fixed_biomass_prc: 0.2,
    low_temp_process_DSR_prc: 0.4,

    // ---------------------------------------------
    // Transport,
    // ---------------------------------------------
    electrains_demand: 12.22, // and ships?

    // Electric cars,
    BEV_demand: 49.53,
    electric_car_battery_capacity: 513.0,    // GWh
    electric_car_max_charge_rate: 73.3,      // GW

    smart_charging_enabled: 1,
    smart_charge_type: "average",  // or flatout

    V2G_enabled: 1,
    V2G_discharge_type: "average", // or flatout

    // H2 and synthetic fuels,
    // transport_H2_demand: 9.61
    transport_CH4_demand: 0.0,
    // transport_biofuels_demand: 33.45
    // transport_kerosene_demand: 40.32

    // ---------------------------------------------
    // Storage,
    // ---------------------------------------------
    // Synth fuel production
    synth_fuel_capacity: 9.4,            // GW
    synth_fuel_store_SOC_start: 5000.0,  // GWh
    FT_process_biomass_req: 1.3,         // GWh/GWh fuel
    FT_process_hydrogen_req: 0.61,       // GWh/GWh fuel

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
    anaerobic_digestion_efficiency: 0.6,                                 // HHV, originally 0.5747,

    // Methanation
    methanation_capacity: 5.0,
    methane_SOC_start: 10000.0,
    methane_store_capacity: 52000.0,

    // Power to Gas and Liquids including integrated DAC of CO2
    power_to_X_cap: 0.0,

    // store & go inc DAC
    power_to_X_prc_gas: 0.44,
    power_to_X_gas_efficiency: 0.6,

    // Power to Liquids (e.g for aviation)
    // High temperature electrolysis & DAC
    // Efficiencies range from 45% to 46%
    // With CO2 from exhaust gas this can increase to 60% - 61%
    // https://www.umweltbundesamt.de/sites/default/files/medien/377/publikationen/161005_uba_hintergrund_ptl_barrierrefrepdf
    power_to_X_prc_liquid: 0.56,
    power_to_X_liquid_efficiency: 0.6,

    // Dispatchable
    dispatch_gen_cap: 45.0,
    dispatchable_gen_eff: 0.50,

    EE_onshorewind_GWh_per_GW: 1435.0,
    EE_offshorewind_GWh_per_GW: 2700.0,
    EE_solarpv_GWh_per_GW: 1680.0,

    EE_onshorewind_lifespan: 25.0,
    EE_offshorewind_lifespan: 25.0,
    EE_solarpv_lifespan: 30.0,
    
    transport: {
                
        km_per_mile: 1.609344,
        
        modes: {
            'Walking': {
                miles_pp: 186
            },
            'Cycling': {
                miles_pp: 168
            },
            'Ebikes': {
                miles_pp: 155,
                mechanical_kwhppkm_full: 0.0081,
                load_factor: 1.0,
                prc: {EV:1},
                efficiency: {EV: 0.8}
            },
            'Rail': {
                miles_pp: 808,
                mechanical_kwhppkm_full: 0.027,
                load_factor: 0.42,
                prc: {EV:0.9, H2:0.04, IC:0.06},
                efficiency: {EV: 0.9, H2: 0.3564, IC: 0.3}
            },
            'Bus': {
                miles_pp: 1150,
                mechanical_kwhppkm_full: 0.016,
                load_factor: 0.42,
                prc: {EV:0.9, H2:0.04, IC:0.06},
                efficiency: {EV: 0.8, H2: 0.3564, IC: 0.3}
            },
            'Motorbike': {
                miles_pp: 186,
                mechanical_kwhppkm_full: 0.054,
                load_factor: 1.1,
                prc: {EV:0.9, H2:0.0, IC:0.1},
                efficiency: {EV: 0.8, H2: 0.3564, IC: 0.3}
            },
            'Cars & Vans': {
                miles_pp: 4350,
                mechanical_kwhppkm_full: 0.031,
                load_factor: 0.4,
                prc: {EV:0.9, H2:0.04, IC:0.06},
                efficiency: {EV: 0.8, H2: 0.3564, IC: 0.3}
            },
            'Aviation': {
                miles_pp: 1118,
                mechanical_kwhppkm_full: 0.070,
                load_factor: 0.85,
                prc: {EV:0.2, H2:0.0, IC:0.8},
                efficiency: {EV: 0.8, H2: 0.2574, IC: 0.2}
            }
        },
        
        electric_car_battery_capacity: 513.0,    // GWh
        electric_car_max_charge_rate: 73.3,      // GW

        smart_charging_enabled: true,
        smart_charge_type: "average",  // or flatout
        
        V2G_enabled: true,
        V2G_discharge_type: "average", // or flatout

        rail_freight_elec_demand: 2.0,
        freight_BEV_demand: 10.5,
        freight_H2_demand: 4.06,
        freight_IC_demand: 20.58
    }
}
