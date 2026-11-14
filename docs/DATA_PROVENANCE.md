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
