"""List sheets in a cached source file, or print rows of one sheet.

Usage (from the repository root):
    python3 -I baseline/inspect_source.py <file>
    python3 -I baseline/inspect_source.py <file> <sheet> [pattern] [--width N]

<file> is a name in baseline/cache. Rows are printed as cell=value pairs.
With a pattern, only rows containing a matching cell (case insensitive regex)
are printed.
"""

import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import CACHE, BuildError, col_letters, fmt, read_sheet, sheet_names  # noqa: E402


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file")
    parser.add_argument("sheet", nargs="?")
    parser.add_argument("pattern", nargs="?")
    parser.add_argument("--width", type=int, default=60, help="truncate cell text")
    args = parser.parse_args()
    path = os.path.join(CACHE, args.file)

    if args.sheet is None:
        for name in sheet_names(path):
            print(name)
        return

    try:
        grid = read_sheet(path, args.sheet)
    except BuildError as e:
        sys.exit("Error: %s" % e)
    pattern = re.compile(args.pattern, re.I) if args.pattern else None
    for r in sorted(grid):
        cells = grid[r]
        if pattern and not any(pattern.search(str(v)) for v in cells.values()):
            continue
        print(" | ".join("%s%d=%s" % (col_letters(c), r, fmt(v)[:args.width]) for c, v in sorted(cells.items())))


if __name__ == "__main__":
    main()
