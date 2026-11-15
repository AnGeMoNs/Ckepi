# Registro de Progreso ETL — Malla Global H3 Resolución 3

**Última actualización:** 2026-11-15  
**Rama:** `kevin`

## Estado por Fase (`enrich_global_grid.py`)

| Fase | Fuente / API | Estado | Progreso |
|---|---|---|---|
| Base H3 Res-3 | Open-Meteo ERA5-Land (`2024-03-01..07`) | **Completada** | `10,660 / 10,660` (`100%`) |
| Fase 1 (`--phase dem`) | Open-Meteo Copernicus 90m DEM + ASTER 30m (stencil 5 puntos) | **Completada** | `10,660 / 10,660` (`100%`) |
| Fase 2 (`--phase nasa_power`) | NASA POWER Climatology (20+ años `ANN`) | **Completada** | `10,660 / 10,660` (`100%`) |
| Fase 3 (`--phase consolidate`) | Física Planetaria (`Hertz-Knudsen` + `PARMA`) | **Completada** | `10,679` filas en DuckDB |
| Fase 4 (`--phase soil_geo`) | ISRIC SoilGrids v2.0 + Macrostrat (`--soil-geo-mode priority`) | **Completada** | `7,676 / 7,676` (`100%` prioritarias; `7,632` con litología Macrostrat, `1,198` con SoilGrids) |
