// Command line scenario runner. Usage: node run_scenario.js [scenario_name | path.json] [--json]
// --json prints the numeric outputs in o as JSON, keeping nesting and leaving out arrays.
var fs = require("fs");
var vm = require('vm');
var JSZip = require("jszip");
var dir = "./";

normalise_profile = function(profile) {
    var sum = 0;
    for (var z=0; z<24; z++) sum += profile[z];
    for (var z=0; z<24; z++) profile[z] /= sum;
    return profile;
}

vm.runInThisContext(fs.readFileSync(dir+"defaults.js"));
vm.runInThisContext(fs.readFileSync(dir+"model.js"));

var args = process.argv.slice(2);
var json_output = args.indexOf("--json") != -1;
var scenario_name = args.filter(a => a != "--json")[0] || "baseline_2018";
var scenario_path = scenario_name.endsWith(".json") ? scenario_name : dir+"scenarios/"+scenario_name+".json";
var default_scenario = JSON.parse(fs.readFileSync(dir+"scenarios/zerocarbonbritain.json"));
var overrides = JSON.parse(fs.readFileSync(scenario_path));

function updateScenario(obj, changes) {
    for (let key in changes) {
        if (typeof changes[key] === "object" && changes[key] !== null && !Array.isArray(changes[key])) {
            updateScenario(obj[key], changes[key]);
        } else {
            obj[key] = changes[key];
        }
    }
}
updateScenario(default_scenario, overrides);
i = default_scenario;

function load_dataset(filename,callback) {
    fs.readFile(dir+filename, function(err, data) {
        if (err) throw err;
        JSZip.loadAsync(data).then(function (zip) {
            zip.file(filename.replace(".zip","")).async("string")
            .then(function (content) { callback(content.split(/\r\n|\n/)); });
        });
    });
}

load_dataset("highresolution.csv.zip",function(result){
    tenyearsdatalines = result;
    capacityfactors_all = [];
    for (var hour = 0; hour < 87648; hour++) {
        var capacityfactors = tenyearsdatalines[hour].split(",");
        for (var x=0; x<capacityfactors.length; x++) capacityfactors[x] = parseFloat(capacityfactors[x]);
        capacityfactors_all.push(capacityfactors);
    }
    load_dataset("temperature.csv.zip",function(result) {
        temperaturelines = result;
        model.init();
        model.run();
        if (json_output) {
            // Numbers and nested objects of numbers, without arrays
            function numbers(obj) {
                var out = {};
                for (let key in obj) {
                    let v = obj[key];
                    if (typeof v === "number") out[key] = v;
                    else if (v && typeof v === "object" && !Array.isArray(v)) out[key] = numbers(v);
                }
                return out;
            }
            console.log(JSON.stringify(numbers(o)));
            return;
        }
        var GWh_to_TWhyr = 1/(10*1000);  // 10 year totals in GWh to TWh/yr
        console.log("Scenario: " + scenario_name);
        console.log("Electricity demand (TWh/yr): " + (o.balance.total_electricity_demand*GWh_to_TWhyr).toFixed(1));
        console.log("Onshore wind CF: " + (o.supply.onshore_wind_capacity_factor*100).toFixed(1) + "%");
        console.log("Offshore wind CF: " + (o.supply.offshore_wind_capacity_factor*100).toFixed(1) + "%");
        console.log("Solar PV CF: " + (o.supply.solarpv_capacity_factor*100).toFixed(1) + "%");
        console.log("Space heating demand (TWh/yr): " + (o.space_heating.total_demand*GWh_to_TWhyr).toFixed(1));
        console.log("Water heating demand (TWh/yr): " + (o.water_heating.total_demand*GWh_to_TWhyr).toFixed(1));
        console.log("Industry demand (TWh/yr): " + o.industry.total_demand.toFixed(1));
        console.log("Total emissions (MtCO2e): " + o.emissions_balance.total.toFixed(1));
        console.log("Grid CO2 intensity (gCO2/kWh): " + o.emissions_balance.grid_co2_intensity.toFixed(1));
    });
});
