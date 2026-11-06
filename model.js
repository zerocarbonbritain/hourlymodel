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
            var capacityfactors = tenyearsdatalines[hour + i.start_hour].split(",");
            for (var z=0; z<capacityfactors.length; z++) {
                capacityfactors[z] = parseFloat(capacityfactors[z]);
            }
            capacityfactors_all.push(capacityfactors)
        } 
    },
    
    run: function() {

        // Run length: i.hours from i.start_hour in the weather data (a whole number of days from
        // midnight). Energy totals are in GWh over the run. Runs are whole weather years, and the
        // factors below convert totals to and from annual values.
        o.years = Math.round(i.hours / 8766)
        o.per_year = 1 / o.years
        o.TWhy_to_GWh = 1000 * o.years
        o.GWh_to_TWhy = 1 / o.TWhy_to_GWh

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
          oil_from_store:0,
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
        model.final_consumption();
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
        // International shipping (marine bunkers) draws on the liquid fuel store but is not final consumption in DUKES
        o.transport.fuel_totals.IC += i.transport.international_shipping_TWhy
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
            total_fixed_heat: 0,
            total_imports: 0

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
            let solarpv = i.supply.solarpv_capacity * capacityfactors[4] * i.supply.solarpv_availability
            let solarthermal = i.supply.solarthermal_capacity * capacityfactors[4]
            // Todo: Hydro output is somewhat weather dependent as well
            let hydro = i.supply.hydro_capacity * i.supply.hydro_capacity_factor
            // Todo: Direct use of heat storage options could be considered for geothermal and nuclear
            let geothermal_elec = i.supply.geothermal_elec_capacity * i.supply.geothermal_elec_capacity_factor
            let geothermal_heat = i.supply.geothermal_heat_capacity * i.supply.geothermal_heat_capacity_factor
            let nuclear = i.supply.nuclear_capacity * i.supply.nuclear_capacity_factor
            // Net interconnector imports, flat profile
            let imports = i.supply.imports_TWhy * 1000.0 / (365.25 * 24.0)
            
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
            o.supply.total_imports += imports
            
            // Electricity supply
            let electricity_supply_before_grid_loss = onshore_wind + offshore_wind + wave + tidal + solarpv + hydro + geothermal_elec + nuclear
            o.supply.total_fixed_electricity += electricity_supply_before_grid_loss
            electricity_supply_before_grid_loss += imports
                        
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
            var day = parseInt(Math.floor((hour + i.start_hour) / 24))
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

        o.space_heating.domestic_kwh = o.space_heating.total_domestic_demand*o.per_year*1000000 / i.households_2030
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
                water_heat_demand: 0,
                water_fuel_demand: 0,
                efficiency_slope: slope,
                efficiency_intercept: intercept
            }

            d.heating_systems[z] = {
                heat_demand: [],
                fuel_demand: []
            }
        }
        
        for (var hour = 0; hour < i.hours; hour++) {
            var day = parseInt(Math.floor((hour + i.start_hour) / 24))
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
                o.heating_systems[z].water_heat_demand += system_water_heat_demand
                o.heating_systems[z].water_fuel_demand += system_water_fuel_demand

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
        var datastarttime = (32*365.25*24 + i.start_hour)*3600*1000;
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

        // Industrial output relative to the baseline year, less the savings from material efficiency
        // (fewer tonnes) and energy efficiency (heat recovery and process improvements other than fuel
        // switching). All three apply to every end use.
        let demand_scale = i.industry.activity_prc * 0.01
        demand_scale *= 1 - i.industry.material_efficiency_prc * 0.01
        demand_scale *= 1 - i.industry.energy_efficiency_prc * 0.01

        // Heat end uses are entered as useful heat. Fuel use is useful heat divided by the
        // conversion efficiency of the electric or combustion plant. Other end uses are final energy.
        let heat_end_uses = ["high_temp_process", "low_temp_process", "dry_sep", "other_heat"]
        let electric_end_uses = ["motors", "compressed_air", "lighting", "refrigeration", "refinery_electric"]
        let mixed_end_uses = heat_end_uses.concat(["other_non_heat"])

        let elec_efficiency = {other_non_heat: 1}
        let fuel_efficiency = {other_non_heat: 1}
        for (let z of heat_end_uses) {
            elec_efficiency[z] = i.industry[z+"_elec_efficiency"] * 0.01
            fuel_efficiency[z] = i.industry[z+"_fuel_efficiency"] * 0.01
        }

        o.industry.total_demand = 0
        for (let z of mixed_end_uses.concat(electric_end_uses)) {
            o.industry.total_demand += i.industry[z+"_TWhy"] * demand_scale
        }
  
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
        var hourly_fixed_CH4_demand = 0;
        var hourly_fixed_H2_demand = 0;

        for (let z of electric_end_uses) {
            hourly_fixed_elec_demand += i.industry[z+"_TWhy"] * demand_scale * conv_hourly
        }

        for (let z of mixed_end_uses) {
            let demand = i.industry[z+"_TWhy"] * demand_scale
            hourly_fixed_elec_demand += demand * conv_hourly * i.industry[z+"_fixed_elec_prc"] * 0.01 / elec_efficiency[z]
            hourly_fixed_CH4_demand += demand * conv_hourly * i.industry[z+"_fixed_CH4_prc"] * 0.01 / fuel_efficiency[z]
            hourly_fixed_H2_demand += demand * conv_hourly * i.industry[z+"_fixed_H2_prc"] * 0.01 / fuel_efficiency[z]
            o.industry.total_synth_fuel_demand += demand * i.industry[z+"_fixed_liquid_prc"] * 0.01 / fuel_efficiency[z]
            o.industry.total_coal_demand += demand * i.industry[z+"_fixed_coal_prc"] * 0.01 / fuel_efficiency[z]
            o.industry.total_biomass_demand += demand * i.industry[z+"_fixed_biomass_prc"] * 0.01 / fuel_efficiency[z]
        }
        o.industry.total_synth_fuel_demand *= o.TWhy_to_GWh
        o.industry.total_coal_demand *= o.TWhy_to_GWh 
        o.industry.total_biomass_demand *= o.TWhy_to_GWh    

        // DSR heat demand (GW of useful heat) and the electricity needed to meet all of it
        let DSR_CH4_heat = 0
        let DSR_H2_heat = 0
        let DSR_elec_full = 0
        let DSR_CH4_fuel_full = 0
        let DSR_H2_fuel_full = 0
        for (let z of heat_end_uses) {
            let heat = i.industry[z+"_TWhy"] * demand_scale * conv_hourly
            let CH4_heat = heat * i.industry[z+"_DSR_CH4_prc"] * 0.01
            let H2_heat = heat * i.industry[z+"_DSR_H2_prc"] * 0.01
            DSR_CH4_heat += CH4_heat
            DSR_H2_heat += H2_heat
            DSR_elec_full += (CH4_heat + H2_heat) / elec_efficiency[z]
            DSR_CH4_fuel_full += CH4_heat / fuel_efficiency[z]
            DSR_H2_fuel_full += H2_heat / fuel_efficiency[z]
        }
        
        // Kept so that main_loop can give the battery first call on surplus
        d.DSR = { elec_full: DSR_elec_full, CH4_fuel_full: DSR_CH4_fuel_full, H2_fuel_full: DSR_H2_fuel_full, elec: [] }

        for (var hour = 0; hour < i.hours; hour++)
        {
            // electric demand
            let non_heat_process_elec = not_heat_process_profile[hour%24] * hourly_fixed_elec_demand * 24

            // balance including non DSR industrial load
            let balance = d.elec_supply_hourly[hour] - d.lac_demand[hour] - d.spacewater_elec[hour] - non_heat_process_elec

            // ----------------------------------------------------------------------------------------------------------------------
            
            // Here we implement a mixed fixed elec/gas heat supply and an extended DSR elec/gas supply
            // The DSR supply uses electricity when there is excess renewable supply available and gas 
            // originally produced from excess renewable supply when direct supply is not sufficient.
            // Every DSR end use takes the same fraction of its heat from electricity, so methane and
            // hydrogen backed DSR share the available electricity.
        
            let DSR_elec = DSR_elec_full                                    // 1. provide all DSR heat demand with electricity
            if (DSR_elec>balance) DSR_elec = balance                        // 2. limited to available electricity balance
            if (DSR_elec<0) DSR_elec = 0                                    // 3. -- should never happen --
            let elec_fraction = DSR_elec_full>0 ? DSR_elec / DSR_elec_full : 0
            let DSR_CH4_gas = DSR_CH4_fuel_full * (1 - elec_fraction)        // 4. if there is not enough elec to meet demand, use gas
            let DSR_H2_gas = DSR_H2_fuel_full * (1 - elec_fraction)
            d.DSR.elec.push(DSR_elec)
            
            // ----------------------------------------------------------------------------------------------------------------------
            
            var industrial_elec_demand = 0;
            industrial_elec_demand += hourly_fixed_elec_demand
            industrial_elec_demand += DSR_elec
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
        
        // Final energy
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
        o.hydrogen.max_store_charge = 0
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
        o.methane.max_store_charge = 0
        o.methane.max_store_discharge = 0
        o.methane.min_SOC = i.methane.storage_capacity_GWh
        o.methane.store_empty_count = 0
        o.methane.store_full_count = 0
        o.methane.total_produced = 0
        o.methane.total_hydrogen_used = 0
        o.methane.total_demand = 0
        o.methane.store_excess = 0
        o.methane.unmet = 0
        o.methane.ccgt_methane_from_fossil_gas = 0
        // CO2 store for methanation, in tonnes. It starts at its target.
        o.methane.co2_store = i.methane.co2_store_target_t
        o.methane.co2_vented = 0

        // Synth fuel
        o.synth_fuel = {}
        o.synth_fuel.store_SOC = i.synth_fuel.store_start_GWh
        o.synth_fuel.store_max_SOC = 0
        o.synth_fuel.store_min_SOC = 1000000
        o.synth_fuel.total_demand = 0
        o.synth_fuel.unmet_demand = 0
        o.synth_fuel.total_produced = 0
        o.synth_fuel.total_biomass_used = 0
        o.synth_fuel.total_from_h2_store = 0
        o.synth_fuel.store_spill = 0
        o.synth_fuel.total_biofuel_supply = 0
        o.synth_fuel.backup_from_fossil_oil = 0
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
        o.electric_backup.total_ocgt_output = 0
        o.electric_backup.max_ocgt_output = 0
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
        let hourly_industrial_biofuel = (o.industry.total_synth_fuel_demand / o.years) / (365.25*24.0)
        
        let hourly_hydrogen_from_imports = i.hydrogen.hydrogen_from_imports * 1000.0 / (365.25*24.0)
        
        d.elecstore_SOC = []
        d.elec_store_charge = []
        d.elec_store_discharge = []
        d.electricity_for_electrolysis = []
        d.electricity_for_power_to_X = []

        d.electricity_from_dispatchable = []
        d.ocgt_output = []
        d.excess_elec = []
        d.unmet_elec = []
        d.methane_SOC = []
        d.synth_fuel_store_SOC = []
        d.co2_store = []

        let grid_loss_prc = 1.0-((i.energy_industry_use.electricity_grid_loss_prc + i.energy_industry_use.electricity_own_use_prc)*0.01)

        // Optimal store schedule, computed up front from the balance before the store. It is scheduled
        // on the balance without DSR electricity, with surplus up to the DSR limit valued at the methane
        // it saves against backup. Surplus in the next band, up to electrolysis capacity, is valued at the
        // backup output of the methane its hydrogen makes. DSR then takes the surplus left in each hour.
        let elec_store_schedule = null
        if (i.electric_storage.type=="optimal" && i.electric_storage.capacity_GWh>0) {
            let balance_for_store = d.balance_before_elec_store
            let backup_efficiency = i.electric_backup.methane_efficiency * 0.01 * grid_loss_prc
            let surplus_value = 0
            if (d.DSR.elec_full>0) {
                balance_for_store = balance_for_store.map((b, hour) => b + d.DSR.elec[hour])
                let fuel_saved = (d.DSR.CH4_fuel_full + d.DSR.H2_fuel_full) / d.DSR.elec_full
                surplus_value = Math.min(fuel_saved * backup_efficiency, 1) * i.electric_storage.backup_value
            }
            let electrolysis_value = i.hydrogen.electrolysis_efficiency * (889.0/1144.0) * backup_efficiency * i.electric_storage.backup_value
            if (d.DSR.elec_full>0) electrolysis_value = Math.min(electrolysis_value, surplus_value)
            elec_store_schedule = optimise_elec_store(balance_for_store, {
                capacity: i.electric_storage.capacity_GWh,
                soc_levels: i.electric_storage.soc_levels,
                charge_max: i.electric_storage.charge_capacity_GW,
                discharge_max: i.electric_storage.discharge_capacity_GW,
                charge_efficiency: i.electric_storage.charge_efficiency,
                discharge_efficiency: i.electric_storage.discharge_efficiency,
                backup_value: i.electric_storage.backup_value,
                peak_weight: i.electric_storage.peak_weight,
                charge_from_backup: i.electric_storage.charge_from_backup,
                backup_limit: i.electric_backup.capacity_limit,
                surplus_band: d.DSR.elec_full,
                surplus_value: surplus_value,
                electrolysis_band: i.hydrogen.electrolysis_capacity_GW,
                electrolysis_value: electrolysis_value,
                initial_soc: o.electric_storage.SOC_start
            })
            if (d.DSR.elec_full>0) {
                for (let hour = 0; hour < i.hours; hour++) {
                    let surplus = balance_for_store[hour] + elec_store_schedule.discharge[hour] - elec_store_schedule.charge[hour]
                    let DSR_elec = Math.min(Math.max(surplus, 0), d.DSR.elec_full)
                    let change = DSR_elec - d.DSR.elec[hour]
                    let fraction_change = change / d.DSR.elec_full
                    let CH4_change = -d.DSR.CH4_fuel_full * fraction_change
                    let H2_change = -d.DSR.H2_fuel_full * fraction_change
                    d.DSR.elec[hour] = DSR_elec
                    d.industrial_elec_demand[hour] += change
                    d.methane_for_industry[hour] += CH4_change
                    d.hydrogen_for_industry[hour] += H2_change
                    d.balance_before_elec_store[hour] = balance_for_store[hour] - DSR_elec
                    o.industry.total_elec_demand += change
                    o.industry.total_methane_demand += CH4_change
                    o.industry.total_hydrogen_demand += H2_change
                    o.industry.total_demand_check += change + CH4_change + H2_change
                }
            }
        }

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

            else if (elec_store_schedule) {
                elec_store_charge = elec_store_schedule.charge[hour]
                elec_store_discharge = elec_store_schedule.discharge[hour]

                let elec_store_charge_int = elec_store_charge*i.electric_storage.charge_efficiency
                let elec_store_discharge_int = elec_store_discharge/i.electric_storage.discharge_efficiency

                o.electric_storage.SOC += elec_store_charge_int - elec_store_discharge_int
                balance += elec_store_discharge - elec_store_charge
                o.total_losses.electric_storage += (elec_store_charge - elec_store_charge_int) + (elec_store_discharge_int - elec_store_discharge)
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
            // FT uses the hour's hydrogen surplus first. While the liquid store is below its target, FT tops up
            // from the hydrogen store above its minimum level, up to the target. Both are limited by FT capacity
            // and by the space left in the liquid store.
            let hydrogen_store_floor = i.hydrogen.storage_capacity_GWh*i.hydrogen.minimum_store_level
            let hourly_biomass_for_biofuel = 0.0
            let hydrogen_to_synth_fuel = 0.0
            let hydrogen_from_store_to_synth_fuel = 0.0
            let synth_fuel_space = (i.synth_fuel.store_capacity_GWh - o.synth_fuel.store_SOC) * i.synth_fuel.FT_process_hydrogen_req
            let ft_limit = Math.max(0.0, Math.min(i.synth_fuel.capacity_GW, synth_fuel_space))
            if ((o.hydrogen.SOC>hydrogen_store_floor) && hydrogen_balance>0.0) {
                hydrogen_to_synth_fuel = Math.min(hydrogen_balance, ft_limit)
            }
            if (o.synth_fuel.store_SOC<i.synth_fuel.store_target_GWh) {
                let shortfall = (i.synth_fuel.store_target_GWh - o.synth_fuel.store_SOC) * i.synth_fuel.FT_process_hydrogen_req
                // Store above the floor, less any same hour deficit already drawn from it
                let available = o.hydrogen.SOC + Math.min(hydrogen_balance - hydrogen_to_synth_fuel, 0.0) - hydrogen_store_floor
                hydrogen_from_store_to_synth_fuel = Math.max(0.0, Math.min(ft_limit - hydrogen_to_synth_fuel, shortfall, available))
                hydrogen_to_synth_fuel += hydrogen_from_store_to_synth_fuel
            }
            hourly_biomass_for_biofuel = (hydrogen_to_synth_fuel/i.synth_fuel.FT_process_hydrogen_req)*i.synth_fuel.FT_process_biomass_req
            hydrogen_balance -= hydrogen_to_synth_fuel
            o.synth_fuel.total_from_h2_store += hydrogen_from_store_to_synth_fuel

            // Production of synth fuel and losses
            let synth_fuel_produced_FT = hydrogen_to_synth_fuel / i.synth_fuel.FT_process_hydrogen_req
            o.synth_fuel.total_produced += synth_fuel_produced_FT
            o.synth_fuel.total_biomass_used += hourly_biomass_for_biofuel
            o.synth_fuel.store_SOC += synth_fuel_produced_FT
            o.total_losses.FT += (hydrogen_to_synth_fuel + hourly_biomass_for_biofuel) - (hydrogen_to_synth_fuel / i.synth_fuel.FT_process_hydrogen_req)         
            
            // Biofuel supply (e.g. road fuel blending), flat profile, counted as biomass used
            let biofuel_supply = i.synth_fuel.biofuel_supply_TWhy * 1000.0 / (365.25 * 24.0)
            o.synth_fuel.total_biofuel_supply += biofuel_supply
            o.synth_fuel.store_SOC += biofuel_supply
            
            // 4. Hydrogen to Methanation
            // CO2 from biogas goes to the CO2 store. Methanation uses the hour's hydrogen surplus left after FT
            // first. While the CO2 store is above its target, it tops up from the hydrogen store above its
            // minimum level, down to the target. Both are limited by methanation capacity and the CO2 held.
            // CO2 above the store capacity is vented. With no CO2 store, methanation uses the hour's CO2.
            let hydrogen_per_tCO2 = (8.064/44.009) * 39.4 * 0.001                                           // 1000 tCO2, requires 7.2 GWh of H2 (HHV)
            let co2_available = o.methane.co2_store + co2_from_biogas
            let methanation_limit = Math.min(i.methane.methanation_capacity, co2_available * hydrogen_per_tCO2)
            let hydrogen_for_sabatier = 0.0
            if ((o.hydrogen.SOC>hydrogen_store_floor) && hydrogen_balance>0.0) {
                hydrogen_for_sabatier = Math.min(hydrogen_balance, methanation_limit)
            }
            let co2_above_target = co2_available - hydrogen_for_sabatier / hydrogen_per_tCO2 - i.methane.co2_store_target_t
            if (co2_above_target>0.0) {
                // Store above the floor, less any same hour deficit already drawn from it (including FT)
                let available = o.hydrogen.SOC + Math.min(hydrogen_balance - hydrogen_for_sabatier, 0.0) - hydrogen_store_floor
                hydrogen_for_sabatier += Math.max(0.0, Math.min(methanation_limit - hydrogen_for_sabatier, co2_above_target * hydrogen_per_tCO2, available))
            }
            hydrogen_balance -= hydrogen_for_sabatier                                                    // subtract from hydrogen store
            o.methane.total_hydrogen_used += hydrogen_for_sabatier
            o.methane.co2_store = co2_available - hydrogen_for_sabatier / hydrogen_per_tCO2
            if (o.methane.co2_store>i.methane.co2_store_capacity_t) {
                o.methane.co2_vented += o.methane.co2_store - i.methane.co2_store_capacity_t
                o.methane.co2_store = i.methane.co2_store_capacity_t
            }
            d.co2_store.push(o.methane.co2_store)
            // Methanation process itself
            let methane_from_sabatier = hydrogen_for_sabatier * (889.0/1144.0)                               // 78% efficiency based on HHV kj/mol of CH4/4H2
            o.total_losses.sabatier += hydrogen_for_sabatier - methane_from_sabatier
            
            let hydrogen_SOC_before = o.hydrogen.SOC
            o.hydrogen.SOC += hydrogen_balance
            
            if (o.hydrogen.SOC<0.0) {
                o.hydrogen.unmet_demand += -1*o.hydrogen.SOC
                o.hydrogen.SOC = 0.0
            }
            
            // Largest hourly flow into the store sizes the compressor
            if (o.hydrogen.SOC-hydrogen_SOC_before>o.hydrogen.max_store_charge) o.hydrogen.max_store_charge = o.hydrogen.SOC-hydrogen_SOC_before
            
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
            let ccgt_output = 0
            let ocgt_output = 0
            let synth_fuel_turbine_output = 0
            let biomass_turbine_output = 0
            let coal_turbine_output = 0
            let electricity_from_dispatchable = 0
            let electricity_from_dispatchable_before_grid_loss = 0
            let imports_dispatched = 0
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
                
                // Interconnector imports meet a share of the requirement, limited by interconnector capacity
                imports_dispatched = backup_requirement_before_grid_loss * i.electric_backup.prc_imports * 0.01
                if (imports_dispatched>i.supply.interconnector_capacity_GW) imports_dispatched = i.supply.interconnector_capacity_GW
                o.supply.total_imports += imports_dispatched
                backup_requirement_before_grid_loss -= imports_dispatched
                
                // Allocate to different technologies
                hydrogen_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_hydrogen * 0.01)
                methane_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_methane * 0.01)
                synth_fuel_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_synth_fuel * 0.01)
                biomass_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_biomass * 0.01)
                coal_turbine_output = backup_requirement_before_grid_loss * (i.electric_backup.prc_coal * 0.01)

                // Methane backup: CCGT runs first up to its capacity (after grid loss) and OCGT meets the rest
                ccgt_output = Math.min(methane_turbine_output, i.electric_backup.ccgt_capacity_GW / grid_loss_prc)
                ocgt_output = methane_turbine_output - ccgt_output

                // Limit by hydrogen availability (only available from H2 store)
          
              if (hydrogen_turbine_output>(o.hydrogen.SOC*i.electric_backup.hydrogen_efficiency*0.01)) {
                    hydrogen_turbine_output = o.hydrogen.SOC*i.electric_backup.hydrogen_efficiency*0.01
                }
                
                // If methane and synth fuels are from stores only, limit by availability
                if (!i.fossil_fuels.allow_use_for_backup) {
                    // Limit by methane availability, cutting OCGT first
                    let ccgt_fuel = ccgt_output / (i.electric_backup.methane_efficiency*0.01)
                    if (ccgt_fuel + ocgt_output / (i.electric_backup.ocgt_efficiency*0.01) > o.methane.SOC) {
                        if (ccgt_fuel > o.methane.SOC) {
                            ccgt_output = o.methane.SOC*i.electric_backup.methane_efficiency*0.01
                            ocgt_output = 0
                        } else {
                            ocgt_output = (o.methane.SOC - ccgt_fuel)*i.electric_backup.ocgt_efficiency*0.01
                        }
                        methane_turbine_output = ccgt_output + ocgt_output
                    }
                    // Limit by synth fuel availability
                    if (synth_fuel_turbine_output>(o.synth_fuel.store_SOC*i.electric_backup.synth_fuel_efficiency*0.01)) {
                        synth_fuel_turbine_output = o.synth_fuel.store_SOC*i.electric_backup.synth_fuel_efficiency*0.01
                    }
                }

                // Totals
                o.electric_backup.total_hydrogen_turbine_output += hydrogen_turbine_output
                o.electric_backup.total_methane_turbine_output += methane_turbine_output
                o.electric_backup.total_ocgt_output += ocgt_output
                if (ocgt_output * grid_loss_prc > o.electric_backup.max_ocgt_output) o.electric_backup.max_ocgt_output = ocgt_output * grid_loss_prc
                o.electric_backup.total_synth_fuel_turbine_output += synth_fuel_turbine_output 
                o.electric_backup.total_biomass_turbine_output += biomass_turbine_output
                o.electric_backup.total_coal_turbine_output += coal_turbine_output 
                                
                // Log maximum dispatchable capacity requirement and time (excluding imports)
                let generation_requirement = backup_requirement - imports_dispatched * grid_loss_prc
                if (generation_requirement>o.electric_backup.max_capacity_requirement) {
                    o.electric_backup.max_capacity_requirement = generation_requirement
                    o.electric_backup.max_capacity_requirement_hour = hour
                }
                
                electricity_from_dispatchable_before_grid_loss = hydrogen_turbine_output + methane_turbine_output + synth_fuel_turbine_output + biomass_turbine_output + coal_turbine_output
                o.electric_backup.total_before_grid_loss += electricity_from_dispatchable_before_grid_loss
                electricity_from_dispatchable = (electricity_from_dispatchable_before_grid_loss + imports_dispatched) * grid_loss_prc
                o.total_losses.grid += electricity_from_dispatchable_before_grid_loss + imports_dispatched - electricity_from_dispatchable
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
            
            let methane_to_dispatchable = ccgt_output / (i.electric_backup.methane_efficiency*0.01) + ocgt_output / (i.electric_backup.ocgt_efficiency*0.01)
            d.ocgt_output.push(ocgt_output)
            
            if (i.fossil_fuels.allow_use_for_backup) {
                if (methane_to_dispatchable>o.methane.SOC) {
                    o.methane.ccgt_methane_from_fossil_gas += methane_to_dispatchable - o.methane.SOC
                }
            }
            
            let methane_demand = methane_to_dispatchable + d.heating_systems.methane.fuel_demand[hour] + d.methane_for_industry[hour] + d.lac_demand_gas[hour]
            o.methane.total_demand += methane_demand
            
            let methane_balance = methane_production - methane_demand
                    
            let methane_SOC_before = o.methane.SOC
            o.methane.SOC += methane_balance
            if (o.methane.SOC>i.methane.storage_capacity_GWh) {
                o.methane.store_excess += o.methane.SOC - i.methane.storage_capacity_GWh
                o.methane.SOC = i.methane.storage_capacity_GWh
            }
            
            if (o.methane.SOC<0) {
                o.methane.unmet += -1*o.methane.SOC
                o.methane.SOC = 0
            }
            
            // Largest hourly flows in and out size the store's injection and withdrawal plant
            let methane_store_flow = o.methane.SOC - methane_SOC_before
            if (methane_store_flow>o.methane.max_store_charge) o.methane.max_store_charge = methane_store_flow
            if (-methane_store_flow>o.methane.max_store_discharge) o.methane.max_store_discharge = -methane_store_flow
            
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
                // Backup share of the unmet demand, met by fossil oil if allowed
                if (i.fossil_fuels.allow_use_for_backup && synth_fuel_demand>0) {
                    o.synth_fuel.backup_from_fossil_oil += -1*o.synth_fuel.store_SOC * (synth_fuel_for_dispatchable / synth_fuel_demand)
                }
                o.synth_fuel.store_SOC = 0.0
            }
            // Biofuel supply and power to liquids can overfill the store, the excess is spilt
            if (o.synth_fuel.store_SOC>i.synth_fuel.store_capacity_GWh) {
                o.synth_fuel.store_spill += o.synth_fuel.store_SOC - i.synth_fuel.store_capacity_GWh
                o.synth_fuel.store_SOC = i.synth_fuel.store_capacity_GWh
            }
            d.synth_fuel_store_SOC.push(o.synth_fuel.store_SOC)
            
            if (o.synth_fuel.store_min_SOC>o.synth_fuel.store_SOC) o.synth_fuel.store_min_SOC = o.synth_fuel.store_SOC
            if (o.synth_fuel.store_max_SOC<o.synth_fuel.store_SOC) o.synth_fuel.store_max_SOC = o.synth_fuel.store_SOC
            
            // Biomass
            o.biomass.total_used += biogas_supply / i.biogas.anaerobic_digestion_efficiency 
            o.biomass.total_used += hourly_biomass_for_biofuel
            o.biomass.total_used += biofuel_supply
            
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
        o.total_losses.elec_backup += ((1.0/(i.electric_backup.methane_efficiency*0.01))-1.0) * (o.electric_backup.total_methane_turbine_output - o.electric_backup.total_ocgt_output)
        o.total_losses.elec_backup += ((1.0/(i.electric_backup.ocgt_efficiency*0.01))-1.0) * o.electric_backup.total_ocgt_output
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
             o.fossil_fuels.oil_from_store = o.synth_fuel.unmet_demand
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
         
         o.fossil_fuels.refineries_gas_use = (o.fossil_fuels.oil) * i.energy_industry_use.refineries_gas_prc * 0.01;
         o.fossil_fuels.refineries_oil_use = (o.fossil_fuels.oil) * i.energy_industry_use.refineries_oil_prc * 0.01;
         o.fossil_fuels.oil_gas_extraction_gas_use = (o.fossil_fuels.oil + o.fossil_fuels.gas) * i.energy_industry_use.oil_gas_extraction_gas_prc * 0.01;
         o.fossil_fuels.oil_gas_extraction_oil_use = (o.fossil_fuels.oil + o.fossil_fuels.gas) * i.energy_industry_use.oil_gas_extraction_oil_prc * 0.01;
         o.fossil_fuels.gas_losses = (o.fossil_fuels.gas) * i.energy_industry_use.gas_losses_prc * 0.01;
         
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
         o.fossil_fuels.gas += i.fossil_fuels.other_gas_use * o.TWhy_to_GWh
         o.fossil_fuels.oil += i.fossil_fuels.other_oil_use * o.TWhy_to_GWh
         o.fossil_fuels.coal += i.fossil_fuels.other_coal_use * o.TWhy_to_GWh
         // Coal and coke used in blast furnaces and coke ovens, transformation and energy industry use in DUKES
         o.fossil_fuels.blast_furnace = i.industry.blast_furnace_coal_TWhy * o.TWhy_to_GWh
         o.fossil_fuels.coal += o.fossil_fuels.blast_furnace
         o.energy_industry_use.total += o.fossil_fuels.blast_furnace
         // Add to energy_industry_use total
         o.energy_industry_use.total += i.fossil_fuels.other_gas_use * o.TWhy_to_GWh
         o.energy_industry_use.total += i.fossil_fuels.other_oil_use * o.TWhy_to_GWh
         o.energy_industry_use.total += i.fossil_fuels.other_coal_use * o.TWhy_to_GWh
           
         o.fossil_fuels.gas += o.fossil_fuels.gas_losses
         
         o.fossil_fuels.total = o.fossil_fuels.oil + o.fossil_fuels.gas + o.fossil_fuels.coal
                  
    },
    
    final: function() {
        o.electric_storage.kwh_per_household = (i.electric_storage.capacity_GWh * 1000 * 1000) / i.households_2030;
        o.electric_storage.cycles_per_year = (o.electric_storage.total_discharge / i.electric_storage.capacity_GWh)*o.per_year
        
        // -------------------------------------------------------------------------------
        // Total electricity generation before grid losses: fixed supply, imports and backup
        o.supply.total_electricity_before_grid_loss = o.supply.total_fixed_electricity + o.supply.total_imports + o.electric_backup.total_before_grid_loss
        o.balance.total_electricity_demand = o.supply.total_electricity_before_grid_loss - o.balance.total_excess_elec + o.balance.total_unmet_elec // - o.total_losses.grid

        
        o.biomass.total_used += o.industry.total_biomass_demand
        
        o.balance.total_unmet_demand = o.balance.total_unmet_elec
        
        o.balance.total_supply = o.supply.total_fixed_electricity + o.supply.total_imports + o.supply.total_fixed_heat + o.biomass.total_used + o.fossil_fuels.total + o.hydrogen.total_from_imports
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
        
        o.balance.total_spill = o.methane.store_excess + o.heat.total_spill + o.synth_fuel.store_spill
        
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
        
        o.biomass.total_direct_use = o.biomass.total_used - (i.biogas.biomass_for_biogas*o.TWhy_to_GWh) - o.synth_fuel.total_biomass_used - o.synth_fuel.total_biofuel_supply
        
        if (i.hydrogen.electrolysis_capacity_GW>0) {
            o.hydrogen.electrolysis_capacity_factor = 100*(o.hydrogen.total_electricity_for_electrolysis / (i.hydrogen.electrolysis_capacity_GW * i.hours))
        } else {
            o.hydrogen.electrolysis_capacity_factor = 0
        }
        
        if (i.power_to_X.capacity>0) {
            o.power_to_X.capacity_factor = 100*(o.power_to_X.total_electricity_demand / (i.power_to_X.capacity * i.hours))
        } else {
            o.power_to_X.capacity_factor = 0
        }
        
        // Peak end use demand grossed up for grid losses and own use, comparable with the
        // DUKES 5.10 simultaneous maximum load met. Storage charging, electrolysis and power to X are left out.
        let grid_loss_prc = 1.0-((i.energy_industry_use.electricity_grid_loss_prc + i.energy_industry_use.electricity_own_use_prc)*0.01)
        o.balance.max_electricity_demand = 0

        var out = "";
        var error = 0
        for (var hour = 0; hour < i.hours; hour++) {

            let supply = d.elec_supply_hourly[hour]
            let end_use = d.lac_demand[hour] + d.spacewater_elec[hour] + d.industrial_elec_demand[hour] + d.EL_transport[hour]
            if (end_use / grid_loss_prc > o.balance.max_electricity_demand) o.balance.max_electricity_demand = end_use / grid_loss_prc
            let demand = end_use + d.electricity_for_electrolysis[hour] + d.elec_store_charge[hour] + d.electricity_for_power_to_X[hour]
            let balance = (supply + d.unmet_elec[hour] + d.electricity_from_dispatchable[hour] + d.elec_store_discharge[hour]) + d.EV_smart_discharge[hour] - demand-d.excess_elec[hour]
            error += Math.abs(balance)
        } 
        
        console.log("balance error: "+error.toFixed(12));
        
        var datastarttime = (32*365.25*24 + i.start_hour)*3600*1000;

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
    
    // ----------------------------------------------------------------------------
    // Final consumption by sector and fuel, on the DUKES 1.1 basis: energy delivered
    // to end users, including ambient and solar heat. Heating systems share their
    // fuel between sectors in proportion to each sector's space and water heat.
    // Units are GWh over the 10 year dataset, as elsewhere.
    // ----------------------------------------------------------------------------
    final_consumption: function() {

        let fuels = ["electricity", "gas", "liquid", "coal", "bioenergy", "hydrogen", "renewable_heat"]
        let sectors = ["domestic", "services", "industry", "transport"]
        let fc = {}
        for (let s of sectors) {
            fc[s] = {}
            for (let f of fuels) fc[s][f] = 0
        }

        let space_total = o.space_heating.total_demand
        let space_share = {
            domestic: space_total > 0 ? o.space_heating.total_domestic_demand / space_total : 0,
            services: space_total > 0 ? o.space_heating.total_services_demand / space_total : 0,
            industry: space_total > 0 ? o.space_heating.total_industry_demand / space_total : 0
        }
        let water_total = i.water_heating.domestic_TWhy + i.water_heating.services_TWhy
        let water_share = {
            domestic: water_total > 0 ? i.water_heating.domestic_TWhy / water_total : 0,
            services: water_total > 0 ? i.water_heating.services_TWhy / water_total : 0,
            industry: 0
        }
        let heat_total = space_total + o.water_heating.total_demand

        let system_fuel = { heatpump: "electricity", elres: "electricity", methane: "gas", hydrogen: "hydrogen",
                            synthfuel: "liquid", biomass: "bioenergy", solid_fuel: "coal" }

        for (let s of ["domestic", "services", "industry"]) {
            for (let z in i.heating_systems) {
                let hs = o.heating_systems[z]
                let space_fuel = hs.fuel_demand - hs.water_fuel_demand
                let fuel = space_fuel * space_share[s] + hs.water_fuel_demand * water_share[s]
                fc[s][system_fuel[z]] += fuel
                if (z == "heatpump") {
                    let space_heat = hs.heat_demand - hs.water_heat_demand
                    fc[s].renewable_heat += (space_heat * space_share[s] + hs.water_heat_demand * water_share[s]) - fuel
                }
            }
            // Solar thermal displaces space and water heat in proportion to each
            let sector_heat = space_total * space_share[s] + o.water_heating.total_demand * water_share[s]
            if (heat_total > 0) fc[s].renewable_heat += o.supply.total_fixed_heat * sector_heat / heat_total
        }

        // Lighting, appliances and cooking, split by the annual inputs
        let lac_elec = {
            domestic: i.LAC.domestic.lighting_and_appliances_TWhy + i.LAC.domestic.cooking_TWhy,
            services: i.LAC.services.lighting_and_appliances_TWhy + i.LAC.services.catering_TWhy + i.LAC.services.cooling_TWhy
        }
        let lac_gas = {
            domestic: i.LAC.domestic.cooking_gas_TWhy,
            services: i.LAC.services.lighting_and_appliances_gas_TWhy + i.LAC.services.catering_gas_TWhy + i.LAC.services.cooling_gas_TWhy
        }
        let lac_elec_total = lac_elec.domestic + lac_elec.services
        let lac_gas_total = lac_gas.domestic + lac_gas.services
        for (let s of ["domestic", "services"]) {
            if (lac_elec_total > 0) fc[s].electricity += o.LAC.total * lac_elec[s] / lac_elec_total
            if (lac_gas_total > 0) fc[s].gas += o.LAC.total_gas * lac_gas[s] / lac_gas_total
        }

        // Refinery electricity is energy industry use in DUKES. The fossil_fuels other use
        // inputs are the ECUK industry "unknown (other)" row.
        fc.industry.electricity += o.industry.total_elec_demand - i.industry.refinery_electric_TWhy * o.TWhy_to_GWh
        fc.industry.gas += o.industry.total_methane_demand + i.fossil_fuels.other_gas_use * o.TWhy_to_GWh
        fc.industry.liquid += o.industry.total_synth_fuel_demand + i.fossil_fuels.other_oil_use * o.TWhy_to_GWh
        fc.industry.coal += o.industry.total_coal_demand + i.fossil_fuels.other_coal_use * o.TWhy_to_GWh
        fc.industry.bioenergy += o.industry.total_biomass_demand
        fc.industry.hydrogen += o.industry.total_hydrogen_demand

        fc.transport.electricity += o.electric_transport.total_EV_charge + o.electric_transport.total_elec_trains_demand
        fc.transport.liquid += o.synth_fuel.total_transport_demand - i.transport.international_shipping_TWhy * o.TWhy_to_GWh
        fc.transport.hydrogen += o.hydrogen.total_vehicle_demand

        fc.total = 0
        for (let f of fuels) fc[f] = 0
        for (let s of sectors) {
            fc[s].total = 0
            for (let f of fuels) {
                fc[s].total += fc[s][f]
                fc[f] += fc[s][f]
            }
            fc.total += fc[s].total
        }
        fc.international_shipping = i.transport.international_shipping_TWhy * o.TWhy_to_GWh
        o.final_consumption = fc
    },

    land_use: function() {
        o.land_use = {}
        
        // Work backwards to land areas
        o.biomass.grass_for_biogas = i.biogas.biomass_for_biogas - 34.15
        if (o.biomass.grass_for_biogas<0.0) o.biomass.grass_for_biogas = 0.0

        o.land_use.rotational_grass_ryegrass = o.biomass.grass_for_biogas / (10.5 * 0.001 * 0.95 * 4.72)
        o.land_use.perrennial_grass_miscanthus = (o.synth_fuel.total_biomass_used * o.GWh_to_TWhy) / (15.0 * 0.001 * 0.95 * 4.72)

        // Work forwards to TWh
        let short_rotation_forestry_harvestable_modtyr = ((i.land_use.short_rotation_forestry * 5.08 * 0.001)/(44/12))/0.5
        let short_rotation_forestry_TWh = short_rotation_forestry_harvestable_modtyr * 0.65 * 4.72
        
        // Only the share of direct use biomass grown on UK energy crops needs land.
        // Imports, wastes and residues make up the rest.
        let biomass_demand_for_heat_TWh = o.biomass.total_direct_use * o.GWh_to_TWhy * i.land_model.uk_crop_biomass_prc * 0.01
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
        
        o.land_use.available = i.land_model.uk_area_kha - o.land_use.total
        
        o.land_use.total_prc = o.land_use.total / i.land_model.uk_area_kha
        
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
            landfill: i.land_model.landfill_biochar_MtCO2
        }
        var total = 0
        for (var z in o.carbon_sequestration.biochar) { 
            total +=  o.carbon_sequestration.biochar[z]
        }
        o.carbon_sequestration.biochar.total = total
        
        // Carbon sequestration: growth of existing woodland, kha times tCO2/ha gives ktCO2
        let existing_woodland = i.land_use.existing_natural_broadleaf_woodland + i.land_use.existing_natural_coniferous_woodland
            + i.land_use.existing_productive_broadleaf_woodland + i.land_use.existing_productive_coniferous_woodland
        o.carbon_sequestration.existing_woodland = existing_woodland * i.land_model.existing_woodland_tCO2_per_ha * 0.001

        o.carbon_sequestration.total = o.carbon_sequestration.reforestation.total + o.carbon_sequestration.timber_products.total + o.carbon_sequestration.biochar.total + o.carbon_sequestration.existing_woodland
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
        // Energy quantities are in GWh over the run, so o.per_year gives one year. CO2 factors are
        // kgCO2 per kWh (gross), so a further 0.001 gives MtCO2 per GWh.
        // Coal backup may include other thermal generation (e.g. waste), with its own CO2 factor.
        let f = {}
        for (let z in i.co2_factors) f[z] = i.co2_factors[z] * 0.001
        let coal_backup_co2_factor = i.electric_backup.coal_co2_factor * 0.001
        o.emissions_balance.fossil_fuel_coal = (o.fossil_fuels.coal - o.fossil_fuels.coal_for_dispatchable - o.fossil_fuels.blast_furnace)*o.per_year*f.coal
        o.emissions_balance.fossil_fuel_coal += o.fossil_fuels.coal_for_dispatchable*o.per_year*coal_backup_co2_factor
        o.emissions_balance.blast_furnace = o.fossil_fuels.blast_furnace*o.per_year*f.blast_furnace
        o.emissions_balance.fossil_fuel_coal += o.emissions_balance.blast_furnace
        o.emissions_balance.fossil_fuel_gas = o.fossil_fuels.gas*o.per_year*f.gas

        // Fossil oil from the liquid fuel store is shared between its uses by their demand. Backup
        // generation is tracked hourly, the other uses take the average fossil share of the rest.
        let aviation = o.transport.modes.Aviation.IC.TWh * o.TWhy_to_GWh
        let shipping = i.transport.international_shipping_TWhy * o.TWhy_to_GWh
        let heating = o.heating_systems.synthfuel.fuel_demand
        let backup = o.synth_fuel.total_demand - o.synth_fuel.total_transport_demand - o.synth_fuel.total_industrial_demand - heating
        let other_demand = o.synth_fuel.total_demand - backup
        let fossil_share = other_demand > 0 ? (o.fossil_fuels.oil_from_store - o.synth_fuel.backup_from_fossil_oil) / other_demand : 0
        o.emissions_balance.oil_by_use = {
            road_rail_shipping: (o.synth_fuel.total_transport_demand - aviation - shipping) * fossil_share * o.per_year * f.road_fuel,
            aviation: aviation * fossil_share * o.per_year * f.aviation,
            international_shipping: shipping * fossil_share * o.per_year * f.marine,
            heating: heating * fossil_share * o.per_year * f.heating_oil,
            industry: (o.synth_fuel.total_industrial_demand * fossil_share + i.fossil_fuels.other_oil_use * o.TWhy_to_GWh) * o.per_year * f.gas_oil,
            power: o.synth_fuel.backup_from_fossil_oil * o.per_year * f.fuel_oil,
            energy_industry: (o.fossil_fuels.refineries_oil_use * f.refinery + o.fossil_fuels.oil_gas_extraction_oil_use * f.gas_oil) * o.per_year
        }
        o.emissions_balance.fossil_fuel_oil = 0
        for (let z in o.emissions_balance.oil_by_use) o.emissions_balance.fossil_fuel_oil += o.emissions_balance.oil_by_use[z]

        let grid_co2_emissions = 0;
        grid_co2_emissions += o.methane.ccgt_methane_from_fossil_gas*f.gas
        grid_co2_emissions += o.fossil_fuels.coal_for_dispatchable*coal_backup_co2_factor
        grid_co2_emissions += o.synth_fuel.backup_from_fossil_oil*f.fuel_oil
        o.grid_co2_emissions = grid_co2_emissions*o.per_year   // MtCO2/yr

        o.emissions_balance.grid_co2_intensity = 1000000 * (grid_co2_emissions / o.balance.total_electricity_demand)   // MtC02 / GWh
        
        o.emissions_balance.reforestation = -o.carbon_sequestration.reforestation.total
        o.emissions_balance.existing_woodland = -o.carbon_sequestration.existing_woodland
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
        o.emissions_balance.total += o.emissions_balance.existing_woodland
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
        elec_store_cycles_per_year = (total_elec_store_charge*o.per_year) / i.electric_storage.capacity_GWh
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
        
        o.EE.prc_of_industry_demand = 100 * o.EE.total / (o.industry.total_demand_check * o.GWh_to_TWhy)
    },
    // Hourly marginal electricity price in £/MWh, from what is at the margin in each hour, valued
    // with the fuel values in i.fuel_values. The classes follow PyPSA's price conditions, and
    // scripts/price_check.py in ZCB_PyPSA compares them with PyPSA's prices at equal capacities.
    hourly_prices: function() {
        let fv = i.fuel_values
        let eb = i.electric_backup
        let glf = 1.0-((i.energy_industry_use.electricity_grid_loss_prc + i.energy_industry_use.electricity_own_use_prc)*0.01)
        let turbine_price = (efficiency, tech) => (fv.methane_gbp_MWh / (efficiency*0.01) + i.costs[tech].variable_om) / glf
        let ccgt_price = turbine_price(eb.methane_efficiency, 'CCGT')
        let ocgt_price = turbine_price(eb.ocgt_efficiency, 'OCGT')
        let electrolysis_price = i.hydrogen.electrolysis_efficiency * fv.hydrogen_gbp_MWh
        let round_trip = i.electric_storage.charge_efficiency * i.electric_storage.discharge_efficiency

        // Scarcity adder. Hours within 10% of peak backup carry the annual cost of the peak turbine
        // class, per MW of de-rated capacity over the run, in proportion to their depth.
        let peak_tech = o.electric_backup.max_ocgt_output > 0 ? 'OCGT' : 'CCGT'
        let derating = peak_tech == 'OCGT' ? eb.ocgt_derating_factor : eb.ccgt_derating_factor
        let peak_cost = annual_fixed_cost(i.costs[peak_tech], i.annualisation) * 1000 * o.years / derating
        let threshold = 0.9 * o.electric_backup.max_capacity_requirement
        let depth_total = 0
        for (let hour = 0; hour < i.hours; hour++) depth_total += Math.max(d.electricity_from_dispatchable[hour] - threshold, 0)

        let price = new Array(i.hours)
        let cls = new Array(i.hours)
        for (let hour = 0; hour < i.hours; hour++) {
            // Backup below 0.5 GW is a remainder beside the battery, which is then at the margin
            if (d.electricity_from_dispatchable[hour] > 0.5) {
                cls[hour] = 'backup'
                price[hour] = d.ocgt_output[hour] > 1e-6 ? ocgt_price : ccgt_price
                let depth = d.electricity_from_dispatchable[hour] - threshold
                if (depth > 0) price[hour] += peak_cost * depth / depth_total
            } else if (d.excess_elec[hour] > 1e-6) {
                cls[hour] = 'curtail'
                price[hour] = 0
            } else if (d.electricity_for_electrolysis[hour] > 1e-6) {
                cls[hour] = 'electrolysis'
                price[hour] = electrolysis_price
            } else if (d.elec_store_charge[hour] > 1e-6) {
                cls[hour] = 'battery_charge'
            } else {
                cls[hour] = 'battery_discharge'
            }
        }
        // The battery is at the margin in the remaining hours. Stored energy is worth the price of
        // the next hour that sets one, so charging pays that less the round trip loss, and
        // discharging earns it. Charging at the end of the run has no later hour, so it uses CCGT.
        let next = ccgt_price
        for (let hour = i.hours - 1; hour >= 0; hour--) {
            if (cls[hour] == 'battery_charge') price[hour] = next * round_trip
            else if (cls[hour] == 'battery_discharge') price[hour] = next
            else next = cls[hour] == 'backup' ? price[hour] : price[hour] / round_trip
        }
        d.electricity_price = price

        // Revenue and fuel sales, £bn/yr. GWh over the run times £/MWh times 1e-6 gives £bn.
        let p = o.prices = { hours: {}, mean: {} }
        let revenue = 0, end_use_total = 0, offshore = 0, sum = 0, electrolysis_power = 0, ptx_power = 0
        let offshore_gw = i.supply.offshore_wind_capacity * i.supply.offshore_wind_availability * glf
        for (let z of ['backup', 'curtail', 'electrolysis', 'battery_charge', 'battery_discharge']) p.hours[z] = 0
        let class_sum = {}
        for (let hour = 0; hour < i.hours; hour++) {
            let end_use = d.lac_demand[hour] + d.spacewater_elec[hour] + d.industrial_elec_demand[hour] + d.EL_transport[hour]
            revenue += end_use * price[hour]
            end_use_total += end_use
            offshore += offshore_gw * capacityfactors_all[hour][1] * price[hour]
            electrolysis_power += d.electricity_for_electrolysis[hour] * price[hour]
            ptx_power += d.electricity_for_power_to_X[hour] * price[hour]
            sum += price[hour]
            p.hours[cls[hour]]++
            class_sum[cls[hour]] = (class_sum[cls[hour]] || 0) + price[hour]
        }
        for (let z in p.hours) {
            p.mean[z] = p.hours[z] > 0 ? class_sum[z] / p.hours[z] : 0
            p.hours[z] = 100 * p.hours[z] / i.hours
        }
        p.mean_gbp_MWh = sum / i.hours
        p.end_use_weighted_gbp_MWh = end_use_total > 0 ? revenue / end_use_total : 0
        p.end_use_TWh = end_use_total * o.GWh_to_TWhy
        p.electricity_revenue = revenue * 1e-6 * o.per_year
        p.offshore_revenue = offshore * 1e-6 * o.per_year
        // Recovery is against the selected generation costs: strike prices or the build-up
        let offshore_cost = o.generation_costs.by_tech.offshore_wind.annual
        p.offshore_recovery = offshore_cost > 0 ? p.offshore_revenue / offshore_cost : 0

        // Average production cost per MWh, with electricity at the hourly price. Hydrogen covers its
        // plant, stores and electricity. Methane and synthetic fuel use hydrogen at that cost. Costs
        // are shared over all fuel produced, so turbine methane stays with electricity users.
        let plant = (names) => names.reduce((total, name) => total + o.costs[name].annual, 0)
        let sf = i.synth_fuel
        let ptx = i.power_to_X
        let ft = o.costs['FT synthetic fuel']
        let per_MWh = (annual, TWh) => TWh > 0 ? 1000 * annual / TWh : 0
        let hydrogen_TWh = o.hydrogen.total_produced * o.GWh_to_TWhy
        let hydrogen_cost = per_MWh(plant(['H2 Electrolysis', 'Hydrogen storage', 'Hydrogen compressor']) + electrolysis_power * 1e-6 * o.per_year, hydrogen_TWh)
        let methanation_hydrogen_TWh = o.methane.total_hydrogen_used * o.GWh_to_TWhy
        let ft_hydrogen_TWh = (o.hydrogen.total_demand - o.hydrogen.total_vehicle_demand - o.methane.total_hydrogen_used) * o.GWh_to_TWhy
        // Power to X is shared between methane and liquid fuel by output
        let ptx_annual = plant(['Power to X']) + ptx_power * 1e-6 * o.per_year
        let ptx_output = ptx.prc_gas * ptx.gas_efficiency + ptx.prc_liquid * ptx.liquid_efficiency
        let ptx_methane_annual = ptx_output > 0 ? ptx_annual * ptx.prc_gas * ptx.gas_efficiency / ptx_output : 0
        let methane_annual = plant(['Anaerobic digestion', 'Methanation', 'Methane storage', 'CO2 storage', 'Methane store charging', 'Methane store discharging'])
            + o.biogas_feedstock_annual + methanation_hydrogen_TWh * hydrogen_cost * 0.001 + ptx_methane_annual
        let synthetic_annual = plant(['FT synthetic fuel', 'Synthetic fuel storage']) + o.ft_biomass_annual
            + ft_hydrogen_TWh * hydrogen_cost * 0.001 + ptx_annual - ptx_methane_annual
        let costs = {
            hydrogen: hydrogen_cost,
            methane: per_MWh(methane_annual, o.methane.total_produced * o.GWh_to_TWhy),
            synthetic_fuel: per_MWh(synthetic_annual, ft.generation)
        }
        // Marginal values, for the recovery check at marginal prices. Synthetic fuel is its hydrogen
        // and biomass at their values plus the FT plant cost per MWh.
        let ft_plant = per_MWh(ft.annual, ft.generation)
        let values = {
            hydrogen: fv.hydrogen_gbp_MWh,
            methane: fv.methane_gbp_MWh,
            synthetic_fuel: ft.generation > 0 ? sf.FT_process_hydrogen_req * fv.hydrogen_gbp_MWh + sf.FT_process_biomass_req * sf.biomass_gbp_MWh + ft_plant : 0
        }
        p.fuel = {
            hydrogen: { TWh: (o.hydrogen.total_vehicle_demand + o.hydrogen.total_industry_demand + o.heating_systems.hydrogen.fuel_demand) * o.GWh_to_TWhy },
            methane: { TWh: (o.industry.total_methane_demand + o.heating_systems.methane.fuel_demand + o.LAC.total_gas) * o.GWh_to_TWhy },
            synthetic_fuel: { TWh: (o.synth_fuel.total_transport_demand + o.synth_fuel.total_industrial_demand + o.heating_systems.synthfuel.fuel_demand) * o.GWh_to_TWhy }
        }
        // Baselines burn fossil fuel. Their fuel values are zero and fuel users pay nothing here.
        let fuel_users_pay = fv.methane_gbp_MWh > 0
        p.fuel_sales = 0
        p.fuel_value_sales = 0
        for (let z in p.fuel) {
            p.fuel[z].value_gbp_MWh = values[z]
            p.fuel[z].gbp_MWh = fuel_users_pay ? costs[z] : 0
            p.fuel[z].annual = p.fuel[z].TWh * p.fuel[z].gbp_MWh * 0.001
            p.fuel_sales += p.fuel[z].annual
            p.fuel_value_sales += p.fuel[z].TWh * values[z] * 0.001
        }
        // 2024 fuel prices before tax per litre, at the diesel energy density
        let kWh_per_litre = i.retail.road_fuel.diesel_kWh_per_litre
        p.jet_fuel_p_litre = fv.jet_fuel_gbp_MWh * 0.1 * kWh_per_litre
        p.marine_gas_oil_p_litre = fv.marine_gas_oil_gbp_MWh * 0.1 * kWh_per_litre
        p.recovery = o.generation_costs.total_annual > 0 ? (p.electricity_revenue + p.fuel_value_sales) / o.generation_costs.total_annual : 0

        // Fuel users pay production cost, which includes the electricity used to make the fuel.
        // Electricity users pay the rest of the generation cost.
        o.generation_costs.fuel_users_annual = p.fuel_sales
        o.generation_costs.electricity_annual = o.generation_costs.total_annual - o.generation_costs.fuel_users_annual
        // Electricity users' payment above hourly revenue
        p.bill_top_up = o.generation_costs.electricity_annual - p.electricity_revenue
    },
    cost_model: function() {

        // Generation is in GWh over the run, o.GWh_to_TWhy converts to TWh/yr
        o.costs = {}

        o.costs['Onshore wind'] = { capacity: i.supply.onshore_wind_capacity, generation: o.supply.total_onshore_wind*o.GWh_to_TWhy }
        o.costs['Offshore wind'] = { capacity: i.supply.offshore_wind_capacity, generation: o.supply.total_offshore_wind*o.GWh_to_TWhy }
        o.costs['Solar PV'] = { capacity: i.supply.solarpv_capacity, generation: o.supply.total_solarpv*o.GWh_to_TWhy }
        o.costs['Tidal'] = { capacity: i.supply.tidal_capacity, generation: o.supply.total_tidal*o.GWh_to_TWhy }
        o.costs['Wave'] = { capacity: i.supply.wave_capacity, generation: o.supply.total_wave*o.GWh_to_TWhy }
        o.costs['Geothermal Electric'] = { capacity: i.supply.geothermal_elec_capacity, generation: o.supply.total_geothermal_elec*o.GWh_to_TWhy }
        o.costs['Nuclear'] = { capacity: i.supply.nuclear_capacity, generation: o.supply.total_nuclear*o.GWh_to_TWhy }
        o.costs['Hydro'] = { capacity: i.supply.hydro_capacity, generation: o.supply.total_hydro*o.GWh_to_TWhy }
        o.costs['H2 Electrolysis'] = { capacity: i.hydrogen.electrolysis_capacity_GW, generation: 0 }
        o.costs['Methanation'] = { capacity: i.methane.methanation_capacity, generation: 0 }
        // Turbine capacity covers the peak need after de-rating for outages (capacity market de-rating factors).
        // OCGT runs only when CCGT is at capacity, so OCGT covers its own peak output and CCGT the rest.
        let eb_out = o.electric_backup
        o.costs['CCGT'] = { capacity: (eb_out.max_capacity_requirement - eb_out.max_ocgt_output) / i.electric_backup.ccgt_derating_factor, generation: (eb_out.total_before_grid_loss - eb_out.total_ocgt_output)*o.GWh_to_TWhy }
        o.costs['OCGT'] = { capacity: eb_out.max_ocgt_output / i.electric_backup.ocgt_derating_factor, generation: eb_out.total_ocgt_output*o.GWh_to_TWhy }
        o.costs['Power to X'] = { capacity: i.power_to_X.capacity, generation: 0 }
        // Battery energy per kWh, and power per kW of inverter, the larger of charge and discharge capacity
        o.costs['Electric Storage'] = { capacity: i.electric_storage.capacity_GWh, generation: o.electric_storage.total_discharge*o.GWh_to_TWhy }
        o.costs['Battery inverter'] = { capacity: Math.max(i.electric_storage.charge_capacity_GW, i.electric_storage.discharge_capacity_GW), generation: 0 }
        // Anaerobic digestion supply is flat. Capacity in GW of methane assumes 90% plant availability.
        let biogas_methane_TWh = i.biogas.biomass_for_biogas * i.biogas.anaerobic_digestion_efficiency
        o.costs['Anaerobic digestion'] = { capacity: biogas_methane_TWh / 8.766 / 0.9, generation: biogas_methane_TWh }
        // FT capacity is hydrogen in, output is synthetic fuel. Store capacities are GWh, costs per kWh.
        o.costs['FT synthetic fuel'] = { capacity: i.synth_fuel.capacity_GW, generation: o.synth_fuel.total_produced*o.GWh_to_TWhy }
        o.costs['Hydrogen storage'] = { capacity: i.hydrogen.storage_capacity_GWh, generation: 0 }
        o.costs['Methane storage'] = { capacity: i.methane.storage_capacity_GWh, generation: 0 }
        o.costs['Synthetic fuel storage'] = { capacity: i.synth_fuel.store_capacity_GWh, generation: 0 }
        // CO2 store capacity in Mt, cost per tonne
        o.costs['CO2 storage'] = { capacity: i.methane.co2_store_capacity_t * 1e-6, generation: 0 }
        // Store power in GW, sized by the largest hourly flow
        o.costs['Hydrogen compressor'] = { capacity: o.hydrogen.max_store_charge, generation: 0 }
        o.costs['Methane store charging'] = { capacity: o.methane.max_store_charge, generation: 0 }
        o.costs['Methane store discharging'] = { capacity: o.methane.max_store_discharge, generation: 0 }

        o.total_annual_cost = 0;

        // Capacity in GW (GWh for storage) and costs per kW (kWh), 0.001 gives £bn/yr
        for (var z in i.costs) {
            let c = o.costs[z]
            c.annual = c.capacity * 0.001 * annual_fixed_cost(i.costs[z], i.annualisation) + c.generation * 0.001 * i.costs[z].variable_om
            c.LCOE = c.generation > 0 ? 1000 * c.annual / c.generation : 0
            o.total_annual_cost += c.annual
        }

        // Crop feedstock for biogas, the grass above the waste share in land_use, priced per MWh of methane
        o.biogas_feedstock_annual = o.biomass.grass_for_biogas * i.biogas.anaerobic_digestion_efficiency * i.biogas.crop_feedstock_gbp_MWh * 0.001
        o.total_annual_cost += o.biogas_feedstock_annual

        // Biomass for FT, priced per MWh of biomass
        o.ft_biomass_annual = o.synth_fuel.total_biomass_used * o.GWh_to_TWhy * i.synth_fuel.biomass_gbp_MWh * 0.001
        o.total_annual_cost += o.ft_biomass_annual

        // Fuel burned for electricity generation, GWh over the run to TWh/yr, priced in pence per kWh of fuel.
        // Carbon price in £/tCO2 on fossil backup emissions, with the CO2 factors used for grid emissions.
        let biomass_for_backup = o.electric_backup.total_biomass_turbine_output / (i.electric_backup.biomass_efficiency*0.01)
        let backup_fuel = {
            gas: [o.methane.ccgt_methane_from_fossil_gas, i.fuel_prices.gas, i.co2_factors.gas],
            oil: [o.synth_fuel.backup_from_fossil_oil, i.fuel_prices.oil, i.co2_factors.fuel_oil],
            coal_other: [o.fossil_fuels.coal_for_dispatchable, i.fuel_prices.coal, i.electric_backup.coal_co2_factor],
            biomass: [biomass_for_backup, i.fuel_prices.biomass, 0]
        }
        o.fuel_cost_annual = 0
        o.carbon_cost_annual = 0
        let backup_fuel_annual = {}
        for (let z in backup_fuel) {
            let [fuel, price, co2_factor] = backup_fuel[z]
            let fuel_annual = 0.01 * o.GWh_to_TWhy * fuel * price
            let co2 = fuel * co2_factor * 0.001 * o.per_year   // MtCO2/yr
            let carbon_annual = 0.001 * co2 * i.carbon_price
            backup_fuel_annual[z] = fuel_annual + carbon_annual
            o.fuel_cost_annual += fuel_annual
            o.carbon_cost_annual += carbon_annual
        }
        o.total_annual_cost += o.fuel_cost_annual + o.carbon_cost_annual

        let backup = { annual: o.costs['CCGT'].annual + o.costs['OCGT'].annual, generation: o.costs['CCGT'].generation + o.costs['OCGT'].generation }
        o.backup_LCOE = backup.generation > 0 ? 1000 * (backup.annual + o.fuel_cost_annual + o.carbon_cost_annual) / backup.generation : 0

        o.LCOE = 1000*o.total_annual_cost / (o.balance.total_electricity_demand*o.GWh_to_TWhy)

        // Generation cost. With basis "price", a technology with a price per MWh (a strike price, or
        // wholesale value plus support) is costed as output times that price, and one without uses the
        // build-up above. With basis "lcoe", every technology uses the build-up. Imports have no
        // build-up and always use their price. Backup turbine capacity is shared by output, plus each
        // fuel's own fuel and carbon cost. Fuel production (electrolysis, methanation, power to X,
        // anaerobic digestion, crop feedstock, FT and its biomass, the fuel stores and their power) always uses the build-up. Generation is GWh over the run, so o.GWh_to_TWhy gives TWh/yr and TWh
        // times £/MWh times 0.001 gives £bn. Build-up rows that enter the total are marked used.
        let backup_output = o.electric_backup.total_before_grid_loss
        let turbine_share = (gen) => backup_output > 0 ? backup.annual * gen / backup_output : 0
        let build_up = (key) => Array.isArray(key) ? key.reduce((sum, k) => sum + build_up(k), 0) : (o.costs[key] && o.costs[key].annual) || 0
        let eb = o.electric_backup
        let techs = {
            offshore_wind: [o.supply.total_offshore_wind, 'Offshore wind'],
            onshore_wind: [o.supply.total_onshore_wind, 'Onshore wind'],
            solar: [o.supply.total_solarpv, 'Solar PV'],
            tidal: [o.supply.total_tidal, 'Tidal'],
            wave: [o.supply.total_wave, 'Wave'],
            geothermal: [o.supply.total_geothermal_elec, 'Geothermal Electric'],
            nuclear: [o.supply.total_nuclear, 'Nuclear'],
            hydro: [o.supply.total_hydro, 'Hydro'],
            imports: [o.supply.total_imports, null],
            gas: [eb.total_methane_turbine_output, () => turbine_share(eb.total_methane_turbine_output) + backup_fuel_annual.gas],
            biomass: [eb.total_biomass_turbine_output, () => turbine_share(eb.total_biomass_turbine_output) + backup_fuel_annual.biomass],
            coal_other: [eb.total_coal_turbine_output, () => turbine_share(eb.total_coal_turbine_output) + backup_fuel_annual.coal_other],
            oil: [eb.total_synth_fuel_turbine_output, () => turbine_share(eb.total_synth_fuel_turbine_output) + backup_fuel_annual.oil],
            hydrogen: [eb.total_hydrogen_turbine_output, () => turbine_share(eb.total_hydrogen_turbine_output)],
            storage: [o.electric_storage.total_discharge, ['Electric Storage', 'Battery inverter']]
        }
        let gc = i.generation_costs
        for (let z in o.costs) o.costs[z].used = false
        o.generation_costs = { by_tech: {}, total_annual: 0, backup_fuel_used: false }
        for (let z in techs) {
            let [output, cost] = techs[z]
            let generation = output * o.GWh_to_TWhy
            let has_build_up = cost !== null
            let lcoe_annual = typeof cost === 'function' ? cost() : build_up(cost)
            let price = gc.price_gbp_MWh[z]
            let priced = price !== null && price !== undefined
            let uses_build_up = has_build_up && (gc.basis == "lcoe" || !priced)
            let annual = uses_build_up ? lcoe_annual : generation * (price || 0) * 0.001
            if (uses_build_up) {
                if (typeof cost === 'string') o.costs[cost].used = true
                else if (Array.isArray(cost)) cost.forEach(k => o.costs[k].used = true)
                else if (generation > 0) {
                    o.costs['CCGT'].used = true
                    o.costs['OCGT'].used = true
                    if (z != 'hydrogen') o.generation_costs.backup_fuel_used = true
                }
            }
            let row = {
                generation: generation,
                lcoe: has_build_up && generation > 0 ? 1000 * lcoe_annual / generation : null,
                price: generation > 0 ? 1000 * annual / generation : 0,
                annual: annual,
                uses_build_up: uses_build_up,
                load_factor: null,
                implied_hurdle: null,
                implied_capex: null
            }
            // Load factor of a fixed generator, TWh/yr over GW, and what its price implies for the
            // build-up: the hurdle rate that reproduces it, and the construction cost per kW that
            // does at the input hurdle rate.
            if (typeof cost === 'string' && o.costs[cost].capacity > 0) {
                row.load_factor = generation / (o.costs[cost].capacity * 8.766)
            }
            if (typeof cost === 'string' && priced && generation > 0 && o.costs[cost].capacity > 0) {
                let target = generation * (price - i.costs[cost].variable_om) / o.costs[cost].capacity
                row.implied_hurdle = implied_hurdle_rate(i.costs[cost], target)
                row.implied_capex = implied_capex(i.costs[cost], target)
            }
            o.generation_costs.by_tech[z] = row
            o.generation_costs.total_annual += annual
        }
        let fuel_production = ['H2 Electrolysis', 'Methanation', 'Power to X', 'Anaerobic digestion', 'FT synthetic fuel', 'Hydrogen storage', 'Methane storage', 'Synthetic fuel storage', 'CO2 storage', 'Hydrogen compressor', 'Methane store charging', 'Methane store discharging']
        o.generation_costs.fuel_production_annual = o.biogas_feedstock_annual + o.ft_biomass_annual
        for (let z of fuel_production) {
            o.costs[z].used = true
            o.generation_costs.fuel_production_annual += build_up(z)
        }
        o.generation_costs.total_annual += o.generation_costs.fuel_production_annual + gc.other_support_gbp_bn
        model.hourly_prices()

        // Retail prices. The electricity unit rate starts from the generation cost per kWh delivered
        // to end users, and gas from the gas fuel price. Network, social policy and
        // supplier costs are inputs, per kWh and per customer per year, before VAT.
        // £bn/yr over TWh/yr gives £/kWh, so 100 converts to p/kWh.
        let r = i.retail
        let vat = 1 + r.vat_prc * 0.01
        let delivered_TWh = (o.balance.total_electricity_demand - o.total_losses.grid) * o.GWh_to_TWhy
        // Fuel users pay for the electricity used to make fuel, so where they pay, electricity users'
        // costs are recovered over end use. Baselines have no fuel users and use delivered electricity.
        let billed_TWh = o.generation_costs.fuel_users_annual > 0 ? o.prices.end_use_TWh : delivered_TWh
        let households_kWh = (GWh) => GWh * o.per_year * 1000000 / i.households_2030
        o.retail = {}

        let e = r.electricity
        // The build-up for every technology (resource cost) is kept for comparison
        let elec = {
            resource_p_kWh: delivered_TWh > 0 ? 100 * o.total_annual_cost / delivered_TWh : 0,
            generation_cost_p_kWh: billed_TWh > 0 ? 100 * o.generation_costs.electricity_annual / billed_TWh : 0,
            bill_top_up_p_kWh: billed_TWh > 0 ? 100 * o.prices.bill_top_up / billed_TWh : 0
        }
        // The unit rate uses the generation cost plus any year specific wholesale adjustment
        elec.generation_p_kWh = elec.generation_cost_p_kWh + e.wholesale_adjustment_p_kWh
        // With network_basis "peak", the per kWh network total scales with peak electricity demand
        // relative to the reference (the 2024 baseline), plus new investment as an annuity. Fuel users
        // pay network_fuel_share_prc of it, and electricity users pay the rest. The standing charge is
        // per connection and does not scale.
        let p = o.prices
        // Hydrogen in each fuel sold, MWh per MWh. Methane is a mix of biogas and methanation.
        let methanation_share = o.methane.total_produced > 0 ? o.methane.total_hydrogen_used / o.methane.total_produced : 0
        let hydrogen_content = { hydrogen: 1, methane: methanation_share, synthetic_fuel: i.synth_fuel.FT_process_hydrogen_req }
        let hydrogen_sold_TWh = 0
        for (let z in p.fuel) hydrogen_sold_TWh += p.fuel[z].TWh * hydrogen_content[z]

        elec.network_p_kWh = e.network_p_kWh
        elec.network_total_bn = e.network_p_kWh * 0.01 * billed_TWh
        elec.network_investment_annual_bn = 0
        elec.network_fuel_bn = 0
        if (e.network_basis == "peak" && billed_TWh > 0) {
            let rate = e.network_investment_return_prc * 0.01
            elec.network_investment_annual_bn = e.network_investment_gbp_bn * rate / (1 - Math.pow(1 + rate, -e.network_investment_life_years))
            elec.network_total_bn = e.network_p_kWh * 0.01 * e.network_reference_TWh * (o.balance.max_electricity_demand / e.network_reference_peak_GW) + elec.network_investment_annual_bn
            if (hydrogen_sold_TWh > 0) elec.network_fuel_bn = elec.network_total_bn * e.network_fuel_share_prc * 0.01
            elec.network_p_kWh = 100 * (elec.network_total_bn - elec.network_fuel_bn) / billed_TWh
        }
        elec.network_annual_bn = elec.network_total_bn - elec.network_fuel_bn
        elec.unit_rate_p_kWh = (elec.generation_p_kWh + elec.network_p_kWh + e.policy_p_kWh + e.supplier_p_kWh) * vat
        elec.standing_charge_gbp = (e.network_gbp + e.policy_gbp + e.supplier_gbp) * vat
        elec.household_kWh = households_kWh(o.final_consumption.domestic.electricity)
        elec.bill_gbp = elec.unit_rate_p_kWh * 0.01 * elec.household_kWh + elec.standing_charge_gbp
        elec.household_spend_bn = elec.bill_gbp * i.households_2030 * 1e-9
        o.retail.electricity = elec

        // Fuel prices add the fuel users' network share to the values. The share follows hydrogen
        // content, as electrolysis is what uses the network. The values alone set hourly prices.
        let network_per_MWh_hydrogen = hydrogen_sold_TWh > 0 ? 1000 * elec.network_fuel_bn / hydrogen_sold_TWh : 0
        for (let z in p.fuel) {
            let fuel = p.fuel[z]
            fuel.network_gbp_MWh = network_per_MWh_hydrogen * hydrogen_content[z]
            fuel.price_gbp_MWh = fuel.gbp_MWh + fuel.network_gbp_MWh
            fuel.p_kWh = fuel.price_gbp_MWh * 0.1
            fuel.network_annual = fuel.TWh * fuel.network_gbp_MWh * 0.001
        }
        p.fuel.synthetic_fuel.p_litre = p.fuel.synthetic_fuel.p_kWh * r.road_fuel.diesel_kWh_per_litre

        let g = r.gas
        let gas = { wholesale_p_kWh: i.fuel_prices.gas + g.wholesale_adjustment_p_kWh }
        gas.unit_rate_p_kWh = (gas.wholesale_p_kWh + g.network_p_kWh + g.policy_p_kWh + g.supplier_p_kWh) * vat
        gas.standing_charge_gbp = (g.network_gbp + g.policy_gbp + g.supplier_gbp) * vat
        gas.customers = i.households_2030 * g.households_prc * 0.01
        gas.household_kWh = gas.customers > 0 ? o.final_consumption.domestic.gas * o.per_year * 1000000 / gas.customers : 0
        gas.bill_gbp = gas.customers > 0 ? gas.unit_rate_p_kWh * 0.01 * gas.household_kWh + gas.standing_charge_gbp : 0
        gas.household_spend_bn = gas.bill_gbp * gas.customers * 1e-9
        o.retail.gas = gas

        // Road fuel at the pump, including duty and VAT, blended by the car diesel share
        let f = r.road_fuel
        let diesel = f.car_diesel_prc * 0.01
        let road = {
            petrol_p_kWh: f.petrol_p_litre / f.petrol_kWh_per_litre,
            diesel_p_kWh: f.diesel_p_litre / f.diesel_kWh_per_litre
        }
        road.car_p_kWh = road.petrol_p_kWh * (1 - diesel) + road.diesel_p_kWh * diesel
        road.car_fuel_spend_bn = o.transport.modes["Cars & Vans"].IC.TWh * road.car_p_kWh * 0.01
        o.retail.road_fuel = road
    }
}

// Annual cost per kW of capacity (£/kW/yr) that recovers pre-development, construction
// and fixed O&M costs over the operating life. Follows the DESNZ levelised cost method
// used in tools/lcoe/lcoe_lib.js: spend is phased evenly over the pre-development and
// construction years and discounted at the hurdle rate from the start of pre-development.
// Multiplying by capacity gives the same total as LCOE multiplied by generation.
function levelised_fixed_cost(c) {
    let rate = c.hurdle_rate * 0.01
    let construction_start = c.predev_years
    let operation_start = c.predev_years + c.build_years
    let decommission_year = operation_start + c.lifespan

    let discounted_costs = 0
    let discounted_operating_years = 0

    for (let year = 0; year < decommission_year; year++) {
        let discount_factor = 1 / Math.pow(1 + rate, year)
        if (year < construction_start) {
            discounted_costs += discount_factor * c.predev_cost / c.predev_years
        } else if (year < operation_start) {
            discounted_costs += discount_factor * c.capex / c.build_years
        } else {
            discounted_costs += discount_factor * c.fixed_om
            discounted_operating_years += discount_factor
        }
    }
    return discounted_costs / discounted_operating_years
}

// Annual fixed cost (£/kW/yr) by the chosen method. "desnz" is levelised_fixed_cost at each
// technology's hurdle rate. "annuity" is the PyPSA-Eur method: overnight cost (pre-development
// plus construction) times the annuity factor at one discount rate for all technologies, plus
// fixed O&M, with no interest during construction.
function annual_fixed_cost(c, a) {
    if (!a || a.method != "annuity") return levelised_fixed_cost(c)
    let r = a.discount_rate * 0.01
    let annuity = r > 0 ? r / (1 - Math.pow(1 + r, -c.lifespan)) : 1 / c.lifespan
    return (c.predev_cost + c.capex) * annuity + c.fixed_om
}

// Hurdle rate (%) at which levelised_fixed_cost equals target (£/kW/yr). The cost rises with the
// rate, so bisection between -5% and 50% finds it. Null if the target is outside that range.
function implied_hurdle_rate(c, target) {
    let at = (rate) => levelised_fixed_cost(Object.assign({}, c, { hurdle_rate: rate }))
    let low = -5, high = 50
    if (target < at(low) || target > at(high)) return null
    for (let n = 0; n < 50; n++) {
        let mid = (low + high) / 2
        if (at(mid) < target) low = mid; else high = mid
    }
    return (low + high) / 2
}

// Construction cost (£/kW) at which levelised_fixed_cost equals target, at the input hurdle rate.
// The cost is linear in capex. A negative result means the target is below pre-development and O&M.
function implied_capex(c, target) {
    let without = levelised_fixed_cost(Object.assign({}, c, { capex: 0 }))
    let per_capex = levelised_fixed_cost(Object.assign({}, c, { capex: 1000 })) - without
    return 1000 * (target - without) / per_capex
}

// Optimal electricity store dispatch with perfect foresight over the whole dataset.
// Adapted from optimiseStoreDP in tools/ukgridsim. The state of charge is split into
// soc_levels steps and a dynamic programme finds the schedule with the lowest cost.
// The cost of each hour is set by the deficit left after the store:
//
//   backup_value per GWh of deficit (backup generation)
//   peak_weight per GW² of deficit (so the store shaves the highest peaks)
//   10 x backup_value per GWh of deficit above the backup capacity limit
//   surplus_value per GWh of surplus missing from the surplus_band GW that DSR could use
//   electrolysis_value per GWh of surplus missing from the next electrolysis_band GW
//
// Surplus above those bands has no value. Both the hourly cost and the cost carried from the previous
// hour are convex in the state of charge, so each hour is a min-plus convolution of
// two convex sequences. Merging their slopes gives this in O(soc_levels) per hour.
// Rows are saved at checkpoints and recomputed a block at a time to recover the schedule.
//
// balance is in GW before the store. Returns hourly charge and discharge in GW.
function optimise_elec_store(balance, opts) {
    let N = balance.length
    let K = Math.max(2, Math.round(opts.soc_levels))
    let step = opts.capacity / K
    let ceff = opts.charge_efficiency
    let deff = opts.discharge_efficiency
    let Ce = opts.backup_value
    let lam = opts.peak_weight
    let Cu = 10 * Ce
    let SOC_PEN = 1e-9 * step   // tie-break, prefer a fuller store
    let band = opts.surplus_band || 0
    let band_value = opts.surplus_value || 0
    let electrolysis_band = opts.electrolysis_band || 0
    let electrolysis_value = opts.electrolysis_value || 0
    let band_top = band + electrolysis_band
    let empty_bands_cost = band_value * band + electrolysis_value * electrolysis_band

    let up_max = Math.min(K, Math.floor(opts.charge_max * ceff / step))
    let dn_max = Math.min(K, Math.floor(opts.discharge_max / deff / step))

    // Grid side power for a change of d levels, negative when charging
    function store_power(d) {
        return d >= 0 ? -d * step / ceff : -d * step * deff
    }

    function hour_cost(b) {
        // Lost surplus costs what DSR or electrolysis would have saved. Each value is at most the one
        // below it, and DSR's at most backup_value, which keeps the cost convex.
        if (b >= band_top) return 0
        if (b >= band) return electrolysis_value * (band_top - b)
        if (b >= 0) return band_value * (band - b) + electrolysis_value * electrolysis_band
        let deficit = -b
        let cost = empty_bands_cost + Ce * deficit + lam * deficit * deficit
        if (deficit > opts.backup_limit) cost += Cu * (deficit - opts.backup_limit)
        return cost
    }

    // Level changes allowed in hour t. Discharge is limited to the deficit plus what DSR and electrolysis could use.
    // Charge is limited to the surplus unless charging from backup is allowed.
    let r = [0, 0]
    function level_range(t) {
        let net = balance[t]
        r[0] = -Math.min(dn_max, Math.floor(Math.max(0, band_top - net) / deff / step))
        r[1] = up_max
        if (!opts.charge_from_backup) r[1] = Math.min(up_max, Math.floor(Math.max(0, net) * ceff / step))
        return r
    }

    let g = new Float64Array(up_max + dn_max + 1)
    let lo = new Int32Array(N + 1)
    let hi = new Int32Array(N + 1)

    // Row t+1 from row t (f) into out. Rows hold the lowest cost to reach each level.
    function forward(t, f, out) {
        level_range(t)
        let m = r[1] - r[0]
        for (let j = 0; j <= m; j++) g[j] = hour_cost(balance[t] + store_power(r[0] + j))
        out.fill(Infinity)
        let flo = lo[t], fhi = hi[t]
        let a = flo, j = 0
        for (let k = flo + r[0]; ; k++) {
            if (k >= 0 && k <= K) out[k] = f[a] + g[j] - SOC_PEN * k
            if (a == fhi && j == m) break
            if (j == m || (a < fhi && f[a + 1] - f[a] <= g[j + 1] - g[j])) a++
            else j++
        }
        lo[t + 1] = Math.max(0, flo + r[0])
        hi[t + 1] = Math.min(K, fhi + r[1])
    }

    let B = Math.ceil(Math.sqrt(N))
    let nb = Math.ceil(N / B)
    let checkpoints = new Float64Array(nb * (K + 1))
    let block = new Float64Array(B * (K + 1))

    // Forward pass
    let cur = new Float64Array(K + 1)
    let next = new Float64Array(K + 1)
    let s0 = Math.min(K, Math.max(0, Math.round(opts.initial_soc / step)))
    cur.fill(Infinity)
    cur[s0] = 0
    lo[0] = s0; hi[0] = s0
    for (let t = 0; t < N; t++) {
        if (t % B == 0) checkpoints.set(cur, (t / B) * (K + 1))
        forward(t, cur, next)
        let tmp = cur; cur = next; next = tmp
    }

    // Cheapest final level
    let level = lo[N]
    for (let s = lo[N]; s <= hi[N]; s++) if (cur[s] < cur[level]) level = s

    // Backtrack one block at a time
    let charge = new Float64Array(N)
    let discharge = new Float64Array(N)
    for (let b = nb - 1; b >= 0; b--) {
        let t0 = b * B
        let t1 = Math.min(N, t0 + B)
        block.set(checkpoints.subarray(b * (K + 1), (b + 1) * (K + 1)))
        for (let t = t0; t < t1 - 1; t++) {
            forward(t, block.subarray((t - t0) * (K + 1), (t - t0 + 1) * (K + 1)), block.subarray((t - t0 + 1) * (K + 1), (t - t0 + 2) * (K + 1)))
        }
        for (let t = t1 - 1; t >= t0; t--) {
            let f = block.subarray((t - t0) * (K + 1), (t - t0 + 1) * (K + 1))
            level_range(t)
            let best = Infinity, prev = level
            for (let s = Math.max(lo[t], level - r[1]); s <= Math.min(hi[t], level - r[0]); s++) {
                let cost = f[s] + hour_cost(balance[t] + store_power(level - s))
                if (cost < best) { best = cost; prev = s }
            }
            let power = store_power(level - prev)
            if (power < 0) charge[t] = -power; else discharge[t] = power
            level = prev
        }
    }
    return { charge: charge, discharge: discharge }
}
