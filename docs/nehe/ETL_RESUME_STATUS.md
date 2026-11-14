# Registro de Progreso ETL — Malla Global H3 Resolución 3

**Fecha de pausa:** 2026-11-14  
**Estado:** Pausado por límite diario gratuito de Open-Meteo (`10,000` requests/día)  
**Progreso guardado:** `10,000 / 11,403` celdas H3 Res 3 (`87.7%`)  
**Pendientes:** `1,403` celdas  
**Archivo de checkpoint:** `backend/app/data/era5_res3_checkpoint.jsonl` (respaldado comprimido en [era5_res3_checkpoint.jsonl.gz](../backend/app/data/era5_res3_checkpoint.jsonl.gz) para cumplir el límite de 100 MB de GitHub)

---

## Cómo Retomar

Si retomas en otra máquina (donde solo está el `.gz`), primero descomprime el checkpoint:
```bash
gunzip -k backend/app/data/era5_res3_checkpoint.jsonl.gz
```

Cuando se renueve la cuota diaria de Open-Meteo (o desde otra red/IP), ejecutar:

### macOS / Linux
```bash
cd /Users/kevin/Downloads/nasa/backend
SSL_CERT_FILE=$(.venv/bin/python -c "import certifi; print(certifi.where())") .venv/bin/python -m app.etl.global_earth_etl
```

### Windows (PowerShell)
```powershell
cd backend
.\.venv\Scripts\python.exe -m app.etl.global_earth_etl
```

Al finalizar las `1,403` celdas restantes, el script actualizará automáticamente:
- `backend/app/data/earth_h3_grid.parquet`
- `backend/app/data/ckepi.duckdb`
- Y eliminará `era5_res3_checkpoint.jsonl`.
