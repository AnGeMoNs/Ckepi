"""Export the real data used by the local "Explore" mode to static JSON for the frontend.

The local mode must work as a static site (no backend at the venue): this snapshots the
planetary sites and the four real-DEM comparisons Jezero ↔ Antofagasta through the same
API code paths. Re-run whenever the data or the terrain engine change.

Usage (from backend/):  .venv/bin/python scripts/export_local_static_data.py
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

OUT_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "data" / "local"
SITES = ("moon_shackleton_pole", "mars_jezero_crater")
CELLS = ("83b224fffffffff", "83b220fffffffff", "83b225fffffffff", "83b221fffffffff")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with TestClient(app) as client:
        sites = client.get("/api/v1/planetary-sites").json()
        selected = [s for s in sites if s["site_id"] in SITES]
        (OUT_DIR / "sites.json").write_text(json.dumps(selected, ensure_ascii=False) + "\n")
        for cell in CELLS:
            res = client.get(f"/api/v1/analogs/{cell}/compare/mars_jezero_crater", params={"model_type": "ridge"})
            res.raise_for_status()
            (OUT_DIR / f"compare-{cell}.json").write_text(json.dumps(res.json(), ensure_ascii=False) + "\n")
            slope = res.json()["statistical_distribution"]["slope_distribution"]
            print(f"{cell}: W1 {slope['wasserstein_distance']}° (control {slope['control_yungay_w1']}°)")
    meta = {
        "generated_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sites": list(SITES),
        "cells": list(CELLS),
        "note": "Snapshot of the Ckepi API for the static local mode. Terrain: real DEMs (CTX Jezero, Copernicus GLO-30).",
    }
    (OUT_DIR / "meta.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(f"wrote {OUT_DIR}")


if __name__ == "__main__":
    main()
