# Baseline build

Scripted derivation of baseline scenario inputs from published statistics. It covers steps 1 to 10 of [updating-the-baseline.md](../docs/updating-the-baseline.md), one input file per step, and generates every input in `scenarios/baseline_2024.json` and `scenarios/baseline_2018.json` from the same files. Known issues are tracked in [open-items.md](open-items.md).

## Files

- `sources.json`: source documents. Publisher page, direct download URL, edition, cache file name and sha256.
- `inputs/*.json`: one entry per scenario input, one file per guide step. Files are merged in name order. Year independent, `{year}` is substituted at build time.
- `inspect_source.py`: lists sheets in a cached file or prints its rows, for writing locators and checking values.
- `build.py`: downloads missing sources to `cache/`, checks hashes, extracts values, calibrates against the model and writes a report.
- `reports/`: one report per scenario, listing each value with its source cell.
- `cache/`: downloaded source files. Not in git. The hashes in `sources.json` identify the exact files used.

## Usage

From the repository root:

```
python3 -I baseline/build.py 2024 scenarios/baseline_2024.json
python3 -I baseline/build.py 2024 scenarios/baseline_2024.json --write
```

The first form writes the report only. `--write` also updates the scenario file.

To work on one step, pass `--inputs` with that file and any files it refers to, and `--report` to keep the full report intact:

```
python3 -I baseline/build.py 2024 scenarios/baseline_2024.json --inputs 02-population.json 07-transport.json --report /tmp/r07.md
```

## Input types

- `statistic`: values read from sources, combined by `formula`, rounded to `round` decimal places.
- `calibrated`: set so the model output named in `model_output` (multiplied by `model_scale`, default 1, to convert units) equals `target`. The output is assumed proportional to the input, or inversely proportional with `"relation": "inverse"` (for example fuel use and engine efficiency). Each pass runs the model and rescales every calibrated input by its own ratio, until every ratio is within one part in a million or after 25 passes, so results do not depend on the starting values, so inputs that affect each other (gas losses depend on backup gas, which depends on wind) settle together. Calibration starts from the scenario's current value. A final run checks every result is within 0.5% of target.
- `intermediate`: computed like a statistic and shown in the report, but not written to the scenario. Use it for subtotals that other entries refer to.

Entries whose path starts with `_` are working values and are never written to the scenario, whatever their type. A calibrated working value is useful when the model output depends on a subtotal, such as heat pump heat. Statistics that refer to a calibrated value, directly or through other entries, are recalculated after each calibration pass, so a remainder such as `1 - prc.EV` stays consistent.
- `assumption`: a fixed `value` with a `note` giving the reason.

Any entry can add a `check`: a comparison between an observed value and a model output that is reported but not calibrated.

## Locating values

A value is located by its content, not by a fixed cell reference:

```
{"source": "dukes_6.2", "sheet": "6.2", "block": "Generation (GWh)", "row": ["Offshore"], "column": "{year}"}
```

- `block`: text at the start of a cell that begins the table. The first matching cell is used.
- `column`: header text of the column, found in the first row at or below the block title that contains it.
- `row`: labels in the first columns of the row, compared in order. The search ends at the next header row.
- `after` (optional): first column label of a row to start the search below, for tables that repeat row labels, such as "Petroleum refineries" under both transformation and energy industry use in DUKES 1.1.

`{year}` is substituted in `block`, `row` and `column`. Labels are compared ignoring case, `[note n]` markers, extra spaces and trailing colons. A value of `{"ref": "supply.offshore_wind_capacity"}` uses an input computed earlier in the merged inputs. If a table is restructured in a new edition the build stops with an error naming the missing block, row or column.

For long format tables, such as the greenhouse gas dataset, a value can be the sum of a column over the rows that match every condition:

```
{"source": "ghg_by_source", "sheet": "UK_by_source", "sum": "Emissions (MtCO2e)", "where": {"Year": "{year}", "Territorial Emissions Statistics category": "Cement production"}}
```

A condition value can be a list, matching any of its items, can contain `*` wildcards, and can start with `<=` for a numeric upper limit, such as `"Year Commissioned": "<={year}"`. `where_not` excludes rows in the same way, for example every land use code in a group except burning and mineralisation:

```
"where": {"Year": "{year}", "CRT category": "4C*"}, "where_not": {"CRT category": ["*(III)*", "*(IV)*"]}
```

The build stops if no rows match, unless the locator has `"allow_empty": true`, for a source that stops in a later year (ammonia production ceased in 2023).

## Coverage

The report ends with two lists: values set in the scenario that the build does not generate, and values the scenario inherits from `scenarios/zerocarbonbritain.json`. Inherited values should be things a baseline does not use, such as costs or settings for processes with zero capacity. Anything else should get an entry, even if it is an `assumption` with the default value, so a change to the ZCB scenario cannot change the baseline.

## New edition

1. Update `url` and `edition` in `sources.json`, and delete the old file from `cache/`.
2. Run the build. It stops on a hash mismatch. Check the new file, then rerun with `--update-hashes`.
3. Fix any locator errors in `inputs/`.
4. Review the report and compare it with the previous baseline before running with `--write`.
