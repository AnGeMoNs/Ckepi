"""Export verified metrics from Ckepi backend & DuckDB for the 7-slide pitch deck."""

from __future__ import annotations

import json
from pathlib import Path
import duckdb
from fastapi.testclient import TestClient

from app.config import BREAKAGE_VARIABLES, DEPENDENT_VARIABLES, INDEPENDENT_VARIABLES
from app.engine.known_analogs import KNOWN_ANALOG_SITES
from app.main import app


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    db_path = repo_root / "backend" / "app" / "data" / "ckepi.duckdb"
    out_path = repo_root / "docs" / "presentation" / "pitch_verified_metrics.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    con = duckdb.connect(str(db_path), read_only=True)
    res_counts = {
        int(row[0]): int(row[1])
        for row in con.execute(
            "SELECT h3_resolution, count(*) FROM earth_h3_grid GROUP BY h3_resolution ORDER BY h3_resolution"
        ).fetchall()
    }
    total_earth_cells = sum(res_counts.values())
    con.close()

    with TestClient(app) as client:
        health = client.get("/api/v1/health").json()
        sites = client.get("/api/v1/planetary-sites").json()

        jezero_decomp = client.post(
            "/api/v1/decompose",
            json={"site_id": "mars_jezero_crater", "model_type": "ridge"},
        ).json()

        jezero_search = client.post(
            "/api/v1/analogs/search",
            json={
                "site_id": "mars_jezero_crater",
                "model_type": "ridge",
                "min_s_ind": 0.0,
                "min_s_dep": 0.0,
                "limit": 2000,
            },
        ).json()

        matches = jezero_search["matches"]
        atacama_cell = next(
            (m for m in matches if m["earth_cell_h3"] == "82b227fffffffff"),
            matches[0] if matches else None,
        )

        atacama_compare = None
        if atacama_cell is not None:
            atacama_compare = client.get(
                f"/api/v1/analogs/{atacama_cell['earth_cell_h3']}/compare/mars_jezero_crater"
            ).json()

        moon_search = client.post(
            "/api/v1/analogs/search",
            json={
                "site_id": "moon_shackleton_pole",
                "model_type": "ridge",
                "min_s_ind": 0.0,
                "min_s_dep": 0.0,
                "limit": 5,
            },
        ).json()

    snapshot = {
        "schema_counts": {
            "independent_variables": len(INDEPENDENT_VARIABLES),
            "dependent_variables": len(DEPENDENT_VARIABLES),
            "breakage_variables": len(BREAKAGE_VARIABLES),
            "total_canonical_variables": (
                len(INDEPENDENT_VARIABLES) + len(DEPENDENT_VARIABLES) + len(BREAKAGE_VARIABLES)
            ),
            "known_analog_benchmarks": len(KNOWN_ANALOG_SITES),
            "curated_planetary_sites": len(sites),
            "earth_h3_cells_total": total_earth_cells,
            "earth_h3_by_resolution": res_counts,
        },
        "health": health,
        "jezero_breakage": jezero_decomp.get("breakage_profile", []),
        "jezero_top_weights": sorted(
            jezero_decomp.get("global_iv_weights", {}).items(),
            key=lambda kv: kv[1],
            reverse=True,
        )[:5],
        "atacama_cell": atacama_cell,
        "atacama_compare_summary": {
            "valid_tests_count": len(atacama_compare.get("valid_tests", []))
            if atacama_compare
            else 0,
            "invalid_tests_count": len(atacama_compare.get("invalid_tests", []))
            if atacama_compare
            else 0,
            "valid_tests": atacama_compare.get("valid_tests", [])[:3] if atacama_compare else [],
            "invalid_tests": atacama_compare.get("invalid_tests", [])[:3]
            if atacama_compare
            else [],
            "sample_deltas": [
                d
                for d in (atacama_compare.get("variable_deltas", []) if atacama_compare else [])
                if d["variable"]
                in {
                    "slope_deg",
                    "aridity_index",
                    "diurnal_temp_amplitude_k",
                    "gravity_g",
                    "atm_pressure_mbar",
                    "radiation_msv_yr",
                }
            ],
        },
        "moon_top_match": moon_search["matches"][0] if moon_search.get("matches") else None,
    }

    out_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote verified snapshot to {out_path}")


if __name__ == "__main__":
    main()
