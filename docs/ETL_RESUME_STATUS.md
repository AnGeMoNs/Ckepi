# Registro de Progreso ETL — Malla Global H3 Resolución 3

**Última actualización:** 2026-11-14  
**Rama:** `kevin`

## Estado por Fase (`enrich_global_grid.py`)

| Fase | Fuente / API | Estado | Progreso |
|---|---|---|---|
| Base H3 Res-3 | Open-Meteo ERA5-Land (`2024-03-01..07`) | Completada | `10,660 / 10,660` (`100%`) |
| Fase 1 (`--phase dem`) | Open-Meteo Copernicus 90m DEM + ASTER 30m (stencil 5 puntos) | Completada | `10,660 / 10,660` (`100%`) |
| Fase 2 (`--phase nasa_power`) | NASA POWER Climatology (20+ años `ANN`) | Completada | `10,660 / 10,660` (`100%`) |
| Fase 3 (`--phase consolidate`) | Física Planetaria (`Hertz-Knudsen` + `PARMA`) | Completada | `10,679` filas en DuckDB |
| Fase 4 (`--phase soil_geo`) | ISRIC SoilGrids v2.0 + Macrostrat | **Pausada** | **`2,440 / 7,676`** (`31.8%` prioritarias) |

---

## Cómo Retomar la Fase 4 (SoilGrids + Macrostrat)

El progreso de Fase 4 está guardado en `backend/app/data/ckpt_soil_geo_res3.jsonl` (y respaldado comprimido en [ckpt_soil_geo_res3.jsonl.gz](../backend/app/data/ckpt_soil_geo_res3.jsonl.gz)).

Si retomas en otra máquina (donde solo está el `.gz`), descomprime primero el checkpoint:
```powershell
cd backend
.\.venv\Scripts\python.exe -c "import gzip, shutil; shutil.copyfileobj(gzip.open('app/data/ckpt_soil_geo_res3.jsonl.gz', 'rb'), open('app/data/ckpt_soil_geo_res3.jsonl', 'wb'))"
```

Luego ejecuta para continuar desde `2,440 / 7,676` y consolidar al terminar:
```powershell
cd backend
.\.venv\Scripts\python.exe -m app.etl.enrich_global_grid --phase soil_geo --soil-geo-mode priority
.\.venv\Scripts\python.exe -m app.etl.enrich_global_grid --phase consolidate
```

Al finalizar, `earth_h3_grid` y la tabla auxiliar `earth_cell_enrichment` en `ckepi.duckdb` quedarán actualizadas con las `7,676` celdas prioritarias.
