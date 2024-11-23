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
            cooking_profile = JSON.parse(JSON.stringify(default_cooking_profile))
            hot_water_profile = JSON.parse(JSON.stringify(default_hot_water_profile))
            space_heat_profile = JSON.parse(JSON.stringify(default_space_heat_profile))
            BEV_charge_profile = JSON.parse(JSON.stringify(default_BEV_charge_profile))      
        } else {
            cooking_profile = JSON.parse(JSON.stringify(flat_profile))
            hot_water_profile = JSON.parse(JSON.stringify(flat_profile))
            space_heat_profile = JSON.parse(JSON.stringify(flat_profile))  
            BEV_charge_profile = JSON.parse(JSON.stringify(flat_profile))  
        }
        
        o.biomass = {
            total_used: 0
        }
        
        o.fossil_fuels = {
          oil:0,
          gas:0,
          coal:0,
          total:0,
          coal_for_dispatchable: 0,
          coal_for_heating_systems: 0
        }
        
        model.supply();
        model.lac();
        model.space_water_heat_demand();
        model.heating_systems();
        model.industry();
        model.transport_model()
        model.electric_transport();
        model.main_loop();

        model.heating_systems_post_loop();

        model.fossil_fuels();
        model.final();
        model.land_use();
        model.scaled_by();
        model.embodied_energy();
        model.emissions_balance();
        model.cost_model();
    },

    update_non_hourly: function() {
        model.scaled_by();
        model.cost_model();
    },

    // ---------------------------------------------------------------------------------------------    
    // Transport model
    // ---------------------------------------------------------------------------------------------         
    transport_model: function() {

        o.transport = {
            km_pp: {},
            modes: { },
            fuel_totals: { EV:0, H2:0, IC:0 }
        }

        let kwpp_to_TWh = i.population_2030 * 0.000000001 

        for (var z in i.transport.modes) {
            let mode = i.transport.modes[z]

            o.transport.km_pp[z] = mode.miles_pp * i.transport.km_per_mile;
            
            for (var fuel in mode.prc) {
                if (o.transport.modes[z]==undefined) o.transport.modes[z] = {}
                if (o.transport.modes[z][fuel]==undefined) o.transport.modes[z][fuel] = {}
                o.transport.modes[z][fuel].kwhppkm_full = mode.mechanical_kwhppkm_full / mode.efficiency[fuel]
                o.transport.modes[z][fuel].kwhppkm = o.transport.modes[z][fuel].kwhppkm_full / mode.load_factor
                o.transport.modes[z][fuel].kwhpp = o.transport.modes[z][fuel].kwhppkm * mode.prc[fuel] * o.transport.km_pp[z]
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
            total_fixed_electricity: 0,
            total_fixed_heat: 0

        }
        
        o.total_losses = {
            grid: 0,
            grid2:0
        }
        
        let grid_loss_prc = 1.0-((i.energy_industry_use.electricity_grid_loss_prc + i.energy_industry_use.electricity_own_use_prc)*0.01)
        
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
            o.supply.total_fixed_electricity += electricity_supply_before_grid_loss
                        
            let electricity_supply = electricity_supply_before_grid_loss * grid_loss_prc
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
        // Electric
        let annual_cooking_elec = i.LAC.domestic.cooking_TWhy + i.LAC.services.catering_TWhy
        let daily_cooking_elec = annual_cooking_elec * 1000.0 / 365.25
        let LA_elec_demand = i.LAC.domestic.lighting_and_appliances_TWhy + i.LAC.services.lighting_and_appliances_TWhy + i.LAC.services.cooling_TWhy 
        let daily_LA_elec_demand = LA_elec_demand * 1000.0 / 365.25

        // Gas
        let annual_cooking_gas = i.LAC.domestic.cooking_gas_TWhy + i.LAC.services.catering_gas_TWhy
        let daily_cooking_gas = annual_cooking_gas * 1000.0 / 365.25
        let LA_gas_demand = i.LAC.services.lighting_and_appliances_gas_TWhy + i.LAC.services.cooling_gas_TWhy 
        let daily_LA_gas_demand = LA_gas_demand * 1000.0 / 365.25

        o.LAC = {}
        o.LAC.total = 0
        o.LAC.total_gas = 0
        d.lac_demand = []
        d.lac_demand_gas = []
            
        for (var hour = 0; hour < i.hours; hour++) {
            let capacityfactors = capacityfactors_all[hour]

            let cooking_elec = cooking_profile[hour%24] * daily_cooking_elec
            let cooking_gas = cooking_profile[hour%24] * daily_cooking_gas
            
            let normalised_trad_elec = capacityfactors[5]/331.033
            let hourly_LAC_elec_demand = normalised_trad_elec * LA_elec_demand
            let hourly_LAC_gas_demand = normalised_trad_elec * LA_gas_demand
            
            if (i.use_flat_profiles) hourly_LAC_elec_demand = daily_LA_elec_demand / 24.0
            if (i.use_flat_profiles) hourly_LAC_gas_demand = daily_LA_gas_demand / 24.0
            
            hourly_LAC_elec_demand += cooking_elec
            hourly_LAC_gas_demand += cooking_gas         
            
            d.lac_demand.push(hourly_LAC_elec_demand)
            d.lac_demand_gas.push(hourly_LAC_gas_demand)      
               
            o.LAC.total += hourly_LAC_elec_demand
            o.LAC.total_gas += hourly_LAC_gas_demand
        }
        
        o.LAC.domestic_appliances_kwh = (i.LAC.domestic.lighting_and_appliances_TWhy) * 1000000000 / i.households_2030
        o.LAC.domestic_cooking_kwh = (i.LAC.domestic.cooking_TWhy+i.LAC.domestic.cooking_gas_TWhy) * 1000000000 / i.households_2030
    },

    // ---------------------------------------------------------------------------------------------    
    // Space and water heat demand
    // ---------------------------------------------------------------------------------------------     
    space_water_heat_demand: function() {

        o.space_heating = {}
        o.water_heating = {}
        o.heat = {}
        o.heat.total_spill = 0
        
        o.space_heating.demand_GWK = i.space_heating.domestic_demand_GWK + i.space_heating.services_demand_GWK + i.space_heating.industry_demand_GWK

        o.water_heating.demand_TWhy = i.water_heating.domestic_TWhy + i.water_heating.services_TWhy
        
        let water_heating_daily_demand = o.water_heating.demand_TWhy * 1000.0 / 365.2
        
        o.space_heating.total_domestic_demand = 0
        o.space_heating.total_services_demand = 0
        o.space_heating.total_industry_demand = 0
        o.space_heating.total_demand = 0
        o.water_heating.total_demand = 0
                
        // d.spacewater_demand_before_heatstore = []
        d.space_heat_demand = []
        d.water_heat_demand = []
        
        for (var hour = 0; hour < i.hours; hour++) {
            var day = parseInt(Math.floor(hour / 24))
            var temperature = parseFloat(temperaturelines[day].split(",")[1]); 

            let degree_hours = i.space_heating.base_temperature - temperature
            if (degree_hours<0) degree_hours = 0
            
            // Domestic space heat
            let domestic_space_heat_demand = degree_hours * i.space_heating.domestic_demand_GWK * 24.0 * space_heat_profile[hour%24]
            o.space_heating.total_domestic_demand += domestic_space_heat_demand
            // Services space heat        
            let services_space_heat_demand = degree_hours * i.space_heating.services_demand_GWK * 24.0 * space_heat_profile[hour%24]
            o.space_heating.total_services_demand += services_space_heat_demand
            // Industry space heat        
            let industry_space_heat_demand = degree_hours * i.space_heating.industry_demand_GWK * 24.0 * space_heat_profile[hour%24]        
            o.space_heating.total_industry_demand += industry_space_heat_demand
            // Combined space heat         
            let space_heat_demand = domestic_space_heat_demand + services_space_heat_demand + industry_space_heat_demand
            o.space_heating.total_demand += space_heat_demand
            
            // water heat
            let water_heat_demand = hot_water_profile[hour%24] * water_heating_daily_demand
            o.water_heating.total_demand += water_heat_demand 
            
            // let spacewater_demand_before_heatstore = space_heat_demand + water_heat_demand - d.heat_supply_hourly[hour]
            // d.spacewater_demand_before_heatstore.push(spacewater_demand_before_heatstore)
            
            let fixed_heat_supply = d.heat_supply_hourly[hour];
            let combined_heat_demand = space_heat_demand + water_heat_demand
            
            let fixed_heat_for_space = 0
            if (space_heat_demand>0) {
                fixed_heat_for_space = fixed_heat_supply * (space_heat_demand / combined_heat_demand)
            }
            
            let fixed_heat_for_water = 0
            if (combined_heat_demand) {
                fixed_heat_for_water = fixed_heat_supply * (water_heat_demand / combined_heat_demand)
            }
            
            let space_heat_balance = space_heat_demand - fixed_heat_for_space
            if (space_heat_balance<0) {
                o.heat.total_spill += -1*space_heat_balance
                space_heat_balance = 0;
            }
            d.space_heat_demand.push(space_heat_balance)
            
            let water_heat_balance = water_heat_demand - fixed_heat_for_water
            if (water_heat_balance<0) {
                o.heat.total_spill += -1*water_heat_balance
                water_heat_balance = 0;
            }
            d.water_heat_demand.push(water_heat_balance)
            
        }

        o.space_heating.domestic_kwh = o.space_heating.total_domestic_demand*0.1*1000000 / i.households_2030
        o.water_heating.domestic_kwh = i.water_heating.domestic_TWhy*1000000000 / i.households_2030
        
    },

    // --------------------------------------------------------------------------------------------------------------
    // Stage 2: Heatstore 
    // - needs to be reworked to provide the equivalent service as hot water tanks
    // - or/and district heating large scale inter seasonal heat storage
    // - was only really working as peak shaving (whilst placing all hot water demand in the peak.. )
    // --------------------------------------------------------------------------------------------------------------
    
    /*
    heatstore: function () {

        o.heatstore = {}

        o.heatstore.SOC_start = i.heatstore.storage_capacity * 0.5
        o.heatstore.SOC = o.heatstore.SOC_start
    
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
            let average_12h_balance_heat = sum / n;
            
            let deviation_from_mean_GWe = d.spacewater_demand_before_heatstore[hour] - average_12h_balance_heat
            let deviation_from_mean_GWth = deviation_from_mean_GWe //* GWth_GWe
            
            d.deviation_from_mean_GWth.push(deviation_from_mean_GWth)
        }

        d.spacewater_demand_after_heatstore = []
        d.spacewater_balance = []
        d.heatstore_discharge_GWth = []
        d.heatstore_SOC = []
        d.spacewater_heat = []
        
        o.heat.total_spill = 0
        
        for (var hour = 0; hour < i.hours; hour++) {

            let spacewater_balance = d.spacewater_demand_before_heatstore[hour]
            d.spacewater_balance.push(spacewater_balance)  
        
            let heatstore_charge_GWth = 0
            let heatstore_discharge_GWth = 0
            
            if (i.heatstore.enabled) {
                // CHARGE
                if (d.deviation_from_mean_GWth[hour]<0.0) {
                    heatstore_charge_GWth = -d.deviation_from_mean_GWth[hour] * 0.40 * (i.heatstore.storage_capacity / 100.0)
                    //heatstore_charge_GWth = (i.heatstore.storage_capacity-o.heatstore.SOC)*-d.deviation_from_mean_GWth[hour]/(i.heatstore.storage_capacity*0.5)
                }
                if (heatstore_charge_GWth>i.heatstore.charge_capacity) heatstore_charge_GWth = i.heatstore.charge_capacity
                if ((heatstore_charge_GWth+o.heatstore.SOC)>i.heatstore.storage_capacity) heatstore_charge_GWth = i.heatstore.storage_capacity - o.heatstore.SOC
                
                spacewater_balance += heatstore_charge_GWth
                o.heatstore.SOC += heatstore_charge_GWth
                
                // DISCHARGE
                if (d.deviation_from_mean_GWth[hour]>=0.0) {  
                    heatstore_discharge_GWth = d.deviation_from_mean_GWth[hour] * 0.32 * (i.heatstore.storage_capacity / 100.0)
                    //heatstore_discharge_GWth = o.heatstore.SOC*d.deviation_from_mean_GWth[hour]/(i.heatstore.storage_capacity*0.5)
                    if (heatstore_discharge_GWth>spacewater_balance) heatstore_discharge_GWth = spacewater_balance
                }
                if (heatstore_discharge_GWth>i.heatstore.charge_capacity) heatstore_discharge_GWth = i.heatstore.charge_capacity
                if (heatstore_discharge_GWth>o.heatstore.SOC)  heatstore_discharge_GWth = o.heatstore.SOC
                
                spacewater_balance -= heatstore_discharge_GWth
                o.heatstore.SOC -= heatstore_discharge_GWth
            }
            
            d.heatstore_discharge_GWth.push(heatstore_discharge_GWth)        
            // ---------------------------------------------------------------------------------------------
            if (spacewater_balance<0.0) {
                o.heat.total_spill += -spacewater_balance
                spacewater_balance = 0
            }
            
            d.heatstore_SOC.push(o.heatstore.SOC)
            d.spacewater_heat.push(spacewater_balance)
            // space & water heat tab
            let spacewater_demand_after_heatstore = spacewater_balance
            if (spacewater_demand_after_heatstore<0.0) spacewater_demand_after_heatstore = 0.0
            d.spacewater_demand_after_heatstore.push(spacewater_demand_after_heatstore)
        }
    },
    */

    // --------------------------------------------------------------------------------------------------------------
    // Heating systems
    // --------------------------------------------------------------------------------------------------------------     
    heating_systems: function() {

        d.heating_systems = {}
        d.spacewater_elec = []
        
        o.heat.total_demand = 0
        
        o.heating_systems = {}

        // Calculate heating system efficiency slopes and intercepts
        for (var z in i.heating_systems) {
            var slope  = (i.heating_systems[z].efficiency_10C - i.heating_systems[z].efficiency_0C) / (10 - 0);
            var intercept = i.heating_systems[z].efficiency_10C - (slope*10);
        
            o.heating_systems[z] = {
                heat_demand: 0,
                fuel_demand: 0,
                efficiency_slope: slope,
                efficiency_intercept: intercept
            }

            d.heating_systems[z] = {
                heat_demand: [],
                fuel_demand: []
            }
        }
        
        for (var hour = 0; hour < i.hours; hour++) {
            var day = parseInt(Math.floor(hour / 24))
            var outside_temperature = parseFloat(temperaturelines[day].split(",")[1]); 
            
            let space_heat_demand = d.space_heat_demand[hour]
            let water_heat_demand = d.water_heat_demand[hour]
            o.heat.total_demand += space_heat_demand + water_heat_demand

            let heat_supplied = 0
            
            for (var z in i.heating_systems) {
                
                var space_heat_efficiency = (o.heating_systems[z].efficiency_slope * outside_temperature) + o.heating_systems[z].efficiency_intercept
                var water_heat_efficiency = i.heating_systems[z].efficiency_hot_water
            
                let system_space_heat_demand = space_heat_demand * (i.heating_systems[z].share * 0.01)
                let system_space_fuel_demand = system_space_heat_demand / (space_heat_efficiency*0.01)
                
                let system_water_heat_demand = water_heat_demand * (i.heating_systems[z].share * 0.01)
                let system_water_fuel_demand = system_water_heat_demand / (water_heat_efficiency*0.01)

                d.heating_systems[z].heat_demand.push(system_space_heat_demand + system_water_heat_demand)
                d.heating_systems[z].fuel_demand.push(system_space_fuel_demand + system_water_fuel_demand)
            }
            
            let spacewater_elec_demand = d.heating_systems.elres.fuel_demand[hour] + d.heating_systems.heatpump.fuel_demand[hour]
            d.spacewater_elec.push(spacewater_elec_demand)
        }
    },

    heating_systems_post_loop: function() {

        o.heat.max_elec_demand = 0
        o.heat.max_elec_demand_time = 0

        o.heat.total_supplied_heat = 0

        for (var hour = 0; hour < i.hours; hour++) {

            let spacewater_elec_demand = d.spacewater_elec[hour]

            if (spacewater_elec_demand>o.heat.max_elec_demand) {
                o.heat.max_elec_demand = spacewater_elec_demand
                o.heat.max_elec_demand_time = hour
            }

            for (var z in i.heating_systems) {
                o.heating_systems[z].heat_demand += d.heating_systems[z].heat_demand[hour]
                o.heating_systems[z].fuel_demand += d.heating_systems[z].fuel_demand[hour]

                o.heat.total_supplied_heat += d.heating_systems[z].heat_demand[hour]
            }

            o.biomass.total_used += d.heating_systems.biomass.fuel_demand[hour]
            o.fossil_fuels.coal_for_heating_systems += d.heating_systems.solid_fuel.fuel_demand[hour]
        }

        o.heat.total_unmet_demand = o.heat.total_demand - o.heat.total_supplied_heat
        
        o.heat.total_ambient_supply = 0
        o.total_losses.heating_systems = 0
        
        for (var z in i.heating_systems) {
            if (o.heating_systems[z].fuel_demand<o.heating_systems[z].heat_demand) {
                o.heat.total_ambient_supply += o.heating_systems[z].heat_demand - o.heating_systems[z].fuel_demand  
            } else {
                o.total_losses.heating_systems += o.heating_systems[z].fuel_demand - o.heating_systems[z].heat_demand
            }
            
            o.heating_systems[z].efficiency = (100 * o.heating_systems[z].heat_demand / o.heating_systems[z].fuel_demand).toFixed(0)
        }
        var datastarttime = 32*365.25*24*3600*1000;
        var date = new Date(datastarttime + (o.heat.max_elec_demand_time * 3600 * 1000));
        h = date.getHours();
        if (h<10) h = "0"+h
        
        o.heat.max_elec_demand_date = h+":00 "+(date.getDay()+1)+"/"+date.getMonth()+"/"+date.getFullYear(); 

    },

    // ---------------------------------------------------------------------------
    // Industrial
    // ---------------------------------------------------------------------------    
    industry: function() {
    
        o.industry = {}
        
        o.industry.total_demand = 0
        o.industry.total_demand += i.industry.high_temp_process_TWhy
        o.industry.total_demand += i.industry.low_temp_process_TWhy
        o.industry.total_demand += i.industry.dry_sep_TWhy
        o.industry.total_demand += i.industry.other_heat_TWhy
        o.industry.total_demand += i.industry.motors_TWhy
        o.industry.total_demand += i.industry.compressed_air_TWhy
        o.industry.total_demand += i.industry.lighting_TWhy
        o.industry.total_demand += i.industry.refrigeration_TWhy
        o.industry.total_demand += i.industry.refinery_electric_TWhy
        o.industry.total_demand += i.industry.other_non_heat_TWhy
  
        d.industrial_elec_demand = []
        d.methane_for_industry = []
        d.hydrogen_for_industry = []
        d.balance_before_BEV_storage = []

        o.industry.total_elec_demand = 0
        o.industry.total_methane_demand = 0
        o.industry.total_hydrogen_demand = 0 
        o.industry.total_synth_fuel_demand = 0  
        o.industry.total_coal_demand = 0
        o.industry.total_biomass_demand = 0
        
        var conv_hourly = 1000 / (365.25*24)
        
        var hourly_fixed_elec_demand = 0;
        hourly_fixed_elec_demand += i.industry.high_temp_process_TWhy * conv_hourly * i.industry.high_temp_process_fixed_elec_prc * 0.01
        hourly_fixed_elec_demand += i.industry.low_temp_process_TWhy * conv_hourly * i.industry.low_temp_process_fixed_elec_prc * 0.01
        hourly_fixed_elec_demand += i.industry.dry_sep_TWhy * conv_hourly * i.industry.dry_sep_fixed_elec_prc * 0.01            
        hourly_fixed_elec_demand += i.industry.other_heat_TWhy * conv_hourly * i.industry.other_heat_fixed_elec_prc * 0.01  
        hourly_fixed_elec_demand += i.industry.motors_TWhy * conv_hourly
        hourly_fixed_elec_demand += i.industry.compressed_air_TWhy * conv_hourly
        hourly_fixed_elec_demand += i.industry.lighting_TWhy * conv_hourly
        hourly_fixed_elec_demand += i.industry.refrigeration_TWhy * conv_hourly
        hourly_fixed_elec_demand += i.industry.refinery_electric_TWhy * conv_hourly
        hourly_fixed_elec_demand += i.industry.other_non_heat_TWhy * conv_hourly * i.industry.other_non_heat_fixed_elec_prc * 0.01  

        var hourly_fixed_CH4_demand = 0;
        hourly_fixed_CH4_demand += i.industry.high_temp_process_TWhy * conv_hourly * i.industry.high_temp_process_fixed_CH4_prc * 0.01
        hourly_fixed_CH4_demand += i.industry.low_temp_process_TWhy * conv_hourly * i.industry.low_temp_process_fixed_CH4_prc * 0.01
        hourly_fixed_CH4_demand += i.industry.dry_sep_TWhy * conv_hourly * i.industry.dry_sep_fixed_CH4_prc * 0.01            
        hourly_fixed_CH4_demand += i.industry.other_heat_TWhy * conv_hourly * i.industry.other_heat_fixed_CH4_prc * 0.01  
        hourly_fixed_CH4_demand += i.industry.other_non_heat_TWhy * conv_hourly * i.industry.other_non_heat_fixed_CH4_prc * 0.01  

        var hourly_fixed_H2_demand = 0;
        hourly_fixed_H2_demand += i.industry.high_temp_process_TWhy * conv_hourly * i.industry.high_temp_process_fixed_H2_prc * 0.01
        hourly_fixed_H2_demand += i.industry.low_temp_process_TWhy * conv_hourly * i.industry.low_temp_process_fixed_H2_prc * 0.01
        hourly_fixed_H2_demand += i.industry.dry_sep_TWhy * conv_hourly * i.industry.dry_sep_fixed_H2_prc * 0.01            
        hourly_fixed_H2_demand += i.industry.other_heat_TWhy * conv_hourly * i.industry.other_heat_fixed_H2_prc * 0.01  
        hourly_fixed_H2_demand += i.industry.other_non_heat_TWhy * conv_hourly * i.industry.other_non_heat_fixed_H2_prc * 0.01  
        
        o.industry.total_synth_fuel_demand += i.industry.high_temp_process_TWhy * i.industry.high_temp_process_fixed_liquid_prc * 0.01
        o.industry.total_synth_fuel_demand += i.industry.low_temp_process_TWhy * i.industry.low_temp_process_fixed_liquid_prc * 0.01
        o.industry.total_synth_fuel_demand += i.industry.dry_sep_TWhy * i.industry.dry_sep_fixed_liquid_prc * 0.01            
        o.industry.total_synth_fuel_demand += i.industry.other_heat_TWhy * i.industry.other_heat_fixed_liquid_prc * 0.01  
        o.industry.total_synth_fuel_demand += i.industry.other_non_heat_TWhy * i.industry.other_non_heat_fixed_liquid_prc * 0.01  
        o.industry.total_synth_fuel_demand *= 10000

        o.industry.total_coal_demand += i.industry.high_temp_process_TWhy * i.industry.high_temp_process_fixed_coal_prc * 0.01
        o.industry.total_coal_demand += i.industry.low_temp_process_TWhy * i.industry.low_temp_process_fixed_coal_prc * 0.01
        o.industry.total_coal_demand += i.industry.dry_sep_TWhy * i.industry.dry_sep_fixed_coal_prc * 0.01            
        o.industry.total_coal_demand += i.industry.other_heat_TWhy * i.industry.other_heat_fixed_coal_prc * 0.01  
        o.industry.total_coal_demand += i.industry.other_non_heat_TWhy * i.industry.other_non_heat_fixed_coal_prc * 0.01     
        o.industry.total_coal_demand *= 10000 
        
        o.industry.total_biomass_demand += i.industry.high_temp_process_TWhy * i.industry.high_temp_process_fixed_biomass_prc * 0.01
        o.industry.total_biomass_demand += i.industry.low_temp_process_TWhy * i.industry.low_temp_process_fixed_biomass_prc * 0.01
        o.industry.total_biomass_demand += i.industry.dry_sep_TWhy * i.industry.dry_sep_fixed_biomass_prc * 0.01            
        o.industry.total_biomass_demand += i.industry.other_heat_TWhy * i.industry.other_heat_fixed_biomass_prc * 0.01  
        o.industry.total_biomass_demand += i.industry.other_non_heat_TWhy * i.industry.other_non_heat_fixed_biomass_prc * 0.01     
        o.industry.total_biomass_demand *= 10000    
        
        for (var hour = 0; hour < i.hours; hour++)
        {
            // electric demand
            let non_heat_process_elec = not_heat_process_profile[hour%24] * hourly_fixed_elec_demand * 24

            // balance including non DSR industrial load
            let balance = d.elec_supply_hourly[hour] - d.lac_demand[hour] - d.spacewater_elec[hour] - non_heat_process_elec

            // ----------------------------------------------------------------------------------------------------------------------
            
            // Here we implement a mixed fixed elec/gas heat supply and an extended DSR elec/gas supply
            // The DSR supply uses electricity when there is excess renewable supply available and gas 
            // originally produced from excess renewable supply when direct supply is not sufficient
        
            let DSR_CH4_GW = 0;
            DSR_CH4_GW += i.industry.high_temp_process_TWhy * conv_hourly * i.industry.high_temp_process_DSR_CH4_prc * 0.01
            DSR_CH4_GW += i.industry.low_temp_process_TWhy * conv_hourly * i.industry.low_temp_process_DSR_CH4_prc * 0.01
            DSR_CH4_GW += i.industry.dry_sep_TWhy * conv_hourly * i.industry.dry_sep_DSR_CH4_prc * 0.01
            DSR_CH4_GW += i.industry.other_heat_TWhy * conv_hourly * i.industry.other_heat_DSR_CH4_prc * 0.01
                 
            let DSR_CH4_elec = DSR_CH4_GW                                   // 1. provide all heat demand with direct elec resistance heaters
            if (DSR_CH4_elec>balance) DSR_CH4_elec = balance                // 2. limited to available electricity balance
            if (DSR_CH4_elec<0) DSR_CH4_elec = 0                            // 3. -- should never happen --
            let DSR_CH4_gas = DSR_CH4_GW - DSR_CH4_elec                     // 4. if there is not enough elec to meet demand, use gas

            // ----------------------------------------------------------------------------------------------------------------------
            
            let DSR_H2_GW = 0;
            DSR_H2_GW += i.industry.high_temp_process_TWhy * conv_hourly * i.industry.high_temp_process_DSR_H2_prc * 0.01
            DSR_H2_GW += i.industry.low_temp_process_TWhy * conv_hourly * i.industry.low_temp_process_DSR_H2_prc * 0.01
            DSR_H2_GW += i.industry.dry_sep_TWhy * conv_hourly * i.industry.dry_sep_DSR_H2_prc * 0.01
            DSR_H2_GW += i.industry.other_heat_TWhy * conv_hourly * i.industry.other_heat_DSR_H2_prc * 0.01
                     
            let DSR_H2_elec = DSR_H2_GW                                     // 1. provide all heat demand with direct elec resistance heaters
            if (DSR_H2_elec>balance) DSR_H2_elec = balance                  // 2. limited to available electricity balance
            if (DSR_H2_elec<0) DSR_H2_elec = 0                              // 3. -- should never happen --
            let DSR_H2_gas = DSR_H2_GW - DSR_H2_elec                        // 4. if there is not enough elec to meet demand, use gas 
            
            // ----------------------------------------------------------------------------------------------------------------------
            
            var industrial_elec_demand = 0;
            industrial_elec_demand += hourly_fixed_elec_demand
            industrial_elec_demand += DSR_CH4_elec
            industrial_elec_demand += DSR_H2_elec
            d.industrial_elec_demand.push(industrial_elec_demand)
            o.industry.total_elec_demand += industrial_elec_demand
 
            var industrial_methane_demand = 0;
            industrial_methane_demand += hourly_fixed_CH4_demand
            industrial_methane_demand += DSR_CH4_gas
            d.methane_for_industry.push(industrial_methane_demand)
            o.industry.total_methane_demand += industrial_methane_demand
 
            var industrial_hydrogen_demand = 0;
            industrial_hydrogen_demand += hourly_fixed_H2_demand
            industrial_hydrogen_demand += DSR_H2_gas      
            d.hydrogen_for_industry.push(industrial_hydrogen_demand)
            o.industry.total_hydrogen_demand += industrial_hydrogen_demand
             
            // ----------------------------------------------------------------------------------------------------------------------
                     
            // Balance calculation for BEV storage stage
            d.balance_before_BEV_storage.push(d.elec_supply_hourly[hour] - d.lac_demand[hour] - d.spacewater_elec[hour] - d.industrial_elec_demand[hour])   
        }
        
        o.industry.total_demand_check = 0;
        o.industry.total_demand_check += o.industry.total_elec_demand
        o.industry.total_demand_check += o.industry.total_methane_demand
        o.industry.total_demand_check += o.industry.total_hydrogen_demand
        o.industry.total_demand_check += o.industry.total_synth_fuel_demand
        o.industry.total_demand_check += o.industry.total_biomass_demand
        o.industry.total_demand_check += o.industry.total_coal_demand
    },

    // -------------------------------------------------------------------------------------
    // Elec transport
    // -------------------------------------------------------------------------------------    
    electric_transport: function() {

        let daily_BEV_demand = o.transport.fuel_totals.BEV * 1000.0 / 365.25
        let daily_elec_trains_demand = o.transport.fuel_totals.DEV * 1000.0 / 365.25
        
        o.electric_transport = {}
        o.electric_transport.BEV_Store_SOC_start = i.transport.electric_car_battery_capacity * 0.5
        o.electric_transport.BEV_Store_SOC = o.electric_transport.BEV_Store_SOC_start
        
        o.electric_transport.total_EV_charge = 0
        o.electric_transport.total_EV_demand = 0
        o.electric_transport.unmet_EV_demand = 0

        o.electric_transport.total_elec_trains_demand = 0
        
        d.balance_before_elec_store = []
        
        d.EV_charge = []
        d.EV_smart_discharge = []
        d.BEV_Store_SOC = []
        d.EL_transport = []
        
        for (var hour = 0; hour < i.hours; hour++)
        {
            let balance = d.balance_before_BEV_storage[hour]
  
            let deviation_from_mean_BEV = 0;
            if (i.transport.V2G_discharge_type=="average") {            
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
                let average_12h_balance_before_BEV_storage = sum / n;
                deviation_from_mean_BEV = balance - average_12h_balance_before_BEV_storage
            }
            // ---------------------------------------------
            
            // Electric trains
            let elec_trains_demand = elec_trains_use_profile[hour%24] * daily_elec_trains_demand
            o.electric_transport.total_elec_trains_demand += elec_trains_demand
            balance -= elec_trains_demand 
            
            // Standard EV charge
            let EV_charge = BEV_charge_profile[hour%24] * daily_BEV_demand
            
            let max_charge_rate = BEV_plugged_in_profile[hour%24] * i.transport.electric_car_max_charge_rate
            // let max_charge_rate = i.transport.electric_car_max_charge_rate 
            // SMART CHARGE --------------------------------
            if (i.transport.smart_charging_enabled==1 && balance>EV_charge) {
                if (i.transport.smart_charge_type=="average") {
                    if (deviation_from_mean_BEV>0.0) {
                        EV_charge = (i.transport.electric_car_battery_capacity-o.electric_transport.BEV_Store_SOC)*deviation_from_mean_BEV/(i.transport.electric_car_battery_capacity*0.5)
                        if (EV_charge>balance) EV_charge = balance
                    }
                } else {
                    EV_charge = balance // simple smart charge
                }
            }
            // Charging rate & quantity limits
            if (EV_charge>max_charge_rate) EV_charge = max_charge_rate
            if ((o.electric_transport.BEV_Store_SOC+EV_charge)>i.transport.electric_car_battery_capacity) EV_charge = i.transport.electric_car_battery_capacity - o.electric_transport.BEV_Store_SOC
            // Subtract EV charge from balance and add to SOC
            balance -= EV_charge
            o.electric_transport.BEV_Store_SOC += EV_charge
            o.electric_transport.total_EV_charge += EV_charge
            d.EV_charge.push(EV_charge)
            
            // EV DEMAND -----------------------------------
            let EV_demand = BEV_use_profile[hour%24] * daily_BEV_demand
            o.electric_transport.BEV_Store_SOC -= EV_demand
            if (o.electric_transport.BEV_Store_SOC<0) {
                o.electric_transport.unmet_EV_demand += -1 * o.electric_transport.BEV_Store_SOC;
                o.electric_transport.BEV_Store_SOC = 0
            }
            
            o.electric_transport.total_EV_demand += EV_demand
            
            // SMART DISCHARGE -----------------------------
            let EV_smart_discharge = 0.0
            
            if (i.transport.V2G_enabled==1 && balance<0.0) {
                if (i.transport.V2G_discharge_type=="average") {
                    if (deviation_from_mean_BEV<0.0) {
                        EV_smart_discharge = o.electric_transport.BEV_Store_SOC*-deviation_from_mean_BEV/(i.transport.electric_car_battery_capacity*0.5)
                        if (EV_smart_discharge>-balance) EV_smart_discharge = -balance
                    }
                } else {
                    EV_smart_discharge = -balance
                }
            }

            // Discharge rate & quantity limits
            if (EV_smart_discharge>max_charge_rate) EV_smart_discharge = max_charge_rate
            //EV_V2G_min_SOC = i.transport.electric_car_battery_capacity * 0.3
            //if ((o.electric_transport.BEV_Store_SOC-EV_smart_discharge)<EV_V2G_min_SOC) EV_smart_discharge = o.electric_transport.BEV_Store_SOC-EV_V2G_min_SOC
            
            
            let available_SOC = o.electric_transport.BEV_Store_SOC - i.transport.electric_car_battery_capacity*0.2
            if (available_SOC<0) available_SOC = 0;
            
            if (EV_smart_discharge>available_SOC) EV_smart_discharge = available_SOC;
            if (EV_smart_discharge<0) EV_smart_discharge = 0
                   
            // Apply to SOC and balance
            o.electric_transport.BEV_Store_SOC -= EV_smart_discharge
            balance += EV_smart_discharge
            
            // Timeseries
            d.EV_smart_discharge.push(EV_smart_discharge)
            d.BEV_Store_SOC.push(o.electric_transport.BEV_Store_SOC)
            d.EL_transport.push(elec_trains_demand + EV_charge)
            d.balance_before_elec_store.push(balance)        
        }    
    },
        
    main_loop: function() {
    
        // Elecstore             
        o.electric_storage = {
            total_charge: 0,
            total_discharge: 0,
            max_charge: 0,
            max_discharge: 0
        }     
        o.electric_storage.SOC_start = i.electric_storage.capacity_GWh * 0.3
        o.electric_storage.SOC = o.electric_storage.SOC_start
          
        // Hydrogen
        o.hydrogen = {}
        o.hydrogen.SOC_start = i.hydrogen.storage_capacity_GWh * 0.5
        o.hydrogen.SOC = o.hydrogen.SOC_start        
        o.hydrogen.max_SOC = 0
        o.hydrogen.min_SOC = i.hydrogen.storage_capacity_GWh
        o.hydrogen.total_produced = 0
        o.hydrogen.total_from_imports = 0
        o.hydrogen.total_electricity_for_electrolysis = 0
        o.hydrogen.total_demand = 0
        o.hydrogen.total_vehicle_demand = 0
        o.hydrogen.total_industry_demand = 0
        o.hydrogen.unmet_demand = 0
        o.hydrogen.store_empty_count = 0
        o.hydrogen.store_full_count = 0
        d.hydrogen_SOC = []
        
        // Methane
        o.methane = {}
        o.methane.SOC = i.methane.SOC_start
        o.methane.max_SOC = 0
        o.methane.min_SOC = i.methane.storage_capacity_GWh
        o.methane.store_empty_count = 0
        o.methane.store_full_count = 0
        o.methane.total_produced = 0
        o.methane.total_demand = 0
        o.methane.store_excess = 0
        o.methane.unmet = 0
        o.methane.ccgt_methane_from_fossil_gas = 0
                        
        // Synth fuel
        o.synth_fuel = {}
        o.synth_fuel.store_SOC = i.synth_fuel.store_start_GWh
        o.synth_fuel.store_max_SOC = 0
        o.synth_fuel.store_min_SOC = 1000000
        o.synth_fuel.total_demand = 0
        o.synth_fuel.unmet_demand = 0
        o.synth_fuel.total_produced = 0
        o.synth_fuel.total_biomass_used = 0
        o.synth_fuel.total_transport_demand = 0
        o.synth_fuel.total_industrial_demand = 0
        // Power to X
        o.power_to_X = {}
        o.power_to_X.total_electricity_demand = 0
        
        // --------------------------------------------- 
        // Final balance
        // ---------------------------------------------
        o.balance = {}
        o.balance.total_excess_elec = 0
        o.balance.total_unmet_elec = 0

        // Electric backup
        o.electric_backup = {}        
        o.electric_backup.max_capacity_requirement = 0
        o.electric_backup.max_capacity_requirement_hour = 0
        o.electric_backup.max_shortfall = 0
        o.electric_backup.max_shortfall_hour = 0
        
        o.electric_backup.total_hydrogen_turbine_output = 0
        o.electric_backup.total_methane_turbine_output = 0
        o.electric_backup.total_synth_fuel_turbine_output = 0
        o.electric_backup.total_biomass_turbine_output = 0
        o.electric_backup.total_coal_turbine_output = 0
        o.electric_backup.total_before_grid_loss = 0
    
        // demand totals
        o.total_losses.electrolysis = 0
        o.total_losses.elec_backup = 0
        o.total_losses.sabatier = 0
        o.total_losses.anaerobic_digestion = 0
        o.total_losses.FT = 0
        o.total_losses.power_to_X = 0
        o.total_losses.electric_storage = 0

        o.heat.max_heat_from_hybrid_boiler = 0
        o.heat.max_elec_avoided_by_hybrid_boiler = 0
        o.heat.total_heat_from_hybrid_boiler = 0
        
        let daily_transport_H2_demand = o.transport.fuel_totals.H2 * 1000.0 / 365.25
        let daily_transport_liquid_demand = o.transport.fuel_totals.IC * 1000.0 / 365.25
        let daily_biomass_for_biogas = i.biogas.biomass_for_biogas * 1000.0 / 365.25
        let hourly_biomass_for_biogas = daily_biomass_for_biogas / 24.0
        let hourly_industrial_biofuel = (o.industry.total_synth_fuel_demand / 10) / (365.25*24.0)
        
        let hourly_hydrogen_from_imports = i.hydrogen.hydrogen_from_imports * 1000.0 / (365.25*24.0)
        
        d.elecstore_SOC = []
        d.elec_store_charge = []
        d.elec_store_discharge = []
        d.electricity_for_electrolysis = []
        d.electricity_for_power_to_X = []

        d.electricity_from_dispatchable = []
        d.excess_elec = []
        d.unmet_elec = []
        d.methane_SOC = []
        d.synth_fuel_store_SOC = []
        
        let grid_loss_prc = 1.0-((i.energy_industry_use.electricity_grid_loss_prc + i.energy_industry_use.electricity_own_use_prc)*0.01)

        for (var hour = 0; hour < i.hours; hour++)
        {
            var balance = d.balance_before_elec_store[hour]

            // -------------------------------------------------------------------------------------
            // Elec Store
            // -------------------------------------------------------------------------------------
               
            let elec_store_charge = 0
            let elec_store_discharge = 0        

            if (i.electric_storage.type=="basic") {
                if (balance>0) {
                    elec_store_charge = balance                                                                                                        // Charge by extend of available oversupply
                    if (elec_store_charge > i.electric_storage.charge_capacity_GW) {
                        elec_store_charge = i.electric_storage.charge_capacity_GW                                                                      // Limit by max charge rate
                    }
                    
                    elec_store_charge_int = elec_store_charge*i.electric_storage.charge_efficiency
                    if (elec_store_charge_int>(i.electric_storage.capacity_GWh-o.electric_storage.SOC)) elec_store_charge_int = i.electric_storage.capacity_GWh - o.electric_storage.SOC   // Limit by available SOC
                    elec_store_charge = elec_store_charge_int/i.electric_storage.charge_efficiency
                    
                    o.electric_storage.SOC += elec_store_charge_int
                    balance -= elec_store_charge
                    o.total_losses.electric_storage += elec_store_charge - elec_store_charge_int
                                        
                } else {
                    elec_store_discharge = -1*balance                                                                                          // Discharge by extent of unmet demand
                    if (elec_store_discharge > i.electric_storage.discharge_capacity_GW) {
                        elec_store_discharge = i.electric_storage.discharge_capacity_GW                                                           // Limit by max discharge rate
                    }
                    
                    elec_store_discharge_int = elec_store_discharge/i.electric_storage.discharge_efficiency                                                           
                    if (elec_store_discharge_int>o.electric_storage.SOC) elec_store_discharge_int = o.electric_storage.SOC                                       // Limit by available SOC
                    elec_store_discharge = elec_store_discharge_int*i.electric_storage.discharge_efficiency
                    
                    o.electric_storage.SOC -= elec_store_discharge_int
                    balance += elec_store_discharge
                    o.total_losses.electric_storage += elec_store_discharge_int - elec_store_discharge
                }
            }
            
            else if (i.electric_storage.type=="average") {
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
                let average_12h_balance_before_elec_storage = sum / n;
                let deviation_from_mean_elec = balance - average_12h_balance_before_elec_storage
                
            
                if (balance>=0.0) {
                    if (deviation_from_mean_elec>=0.0) {
                        // charge
                        elec_store_charge = (i.electric_storage.capacity_GWh-o.electric_storage.SOC)*deviation_from_mean_elec/(i.electric_storage.capacity_GWh*0.5)
                        if (elec_store_charge > i.electric_storage.charge_capacity_GW) {
                            elec_store_charge = i.electric_storage.charge_capacity_GW                                       // Limit to charge capacity
                        }
                        if (elec_store_charge>balance) elec_store_charge = balance
                        
                        elec_store_charge_int = elec_store_charge*i.electric_storage.charge_efficiency
                        if (elec_store_charge_int>(i.electric_storage.capacity_GWh - o.electric_storage.SOC)) elec_store_charge_int = i.electric_storage.capacity_GWh - o.electric_storage.SOC   // Limit to available SOC
                        elec_store_charge = elec_store_charge_int/i.electric_storage.charge_efficiency

                        o.electric_storage.SOC += elec_store_charge_int
                        balance -= elec_store_charge
                        o.total_losses.electric_storage += elec_store_charge - elec_store_charge_int
                    }
                } else {
                    if (deviation_from_mean_elec<0.0) {
                        // discharge
                        elec_store_discharge = o.electric_storage.SOC*-deviation_from_mean_elec/(i.electric_storage.capacity_GWh*0.5)
                        if (elec_store_discharge > i.electric_storage.discharge_capacity_GW) {
                            elec_store_discharge = i.electric_storage.discharge_capacity_GW      // Limit to discharge capacity
                        }
                        if (elec_store_discharge>-balance) elec_store_discharge = -balance
                        
                        elec_store_discharge_int = elec_store_discharge/i.electric_storage.discharge_efficiency                                                          
                        if (elec_store_discharge_int>o.electric_storage.SOC) elec_store_discharge_int = o.electric_storage.SOC              // Limit to elecstore SOC
                        elec_store_discharge = elec_store_discharge_int*i.electric_storage.discharge_efficiency        

                        o.electric_storage.SOC -= elec_store_discharge_int    
                        balance += elec_store_discharge
                        o.total_losses.electric_storage += elec_store_discharge_int - elec_store_discharge
                    }
                }
            }
            
            if (o.electric_storage.SOC<0) o.electric_storage.SOC = 0                                                              // limits here can loose energy in the calc
            if (o.electric_storage.SOC>i.electric_storage.capacity_GWh) o.electric_storage.SOC = i.electric_storage.capacity_GWh                    // limits here can loose energy in the calc
            // ----------------------------------------------------------------------------

            o.electric_storage.total_charge += elec_store_charge
            o.electric_storage.total_discharge += elec_store_discharge                       
            if (elec_store_charge>o.electric_storage.max_charge) o.electric_storage.max_charge = elec_store_charge
            if (elec_store_discharge>o.electric_storage.max_discharge) o.electric_storage.max_discharge = elec_store_discharge
                        
            d.elecstore_SOC.push(o.electric_storage.SOC)        
            d.elec_store_charge.push(elec_store_charge)
            d.elec_store_discharge.push(elec_store_discharge)
            
            // ----------------------------------------------------------------------------
            // Biogas
            // ----------------------------------------------------------------------------
            // The first stage here covers methane produced directly from biogas
            // A biogas methane content by volume of 60% is assumed
            // The remainder is CO2 which is used here as a feed for further methanation using hydrogen
            let biogas_supply = hourly_biomass_for_biogas * i.biogas.anaerobic_digestion_efficiency                   // biogas supply from biomass input
            let methane_from_biogas = biogas_supply                                                          // energy content of methane in biogas is same as biogas itself
            o.total_losses.anaerobic_digestion += hourly_biomass_for_biogas - biogas_supply                // biogas AD losses
            let co2_from_biogas = i.biogas.co2_tons_per_gwh_methane * biogas_supply                                   // biogas co2 content in tons
                            
            // ----------------------------------------------------------------------------
            // Hydrogen
            // ----------------------------------------------------------------------------
            // 1. Electrolysis input
            let electricity_for_electrolysis = 0
            if (balance>=0.0) {
                electricity_for_electrolysis = balance
                // Limit by hydrogen electrolysis capacity
                if (electricity_for_electrolysis>i.hydrogen.electrolysis_capacity_GW) electricity_for_electrolysis = i.hydrogen.electrolysis_capacity_GW
                // Limit by hydrogen store capacity
                if (electricity_for_electrolysis>((i.hydrogen.storage_capacity_GWh-o.hydrogen.SOC)/i.hydrogen.electrolysis_efficiency)) electricity_for_electrolysis = (i.hydrogen.storage_capacity_GWh-o.hydrogen.SOC)/i.hydrogen.electrolysis_efficiency
            }
            
            let hydrogen_from_electrolysis = electricity_for_electrolysis * i.hydrogen.electrolysis_efficiency
            o.total_losses.electrolysis += electricity_for_electrolysis - hydrogen_from_electrolysis
            d.electricity_for_electrolysis.push(electricity_for_electrolysis)
            balance -= electricity_for_electrolysis
            
            o.hydrogen.total_electricity_for_electrolysis += electricity_for_electrolysis
            
            let hydrogen_balance = hydrogen_from_electrolysis + hourly_hydrogen_from_imports
            o.hydrogen.total_produced += hydrogen_from_electrolysis + hourly_hydrogen_from_imports
            o.hydrogen.total_from_imports += hourly_hydrogen_from_imports
            
            // hydrogen heating demand
            hydrogen_balance -= d.heating_systems.hydrogen.fuel_demand[hour]
                    
            // 2. Hydrogen vehicle demand
            let hydrogen_for_hydrogen_vehicles = daily_transport_H2_demand / 24.0
            o.hydrogen.total_vehicle_demand += hydrogen_for_hydrogen_vehicles
            hydrogen_balance -= hydrogen_for_hydrogen_vehicles
            
            // Hydrogen for industry
            let hydrogen_for_industry = d.hydrogen_for_industry[hour]
            o.hydrogen.total_industry_demand += hydrogen_for_industry
            hydrogen_balance -= hydrogen_for_industry
            
            // 3. Hydrogen to synthetic liquid fuels
            let hourly_biomass_for_biofuel = 0.0
            let hydrogen_to_synth_fuel = 0.0
            if ((o.hydrogen.SOC>i.hydrogen.storage_capacity_GWh*i.hydrogen.minimum_store_level) && hydrogen_balance>0.0) {
                hydrogen_to_synth_fuel = hydrogen_balance
                if (hydrogen_to_synth_fuel>i.synth_fuel.capacity_GW) hydrogen_to_synth_fuel = i.synth_fuel.capacity_GW
                hourly_biomass_for_biofuel = (hydrogen_to_synth_fuel/i.synth_fuel.FT_process_hydrogen_req)*i.synth_fuel.FT_process_biomass_req
                hydrogen_balance -= hydrogen_to_synth_fuel
            }
            
            // Production of synth fuel and losses
            let synth_fuel_produced_FT = hydrogen_to_synth_fuel / i.synth_fuel.FT_process_hydrogen_req
            o.synth_fuel.total_produced += synth_fuel_produced_FT
            o.synth_fuel.total_biomass_used += hourly_biomass_for_biofuel
            o.synth_fuel.store_SOC += synth_fuel_produced_FT
            o.total_losses.FT += (hydrogen_to_synth_fuel + hourly_biomass_for_biofuel) - (hydrogen_to_synth_fuel / i.synth_fuel.FT_process_hydrogen_req)         
            
            // 4. Hydrogen to Methanation
            let co2_for_sabatier = co2_from_biogas
            let hydrogen_for_sabatier = co2_for_sabatier * (8.064/44.009) * 39.4 * 0.001                     // 1000 tCO2, requires 7.2 GWh of H2 (HHV)
            
            let available_hydrogen = o.hydrogen.SOC-(i.hydrogen.storage_capacity_GWh*i.hydrogen.minimum_store_level)        // calculate available hydrogen
            if (hydrogen_for_sabatier>available_hydrogen) hydrogen_for_sabatier = available_hydrogen     // limit by available hydrogen
            if (hydrogen_for_sabatier>i.methane.methanation_capacity) hydrogen_for_sabatier = i.methane.methanation_capacity // limit by methanation capacity
            if (hydrogen_for_sabatier<0.0) hydrogen_for_sabatier = 0.0
            hydrogen_balance -= hydrogen_for_sabatier                                                    // subtract from hydrogen store
            // Methanation process itself
            let methane_from_sabatier = hydrogen_for_sabatier * (889.0/1144.0)                               // 78% efficiency based on HHV kj/mol of CH4/4H2
            o.total_losses.sabatier += hydrogen_for_sabatier - methane_from_sabatier
            
            o.hydrogen.SOC += hydrogen_balance
            
            if (o.hydrogen.SOC<0.0) {
                o.hydrogen.unmet_demand += -1*o.hydrogen.SOC
                o.hydrogen.SOC = 0.0
            }
            
            if (o.hydrogen.SOC>o.hydrogen.max_SOC) o.hydrogen.max_SOC = o.hydrogen.SOC
            if (o.hydrogen.SOC<o.hydrogen.min_SOC) o.hydrogen.min_SOC = o.hydrogen.SOC

            o.hydrogen.total_demand += hydrogen_for_hydrogen_vehicles + hydrogen_to_synth_fuel + hydrogen_for_sabatier
                 
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
            let electricity_for_power_to_X = 0
            if (balance>=0.0) {
                electricity_for_power_to_X = balance
                if (electricity_for_power_to_X>i.power_to_X.capacity) electricity_for_power_to_X = i.power_to_X.capacity
            }
            
            // 2. Split by gaseous and liquid outputs
            let methane_from_IHTEM = electricity_for_power_to_X * i.power_to_X.prc_gas * i.power_to_X.gas_efficiency
            let synth_fuel_produced_PTL = electricity_for_power_to_X * i.power_to_X.prc_liquid * i.power_to_X.liquid_efficiency
            
            balance -= electricity_for_power_to_X
            
            o.power_to_X.total_electricity_demand += electricity_for_power_to_X
            
            // Losses and electric consumption graph
            o.total_losses.power_to_X += electricity_for_power_to_X - (methane_from_IHTEM + synth_fuel_produced_PTL)
            d.electricity_for_power_to_X.push(electricity_for_power_to_X)
            
            // Add to stores and totals
            o.synth_fuel.total_produced += synth_fuel_produced_PTL
            o.synth_fuel.store_SOC += synth_fuel_produced_PTL
            
            // ----------------------------------------------------------------------------
            // Dispatchable (backup power via CCGT gas turbines)
            // ---------------------------------------------------------------------------- 
            let hydrogen_turbine_output = 0
            let methane_turbine_output = 0
            let synth_fuel_turbine_output = 0
            let biomass_turbine_output = 0
            let coal_turbine_output = 0
            let electricity_from_dispatchable = 0
            let electricity_from_dispatchable_before_grid_loss = 0
            var shortfall = 0;
            
            if (balance<0.0) {
                let backup_requirement = (-1 * balance);
                
                // Limit to maximum allowed backup capacity
                if (backup_requirement>i.electric_backup.capacity_limit) {

                    // shortfall
                    shortfall = backup_requirement - i.electric_backup.capacity_limit;

                    backup_requirement = i.electric_backup.capacity_limit;

                }

                let backup_requirement_before_grid_loss = backup_requirement / grid_loss_prc
                
                // Allocate to different technologies
                hydrogen_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_hydrogen * 0.01)
                methane_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_methane * 0.01)
                synth_fuel_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_synth_fuel * 0.01)
                biomass_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_biomass * 0.01)
                coal_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_coal * 0.01)

                // Limit by hydrogen availability (only available from H2 store)
          
              if (hydrogen_turbine_output>(o.hydrogen.SOC*i.electric_backup.hydrogen_efficiency*0.01)) {
                    hydrogen_turbine_output = o.hydrogen.SOC*i.electric_backup.hydrogen_efficiency*0.01
                }
                
                // If methane and synth fuels are from stores only, limit by availability
                if (!i.fossil_fuels.allow_use_for_backup) {
                    // Limit by methane availability
                    if (methane_turbine_output>(o.methane.SOC*i.electric_backup.methane_efficiency*0.01)) {
                        methane_turbine_output = o.methane.SOC*i.electric_backup.methane_efficiency*0.01
                    }
                    // Limit by synth fuel availability
                    if (synth_fuel_turbine_output>(o.synth_fuel.store_SOC*i.electric_backup.synth_fuel_efficiency*0.01)) {
                        synth_fuel_turbine_output = o.synth_fuel.store_SOC*i.electric_backup.synth_fuel_efficiency*0.01
                    }
                }

                // Totals
                o.electric_backup.total_hydrogen_turbine_output += hydrogen_turbine_output
                o.electric_backup.total_methane_turbine_output += methane_turbine_output
                o.electric_backup.total_synth_fuel_turbine_output += synth_fuel_turbine_output 
                o.electric_backup.total_biomass_turbine_output += biomass_turbine_output
                o.electric_backup.total_coal_turbine_output += coal_turbine_output 
                                
                // Log maximum dispatchable capacity requirement and time
                if (backup_requirement>o.electric_backup.max_capacity_requirement) {
                    o.electric_backup.max_capacity_requirement = backup_requirement
                    o.electric_backup.max_capacity_requirement_hour = hour
                }
                
                electricity_from_dispatchable_before_grid_loss = hydrogen_turbine_output + methane_turbine_output + synth_fuel_turbine_output + biomass_turbine_output + coal_turbine_output
                o.electric_backup.total_before_grid_loss += electricity_from_dispatchable_before_grid_loss
                electricity_from_dispatchable = electricity_from_dispatchable_before_grid_loss * grid_loss_prc
                o.total_losses.grid += electricity_from_dispatchable_before_grid_loss - electricity_from_dispatchable
            }
            d.electricity_from_dispatchable.push(electricity_from_dispatchable)

            // Final electricity balance
            balance += electricity_from_dispatchable

            // Can we reduce the shortfall with DSR
            
            if (balance<0) {
                shortfall = -1*balance;
                // Try reducing electric heat

                let spacewater_elec = d.heating_systems.elres.fuel_demand[hour] + d.heating_systems.heatpump.fuel_demand[hour];
                let prc_elres_elec = d.heating_systems.elres.fuel_demand[hour] / spacewater_elec;
                let prc_heatpump_elec = d.heating_systems.heatpump.fuel_demand[hour] / spacewater_elec;
                let spacewater_heat = d.heating_systems.elres.heat_demand[hour] + d.heating_systems.heatpump.heat_demand[hour];
                let prc_elres_heat = d.heating_systems.elres.heat_demand[hour] / spacewater_heat;
                let prc_heatpump_heat = d.heating_systems.heatpump.heat_demand[hour] / spacewater_heat;

                if (spacewater_elec>0) {
                    let COP = spacewater_heat / spacewater_elec;

                    let available_hybrid_heat_GW = 1000;

                    let elec_displaced_by_hybrid = shortfall; 
                    if (elec_displaced_by_hybrid>spacewater_elec) elec_displaced_by_hybrid = spacewater_elec;

                    let heat_from_hybrid_boiler = elec_displaced_by_hybrid * COP;
                    if (heat_from_hybrid_boiler>available_hybrid_heat_GW) heat_from_hybrid_boiler = available_hybrid_heat_GW;
                    elec_displaced_by_hybrid = heat_from_hybrid_boiler / COP;

                    shortfall -= elec_displaced_by_hybrid;
                    spacewater_elec -= elec_displaced_by_hybrid;
                    spacewater_heat -= heat_from_hybrid_boiler;
                    balance += elec_displaced_by_hybrid;

                    d.spacewater_elec[hour] = spacewater_elec;

                    d.heating_systems.elres.fuel_demand[hour] = spacewater_elec * prc_elres_elec;
                    d.heating_systems.elres.heat_demand[hour] = spacewater_heat * prc_elres_heat;
                    d.heating_systems.heatpump.fuel_demand[hour] = spacewater_elec * prc_heatpump_elec;
                    d.heating_systems.heatpump.heat_demand[hour] = spacewater_heat * prc_heatpump_heat;


                    o.heat.total_heat_from_hybrid_boiler += heat_from_hybrid_boiler;
                    if (heat_from_hybrid_boiler>o.heat.max_heat_from_hybrid_boiler) {
                        o.heat.max_heat_from_hybrid_boiler = heat_from_hybrid_boiler;
                        o.heat.max_elec_avoided_by_hybrid_boiler = elec_displaced_by_hybrid;
                    }

                    // add to methane demand
                    d.heating_systems.methane.fuel_demand[hour] += heat_from_hybrid_boiler / 0.85;
                    d.heating_systems.methane.heat_demand[hour] += heat_from_hybrid_boiler;
                }
            }
            


            let excess_elec = 0.0
            let unmet_elec = 0.0
            if (balance>=0.0) {
                excess_elec = balance
                o.balance.total_excess_elec += excess_elec
            } else {
                unmet_elec = -balance
                o.balance.total_unmet_elec += unmet_elec
                
                if (unmet_elec>o.electric_backup.max_shortfall) {
                    o.electric_backup.max_shortfall = unmet_elec
                    o.electric_backup.max_shortfall_hour = hour
                }
            }
            d.excess_elec.push(excess_elec)
            d.unmet_elec.push(unmet_elec)
            
            // ----------------------------------------------------------------------------
            // Methane
            // ---------------------------------------------------------------------------- 
            // Total methane production
            let methane_production = methane_from_sabatier + methane_from_biogas + methane_from_IHTEM
            o.methane.total_produced += methane_production
            
            let methane_to_dispatchable = methane_turbine_output / (i.electric_backup.methane_efficiency*0.01)
            
            if (i.fossil_fuels.allow_use_for_backup) {
                if (methane_to_dispatchable>o.methane.SOC) {
                    o.methane.ccgt_methane_from_fossil_gas += methane_to_dispatchable - o.methane.SOC
                }
            }
            
            let methane_demand = methane_to_dispatchable + d.heating_systems.methane.fuel_demand[hour] + d.methane_for_industry[hour] + d.lac_demand_gas[hour]
            o.methane.total_demand += methane_demand
            
            let methane_balance = methane_production - methane_demand
                    
            o.methane.SOC += methane_balance
            if (o.methane.SOC>i.methane.storage_capacity_GWh) {
                o.methane.store_excess += o.methane.SOC - i.methane.storage_capacity_GWh
                o.methane.SOC = i.methane.storage_capacity_GWh
            }
            
            if (o.methane.SOC<0) {
                o.methane.unmet += -1*o.methane.SOC
                o.methane.SOC = 0
            }
            
            
            d.methane_SOC.push(o.methane.SOC)
            if ((o.methane.SOC/i.methane.storage_capacity_GWh)<0.01) o.methane.store_empty_count ++
            if ((o.methane.SOC/i.methane.storage_capacity_GWh)>0.99) o.methane.store_full_count ++
            
            if (o.methane.SOC>o.methane.max_SOC) o.methane.max_SOC = o.methane.SOC
            if (o.methane.SOC<o.methane.min_SOC) o.methane.min_SOC = o.methane.SOC
            
            // ----------------------------------------------------------------------------
            // Liquid Synth fuel
            // ---------------------------------------------------------------------------- 
            // Synth fuel demand
            let synth_fuel_for_dispatchable = synth_fuel_turbine_output / (i.electric_backup.synth_fuel_efficiency*0.01)
            let synth_fuel_demand = (daily_transport_liquid_demand/24.0) + hourly_industrial_biofuel + d.heating_systems.synthfuel.fuel_demand[hour] + synth_fuel_for_dispatchable
            o.synth_fuel.total_demand += synth_fuel_demand
            o.synth_fuel.store_SOC -= synth_fuel_demand
            
            o.synth_fuel.total_transport_demand += (daily_transport_liquid_demand/24.0)
            o.synth_fuel.total_industrial_demand += hourly_industrial_biofuel
            
            // Record unmet synth fuel demand
            if (o.synth_fuel.store_SOC<0.0) {
                o.synth_fuel.unmet_demand += -1*o.synth_fuel.store_SOC
                o.synth_fuel.store_SOC = 0.0
            }
            d.synth_fuel_store_SOC.push(o.synth_fuel.store_SOC)
            
            if (o.synth_fuel.store_min_SOC>o.synth_fuel.store_SOC) o.synth_fuel.store_min_SOC = o.synth_fuel.store_SOC
            if (o.synth_fuel.store_max_SOC<o.synth_fuel.store_SOC) o.synth_fuel.store_max_SOC = o.synth_fuel.store_SOC
            
            // Biomass
            o.biomass.total_used += biogas_supply / i.biogas.anaerobic_digestion_efficiency 
            o.biomass.total_used += hourly_biomass_for_biofuel
            
            // Hydrogen SOC data
            let hydrogen_for_dispatchable = hydrogen_turbine_output / (i.electric_backup.hydrogen_efficiency*0.01)     
            o.hydrogen.SOC -= hydrogen_for_dispatchable
            
            d.hydrogen_SOC.push(o.hydrogen.SOC)
            if ((o.hydrogen.SOC/i.hydrogen.storage_capacity_GWh)<0.01) o.hydrogen.store_empty_count ++
            if ((o.hydrogen.SOC/i.hydrogen.storage_capacity_GWh)>0.99) o.hydrogen.store_full_count ++
        }
        
        // Electricity backup losses
        o.total_losses.elec_backup = 0
        o.total_losses.elec_backup += ((1.0/(i.electric_backup.hydrogen_efficiency*0.01))-1.0) * o.electric_backup.total_hydrogen_turbine_output
        o.total_losses.elec_backup += ((1.0/(i.electric_backup.methane_efficiency*0.01))-1.0) * o.electric_backup.total_methane_turbine_output
        o.total_losses.elec_backup += ((1.0/(i.electric_backup.synth_fuel_efficiency*0.01))-1.0) * o.electric_backup.total_synth_fuel_turbine_output
        o.total_losses.elec_backup += ((1.0/(i.electric_backup.biomass_efficiency*0.01))-1.0) * o.electric_backup.total_biomass_turbine_output
        o.total_losses.elec_backup += ((1.0/(i.electric_backup.coal_efficiency*0.01))-1.0) * o.electric_backup.total_coal_turbine_output
        
        let biomass_for_dispatchable = o.electric_backup.total_biomass_turbine_output / (i.electric_backup.biomass_efficiency*0.01)
        o.biomass.total_used += biomass_for_dispatchable

    },
    
    // -------------------------------------------------------------------------------------------------
    // Option to use fossil fuels to provide either backup methane and liquid fuels (gas and oil)
    // or to simulate interim scenarios on the way to zero carbon.
    // -------------------------------------------------------------------------------------------------   
    fossil_fuels: function() {
         
         o.energy_industry_use = {
             total: 0
         }
         
         if (i.fossil_fuels.allow_use_for_backup) {
             o.fossil_fuels.oil = o.synth_fuel.unmet_demand
             o.synth_fuel.unmet_demand = 0
             
             o.fossil_fuels.gas = o.methane.unmet
             o.methane.unmet = 0
         }
         o.fossil_fuels.coal_for_dispatchable = o.electric_backup.total_coal_turbine_output / (i.electric_backup.coal_efficiency*0.01)
         o.fossil_fuels.coal = o.fossil_fuels.coal_for_heating_systems + o.fossil_fuels.coal_for_dispatchable + o.industry.total_coal_demand
     
         // Record final gas, oil and coal demand before energy industry use additions
         o.fossil_fuels.gas_final_demand = o.fossil_fuels.gas
         o.fossil_fuels.oil_final_demand = o.fossil_fuels.oil
         o.fossil_fuels.coal_final_demand = o.fossil_fuels.coal
         
         o.fossil_fuels.refineries_gas_use = (o.fossil_fuels.oil) * 0.00293;
         o.fossil_fuels.refineries_oil_use = (o.fossil_fuels.oil) * 0.0576;
         o.fossil_fuels.oil_gas_extraction_gas_use = (o.fossil_fuels.oil + o.fossil_fuels.gas) * 0.0334;
         o.fossil_fuels.oil_gas_extraction_oil_use = (o.fossil_fuels.oil + o.fossil_fuels.gas) * 0.00486;
         o.fossil_fuels.gas_losses = (o.fossil_fuels.gas) * 0.0069;
         
         o.energy_industry_use.total += o.fossil_fuels.refineries_gas_use
         o.energy_industry_use.total += o.fossil_fuels.refineries_oil_use
         
         o.energy_industry_use.total += o.fossil_fuels.oil_gas_extraction_gas_use
         o.energy_industry_use.total += o.fossil_fuels.oil_gas_extraction_oil_use
         
         o.energy_industry_use.total += o.fossil_fuels.gas_losses
         
         o.fossil_fuels.gas += o.fossil_fuels.refineries_gas_use
         o.fossil_fuels.oil += o.fossil_fuels.refineries_oil_use
         
         o.fossil_fuels.gas += o.fossil_fuels.oil_gas_extraction_gas_use       
         o.fossil_fuels.oil += o.fossil_fuels.oil_gas_extraction_oil_use
         
         // When creating baselines, some of the datasets dont precisely match
         // these can be used for final adjustments
         o.fossil_fuels.gas += i.fossil_fuels.other_gas_use * 10000
         o.fossil_fuels.oil += i.fossil_fuels.other_oil_use * 10000
         o.fossil_fuels.coal += i.fossil_fuels.other_coal_use * 10000
         // Add to energy_industry_use total
         o.energy_industry_use.total += i.fossil_fuels.other_gas_use * 10000
         o.energy_industry_use.total += i.fossil_fuels.other_oil_use * 10000
         o.energy_industry_use.total += i.fossil_fuels.other_coal_use * 10000
           
         o.fossil_fuels.gas += o.fossil_fuels.gas_losses
         
         o.fossil_fuels.total = o.fossil_fuels.oil + o.fossil_fuels.gas + o.fossil_fuels.coal
                  
    },
    
    final: function() {
        o.electric_storage.kwh_per_household = (i.electric_storage.capacity_GWh * 1000 * 1000) / i.households_2030;
        o.electric_storage.cycles_per_year = (o.electric_storage.total_discharge / i.electric_storage.capacity_GWh)*0.1
        
        // -------------------------------------------------------------------------------
        // o.supply.total_fixed_electricity
        // o.total_losses.grid
        // o.electric_backup.total_before_grid_loss
        
        o.supply.total_electricity_before_grid_loss = o.supply.total_fixed_electricity // + o.electric_backup.total_before_grid_loss
        o.balance.total_electricity_demand = o.supply.total_electricity_before_grid_loss - o.balance.total_excess_elec + o.balance.total_unmet_elec // - o.total_losses.grid

        
        o.biomass.total_used += o.industry.total_biomass_demand
        
        o.balance.total_unmet_demand = o.balance.total_unmet_elec
        
        o.balance.total_supply = o.supply.total_fixed_electricity + o.supply.total_fixed_heat + o.biomass.total_used + o.fossil_fuels.total + o.hydrogen.total_from_imports
        if (i.include_ambient_heat) o.balance.total_supply += o.heat.total_ambient_supply
        
        o.balance.total_demand = 0
        o.balance.total_demand += o.LAC.total 
        o.balance.total_demand += o.LAC.total_gas
        o.balance.total_demand += o.space_heating.total_demand
        o.balance.total_demand += o.water_heating.total_demand
        if (!i.include_ambient_heat) {
            o.balance.total_demand -= o.heat.total_ambient_supply  
        }
        o.balance.total_demand += o.industry.total_elec_demand
        o.balance.total_demand += o.industry.total_methane_demand
        o.balance.total_demand += o.industry.total_hydrogen_demand
        o.balance.total_demand += o.industry.total_coal_demand
        o.balance.total_demand += o.industry.total_biomass_demand
        
        o.balance.total_demand += o.electric_transport.total_EV_demand
        o.balance.total_demand += o.electric_transport.total_elec_trains_demand
        o.balance.total_demand += o.hydrogen.total_vehicle_demand
        
        o.balance.total_demand += o.synth_fuel.total_transport_demand
        o.balance.total_demand += o.synth_fuel.total_industrial_demand
        
        o.balance.total_demand += o.energy_industry_use.total
        
        // -------------------------------------------------------------------------------------------------
        let final_store_balance = 0
        
        //let heatstore_additions =  o.heatstore.SOC - o.heatstore.SOC_start
        //console.log("heatstore_additions: "+heatstore_additions)
        //final_store_balance += heatstore_additions

        let BEV_store_additions =  o.electric_transport.BEV_Store_SOC - o.electric_transport.BEV_Store_SOC_start
        console.log("BEV_store_additions: "+BEV_store_additions)
        final_store_balance += BEV_store_additions

        let elecstore_additions =  o.electric_storage.SOC - o.electric_storage.SOC_start
        console.log("elecstore_additions: "+elecstore_additions)
        final_store_balance += elecstore_additions
            
        let hydrogen_store_additions = o.hydrogen.SOC - o.hydrogen.SOC_start
        console.log("hydrogen_store_additions: "+hydrogen_store_additions)
        final_store_balance += hydrogen_store_additions
        
        let methane_store_additions = o.methane.SOC - i.methane.SOC_start
        console.log("methane_store_additions: "+methane_store_additions)
        final_store_balance += methane_store_additions

        let synth_fuel_store_additions = o.synth_fuel.store_SOC - i.synth_fuel.store_start_GWh
        console.log("synth_fuel_store_additions: "+synth_fuel_store_additions)
        final_store_balance += synth_fuel_store_additions

        console.log("final_store_balance: "+final_store_balance)
        
        console.log("total_heat_spill: "+o.heat.total_spill);
        
        console.log("unmet_EV_demand: "+o.electric_transport.unmet_EV_demand)
        console.log("Unmet hydrogen demand: "+o.hydrogen.unmet_demand)
        console.log("Unmet synth fuel demand: "+o.synth_fuel.unmet_demand)
        o.balance.total_unmet_demand += o.electric_transport.unmet_EV_demand + o.hydrogen.unmet_demand + o.synth_fuel.unmet_demand + o.methane.unmet
        
        o.balance.total_spill = o.methane.store_excess + o.heat.total_spill
        
        // -------------------------------------------------------------------------------------------------
        o.balance.total_excess = o.balance.total_excess_elec + final_store_balance
        
        o.balance.total_losses_combined = o.balance.total_spill
        for (var z in o.total_losses) {
            o.balance.total_losses_combined += o.total_losses[z];
        }

        console.log("total_supply: "+o.balance.total_supply)
        console.log("total_unmet_demand: "+o.balance.total_unmet_demand)
        console.log("total_demand: "+o.balance.total_demand)    
        console.log("total_losses_combined: "+o.balance.total_losses_combined)
        console.log("total_excess: "+o.balance.total_excess)
            
        let unaccounted_balance = o.balance.total_supply + o.balance.total_unmet_demand - o.balance.total_demand - o.balance.total_losses_combined - o.balance.total_excess
        console.log("unaccounted_balance: "+unaccounted_balance.toFixed(6))
        // -------------------------------------------------------------------------------------------------
        
        console.log("max heat elec demand: "+o.heat.max_elec_demand);
        
        o.balance.primary_energy_factor = o.balance.total_supply / o.balance.total_demand
        
        // -------------------------------------------------------------------------------
        
        o.biomass.total_direct_use = o.biomass.total_used - (i.biogas.biomass_for_biogas*10000) - o.synth_fuel.total_biomass_used
        
        if (i.hydrogen.electrolysis_capacity_GW>0) {
            o.hydrogen.electrolysis_capacity_factor = 100*(o.hydrogen.total_electricity_for_electrolysis / (i.hydrogen.electrolysis_capacity_GW * 87600))
        } else {
            o.hydrogen.electrolysis_capacity_factor = 0
        }
        
        if (i.power_to_X.capacity>0) {
            o.power_to_X.capacity_factor = 100*(o.power_to_X.total_electricity_demand / (i.power_to_X.capacity * 87600))
        } else {
            o.power_to_X.capacity_factor = 0
        }
        
        var out = "";
        var error = 0
        for (var hour = 0; hour < i.hours; hour++) {
            
            let supply = d.elec_supply_hourly[hour]
            let demand = d.lac_demand[hour] + d.spacewater_elec[hour] + d.industrial_elec_demand[hour] + d.EL_transport[hour] + d.electricity_for_electrolysis[hour] + d.elec_store_charge[hour] + d.electricity_for_power_to_X[hour]
            let balance = (supply + d.unmet_elec[hour] + d.electricity_from_dispatchable[hour] + d.elec_store_discharge[hour]) + d.EV_smart_discharge[hour] - demand-d.excess_elec[hour]
            error += Math.abs(balance)
        } 
        
        console.log("balance error: "+error.toFixed(12));
        
        var datastarttime = 32*365.25*24*3600*1000;

        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        var date = new Date(datastarttime + (o.electric_backup.max_capacity_requirement_hour * 3600 * 1000));
        var h = date.getHours();
        if (h<10) h = "0"+h
        o.electric_backup.max_capacity_requirement_date = h+":00 "+(date.getDate())+" "+months[date.getMonth()]+" "+date.getFullYear();

        date = new Date(datastarttime + (o.electric_backup.max_shortfall_hour * 3600 * 1000));
        h = date.getHours();
        if (h<10) h = "0"+h
        o.electric_backup.max_shortfall_date = h+":00 "+(date.getDate())+" "+months[date.getMonth()]+" "+date.getFullYear();
    },
    
    land_use: function() {
        o.land_use = {}
        
        // Work backwards to land areas
        o.biomass.grass_for_biogas = i.biogas.biomass_for_biogas - 34.15
        if (o.biomass.grass_for_biogas<0.0) o.biomass.grass_for_biogas = 0.0

        o.land_use.rotational_grass_ryegrass = o.biomass.grass_for_biogas / (10.5 * 0.001 * 0.95 * 4.72)
        o.land_use.perrennial_grass_miscanthus = (o.synth_fuel.total_biomass_used * 0.0001) / (15.0 * 0.001 * 0.95 * 4.72)

        // Work forwards to TWh
        let short_rotation_forestry_harvestable_modtyr = ((i.land_use.short_rotation_forestry * 5.08 * 0.001)/(44/12))/0.5
        let short_rotation_forestry_TWh = short_rotation_forestry_harvestable_modtyr * 0.65 * 4.72
        
        let biomass_demand_for_heat_TWh = o.biomass.total_direct_use * 0.0001
        let short_rotation_coppice_TWh = biomass_demand_for_heat_TWh - short_rotation_forestry_TWh
        
        // Work backwards to land area
        o.land_use.short_rotation_coppice = short_rotation_coppice_TWh / (12.75 * 0.001 * 0.95 * 4.72)
        
        
        o.land_use.total = 0
        for (var z in i.land_use) {
            o.land_use.total += i.land_use[z]
        }
        o.land_use.total += o.land_use.rotational_grass_ryegrass
        o.land_use.total += o.land_use.perrennial_grass_miscanthus
        o.land_use.total += o.land_use.short_rotation_coppice
        
        o.land_use.available = 24728.0 - o.land_use.total
        
        o.land_use.total_prc = o.land_use.total / 24728.0
        
        // ---------------------
        // Carbon sequestration        
        // ---------------------
        // See ZCB Matrix spreadsheet
        // Todo: copy references over from ZCB Matrix spreadsheet and provide more explanation
        
        o.carbon_sequestration = {}
        
        // Carbon sequestration: Reforestation  
        o.carbon_sequestration.reforestation = {
            new_natural_broadleaf_woodland: i.land_use.new_natural_broadleaf_woodland * 8.80 * 0.001,
            new_natural_coniferous_woodland: i.land_use.new_natural_coniferous_woodland * 9.11 * 0.001,
            new_productive_broadleaf_woodland: i.land_use.new_productive_broadleaf_woodland * 2.49 * 0.001,
            new_productive_coniferous_woodland: i.land_use.new_productive_coniferous_woodland * 4.25 * 0.001,
            short_rotation_forestry: i.land_use.short_rotation_forestry * 3.26 * 0.001
        }
        var total = 0
        for (var z in o.carbon_sequestration.reforestation) { 
            total +=  o.carbon_sequestration.reforestation[z]
        }
        o.carbon_sequestration.reforestation.total = total
        
        // Carbon sequestration: Buildings etc
        let existing_productive_broadleaf_woodland_harvestable_modtyr = ((i.land_use.existing_productive_broadleaf_woodland * 0.7 * 0.001)/(44/12))/0.5
        let existing_productive_coniferous_woodland_harvestable_modtyr = ((i.land_use.existing_productive_coniferous_woodland * 1.47 * 0.001)/(44/12))/0.5
        let new_productive_broadleaf_woodland_harvestable_modtyr = ((i.land_use.new_productive_broadleaf_woodland * 0.7 * 0.001)/(44/12))/0.5
        let new_productive_coniferous_woodland_harvestable_modtyr = ((i.land_use.new_productive_coniferous_woodland * 1.47 * 0.001)/(44/12))/0.5
        let annual_grass_hemp_harvestable_modtyr = i.land_use.annual_grass_hemp * 9.5 * 0.001
         
        o.carbon_sequestration.timber_products = {
            existing_productive_broadleaf_woodland: existing_productive_broadleaf_woodland_harvestable_modtyr * 0.95 * 0.5*(44/12),
            existing_productive_coniferous_woodland: existing_productive_coniferous_woodland_harvestable_modtyr * 0.95 * 0.5*(44/12),
            new_productive_broadleaf_woodland: new_productive_broadleaf_woodland_harvestable_modtyr * 0.95 * 0.5*(44/12),
            new_productive_coniferous_woodland: new_productive_coniferous_woodland_harvestable_modtyr * 0.95 * 0.5*(44/12),
            short_rotation_forestry: short_rotation_forestry_harvestable_modtyr * 0.3 * 0.5*(44/12),
            annual_grass_hemp: annual_grass_hemp_harvestable_modtyr * 0.95 * 0.5*(44/12)
        }
        var total = 0
        for (var z in o.carbon_sequestration.timber_products) { 
            total +=  o.carbon_sequestration.timber_products[z]
        }
        o.carbon_sequestration.timber_products.total = total
        
        // Carbon sequestration: Biochar
        o.carbon_sequestration.biochar = {
            existing_productive_broadleaf_woodland: existing_productive_broadleaf_woodland_harvestable_modtyr * 0.05 * 0.7,
            existing_productive_coniferous_woodland: existing_productive_coniferous_woodland_harvestable_modtyr * 0.05 * 0.7,
            new_productive_broadleaf_woodland: new_productive_broadleaf_woodland_harvestable_modtyr * 0.05 * 0.7,
            new_productive_coniferous_woodland: new_productive_coniferous_woodland_harvestable_modtyr * 0.05 * 0.7,
            short_rotation_forestry: short_rotation_forestry_harvestable_modtyr * 0.05 * 0.7,
            landfill: 1.47 * 0.88
        }
        var total = 0
        for (var z in o.carbon_sequestration.biochar) { 
            total +=  o.carbon_sequestration.biochar[z]
        }
        o.carbon_sequestration.biochar.total = total
        
        o.carbon_sequestration.total = o.carbon_sequestration.reforestation.total + o.carbon_sequestration.timber_products.total + o.carbon_sequestration.biochar.total
    },

    // ----------------------------------------------------------------------------
    // Emissions balance
    // ----------------------------------------------------------------------------     
    emissions_balance: function() {

        o.emissions_balance = {}

        // Aviation emissions uplift
        let aviation_uplift = 1.6
        o.emissions_balance.aviation_co2e = o.transport.modes.Aviation.IC.TWh * 0.30704 * (aviation_uplift-1)
        
        // Fossil fuels
        // energy quantities are in GWh over 10 years
        // multiply by 0.1 to give over 1 year
        // - coal co2 factor is 0.3166 kgCO2 per kWh = 0.0003166 MtCO2 per GWh
        // - oil co2 factor is 0.2678 kgCO2 per kWh = 0.0002678 MtCO2 per GWh
        // - gas co2 factor is 0.1839 kgCO2 per kWh = 0.0001839 MtCO2 per GWh
        o.emissions_balance.fossil_fuel_coal = o.fossil_fuels.coal*0.1*0.0003166
        o.emissions_balance.fossil_fuel_oil = o.fossil_fuels.oil*0.1*0.0002678
        o.emissions_balance.fossil_fuel_gas = o.fossil_fuels.gas*0.1*0.0001839
                        
        let grid_co2_emissions = 0;
        grid_co2_emissions += o.methane.ccgt_methane_from_fossil_gas*0.0001839
        grid_co2_emissions += o.fossil_fuels.coal_for_dispatchable*0.0003166
        
        o.emissions_balance.grid_co2_intensity = 1000000 * (grid_co2_emissions / o.balance.total_electricity_demand)   // MtC02 / GWh
        
        o.emissions_balance.reforestation = -o.carbon_sequestration.reforestation.total
        o.emissions_balance.harvested_wood = -o.carbon_sequestration.timber_products.total     
        o.emissions_balance.biochar_carbon_capture = -o.carbon_sequestration.biochar.total     
        o.emissions_balance.international_aviation_bunkers = o.emissions_balance.aviation_co2e
        
        o.emissions_balance.total = 0
        
        for (var z in i.emissions_balance) {
            o.emissions_balance.total += i.emissions_balance[z]
        }

        o.emissions_balance.total += o.emissions_balance.fossil_fuel_coal
        o.emissions_balance.total += o.emissions_balance.fossil_fuel_oil
        o.emissions_balance.total += o.emissions_balance.fossil_fuel_gas

        o.emissions_balance.total += o.emissions_balance.reforestation
        o.emissions_balance.total += o.emissions_balance.harvested_wood
        o.emissions_balance.total += o.emissions_balance.biochar_carbon_capture
        o.emissions_balance.total += o.emissions_balance.international_aviation_bunkers
    },

    // ----------------------------------------------------------------------------
    // Scaled up to village, town, country scale
    // ----------------------------------------------------------------------------    
    scaled_by: function() {
        o.scaleby = 1000 * 1000 * i.number_of_households / i.households_2030
    },

    // ----------------------------------------------------------------------------
    // Embodied Energy
    // ----------------------------------------------------------------------------     
    embodied_energy: function() {
        
        o.EE = {
            total: 0
        }
        
        o.EE.onshorewind = (i.supply.onshore_wind_capacity * i.EE.onshorewind_GWh_per_GW * 0.001) / i.EE.onshorewind_lifespan
        o.EE.total += o.EE.onshorewind
        
        o.EE.offshorewind = (i.supply.offshore_wind_capacity * i.EE.offshorewind_GWh_per_GW * 0.001) / i.EE.offshorewind_lifespan
        o.EE.total += o.EE.offshorewind
        
        o.EE.solarpv = (i.supply.solarpv_capacity * i.EE.solarpv_GWh_per_GW * 0.001) / i.EE.solarpv_lifespan
        o.EE.total += o.EE.solarpv
        
        /*
        elec_store_cycles_per_year = (total_elec_store_charge*0.1) / i.electric_storage.capacity_GWh
        EE_liion_store = 0// (((i.electric_storage.capacity_GWh * 0.136) / 1500 * 0.8) * total_elec_store_charge)/3650
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
        
        o.EE.prc_of_industry_demand = 100 * o.EE.total / o.industry.total_demand
    },
    cost_model: function() {

        o.costs = {}

        o.costs['Onshore wind'] = { capacity: i.supply.onshore_wind_capacity }
        o.costs['Offshore wind'] = { capacity: i.supply.offshore_wind_capacity }
        o.costs['Solar PV'] = { capacity: i.supply.solarpv_capacity }
        o.costs['Tidal'] = { capacity: i.supply.tidal_capacity }
        o.costs['Wave'] = { capacity: i.supply.wave_capacity }
        o.costs['Geothermal Electric'] = { capacity: i.supply.geothermal_elec_capacity }
        o.costs['Nuclear'] = { capacity: i.supply.nuclear_capacity }
        o.costs['H2 Electrolysis'] = { capacity: i.hydrogen.electrolysis_capacity_GW }
        o.costs['Methanation'] = { capacity: i.methane.methanation_capacity }
        o.costs['Gas turbines'] = { capacity: o.electric_backup.max_capacity_requirement }
        o.costs['Power to X'] = { capacity: i.power_to_X.capacity }
        o.costs['Electric Storage'] = { capacity: i.electric_storage.capacity_GWh }

        o.total_annual_cost = 0;

        for (var z in i.costs) {
            o.costs[z].annual = o.costs[z].capacity * 0.001 * annual_cost(
                    i.costs[z].capex,
                    i.costs[z].opex,
                    0,
                    i.costs[z].buildmonths,
                    i.costs[z].lifespan,
                    i.wacc*0.01)
            o.total_annual_cost += o.costs[z].annual
        }
        
        o.LCOE = 1000*o.total_annual_cost / (o.balance.total_electricity_demand*0.0001)
        
        
    }
}

function annual_cost(capex,opex,fuel,months_to_build,lifespan,interest_rate) {

    principal_at_commisioning = capex * Math.pow((1 + interest_rate), months_to_build/12)

    lifespan_months = lifespan*12

    monthly_payment = (interest_rate/12) * (1/(1-(1+interest_rate/12)**(-lifespan_months)))*principal_at_commisioning
    annual_payment = monthly_payment * 12

    return annual_payment + opex
}
