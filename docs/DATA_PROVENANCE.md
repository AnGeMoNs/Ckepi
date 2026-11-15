# Procedencia de Datos y Supuestos Científicos — Ckepi

Este documento detalla con total transparencia qué variables provienen de **mediciones instrumentales directas**, cuáles son **derivadas por física orbital**, cuáles son **proxies/modelos**, y cuáles son **constantes de referencia publicadas**.

## 1. Variables Planetarias (Luna y Marte)

| Variable | Sitios Curados (Marte) | Sitios Curados (Luna) | Coordenada Libre (Sonda 3D) |
|---|---|---|---|
| `mean_surface_temp_k` | **Medido** (NASA Curiosity REMS / Perseverance MEDA) | **Modelo** (Equilibrio radiativo Stefan-Boltzmann + fechas PDS ODE) | Marte: **Derivado** de REMS + latitud · Luna: **Modelo** |
| `diurnal_temp_amplitude_k` | **Medido** (REMS / MEDA) | **Modelo** (Ciclo diurno lunar 354h + inercia térmica) | Marte: **Derivado** · Luna: **Modelo** |
| `nocturnal_cooling_k_hr` | **Derivado** (Duración nocturna + ΔT REMS) | **Modelo** (Enfriamiento post-ocaso Vasavada et al.) | **Modelo / Derivado** |
| `solar_flux_wm2` | **Derivado** (Geometría orbital $L_s$, excentricidad, latitud) | **Modelo** (1361 W/m² · $\cos\theta$ solar) | **Derivado / Modelo** |
| `aeolian_dust_flux` | **Medido** (Opacidad atmosférica REMS + índice UV) | **Constante** (`0.0` — cuerpo sin atmósfera) | Marte: **Derivado** · Luna: `0.0` |
| `topographic_roughness`, `slope_deg`, `thermal_inertia`, `surface_albedo`, `subsurface_ice_frac` | **Constante de referencia** (Literatura LOLA/THEMIS/SHARAD) | **Constante de referencia** (Literatura LRO Diviner/LOLA/LEND) | **Modelo heurístico** por régimen de latitud/longitud |
| `gravity_g`, `atm_pressure_mbar`, `radiation_msv_yr` | **Constante física / Medido** (Frontera de ruptura $B$) | **Constante física** (Frontera de ruptura $B$) | **Constante física** (Frontera de ruptura $B$) |

## 2. Variables Terrestres (Celdas H3)

| Variable | Fuente Real | Notas / Limitaciones |
|---|---|---|
| `slope_deg`, `topographic_roughness` | **Open-Meteo Copernicus 90m DEM** (fallback: **ASTER 30m DEM** vía OpenTopoData) | Calculado con stencil finito de 5 puntos (~3.3 km). |
| `solar_flux_wm2`, `surface_albedo`, `relative_humidity_pct`, `uv_irradiance_index`, `surface_wind_ms` | **NASA POWER API** (ventana diaria) | Si algún parámetro falta (`-999`), se usa valor de respaldo y se registra. |
| `diurnal_temp_amplitude_k`, `mean_surface_temp_k`, `nocturnal_cooling_k_hr` | **Open-Meteo ERA5-Land Archive** | Ventana base de referencia primaveral/otoñal (~14 días); puede presentar sesgo estacional. |
| `thermal_inertia`, `subsurface_ice_frac`, `vegetation_lai_proxy` | **Proxy derivado** de flujo solar, $\Delta T$, humedad del suelo y evapotranspiración $ET_0$ | No son mediciones directas de radar/in-situ de inercia térmica ni LAI satelital MODIS. |


## Actualización de Precisión y Sensores Reales

- **Climatología Multi-Anual (`NASA POWER Climatology ANN`)**: Los sondeos en vivo y anclas terrestres usan medias climatológicas anuales de largo plazo (`20+ yr ANN`) para evitar sesgos estacionales entre hemisferios, incluyendo albedo superficial satelital real (`ALLSKY_SRF_ALB`).
- **Propiedades Reales de Suelo (`ISRIC SoilGrids v2.0`, 0–5 cm)**: Enriquecimiento best-effort (timeout 4s) para ajustar la inercia térmica del sustrato según densidad aparente real (`bdod`) y textura (`sand`, `clay`), con fallback seguro a modelo ERA5 si la celda es oceánica/glaciar o no responde.
- **Refinamiento Espacial H3 en Dos Etapas (`POST /api/v1/analogs/refine`)**: Permite subdividir cualquier celda H3 ganadora y su anillo vecinal (`h3.grid_disk`, `radius_k=1`, hasta 49 sub-celdas H3-4/H3-5 hijas vía `h3.cell_to_children`) e hidratarlas en vivo con Copernicus DEM + NASA POWER Climatology + SoilGrids.
- **Marte (Perseverance MEDA + PDS ODE Multi-Instrumento)**: Las coordenadas cercanas a Jezero Crater consumen telemetría real de `NASA Mars2020 Perseverance MEDA` (con fallback automático a `MSL Curiosity REMS`), y el sondeo planetario consulta cobertura real de **LRO LOLA**, **LRO Mini-RF** (Luna) y **MRO CRISM**, **MRO SHARAD** (Marte) vía `NASA PDS ODE`.
- **Variables Climáticas y Suelo Extendidas**: `NASA POWER Climatology` incluye `CLOUD_AMT`, `PRECTOTCORR` y `FROST_DAYS`, y `ISRIC SoilGrids v2.0` aporta `sand`, `clay` y `bdod` para modular erodibilidad eólica e inercia térmica del sustrato.
- **Máscara Global Tierra/Islas/Depresiones H3 Res-3 (`Natural Earth 1:50m Land & 1:10m Minor Islands`, Dominio Público CC0)**: Identificación geométrica multipunto (37 muestras por hexágono) para cubrir depresiones continentales bajo el nivel del mar (`abs(elev) > 0.5 m`, ej. Salton Sea, Mar Muerto, Qattara), islas oceánicas/volcánicas (Sicilia, Cerdeña, Canarias, Galápagos, Polinesia) y el casquete antártico hasta $-89.5^\circ$ latitud sin sesgos de centroide oceánico ni exclusión polar.

## 3. Comparación Estadística de Distribuciones Topográficas a Escala Común (30 m)

Compara la distribución de pendientes y relieve local del **Cráter Jezero** (Marte) con cuatro celdas H3 de la **Región de Antofagasta** y con el control clásico **Yungay**, usando DEM reales a una escala métrica común. Lo implementa `backend/app/engine/terrain_statistics.py`, alimentado por ventanas precalculadas con `backend/scripts/precompute_real_terrain.py`.

> **Estado actual (14-nov-2026, commit `1535fb7`): medición sobre DEM reales.**
> - Las ventanas reales están en `backend/app/data/derived/terrain_windows_30m.npz`; su procedencia (URL, archivo, SHA-256, CRS, centro y elevaciones) está en `terrain_windows_30m.json`.
> - Si se pide una combinación sin ventana real (otro sitio planetario u otra celda H3), el motor genera un **sustituto sintético** calibrado y lo rotula `SYNTHETIC … not a measurement` en `planetary_dem_source` / `earth_dem_source`. Ese caso **no** debe presentarse como medición.
> - **NASADEM_HGT v001 no se usa** en esta versión: requiere cuenta Earthdata. Para la Tierra se usa Copernicus GLO-30.

1. **Fuentes y escala métrica común (`30 m/px`, ventana `6 × 6 km` = `200 × 200 px`):**

   | Ventana | Centro (lat, lon) | Origen del centro | DEM | Elevación (m) |
   |---|---|---|---|---|
   | `mars_jezero_crater` | 18,38, 77,58 | `planetary_sites.json` | USGS Mars 2020 TRN **CTX DEM** Mosaic (NASA MRO CTX), 20 m, remuestreo por promedio a 30 m | −2.674 a −2.599 |
   | `control_yungay` | −24,08, −69,91 | `known_analogs.py` | **Copernicus DEM GLO-30** (ESA, DSM 1″), reproyección bilineal a UTM 19S | 957 a 1.280 |
   | `83b220fffffffff` | −24,138, −69,582 | centro de la celda H3 | Copernicus GLO-30 | 1.423 a 1.833 |
   | `83b221fffffffff` | −24,683, −68,604 | centro de la celda H3 | Copernicus GLO-30 | 4.195 a 5.270 |
   | `83b225fffffffff` | −23,606, −68,524 | centro de la celda H3 | Copernicus GLO-30 | 2.301 a 2.342 |
   | `83b224fffffffff` | −23,052, −69,497 | centro de la celda H3 | Copernicus GLO-30 | 1.408 a 1.538 |

   - **Marte:** el CTX DEM está en proyección Equirectangular con paralelo estándar en 18,4663° N (esfera Mars 2000, R = 3.396.190 m), es decir, con escala verdadera en la latitud de Jezero: no requiere corrección adicional de cos φ.
   - **Tierra:** reproyección a **UTM Zona 19S (`EPSG:32719`)**. GLO-30 es un modelo de superficie (DSM): en el desierto la diferencia con un modelo de terreno es pequeña, pero se declara.
   - **Nombres de las celdas:** el centro de una celda H3 resolución 3 (~12.000 km²) no coincide necesariamente con el lugar que da nombre a la región en el catálogo (p. ej. «Cordillera de la Sal»). Las ventanas se identifican por su índice H3 y sus coordenadas.

2. **Variables Topográficas Derivadas sin Efecto de Borde:**
   - **Pendiente (`slope_deg`, °):** Diferencias finitas centrales a `30 m` con recorte de borde de 1 píxel:
     $$\text{slope} = \arctan\left(\sqrt{(\partial z/\partial x)^2 + (\partial z/\partial y)^2}\right)\cdot \frac{180}{\pi}$$
   - **Relieve Local (`local_relief_m`, m):** $Z_{\max} - Z_{\min}$ en bloques **no solapados** de $300\times 300\text{ m}$ ($10\times 10\text{ px}$).
3. **Distancias entre Distribuciones e Intervalos de Confianza Espaciales (IC 95 %):**
   - **Wasserstein-1 ($W_1$, `scipy.stats.wasserstein_distance`)** en unidades físicas (° para pendiente, m para relieve local).
   - **Kolmogorov–Smirnov de 2 muestras ($D_{\text{KS}}$, `scipy.stats.ks_2samp`)** en $[0, 1]$.
   - **Bootstrap por bloques 2D (pendiente: `10×10 px`; relieve: `3×3` bloques; 120 iteraciones a 30 m y 80 a 60/90 m, semilla fija):** Preserva la autocorrelación espacial de píxeles vecinos de un DEM al estimar los intervalos de confianza al 95 %.
   - **Análisis de sensibilidad multiescala (`30 m`, `60 m`, `90 m`):** Evalúa la estabilidad de $W_1$, $D_{\text{KS}}$, $P_{50}$ y $P_{90}$ bajo agregación espacial por bloques.
4. **Resultados a 30 m (Jezero vs. cada ventana; reproducibles con `pytest tests/test_terrain_real_dem.py` y el endpoint de comparación):**

   | Ventana terrestre | Pendiente mediana Tierra / Jezero | $W_1$ pendiente (IC 95 %) | $D_{\text{KS}}$ | $W_1$ relieve | Lectura |
   |---|---|---|---|---|---|
   | `83b224fffffffff` | 1,37° / 1,70° | **0,54°** (0,40–0,65) | 0,15 | 1,8 m | La más parecida en pendiente; más cercana a Jezero que el control Yungay |
   | `83b225fffffffff` | 0,19° / 1,70° | 1,71° (1,65–1,86) | 0,82 | 8,2 m | Demasiado plana (superficie de salar) |
   | `83b220fffffffff` | 3,46° / 1,70° | 3,70° (3,22–4,20) | 0,52 | 22,4 m | Similar al control |
   | `83b221fffffffff` | 7,89° / 1,70° | 6,92° (6,17–7,31) | 0,74 | 42,8 m | Muy distinta: relieve andino a 4.200–5.270 m |
   | Control Yungay | — | 3,32° | — | — | Referencia clásica |

   **Límites que se declaran siempre:** (a) una ventana de 6 km por sitio no representa toda la región ni todo el cráter; (b) solo se comparan pendiente y relieve: gravedad (0,38 g), presión (~6 mbar, 95 % CO₂), radiación y temperatura no se reproducen en la Tierra; (c) el parecido en pendiente **preselecciona** un lugar para estudiarlo, no lo certifica para ensayos ni dice que sea «seguro»; (d) DSM (Tierra) frente a DEM fotogramétrico (Marte) con resoluciones nativas distintas (≈30 m frente a 20 m).
