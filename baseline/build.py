"""Build baseline scenario inputs from cached source documents.

Usage (from the repository root):
    python3 -I baseline/build.py 2024 scenarios/baseline_2024.json [--write] [--update-hashes]
        [--inputs FILE ...] [--report PATH]

Reads baseline/sources.json and baseline/inputs/*.json, downloads any source
missing from baseline/cache, checks its sha256, extracts and converts each
input, calibrates against the model and writes a report to
baseline/reports/<scenario name>.md. The scenario file is only changed with
--write.
"""

import argparse
import copy
import fnmatch
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "baseline")
CACHE = os.path.join(BASE, "cache")
NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "rel": "http://schemas.openxmlformats.org/package/2006/relationships"}
CALIBRATION_TOLERANCE = 0.005
CALIBRATION_PASSES = 10


class BuildError(Exception):
    pass


# Sources

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch_sources(sources, update_hashes):
    os.makedirs(CACHE, exist_ok=True)
    status = {}
    for key, src in sources.items():
        path = os.path.join(CACHE, src["file"])
        if not os.path.exists(path):
            print("Downloading " + src["url"])
            req = urllib.request.Request(src["url"], headers={"User-Agent": "Mozilla/5.0 (hourlymodel-baseline)"})
            with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as f:
                f.write(r.read())
        digest = sha256(path)
        if digest == src.get("sha256"):
            status[key] = "match"
        elif update_hashes:
            src["sha256"] = digest
            status[key] = "updated"
        else:
            raise BuildError("%s: sha256 %s does not match sources.json. Check the new file, "
                             "then rerun with --update-hashes." % (src["file"], digest))
    return status


# Spreadsheet reading

ODS = {"office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
       "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
       "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0"}


def col_letters(index):
    s = ""
    index += 1
    while index:
        index, rem = divmod(index - 1, 26)
        s = chr(65 + rem) + s
    return s


def col_index(letters):
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n - 1


def xlsx_sheets(z):
    workbook = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    targets = {r.get("Id"): r.get("Target") for r in rels.findall("rel:Relationship", NS)}
    return {sheet.get("name"): "xl/" + targets[sheet.get("{%s}id" % NS["r"])].lstrip("/").replace("xl/", "", 1)
            for sheet in workbook.find("a:sheets", NS)}


def ods_tables(path):
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("content.xml"))
    return {t.get("{%s}name" % ODS["table"]): t for t in root.iter("{%s}table" % ODS["table"])}


def sheet_names(path):
    if path.endswith(".ods"):
        return list(ods_tables(path))
    with zipfile.ZipFile(path) as z:
        return list(xlsx_sheets(z))


def read_sheet(path, sheet_name):
    """Return {row number: {column index: str or float}}."""
    if path.endswith(".ods"):
        return read_ods_sheet(path, sheet_name)
    with zipfile.ZipFile(path) as z:
        strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("a:si", NS):
                strings.append("".join(t.text or "" for t in si.iter("{%s}t" % NS["a"])))
        sheets = xlsx_sheets(z)
        if sheet_name not in sheets:
            raise BuildError("%s: no sheet named %r" % (os.path.basename(path), sheet_name))
        root = ET.fromstring(z.read(sheets[sheet_name]))

    grid = {}
    for row in root.iter("{%s}row" % NS["a"]):
        cells = {}
        for c in row.findall("a:c", NS):
            ref = re.match(r"([A-Z]+)(\d+)", c.get("r"))
            t = c.get("t")
            if t == "inlineStr":
                value = "".join(x.text or "" for x in c.iter("{%s}t" % NS["a"]))
            else:
                v = c.find("a:v", NS)
                if v is None:
                    continue
                if t == "s":
                    value = strings[int(v.text)]
                elif t in ("str", "e", "b"):
                    value = v.text
                else:
                    value = float(v.text)
            cells[col_index(ref.group(1))] = value
        if cells:
            grid[int(row.get("r"))] = cells
    return grid


def read_ods_sheet(path, sheet_name):
    tables = ods_tables(path)
    if sheet_name not in tables:
        raise BuildError("%s: no sheet named %r" % (os.path.basename(path), sheet_name))
    t = "{%s}" % ODS["table"]
    grid = {}
    r = 1
    for row in tables[sheet_name].iter(t + "table-row"):
        repeat = int(row.get(t + "number-rows-repeated", "1"))
        cells = {}
        c = 0
        for cell in row:
            span = int(cell.get(t + "number-columns-repeated", "1"))
            kind = cell.get("{%s}value-type" % ODS["office"])
            if kind in ("float", "percentage", "currency"):
                value = float(cell.get("{%s}value" % ODS["office"]))
            elif kind is not None:
                value = "\n".join("".join(p.itertext()) for p in cell.iter("{%s}p" % ODS["text"]))
            else:
                value = None
            if value is not None:
                for i in range(span):
                    cells[c + i] = value
            c += span
        if cells:
            for i in range(repeat):
                grid[r + i] = dict(cells)
        r += repeat
    return grid


def norm(value):
    if isinstance(value, float):
        return repr(int(value)) if value.is_integer() else repr(value)
    s = re.sub(r"\[note[^\]]*\]", "", value, flags=re.I)
    s = re.sub(r"\s+", " ", s).strip().rstrip(":").strip()
    return s.casefold()


def sub_year(text, year):
    """Replace {year}, {year-1}, {year+1} and so on with the year."""
    return re.sub(r"\{year(?:([+-])(\d+))?\}",
                  lambda m: str(year + (int(m.group(2)) * (1 if m.group(1) == "+" else -1) if m.group(1) else 0)),
                  text)


def locate(grid, spec, year):
    """Find a value by block title, row labels and column header."""
    block_text = sub_year(spec["block"], year)
    column_text = sub_year(spec["column"], year)
    block = norm(block_text)
    column = norm(column_text)
    labels = [norm(sub_year(x, year)) for x in spec["row"]]
    rows = sorted(grid)
    where = "%s!%s" % (spec["source"], spec["sheet"])

    def is_block(v):
        return norm(v).startswith(block) if isinstance(v, str) else norm(v) == block

    block_row = next((r for r in rows if any(is_block(v) for v in grid[r].values())), None)
    if block_row is None:
        raise BuildError("%s: block %r not found" % (where, block_text))

    header_row = col = None
    for r in rows:
        if r < block_row:
            continue
        col = next((c for c, v in grid[r].items() if norm(v) == column), None)
        if col is not None:
            header_row = r
            break
    if header_row is None:
        raise BuildError("%s: column %r not found after block %r" % (where, column_text, block_text))

    start = header_row
    if "after" in spec:
        after = norm(sub_year(spec["after"], year))
        start = next((r for r in rows if r > header_row and norm(grid[r].get(0, "")) == after), None)
        if start is None:
            raise BuildError("%s: row %r not found in block %r" % (where, spec["after"], block_text))

    for r in rows:
        if r <= start:
            continue
        cells = grid[r]
        if col in cells and norm(cells[col]) == column:
            break  # next table header
        found = [cells.get(i) for i in range(len(labels))]
        if all(v is not None for v in found) and [norm(v) for v in found] == labels:
            value = cells.get(col)
            ref = "%s%d" % (col_letters(col), r)
            if not isinstance(value, float):
                raise BuildError("%s!%s is %r, expected a number" % (where, ref, value))
            return value, ref
    raise BuildError("%s: row %r not found in block %r" % (where, spec["row"], block_text))


def query(grid, spec, year):
    """Sum a column over the rows of a long format table that match every condition in where
    and none in where_not. Condition values may contain * wildcards."""
    where = "%s!%s" % (spec["source"], spec["sheet"])

    def patterns(spec_conditions):
        out = {}
        for column, values in spec_conditions.items():
            values = values if isinstance(values, list) else [values]
            out[norm(column)] = [norm(sub_year(str(v), year)) for v in values]
        return out

    def matches(cell, pats):
        return cell is not None and any(fnmatch.fnmatchcase(norm(cell), p) for p in pats)

    include = patterns(spec["where"])
    exclude = patterns(spec.get("where_not", {}))
    wanted = set(include) | set(exclude) | {norm(spec["sum"])}

    rows = sorted(grid)
    header_row = next((r for r in rows if wanted <= {norm(v) for v in grid[r].values()}), None)
    if header_row is None:
        raise BuildError("%s: no header row with columns %r" % (where, sorted(wanted)))
    cols = {norm(v): c for c, v in grid[header_row].items()}

    total = 0.0
    count = 0
    for r in rows:
        if r <= header_row:
            continue
        cells = grid[r]
        if not all(matches(cells.get(cols[k]), p) for k, p in include.items()):
            continue
        if any(matches(cells.get(cols[k]), p) for k, p in exclude.items()):
            continue
        value = cells.get(cols[norm(spec["sum"])])
        if isinstance(value, float):
            total += value
            count += 1
    if count == 0:
        raise BuildError("%s: no rows match %r" % (where, spec["where"]))
    return total, "sum of %d rows" % count


# Inputs

def get_path(obj, path):
    for key in path.split("."):
        obj = obj[key]
    return obj


def set_path(obj, path, value):
    keys = path.split(".")
    for key in keys[:-1]:
        obj = obj.setdefault(key, {})
    obj[keys[-1]] = value


def evaluate(expr, names):
    return eval(expr, {"__builtins__": {}}, dict(names))


def extract_values(specs, sources, results, year, sheets, refs):
    names = {}
    for name, spec in specs.items():
        if "ref" in spec:
            names[name] = results[spec["ref"]]["value"]
            refs.append("%s = %s (%s)" % (name, fmt(names[name]), spec["ref"]))
            continue
        src = sources[spec["source"]]
        spec = dict(spec, sheet=sub_year(spec["sheet"], year))
        key = (spec["source"], spec["sheet"])
        if key not in sheets:
            sheets[key] = read_sheet(os.path.join(CACHE, src["file"]), spec["sheet"])
        if "where" in spec:
            value, ref = query(sheets[key], spec, year)
            ref = "%s where %s" % (ref, sub_year(json.dumps(spec["where"]), year))
            if "where_not" in spec:
                ref += " and not %s" % json.dumps(spec["where_not"])
        else:
            value, ref = locate(sheets[key], spec, year)
        names[name] = value
        refs.append("%s = %s (%s, %s!%s)" % (name, fmt(value), src["file"], spec["sheet"], ref))
    return names


def rounded(x, places):
    """Round to places; zero or negative places give an int."""
    return int(round(x, places)) if places <= 0 else round(x, places)


def fmt(x):
    return ("%.10g" % x) if isinstance(x, float) else str(x)


def run_model(scenario):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(scenario, f)
        path = f.name
    try:
        out = subprocess.run(["node", "docs/run_scenario.js", path, "--json"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout
    finally:
        os.unlink(path)
    return json.loads(out.strip().splitlines()[-1])


def load_inputs(only):
    """Merge baseline/inputs/*.json in name order, or only the named files."""
    folder = os.path.join(BASE, "inputs")
    names = sorted(n for n in os.listdir(folder) if n.endswith(".json"))
    if only:
        missing = set(only) - set(names)
        if missing:
            raise BuildError("no input file %s" % ", ".join(sorted(missing)))
        names = [n for n in names if n in only]
    inputs = {}
    for name in names:
        with open(os.path.join(folder, name)) as f:
            for path, spec in json.load(f).items():
                if path in inputs:
                    raise BuildError("%s: %s is defined twice" % (name, path))
                inputs[path] = spec
    return inputs


def build(year, scenario_path, update_hashes, only=None):
    with open(os.path.join(BASE, "sources.json")) as f:
        sources = json.load(f)
    inputs = load_inputs(only)
    with open(scenario_path) as f:
        current = json.load(f)

    status = fetch_sources(sources, update_hashes)
    sheets = {}
    results = {}

    for path, spec in inputs.items():
        r = {"type": spec["type"], "units": spec.get("units", ""), "note": spec.get("note", ""), "refs": []}
        if spec["type"] == "assumption":
            r["value"] = spec["value"]
        else:
            names = extract_values(spec["values"], sources, results, year, sheets, r["refs"])
            if spec["type"] in ("statistic", "intermediate"):
                r["formula"] = spec["formula"]
                r["value"] = rounded(evaluate(spec["formula"], names), spec.get("round", 3))
            else:
                inverse = spec.get("relation") == "inverse"
                r["formula"] = "%s, target = %s" % (
                    "model output inversely proportional to input" if inverse else "model output proportional to input",
                    spec["target"])
                r["target"] = evaluate(spec["target"], names)
                try:
                    start = get_path(current, path)
                except KeyError:
                    start = None
                r["value"] = start if isinstance(start, (int, float)) and start > 0 else 1
        if "check" in spec:
            check = spec["check"]
            names = extract_values(check["values"], sources, results, year, sheets, r["refs"])
            names["value"] = r["value"]
            r["check"] = dict(check, observed=evaluate(check["target"], names))
        try:
            r["current"] = None if spec["type"] == "intermediate" else get_path(current, path)
        except KeyError:
            r["current"] = None
        results[path] = r

    scenario = copy.deepcopy(current)
    for path, r in results.items():
        if r["type"] != "intermediate":
            set_path(scenario, path, r["value"])

    # Calibrated inputs can affect each other (gas losses depend on backup gas, which depends on
    # wind), so each pass rescales every input by its own target ratio until all are within tolerance.
    calibrated = [p for p, r in results.items() if r["type"] == "calibrated"]
    for n in range(CALIBRATION_PASSES):
        if not calibrated:
            break
        out = run_model(scenario)
        settled = True
        for path in calibrated:
            r, spec = results[path], inputs[path]
            model = get_path(out, spec["model_output"]) * spec.get("model_scale", 1)
            if n == 0:
                r["model_start"] = model
                r["start"] = r["value"]
            ratio = r["target"] / model
            if abs(ratio - 1) > CALIBRATION_TOLERANCE / 10:
                settled = False
            r["value"] = r["value"] / ratio if spec.get("relation") == "inverse" else r["value"] * ratio
            set_path(scenario, path, r["value"])
        if settled:
            break
    for path in calibrated:
        results[path]["value"] = rounded(results[path]["value"], inputs[path].get("round", 3))
        set_path(scenario, path, results[path]["value"])

    # Verification run with final values
    out = run_model(scenario)
    failures = []
    for path, r in results.items():
        if r["type"] == "calibrated":
            r["model_final"] = get_path(out, inputs[path]["model_output"]) * inputs[path].get("model_scale", 1)
            error = r["model_final"] / r["target"] - 1
            r["ok"] = abs(error) <= CALIBRATION_TOLERANCE
            if not r["ok"]:
                failures.append("%s: model %.4f against target %.4f" % (path, r["model_final"], r["target"]))
        if "check" in r:
            c = r["check"]
            c["model"] = get_path(out, c["model_output"]) * c.get("model_scale", 1)
            c["ok"] = abs(c["model"] / c["observed"] - 1) <= c["tolerance"]

    with open(os.path.join(ROOT, "scenarios", "zerocarbonbritain.json")) as f:
        default = json.load(f)
    own = set(leaves(scenario))
    built = {p for p, r in results.items() if r["type"] != "intermediate"}
    coverage = {
        "inherited": [p for p in leaves(default) if p not in own],
        "not_built": [p for p in leaves(scenario) if p not in built],
    }
    return sources, status, results, scenario, failures, coverage


def leaves(obj, prefix=""):
    """Dotted paths of every non-dict value."""
    for key, value in obj.items():
        path = prefix + "." + key if prefix else key
        if isinstance(value, dict):
            yield from leaves(value, path)
        else:
            yield path


# Report

def report(year, scenario_path, sources, status, results, failures, coverage):
    lines = ["# Baseline %d inputs" % year, "",
             "Generated by `baseline/build.py` for `%s`." % os.path.relpath(scenario_path, ROOT), "",
             "## Sources", "",
             "| Source | Edition | File | sha256 | Status |",
             "|---|---|---|---|---|"]
    for key, src in sources.items():
        lines.append("| %s | %s | [%s](%s) | `%s` | %s |" % (
            src["title"], src["edition"], src["file"], src["url"], src["sha256"][:12], status[key]))

    lines += ["", "## Inputs", "",
              "| Input | Value | Previous | Units | Type |",
              "|---|---|---|---|---|"]
    for path, r in results.items():
        if r["type"] == "intermediate":
            lines.append("| `%s` | %s | - | %s | intermediate |" % (path, fmt(r["value"]), r["units"]))
            continue
        changed = "" if r["current"] == r["value"] else " (changed)"
        lines.append("| `%s` | %s | %s%s | %s | %s |" % (
            path, fmt(r["value"]), fmt(r["current"]), changed, r["units"], r["type"]))

    lines += ["", "## Derivation", ""]
    for path, r in results.items():
        lines.append("### `%s`" % path)
        lines.append("")
        for ref in r["refs"]:
            lines.append("- " + ref)
        if "formula" in r:
            lines.append("- formula: `%s`" % r["formula"])
        if r["type"] == "calibrated":
            lines.append("- target %.4f; model %.4f with %s, %.4f with %s (%s)" % (
                r["target"], r["model_start"], fmt(r["start"]), r["model_final"], fmt(r["value"]),
                "ok" if r["ok"] else "FAIL"))
        if "check" in r:
            c = r["check"]
            lines.append("- check: observed %.4f, model %.4f (%s). %s" % (
                c["observed"], c["model"], "ok" if c["ok"] else "outside %.0f%%" % (c["tolerance"] * 100),
                c.get("note", "")))
        if r["note"]:
            lines.append("- note: " + r["note"])
        lines.append("")

    lines += ["## Coverage", "",
              "Set in the scenario but not generated by the build: %s" % (
                  ", ".join("`%s`" % p for p in coverage["not_built"]) or "none"), "",
              "Inherited from the default scenario (zerocarbonbritain.json), %d values. Check none of these "
              "should be set for a baseline:" % len(coverage["inherited"]), ""]
    groups = {}
    for p in coverage["inherited"]:
        head = p.split(".")[0]
        groups.setdefault(head, []).append(p)
    for head, paths in groups.items():
        lines.append("- %s" % ", ".join("`%s`" % p for p in paths))
    lines += ["", "## Result", "", "Calibration failures: %s" % ("; ".join(failures) if failures else "none"), ""]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Build baseline inputs from source documents.")
    parser.add_argument("year", type=int)
    parser.add_argument("scenario", help="scenario JSON to compare against and update")
    parser.add_argument("--write", action="store_true", help="write new values to the scenario")
    parser.add_argument("--update-hashes", action="store_true", help="accept new source file hashes")
    parser.add_argument("--inputs", nargs="+", help="only these files from baseline/inputs")
    parser.add_argument("--report", help="report path, default baseline/reports/<scenario>.md")
    args = parser.parse_args()
    if args.write and args.inputs:
        sys.exit("--write needs the full set of inputs")
    scenario_path = os.path.abspath(args.scenario)

    try:
        sources, status, results, scenario, failures, coverage = build(args.year, scenario_path, args.update_hashes, args.inputs)
    except BuildError as e:
        sys.exit("Error: %s" % e)

    os.makedirs(os.path.join(BASE, "reports"), exist_ok=True)
    name = os.path.splitext(os.path.basename(scenario_path))[0]
    report_path = os.path.abspath(args.report) if args.report else os.path.join(BASE, "reports", name + ".md")
    with open(report_path, "w") as f:
        f.write(report(args.year, scenario_path, sources, status, results, failures, coverage))

    for path, r in results.items():
        mark = "" if r["type"] == "intermediate" or r["current"] == r["value"] else "  <- was %s" % fmt(r["current"])
        print("%-40s %10s%s" % (path, fmt(r["value"]), mark))
    print("Report: " + os.path.relpath(report_path, ROOT))

    if "updated" in status.values():
        with open(os.path.join(BASE, "sources.json"), "w") as f:
            json.dump(sources, f, indent=4)
            f.write("\n")
    if failures:
        sys.exit("Calibration failed: " + "; ".join(failures))
    if args.write:
        with open(scenario_path, "w") as f:
            json.dump(scenario, f, indent=4)
            f.write("\n")
        print("Wrote " + os.path.relpath(scenario_path, ROOT))


if __name__ == "__main__":
    main()
