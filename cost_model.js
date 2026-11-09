// ---------------------------------------------------------------------------------------------
// ZeroCarbonBritain hourly energy model v3: cost model
//
// Load this file after model.js. It adds the cost steps to the model object. model.run() and
// model.update_non_hourly() call model.cost_model() once the energy flows are known.
//
// THE QUESTION THIS FILE ANSWERS
//
// The hourly model works out how much energy flows through each part of the system. This file
// works out what those flows cost, and who pays. It builds the cost in the same order as the
// real system:
//
//   1. Build-up        What each technology costs to build and run, per year.
//   2. System cost     What generators and fuel plants are paid: a price per MWh or the build-up.
//   3. Hourly prices   What electricity is worth in each hour, from what is at the margin.
//   4. Fuel costs      What hydrogen, methane and synthetic fuel cost to make at those prices.
//   5. Retail          What electricity users and fuel users pay after networks, policy and VAT.
//   6. Fossil fuel     What the UK paid for fossil fuel in 2024, and this scenario's fossil bill.
//   7. Total cost      The cost to consumers, and the cost to society.
//
// UNITS
//
// Each conversion below follows from these definitions. 1 TWh is 1,000,000 MWh. 1 GW is
// 1,000,000 kW. £1bn is £1,000 million.
//
//   TWh/yr x £/MWh x 0.001   = £bn/yr     (TWh x £/MWh gives £ million)
//   GW x £/kW/yr x 0.001     = £bn/yr     (GW x £/kW gives £ million)
//   TWh/yr x p/kWh x 0.01    = £bn/yr     (1 TWh is 1e9 kWh, and 100p is £1)
//   GWh x £/MWh x 1e-6       = £bn        (1 GWh is 1,000 MWh)
//   £bn/yr / TWh/yr x 100    = p/kWh
//   £bn/yr / TWh/yr x 1000   = £/MWh
//   £/MWh x 0.1              = p/kWh
//
// The model runs over several weather years, so most flows are totals in GWh over the whole run.
// o.GWh_to_TWhy converts a total to TWh per year, and o.per_year converts other totals to per year.
// All money is in 2024 prices.
//
// INPUTS AND OUTPUTS
//
//   i   Scenario inputs (from scenarios/*.json)
//   o   Results, shown on the page and read by the validation checks
//   d   Hourly series, one value per hour
//
// WHAT THE COSTS LEAVE OUT
//
// The cost covers energy supply, networks and retail. It leaves out heat pumps, boilers, building
// retrofit, vehicles and other equipment on the demand side, so neither total is yet the full cost
// of a scenario. baseline/open-items.md lists this and the other known limits under "Cost model".
// docs/cost-assumptions.md records the source of each cost.
// ---------------------------------------------------------------------------------------------

// Heat rows in i.costs. They make or deliver heat, so they stay out of electricity system totals.
const SOLAR_THERMAL = ['Solar thermal rooftop', 'Solar thermal large-scale']
const HEAT_ROWS = SOLAR_THERMAL.concat(['Heat network'])

Object.assign(model, {

    // Run every step in order. Each step reads the results of the steps before it.
    cost_model: function() {
        let backup = model.build_up_costs()
        model.generation_costs(backup)

        let price_classes = model.hourly_prices()
        let electricity_for_fuel = model.price_summary(price_classes)
        let fossil_share = model.fossil_share_of_fuel_sold()
        model.fuel_production_costs(electricity_for_fuel, fossil_share)

        o.retail = {}
        let hydrogen = model.hydrogen_in_fuel_sold()
        model.electricity_retail(hydrogen)
        model.fuel_prices(hydrogen)
        model.gas_retail()
        model.road_fuel_retail(fossil_share)

        model.fossil_reference()
        model.fossil_bill(fossil_share)
        model.heat_and_biomass()
        model.household_energy(fossil_share)
        model.total_cost()
    },

    // -----------------------------------------------------------------------------------------
    // 1. Build-up: what each technology costs to build and run
    //
    // This is the cost from first principles. Each technology has a capacity and an output, and
    // i.costs gives its capital cost, running costs and life. The annual cost is:
    //
    //   annual cost = capacity x annual fixed cost + output x variable O&M
    //
    // The annual fixed cost turns the capital cost into an equal yearly payment, like a mortgage
    // (see levelised_fixed_cost below). Dividing the annual cost by output gives the levelised
    // cost of energy (LCOE).
    //
    // Returns the backup turbine and fuel costs, which the next step shares between fuels.
    // -----------------------------------------------------------------------------------------
    build_up_costs: function() {
        let to_TWh = o.GWh_to_TWhy
        let supply = o.supply
        let backup_output = o.electric_backup
        let backup_input = i.electric_backup

        // Capacity and output of each technology. Capacity is in GW, or GWh for stores, to match
        // costs per kW or per kWh. Output is in TWh/yr. Plants that make fuel have zero output
        // here, which leaves variable O&M out and gives no LCOE.
        o.costs = {}
        o.costs['Onshore wind'] = { capacity: i.supply.onshore_wind_capacity, generation: supply.total_onshore_wind * to_TWh }
        o.costs['Offshore wind'] = { capacity: i.supply.offshore_wind_capacity, generation: supply.total_offshore_wind * to_TWh }
        o.costs['Solar PV'] = { capacity: i.supply.solarpv_capacity, generation: supply.total_solarpv * to_TWh }
        o.costs['Tidal'] = { capacity: i.supply.tidal_capacity, generation: supply.total_tidal * to_TWh }
        o.costs['Wave'] = { capacity: i.supply.wave_capacity, generation: supply.total_wave * to_TWh }
        o.costs['Geothermal Electric'] = { capacity: i.supply.geothermal_elec_capacity, generation: supply.total_geothermal_elec * to_TWh }
        o.costs['Nuclear'] = { capacity: i.supply.nuclear_capacity, generation: supply.total_nuclear * to_TWh }
        o.costs['Hydro'] = { capacity: i.supply.hydro_capacity, generation: supply.total_hydro * to_TWh }
        o.costs['H2 Electrolysis'] = { capacity: i.hydrogen.electrolysis_capacity_GW, generation: 0 }
        o.costs['Methanation'] = { capacity: i.methane.methanation_capacity, generation: 0 }

        // Backup turbines are sized by the hour of highest need. Some plant is always out of
        // action, so the fleet has to be larger than that peak. A de-rating factor of 0.9 means
        // 1 GW of plant counts as 0.9 GW of reliable capacity, so capacity is the peak divided by
        // the factor. OCGT runs only when CCGT is full, so OCGT covers its own peak output and
        // CCGT covers the rest of the peak.
        o.costs['CCGT'] = {
            capacity: (backup_output.max_capacity_requirement - backup_output.max_ocgt_output) / backup_input.ccgt_derating_factor,
            generation: (backup_output.total_before_grid_loss - backup_output.total_ocgt_output) * to_TWh
        }
        o.costs['OCGT'] = {
            capacity: backup_output.max_ocgt_output / backup_input.ocgt_derating_factor,
            generation: backup_output.total_ocgt_output * to_TWh
        }
        o.costs['Power to X'] = { capacity: i.power_to_X.capacity, generation: 0 }

        // A battery has two costs: cells for the energy it holds (per kWh) and an inverter for
        // the power it moves (per kW). One inverter handles both directions, so it is sized by
        // the larger of charge and discharge capacity.
        o.costs['Electric Storage'] = { capacity: i.electric_storage.capacity_GWh, generation: o.electric_storage.total_discharge * to_TWh }
        o.costs['Battery inverter'] = { capacity: Math.max(i.electric_storage.charge_capacity_GW, i.electric_storage.discharge_capacity_GW), generation: 0 }

        // Anaerobic digestion runs at a flat rate. Average GW is TWh/yr divided by 8.766 thousand
        // hours in a year. Plants run 90% of the time, so capacity is the average divided by 0.9.
        let biogas_methane_TWh = i.biogas.biomass_for_biogas * i.biogas.anaerobic_digestion_efficiency
        o.costs['Anaerobic digestion'] = { capacity: biogas_methane_TWh / 8.766 / 0.9, generation: biogas_methane_TWh }

        // FT capacity is measured as hydrogen in, and its output is synthetic fuel out.
        o.costs['FT synthetic fuel'] = { capacity: i.synth_fuel.capacity_GW, generation: o.synth_fuel.total_produced * to_TWh }

        // Fuel stores in GWh, with costs per kWh. The CO2 store is in Mt, with its cost per tonne.
        o.costs['Hydrogen storage'] = { capacity: i.hydrogen.storage_capacity_GWh, generation: 0 }
        o.costs['Methane storage'] = { capacity: i.methane.storage_capacity_GWh, generation: 0 }
        o.costs['Synthetic fuel storage'] = { capacity: i.synth_fuel.store_capacity_GWh, generation: 0 }
        o.costs['CO2 storage'] = { capacity: i.methane.co2_store_capacity_t * 1e-6, generation: 0 }

        // Solar thermal makes heat, not electricity, so output is heat in TWh/yr. The supply input is
        // in GW of solar PV equivalent, which sets the hourly profile and the heat. Thermal capacity
        // follows from the heat: TWh x 1e9 / (kWh per m2) gives m2 of collector, and m2 x kWth per m2
        // / 1e6 gives GW. Rooftop panels on single buildings and large ground arrays feeding heat
        // networks have very different costs, so the heat is split between them.
        let hb = i.heat_and_biomass
        let solar_TWh = supply.total_solarthermal * to_TWh
        let rooftop_share = hb ? hb.solar_thermal_rooftop_prc * 0.01 : 1
        let thermal_GW = (TWh, kWh_m2) => hb && kWh_m2 > 0 ? TWh * 1000 * hb.solar_thermal_kWth_per_m2 / kWh_m2 : 0
        o.costs['Solar thermal rooftop'] = { capacity: thermal_GW(solar_TWh * rooftop_share, hb && hb.solar_thermal_rooftop_kWh_m2), generation: solar_TWh * rooftop_share }
        o.costs['Solar thermal large-scale'] = { capacity: thermal_GW(solar_TWh * (1 - rooftop_share), hb && hb.solar_thermal_large_kWh_m2), generation: solar_TWh * (1 - rooftop_share) }

        // Heat networks carry heat from large solar arrays and deep geothermal to buildings.
        // Capacity is peak heat in GW: average heat (TWh / 8.766) over the network load factor.
        let network_TWh = solar_TWh * (1 - rooftop_share) + supply.total_geothermal_heat * to_TWh
        o.costs['Heat network'] = { capacity: hb ? network_TWh / 8.766 / hb.heat_network_load_factor : 0, generation: network_TWh }

        // Compressors and pumps that move fuel in and out of stores, sized by the largest hourly flow
        o.costs['Hydrogen compressor'] = { capacity: o.hydrogen.max_store_charge, generation: 0 }
        o.costs['Methane store charging'] = { capacity: o.methane.max_store_charge, generation: 0 }
        o.costs['Methane store discharging'] = { capacity: o.methane.max_store_discharge, generation: 0 }

        // Annual cost and LCOE of each technology. o.total_annual_cost adds up the build-up for
        // the electricity and fuel system, as a comparison with the costs actually paid in the next
        // step. Heat rows are left out of that total.
        o.total_annual_cost = 0;
        for (var z in i.costs) {
            let c = o.costs[z]
            c.annual = c.capacity * 0.001 * annual_fixed_cost(i.costs[z], i.annualisation) + c.generation * 0.001 * i.costs[z].variable_om
            c.LCOE = c.generation > 0 ? 1000 * c.annual / c.generation : 0
            if (!HEAT_ROWS.includes(z)) o.total_annual_cost += c.annual
        }

        // Feedstocks. Crop feedstock for biogas is the grass above the waste share in land_use,
        // priced per MWh of methane. Waste feedstock is free. FT biomass is priced per MWh of
        // biomass.
        o.biogas_feedstock_annual = o.biomass.grass_for_biogas * i.biogas.anaerobic_digestion_efficiency * i.biogas.crop_feedstock_gbp_MWh * 0.001
        o.total_annual_cost += o.biogas_feedstock_annual
        o.ft_biomass_annual = o.synth_fuel.total_biomass_used * to_TWh * i.synth_fuel.biomass_gbp_MWh * 0.001
        o.total_annual_cost += o.ft_biomass_annual

        // Fuel and carbon for backup turbines. Each entry is the fuel burned (GWh over the run),
        // its price (p/kWh) and its CO2 factor (t/MWh). GWh x t/MWh gives thousands of tonnes, so
        // 0.001 gives Mt. Mt x £/t gives £ million, so 0.001 gives £bn. Synthetic methane has no
        // entry here, as its cost is in fuel production.
        let biomass_for_backup = o.electric_backup.total_biomass_turbine_output / (i.electric_backup.biomass_efficiency * 0.01)
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
        o.backup_fuel_burned = Object.values(backup_fuel).some(([fuel]) => fuel > 0)
        o.total_annual_cost += o.fuel_cost_annual + o.carbon_cost_annual

        // Summary figures: the LCOE of backup, and of all electricity demand
        let turbines = { annual: o.costs['CCGT'].annual + o.costs['OCGT'].annual, generation: o.costs['CCGT'].generation + o.costs['OCGT'].generation }
        o.backup_LCOE = turbines.generation > 0 ? 1000 * (turbines.annual + o.fuel_cost_annual + o.carbon_cost_annual) / turbines.generation : 0
        o.LCOE = 1000 * o.total_annual_cost / (o.balance.total_electricity_demand * o.GWh_to_TWhy)

        return { turbines_annual: turbines.annual, fuel_annual: backup_fuel_annual }
    },

    // -----------------------------------------------------------------------------------------
    // 2. System cost: what generators and fuel plants are paid
    //
    // Generators are not always paid what they cost to build. An offshore wind farm may hold a
    // Contract for Difference at a strike price, and a 2024 gas plant earns the market price. So
    // each technology has two possible costs:
    //
    //   price      output x a price per MWh (a strike price, or market value plus support)
    //   build-up   the annual cost from step 1
    //
    // With basis "price", a technology with a price uses it, and one without uses the build-up.
    // With basis "lcoe", every technology uses the build-up. Imports have no build-up, so they
    // always use their price. Fuel production always uses the build-up.
    //
    // Output here is before curtailment. Plant has to be paid for in full, even when its output
    // is not used, so the cost of building more than demand needs stays in the system cost.
    // -----------------------------------------------------------------------------------------
    generation_costs: function(backup) {
        let basis_inputs = i.generation_costs
        let eb = o.electric_backup

        // All fuels share the backup turbine fleet, so each pays for it in proportion to its
        // output, and also pays for its own fuel and carbon.
        let backup_total_output = eb.total_before_grid_loss
        let turbine_share = (output) => backup_total_output > 0 ? backup.turbines_annual * output / backup_total_output : 0

        // Build-up of one technology, or the sum of a list of technologies
        let build_up = (key) => Array.isArray(key) ? key.reduce((sum, k) => sum + build_up(k), 0) : (o.costs[key] && o.costs[key].annual) || 0

        // Each row is [output in GWh over the run, where its build-up comes from]. The second item
        // is a name in o.costs, a list of names, a function for backup fuels, or null for none.
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
            gas: [eb.total_methane_turbine_output, () => turbine_share(eb.total_methane_turbine_output) + backup.fuel_annual.gas],
            biomass: [eb.total_biomass_turbine_output, () => turbine_share(eb.total_biomass_turbine_output) + backup.fuel_annual.biomass],
            coal_other: [eb.total_coal_turbine_output, () => turbine_share(eb.total_coal_turbine_output) + backup.fuel_annual.coal_other],
            oil: [eb.total_synth_fuel_turbine_output, () => turbine_share(eb.total_synth_fuel_turbine_output) + backup.fuel_annual.oil],
            hydrogen: [eb.total_hydrogen_turbine_output, () => turbine_share(eb.total_hydrogen_turbine_output)],
            storage: [o.electric_storage.total_discharge, ['Electric Storage', 'Battery inverter']]
        }

        // "used" marks the build-up rows that enter the total, which are the rows the page shows
        for (let z in o.costs) o.costs[z].used = false
        o.generation_costs = { by_tech: {}, total_annual: 0, backup_fuel_used: false }

        for (let z in techs) {
            let [output, cost] = techs[z]
            let generation = output * o.GWh_to_TWhy
            let has_build_up = cost !== null
            let lcoe_annual = typeof cost === 'function' ? cost() : build_up(cost)
            let price = basis_inputs.price_gbp_MWh[z]
            let priced = price !== null && price !== undefined

            // The choice between price and build-up
            let uses_build_up = has_build_up && (basis_inputs.basis == "lcoe" || !priced)
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

            // Load factor of a fixed generator: TWh/yr over GW x 8.766 thousand hours
            if (typeof cost === 'string' && o.costs[cost].capacity > 0) {
                row.load_factor = generation / (o.costs[cost].capacity * 8.766)
            }

            // A check on the price: what would the build-up need for it to equal this price? The
            // target is the money per kW left after variable O&M. The implied hurdle rate is the
            // return that reproduces it, and the implied capex is the construction cost that does.
            if (typeof cost === 'string' && priced && generation > 0 && o.costs[cost].capacity > 0) {
                let target = generation * (price - i.costs[cost].variable_om) / o.costs[cost].capacity
                row.implied_hurdle = implied_hurdle_rate(i.costs[cost], target)
                row.implied_capex = implied_capex(i.costs[cost], target)
            }

            o.generation_costs.by_tech[z] = row
            o.generation_costs.total_annual += annual
        }

        // Fuel production: plant, stores and their power, and feedstocks. The electricity these
        // plants use is already in the cost of the generators above.
        let fuel_production = ['H2 Electrolysis', 'Methanation', 'Power to X', 'Anaerobic digestion', 'FT synthetic fuel', 'Hydrogen storage', 'Methane storage', 'Synthetic fuel storage', 'CO2 storage', 'Hydrogen compressor', 'Methane store charging', 'Methane store discharging']
        o.generation_costs.fuel_production_annual = o.biogas_feedstock_annual + o.ft_biomass_annual
        for (let z of fuel_production) {
            o.costs[z].used = true
            o.generation_costs.fuel_production_annual += build_up(z)
        }

        // Solar thermal and heat networks are paid for by heat users, not on electricity bills, so
        // they are in the build-up table but not in the system cost. See heat_and_biomass.
        for (let z of HEAT_ROWS) o.costs[z].used = true

        // The system cost is everything so far. Networks are added at the retail step.
        o.generation_costs.total_annual += o.generation_costs.fuel_production_annual + basis_inputs.other_support_gbp_bn
    },

    // -----------------------------------------------------------------------------------------
    // 3. Hourly prices: what electricity is worth in each hour
    //
    // The price in an hour is what one more MWh would cost, or what one less MWh would save. That
    // depends on what is at the margin:
    //
    //   backup              a turbine is running, so one more MWh burns more fuel
    //   curtail             power is being thrown away, so one more MWh costs nothing
    //   electrolysis        one more MWh for demand means one less MWh of hydrogen
    //   battery_charge      the battery is charging, so it sets the price from later hours
    //   battery_discharge   the battery is discharging, so it sets the price from later hours
    //
    // i.fuel_values gives the value of fuel at the margin, which is not the same as what fuel costs
    // to make. These values are inputs from a PyPSA optimisation, and scripts/price_check.py in
    // ZCB_PyPSA compares the resulting prices with PyPSA at equal capacities.
    //
    // Sets d.electricity_price, and returns the class of each hour.
    // -----------------------------------------------------------------------------------------
    hourly_prices: function() {
        let fv = i.fuel_values
        let eb = i.electric_backup

        // Prices are per MWh reaching the user, so a turbine's cost is divided by the share of
        // its output that survives grid losses and own use.
        let glf = 1.0-((i.energy_industry_use.electricity_grid_loss_prc + i.energy_industry_use.electricity_own_use_prc)*0.01)

        // A turbine MWh costs the fuel it burns (fuel value / efficiency) plus variable O&M
        let turbine_price = (efficiency, tech) => (fv.methane_gbp_MWh / (efficiency*0.01) + i.costs[tech].variable_om) / glf
        let ccgt_price = turbine_price(eb.methane_efficiency, 'CCGT')
        let ocgt_price = turbine_price(eb.ocgt_efficiency, 'OCGT')

        // A MWh of electricity makes a fraction of a MWh of hydrogen. It is worth that fraction
        // of the hydrogen value.
        let electrolysis_price = i.hydrogen.electrolysis_efficiency * fv.hydrogen_gbp_MWh
        let round_trip = i.electric_storage.charge_efficiency * i.electric_storage.discharge_efficiency

        // Scarcity adder. The last turbine in the fleet runs for only a few hours, so fuel alone
        // never pays for it. The hours within 10% of peak backup carry its annual cost, shared in
        // proportion to how far each hour is above that threshold. peak_cost is £ per MW of
        // reliable capacity over the whole run: £/kW/yr x 1000 x years, divided by de-rating.
        let peak_tech = o.electric_backup.max_ocgt_output > 0 ? 'OCGT' : 'CCGT'
        let derating = peak_tech == 'OCGT' ? eb.ocgt_derating_factor : eb.ccgt_derating_factor
        let peak_cost = annual_fixed_cost(i.costs[peak_tech], i.annualisation) * 1000 * o.years / derating
        let threshold = 0.9 * o.electric_backup.max_capacity_requirement
        let depth_total = 0
        for (let hour = 0; hour < i.hours; hour++) depth_total += Math.max(d.electricity_from_dispatchable[hour] - threshold, 0)

        // First pass: find the class of each hour, and the price of every class but the battery
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

        // Second pass, backwards through time, for the battery hours. Stored energy is worth the
        // price of the next hour that sets one. Discharging earns that price. Charging pays that
        // price less the round trip loss. In a later hour with surplus power, a MWh charged at the
        // price there delivers only the round trip share, so a stored MWh is worth the price
        // divided by the round trip loss. Charging at the end of the run has no later hour, so it
        // uses the CCGT price.
        let next = ccgt_price
        for (let hour = i.hours - 1; hour >= 0; hour--) {
            if (cls[hour] == 'battery_charge') price[hour] = next * round_trip
            else if (cls[hour] == 'battery_discharge') price[hour] = next
            else next = cls[hour] == 'backup' ? price[hour] : price[hour] / round_trip
        }

        d.electricity_price = price
        return cls
    },

    // Summarise hourly prices: revenue from electricity users, hours and mean price by class, and
    // what offshore wind would earn at these prices. Hours are GW, so GW x £/MWh adds up as
    // GWh x £/MWh, and 1e-6 gives £bn.
    //
    // Returns the electricity bill of the fuel plants, in GWh x £/MWh, for the next step.
    price_summary: function(cls) {
        let price = d.electricity_price
        let glf = 1.0-((i.energy_industry_use.electricity_grid_loss_prc + i.energy_industry_use.electricity_own_use_prc)*0.01)
        let p = o.prices = { hours: {}, mean: {} }
        let revenue = 0, end_use_total = 0, offshore = 0, sum = 0, electrolysis_power = 0, ptx_power = 0
        let offshore_gw = i.supply.offshore_wind_capacity * i.supply.offshore_wind_availability * glf
        for (let z of ['backup', 'curtail', 'electrolysis', 'battery_charge', 'battery_discharge']) p.hours[z] = 0
        let class_sum = {}
        for (let hour = 0; hour < i.hours; hour++) {
            // End use is electricity reaching final users. It leaves out electrolysis, power to X
            // and battery charging, which turn electricity into something else.
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

        // How much of offshore wind's selected cost (strike price or build-up) hourly prices recover.
        // Low recovery shows why support such as a CfD is needed.
        let offshore_cost = o.generation_costs.by_tech.offshore_wind.annual
        p.offshore_recovery = offshore_cost > 0 ? p.offshore_revenue / offshore_cost : 0

        return { electrolysis_power, ptx_power }
    },

    // -----------------------------------------------------------------------------------------
    // 4. Fuel costs: what hydrogen, methane and synthetic fuel cost to make
    //
    // Fuel is costed in a chain, as each fuel feeds the next:
    //
    //   electricity at hourly prices + electrolysers and stores = hydrogen
    //   hydrogen + biogas + methanation plant and stores        = methane
    //   hydrogen + biomass + FT plant and stores                = synthetic fuel
    //
    // Cost per MWh is annual cost divided by fuel used, which is fuel produced less fuel spilled
    // from a full store. Spilled fuel was made for users of that fuel, so they carry its cost. Fuel
    // burned in turbines is not sold to fuel users, so that share stays with electricity users.
    //
    // This step also splits the system cost between fuel users and electricity users.
    // -----------------------------------------------------------------------------------------

    // Final users' demand for gas and liquid fuel, GWh over the run. It can be met by synthetic
    // fuel, or by fossil fuel where the scenario allows it.
    final_fuel_demand: function() {
        return {
            methane: o.industry.total_methane_demand + o.heating_systems.methane.fuel_demand + o.LAC.total_gas,
            synthetic_fuel: o.synth_fuel.total_transport_demand + o.synth_fuel.total_industrial_demand + o.heating_systems.synthfuel.fuel_demand
        }
    },

    // The share of final users' fuel that is bought on the fossil fuel market, from 0 to 1. The
    // dispatch in model.js burns fossil fuel when the fuel stores run out, and records how much.
    // Fossil fuel for turbines is costed in step 1, so it is taken out here. Biofuel is bought on
    // the same market and blended into road fuel, so it counts with liquid fossil fuel.
    fossil_share_of_fuel_sold: function() {
        let demand = model.final_fuel_demand()
        let ff = o.fossil_fuels
        let bought_gas = ff.gas_final_demand - o.methane.ccgt_methane_from_fossil_gas
        let bought_liquid = ff.oil_from_store - o.synth_fuel.backup_from_fossil_oil + o.synth_fuel.total_biofuel_supply
        return {
            gas: demand.methane > 0 ? Math.min(1, bought_gas / demand.methane) : 0,
            liquid: demand.synthetic_fuel > 0 ? Math.min(1, bought_liquid / demand.synthetic_fuel) : 0
        }
    },

    fuel_production_costs: function(electricity_for_fuel, fossil_share) {
        let p = o.prices
        let fv = i.fuel_values
        let sf = i.synth_fuel
        let ptx = i.power_to_X
        let ft = o.costs['FT synthetic fuel']
        let to_TWh = o.GWh_to_TWhy

        let plant = (names) => names.reduce((total, name) => total + o.costs[name].annual, 0)
        let per_MWh = (annual, TWh) => TWh > 0 ? 1000 * annual / TWh : 0

        // Hydrogen: plant, stores and the electricity bill, over all hydrogen produced
        let hydrogen_TWh = o.hydrogen.total_produced * to_TWh
        let hydrogen_cost = per_MWh(plant(['H2 Electrolysis', 'Hydrogen storage', 'Hydrogen compressor']) + electricity_for_fuel.electrolysis_power * 1e-6 * o.per_year, hydrogen_TWh)

        // Where hydrogen goes. o.hydrogen.total_demand is vehicles, FT and methanation, so FT is
        // what is left after the other two.
        let methanation_hydrogen_TWh = o.methane.total_hydrogen_used * to_TWh
        let ft_hydrogen_TWh = (o.hydrogen.total_demand - o.hydrogen.total_vehicle_demand - o.methane.total_hydrogen_used) * to_TWh

        // Power to X makes methane and liquid fuel directly from electricity. Its cost is shared
        // by the output of each.
        let ptx_annual = plant(['Power to X']) + electricity_for_fuel.ptx_power * 1e-6 * o.per_year
        let ptx_output = ptx.prc_gas * ptx.gas_efficiency + ptx.prc_liquid * ptx.liquid_efficiency
        let ptx_methane_annual = ptx_output > 0 ? ptx_annual * ptx.prc_gas * ptx.gas_efficiency / ptx_output : 0

        // Methane and synthetic fuel: plant, stores and feedstock, with hydrogen at its cost above
        let methane_annual = plant(['Anaerobic digestion', 'Methanation', 'Methane storage', 'CO2 storage', 'Methane store charging', 'Methane store discharging'])
            + o.biogas_feedstock_annual + methanation_hydrogen_TWh * hydrogen_cost * 0.001 + ptx_methane_annual
        let synthetic_annual = plant(['FT synthetic fuel', 'Synthetic fuel storage']) + o.ft_biomass_annual
            + ft_hydrogen_TWh * hydrogen_cost * 0.001 + ptx_annual - ptx_methane_annual

        let costs = {
            hydrogen: hydrogen_cost,
            methane: per_MWh(methane_annual, (o.methane.total_produced - o.methane.store_excess) * to_TWh),
            synthetic_fuel: per_MWh(synthetic_annual, ft.generation - o.synth_fuel.store_spill * to_TWh)
        }

        // Marginal values, used only to check how much of the system cost marginal prices would
        // recover. Synthetic fuel has no input value, so it is its hydrogen and biomass at their
        // values, plus the FT plant cost per MWh.
        let ft_plant = per_MWh(ft.annual, ft.generation)
        let values = {
            hydrogen: fv.hydrogen_gbp_MWh,
            methane: fv.methane_gbp_MWh,
            synthetic_fuel: ft.generation > 0 ? sf.FT_process_hydrogen_req * fv.hydrogen_gbp_MWh + sf.FT_process_biomass_req * sf.biomass_gbp_MWh + ft_plant : 0
        }

        // Synthetic fuel sold to final users, TWh/yr. This is less than fuel produced, as it leaves
        // out fuel used to make other fuels, fuel burned in turbines and fuel spilled. It also
        // leaves out demand met by fossil fuel, which is costed in fossil_bill. A scenario that
        // makes no fuel has a production cost of zero, so its fuel users pay nothing at this step.
        let demand = model.final_fuel_demand()
        p.fuel = {
            hydrogen: { TWh: (o.hydrogen.total_vehicle_demand + o.hydrogen.total_industry_demand + o.heating_systems.hydrogen.fuel_demand) * to_TWh },
            methane: { TWh: demand.methane * to_TWh * (1 - fossil_share.gas) },
            synthetic_fuel: { TWh: demand.synthetic_fuel * to_TWh * (1 - fossil_share.liquid) }
        }
        p.fuel_sales = 0
        p.fuel_value_sales = 0
        for (let z in p.fuel) {
            p.fuel[z].value_gbp_MWh = values[z]
            p.fuel[z].gbp_MWh = costs[z]
            p.fuel[z].annual = p.fuel[z].TWh * p.fuel[z].gbp_MWh * 0.001
            p.fuel_sales += p.fuel[z].annual
            p.fuel_value_sales += p.fuel[z].TWh * values[z] * 0.001
        }

        // Share of the system cost that would be recovered at marginal prices alone
        p.recovery = o.generation_costs.total_annual > 0 ? (p.electricity_revenue + p.fuel_value_sales) / o.generation_costs.total_annual : 0

        // Who pays. Fuel users pay production cost, which includes the electricity used to make
        // their fuel. Electricity users pay the rest of the system cost. Their payment above
        // hourly revenue is a top-up, similar to Contract for Difference payments.
        o.generation_costs.fuel_users_annual = p.fuel_sales
        o.generation_costs.electricity_annual = o.generation_costs.total_annual - o.generation_costs.fuel_users_annual
        p.bill_top_up = o.generation_costs.electricity_annual - p.electricity_revenue
    },

    // -----------------------------------------------------------------------------------------
    // 5. Retail: what users pay after networks, policy costs, supplier costs and VAT
    // -----------------------------------------------------------------------------------------

    // Hydrogen in each fuel sold, in MWh per MWh of fuel, and the total. Fuel users share network
    // costs by hydrogen content, as electrolysis is the part of fuel production that uses the
    // network. Methane is a mix of biogas and methanation, so its content is the methanation share.
    hydrogen_in_fuel_sold: function() {
        let methanation_share = o.methane.total_produced > 0 ? o.methane.total_hydrogen_used / o.methane.total_produced : 0
        let content = { hydrogen: 1, methane: methanation_share, synthetic_fuel: i.synth_fuel.FT_process_hydrogen_req }
        let sold_TWh = 0
        for (let z in o.prices.fuel) sold_TWh += o.prices.fuel[z].TWh * content[z]
        return { content, sold_TWh }
    },

    // The electricity unit rate and bill. The unit rate adds layers, as on a real bill:
    //
    //   generation + network + policy + supplier, all per kWh, then VAT
    //
    // Policy and supplier costs also have a part per customer, which is the standing charge. So
    // does the network on the per kWh basis. These inputs come from the 2024 Ofgem price cap.
    electricity_retail: function(hydrogen) {
        let r = i.retail
        let e = r.electricity
        let vat = 1 + r.vat_prc * 0.01

        // The kWh that carry the cost. Where fuel users pay for the electricity in their fuel,
        // electricity users' costs are shared over end use. Baselines have no fuel users, so they
        // use delivered electricity, which is nearly the same thing.
        let delivered_TWh = (o.balance.total_electricity_demand - o.total_losses.grid) * o.GWh_to_TWhy
        let billed_TWh = o.generation_costs.fuel_users_annual > 0 ? o.prices.end_use_TWh : delivered_TWh

        let elec = {
            billed_TWh,
            // The build-up for every technology is kept for comparison
            resource_p_kWh: delivered_TWh > 0 ? 100 * o.total_annual_cost / delivered_TWh : 0,
            generation_cost_p_kWh: billed_TWh > 0 ? 100 * o.generation_costs.electricity_annual / billed_TWh : 0,
            bill_top_up_p_kWh: billed_TWh > 0 ? 100 * o.prices.bill_top_up / billed_TWh : 0
        }

        // The wholesale adjustment covers year specific costs such as power bought forward. It is
        // zero in scenarios.
        elec.generation_p_kWh = elec.generation_cost_p_kWh + e.wholesale_adjustment_p_kWh

        // Network cost. With basis "per_kWh" it is the Ofgem rate times the energy billed, plus a
        // standing charge on homes. With basis "components" it is a system wide total, the 2024
        // network plus what is built beyond it:
        //
        //   existing       2024/25 network revenue from all users, held in real terms
        //   distribution   peak demand above the 2024 peak, per kW
        //   transmission   wind capacity above 2024, per kW
        //   constraints    balancing cost above 2024, £bn/yr
        //
        // Peak demand is end use, without electrolysis, storage charging or power to X. Transmission
        // follows wind, which is far from demand. Offshore connections are within wind capex. New
        // capital is an annuity, like a mortgage, plus O&M.
        //
        // Fuel users pay a share of the total. The rest is shared between homes and other users:
        // the 2024 network by the 2024 domestic share, distribution by the domestic share of the
        // peak, and transmission and constraints by energy. Homes pay their share on the unit rate,
        // with no network standing charge.
        let domestic_TWh = o.final_consumption.domestic.electricity * o.GWh_to_TWhy
        elec.network_p_kWh = e.network_p_kWh
        elec.network_total_bn = e.network_p_kWh * 0.01 * billed_TWh
        elec.network_standing_gbp = e.network_gbp
        let n = { existing_bn: elec.network_total_bn, distribution_GW: 0, distribution_capital_bn: 0, distribution_bn: 0,
            transmission_GW: 0, transmission_capital_bn: 0, transmission_bn: 0, constraints_bn: 0, annual_share: 0,
            standing_bn: e.network_gbp * i.households_2030 * 1e-9, domestic_TWh, domestic_bn: 0, other_bn: 0,
            domestic_peak_prc: 0, domestic_energy_prc: 0, other_p_kWh: 0 }
        elec.network = n
        elec.network_fuel_bn = 0
        if (e.network_basis == "components" && billed_TWh > 0) {
            // The share of capital paid each year: annuity plus O&M
            let rate = e.network_return_prc * 0.01
            n.annual_share = rate / (1 - Math.pow(1 + rate, -e.network_life_years)) + e.network_om_prc * 0.01
            n.existing_bn = e.network_existing_gbp_bn
            n.distribution_GW = Math.max(0, o.balance.max_electricity_demand - e.network_reference_peak_GW)
            n.transmission_GW = Math.max(0, i.supply.onshore_wind_capacity + i.supply.offshore_wind_capacity - e.network_reference_wind_GW)
            // GW x £/kW is £m, so 0.001 gives £bn
            n.distribution_capital_bn = n.distribution_GW * e.network_distribution_gbp_kW * 0.001
            n.transmission_capital_bn = n.transmission_GW * e.network_transmission_gbp_kW * 0.001
            n.distribution_bn = n.distribution_capital_bn * n.annual_share
            n.transmission_bn = n.transmission_capital_bn * n.annual_share
            n.constraints_bn = e.network_constraints_gbp_bn
            n.standing_bn = 0
            elec.network_standing_gbp = 0
            elec.network_total_bn = n.existing_bn + n.distribution_bn + n.transmission_bn + n.constraints_bn
            if (hydrogen.sold_TWh > 0) elec.network_fuel_bn = elec.network_total_bn * e.network_fuel_share_prc * 0.01

            // Domestic share of the peak. The hourly lighting, appliance and heat series cover homes
            // and services together, so each is split by its annual domestic share. Industry and
            // transport are not domestic.
            let lac_domestic = i.LAC.domestic.lighting_and_appliances_TWhy + i.LAC.domestic.cooking_TWhy
            let lac_total = lac_domestic + i.LAC.services.lighting_and_appliances_TWhy + i.LAC.services.catering_TWhy + i.LAC.services.cooling_TWhy
            let lac_share = lac_total > 0 ? lac_domestic / lac_total : 0
            let heat_elec = o.heating_systems.heatpump.fuel_demand + o.heating_systems.elres.fuel_demand
            let heat_domestic = o.final_consumption.domestic.electricity - o.LAC.total * lac_share
            let heat_share = heat_elec > 0 ? heat_domestic / heat_elec : 0
            let p = o.balance.peak_end_use
            let peak = p.lac + p.heat + p.industry + p.transport
            n.domestic_peak_prc = peak > 0 ? 100 * (p.lac * lac_share + p.heat * heat_share) / peak : 0
            n.domestic_energy_prc = 100 * domestic_TWh / billed_TWh

            // Homes and other users share what fuel users do not pay
            let users = 1 - (hydrogen.sold_TWh > 0 ? e.network_fuel_share_prc * 0.01 : 0)
            n.domestic_bn = users * (n.existing_bn * e.network_domestic_prc * 0.01
                + n.distribution_bn * n.domestic_peak_prc * 0.01
                + (n.transmission_bn + n.constraints_bn) * n.domestic_energy_prc * 0.01)
            n.other_bn = elec.network_total_bn - elec.network_fuel_bn - n.domestic_bn
            n.other_p_kWh = billed_TWh > domestic_TWh ? 100 * n.other_bn / (billed_TWh - domestic_TWh) : 0
            elec.network_p_kWh = domestic_TWh > 0 ? 100 * n.domestic_bn / domestic_TWh : 0
        }
        elec.network_annual_bn = elec.network_total_bn - elec.network_fuel_bn

        // Unit rate, standing charge and the household bill. Domestic electricity includes heat
        // pumps and leaves out electric vehicles, which are in transport.
        elec.unit_rate_p_kWh = (elec.generation_p_kWh + elec.network_p_kWh + e.policy_p_kWh + e.supplier_p_kWh) * vat
        elec.standing_charge_gbp = (elec.network_standing_gbp + e.policy_gbp + e.supplier_gbp) * vat
        elec.household_kWh = o.final_consumption.domestic.electricity * o.per_year * 1000000 / i.households_2030
        elec.bill_gbp = elec.unit_rate_p_kWh * 0.01 * elec.household_kWh + elec.standing_charge_gbp
        elec.household_spend_bn = elec.bill_gbp * i.households_2030 * 1e-9
        o.retail.electricity = elec
    },

    // What it costs to get fuel from the plant to the user, £/MWh. Each figure is the gap between a
    // delivered 2024 price and a bulk 2024 price, both before tax:
    //
    //   gas      delivered non-domestic gas less the price paid by power stations
    //   road     diesel before tax, which includes distribution and retail margin, less marine
    //            gas oil, which is a bulk price for a similar fuel
    //
    // Aviation and shipping buy in bulk, so synthetic fuel pays the road figure only on its other
    // uses. Hydrogen has no 2024 market, so it uses the gas figure, which is likely to be low.
    fuel_delivery: function() {
        let fr = i.fossil_reference
        if (!fr) return { gas: 0, road: 0, road_share: 0 }
        let rf = i.retail.road_fuel
        let diesel_before = (rf.diesel_p_litre / (1 + fr.road_vat_prc * 0.01) - fr.road_duty_p_litre) / rf.diesel_kWh_per_litre * 10
        let demand_TWh = model.final_fuel_demand().synthetic_fuel * o.GWh_to_TWhy
        let bulk_TWh = o.transport.modes.Aviation.IC.TWh + o.final_consumption.international_shipping * o.GWh_to_TWhy
        return {
            gas: (fr.non_domestic_gas.p_kWh - fr.power.gas_p_kWh) * 10,
            road: diesel_before - fr.marine_gas_oil_gbp_MWh,
            road_share: demand_TWh > 0 ? (demand_TWh - bulk_TWh) / demand_TWh : 0
        }
    },

    // Fuel prices: production cost, plus the fuel users' share of network costs, plus delivery. The
    // price carries no duty or VAT.
    fuel_prices: function(hydrogen) {
        let p = o.prices
        let delivery = model.fuel_delivery()
        let delivery_gbp_MWh = {
            hydrogen: delivery.gas,
            methane: delivery.gas,
            synthetic_fuel: delivery.road * delivery.road_share
        }
        let network_per_MWh_hydrogen = hydrogen.sold_TWh > 0 ? 1000 * o.retail.electricity.network_fuel_bn / hydrogen.sold_TWh : 0
        p.fuel_delivery_bn = 0
        for (let z in p.fuel) {
            let fuel = p.fuel[z]
            fuel.network_gbp_MWh = network_per_MWh_hydrogen * hydrogen.content[z]
            fuel.delivery_gbp_MWh = fuel.TWh > 0 ? delivery_gbp_MWh[z] : 0
            fuel.price_gbp_MWh = fuel.gbp_MWh + fuel.network_gbp_MWh + fuel.delivery_gbp_MWh
            fuel.p_kWh = fuel.price_gbp_MWh * 0.1
            fuel.network_annual = fuel.TWh * fuel.network_gbp_MWh * 0.001
            fuel.delivery_annual = fuel.TWh * fuel.delivery_gbp_MWh * 0.001
            p.fuel_delivery_bn += fuel.delivery_annual
        }
        // Synthetic fuel at the pump pays the road delivery cost in full. Per litre is at the
        // energy density of diesel, to compare with road fuel.
        let synthetic = p.fuel.synthetic_fuel
        synthetic.road_p_kWh = synthetic.TWh > 0 ? (synthetic.gbp_MWh + synthetic.network_gbp_MWh + delivery.road) * 0.1 : 0
        synthetic.p_litre = synthetic.road_p_kWh * i.retail.road_fuel.diesel_kWh_per_litre
    },

    // The household gas bill, with the same layers as electricity. It starts from the gas price
    // paid by power stations, plus an adjustment for the domestic demand profile. Scenarios
    // without gas homes have no customers, so their bill is zero.
    gas_retail: function() {
        let g = i.retail.gas
        let vat = 1 + i.retail.vat_prc * 0.01
        let gas = { wholesale_p_kWh: i.fuel_prices.gas + g.wholesale_adjustment_p_kWh }
        gas.unit_rate_p_kWh = (gas.wholesale_p_kWh + g.network_p_kWh + g.policy_p_kWh + g.supplier_p_kWh) * vat
        gas.standing_charge_gbp = (g.network_gbp + g.policy_gbp + g.supplier_gbp) * vat
        gas.customers = i.households_2030 * g.households_prc * 0.01
        gas.household_kWh = gas.customers > 0 ? o.final_consumption.domestic.gas * o.per_year * 1000000 / gas.customers : 0
        gas.bill_gbp = gas.customers > 0 ? gas.unit_rate_p_kWh * 0.01 * gas.household_kWh + gas.standing_charge_gbp : 0
        gas.household_spend_bn = gas.bill_gbp * gas.customers * 1e-9
        o.retail.gas = gas
    },

    // Fuel for combustion engine cars. Pump prices include duty and VAT, so dividing by energy
    // per litre gives p/kWh. Petrol has less energy per litre than diesel. Fossil fuel and biofuel
    // pay pump prices, and synthetic fuel pays its price with VAT and no duty.
    road_fuel_retail: function(fossil_share) {
        let f = i.retail.road_fuel
        let diesel = f.car_diesel_prc * 0.01
        let synthetic = o.prices.fuel.synthetic_fuel
        let road = {
            petrol_p_kWh: f.petrol_p_litre / f.petrol_kWh_per_litre,
            diesel_p_kWh: f.diesel_p_litre / f.diesel_kWh_per_litre
        }
        road.fossil_car_p_kWh = road.petrol_p_kWh * (1 - diesel) + road.diesel_p_kWh * diesel
        let road_vat = i.fossil_reference ? 1 + i.fossil_reference.road_vat_prc * 0.01 : 1
        road.synthetic_car_p_kWh = synthetic.road_p_kWh * road_vat
        road.car_p_kWh = road.fossil_car_p_kWh * fossil_share.liquid + road.synthetic_car_p_kWh * (1 - fossil_share.liquid)
        road.car_fuel_spend_bn = o.transport.modes["Cars & Vans"].IC.TWh * road.car_p_kWh * 0.01
        road.synthetic_car_spend_bn = o.transport.modes["Cars & Vans"].IC.TWh * road.synthetic_car_p_kWh * (1 - fossil_share.liquid) * 0.01
        o.retail.road_fuel = road
    },

    // -----------------------------------------------------------------------------------------
    // 6. Fossil fuel: the 2024 reference, and this scenario's bill
    //
    // The reference is a fixed point of comparison, the same in every scenario. Each row has a
    // volume (TWh/yr), a price before tax and a tax (both £/MWh). Tax means what users pay and
    // cannot reclaim, so VAT that businesses reclaim is left out.
    //
    // Prices arrive in the units they are published in. p/litre / kWh per litre gives p/kWh, and
    // p/kWh x 10 gives £/MWh.
    // -----------------------------------------------------------------------------------------
    fossil_reference: function() {
        let fr = i.fossil_reference
        if (!fr) return
        let rf = i.retail.road_fuel
        let p_litre_to_gbp_MWh = 10

        let row = (label, TWh, before, tax) => ({
            label, TWh, before, tax, after: before + tax,
            before_bn: TWh * before * 0.001,
            after_bn: TWh * (before + tax) * 0.001
        })

        // Split a pump price (p/litre). VAT applies to the price including duty, so remove VAT
        // first and then duty.
        let pump_split = (pump_p_litre, kWh_per_litre) => {
            let ex_vat = pump_p_litre / (1 + fr.road_vat_prc * 0.01)
            return {
                before: ex_vat - fr.road_duty_p_litre,
                duty: fr.road_duty_p_litre,
                vat: pump_p_litre - ex_vat,
                pump: pump_p_litre,
                pump_p_kWh: pump_p_litre / kWh_per_litre
            }
        }
        // Build a pump price for synthetic fuel, at the energy density of diesel, in the same order
        let synthetic_pump = (duty) => {
            let before = o.prices.fuel.synthetic_fuel.p_litre
            let vat = (before + duty) * fr.road_vat_prc * 0.01
            return { before, duty, vat, pump: before + duty + vat, pump_p_kWh: (before + duty + vat) / rf.diesel_kWh_per_litre }
        }
        let petrol = pump_split(rf.petrol_p_litre, rf.petrol_kWh_per_litre)
        let diesel = pump_split(rf.diesel_p_litre, rf.diesel_kWh_per_litre)

        // Road fuel. Cars pay duty and VAT, blended by the car diesel share. Other road transport
        // is mostly businesses, which pay duty and reclaim VAT.
        let petrol_before = petrol.before / rf.petrol_kWh_per_litre * p_litre_to_gbp_MWh
        let diesel_before = diesel.before / rf.diesel_kWh_per_litre * p_litre_to_gbp_MWh
        let diesel_share = rf.car_diesel_prc * 0.01
        let car_before = petrol_before * (1 - diesel_share) + diesel_before * diesel_share
        let car_after = o.retail.road_fuel.fossil_car_p_kWh * 10

        // Heating oil has VAT and no duty. Industry gas oil has a rebated duty, and VAT is reclaimed.
        let heating_before = fr.burning_oil.p_litre / (1 + fr.burning_oil.vat_prc * 0.01) / fr.burning_oil.kWh_per_litre * p_litre_to_gbp_MWh
        let heating_after = fr.burning_oil.p_litre / fr.burning_oil.kWh_per_litre * p_litre_to_gbp_MWh
        let gas_oil_ex_vat = fr.gas_oil.p_litre / (1 + fr.gas_oil.vat_prc * 0.01)
        let industry_before = (gas_oil_ex_vat - fr.gas_oil.duty_p_litre) / fr.gas_oil.kWh_per_litre * p_litre_to_gbp_MWh
        let industry_tax = fr.gas_oil.duty_p_litre / fr.gas_oil.kWh_per_litre * p_litre_to_gbp_MWh

        // Household gas from commodity to delivered, with the standing charge spread over use
        let hg = fr.household_gas
        let household_kWh = fr.TWh.household_gas * 1e9 / hg.customers
        let gas = {
            household_kWh,
            unit_before_vat: hg.commodity_p_kWh + hg.wholesale_adjustment_p_kWh + hg.network_p_kWh + hg.policy_p_kWh + hg.supplier_p_kWh,
            standing_p_kWh: hg.standing_gbp * 100 / household_kWh
        }
        gas.before_vat = gas.unit_before_vat + gas.standing_p_kWh
        gas.vat = gas.before_vat * hg.vat_prc * 0.01
        gas.delivered = gas.before_vat + gas.vat
        gas.bill_gbp = gas.delivered * 0.01 * household_kWh

        // The bill for final users. Refinery and extraction fuel is left out, as it is in the
        // price of the products.
        let rows = {
            cars_and_vans: row("Cars and vans, petrol and diesel", fr.TWh.cars_and_vans, car_before, car_after - car_before),
            other_transport: row("Other road, rail and domestic shipping, at diesel", fr.TWh.other_transport, diesel_before, diesel.duty / rf.diesel_kWh_per_litre * p_litre_to_gbp_MWh),
            aviation: row("Aviation, jet fuel", fr.TWh.aviation, fr.jet_fuel_gbp_MWh, 0),
            international_shipping: row("International shipping, marine gas oil", fr.TWh.international_shipping, fr.marine_gas_oil_gbp_MWh, 0),
            heating_oil: row("Heating oil", fr.TWh.heating_oil, heating_before, heating_after - heating_before),
            industry_oil: row("Industry oil, gas oil", fr.TWh.industry_oil, industry_before, industry_tax),
            household_gas: row("Household gas, delivered", fr.TWh.household_gas, gas.before_vat * 10, gas.vat * 10),
            other_gas: row("Services and industry gas, delivered", fr.TWh.other_gas, fr.non_domestic_gas.p_kWh * 10, (fr.non_domestic_gas.with_ccl_p_kWh - fr.non_domestic_gas.p_kWh) * 10),
            other_coal: row("Coal outside power stations", fr.TWh.other_coal, fr.power.coal_p_kWh * 10, 0)
        }
        let final = { TWh: 0, before_bn: 0, after_bn: 0 }
        for (let z in rows) {
            final.TWh += rows[z].TWh
            final.before_bn += rows[z].before_bn
            final.after_bn += rows[z].after_bn
        }

        // Power station fuel is shown separately, as electricity bills already pay for it. Its tax
        // is the carbon price paid in 2024. Mt x £/t gives £ million, and over TWh gives £/MWh.
        let power_TWh = fr.TWh.power_gas + fr.TWh.power_oil + fr.TWh.power_coal
        let power_fuel_bn = (fr.TWh.power_gas * fr.power.gas_p_kWh + fr.TWh.power_oil * fr.power.oil_p_kWh + fr.TWh.power_coal * fr.power.coal_p_kWh) * 0.01
        let power = row("Power station fuel, tax is the carbon price", power_TWh, 1000 * power_fuel_bn / power_TWh, fr.power.co2_Mt * fr.power.carbon_price / power_TWh)
        let total = { TWh: final.TWh + power.TWh, before_bn: final.before_bn + power.before_bn, after_bn: final.after_bn + power.after_bn }

        // Fuel price as a multiple of the 2024 bulk fossil fuel it replaces, on energy and before
        // tax. Bulk prices have no delivery cost, so delivery is left out for a like for like
        // comparison.
        let fuel = o.prices.fuel
        let bulk_price = (z) => fuel[z].price_gbp_MWh - fuel[z].delivery_gbp_MWh
        fuel.methane.times_gas = bulk_price('methane') / (fr.power.gas_p_kWh * 10)
        fuel.synthetic_fuel.times_jet_fuel = bulk_price('synthetic_fuel') / fr.jet_fuel_gbp_MWh
        fuel.synthetic_fuel.times_marine_gas_oil = bulk_price('synthetic_fuel') / fr.marine_gas_oil_gbp_MWh

        o.fossil_reference = {
            rows, final, power, total, household_gas: gas,
            pump: { petrol, diesel, synthetic_no_duty: synthetic_pump(0), synthetic_same_duty: synthetic_pump(fr.road_duty_p_litre) }
        }
    },

    // This scenario's fossil bill for final users: its own volumes at the 2024 prices and taxes
    // above. In baseline_2024 this equals the reference, and in zcb_2024 it is zero. A scenario in
    // between pays for what it burns. Biofuel is priced as road fuel. Power station fuel is in the
    // system cost, so it is not in this bill.
    fossil_bill: function(share) {
        let fr = i.fossil_reference
        if (!fr) return
        let to_TWh = o.GWh_to_TWhy
        let fc = o.final_consumption
        let ff = o.fossil_fuels
        let reference = o.fossil_reference.rows

        // All liquid and gas demand by use, TWh/yr. Other use inputs are always fossil fuel.
        let cars = o.transport.modes["Cars & Vans"].IC.TWh
        let aviation = o.transport.modes.Aviation.IC.TWh
        let shipping = fc.international_shipping * to_TWh
        let other_transport = fc.transport.liquid * to_TWh - cars - aviation
        let other_oil = i.fossil_fuels.other_oil_use
        let other_gas = i.fossil_fuels.other_gas_use

        let volumes = {
            cars_and_vans: cars * share.liquid,
            other_transport: other_transport * share.liquid,
            aviation: aviation * share.liquid,
            international_shipping: shipping * share.liquid,
            heating_oil: (fc.domestic.liquid + fc.services.liquid) * to_TWh * share.liquid,
            industry_oil: (fc.industry.liquid * to_TWh - other_oil) * share.liquid + other_oil,
            household_gas: fc.domestic.gas * to_TWh * share.gas,
            other_gas: ((fc.services.gas + fc.industry.gas) * to_TWh - other_gas) * share.gas + other_gas,
            other_coal: (ff.coal - ff.coal_for_dispatchable) * to_TWh
        }

        let rows = {}
        let final = { TWh: 0, before_bn: 0, after_bn: 0 }
        for (let z in volumes) {
            let TWh = volumes[z]
            rows[z] = { TWh, before_bn: TWh * reference[z].before * 0.001, after_bn: TWh * reference[z].after * 0.001 }
        }

        // Household gas is rebuilt, as its standing charge is per home and does not follow volume.
        // A home stays on the gas network while it uses any gas, so homes follow the input share.
        let hg = fr.household_gas
        let unit_before_vat = o.fossil_reference.household_gas.unit_before_vat
        let customers = i.households_2030 * i.retail.gas.households_prc * 0.01 * (share.gas > 0 ? 1 : 0)
        rows.household_gas.before_bn = rows.household_gas.TWh * unit_before_vat * 0.01 + customers * hg.standing_gbp * 1e-9
        rows.household_gas.after_bn = rows.household_gas.before_bn * (1 + hg.vat_prc * 0.01)

        for (let z in rows) {
            final.TWh += rows[z].TWh
            final.before_bn += rows[z].before_bn
            final.after_bn += rows[z].after_bn
        }
        o.fossil_bill = { share, rows, final }
    },

    // Heat and biomass that are not on an electricity or gas bill:
    //
    //   biomass       logs and pellets in homes at retail prices, and wood for services and
    //                 industry at the bulk pellet price, £/MWh of fuel
    //   solar thermal rooftop panels and large arrays, at their build-up cost
    //   geothermal    deep geothermal heat at its levelised cost of heat, £/MWh of heat
    //   heat network  pipes from large solar arrays and geothermal to buildings, at build-up cost
    //
    // The cost is the same in both totals, except that the cost to society leaves out VAT and
    // values solar thermal and heat networks at the social discount rate.
    heat_and_biomass: function() {
        let hb = i.heat_and_biomass
        if (!hb) return
        let to_TWh = o.GWh_to_TWhy
        let fc = o.final_consumption
        let domestic_TWh = fc.domestic.bioenergy * to_TWh
        let bulk_TWh = (fc.services.bioenergy + fc.industry.bioenergy + fc.transport.bioenergy) * to_TWh
        let domestic_bn = domestic_TWh * hb.biomass_domestic_gbp_MWh * 0.001
        let domestic_before_vat_bn = domestic_bn / (1 + hb.biomass_domestic_vat_prc * 0.01)
        let biomass_bn = domestic_before_vat_bn + bulk_TWh * hb.biomass_bulk_gbp_MWh * 0.001
        let geothermal_bn = o.supply.total_geothermal_heat * to_TWh * hb.geothermal_heat_gbp_MWh * 0.001
        let solar_thermal_bn = SOLAR_THERMAL.reduce((sum, z) => sum + o.costs[z].annual, 0)
        let heat_network_bn = o.costs['Heat network'].annual
        o.heat_and_biomass = {
            domestic_TWh, bulk_TWh, domestic_bn, biomass_bn, geothermal_bn, solar_thermal_bn, heat_network_bn,
            before_bn: biomass_bn + geothermal_bn + solar_thermal_bn + heat_network_bn,
            vat_bn: domestic_bn - domestic_before_vat_bn
        }
    },

    // Household energy across bills and cars, £ per home per year. The electricity bill leaves out
    // electric cars, so comparing it alone hides what replaces petrol and diesel. Each figure is an
    // average over all homes. Company cars are included, as the volumes do not separate them. Solar
    // thermal panels are equipment, so they are left out with heat pumps and boilers.
    household_energy: function(share) {
        let fr = i.fossil_reference
        if (!fr) return
        let homes = i.households_2030
        let to_TWh = o.GWh_to_TWhy
        let elec = o.retail.electricity
        let gas = o.retail.gas
        let fuel = o.prices.fuel
        let cars = o.transport.modes["Cars & Vans"]
        let domestic = o.final_consumption.domestic
        let vat = 1 + i.retail.vat_prc * 0.01
        let road_vat = 1 + fr.road_vat_prc * 0.01

        // Charging at the electricity unit rate, which includes VAT. Hydrogen pays road VAT and no
        // duty, as synthetic fuel does.
        let ev_bn = cars.EV.TWh * elec.unit_rate_p_kWh * 0.01
        let hydrogen_car_bn = cars.H2.TWh * fuel.hydrogen.p_kWh * road_vat * 0.01

        // Fuel in the home that is not on a gas bill, TWh/yr x p/kWh x 0.01. Heating oil pays its
        // 2024 price where it is fossil. Synthetic fuels pay their price and the home VAT rate.
        let heating_oil_p_kWh = o.fossil_reference.rows.heating_oil.after * 0.1
        let home_oil_bn = domestic.liquid * to_TWh * share.liquid * heating_oil_p_kWh * 0.01
        let home_synthetic_bn = (
            domestic.liquid * to_TWh * (1 - share.liquid) * fuel.synthetic_fuel.p_kWh
            + (gas.customers > 0 ? 0 : domestic.gas * to_TWh * (1 - share.gas) * fuel.methane.p_kWh)
            + domestic.hydrogen * to_TWh * fuel.hydrogen.p_kWh
        ) * vat * 0.01

        let per_home = (bn) => bn * 1e9 / homes
        let household = {
            electricity_gbp: elec.bill_gbp,
            gas_gbp: per_home(gas.household_spend_bn),
            home_fuel_gbp: per_home(home_oil_bn + home_synthetic_bn + (o.heat_and_biomass ? o.heat_and_biomass.domestic_bn : 0)),
            car_fuel_gbp: per_home(o.retail.road_fuel.car_fuel_spend_bn + hydrogen_car_bn),
            car_charging_gbp: per_home(ev_bn)
        }
        household.total_gbp = household.electricity_gbp + household.gas_gbp + household.home_fuel_gbp + household.car_fuel_gbp + household.car_charging_gbp

        // VAT within these that the other tax lines do not already count
        let vat_share = (spend, vat_prc) => spend * vat_prc / (100 + vat_prc)
        household.extra_vat_bn = vat_share(ev_bn, i.retail.vat_prc) + vat_share(hydrogen_car_bn, fr.road_vat_prc) + vat_share(home_synthetic_bn, i.retail.vat_prc)
        o.retail.household = household
    },

    // -----------------------------------------------------------------------------------------
    // 7. Total cost: the headline figures
    //
    // The same energy system has two different costs, as they answer different questions.
    //
    // Cost to consumers: what is paid. It follows the money on bills and at the pump, so it uses
    // strike prices and market prices, and includes every retail layer and tax.
    //
    // Cost to society: what the system uses up. It counts real resources and the damage from
    // emissions. Money that only moves between people in the UK is left out:
    //
    //   Tax, duty and carbon prices   These are paid to the government. The damage from carbon
    //                                 is counted directly with a carbon value instead.
    //   Strike prices and rents       The build-up gives what a technology costs to provide.
    //   Investor returns above the    Capital is annualised at the Green Book social discount
    //   social discount rate          rate and not at private hurdle rates.
    //   Policy costs                  ECO and the Warm Home Discount are mainly transfers.
    //
    // Neither view yet includes demand side equipment. See baseline/open-items.md.
    // -----------------------------------------------------------------------------------------
    total_cost: function() {
        let fr = i.fossil_reference
        if (!fr) return
        let bill = o.fossil_bill.final
        let reference = o.fossil_reference.final
        let elec = o.retail.electricity
        let e = i.retail.electricity
        let generation_costs = o.generation_costs

        // A retail layer has a part per kWh and a part per home. p/kWh x TWh x 0.01 gives £bn, and
        // £ x homes x 1e-9 gives £bn. Non-domestic standing charges are not modelled.
        let per_home_bn = (gbp) => gbp * i.households_2030 * 1e-9
        let per_kWh_bn = (p_kWh) => p_kWh * 0.01 * elec.billed_TWh

        // Layers paid by consumers before tax. Together they rebuild every bill: electricity users
        // pay the system cost less fuel sales, and fuel users pay fuel sales.
        let layers = {
            system: generation_costs.total_annual,
            wholesale_adjustment: per_kWh_bn(e.wholesale_adjustment_p_kWh),
            networks: elec.network_total_bn + per_home_bn(elec.network_standing_gbp),
            policy: per_kWh_bn(e.policy_p_kWh) + per_home_bn(e.policy_gbp),
            supplier: per_kWh_bn(e.supplier_p_kWh) + per_home_bn(e.supplier_gbp),
            fuel_delivery: o.prices.fuel_delivery_bn,
            heat_and_biomass: o.heat_and_biomass.before_bn,
            fossil_fuel: bill.before_bn
        }
        let before_bn = 0
        for (let z in layers) before_bn += layers[z]

        // Spend including VAT x rate / (100 + rate) gives the VAT within it. Businesses reclaim VAT.
        let vat_share = (spend, vat_prc) => spend * vat_prc / (100 + vat_prc)

        // Climate Change Levy on non-domestic electricity. Scenarios keep it, as they keep VAT.
        // Fuels pay it only where they are fossil, within the fossil bill.
        let fc = o.final_consumption
        let levy_bn = (fc.services.electricity + fc.industry.electricity) * o.GWh_to_TWhy * fr.non_domestic_electricity_ccl_p_kWh * 0.01

        let tax_bn = vat_share(elec.household_spend_bn, i.retail.vat_prc)
            + vat_share(o.retail.road_fuel.synthetic_car_spend_bn, fr.road_vat_prc)
            + o.retail.household.extra_vat_bn
            + o.heat_and_biomass.vat_bn
            + levy_bn
            + bill.after_bn - bill.before_bn

        // What electricity users pay before VAT, which the validation compares with observed spend
        let electricity_bn = before_bn - bill.before_bn - o.prices.fuel_sales - o.prices.fuel_delivery_bn - layers.heat_and_biomass - elec.network_fuel_bn

        // Scenarios use very different amounts of energy, so also divide by final energy. This
        // counts heat pump ambient heat, solar thermal and geothermal heat, and the electricity
        // into electric vehicles.
        let energy_TWh = (o.final_consumption.total + o.final_consumption.international_shipping) * o.GWh_to_TWhy

        // The tax gap is the 2024 tax take less this scenario's. Household electricity VAT and the
        // electricity levy are stored, as a scenario cannot see 2024 electricity use.
        let tax_2024_bn = reference.after_bn - reference.before_bn + fr.household_electricity_vat_bn + fr.non_domestic_electricity_ccl_bn + fr.household_biomass_vat_bn

        o.total_cost = {
            layers, electricity_bn, levy_bn,
            before_bn, tax_bn, after_bn: before_bn + tax_bn,
            energy_TWh,
            before_p_kWh: 100 * before_bn / energy_TWh,
            after_p_kWh: 100 * (before_bn + tax_bn) / energy_TWh,
            tax_2024_bn,
            // Rounded so the baseline shows 0.0 and not -0.0
            tax_gap_bn: Math.round((tax_2024_bn - tax_bn) * 10) / 10
        }
        model.society_cost(layers)
    },

    // Cost to society: real resources plus the damage from emissions.
    society_cost: function(layers) {
        let society = i.society

        // Build-up for every technology at the social discount rate. This uses the same method as
        // private costs, so construction time still counts. Heat rows are kept separate, as in the
        // build-up total.
        let social = (z) => o.costs[z].capacity * 0.001 * levelised_fixed_cost(Object.assign({}, i.costs[z], { hurdle_rate: society.discount_rate_prc })) + o.costs[z].generation * 0.001 * i.costs[z].variable_om
        let at_social_rate = 0
        for (let z in i.costs) if (!HEAT_ROWS.includes(z)) at_social_rate += social(z)

        // Feedstocks and backup fuel are real resources. Imports have no build-up, so they use
        // their price. The build-up carbon cost is a transfer, so it is left out.
        let imports = o.generation_costs.by_tech.imports.annual
        let other_supply = o.biogas_feedstock_annual + o.ft_biomass_annual + o.fuel_cost_annual + imports
        let supply_bn = at_social_rate + other_supply
        let supply_at_hurdle_bn = o.total_annual_cost - o.carbon_cost_annual + imports

        // Networks, suppliers, fuel delivery, heat, biomass and fossil fuel before tax are real
        // resources. Fossil fuel prices are market prices, which is the cost of buying the fuel from
        // abroad. Solar thermal and heat networks follow the same discount rate as the rest of supply.
        let heat = o.heat_and_biomass
        let heat_bn = heat.biomass_bn + heat.geothermal_bn + HEAT_ROWS.reduce((sum, z) => sum + social(z), 0)
        let heat_at_hurdle_bn = heat.biomass_bn + heat.geothermal_bn + heat.solar_thermal_bn + heat.heat_network_bn
        let other_resources = layers.networks + layers.supplier + layers.fuel_delivery + layers.fossil_fuel
        let resource_bn = supply_bn + heat_bn + other_resources

        // Emissions from energy, valued at the carbon value. These are fossil fuel emissions plus
        // the extra warming from aviation above its CO2 (the uplift also applies to synthetic jet
        // fuel). Land use and other non-energy emissions are outside this cost boundary.
        let eb = o.emissions_balance
        let carbon_MtCO2e = eb.fossil_fuel_coal + eb.fossil_fuel_gas + eb.fossil_fuel_oil + eb.international_aviation_bunkers
        let carbon_bn = carbon_MtCO2e * society.carbon_value_gbp_tCO2e * 0.001

        o.total_cost.society = {
            supply_bn, supply_at_hurdle_bn,
            networks_bn: layers.networks,
            supplier_bn: layers.supplier,
            fuel_delivery_bn: layers.fuel_delivery,
            heat_and_biomass_bn: heat_bn,
            fossil_fuel_bn: layers.fossil_fuel,
            resource_bn,
            carbon_MtCO2e, carbon_bn,
            total_bn: resource_bn + carbon_bn,
            total_at_hurdle_bn: supply_at_hurdle_bn + heat_at_hurdle_bn + other_resources + carbon_bn
        }

        // The social rate leaves out investor returns, but also the risk they pay for, such as
        // cost overruns. Hurdle rates include both. The true cost lies between, so show a range.
        let s = o.total_cost.society
        s.range_low_bn = Math.min(s.total_bn, s.total_at_hurdle_bn)
        s.range_high_bn = Math.max(s.total_bn, s.total_at_hurdle_bn)
    }
})

// ---------------------------------------------------------------------------------------------
// Turning a capital cost into a yearly cost
//
// A wind farm is paid for up front and earns over decades. Comparing it with a gas plant needs one
// yearly figure for each. The discount rate (hurdle rate) makes money now worth more than money
// later. At 7%, £1 in ten years is worth about 51p today, which is what investors need to be
// paid to wait. A higher rate makes capital heavy technologies dearer.
// ---------------------------------------------------------------------------------------------

// Annual cost per kW of capacity (£/kW/yr), by the DESNZ levelised cost method used in
// tools/lcoe/lcoe_lib.js. Add up all spending in today's money, and divide by the operating years
// in today's money. The result is the flat yearly payment that exactly pays back the spending at
// the hurdle rate. Multiplying by capacity gives the same total as LCOE multiplied by generation.
//
// Spending is even across the pre-development years, then even across the construction years, and
// fixed O&M is paid in each operating year.
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
// technology's own hurdle rate. "annuity" is the PyPSA-Eur method: overnight cost (pre-development
// plus construction) times the annuity factor at one discount rate for all technologies, plus
// fixed O&M, with no interest during construction.
function annual_fixed_cost(c, a) {
    if (!a || a.method != "annuity") return levelised_fixed_cost(c)
    let r = a.discount_rate * 0.01
    let annuity = r > 0 ? r / (1 - Math.pow(1 + r, -c.lifespan)) : 1 / c.lifespan
    return (c.predev_cost + c.capex) * annuity + c.fixed_om
}

// Hurdle rate (%) at which levelised_fixed_cost equals target (£/kW/yr). The cost rises with the
// rate, so repeatedly halving the range between -5% and 50% finds it (bisection). Null if the
// target is outside that range.
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
// The cost is a straight line in capex, so two points give the answer. A negative result means the
// target is below pre-development and O&M alone.
function implied_capex(c, target) {
    let without = levelised_fixed_cost(Object.assign({}, c, { capex: 0 }))
    let per_capex = levelised_fixed_cost(Object.assign({}, c, { capex: 1000 })) - without
    return 1000 * (target - without) / per_capex
}
