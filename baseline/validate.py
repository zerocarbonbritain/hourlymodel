"""Validate a baseline scenario against observed statistics for its year.

Usage (from the repository root):
    python3 -I baseline/validate.py 2024 scenarios/baseline_2024.json [--strict] [--report PATH]

Reads baseline/validation/*.json, extracts each observed value from the cached
sources with the same locators as build.py, runs the model once and compares.
Writes a report to baseline/reports/validation_<scenario name>.md and the
checks, with observed values, to scenarios/validation/<scenario name>.json,
which the UI loads to show the comparison live. With --strict the exit status
is 1 if a check fails and has no recorded issue.
"""

import argparse
import datetime
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import (BASE, ROOT, BuildError, evaluate, extract_values, fetch_sources, fmt,  # noqa: E402
                   get_path)

# A check outside its tolerance but within twice it is a warning
WARN_FACTOR = 2


def load_checks():
    """Merge baseline/validation/*.json in name order."""
    folder = os.path.join(BASE, "validation")
    checks = {}
    for name in sorted(n for n in os.listdir(folder) if n.endswith(".json")):
        with open(os.path.join(folder, name)) as f:
            for key, spec in json.load(f).items():
                if key in checks:
                    raise BuildError("%s: %s is defined twice" % (name, key))
                checks[key] = spec
    return checks


def merged_scenario(scenario_path):
    """The scenario as the model sees it: the default scenario updated with its values."""
    default = "archive/zerocarbonbritain.json" if "archive" + os.sep in scenario_path else "zcb_2024.json"
    with open(os.path.join(ROOT, "scenarios", default)) as f:
        merged = json.load(f)
    with open(scenario_path) as f:
        overrides = json.load(f)

    def update(obj, changes):
        for key, value in changes.items():
            if isinstance(value, dict) and isinstance(obj.get(key), dict):
                update(obj[key], value)
            else:
                obj[key] = value
    update(merged, overrides)
    return merged


def model_value(spec, out, inputs):
    """Evaluate a model expression: named output paths (or i. input paths) and a formula."""
    names = {}
    for name, path in spec["values"].items():
        names[name] = get_path(inputs, path[2:]) if path.startswith("i.") else get_path(out, path)
    return evaluate(spec["formula"], names)


def status_of(error, tolerance):
    if abs(error) <= tolerance:
        return "ok"
    return "warn" if abs(error) <= tolerance * WARN_FACTOR else "fail"


def validate(year, scenario_path):
    with open(os.path.join(BASE, "sources.json")) as f:
        sources = json.load(f)
    fetch_sources(sources, False)
    checks = load_checks()
    inputs = merged_scenario(scenario_path)
    # Run the file in place, so run_scenario.js picks the same default scenario as merged_scenario
    out = json.loads(subprocess.run(["node", "docs/run_scenario.js", scenario_path, "--json"], cwd=ROOT,
                                    capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])

    sheets = {}
    results = {}
    for key, spec in checks.items():
        r = {"refs": [], "spec": spec}
        results[key] = r
        if year not in spec.get("years", [year]):
            r["status"] = "unavailable"
            r["reason"] = "no observed value for %d" % year
            continue
        obs = spec["observed"]
        try:
            published = {n: v for n, v in obs["values"].items() if "value" in v}
            located = {n: v for n, v in obs["values"].items() if "value" not in v}
            names = extract_values(located, sources, results, year, sheets, r["refs"])
            for name, v in published.items():
                names[name] = v["value"]
                r["refs"].append("%s = %s (published: %s)" % (name, fmt(v["value"]), v["cite"]))
            r["value"] = evaluate(obs["formula"], names)
        except (BuildError, KeyError) as e:
            r["status"] = "unavailable"
            r["reason"] = str(e)
            continue
        try:
            r["model"] = model_value(spec["model"], out, inputs)
        except KeyError as e:
            r["status"] = "unavailable"
            r["reason"] = "model output %s not found" % e
            continue
        r["error"] = r["model"] / r["value"] - 1 if r["value"] else float("inf")
        r["status"] = status_of(r["error"], spec["tolerance"])
        if r["status"] != "ok" and spec.get("issue"):
            r["status"] = "known"
    return sources, checks, results


# Report

LABELS = {"ok": "ok", "warn": "WARN", "fail": "FAIL", "known": "known issue", "unavailable": "n/a"}
BASIS = {"independent": "independent", "calibrated": "calibrated", "input": "input"}


def report(year, scenario_path, sources, results):
    counts = {}
    for r in results.values():
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    lines = ["# Validation of %s against %d statistics" % (os.path.basename(scenario_path), year), "",
             "Generated by `baseline/validate.py`. Each check compares a model output with an observed value. "
             "Basis says how much the agreement tests the model: `independent` outputs are not fitted to the "
             "observed value, `calibrated` outputs are fitted by `baseline/build.py`, and `input` checks confirm a "
             "scenario input matches its source. Status is ok within the tolerance, WARN within twice it and FAIL "
             "beyond. A failing check with a recorded issue is shown as a known issue.", "",
             "Summary: " + ", ".join("%d %s" % (counts[s], LABELS[s]) for s in LABELS if s in counts), ""]
    group = None
    for key, r in results.items():
        spec = r["spec"]
        if spec["group"] != group:
            group = spec["group"]
            lines += ["## " + group, "",
                      "| Check | Observed | Model | Error | Tolerance | Basis | Status |",
                      "|---|---|---|---|---|---|---|"]
        if r["status"] == "unavailable":
            lines.append("| %s (%s) | - | - | - | - | %s | n/a |" % (spec["label"], spec["units"], spec["basis"]))
            continue
        lines.append("| %s (%s) | %s | %s | %+.1f%% | %.0f%% | %s | %s |" % (
            spec["label"], spec["units"], number(r["value"]), number(r["model"]), r["error"] * 100,
            spec["tolerance"] * 100, spec["basis"], LABELS[r["status"]]))
    lines += ["", "## Details", ""]
    for key, r in results.items():
        spec = r["spec"]
        lines += ["### %s" % spec["label"], "", "- id: `%s`" % key]
        for ref in r["refs"]:
            lines.append("- " + ref)
        if r["status"] == "unavailable":
            lines.append("- unavailable: " + r["reason"])
        else:
            lines.append("- observed: `%s` = %s %s" % (spec["observed"]["formula"], number(r["value"]), spec["units"]))
            lines.append("- model: `%s` with %s = %s %s" % (
                spec["model"]["formula"], ", ".join("%s = `%s`" % kv for kv in spec["model"]["values"].items()),
                number(r["model"]), spec["units"]))
        if spec.get("note"):
            lines.append("- note: " + spec["note"])
        if spec.get("issue"):
            lines.append("- issue: " + spec["issue"])
        lines.append("")
    lines += ["## Sources", ""]
    used = sorted({ref.split("(")[1].split(",")[0] for r in results.values() for ref in r["refs"] if ".xls" in ref or ".ods" in ref})
    for src in sources.values():
        if src["file"] in used:
            lines.append("- %s, %s: [%s](%s)" % (src["title"], src["edition"], src["file"], src["url"]))
    lines.append("")
    return "\n".join(lines)


def number(x):
    if abs(x) >= 100:
        return "{:,.0f}".format(x)
    return "%.3g" % x if abs(x) < 10 else "%.1f" % x


def ui_file(year, scenario_path, results):
    """Observed values and model expressions for the UI, which evaluates the model side live."""
    checks = []
    for key, r in results.items():
        spec = r["spec"]
        c = {k: spec[k] for k in ("group", "label", "units", "tolerance", "basis") if k in spec}
        c["id"] = key
        c["model"] = spec["model"]
        c["note"] = spec.get("note", "")
        c["issue"] = spec.get("issue", "")
        c["status_at_build"] = r["status"]
        if r["status"] == "unavailable":
            c["observed"] = None
        else:
            c["observed"] = r["value"]
            c["model_at_build"] = r["model"]
        c["sources"] = r["refs"]
        checks.append(c)
    return {"scenario": os.path.splitext(os.path.basename(scenario_path))[0], "year": year,
            "generated": datetime.date.today().isoformat(), "warn_factor": WARN_FACTOR, "checks": checks}


def main():
    parser = argparse.ArgumentParser(description="Validate a baseline against observed statistics.")
    parser.add_argument("year", type=int)
    parser.add_argument("scenario")
    parser.add_argument("--strict", action="store_true", help="exit 1 on a failing check with no recorded issue")
    parser.add_argument("--report", help="report path, default baseline/reports/validation_<scenario>.md")
    args = parser.parse_args()
    scenario_path = os.path.abspath(args.scenario)
    try:
        sources, checks, results = validate(args.year, scenario_path)
    except BuildError as e:
        sys.exit("Error: %s" % e)

    name = os.path.splitext(os.path.basename(scenario_path))[0]
    report_path = os.path.abspath(args.report) if args.report else os.path.join(BASE, "reports", "validation_" + name + ".md")
    with open(report_path, "w") as f:
        f.write(report(args.year, scenario_path, sources, results))
    ui_dir = os.path.join(ROOT, "scenarios", "validation")
    os.makedirs(ui_dir, exist_ok=True)
    with open(os.path.join(ui_dir, name + ".json"), "w") as f:
        json.dump(ui_file(args.year, scenario_path, results), f, indent=1)
        f.write("\n")

    for key, r in results.items():
        spec = r["spec"]
        if r["status"] == "unavailable":
            print("%-11s %-52s %s" % ("n/a", spec["label"][:52], r["reason"][:60]))
        else:
            print("%-11s %-52s %12s %12s %+7.1f%%  %s" % (LABELS[r["status"]], spec["label"][:52], number(r["value"]),
                                                        number(r["model"]), r["error"] * 100, spec["units"]))
    print("Report: " + os.path.relpath(report_path, ROOT))
    failed = [k for k, r in results.items() if r["status"] == "fail"]
    if args.strict and failed:
        sys.exit("Failing checks with no recorded issue: " + ", ".join(failed))


if __name__ == "__main__":
    main()
