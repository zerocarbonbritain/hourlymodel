"""Retail unit rate of clean_power_2030 against baseline_2024, with sensitivities.

Usage (from the repository root):
    python3 -I docs/clean_power_2030_retail.py

Results and sources are in docs/clean-power-2030-notes.md. Every adjustment is a change in
generation cost (£bn/yr), spread over kWh billed with VAT. Gas sensitivities assume the price
paid to plant exposed to the wholesale market moves with the cost of a gas turbine in the hours
when gas runs.
"""

import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAT = 1.05
KWH_PER_THERM = 29.3071


def run(name):
    out = subprocess.run(["node", "docs/run_scenario.js", name, "--json"], cwd=ROOT,
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out.strip().splitlines()[-1])


def load(name):
    return json.load(open(os.path.join(ROOT, "scenarios", name + ".json")))


base, cp = run("baseline_2024"), run("clean_power_2030")
s_base, s_cp = load("baseline_2024"), load("clean_power_2030")
k = 1e-4
billed = cp["retail"]["electricity"]["billed_TWh"]
billed_base = base["retail"]["electricity"]["billed_TWh"]


def p(bn, TWh=billed):
    """£bn/yr over TWh billed, as p/kWh with VAT"""
    return bn / TWh * 100 * VAT


rate_base = base["retail"]["electricity"]["unit_rate_p_kWh"]
rate_cp = cp["retail"]["electricity"]["unit_rate_p_kWh"]
gc = cp["generation_costs"]["by_tech"]
print(f"Unit rate: baseline_2024 {rate_base:.2f}, clean_power_2030 {rate_cp:.2f} p/kWh")

# ---- Central adjustments from NESO (main report table 4, Annex 4 figure 7 and CP.14) ----
neso_useful = 289 + 14.863
central = {
    "Export earnings (gap to NESO net trade)": -(1.65 - (-2.24 * neso_useful * 0.001)),
    "Lower wholesale prices for RO plant (NESO £10/MWh)": -10 * billed * 0.001,
    "RO and FiT contracts expiring (NESO £10/MWh)": -10 * billed * 0.001,
    "Network and constraint growth (NESO £5/MWh)": 5 * billed * 0.001,
}
rate = rate_cp
for name, bn in central.items():
    rate += p(bn)
    print(f"  {name:55s} {p(bn):+.2f}")
print(f"Central: {rate:.2f} p/kWh")
central_rate = rate

# ---- Sensitivities around the central value ----
sens = {}

# Blend weighted by output: existing plant keeps its 2024 output (baseline model output)
strike = load("zcb_2024")["generation_costs"]["price_gbp_MWh"]
old = s_base["generation_costs"]["price_gbp_MWh"]
new = s_cp["generation_costs"]["price_gbp_MWh"]
delta = 0
for key, out in (("offshore_wind", "total_offshore_wind"), ("onshore_wind", "total_onshore_wind"), ("solar", "total_solarpv")):
    share = base["supply"][out] / cp["supply"][out]
    blend = share * old[key] + (1 - share) * strike[key]
    delta += (blend - new[key]) * gc[key]["generation"] * 0.001
    print(f"  {key}: existing output share {share:.3f}, blended {blend:.2f} against {new[key]}")
sens["Blend weighted by output, not capacity"] = (delta, 0)

# New offshore wind strike price: Annex 4 figure 5 range for this pathway, £81 to £116/MWh
existing_off = s_base["supply"]["offshore_wind_capacity"] / s_cp["supply"]["offshore_wind_capacity"]
new_off_TWh = gc["offshore_wind"]["generation"] * (1 - existing_off)
sens["New offshore wind at £81 to £116/MWh (AR7 £91.20)"] = (
    (81 - strike["offshore_wind"]) * new_off_TWh * 0.001, (116 - strike["offshore_wind"]) * new_off_TWh * 0.001)

# NESO legacy and merit order effects at half to full value
sens["NESO wholesale and legacy effects at half value"] = (0, 10 * billed * 0.001)
sens["No export earnings"] = (0, -central["Export earnings (gap to NESO net trade)"])
# Network: peak scaling of 2024 charges (zcb_2024 method, no post-2030 transmission) or NESO
e = s_base["retail"]["electricity"]
peak_network = e["network_p_kWh"] * 0.01 * 269.39 * cp["balance"]["max_electricity_demand"] / 55.19
sens["Network by peak scaling, not NESO £5/MWh"] = (peak_network - e["network_p_kWh"] * 0.01 * billed - 5 * billed * 0.001, 0)
# Storage: build-up prices long duration storage per kWh as batteries
storage = gc["storage"]["annual"]
sens["Storage cost 0 to 30% lower"] = (-0.3 * storage, 0)

low, high = central_rate, central_rate
print("\nSensitivities (p/kWh)")
for name, (lo, hi) in sens.items():
    a, b = sorted((p(lo), p(hi)))
    low += a
    high += b
    print(f"  {name:55s} {a:+.2f} to {b:+.2f}")
print(f"Range at 2024 gas price: {low:.2f} to {high:.2f} p/kWh, against {rate_base:.2f} in 2024")

# ---- Gas price ----
# Market exposed output: everything in 2024. In 2030, existing wind and solar (2024 output),
# nuclear, hydro, thermal plant and imports. New CfD plant is not exposed.
eff = s_base["electric_backup"]["methane_efficiency"] * 0.01
gas_2024 = s_base["fuel_prices"]["gas"]
exposed_base = base["supply"]["total_electricity_before_grid_loss"] * k
exposed_cp = (base["supply"]["total_offshore_wind"] + base["supply"]["total_onshore_wind"] + base["supply"]["total_solarpv"]) * k \
    + sum(gc[t]["generation"] for t in ("nuclear", "hydro", "gas", "biomass", "coal_other", "imports"))
hours_base = base["prices"]["hours"]["backup"] * 0.01
hours_cp = (0.15, cp["prices"]["hours"]["backup"] * 0.01)   # NESO, model
slope_base = p(exposed_base * hours_base / eff * 0.01, billed_base)
slope_cp = [p(exposed_cp * h / eff * 0.01) for h in hours_cp]
print(f"\nGas: exposed output {exposed_base:.0f} TWh (2024), {exposed_cp:.0f} TWh (2030)")
print(f"Unit rate per 1 p/kWh of gas: 2024 system {slope_base:.2f}, clean_power_2030 {slope_cp[0]:.2f} to {slope_cp[1]:.2f}")
print("p/therm   gas p/kWh   2024 system   clean_power_2030 (central, gas hours 15% to model)")
for pt in (60, 100, 150, 200):
    g = pt / KWH_PER_THERM
    d = g - gas_2024
    lo, hi = sorted((central_rate + slope_cp[0] * d, central_rate + slope_cp[1] * d))
    print(f"{pt:7d}   {g:9.2f}   {rate_base + slope_base * d:11.2f}   {lo:.2f} to {hi:.2f}")
