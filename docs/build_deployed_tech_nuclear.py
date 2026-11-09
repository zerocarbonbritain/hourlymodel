"""Build scenarios/deployed_tech_nuclear.json: deployed_tech with nuclear in place of wind and solar.

Usage (from the repository root):
    python3 -I docs/build_deployed_tech_nuclear.py [--out scenarios/deployed_tech_nuclear.json] [--no-search]

The demand side and the rest of the supply side follow docs/build_deployed_tech.py. Wind and
solar go. Existing hydro (1.9 GW) and solar thermal (0.5 GW) stay at 2024 levels. Nuclear runs
flat at the EPR load factor of 0.875 and is paid the Hinkley Point C price on all its output.
Gas turbines meet all backup. The nuclear and battery sizes come from a search on the cost to
society.
"""

import argparse
import importlib.util
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

spec = importlib.util.spec_from_file_location("dt", os.path.join(ROOT, "docs", "build_deployed_tech.py"))
dt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dt)

SEARCH = ("nuclear_GW", "battery_GWh", "battery_GW")


def apply(s, x):
    sup = s["supply"]
    for k in ("offshore_wind_capacity", "onshore_wind_capacity", "solarpv_capacity"):
        sup[k] = 0
    sup["nuclear_capacity"] = round(x["nuclear_GW"], 2)
    st = s["electric_storage"]
    st["capacity_GWh"] = round(x["battery_GWh"], 1)
    st["charge_capacity_GW"] = st["discharge_capacity_GW"] = round(x["battery_GW"], 2)


def search(s, x, steps=(0.1, 0.05, 0.025)):
    """Coordinate search on the cost to society, as in build_deployed_tech.py."""
    apply(s, x)
    best = dt.objective(dt.run(s))
    for step in steps:
        improved = True
        while improved:
            improved = False
            for k in SEARCH:
                for sign in (1, -1):
                    trial = dict(x)
                    trial[k] = x[k] * (1 + sign * step)
                    apply(s, trial)
                    o = dt.run(s)
                    if dt.twh(o["balance"]["total_unmet_demand"]) > 0.001:
                        continue
                    c = dt.objective(o)
                    if c < best - 0.005:
                        best, x = c, trial
                        improved = True
                        print(f"  step {step}: {k} = {trial[k]:.3f}, society cost {c:.2f}")
                        break
    apply(s, x)
    return x, best


def build(do_search=True):
    z = dt.load("zcb_2024")
    hd = dt.load("zcb_2024_high_demand")
    s = json.loads(json.dumps(dt.s_base))
    base_out = dt.run(dt.s_base)

    dt.demand(s, z, hd)
    dt.supply(s, z)

    # Start near the nuclear capacity that matches annual electricity demand
    x = {"nuclear_GW": 60, "battery_GWh": 100, "battery_GW": 20}
    apply(s, x)
    for n in range(2):
        dt.scale_fossil_linked(s, base_out, dt.run(s))
        if do_search:
            print(f"Search pass {n + 1}")
            x, best = search(s, x)
    dt.scale_fossil_linked(s, base_out, dt.run(s))
    return s


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="scenarios/deployed_tech_nuclear.json")
    parser.add_argument("--no-search", action="store_true")
    args = parser.parse_args()
    s = build(not args.no_search)
    with open(os.path.join(ROOT, args.out), "w") as f:
        json.dump(s, f, indent=4)
        f.write("\n")
    print("Wrote " + args.out)


if __name__ == "__main__":
    main()
