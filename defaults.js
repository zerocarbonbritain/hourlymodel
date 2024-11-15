
var default_scenario = {
    units_mode: "TWhyr",

    hours: 87648,
    population_2030: 70499802,
    households_2030: 29941701,
    number_of_households: 1000,
    use_flat_profiles: 0,
    include_ambient_heat: 1,
      
    supply: {
        offshore_wind_capacity: 140.0,
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
        nuclear_capacity_factor: 0.9
    },
    
    LAC: {
        domestic: {
            lighting_and_appliances_TWhy: 38.59,
            cooking_TWhy: 10.47,
            cooking_gas_TWhy: 0.0
        },
        services: {
            lighting_and_appliances_TWhy: 41.41,
            lighting_and_appliances_gas_TWhy: 0.0,
            catering_TWhy: 16.85,
            catering_gas_TWhy: 0.0,
            cooling_TWhy: 4.55,
            cooling_gas_TWhy: 0
        }   
    },

    space_heating: {
        domestic_demand_GWK: 3.435,      // GW/K  3.548
        services_demand_GWK: 1.486,      // GW/K
        industry_demand_GWK: 0.502,      // GW/K
        base_temperature: 13.07          // Uses 16.7°C as average internal temp. and gains & losses from DECC 2050
    },

    water_heating: {
        domestic_TWhy: 70.36,
        services_TWhy: 12.01
    },
    
    // Heat store option is currently hidden
    // functionality is integrated in the space and water heat profiles
    // provides more sensible heat demand profiles
    // Perhaps to be reviewed and improved in future
    heatstore: {
        enabled: false,
        storage_capacity: 100.0,
        charge_capacity: 50.0,
    },
        
    heating_systems: {
        heatpump: {
            name: "Heat pumps",
            share: 90,
            efficiency_hot_water: 280,
            efficiency_0C: 280,
            efficiency_10C: 410
        },
        elres: {
            name: "Direct electric",      
            share: 5,
            efficiency_hot_water: 100,
            efficiency_0C: 100,
            efficiency_10C: 100
        },
        methane: {
            name: "Methane gas boilers",      
            share: 0,
            efficiency_hot_water: 90,
            efficiency_0C: 90,
            efficiency_10C: 90
        },
        hydrogen: {
            name: "Hydrogen gas boilers",      
            share: 0,
            efficiency_hot_water: 90,
            efficiency_0C: 90,
            efficiency_10C: 90
        },
        synthfuel: {
            name: "Oil boilers",      
            share: 0,
            efficiency_hot_water: 90,
            efficiency_0C: 90,
            efficiency_10C: 90
        },
        biomass: {
            name: "Biomass boilers",      
            share: 5,
            efficiency_hot_water: 80,
            efficiency_0C: 85,
            efficiency_10C: 90
        },
        solid_fuel: {
            name: "Solid fuel",
            share: 0,
            efficiency_hot_water: 70,
            efficiency_0C: 70,
            efficiency_10C: 70
        }
    },

    transport: {
                
        km_per_mile: 1.609344,
        
        modes: {
            'Walking': {
                miles_pp: 250
            },
            'Cycling': {
                miles_pp: 400
            },
            'Ebikes': {
                miles_pp: 200,
                mechanical_kwhppkm_full: 0.0081,
                load_factor: 1.0,
                prc: {EV:1},
                efficiency: {EV: 0.8}
            },
            'Rail': {
                miles_pp: 1250,
                mechanical_kwhppkm_full: 0.027,
                load_factor: 0.42,
                prc: {EV:0.9, H2:0.04, IC:0.06},
                efficiency: {EV: 0.9, H2: 0.3564, IC: 0.3}
            },
            'Bus': {
                miles_pp: 1035,
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

        smart_charging_enabled: 0,
        smart_charge_type: "average",  // or flatout
        
        V2G_enabled: 0,
        V2G_discharge_type: "average", // or flatout

        rail_freight_elec_demand: 2.0,
        freight_BEV_demand: 10.5,
        freight_H2_demand: 4.06,
        freight_IC_demand: 20.58
    },
    
    industry: {
        // 2018 levels
        /*high_temp_process_TWhy: 39.9,
        low_temp_process_TWhy: 64.2,
        dry_sep_TWhy: 20.4,
        other_heat_TWhy: 24.7,
        motors_TWhy: 31.8,
        compressed_air_TWhy: 9.0,
        lighting_TWhy: 2.7,
        refrigeration_TWhy: 5.3,
        other_non_heat_TWhy: 18.4,*/

        // ZCB Originals
        high_temp_process_TWhy: 53,
        low_temp_process_TWhy: 85,
        dry_sep_TWhy: 27.0,
        other_heat_TWhy: 33,
        motors_TWhy: 42.0,
        compressed_air_TWhy: 12.0,
        lighting_TWhy: 4.0,
        refrigeration_TWhy: 7.0,
        refinery_electric_TWhy: 0,
        other_non_heat_TWhy: 25,
        
        // non_heat_process_elec_TWhy: 88.00,
        // non_heat_process_biogas_TWhy: 13.44,
        // non_heat_process_biomass_TWhy: 5.58,
        // biofuel_TWhy: 13.44,

        high_temp_process_fixed_elec_prc: 12.5,
        high_temp_process_fixed_CH4_prc: 32.5,
        high_temp_process_fixed_H2_prc: 0,
        high_temp_process_fixed_liquid_prc: 5.0, 
        high_temp_process_fixed_coal_prc: 0,   
        high_temp_process_fixed_biomass_prc: 10,
        high_temp_process_DSR_CH4_prc: 40,
        high_temp_process_DSR_H2_prc: 0,

        low_temp_process_fixed_elec_prc: 33,
        low_temp_process_fixed_CH4_prc: 12,
        low_temp_process_fixed_H2_prc: 0,
        low_temp_process_fixed_liquid_prc: 5,
        low_temp_process_fixed_coal_prc: 0,
        low_temp_process_fixed_biomass_prc: 10,
        low_temp_process_DSR_CH4_prc: 40,
        low_temp_process_DSR_H2_prc: 0,

        dry_sep_fixed_elec_prc: 30,
        dry_sep_fixed_CH4_prc: 16,
        dry_sep_fixed_H2_prc: 0,
        dry_sep_fixed_liquid_prc: 4.0,
        dry_sep_fixed_coal_prc: 0,
        dry_sep_fixed_biomass_prc: 10,
        dry_sep_DSR_CH4_prc: 40,
        dry_sep_DSR_H2_prc: 0,
        
        other_heat_fixed_elec_prc: 30,
        other_heat_fixed_CH4_prc: 10,
        other_heat_fixed_H2_prc: 0,
        other_heat_fixed_liquid_prc: 0, 
        other_heat_fixed_coal_prc: 0,
        other_heat_fixed_biomass_prc: 20,
        other_heat_DSR_CH4_prc: 40,
        other_heat_DSR_H2_prc: 0,

        other_non_heat_fixed_elec_prc: 48,
        other_non_heat_fixed_CH4_prc: 37,
        other_non_heat_fixed_H2_prc: 0,
        other_non_heat_fixed_liquid_prc: 5,
        other_non_heat_fixed_coal_prc: 0,
        other_non_heat_fixed_biomass_prc: 10
    },
        
    // Electricity Storage
    electric_storage: {
        type:"average",
        capacity_GWh: 200.0,
        charge_capacity_GW: 50.0,
        discharge_capacity_GW: 50.0,
        charge_efficiency: 0.95,
        discharge_efficiency: 0.95
    },
    
    // Hydrogen
    hydrogen: {
        electrolysis_capacity_GW: 27.0,
        electrolysis_efficiency: 0.8,
        storage_capacity_GWh: 20000.0,
        minimum_store_level: 0.1,
        hydrogen_from_imports: 0 // Twh
    },
    
    // biogas
    biogas: {
        biomass_for_biogas: 92.0,
        anaerobic_digestion_efficiency: 0.6,                                     // HHV, originally 0.5747
        co2_tons_per_gwh_methane: (1000.0/15.4)*((0.40*44.009)/(0.60*16.0425))   // 15.4 kWh/kg, MWh/ton HHV, proportion by molar mass
    },
    
    // Methanation
    methane: {
        methanation_capacity: 5.15,
        SOC_start: 10000.0,
        storage_capacity_GWh: 65000.0
    },

    // Synth fuel production
    synth_fuel: {
        capacity_GW: 9.15,
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
        prc_hydrogen: 0,
        hydrogen_efficiency: 50,
        prc_methane: 100,
        methane_efficiency:50,
        prc_biomass: 0,
        biomass_efficiency:32,
        prc_synth_fuel: 0,
        synth_fuel_efficiency:21,
        prc_coal: 0,
        coal_efficiency: 34
    },
    
    energy_industry_use: {
        electricity_grid_loss_prc: 7.0,
        electricity_own_use_prc: 0.0
    },
    
    fossil_fuels: {
        allow_use_for_backup: 0,
        other_gas_use: 0,
        other_oil_use: 0,
        other_coal_use: 0
    },
    
    land_use: {
        existing_natural_broadleaf_woodland:      139,
        existing_natural_coniferous_woodland:     151,
        existing_productive_broadleaf_woodland:  1247,
        existing_productive_coniferous_woodland: 1357,
        new_natural_broadleaf_woodland:          1000,
        new_natural_coniferous_woodland:         1000,
        new_productive_broadleaf_woodland:        600,
        new_productive_coniferous_woodland:       700,
        short_rotation_forestry:                 1660,
        // short_rotation_coppice:                  1300,
        // perrennial_grass_miscanthus:             1000,
        // rotational_grass_ryegrass:                820,
        intensive_and_rough_grazing:             2800,
        annual_grass_hemp:                        320,
        food_crops:                              3408,
        feed_crops_for_livestock:                1210,

        mountain_heath_and_bog:                  3566,
        semi_natural_grassland:                   155,
        coastal_and_freshwater:                   692,

        urban_areas:                             1459
    },
    
    "emissions_balance": {
      // Energy Supply
      "power_station":0.0,
      "manufacture_solid_fuels": 0.0,
      // Disused mines (figure for 2016 from NAEI)
      "coal_mining_handling": 0.448,
      // Gas leakage from NAEI [2] figures for 2016 reduced by ratio of 2016 gas use (approx. 900 TWh) to ZCB 2030 use (approx. 100 TWh).
      "upstream_ch4_leakage": 0.064,
      "oil_and_gas_flaring_venting": 0.0,
      // Business
      // ZCB targets reduction of 75%
      "refrigerants": 2.34,
      // Includes: foams, firefighting, solvents, electrical_insulation, aerosols_and_inhalers
      "other_foams_solvents_aerosols": 1.05,
      // Transport
      "transport_ch4_and_n2o": 0.0,
      // Domestic
      "domestic_combustion_ch4_and_n20": 0.0,
      "domestic_aerosols": 0.0,
      // Process emissions
      // Clinker substitution with equivalent process CO2 emissions reduction (40%?)   
      "cement": 3.67,
      // Assume that only process emissions remain, energy emissions fully removed. This is in line with: AEA [3] states potential for abatement of 13.06 of 16.02 MtCO2e by 2030. This is maximum feasible abatement and appears to be achievable by several routes, therefore assume it represents full abatement of non-process emissions.
      "iron_steel_and_sinter": 2.52,
      // Assume 25% reduction
      "lime": 0.789,
      "ammonia": 0.0,
      // Assume 25% reduction
      "glass": 0.276,
      "bricks": 0.0,
      "other_process_emissions": 1.07,
      // Agriculture & land use
      "agriculture_total": 19.646,
      "biomass_burning": 0.3,
      "land_remaining_and_converted_to_grassland": 0,
      "land_remaining_and_converted_to_cropland": 0,
      "land_remaining_and_converted_to_settlements": 2.44, 
      "land_remaining_and_converted_to_wetlands": -1.926,
      "land_use_n2o": 0.0,
      // Waste
      "landfill": 3.86,
      "waste_water_handling": 0.879,
      "waste_incineration": 0.377,
      "composting": 0.0,
      "anaerobic_digestion": 0.0,
      "mechanical_biological_treatment": 0.0,
      // Carbon capture
      "landfill_carbon_capture": -4.267,
    },

    // Embodied Energy
    EE: {
        onshorewind_GWh_per_GW: 1435.0,
        offshorewind_GWh_per_GW: 2700.0,
        solarpv_GWh_per_GW: 1680.0,
        onshorewind_lifespan: 25.0,
        offshorewind_lifespan: 25.0,
        solarpv_lifespan: 30.0,
    },
    
    // Cost model

    wacc : 7, // % Weighted Average Cost of Capital

    costs: {
        
        'Onshore wind': {
            capex: 965*0.86,
            opex: 19*0.86,
            fuel: 0, 
            buildmonths: 6,
            lifespan: 30
        },
        'Offshore wind': {
            capex: 2216*0.86,
            opex: 64*0.86,
            fuel: 0,
            buildmonths: 12,
            lifespan: 25
        },
        'Solar PV': {
            capex: 393*0.86,
            opex: 6*0.86,
            fuel: 0,
            buildmonths: 6,
            lifespan: 35
        },
        'Tidal': {
            capex: 2000*0.86,
            opex: 40*0.86,
            fuel: 0,
            buildmonths: 12,
            lifespan: 30
        },
        'Wave': {
            capex: 2300*0.86,
            opex: 58*0.86,
            fuel: 0,
            buildmonths: 12,
            lifespan: 25
        },
        'Geothermal Electric': {
            capex: 4245*0.86,
            opex: 80*0.86,
            fuel: 0,
            buildmonths: 24,
            lifespan: 40
        },
        'Nuclear': {
            capex: 9170*0.86,
            opex: 159.5*0.86,
            fuel: 0.0,
            buildmonths: 70,
            lifespan: 40
        },
        'H2 Electrolysis': {
            capex: 381*0.86,
            opex: 13.3*0.86,
            fuel: 0.0014*0.86,
            buildmonths: 6,
            lifespan: 30
        },
        'Methanation': {
            capex: 274*0.86,
            opex: 12.6*0.86,
            fuel: 0.0,
            buildmonths: 6,
            lifespan: 30
        },
        'Gas turbines': {
            capex: 475*0.86,
            opex: 14.25*0.86,
            fuel: 0.0,
            buildmonths: 6,
            lifespan: 35
        }
    }
}

var i = JSON.parse(JSON.stringify(default_scenario));


units_mode = "TWhyr"
unitsmode = "GW"

// Profiles    
flat_profile = normalise_profile([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]);

// Variable profiles
default_cooking_profile = normalise_profile([0.1,0.1,0.1,0.1,0.14,0.25,0.45,0.55,0.58,0.56,0.52,0.50,0.48,0.48,0.50,0.56,0.64,0.68,0.64,0.55,0.45,0.33,0.25,0.15]);
default_hot_water_profile = normalise_profile([0.647,0.732,0.788,0.84,0.89,0.93,0.97,0.97,0.952,0.909,0.848,0.771,0.75,0.78,0.79,0.76,0.726,0.748,0.78,0.82,0.787,0.732,0.63,0.6]);
default_space_heat_profile = normalise_profile([0.647,0.732,0.788,0.84,0.89,0.93,0.97,0.97,0.952,0.909,0.848,0.771,0.75,0.78,0.79,0.76,0.726,0.748,0.78,0.82,0.787,0.732,0.63,0.6]);

elec_trains_use_profile = [0.004268293, 0.002439024, 0.001829268, 0.001219512, 0.003658536, 0.009756097, 0.025609755, 0.061585364, 0.054878047, 0.048780486, 0.058536584, 0.066463413, 0.07317073, 0.065853657, 0.07317073, 0.082317071, 0.077439022, 0.079268291, 0.067073169, 0.051219511, 0.038414633, 0.02804878, 0.015853658, 0.009146341];

BEV_use_profile = normalise_profile([0.05,0.04,0.04,0.04,0.07,0.12,0.31,0.55,0.65,0.7,0.73,0.74,0.75,0.76,0.78,0.82,0.83,0.83,0.75,0.6,0.45,0.35,0.25,0.11]);
default_BEV_charge_profile = normalise_profile([0.95,0.96,0.96,0.9,0.8,0.62,0.48,0.4,0.3,0.3,0.27,0.26,0.25,0.24,0.22,0.18,0.17,0.17,0.25,0.4,0.55,0.65,0.75,0.89]);
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
