# Bitácora en Vivo de Cambios: Claude · GPT (`Astra` / `Argon`) · Equipo (`kevin` / `angemon`)

> **Última sincronización en rama `dani`:** Sábado 14 de noviembre de 2026 (`17:41 CLT`)  
> **Propósito:** Mantener a Dani y Nehe al día con cada cambio que están subiendo los agentes (**Claude**, **GPT / Astra / Argon**, **Antigravity**) y los compañeros del equipo (**Kevin**, **Angemon**) para que las diapositivas, el pitch y la demo reflejen exactamente el estado real del repositorio.

---

## 1. Últimos Cambios en la Rama `dani` (`origin/dani`)

| Commit | Autor / Agente | Qué cambió exactamente | Impacto en PPT / Pitch / Demo |
|---|---|---|---|
| **`c8ce0ef`** | **Antigravity + Dani** | Creó la carpeta [`docs/nehe/`](README_NEHE_SYNC.md) con las 7 slides en inglés ([`PPT_7_SLIDES_GLOBAL_EN.md`](PPT_7_SLIDES_GLOBAL_EN.md) y [`PPT_7_SLIDES_PROTOTYPE.html`](PPT_7_SLIDES_PROTOTYPE.html)), el pitch de 3 min ([`PITCH_LOCAL_3MIN_ANTOFAGASTA_ES.md`](PITCH_LOCAL_3MIN_ANTOFAGASTA_ES.md)), el guion de video de 30 s ([`GUION_VIDEO_DEMO_30S_EN_ES.md`](GUION_VIDEO_DEMO_30S_EN_ES.md)) y la hoja de datos verificados ([`DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md`](DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md)). | Carpeta centralizada para trabajar en la presentación sin conflictos de git. |
| **`809f039`** | **Claude Opus** | **Reemplazo total de cifras sintéticas por resultados reales de terreno a 30 m:**<br>• Creó [`RESULTADOS_TERRENO_REALES.md`](RESULTADOS_TERRENO_REALES.md) como fuente única de verdad.<br>• Actualizó `SUBMISSION_PACK_EN.md`, `DATA_PROVENANCE.md`, `REFERENCES.md`, `CONTEXTO_PARA_PITCH_CKEPI.md`, `LaAraucanaImpactPanel.tsx` y `es.json`/`pt.json`/`en.json`.<br>• Fijó licencia `Apache-2.0`, retiró mención a `NASADEM` como usado en este build (requiere cuenta Earthdata; se usa `Copernicus GLO-30`) y precisó la licencia oficial de Copernicus. | **CRÍTICO PARA NEHE:** No usar nunca las cifras viejas («Pajonales $0,77^\circ$» / «Yungay $4,13^\circ$»). Usar siempre las cifras reales: **Celda `83b224fffffffff` ($W_1 = 0,54^\circ$, IC 95 % $0,40^\circ\text{–}0,65^\circ$) vs. Control Yungay ($W_1 = 3,32^\circ$)**, y contraejemplos `83b221fffffffff` ($W_1 = 6,92^\circ$ muy escarpada) y `83b225fffffffff` ($W_1 = 1,71^\circ$ muy plana). |
| **`1535fb7`** | **Claude + Astra (Backend)** | **Pre-cálculo y testeo de ventanas DEM reales a 30 m:**<br>• Script `backend/scripts/precompute_real_terrain.py` que recorta ventanas de $6\times 6\text{ km}$ ($200\times 200\text{ px}$ a $30\text{ m/px}$) desde el **USGS Mars 2020 TRN CTX DEM Mosaic de Jezero (NASA MRO, 20 m)** y **ESA Copernicus GLO-30 (UTM 19S)**.<br>• Guardó matrices en `terrain_windows_30m.npz` y metadatos/SHA-256 en [`terrain_windows_30m_provenance.json`](terrain_windows_30m_provenance.json).<br>• Añadió `backend/tests/test_terrain_real_dem.py`. | Permite demostrar ante el jurado físico/matemático (Dr. Curilef y Dr. Littin) que las distribuciones a 30 m se calculan sobre **píxeles reales verificables con hash SHA-256**. |
| **`533aed2`** | **Astra + Argon + Claude** | Integración de los paneles de UI en `frontend/src/components/mission/`:<br>• `TerrainDistributionPanel.tsx` (histogramas y CDFs de pendiente y relieve a 30 m, tabla de sensibilidad 30/60/90 m).<br>• `LaAraucanaImpactPanel.tsx` (modo accesible *«Tres Mundos en tu Mano»* con 3 niveles, voz `Web Speech API`, quiz interactivo y los 4 pilares + metas ODS de Caja La Araucana). | Listos para mostrar en vivo en la demo de escritorio y móvil (`320px`). |
| **`cea134c`** | **GPT / Equipo Ciencia** | Añadió nomenclátor planetario IAU, hipsometría MOLA, modelo de radiación cósmica PARMA, sublimación de Hertz-Knudsen, catálogo de simulantes de regolito NASA/ESA y matching Pareto/Mahalanobis. | Enriquece el Modo Misión para preguntas avanzadas de geología e ISRU. |

---

## 2. Últimos Cambios en las Ramas de los Compañeros (`origin/kevin` y `origin/angemon1`)

*(Nota: siguen en sus respectivas ramas remotas; en `dani` ya está integrada la base `e64151a` de `kevin + angemon`):*

| Rama Remota | Último Commit | Qué añadió el compañero |
|---|---|---|
| **`origin/angemon1`** | **`343f51f`** *(17:36 CLT)* | `feat(frontend): add interactive planetary physics lab and preview API proxy` — Añadió `PlanetaryPhysicsLab.tsx` (715 líneas) en `frontend/src/components/education/` con laboratorio interactivo de física planetaria y 51 claves nuevas en `en.json`/`es.json`/`pt.json`. |
| **`origin/kevin`** | **`fa9c314`** *(17:39 CLT)* | `feat(etl): add incremental global H3 grid enrichment pipeline and updated Earth data` — Añadió `backend/app/etl/enrich_global_grid.py` y actualizó `earth_h3_grid.parquet` y `ckpt_dem_res3.jsonl` con más de 10.000 celdas H3 enriquecidas. |
