# Hoja de Datos Verificados para Diapositivas, Pitch y Defensa (`docs/nehe/DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md`)

> **Regla de Oro para Nehe y Dani:** Usa **únicamente** las cifras de este documento en las diapositivas, el video y el pitch oral. Todas provienen de mediciones reales verificadas en el repositorio (`backend/app/data/derived/terrain_windows_30m.json`, `pytest tests/test_terrain_real_dem.py` y `NASA NSSDCA Planetary Fact Sheets`).

---

## 1. Tabla Principal: Comparación Topográfica sobre DEM Reales a Escala Común de $30\text{ m}$
- **Fuente Marte:** `USGS Mars 2020 TRN CTX DEM Mosaic` (**NASA MRO CTX**, $20\text{ m/px}$, proyección Equirectangular con escala verdadera en $18{,}47^\circ\text{ N}$, remuestreado por promedio a **$30\text{ m/px}$**).
- **Fuente Tierra:** `ESA Copernicus DEM GLO-30` (DSM $1^{\prime\prime}$, reproyectado a **UTM Zona 19S `EPSG:32719` a $30\text{ m/px}$**).
- **Tamaño de ventana:** $6 \times 6\text{ km}$ ($200 \times 200\text{ píxeles}$ a $30\text{ m/px}$).
- **Métricas:** Pendiente por diferencias finitas centrales ($^\circ$, recorte de 1 píxel de borde) y Relieve Local ($\text{m}$, $Z_{\max}-Z_{\min}$ en bloques de $300\times 300\text{ m}$). Distancias **Wasserstein-1 ($W_1$)** y **Kolmogorov–Smirnov ($D_{\text{KS}}$)** con **Bootstrap por bloques 2D (IC 95 %)** y sensibilidad a **30 m, 60 m y 90 m**.

| Caso | Ventana / Celda H3 (`res=3`) | Coordenadas del Centro | Rango de Elevación ($\text{m}$) | Mediana Pendiente $P_{50}$ (Tierra vs. Jezero) | Distancia $W_1$ Pendiente (IC 95 %) | Estadístico $D_{\text{KS}}$ | $W_1$ Relieve Local ($\text{m}$) | Qué decir en la Slide / Pitch (Porqué físico) |
|---|---|---|---|---|---|---|---|---|
| **Objetivo Marciano** | **Cráter Jezero (`mars_jezero_crater`)** | `18,38° N, 77,58° E` | $-2.674$ a $-2.599\text{ m}$ | **$1,70^\circ$** ($P_{90} = 4,0^\circ$) | Referencia ($0,00^\circ$) | Referencia ($0,00$) | Referencia | Ventana real de $6\times 6\text{ km}$ en Jezero a $30\text{ m/px}$. |
| **✅ Qué SÍ se parece (Hallazgo)** | **Celda `83b224fffffffff` (Antofagasta)** | `-23,052° S, -69,497° W` | $1.408$ a $1.538\text{ m}$ | **$1,37^\circ$** vs. $1,70^\circ$ | **$0,54^\circ$** ($0,40^\circ\text{–}0,65^\circ$) | **$0,15$** | **$1,8\text{ m}$** | **La más parecida en pendiente a 30 m** (y se mantiene a 60 y 90 m). Más cercana a Jezero que el control Yungay. Preseleccionada para estudio preliminar de movilidad. |
| **⚠️ Control Clásico** | **Control Yungay (`control_yungay`)** | `-24,08° S, -69,91° W` | $957$ a $1.280\text{ m}$ | — ($P_{90} = 15,1^\circ$) | **$3,32^\circ$** | — | — | Excelente análogo hiperárido para **astrobiología** (Navarro-González et al., 2003), pero en su ventana de 6 km tiene una cola de pendientes fuertes ($P_{90}=15,1^\circ$ vs. $4,0^\circ$). |
| **❌ Qué NO se parece #1 (Muy escarpada)** | **Celda `83b221fffffffff` (Altoandina)** | `-24,683° S, -68,604° W` | $4.195$ a $5.270\text{ m}$ | **$7,89^\circ$** vs. $1,70^\circ$ | **$6,92^\circ$** ($6,17^\circ\text{–}7,31^\circ$) | **$0,74$** | **$42,8\text{ m}$** | **Contraejemplo por exceso de pendiente:** Relieve volcánico andino de alta montaña, demasiado abrupto frente a Jezero. |
| **❌ Qué NO se parece #2 (Muy plana)** | **Celda `83b225fffffffff` (Salar)** | `-23,606° S, -68,524° W` | $2.301$ a $2.342\text{ m}$ | **$0,19^\circ$** vs. $1,70^\circ$ | **$1,71^\circ$** ($1,65^\circ\text{–}1,86^\circ$) | **$0,82$** | **$8,2\text{ m}$** | **Contraejemplo por falta de relieve:** Costra de salar casi horizontal ($P_{50}=0,19^\circ$), no reproduce las ondulaciones de Jezero. |
| **❌ Qué NO se parece #3** | **Celda `83b220fffffffff`** | `-24,138° S, -69,582° W` | $1.423$ a $1.833\text{ m}$ | **$3,46^\circ$** vs. $1,70^\circ$ | **$3,70^\circ$** ($3,22^\circ\text{–}4,20^\circ$) | **$0,52$** | **$22,4\text{ m}$** | Comportamiento similar al control Yungay, más abrupta que Jezero. |

---

## 2. Tabla «Tres Mundos para Todos» + Brecha Física Irreducible ($\mathbf{B}$)
Fuente oficial: **NASA NSSDCA Planetary Fact Sheets** (`https://nssdc.gsfc.nasa.gov/planetary/factsheet/`) + **Curiosity/RAD** (Hassler et al., 2014, *Science*, DOI: `10.1126/science.1244797`).

| Dimensión | Tierra (Atacama) | Luna (Polo Sur) | Marte (Cráter Jezero) | Analogía Cotidiana sin Jerga (Modo Explorador con Voz) | ¿Atacama se parece? / Porqué Físico |
|---|---|---|---|---|---|
| **Gravedad Superficial ($g$)** | **$9,8\text{ m/s}^2$ ($1,00\text{ g}$)** | **$1,6\text{ m/s}^2$ ($0,166\text{ g}$)** | **$3,7\text{ m/s}^2$ ($0,377\text{ g}$)** | *«Una mochila de 10 kg se siente como de 1,7 kg en la Luna y 3,8 kg en Marte.»* | **❌ NO (Brecha $\mathbf{B}$):** En la Tierra el rover pesa $2,6\times$ más que en Marte y $6\times$ más que en la Luna, cambiando el hundimiento de ruedas y la suspensión. |
| **Presión y Atmósfera ($P_{\text{atm}}$)** | **$1\text{ bar}$ ($101,3\text{ kPa}$, $\text{N}_2/\text{O}_2$)** | **$\sim 3\times 10^{-15}\text{ bar}$ ($0\text{ kPa}$, vacío)** | **$\sim 0,006\text{ bar}$ ($6,36\text{ mbar} \approx 0,6\text{ kPa}$, $95,1\%\text{ CO}_2$)** | *«El aire de Marte es ~160 veces más delgado e irrespirable; en la Luna no hay aire.»* | **❌ NO (Brecha $\mathbf{B}$):** Cambia por completo la disipación térmica por convección y la sustentación de rotores. |
| **Temperatura Superficial ($\Delta T$)** | **Media $15\text{ °C}$** ($\Delta T \approx 35\text{–}40\text{ K}$ en Atacama) | **Ecuador: $-178\text{ °C}$ a $+117\text{ °C}$ ($95\text{–}390\text{ K}$)** | **Media $-59\text{ °C}$ (ficha Marte) o $-65\text{ °C}$ (tabla comparativa); *Viking 1*: $-89\text{ a }-31\text{ °C}$ en un día** | *«En la Luna la temperatura cambia casi 300 grados entre el día y la noche.»* | **❌ NO (Brecha $\mathbf{B}$):** La falta de atmósfera densa provoca choques térmicos criogénicos extremos. |
| **Escudo Magnético y Radiación ($R_{\text{ion}}$)** | **Sí ($\sim 2,4\text{ mSv/año}$ media mundial)** | **No ($\sim 380\text{ mSv/año}$)** | **No ($\sim 0,64\text{ mSv/día} \approx 230\text{ mSv/año}$, *Curiosity/RAD*)** | *«La Tierra tiene un escudo magnético y aire grueso que nos protegen; Marte y la Luna no.»* | **❌ NO (Brecha $\mathbf{B}$):** Atacama sirve para probar radiación UV solar, pero no rayos cósmicos galácticos (GCR) sobre electrónica. |
| **Terreno (Pendiente y Relieve a $30\text{ m}$)** | **Copernicus DEM GLO-30 ($30\text{ m}$)** | **LRO LOLA GDR** | **MRO CTX DEM ($20\text{ m} \to 30\text{ m}$)** | *«Comparamos qué tan inclinado y rugoso es el suelo metro a metro.»* | **✅ EN PARTE (Se mide en $\mathbf{X}$):** La celda `83b224fffffffff` sí se parece en distribución de pendientes ($W_1 = 0,54^\circ$). |

---

## 3. Los 4 Objetivos Oficiales de Caja La Araucana y Metas ODS Declaradas
1. **Democratizar el acceso a ciencia de frontera** $\to$ **ODS `4.3`** (Educación técnica y superior accesible, gratuita y con voz).
2. **Desarrollar competencias STEAM y empleabilidad** $\to$ **ODS `4.4` y `8`** (Ciencia de datos espaciales `H3`/`DuckDB`, robótica/minería y astro-geoturismo en Antofagasta).
3. **Generar soluciones con aplicación local** $\to$ **ODS `9.5`, `10` y `13`** (Caracterización de celdas sub-estudiadas de Antofagasta como `83b224fffffffff`, reducción de brechas digital/etaria y menor huella logística de campañas).
4. **Consolidar una red interregional de innovación (*Lattices*)** $\to$ **ODS `17.3`, `17.16` y `17.17`** (Alianza multi-actor entre Caja La Araucana, UCN, UA, regiones de Chile y datos abiertos globales).
