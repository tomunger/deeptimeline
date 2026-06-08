#!/usr/bin/env python3
"""Extract official ICS colours from CGMW_ICS_colour_codes.xlsx into a
normalized {key: "#RRGGBB"} JSON used by apps/ingest/src/gen-gts.ts.

key = lowercased, alphanumeric-only form of the spreadsheet's `isc:` name
(column B), e.g. isc:CambrianStage2 -> "cambrianstage2", isc:LowerTriassic ->
"lowertriassic". Column O holds the official HTML hex.

Run:  python3 reference/extract-ics-colors.py
"""
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
HERE = Path(__file__).resolve().parent
XLSX = HERE / "CGMW_ICS_colour_codes.xlsx"
OUT = HERE.parent / "apps" / "ingest" / "src" / "ics-colors.json"


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main() -> None:
    z = zipfile.ZipFile(XLSX)
    shared = [
        "".join(t.text or "" for t in si.iter(f"{NS}t"))
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(f"{NS}si")
    ]
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))

    colors: dict[str, str] = {}
    for row in sheet.iter(f"{NS}row"):
        cells: dict[str, str] = {}
        for c in row.findall(f"{NS}c"):
            v = c.find(f"{NS}v")
            if v is None:
                continue
            cells[re.match(r"[A-Z]+", c.get("r")).group()] = (
                shared[int(v.text)] if c.get("t") == "s" else v.text
            )
        isc, hex_ = cells.get("B"), cells.get("O")
        if isc and isc.startswith("isc:") and hex_:
            colors[norm(isc[4:])] = hex_.upper()

    OUT.write_text(json.dumps(colors, indent=0, sort_keys=True) + "\n")
    print(f"Wrote {len(colors)} colours to {OUT.relative_to(HERE.parent)}")


if __name__ == "__main__":
    main()
