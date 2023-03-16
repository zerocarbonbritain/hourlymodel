var scenarios = {
  "2018 Energy Demand and Supply (Baseline)": {
    "units_mode": "TWhyr",
    "hours": 87648,
    "population_2030": 66460000,
    "households_2030": 27600000,
    "number_of_households": 1000,
    "use_flat_profiles": 0,
    "include_ambient_heat": 1,
    "supply": {
      "offshore_wind_capacity": 8.2,
      "offshore_wind_availability": 0.774,
      "onshore_wind_capacity": 13.6,
      "onshore_wind_availability": 0.785,
      "wave_capacity": 0,
      "tidal_capacity": 0,
      "solarpv_capacity": 15.4,
      "solarthermal_capacity": 1,
      "hydro_capacity": 1.9,
      "hydro_capacity_factor": 0.33,
      "geothermal_elec_capacity": 0,
      "geothermal_elec_capacity_factor": 0.9,
      "geothermal_heat_capacity": 0,
      "geothermal_heat_capacity_factor": 0.9,
      "nuclear_capacity": 11.64,
      "nuclear_capacity_factor": 0.835
    },
    "LAC": {
      "domestic": {
        "lighting_and_appliances_TWhy": 76.63,
        "cooking_TWhy": 5.71,
        "cooking_gas_TWhy": 7.46
      },
      "services": {
        "lighting_and_appliances_TWhy": 60.3,
        "lighting_and_appliances_gas_TWhy": 10.65,      
        "catering_TWhy": 8.8,
        "catering_gas_TWhy": 16.42,
        "cooling_TWhy": 12.4,
        "cooling_gas_TWhy": 0.51
      }
    },
    "space_heating": {
      "domestic_demand_GWK": 5.294,
      "services_demand_GWK": 1.975,
      "industry_demand_GWK": 0.405,
      "base_temperature": 15.3
    },
    "water_heating": {
      "domestic_TWhy": 68.538,
      "services_TWhy": 13.701
    },
    "heatstore": {
      "enabled": false,
      "storage_capacity": 100,
      "charge_capacity": 50
    },
    "heating_systems": {
      "heatpump": {
        "name": "Heat pumps",
        "share": 3.58,
        "efficiency": 280
      },
      "elres": {
        "name": "Direct electric",
        "share": 7.67,
        "efficiency": 100
      },
      "methane": {
        "name": "Methane gas boilers",
        "share": 73.60,
        "efficiency": 82.5
      },
      "hydrogen": {
        "name": "Hydrogen gas boilers",
        "share": 0,
        "efficiency": 82.5
      },
      "synthfuel": {
        "name": "Oil boilers",      
        "share": 9.60,
        "efficiency": 82.5
      },
      "biomass": {
        "name": "Biomass boilers",
        "share": 4.32,
        "efficiency": 70
      },
      "solid_fuel": {
        "name": "Solid fuel",
        "share": 1.23,
        "efficiency": 75
      }
    },
    "transport": {
      "km_per_mile": 1.609344,
      "modes": {
        "Walking": {
          "miles_pp": 198,
          "km_pp": 318.65011200000004
        },
        "Cycling": {
          "miles_pp": 48,
          "km_pp": 77.248512
        },
        "Ebikes": {
          "miles_pp": 0,
          "mechanical_kwhppkm_full": 0.0081,
          "load_factor": 1,
          "prc": {
            "EV": 1
          },
          "efficiency": {
            "EV": 0.8
          },
          "km_pp": 0
        },
        "Rail": {
          "miles_pp": 754,
          "mechanical_kwhppkm_full": 0.027,
          "load_factor": 0.324,
          "prc": {
            "EV": 0.66,
            "H2": 0,
            "IC": 0.34
          },
          "efficiency": {
            "EV": 0.9,
            "H2": 0.3564,
            "IC": 0.3
          },
          "km_pp": 1213.4453760000001
        },
        "Bus": {
          "miles_pp": 325,
          "mechanical_kwhppkm_full": 0.0163,
          "load_factor": 0.1432,
          "prc": {
            "EV": 0.0125,
            "H2": 0,
            "IC": 0.9875
          },
          "efficiency": {
            "EV": 0.8,
            "H2": 0.3564,
            "IC": 0.3
          },
          "km_pp": 523.0368000000001
        },
        "Motorbike": {
          "miles_pp": 46,
          "mechanical_kwhppkm_full": 0.054,
          "load_factor": 1.071,
          "prc": {
            "EV": 0,
            "H2": 0,
            "IC": 1
          },
          "efficiency": {
            "EV": 0.8,
            "H2": 0.3564,
            "IC": 0.115
          },
          "km_pp": 74.029824
        },
        "Cars & Vans": {
          "miles_pp": 6299,
          "mechanical_kwhppkm_full": 0.031,
          "load_factor": 0.3288,
          "prc": {
            "EV": 0.0125,
            "H2": 0,
            "IC": 0.9875
          },
          "efficiency": {
            "EV": 0.8,
            "H2": 0.3564,
            "IC": 0.2191
          },
          "km_pp": 10137.257856
        },
        "Aviation": {
          "miles_pp": 3580,
          "mechanical_kwhppkm_full": 0.07,
          "load_factor": 0.85,
          "prc": {
            "EV": 0,
            "H2": 0,
            "IC": 1
          },
          "efficiency": {
            "EV": 0.8,
            "H2": 0.2574,
            "IC": 0.2
          },
          "km_pp": 5532.924672
        }
      },
      "electric_car_battery_capacity": 12,
      "electric_car_max_charge_rate": 2.4,
      "smart_charging_enabled": 0,
      "smart_charge_type": "average",
      "V2G_enabled": 0,
      "V2G_discharge_type": "average",
      "rail_freight_elec_demand": 0,
      "freight_BEV_demand": 0,
      "freight_H2_demand": 0,
      "freight_IC_demand": 188.1
    },
    "industry": {
      "high_temp_process_TWhy": 39.9,
      "low_temp_process_TWhy": 64.2,
      "dry_sep_TWhy": 20.4,
      "other_heat_TWhy": 24.7,
      "motors_TWhy": 31.8,
      "compressed_air_TWhy": 9,
      "lighting_TWhy": 2.7,
      "refrigeration_TWhy": 5.3,
      "refinery_electric_TWhy": 12.6,
      "other_non_heat_TWhy": 18.3,
      "high_temp_process_fixed_elec_prc": 23.4,
      "high_temp_process_fixed_CH4_prc": 53.9,
      "high_temp_process_fixed_H2_prc": 0,
      "high_temp_process_fixed_liquid_prc": 5.4,
      "high_temp_process_fixed_coal_prc": 17.3,
      "high_temp_process_fixed_biomass_prc": 0.0,
      "high_temp_process_DSR_CH4_prc": 0,
      "high_temp_process_DSR_H2_prc": 0,
      "low_temp_process_fixed_elec_prc": 25.7,
      "low_temp_process_fixed_CH4_prc": 64.1,
      "low_temp_process_fixed_H2_prc": 0,
      "low_temp_process_fixed_liquid_prc": 4.8,
      "low_temp_process_fixed_coal_prc": 5.4,
      "low_temp_process_fixed_biomass_prc": 0.0,
      "low_temp_process_DSR_CH4_prc": 0,
      "low_temp_process_DSR_H2_prc": 0,
      "dry_sep_fixed_elec_prc": 29.3,
      "dry_sep_fixed_CH4_prc": 58,
      "dry_sep_fixed_H2_prc": 0,
      "dry_sep_fixed_liquid_prc": 4.4,
      "dry_sep_fixed_coal_prc": 8.2,
      "dry_sep_fixed_biomass_prc": 0.0,
      "dry_sep_DSR_CH4_prc": 0,
      "dry_sep_DSR_H2_prc": 0,
      "other_heat_fixed_elec_prc": 0,
      "other_heat_fixed_CH4_prc": 32.5,
      "other_heat_fixed_H2_prc": 0,
      "other_heat_fixed_liquid_prc": 0,
      "other_heat_fixed_coal_prc": 0.0,
      "other_heat_fixed_biomass_prc": 67.5,
      "other_heat_DSR_CH4_prc": 0,
      "other_heat_DSR_H2_prc": 0,
      "other_non_heat_fixed_elec_prc": 24.8,
      "other_non_heat_fixed_CH4_prc": 61.6,
      "other_non_heat_fixed_H2_prc": 0,
      "other_non_heat_fixed_liquid_prc": 4.9,
      "other_non_heat_fixed_coal_prc": 8.6,
      "other_non_heat_fixed_biomass_prc": 0.0
    },
    "electric_storage": {
      "type": "average",
      "capacity_GWh": 10,
      "charge_capacity_GW": 5,
      "discharge_capacity_GW": 5,
      "charge_efficiency": 0.85,
      "discharge_efficiency": 0.85
    },
    "hydrogen": {
      "electrolysis_capacity_GW": 0,
      "electrolysis_efficiency": 0.8,
      "storage_capacity_GWh": 0.1,
      "minimum_store_level": 0.1,
      "hydrogen_from_imports":0
    },
    "biogas": {
      "biomass_for_biogas": 0,
      "anaerobic_digestion_efficiency": 0.6,
      "co2_tons_per_gwh_methane": 118.7565226835914
    },
    "methane": {
      "methanation_capacity": 0,
      "SOC_start": 0,
      "storage_capacity_GWh": 120000
    },
    "synth_fuel": {
      "capacity_GW": 0,
      "store_capacity_GWh": 50000,
      "store_start_GWh": 0,
      "FT_process_biomass_req": 1.3,
      "FT_process_hydrogen_req": 0.61
    },
    "power_to_X": {
      "capacity": 0,
      "prc_gas": 0.44,
      "gas_efficiency": 0.6,
      "prc_liquid": 0.56,
      "liquid_efficiency": 0.6
    },
    "electric_backup": {
        prc_hydrogen: 0,
        hydrogen_efficiency: 47.8,
        prc_methane: 69.24,
        methane_efficiency:47.8,
        prc_biomass: 20.39,
        biomass_efficiency:32.2,
        prc_synth_fuel: 0.56,
        synth_fuel_efficiency:21,
        prc_coal: 9.81,
        coal_efficiency: 34.4
    },
    energy_industry_use: {
        electricity_grid_loss_prc: 7.64,
        electricity_own_use_prc: 4.40
    },
    "fossil_fuels": {
      "allow_use_for_backup": 1,
      "other_gas_use": 14.8,
      "other_oil_use": 31.8,
      "other_coal_use": 7.0
    },
    "land_use": {
      "existing_natural_broadleaf_woodland": 139,
      "existing_natural_coniferous_woodland": 151,
      "existing_productive_broadleaf_woodland": 1247,
      "existing_productive_coniferous_woodland": 1357,
      "new_natural_broadleaf_woodland": 1475,
      "new_natural_coniferous_woodland": 0,
      "new_productive_broadleaf_woodland": 0,
      "new_productive_coniferous_woodland": 0,
      "short_rotation_forestry": 0,
      "short_rotation_coppice": 587.1494160779091,
      "perrennial_grass_miscanthus": 0,
      "rotational_grass_ryegrass": 0,
      "intensive_and_rough_grazing": 11522,
      "annual_grass_hemp": 320,
      "food_crops": 2557,
      "feed_crops_for_livestock": 2557,
      "mountain_heath_and_bog": 3566,
      "semi_natural_grassland": 155,
      "coastal_and_freshwater": 692,
      "urban_areas": 1459
    },
    "emissions_balance": {
      // Energy Supply
      "power_station":0.677,
      "manufacture_solid_fuels": 0.430,
      "coal_mining_handling": 0.462,
      "upstream_ch4_leakage": 3.710,
      "oil_and_gas_flaring_venting": 4.977,
      // Business
      "refrigerants": 10.7,
      "other_foams_solvents_aerosols": 2.5,
      // Transport
      "transport_ch4_and_n2o": 1.622,
      // Domestic
      "domestic_combustion_ch4_and_n20": 1.152,
      "domestic_aerosols": 1.499,
      // Process emissions
      "cement": 4.364,
      "iron_steel_and_sinter": 2.303,
      "lime": 1.089,
      "ammonia": 0.799,
      "glass": 0.360,
      "bricks": 0.333,
      "other_process_emissions": 0.983,
      // Agriculture & land use
      "agriculture_total": 40.928,
      "biomass_burning": 0.437,
      "land_remaining_and_converted_to_grassland": -9.170,
      "land_remaining_and_converted_to_cropland": 11.047,
      "land_remaining_and_converted_to_settlements": 6.400, 
      "land_remaining_and_converted_to_wetlands": 0.335,
      "land_use_n2o": 1.309,
      // Waste
      "landfill": 14.421,
      "waste_water_handling": 4.116,
      "waste_incineration": 0.278,
      "composting": 1.018,
      "anaerobic_digestion": 0.170,
      "mechanical_biological_treatment": 0.647,
      // Carbon capture
      "landfill_carbon_capture": 0,
    },
    "EE": {
      "onshorewind_GWh_per_GW": 1435,
      "offshorewind_GWh_per_GW": 2700,
      "solarpv_GWh_per_GW": 1680,
      "onshorewind_lifespan": 25,
      "offshorewind_lifespan": 25,
      "solarpv_lifespan": 30
    }
  },
"FES 2022 Leading the way":{
  "units_mode": "TWhyr",
  "hours": 87648,
  "population_2030": 70499802,
  "households_2030": 29941701,
  "number_of_households": 1000,
  "use_flat_profiles": 0,
  "include_ambient_heat": 1,
  "supply": {
    "offshore_wind_capacity": 120,
    "offshore_wind_availability": 0.9,
    "onshore_wind_capacity": 60,
    "onshore_wind_availability": 0.9,
    "wave_capacity": 2,
    "tidal_capacity": 3.4,
    "solarpv_capacity": 115,
    "solarthermal_capacity": 0,
    "hydro_capacity": 3,
    "hydro_capacity_factor": 0.3,
    "geothermal_elec_capacity": 3,
    "geothermal_elec_capacity_factor": 0.9,
    "geothermal_heat_capacity": 2,
    "geothermal_heat_capacity_factor": 0.9,
    "nuclear_capacity": 11.3,
    "nuclear_capacity_factor": 0.9
  },
  "LAC": {
    "domestic": {
      "lighting_and_appliances_TWhy": 38,
      "cooking_TWhy": 10,
      "cooking_gas_TWhy": 0
    },
    "services": {
      "lighting_and_appliances_TWhy": 70.6,
      "lighting_and_appliances_gas_TWhy": 0,
      "catering_TWhy": 25.3,
      "catering_gas_TWhy": 0,
      "cooling_TWhy": 12.9,
      "cooling_gas_TWhy": 0
    }
  },
  "space_heating": {
    "domestic_demand_GWK": 4.475,
    "services_demand_GWK": 2.68,
    "industry_demand_GWK": 0.55,
    "base_temperature": 13.07
  },
  "water_heating": {
    "domestic_TWhy": 68.5,
    "services_TWhy": 13.7
  },
  "heatstore": {
    "enabled": false,
    "storage_capacity": 100,
    "charge_capacity": 50
  },
  "heating_systems": {
    "heatpump": {
      "name": "Heat pumps",
      "share": 74,
      "efficiency": 250
    },
    "elres": {
      "name": "Direct electric",
      "share": 5,
      "efficiency": 100
    },
    "methane": {
      "name": "Methane gas boilers",
      "share": 0,
      "efficiency": 90
    },
    "hydrogen": {
      "name": "Hydrogen gas boilers",
      "share": 15,
      "efficiency": 90
    },
    "synthfuel": {
      "name": "Oil boilers",
      "share": 0,
      "efficiency": 90
    },
    "biomass": {
      "name": "Biomass boilers",
      "share": 6,
      "efficiency": 90
    },
    "solid_fuel": {
      "name": "Solid fuel",
      "share": 0,
      "efficiency": 70
    }
  },
  "transport": {
    "km_per_mile": 1.609344,
    "modes": {
      "Walking": {
        "miles_pp": 250,
        "km_pp": 402.336
      },
      "Cycling": {
        "miles_pp": 400,
        "km_pp": 643.7376
      },
      "Ebikes": {
        "miles_pp": 200,
        "mechanical_kwhppkm_full": 0.0081,
        "load_factor": 1,
        "prc": {
          "EV": 1
        },
        "efficiency": {
          "EV": 0.8
        },
        "km_pp": 321.8688
      },
      "Rail": {
        "miles_pp": 1250,
        "mechanical_kwhppkm_full": 0.027,
        "load_factor": 0.42,
        "prc": {
          "EV": 1,
          "H2": 0,
          "IC": 0
        },
        "efficiency": {
          "EV": 0.9,
          "H2": 0.3564,
          "IC": 0.3
        },
        "km_pp": 2011.68
      },
      "Bus": {
        "miles_pp": 1035,
        "mechanical_kwhppkm_full": 0.016,
        "load_factor": 0.42,
        "prc": {
          "EV": 1,
          "H2": 0,
          "IC": 0
        },
        "efficiency": {
          "EV": 0.8,
          "H2": 0.3564,
          "IC": 0.3
        },
        "km_pp": 1665.6710400000002
      },
      "Motorbike": {
        "miles_pp": 186,
        "mechanical_kwhppkm_full": 0.054,
        "load_factor": 1.1,
        "prc": {
          "EV": 1,
          "H2": 0,
          "IC": 0
        },
        "efficiency": {
          "EV": 0.8,
          "H2": 0.3564,
          "IC": 0.3
        },
        "km_pp": 299.337984
      },
      "Cars & Vans": {
        "miles_pp": 5500,
        "mechanical_kwhppkm_full": 0.031,
        "load_factor": 0.38,
        "prc": {
          "EV": 1,
          "H2": 0,
          "IC": 0
        },
        "efficiency": {
          "EV": 0.8,
          "H2": 0.3564,
          "IC": 0.3
        },
        "km_pp": 8851.392
      },
      "Aviation": {
        "miles_pp": 2600,
        "mechanical_kwhppkm_full": 0.07,
        "load_factor": 0.85,
        "prc": {
          "EV": 0,
          "H2": 0,
          "IC": 1
        },
        "efficiency": {
          "EV": 0.8,
          "H2": 0.2574,
          "IC": 0.2
        },
        "km_pp": 4184.294400000001
      }
    },
    "electric_car_battery_capacity": 1000,
    "electric_car_max_charge_rate": 73.3,
    "smart_charging_enabled": 1,
    "smart_charge_type": "average",
    "V2G_enabled": 1,
    "V2G_discharge_type": "average",
    "rail_freight_elec_demand": 1,
    "freight_BEV_demand": 45,
    "freight_H2_demand": 6,
    "freight_IC_demand": 0
  },
  "industry": {
    "high_temp_process_TWhy": 31.2,
    "low_temp_process_TWhy": 49.9,
    "dry_sep_TWhy": 15.8,
    "other_heat_TWhy": 19.4,
    "motors_TWhy": 24.6,
    "compressed_air_TWhy": 7,
    "lighting_TWhy": 2.3,
    "refrigeration_TWhy": 4.1,
    "refinery_electric_TWhy": 0,
    "other_non_heat_TWhy": 14.7,
    "high_temp_process_fixed_elec_prc": 40,
    "high_temp_process_fixed_CH4_prc": 1,
    "high_temp_process_fixed_H2_prc": 58,
    "high_temp_process_fixed_liquid_prc": 0,
    "high_temp_process_fixed_coal_prc": 0,
    "high_temp_process_fixed_biomass_prc": 1,
    "high_temp_process_DSR_CH4_prc": 0,
    "high_temp_process_DSR_H2_prc": 0,
    "low_temp_process_fixed_elec_prc": 50,
    "low_temp_process_fixed_CH4_prc": 1,
    "low_temp_process_fixed_H2_prc": 48,
    "low_temp_process_fixed_liquid_prc": 0,
    "low_temp_process_fixed_coal_prc": 0,
    "low_temp_process_fixed_biomass_prc": 1,
    "low_temp_process_DSR_CH4_prc": 0,
    "low_temp_process_DSR_H2_prc": 0,
    "dry_sep_fixed_elec_prc": 55,
    "dry_sep_fixed_CH4_prc": 1,
    "dry_sep_fixed_H2_prc": 43,
    "dry_sep_fixed_liquid_prc": 0,
    "dry_sep_fixed_coal_prc": 0,
    "dry_sep_fixed_biomass_prc": 1,
    "dry_sep_DSR_CH4_prc": 0,
    "dry_sep_DSR_H2_prc": 0,
    "other_heat_fixed_elec_prc": 55,
    "other_heat_fixed_CH4_prc": 1,
    "other_heat_fixed_H2_prc": 43,
    "other_heat_fixed_liquid_prc": 0,
    "other_heat_fixed_coal_prc": 0,
    "other_heat_fixed_biomass_prc": 1,
    "other_heat_DSR_CH4_prc": 0,
    "other_heat_DSR_H2_prc": 0,
    "other_non_heat_fixed_elec_prc": 61,
    "other_non_heat_fixed_CH4_prc": 1,
    "other_non_heat_fixed_H2_prc": 37,
    "other_non_heat_fixed_liquid_prc": 0,
    "other_non_heat_fixed_coal_prc": 0,
    "other_non_heat_fixed_biomass_prc": 1
  },
  "electric_storage": {
    "type": "average",
    "capacity_GWh": 200,
    "charge_capacity_GW": 50,
    "discharge_capacity_GW": 50,
    "charge_efficiency": 0.95,
    "discharge_efficiency": 0.95
  },
  "hydrogen": {
    "electrolysis_capacity_GW": 45,
    "electrolysis_efficiency": 0.8,
    "storage_capacity_GWh": 30000,
    "minimum_store_level": 0.1,
    "hydrogen_from_imports":77
  },
  "biogas": {
    "biomass_for_biogas": 30,
    "anaerobic_digestion_efficiency": 0.6,
    "co2_tons_per_gwh_methane": 118.7565226835914
  },
  "methane": {
    "methanation_capacity": 5.15,
    "SOC_start": 10000,
    "storage_capacity_GWh": 65000
  },
  "synth_fuel": {
    "capacity_GW": 10.3,
    "store_capacity_GWh": 50000,
    "store_start_GWh": 10000,
    "FT_process_biomass_req": 1.3,
    "FT_process_hydrogen_req": 0.61
  },
  "power_to_X": {
    "capacity": 0,
    "prc_gas": 0.44,
    "gas_efficiency": 0.6,
    "prc_liquid": 0.56,
    "liquid_efficiency": 0.6
  },
  "electric_backup": {
    "prc_hydrogen": 0,
    "hydrogen_efficiency": 50,
    "prc_methane": 60,
    "methane_efficiency": 50,
    "prc_biomass": 40,
    "biomass_efficiency": 32,
    "prc_synth_fuel": 0,
    "synth_fuel_efficiency": 21,
    "prc_coal": 0,
    "coal_efficiency": 34
  },
  "energy_industry_use": {
    "electricity_grid_loss_prc": 8,
    "electricity_own_use_prc": 0
  },
  "fossil_fuels": {
    "allow_use_for_backup": 1,
    "other_gas_use": 0,
    "other_oil_use": 0,
    "other_coal_use": 0
  },
  "land_use": {
    "existing_natural_broadleaf_woodland": 139,
    "existing_natural_coniferous_woodland": 151,
    "existing_productive_broadleaf_woodland": 1247,
    "existing_productive_coniferous_woodland": 1357,
    "new_natural_broadleaf_woodland": 1000,
    "new_natural_coniferous_woodland": 1000,
    "new_productive_broadleaf_woodland": 600,
    "new_productive_coniferous_woodland": 700,
    "short_rotation_forestry": 1660,
    "short_rotation_coppice": 638.1683549604412,
    "perrennial_grass_miscanthus": 1720.8576542829578,
    "rotational_grass_ryegrass": 0,
    "intensive_and_rough_grazing": 2833,
    "annual_grass_hemp": 320,
    "food_crops": 3408,
    "feed_crops_for_livestock": 1210,
    "mountain_heath_and_bog": 3566,
    "semi_natural_grassland": 155,
    "coastal_and_freshwater": 692,
    "urban_areas": 1459
  },
  "emissions_balance": {
    "power_station": 0,
    "manufacture_solid_fuels": 0,
    "coal_mining_handling": 0.448,
    "upstream_ch4_leakage": 0.064,
    "oil_and_gas_flaring_venting": 0,
    "refrigerants": 2.34,
    "other_foams_solvents_aerosols": 1.05,
    "transport_ch4_and_n2o": 0,
    "domestic_combustion_ch4_and_n20": 0,
    "domestic_aerosols": 0,
    "cement": 3.67,
    "iron_steel_and_sinter": 2.52,
    "lime": 0.789,
    "ammonia": 0,
    "glass": 0.276,
    "bricks": 0,
    "other_process_emissions": 1.07,
    "agriculture_total": 19.646,
    "biomass_burning": 0.3,
    "land_remaining_and_converted_to_grassland": 0,
    "land_remaining_and_converted_to_cropland": 0,
    "land_remaining_and_converted_to_settlements": 2.44,
    "land_remaining_and_converted_to_wetlands": -1.926,
    "land_use_n2o": 0,
    "landfill": 3.86,
    "waste_water_handling": 0.879,
    "waste_incineration": 0.377,
    "composting": 0,
    "anaerobic_digestion": 0,
    "mechanical_biological_treatment": 0,
    "landfill_carbon_capture": -4.267,
    "fossil_fuel_coal": 0,
    "fossil_fuel_oil": 8.956325864449633,
    "fossil_fuel_gas": 0.21030706008862057,
    "reforestation": -27.7906,
    "harvested_wood": -11.925362166666666,
    "biochar_carbon_capture": -1.5369993545454546,
    "international_aviation_bunkers": 22.37718523195211
  },
  "EE": {
    "onshorewind_GWh_per_GW": 1435,
    "offshorewind_GWh_per_GW": 2700,
    "solarpv_GWh_per_GW": 1680,
    "onshorewind_lifespan": 25,
    "offshorewind_lifespan": 25,
    "solarpv_lifespan": 30
  }
},
"Zero Supply and Demand": {
  "units_mode": "TWhyr",
  "hours": 87648,
  "population_2030": 70499802,
  "households_2030": 29941701,
  "number_of_households": 1000,
  "use_flat_profiles": 0,
  "include_ambient_heat": 1,
  "supply": {
    "offshore_wind_capacity": 0,
    "offshore_wind_availability": 0.9,
    "onshore_wind_capacity": 0,
    "onshore_wind_availability": 0.9,
    "wave_capacity": 0,
    "tidal_capacity": 0,
    "solarpv_capacity": 0,
    "solarthermal_capacity": 0,
    "hydro_capacity": 0,
    "hydro_capacity_factor": 0.3,
    "geothermal_elec_capacity": 0,
    "geothermal_elec_capacity_factor": 0.9,
    "geothermal_heat_capacity": 0,
    "geothermal_heat_capacity_factor": 0.9,
    "nuclear_capacity": 0,
    "nuclear_capacity_factor": 0.9
  },
  "LAC": {
    "domestic": {
      "lighting_and_appliances_TWhy": 0,
      "cooking_TWhy": 0,
      "cooking_gas_TWhy": 0
    },
    "services": {
      "lighting_and_appliances_TWhy": 0,
      "lighting_and_appliances_gas_TWhy": 0,
      "catering_TWhy": 0,
      "catering_gas_TWhy": 0,
      "cooling_TWhy": 0,
      "cooling_gas_TWhy": 0
    }
  },
  "space_heating": {
    "domestic_demand_GWK": 0,
    "services_demand_GWK": 0,
    "industry_demand_GWK": 0,
    "base_temperature": 13.07
  },
  "water_heating": {
    "domestic_TWhy": 0,
    "services_TWhy": 0
  },
  "heatstore": {
    "enabled": false,
    "storage_capacity": 0.1,
    "charge_capacity": 0.1
  },
  "heating_systems": {
    "heatpump": {
      "name": "Heat pumps",
      "share": 100,
      "efficiency": 300
    },
    "elres": {
      "name": "Direct electric",
      "share": 0,
      "efficiency": 100
    },
    "methane": {
      "name": "Methane gas boilers",
      "share": 0,
      "efficiency": 90
    },
    "hydrogen": {
      "name": "Hydrogen gas boilers",
      "share": 0,
      "efficiency": 90
    },
    "synthfuel": {
      "name": "Oil boilers",
      "share": 0,
      "efficiency": 90
    },
    "biomass": {
      "name": "Biomass boilers",
      "share": 0,
      "efficiency": 90
    },
    "solid_fuel": {
      "name": "Solid fuel",
      "share": 0,
      "efficiency": 70
    }
  },
  "transport": {
    "km_per_mile": 1.609344,
    "modes": {
      "Walking": {
        "miles_pp": 0,
        "km_pp": 0
      },
      "Cycling": {
        "miles_pp": 0,
        "km_pp": 0
      },
      "Ebikes": {
        "miles_pp": 0,
        "mechanical_kwhppkm_full": 0.0081,
        "load_factor": 1,
        "prc": {
          "EV": 1
        },
        "efficiency": {
          "EV": 0.8
        },
        "km_pp": 0
      },
      "Rail": {
        "miles_pp": 0,
        "mechanical_kwhppkm_full": 0.027,
        "load_factor": 0.42,
        "prc": {
          "EV": 0.9,
          "H2": 0.04,
          "IC": 0.06
        },
        "efficiency": {
          "EV": 0.9,
          "H2": 0.3564,
          "IC": 0.3
        },
        "km_pp": 0
      },
      "Bus": {
        "miles_pp": 0,
        "mechanical_kwhppkm_full": 0.016,
        "load_factor": 0.42,
        "prc": {
          "EV": 0.9,
          "H2": 0.04,
          "IC": 0.06
        },
        "efficiency": {
          "EV": 0.8,
          "H2": 0.3564,
          "IC": 0.3
        },
        "km_pp": 0
      },
      "Motorbike": {
        "miles_pp": 0,
        "mechanical_kwhppkm_full": 0.054,
        "load_factor": 1.1,
        "prc": {
          "EV": 0.9,
          "H2": 0,
          "IC": 0.1
        },
        "efficiency": {
          "EV": 0.8,
          "H2": 0.3564,
          "IC": 0.3
        },
        "km_pp": 0
      },
      "Cars & Vans": {
        "miles_pp": 0,
        "mechanical_kwhppkm_full": 0.031,
        "load_factor": 0.4,
        "prc": {
          "EV": 0.9,
          "H2": 0.04,
          "IC": 0.06
        },
        "efficiency": {
          "EV": 0.8,
          "H2": 0.3564,
          "IC": 0.3
        },
        "km_pp": 0
      },
      "Aviation": {
        "miles_pp": 0,
        "mechanical_kwhppkm_full": 0.07,
        "load_factor": 0.85,
        "prc": {
          "EV": 0.2,
          "H2": 0,
          "IC": 0.8
        },
        "efficiency": {
          "EV": 0.8,
          "H2": 0.2574,
          "IC": 0.2
        },
        "km_pp": 0
      }
    },
    "electric_car_battery_capacity": 0,
    "electric_car_max_charge_rate": 73.3,
    "smart_charging_enabled": 0,
    "smart_charge_type": "average",
    "V2G_enabled": 0,
    "V2G_discharge_type": "average",
    "rail_freight_elec_demand": 0,
    "freight_BEV_demand": 0,
    "freight_H2_demand": 0,
    "freight_IC_demand": 0
  },
  "industry": {
    "high_temp_process_TWhy": 0,
    "low_temp_process_TWhy": 0,
    "dry_sep_TWhy": 0,
    "other_heat_TWhy": 0,
    "motors_TWhy": 0,
    "compressed_air_TWhy": 0,
    "lighting_TWhy": 0,
    "refrigeration_TWhy": 0,
    "refinery_electric_TWhy": 0,
    "other_non_heat_TWhy": 0,
    "high_temp_process_fixed_elec_prc": 12.5,
    "high_temp_process_fixed_CH4_prc": 32.5,
    "high_temp_process_fixed_H2_prc": 0,
    "high_temp_process_fixed_liquid_prc": 5,
    "high_temp_process_fixed_coal_prc": 0,
    "high_temp_process_fixed_biomass_prc": 10,
    "high_temp_process_DSR_CH4_prc": 40,
    "high_temp_process_DSR_H2_prc": 0,
    "low_temp_process_fixed_elec_prc": 33,
    "low_temp_process_fixed_CH4_prc": 12,
    "low_temp_process_fixed_H2_prc": 0,
    "low_temp_process_fixed_liquid_prc": 5,
    "low_temp_process_fixed_coal_prc": 0,
    "low_temp_process_fixed_biomass_prc": 10,
    "low_temp_process_DSR_CH4_prc": 40,
    "low_temp_process_DSR_H2_prc": 0,
    "dry_sep_fixed_elec_prc": 30,
    "dry_sep_fixed_CH4_prc": 16,
    "dry_sep_fixed_H2_prc": 0,
    "dry_sep_fixed_liquid_prc": 4,
    "dry_sep_fixed_coal_prc": 0,
    "dry_sep_fixed_biomass_prc": 10,
    "dry_sep_DSR_CH4_prc": 40,
    "dry_sep_DSR_H2_prc": 0,
    "other_heat_fixed_elec_prc": 30,
    "other_heat_fixed_CH4_prc": 10,
    "other_heat_fixed_H2_prc": 0,
    "other_heat_fixed_liquid_prc": 0,
    "other_heat_fixed_coal_prc": 0,
    "other_heat_fixed_biomass_prc": 20,
    "other_heat_DSR_CH4_prc": 40,
    "other_heat_DSR_H2_prc": 0,
    "other_non_heat_fixed_elec_prc": 48,
    "other_non_heat_fixed_CH4_prc": 37,
    "other_non_heat_fixed_H2_prc": 0,
    "other_non_heat_fixed_liquid_prc": 5,
    "other_non_heat_fixed_coal_prc": 0,
    "other_non_heat_fixed_biomass_prc": 10
  },
  "electric_storage": {
    "type": "average",
    "capacity_GWh": 0.1,
    "charge_capacity_GW": 0,
    "discharge_capacity_GW": 0,
    "charge_efficiency": 0.95,
    "discharge_efficiency": 0.95
  },
  "hydrogen": {
    "electrolysis_capacity_GW": 0,
    "electrolysis_efficiency": 0.8,
    "storage_capacity_GWh": 0,
    "minimum_store_level": 0.1,
    "hydrogen_from_imports": 0
  },
  "biogas": {
    "biomass_for_biogas": 0,
    "anaerobic_digestion_efficiency": 0.6,
    "co2_tons_per_gwh_methane": 118.7565226835914
  },
  "methane": {
    "methanation_capacity": 0,
    "SOC_start": 0,
    "storage_capacity_GWh": 0
  },
  "synth_fuel": {
    "capacity_GW": 0,
    "store_capacity_GWh": 50000,
    "store_start_GWh": 0,
    "FT_process_biomass_req": 1.3,
    "FT_process_hydrogen_req": 0.61
  },
  "power_to_X": {
    "capacity": 0,
    "prc_gas": 0.44,
    "gas_efficiency": 0.6,
    "prc_liquid": 0.56,
    "liquid_efficiency": 0.6
  },
  "electric_backup": {
    "prc_hydrogen": 0,
    "hydrogen_efficiency": 50,
    "prc_methane": 0,
    "methane_efficiency": 50,
    "prc_biomass": 0,
    "biomass_efficiency": 32,
    "prc_synth_fuel": 0,
    "synth_fuel_efficiency": 21,
    "prc_coal": 0,
    "coal_efficiency": 34
  },
  "energy_industry_use": {
    "electricity_grid_loss_prc": 7,
    "electricity_own_use_prc": 0
  },
  "fossil_fuels": {
    "allow_use_for_backup": 0,
    "other_gas_use": 0,
    "other_oil_use": 0,
    "other_coal_use": 0
  },
  "land_use": {
    "existing_natural_broadleaf_woodland": 139,
    "existing_natural_coniferous_woodland": 151,
    "existing_productive_broadleaf_woodland": 1247,
    "existing_productive_coniferous_woodland": 1357,
    "new_natural_broadleaf_woodland": 1000,
    "new_natural_coniferous_woodland": 1000,
    "new_productive_broadleaf_woodland": 600,
    "new_productive_coniferous_woodland": 700,
    "short_rotation_forestry": 1660,
    "short_rotation_coppice": -246.8368139600338,
    "perrennial_grass_miscanthus": 0,
    "rotational_grass_ryegrass": 0,
    "intensive_and_rough_grazing": 2833,
    "annual_grass_hemp": 320,
    "food_crops": 3408,
    "feed_crops_for_livestock": 1210,
    "mountain_heath_and_bog": 3566,
    "semi_natural_grassland": 155,
    "coastal_and_freshwater": 692,
    "urban_areas": 1459
  },
  "emissions_balance": {
    "power_station": 0,
    "manufacture_solid_fuels": 0,
    "coal_mining_handling": 0.448,
    "upstream_ch4_leakage": 0.064,
    "oil_and_gas_flaring_venting": 0,
    "refrigerants": 2.34,
    "other_foams_solvents_aerosols": 1.05,
    "transport_ch4_and_n2o": 0,
    "domestic_combustion_ch4_and_n20": 0,
    "domestic_aerosols": 0,
    "cement": 3.67,
    "iron_steel_and_sinter": 2.52,
    "lime": 0.789,
    "ammonia": 0,
    "glass": 0.276,
    "bricks": 0,
    "other_process_emissions": 1.07,
    "agriculture_total": 19.646,
    "biomass_burning": 0.3,
    "land_remaining_and_converted_to_grassland": 0,
    "land_remaining_and_converted_to_cropland": 0,
    "land_remaining_and_converted_to_settlements": 2.44,
    "land_remaining_and_converted_to_wetlands": -1.926,
    "land_use_n2o": 0,
    "landfill": 3.86,
    "waste_water_handling": 0.879,
    "waste_incineration": 0.377,
    "composting": 0,
    "anaerobic_digestion": 0,
    "mechanical_biological_treatment": 0,
    "landfill_carbon_capture": -4.267,
    "fossil_fuel_coal": 0,
    "fossil_fuel_oil": 0,
    "fossil_fuel_gas": 0,
    "reforestation": -27.7906,
    "harvested_wood": -11.925362166666666,
    "biochar_carbon_capture": -1.5369993545454546,
    "international_aviation_bunkers": 0
  },
  "EE": {
    "onshorewind_GWh_per_GW": 1435,
    "offshorewind_GWh_per_GW": 2700,
    "solarpv_GWh_per_GW": 1680,
    "onshorewind_lifespan": 25,
    "offshorewind_lifespan": 25,
    "solarpv_lifespan": 30
  }
}
}


