/*
---------------------------------------------------
ZeroCarbonBritain hourly energy model v3
---------------------------------------------------

CHANGE LOG
---------------------------------------------------

- Hour for day temperatures roll over at 23:00 in spreadsheet model, adjusted to roll over at midnight but could this be DST related? removed temperature set to zero on last hour due to roll over.

- Addition of gas boiler heating option to explore biogas+sabatier heating option

- Heatstore averaging did not roll over -12h at the start in the same way as the other stores, modified to wrap around for consistency

- Modified heatstore storage model to use the average of the heat demand rather than the average of the electricity balance in order to focus on removing the heat demand peaks, reduces max elec heat demand from ~80GW to 67GW. Looking at the heat store operation visually on the new 'heat' tab also suggest better peak removal. The previous implementation also ran the store prior to industrial electricity demand and so the electricity balance was more often positive which meant the store was perhaps not as utilised as it could have been. 8h forward sum removed, not entirely sure what this was doing, I may well have missed something here. Ideally more research on this would be good to really understand what is the best appraoch.

- EV store added limit to check that charge is not larger than available balance and discharge not larger than negative balance. EV driving demand modified to subtract before the smart V2G discharge.

- Final elec store added limits to check that it does not discharge more than negative balance and does not charge at a rate higher than the surplus available.

- Modifications to stores removes the imbalance in the model that caused dips and peaks above and below the supply line

- Detailed transport model
- ITHEM
- Hydrogen storage
- Synthetic liquid fuel storage


Store performance, matching addition
---------------------------------------------------
- heatstore:OFF  EVstore:OFF  elecstore:OFF: 81.6 %
- heatstore:ON   EVstore:OFF  elecstore:OFF: 82.0 %
- heatstore:ON   EVstore:ON   elecstore:OFF: 89.7 %
- heatstore:ON   EVstore:OFF  elecstore:ON:  86.1 %
- heatstore:ON   EVstore:ON   elecstore:ON:  91.9 %

Issues to fix
---------------------------------------------------
- methane losses from store capping, if biogas feed is set too high

*/
previousPoint = false

function fullzcb3_init()
{
    units_mode = "TWhyr"
    unitsmode = "GW"

    annual_high_temp_process = 49.01 * i.ipr         // 26.3% elec, 73.7% gas in original model
    annual_low_temp_dry_sep = 117.78 * i.ipr         // 66% elec, 11% gas, 22% biomass CHP in original model      
    annual_non_heat_process_elec = 88.00 * i.ipr
    annual_non_heat_process_biogas = 13.44 * i.ipr
    annual_non_heat_process_biomass = 5.58 * i.ipr    
    industrial_biofuel = 13.44 * i.ipr
                                     // HHV, originally 0.5747
    co2_tons_per_gwh_methane = (1000.0/15.4)*((0.40*44.009)/(0.60*16.0425))  // 15.4 kWh/kg, MWh/ton HHV, proportion by molar mass
    
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
    
}

function fullzcb3_run()
{
    // Profiles
    if (!i.use_flat_profiles) {
        cooking_profile = [0.00093739, 0.00093739, 0.00093739, 0.005002513, 0.015325386, 0.034557134, 0.075528659, 0.10242465, 0.112118681, 0.068802784, 0.046286663, 0.030023072, 0.019077393, 0.019077393, 0.021108649, 0.029555111, 0.069742295, 0.077562688, 0.071150746, 0.058327514, 0.044879681, 0.037216907, 0.032212599, 0.027207312]
        hot_water_profile = [0.00093739, 0.00093739, 0.00093739, 0.005002513, 0.015325386, 0.034557134, 0.075528659, 0.10242465, 0.112118681, 0.068802784, 0.046286663, 0.030023072, 0.019077393, 0.019077393, 0.021108649, 0.029555111, 0.069742295, 0.077562688, 0.071150746, 0.058327514, 0.044879681, 0.037216907, 0.032212599, 0.027207312]
        space_heat_profile = [0.008340899, 0.008340899, 0.008340899, 0.008340866, 0.016680908, 0.06511456, 0.076803719, 0.083470637, 0.0751301, 0.06009123, 0.04593692, 0.040060611, 0.0350685, 0.033362773, 0.033394683, 0.034247234, 0.036743141, 0.040881845, 0.05175043, 0.06264997, 0.064292437, 0.060849104, 0.04176657, 0.008341064]
        //elec_trains_use_profile = flat_profile
        //BEV_use_profile = flat_profile
        //BEV_charge_profile = flat_profile
        //BEV_plugged_in_profile = flat_profile
    } else {
        cooking_profile = JSON.parse(JSON.stringify(flat_profile))
        hot_water_profile = JSON.parse(JSON.stringify(flat_profile))
        space_heat_profile = JSON.parse(JSON.stringify(flat_profile))  
    }
    
    total_biomass_used = 0
    total_ambient_heat_supply = 0

    domestic_appliances_kwh = 0
    domestic_appliances_kwh += (i.lighting_hours / 24.0) * i.LAC_number_of_lights * i.LAC_lights_power * 0.001 * 24.0 * 365.25
    domestic_appliances_kwh += i.LAC_fridgefreezer
    domestic_appliances_kwh += i.LAC_washingmachine
    domestic_appliances_kwh += i.LAC_alwayson * 0.001 * 24.0 * 365.25
    domestic_appliances_kwh += i.LAC_computing
    trad_elec_domestic_appliances = (domestic_appliances_kwh * i.households_2030) / 1000000000.0

    annual_cooking_elec_domestic = (i.LAC_cooking * i.households_2030) / 1000000000.0
    annual_cooking_elec = annual_cooking_elec_domestic + i.annual_cooking_elec_services

    prc_reduction_domestic_cooking = 1.0 - (annual_cooking_elec_domestic / 15.0)
    prc_reduction_domestic_appliances = 1.0 - (trad_elec_domestic_appliances / 86.0)
    prc_reduction_services_appliances = 1.0 - (i.trad_elec_services_appliances / 59.0)
    prc_reduction_services_cooling = 1.0 - (i.trad_elec_services_cooling / 9.0)
    prc_reduction_services_catering = 1.0 - (i.annual_cooking_elec_services / 22.0)
        
    domestic_appliances_kwh = trad_elec_domestic_appliances * 1000000000.0 / i.households_2030
    trad_elec_demand = trad_elec_domestic_appliances + i.trad_elec_services_appliances + i.trad_elec_services_cooling 
    // ---------------------------------------------------------------------------------------------  
    // Building energy model (domestic only)
    // ---------------------------------------------------------------------------------------------
    // 3. Solar gains calculator from window areas and orientations
    // 4. Seperate out cooking, lighting and appliances and water heating demand.
    
    floor_area = i.total_floor_area / 2.0 
    side = Math.sqrt(floor_area)
         
    walls_uvalue = 1/((1/1.5)+(1/(0.03/i.wall_ins_thickness))) // Base U-value is uninsulated cavity wall
    floor_uvalue = 1/((1/0.7)+(1/(0.04/i.floor_ins_thickness))) // Base U-value is uninsulated solid floor
    loft_uvalue = 1/((1/2.0)+(1/(0.03/i.loft_ins_thickness))) // Base U-value is uninsulated loft
    
    if (i.window_type==1) window_uvalue = 4.8 // single
    if (i.window_type==2) window_uvalue = 1.9 // double
    if (i.window_type==3) window_uvalue = 0.85 // triple

    total_wall_area = (side * i.storey_height * 2) * 4
    total_window_area = total_wall_area * i.glazing_extent
    
    windows_south = total_window_area * 0.4
    windows_west = total_window_area * 0.2
    windows_east = total_window_area * 0.2
    windows_north = total_window_area * 0.2
    
    solar_gains_capacity = total_window_area / 3.0

    floor_WK = floor_uvalue * floor_area
    loft_WK = loft_uvalue * floor_area
    
    wall_south_WK = walls_uvalue * ((side * i.storey_height * 2) - windows_south)
    wall_west_WK = walls_uvalue * ((side * i.storey_height * 2) - windows_west)
    wall_east_WK = walls_uvalue * ((side * i.storey_height * 2) - windows_east)
    wall_north_WK = walls_uvalue * ((side * i.storey_height * 2) - windows_north)
    
    window_WK = (windows_south + windows_west + windows_east + windows_north) * window_uvalue
    
    fabric_WK = floor_WK + loft_WK + wall_south_WK + wall_west_WK + wall_east_WK + wall_north_WK + window_WK
    
    building_volume = floor_area * i.storey_height * 2.0
    infiltration_WK = 0.33 * i.air_change_per_hour * building_volume
    
    domestic_space_heat_demand_WK = fabric_WK + infiltration_WK
    // ---------------------------------------------------------------------------------------------    
    // ---------------------------------------------------------------------------------------------
    domestic_space_heat_demand_GWK = (domestic_space_heat_demand_WK * i.households_2030) / 1000000000.0
    space_heat_demand_GWK = domestic_space_heat_demand_GWK + i.services_space_heat_demand_GWK + i.industry_space_heat_demand_GWK


    // DHW Demand
    DHW_daily_demand = 0
    DHW_daily_demand += (i.shower_kwh * i.number_showers_per_day)
    DHW_daily_demand += (i.bath_kwh * i.number_baths_per_day)
    DHW_daily_demand += (i.sink_kwh * i.number_kitchen_sink)
    DHW_daily_demand += (i.sink_kwh * i.number_bathroom_sink)
    domestic_water_heating_kwh = DHW_daily_demand * 365.25
    domestic_water_heating = (domestic_water_heating_kwh * i.households_2030) / 1000000000.0

    water_heating = domestic_water_heating + i.services_water_heating
    
    prc_reduction_domestic_water_heating = 1.0 - (domestic_water_heating / 71.0)
    prc_reduction_services_water_heating = 1.0 - (i.services_water_heating / 16.0)

    // ---------------------------------------------------------------------------------------------    
    // Transport model
    // --------------------------------------------------------------------------------------------- 
    
    o.transport = {
        modes: { },
        fuel_totals: { EV:0, H2:0, IC:0 }
    }

    let kwpp_to_TWh = i.population_2030 * 0.000000001 

    for (var z in i.transport.modes) {
        let mode = i.transport.modes[z]

        mode.km_pp = mode.miles_pp * i.transport.km_per_mile;
        
        for (var fuel in mode.prc) {
            if (o.transport.modes[z]==undefined) o.transport.modes[z] = {}
            if (o.transport.modes[z][fuel]==undefined) o.transport.modes[z][fuel] = {}
            o.transport.modes[z][fuel].kwhppkm_full = mode.mechanical_kwhppkm_full / mode.efficiency[fuel]
            o.transport.modes[z][fuel].kwhppkm = o.transport.modes[z][fuel].kwhppkm_full / mode.load_factor
            o.transport.modes[z][fuel].kwhpp = o.transport.modes[z][fuel].kwhppkm * mode.prc[fuel] * mode.km_pp
            o.transport.modes[z][fuel].TWh = o.transport.modes[z][fuel].kwhpp * kwpp_to_TWh
            
            o.transport.fuel_totals[fuel] += o.transport.modes[z][fuel].TWh
        }
    }

    o.transport.fuel_totals.EV += i.transport.freight_BEV_demand + i.transport.rail_freight_elec_demand
    o.transport.fuel_totals.DEV = o.transport.modes.Rail.EV.TWh + i.transport.rail_freight_elec_demand
    o.transport.fuel_totals.BEV = o.transport.fuel_totals.EV - o.transport.fuel_totals.DEV
    
    o.transport.fuel_totals.H2 += i.transport.freight_H2_demand
    o.transport.fuel_totals.IC += i.transport.freight_IC_demand
        
    // ---------------------------------------------------------------------------------------------    
    // Hourly model totals
    // ---------------------------------------------------------------------------------------------  
    total_domestic_space_heat_demand = 0
    total_services_space_heat_demand = 0
    total_industry_space_heat_demand = 0
    total_space_heat_demand = 0
    
    total_water_heat_demand = 0
    total_unmet_heat_demand = 0
    unmet_heat_demand_count = 0
    total_biomass_for_spacewaterheat_loss = 0
    total_methane_for_spacewaterheat_loss = 0
    total_hydrogen_for_spacewaterheat_loss = 0
    total_heat_spill = 0
    max_heat_demand_elec = 0 
    
    total_industry_demand = annual_high_temp_process + annual_low_temp_dry_sep + annual_non_heat_process_elec + annual_non_heat_process_biogas + annual_non_heat_process_biomass +industrial_biofuel
    
    // ---------------------------------------------
    // Store SOC's
    // ---------------------------------------------
    heatstore_SOC_start = i.heatstore_storage_cap * 0.5
    BEV_Store_SOC_start = i.electric_car_battery_capacity * 0.5
    elecstore_SOC_start = i.elec_store_storage_cap * 1.0
    hydrogen_SOC_start = i.hydrogen_storage_cap * 0.5
    store_efficiency = 1.0 - (1.0-i.store_roundtrip_efficiency)*0.5
    // i.methane_SOC_start = i.methane_store_capacity * 0.5
    // i.synth_fuel_store_SOC_start = 10000.0
    
    heatstore_SOC = heatstore_SOC_start
    BEV_Store_SOC = BEV_Store_SOC_start
    elecstore_SOC = elecstore_SOC_start
    hydrogen_SOC = hydrogen_SOC_start
    methane_SOC = i.methane_SOC_start
    synth_fuel_store_SOC = i.synth_fuel_store_SOC_start
    
    max_methane_SOC = 0
    max_hydrogen_SOC = 0
    max_synth_fuel_store_SOC = 0
    
    min_methane_SOC = i.methane_store_capacity
    min_hydrogen_SOC = i.hydrogen_storage_cap
    min_synth_fuel_store_SOC = 1000000
    // ---------------------------------------------
    // Transport
    // ---------------------------------------------
    total_EV_charge = 0
    total_EV_demand = 0
    unmet_EV_demand = 0

    total_elec_trains_demand = 0

    total_hydrogen_produced = 0
    total_electricity_for_electrolysis = 0
    total_hydrogen_demand = 0
    total_hydrogen_for_hydrogen_vehicles = 0
    unmet_hydrogen_demand = 0
    unmet_synth_fuel_demand = 0
    
    total_electricity_for_power_to_X = 0
    
    // --------------------------------------------- 
    // Final balance
    // ---------------------------------------------
    initial_elec_balance_positive = 0
    final_elec_balance_negative = 0
    final_elec_balance_positive = 0
    total_initial_elec_balance_positive = 0
    total_final_elec_balance_negative = 0
    total_final_elec_balance_positive = 0

    methane_store_empty_count = 0
    methane_store_full_count = 0
    hydrogen_store_empty_count = 0
    hydrogen_store_full_count = 0
    total_synth_fuel_produced = 0
    total_synth_fuel_biomass_used = 0
    total_methane_made = 0
    total_electricity_from_dispatchable = 0
    max_dispatchable_capacity = 0
    max_dispatchable_capacity_hour = 0
    max_shortfall = 0
    max_shortfall_hour = 0
    total_methane_demand = 0
    
    // demand totals
    total_traditional_elec = 0
    total_industrial_elec_demand = 0
    total_industrial_methane_demand = 0
    total_industrial_biomass_demand = 0
    total_industrial_liquid_demand = 0
    

    total_electrolysis_losses = 0
    total_CCGT_losses = 0
    total_sabatier_losses = 0
    total_anaerobic_digestion_losses = 0
    total_FT_losses = 0
    total_power_to_X_losses = 0
    
    total_synth_fuel_demand = 0
    methane_store_vented = 0
    
    total_elec_store_charge = 0
    total_elec_store_discharge = 0
    total_store_losses = 0
    
    // ---------------------------------------------
    // Convert to daily demand, used with daily usage profiles
    // ---------------------------------------------
    
    daily_trad_elec_demand = trad_elec_demand * 1000.0 / 365.25
    
    water_heating_daily_demand = water_heating * 1000.0 / 365.25    
    
    daily_BEV_demand = o.transport.fuel_totals.BEV * 1000.0 / 365.25
    daily_elec_trains_demand = o.transport.fuel_totals.DEV * 1000.0 / 365.25
    daily_transport_H2_demand = o.transport.fuel_totals.H2 * 1000.0 / 365.25
    daily_transport_liquid_demand = o.transport.fuel_totals.IC * 1000.0 / 365.25

    daily_cooking_elec = annual_cooking_elec * 1000.0 / 365.25
    daily_high_temp_process = annual_high_temp_process * 1000.0 / 365.25
    daily_low_temp_dry_sep = annual_low_temp_dry_sep * 1000.0 / 365.25
          
    daily_non_heat_process_elec = annual_non_heat_process_elec * 1000.0 / 365.25
    daily_non_heat_process_biogas = annual_non_heat_process_biogas * 1000.0 / 365.25
    daily_non_heat_process_biomass = annual_non_heat_process_biomass * 1000.0 / 365.25
        
    daily_industrial_biofuel = industrial_biofuel * 1000.0 / 365.25
    daily_biomass_for_biogas = i.biomass_for_biogas * 1000.0 / 365.25
    hourly_biomass_for_biogas = daily_biomass_for_biogas / 24.0
    
    var check = [];
    
    d = {
        s1_traditional_elec_demand: [],
        industry_elec: [],
        spacewater_elec: [],
        trad_heat_transport_elec: [],
        heatstore: [],
        heatstore_SOC: [],
        BEV_Store_SOC: [],
        elecstore_SOC: [],
        hydrogen_SOC: [],
        methane_SOC: [],
        electricity_from_dispatchable: [],
        elec_store_charge: [],
        elec_store_discharge: [],
        EV_smart_discharge: [],
        EV_charge: [],
        EL_transport: [],
        electricity_for_electrolysis: [],
        export_elec:[],
        unmet_elec:[],
        heatstore_discharge_GWth:[],
        spacewater_balance:[],
        spacewater_heat:[],
        electricity_for_power_to_X:[],
        synth_fuel_store_SOC:[]
    }
    
    // move to hourly model if needed
    // i.heatpump_COP_hourly = i.heatpump_COP
    // GWth_GWe = (i.heatpump_COP_hourly * i.spacewater_share_heatpumps) + (i.elres_efficiency * i.spacewater_share_elres) + (i.methane_boiler_efficiency * i.spacewater_share_methane)
    
    var capacityfactors_all = [];
    for (var hour = 0; hour < hours; hour++) {
        var capacityfactors = tenyearsdatalines[hour].split(",");
        for (var z=0; z<capacityfactors.length; z++) {
            capacityfactors[z] = parseFloat(capacityfactors[z]);
        }
        capacityfactors_all.push(capacityfactors)
    }

    // Supply totals
    o.supply = {
        total_onshore_wind: 0,
        total_offshore_wind: 0,
        total_wave: 0,
        total_tidal: 0,
        total_solarpv: 0,
        total_solarthermal: 0,
        total_hydro: 0,
        total_geothermal_elec: 0,
        total_geothermal_heat: 0,
        total_nuclear: 0,
        total_electricity: 0,
        total_fixed_heat: 0
    }
    
    o.total_losses = {
        grid: 0
    }
    
    d.balance_hourly = []
    d.elec_supply_hourly = []
    d.heat_supply_hourly = []
    
    for (var hour = 0; hour < i.hours; hour++) {
        let capacityfactors = capacityfactors_all[hour]

        let onshore_wind = i.supply.onshore_wind_capacity * capacityfactors[0] * i.supply.onshore_wind_availability            
        let offshore_wind = i.supply.offshore_wind_capacity * capacityfactors[1] * i.supply.offshore_wind_availability
        let wave = i.supply.wave_capacity * capacityfactors[2]
        let tidal = i.supply.tidal_capacity * capacityfactors[3]
        let solarpv = i.supply.solarpv_capacity * capacityfactors[4]
        let solarthermal = i.supply.solarthermal_capacity * capacityfactors[4]
        // Todo: Hydro output is somewhat weather dependent as well
        let hydro = i.supply.hydro_capacity * i.supply.hydro_capacity_factor
        // Todo: Direct use of heat storage options could be considered for geothermal and nuclear
        let geothermal_elec = i.supply.geothermal_elec_capacity * i.supply.geothermal_elec_capacity_factor
        let geothermal_heat = i.supply.geothermal_heat_capacity * i.supply.geothermal_heat_capacity_factor
        let nuclear = i.supply.nuclear_capacity * i.supply.nuclear_capacity_factor
        
        // Totals
        o.supply.total_onshore_wind += onshore_wind            
        o.supply.total_offshore_wind += offshore_wind
        o.supply.total_wave += wave
        o.supply.total_tidal += tidal
        o.supply.total_solarpv += solarpv
        o.supply.total_solarthermal += solarthermal
        o.supply.total_hydro += hydro
        o.supply.total_geothermal_elec += geothermal_elec
        o.supply.total_geothermal_heat += geothermal_heat
        o.supply.total_nuclear += nuclear
        
        // Electricity supply
        let electricity_supply_before_grid_loss = onshore_wind + offshore_wind + wave + tidal + solarpv + hydro + geothermal_elec + nuclear
        o.supply.total_electricity += electricity_supply_before_grid_loss
                    
        let electricity_supply = electricity_supply_before_grid_loss * (1.0-i.supply.grid_loss_prc)
        o.total_losses.grid += electricity_supply_before_grid_loss - electricity_supply
        d.elec_supply_hourly.push(electricity_supply)
        d.balance_hourly.push(electricity_supply)
        
        // Heat supply
        let heat_supply = solarthermal + geothermal_heat
        o.supply.total_fixed_heat += heat_supply
        d.heat_supply_hourly.push(heat_supply)
    }
    // Calculate capacity factors
    o.supply.onshore_wind_capacity_factor = o.supply.total_onshore_wind / (i.supply.onshore_wind_capacity * i.hours)
    o.supply.offshore_wind_capacity_factor = o.supply.total_offshore_wind / (i.supply.offshore_wind_capacity * i.hours)
    o.supply.wave_capacity_factor = o.supply.total_wave / (i.supply.wave_capacity * i.hours)
    o.supply.tidal_capacity_factor = o.supply.total_tidal / (i.supply.tidal_capacity * i.hours)
    o.supply.solarpv_capacity_factor = o.supply.total_solarpv / (i.supply.solarpv_capacity * i.hours)
    o.supply.solarthermal_capacity_factor = o.supply.total_solarthermal / (i.supply.solarthermal_capacity * i.hours)

    
    // --------------------------------------------------------------------------------------------------------------
    // Stage 1: First run calculates arrays used for second stage in +-12h storage models
    // --------------------------------------------------------------------------------------------------------------
    s1_spacewater_demand_before_heatstore = []
    
    for (var hour = 0; hour < hours; hour++) {
        var capacityfactors = capacityfactors_all[hour]
        var day = parseInt(Math.floor(hour / 24))
        var temperature = parseFloat(temperaturelines[day].split(",")[1]);
        
        // ---------------------------------------------------------------------------
        // Traditional electricity demand
        // ---------------------------------------------------------------------------
        cooking_elec = cooking_profile[hour%24] * daily_cooking_elec
        
        normalised_trad_elec = capacityfactors[5]/331.033
        traditional_elec_demand = normalised_trad_elec * trad_elec_demand
        
        if (i.use_flat_profiles) traditional_elec_demand = daily_trad_elec_demand / 24.0
        traditional_elec_demand += cooking_elec
        
        d.s1_traditional_elec_demand.push(traditional_elec_demand)
        total_traditional_elec += traditional_elec_demand
        // ---------------------------------------------------------------------------
        // Space & Water Heat part 1
        // ---------------------------------------------------------------------------
        // space heat
        degree_hours = i.space_heat_base_temperature - temperature
        if (degree_hours<0) degree_hours = 0
        
        // Domestic space heat
        domestic_space_heat_demand = degree_hours * domestic_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]
        total_domestic_space_heat_demand += domestic_space_heat_demand
        // Services space heat        
        services_space_heat_demand = degree_hours * i.services_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]
        total_services_space_heat_demand += services_space_heat_demand
        // Industry space heat        
        industry_space_heat_demand = degree_hours * i.industry_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]        
        total_industry_space_heat_demand += industry_space_heat_demand
        // Combined space heat         
        space_heat_demand = domestic_space_heat_demand + services_space_heat_demand + industry_space_heat_demand
        total_space_heat_demand += space_heat_demand
        
        // water heat
        hot_water_demand = hot_water_profile[hour%24] * water_heating_daily_demand
        total_water_heat_demand += hot_water_demand 
        
        spacewater_demand_before_heatstore = space_heat_demand + hot_water_demand - d.heat_supply_hourly[hour]
        s1_spacewater_demand_before_heatstore.push(spacewater_demand_before_heatstore)
    }
    
    domestic_space_heating_kwh = total_domestic_space_heat_demand*0.1*1000000 / i.households_2030
    spaceheatkwhm2 = domestic_space_heating_kwh / i.total_floor_area
    
    prc_reduction_domestic_space_heat_demand = 1.0 - ((total_domestic_space_heat_demand*0.0001) / 266.0)
    prc_reduction_services_space_heat_demand = 1.0 - ((total_services_space_heat_demand*0.0001) / 83.0)
    prc_reduction_industry_space_heat_demand = 1.0 - ((total_industry_space_heat_demand*0.0001) / 28.0)
    prc_reduction_space_heat_demand = 1.0 - ((total_space_heat_demand*0.0001) / (266.0+83.0+28.0))
    
    loading_prc(40,"model stage 1");
    
    // --------------------------------------------------------------------------------------------------------------
    // Stage 2: Heatstore
    // --------------------------------------------------------------------------------------------------------------
    s2_deviation_from_mean_GWth = []
    for (var hour = 0; hour < hours; hour++) {
        
        var sum = 0; var n = 0;
        for (var z=-12; z<12; z++) {
            var index = hour + z
            if (index>=hours) index-=hours
            if (index<0) index += hours
            sum += s1_spacewater_demand_before_heatstore[index]
            n++;
        }
        average_12h_balance_heat = sum / n;
        
        deviation_from_mean_GWe = s1_spacewater_demand_before_heatstore[hour] - average_12h_balance_heat
        deviation_from_mean_GWth = deviation_from_mean_GWe //* GWth_GWe
        
        s2_deviation_from_mean_GWth.push(deviation_from_mean_GWth)
    }
    loading_prc(50,"model stage 2");
    
    s3_heatstore_SOC = []
    s3_balance_before_BEV_storage = []
    s3_spacewater_elec_demand = []
    s3_methane_for_spacewaterheat = []
    s3_hydrogen_for_spacewaterheat = []
    s3_spacewater_demand_after_heatstore = []
    
    for (var hour = 0; hour < hours; hour++) {
        var day = parseInt(Math.floor(hour / 24))
        var temperature = parseFloat(temperaturelines[day].split(",")[1]);
        
        spacewater_balance = s1_spacewater_demand_before_heatstore[hour]
        d.spacewater_balance.push(spacewater_balance)  
        
        // ---------------------------------------------------------------------------------------------
        // HEATSTORE
        // ---------------------------------------------------------------------------------------------
        heatstore_charge_GWth = 0
        heatstore_discharge_GWth = 0
        
        if (i.heatstore_enabled) {
            // CHARGE
            if (s2_deviation_from_mean_GWth[hour]<0.0) {
                heatstore_charge_GWth = -s2_deviation_from_mean_GWth[hour] * 0.40 * (i.heatstore_storage_cap / 100.0)
                //heatstore_charge_GWth = (i.heatstore_storage_cap-heatstore_SOC)*-s2_deviation_from_mean_GWth[hour]/(i.heatstore_storage_cap*0.5)
            }
            if (heatstore_charge_GWth>i.heatstore_charge_cap) heatstore_charge_GWth = i.heatstore_charge_cap
            if ((heatstore_charge_GWth+heatstore_SOC)>i.heatstore_storage_cap) heatstore_charge_GWth = i.heatstore_storage_cap - heatstore_SOC
            
            spacewater_balance += heatstore_charge_GWth
            heatstore_SOC += heatstore_charge_GWth
            
            // DISCHARGE
            if (s2_deviation_from_mean_GWth[hour]>=0.0) {  
                heatstore_discharge_GWth = s2_deviation_from_mean_GWth[hour] * 0.32 * (i.heatstore_storage_cap / 100.0)
                //heatstore_discharge_GWth = heatstore_SOC*s2_deviation_from_mean_GWth[hour]/(i.heatstore_storage_cap*0.5)
                if (heatstore_discharge_GWth>spacewater_balance) heatstore_discharge_GWth = spacewater_balance
            }
            if (heatstore_discharge_GWth>i.heatstore_charge_cap) heatstore_discharge_GWth = i.heatstore_charge_cap
            if (heatstore_discharge_GWth>heatstore_SOC)  heatstore_discharge_GWth = heatstore_SOC
            
            spacewater_balance -= heatstore_discharge_GWth
            heatstore_SOC -= heatstore_discharge_GWth
        }
        
        d.heatstore_discharge_GWth.push(heatstore_discharge_GWth)        
        // ---------------------------------------------------------------------------------------------
        if (spacewater_balance<0.0) {
            total_heat_spill += -spacewater_balance
            spacewater_balance = 0
        }
        
        s3_heatstore_SOC.push(heatstore_SOC)
        d.heatstore_SOC.push(heatstore_SOC)
        d.spacewater_heat.push(spacewater_balance)
        // space & water heat tab
        spacewater_demand_after_heatstore = spacewater_balance
        if (spacewater_demand_after_heatstore<0.0) spacewater_demand_after_heatstore = 0.0
        s3_spacewater_demand_after_heatstore.push(spacewater_demand_after_heatstore)
        
        // electric resistance
        heat_from_elres = spacewater_demand_after_heatstore * i.spacewater_share_elres
        elres_elec_demand = heat_from_elres / i.elres_efficiency
        
        // heatpumps
        // i.heatpump_COP = 1.8+(temperature+15.0)*0.05
        // if (temperature<-15.0) i.heatpump_COP = 1.8
                
        heat_from_heatpumps = spacewater_demand_after_heatstore * i.spacewater_share_heatpumps
        heatpump_elec_demand = heat_from_heatpumps / i.heatpump_COP
        ambient_heat_used = heat_from_heatpumps * (1.0-1.0/i.heatpump_COP)
        total_ambient_heat_supply += ambient_heat_used
        
        // biomass heat
        heat_from_biomass = spacewater_demand_after_heatstore * i.spacewater_share_biomass
        biomass_for_spacewaterheat = heat_from_biomass / i.biomass_efficiency
        total_biomass_used += biomass_for_spacewaterheat
        total_biomass_for_spacewaterheat_loss += biomass_for_spacewaterheat - heat_from_biomass
        
        // methane/gas boiler heat
        heat_from_methane = spacewater_demand_after_heatstore * i.spacewater_share_methane
        methane_for_spacewaterheat = heat_from_methane / i.methane_boiler_efficiency
        s3_methane_for_spacewaterheat.push(methane_for_spacewaterheat)
        total_methane_for_spacewaterheat_loss += methane_for_spacewaterheat - heat_from_methane

        // hydrogen gas boiler heat
        heat_from_hydrogen = spacewater_demand_after_heatstore * i.spacewater_share_hydrogen
        hydrogen_for_spacewaterheat = heat_from_hydrogen / i.hydrogen_boiler_efficiency
        s3_hydrogen_for_spacewaterheat.push(hydrogen_for_spacewaterheat)
        total_hydrogen_for_spacewaterheat_loss += hydrogen_for_spacewaterheat - heat_from_hydrogen
        
        // check for unmet heat
        unmet_heat_demand = spacewater_demand_after_heatstore - heat_from_heatpumps - heat_from_elres - heat_from_biomass - heat_from_methane - heat_from_hydrogen
        if (unmet_heat_demand.toFixed(3)>0) {
            unmet_heat_demand_count++
            total_unmet_heat_demand += unmet_heat_demand
        }
        
        spacewater_elec_demand = heatpump_elec_demand + elres_elec_demand // electricity tab
        if (spacewater_elec_demand>max_heat_demand_elec) max_heat_demand_elec = spacewater_elec_demand
        
        s3_spacewater_elec_demand.push(spacewater_elec_demand)
        d.spacewater_elec.push(spacewater_elec_demand)
        
    }
    loading_prc(60,"model stage 3");

    // ---------------------------------------------------------------------------
    // Industrial
    // ---------------------------------------------------------------------------
    s1_industrial_elec_demand = []
    s1_methane_for_industry = []
    
    for (var hour = 0; hour < hours; hour++)
    {
        
        // electric demand
        non_heat_process_elec = not_heat_process_profile[hour%24] * daily_non_heat_process_elec

        // balance including non DSR industrial load
        balance = d.elec_supply_hourly[hour] - d.s1_traditional_elec_demand[hour] - s3_spacewater_elec_demand[hour] - non_heat_process_elec

        // High temp process: 25% elec, 75% gas in original model
        // Low temp process: 66% elec, 11% gas, 22% biomass CHP in original model
        
        // Here we implement a mixed fixed elec/gas heat supply and an extended DSR elec/gas supply
        // The DSR supply uses electricity when there is excess renewable supply available and gas 
        // originally produced from excess renewable supply when direct supply is not sufficient
                
        // industry heat demand
        high_temp_process = high_temp_process_profile[hour%24] * daily_high_temp_process
        low_temp_process = low_temp_process_profile[hour%24] * daily_low_temp_dry_sep
        
        heat_process_fixed_elec = (high_temp_process*i.high_temp_process_fixed_elec_prc) + (low_temp_process*i.low_temp_process_fixed_elec_prc)
        heat_process_fixed_gas = (high_temp_process*i.high_temp_process_fixed_gas_prc) + (low_temp_process*i.low_temp_process_fixed_gas_prc)
        heat_process_fixed_biomass = (high_temp_process*i.high_temp_process_fixed_biomass_prc) + (low_temp_process*i.low_temp_process_fixed_biomass_prc)
        heat_process_DSR = (high_temp_process*i.high_temp_process_DSR_prc) + (low_temp_process*i.low_temp_process_DSR_prc)
        
        // Industrial DSR
        heat_process_DSR_elec = heat_process_DSR                                    // 1. provide all heat demand with direct elec resistance heaters
        if (heat_process_DSR_elec>balance) heat_process_DSR_elec = balance          // 2. limited to available electricity balance
        if (heat_process_DSR_elec<0) heat_process_DSR_elec = 0                      // 3. -- should never happen --
        heat_process_DSR_gas = heat_process_DSR - heat_process_DSR_elec             // 4. if there is not enough elec to meet demand, use gas
        
        industrial_elec_demand = non_heat_process_elec + heat_process_fixed_elec + heat_process_DSR_elec
        
        s1_industrial_elec_demand.push(industrial_elec_demand)
        total_industrial_elec_demand += industrial_elec_demand 
        d.industry_elec.push(industrial_elec_demand)
        
        // methane demand
        non_heat_process_biogas = not_heat_process_profile[hour%24] * daily_non_heat_process_biogas
        industrial_methane_demand = non_heat_process_biogas + heat_process_fixed_gas + heat_process_DSR_gas
        
        s1_methane_for_industry.push(industrial_methane_demand)
        total_industrial_methane_demand += industrial_methane_demand
        
        // Balance calculation for BEV storage stage
        s3_balance_before_BEV_storage.push(d.elec_supply_hourly[hour] - d.s1_traditional_elec_demand[hour] - s3_spacewater_elec_demand[hour] - industrial_elec_demand)
        
        // Not heat biomass demand
        non_heat_process_biomass = not_heat_process_profile[hour%24] * daily_non_heat_process_biomass
        
        total_industrial_biomass_demand += non_heat_process_biomass
        total_industrial_biomass_demand += heat_process_fixed_biomass
        
        total_biomass_used += non_heat_process_biomass
        total_biomass_used += heat_process_fixed_biomass
    }

    // -------------------------------------------------------------------------------------
    // Bivalent heat substitution
    // -------------------------------------------------------------------------------------
    bivalent_backup = false
    if (bivalent_backup) {
        total_ambient_heat_supply = 0
        var spacewater_elec_demand = 0;
        var balance = 0;
        var unmet = 0;
        var spacewater_bivalent = 0;
        d.spacewater_elec = []
        for (var hour = 0; hour < hours; hour++)
        {
            
            spacewater_elec_demand = s3_spacewater_elec_demand[hour]
            balance = d.elec_supply_hourly[hour] - d.s1_traditional_elec_demand[hour] - spacewater_elec_demand - s1_industrial_elec_demand[hour]
            
            unmet = 0
            if (balance<0) unmet = -1*balance
            if (unmet<=spacewater_elec_demand) {
                spacewater_elec_demand -= unmet
                spacewater_bivalent = unmet
            } else {
                spacewater_bivalent = spacewater_elec_demand
                spacewater_elec_demand = 0
            }
            
            elres_elec_demand = (spacewater_elec_demand/(i.spacewater_share_elres+(i.spacewater_share_heatpumps/i.heatpump_COP)))*i.spacewater_share_elres
            spacewater_elec_heatpumps = spacewater_elec_demand - elres_elec_demand
            heat_from_heatpumps = spacewater_elec_heatpumps * i.heatpump_COP

            elres_component = (spacewater_bivalent/(i.spacewater_share_elres+(i.spacewater_share_heatpumps/i.heatpump_COP)))*i.spacewater_share_elres
            heatpump_component = (spacewater_bivalent - elres_component) * i.heatpump_COP

            // methane/gas boiler heat
            var spacewater_heat_bivalent = elres_component + heatpump_component
            methane_for_spacewaterheat = spacewater_heat_bivalent / i.methane_boiler_efficiency
            s3_methane_for_spacewaterheat[hour] += methane_for_spacewaterheat
            total_methane_for_spacewaterheat_loss += methane_for_spacewaterheat - spacewater_heat_bivalent 
            
            
            
            heat_from_heatpumps = spacewater_elec_heatpumps * i.heatpump_COP
            ambient_heat_used = heat_from_heatpumps * (1.0-1.0/i.heatpump_COP)
            total_ambient_heat_supply += ambient_heat_used
            
            // repopulate
            s3_spacewater_elec_demand[hour] = spacewater_elec_demand
            s3_balance_before_BEV_storage[hour] = d.elec_supply_hourly[hour] - d.s1_traditional_elec_demand[hour] - spacewater_elec_demand - s1_industrial_elec_demand[hour]
            d.spacewater_elec[hour] = [time,spacewater_elec_demand]
        }
    }
    
    // -------------------------------------------------------------------------------------
    // Elec transport
    // -------------------------------------------------------------------------------------
    s4_BEV_Store_SOC = []
    s4_balance_before_elec_store = []
    for (var hour = 0; hour < hours; hour++)
    {
        balance = s3_balance_before_BEV_storage[hour]
        
        // ---------------------------------------------
        // +- 12 h average of balance before BEV Storage
        var sum = 0; var n = 0;
        for (var z=-24; z<24; z++) {
            var index = hour + z
            if (index>=hours) index-=hours
            if (index<0) index += hours
            sum += s3_balance_before_BEV_storage[index]
            n++;
        }
        average_12h_balance_before_BEV_storage = sum / n;
        deviation_from_mean_BEV = balance - average_12h_balance_before_BEV_storage   
        // ---------------------------------------------
        
        // Electric trains
        elec_trains_demand = elec_trains_use_profile[hour%24] * daily_elec_trains_demand
        total_elec_trains_demand += elec_trains_demand
        balance -= elec_trains_demand 
        
        // Standard EV charge
        EV_charge = BEV_charge_profile[hour%24] * daily_BEV_demand
        
        max_charge_rate = BEV_plugged_in_profile[hour%24] * i.electric_car_max_charge_rate
        
        // SMART CHARGE --------------------------------
        if (i.smart_charging_enabled && balance>EV_charge) {
            if (i.smart_charge_type=="average") {
                if (deviation_from_mean_BEV>0.0) {
                    EV_charge = (i.electric_car_battery_capacity-BEV_Store_SOC)*deviation_from_mean_BEV/(i.electric_car_battery_capacity*0.5)
                    if (EV_charge>balance) EV_charge = balance
                }
            } else {
                EV_charge = balance // simple smart charge
            }
        }
        // Charging rate & quantity limits
        if (EV_charge>max_charge_rate) EV_charge = max_charge_rate
        if ((BEV_Store_SOC+EV_charge)>i.electric_car_battery_capacity) EV_charge = i.electric_car_battery_capacity - BEV_Store_SOC
        // Subtract EV charge from balance and add to SOC
        balance -= EV_charge
        BEV_Store_SOC += EV_charge
        total_EV_charge += EV_charge
        d.EV_charge.push(EV_charge)
        
        // EV DEMAND -----------------------------------
        EV_demand = BEV_use_profile[hour%24] * daily_BEV_demand
        BEV_Store_SOC -= EV_demand
        if (BEV_Store_SOC<0) {
            unmet_EV_demand += -1 * BEV_Store_SOC;
            BEV_Store_SOC = 0
        }
        
        total_EV_demand += EV_demand
        
        // SMART DISCHARGE -----------------------------
        EV_smart_discharge = 0.0
        if (i.V2G_enabled && balance<0.0) {
            if (i.V2G_discharge_type=="average") {
                if (deviation_from_mean_BEV<0.0) {
                    EV_smart_discharge = BEV_Store_SOC*-deviation_from_mean_BEV/(i.electric_car_battery_capacity*0.5)
                    if (EV_smart_discharge>-balance) EV_smart_discharge = -balance
                }
            } else {
                EV_smart_discharge = -balance
            }
        }

        // Discharge rate & quantity limits
        if (EV_smart_discharge>max_charge_rate) EV_smart_discharge = max_charge_rate
        //EV_V2G_min_SOC = i.electric_car_battery_capacity * 0.3
        //if ((BEV_Store_SOC-EV_smart_discharge)<EV_V2G_min_SOC) EV_smart_discharge = BEV_Store_SOC-EV_V2G_min_SOC
        if (EV_smart_discharge>BEV_Store_SOC) EV_smart_discharge = BEV_Store_SOC
        if (EV_smart_discharge<0) EV_smart_discharge = 0
               
        // Apply to SOC and balance
        BEV_Store_SOC -= EV_smart_discharge
        balance += EV_smart_discharge
        
        // Timeseries
        d.EV_smart_discharge.push(EV_smart_discharge)
        s4_BEV_Store_SOC.push(BEV_Store_SOC)
        d.BEV_Store_SOC.push(BEV_Store_SOC)
        d.EL_transport.push(elec_trains_demand + EV_charge)
        s4_balance_before_elec_store.push(balance)        
    }
    loading_prc(70,"model stage 4");
    
    // -------------------------------------------------------------------------------------
    // Elec Store
    // -------------------------------------------------------------------------------------
    s5_elecstore_SOC = []
    s5_hydrogen_SOC = []
    s5_methane_SOC = []
    s5_final_balance = []
    for (var hour = 0; hour < hours; hour++)
    {
        
        var balance = s4_balance_before_elec_store[hour]
        
        elec_store_charge = 0
        elec_store_discharge = 0        
        // ---------------------------------------------------------------------------
        // 12 h average store implementation
        // ---------------------------------------------------------------------------
        // +- 12 h average of balance
        var sum = 0; var n = 0;
        for (var z=-12; z<12; z++) {
            var index = hour + z
            if (index>=hours) index-=hours
            if (index<0) index += hours
            sum += s4_balance_before_elec_store[index]
            n++;
        }
        average_12h_balance_before_elec_storage = sum / n;
        deviation_from_mean_elec = balance - average_12h_balance_before_elec_storage
        
        //if (electricity_storage_enabled) {
        
        if (i.elec_store_type=="basic") {
            store_charge = 0
            store_discharge = 0
            if (balance>0) {
                elec_store_charge = balance                                                                                                        // Charge by extend of available oversupply
                if (elec_store_charge>i.elec_store_charge_cap) elec_store_charge = i.elec_store_charge_cap                                             // Limit by max charge rate
                
                elec_store_charge_int = elec_store_charge*store_efficiency
                if (elec_store_charge_int>(i.elec_store_storage_cap-elecstore_SOC)) elec_store_charge_int = i.elec_store_storage_cap - elecstore_SOC   // Limit by available SOC
                elec_store_charge = elec_store_charge_int/store_efficiency
                
                elecstore_SOC += elec_store_charge_int
                balance -= elec_store_charge
                total_elec_store_charge += elec_store_charge
                total_store_losses += elec_store_charge - elec_store_charge_int
            } else {
                elec_store_discharge = -1*balance                                                                                          // Discharge by extent of unmet demand
                if (elec_store_discharge>i.elec_store_charge_cap) elec_store_discharge = i.elec_store_charge_cap                               // Limit by max discharge rate
                
                elec_store_discharge_int = elec_store_discharge/store_efficiency                                                           
                if (elec_store_discharge_int>elecstore_SOC) elec_store_discharge_int = elecstore_SOC                                       // Limit by available SOC
                elec_store_discharge = elec_store_discharge_int*store_efficiency
                
                elecstore_SOC -= elec_store_discharge_int
                balance += elec_store_discharge
                total_elec_store_discharge += elec_store_discharge
                total_store_losses += elec_store_discharge_int - elec_store_discharge
            }
        }
        
        else if (i.elec_store_type=="average") {
            if (balance>=0.0) {
                if (deviation_from_mean_elec>=0.0) {
                    // charge
                    elec_store_charge = (i.elec_store_storage_cap-elecstore_SOC)*deviation_from_mean_elec/(i.elec_store_storage_cap*0.5)
                    if (elec_store_charge>i.elec_store_charge_cap) elec_store_charge = i.elec_store_charge_cap                                       // Limit to charge capacity
                    if (elec_store_charge>balance) elec_store_charge = balance
                    
                    elec_store_charge_int = elec_store_charge*store_efficiency
                    if (elec_store_charge_int>(i.elec_store_storage_cap - elecstore_SOC)) elec_store_charge_int = i.elec_store_storage_cap - elecstore_SOC   // Limit to available SOC
                    elec_store_charge = elec_store_charge_int/store_efficiency

                    elecstore_SOC += elec_store_charge_int
                    balance -= elec_store_charge
                    total_elec_store_charge += elec_store_charge
                    total_store_losses += elec_store_charge - elec_store_charge_int
                }
            } else {
                if (deviation_from_mean_elec<0.0) {
                    // discharge
                    elec_store_discharge = elecstore_SOC*-deviation_from_mean_elec/(i.elec_store_storage_cap*0.5)
                    if (elec_store_discharge>i.elec_store_charge_cap) elec_store_discharge = i.elec_store_charge_cap      // Limit to discharge capacity
                    if (elec_store_discharge>-balance) elec_store_discharge = -balance
                    
                    elec_store_discharge_int = elec_store_discharge/store_efficiency                                                           
                    if (elec_store_discharge_int>elecstore_SOC) elec_store_discharge_int = elecstore_SOC              // Limit to elecstore SOC
                    elec_store_discharge = elec_store_discharge_int*store_efficiency        

                    elecstore_SOC -= elec_store_discharge_int    
                    balance += elec_store_discharge
                    total_elec_store_discharge += elec_store_discharge
                    total_store_losses += elec_store_discharge_int - elec_store_discharge
                }
            }
        }
        //}
        if (elecstore_SOC<0) elecstore_SOC = 0                                                              // limits here can loose energy in the calc
        if (elecstore_SOC>i.elec_store_storage_cap) elecstore_SOC = i.elec_store_storage_cap                    // limits here can loose energy in the calc
        // ----------------------------------------------------------------------------
          
        s5_elecstore_SOC.push(elecstore_SOC)
        d.elecstore_SOC.push(elecstore_SOC)        
        d.elec_store_charge.push(elec_store_charge)
        d.elec_store_discharge.push(elec_store_discharge)
        
        if (balance>=0.0) {
            total_initial_elec_balance_positive += balance
            initial_elec_balance_positive++
        }

        // ----------------------------------------------------------------------------
        // Biogas
        // ----------------------------------------------------------------------------
        // The first stage here covers methane produced directly from biogas
        // A biogas methane content by volume of 60% is assumed
        // The remainder is CO2 which is used here as a feed for further methanation using hydrogen
        biogas_supply = hourly_biomass_for_biogas * i.anaerobic_digestion_efficiency                   // biogas supply from biomass input
        methane_from_biogas = biogas_supply                                                          // energy content of methane in biogas is same as biogas itself
        total_anaerobic_digestion_losses += hourly_biomass_for_biogas - biogas_supply                // biogas AD losses
        co2_from_biogas = co2_tons_per_gwh_methane * biogas_supply                                   // biogas co2 content in tons
                        
        // ----------------------------------------------------------------------------
        // Hydrogen
        // ----------------------------------------------------------------------------
        // 1. Electrolysis input
        electricity_for_electrolysis = 0
        if (balance>=0.0) {
            electricity_for_electrolysis = balance
            // Limit by hydrogen electrolysis capacity
            if (electricity_for_electrolysis>i.electrolysis_cap) electricity_for_electrolysis = i.electrolysis_cap
            // Limit by hydrogen store capacity
            if (electricity_for_electrolysis>((i.hydrogen_storage_cap-hydrogen_SOC)/i.electrolysis_eff)) electricity_for_electrolysis = (i.hydrogen_storage_cap-hydrogen_SOC)/i.electrolysis_eff
        }
        
        hydrogen_from_electrolysis = electricity_for_electrolysis * i.electrolysis_eff
        total_electrolysis_losses += electricity_for_electrolysis - hydrogen_from_electrolysis
        d.electricity_for_electrolysis.push(electricity_for_electrolysis)
        balance -= electricity_for_electrolysis
        
        total_electricity_for_electrolysis += electricity_for_electrolysis
        
        hydrogen_balance = hydrogen_from_electrolysis
        total_hydrogen_produced += hydrogen_from_electrolysis
        
        // hydrogen heating demand
        hydrogen_balance -= s3_hydrogen_for_spacewaterheat[hour]
                
        // 2. Hydrogen vehicle demand
        hydrogen_for_hydrogen_vehicles = daily_transport_H2_demand / 24.0
        total_hydrogen_for_hydrogen_vehicles += hydrogen_for_hydrogen_vehicles
        hydrogen_balance -= hydrogen_for_hydrogen_vehicles
        
        // 3. Hydrogen to synthetic liquid fuels
        hourly_biomass_for_biofuel = 0.0
        hydrogen_to_synth_fuel = 0.0
        if ((hydrogen_SOC>i.hydrogen_storage_cap*i.minimum_hydrogen_store_level) && hydrogen_balance>0.0) {
            hydrogen_to_synth_fuel = hydrogen_balance
            if (hydrogen_to_synth_fuel>i.synth_fuel_capacity) hydrogen_to_synth_fuel = i.synth_fuel_capacity
            hourly_biomass_for_biofuel = (hydrogen_to_synth_fuel/i.FT_process_hydrogen_req)*i.FT_process_biomass_req
            hydrogen_balance -= hydrogen_to_synth_fuel
        }
        
        // 4. Hydrogen to Methanation
        co2_for_sabatier = co2_from_biogas
        hydrogen_for_sabatier = co2_for_sabatier * (8.064/44.009) * 39.4 * 0.001                     // 1000 tCO2, requires 7.2 GWh of H2 (HHV)
        
        available_hydrogen = hydrogen_SOC-(i.hydrogen_storage_cap*i.minimum_hydrogen_store_level)        // calculate available hydrogen
        if (hydrogen_for_sabatier>available_hydrogen) hydrogen_for_sabatier = available_hydrogen     // limit by available hydrogen
        if (hydrogen_for_sabatier>i.methanation_capacity) hydrogen_for_sabatier = i.methanation_capacity // limit by methanation capacity
        if (hydrogen_for_sabatier<0.0) hydrogen_for_sabatier = 0.0
        hydrogen_balance -= hydrogen_for_sabatier                                                    // subtract from hydrogen store
        // Methanation process itself
        methane_from_sabatier = hydrogen_for_sabatier * (889.0/1144.0)                               // 78% efficiency based on HHV kj/mol of CH4/4H2
        total_sabatier_losses += hydrogen_for_sabatier - methane_from_sabatier
        
        hydrogen_SOC += hydrogen_balance
        
        if (hydrogen_SOC<0.0) {
            unmet_hydrogen_demand += -1*hydrogen_SOC
            hydrogen_SOC = 0.0
        }
        
        if (hydrogen_SOC>max_hydrogen_SOC) max_hydrogen_SOC = hydrogen_SOC
        if (hydrogen_SOC<min_hydrogen_SOC) min_hydrogen_SOC = hydrogen_SOC

        total_hydrogen_demand += hydrogen_for_hydrogen_vehicles + hydrogen_to_synth_fuel + hydrogen_for_sabatier
             
        // ----------------------------------------------------------------------------
        // Power-to-X: Gas and Liquids, includes:
        //
        // - Integrated High-Temperature Electrolysis and Methanation (IHTEM)
        //   Pilot projects include Helmeth ~76% efficiency and Store & Go ~59% efficiency
        //
        // - Power to Liquids
        //   e.g: paper 'Power-to-Liquids Potentials and Perspectives for the Future Supply of Renewable Aviation Fuel'
        // 
        //   Both pathways assumes integrated DAC of CO2, utilising heat recovery as discussed in Store & Go paper.
        // ----------------------------------------------------------------------------
        
        // 1. Work out utilisation of power_to_X capacity
        electricity_for_power_to_X = 0
        if (balance>=0.0) {
            electricity_for_power_to_X = balance
            if (electricity_for_power_to_X>i.power_to_X_cap) electricity_for_power_to_X = i.power_to_X_cap
        }
        
        // 2. Split by gaseous and liquid outputs
        methane_from_IHTEM = electricity_for_power_to_X * i.power_to_X_prc_gas * i.power_to_X_gas_efficiency
        synth_fuel_produced_PTL = electricity_for_power_to_X * i.power_to_X_prc_liquid * i.power_to_X_liquid_efficiency
        
        balance -= electricity_for_power_to_X
        
        total_electricity_for_power_to_X += electricity_for_power_to_X
        
        // Losses and electric consumption graph
        total_power_to_X_losses += electricity_for_power_to_X - (methane_from_IHTEM + synth_fuel_produced_PTL)
        d.electricity_for_power_to_X.push(electricity_for_power_to_X)
        
        // Add to stores and totals
        total_synth_fuel_produced += synth_fuel_produced_PTL
        synth_fuel_store_SOC += synth_fuel_produced_PTL
        
        // ----------------------------------------------------------------------------
        // Dispatchable (backup power via CCGT gas turbines)
        // ---------------------------------------------------------------------------- 
        electricity_from_dispatchable = 0
        if (methane_SOC>0) {
            if (balance<0.0) electricity_from_dispatchable = -balance
            // Limit by methane availability
            if (electricity_from_dispatchable>(methane_SOC*i.dispatchable_gen_eff)) electricity_from_dispatchable = methane_SOC*i.dispatchable_gen_eff
            // Limit by CCGT capacity
            if (electricity_from_dispatchable>i.dispatch_gen_cap) electricity_from_dispatchable = i.dispatch_gen_cap
            // Totals, losses and max capacity utilisation
            total_CCGT_losses += ((1.0/i.dispatchable_gen_eff)-1.0) * electricity_from_dispatchable
            total_electricity_from_dispatchable += electricity_from_dispatchable
            
            if (electricity_from_dispatchable>max_dispatchable_capacity) {
                max_dispatchable_capacity = electricity_from_dispatchable
                max_dispatchable_capacity_hour = hour
            }
        }
        d.electricity_from_dispatchable.push(electricity_from_dispatchable)
        
        // Final electricity balance
        balance += electricity_from_dispatchable
        s5_final_balance.push(balance)

        export_elec = 0.0
        unmet_elec = 0.0
        if (balance>=0.0) {
            export_elec = balance
            total_final_elec_balance_positive += export_elec
            final_elec_balance_positive++
        } else {
            unmet_elec = -balance
            total_final_elec_balance_negative += unmet_elec
            final_elec_balance_negative++
            
            if (unmet_elec>max_shortfall) {
                max_shortfall = unmet_elec
                max_shortfall_hour = hour
            }
        }
        d.export_elec.push(export_elec)
        d.unmet_elec.push(unmet_elec)
        
        // ----------------------------------------------------------------------------
        // Methane
        // ---------------------------------------------------------------------------- 
        // Total methane production
        methane_production = methane_from_sabatier + methane_from_biogas + methane_from_IHTEM
        total_methane_made += methane_production
        methane_to_dispatchable = electricity_from_dispatchable / i.dispatchable_gen_eff
        
        methane_demand = methane_to_dispatchable + s3_methane_for_spacewaterheat[hour] + s1_methane_for_industry[hour]
        total_methane_demand += methane_demand
        
        methane_balance = methane_production - methane_demand
                
        methane_SOC += methane_balance
        if (methane_SOC>i.methane_store_capacity) {
            methane_store_vented += methane_SOC - i.methane_store_capacity
            methane_SOC = i.methane_store_capacity
        }

        s5_methane_SOC.push(methane_SOC)
        d.methane_SOC.push(methane_SOC)
        if ((methane_SOC/i.methane_store_capacity)<0.01) methane_store_empty_count ++
        if ((methane_SOC/i.methane_store_capacity)>0.99) methane_store_full_count ++
        
        if (methane_SOC>max_methane_SOC) max_methane_SOC = methane_SOC
        if (methane_SOC<min_methane_SOC) min_methane_SOC = methane_SOC
        // ------------------------------------------------------------------------------------
        // Synth fuel FT
        synth_fuel_produced_FT = hydrogen_to_synth_fuel / i.FT_process_hydrogen_req
        
        total_synth_fuel_produced += synth_fuel_produced_FT
        total_synth_fuel_biomass_used += hourly_biomass_for_biofuel
        
        synth_fuel_store_SOC += synth_fuel_produced_FT
        
        total_FT_losses += (hydrogen_to_synth_fuel + hourly_biomass_for_biofuel) - (hydrogen_to_synth_fuel / i.FT_process_hydrogen_req)
        
        synth_fuel_demand = (daily_transport_liquid_demand + daily_industrial_biofuel) / 24.0
        total_industrial_liquid_demand += daily_industrial_biofuel / 24.0
        
        synth_fuel_store_SOC -= synth_fuel_demand

        if (synth_fuel_store_SOC<0.0) {
            unmet_synth_fuel_demand += -1*synth_fuel_store_SOC
            synth_fuel_store_SOC = 0.0
        }
        
        total_synth_fuel_demand += synth_fuel_demand

        d.synth_fuel_store_SOC.push(synth_fuel_store_SOC)   
        
        if (synth_fuel_store_SOC>max_synth_fuel_store_SOC) max_synth_fuel_store_SOC = synth_fuel_store_SOC
        if (synth_fuel_store_SOC<min_synth_fuel_store_SOC) min_synth_fuel_store_SOC = synth_fuel_store_SOC   
        // ------------------------------------------------------------------------------------
        // Biomass
        total_biomass_used += biogas_supply / i.anaerobic_digestion_efficiency 
        total_biomass_used += hourly_biomass_for_biofuel
        
        // Hydrogen SOC data
        s5_hydrogen_SOC.push(hydrogen_SOC)
        d.hydrogen_SOC.push(hydrogen_SOC)
        if ((hydrogen_SOC/i.hydrogen_storage_cap)<0.01) hydrogen_store_empty_count ++
        if ((hydrogen_SOC/i.hydrogen_storage_cap)>0.99) hydrogen_store_full_count ++
    }
    loading_prc(80,"model stage 5");

    // -------------------------------------------------------------------------------
    
    total_unmet_demand = total_final_elec_balance_negative
    
    total_supply = o.supply.total_electricity + o.supply.total_fixed_heat + total_biomass_used + total_ambient_heat_supply 
    
    total_demand = 0
    total_demand += total_traditional_elec 
    total_demand += total_space_heat_demand
    total_demand += total_water_heat_demand
    total_demand += total_industrial_elec_demand
    total_demand += total_industrial_methane_demand
    total_demand += total_industrial_biomass_demand
    
    total_demand += total_EV_demand
    total_demand += total_elec_trains_demand
    total_demand += total_hydrogen_for_hydrogen_vehicles
    total_demand += total_synth_fuel_demand
    
    // -------------------------------------------------------------------------------------------------
    final_store_balance = 0
    
    heatstore_additions =  heatstore_SOC - heatstore_SOC_start
    console.log("heatstore_additions: "+heatstore_additions)
    final_store_balance += heatstore_additions

    BEV_store_additions =  BEV_Store_SOC - BEV_Store_SOC_start
    console.log("BEV_store_additions: "+BEV_store_additions)
    final_store_balance += BEV_store_additions

    elecstore_additions =  elecstore_SOC - heatstore_SOC_start
    console.log("elecstore_additions: "+elecstore_additions)
    final_store_balance += elecstore_additions
        
    hydrogen_store_additions = hydrogen_SOC - hydrogen_SOC_start
    console.log("hydrogen_store_additions: "+hydrogen_store_additions)
    final_store_balance += hydrogen_store_additions
    
    methane_store_additions = methane_SOC - i.methane_SOC_start
    console.log("methane_store_additions: "+methane_store_additions)
    final_store_balance += methane_store_additions

    synth_fuel_store_additions = synth_fuel_store_SOC - i.synth_fuel_store_SOC_start
    console.log("synth_fuel_store_additions: "+synth_fuel_store_additions)
    final_store_balance += synth_fuel_store_additions

    console.log("final_store_balance: "+final_store_balance)
    
    console.log("total_heat_spill: "+total_heat_spill);
    
    console.log("unmet_EV_demand: "+unmet_EV_demand)
    console.log("unmet_hydrogen_demand: "+unmet_hydrogen_demand)
    console.log("unmet_synth_fuel_demand: "+unmet_synth_fuel_demand)
    total_unmet_demand += unmet_EV_demand + unmet_hydrogen_demand + unmet_synth_fuel_demand
    
    total_spill = methane_store_vented + total_heat_spill
    
    // -------------------------------------------------------------------------------------------------
    total_exess = total_final_elec_balance_positive + final_store_balance; //total_supply - total_demand
    total_losses = o.total_losses.grid + total_electrolysis_losses + total_CCGT_losses + total_anaerobic_digestion_losses + total_sabatier_losses + total_FT_losses + total_spill + total_power_to_X_losses
    total_losses += total_biomass_for_spacewaterheat_loss
    total_losses += total_methane_for_spacewaterheat_loss
    total_losses += total_hydrogen_for_spacewaterheat_loss
    total_losses += total_store_losses

    console.log("total_supply: "+total_supply)
    console.log("total_unmet_demand: "+total_unmet_demand)
    console.log("total_demand: "+total_demand)    
    console.log("total_losses: "+total_losses)
    console.log("total_exess: "+total_exess)
        
    unaccounted_balance = total_supply + total_unmet_demand - total_demand - total_losses - total_exess
    console.log("unaccounted_balance: "+unaccounted_balance.toFixed(6))
    // -------------------------------------------------------------------------------------------------
    
    console.log("max heat elec demand: "+max_heat_demand_elec);
    
    primary_energy_factor = total_supply / total_demand
    
    // -------------------------------------------------------------------------------
    
    total_initial_elec_balance_positive = total_initial_elec_balance_positive / 10000.0
    total_final_elec_balance_negative = total_final_elec_balance_negative / 10000.0
    total_final_elec_balance_positive = total_final_elec_balance_positive / 10000.0
    total_unmet_heat_demand = (total_unmet_heat_demand/ 10000.0).toFixed(3);
    total_synth_fuel_biomass_used = total_synth_fuel_biomass_used / 10000.0
    total_electricity_from_dispatchable /= 10000.0
    total_biomass_used /= 10000.0
    total_other_biomass_used = total_biomass_used - i.biomass_for_biogas - total_synth_fuel_biomass_used
    
    liquid_fuel_produced_prc_diff = 100 * (total_synth_fuel_produced - (o.transport.fuel_totals.IC+industrial_biofuel)) / (o.transport.fuel_totals.IC+industrial_biofuel)

    initial_elec_balance_positive_prc = 100*initial_elec_balance_positive / hours
    final_elec_balance_negative_prc = 100*final_elec_balance_negative / hours
    final_elec_balance_positive_prc = 100*final_elec_balance_positive / hours
    unmet_heat_demand_prc = 100*unmet_heat_demand_count / hours
    methane_store_empty_prc = 100*methane_store_empty_count / hours
    methane_store_full_prc = 100*methane_store_full_count / hours
    hydrogen_store_empty_prc = 100*hydrogen_store_empty_count / hours
    hydrogen_store_full_prc = 100*hydrogen_store_full_count / hours
    
    electrolysis_capacity_factor = 100*(total_electricity_for_electrolysis / (i.electrolysis_cap * 87600))
    power_to_X_capacity_factor = 100*(total_electricity_for_power_to_X / (i.power_to_X_cap * 87600))
    
    var out = "";
    var error = 0
    for (var hour = 0; hour < hours; hour++) {
        
        //var test = testlines[hour].split(",");
        //var heatstore_SOC = parseFloat(test[1]);
        //var BEV_Store_SOC = parseFloat(test[2]);
        //var hydrogen_SOC = parseFloat(test[4]);
        //var methane_SOC = parseFloat(test[5]);
        //var final_balance = parseFloat(test[6]);
        
        //error = Math.abs(final_balance-s5_final_balance[hour])
        
        //if (error>1) {
            //out += (hour+2)+"\t"+final_balance.toFixed(1)+"\t"+s5_final_balance[hour].toFixed(1)+"\t"+error+"\n";
        //}
        
        supply = d.elec_supply_hourly[hour]
        demand = d.s1_traditional_elec_demand[hour] + d.spacewater_elec[hour] + d.industry_elec[hour] + d.EL_transport[hour] + d.electricity_for_electrolysis[hour] + d.elec_store_charge[hour] + d.electricity_for_power_to_X[hour]
        balance = (supply + d.unmet_elec[hour] + d.electricity_from_dispatchable[hour] + d.elec_store_discharge[hour]) + d.EV_smart_discharge[hour] - demand-d.export_elec[hour]
        error += Math.abs(balance)
    } 
    
    console.log("balance error: "+error.toFixed(12));
    
    min_hydrogen_SOC_prc = 100 * min_hydrogen_SOC / i.hydrogen_storage_cap
    min_synth_fuel_store_SOC_prc = 100 * min_synth_fuel_store_SOC / max_synth_fuel_store_SOC
    min_methane_SOC_prc = 100 * min_methane_SOC / i.methane_store_capacity

    var datastarttime = 32*365.25*24*3600*1000;

    var date = new Date(datastarttime + (max_dispatchable_capacity_hour * 3600 * 1000));
    var h = date.getHours();
    if (h<10) h = "0"+h
    max_dispatchable_capacity_date = h+":00 "+(date.getDay()+1)+"/"+date.getMonth()+"/"+date.getFullYear();

    date = new Date(datastarttime + (max_shortfall_hour * 3600 * 1000));
    h = date.getHours();
    if (h<10) h = "0"+h
    max_shortfall_date = h+":00 "+(date.getDay()+1)+"/"+date.getMonth()+"/"+date.getFullYear();
    
    // ----------------------------------------------------------------------------
    // Land area factors
    // ----------------------------------------------------------------------------
    uk_landarea = 242495000000                                     // m2
    landarea_per_household = uk_landarea/i.households_2030           // m2 x 26 million households is 24 Mha

    // Biogas
    // 779 kha rotational grasses (ryegrass) produces 8.18 Modt product
    // 4.72 TWh/Modt used in MATRIX spreadsheet (or should it be 9.08?)
    // 8.18 Modt x 4.72 TWh/Modt = 38.61 TWh / 779 kha = 0.56 W/m2
    // 38.61 TWh per 0.779 Mha = 49.6 TWh per Mha or 0.02 Mha per TWh
    
    // 34.15 (20.49/0.6, ZCB MATRIX) TWh of biomass for biogas equivalent from waste sources
    // subtracted here so that land requirement shown is just for additional 
    // rotational grasses.
    
    grass_biomass_for_biogas = i.biomass_for_biogas - 34.15
    if (grass_biomass_for_biogas<0.0) grass_biomass_for_biogas = 0.0
    
    biomass_landarea_factor = 0.02 // old: ((0.1/365.25)/0.024) / 0.51
    grass_landarea_for_biogas = grass_biomass_for_biogas * biomass_landarea_factor
    grass_prc_landarea_for_biogas = 100 * grass_landarea_for_biogas / 24.2495
    
    // Synth fuel
    // 24.2 Modt/yr made up of 14.25 Modt/yr Miscanthus (950 kha) & 9.95 Modt/yr SRC (780 kha) 
    // 24.2 Modt/yr from 1730 kha total
    // 4.72 TWh/Modt used in MATRIX spreadsheet (or should it be 3.07?) 
    // 24.2 Modt/yr x 4.72 TWh/Modt = 114 TWh
    // 114 TWh per 1.730 MHa = 66 TWh/Mha or 0.0152 Mha per TWh
    
    biomass_landarea_factor = 0.0152 // old: ((0.1/365.25)/0.024) / 0.975
    landarea_for_synth_fuel = total_synth_fuel_biomass_used * biomass_landarea_factor
    prc_landarea_for_synth_fuel = 100 * landarea_for_synth_fuel / 24.2495
    
    // Biomass for heating and CHP
    // 8.79 Modt/yr made up of 2.99 Modt/yr SRF (1079 kha) & 5.80 Modt/yr SRC (455 kha) 
    // 8.79 Modt/yr from 1534 kha total
    // 4.72 TWh/Modt used in MATRIX spreadsheet
    // 8.79 Modt/yr x 4.72 TWh/Modt = 41.5 TWh
    // 41.5 TWh per 1.534 MHa = 27 TWh/Mha or 0.0370 Mha per TWh
      
    biomass_landarea_factor = 0.0370 // old: ((0.1/365.25)/0.024) / 0.975
    landarea_for_other_biomass = total_other_biomass_used * biomass_landarea_factor
    prc_landarea_for_other_biomass = 100 * landarea_for_other_biomass / 24.2495
    
    landarea_for_biomass = grass_landarea_for_biogas + landarea_for_synth_fuel + landarea_for_other_biomass    
    prc_landarea_for_biomass = 100 * landarea_for_biomass / 24.2495
    
    // prc_landarea_for_FT = 100 * landarea_for_FT / landarea_per_household
    // prc_landarea_for_sabatier = 100 * landarea_for_sabatier / landarea_per_household

    // ----------------------------------------------------------------------------
    // Scaled up to village, town, country scale
    // ----------------------------------------------------------------------------
    scaled_onshorewind_capacity = 1000000 * i.onshore_wind_capacity * i.number_of_households / i.households_2030
    scaled_offshorewind_capacity = 1000000 * i.offshore_wind_capacity * i.number_of_households / i.households_2030
    scaled_solarpv_capacity = 1000000 * i.solarpv_capacity * i.number_of_households / i.households_2030
    scaled_hydro_capacity = 1000000 * i.hydro_capacity * i.number_of_households / i.households_2030
    scaled_tidal_capacity = 1000000 * i.tidal_capacity * i.number_of_households / i.households_2030
    scaled_wave_capacity = 1000000 * i.wave_capacity * i.number_of_households / i.households_2030
    scaled_nuclear_capacity = 1000000 * i.nuclear_capacity * i.number_of_households / i.households_2030   
    scaled_CCGT_capacity = 1000000 * i.dispatch_gen_cap * i.number_of_households / i.households_2030
    
    scaled_electrolysis_capacity = 1000000 * i.electrolysis_cap * i.number_of_households / i.households_2030
    scaled_hydrogen_storage_cap = 1000000 * i.hydrogen_storage_cap * i.number_of_households / i.households_2030
    scaled_methanation_capacity = 1000000 * i.methanation_capacity * i.number_of_households / i.households_2030
    scaled_power_to_X_cap = 1000000 * i.power_to_X_cap * i.number_of_households / i.households_2030
    scaled_methane_store_capacity = 1000000 * i.methane_store_capacity * i.number_of_households / i.households_2030
    scaled_synth_fuel_capacity = 1000000 * i.synth_fuel_capacity * i.number_of_households / i.households_2030
    scaled_elec_store_storage_cap = 1000000 * i.elec_store_storage_cap * i.number_of_households / i.households_2030
    
    scaled_electric_car_battery_capacity = 1000000 * i.electric_car_battery_capacity * i.number_of_households / i.households_2030
    scaled_landarea_for_biomass = 1000000 * 10000 * landarea_for_biomass * i.number_of_households / i.households_2030

    // ----------------------------------------------------------------------------
    // Embodied Energy
    // ----------------------------------------------------------------------------    
    total_embodied_energy = 0
    EE_onshorewind = (i.onshore_wind_capacity * i.EE_onshorewind_GWh_per_GW * 0.001) / i.EE_onshorewind_lifespan
    total_embodied_energy += EE_onshorewind
    EE_offshorewind = (i.offshore_wind_capacity * i.EE_offshorewind_GWh_per_GW * 0.001) / i.EE_offshorewind_lifespan
    total_embodied_energy += EE_offshorewind
    EE_solarpv = (i.solarpv_capacity * i.EE_solarpv_GWh_per_GW * 0.001) / i.EE_solarpv_lifespan
    total_embodied_energy += EE_solarpv
    
    /*
    elec_store_cycles_per_year = (total_elec_store_charge*0.1) / i.elec_store_storage_cap
    EE_liion_store = 0// (((i.elec_store_storage_cap * 0.136) / 1500 * 0.8) * total_elec_store_charge)/3650
    total_embodied_energy += EE_liion_store

    carsvans_average_battery_size = 30.0
    carsvans_average_battery_cycles = 1500.0
    carsvans_lifetime_mileage = carsvans_average_battery_size * carsvans_average_battery_cycles * 4.0 // miles/kwh ~ 180k miles
    
    EE_ecar = 0
    carsvans_vehicle_miles = i.population_2030 * i.carsvans_miles_pp / (i.carsvans_load_factor*5)
    carsvans_manufactured_per_year = carsvans_vehicle_miles / carsvans_lifetime_mileage

    if (i.carsvans_miles_pp>0) EE_ecar = 20000.0 * carsvans_manufactured_per_year * 0.000000001
    total_embodied_energy += EE_ecar

    if (i.carsvans_miles_pp>0) EE_ecarbattery = 136.0 * carsvans_average_battery_size * carsvans_manufactured_per_year * 0.000000001
    total_embodied_energy += EE_ecarbattery
    */
    
    // this all cancels out
    // industry energy consumption for manufacturing cars is dependent on 
    // carsvans_miles_per_car = 25000.0
    // number_of_cars = carsvans_vehicle_miles / carsvans_miles_per_car
    // carvans_lifetime = (150000.0/carsvans_miles_per_car)
    // if (carsvans_miles_per_car>0) EE_ecar = 20000.0 * number_of_cars * 0.000000001 / carvans_lifetime
    
    prc_of_industry_demand = 100 * total_embodied_energy / total_industry_demand
}
// ---------------------------------------------------------------------------    
	
function fullzcb3_ui() {
    // Energy stacks visualisation definition
    var scl = 1.0/10000.0;
    var units = "TWh/yr";
    
    if (units_mode=="kwhdperperson") {
        units = "kWh/d.p"
        // GWh converted to kWh x 1000 x 1000, per day divide by 365 & 10 years
        scl = (1000.0*1000.0) / (10*365.0*i.population_2030)
    }
    
    if (units_mode=="kwhdperhousehold") {
        units = "kWh/d.h"
        // GWh converted to kWh x 1000 x 1000, per day divide by 365 & 10 years
        scl = (1000.0*1000.0) / (10*365.0*i.households_2030)
    }
    
    var stacks = [
      {"name":"Supply","height":(total_supply+total_unmet_demand)*scl,"saving":0,
        "stack":[
          {"kwhd":total_supply*scl,"name":"Supply","color":1},
          {"kwhd":total_unmet_demand*scl,"name":"Unmet","color":3}
        ]
      },
      {"name":"Supply","height":(total_supply+total_unmet_demand)*scl,"saving":0,
        "stack":[
          {"kwhd":o.supply.total_offshore_wind*scl,"name":"Offshore Wind","color":1},
          {"kwhd":o.supply.total_onshore_wind*scl,"name":"Onshore Wind","color":1},
          {"kwhd":o.supply.total_solarpv*scl,"name":"Solar PV","color":1},
          {"kwhd":o.supply.total_solarthermal*scl,"name":"Solar Thermal","color":1},
          {"kwhd":o.supply.total_wave*scl,"name":"Wave","color":1},
          {"kwhd":o.supply.total_tidal*scl,"name":"Tidal","color":1},
          {"kwhd":o.supply.total_hydro*scl,"name":"Hydro","color":1},
          {"kwhd":o.supply.total_geothermal_elec*scl,"name":"Geo Thermal Elec","color":1},
          {"kwhd":o.supply.total_geothermal_heat*scl,"name":"Geo Thermal Heat","color":1},
          {"kwhd":o.supply.total_nuclear*scl,"name":"Nuclear","color":1},
          {"kwhd":10000*total_biomass_used*scl,"name":"Biomass","color":1},
          {"kwhd":total_ambient_heat_supply*scl,"name":"Ambient","color":1},
          {"kwhd":total_unmet_demand*scl,"name":"Unmet","color":3}
        ]
      },
      
      {"name":"Demand","height":(total_demand+total_losses+total_exess)*scl,"saving":0,
        "stack":[
          {"kwhd":total_demand*scl,"name":"Demand","color":0},
          {"kwhd":total_losses*scl,"name":"Losses","color":2},
          {"kwhd":total_exess*scl,"name":"Exess","color":3}
        ]
      },

      {"name":"Demand","height":(total_demand+total_losses)*scl,"saving":0,
        "stack":[
          {"kwhd":total_traditional_elec*scl,"name":"LAC","color":0},
          {"kwhd":total_space_heat_demand*scl,"name":"Space Heat","color":0},
          {"kwhd":total_water_heat_demand*scl,"name":"Water Heat","color":0},
          {"kwhd":(total_EV_demand+total_elec_trains_demand)*scl,"name":"Electric Transport","color":0},
          {"kwhd":total_hydrogen_for_hydrogen_vehicles*scl,"name":"Hydrogen Transport","color":0},
          {"kwhd":10000*(o.transport.fuel_totals.IC-o.transport.modes.Aviation.IC.TWh)*scl,"name":"Biofuel Transport","color":0},
          {"kwhd":10000*o.transport.modes.Aviation.IC.TWh*scl,"name":"Aviation","color":0},
          // Industry
          {"kwhd":total_industrial_elec_demand*scl,"name":"Industry Electric","color":0},
          {"kwhd":total_industrial_methane_demand*scl,"name":"Industry Methane","color":0},
          {"kwhd":total_industrial_biomass_demand*scl,"name":"Industry Biomas","color":0},
          {"kwhd":10000*industrial_biofuel*scl,"name":"Industry Biofuel","color":0},/*
          {"kwhd":total_industry_solid/3650,"name":"Industry Biomass","color":0},
          // Backup, liquid and gas processes*/
          {"kwhd":o.total_losses.grid*scl,"name":"Grid losses","color":2},
          {"kwhd":total_electrolysis_losses*scl,"name":"H2 losses","color":2},
          {"kwhd":total_CCGT_losses*scl,"name":"CCGT losses","color":2},
          {"kwhd":total_FT_losses*scl,"name":"FT losses","color":2},
          {"kwhd":(total_sabatier_losses+total_power_to_X_losses)*scl,"name":"Sabatier losses","color":2},
          {"kwhd":total_anaerobic_digestion_losses*scl,"name":"AD losses","color":2},
          {"kwhd":(total_biomass_for_spacewaterheat_loss+total_methane_for_spacewaterheat_loss+total_hydrogen_for_spacewaterheat_loss)*scl,"name":"Boiler loss","color":2},
          {"kwhd":total_spill*scl,"name":"Total spill","color":2},

          /*
          {"kwhd":total_direct_gas_losses/3650,"name":"Direct gas loss","color":2},
          {"kwhd":total_direct_liquid_losses/3650,"name":"Direct liquid loss","color":2},

          {"kwhd":total_liion_losses/3650,"name":"Liion losses","color":2},
          {"kwhd":total_losses*scl,"name":"Losses","color":2},*/
          {"kwhd":total_exess*scl,"name":"Exess","color":3}
        ]
      }
    ];
    draw_stacks(stacks,"stacks",1000,600,units)
    
    /*
    var out = "";
    for (var z in scenarios.main) {
        if (window[z] != scenarios.main[z]) {
            out += "<tr><td>"+z+"</td><td>"+scenarios.main[z]+"</td><td>"+window[z]+"</td></tr>";
        }
    }
    $("#compare").html(out);
    if (out=="") $("#compare").parent().hide(); else $("#compare").parent().show();
    
    $.ajax({url: "scenario_descriptions/"+scenario_name+".html?v="+v, async: true, success: function(result){
        $("#scenario_description").html(result);
    }});*/
    v++;
}	
	
function fullzcb3_view()
{
    if (view_mode=="electricity")
    {
        console.log("view mode electric")
        $.plot("#placeholder", [

            // {label: "Heatstore", data:timeseries(d.heatstore, color:"#cc3311"},

            {stack:true, label: "Traditional", data:timeseries(d.s1_traditional_elec_demand), color:"#0044aa"},
            {stack:true, label: "Industry & Cooking", data:timeseries(d.industry_elec), color:"#1960d5"},
            {stack:true, label: "Electric Heat", data:timeseries(d.spacewater_elec), color:"#cc6622"},
            {stack:true, label: "Electric Transport", data:timeseries(d.EL_transport), color:"#aac15b"},
            {stack:true, label: "Elec Store Charge", data:timeseries(d.elec_store_charge), color:"#006a80"},
            {stack:true, label: "Electrolysis", data:timeseries(d.electricity_for_electrolysis), color:"#00aacc"},
            {stack:true, label: "PowerToX", data:timeseries(d.electricity_for_power_to_X), color:"#00bbdd"},
            {stack:true, label: "Exess", data:timeseries(d.export_elec), color:"#33ccff", lines: {lineWidth:0, fill: 0.4 }},            
            {stack:false, label: "Supply", data:timeseries(d.elec_supply_hourly), color:"#000000", lines: {lineWidth:0.2, fill: false }}

            ], {
                canvas: true,
                series: {lines: {lineWidth:0, fill: 1.0 } },
                xaxis:{mode:"time", min:view.start*1000, max:view.end*1000, minTickSize: [1, "hour"]},
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
    if (view_mode=="stores")
    {
        $.plot("#placeholder", [
                {stack:true, label: "Battery Store", data:timeseries(d.elecstore_SOC), yaxis:3, color:"#1960d5", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "Heat Store", data:timeseries(d.heatstore_SOC), yaxis:3, color:"#cc3311", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "BEV Store", data:timeseries(d.BEV_Store_SOC), yaxis:3, color:"#aac15b", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "Hydrogen Store", data:timeseries(d.hydrogen_SOC), yaxis:3, color:"#97b5e7", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "Synth Fuel Store", data:timeseries(d.synth_fuel_store_SOC), yaxis:3, color:"#cb9950", lines: {lineWidth:0, fill: 0.8 }},
                {stack:true, label: "Methane Store", data:timeseries(d.methane_SOC), yaxis:3, color:"#ccaa00", lines: {lineWidth:0, fill: 0.8 }}
            ], {
                xaxis:{mode:"time", min:view.start*1000, max:view.end*1000, minTickSize: [1, "hour"]},
                yaxes: [{},{min: 0},{}],
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
    if (view_mode=="backup")
    {
        $.plot("#placeholder", [
                {stack:true, label: "CCGT output", data:timeseries(d.electricity_from_dispatchable), yaxis:1, color:"#ccaa00", lines: {lineWidth:0, fill: 1.0 }},
                {stack:true, label: "Elec Store discharge", data:timeseries(d.elec_store_discharge), yaxis:1, color:"#1960d5", lines: {lineWidth:0, fill: 1.0 }},
                {stack:true, label: "EV Smart discharge", data:timeseries(d.EV_smart_discharge), yaxis:1, color:"#aac15b", lines: {lineWidth:0, fill: 1.0 }},
                {stack:false, label: "Heat Store", data:timeseries(d.heatstore_SOC), yaxis:2, color:"#cc3311", lines: {lineWidth:1, fill: false }},
                {stack:false, label: "Battery Store", data:timeseries(d.elecstore_SOC), yaxis:2, color:"#1960d5", lines: {lineWidth:1, fill: false }},
                {stack:false, label: "BEV Store", data:timeseries(d.BEV_Store_SOC), yaxis:2, color:"#aac15b", lines: {lineWidth:1, fill: false }},       
            ], {
                xaxis:{mode:"time", min:view.start*1000, max:view.end*1000, minTickSize: [1, "hour"]},
                yaxes: [{},{min: 0},{}],
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
    if (view_mode=="heat")
    {
        $.plot("#placeholder", [
                {stack:true, label: "Direct heat", data:timeseries(d.spacewater_heat), color:"#cc6622", lines: {lineWidth:0, fill: 1.0 }},
                {stack:true, label: "Heatstore discharge", data:timeseries(d.heatstore_discharge_GWth), color:"#a3511b", lines: {lineWidth:0, fill: 1.0 }} ,
                {stack:false, label: "Heatstore SOC", data:timeseries(d.heatstore_SOC), yaxis:2, color:"#cc3311", lines: {lineWidth:1, fill: false }},
                {stack:false, label: "Electric for heat", data:timeseries(d.spacewater_elec), color:"#97b5e7", lines: {lineWidth:0, fill: 0.8 }},
                {stack:false, label: "Heat Demand", data:timeseries(d.spacewater_balance), yaxis:1, color:"#000", lines: {lineWidth:1, fill: false }}
            ], {
                xaxis:{mode:"time", min:view.start*1000, max:view.end*1000, minTickSize: [1, "hour"]},
                yaxes: [{},{min: 0},{}],
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
}

if (typeof loading_prc === "undefined") {
    function loading_prc(a,b){console.log(b)}
}

$("#placeholder").bind("plothover", function (event, pos, item) {
    if (item) {
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;
            $("#tooltip").remove();
            tooltip(item.pageX, item.pageY, item.datapoint[1], "#DDDDDD");
        }
    } else {
        $("#tooltip").remove();
        previousPoint = null;
    }
});
    
function tooltip(x, y, contents, bgColour)
{
    var offset = 15; // use higher values for a little spacing between `x,y` and tooltip
    var elem = $('<div id="tooltip">' + contents + '</div>').css({
        position: 'absolute',
        display: 'none',
        'font-weight':'bold',
        border: '1px solid rgb(255, 221, 221)',
        padding: '2px',
        'background-color': bgColour,
        opacity: '0.8'
    }).appendTo("body").fadeIn(200);

    var elemY = y - elem.height() - offset;
    var elemX = x - elem.width()  - offset;
    if (elemY < 0) { elemY = 0; } 
    if (elemX < 0) { elemX = 0; } 
    elem.css({
        top: elemY,
        left: elemX
    });
};

