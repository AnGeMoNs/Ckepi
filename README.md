# Ckepi

**Motor de Descubrimiento de Análogos Planetarios Terrestres mediante Descomposición Causal de Variables**  
*Desafío NASA Space Apps Challenge 2026 — Terrestrial Analogs for Moon & Mars*

---

## Descripción General

**Ckepi** es una plataforma científica de código abierto diseñada para identificar, evaluar y clasificar sitios análogos terrestres para misiones de exploración a la Luna y Marte. Superando las comparaciones visuales o de promedios simples, la plataforma implementa:

1. **Descomposición Causal de Variables ($X \rightarrow Y$ y Límites Físicos de Ruptura $B$):** Separa los forzamientos geofísicos independientes ($X$: rugosidad topográfica, pendiente, inercia térmica, albedo, flujo solar incidente, hielo subsuperficial, índice de hiperaridez, humedad relativa, índice UV, vegetación LAI) de las respuestas ambientales dependientes ($Y$: amplitud térmica diurna $\Delta T$, tasa de enfriamiento nocturno, temperatura media, velocidad del viento, flujo eólico de polvo, tasa de sublimación), e identifica barreras físicas irreproducibles en la Tierra ($B$: gravedad superficial, presión atmosférica y radiación ionizante GCR).
2. **Emparejamiento Desacoplado y Objetivos de Prueba (Luna / Marte):** Calcula métricas independientes para el Sustrato ($S_{\text{ind}}$), las Respuestas Ambientales ($S_{\text{dep}}$) y el Índice de Ruptura ($R_{\text{break}}$), con soporte para pesos causales automáticos, perfiles de prueba de ingeniería (Luna y Marte) y ajuste manual de pesos por variable.
3. **Globo 3D y Malla Global H3 Multi-Resolución con Drill-Down (hasta Res 5):**
   - Malla continental global H3 Resolución 2 almacenada en DuckDB/GeoParquet con marcas de actualización y ETL incremental con checkpoint (`era5_res3_checkpoint.jsonl`).
   - **Subdivisión jerárquica interactiva:** al seleccionar un hexágono terrestre, permite subdividirlo en **7 sub-hexágonos** hijos en tiempo real (hasta H3 Resolución 5), hidratando cada subzona en vivo con NASA POWER, Copernicus DEM 90m y Open-Meteo ERA5-Land y guardándola en DuckDB.
   - **Modo Descubrimiento:** distingue automáticamente entre análogos clásicos conocidos (~25 sitios de referencia como Atacama/Yungay, McMurdo, Haughton, Krafla, Río Tinto, Svalbard) y **nuevos descubrimientos** en la malla global.
4. **Globo 3D Interactivo de la Luna y Marte:** Permite rotar e inspeccionar cualquier coordenada en la superficie lunar o marciana sobre capas **NASA Trek WMTS** (Marte Viking Color Natural / MOLA; Luna LRO WAC / LOLA), con sondeo en vivo de topografía 3×3 (LOLA/MOLA) y cobertura orbital **NASA PDS Geosciences ODE** (LRO Diviner, Curiosity REMS, Perseverance MEDA).
5. **Geología, Subsuperficie (Tubos de Lava) y Habitabilidad Extremófila:** Cruza los sitios análogos con la API de **Macrostrat** (litología y formaciones geológicas), detección de análogos subsuperficiales (cuevas y tubos de lava) y cálculo de un índice de habitabilidad extremófila.
6. **Diagnóstico de Misión y Exportación Científica:** Genera veredictos accionables con tarjetas explícitas de **"Límites de la Tierra como laboratorio"** y **"Cómo usar este análogo para preparar la exploración"**, además de exportación en **CSV**, **GeoJSON** e **Informe técnico Markdown (`.md`)**.
7. **Catálogo Integrado de Múltiples Agencias Espaciales:** Consulta en vivo metadatos y escenas disponibles en **NASA** (Earthdata CMR, GIBS WMTS, POWER, PDS ODE), **ESA** (Copernicus Data Space Sentinel-1/2 OData, Open Science Catalog), **CSA** (RADARSAT-1 y RCM) y **JAXA** (G-Portal).

---

## Arquitectura y Tecnologías

- **Backend (`backend/`)**:
  - **Python 3.12+**, **FastAPI**, **DuckDB** (base analítica columnar embebida, cero costo de infraestructura), **GeoParquet**, **h3** (`h3-py`).
  - **Modelado y Estadística:** `scikit-learn` (`RidgeCV`, `RandomForestRegressor`, `PCA`), `scipy`, `numpy`, `pandas`.
  - **ETL y Teledetección:** `pdr` (lector NASA PDS), `httpx` con reintentos, caché local y límites de tasa para APIs externas.
- **Frontend (`frontend/`)**:
  - **React 18**, **TypeScript** (tipado estricto sin `any`), **Vite**, **Tailwind CSS**.
  - **Visualización 3D y Mapas:** **MapLibre GL JS v6** con proyección globo 3D, relieve 3D opcional, polígonos H3 interactivos con paginación numerada y capas **NASA Worldview GIBS WMTS** + **ESRI Satellite HD**.
  - **Internacionalización Nativa Tri-idioma (i18n):** Paridad total de **275 claves** entre Español (`es`), Portugués (`pt`) e Inglés (`en`), con formateo regional mediante `Intl.NumberFormat` e `Intl.DateTimeFormat`.
  - **Diseño Adaptable y Accesible:** Mobile-first (`320px` a `4K+`), áreas táctiles mínimas de `44px` y soporte nativo para tema Claro y Oscuro.

---

## Fuentes de Datos Espaciales Integradas

| Agencia / Fuente | Recurso / Misión | Detalles de Integración |
|---|---|---|
| **NASA** | Planetary Data System (PDS) & ODE | Cobertura y mediciones de LRO Diviner (DLRE) y topografía LOLA/MOLA |
| **NASA** | Mars Science Laboratory (MSL) y M2020 | Telemetría meteorológica y de superficie de Curiosity REMS y Perseverance MEDA |
| **NASA** | Trek WMTS | Mapas globales de Marte (Viking MDIM21, MOLA) y Luna (LRO WAC, LOLA) |
| **NASA** | Earthdata Search / API CMR | Búsqueda de gránulos satelitales (MODIS MOD11A1, SMAP) por celda H3 |
| **NASA** | Worldview / GIBS WMTS | Superposición satelital terrestre (Color Real, LST, Aerosoles/Polvo) |
| **NASA** | API POWER | Irradiancia solar superficial, albedo e insolación |
| **ESA** | Copernicus Data Space Ecosystem | Consulta OData de productos Sentinel-1 (SAR) y Sentinel-2 (Óptico) |
| **ESA** | Open Science Catalog | Catálogo abierto de flujos científicos y datasets geocientíficos |
| **CSA** | RADARSAT Constellation & RADARSAT-1 | Productos SAR abiertos de la Agencia Espacial Canadiense |
| **JAXA** | G-Portal | Observación terrestre de precipitación, nieve, vegetación y radiometría |
| **Copernicus / Open-Meteo** | DEM 90m & Archivo ERA5-Land | Elevación, pendiente, rugosidad y series climáticas horarias |
| **Macrostrat** | Macrostrat Geology API | Unidades geológicas, litología y contexto estratigráfico del sitio terrestre |

---

## Endpoints Principales de la API (`FastAPI`)

- `GET /api/v1/health`: Estado del servicio y métricas de celdas H3 cargadas en DuckDB.
- `GET /api/v1/planetary-sites`: Catálogo de sitios objetivo de Luna y Marte.
- `POST /api/v1/decompose`: Descomposición causal ($X \rightarrow Y$, PCA y perfil de ruptura $B$).
- `POST /api/v1/analogs/search`: Búsqueda y ranking global de análogos terrestres ($S_{\text{ind}}$, $S_{\text{dep}}$, $R_{\text{break}}$).
- `POST /api/v1/analogs/refine`: Subdivisión H3 en 7 sub-hexágonos hijos (hasta Res 5) con hidratación satelital en vivo.
- `POST /api/v1/planetary/probe`: Sondeo interactivo en cualquier `(lat, lon)` de Luna o Marte.
- `POST /api/v1/earth/probe`: Sondeo en vivo de cualquier coordenada terrestre y almacenamiento H3 en DuckDB.
- `GET /api/v1/analogs/{h3_index}/compare/{site_id}`: Comparación variable por variable entre una celda terrestre y un ROI planetario.
- `GET /api/v1/earth/{h3_index}/datasets`: Catálogo multi-agencia + geología Macrostrat, tubos de lava y habitabilidad extremófila.

---

## Inicio Rápido y Ejecución Local

### Requisitos Previos

- **Python 3.12+**
- **Node.js 18+ y npm**

### 1. Levantar el Backend (FastAPI + DuckDB)

```powershell
cd d:\nasa\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .

# Iniciar el servidor analítico FastAPI
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Documentación interactiva Swagger disponible en `http://127.0.0.1:8000/docs`.

### 2. Levantar el Frontend (React + Vite)

```powershell
cd d:\nasa\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Abre tu navegador en `http://127.0.0.1:5173`.

---

## Pruebas Automatizadas y Calidad de Código

```powershell
# Pruebas unitarias y de integración del backend (Pytest)
cd d:\nasa\backend
.\.venv\Scripts\python.exe -m pytest -q

# Validación estricta de TypeScript y compilación de producción del frontend
cd d:\nasa\frontend
npm run build
```

> **Nota sobre pruebas con APIs externas en vivo:** Algunas pruebas de integración en `tests/test_api.py` consultan Open-Meteo Archive en tiempo real; ante límites de tasa (`HTTP 429`), la malla global precalculada en DuckDB/Parquet sigue operando sin interrupciones.

---

## Estructura del Repositorio

```text
d:\nasa\
├── backend\
│   ├── app\
│   │   ├── config.py                     # Variables físicas (X, Y, B) y configuración
│   │   ├── engine\
│   │   │   ├── causal_decomposer.py      # Descomposición con RidgeCV, Random Forest y PCA
│   │   │   ├── analog_matcher.py         # Emparejamiento desacoplado (S_ind, S_dep, R_break)
│   │   │   ├── known_analogs.py          # Catálogo de ~25 análogos clásicos de referencia
│   │   │   └── mission_advisor.py        # Matriz de viabilidad, límites y recomendaciones
│   │   ├── etl\
│   │   │   ├── earth_api.py              # Consultas a NASA POWER, Copernicus DEM y ERA5
│   │   │   ├── global_earth_etl.py       # Malla global H3 con checkpoint incremental
│   │   │   ├── geology_and_habitability.py # Macrostrat, tubos de lava e índice extremófilo
│   │   │   ├── mars_api.py               # Telemetría NASA Curiosity REMS y Perseverance MEDA
│   │   │   ├── moon_api.py               # Telemetría NASA PDS ODE LRO Diviner
│   │   │   ├── planetary_probe.py        # Sondeo (lat, lon) con topografía 3x3 LOLA/MOLA
│   │   │   ├── space_agencies_api.py     # Conectores NASA CMR, ESA OData, CSA y JAXA
│   │   │   └── seed_datasets.py          # Materialización en DuckDB y Parquet
│   │   ├── models\schemas.py             # Esquemas Pydantic v2
│   │   └── main.py                       # Aplicación FastAPI y rutas REST
│   └── tests\                            # Suite Pytest (matcher, causal, API, validación)
├── frontend\
│   ├── src\
│   │   ├── api\client.ts                 # Cliente API tipado
│   │   ├── pages\ExplorerPage.tsx        # Vista principal y flujo de análisis
│   │   ├── components\
│   │   │   ├── decomposition\            # Pesos causales, PCA y perfil de ruptura
│   │   │   ├── layout\                   # Header y banner de flujo guiado en 3 pasos
│   │   │   ├── map\                      # Globo 3D Luna/Marte y malla H3 Tierra
│   │   │   ├── mission\                  # Diagnósticos, matriz, controles manuales y confianza
│   │   │   └── ui\                       # Componentes base accesibles y con temas
│   │   ├── i18n\                         # Traducciones con paridad 1:1 (es, pt, en)
│   │   ├── theme\mapColors.ts            # Tokens de color para mapas y capas
│   │   ├── types\analog.ts               # Tipos TypeScript estrictos
│   │   └── utils\exportResults.ts        # Exportación CSV, GeoJSON e Informe Markdown
│   └── package.json
└── README.md

## Continuidad del recorrido en `angemon`

La rama incorpora el recorrido Comparar → Aprender → Planificar → Evidencia.
El borrador de Planificar se conserva al cambiar de pestaña durante la sesión;
descárgalo antes de recargar o cerrar la página. Los enlaces lunares, el foco de
teclado y los avisos de copia/API cuentan con pruebas de regresión.
Consulta [alcance y comandos de verificación](docs/ANGEMON_RELIABILITY.md).
