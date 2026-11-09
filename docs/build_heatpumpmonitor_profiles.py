"""Build the HeatpumpMonitor heat demand profiles and heat pump efficiencies in defaults.js.

Usage (from the repository root):
    python3 -I docs/build_heatpumpmonitor_profiles.py [--cache file.json] [--dry-run]

The method is in docs/heatpumpmonitor-profiles-notes.md. The sources are HeatpumpMonitor.org MID
metered systems: the aggregate hourly heat output, electricity use, outside temperature and system
count (public emoncms.org feeds), and the space heat and hot water split of each system. It writes:

- a base temperature, fitted to daily heat output against daily mean outside temperature
- a hot water profile from days with a daily mean outside temperature of 16 °C or more
- space heat profiles for daily mean temperature bands, with hot water taken out
- heat pump efficiencies in the model's form: a fixed hot water efficiency from the per system
  split, and space heat efficiencies at 0 °C and 10 °C fitted to daily electricity use, with a
  shallower slope below the coldest measured day

Hours are UTC, as in the model's weather data.
"""

import argparse
import datetime as dt
import json
import os
import re
import urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULTS = os.path.join(ROOT, "defaults.js")

# emoncms.org feeds written by HeatpumpMonitor scripts/aggregate/aggregate_fast.php (tag "mid")
FEEDS = {"elec": 548548, "heat": 548550, "T": 548553, "n": 548554}
STATS_URL = "https://heatpumpmonitor.org/system/stats?start={start:%Y-%m-%d}&end={end:%Y-%m-%d}"
SYSTEMS_URL = "https://heatpumpmonitor.org/system/list/public.json"

# Hourly shapes use three years, for enough cold days. Efficiencies use the latest twelve months,
# to match the current HeatpumpMonitor figures.
PROFILE_START = dt.datetime(2023, 10, 1, tzinfo=dt.timezone.utc)
PROFILE_END = dt.datetime(2026, 10, 1, tzinfo=dt.timezone.utc)
EFF_START = dt.datetime(2025, 11, 1, tzinfo=dt.timezone.utc)
EFF_END = dt.datetime(2026, 11, 1, tzinfo=dt.timezone.utc)

HOT_WATER_MIN_T = 16.0
BAND_EDGES = [-99, 2, 4, 6, 8, 10, 12, 14]
FIT_MAX_T = 14.0
# Systems in the per system split need 90% data cover over the year, and a space and hot water
# split within 10% of their total heat.
MIN_COVER = 0.9
MAX_SPLIT_GAP = 0.1
# Space heat efficiency slope below the coldest measured day, in percentage points per K. This is
# the zcb_2024 heat pump slope (280% at 0 °C, 410% at 10 °C). The fitted slope extrapolated to the
# coldest model day (-6.4 °C) gives a COP of 1.68, which is too low.
COLD_SLOPE = 13

BEGIN_MARK = "// BEGIN heatpumpmonitor profiles (docs/build_heatpumpmonitor_profiles.py)"
END_MARK = "// END heatpumpmonitor profiles"


def get_json(url):
    # heatpumpmonitor.org refuses the default Python user agent
    req = urllib.request.Request(url, headers={"User-Agent": "hourlymodel-build"})
    return json.load(urllib.request.urlopen(req, timeout=120))


def fetch(feed_id, start, end):
    points = {}
    s = start
    while s < end:
        e = min(s + 300 * 86400, end)
        url = (f"https://emoncms.org/feed/data.json?id={feed_id}&start={s * 1000}&end={e * 1000}"
               "&interval=3600&average=1&skipmissing=0&limitinterval=0")
        for t, v in get_json(url):
            points[t // 1000] = v
        s = e
    return points


def load(cache):
    if cache and os.path.exists(cache):
        data = json.load(open(cache))
    else:
        start = int(min(PROFILE_START, EFF_START).timestamp())
        end = int(max(PROFILE_END, EFF_END).timestamp())
        data = {k: fetch(fid, start, end) for k, fid in FEEDS.items()}
        data["stats"] = get_json(STATS_URL.format(start=EFF_START, end=EFF_END))
        data["systems"] = get_json(SYSTEMS_URL)
        if cache:
            json.dump(data, open(cache, "w"))
    for k in FEEDS:
        data[k] = {int(t): v for t, v in data[k].items()}
    return data


def daily(data, start, end):
    """Daily heat and electricity per system (kWh) and hourly heat (kW), for whole days of data."""
    hours = np.arange(int(start.timestamp()), int(end.timestamp()), 3600)

    def series(k):
        return np.array([np.nan if data[k].get(t) is None else data[k][t] for t in hours], dtype=float)

    n = series("n")
    heat = (series("heat") / n / 1000).reshape(-1, 24)
    elec = (series("elec") / n / 1000).reshape(-1, 24)
    temp = series("T").reshape(-1, 24)
    ok = ~(np.isnan(heat).any(1) | np.isnan(elec).any(1) | np.isnan(temp).any(1))
    return heat[ok], elec[ok].sum(1), temp[ok].mean(1)


def system_split(data):
    """Hot water COP and share of heat across MID metered systems with a space and hot water split."""
    mid = {s["id"] for s in data["systems"] if s.get("mid_metering") == 1}
    year = (EFF_END - EFF_START).total_seconds()
    t = dict(water_heat=0.0, water_elec=0.0, space_heat=0.0, combined_heat=0.0, combined_elec=0.0)
    n = 0
    for sid, v in data["stats"].items():
        if int(sid) not in mid or (v.get("combined_data_length") or 0) < MIN_COVER * year:
            continue
        if not (v.get("water_heat_kwh") and v.get("space_heat_kwh")):
            continue
        if abs(v["water_heat_kwh"] + v["space_heat_kwh"] - v["combined_heat_kwh"]) > MAX_SPLIT_GAP * v["combined_heat_kwh"]:
            continue
        n += 1
        t["water_heat"] += v["water_heat_kwh"]
        t["water_elec"] += v["water_elec_kwh"]
        t["space_heat"] += v["space_heat_kwh"]
        t["combined_heat"] += v["combined_heat_kwh"]
        t["combined_elec"] += v["combined_elec_kwh"]
    return {
        "systems": n,
        "water_cop": t["water_heat"] / t["water_elec"],
        "water_share": t["water_heat"] / (t["water_heat"] + t["space_heat"]),
        "spf": t["combined_heat"] / t["combined_elec"],
    }


def build(data):
    # Hourly shapes
    heat, day_elec, day_t = daily(data, PROFILE_START, PROFILE_END)
    day_heat = heat.sum(1)

    # Hot water: days warm enough to have no space heat
    warm = day_t >= HOT_WATER_MIN_T
    hot_water_shape = heat[warm].sum(0) / day_heat[warm].sum() * 24
    warm_kwh = day_heat[warm].mean()

    # Space heat: hot water at its warm day level and shape is taken out of each day
    bands = []
    for lo, hi in zip(BAND_EDGES[:-1], BAND_EDGES[1:]):
        k = (day_t > lo) & (day_t <= hi)
        space = heat[k] - warm_kwh / 24 * hot_water_shape
        bands.append({
            "temperature": float(day_t[k].mean()),
            "days": int(k.sum()),
            "profile": space.sum(0) / space.sum() * 24,
        })
    cold_t = float(day_t.min())

    # Base temperature: daily heat = constant + slope x max(0, base - daily mean temperature)
    best = None
    for tb in np.arange(10.0, 20.01, 0.1):
        x = np.c_[np.ones(len(day_t)), np.clip(tb - day_t, 0, None)]
        c = np.linalg.lstsq(x, day_heat, rcond=None)[0]
        r = ((x @ c - day_heat) ** 2).sum()
        if best is None or r < best[0]:
            best = (r, tb)
    base_temperature = round(float(best[1]), 1)

    # Efficiencies. Hot water COP and share come from the per system split. Hot water is spread
    # evenly over the days, and the space heat line is fitted to daily electricity use.
    split = system_split(data)
    eheat, eelec, et = daily(data, EFF_START, EFF_END)
    eheat = eheat.sum(1)
    cold_t = min(cold_t, float(et.min()))
    water_kwh = split["water_share"] * eheat.mean()
    k = et < FIT_MAX_T
    space_kwh = np.clip(eheat[k] - water_kwh, 0.1, None)
    best = None
    for a in np.arange(2.0, 4.5, 0.01):
        for b in np.arange(0.0, 0.3, 0.001):
            r = eelec[k] - water_kwh / split["water_cop"] - space_kwh / (a + b * et[k])
            r = (r * r).sum()
            if best is None or r < best[0]:
                best = (r, a, b)
    _, a, b = best

    water_all = np.minimum(eheat, water_kwh)
    space_all = eheat - water_all
    modelled_elec = (water_all / split["water_cop"] + space_all / (a + b * et)).sum()

    return {
        "days": len(day_t),
        "warm_days": int(warm.sum()),
        "eff_days": len(et),
        "eff_mean_t": float(et.mean()),
        "base_temperature": base_temperature,
        "hot_water_shape": hot_water_shape,
        "bands": bands,
        "split": split,
        "efficiency_hot_water": round(split["water_cop"] * 100),
        "efficiency_0C": round(a * 100),
        "efficiency_10C": round((a + 10 * b) * 100),
        "efficiency_cold_T": round(cold_t, 1),
        "spf_measured": float(eheat.sum() / eelec.sum()),
        "spf_modelled": float(eheat.sum() / modelled_elec),
    }


def js_block(r):
    def arr(p):
        return "[" + ",".join(f"{x:.3f}" for x in p) + "]"
    lines = [
        BEGIN_MARK,
        f"// HeatpumpMonitor.org MID metered systems. Shapes {PROFILE_START:%Y-%m-%d} to {PROFILE_END:%Y-%m-%d}, hours in UTC.",
        f"// Efficiencies {EFF_START:%Y-%m-%d} to {EFF_END:%Y-%m-%d}.",
        "// Space heat profiles for daily mean outside temperature bands, interpolated between band means.",
        "hpm_space_heat_profiles = {",
        "    temperature: [" + ",".join(f"{b['temperature']:.2f}" for b in r["bands"]) + "],",
        "    profiles: [",
    ]
    lines += [f"        normalise_profile({arr(b['profile'])})," for b in r["bands"]]
    lines += [
        "    ]",
        "};",
        f"hpm_hot_water_profile = normalise_profile({arr(r['hot_water_shape'])});",
        f"hpm_base_temperature = {r['base_temperature']};",
        "hpm_heatpump_efficiency = {"
        f"efficiency_hot_water: {r['efficiency_hot_water']}, "
        f"efficiency_0C: {r['efficiency_0C']}, "
        f"efficiency_10C: {r['efficiency_10C']}, "
        f"efficiency_cold_T: {r['efficiency_cold_T']}, "
        f"efficiency_cold_slope: {COLD_SLOPE}" "};",
        "// Below efficiency_cold_T (the coldest measured day) the space heat efficiency falls by",
        "// efficiency_cold_slope per K, the zcb_2024 slope, in place of the fitted slope.",
        END_MARK,
    ]
    return "\n".join(lines)


def write_defaults(block):
    text = open(DEFAULTS).read()
    pattern = re.compile(re.escape(BEGIN_MARK) + ".*?" + re.escape(END_MARK), re.S)
    if pattern.search(text):
        text = pattern.sub(lambda m: block, text)
    else:
        text = text.rstrip("\n") + "\n\n" + block + "\n"
    open(DEFAULTS, "w").write(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", help="read or write the fetched data here")
    ap.add_argument("--dry-run", action="store_true", help="print the block without writing defaults.js")
    args = ap.parse_args()

    r = build(load(args.cache))
    sp = r["split"]
    print(f"Shapes: {r['days']} days, {r['warm_days']} warm days, base temperature {r['base_temperature']} °C")
    for b in r["bands"]:
        p = b["profile"]
        print(f"  band mean {b['temperature']:5.2f} °C, {b['days']:3d} days, peak/min {p.max() / p.min():.2f}")
    print(f"Per system split: {sp['systems']} systems, hot water COP {sp['water_cop']:.2f}, "
          f"hot water {sp['water_share']:.1%} of heat, SPF {sp['spf']:.2f}")
    print(f"Efficiency fit: {r['eff_days']} days, mean outside temperature {r['eff_mean_t']:.2f} °C")
    print(f"Efficiency: hot water {r['efficiency_hot_water']}%, 0 °C {r['efficiency_0C']}%, 10 °C {r['efficiency_10C']}%, "
          f"{COLD_SLOPE}%/K below {r['efficiency_cold_T']} °C")
    print(f"Aggregate SPF measured {r['spf_measured']:.2f}, modelled with these efficiencies {r['spf_modelled']:.2f}")

    block = js_block(r)
    if args.dry_run:
        print(block)
    else:
        write_defaults(block)
        print("Updated defaults.js")


if __name__ == "__main__":
    main()
