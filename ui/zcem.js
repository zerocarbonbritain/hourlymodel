previousPoint = false
// ---------------------------------------------------------------------------    
	
function model_ui() {
    // Energy stacks visualisation definition
    var scl = 1.0/10000.0;
    var units = "TWh/yr";
    
    if (i.units_mode=="kwhdperperson") {
        units = "kWh/d.p"
        // GWh converted to kWh x 1000 x 1000, per day divide by 365 & 10 years
        scl = (1000.0*1000.0) / (10*365.0*i.population_2030)
    }
    
    if (i.units_mode=="kwhdperhousehold") {
        units = "kWh/d.h"
        // GWh converted to kWh x 1000 x 1000, per day divide by 365 & 10 years
        scl = (1000.0*1000.0) / (10*365.0*i.households_2030)
    }
    
    var ambient = 0;
    if (i.include_ambient_heat) {
        ambient = o.heat.total_ambient_supply;
    }
    
    var stacks = [
      {"name":"Supply","height":(o.balance.total_supply+o.total_unmet_demand)*scl,"saving":0,
        "stack":[
          {"kwhd":(o.balance.total_supply-o.fossil_fuels.total)*scl,"name":"Supply","color":1}, // Zero carbon supply
          {"kwhd":o.fossil_fuels.total*scl,"name":"Fossil fuels","color":8},      
          {"kwhd":o.balance.total_unmet_demand*scl,"name":"Unmet","color":3}
        ]
      },
      {"name":"Supply","height":(o.balance.total_supply+o.total_unmet_demand)*scl,"saving":0,
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
          {"kwhd":o.biomass.total_used*scl,"name":"Biomass","color":1},
          {"kwhd":ambient*scl,"name":"Ambient","color":1},
          {"kwhd":o.hydrogen.total_from_imports*scl,"name":"H2 import","color":1},
          {"kwhd":o.fossil_fuels.coal*scl,"name":"Coal","color":8},        
          {"kwhd":o.fossil_fuels.oil*scl,"name":"Oil","color":8},
          {"kwhd":o.fossil_fuels.gas*scl,"name":"Gas","color":8},      
          {"kwhd":o.balance.total_unmet_demand*scl,"name":"Unmet","color":3}
        ]
      },
      
      {"name":"Demand","height":(o.balance.total_demand+o.balance.total_losses_combined+o.balance.total_excess)*scl,"saving":0,
        "stack":[
          {"kwhd":o.balance.total_demand*scl,"name":"Demand","color":0},
          {"kwhd":o.balance.total_losses_combined*scl,"name":"Losses","color":2},
          {"kwhd":o.balance.total_excess*scl,"name":"Excess","color":3}
        ]
      },

      {"name":"Demand","height":(o.balance.total_demand+o.balance.total_losses_combined)*scl,"saving":0,
        "stack":[
          {"kwhd":(o.LAC.total+o.LAC.total_gas)*scl,"name":"LAC","color":0},
          {"kwhd":o.space_heating.total_demand*scl,"name":"Space Heat","color":0},
          {"kwhd":o.water_heating.total_demand*scl,"name":"Water Heat","color":0},
          {"kwhd":(o.electric_transport.total_EV_demand+o.electric_transport.total_elec_trains_demand)*scl,"name":"Electric Transport","color":0},
          {"kwhd":o.hydrogen.total_vehicle_demand*scl,"name":"Hydrogen Transport","color":0},
          {"kwhd":o.hydrogen.total_industry_demand*scl,"name":"Hydrogen for Industry","color":0},
          {"kwhd":10000*(o.transport.fuel_totals.IC-o.transport.modes.Aviation.IC.TWh)*scl,"name":"Liquids for Transport","color":0},
          {"kwhd":10000*o.transport.modes.Aviation.IC.TWh*scl,"name":"Aviation","color":0},
          // Industry
          {"kwhd":o.industry.total_elec_demand*scl,"name":"Industry Electric","color":0},
          {"kwhd":o.industry.total_methane_demand*scl,"name":"Industry Methane","color":0},
          {"kwhd":o.industry.total_coal_demand*scl,"name":"Industry Coal","color":0},
          {"kwhd":o.industry.total_biomass_demand*scl,"name":"Industry Biomas","color":0},
          {"kwhd":o.industry.total_synth_fuel_demand*scl,"name":"Industry Fuel","color":0},
          {"kwhd":o.energy_industry_use.total*scl,"name":"Energy Industry Use","color":0}, 
          
          /*
          // Backup, liquid and gas processes*/
          {"kwhd":o.total_losses.grid*scl,"name":"Grid losses","color":2},
          {"kwhd":o.total_losses.electric_storage*scl,"name":"Store losses","color":2},
          {"kwhd":o.total_losses.electrolysis*scl,"name":"H2 losses","color":2},
          {"kwhd":(o.total_losses.elec_backup)*scl,"name":"Power station losses","color":2},
          {"kwhd":o.total_losses.FT*scl,"name":"FT losses","color":2},
          {"kwhd":(o.total_losses.sabatier+o.total_losses.power_to_X)*scl,"name":"Sabatier losses","color":2},
          {"kwhd":o.total_losses.anaerobic_digestion*scl,"name":"AD losses","color":2},
          {"kwhd":o.total_losses.heating_systems*scl,"name":"Boiler loss","color":2},
          {"kwhd":o.balance.total_spill*scl,"name":"Total spill","color":2},

          /*
          {"kwhd":total_direct_gas_losses/3650,"name":"Direct gas loss","color":2},
          {"kwhd":total_direct_liquid_losses/3650,"name":"Direct liquid loss","color":2},

          {"kwhd":total_liion_losses/3650,"name":"Liion losses","color":2},
          {"kwhd":total_losses*scl,"name":"Losses","color":2},*/
          {"kwhd":o.balance.total_excess*scl,"name":"Excess","color":3}
        ]
      }
    ];
    
    if (!i.include_ambient_heat) {
        stacks[3]["stack"][1]["kwhd"] = (o.space_heating.total_demand+o.water_heating.total_demand-o.heat.total_ambient_supply)*scl;
        stacks[3]["stack"][1]["name"] = "Space & Water heat"
        stacks[3]["stack"][2]["kwhd"] = 0;
    }
    
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
	
function model_view()
{
    if (view_mode=="electricity")
    {
        console.log("view mode electric")
        $.plot("#placeholder", [

            // {label: "Heatstore", data:timeseries(d.heatstore, color:"#cc3311"},

            {stack:true, label: "Lighting & Appliances", data:timeseries(d.lac_demand), color:"#0044aa"},
            {stack:true, label: "Industry & Cooking", data:timeseries(d.industrial_elec_demand), color:"#1960d5"},
            {stack:true, label: "Electric Heat", data:timeseries(d.spacewater_elec), color:"#cc6622"},
            {stack:true, label: "Electric Transport", data:timeseries(d.EL_transport), color:"#aac15b"},
            {stack:true, label: "Elec Store Charge", data:timeseries(d.elec_store_charge), color:"#006a80"},
            {stack:true, label: "Electrolysis", data:timeseries(d.electricity_for_electrolysis), color:"#00aacc"},
            {stack:true, label: "PowerToX", data:timeseries(d.electricity_for_power_to_X), color:"#00bbdd"},
            {stack:true, label: "Excess", data:timeseries(d.excess_elec), color:"#33ccff", lines: {lineWidth:0, fill: 0.4 }},            
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
                // {stack:true, label: "Heat Store", data:timeseries(d.heatstore_SOC), yaxis:3, color:"#cc3311", lines: {lineWidth:0, fill: 0.8 }},
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
                // {stack:false, label: "Heat Store", data:timeseries(d.heatstore_SOC), yaxis:2, color:"#cc3311", lines: {lineWidth:1, fill: false }},
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
                // {stack:true, label: "Heatstore discharge", data:timeseries(d.heatstore_discharge_GWth), color:"#a3511b", lines: {lineWidth:0, fill: 1.0 }} ,
                // {stack:false, label: "Heatstore SOC", data:timeseries(d.heatstore_SOC), yaxis:2, color:"#cc3311", lines: {lineWidth:1, fill: false }},
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

$("body").bind("plotselected","#placeholder", function (event, ranges) {
    view.start = ranges.xaxis.from*0.001;
    view.end = ranges.xaxis.to*0.001;
    view.calc_interval();
    model_view();
});

$("body").bind("plothover","#placeholder", function (event, pos, item) {
    if (item) {
        if (previousPoint != item.datapoint) {
            previousPoint = item.datapoint;
            $("#tooltip").remove();
            tooltip(item.pageX, item.pageY, item.datapoint[1].toFixed(3), "#DDDDDD");
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
