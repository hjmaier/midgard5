#!/usr/bin/env python3
"""Build a private install ZIP from a prepared source tree, not the Foundry app."""
import argparse
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("output", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "system.json").read_text())
if manifest.get("id") != "midgard5" or manifest.get("compatibility", {}).get("minimum") != "14":
    parser.error("Expected the MIDGARD 5 V14 source tree")

entries = {root / name for name in (
    "system.json", "midgard5.js", "midgard5.css", "LICENSE.txt", "README.md", "V14-TESTPLAN.md"
)}
for directory in ("module", "templates", "lang", "assets"):
    entries.update(item for item in (root / directory).rglob("*")
                   if item.is_file() and not any(p.startswith(".") for p in item.relative_to(root).parts))
for pack in manifest["packs"]:
    directory = (root / pack["path"]).resolve()
    if not directory.is_relative_to(root / "packs") or not (directory / "CURRENT").is_file():
        parser.error(f"Missing prepared LevelDB pack: {pack['path']}")
    entries.update(item for item in directory.iterdir() if item.is_file()
                   and item.name not in {"LOCK", "LOG", "LOG.old"})

with ZipFile(args.output, "w", compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for entry in sorted(entries):
        if entry.is_symlink():
            parser.error(f"Unexpected symlink: {entry}")
        archive.write(entry, entry.relative_to(root))
with ZipFile(args.output) as archive:
    failure = archive.testzip()
    if failure:
        raise SystemExit(f"ZIP integrity check failed: {failure}")
print(f"{args.output}: {len(entries)} entries")
