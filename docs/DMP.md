# Open Science Data Management Plan (OSDMP) — Ckepi

> **Estándar:** Principios **FAIR** (*Findable, Accessible, Interoperable, Reusable*) y lineamientos **NASA TOPS (Transform to Open Science)**.
> **Atribución metodológica:** Adaptado de la plantilla mini-OSDMP de *Ciencia abierta · apuntes educativos independientes, Delnr91 y colaboradores* (CC BY 4.0) y las guías de datos abiertos de NASA Space Apps 2026.

---

## 1. Tipos de Datos y Niveles de Procesamiento (L0 → L5)

| Nivel | Descripción | Formato / Motor | Ubicación en el Repositorio | Política de Versionado |
|---|---|---|---|---|
| **L0 · Crudo / Sondeo** | Respuestas JSON/OData de APIs abiertas (NASA POWER, NASA PDS ODE, NASA CMR, ESA Copernicus, Open-Meteo ERA5, Macrostrat, ISRIC SoilGrids). | JSON / HTTP Cache | `backend/app/data/era5_res3_checkpoint.jsonl` | Versionado como checkpoint de respaldo ante `HTTP 429`. |
| **L1 · Malla Normalizada** | Celdas hexagonales **Uber H3** (Res 2–5) normalizadas al Sistema Internacional (SI) con marcas temporales (`fetched_at`) y trazabilidad (`source_apis_json`). | DuckDB + Apache GeoParquet | `backend/app/data/ckepi.duckdb` · `backend/app/data/earth_h3_grid.parquet` | Solo modificable en tareas explícitas de ETL (`AGENTS.md` Regla 9). |
| **L2 · Espacio de Variables** | 10 variables independientes ($X$), 6 dependientes ($Y$) y 3 de ruptura física ($B$), más escalas de normalización `FEATURE_SCALES`. | Python / Pydantic v2 | `backend/app/config.py` | Fuente única de verdad versionada en Git. |
| **L3 · Inferencia y Estadística** | Descomposición causal ($X \to Y$, `RidgeCV`, `RandomForest`, `PCA`), puntajes desacoplados ($S_{\text{ind}}, S_{\text{dep}}, R_{\text{break}}$) y comparación de distribuciones topográficas a 30 m ($W_1$, $D_{\text{KS}}$, bootstrap por bloques 2D). | JSON tipado / Memoria (`backend/app/engine/`) | `causal_decomposer.py` · `analog_matcher.py` · `terrain_statistics.py` | Determinístico (`random_state=42` / semilla estable por par sitio-celda). |
| **L4 · Metadatos y Procedencia** | Etiquetado explícito por variable (`measured`, `derived`, `model`, `constant`, `default`) y citas bibliográficas / DOI. | Markdown + JSON | `docs/DATA_PROVENANCE.md` · `REFERENCES.md` · `CITATION.cff` | Auditado en cada PR antes de publicar. |
| **L5 · Artefactos Exportables** | Reportes científicos reproducibles generados por el usuario desde el navegador. | CSV (`.csv`), GeoJSON (`.geojson`), Markdown (`.md`) | `frontend/src/utils/exportResults.ts` | Generados en cliente sin almacenar datos personales. |

---

## 2. Cumplimiento de los Principios FAIR

1. **Findable (Localizable):**
   - Cada celda terrestre se identifica unívocamente mediante su índice jerárquico **H3** (`earth_cell_h3`, p. ej. `83b220fffffffff` para Yungay) y coordenadas WGS84 (`EPSG:4326`), y cada producto satelital conserva su identificador de catálogo oficial (`product_id`, DOI o URL de misión).
2. **Accessible (Accesible):**
   - **Cero muros de pago o cuentas obligatorias para quien aprende o investiga:** toda la interfaz y las exportaciones funcionan sobre protocolos abiertos (`HTTPS` / REST JSON) y cuentan con modo de lectura accesible (*Tres Mundos para Todos*, lectura por voz `speechSynthesis`, alto contraste AA y controles $\ge 44\text{ px}$).
3. **Interoperable (Interoperable):**
   - Salidas estandarizadas en **GeoJSON (RFC 7946)**, **CSV (RFC 4180)**, **Apache Parquet** y **DuckDB**, utilizando unidades del Sistema Internacional (K, m/s, $\text{W/m}^2$, mbar, mSv/año, grados).
4. **Reusable (Reutilizable):**
   - Código fuente bajo licencia abierta **Apache-2.0** ([LICENSE](../LICENSE)), sin dependencias propietarias ni datos de agencias restringidas (cero APIs/portales de CNSA), y con distinción transparente entre mediciones instrumentales, modelos físicos y demostraciones sintéticas calibradas.

---

## 3. Privacidad, Seguridad y Ética Científica

- **Cero recolección de datos personales (PII):** Ckepi no utiliza cookies de rastreo, cuentas de usuario ni telemetría individual. Las validaciones educativas en terreno se registran mediante conteo anónimo de talleres/kits.
- **Protección de secretos:** Credenciales opcionales de administración o descarga (`ADMIN_REFRESH_TOKEN`, NASA Earthdata) residen exclusivamente en variables de entorno locales (`.env`, excluido por `.gitignore`) y jamás se incorporan al repositorio ni al bundle del cliente.
- **Honestidad física obligatoria:** Ningún resultado del software puede presentarse como certificación de seguridad operativa de rovers ni como equivalencia total con la Luna o Marte; la **Brecha Física Irreducible ($B$)** se reporta siempre junto a cada puntaje.
