var scenarios = {
  "2018 Energy Demand (ZCB Technology assumptions)": {
    "units_mode": "TWhyr",
    "hours": 87648,
    "population_2030": 70499802,
    "households_2030": 29941701,
    "number_of_households": 29941701,
    "use_flat_profiles": 0,
    "supply": {
      "offshore_wind_capacity": 240,
      "offshore_wind_availability": 0.9,
      "onshore_wind_capacity": 30,
      "onshore_wind_availability": 0.9,
      "wave_capacity": 10,
      "tidal_capacity": 20,
      "solarpv_capacity": 90,
      "solarthermal_capacity": 30,
      "hydro_capacity": 3,
      "hydro_capacity_factor": 0.3,
      "geothermal_elec_capacity": 3,
      "geothermal_elec_capacity_factor": 0.9,
      "geothermal_heat_capacity": 2,
      "geothermal_heat_capacity_factor": 0.9,
      "nuclear_capacity": 0,
      "nuclear_capacity_factor": 0.9,
      "grid_loss_prc": 0.07
    },
    "LAC": {
      "domestic": {
        "lighting_and_appliances_TWhy": 76.6,
        "cooking_TWhy": 13.2
      },
      "services": {
        "lighting_and_appliances_TWhy": 43.6,
        "catering_TWhy": 25.3,
        "cooling_TWhy": 9
      }
    },
    "space_heating": {
      "domestic_demand_GWK": 9.3,
      "services_demand_GWK": 3.35,
      "industry_demand_GWK": 0.67,
      "base_temperature": 13.07
    },
    "water_heating": {
      "domestic_TWhy": 82.2,
      "services_TWhy": 15.9
    },
    "heatstore": {
      "enabled": false,
      "storage_capacity": 100,
      "charge_capacity": 50
    },
    "heating_systems": {
      "heatpump": {
        "name": "Heat pumps",
        "share": 90,
        "efficiency": 300
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
        "share": 5,
        "efficiency": 90
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
            "EV": 0.9,
            "H2": 0.04,
            "IC": 0.06
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
          "mechanical_kwhppkm_full": 0.016,
          "load_factor": 0.1432,
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
          "km_pp": 523.0368000000001
        },
        "Motorbike": {
          "miles_pp": 46,
          "mechanical_kwhppkm_full": 0.054,
          "load_factor": 1.071,
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
          "km_pp": 74.029824
        },
        "Cars & Vans": {
          "miles_pp": 6299,
          "mechanical_kwhppkm_full": 0.031,
          "load_factor": 0.3288,
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
          "km_pp": 10137.257856
        },
        "Aviation": {
          "miles_pp": 3438,
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
          "km_pp": 5532.924672
        }
      },
      "electric_car_battery_capacity": 513,
      "electric_car_max_charge_rate": 73.3,
      "smart_charging_enabled": 0,
      "smart_charge_type": "average",
      "V2G_enabled": 0,
      "V2G_discharge_type": "average",
      "rail_freight_elec_demand": 1,
      "freight_BEV_demand": 21,
      "freight_H2_demand": 8,
      "freight_IC_demand": 40
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
      "other_non_heat_TWhy": 18.4,
      "high_temp_process_fixed_elec_prc": 12.5,
      "high_temp_process_fixed_CH4_prc": 32.5,
      "high_temp_process_fixed_H2_prc": 0,
      "high_temp_process_fixed_liquid_prc": 5,
      "high_temp_process_fixed_biomass_prc": 10,
      "high_temp_process_DSR_CH4_prc": 40,
      "high_temp_process_DSR_H2_prc": 0,
      "low_temp_process_fixed_elec_prc": 33,
      "low_temp_process_fixed_CH4_prc": 12,
      "low_temp_process_fixed_H2_prc": 0,
      "low_temp_process_fixed_liquid_prc": 5,
      "low_temp_process_fixed_biomass_prc": 10,
      "low_temp_process_DSR_CH4_prc": 40,
      "low_temp_process_DSR_H2_prc": 0,
      "dry_sep_fixed_elec_prc": 30,
      "dry_sep_fixed_CH4_prc": 16,
      "dry_sep_fixed_H2_prc": 0,
      "dry_sep_fixed_liquid_prc": 4,
      "dry_sep_fixed_biomass_prc": 10,
      "dry_sep_DSR_CH4_prc": 40,
      "dry_sep_DSR_H2_prc": 0,
      "other_heat_fixed_elec_prc": 30,
      "other_heat_fixed_CH4_prc": 10,
      "other_heat_fixed_H2_prc": 0,
      "other_heat_fixed_liquid_prc": 0,
      "other_heat_fixed_biomass_prc": 20,
      "other_heat_DSR_CH4_prc": 40,
      "other_heat_DSR_H2_prc": 0,
      "other_non_heat_fixed_elec_prc": 48,
      "other_non_heat_fixed_CH4_prc": 37,
      "other_non_heat_fixed_H2_prc": 0,
      "other_non_heat_fixed_liquid_prc": 5,
      "other_non_heat_fixed_biomass_prc": 10
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
      "electrolysis_capacity_GW": 43,
      "electrolysis_efficiency": 0.8,
      "storage_capacity_GWh": 30000,
      "minimum_store_level": 0.1
    },
    "biogas": {
      "biomass_for_biogas": 100,
      "anaerobic_digestion_efficiency": 0.6,
      "co2_tons_per_gwh_methane": 118.7565226835914
    },
    "methane": {
      "methanation_capacity": 20,
      "SOC_start": 10000,
      "storage_capacity_GWh": 120000
    },
    "synth_fuel": {
      "capacity_GW": 20.2,
      "store_capacity_GWh": 50000,
      "store_start_GWh": 5000,
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
      "methane_turbine_capacity": 120,
      "methane_turbine_efficiency": 0.5,
      "hydrogen_turbine_capacity": 0,
      "hydrogen_turbine_efficiency": 0.5
    },
    "land_use": {
      "existing_natural_broadleaf_woodland": 139,
      "existing_natural_coniferous_woodland": 151,
      "existing_productive_broadleaf_woodland": 1247,
      "existing_productive_coniferous_woodland": 1357,
      "new_natural_broadleaf_woodland": 1000,
      "new_natural_coniferous_woodland": 2750,
      "new_productive_broadleaf_woodland": 700,
      "new_productive_coniferous_woodland": 700,
      "short_rotation_forestry": 1660,
      "short_rotation_coppice": 580.3711385094086,
      "perrennial_grass_miscanthus": 3747.070289510326,
      "rotational_grass_ryegrass": 1398.6236778386647,
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
      "disused_mines": 0.448,
      "gas_leakage": 0.064,
      "refrigerants": 2.34,
      "other_foams_solvents_aerosols": 1.05,
      "iron_and_steel": 2.52,
      "cement": 3.67,
      "lime": 0.789,
      "soda_ash": 0.105,
      "glass": 0.276,
      "aluminium": 0.583,
      "other": 0.382,
      "agriculture_total": 19.646,
      "biomass_burning": 0.3,
      "reforestation": -43.98210000000001,
      "harvested_wood": -11.991862166666666,
      "wetlands": -1.926,
      "settlements": 2.44,
      "landfill": 3.86,
      "waste_water_handling": 0.879,
      "waste_incineration": 0.377,
      "international_aviation_bunkers": 23.67161933152349,
      "biochar_carbon_capture": -1.5383357181818182,
      "landfill_carbon_capture": -4.267
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
  "2018 Energy Demand (More H2 rather than synth fuel demand, plus power-to-x technology)": {
    "units_mode": "TWhyr",
    "hours": 87648,
    "population_2030": 70499802,
    "households_2030": 29941701,
    "number_of_households": 29941701,
    "use_flat_profiles": 0,
    "supply": {
      "offshore_wind_capacity": 260,
      "offshore_wind_availability": 0.9,
      "onshore_wind_capacity": 30,
      "onshore_wind_availability": 0.9,
      "wave_capacity": 10,
      "tidal_capacity": 20,
      "solarpv_capacity": 90,
      "solarthermal_capacity": 30,
      "hydro_capacity": 3,
      "hydro_capacity_factor": 0.3,
      "geothermal_elec_capacity": 3,
      "geothermal_elec_capacity_factor": 0.9,
      "geothermal_heat_capacity": 2,
      "geothermal_heat_capacity_factor": 0.9,
      "nuclear_capacity": 0,
      "nuclear_capacity_factor": 0.9,
      "grid_loss_prc": 0.07
    },
    "LAC": {
      "domestic": {
        "lighting_and_appliances_TWhy": 76.6,
        "cooking_TWhy": 13.2
      },
      "services": {
        "lighting_and_appliances_TWhy": 43.6,
        "catering_TWhy": 25.3,
        "cooling_TWhy": 9
      }
    },
    "space_heating": {
      "domestic_demand_GWK": 9.3,
      "services_demand_GWK": 3.35,
      "industry_demand_GWK": 0.67,
      "base_temperature": 13.07
    },
    "water_heating": {
      "domestic_TWhy": 82.2,
      "services_TWhy": 15.9
    },
    "heatstore": {
      "enabled": false,
      "storage_capacity": 100,
      "charge_capacity": 50
    },
    "heating_systems": {
      "heatpump": {
        "name": "Heat pumps",
        "share": 92,
        "efficiency": 300
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
        "share": 3,
        "efficiency": 90
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
            "EV": 0.9,
            "H2": 0.04,
            "IC": 0.06
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
          "mechanical_kwhppkm_full": 0.016,
          "load_factor": 0.1432,
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
          "km_pp": 523.0368000000001
        },
        "Motorbike": {
          "miles_pp": 46,
          "mechanical_kwhppkm_full": 0.054,
          "load_factor": 1.071,
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
          "km_pp": 74.029824
        },
        "Cars & Vans": {
          "miles_pp": 6299,
          "mechanical_kwhppkm_full": 0.031,
          "load_factor": 0.3288,
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
          "km_pp": 10137.257856
        },
        "Aviation": {
          "miles_pp": 3438,
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
          "km_pp": 5532.924672
        }
      },
      "electric_car_battery_capacity": 513,
      "electric_car_max_charge_rate": 73.3,
      "smart_charging_enabled": 0,
      "smart_charge_type": "average",
      "V2G_enabled": 0,
      "V2G_discharge_type": "average",
      "rail_freight_elec_demand": 1,
      "freight_BEV_demand": 31,
      "freight_H2_demand": 8,
      "freight_IC_demand": 10
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
      "other_non_heat_TWhy": 18.4,
      "high_temp_process_fixed_elec_prc": 20,
      "high_temp_process_fixed_CH4_prc": 15,
      "high_temp_process_fixed_H2_prc": 20,
      "high_temp_process_fixed_liquid_prc": 0,
      "high_temp_process_fixed_biomass_prc": 0,
      "high_temp_process_DSR_CH4_prc": 45,
      "high_temp_process_DSR_H2_prc": 0,
      "low_temp_process_fixed_elec_prc": 35,
      "low_temp_process_fixed_CH4_prc": 6,
      "low_temp_process_fixed_H2_prc": 14,
      "low_temp_process_fixed_liquid_prc": 0,
      "low_temp_process_fixed_biomass_prc": 0,
      "low_temp_process_DSR_CH4_prc": 45,
      "low_temp_process_DSR_H2_prc": 0,
      "dry_sep_fixed_elec_prc": 35,
      "dry_sep_fixed_CH4_prc": 6,
      "dry_sep_fixed_H2_prc": 14,
      "dry_sep_fixed_liquid_prc": 0,
      "dry_sep_fixed_biomass_prc": 0,
      "dry_sep_DSR_CH4_prc": 45,
      "dry_sep_DSR_H2_prc": 0,
      "other_heat_fixed_elec_prc": 35,
      "other_heat_fixed_CH4_prc": 5,
      "other_heat_fixed_H2_prc": 15,
      "other_heat_fixed_liquid_prc": 0,
      "other_heat_fixed_biomass_prc": 0,
      "other_heat_DSR_CH4_prc": 45,
      "other_heat_DSR_H2_prc": 0,
      "other_non_heat_fixed_elec_prc": 55,
      "other_non_heat_fixed_CH4_prc": 20,
      "other_non_heat_fixed_H2_prc": 10,
      "other_non_heat_fixed_liquid_prc": 5,
      "other_non_heat_fixed_biomass_prc": 10
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
      "electrolysis_capacity_GW": 23.5,
      "electrolysis_efficiency": 0.8,
      "storage_capacity_GWh": 30000,
      "minimum_store_level": 0.1
    },
    "biogas": {
      "biomass_for_biogas": 31,
      "anaerobic_digestion_efficiency": 0.6,
      "co2_tons_per_gwh_methane": 118.7565226835914
    },
    "methane": {
      "methanation_capacity": 20,
      "SOC_start": 20000,
      "storage_capacity_GWh": 120000
    },
    "synth_fuel": {
      "capacity_GW": 9.1,
      "store_capacity_GWh": 50000,
      "store_start_GWh": 5000,
      "FT_process_biomass_req": 1.3,
      "FT_process_hydrogen_req": 0.61
    },
    "power_to_X": {
      "capacity": 34,
      "prc_gas": 0.45,
      "gas_efficiency": 0.75,
      "prc_liquid": 0.55,
      "liquid_efficiency": 0.75
    },
    "electric_backup": {
      "methane_turbine_capacity": 120,
      "methane_turbine_efficiency": 0.5,
      "hydrogen_turbine_capacity": 0,
      "hydrogen_turbine_efficiency": 0.5
    },
    "land_use": {
      "existing_natural_broadleaf_woodland": 139,
      "existing_natural_coniferous_woodland": 151,
      "existing_productive_broadleaf_woodland": 1247,
      "existing_productive_coniferous_woodland": 1357,
      "new_natural_broadleaf_woodland": 1000,
      "new_natural_coniferous_woodland": 2350,
      "new_productive_broadleaf_woodland": 700,
      "new_productive_coniferous_woodland": 700,
      "short_rotation_forestry": 1550,
      "short_rotation_coppice": 96.28259612325955,
      "perrennial_grass_miscanthus": 1764.300816075194,
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
      "disused_mines": 0.448,
      "gas_leakage": 0.064,
      "refrigerants": 2.34,
      "other_foams_solvents_aerosols": 1.05,
      "iron_and_steel": 1,
      "cement": 1.85,
      "lime": 0.35,
      "soda_ash": 0.05,
      "glass": 0.276,
      "aluminium": 0.583,
      "other": 0.382,
      "agriculture_total": 19.646,
      "biomass_burning": 0.3,
      "reforestation": -39.9795,
      "harvested_wood": -11.824222166666665,
      "wetlands": -1.926,
      "settlements": 2.44,
      "landfill": 3.86,
      "waste_water_handling": 0.879,
      "waste_incineration": 0.15,
      "international_aviation_bunkers": 23.67161933152349,
      "biochar_carbon_capture": -1.5276677181818183,
      "landfill_carbon_capture": -4.267
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
  "2018 Energy Demand and Supply (Rough baseline)": {
    "units_mode": "TWhyr",
    "hours": 87648,
    "population_2030": 70499802,
    "households_2030": 29941701,
    "number_of_households": 29941701,
    "use_flat_profiles": 0,
    "supply": {
      "offshore_wind_capacity": 10.3,
      "offshore_wind_availability": 0.9,
      "onshore_wind_capacity": 14.3,
      "onshore_wind_availability": 0.9,
      "wave_capacity": 0,
      "tidal_capacity": 0,
      "solarpv_capacity": 13,
      "solarthermal_capacity": 1,
      "hydro_capacity": 1.8,
      "hydro_capacity_factor": 0.3,
      "geothermal_elec_capacity": 0,
      "geothermal_elec_capacity_factor": 0.9,
      "geothermal_heat_capacity": 0,
      "geothermal_heat_capacity_factor": 0.9,
      "nuclear_capacity": 6,
      "nuclear_capacity_factor": 0.9,
      "grid_loss_prc": 0.07
    },
    "LAC": {
      "domestic": {
        "lighting_and_appliances_TWhy": 76.6,
        "cooking_TWhy": 13.2
      },
      "services": {
        "lighting_and_appliances_TWhy": 43.6,
        "catering_TWhy": 25.3,
        "cooling_TWhy": 9
      }
    },
    "space_heating": {
      "domestic_demand_GWK": 9.3,
      "services_demand_GWK": 3.35,
      "industry_demand_GWK": 0.67,
      "base_temperature": 13.07
    },
    "water_heating": {
      "domestic_TWhy": 82.2,
      "services_TWhy": 15.9
    },
    "heatstore": {
      "enabled": false,
      "storage_capacity": 100,
      "charge_capacity": 50
    },
    "heating_systems": {
      "heatpump": {
        "name": "Heat pumps",
        "share": 2.5,
        "efficiency": 300
      },
      "elres": {
        "name": "Direct electric",
        "share": 5,
        "efficiency": 100
      },
      "methane": {
        "name": "Methane gas boilers",
        "share": 74.2,
        "efficiency": 70
      },
      "hydrogen": {
        "name": "Hydrogen gas boilers",
        "share": 0,
        "efficiency": 80
      },
      "synthfuel": {
        "name": "Oil boilers",      
        "share": 9.7,
        "efficiency": 90
      },
      "biomass": {
        "name": "Biomass boilers",
        "share": 8.6,
        "efficiency": 80
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
            "EV": 0.5,
            "H2": 0,
            "IC": 0.5
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
          "mechanical_kwhppkm_full": 0.018,
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
            "IC": 0.3
          },
          "km_pp": 74.029824
        },
        "Cars & Vans": {
          "miles_pp": 6299,
          "mechanical_kwhppkm_full": 0.041,
          "load_factor": 0.3288,
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
          "km_pp": 10137.257856
        },
        "Aviation": {
          "miles_pp": 3438,
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
      "rail_freight_elec_demand": 1,
      "freight_BEV_demand": 0,
      "freight_H2_demand": 0,
      "freight_IC_demand": 181.2
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
      "other_non_heat_TWhy": 46.2,
      "high_temp_process_fixed_elec_prc": 12.5,
      "high_temp_process_fixed_CH4_prc": 70.5,
      "high_temp_process_fixed_H2_prc": 0,
      "high_temp_process_fixed_liquid_prc": 10,
      "high_temp_process_fixed_biomass_prc": 7,
      "high_temp_process_DSR_CH4_prc": 0,
      "high_temp_process_DSR_H2_prc": 0,
      "low_temp_process_fixed_elec_prc": 30,
      "low_temp_process_fixed_CH4_prc": 43,
      "low_temp_process_fixed_H2_prc": 0,
      "low_temp_process_fixed_liquid_prc": 20,
      "low_temp_process_fixed_biomass_prc": 7,
      "low_temp_process_DSR_CH4_prc": 0,
      "low_temp_process_DSR_H2_prc": 0,
      "dry_sep_fixed_elec_prc": 30,
      "dry_sep_fixed_CH4_prc": 43,
      "dry_sep_fixed_H2_prc": 0,
      "dry_sep_fixed_liquid_prc": 20,
      "dry_sep_fixed_biomass_prc": 7,
      "dry_sep_DSR_CH4_prc": 0,
      "dry_sep_DSR_H2_prc": 0,
      "other_heat_fixed_elec_prc": 30,
      "other_heat_fixed_CH4_prc": 43,
      "other_heat_fixed_H2_prc": 0,
      "other_heat_fixed_liquid_prc": 20,
      "other_heat_fixed_biomass_prc": 7,
      "other_heat_DSR_CH4_prc": 0,
      "other_heat_DSR_H2_prc": 0,
      "other_non_heat_fixed_elec_prc": 15,
      "other_non_heat_fixed_CH4_prc": 68,
      "other_non_heat_fixed_H2_prc": 0,
      "other_non_heat_fixed_liquid_prc": 10,
      "other_non_heat_fixed_biomass_prc": 7
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
      "storage_capacity_GWh": 0,
      "minimum_store_level": 0.1
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
      "methane_turbine_capacity": 60,
      "methane_turbine_efficiency": 0.5,
      "hydrogen_turbine_capacity": 0,
      "hydrogen_turbine_efficiency": 0.5
    },
    "fossil_fuels": {
      "allow_use_for_backup": true
    },
    "land_use": {
      "existing_natural_broadleaf_woodland": 139,
      "existing_natural_coniferous_woodland": 151,
      "existing_productive_broadleaf_woodland": 1247,
      "existing_productive_coniferous_woodland": 1357,
      "new_natural_broadleaf_woodland": 1000,
      "new_natural_coniferous_woodland": 2750,
      "new_productive_broadleaf_woodland": 700,
      "new_productive_coniferous_woodland": 700,
      "short_rotation_forestry": 1660,
      "short_rotation_coppice": 587.1494160779091,
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
      "disused_mines": 0.448,
      "gas_leakage": 0.064,
      "refrigerants": 2.34,
      "other_foams_solvents_aerosols": 1.05,
      "iron_and_steel": 2.52,
      "cement": 3.67,
      "lime": 0.789,
      "soda_ash": 0.105,
      "glass": 0.276,
      "aluminium": 0.583,
      "other": 0.382,
      "agriculture_total": 19.646,
      "biomass_burning": 0.3,
      "reforestation": -43.98210000000001,
      "harvested_wood": -11.991862166666666,
      "wetlands": -1.926,
      "settlements": 2.44,
      "landfill": 3.86,
      "waste_water_handling": 0.879,
      "waste_incineration": 0.377,
      "international_aviation_bunkers": 29.589524164404363,
      "biochar_carbon_capture": -1.5383357181818182,
      "landfill_carbon_capture": -4.267,
      "fossil_fuel_oil": 132.02624156335042,
      "fossil_fuel_gas": 191.97079538396923
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
  "Lower demand (very low aviation, low car use, 25% less industrial energy than 2018)":{
    "units_mode": "TWhyr",
    "hours": 87648,
    "population_2030": 70499802,
    "households_2030": 29941701,
    "number_of_households": 29941701,
    "use_flat_profiles": 0,
    "supply": {
      "offshore_wind_capacity": 70,
      "offshore_wind_availability": 0.9,
      "onshore_wind_capacity": 30,
      "onshore_wind_availability": 0.9,
      "wave_capacity": 10,
      "tidal_capacity": 20,
      "solarpv_capacity": 70,
      "solarthermal_capacity": 30,
      "hydro_capacity": 3,
      "hydro_capacity_factor": 0.3,
      "geothermal_elec_capacity": 3,
      "geothermal_elec_capacity_factor": 0.9,
      "geothermal_heat_capacity": 2,
      "geothermal_heat_capacity_factor": 0.9,
      "nuclear_capacity": 0,
      "nuclear_capacity_factor": 0.9,
      "grid_loss_prc": 0.07
    },
    "LAC": {
      "domestic": {
        "lighting_and_appliances_TWhy": 38.59,
        "cooking_TWhy": 10.47
      },
      "services": {
        "lighting_and_appliances_TWhy": 41.41,
        "catering_TWhy": 16.85,
        "cooling_TWhy": 4.55
      }
    },
    "space_heating": {
      "domestic_demand_GWK": 3.435,
      "services_demand_GWK": 1.486,
      "industry_demand_GWK": 0.252,
      "base_temperature": 13.07
    },
    "water_heating": {
      "domestic_TWhy": 65,
      "services_TWhy": 12.01
    },
    "heatstore": {
      "enabled": false,
      "storage_capacity": 100,
      "charge_capacity": 50
    },
    "heating_systems": {
      "heatpump": {
        "name": "Heat pumps",
        "share": 90,
        "efficiency": 350
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
        "share": 5,
        "efficiency": 90
      }
    },
    "transport": {
      "km_per_mile": 1.609344,
      "modes": {
        "Walking": {
          "miles_pp": 186,
          "km_pp": 299.337984
        },
        "Cycling": {
          "miles_pp": 168,
          "km_pp": 270.369792
        },
        "Ebikes": {
          "miles_pp": 155,
          "mechanical_kwhppkm_full": 0.0081,
          "load_factor": 1,
          "prc": {
            "EV": 1
          },
          "efficiency": {
            "EV": 0.8
          },
          "km_pp": 249.44832000000002
        },
        "Rail": {
          "miles_pp": 2000,
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
          "km_pp": 3218.688
        },
        "Bus": {
          "miles_pp": 1500,
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
          "km_pp": 2414.016
        },
        "Motorbike": {
          "miles_pp": 186,
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
          "km_pp": 299.337984
        },
        "Cars & Vans": {
          "miles_pp": 1000,
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
          "km_pp": 1609.344
        },
        "Aviation": {
          "miles_pp": 250,
          "mechanical_kwhppkm_full": 0.07,
          "load_factor": 0.85,
          "prc": {
            "EV": 0.8,
            "H2": 0,
            "IC": 0.2
          },
          "efficiency": {
            "EV": 0.8,
            "H2": 0.2574,
            "IC": 0.2
          },
          "km_pp": 402.336
        }
      },
      "electric_car_battery_capacity": 513,
      "electric_car_max_charge_rate": 73.3,
      "smart_charging_enabled": 0,
      "smart_charge_type": "average",
      "V2G_enabled": 0,
      "V2G_discharge_type": "average",
      "rail_freight_elec_demand": 2,
      "freight_BEV_demand": 15,
      "freight_H2_demand": 4.06,
      "freight_IC_demand": 2
    },
    "industry": {
      "high_temp_process_TWhy": 30,
      "low_temp_process_TWhy": 48,
      "dry_sep_TWhy": 15.3,
      "other_heat_TWhy": 18.5,
      "motors_TWhy": 23.8,
      "compressed_air_TWhy": 6.7,
      "lighting_TWhy": 2,
      "refrigeration_TWhy": 4,
      "other_non_heat_TWhy": 13.8,
      "high_temp_process_fixed_elec_prc": 12.5,
      "high_temp_process_fixed_CH4_prc": 32.5,
      "high_temp_process_fixed_H2_prc": 0,
      "high_temp_process_fixed_liquid_prc": 5,
      "high_temp_process_fixed_biomass_prc": 10,
      "high_temp_process_DSR_CH4_prc": 40,
      "high_temp_process_DSR_H2_prc": 0,
      "low_temp_process_fixed_elec_prc": 33,
      "low_temp_process_fixed_CH4_prc": 12,
      "low_temp_process_fixed_H2_prc": 0,
      "low_temp_process_fixed_liquid_prc": 5,
      "low_temp_process_fixed_biomass_prc": 10,
      "low_temp_process_DSR_CH4_prc": 40,
      "low_temp_process_DSR_H2_prc": 0,
      "dry_sep_fixed_elec_prc": 30,
      "dry_sep_fixed_CH4_prc": 16,
      "dry_sep_fixed_H2_prc": 0,
      "dry_sep_fixed_liquid_prc": 4,
      "dry_sep_fixed_biomass_prc": 10,
      "dry_sep_DSR_CH4_prc": 40,
      "dry_sep_DSR_H2_prc": 0,
      "other_heat_fixed_elec_prc": 30,
      "other_heat_fixed_CH4_prc": 10,
      "other_heat_fixed_H2_prc": 0,
      "other_heat_fixed_liquid_prc": 0,
      "other_heat_fixed_biomass_prc": 20,
      "other_heat_DSR_CH4_prc": 40,
      "other_heat_DSR_H2_prc": 0,
      "other_non_heat_fixed_elec_prc": 48,
      "other_non_heat_fixed_CH4_prc": 37,
      "other_non_heat_fixed_H2_prc": 0,
      "other_non_heat_fixed_liquid_prc": 5,
      "other_non_heat_fixed_biomass_prc": 10
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
      "electrolysis_capacity_GW": 15,
      "electrolysis_efficiency": 0.8,
      "storage_capacity_GWh": 20000,
      "minimum_store_level": 0.1
    },
    "biogas": {
      "biomass_for_biogas": 70,
      "anaerobic_digestion_efficiency": 0.6,
      "co2_tons_per_gwh_methane": 118.7565226835914
    },
    "methane": {
      "methanation_capacity": 5.15,
      "SOC_start": 10000,
      "storage_capacity_GWh": 60000
    },
    "synth_fuel": {
      "capacity_GW": 1.9,
      "store_capacity_GWh": 50000,
      "store_start_GWh": 5000,
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
      "methane_turbine_capacity": 70,
      "methane_turbine_efficiency": 0.5,
      "hydrogen_turbine_capacity": 0,
      "hydrogen_turbine_efficiency": 0.5
    },
    "land_use": {
      "existing_natural_broadleaf_woodland": 139,
      "existing_natural_coniferous_woodland": 151,
      "existing_productive_broadleaf_woodland": 1247,
      "existing_productive_coniferous_woodland": 1357,
      "new_natural_broadleaf_woodland": 1000,
      "new_natural_coniferous_woodland": 2843,
      "new_productive_broadleaf_woodland": 700,
      "new_productive_coniferous_woodland": 700,
      "short_rotation_forestry": 1660,
      "short_rotation_coppice": 211.65945542926303,
      "perrennial_grass_miscanthus": 314.43673896405477,
      "rotational_grass_ryegrass": 761.4374920351728,
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
      "disused_mines": 0.448,
      "gas_leakage": 0.064,
      "refrigerants": 2.34,
      "other_foams_solvents_aerosols": 1.05,
      "iron_and_steel": 2.52,
      "cement": 3.67,
      "lime": 0.789,
      "soda_ash": 0.105,
      "glass": 0.276,
      "aluminium": 0.583,
      "other": 0.382,
      "agriculture_total": 19.646,
      "biomass_burning": 0.3,
      "reforestation": -44.829330000000006,
      "harvested_wood": -11.991862166666666,
      "wetlands": -1.926,
      "settlements": 2.44,
      "landfill": 3.86,
      "waste_water_handling": 0.879,
      "waste_incineration": 0.377,
      "international_aviation_bunkers": 0.4303304852298483,
      "biochar_carbon_capture": -1.5383357181818182,
      "landfill_carbon_capture": -4.267
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
  "Aviation: Only electric and H2 fuel cell": {
    "units_mode": "TWhyr",
    "hours": 87648,
    "population_2030": 70499802,
    "households_2030": 29941701,
    "number_of_households": 29941701,
    "use_flat_profiles": 0,
    "supply": {
      "offshore_wind_capacity": 140,
      "offshore_wind_availability": 0.9,
      "onshore_wind_capacity": 30,
      "onshore_wind_availability": 0.9,
      "wave_capacity": 10,
      "tidal_capacity": 20,
      "solarpv_capacity": 90,
      "solarthermal_capacity": 30,
      "hydro_capacity": 3,
      "hydro_capacity_factor": 0.3,
      "geothermal_elec_capacity": 3,
      "geothermal_elec_capacity_factor": 0.9,
      "geothermal_heat_capacity": 2,
      "geothermal_heat_capacity_factor": 0.9,
      "nuclear_capacity": 0,
      "nuclear_capacity_factor": 0.9,
      "grid_loss_prc": 0.07
    },
    "LAC": {
      "domestic": {
        "lighting_and_appliances_TWhy": 38.59,
        "cooking_TWhy": 10.47
      },
      "services": {
        "lighting_and_appliances_TWhy": 41.41,
        "catering_TWhy": 16.85,
        "cooling_TWhy": 4.55
      }
    },
    "space_heating": {
      "domestic_demand_GWK": 3.435,
      "services_demand_GWK": 1.486,
      "industry_demand_GWK": 0.502,
      "base_temperature": 13.07
    },
    "water_heating": {
      "domestic_TWhy": 70.36,
      "services_TWhy": 12.01
    },
    "heatstore": {
      "enabled": false,
      "storage_capacity": 100,
      "charge_capacity": 50
    },
    "heating_systems": {
      "heatpump": {
        "name": "Heat pumps",
        "share": 90,
        "efficiency": 300
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
        "share": 5,
        "efficiency": 90
      }
    },
    "transport": {
      "km_per_mile": 1.609344,
      "modes": {
        "Walking": {
          "miles_pp": 186,
          "km_pp": 299.337984
        },
        "Cycling": {
          "miles_pp": 168,
          "km_pp": 270.369792
        },
        "Ebikes": {
          "miles_pp": 155,
          "mechanical_kwhppkm_full": 0.0081,
          "load_factor": 1,
          "prc": {
            "EV": 1
          },
          "efficiency": {
            "EV": 0.8
          },
          "km_pp": 249.44832000000002
        },
        "Rail": {
          "miles_pp": 808,
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
          "km_pp": 1300.349952
        },
        "Bus": {
          "miles_pp": 1150,
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
          "km_pp": 1850.7456000000002
        },
        "Motorbike": {
          "miles_pp": 186,
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
          "km_pp": 299.337984
        },
        "Cars & Vans": {
          "miles_pp": 4350,
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
          "km_pp": 7000.6464000000005
        },
        "Aviation": {
          "miles_pp": 1118,
          "mechanical_kwhppkm_full": 0.07,
          "load_factor": 0.85,
          "prc": {
            "EV": 0.5,
            "H2": 0.5,
            "IC": 0
          },
          "efficiency": {
            "EV": 0.8,
            "H2": 0.2574,
            "IC": 0.2
          },
          "km_pp": 1799.2465920000002
        }
      },
      "electric_car_battery_capacity": 513,
      "electric_car_max_charge_rate": 73.3,
      "smart_charging_enabled": 0,
      "smart_charge_type": "average",
      "V2G_enabled": 0,
      "V2G_discharge_type": "average",
      "rail_freight_elec_demand": 2,
      "freight_BEV_demand": 10.5,
      "freight_H2_demand": 4.06,
      "freight_IC_demand": 20.58
    },
    "industry": {
      "high_temp_process_TWhy": 53,
      "low_temp_process_TWhy": 85,
      "dry_sep_TWhy": 27,
      "other_heat_TWhy": 33,
      "motors_TWhy": 42,
      "compressed_air_TWhy": 12,
      "lighting_TWhy": 4,
      "refrigeration_TWhy": 7,
      "other_non_heat_TWhy": 25,
      "high_temp_process_fixed_elec_prc": 12.5,
      "high_temp_process_fixed_CH4_prc": 32.5,
      "high_temp_process_fixed_H2_prc": 0,
      "high_temp_process_fixed_liquid_prc": 5,
      "high_temp_process_fixed_biomass_prc": 10,
      "high_temp_process_DSR_CH4_prc": 40,
      "high_temp_process_DSR_H2_prc": 0,
      "low_temp_process_fixed_elec_prc": 33,
      "low_temp_process_fixed_CH4_prc": 12,
      "low_temp_process_fixed_H2_prc": 0,
      "low_temp_process_fixed_liquid_prc": 5,
      "low_temp_process_fixed_biomass_prc": 10,
      "low_temp_process_DSR_CH4_prc": 40,
      "low_temp_process_DSR_H2_prc": 0,
      "dry_sep_fixed_elec_prc": 30,
      "dry_sep_fixed_CH4_prc": 16,
      "dry_sep_fixed_H2_prc": 0,
      "dry_sep_fixed_liquid_prc": 4,
      "dry_sep_fixed_biomass_prc": 10,
      "dry_sep_DSR_CH4_prc": 40,
      "dry_sep_DSR_H2_prc": 0,
      "other_heat_fixed_elec_prc": 30,
      "other_heat_fixed_CH4_prc": 10,
      "other_heat_fixed_H2_prc": 0,
      "other_heat_fixed_liquid_prc": 0,
      "other_heat_fixed_biomass_prc": 20,
      "other_heat_DSR_CH4_prc": 40,
      "other_heat_DSR_H2_prc": 0,
      "other_non_heat_fixed_elec_prc": 48,
      "other_non_heat_fixed_CH4_prc": 37,
      "other_non_heat_fixed_H2_prc": 0,
      "other_non_heat_fixed_liquid_prc": 5,
      "other_non_heat_fixed_biomass_prc": 10
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
      "electrolysis_capacity_GW": 26,
      "electrolysis_efficiency": 0.8,
      "storage_capacity_GWh": 20000,
      "minimum_store_level": 0.1
    },
    "biogas": {
      "biomass_for_biogas": 87,
      "anaerobic_digestion_efficiency": 0.6,
      "co2_tons_per_gwh_methane": 118.7565226835914
    },
    "methane": {
      "methanation_capacity": 5.15,
      "SOC_start": 10000,
      "storage_capacity_GWh": 60000
    },
    "synth_fuel": {
      "capacity_GW": 4.5,
      "store_capacity_GWh": 50000,
      "store_start_GWh": 5000,
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
      "methane_turbine_capacity": 70,
      "methane_turbine_efficiency": 0.5,
      "hydrogen_turbine_capacity": 0,
      "hydrogen_turbine_efficiency": 0.5
    },
    "land_use": {
      "existing_natural_broadleaf_woodland": 139,
      "existing_natural_coniferous_woodland": 151,
      "existing_productive_broadleaf_woodland": 1247,
      "existing_productive_coniferous_woodland": 1357,
      "new_natural_broadleaf_woodland": 1000,
      "new_natural_coniferous_woodland": 1798,
      "new_productive_broadleaf_woodland": 700,
      "new_productive_coniferous_woodland": 700,
      "short_rotation_forestry": 1660,
      "short_rotation_coppice": 420.21466168878277,
      "perrennial_grass_miscanthus": 790.3126972199868,
      "rotational_grass_ryegrass": 1122.5096639904848,
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
      "disused_mines": 0.448,
      "gas_leakage": 0.064,
      "refrigerants": 2.34,
      "other_foams_solvents_aerosols": 1.05,
      "iron_and_steel": 2.52,
      "cement": 3.67,
      "lime": 0.789,
      "soda_ash": 0.105,
      "glass": 0.276,
      "aluminium": 0.583,
      "other": 0.382,
      "agriculture_total": 19.646,
      "biomass_burning": 0.3,
      "reforestation": -35.309380000000004,
      "harvested_wood": -11.991862166666666,
      "wetlands": -1.926,
      "settlements": 2.44,
      "landfill": 3.86,
      "waste_water_handling": 0.879,
      "waste_incineration": 0.377,
      "international_aviation_bunkers": 0,
      "biochar_carbon_capture": -1.5383357181818182,
      "landfill_carbon_capture": -4.267
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
  "ZeroCarbonBritain (No bio-energy)":{
  "units_mode": "TWhyr",
  "hours": 87648,
  "population_2030": 70499802,
  "households_2030": 29941701,
  "number_of_households": 29941701,
  "use_flat_profiles": 0,
  "supply": {
    "offshore_wind_capacity": 195,
    "offshore_wind_availability": 0.9,
    "onshore_wind_capacity": 30,
    "onshore_wind_availability": 0.9,
    "wave_capacity": 10,
    "tidal_capacity": 20,
    "solarpv_capacity": 90,
    "solarthermal_capacity": 30,
    "hydro_capacity": 3,
    "hydro_capacity_factor": 0.3,
    "geothermal_elec_capacity": 3,
    "geothermal_elec_capacity_factor": 0.9,
    "geothermal_heat_capacity": 2,
    "geothermal_heat_capacity_factor": 0.9,
    "nuclear_capacity": 0,
    "nuclear_capacity_factor": 0.9,
    "grid_loss_prc": 0.07
  },
  "LAC": {
    "domestic": {
      "lighting_and_appliances_TWhy": 38.59,
      "cooking_TWhy": 10.47
    },
    "services": {
      "lighting_and_appliances_TWhy": 41.41,
      "catering_TWhy": 16.85,
      "cooling_TWhy": 4.55
    }
  },
  "space_heating": {
    "domestic_demand_GWK": 3.435,
    "services_demand_GWK": 1.486,
    "industry_demand_GWK": 0.502,
    "base_temperature": 13.07
  },
  "water_heating": {
    "domestic_TWhy": 70.36,
    "services_TWhy": 12.01
  },
  "heatstore": {
    "enabled": false,
    "storage_capacity": 100,
    "charge_capacity": 50
  },
  "heating_systems": {
    "heatpump": {
      "name": "Heat pumps",
      "share": 90,
      "efficiency": 300
    },
    "elres": {
      "name": "Direct electric",
      "share": 5,
      "efficiency": 100
    },
    "methane": {
      "name": "Methane gas boilers",
      "share": 5,
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
    }
  },
  "transport": {
    "km_per_mile": 1.609344,
    "modes": {
      "Walking": {
        "miles_pp": 186,
        "km_pp": 299.337984
      },
      "Cycling": {
        "miles_pp": 168,
        "km_pp": 270.369792
      },
      "Ebikes": {
        "miles_pp": 155,
        "mechanical_kwhppkm_full": 0.0081,
        "load_factor": 1,
        "prc": {
          "EV": 1
        },
        "efficiency": {
          "EV": 0.8
        },
        "km_pp": 249.44832000000002
      },
      "Rail": {
        "miles_pp": 808,
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
        "km_pp": 1300.349952
      },
      "Bus": {
        "miles_pp": 1150,
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
        "km_pp": 1850.7456000000002
      },
      "Motorbike": {
        "miles_pp": 186,
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
        "km_pp": 299.337984
      },
      "Cars & Vans": {
        "miles_pp": 4350,
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
        "km_pp": 7000.6464000000005
      },
      "Aviation": {
        "miles_pp": 1118,
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
        "km_pp": 1799.2465920000002
      }
    },
    "electric_car_battery_capacity": 513,
    "electric_car_max_charge_rate": 73.3,
    "smart_charging_enabled": 0,
    "smart_charge_type": "average",
    "V2G_enabled": 0,
    "V2G_discharge_type": "average",
    "rail_freight_elec_demand": 2,
    "freight_BEV_demand": 10.5,
    "freight_H2_demand": 4.06,
    "freight_IC_demand": 20.58
  },
  "industry": {
    "high_temp_process_TWhy": 53,
    "low_temp_process_TWhy": 85,
    "dry_sep_TWhy": 27,
    "other_heat_TWhy": 33,
    "motors_TWhy": 42,
    "compressed_air_TWhy": 12,
    "lighting_TWhy": 4,
    "refrigeration_TWhy": 7,
    "other_non_heat_TWhy": 25,
    "high_temp_process_fixed_elec_prc": 12.5,
    "high_temp_process_fixed_CH4_prc": 32.5,
    "high_temp_process_fixed_H2_prc": 10,
    "high_temp_process_fixed_liquid_prc": 5,
    "high_temp_process_fixed_biomass_prc": 0,
    "high_temp_process_DSR_CH4_prc": 40,
    "high_temp_process_DSR_H2_prc": 0,
    "low_temp_process_fixed_elec_prc": 33,
    "low_temp_process_fixed_CH4_prc": 12,
    "low_temp_process_fixed_H2_prc": 10,
    "low_temp_process_fixed_liquid_prc": 5,
    "low_temp_process_fixed_biomass_prc": 0,
    "low_temp_process_DSR_CH4_prc": 40,
    "low_temp_process_DSR_H2_prc": 0,
    "dry_sep_fixed_elec_prc": 30,
    "dry_sep_fixed_CH4_prc": 16,
    "dry_sep_fixed_H2_prc": 10,
    "dry_sep_fixed_liquid_prc": 4,
    "dry_sep_fixed_biomass_prc": 0,
    "dry_sep_DSR_CH4_prc": 40,
    "dry_sep_DSR_H2_prc": 0,
    "other_heat_fixed_elec_prc": 30,
    "other_heat_fixed_CH4_prc": 10,
    "other_heat_fixed_H2_prc": 20,
    "other_heat_fixed_liquid_prc": 0,
    "other_heat_fixed_biomass_prc": 0,
    "other_heat_DSR_CH4_prc": 40,
    "other_heat_DSR_H2_prc": 0,
    "other_non_heat_fixed_elec_prc": 48,
    "other_non_heat_fixed_CH4_prc": 37,
    "other_non_heat_fixed_H2_prc": 10,
    "other_non_heat_fixed_liquid_prc": 5,
    "other_non_heat_fixed_biomass_prc": 0
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
    "electrolysis_capacity_GW": 6.3,
    "electrolysis_efficiency": 0.8,
    "storage_capacity_GWh": 20000,
    "minimum_store_level": 0.1
  },
  "biogas": {
    "biomass_for_biogas": 0,
    "anaerobic_digestion_efficiency": 0.6,
    "co2_tons_per_gwh_methane": 118.7565226835914
  },
  "methane": {
    "methanation_capacity": 0,
    "SOC_start": 10000,
    "storage_capacity_GWh": 60000
  },
  "synth_fuel": {
    "capacity_GW": 0,
    "store_capacity_GWh": 50000,
    "store_start_GWh": 5000,
    "FT_process_biomass_req": 1.3,
    "FT_process_hydrogen_req": 0.61
  },
  "power_to_X": {
    "capacity": 53,
    "prc_gas": 0.49,
    "gas_efficiency": 0.6,
    "prc_liquid": 0.51,
    "liquid_efficiency": 0.6
  },
  "electric_backup": {
    "methane_turbine_capacity": 70,
    "methane_turbine_efficiency": 0.5,
    "hydrogen_turbine_capacity": 0,
    "hydrogen_turbine_efficiency": 0.5
  },
  "land_use": {
    "existing_natural_broadleaf_woodland": 139,
    "existing_natural_coniferous_woodland": 151,
    "existing_productive_broadleaf_woodland": 1247,
    "existing_productive_coniferous_woodland": 1357,
    "new_natural_broadleaf_woodland": 1000,
    "new_natural_coniferous_woodland": 1900,
    "new_productive_broadleaf_woodland": 700,
    "new_productive_coniferous_woodland": 700,
    "short_rotation_forestry": 0,
    "short_rotation_coppice": 0,
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
    "disused_mines": 0.448,
    "gas_leakage": 0.064,
    "refrigerants": 2.34,
    "other_foams_solvents_aerosols": 1.05,
    "iron_and_steel": 2.52,
    "cement": 3.67,
    "lime": 0.789,
    "soda_ash": 0.105,
    "glass": 0.276,
    "aluminium": 0.583,
    "other": 0.382,
    "agriculture_total": 19.646,
    "biomass_burning": 0.3,
    "reforestation": -30.827000000000005,
    "harvested_wood": -9.462022166666666,
    "wetlands": -1.926,
    "settlements": 2.44,
    "landfill": 3.86,
    "waste_water_handling": 0.879,
    "waste_incineration": 0.377,
    "international_aviation_bunkers": 7.697751719791526,
    "biochar_carbon_capture": -1.3773459000000001,
    "landfill_carbon_capture": -4.267
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
