// ---------------------------------------------------
// ZeroCarbonBritain hourly energy model v3, cost model
// Load after model.js. Adds hourly prices, costs, retail prices
// and the 2024 fossil fuel reference to the model object.
// ---------------------------------------------------

Object.assign(model, {
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
        o.backup_fuel_burned = Object.values(backup_fuel).some(([fuel]) => fuel > 0)
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
        road.fossil_car_p_kWh = road.petrol_p_kWh * (1 - diesel) + road.diesel_p_kWh * diesel
        // Synthetic fuel users pay its price with VAT and no duty. Baselines burn fossil fuel at pump prices.
        let synthetic_car_fuel = i.fossil_reference && p.fuel.synthetic_fuel.gbp_MWh > 0
        road.car_p_kWh = synthetic_car_fuel ? p.fuel.synthetic_fuel.p_kWh * (1 + i.fossil_reference.road_vat_prc * 0.01) : road.fossil_car_p_kWh
        road.car_fuel_spend_bn = o.transport.modes["Cars & Vans"].IC.TWh * road.car_p_kWh * 0.01
        o.retail.road_fuel = road
        model.fossil_reference()
    },
    // 2024 fossil fuel prices and bills at fixed 2024 volumes, the same in every scenario.
    // Prices are in £/MWh of fuel and bills in £bn/yr. Tax is what users pay and cannot reclaim.
    fossil_reference: function() {
        let fr = i.fossil_reference
        if (!fr) return
        let rf = i.retail.road_fuel
        let row = (label, TWh, before, tax) => ({
            label, TWh, before, tax, after: before + tax,
            before_bn: TWh * before * 0.001,
            after_bn: TWh * (before + tax) * 0.001
        })
        // Pence per litre at the pump, split into before tax, duty and VAT
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
        // Synthetic fuel at the energy density of diesel, with and without road fuel duty
        let synthetic_pump = (duty) => {
            let before = o.prices.fuel.synthetic_fuel.p_litre
            let vat = (before + duty) * fr.road_vat_prc * 0.01
            return { before, duty, vat, pump: before + duty + vat, pump_p_kWh: (before + duty + vat) / rf.diesel_kWh_per_litre }
        }
        let petrol = pump_split(rf.petrol_p_litre, rf.petrol_kWh_per_litre)
        let diesel = pump_split(rf.diesel_p_litre, rf.diesel_kWh_per_litre)
        let per_litre_to_MWh = 10
        let petrol_before = petrol.before / rf.petrol_kWh_per_litre * per_litre_to_MWh
        let diesel_before = diesel.before / rf.diesel_kWh_per_litre * per_litre_to_MWh
        let diesel_share = rf.car_diesel_prc * 0.01
        let car_before = petrol_before * (1 - diesel_share) + diesel_before * diesel_share
        let car_after = o.retail.road_fuel.fossil_car_p_kWh * 10

        let heating_before = fr.burning_oil.p_litre / (1 + fr.burning_oil.vat_prc * 0.01) / fr.burning_oil.kWh_per_litre * per_litre_to_MWh
        let heating_after = fr.burning_oil.p_litre / fr.burning_oil.kWh_per_litre * per_litre_to_MWh
        let gas_oil_ex_vat = fr.gas_oil.p_litre / (1 + fr.gas_oil.vat_prc * 0.01)
        let industry_before = (gas_oil_ex_vat - fr.gas_oil.duty_p_litre) / fr.gas_oil.kWh_per_litre * per_litre_to_MWh
        let industry_tax = fr.gas_oil.duty_p_litre / fr.gas_oil.kWh_per_litre * per_litre_to_MWh

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

        let rows = {
            cars_and_vans: row("Cars and vans, petrol and diesel", fr.TWh.cars_and_vans, car_before, car_after - car_before),
            other_transport: row("Other road, rail and domestic shipping, at diesel", fr.TWh.other_transport, diesel_before, diesel.duty / rf.diesel_kWh_per_litre * per_litre_to_MWh),
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
        // Power station fuel, with the carbon price paid in 2024 as its tax
        let power_TWh = fr.TWh.power_gas + fr.TWh.power_oil + fr.TWh.power_coal
        let power_fuel_bn = (fr.TWh.power_gas * fr.power.gas_p_kWh + fr.TWh.power_oil * fr.power.oil_p_kWh + fr.TWh.power_coal * fr.power.coal_p_kWh) * 0.01
        let power = row("Power station fuel, tax is the carbon price", power_TWh, 1000 * power_fuel_bn / power_TWh, fr.power.co2_Mt * fr.power.carbon_price / power_TWh)
        let total = { TWh: final.TWh + power.TWh, before_bn: final.before_bn + power.before_bn, after_bn: final.after_bn + power.after_bn }

        // Price as a multiple of the 2024 bulk fossil fuel it replaces, on energy and before tax
        let fuel = o.prices.fuel
        fuel.methane.times_gas = fuel.methane.price_gbp_MWh / (fr.power.gas_p_kWh * 10)
        fuel.synthetic_fuel.times_jet_fuel = fuel.synthetic_fuel.price_gbp_MWh / fr.jet_fuel_gbp_MWh
        fuel.synthetic_fuel.times_marine_gas_oil = fuel.synthetic_fuel.price_gbp_MWh / fr.marine_gas_oil_gbp_MWh

        o.fossil_reference = {
            rows, final, power, total, household_gas: gas,
            pump: { petrol, diesel, synthetic_no_duty: synthetic_pump(0), synthetic_same_duty: synthetic_pump(fr.road_duty_p_litre) }
        }

        // Headline cost: system cost and networks, with fossil fuel for final users where they burn it.
        // Tax is VAT on household electricity and synthetic car fuel, and the taxes in the fossil reference.
        let elec = o.retail.electricity
        let burns_fossil = o.generation_costs.fuel_users_annual == 0
        let vat_share = (spend, vat_prc) => spend * vat_prc / (100 + vat_prc)
        let before_bn = o.generation_costs.total_annual + elec.network_total_bn
        let tax_bn = vat_share(elec.household_spend_bn, i.retail.vat_prc)
        if (burns_fossil) {
            before_bn += final.before_bn
            tax_bn += final.after_bn - final.before_bn
        } else {
            tax_bn += vat_share(o.retail.road_fuel.car_fuel_spend_bn, fr.road_vat_prc)
        }
        let energy_TWh = (o.final_consumption.total + o.final_consumption.international_shipping) * o.GWh_to_TWhy
        let tax_2024_bn = final.after_bn - final.before_bn + fr.household_electricity_vat_bn
        o.total_cost = {
            before_bn, tax_bn, after_bn: before_bn + tax_bn,
            energy_TWh,
            before_p_kWh: 100 * before_bn / energy_TWh,
            after_p_kWh: 100 * (before_bn + tax_bn) / energy_TWh,
            tax_2024_bn,
            // Rounded so the baseline shows 0.0 and not -0.0
            tax_gap_bn: Math.round((tax_2024_bn - tax_bn) * 10) / 10
        }
    }
})

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
