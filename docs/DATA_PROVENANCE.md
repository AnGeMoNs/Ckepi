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
- **Refinamiento Espacial H3 en Dos Etapas (`POST /api/v1/analogs/refine`)**: Permite subdividir cualquier celda H3 ganadora en sus 7 sub-celdas hijas (`h3.cell_to_children`) e hidratarlas en vivo con Copernicus DEM + NASA POWER Climatology + SoilGrids.
- **Marte (Perseverance MEDA + PDS ODE Multi-Instrumento)**: Las coordenadas cercanas a Jezero Crater consumen telemetría real de `NASA Mars2020 Perseverance MEDA` (con fallback automático a `MSL Curiosity REMS`), y el sondeo planetario consulta cobertura real de **LRO LOLA**, **LRO Mini-RF** (Luna) y **MRO CRISM**, **MRO SHARAD** (Marte) vía `NASA PDS ODE`.
- **Variables Climáticas y Suelo Extendidas**: `NASA POWER Climatology` incluye `CLOUD_AMT`, `PRECTOTCORR` y `FROST_DAYS`, y `ISRIC SoilGrids v2.0` aporta `sand`, `clay` y `bdod` para modular erodibilidad eólica e inercia térmica del sustrato.

## 3. Comparación Estadística de Distribuciones Topográficas a Escala Común (30 m)

Para comparar distribuciones topográficas entre objetivos planetarios (p. ej., **Cráter Jezero**) y sectores de la **Región de Antofagasta** (`Salar de Pajonales 83b221fffffffff`, `Cordillera de la Sal 83b225fffffffff`, `Pampa Central 83b224fffffffff`) junto al control clásico de **Yungay (`83b220fffffffff`)**, el módulo `backend/app/engine/terrain_statistics.py` implementa el protocolo estadístico multiescala del equipo:

> **Estado de implementación actual (Transparencia Científica — Plan Maestro §1.1):**
> - **Modo actual en código (`_synthesize_calibrated_metric_dem`):** Genera una **superficie DEM métrica sintética calibrada** a paso uniforme de `30.0 m` ($120\times 120\text{ px} = 3{,}6\times 3{,}6\text{ km}$) parametrizada de forma determinística por la pendiente media (`slope_deg`) y rugosidad (`topographic_roughness`) reales medidas en cada celda H3 (`Copernicus DEM 90m` / `ASTER 30m` en Tierra y constantes publicadas `LOLA`/`MOLA`/`CTX` en Luna/Marte). **Mientras opere sobre el generador sintético calibrado, sus histogramas y distancias $W_1$/$D_{\text{KS}}$ deben presentarse como demostración metodológica calibrada y no como medición directa sobre los GeoTIFF crudos.**
> - **Modo objetivo de ingesta raster directa (Fase 2 del Plan Maestro):** Lectura directa de recortes GeoTIFF reproyectados a metros (**NASADEM_HGT v001** `s23w069`/`s25w070` o **Copernicus GLO-30** en UTM Zona 19S `EPSG:32719`, contra **USGS Mars 2020 CTX DEM 20 m** remuestreado a `30 m/px`).

1. **Escala Métrica Común (`30 m/px`, ventana $3{,}6\times 3{,}6\text{ km} = 120\times 120\text{ px}$):**
   - **Tierra (Referencia y Calibración):** Pendiente y rugosidad base medidas vía **Open-Meteo Copernicus DEM** (`90 m`) / **ASTER 30 m**; mosaicos de referencia **NASA/JPL NASADEM_HGT v001** (DOI: `10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001`) y **ESA Copernicus DEM GLO-30** en **UTM Zona 19S (`EPSG:32719`)**.
   - **Marte / Luna (Referencia y Calibración):** Parámetros topográficos de referencia y mosaico objetivo **USGS Mars 2020 Terrain Relative Navigation CTX DEM Mosaic** (`20 m/px` remuestreado a `30 m/px` con corrección $\cos\phi$) y **NASA LRO LOLA / SLDEM2015**.
2. **Variables Topográficas Derivadas sin Efecto de Borde:**
   - **Pendiente (`slope_deg`, °):** Diferencias finitas centrales a `30 m` con recorte de borde de 1 píxel:
     $$\text{slope} = \arctan\left(\sqrt{(\partial z/\partial x)^2 + (\partial z/\partial y)^2}\right)\cdot \frac{180}{\pi}$$
   - **Relieve Local (`local_relief_m`, m):** $Z_{\max} - Z_{\min}$ en ventana móvil de $300\times 300\text{ m}$ ($10\times 10\text{ px}$).
3. **Distancias entre Distribuciones e Intervalos de Confianza Espaciales (IC 95 %):**
   - **Wasserstein-1 ($W_1$, `scipy.stats.wasserstein_distance`)** en unidades físicas (° para pendiente, m para relieve local).
   - **Kolmogorov–Smirnov de 2 muestras ($D_{\text{KS}}$, `scipy.stats.ks_2samp`)** en $[0, 1]$.
   - **Bootstrap por bloques 2D (`10×10 px`, 120 iteraciones):** Preserva la autocorrelación espacial de píxeles vecinos de un DEM al estimar los intervalos de confianza al 95 %.
   - **Análisis de sensibilidad multiescala (`30 m`, `60 m`, `90 m`):** Evalúa la estabilidad de $W_1$, $D_{\text{KS}}$, $P_{50}$ y $P_{90}$ bajo agregación espacial por bloques.
