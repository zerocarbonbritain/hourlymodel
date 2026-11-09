// base_temperature: 13.07, Uses 16.7°C as average internal temp. and gains & losses from DECC 2050
// Power to Liquids (e.g for aviation)
// High temperature electrolysis & DAC
// Efficiencies range from 45% to 46%
// With CO2 from exhaust gas this can increase to 60% - 61%
// https://www.umweltbundesamt.de/sites/default/files/medien/377/publikationen/161005_uba_hintergrund_ptl_barrierrefrei.pdf    
/*
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
}*/

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

// BEGIN heatpumpmonitor profiles (docs/build_heatpumpmonitor_profiles.py)
// HeatpumpMonitor.org MID metered systems. Shapes 2023-10-01 to 2026-10-01, hours in UTC.
// Efficiencies 2025-11-01 to 2026-11-01.
// Space heat profiles for daily mean outside temperature bands, interpolated between band means.
hpm_space_heat_profiles = {
    temperature: [0.49,3.23,5.01,7.07,9.06,10.92,12.94],
    profiles: [
        normalise_profile([0.856,0.888,0.931,0.966,1.044,1.081,1.143,1.132,1.159,1.148,1.081,0.993,0.880,0.915,0.991,1.032,0.985,0.990,0.993,1.065,1.035,0.975,0.882,0.834]),
        normalise_profile([0.846,0.886,0.936,0.971,1.091,1.123,1.170,1.154,1.161,1.143,1.064,0.969,0.876,0.934,0.995,1.029,0.954,0.994,0.992,1.068,1.032,0.951,0.854,0.808]),
        normalise_profile([0.855,0.908,0.945,0.982,1.134,1.169,1.223,1.192,1.186,1.139,1.047,0.936,0.846,0.919,0.978,1.008,0.932,0.965,0.969,1.065,1.033,0.942,0.838,0.788]),
        normalise_profile([0.848,0.887,0.951,1.007,1.176,1.213,1.277,1.221,1.184,1.117,1.018,0.905,0.816,0.908,0.992,1.009,0.921,0.961,0.980,1.076,1.026,0.922,0.815,0.770]),
        normalise_profile([0.897,0.939,1.013,1.121,1.316,1.382,1.417,1.296,1.201,1.085,0.926,0.796,0.729,0.820,0.911,0.897,0.830,0.893,0.964,1.076,1.014,0.895,0.800,0.781]),
        normalise_profile([0.919,0.967,1.046,1.192,1.411,1.485,1.487,1.348,1.212,1.037,0.868,0.739,0.675,0.757,0.840,0.828,0.808,0.878,0.973,1.079,1.004,0.874,0.784,0.790]),
        normalise_profile([0.969,1.064,1.230,1.389,1.624,1.798,1.653,1.403,1.182,0.943,0.767,0.643,0.662,0.661,0.671,0.636,0.676,0.742,0.933,1.024,0.950,0.795,0.779,0.806]),
    ]
};
hpm_hot_water_profile = normalise_profile([0.963,1.076,1.213,1.448,1.125,1.116,1.005,0.920,0.823,0.734,0.849,1.231,1.837,1.699,1.058,0.753,0.775,0.773,0.841,0.748,0.654,0.635,0.656,1.068]);
hpm_base_temperature = 15.5;
hpm_heatpump_efficiency = {efficiency_hot_water: 301, efficiency_0C: 286, efficiency_10C: 472, efficiency_cold_T: -1.6, efficiency_cold_slope: 13};
// Below efficiency_cold_T (the coldest measured day) the space heat efficiency falls by
// efficiency_cold_slope per K, the zcb_2024 slope, in place of the fitted slope.
// END heatpumpmonitor profiles
