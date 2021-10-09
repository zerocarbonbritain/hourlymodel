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
    
    trad_elec_domestic_appliances: 32.92,
    annual_cooking_elec_domestic: 10.48,
    annual_cooking_elec_services: 16.85,
    trad_elec_services_appliances: 41.41,
    trad_elec_services_cooling: 4.55,

    use_flat_profiles: 0,
    
    // W/K (DECC 2050 Pathway level 4) x number of households 2030: 3.548 GW/K,
    domestic_space_heat_demand_GWK: 3.548, // GW/K,
    services_space_heat_demand_GWK: 1.486, // GW/K,
    industry_space_heat_demand_GWK: 0.502, // GW/K,
    space_heat_base_temperature: 13.07,               // Uses 16.7°C as average internal temp. and gains & losses from DECC 2050,
    
    domestic_water_heating: 40.80, // TWh,
    services_water_heating: 15.99, // TWh,
        
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
    biomass_for_biogas: 75.0,
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

    // Embodied Energy
    EE: {
        onshorewind_GWh_per_GW: 1435.0,
        offshorewind_GWh_per_GW: 2700.0,
        solarpv_GWh_per_GW: 1680.0,
        onshorewind_lifespan: 25.0,
        offshorewind_lifespan: 25.0,
        solarpv_lifespan: 30.0,
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


units_mode = "TWhyr"
unitsmode = "GW"

// Profiles    
flat_profile = [0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667, 0.041666667];

// Variable profiles

cooking_profile = [0.00093739, 0.00093739, 0.00093739, 0.005002513, 0.015325386, 0.034557134, 0.075528659, 0.10242465, 0.112118681, 0.068802784, 0.046286663, 0.030023072, 0.019077393, 0.019077393, 0.021108649, 0.029555111, 0.069742295, 0.077562688, 0.071150746, 0.058327514, 0.044879681, 0.037216907, 0.032212599, 0.027207312];

hot_water_profile = [0.00093739, 0.00093739, 0.00093739, 0.005002513, 0.015325386, 0.034557134, 0.075528659, 0.10242465, 0.112118681, 0.068802784, 0.046286663, 0.030023072, 0.019077393, 0.019077393, 0.021108649, 0.029555111, 0.069742295, 0.077562688, 0.071150746, 0.058327514, 0.044879681, 0.037216907, 0.032212599, 0.027207312];

space_heat_profile = [0.008340899, 0.008340899, 0.008340899, 0.008340866, 0.016680908, 0.06511456, 0.076803719, 0.083470637, 0.0751301, 0.06009123, 0.04593692, 0.040060611, 0.0350685, 0.033362773, 0.033394683, 0.034247234, 0.036743141, 0.040881845, 0.05175043, 0.06264997, 0.064292437, 0.060849104, 0.04176657, 0.008341064];

elec_trains_use_profile = [0.004268293, 0.002439024, 0.001829268, 0.001219512, 0.003658536, 0.009756097, 0.025609755, 0.061585364, 0.054878047, 0.048780486, 0.058536584, 0.066463413, 0.07317073, 0.065853657, 0.07317073, 0.082317071, 0.077439022, 0.079268291, 0.067073169, 0.051219511, 0.038414633, 0.02804878, 0.015853658, 0.009146341];

BEV_use_profile = [0.004268293, 0.002439024, 0.001829268, 0.001219512, 0.003658536, 0.009756097, 0.025609755, 0.061585364, 0.054878047, 0.048780486, 0.058536584, 0.066463413, 0.07317073, 0.065853657, 0.07317073, 0.082317071, 0.077439022, 0.079268291, 0.067073169, 0.051219511, 0.038414633, 0.02804878, 0.015853658, 0.009146341];

BEV_charge_profile = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.05, 0.05, 0.05, 0.05, 0.1];

BEV_plugged_in_profile = [0.873684211, 0.889473684, 0.894736842, 0.9, 0.878947368, 0.826315789, 0.689473684, 0.378947368, 0.436842105, 0.489473684, 0.405263158, 0.336842105, 0.278947368, 0.342105263, 0.278947368, 0.2, 0.242105263, 0.226315789, 0.331578947, 0.468421053, 0.578947368, 0.668421053, 0.773684211, 0.831578947];

high_temp_process_profile = JSON.parse(JSON.stringify(flat_profile))
low_temp_process_profile = JSON.parse(JSON.stringify(flat_profile))
not_heat_process_profile = JSON.parse(JSON.stringify(flat_profile))

// Flatter profile and early morning and afternoon heat up periods
// hot_water_profile = [0.035,0.038,0.04,0.045,0.06,0.062,0.06,0.04,0.04,0.04,0.04,0.045,0.053,0.06,0.06,0.05,0.028,0.025,0.025,0.028,0.029,0.03,0.032,0.035];    
// Flatter profile reflecting heat pump heat
// space_heat_profile = [0.02,0.02,0.02,0.03,0.045,0.05,0.05,0.05,0.05,0.05,0.045,0.04,0.04,0.04,0.04,0.045,0.05,0.052,0.052,0.051,0.05,0.048,0.037,0.025];
// Flatter profile reduces backup CCGT requirements by ~4GW for the same level of matching (45GW to 41GW)

// hours                 00,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23
// BEV_charge_profile = [04,06,06,06,06,03,00,00,00,00,01,02,04,04,04,03,02,01,00,00,00,01,02,03]
// BEV_charge_profile = normalise_profile(BEV_charge_profile)


// -------------------

// Copy over defined scenario
// for (var z in scenarios.main) window[z] = scenarios.main[z]     
// if (scenario_name!="main") {
//     for (var z in scenarios[scenario_name]) window[z] = scenarios[scenario_name][z]  
// }
