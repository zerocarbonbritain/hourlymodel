// Compare the clean_power_2030 scenario's costs with the NESO Clean Power 2030 cost analysis.
// Usage (from the repository root): node docs/clean_power_2030_costs.js
//
// NESO (Annex 4, data workbook CP.13 and CP.14) gives a 2030 system cost for Great Britain in real
// 2024 prices. It counts capital only for capacity added since 2023, annualised at each technology's
// WACC over its life, plus fixed and variable O&M on all capacity, fuel at about 100 p/therm, carbon at
// £147/tCO2, constraints, net trade and the annualised cost of new network investment plus network
// O&M. It divides by consumer load plus electrolysis. This script rebuilds that boundary from the
// model's flows and cost inputs. Method and results are in docs/clean-power-2030-notes.md.
var fs = require("fs");
var vm = require("vm");
var JSZip = require("jszip");

normalise_profile = function(profile) {
    var sum = 0;
    for (var z = 0; z < 24; z++) sum += profile[z];
    for (var z = 0; z < 24; z++) profile[z] /= sum;
    return profile;
}
vm.runInThisContext(fs.readFileSync("defaults.js"));
vm.runInThisContext(fs.readFileSync("model.js"));
vm.runInThisContext(fs.readFileSync("cost_model.js"));

function merge(obj, changes) {
    for (let key in changes) {
        if (typeof changes[key] === "object" && changes[key] !== null && !Array.isArray(changes[key])) merge(obj[key], changes[key]);
        else obj[key] = changes[key];
    }
}
i = JSON.parse(fs.readFileSync("scenarios/zcb_2024.json"));
merge(i, JSON.parse(fs.readFileSync("scenarios/clean_power_2030.json")));

// NESO, Further Flex and Renewables, 2030 annuitised system cost (CP.14, £/MWh) and average annual
// investment 2025 to 2030 (CP.13, £bn/yr). Useful energy is consumer load (Annex 4 figure 7, 289 TWh)
// plus electrolysis (ES1, 14.9 TWh).
const NESO = {
    useful_TWh: 289 + 14.863,
    per_MWh: { capacity: 85.95, fuel: 11.2, carbon: 7.66, constraints: 12.08, trade: -2.24, network: 18.01 },
    investment: { generation: 33.998, offshore_network: 6.314, transmission: 4.684, distribution: 3.386 },
    gas_p_therm: 100, carbon_gbp_t: 147
};
const P_THERM_TO_P_KWH = 1 / 29.3071;

// Capacity in 2023 (NESO table 2, GB) plus Northern Ireland onshore wind. Capacity above this is new.
// Storage in 2023: pumped hydro 2.8 GW and 28 GWh, batteries 4.7 GW at about 1.4 hours.
const EXISTING = {
    "Offshore wind": 14.7, "Onshore wind": 13.7 + 1.4, "Solar PV": 15.1, "Nuclear": 6.1, "Hydro": 1.9,
    "Tidal": 0, "H2 Electrolysis": 0, "CCGT": 37.4, "OCGT": 0,
    "Electric Storage": 28 + 6.8, "Battery inverter": 2.8 + 4.7, "Hydrogen storage": 0
};

function load(name, cb) {
    JSZip.loadAsync(fs.readFileSync(name)).then(zip => zip.file(name.replace(".zip", "")).async("string"))
        .then(text => cb(text.split(/\r\n|\n/)));
}

// Capital part of the annual cost per kW (£/kW/yr): two ways
function capital_desnz(c) { return levelised_fixed_cost(Object.assign({}, c, { fixed_om: 0 })) }
function capital_annuity(c) {
    let r = c.hurdle_rate * 0.01;
    return (c.predev_cost + c.capex) * r / (1 - Math.pow(1 + r, -c.lifespan));
}

load("highresolution.csv.zip", lines => {
    tenyearsdatalines = lines;
    load("temperature.csv.zip", lines2 => {
        temperaturelines = lines2;
        model.init();
        model.run();
        report();
    });
});

function report() {
    const k = o.GWh_to_TWhy;
    let consumer_TWh = (o.balance.total_electricity_demand - o.total_losses.grid
        - o.hydrogen.total_electricity_for_electrolysis
        - (o.electric_storage.total_charge - o.electric_storage.total_discharge)) * k;
    let electrolysis_TWh = o.hydrogen.total_electricity_for_electrolysis * k;
    let useful_TWh = consumer_TWh + electrolysis_TWh;

    // Capacity costs on the NESO boundary
    let rows = [], cap = { desnz: 0, annuity: 0, fixed: 0, variable: 0, overnight: 0 };
    for (let z in EXISTING) {
        let c = i.costs[z], oc = o.costs[z];
        if (!c || !oc) continue;
        let added = Math.max(oc.capacity - EXISTING[z], 0);
        let row = {
            tech: z, capacity: oc.capacity, added: added,
            desnz: added * capital_desnz(c) * 0.001,
            annuity: added * capital_annuity(c) * 0.001,
            fixed: oc.capacity * c.fixed_om * 0.001,
            variable: oc.generation * c.variable_om * 0.001,
            overnight: added * (c.predev_cost + c.capex) * 0.001
        };
        for (let key of ["desnz", "annuity", "fixed", "variable", "overnight"]) cap[key] += row[key];
        rows.push(row);
    }

    // Fuel and carbon at NESO's prices. Gas price from p/therm, other fuels at the model's prices.
    let gas_fuel = o.methane.ccgt_methane_from_fossil_gas * k;           // TWh/yr
    let biomass_fuel = o.electric_backup.total_biomass_turbine_output * k / (i.electric_backup.biomass_efficiency * 0.01);
    let coal_fuel = o.fossil_fuels.coal_for_dispatchable * k;
    let gas_price = NESO.gas_p_therm * P_THERM_TO_P_KWH;                 // p/kWh
    let fuel = 0.01 * (gas_fuel * gas_price + biomass_fuel * i.fuel_prices.biomass + coal_fuel * i.fuel_prices.coal);
    let co2 = gas_fuel * i.co2_factors.gas + coal_fuel * i.electric_backup.coal_co2_factor;  // Mt
    let carbon_neso = co2 * NESO.carbon_gbp_t * 0.001;
    let carbon_model = co2 * i.carbon_price * 0.001;

    // Imports at the scenario's import price. The model has no exports, so no export credit.
    let imports = o.supply.total_imports * k * i.generation_costs.price_gbp_MWh.imports * 0.001;

    let neso = {}, neso_total = 0;
    for (let z in NESO.per_MWh) { neso[z] = NESO.per_MWh[z] * NESO.useful_TWh * 0.001; neso_total += neso[z]; }

    let f = (x, d = 2) => x.toFixed(d).padStart(8);
    console.log("Useful energy (TWh/yr): NESO " + NESO.useful_TWh.toFixed(1) + " GB, model " + useful_TWh.toFixed(1)
        + " UK (consumer " + consumer_TWh.toFixed(1) + ", electrolysis " + electrolysis_TWh.toFixed(1) + ")");
    console.log("\nCapacity costs on the NESO boundary (£bn/yr)");
    console.log("Technology            GW   added  capital(DESNZ) capital(annuity)  fixed O&M  var O&M  overnight £bn");
    for (let r of rows) console.log(r.tech.padEnd(18) + f(r.capacity, 1) + f(r.added, 1) + f(r.desnz) + "       " + f(r.annuity) + "      " + f(r.fixed) + f(r.variable) + "  " + f(r.overnight, 1));
    console.log("Total".padEnd(34) + f(cap.desnz) + "       " + f(cap.annuity) + "      " + f(cap.fixed) + f(cap.variable) + "  " + f(cap.overnight, 1));

    // AR7 strike prices (zcb_2024 preset) paid on the output of new capacity, in place of its capital
    // and O&M. Output is shared between new and existing plant by capacity. Existing plant keeps O&M.
    const STRIKE = JSON.parse(fs.readFileSync("scenarios/zcb_2024.json")).generation_costs.price_gbp_MWh;
    const STRIKE_KEY = { "Offshore wind": "offshore_wind", "Onshore wind": "onshore_wind", "Solar PV": "solar", "Tidal": "tidal" };
    let strike_change = 0;
    console.log("\nAR7 strike prices on new output (£bn/yr)");
    for (let r of rows) {
        let key = STRIKE_KEY[r.tech];
        if (!key || r.added == 0) continue;
        let oc = o.costs[r.tech], c = i.costs[r.tech];
        let new_TWh = oc.generation * r.added / r.capacity;
        let paid = new_TWh * STRIKE[key] * 0.001 + (r.capacity - r.added) * c.fixed_om * 0.001;
        let build = r.annuity + r.fixed + r.variable;
        strike_change += paid - build;
        console.log(r.tech.padEnd(18) + f(new_TWh, 1) + " TWh at £" + STRIKE[key] + "/MWh, with existing O&M " + f(paid) + "  against build-up " + f(build));
    }

    let capacity_desnz = cap.desnz + cap.fixed + cap.variable;
    let capacity_annuity = cap.annuity + cap.fixed + cap.variable;
    console.log("\nCost by component (£bn/yr, and £/MWh of useful energy)");
    let line = (name, n, m) => console.log(name.padEnd(42) + f(n) + f(1000 * n / NESO.useful_TWh, 1) + "   " + (m === null ? "     n/a        " : f(m) + f(1000 * m / useful_TWh, 1)));
    console.log("".padEnd(42) + "    NESO £bn  £/MWh   Model £bn  £/MWh");
    line("Capacity, DESNZ levelised method", neso.capacity, capacity_desnz);
    line("Capacity, simple annuity at hurdle rates", neso.capacity, capacity_annuity);
    line("Capacity, AR7 prices on new output", neso.capacity, capacity_annuity + strike_change);
    line("Fuel (gas at NESO price)", neso.fuel, fuel);
    line("Carbon at £147/t", neso.carbon, carbon_neso);
    line("Constraints", neso.constraints, null);
    line("Net import/export", neso.trade, imports);
    line("Network", neso.network, null);
    let model_known = capacity_annuity + fuel + carbon_neso + imports;
    let model_with_neso = model_known + neso.constraints + neso.network;
    line("Total (model with NESO network, constraints)", neso_total, model_with_neso);
    line("Total with AR7 prices on new output", neso_total, model_with_neso + strike_change);
    console.log("\nCarbon at the scenario's £" + i.carbon_price + "/t: £" + carbon_model.toFixed(2) + "bn. Emissions " + co2.toFixed(2) + " MtCO2.");

    // Whole system on the model's own terms
    console.log("\nWhole system, model terms (£bn/yr)");
    console.log("Build-up, every plant at new-build cost (o.total_annual_cost): " + o.total_annual_cost.toFixed(2));
    console.log("Selected generation costs, as built (" + i.generation_costs.basis + " basis): " + o.generation_costs.total_annual.toFixed(2));
    let gc = o.generation_costs.by_tech;
    for (let z in gc) if (gc[z].annual > 0.01) console.log("  " + z.padEnd(14) + f(gc[z].generation, 1) + " TWh " + f(gc[z].price || 0, 1) + " £/MWh " + f(gc[z].annual) + " £bn  LCOE " + f(gc[z].lcoe || 0, 1));

    console.log("\nInvestment: NESO average 2025 to 2030 (£bn/yr): generation " + NESO.investment.generation.toFixed(1)
        + ", networks " + (NESO.investment.offshore_network + NESO.investment.transmission + NESO.investment.distribution).toFixed(1));
    console.log("Model overnight cost of capacity added since 2023: £" + cap.overnight.toFixed(1) + "bn, £" + (cap.overnight / 6).toFixed(1) + "bn/yr over six years");
}
