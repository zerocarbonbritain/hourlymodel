var scenarios = {
  "2018 Energy Demand and Supply (Baseline)": {
    "units_mode": "TWhyr",
    "hours": 87648,
    "population_2030": 66460000,
    "households_2030": 27600000,
    "number_of_households": 27600000,
    "use_flat_profiles": 0,
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
      "nuclear_capacity": 8.9,
      "nuclear_capacity_factor": 0.835,
      "grid_loss_prc": 0.0884+0.05113
    },
    "LAC": {
      "domestic": {
        "lighting_and_appliances_TWhy": 76.63,
        "cooking_TWhy": 13.17
      },
      "services": {
        "lighting_and_appliances_TWhy": 70.9,
        "catering_TWhy": 25.3,
        "cooling_TWhy": 12.9
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
      "other_non_heat_TWhy": 18.3,
      "high_temp_process_fixed_elec_prc": 23.4,
      "high_temp_process_fixed_CH4_prc": 53.9,
      "high_temp_process_fixed_H2_prc": 0,
      "high_temp_process_fixed_liquid_prc": 5.4,
      "high_temp_process_fixed_biomass_prc": 17.3,
      "high_temp_process_DSR_CH4_prc": 0,
      "high_temp_process_DSR_H2_prc": 0,
      "low_temp_process_fixed_elec_prc": 25.7,
      "low_temp_process_fixed_CH4_prc": 64.1,
      "low_temp_process_fixed_H2_prc": 0,
      "low_temp_process_fixed_liquid_prc": 4.8,
      "low_temp_process_fixed_biomass_prc": 5.4,
      "low_temp_process_DSR_CH4_prc": 0,
      "low_temp_process_DSR_H2_prc": 0,
      "dry_sep_fixed_elec_prc": 29.3,
      "dry_sep_fixed_CH4_prc": 58,
      "dry_sep_fixed_H2_prc": 0,
      "dry_sep_fixed_liquid_prc": 4.4,
      "dry_sep_fixed_biomass_prc": 8.2,
      "dry_sep_DSR_CH4_prc": 0,
      "dry_sep_DSR_H2_prc": 0,
      "other_heat_fixed_elec_prc": 0,
      "other_heat_fixed_CH4_prc": 32.5,
      "other_heat_fixed_H2_prc": 0,
      "other_heat_fixed_liquid_prc": 0,
      "other_heat_fixed_biomass_prc": 67.5,
      "other_heat_DSR_CH4_prc": 0,
      "other_heat_DSR_H2_prc": 0,
      "other_non_heat_fixed_elec_prc": 24.8,
      "other_non_heat_fixed_CH4_prc": 61.6,
      "other_non_heat_fixed_H2_prc": 0,
      "other_non_heat_fixed_liquid_prc": 4.9,
      "other_non_heat_fixed_biomass_prc": 8.6
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
    "fossil_fuels": {
      "allow_use_for_backup": 1
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
  }
}
