---
name: rubrica-cientifica-30m
description: >-
  Audita con rigor de físico/geólogo planetario la rúbrica científica de Ckepi: (1) verifica al menos
  una comparación planetaria->terrestre real (ej. Cráter Jezero -> Atacama / Salar de Pajonales vs.
  control Yungay) remuestreada a escala métrica común >= 30 m (con sensibilidad a 60 m y 90 m) y
  unidades explícitas en metros (m) y grados (°); (2) verifica distancias estadísticas definidas sobre
  distribuciones completas (Wasserstein-1 W_1 y Kolmogorov-Smirnov D_KS) con incertidumbre por
  bootstrap espacial de bloques 2D (IC 95 %); (3) exige casos positivos (qué sí se parece) y casos
  negativos (ejemplos de qué NO se parece y el porqué físico: gravedad 0.38 g, atmósfera de CO2 0.6 kPa,
  radiación ~230 mSv/año, temperatura Delta T); y (4) audita los datos físicamente disponibles en disco.
---

# Skill · Rúbrica Científica: Escala Común $\ge 30\text{ m}$, Distribuciones $W_1 / D_{\text{KS}}$, Bootstrap 2D, Casos Positivos/Negativos y Datos en Disco

## Fuentes de verdad en el repositorio
- Motor estadístico de terreno a escala métrica común: [`backend/app/engine/terrain_statistics.py`](../../../backend/app/engine/terrain_statistics.py)
- Motor de emparejamiento H3 y ruptura física: [`backend/app/engine/analog_matcher.py`](../../../backend/app/engine/analog_matcher.py)
- Motor de descomposición causal ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$): [`backend/app/engine/causal_decomposer.py`](../../../backend/app/engine/causal_decomposer.py)
- Sitio análogos de referencia y controles: [`backend/app/engine/known_analogs.py`](../../../backend/app/engine/known_analogs.py)
- Esquemas Pydantic v2 y tipos TS: [`backend/app/models/schemas.py`](../../../backend/app/models/schemas.py) y [`frontend/src/types/analog.ts`](../../../frontend/src/types/analog.ts)
- Panel UI de distribuciones 30 m: [`frontend/src/components/mission/TerrainDistributionPanel.tsx`](../../../frontend/src/components/mission/TerrainDistributionPanel.tsx)
- Proveniencia y plan maestro: [`docs/DATA_PROVENANCE.md`](../../../docs/DATA_PROVENANCE.md) y [`docs/PLAN_MAESTRO.md`](../../../docs/PLAN_MAESTRO.md)

---

## Compuerta 1 · Al Menos 1 Comparación Real a Escala Métrica Común $\ge 30\text{ m}$ con Unidades en Metros ($\text{m}$) y Grados ($^\circ$)

Verifica en [`terrain_statistics.py`](../../../backend/app/engine/terrain_statistics.py) y en la respuesta del endpoint `/api/v1/analogs/search` (`terrain_distribution`) que la comparación primaria **Cráter Jezero (`18.38° N, 77.58° E`, Marte) $\to$ Desierto de Atacama, Región de Antofagasta** cumpla:

1. **Remuestreo a grilla métrica común $\ge 30\text{ m}$:**
   - Resolución base explícita: `common_resolution_m = 30.0` metros por píxel ($\text{m/px}$) sobre un recorte de $120 \times 120$ píxeles ($3{,}6 \times 3{,}6\text{ km}$).
   - Proyección métrica equivalente: **UTM Zona 19S (`EPSG:32719`)** en Tierra (Antofagasta) y **proyección cilíndrica equidistante planetocéntrica con corrección $\cos\phi$** sobre el elipsoide marciano (`IAU 2015`, $R_{\text{Mars}} = 3396{,}19\text{ km}$) o lunar ($R_{\text{Moon}} = 1737{,}4\text{ km}$).
   - **Análisis de sensibilidad multiescala ($\ge 30\text{ m}$):** La tabla `multiscale_sensitivity` debe reportar resultados recalculados tras agregación por bloques a **`30 m`**, **`60 m`** y **`90 m`**.
2. **Unidades físicas explícitas del Sistema Internacional / Métrico:**
   - Resolución espacial y tamaño de ventana: **metros ($\text{m}$)**.
   - Relieve local (*Local Relief* en ventana móvil de $300 \times 300\text{ m}$, $10 \times 10\text{ px}$): **metros ($\text{m}$)** (`unit: "m"`).
   - Pendiente topográfica (*Slope* por diferencias finitas centrales de segundo orden con recorte de 1 píxel de borde): **grados sexagesimales ($^\circ$)** derivados de $\arctan(\|\nabla z\|\text{ [m/m]})$ (`unit: "deg"`).

---

## Compuerta 2 · Distancias Estadísticas Definidas ($W_1$ y $D_{\text{KS}}$) + Incertidumbre Bootstrap 2D

No basta con comparar medias o medianas. Verifica que el motor calcule y exponga para **Pendiente ($^\circ$)** y **Relieve Local ($\text{m}$)**:

1. **Distancia de Wasserstein-1 ($W_1$, *Earth Mover's Distance*):**
   $$W_1(P, Q) = \int_{-\infty}^{+\infty} |F_P(x) - F_Q(x)| \, dx$$
   - Calculada con `scipy.stats.wasserstein_distance`.
   - Expresada en las unidades físicas de la variable (**grados $^\circ$** para pendiente, **metros $\text{m}$** para relieve local).
2. **Estadístico de Kolmogorov–Smirnov de 2 muestras ($D_{\text{KS}}$):**
   $$D_{\text{KS}}(P, Q) = \sup_x |F_P(x) - F_Q(x)| \in [0, 1]$$
   - Calculado con `scipy.stats.ks_2samp` (junto con su `ks_pvalue`).
3. **Incertidumbre mediante *2D Spatial Block Bootstrap* (`block_size_m = 300 m`, $10 \times 10\text{ px}$, $B = 200$ réplicas):**
   - El remuestreo i.i.d. de píxeles individuales es estadísticamente inválido en topografía porque viola la autocorrelación espacial (Ley de Tobler).
   - Verifica que [`_block_bootstrap_2d()`](../../../backend/app/engine/terrain_statistics.py) particione ambos DEMs en bloques disjuntos de $10 \times 10$ píxeles ($300 \times 300\text{ m}$) y entregue los intervalos de confianza al 95 % (`w1_ci_95: [low, high]` y `ks_ci_95: [low, high]`).

---

## Compuerta 3 · Casos Positivos (Qué SÍ se parece), Casos Negativos (Qué NO se parece) y el Porqué Físico

El desafío de NASA exige explicar **qué aspectos son análogos, cuáles NO lo son y por qué**. Verifica que tanto el código como la UI y la documentación presenten ambos lados con contraejemplos explícitos:

### A. Caso Positivo Geomorfológico vs. Caso Negativo Geomorfológico en Atacama ($30\text{ m}$)
| Sitio Terrestre Evaluado | H3 (`res=3`) | Pendiente $W_1$ vs. Jezero ($30\text{ m}$) | Veredicto Geomorfológico y Porqué Físico |
|---|---|---|---|
| **Salar de Pajonales / Llano de la Paciencia** *(Descubrimiento en Antofagasta)* | `83b221fffffffff` | **$0.77^\circ$** ($\text{IC } 95\%: 0.37^\circ\text{--}1.03^\circ$, $D_{\text{KS}} = 0.097$) | **✅ SÍ SE PARECE EN TOPOGRAFÍA A 30 m:** Sus escarpes vulcanoclásticos e incisiones aluviales reproducen la distribución de pendientes ($P_{50} \approx 6.9^\circ$) y relieve local ($P_{50} \approx 38\text{ m}$) del margen deltaico del Cráter Jezero. **Útil para:** ensayos de tracción de rovers, cinemática de suspensión *rocker-bogie* y navegación óptica/LiDAR (TRN). |
| **Cuenca de Yungay** *(Control Clásico en Antofagasta)* | `83b220fffffffff` | **$4.13^\circ$** ($D_{\text{KS}} = 0.659$) | **❌ NO SE PARECE EN TOPOGRAFÍA A 30 m (Contraejemplo):** Yungay es una planicie aluvial madura mucho más plana ($P_{50} \approx 2.6^\circ$). Aunque es el estándar mundial de **hiperaridez y suelos tipo Viking/percloratos para astrobiología** (Navarro-González et al., 2003), **falla como análogo mecánico de pendientes** frente a los escarpes del delta de Jezero. |

### B. Ruptura Física Irreducible ($\mathbf{B}$): Qué NUNCA se parece en la Tierra y Por Qué
Verifica que los 4 parámetros de ruptura física estén explícitamente cuantificados con sus valores reales y su consecuencia de ingeniería:

| Parámetro Físico en $\mathbf{B}$ | Tierra (Atacama) | Marte (Cráter Jezero) | Luna (Polo Sur / Shackleton) | Por qué NO se parece y qué subsistema de misión rompe |
|---|---|---|---|---|
| **1. Gravedad Superficial ($g$)** | **$1.00\text{ g}$** ($9.81\text{ m/s}^2$) | **$0.38\text{ g}$** ($3.72\text{ m/s}^2$) | **$0.166\text{ g}$** ($1.62\text{ m/s}^2$) | **Porqué físico:** El peso efectivo en Marte es $2.6\times$ menor y en la Luna $6\times$ menor. En la Tierra ($1\text{ g}$) se sobre-estresa la suspensión del rover y cambia el ángulo de reposo dinámico y el hundimiento (*sinkage*) de las ruedas en regolito granular suelto. |
| **2. Presión y Composición Atmosférica ($P_{\text{atm}}$)** | **$101.3\text{ kPa}$** ($1013\text{ mbar}$, $78\%\text{ N}_2 / 21\%\text{ O}_2$) | **$\sim 0.6\text{ kPa}$** ($6.1\text{ mbar}$, $95.3\%\text{ CO}_2$) | **$0\text{ kPa}$** (Vacío duro, $\sim 3\times 10^{-15}\text{ bar}$) | **Porqué físico:** La densidad atmosférica marciana es $\sim 1\%$ de la terrestre. En Atacama la transferencia de calor está dominada por **convección de aire**, mientras que en Marte domina la radiación térmica con convección tenue de $\text{CO}_2$ y en la Luna solo existe radiación/conducción en vacío. Un dron tipo *Ingenuity* o un sistema de disipación térmica no puede validarse al aire libre en la Tierra sin cámara de vacío/baja presión. |
| **3. Radiación Ionizante Superficial ($R_{\text{ion}}$)** | **$\sim 2.4\text{ mSv/año}$** ($\sim 0.006\text{ mSv/día}$, protegida por magnetósfera + atmósfera) | **$\sim 230\text{ mSv/año}$** ($\sim 0.64\text{ mSv/día}$ medido por *Curiosity/RAD*, Hassler et al., 2014) | **$\sim 380\text{ mSv/año}$** ($\sim 1.04\text{ mSv/día}$ de GCR + SEP sin blindaje) | **Porqué físico:** La Tierra bloquea los rayos cósmicos galácticos (GCR, iones pesados HZE) y eventos de partículas solares (SEP). Aunque Atacama tiene el mayor índice UV solar terrestre (útil para probar degradación de polímeros/óptica), **no reproduce errores de bit (*Single-Event Upsets*, SEUs) en aviónica ni dosimetría biológica espacial**. |
| **4. Temperatura Superficial y Oscilación Diurna ($\Delta T$)** | **$265\text{--}305\text{ K}$** ($\Delta T \approx 35\text{--}40\text{ K}$) | **$150\text{--}293\text{ K}$** ($\Delta T \approx 80\text{--}100\text{ K}$ diario) | **$100\text{--}390\text{ K}$** ($\Delta T \approx 290\text{ K}$ en ciclo sinódico de 29.5 días; PSRs a **$25\text{--}40\text{ K}$**) | **Porqué físico:** La ausencia de atmósfera densa y vapor de agua en Luna/Marte reduce la inercia térmica efectiva de la capa límite, provocando fatiga termo-elástica criogénica extrema que ningún desierto terrestre alcanza al aire libre. |

---

## Compuerta 4 · Auditoría de Datos Disponibles en Disco vs. Estado del Pipeline

Antes de validar cualquier entregable, ejecuta esta verificación sobre los datos locales para asegurar **100 % de honestidad científica** (ver [`docs/PLAN_MAESTRO.md`](../../../docs/PLAN_MAESTRO.md) §1.1):

1. **Inspeccionar archivos físicos de datos:**
   ```bash
   ls -lh backend/app/data/
   ```
2. **Verificar el motor de semillas y celdas H3 (`ckepi.duckdb`):**
   - Confirmar que las celdas terrestres, lunares y marcianas en [`backend/app/etl/seed_datasets.py`](../../../backend/app/etl/seed_datasets.py) contienen valores agregados reales derivados de misiones oficiales (`LRO LOLA/Diviner`, `MGS MOLA/TES`, `Copernicus DEM GLO-30`, `NASA POWER`, `Open-Meteo ERA5-Land`, `Macrostrat`).
   - **Regla inquebrantable:** No modificar `backend/app/data/ckepi.duckdb` durante auditorías de solo lectura (`git status` debe mostrar `ckepi.duckdb` limpio).
3. **Verificar el estado de los recortes GeoTIFF a 30 m en [`terrain_statistics.py`](../../../backend/app/engine/terrain_statistics.py):**
   - Comprobar si existen recortes GeoTIFF reales en `backend/app/data/geotiff/` o si [`terrain_statistics.py`](../../../backend/app/engine/terrain_statistics.py) está ejecutando `_synthesize_calibrated_metric_dem()` (superficie estocástica calibrada a partir de la pendiente y rugosidad medidas de cada sitio).
   - **Mientras se utilice `_synthesize_calibrated_metric_dem()`:** Toda documentación (`README.md`, `docs/DATA_PROVENANCE.md`, `REFERENCES.md`, `docs/DEMO_7_SLIDES_EN.md`, `docs/SUBMISSION_PACK_EN.md`) **DEBE declarar explícitamente** que la comparación de distribuciones a $30\text{ m}$ opera como una *demostración metodológica sobre DEM sintético calibrado con las pendientes y rugosidades medidas de cada sitio*, evitando cualquier reclamo de ingesta directa de píxeles GeoTIFF crudos hasta que los archivos `.tif` estén en disco.
4. **Ejecutar pruebas automatizadas del motor científico:**
   ```bash
   cd backend && .venv/bin/python -m pytest tests/test_causal_decomposer.py tests/test_api.py -q
   ```

---

## Formato de Salida del Auditor Científico
Devuelve una tabla con las **4 Compuertas Científicas**:
1. Escala común $\ge 30\text{ m}$ ($30/60/90\text{ m}$) y unidades ($\text{m}$, $^\circ$).
2. Distancias de distribución completas ($W_1$, $D_{\text{KS}}$) + incertidumbre *2D Block Bootstrap* ($\text{IC } 95\%$).
3. Casos positivos vs. casos negativos (Salar de Pajonales vs. Yungay) + Brecha Física Irreducible $\mathbf{B}$ ($0.38\text{ g}$, $0.6\text{ kPa }\text{CO}_2$, $230\text{ mSv/año}$, $\Delta T$).
4. Estado real de los datos en disco y honestidad documental (`PASS` / `FAIL`).
