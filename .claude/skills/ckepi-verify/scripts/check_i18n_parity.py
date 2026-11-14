#!/usr/bin/env python3
"""Verifica que es.json, pt.json y en.json tengan exactamente las mismas claves (anidadas)."""
import json
import sys
from pathlib import Path

I18N_DIR = Path(__file__).resolve().parents[4] / "frontend" / "src" / "i18n"
LOCALES = ("es", "pt", "en")


def flatten(node, prefix=""):
    if isinstance(node, dict):
        for key, value in node.items():
            yield from flatten(value, f"{prefix}{key}.")
    else:
        yield prefix.rstrip(".")


def main() -> int:
    keys = {
        loc: set(flatten(json.loads((I18N_DIR / f"{loc}.json").read_text(encoding="utf-8"))))
        for loc in LOCALES
    }
    union = set.union(*keys.values())
    ok = True
    for loc in LOCALES:
        missing = sorted(union - keys[loc])
        if missing:
            ok = False
            print(f"[{loc}] faltan {len(missing)} claves:")
            for key in missing:
                print(f"  - {key}")
    print(f"OK: paridad total ({len(union)} claves)" if ok else "FALLO: paridad i18n rota")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
