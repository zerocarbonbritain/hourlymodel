"""Build scenarios/clean_power_2030.json from the 2024 baseline and the NESO Clean Power 2030 pathway.

Usage (from the repository root):
    python3 -I docs/build_clean_power_2030.py [--out scenarios/clean_power_2030.json]

The method and sources are in docs/clean-power-2030-notes.md. The scenario starts from
scenarios/baseline_2024.json. Supply follows the NESO pathway capacities. Demand is
the 2024 baseline plus the NESO change in demand from 2024 to 2030. A few inputs are
calibrated with model runs so the model reproduces NESO quantities.
"""

import argparse
import copy
import json
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# NESO Clean Power 2030 data workbook (document 346781), 2030 values for Great Britain.
# ES1: capacity (GW), generation and curtailment (TWh). ED1: demand (TWh).
NESO = {
    "ffr": {
        "name": "Further Flex and Renewables",
        "offshore_wind_GW": 50.649,      # ES1 transmission 49.910 + distributed 0.740
        "onshore_wind_GW": 27.326,       # 19.505 + 7.821
        "solar_GW": 47.354,              # 4.644 + 42.710
        "nuclear_GW": 3.515,
        "marine_GW": 0.254,              # 0.068 + 0.186
        "offshore_TWh": 186.665,         # generation after curtailment
        "onshore_TWh": 57.758,
        "solar_TWh": 44.691,
        "nuclear_TWh": 25.323,
        "offshore_curtailed_TWh": 10.801,
        "onshore_curtailed_TWh": 12.441,
        "solar_curtailed_TWh": 4.979,
        "battery_GW": 27.383, "battery_GWh": 48.858,
        "battery_in_TWh": 25.660, "battery_out_TWh": 17.946,
        "ldes_GW": 7.858, "ldes_GWh": 98.928,  # 7.450 + 0.408, 96.988 + 1.940
        "ldes_in_TWh": 14.849, "ldes_out_TWh": 10.442,
        "interconnector_GW": 12.45,
        "imports_TWh": 21.596, "exports_TWh": 57.606,
        "system_demand_TWh": 315.163,    # ED1 GB total system demand excluding electrolysis
        "electrolysis_GW": 3.653, "electrolysis_TWh": 14.863,
        # Dispatchable generation (TWh)
        "gas_TWh": 15.058, "gas_chp_TWh": 11.782,
        "biomass_TWh": 15.604,           # biomass, biomass CHP and BECCS
        "waste_TWh": 12.824,             # waste and waste CHP
        "other_renewables_TWh": 4.689,   # distributed, mainly landfill and sewage gas
        "hydrogen_TWh": 0.338,
        # ED1 demand 2024 and 2030 (TWh)
        "residential": (94.851, 79.977),
        "industrial_commercial": (155.720, 179.011),
        "road_transport": (6.371, 28.231),
        "residential_heat_pump": (0.787 + 1.114, 3.452 + 3.686),
        "residential_district_heat": (0.797 + 1.128, 1.072 + 1.145),
        "commercial_heat_pump": (0.654 + 0.925, 2.778 + 2.966),
        "commercial_district_heat": (0.110 + 0.155, 0.342 + 0.365),
    },
}

# Northern Ireland onshore wind, held at its current level (DfE, about 1.4 GW).
NI_ONSHORE_GW = 1.4
# GB to UK scaling for demand changes, by mid 2024 population (ONS): UK 69.28m, NI 1.92m.
UK_PER_GB = 69.28 / (69.28 - 1.92)
# Biodegradable share of energy from waste, as in DUKES bioenergy accounting.
WASTE_BIODEGRADABLE = 0.5
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


def calibrate(s, name, setter, output, target, start, tol=0.001, passes=20):
    """Adjust one input until a model output (TWh/yr) meets its target. Secant steps."""
    x0, x1 = start, start * 1.1 if start else 0.1
    setter(s, x0)
    y0 = output(run(s)) - target
    for _ in range(passes):
        setter(s, x1)
        y1 = output(run(s)) - target
        if abs(y1) <= tol * max(abs(target), 1):
            break
        if y1 == y0:
            break
        x0, x1, y0 = x1, x1 - y1 * (x1 - x0) / (y1 - y0), y1
    print(f"  {name} = {x1:.5g} (miss {y1:+.3f})")
    return x1


def largest_within(s, name, setter, output, limit, low, high, steps=12):
    """Largest input in [low, high] whose model output (TWh/yr) stays at or below limit. Bisection."""
    for _ in range(steps):
        mid = (low + high) / 2
        setter(s, mid)
        if output(run(s)) <= limit:
            low = mid
        else:
            high = mid
    setter(s, low)
    print(f"  {name} = {low:.4g}")
    return low


def build(pathway):
    p = NESO[pathway]
    s = json.load(open(os.path.join(ROOT, "scenarios/baseline_2024.json")))
    base = run(s)
    sup = s["supply"]

    # Raw weather capacity factors, from the baseline's output and availability
    def raw_cf(tech, avail):
        return base["supply"][tech + "_capacity_factor"] / avail

    # ---- Supply ----
    sup["offshore_wind_capacity"] = round(p["offshore_wind_GW"], 2)
    sup["onshore_wind_capacity"] = round(p["onshore_wind_GW"] + NI_ONSHORE_GW, 2)
    sup["solarpv_capacity"] = round(p["solar_GW"], 2)
    sup["tidal_capacity"] = round(p["marine_GW"], 2)
    sup["nuclear_capacity"] = p["nuclear_GW"]
    sup["nuclear_capacity_factor"] = round(p["nuclear_TWh"] * 1000 / (p["nuclear_GW"] * HOURS), 3)
    # Availability set so output before curtailment matches NESO's load factor
    for tech, key, cap in (("offshore_wind", "offshore", p["offshore_wind_GW"]),
                           ("onshore_wind", "onshore", p["onshore_wind_GW"]),
                           ("solarpv", "solar", p["solar_GW"])):
        cf = (p[key + "_TWh"] + p[key + "_curtailed_TWh"]) * 1000 / (cap * HOURS)
        avail = cf / raw_cf(tech, sup[tech + "_availability"])
        # Availability above 1 would mean output above the weather data's potential
        sup[tech + "_availability"] = round(min(avail, 1.0), 3)
        print(f"  {tech}: NESO CF {cf:.3f}, availability {avail:.3f}"
              + (" capped at 1" if avail > 1 else ""))
    sup["interconnector_capacity_GW"] = p["interconnector_GW"]

    # Generation prices for a blended fleet. Plant in the 2024 baseline keeps its 2024 price
    # (capture price plus RO and CfD support). Capacity added since then is paid the AR7 strike
    # price from zcb_2024. The blend is weighted by capacity. Other technologies, the Feed-in
    # Tariff and capacity market keep their 2024 values.
    strike = json.load(open(os.path.join(ROOT, "scenarios/zcb_2024.json")))["generation_costs"]["price_gbp_MWh"]
    base_sup = json.load(open(os.path.join(ROOT, "scenarios/baseline_2024.json")))["supply"]
    prices = s["generation_costs"]["price_gbp_MWh"]
    for key, cap in (("offshore_wind", "offshore_wind_capacity"), ("onshore_wind", "onshore_wind_capacity"),
                     ("solar", "solarpv_capacity"), ("tidal", "tidal_capacity")):
        existing = min(base_sup[cap], sup[cap]) / sup[cap]
        old = prices[key] if prices[key] is not None else strike[key]
        prices[key] = round(existing * old + (1 - existing) * strike[key], 2)
        print(f"  {key}: {existing:.3f} existing at {old}, rest at {strike[key]}, blended {prices[key]}")

    # Batteries and long duration storage as one store, at NESO's combined round trip
    st = s["electric_storage"]
    st["capacity_GWh"] = round(p["battery_GWh"] + p["ldes_GWh"], 1)
    st["charge_capacity_GW"] = st["discharge_capacity_GW"] = round(p["battery_GW"] + p["ldes_GW"], 1)
    round_trip = (p["battery_out_TWh"] + p["ldes_out_TWh"]) / (p["battery_in_TWh"] + p["ldes_in_TWh"])
    st["charge_efficiency"] = st["discharge_efficiency"] = round(round_trip ** 0.5, 3)

    # Dispatchable generation shares. Gas includes CHP and the small hydrogen and CCS output.
    # Bioenergy includes biodegradable waste and other renewables (landfill and sewage gas),
    # as in the baseline. Non-biodegradable waste goes in the coal and other thermal share.
    gas = p["gas_TWh"] + p["gas_chp_TWh"] + p["hydrogen_TWh"]
    bio = p["biomass_TWh"] + p["waste_TWh"] * WASTE_BIODEGRADABLE + p["other_renewables_TWh"]
    other = p["waste_TWh"] * (1 - WASTE_BIODEGRADABLE)
    total = gas + bio + other
    eb = s["electric_backup"]
    eb["prc_methane"] = round(gas / total * 100, 2)
    eb["prc_biomass"] = round(bio / total * 100, 2)
    eb["prc_coal"] = round(100 - eb["prc_methane"] - eb["prc_biomass"], 2)
    eb["prc_synth_fuel"] = 0
    eb["ccgt_capacity_GW"] = 35

    # ---- Demand, as the 2024 baseline plus the NESO change to 2030 ----
    def change(key):
        a, b = p[key]
        return (b - a) * UK_PER_GB

    heat = change("residential_heat_pump") + change("residential_district_heat") \
        + change("commercial_heat_pump") + change("commercial_district_heat")
    residential_other = change("residential") - change("residential_heat_pump") - change("residential_district_heat")
    commercial_other = change("industrial_commercial") - change("commercial_heat_pump") - change("commercial_district_heat")

    # Residential non heat demand falls with appliance and lighting efficiency
    dom = s["LAC"]["domestic"]
    dom_elec = dom["lighting_and_appliances_TWhy"] + dom["cooking_TWhy"]
    factor = 1 + residential_other / dom_elec
    dom["lighting_and_appliances_TWhy"] = round(dom["lighting_and_appliances_TWhy"] * factor, 2)
    dom["cooking_TWhy"] = round(dom["cooking_TWhy"] * factor, 2)
    # Industrial and commercial growth outside heat, mostly data centres
    svc = s["LAC"]["services"]
    svc["lighting_and_appliances_TWhy"] = round(svc["lighting_and_appliances_TWhy"] + commercial_other, 2)

    # EV fleet storage and charge rate scale with EV demand. Smart charging on.
    tr = s["transport"]
    ev_target = twh(base["electric_transport"]["total_EV_demand"]) + change("road_transport")
    ev_scale = ev_target / twh(base["electric_transport"]["total_EV_demand"])
    tr["electric_car_battery_capacity"] = round(tr["electric_car_battery_capacity"] * ev_scale)
    tr["electric_car_max_charge_rate"] = round(tr["electric_car_max_charge_rate"] * ev_scale, 1)
    tr["smart_charging_enabled"] = 1

    # Electrolysis on surplus electricity, supplying industrial hydrogen
    h2 = s["hydrogen"]
    h2["electrolysis_capacity_GW"] = round(p["electrolysis_GW"], 2)
    h2["electrolysis_efficiency"] = 0.8
    h2["storage_capacity_GWh"] = 1000
    h2["minimum_store_level"] = 0.1

    # Network losses. NESO system demand less consumer demand (ED1), scaled to the UK.
    # Own use is set to zero and the grid loss share covers all losses.
    loss_target = (p["system_demand_TWh"] - p["industrial_commercial"][1] - p["residential"][1]
                   - p["road_transport"][1]) * UK_PER_GB
    eiu = s["energy_industry_use"]
    eiu["electricity_own_use_prc"] = 0

    hp_target = twh(base["heating_systems"]["heatpump"]["fuel_demand"]) + heat
    hs = s["heating_systems"]
    gas_share = hs["methane"]["share"] + hs["heatpump"]["share"]
    car = tr["modes"]["Cars & Vans"]
    ind = s["industry"]
    ch4 = ind["low_temp_process_fixed_CH4_prc"]

    def set_loss(sc, x):
        sc["energy_industry_use"]["electricity_grid_loss_prc"] = round(x, 3)

    def set_hp(sc, x):
        sc["heating_systems"]["heatpump"]["share"] = round(x, 3)
        sc["heating_systems"]["methane"]["share"] = round(gas_share - x, 3)
    def set_ev(sc, x):
        c = sc["transport"]["modes"]["Cars & Vans"]
        c["prc"]["EV"] = round(x, 4)
        c["prc"]["IC"] = round(1 - x, 4)
    # Industrial hydrogen replaces gas in low temperature process heat
    def set_h2(sc, x):
        x = min(max(x, 0), ch4)
        sc["industry"]["low_temp_process_fixed_H2_prc"] = round(x, 3)
        sc["industry"]["low_temp_process_fixed_CH4_prc"] = round(ch4 - x, 3)

    def set_imports(sc, x):
        sc["electric_backup"]["prc_imports"] = round(x, 2)

    # The calibrated inputs interact, so the set is repeated until it settles
    for n in range(3):
        print(f"Calibration pass {n + 1}")
        calibrate(s, "electricity_grid_loss_prc", set_loss,
                  lambda o: twh(o["total_losses"]["grid"]), loss_target, eiu["electricity_grid_loss_prc"])
        calibrate(s, "heatpump.share", set_hp,
                  lambda o: twh(o["heating_systems"]["heatpump"]["fuel_demand"]), hp_target, hs["heatpump"]["share"])
        calibrate(s, "Cars & Vans EV share", set_ev,
                  lambda o: twh(o["electric_transport"]["total_EV_demand"]), ev_target, car["prc"]["EV"])
        # A flat industrial demand on variable electrolysis needs storage. With no large hydrogen
        # store expected by 2030, demand is the largest the store can supply without a shortfall.
        largest_within(s, "low_temp_process_fixed_H2_prc", set_h2,
                       lambda o: twh(o["hydrogen"]["unmet_demand"]), 0.001, 0, ch4)
        calibrate(s, "prc_imports", set_imports,
                  lambda o: twh(o["supply"]["total_imports"]), p["imports_TWh"], eb["prc_imports"])
    return s


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pathway", default="ffr", choices=NESO)
    parser.add_argument("--out", default="scenarios/clean_power_2030.json")
    args = parser.parse_args()
    s = build(args.pathway)
    with open(os.path.join(ROOT, args.out), "w") as f:
        json.dump(s, f, indent=4)
        f.write("\n")
    print("Wrote " + args.out)


if __name__ == "__main__":
    main()
