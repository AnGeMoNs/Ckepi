---
name: ckepi-engine-change
description: Guía para modificar el motor científico de Ckepi (backend/app/engine y config.py) o añadir variables y fuentes de datos. Úsala cuando se pida añadir/quitar una variable X, Y o B, cambiar pesos, escalas FEATURE_SCALES, la métrica S_ind/S_dep/R_break, el umbral de ruptura, un conector ETL o un endpoint de análogos, aunque el usuario solo diga "mejora el matching" o "agrega este dataset".
---

# ckepi-engine-change

El modelo separa tres capas y mezclarlas rompe la tesis del proyecto (rigor causal): **X** forzamientos independientes, **Y** respuestas dependientes, **B** barreras físicas irreproducibles. Definiciones canónicas en `backend/app/config.py`; fundamento en `docs/SDD.md` §4 y `docs/API_DATA_AND_MATCHING.md`.

## Pasos
1. **Clasifica** la variable nueva en X, Y o B y justifica por qué (una Y que en realidad fuerza a otras es una X). Añádela a la tupla correspondiente **y** a `FEATURE_SCALES` con una sigma física defendible y unidades SI.
2. **Procedencia primero:** registra fuente, resolución, unidades y limitaciones en `docs/DATA_PROVENANCE.md` y la cita en `REFERENCES.md`. Sin fuente verificable no se añade; nunca inventes valores ni datasets.
3. **Conector ETL** en `backend/app/etl/`: usa el cliente de `http_utils.py`, caché y checkpoint incremental, y tolera 429. No escribas en `ckepi.duckdb` fuera de rutas de ETL previstas.
4. **Esquemas:** actualiza `backend/app/models/schemas.py` (Pydantic v2) y `frontend/src/types/analog.ts` en el mismo cambio.
5. **Tests antes de afirmar mejora:** extiende `backend/tests/test_analog_matcher.py` / `test_causal_decomposer.py`. Para cambios de métrica, compara el ranking de los ~25 análogos de `engine/known_analogs.py` antes y después; si los clásicos conocidos caen, el cambio es sospechoso.
6. **Honestidad:** los puntajes deben seguir exponiendo incertidumbre y R_break; si R_break ≥ 0.60 la alerta debe seguir disparándose.
7. **UI y textos** nuevos → skill `ckepi-ui-i18n`. Cierra con `ckepi-verify`.

Como referencia teórica (no para copiar a ciegas) está la skill `pafi-analog-engine`: describe un índice distinto (PAFI) del que implementa Ckepi, así que adapta ideas, no fórmulas.
