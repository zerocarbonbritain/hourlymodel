"""Build scenarios/deployed_tech.json: ZeroCarbonBritain high demand, limited to technologies deployed at scale today.

Usage (from the repository root):
    python3 -I docs/build_deployed_tech.py [--out scenarios/deployed_tech.json] [--no-search]

The method and sources are in docs/deployed-tech-notes.md. The scenario starts from
scenarios/baseline_2024.json, so activity, building fabric, land use and agriculture stay at
2024 levels, as in zcb_2024_high_demand. Demand side technology follows zcb_2024 where the
technology is deployed at scale today. Fossil fuel meets the demand that is not electrified.
Wind, solar and battery capacities come from a cost search.
"""

import argparse
import copy
import json
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Hinkley Point C and Sizewell C, two EPR units each (EDF, 3.26 GW per station). EDF expects
# Hinkley Point C to supply about 25 TWh/yr, which is a load factor of 0.875.
NUCLEAR_GW = 3.26 * 2
NUCLEAR_LOAD_FACTOR = round(25.0 * 1000 / (3.26 * 8766), 3)

# Resource limits agreed for the PyPSA free variant (ZCB_PyPSA/docs/costs.md)
LIMITS = {"offshore_wind_capacity": 245, "onshore_wind_capacity": 105}

HOURS = 8766


def run(scenario):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(scenario, f)
        path = f.name
    try:
        out = subprocess.run(["node", "docs/run_scenario.js", path, "--json"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout
    finally:
        os.unlink(path)
    return json.loads(out.strip().splitlines()[-1])


def twh(x):
    return x * 1e-4  # ten year GWh total to TWh/yr


def load(name):
    return json.load(open(os.path.join(ROOT, "scenarios", name + ".json")))


def demand(s, z, hd):
    """Demand side: 2024 activity from the baseline, technology from zcb_2024 where deployed at scale."""

    # Lighting, appliances, cooking, catering and cooling. Gas end uses move to electricity one for
    # one, as in zcb_2024_high_demand.
    for sector, keys in (("domestic", ("cooking",)), ("services", ("lighting_and_appliances", "catering", "cooling"))):
        lac = s["LAC"][sector]
        for k in keys:
            lac[k + "_TWhy"] = hd["LAC"][sector][k + "_TWhy"]
            lac[k + "_gas_TWhy"] = 0

    # Heating systems and efficiencies from zcb_2024: heat pumps 90%, resistance heating 5%,
    # biomass 5% (the baseline has 5.19%).
    s["heating_systems"] = copy.deepcopy(z["heating_systems"])

    # Passenger transport. Miles and load factors stay at 2024 levels. Drive train shares and
    # efficiencies follow zcb_2024. Hydrogen vehicles are not deployed at scale, so their share
    # moves to battery electric. Electric aviation is not deployed at scale, so aviation stays
    # on liquid fuel at the zcb_2024 efficiency.
    tr = s["transport"]
    for mode in ("Rail", "Bus", "Motorbike", "Cars & Vans", "Aviation"):
        m = tr["modes"][mode]
        zm = z["transport"]["modes"][mode]
        m["prc"] = dict(zm["prc"])
        m["efficiency"] = dict(zm["efficiency"])
        m["prc"]["EV"] = round(m["prc"]["EV"] + m["prc"].get("H2", 0), 4)
        m["prc"]["H2"] = 0
    av = tr["modes"]["Aviation"]["prc"]
    av["IC"], av["EV"] = 1, 0

    # The electric car fleet battery and charge rate follow zcb_2024_high_demand, scaled for the
    # larger EV share (0.94 against 0.9).
    car_ev = tr["modes"]["Cars & Vans"]["prc"]["EV"]
    scale = car_ev / z["transport"]["modes"]["Cars & Vans"]["prc"]["EV"]
    tr["electric_car_battery_capacity"] = round(hd["transport"]["electric_car_battery_capacity"] * scale)
    tr["electric_car_max_charge_rate"] = round(hd["transport"]["electric_car_max_charge_rate"] * scale, 1)

    # Freight keeps 2024 activity with the zcb_2024_high_demand drive train split. Hydrogen moves
    # to battery electric at equal mechanical energy.
    hdt = hd["transport"]
    h2_mech = hdt["freight_H2_demand"] * z["transport"]["modes"]["Cars & Vans"]["efficiency"]["H2"]
    tr["freight_BEV_demand"] = round(hdt["freight_BEV_demand"] + h2_mech / 0.8, 3)
    tr["freight_H2_demand"] = 0
    tr["freight_IC_demand"] = hdt["freight_IC_demand"]
    tr["rail_freight_elec_demand"] = hdt["rail_freight_elec_demand"]

    # Industry. Output at 2024 levels with no efficiency savings, as in zcb_2024_high_demand.
    # Fuel shares follow zcb_2024. Biomass shares are held at or below the baseline, and the
    # rest moves to methane, which is fossil gas here. Steel moves to electric arc furnaces as in
    # zcb_2024, so the blast furnace coal goes.
    ind = s["industry"]
    zi = z["industry"]
    for k in ("activity_prc", "material_efficiency_prc", "energy_efficiency_prc"):
        ind[k] = hd["industry"][k]
    for z_key in zi:
        if z_key.endswith("_prc") and ("_fixed_" in z_key or "_DSR_" in z_key) or z_key.endswith("_efficiency"):
            ind[z_key] = zi[z_key]
    for use in ("high_temp_process", "low_temp_process", "dry_sep", "other_heat", "other_non_heat"):
        bio = use + "_fixed_biomass_prc"
        keep = min(zi[bio], s_base["industry"].get(bio, 0))
        ind[use + "_fixed_CH4_prc"] = round(zi[use + "_fixed_CH4_prc"] + zi[bio] - keep, 3)
        ind[bio] = keep
    ind["blast_furnace_coal_TWhy"] = 0


def supply(s, z):
    """Supply side outside the cost search."""
    sup = s["supply"]
    sup["wave_capacity"] = 0
    sup["tidal_capacity"] = 0
    sup["geothermal_elec_capacity"] = 0
    sup["geothermal_heat_capacity"] = 0
    # Existing hydro (1.9 GW) and solar thermal (0.5 GW) stay at 2024 levels
    sup["nuclear_capacity"] = round(NUCLEAR_GW, 2)
    sup["nuclear_capacity_factor"] = NUCLEAR_LOAD_FACTOR
    # Wind and solar availability for new plant, as in zcb_2024
    for k in ("offshore_wind_availability", "onshore_wind_availability", "solarpv_availability"):
        sup[k] = z["supply"][k]
    # Isolated GB, as in zcb_2024 (decision D4)
    sup["interconnector_capacity_GW"] = 0
    sup["imports_TWhy"] = 0

    # Electricity losses as in zcb_2024: 7% grid loss and no power station own use. The oil and
    # gas supply chain shares stay at 2024 levels, as fossil fuel is still refined and extracted.
    for k in ("electricity_grid_loss_prc", "electricity_own_use_prc"):
        s["energy_industry_use"][k] = z["energy_industry_use"][k]

    # Backup from new gas turbines at zcb_2024 efficiencies. Biomass power (Drax and others) goes,
    # to avoid its land and supply chain impacts. Coal, oil and imports go too. Gas meets all backup.
    eb = s["electric_backup"]
    for k in ("methane_efficiency", "ocgt_efficiency", "ccgt_capacity_GW"):
        eb[k] = z["electric_backup"][k]
    eb["prc_methane"] = 100
    eb["prc_biomass"] = 0
    eb["prc_coal"] = 0
    eb["prc_synth_fuel"] = 0
    eb["prc_imports"] = 0
    eb["prc_hydrogen"] = 0

    # Lithium ion batteries at the zcb_2024 efficiency. Sizes come from the search.
    st = s["electric_storage"]
    st["charge_efficiency"] = st["discharge_efficiency"] = z["electric_storage"]["charge_efficiency"]

    # No electrolysis, methanation, synthetic fuel or new biogas. Biofuel supply stays at 2024
    # levels (32 TWh/yr). These are the baseline values, kept as they are.

    # New build is paid AR7 strike prices and nuclear the Hinkley Point C price, as in zcb_2024.
    # The retail settings for a future system also follow zcb_2024.
    s["generation_costs"] = copy.deepcopy(z["generation_costs"])
    s["carbon_price"] = z["carbon_price"]
    s["retail"] = copy.deepcopy(z["retail"])


def scale_fossil_linked(s, base_out, out):
    """Scale fugitive and fuel supply emissions with fossil fuel volumes, and refinery electricity
    with oil."""
    ff0, ff1 = base_out["fossil_fuels"], out["fossil_fuels"]
    oilgas = (ff1["oil"] + ff1["gas"]) / (ff0["oil"] + ff0["gas"])
    oil = ff1["oil"] / ff0["oil"]
    coal = ff1["coal"] / ff0["coal"] if ff0["coal"] else 0
    eb = s["emissions_balance"]
    b = s_base["emissions_balance"]
    for k in ("upstream_ch4_leakage", "oil_and_gas_flaring_venting"):
        eb[k] = round(b[k] * oilgas, 3)
    for k in ("coal_mining_handling", "manufacture_solid_fuels"):
        eb[k] = round(b[k] * coal, 3)
    # Iron and steel process emissions come mostly from blast furnaces
    eb["iron_steel_and_sinter"] = 0
    s["industry"]["refinery_electric_TWhy"] = round(s_base["industry"]["refinery_electric_TWhy"] * oil, 2)


# ---- Cost search ----

# Wind and solar keep the zcb_2024 proportions and scale together, as in zcb_2024_high_demand.
# A free search of each capacity finds a flat optimum at 20 GW offshore and 105 GW onshore wind,
# £1.8bn/yr below a mix with 64 GW offshore, so cost alone does not fix the mix.
SEARCH = ("scale", "battery_GWh", "battery_GW")


def apply(s, x):
    sup = s["supply"]
    zs = load("zcb_2024")["supply"]
    for k in ("offshore_wind_capacity", "onshore_wind_capacity", "solarpv_capacity"):
        sup[k] = round(min(zs[k] * x["scale"], LIMITS.get(k, 1e9)), 1)
    st = s["electric_storage"]
    st["capacity_GWh"] = round(x["battery_GWh"], 1)
    st["charge_capacity_GW"] = st["discharge_capacity_GW"] = round(x["battery_GW"], 2)


def objective(o):
    """Cost to society: real resources plus energy emissions at the appraisal carbon value."""
    return o["total_cost"]["society"]["total_bn"]


def search(s, x, steps=(0.1, 0.05, 0.025)):
    """Coordinate search on the cost to society. Each step tries each input up and down."""
    apply(s, x)
    best = objective(run(s))
    for step in steps:
        improved = True
        while improved:
            improved = False
            for k in SEARCH:
                for sign in (1, -1):
                    trial = dict(x)
                    trial[k] = x[k] * (1 + sign * step)
                    apply(s, trial)
                    o = run(s)
                    if twh(o["balance"]["total_unmet_demand"]) > 0.001:
                        continue
                    c = objective(o)
                    if c < best - 0.005:
                        best, x = c, trial
                        improved = True
                        print(f"  step {step}: {k} = {trial[k]:.3f}, society cost {c:.2f}")
                        break
    apply(s, x)
    return x, best


s_base = load("baseline_2024")


def build(do_search=True):
    z = load("zcb_2024")
    hd = load("zcb_2024_high_demand")
    s = copy.deepcopy(s_base)
    base_out = run(s_base)

    demand(s, z, hd)
    supply(s, z)

    # Start from 0.8 times zcb_2024 wind and solar, the lowest cost point of a sweep
    x = {"scale": 0.8, "battery_GWh": 200, "battery_GW": 30}
    apply(s, x)
    for n in range(2):
        scale_fossil_linked(s, base_out, run(s))
        if do_search:
            print(f"Search pass {n + 1}")
            x, best = search(s, x)
    scale_fossil_linked(s, base_out, run(s))
    return s


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="scenarios/deployed_tech.json")
    parser.add_argument("--no-search", action="store_true")
    args = parser.parse_args()
    s = build(not args.no_search)
    with open(os.path.join(ROOT, args.out), "w") as f:
        json.dump(s, f, indent=4)
        f.write("\n")
    print("Wrote " + args.out)


if __name__ == "__main__":
    main()
