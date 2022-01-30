var i = {
    hours: 87648,
    population_2030: 70499802,
    households_2030: 29941701,
    number_of_households: 29941701,
    use_flat_profiles: 0,
      
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
    
    LAC: {
        domestic: {
            lighting_and_appliances_TWhy: 32.92,
            cooking_TWhy: 10.48
        },
        services: {
            lighting_and_appliances_TWhy: 41.41,
            catering_TWhy: 16.85,
            cooling_TWhy: 4.55
        }   
    },

    space_heating: {
        domestic_demand_GWK: 3.435,      // GW/K  3.548
        services_demand_GWK: 1.486,      // GW/K
        industry_demand_GWK: 0.502,      // GW/K
        base_temperature: 13.07          // Uses 16.7°C as average internal temp. and gains & losses from DECC 2050
    },

    water_heating: {
        domestic_TWhy: 40.80,
        services_TWhy: 15.99
    },
    
    heatstore: {
        enabled: false,
        storage_capacity: 100.0,
        charge_capacity: 50.0,
    },
        
    heating_systems: {
        heatpump: {
            share: 90,
            efficiency:300
        },
        elres: {
            share: 5,
            efficiency: 100
        },
        methane: {
            share: 0,
            efficiency: 90
        },
        hydrogen: {
            share: 0,
            efficiency: 90
        },
        biomass: {
            share: 5,
            efficiency: 90
        }
    },

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

        smart_charging_enabled: 1,
        smart_charge_type: "average",  // or flatout
        
        V2G_enabled: 1,
        V2G_discharge_type: "average", // or flatout

        rail_freight_elec_demand: 2.0,
        freight_BEV_demand: 10.5,
        freight_H2_demand: 4.06,
        freight_IC_demand: 20.58
    },
    
    industry: {
        high_temp_process_TWhy: 49.01,                 // 26.3% elec, 73.7% gas in original model
        low_temp_dry_sep_TWhy: 117.78,                 // 66% elec, 11% gas, 22% biomass CHP in original model      
        non_heat_process_elec_TWhy: 88.00,
        non_heat_process_biogas_TWhy: 13.44,
        non_heat_process_biomass_TWhy: 5.58,
        biofuel_TWhy: 13.44,

        high_temp_process_fixed_elec_prc: 0.125,
        high_temp_process_fixed_gas_prc: 0.375,
        high_temp_process_fixed_biomass_prc: 0.0,
        high_temp_process_DSR_prc: 0.5,

        low_temp_process_fixed_elec_prc: 0.3,
        low_temp_process_fixed_gas_prc: 0.1,
        low_temp_process_fixed_biomass_prc: 0.2,
        low_temp_process_DSR_prc: 0.4
    },
        
    // Electricity Storage
    electric_storage: {
        type:"average",
        capacity_GWh: 50.0,
        charge_capacity_GW: 10.0,
        discharge_capacity_GW: 10.0,
        charge_efficiency: 0.95,
        discharge_efficiency: 0.95
    },
    
    // Hydrogen
    hydrogen: {
        electrolysis_capacity_GW: 25.0,
        electrolysis_efficiency: 0.8,
        storage_capacity_GWh: 15000.0,
        minimum_store_level: 0.1
    },
    
    // biogas
    biogas: {
        biomass_for_biogas: 70.0,
        anaerobic_digestion_efficiency: 0.6,                                     // HHV, originally 0.5747
        co2_tons_per_gwh_methane: (1000.0/15.4)*((0.40*44.009)/(0.60*16.0425))   // 15.4 kWh/kg, MWh/ton HHV, proportion by molar mass
    },
    
    // Methanation
    methane: {
        methanation_capacity: 5.15,
        SOC_start: 10000.0,
        storage_capacity_GWh: 52000.0
    },

    // Synth fuel production
    synth_fuel: {
        capacity_GW: 9.4,
        store_capacity_GWh: 50000,
        store_start_GWh: 5000.0,
        FT_process_biomass_req: 1.3,   // GWh/GWh fuel
        FT_process_hydrogen_req: 0.61  // GWh/GWh fuel
    },

    power_to_X: {
        // Power to Gas and Liquids including integrated DAC of CO2 
        capacity: 0.0,
        
        // store & go inc DAC
        prc_gas: 0.44,
        gas_efficiency: 0.6,

        // Power to Liquids (e.g for aviation)
        // High temperature electrolysis & DAC
        // Efficiencies range from 45% to 46%
        // With CO2 from exhaust gas this can increase to 60% - 61%
        // https://www.umweltbundesamt.de/sites/default/files/medien/377/publikationen/161005_uba_hintergrund_ptl_barrierrefrei.pdf    
        prc_liquid: 0.56,
        liquid_efficiency: 0.6
    },

    // Dispatchable
    electric_backup: {
        methane_turbine_capacity: 42.0,
        methane_turbine_efficiency: 0.6,
        hydrogen_turbine_capacity: 0.0,
        hydrogen_turbine_efficiency: 0.6
    },

    // Embodied Energy
    EE: {
        onshorewind_GWh_per_GW: 1435.0,
        offshorewind_GWh_per_GW: 2700.0,
        solarpv_GWh_per_GW: 1680.0,
        onshorewind_lifespan: 25.0,
        offshorewind_lifespan: 25.0,
        solarpv_lifespan: 30.0,
    }
}


units_mode = "TWhyr"
unitsmode = "GW"

// Profiles    
flat_profile = normalise_profile([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]);

// Variable profiles
default_cooking_profile = normalise_profile([0.1,0.1,0.1,0.1,0.14,0.25,0.45,0.55,0.58,0.56,0.52,0.50,0.48,0.48,0.50,0.56,0.64,0.68,0.64,0.55,0.45,0.33,0.25,0.15]);
default_hot_water_profile = normalise_profile([0.31,0.45,0.55,0.60,0.62,0.50,0.40,0.35,0.28,0.35,0.40,0.55,0.62,0.63,0.52,0.40,0.33,0.29,0.24,0.22,0.2,0.2,0.21,0.22]);
default_space_heat_profile = normalise_profile([0.3,0.32,0.35,0.42,0.5,0.55,0.58,0.58,0.56,0.52,0.51,0.50,0.50,0.51,0.55,0.58,0.62,0.65,0.64,0.60,0.55,0.50,0.4,0.33]);

elec_trains_use_profile = [0.004268293, 0.002439024, 0.001829268, 0.001219512, 0.003658536, 0.009756097, 0.025609755, 0.061585364, 0.054878047, 0.048780486, 0.058536584, 0.066463413, 0.07317073, 0.065853657, 0.07317073, 0.082317071, 0.077439022, 0.079268291, 0.067073169, 0.051219511, 0.038414633, 0.02804878, 0.015853658, 0.009146341];

BEV_use_profile = normalise_profile([0.05,0.04,0.04,0.04,0.07,0.12,0.31,0.55,0.65,0.7,0.73,0.74,0.75,0.76,0.78,0.82,0.83,0.83,0.75,0.6,0.45,0.35,0.25,0.11]);
BEV_charge_profile = normalise_profile([0.95,0.96,0.96,0.9,0.8,0.62,0.48,0.4,0.3,0.3,0.27,0.26,0.25,0.24,0.22,0.18,0.17,0.17,0.25,0.4,0.55,0.65,0.75,0.89]);
BEV_plugged_in_profile = [0.95,0.96,0.96,0.96,0.93,0.88,0.69,0.45,0.35,0.3,0.27,0.26,0.25,0.24,0.22,0.18,0.17,0.17,0.25,0.4,0.55,0.65,0.75,0.89];

high_temp_process_profile = JSON.parse(JSON.stringify(flat_profile))
low_temp_process_profile = JSON.parse(JSON.stringify(flat_profile))
not_heat_process_profile = JSON.parse(JSON.stringify(flat_profile))

// -------------------

// Copy over defined scenario
// for (var z in scenarios.main) window[z] = scenarios.main[z]     
// if (scenario_name!="main") {
//     for (var z in scenarios[scenario_name]) window[z] = scenarios[scenario_name][z]  
// }
