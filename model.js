// ---------------------------------------------------
// ZeroCarbonBritain hourly energy model v3
// ---------------------------------------------------

// Object to hold output variables
var o = {}
// Object to hold intermediate data variables
var d = {}

// Model -------------------------
var model = {

    init: function() {
        capacityfactors_all = [];
        for (var hour = 0; hour < i.hours; hour++) {
            var capacityfactors = tenyearsdatalines[hour].split(",");
            for (var z=0; z<capacityfactors.length; z++) {
                capacityfactors[z] = parseFloat(capacityfactors[z]);
            }
            capacityfactors_all.push(capacityfactors)
        } 
    },
    
    run: function() {

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
        
        o.total_biomass_used = 0
        
        model.transport_model()
        model.supply();
        model.lac();
        model.space_water_heat_demand();
        model.heatstore();
        model.heating_systems();
        model.industry();
        // model.bivalent_backup();
        model.electric_transport();
        model.main_loop();
        model.final();
        model.land_area();
        model.scaled_by();
        model.embodied_energy();
    },

    // ---------------------------------------------------------------------------------------------    
    // Transport model
    // ---------------------------------------------------------------------------------------------         
    transport_model: function() {

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
    },

    // ---------------------------------------------------------------------------------------------    
    // Electricity supply model
    // ---------------------------------------------------------------------------------------------         
    supply: function() {
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
    },

    // ---------------------------------------------------------------------------------------------    
    // Lighting, cooking and appliances
    // --------------------------------------------------------------------------------------------- 
    lac: function() {
    
        annual_cooking_elec = i.annual_cooking_elec_domestic + i.annual_cooking_elec_services

        let daily_cooking_elec = annual_cooking_elec * 1000.0 / 365.25

        o.prc_reduction_domestic_cooking = 1.0 - (i.annual_cooking_elec_domestic / 15.0)
        o.prc_reduction_domestic_appliances = 1.0 - (i.trad_elec_domestic_appliances / 86.0)
        o.prc_reduction_services_appliances = 1.0 - (i.trad_elec_services_appliances / 59.0)
        o.prc_reduction_services_cooling = 1.0 - (i.trad_elec_services_cooling / 9.0)
        o.prc_reduction_services_catering = 1.0 - (i.annual_cooking_elec_services / 22.0)
        
        let trad_elec_demand =i.trad_elec_domestic_appliances + i.trad_elec_services_appliances + i.trad_elec_services_cooling 
        let daily_trad_elec_demand = trad_elec_demand * 1000.0 / 365.25

        o.total_traditional_elec = 0
        
        d.lac_demand = []
            
        for (var hour = 0; hour < i.hours; hour++) {
            let capacityfactors = capacityfactors_all[hour]

            let cooking_elec = cooking_profile[hour%24] * daily_cooking_elec
            
            let normalised_trad_elec = capacityfactors[5]/331.033
            let traditional_elec_demand = normalised_trad_elec * trad_elec_demand
            
            if (i.use_flat_profiles) traditional_elec_demand = daily_trad_elec_demand / 24.0
            traditional_elec_demand += cooking_elec
            
            d.lac_demand.push(traditional_elec_demand)
            o.total_traditional_elec += traditional_elec_demand
        }
        
        o.domestic_appliances_kwh = i.trad_elec_domestic_appliances * 1000000000 / i.households_2030
        o.domestic_cooking_kwh = i.annual_cooking_elec_domestic * 1000000000 / i.households_2030
    },

    // ---------------------------------------------------------------------------------------------    
    // Space and water heat demand
    // ---------------------------------------------------------------------------------------------     
    space_water_heat_demand: function() {

        o.space_heat_demand_GWK = i.domestic_space_heat_demand_GWK + i.services_space_heat_demand_GWK + i.industry_space_heat_demand_GWK

        o.water_heating = i.domestic_water_heating + i.services_water_heating

        let water_heating_daily_demand = o.water_heating * 1000.0 / 365.25    

        o.prc_reduction_domestic_water_heating = 1.0 - (i.domestic_water_heating / 71.0)
        o.prc_reduction_services_water_heating = 1.0 - (i.services_water_heating / 16.0)


        o.total_domestic_space_heat_demand = 0
        o.total_services_space_heat_demand = 0
        o.total_industry_space_heat_demand = 0
        o.total_space_heat_demand = 0
        o.total_water_heat_demand = 0

        d.spacewater_demand_before_heatstore = []
        
        for (var hour = 0; hour < i.hours; hour++) {
            var day = parseInt(Math.floor(hour / 24))
            var temperature = parseFloat(temperaturelines[day].split(",")[1]); 

            let degree_hours = i.space_heat_base_temperature - temperature
            if (degree_hours<0) degree_hours = 0
            
            // Domestic space heat
            let domestic_space_heat_demand = degree_hours * i.domestic_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]
            o.total_domestic_space_heat_demand += domestic_space_heat_demand
            // Services space heat        
            let services_space_heat_demand = degree_hours * i.services_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]
            o.total_services_space_heat_demand += services_space_heat_demand
            // Industry space heat        
            let industry_space_heat_demand = degree_hours * i.industry_space_heat_demand_GWK * 24.0 * space_heat_profile[hour%24]        
            o.total_industry_space_heat_demand += industry_space_heat_demand
            // Combined space heat         
            let space_heat_demand = domestic_space_heat_demand + services_space_heat_demand + industry_space_heat_demand
            o.total_space_heat_demand += space_heat_demand
            
            // water heat
            let hot_water_demand = hot_water_profile[hour%24] * water_heating_daily_demand
            o.total_water_heat_demand += hot_water_demand 
            
            let spacewater_demand_before_heatstore = space_heat_demand + hot_water_demand - d.heat_supply_hourly[hour]
            d.spacewater_demand_before_heatstore.push(spacewater_demand_before_heatstore)
        }

        o.domestic_space_heating_kwh = o.total_domestic_space_heat_demand*0.1*1000000 / i.households_2030
        o.domestic_water_heating_kwh = i.domestic_water_heating*1000000000 / i.households_2030
        // o.spaceheatkwhm2 = o.domestic_space_heating_kwh / i.simple_BEM.TFA
        
        o.prc_reduction_domestic_space_heat_demand = 1.0 - ((o.total_domestic_space_heat_demand*0.0001) / 266.0)
        o.prc_reduction_services_space_heat_demand = 1.0 - ((o.total_services_space_heat_demand*0.0001) / 83.0)
        o.prc_reduction_industry_space_heat_demand = 1.0 - ((o.total_industry_space_heat_demand*0.0001) / 28.0)
        o.prc_reduction_space_heat_demand = 1.0 - ((o.total_space_heat_demand*0.0001) / (266.0+83.0+28.0))
        
        // move to hourly model if needed
        // i.heatpump_COP_hourly = i.heatpump_COP
        // GWth_GWe = (i.heatpump_COP_hourly * i.spacewater_share_heatpumps) + (i.elres_efficiency * i.spacewater_share_elres) + (i.methane_boiler_efficiency * i.spacewater_share_methane)
    },

    // --------------------------------------------------------------------------------------------------------------
    // Stage 2: Heatstore
    // --------------------------------------------------------------------------------------------------------------    
    heatstore: function () {

        heatstore_SOC_start = i.heatstore_storage_cap * 0.5        
        heatstore_SOC = heatstore_SOC_start
    
        d.deviation_from_mean_GWth = []
        
        for (var hour = 0; hour < i.hours; hour++) {
            
            var sum = 0; var n = 0;
            for (var z=-12; z<12; z++) {
                var index = hour + z
                if (index>=i.hours) index-=i.hours
                if (index<0) index += i.hours
                sum += d.spacewater_demand_before_heatstore[index]
                n++;
            }
            average_12h_balance_heat = sum / n;
            
            deviation_from_mean_GWe = d.spacewater_demand_before_heatstore[hour] - average_12h_balance_heat
            deviation_from_mean_GWth = deviation_from_mean_GWe //* GWth_GWe
            
            d.deviation_from_mean_GWth.push(deviation_from_mean_GWth)
        }

        d.spacewater_demand_after_heatstore = []
        d.spacewater_balance = []
        d.heatstore_discharge_GWth = []
        d.heatstore_SOC = []
        d.spacewater_heat = []

        total_heat_spill = 0
        
        for (var hour = 0; hour < i.hours; hour++) {

            spacewater_balance = d.spacewater_demand_before_heatstore[hour]
            d.spacewater_balance.push(spacewater_balance)  
        
            heatstore_charge_GWth = 0
            heatstore_discharge_GWth = 0
            

            
            if (i.heatstore_enabled) {
                // CHARGE
                if (d.deviation_from_mean_GWth[hour]<0.0) {
                    heatstore_charge_GWth = -d.deviation_from_mean_GWth[hour] * 0.40 * (i.heatstore_storage_cap / 100.0)
                    //heatstore_charge_GWth = (i.heatstore_storage_cap-heatstore_SOC)*-d.deviation_from_mean_GWth[hour]/(i.heatstore_storage_cap*0.5)
                }
                if (heatstore_charge_GWth>i.heatstore_charge_cap) heatstore_charge_GWth = i.heatstore_charge_cap
                if ((heatstore_charge_GWth+heatstore_SOC)>i.heatstore_storage_cap) heatstore_charge_GWth = i.heatstore_storage_cap - heatstore_SOC
                
                spacewater_balance += heatstore_charge_GWth
                heatstore_SOC += heatstore_charge_GWth
                
                // DISCHARGE
                if (d.deviation_from_mean_GWth[hour]>=0.0) {  
                    heatstore_discharge_GWth = d.deviation_from_mean_GWth[hour] * 0.32 * (i.heatstore_storage_cap / 100.0)
                    //heatstore_discharge_GWth = heatstore_SOC*d.deviation_from_mean_GWth[hour]/(i.heatstore_storage_cap*0.5)
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
            
            d.heatstore_SOC.push(heatstore_SOC)
            d.spacewater_heat.push(spacewater_balance)
            // space & water heat tab
            spacewater_demand_after_heatstore = spacewater_balance
            if (spacewater_demand_after_heatstore<0.0) spacewater_demand_after_heatstore = 0.0
            d.spacewater_demand_after_heatstore.push(spacewater_demand_after_heatstore)
        }
    },

    // --------------------------------------------------------------------------------------------------------------
    // Heating systems
    // --------------------------------------------------------------------------------------------------------------     
    heating_systems: function() {
        d.methane_for_spacewaterheat = []
        d.hydrogen_for_spacewaterheat = []

        o.total_losses.heating_systems = 0
        
        o.total_unmet_heat_demand = 0
        o.unmet_heat_demand_count = 0
        
        max_heat_demand_elec = 0
        total_ambient_heat_supply = 0
        
        d.spacewater_elec = []
        
        o.heating_systems = {}
        for (var z in i.heating_systems) {
            o.heating_systems[z] = {
                heat_demand: 0,
                fuel_demand: 0
            }
        }
        
        for (var hour = 0; hour < i.hours; hour++) {
            let heat_demand = d.spacewater_demand_after_heatstore[hour]
            
            let heat_supplied = 0
            let system_heat_demand = {}
            let system_fuel_demand = {}
            
            for (var z in i.heating_systems) {
                 
                // heatpumps
                // i.heatpump_COP = 1.8+(temperature+15.0)*0.05
                // if (temperature<-15.0) i.heatpump_COP = 1.8
            
                system_heat_demand[z] = heat_demand * (i.heating_systems[z].share * 0.01)
                system_fuel_demand[z] = system_heat_demand[z] / (i.heating_systems[z].efficiency*0.01)

                o.heating_systems[z].heat_demand += system_heat_demand[z]
                o.heating_systems[z].fuel_demand += system_fuel_demand[z]
                heat_supplied += system_heat_demand[z]
                
                if (system_fuel_demand[z]<system_heat_demand[z]) {
                    total_ambient_heat_supply += system_heat_demand[z] - system_fuel_demand[z]   
                } else {
                    o.total_losses.heating_systems += system_fuel_demand[z] - system_heat_demand[z]
                }
            }
            
            // check for unmet heat
            let unmet_heat_demand = heat_demand - heat_supplied
            if (unmet_heat_demand.toFixed(3)>0) {
                o.unmet_heat_demand_count++
                o.total_unmet_heat_demand += unmet_heat_demand
            }
            
            o.total_biomass_used += system_fuel_demand.biomass
            d.methane_for_spacewaterheat.push(system_fuel_demand.methane)
            d.hydrogen_for_spacewaterheat.push(system_fuel_demand.hydrogen)
            
            let spacewater_elec_demand = system_fuel_demand.elres + system_fuel_demand.heatpump
            if (spacewater_elec_demand>max_heat_demand_elec) max_heat_demand_elec = spacewater_elec_demand
            d.spacewater_elec.push(spacewater_elec_demand)       
        }
    },

    // ---------------------------------------------------------------------------
    // Industrial
    // ---------------------------------------------------------------------------    
    industry: function() {
    
        i.annual_high_temp_process = 49.01 * i.ipr         // 26.3% elec, 73.7% gas in original model
        i.annual_low_temp_dry_sep = 117.78 * i.ipr         // 66% elec, 11% gas, 22% biomass CHP in original model      
        i.annual_non_heat_process_elec = 88.00 * i.ipr
        i.annual_non_heat_process_biogas = 13.44 * i.ipr
        i.annual_non_heat_process_biomass = 5.58 * i.ipr    
        i.industrial_biofuel = 13.44 * i.ipr

        o.total_industry_demand = i.annual_high_temp_process + i.annual_low_temp_dry_sep + i.annual_non_heat_process_elec + i.annual_non_heat_process_biogas + i.annual_non_heat_process_biomass +i.industrial_biofuel
        
        daily_high_temp_process = i.annual_high_temp_process * 1000.0 / 365.25
        daily_low_temp_dry_sep = i.annual_low_temp_dry_sep * 1000.0 / 365.25
              
        daily_non_heat_process_elec = i.annual_non_heat_process_elec * 1000.0 / 365.25
        daily_non_heat_process_biogas = i.annual_non_heat_process_biogas * 1000.0 / 365.25
        daily_non_heat_process_biomass = i.annual_non_heat_process_biomass * 1000.0 / 365.25
            
        daily_industrial_biofuel = i.industrial_biofuel * 1000.0 / 365.25
        
    
        d.industrial_elec_demand = []
        d.methane_for_industry = []
        d.balance_before_BEV_storage = []


        o.total_industrial_elec_demand = 0
        o.total_industrial_methane_demand = 0
        o.total_industrial_biomass_demand = 0
        o.total_industrial_liquid_demand = 0
            
        for (var hour = 0; hour < i.hours; hour++)
        {
            
            // electric demand
            non_heat_process_elec = not_heat_process_profile[hour%24] * daily_non_heat_process_elec

            // balance including non DSR industrial load
            balance = d.elec_supply_hourly[hour] - d.lac_demand[hour] - d.spacewater_elec[hour] - non_heat_process_elec

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
            
            d.industrial_elec_demand.push(industrial_elec_demand)
            o.total_industrial_elec_demand += industrial_elec_demand
            
            // methane demand
            non_heat_process_biogas = not_heat_process_profile[hour%24] * daily_non_heat_process_biogas
            industrial_methane_demand = non_heat_process_biogas + heat_process_fixed_gas + heat_process_DSR_gas
            
            d.methane_for_industry.push(industrial_methane_demand)
            o.total_industrial_methane_demand += industrial_methane_demand
            
            // Not heat biomass demand
            non_heat_process_biomass = not_heat_process_profile[hour%24] * daily_non_heat_process_biomass
            
            o.total_industrial_biomass_demand += non_heat_process_biomass
            o.total_industrial_biomass_demand += heat_process_fixed_biomass
            
            o.total_biomass_used += non_heat_process_biomass
            o.total_biomass_used += heat_process_fixed_biomass
            
            // Balance calculation for BEV storage stage
            d.balance_before_BEV_storage.push(d.elec_supply_hourly[hour] - d.lac_demand[hour] - d.spacewater_elec[hour] - d.industrial_elec_demand[hour])   
        }
    },

    // -------------------------------------------------------------------------------------
    // Bivalent heat substitution
    // -------------------------------------------------------------------------------------  
    /*  
    bivalent_backup: function() {

        bivalent_backup = false
        if (bivalent_backup) {
            total_ambient_heat_supply = 0
            var spacewater_elec_demand = 0;
            var balance = 0;
            var unmet = 0;
            var spacewater_bivalent = 0;

            for (var hour = 0; hour < i.hours; hour++)
            {
                
                spacewater_elec_demand = d.spacewater_elec[hour]
                balance = d.elec_supply_hourly[hour] - d.lac_demand[hour] - spacewater_elec_demand - d.industrial_elec_demand[hour]
                
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
                d.methane_for_spacewaterheat[hour] += methane_for_spacewaterheat
                total_methane_for_spacewaterheat_loss += methane_for_spacewaterheat - spacewater_heat_bivalent 
                
                
                
                heat_from_heatpumps = spacewater_elec_heatpumps * i.heatpump_COP
                ambient_heat_used = heat_from_heatpumps * (1.0-1.0/i.heatpump_COP)
                total_ambient_heat_supply += ambient_heat_used
                
                // repopulate
                d.spacewater_elec[hour] = spacewater_elec_demand
                d.balance_before_BEV_storage[hour] = d.elec_supply_hourly[hour] - d.lac_demand[hour] - spacewater_elec_demand - d.industrial_elec_demand[hour]
            }
        }
    },*/

    // -------------------------------------------------------------------------------------
    // Elec transport
    // -------------------------------------------------------------------------------------    
    electric_transport: function() {

        daily_BEV_demand = o.transport.fuel_totals.BEV * 1000.0 / 365.25
        daily_elec_trains_demand = o.transport.fuel_totals.DEV * 1000.0 / 365.25

        BEV_Store_SOC_start = i.electric_car_battery_capacity * 0.5
        BEV_Store_SOC = BEV_Store_SOC_start
        
        total_EV_charge = 0
        total_EV_demand = 0
        unmet_EV_demand = 0

        total_elec_trains_demand = 0
        
        d.balance_before_elec_store = []
        
        d.EV_charge = []
        d.EV_smart_discharge = []
        d.BEV_Store_SOC = []
        d.EL_transport = []
        
        for (var hour = 0; hour < i.hours; hour++)
        {
            balance = d.balance_before_BEV_storage[hour]
            
            // ---------------------------------------------
            // +- 12 h average of balance before BEV Storage
            var sum = 0; var n = 0;
            for (var z=-24; z<24; z++) {
                var index = hour + z
                if (index>=i.hours) index-=i.hours
                if (index<0) index += i.hours
                sum += d.balance_before_BEV_storage[index]
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
            d.BEV_Store_SOC.push(BEV_Store_SOC)
            d.EL_transport.push(elec_trains_demand + EV_charge)
            d.balance_before_elec_store.push(balance)        
        }    
    },
        
    main_loop: function() {

        // ---------------------------------------------
        // Store SOC's
        // ---------------------------------------------
        elecstore_SOC_start = i.elec_store_storage_cap * 1.0
        hydrogen_SOC_start = i.hydrogen_storage_cap * 0.5
        store_efficiency = 1.0 - (1.0-i.store_roundtrip_efficiency)*0.5
        // i.methane_SOC_start = i.methane_store_capacity * 0.5
        // i.synth_fuel_store_SOC_start = 10000.0

        elecstore_SOC = elecstore_SOC_start
        hydrogen_SOC = hydrogen_SOC_start
        methane_SOC = i.methane_SOC_start
        synth_fuel_store_SOC = i.synth_fuel_store_SOC_start
        
        o.max_methane_SOC = 0
        o.max_hydrogen_SOC = 0
        o.max_synth_fuel_store_SOC = 0
        
        o.min_methane_SOC = i.methane_store_capacity
        o.min_hydrogen_SOC = i.hydrogen_storage_cap
        o.min_synth_fuel_store_SOC = 1000000

        o.total_hydrogen_produced = 0
        o.total_electricity_for_electrolysis = 0
        o.total_hydrogen_demand = 0
        o.total_hydrogen_for_hydrogen_vehicles = 0
        o.unmet_hydrogen_demand = 0
        o.unmet_synth_fuel_demand = 0
        
        o.total_electricity_for_power_to_X = 0
        
        // --------------------------------------------- 
        // Final balance
        // ---------------------------------------------
        o.initial_elec_balance_positive = 0
        o.final_elec_balance_negative = 0
        o.final_elec_balance_positive = 0
        o.total_initial_elec_balance_positive = 0
        o.total_final_elec_balance_negative = 0
        o.total_final_elec_balance_positive = 0

        methane_store_empty_count = 0
        methane_store_full_count = 0
        hydrogen_store_empty_count = 0
        hydrogen_store_full_count = 0
        o.total_synth_fuel_produced = 0
        o.total_synth_fuel_biomass_used = 0
        o.total_methane_made = 0
        o.total_electricity_from_dispatchable = 0
        o.max_dispatchable_capacity = 0
        o.max_dispatchable_capacity_hour = 0
        o.max_shortfall = 0
        max_shortfall_hour = 0
        o.total_methane_demand = 0
        
        // demand totals
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
        
        daily_transport_H2_demand = o.transport.fuel_totals.H2 * 1000.0 / 365.25
        daily_transport_liquid_demand = o.transport.fuel_totals.IC * 1000.0 / 365.25

        daily_biomass_for_biogas = i.biomass_for_biogas * 1000.0 / 365.25
        hourly_biomass_for_biogas = daily_biomass_for_biogas / 24.0
 
                                         // HHV, originally 0.5747
        co2_tons_per_gwh_methane = (1000.0/15.4)*((0.40*44.009)/(0.60*16.0425))  // 15.4 kWh/kg, MWh/ton HHV, proportion by molar mass
        
        d.elecstore_SOC = []
        d.elec_store_charge = []
        d.elec_store_discharge = []
        d.electricity_for_electrolysis = []
        d.electricity_for_power_to_X = []

        d.electricity_from_dispatchable = []
        d.export_elec = []
        d.unmet_elec = []
        d.methane_SOC = []
        d.synth_fuel_store_SOC = []
        d.hydrogen_SOC = []

        for (var hour = 0; hour < i.hours; hour++)
        {
            
            var balance = d.balance_before_elec_store[hour]

            // -------------------------------------------------------------------------------------
            // Elec Store
            // -------------------------------------------------------------------------------------
               
            elec_store_charge = 0
            elec_store_discharge = 0        
            // ---------------------------------------------------------------------------
            // 12 h average store implementation
            // ---------------------------------------------------------------------------
            // +- 12 h average of balance
            var sum = 0; var n = 0;
            for (var z=-12; z<12; z++) {
                var index = hour + z
                if (index>=i.hours) index-=i.hours
                if (index<0) index += i.hours
                sum += d.balance_before_elec_store[index]
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
            
            d.elecstore_SOC.push(elecstore_SOC)        
            d.elec_store_charge.push(elec_store_charge)
            d.elec_store_discharge.push(elec_store_discharge)
            
            if (balance>=0.0) {
                o.total_initial_elec_balance_positive += balance
                o.initial_elec_balance_positive++
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
            
            o.total_electricity_for_electrolysis += electricity_for_electrolysis
            
            hydrogen_balance = hydrogen_from_electrolysis
            o.total_hydrogen_produced += hydrogen_from_electrolysis
            
            // hydrogen heating demand
            hydrogen_balance -= d.hydrogen_for_spacewaterheat[hour]
                    
            // 2. Hydrogen vehicle demand
            hydrogen_for_hydrogen_vehicles = daily_transport_H2_demand / 24.0
            o.total_hydrogen_for_hydrogen_vehicles += hydrogen_for_hydrogen_vehicles
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
                o.unmet_hydrogen_demand += -1*hydrogen_SOC
                hydrogen_SOC = 0.0
            }
            
            if (hydrogen_SOC>o.max_hydrogen_SOC) o.max_hydrogen_SOC = hydrogen_SOC
            if (hydrogen_SOC<o.min_hydrogen_SOC) o.min_hydrogen_SOC = hydrogen_SOC

            o.total_hydrogen_demand += hydrogen_for_hydrogen_vehicles + hydrogen_to_synth_fuel + hydrogen_for_sabatier
                 
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
            
            o.total_electricity_for_power_to_X += electricity_for_power_to_X
            
            // Losses and electric consumption graph
            total_power_to_X_losses += electricity_for_power_to_X - (methane_from_IHTEM + synth_fuel_produced_PTL)
            d.electricity_for_power_to_X.push(electricity_for_power_to_X)
            
            // Add to stores and totals
            o.total_synth_fuel_produced += synth_fuel_produced_PTL
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
                o.total_electricity_from_dispatchable += electricity_from_dispatchable
                
                if (electricity_from_dispatchable>o.max_dispatchable_capacity) {
                    o.max_dispatchable_capacity = electricity_from_dispatchable
                    o.max_dispatchable_capacity_hour = hour
                }
            }
            d.electricity_from_dispatchable.push(electricity_from_dispatchable)
            
            // Final electricity balance
            balance += electricity_from_dispatchable

            export_elec = 0.0
            unmet_elec = 0.0
            if (balance>=0.0) {
                export_elec = balance
                o.total_final_elec_balance_positive += export_elec
                o.final_elec_balance_positive++
            } else {
                unmet_elec = -balance
                o.total_final_elec_balance_negative += unmet_elec
                o.final_elec_balance_negative++
                
                if (unmet_elec>o.max_shortfall) {
                    o.max_shortfall = unmet_elec
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
            o.total_methane_made += methane_production
            methane_to_dispatchable = electricity_from_dispatchable / i.dispatchable_gen_eff
            
            methane_demand = methane_to_dispatchable + d.methane_for_spacewaterheat[hour] + d.methane_for_industry[hour]
            o.total_methane_demand += methane_demand
            
            methane_balance = methane_production - methane_demand
                    
            methane_SOC += methane_balance
            if (methane_SOC>i.methane_store_capacity) {
                methane_store_vented += methane_SOC - i.methane_store_capacity
                methane_SOC = i.methane_store_capacity
            }
            
            d.methane_SOC.push(methane_SOC)
            if ((methane_SOC/i.methane_store_capacity)<0.01) methane_store_empty_count ++
            if ((methane_SOC/i.methane_store_capacity)>0.99) methane_store_full_count ++
            
            if (methane_SOC>o.max_methane_SOC) o.max_methane_SOC = methane_SOC
            if (methane_SOC<o.min_methane_SOC) o.min_methane_SOC = methane_SOC
            // ------------------------------------------------------------------------------------
            // Synth fuel FT
            synth_fuel_produced_FT = hydrogen_to_synth_fuel / i.FT_process_hydrogen_req
            
            o.total_synth_fuel_produced += synth_fuel_produced_FT
            o.total_synth_fuel_biomass_used += hourly_biomass_for_biofuel
            
            synth_fuel_store_SOC += synth_fuel_produced_FT
            
            total_FT_losses += (hydrogen_to_synth_fuel + hourly_biomass_for_biofuel) - (hydrogen_to_synth_fuel / i.FT_process_hydrogen_req)
            
            synth_fuel_demand = (daily_transport_liquid_demand + daily_industrial_biofuel) / 24.0
            o.total_industrial_liquid_demand += daily_industrial_biofuel / 24.0
            
            synth_fuel_store_SOC -= synth_fuel_demand

            if (synth_fuel_store_SOC<0.0) {
                o.unmet_synth_fuel_demand += -1*synth_fuel_store_SOC
                synth_fuel_store_SOC = 0.0
            }
            
            total_synth_fuel_demand += synth_fuel_demand

            d.synth_fuel_store_SOC.push(synth_fuel_store_SOC)   
            
            if (synth_fuel_store_SOC>o.max_synth_fuel_store_SOC) o.max_synth_fuel_store_SOC = synth_fuel_store_SOC
            if (synth_fuel_store_SOC<o.min_synth_fuel_store_SOC) o.min_synth_fuel_store_SOC = synth_fuel_store_SOC   
            // ------------------------------------------------------------------------------------
            // Biomass
            o.total_biomass_used += biogas_supply / i.anaerobic_digestion_efficiency 
            o.total_biomass_used += hourly_biomass_for_biofuel
            
            // Hydrogen SOC data
            d.hydrogen_SOC.push(hydrogen_SOC)
            if ((hydrogen_SOC/i.hydrogen_storage_cap)<0.01) hydrogen_store_empty_count ++
            if ((hydrogen_SOC/i.hydrogen_storage_cap)>0.99) hydrogen_store_full_count ++
        }
    },
    
    final: function() {

        // -------------------------------------------------------------------------------
        
        o.total_unmet_demand = o.total_final_elec_balance_negative
        
        o.total_supply = o.supply.total_electricity + o.supply.total_fixed_heat + o.total_biomass_used + total_ambient_heat_supply 
        
        o.total_demand = 0
        o.total_demand += o.total_traditional_elec 
        o.total_demand += o.total_space_heat_demand
        o.total_demand += o.total_water_heat_demand
        o.total_demand += o.total_industrial_elec_demand
        o.total_demand += o.total_industrial_methane_demand
        o.total_demand += o.total_industrial_biomass_demand
        
        o.total_demand += total_EV_demand
        o.total_demand += total_elec_trains_demand
        o.total_demand += o.total_hydrogen_for_hydrogen_vehicles
        o.total_demand += total_synth_fuel_demand
        
        // -------------------------------------------------------------------------------------------------
        let final_store_balance = 0
        
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
        console.log("o.unmet_hydrogen_demand: "+o.unmet_hydrogen_demand)
        console.log("o.unmet_synth_fuel_demand: "+o.unmet_synth_fuel_demand)
        o.total_unmet_demand += unmet_EV_demand + o.unmet_hydrogen_demand + o.unmet_synth_fuel_demand
        
        total_spill = methane_store_vented + total_heat_spill
        
        // -------------------------------------------------------------------------------------------------
        o.total_exess = o.total_final_elec_balance_positive + final_store_balance; //o.total_supply - o.total_demand
        total_losses = o.total_losses.grid + total_electrolysis_losses + total_CCGT_losses + total_anaerobic_digestion_losses + total_sabatier_losses + total_FT_losses + total_spill + total_power_to_X_losses
        total_losses += o.total_losses.heating_systems
        total_losses += total_store_losses

        console.log("total_supply: "+o.total_supply)
        console.log("total_unmet_demand: "+o.total_unmet_demand)
        console.log("total_demand: "+o.total_demand)    
        console.log("total_losses: "+total_losses)
        console.log("total_exess: "+o.total_exess)
            
        let unaccounted_balance = o.total_supply + o.total_unmet_demand - o.total_demand - total_losses - o.total_exess
        console.log("unaccounted_balance: "+unaccounted_balance.toFixed(6))
        // -------------------------------------------------------------------------------------------------
        
        console.log("max heat elec demand: "+max_heat_demand_elec);
        
        o.primary_energy_factor = o.total_supply / o.total_demand
        
        // -------------------------------------------------------------------------------
        
        o.total_initial_elec_balance_positive = o.total_initial_elec_balance_positive / 10000.0
        o.total_final_elec_balance_negative = o.total_final_elec_balance_negative / 10000.0
        o.total_final_elec_balance_positive = o.total_final_elec_balance_positive / 10000.0
        o.total_unmet_heat_demand = (o.total_unmet_heat_demand/ 10000.0).toFixed(3);
        o.total_synth_fuel_biomass_used = o.total_synth_fuel_biomass_used / 10000.0
        o.total_electricity_from_dispatchable /= 10000.0
        o.total_biomass_used /= 10000.0
        o.total_other_biomass_used = o.total_biomass_used - i.biomass_for_biogas - o.total_synth_fuel_biomass_used
        
        liquid_fuel_produced_prc_diff = 100 * (o.total_synth_fuel_produced - (o.transport.fuel_totals.IC+i.industrial_biofuel)) / (o.transport.fuel_totals.IC+i.industrial_biofuel)

        o.initial_elec_balance_positive_prc = 100*o.initial_elec_balance_positive / i.hours
        o.final_elec_balance_negative_prc = 100*o.final_elec_balance_negative / i.hours
        o.final_elec_balance_positive_prc = 100*o.final_elec_balance_positive / i.hours
        o.unmet_heat_demand_prc = 100*o.unmet_heat_demand_count / i.hours
        o.methane_store_empty_prc = 100*methane_store_empty_count / i.hours
        o.methane_store_full_prc = 100*methane_store_full_count / i.hours
        o.hydrogen_store_empty_prc = 100*hydrogen_store_empty_count / i.hours
        o.hydrogen_store_full_prc = 100*hydrogen_store_full_count / i.hours
        
        o.electrolysis_capacity_factor = 100*(o.total_electricity_for_electrolysis / (i.electrolysis_cap * 87600))
        o.power_to_X_capacity_factor = 100*(o.total_electricity_for_power_to_X / (i.power_to_X_cap * 87600))
        
        var out = "";
        var error = 0
        for (var hour = 0; hour < i.hours; hour++) {
            
            supply = d.elec_supply_hourly[hour]
            demand = d.lac_demand[hour] + d.spacewater_elec[hour] + d.industrial_elec_demand[hour] + d.EL_transport[hour] + d.electricity_for_electrolysis[hour] + d.elec_store_charge[hour] + d.electricity_for_power_to_X[hour]
            balance = (supply + d.unmet_elec[hour] + d.electricity_from_dispatchable[hour] + d.elec_store_discharge[hour]) + d.EV_smart_discharge[hour] - demand-d.export_elec[hour]
            error += Math.abs(balance)
        } 
        
        console.log("balance error: "+error.toFixed(12));
        
        o.min_hydrogen_SOC_prc = 100 * o.min_hydrogen_SOC / i.hydrogen_storage_cap
        o.min_synth_fuel_store_SOC_prc = 100 * o.min_synth_fuel_store_SOC / o.max_synth_fuel_store_SOC
        o.min_methane_SOC_prc = 100 * o.min_methane_SOC / i.methane_store_capacity

        var datastarttime = 32*365.25*24*3600*1000;

        var date = new Date(datastarttime + (o.max_dispatchable_capacity_hour * 3600 * 1000));
        var h = date.getHours();
        if (h<10) h = "0"+h
        o.max_dispatchable_capacity_date = h+":00 "+(date.getDay()+1)+"/"+date.getMonth()+"/"+date.getFullYear();

        date = new Date(datastarttime + (max_shortfall_hour * 3600 * 1000));
        h = date.getHours();
        if (h<10) h = "0"+h
        o.max_shortfall_date = h+":00 "+(date.getDay()+1)+"/"+date.getMonth()+"/"+date.getFullYear();
        
    },

    // ----------------------------------------------------------------------------
    // Land area factors
    // ----------------------------------------------------------------------------    
    land_area: function() {

        let uk_landarea = 242495000000                                     // m2
        let landarea_per_household = uk_landarea/i.households_2030           // m2 x 26 million households is 24 Mha

        // Biogas
        // 779 kha rotational grasses (ryegrass) produces 8.18 Modt product
        // 4.72 TWh/Modt used in MATRIX spreadsheet (or should it be 9.08?)
        // 8.18 Modt x 4.72 TWh/Modt = 38.61 TWh / 779 kha = 0.56 W/m2
        // 38.61 TWh per 0.779 Mha = 49.6 TWh per Mha or 0.02 Mha per TWh
        
        // 34.15 (20.49/0.6, ZCB MATRIX) TWh of biomass for biogas equivalent from waste sources
        // subtracted here so that land requirement shown is just for additional 
        // rotational grasses.
        
        o.grass_biomass_for_biogas = i.biomass_for_biogas - 34.15
        if (o.grass_biomass_for_biogas<0.0) o.grass_biomass_for_biogas = 0.0
        
        let biomass_landarea_factor = 0.02 // old: ((0.1/365.25)/0.024) / 0.51
        o.grass_landarea_for_biogas = o.grass_biomass_for_biogas * biomass_landarea_factor
        o.grass_prc_landarea_for_biogas = 100 * o.grass_landarea_for_biogas / 24.2495
        
        // Synth fuel
        // 24.2 Modt/yr made up of 14.25 Modt/yr Miscanthus (950 kha) & 9.95 Modt/yr SRC (780 kha) 
        // 24.2 Modt/yr from 1730 kha total
        // 4.72 TWh/Modt used in MATRIX spreadsheet (or should it be 3.07?) 
        // 24.2 Modt/yr x 4.72 TWh/Modt = 114 TWh
        // 114 TWh per 1.730 MHa = 66 TWh/Mha or 0.0152 Mha per TWh
        
        biomass_landarea_factor = 0.0152 // old: ((0.1/365.25)/0.024) / 0.975
        o.landarea_for_synth_fuel = o.total_synth_fuel_biomass_used * biomass_landarea_factor
        o.prc_landarea_for_synth_fuel = 100 * o.landarea_for_synth_fuel / 24.2495
        
        // Biomass for heating and CHP
        // 8.79 Modt/yr made up of 2.99 Modt/yr SRF (1079 kha) & 5.80 Modt/yr SRC (455 kha) 
        // 8.79 Modt/yr from 1534 kha total
        // 4.72 TWh/Modt used in MATRIX spreadsheet
        // 8.79 Modt/yr x 4.72 TWh/Modt = 41.5 TWh
        // 41.5 TWh per 1.534 MHa = 27 TWh/Mha or 0.0370 Mha per TWh
          
        biomass_landarea_factor = 0.0370 // old: ((0.1/365.25)/0.024) / 0.975
        o.landarea_for_other_biomass = o.total_other_biomass_used * biomass_landarea_factor
        o.prc_landarea_for_other_biomass = 100 * o.landarea_for_other_biomass / 24.2495
        
        o.landarea_for_biomass = o.grass_landarea_for_biogas + o.landarea_for_synth_fuel + o.landarea_for_other_biomass    
        o.prc_landarea_for_biomass = 100 * o.landarea_for_biomass / 24.2495
        
        // prc_landarea_for_FT = 100 * landarea_for_FT / landarea_per_household
        // prc_landarea_for_sabatier = 100 * landarea_for_sabatier / landarea_per_household

    },

    // ----------------------------------------------------------------------------
    // Scaled up to village, town, country scale
    // ----------------------------------------------------------------------------    
    scaled_by: function() {
    
        let scale = 1000 * 1000 * i.number_of_households / i.households_2030
    
        o.scaled = {}

        o.scaled.onshorewind_capacity = i.supply.onshore_wind_capacity * scale
        o.scaled.offshorewind_capacity = i.supply.offshore_wind_capacity * scale
        o.scaled.solarpv_capacity = i.supply.solarpv_capacity * scale
        o.scaled.hydro_capacity = i.supply.hydro_capacity * scale
        o.scaled.tidal_capacity = i.supply.tidal_capacity * scale
        o.scaled.wave_capacity = i.supply.wave_capacity * scale
        o.scaled.nuclear_capacity = i.supply.nuclear_capacity * scale   
        o.scaled.CCGT_capacity = i.dispatch_gen_cap * scale
        
        o.scaled.electrolysis_capacity = i.electrolysis_cap * scale
        o.scaled.hydrogen_storage_cap = i.hydrogen_storage_cap * scale
        o.scaled.methanation_capacity = i.methanation_capacity * scale
        o.scaled.power_to_X_cap = i.power_to_X_cap * scale
        o.scaled.methane_store_capacity = i.methane_store_capacity * scale
        o.scaled.synth_fuel_capacity = i.synth_fuel_capacity * scale
        o.scaled.elec_store_storage_cap = i.elec_store_storage_cap * scale
        
        o.scaled.electric_car_battery_capacity = i.electric_car_battery_capacity * scale
        o.scaled.landarea_for_biomass = 10000 * o.landarea_for_biomass * scale
    },

    // ----------------------------------------------------------------------------
    // Embodied Energy
    // ----------------------------------------------------------------------------     
    embodied_energy: function() {
        o.total_embodied_energy = 0
        
        o.EE = {}
        
        o.EE.onshorewind = (i.supply.onshore_wind_capacity * i.EE.onshorewind_GWh_per_GW * 0.001) / i.EE.onshorewind_lifespan
        o.total_embodied_energy += o.EE.onshorewind
        
        o.EE.offshorewind = (i.supply.offshore_wind_capacity * i.EE.offshorewind_GWh_per_GW * 0.001) / i.EE.offshorewind_lifespan
        o.total_embodied_energy += o.EE.offshorewind
        
        o.EE.solarpv = (i.supply.solarpv_capacity * i.EE.solarpv_GWh_per_GW * 0.001) / i.EE.solarpv_lifespan
        o.total_embodied_energy += o.EE.solarpv
        
        /*
        elec_store_cycles_per_year = (total_elec_store_charge*0.1) / i.elec_store_storage_cap
        EE_liion_store = 0// (((i.elec_store_storage_cap * 0.136) / 1500 * 0.8) * total_elec_store_charge)/3650
        o.total_embodied_energy += EE_liion_store

        carsvans_average_battery_size = 30.0
        carsvans_average_battery_cycles = 1500.0
        carsvans_lifetime_mileage = carsvans_average_battery_size * carsvans_average_battery_cycles * 4.0 // miles/kwh ~ 180k miles
        
        EE_ecar = 0
        carsvans_vehicle_miles = i.population_2030 * i.carsvans_miles_pp / (i.carsvans_load_factor*5)
        carsvans_manufactured_per_year = carsvans_vehicle_miles / carsvans_lifetime_mileage

        if (i.carsvans_miles_pp>0) EE_ecar = 20000.0 * carsvans_manufactured_per_year * 0.000000001
        o.total_embodied_energy += EE_ecar

        if (i.carsvans_miles_pp>0) EE_ecarbattery = 136.0 * carsvans_average_battery_size * carsvans_manufactured_per_year * 0.000000001
        o.total_embodied_energy += EE_ecarbattery
        */
        
        // this all cancels out
        // industry energy consumption for manufacturing cars is dependent on 
        // carsvans_miles_per_car = 25000.0
        // number_of_cars = carsvans_vehicle_miles / carsvans_miles_per_car
        // carvans_lifetime = (150000.0/carsvans_miles_per_car)
        // if (carsvans_miles_per_car>0) EE_ecar = 20000.0 * number_of_cars * 0.000000001 / carvans_lifetime
        
        o.prc_of_industry_demand = 100 * o.total_embodied_energy / o.total_industry_demand
    }
}
