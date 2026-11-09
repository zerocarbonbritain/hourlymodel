"""Build scenarios/zcb_2024_high_demand_v2.json: zcb_2024_high_demand without its costlier minor supply
technologies, with capacities from a cost search.

Usage (from the repository root):
    python3 -I docs/build_zcb_2024_high_demand_v2.py [--out scenarios/zcb_2024_high_demand_v2.json] [--no-search]

The demand side is zcb_2024_high_demand unchanged. Geothermal, tidal, wave and new solar thermal
go, and solar thermal stays at its 2024 level. Wind and solar keep the zcb_2024 proportions and
scale together, at a scale from a sweep. The other capacities come from a coordinate search of ten year runs on the cost to
society, against the zcb_2024 store requirements (development plan, phase 5): nothing unmet,
methane and liquid store minimums of at least 8 TWh, a combined minimum of at least 15 TWh and
both stores ending at or above their start levels. Store start levels are held at the
zcb_2024_high_demand values, as the first fill is not costed.
"""

import argparse
import copy
import json
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Resource limits agreed for the PyPSA free variant (ZCB_PyPSA/docs/costs.md)
LIMITS = {"offshore_wind_capacity": 245, "onshore_wind_capacity": 105}

# Store requirements, TWh
STORE_MIN = 8
COMBINED_MIN = 15


def load(name):
    return json.load(open(os.path.join(ROOT, "scenarios", name + ".json")))


def run(overrides):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(overrides, f)
        path = f.name
    try:
        out = subprocess.run(["node", "docs/run_scenario.js", path, "--json"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout
    finally:
        os.unlink(path)
    return json.loads(out.strip().splitlines()[-1])


def twh(x):
    return x * 1e-4  # ten year GWh total to TWh/yr


def stores(o, s):
    """Store minimums and ends against starts, TWh, and unmet demand, TWh/yr"""
    return {
        "ch4_min": o["methane"]["min_SOC"] / 1000,
        "sf_min": o["synth_fuel"]["store_min_SOC"] / 1000,
        "ch4_end_gap": (o["methane"]["SOC"] - s["methane"]["SOC_start"]) / 1000,
        "sf_end_gap": (o["synth_fuel"]["store_SOC"] - s["synth_fuel"]["store_start_GWh"]) / 1000,
        "unmet": twh(o["balance"]["total_unmet_demand"]) + twh(o["hydrogen"]["unmet_demand"])
                 + twh(o["methane"]["unmet"]) + twh(o["synth_fuel"]["unmet_demand"]),
    }


def shortfall(o, s):
    """How far a run is from the store requirements, TWh. Zero when it meets them."""
    t = stores(o, s)
    return (t["unmet"] * 10
            + max(0, STORE_MIN - t["ch4_min"]) + max(0, STORE_MIN - t["sf_min"])
            + max(0, COMBINED_MIN - t["ch4_min"] - t["sf_min"])
            + max(0, -t["ch4_end_gap"]) + max(0, -t["sf_end_gap"]))


def objective(o, s):
    """Cost to society plus a penalty of £10bn/yr per TWh short of the store requirements"""
    return o["total_cost"]["society"]["total_bn"] + 10 * shortfall(o, s)


def base_overrides():
    """zcb_2024_high_demand with geothermal, tidal, wave and new solar thermal removed"""
    s = copy.deepcopy(load("zcb_2024_high_demand"))
    z = load("zcb_2024")
    sup = s["supply"]
    sup["geothermal_elec_capacity"] = 0
    sup["geothermal_heat_capacity"] = 0
    sup["tidal_capacity"] = 0
    sup["wave_capacity"] = 0
    sup["solarthermal_capacity"] = load("baseline_2024")["supply"]["solarthermal_capacity"]
    # Fill in the store and plant inputs the search changes, so the output lists them all
    s.setdefault("electric_backup", {})["ccgt_capacity_GW"] = z["electric_backup"]["ccgt_capacity_GW"]
    return s


# Search inputs and how each maps to the scenario. Methanation keeps the zcb_2024_high_demand
# ratio to biogas feedstock.
HD = load("zcb_2024_high_demand")
ZS = load("zcb_2024")["supply"]
METHANATION_PER_BIOGAS = HD["methane"]["methanation_capacity"] / HD["biogas"]["biomass_for_biogas"]
SEARCH = ("electrolysis_GW", "h2_store_TWh", "biogas_TWh", "ft_GW", "battery_GWh",
          "battery_GW", "ccgt_GW", "ch4_store_TWh", "sf_store_TWh")


def apply(s, x):
    sup = s["supply"]
    for k in ("offshore_wind_capacity", "onshore_wind_capacity", "solarpv_capacity"):
        sup[k] = round(min(ZS[k] * x["scale"], LIMITS.get(k, 1e9)), 1)
    s["hydrogen"]["electrolysis_capacity_GW"] = round(x["electrolysis_GW"], 1)
    s["hydrogen"]["storage_capacity_GWh"] = round(x["h2_store_TWh"] * 1000)
    s["biogas"]["biomass_for_biogas"] = round(x["biogas_TWh"], 1)
    s["methane"]["methanation_capacity"] = round(x["biogas_TWh"] * METHANATION_PER_BIOGAS, 2)
    s["methane"]["storage_capacity_GWh"] = round(max(x["ch4_store_TWh"], s["methane"]["SOC_start"] / 1000) * 1000)
    s["synth_fuel"]["capacity_GW"] = round(x["ft_GW"], 2)
    s["synth_fuel"]["store_capacity_GWh"] = round(max(x["sf_store_TWh"], s["synth_fuel"]["store_start_GWh"] / 1000) * 1000)
    st = s["electric_storage"]
    st["capacity_GWh"] = round(x["battery_GWh"], 1)
    st["charge_capacity_GW"] = st["discharge_capacity_GW"] = round(x["battery_GW"], 2)
    s["electric_backup"]["ccgt_capacity_GW"] = round(x["ccgt_GW"], 1)


# Wind and solar scale, from a sweep with the other inputs searched at each scale. Society cost
# (£bn/yr): 1.626 159.00, 1.58 158.16, 1.54 157.44, 1.50 157.32, 1.47 157.04, 1.44 157.32. Lower
# scales use more biogas and FT, so more land.
SCALE = 1.47

# The search starts from the best point of that sweep
START = {"electrolysis_GW": 62.9, "h2_store_TWh": 7.65, "biogas_TWh": 139.8, "ft_GW": 31.0,
         "battery_GWh": 224.3, "battery_GW": 24.95, "ccgt_GW": 42.7, "ch4_store_TWh": 127.0,
         "sf_store_TWh": 94.7}


def start_point(s):
    return dict(START, scale=SCALE)


def search(s, x, steps=(0.1, 0.05, 0.025, 0.0125)):
    """Coordinate search. Each step tries each input up and down."""
    apply(s, x)
    best = objective(run(s), s)
    print(f"  start: {best:.2f}")
    for step in steps:
        improved = True
        while improved:
            improved = False
            for k in SEARCH:
                for sign in (1, -1):
                    trial = dict(x)
                    trial[k] = x[k] * (1 + sign * step)
                    apply(s, trial)
                    c = objective(run(s), s)
                    if c < best - 0.005:
                        best, x = c, trial
                        improved = True
                        print(f"  step {step}: {k} = {trial[k]:.3f}, objective {c:.2f}", flush=True)
                        break
    apply(s, x)
    return x, best


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="scenarios/zcb_2024_high_demand_v2.json")
    parser.add_argument("--no-search", action="store_true")
    args = parser.parse_args()

    s = base_overrides()
    x = start_point(s)
    apply(s, x)
    if not args.no_search:
        x, best = search(s, x)
    o = run(s)
    gap = shortfall(o, s)
    print("Stores:", {k: round(v, 2) for k, v in stores(o, s).items()})
    print(f"Society cost £{o['total_cost']['society']['total_bn']:.2f}bn/yr, shortfall {gap:.3f} TWh")
    if gap > 0.001:
        print("Warning: the result does not meet the store requirements")
    with open(os.path.join(ROOT, args.out), "w") as f:
        json.dump(s, f, indent=4)
        f.write("\n")
    print("Wrote " + args.out)


if __name__ == "__main__":
    main()
