# DOSSIER MAESTRO COMPLETO PARA NEHE — Ckepi (NASA Space Apps 2026 · Lattices Team)

> **Documento Todo-en-Uno (Global + Local + Ciencia 30 m + Caja La Araucana y ODS + PPTX/PDF EN y ES + Pitch 3 min + Video 30 s + Q&A)**  
> **Rama Activa:** `dani` (`origin/dani`) · **Última actualización:** Sábado 14 de noviembre de 2026 (`20:25 CLT` · sincronizado hasta commits `bc9bd35`, `c735fc9` y `d4238af`)  
> **🎯 ENFOQUE CONCRETO TRAS FEEDBACK DE MENTORES:** Lee primero **[`SOLUCION_CONCRETA_FEEDBACK_MENTORES.md`](SOLUCION_CONCRETA_FEEDBACK_MENTORES.md)** — Cero sobrecarga de datos sueltos; todo el pitch y la app se centran en **cruzar la Luna (Polo Sur) y Marte (Cráter Jezero) con las 4 zonas reales medidas a 30 m en la Región de Antofagasta (`83b224` Pampa $0,54^\circ$ vs. Yungay $3,32^\circ$ vs. Salar `83b225` $1,71^\circ$ vs. Alta Cordillera `83b221` $6,92^\circ$)**, mostrando qué se parece, qué jamás puede imitar la Tierra ($0,38\text{ g}$, aire de $\text{CO}_2$, radiación) y cómo sirve hoy a la comunidad, la educación STEAM y los empleos locales de Antofagasta (robótica minera, observatorios y energía solar).  
> **Desafío Oficial:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*  
> **Sede:** Antofagasta, Chile (Universidad Católica del Norte · Organizado en Chile por **Caja La Araucana** junto a American Spaces)

---

## PARTE 0 · ARCHIVOS DE PRESENTACIÓN (.PPTX, .PDF Y .HTML), LOGOS V2 Y FONDOS PAPER-CUT LISTOS PARA USAR

Dentro de esta misma carpeta (`docs/nehe/`) ya están generadas las presentaciones de **7 diapositivas** con **la nueva Identidad Visual V2 («Sal, Cobre y Azufre»)** (`#101F24` Noche Mineral, `#183A3A` Tinta de Roca, `#FFF2D7` Sal Cálida, `#E4ED83` Azufre Pálido, `#E8A080` Cobre Luminoso), **los fondos paper-cut de cada escena** con velo de contraste WCAG AA y **marca de agua visible `AI-generated background & symbol · Ckepi`**, el **logo oficial CKEPI V2**, las capturas reales de la aplicación (`shot_explorer_mars.png`, `shot_explorer_moon.png`, `shot_atacama_analysis.png`) y todas las métricas reales verificadas a 30 m:

| Modalidad | PowerPoint Editable (`.pptx`) | PDF Listo para Proyectar / Subir (`.pdf`) | Vista Web / Imprimible (`.html`) |
|---|---|---|---|
| **🌍 Global (100 % Inglés · 7 Slides · Brand V2 + Paper-Cut BG)** | [`ckepi-pitch-en.pptx`](ckepi-pitch-en.pptx) | [`ckepi-pitch-en.pdf`](ckepi-pitch-en.pdf) | [`ckepi-pitch-en.html`](ckepi-pitch-en.html) y [`PPT_7_SLIDES_PROTOTYPE.html`](PPT_7_SLIDES_PROTOTYPE.html) |
| **🇨🇱 Local Antofagasta / Caja La Araucana (Español · 7 Slides · Brand V2 + Paper-Cut BG)** | [`ckepi-pitch-es.pptx`](ckepi-pitch-es.pptx) | [`ckepi-pitch-es.pdf`](ckepi-pitch-es.pdf) | [`ckepi-pitch-es.html`](ckepi-pitch-es.html) |
| **🎨 Kit de Marca V2, Logos y Fondos 16:9 para PPT/Canva** | [`brand_and_backgrounds/`](brand_and_backgrounds/) | [`CKEPI-brand-board.png`](brand_and_backgrounds/CKEPI-brand-board.png) · [`IDENTIDAD_V2.md`](brand_and_backgrounds/IDENTIDAD_V2.md) | [`BRAND_IDENTITY_AND_LEGAL_CREDITS.md`](BRAND_IDENTITY_AND_LEGAL_CREDITS.md) |

> **¿Cómo regenerar los `.pptx`, `.pdf` y `.html` si cambias un texto?**  
> Ejecuta desde la raíz del repositorio:  
> `backend/.venv/bin/python docs/nehe/build_deck_nehe.py`

---

## PARTE 1 · EL CORAZÓN DEL PROYECTO (PROBLEMA, VALOR E INNOVACIÓN)

### 1.1 ¿El problema es real?
**Sí.** La propia **NASA** reconoce en el desafío que los análogos terrestres no están completamente caracterizados y que existen oportunidades reales para identificar nuevos lugares útiles para la exploración espacial (Luna y Marte). La comparación requiere integrar datos científicos de múltiples instrumentos a escala comparable y comprender las limitaciones físicas de cada terreno.

### 1.2 ¿Es importante y afecta a las personas?
**Sí, en dos niveles:**
- **Investigadores e ingenieros:** Necesitan información transparente y reproducible para orientar investigaciones preliminares y preparar ensayos de campo (movilidad de rovers, sensores ópticos/LiDAR, geología).
- **Oportunidad educativa y comunitaria:** Acercar estos conocimientos a estudiantes, familias y personas sin experiencia científica mediante herramientas comprensibles, accesibles y diseñadas para baja alfabetización digital.

### 1.3 Propuesta de Valor
**Ckepi** busca facilitar comparaciones científicas transparentes, orientar investigaciones preliminares y permitir que más personas aprendan con datos espaciales reales. Además, estudiamos **sectores poco caracterizados de Antofagasta y otras regiones** para identificar nuevas oportunidades de investigación.

### 1.4 Nuestra Propuesta de Innovación (Frase Ancla en Español e Inglés)
- **Español (Pitch Local):**
  > **«No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué características comparte, qué diferencias existen y qué nuevos lugares merecen ser estudiados utilizando evidencia científica.»**
- **Inglés (7 Slides / Video / Página Global):**
  > ***"We do not seek to prove that Atacama is identical to Mars. We seek to show which characteristics it shares, which differences exist, and which new locations deserve to be studied using scientific evidence."***

---

## PARTE 2 · EVIDENCIA CIENTÍFICA REAL A ESCALA COMÚN DE 30 METROS (`commit 1535fb7` / `809f039`)

> ⚠️ **IMPORTANTE PARA LAS DIAPOSITIVAS:** Las cifras antiguas («Salar de Pajonales $W_1 = 0,77^\circ$» y «Yungay $W_1 = 4,13^\circ$») provenían del DEM sintético anterior y **están retiradas**. Usa **exclusivamente** las cifras medidas sobre **DEM reales a 30 m** de esta tabla (`docs/RESULTADOS_TERRENO_REALES.md`).

### 2.1 Datos y Método Verificados (`backend/scripts/precompute_real_terrain.py`)
- **Marte (Objetivo):** **USGS Mars 2020 TRN CTX DEM Mosaic** del Cráter Jezero (**NASA MRO CTX**, $20\text{ m/px}$, dominio público, proyección Equirectangular con escala verdadera en $18,47^\circ\text{ N}$), remuestreado por promedio de área a **$30\text{ m/px}$**.
- **Tierra (Candidatos en Antofagasta):** **ESA Copernicus DEM GLO-30** (DSM $1^{\prime\prime}$), reproyectado a **UTM Zona 19S (`EPSG:32719`, $30\text{ m/px}$)**. *(Nota: `NASADEM_HGT v001` no se usa en este build porque requiere cuenta Earthdata).*
- **Malla Global H3 en Caché (`ckepi.duckdb`):** **12.193 celdas terrestres H3** ($790$ celdas Res-2 y $11.403$ celdas Res-3, con $10.000$ celdas Res-3 enriquecidas con ERA5-Land y refinamiento bajo demanda a 7 celdas hijas).
- **Ventana de comparación:** $6 \times 6\text{ km}$ ($200 \times 200\text{ píxeles}$ a $30\text{ m/px}$).
- **Variables derivadas en unidades métricas:**
  - **Pendiente (`slope_deg`, grados $^\circ$):** Diferencias finitas centrales de segundo orden con recorte de 1 píxel de borde.
  - **Relieve local (`local_relief_m`, metros $\text{m}$):** $Z_{\max} - Z_{\min}$ en bloques no solapados de $300 \times 300\text{ m}$ ($10 \times 10\text{ px}$).
- **Distancias estadísticas e incertidumbre:**
  - **Wasserstein-1 ($W_1$, `scipy.stats.wasserstein_distance`)** en grados ($^\circ$) o metros ($\text{m}$).
  - **Kolmogorov–Smirnov de 2 muestras ($D_{\text{KS}}$, `scipy.stats.ks_2samp`)** en $[0, 1]$.
  - **Bootstrap espacial por bloques 2D ($10 \times 10\text{ px}$, IC 95 %)** + análisis de sensibilidad multiescala a **30 m, 60 m y 90 m**.

### 2.2 Tabla Oficial de Resultados a 30 m (Jezero vs. Antofagasta)

| Caso | Ventana Terrestre / Celda H3 (`res=3`) | Centro (`lat, lon`) y Elevación ($\text{m}$) | Pendiente Mediana $P_{50}$ ($P_{90}$) | $W_1$ Pendiente vs. Jezero (IC 95 %) | $D_{\text{KS}}$ | $W_1$ Relieve ($\text{m}$) | Lectura Científica (Qué sí se parece, qué no y por qué) |
|---|---|---|---|---|---|---|---|
| **Referencia Marte** | **Cráter Jezero (`mars_jezero_crater`)** | `18,38° N, 77,58° E`<br/>($-2.674\text{ a }-2.599\text{ m}$) | **$1,70^\circ$** ($4,01^\circ$) | $0,00^\circ$ (Ref) | $0,00$ | Ref ($9,0\text{ m}$) | Ventana real de $6\times 6\text{ km}$ del CTX DEM de NASA MRO a $30\text{ m}$. |
| **✅ LO QUE SÍ SE PARECE** | **`83b224fffffffff`** · Celda rotulada «Pampa Central» (Antofagasta) | `23,05° S, 69,50° W`<br/>($1.408\text{ a }1.538\text{ m}$) | **$1,37^\circ$** ($2,85^\circ$) | **$0,54^\circ$** ($0,40\text{–}0,65^\circ$)<br/>*60m: $0,40^\circ$ · 90m: $0,27^\circ$* | **$0,15$** | **$1,8\text{ m}$** | **El mejor ajuste en pendiente y relieve a 30 m**, estable a 30, 60 y 90 m. Más cercana a Jezero que el control clásico Yungay. **Preseleccionada para estudiar en terreno (no es certificación).** |
| **⚠️ CONTROL CLÁSICO** | **Yungay (`control_yungay`)** | `24,08° S, 69,91° W`<br/>($957\text{ a }1.280\text{ m}$) | **$2,56^\circ$** ($15,11^\circ$) | **$3,32^\circ$** | **$0,31$** | **$20,8\text{ m}$** | Estándar mundial para **astrobiología hiperárida** (Navarro-González et al., 2003), pero se aleja de Jezero en pendiente por su cola de laderas fuertes ($P_{90}=15,11^\circ$). |
| **❌ NO SE PARECE #1 (Muy plana)** | **`83b225fffffffff`** · Celda rotulada «Cordillera de la Sal» | `23,61° S, 68,52° W`<br/>($2.301\text{ a }2.342\text{ m}$) | **$0,19^\circ$** ($0,66^\circ$) | **$1,71^\circ$** ($1,65\text{–}1,86^\circ$) | **$0,82$** | **$8,2\text{ m}$** | **Contraejemplo por falta de pendiente:** Superficie de salar casi horizontal ($P_{50}=0,19^\circ$). |
| **❌ NO SE PARECE #2 (Muy abrupta)** | **`83b221fffffffff`** · Celda rotulada «Salar de Pajonales» | `24,68° S, 68,60° W`<br/>($4.195\text{ a }5.270\text{ m}$) | **$7,89^\circ$** ($15,51^\circ$) | **$6,92^\circ$** ($6,17\text{–}7,31^\circ$) | **$0,74$** | **$42,8\text{ m}$** | **Contraejemplo por exceso de pendiente:** Relieve volcánico altoandino mucho más escarpado que Jezero. |
| **⚠️ Similar al control** | **`83b220fffffffff`** · Celda de Yungay | `24,14° S, 69,58° W`<br/>($1.423\text{ a }1.833\text{ m}$) | **$3,46^\circ$** ($14,35^\circ$) | **$3,70^\circ$** ($3,22\text{–}4,20^\circ$) | **$0,52$** | **$22,4\text{ m}$** | Comportamiento similar al control Yungay. |

---

## PARTE 3 · BRECHA FÍSICA IRREDUCIBLE ($\mathbf{B}$) Y TABLA «TRES MUNDOS PARA TODOS»

Fuente verificada: **NASA NSSDCA Planetary Fact Sheets** (`https://nssdc.gsfc.nasa.gov/planetary/factsheet/`) + **Curiosity/RAD** (Hassler et al., 2014, *Science*, DOI: `10.1126/science.1244797`).

| Dimensión | Tierra (Atacama) | Luna (Polo Sur) | Marte (Cráter Jezero) | Frase Accesible sin Jerga (Modo con Voz) | ¿Atacama se parece? y Porqué Físico |
|---|---|---|---|---|---|
| **Gravedad ($g$)** | **$9,8\text{ m/s}^2$ ($1,00\text{ g}$)** | **$1,6\text{ m/s}^2$ ($0,166\text{ g}$)** | **$3,7\text{ m/s}^2$ ($0,377\text{ g}$)** | *«Una mochila de 10 kg se siente como de 1,7 kg en la Luna y 3,8 kg en Marte.»* | **❌ NO:** En la Tierra el peso es $2,6\times$ mayor que en Marte y $6\times$ mayor que en la Luna $\to$ cambia el hundimiento de ruedas y la suspensión. |
| **Presión y Atmósfera ($P_{\text{atm}}$)** | **$1\text{ bar}$ ($101,3\text{ kPa}$, $\text{N}_2/\text{O}_2$)** | **$\sim 3\times 10^{-15}\text{ bar}$ ($0\text{ kPa}$, vacío)** | **$\sim 0,006\text{ bar}$ ($6,36\text{ mbar} \approx 0,6\text{ kPa}$, $95,1\%\text{ CO}_2$)** | *«El aire de Marte es ~160 veces más delgado; en la Luna no hay aire.»* | **❌ NO:** Cambia por completo la convección térmica y la aerodinámica de rotores. |
| **Temperatura ($\Delta T$)** | **Media $15\text{ °C}$** | **Ecuador: $-178\text{ a }+117\text{ °C}$ ($95\text{–}390\text{ K}$)** | **Media $-59\text{ °C}$ (ficha Marte) o $-65\text{ °C}$ (tabla comparativa); *Viking 1*: $-89\text{ a }-31\text{ °C}$** | *«En la Luna cambia casi 300 grados entre el día y la noche.»* | **❌ NO:** Ciclos criogénicos extremos sin atmósfera densa. |
| **Escudo Magnético y Radiación ($R_{\text{ion}}$)** | **Sí ($\sim 2,4\text{ mSv/año}$ fondo medio mundial)** | **No ($\sim 380\text{ mSv/año}$)** | **No ($\sim 0,64\text{ mSv/día} \approx 230\text{ mSv/año}$, *Curiosity/RAD*)** | *«Por eso Atacama no reproduce la radiación espacial: la Tierra nos protege con su escudo magnético y su atmósfera.»* | **❌ NO:** Atacama sirve para probar radiación UV solar, pero no rayos cósmicos galácticos (GCR). |
| **Terreno (Pendiente y Relieve a $30\text{ m}$)** | **Copernicus DEM GLO-30 ($30\text{ m}$)** | **LRO LOLA GDR** | **MRO CTX DEM ($20\text{ m} \to 30\text{ m}$)** | *«Comparamos qué tan inclinado es el suelo metro a metro.»* | **✅ EN PARTE (Se mide):** La celda `83b224fffffffff` comparte la distribución de pendientes de Jezero ($W_1 = 0,54^\circ$). |

---

## PARTE 4 · CAJA LA ARAUCANA (4 OBJETIVOS OFICIALES), METAS ODS Y SOSTENIBILIDAD

| # | Objetivo Oficial Caja La Araucana | Metas ODS Declaradas | Cómo lo cumple Ckepi en Antofagasta |
|---|---|---|---|
| **1** | **Democratizar el acceso a ciencia de frontera** | **ODS `4.3`** | Recorrido accesible *«Tres Mundos para Todos»* (*1. Mirar · 2. Comparar · 3. Investigar*), gratuito, con lectura por voz (`Web Speech API`), botones $\ge 44\text{ px}$ y tarjetas imprimibles para personas con baja alfabetización digital. |
| **2** | **Desarrollar competencias STEAM y empleabilidad** | **ODS `4.4` y `8`** | Acerca ciencia de datos espaciales (`H3`, `DuckDB`), estadística de terreno a $30\text{ m}$ ($W_1, D_{\text{KS}}$) y evaluación de sitios para robótica/minería y astro-geoturismo comunitario. |
| **3** | **Generar soluciones con aplicación local** | **ODS `9.5`, `10` y `13`** | Pone en valor sectores poco estudiados de la Región de Antofagasta (celda `83b224fffffffff`, $W_1 = 0,54^\circ$), reduce brechas digital/etaria/territorial y optimiza la preselección satelital antes de campañas de campo. |
| **4** | **Consolidar una red interregional de innovación (*Lattices*)** | **ODS `17.3`, `17.16` y `17.17`** | Articula a Caja La Araucana, UCN, UA y otras regiones de Chile con catálogos abiertos internacionales (`NASA`, `ESA`, `CSA`, `JAXA`) bajo licencia abierta `Apache License 2.0`. |

### Modelo de Sostenibilidad (Hipótesis Institucional Honesta)
- **Núcleo 100 % gratuito y abierto (`Apache License 2.0`):** El acceso web, los datos y el modo educativo permanecen abiertos sin barreras de pago ni inicio de sesión.
- **Hipótesis institucional por validar:** Municipios, bibliotecas, universidades y fondos sociales pueden financiar talleres STEAM guiados, kits de cartas impresas y reportes territoriales regionales (sin afirmar ventas, precios ni convenios firmados todavía).

---

## PARTE 5 · NOVEDADES DE LA DEMO EN LA RAMA `dani` TRAS EL FEEDBACK DE MENTORES (`commits c735fc9`, `bc9bd35`, `d4238af`)

1. **Modo Explorar para la Entrega Local (`?view=explore` · `LocalExplorePage.tsx` + `LearnDialog.tsx` — Commit `c735fc9`):**
   - Creado en respuesta directa al feedback de mentores (*«demasiada información»*): a la izquierda una sola pregunta (*«¿Dónde en la Tierra nos preparamos para la Luna y Marte?»*) y una frase; a la derecha **3 mundos de cartón flotando (Luna · Antofagasta · Marte)** sin recuadros ni ruido visual.
   - Al tocar un mundo, abre una lección de **3–4 pasos con un pictograma grande (`Pictograms.tsx`), una frase simple, un elemento interactivo para tocar** (medidor *«Muy parecido / Algo parecido / Poco parecido»* con el dato real Pampa $0,54^\circ$ vs. Yungay $3,32^\circ$, día vs. noche en la Luna y Atacama, simulador de mochila de $10\text{ kg} \to 1,7\text{ kg}$ en la Luna y $3,8\text{ kg}$ en Marte, y ranking de las 4 zonas de Antofagasta) y botón **«Escuchar» (`Web Speech API`)**.
2. **Pantalla Principal de Cruce Interactivo (`?view=app` · `WorldsHero.tsx` + `CrossingDialog.tsx` — Commit `bc9bd35`):**
   - Presenta **Luna · Antofagasta · Marte** como tarjetas vivas de cristal (`.ckepi-glass`) con planetas de papel dibujados por código (0 % IA) y veredictos inmediatos **Sí / En parte / No**.
   - `CrossingDialog`: ventana con motion que cruza cada mundo con Antofagasta mostrando: 1) el cruce, 2) lo que sí se parece (pendientes reales a 30 m: `83b224` $W_1 = 0,535^\circ$ vs. Yungay $3,32^\circ$), 3) lo que la Tierra no puede imitar (mochila, aire y radiación), y 4) **para qué sirve hoy, qué aprendes en STEAM y en qué podrías trabajar en Antofagasta (robótica y automatización minera, observatorios astronómicos y energía solar del desierto)**.
   - Tipografías autoalojadas **`Public Sans` (USWDS / SIL OFL 1.1)** e **`IBM Plex Mono` (SIL OFL 1.1)**, pictogramas SVG propios y **1.052 claves trilingües (`ES / PT / EN`)**.
   - **Backend memoizado (< 0,4 s):** Las comparaciones sobre DEM reales a 30 m se precalculan al arrancar el servidor (bajando de ~10 s a $< 0,4\text{ s}$) con límites de tasa atómicos y transacciones seguras en DuckDB (`commit d4238af`).

---

## PARTE 6 · ESTRUCTURA DE LAS 7 SLIDES Y CUMPLIMIENTO LEGAL OPEN SCIENCE

1. **Slide 1 — Cover & Value Proposition:** *Ckepi* (*Lattices Team*, Antofagasta), Challenge (*Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*), Innovation Thesis & $\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$, `Apache License 2.0`, captura real 3D de Marte.
2. **Slide 2 — Real Problem, Human Importance & Value Proposition:** ¿El problema es real? (Sí, reconocido por NASA), ¿Afecta a las personas? (Sí, investigadores/ingenieros + estudiantes y ciudadanos), y nuestra propuesta de valor e innovación + captura real 3D del Polo Sur Lunar (Shackleton).
3. **Slide 3 — Interactive Prototype Walkthrough (Dual-Mode Mobile-First UI):** Home Intro (`HexField`), Modo Misión (Globos 3D NASA Trek + 12.193 celdas H3 + panel DEM 30 m) y Modo Explorador (*«Tres Mundos en tu Mano»* con voz `Web Speech API`, 842 claves `ES/PT/EN`) + captura real del análisis de Atacama.
4. **Slide 4 — Causal Decomposition ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$) & Precision NASA Open Data:** 10 variables $\mathbf{X}$, 6 variables $\mathbf{Y}$, 3 variables $\mathbf{B}$, y datasets exactos (`NASA MRO CTX / USGS Mars 2020 TRN CTX DEM Mosaic 20 m`, `Mars 2020 MEDA`, `MSL REMS/RAD`, `LRO LOLA/Diviner`, `MGS MOLA`, `NASA POWER v2.5`, `NASA Trek WMTS`, `NSSDCA Fact Sheet`, `ESA Copernicus DEM GLO-30` con atribución DLR/Airbus/UE/ESA, `ERA5-Land`, `SoilGrids v2.0`, `Macrostrat`).
5. **Slide 5 — Real 30 m Scientific Proof (What Matches, What Fails & Why + Gap $\mathbf{B}$):** Ventanas de $6\times 6\text{ km}$ a $30\text{ m/px}$, $W_1$ y $D_{\text{KS}}$ con Bootstrap 2D (IC 95 %) y sensibilidad 30/60/90 m: Caso positivo (`83b224fffffffff`, $W_1 = 0,54^\circ$ [IC 95 % $0,40^\circ\text{–}0,65^\circ$], supera al Control Yungay $W_1 = 3,32^\circ$) vs. Casos negativos (`83b221fffffffff` $W_1 = 6,92^\circ$ muy escarpada; `83b225fffffffff` $W_1 = 1,71^\circ$ muy plana) + tabla completa de la Brecha Física Irreducible $\mathbf{B}$ ($0,38\text{ g}$, $0,6\text{ kPa }\text{CO}_2$, $\sim 230\text{ mSv/año}$, $\Delta T$).
6. **Slide 6 — Caja La Araucana 4 Strategic Objectives, UN SDGs & Sustainability:** Los 4 ejes oficiales de Caja La Araucana + metas ODS (`4.3, 4.4, 8, 9.5, 10, 13, 17.3, 17.16, 17.17`) + modelo de sostenibilidad (núcleo gratuito `Apache-2.0` + hipótesis institucional por validar).
7. **Slide 7 — Legal Open Science Credits, Brand Identity & AI Watermark Disclosure:** Atribución legal completa (`Apache License 2.0`, `System UI Stack + JetBrains Mono SIL OFL 1.1`, `Lucide Icons MIT/ISC`, `17 U.S.C. § 105`, licencia `Copernicus DEM GLO-30`, cero logos NASA) y declaración transparente de IA (`AI_DISCLOSURE.md` + marca de agua visible `«AI-generated video»` en el video decorativo de la intro y `«AI-generated · Ckepi»` en los fondos paper-cut).

---

## PARTE 7 · ENLACES RÁPIDOS A TODOS LOS ARCHIVOS DE `docs/nehe/`

- **Presentaciones Editables y PDFs:**
  - Global (Inglés): [`ckepi-pitch-en.pptx`](ckepi-pitch-en.pptx) · [`ckepi-pitch-en.pdf`](ckepi-pitch-en.pdf) · [`ckepi-pitch-en.html`](ckepi-pitch-en.html) · [`PPT_7_SLIDES_GLOBAL_EN.md`](PPT_7_SLIDES_GLOBAL_EN.md) · [`PPT_7_SLIDES_PROTOTYPE.html`](PPT_7_SLIDES_PROTOTYPE.html)
  - Local Antofagasta (Español): [`ckepi-pitch-es.pptx`](ckepi-pitch-es.pptx) · [`ckepi-pitch-es.pdf`](ckepi-pitch-es.pdf) · [`ckepi-pitch-es.html`](ckepi-pitch-es.html)
- **Guiones de Pitch y Video:**
  - Pitch presencial 3 minutos + Q&A (Español): [`PITCH_LOCAL_3MIN_ANTOFAGASTA_ES.md`](PITCH_LOCAL_3MIN_ANTOFAGASTA_ES.md)
  - Guion de video de 30 segundos (EN + ES): [`GUION_VIDEO_DEMO_30S_EN_ES.md`](GUION_VIDEO_DEMO_30S_EN_ES.md)
- **Datos Verificados y Bitácora:**
  - Resultados reales de terreno a 30 m: [`RESULTADOS_TERRENO_REALES.md`](RESULTADOS_TERRENO_REALES.md) y [`DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md`](DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md)
  - Bitácora en vivo de commits (Claude, GPT, Kevin, Angemon): [`BITACORA_CAMBIOS_CLAUDE_GPT_EQUIPO.md`](BITACORA_CAMBIOS_CLAUDE_GPT_EQUIPO.md)
