"""Retail unit rate of clean_power_2030 against baseline_2024, with sensitivities.

Usage (from the repository root):
    python3 -I docs/clean_power_2030_retail.py

Results and sources are in docs/clean-power-2030-notes.md. Every adjustment is a change in
cost (£bn/yr), spread over kWh billed with VAT. Gas sensitivities assume the price
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


margin = s_cp["retail"]["electricity"]["supplier_margin_prc"] * 0.01
margin_base = s_base["retail"]["electricity"]["supplier_margin_prc"] * 0.01


def p(bn, TWh=billed, margin=margin):
    """£bn/yr over TWh billed, as p/kWh with the supplier margin and VAT"""
    return bn / TWh * 100 * (1 + margin) * VAT


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
# Transmission: the model costs the finished network for 2030 plant at its rates per kW with no
# constraint growth. NESO's 2030 network is still behind the wind: its 2025 to 2030 onshore transmission
# (CP.13, £28.1bn) annualised as in the model, plus 2030 constraints (CP.31) above 2024/25 thermal
# constraints. Transmission and constraints are shared by energy, so they spread over kWh billed.
n = cp["retail"]["electricity"]["network"]
neso_transmission = 4.6835 * 6 * n["annual_share"] + (3.682 - 1.7)
sens["NESO 2030 transmission and constraints, not the model rates"] = (0, neso_transmission - n["transmission_bn"] - n["constraints_bn"])
# The 2024 wholesale adjustment, zero in the scenario. Part of it is the cost of the domestic
# demand profile, which persists. The rest is power bought forward in 2023.
wa = s_base["retail"]["electricity"]["wholesale_adjustment_p_kWh"]
sens["2024 wholesale adjustment kept"] = (0, wa * 0.01 * billed)
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

# Homes pay the network on the unit rate, and household use falls, so the unit rate rises more than
# the bill. The bill is comparable between the two years.
e_base, e_cp = base["retail"]["electricity"], cp["retail"]["electricity"]
kWh = e_cp["household_kWh"]
bill = lambda r: e_cp["bill_gbp"] + (r - rate_cp) * kWh * 0.01
print(f"Household bill: baseline_2024 £{e_base['bill_gbp']:.0f} at {e_base['household_kWh']:.0f} kWh, "
      f"clean_power_2030 £{e_cp['bill_gbp']:.0f} at {kWh:.0f} kWh, central £{bill(central_rate):.0f}, "
      f"range £{bill(low):.0f} to £{bill(high):.0f}")

# ---- Gas price ----
# Market exposed output: everything in 2024. In 2030, existing wind and solar (2024 output),
# nuclear, hydro, thermal plant and imports. New CfD plant is not exposed.
eff = s_base["electric_backup"]["methane_efficiency"] * 0.01
gas_2024 = s_base["fuel_prices"]["gas"]
exposed_base = base["supply"]["total_electricity_before_grid_loss"] * k
exposed_cp = (base["supply"]["total_offshore_wind"] + base["supply"]["total_onshore_wind"] + base["supply"]["total_solarpv"]) * k \
    + sum(gc[t]["generation"] for t in ("nuclear", "hydro", "gas", "biomass", "coal", "waste", "imports"))
hours_base = base["prices"]["hours"]["backup"] * 0.01
hours_cp = (0.15, cp["prices"]["hours"]["backup"] * 0.01)   # NESO, model
slope_base = p(exposed_base * hours_base / eff * 0.01, billed_base, margin_base)
slope_cp = [p(exposed_cp * h / eff * 0.01) for h in hours_cp]
print(f"\nGas: exposed output {exposed_base:.0f} TWh (2024), {exposed_cp:.0f} TWh (2030)")
print(f"Unit rate per 1 p/kWh of gas: 2024 system {slope_base:.2f}, clean_power_2030 {slope_cp[0]:.2f} to {slope_cp[1]:.2f}")
print("p/therm   gas p/kWh   2024 system   clean_power_2030 (central, gas hours 15% to model)")
for pt in (60, 100, 150, 200):
    g = pt / KWH_PER_THERM
    d = g - gas_2024
    lo, hi = sorted((central_rate + slope_cp[0] * d, central_rate + slope_cp[1] * d))
    print(f"{pt:7d}   {g:9.2f}   {rate_base + slope_base * d:11.2f}   {lo:.2f} to {hi:.2f}")
