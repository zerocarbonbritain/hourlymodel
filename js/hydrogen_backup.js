function hydrogen_backup_init()
{
    units_mode = "TWhyr"
    unitsmode = "GW"   
    
    // ---------------------------------------------------------------------------
    // dataset index:
    // 0:onshore wind, 1:offshore wind, 2:wave, 3:tidal, 4:solar, 5:traditional electricity
    offshore_wind_capacity = 135.0
    onshore_wind_capacity = 30.0
    wave_capacity = 0.0
    tidal_capacity = 0.0
    hydro_capacity = 3.0
    solarpv_capacity = 90.0
    geothermal_elec_capacity = 0.0
    nuclear_capacity = 0.0
    grid_loss_prc = 0.07
    
    // Availability factors
    offshore_wind_availability = 0.9
    onshore_wind_availability = 0.9
    nuclear_availability = 0.9
    
    // Capacity factors
    // All other technologies based on hourly datasets
    hydro_cf = 0.3
    geothermal_elec_cf = 0.9
    
    trad_elec_demand = 500.0
    
    electrolysis_capacity = 50
    electrolysis_efficiency = 0.9
    hydrogen_storage_capacity = 70000
    gasturbine_capacity = 64.5
    gasturbine_efficiency = 0.6
}

function hydrogen_backup_run()
{
    total_offshore_wind_supply = 0
    total_onshore_wind_supply = 0
    total_solar_supply = 0
    total_wave_supply = 0
    total_tidal_supply = 0
    total_geothermal_elec = 0
    total_nuclear_supply = 0
    total_hydro_supply = 0
    total_supply = 0
    
    total_grid_losses = 0
    
    total_demand = 0
    
    hydrogen_storage_soc = hydrogen_storage_capacity * 0.5
    total_electrolysis_losses = 0
    total_gasturbine_losses = 0
    
    
    total_excess_initial = 0
    total_unmet_initial = 0
    max_unmet_initial = 0

    total_excess_final = 0
    total_unmet_final = 0
    max_unmet_final = 0

    data = {
        supply: [],
        demand: [],
        hydrogen_storage_soc: []
    }

    var capacityfactors_all = [];
    for (var hour = 0; hour < hours; hour++) {
        var capacityfactors = tenyearsdatalines[hour].split(",");
        for (var i=0; i<capacityfactors.length; i++) {
            capacityfactors[i] = parseFloat(capacityfactors[i]);
        }
        capacityfactors_all.push(capacityfactors)
    }

    for (var hour = 0; hour < hours; hour++) {
        var capacityfactors = capacityfactors_all[hour]
        var day = parseInt(Math.floor(hour / 24))
        var temperature = parseFloat(temperaturelines[day].split(",")[1]);
        
        var time = datastarttime + (hour * 3600 * 1000);
        // --------------------------------------------------------------------------------------------------------------
        // Electricity Supply
        // --------------------------------------------------------------------------------------------------------------
        // variable supply
        offshore_wind_power_supply = offshore_wind_capacity * capacityfactors[1] * offshore_wind_availability
        onshore_wind_power_supply = onshore_wind_capacity * capacityfactors[0] * onshore_wind_availability
        wave_power_supply = wave_capacity * capacityfactors[2]
        tidal_power_supply = tidal_capacity * capacityfactors[3]
        pv_power_supply = solarpv_capacity * capacityfactors[4]
        geothermal_power_supply = geothermal_elec_capacity * geothermal_elec_cf
        hydro_power_supply = hydro_capacity * hydro_cf

        // non-variable non-backup electricity supply
        nuclear_power_supply = nuclear_capacity * nuclear_availability

        // totals        
        total_offshore_wind_supply += offshore_wind_power_supply
        total_onshore_wind_supply += onshore_wind_power_supply
        total_solar_supply += pv_power_supply
        total_wave_supply += wave_power_supply
        total_tidal_supply += tidal_power_supply
        total_geothermal_elec += geothermal_power_supply
        total_hydro_supply += hydro_power_supply
        total_nuclear_supply += nuclear_power_supply
        
        // total supply
        electricity_supply = offshore_wind_power_supply + onshore_wind_power_supply + wave_power_supply + tidal_power_supply + pv_power_supply + geothermal_power_supply + hydro_power_supply + nuclear_power_supply
        total_supply += electricity_supply
        
        // supply after losses
        supply = electricity_supply * (1.0-grid_loss_prc)
        data.supply.push([time,supply])
        // total losses
        total_grid_losses += electricity_supply - supply
        // balance
        balance = supply
        
        // ---------------------------------------------------------------------------
        // Traditional electricity demand
        // ---------------------------------------------------------------------------
        normalised_trad_elec = capacityfactors[5]/331.033
        demand = normalised_trad_elec * trad_elec_demand
        data.demand.push([time,demand])
        total_demand += demand
        // subtract demand from balance
        balance -= demand

        // ---------------------------------------------------------------------------------
        // Initial balance 
        // ---------------------------------------------------------------------------------
        excess = 0.0
        unmet = 0.0
        
        if (balance>=0.0) {
            excess = balance
            total_excess_initial += excess
        } else {
            unmet = -balance
            total_unmet_initial += unmet
        }
        if (unmet>max_unmet_initial) max_unmet_initial = unmet

        // ---------------------------------------------------------------------------
        // Hydrogen model
        // ---------------------------------------------------------------------------
        if (balance>0.0) {
            electricity_for_electrolysis = balance
            // limit by available electrolysis capacity
            if (electricity_for_electrolysis>electrolysis_capacity) electricity_for_electrolysis = electrolysis_capacity
            // hydrogen produced 
            hydrogen_produced = electricity_for_electrolysis * electrolysis_efficiency
            // limit hydrogen produced if store is full
            if ((hydrogen_produced+hydrogen_storage_soc)>hydrogen_storage_capacity) {
                hydrogen_produced = hydrogen_storage_capacity - hydrogen_storage_soc
                electricity_for_electrolysis = hydrogen_produced / electrolysis_efficiency
            }
            // add hydrogen to store 
            hydrogen_storage_soc += hydrogen_produced
            // subtract from balance
            balance -= electricity_for_electrolysis
            // electrolysis losses
            total_electrolysis_losses += electricity_for_electrolysis - hydrogen_produced
        } else {
            gasturbine_output = -1 * balance
            // limit by available backup capacity
            if (gasturbine_output>gasturbine_capacity) gasturbine_output = gasturbine_capacity
            // hydrogen produced 
            hydrogen_demand = gasturbine_output / gasturbine_efficiency
            // limit hydrogen demand by available hydrogen
            if (hydrogen_demand>hydrogen_storage_soc) {
                hydrogen_demand = hydrogen_storage_soc
                gasturbine_output = hydrogen_demand * gasturbine_efficiency
            }
            // add hydrogen to store 
            hydrogen_storage_soc -= hydrogen_demand
            // add to balance
            balance += gasturbine_output
            // gas turbine losses
            total_gasturbine_losses += hydrogen_demand - gasturbine_output
        }

        data.hydrogen_storage_soc.push([time,hydrogen_storage_soc])
        
        // ---------------------------------------------------------------------------------
        // Final balance 
        // ---------------------------------------------------------------------------------
        excess = 0.0
        unmet = 0.0
        
        if (balance>=0.0) {
            excess = balance
            total_excess_final += excess
        } else {
            unmet = -balance
            total_unmet_final += unmet
        }
        if (unmet>max_unmet_final) max_unmet_final = unmet

    }

    offshore_wind_capacity_factor = 100 * total_offshore_wind_supply / (offshore_wind_capacity*24*365*10)
    onshore_wind_capacity_factor = 100 * total_onshore_wind_supply / (onshore_wind_capacity*24*365*10)
    tidal_capacity_factor = 100 * total_tidal_supply / (tidal_capacity*24*365*10)
    wave_capacity_factor = 100 * total_wave_supply / (wave_capacity*24*365*10)
    solarpv_capacity_factor = 100 * total_solar_supply / (solarpv_capacity*24*365*10)
    
    prc_demand_supplied_direct = ((total_demand - total_unmet_initial) / total_demand) * 100
    prc_demand_supplied_backup = ((total_demand - total_unmet_final) / total_demand) * 100
    prc_demand_unmet = (total_unmet_final / total_demand) * 100
    
    total_losses = total_grid_losses + total_electrolysis_losses + total_gasturbine_losses
    
    final_store_balance = hydrogen_storage_soc - (hydrogen_storage_capacity * 0.5)
    
    final_balance = total_supply - total_demand - total_losses - total_excess_final - final_store_balance + total_unmet_final
    console.log("Final balance error: "+final_balance.toFixed(3));

}
// ---------------------------------------------------------------------------    

function hydrogen_backup_ui() {
            
    $(".modeloutput").each(function(){
        var type = $(this).attr("type");
        var key = $(this).attr("key");
        var dp = $(this).attr("dp");
        var scale = $(this).attr("scale");
        var units = $(this).attr("units");
        
        if (type==undefined) {
            if (scale==undefined) scale = 1;
            if (units==undefined) units = ""; else units = " "+units;
        } else if(type=="10y") {
            if (unitsmode=="kwhd") {
                scale = 1.0 / 3650
                units = " kWh/d"
                dp = 1
            } else if (unitsmode=="kwhy") {
                scale = 1.0 / 10
                units = " kWh/y"
                dp = 0
            } else if (unitsmode=="GW") {
                scale = (1.0 / 10)*0.001
                units = " TWh"
                dp = 0
            }
        } else if(type=="1y") {
            if (unitsmode=="kwhd") {
                scale = 1.0 / 365
                units = " kWh/d"
                dp = 1
            } else if (unitsmode=="kwhy") {
                scale = 1.0
                units = " kWh/y"
                dp = 0
            }
        } else if(type=="1d") {
            if (unitsmode=="kwhd") {
                scale = 1.0
                units = " kWh/d"
                dp = 2
            } else if (unitsmode=="kwhy") {
                scale = 1.0 * 365
                units = " kWh/y"
                dp = 0
            }
        } else if(type=="auto") {
            var baseunit = $(this).attr("baseunit");
            
            if (baseunit=="kW") {
                scale = 1; units = " kW"; dp = 0;
                if (window[key]>=10000) {scale=0.001; units=" MW"; dp=0;}
                if (window[key]>=10000000) {scale=0.000001; units=" GW"; dp=0;}
            }
            
            if (baseunit=="kWh") {
                scale = 1; units = " kWh"; dp = 0;
                if (window[key]>=10000) {scale=0.001; units=" MWh"; dp=0;}
                if (window[key]>=10000000) {scale=0.000001; units=" GWh"; dp=0;}
                if (window[key]>=10000000000) {scale=0.000000001; units=" TWh"; dp=0;}
            }

            if (baseunit=="m2") {
                scale = 1; units = " m2"; dp = 0;
                if (window[key]>=10000*10) {scale=0.0001; units=" ha"; dp=0;}
                if (window[key]>=10000*10*1000) {scale=0.0001*0.001; units=" kha"; dp=0;}
                if (window[key]>=10000*10*1000*1000) {scale=0.0001*0.001*0.001; units=" Mha"; dp=0;}
            } 
        } else if(type=="%") {
            scale = 100.0
            units = "%"
            dp = 0
        } 
        
        $(this).html("<span>"+(1*window[key]*scale).toFixed(dp)+"</span><span style='font-size:90%'>"+units+"</span>");
    });
    
    // Energy stacks visualisation definition
    var scl = 1.0/10000.0;
    var units = "TWh/yr";
    
    if (units_mode=="kwhdperperson") {
        units = "kWh/d.p"
        // GWh converted to kWh x 1000 x 1000, per day divide by 365 & 10 years
        scl = (1000.0*1000.0) / (10*365.0*population_2030)
    }
    
    if (units_mode=="kwhdperhousehold") {
        units = "kWh/d.h"
        // GWh converted to kWh x 1000 x 1000, per day divide by 365 & 10 years
        scl = (1000.0*1000.0) / (10*365.0*households_2030)
    }
    
    var stacks = [
      {"name":"Supply","height":(total_supply+total_unmet_final)*scl,"saving":0,
        "stack":[
          {"kwhd":total_supply*scl,"name":"Supply","color":1},
          {"kwhd":total_unmet_final*scl,"name":"Unmet","color":3}
        ]
      },
      {"name":"Supply","height":(total_supply+total_unmet_final)*scl,"saving":0,
        "stack":[
          {"kwhd":total_offshore_wind_supply*scl,"name":"Offshore Wind","color":1},
          {"kwhd":total_onshore_wind_supply*scl,"name":"Onshore Wind","color":1},
          {"kwhd":total_solar_supply*scl,"name":"Solar PV","color":1},
          {"kwhd":total_wave_supply*scl,"name":"Wave","color":1},
          {"kwhd":total_tidal_supply*scl,"name":"Tidal","color":1},
          {"kwhd":total_hydro_supply*scl,"name":"Hydro","color":1},
          {"kwhd":total_geothermal_elec*scl,"name":"Geo Thermal Elec","color":1},
          {"kwhd":total_nuclear_supply*scl,"name":"Nuclear","color":1},
          {"kwhd":total_unmet_final*scl,"name":"Unmet","color":3}
        ]
      },
      
      {"name":"Demand","height":(total_demand+total_losses+(total_excess_final+final_store_balance))*scl,"saving":0,
        "stack":[
          {"kwhd":total_demand*scl,"name":"Demand","color":0},
          {"kwhd":total_gasturbine_losses*scl,"name":"Gas turbine losses","color":2},
          {"kwhd":total_electrolysis_losses*scl,"name":"Electrolysis losses","color":2},
          {"kwhd":total_grid_losses*scl,"name":"Grid losses","color":2},
          {"kwhd":(total_excess_final+final_store_balance)*scl,"name":"Exess","color":3}
        ]
      }
    ];
    draw_stacks(stacks,"stacks",1000,600,units)  
}	
	
function hydrogen_backup_view(start,end,interval)
{
    var dataout = data_view(start,end,interval);
    
    if (view_mode=="") 
    {
        $.plot("#placeholder", [
            {label: "Demand", data:dataout.demand, yaxis:1, color:"#00aacc", lines: {lineWidth:0, fill: 1.0 }}, 
            {label: "Supply", data:dataout.supply, yaxis:1, color:"#000000", lines: {lineWidth:1, fill: false }},
            {label: "H2 SOC", data:dataout.hydrogen_storage_soc, yaxis:2, color:"#0000aa", lines: {lineWidth:1, fill: false }}
            ], {
                xaxis:{mode:"time", min:start, max:end, minTickSize: [1, "hour"]},
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );
    }
    /*
    else if (view_mode=="backup")
    {
        var histogram2 = [];
        for (var z in histogram) {
            histogram2.push([1*z,histogram[z]])
        }
    
        $.plot("#placeholder", [
            { data:histogram2, yaxis:1, color:"#000", bars: { align: "center", fill: true, show: true, barWidth: 0.008 }},
            ], {
                grid: {hoverable: true, clickable: true},
                selection: { mode: "x" },
                legend: {position: "nw"}
            }
        );  
        
        $("#graph_notes").html("Y-axis: backup energy (kWh), X-axis: backup capacity (kW)")  
    }*/
}
