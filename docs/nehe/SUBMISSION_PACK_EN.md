# Ckepi — NASA Space Apps 2026 Official Submission Package (EN + Local Pitch ES)

> **Team:** Lattices Team (Antofagasta, Chile — Caja La Araucana Hub)
> **Challenge:** Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars
> **License:** Apache License 2.0 (see `LICENSE`)

---

## 1. High-Level Project Summary & Innovation Statement (English — Global Judging)

> **Our Innovation Thesis:** *"We do not seek to prove that Atacama is identical to Mars. We seek to show which characteristics it shares, which differences exist, and which new locations deserve to be studied using scientific evidence."*

**Is the problem real and who does it affect?** Yes. NASA recognizes that terrestrial analogs are not yet fully characterized across multiple physical dimensions, leaving major opportunities to discover under-studied sites for Moon and Mars exploration. This affects **researchers and engineers** who need transparent preliminary screening before field trials, as well as **students and communities without scientific training** who deserve accessible tools to learn from real space data.

**Value Proposition:** **Ckepi** (*Lattices Team*, Antofagasta, Chile) is an open-source planetary analog engine comparing **Earth, the Moon, and Mars** dimension by dimension. Instead of black-box similarity percentages, Ckepi separates **Independent Substrate Forcings ($X$)**, **Environmental Responses ($Y = f(X)$)**, and the **Irreducible Physical Gap ($B$: gravity $0.38\text{ g}$ / $0.166\text{ g}$, thin $\text{CO}_2$ atmosphere of $\sim 0.6\text{ kPa}$ / vacuum, and $\sim 230\text{ mSv/yr}$ surface radiation on Mars)**. For terrain, Ckepi compares **real DEMs at a common 30 m metric scale** — the **NASA MRO CTX DEM of Jezero Crater** (USGS, 20 m) against **ESA Copernicus GLO-30** windows in Antofagasta — using **Wasserstein-1 ($W_1$)** and **Kolmogorov–Smirnov ($D_{\text{KS}}$)** distances with **2D block-bootstrap 95% confidence intervals** at **30, 60 and 90 m**. Result: an under-studied H3 cell in the Antofagasta Region (`83b224fffffffff`, 6 km window centred at 23.05°S, 69.50°W) matches Jezero's slope distribution with **$W_1 = 0.54^\circ$ (95% CI $0.40^\circ$–$0.65^\circ$)**, closer than the classic Yungay control (**$W_1 = 3.32^\circ$**), and the match holds at 60 m and 90 m. This is a **pre-selection for field study, not a certification**: only slope and relief are compared, and gravity, pressure and radiation can never be reproduced on Earth. The same evidence feeds accessible, voice-guided learning cards for local communities.

---

## 2. How It Addresses the Challenge & Uses NASA + Partner Open Data (English)
1. **Causal Variable Decomposition ($X \to Y \parallel B$):**
   - Uses regularized **Ridge Regression** and **Random Forest** (`scikit-learn`) + **PCA** on real **NASA Mars 2020 Perseverance MEDA**, **MSL Curiosity REMS**, and **LRO Diviner / LOLA** time-series to infer how substrate variables ($X$: slope, roughness, thermal inertia, albedo, solar flux, aridity) drive environmental responses ($Y$: $\Delta T$, nocturnal cooling, dust flux) while isolating the **Irreducible Physical Gap ($B$: $0.38\text{ g}$ / $0.166\text{ g}$ gravity, $6.1\text{ mbar}$ / $0\text{ mbar}$ pressure, and $\sim 230\text{--}380\text{ mSv/yr}$ ionizing radiation per Hassler et al., 2014, *Science*)**.
2. **Common-Scale (30 m) Non-Parametric Terrain Statistics:**
   - Reads **real DEMs**: the **USGS Mars 2020 TRN CTX DEM mosaic of Jezero** (NASA MRO CTX, 20 m/px, Equirectangular with true scale at 18.47°N; area-averaged to 30 m) and **ESA Copernicus DEM GLO-30** tiles reprojected to **UTM Zone 19S (`EPSG:32719`, 30 m/px)**. Each comparison uses a $6\times 6\text{ km}$ window ($200\times 200$ px); source URL and SHA-256 are recorded in `backend/app/data/derived/terrain_windows_30m.json` and the step is reproducible with `backend/scripts/precompute_real_terrain.py`. Any location without a real DEM window is explicitly labelled `SYNTHETIC — not a measurement` and is not presented as a result.
   - Computes central finite-difference **Slope (°)** and **Local Relief (m, max–min in 300 m blocks)**, reporting **$W_1$** and **$D_{\text{KS}}$** (`scipy.stats`) with **2D block-bootstrap 95% CIs** and **30/60/90 m sensitivity**. **What matches:** cell `83b224fffffffff` (median slope 1.37° vs. Jezero 1.70°; $W_1 = 0.54^\circ$, $D_{\text{KS}} = 0.15$). **What does not:** cell `83b221fffffffff` at 4,200–5,270 m is far too steep ($W_1 = 6.92^\circ$), cell `83b225fffffffff` is far too flat ($W_1 = 1.71^\circ$, $D_{\text{KS}} = 0.82$), and the Yungay control has a much heavier steep tail (90th-percentile slope 15.1° vs. 4.0°). Beyond terrain, the Irreducible Physical Gap $B$ (0.38 g, ~0.6 kPa CO₂, ~230 mSv/yr) is never reproducible on Earth.
3. **Inclusive STEAM Literacy ("Three Worlds in Your Hand") & Territorial Impact:**
   - Trilingual (`ES` / `PT` / `EN`), WCAG-accessible interface with **Web Speech API voice readout**, everyday physical analogies (a 10 kg backpack weighs 1.7 kg on the Moon and 3.8 kg on Mars), and alignment with **Caja La Araucana's 4 strategic objectives** and verified **UN SDG targets (`4.3, 4.4, 8, 9.5, 10, 13, 17.3, 17.16, 17.17`)**.

---

## 2B. Official `NASA Data` & Legal Open Science Attribution Field (Ready to Paste)

- **Official NASA Datasets & Resources Used (U.S. Federal Public Domain, `17 U.S.C. § 105`):**
  1. **NASA Mars Reconnaissance Orbiter (MRO) CTX / USGS Astrogeology — `Mars 2020 Terrain Relative Navigation CTX DEM Mosaic, Jezero Crater (20 m/px)`** — **core input of the terrain comparison** (`https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif`, public domain).
  2. **NASA Lunar Reconnaissance Orbiter (LRO) — `LOLA GDR` & `Diviner Lunar Radiometer GDR`** (PDS Geosciences Node, DOIs: `10.1007/s11214-010-9634-2`, `10.1007/s11214-010-9635-1`).
  3. **NASA Mars Global Surveyor (MGS) — `MOLA MEGDR`** (PDS Geosciences Node, DOI: `10.1029/2000JE001426`).
  4. *(Not used in this build: NASA JPL `NASADEM_HGT v001`, DOI `10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001`, requires an Earthdata account; Copernicus GLO-30 is used for Earth terrain instead.)*
  5. **NASA Mars 2020 Perseverance `MEDA` & MSL Curiosity `REMS` / `RAD`** (PDS Atmospheres Node, DOIs: `10.1007/s11214-021-00804-9`, `10.1126/science.1244797`).
  6. **NASA Langley Research Center — `NASA POWER API v2.5` (CERES / MERRA-2 Solar & Agroclimatology)** (`https://power.larc.nasa.gov/`).
  7. **NASA Solar System Treks (`Moon Trek` & `Mars Trek` WMTS / 3D Globes)** (NASA SSERVI / JPL-Caltech).
  8. **NASA NSSDCA Planetary Fact Sheet (Metric)** (Williams, D. R., NASA GSFC, 2024).
- **Space Agency Partner & Open Scientific Catalogs (each under its own licence):**
  - **European Space Agency (ESA) — `Copernicus DEM GLO-30`** (DSM, 1 arcsec, AWS Open Data; Copernicus DEM licence, attribution: "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"). *Verify exact licence text before submission.*
  - **ECMWF / Open-Meteo `ERA5-Land` Historical Climate Archive** (`CC BY 4.0`).
  - **University of Wisconsin–Madison `Macrostrat API v2`** (Lithology & Stratigraphy, `CC BY 4.0`).
- **Code, Typography, Icons, Basemaps & AI Disclosure (`Gate G9` & `Gate G11`):**
  - **Source Code:** Ckepi is released under **Apache License 2.0**. Third-party libraries keep their own licences (`FastAPI`, `DuckDB`, `Uber H3`, `SciPy`, `scikit-learn`, `React 18`, `Tailwind CSS`, `MapLibre GL JS`).
  - **Typography & Icons:** System UI font stack (no web fonts are loaded or redistributed); `Lucide Icons` (`ISC/MIT License`). Basemaps: `© OpenStreetMap contributors` (`ODbL`) & `© CARTO` (`CC BY 4.0`).
  - **AI Disclosure:** All scientific concepts ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$), statistical metrics ($W_1, D_{\text{KS}}$, 2D block bootstrap), and analog discoveries are 100% human-conceived by *Lattices Team*. AI coding assistants (`Claude` / `Antigravity`) were used for code scaffolding, translation parity, and documentation audits (`AI_DISCLOSURE.md`). **Zero AI-generated images/videos and zero NASA logos are used.**

---

## 3. 30-Second Video / Demo Script (English Subtitle Ready)
- **0:00–0:07 (Hook & Problem):** *"When NASA tests a Mars rover in Chile's Atacama Desert, which valley actually matches Jezero Crater's slopes—and where does the Earth analogy break down?"*
- **0:07–0:15 (3D Globe & H3 Discovery):** *"Ckepi connects NASA Trek globes and PDS telemetry with a global H3 grid built on NASA POWER, Copernicus DEM and ERA5-Land."*
- **0:15–0:23 (30 m Wasserstein-1 Proof):** *"Using NASA's CTX elevation model of Jezero and real Earth terrain at a common 30-meter scale, Ckepi finds an under-studied spot in Antofagasta whose slopes differ from Jezero's by about half a degree — closer than the classic Yungay site — while showing what Earth can never reproduce: gravity, air pressure and radiation."*
- **0:23–0:30 (Impact & Close):** *"From mission engineers to Antofagasta classrooms with voice-guided STEAM challenges: Ckepi puts Earth, the Moon, and Mars in your hand."*

---

## 4. Guion de Pitch Presencial (3 Minutos — Sede Antofagasta / Caja La Araucana) + Defensa Q&A (20 s)

### Estructura de 3 Minutos (Reloj en Mano)
- **0:00–0:40 · ¿El Problema es Real e Importante? + Nuestra Propuesta de Innovación:**
  - NASA reconoce que los análogos terrestres aún no están completamente caracterizados y que existen grandes oportunidades para identificar nuevos lugares útiles para la exploración lunar y marciana integrando datos científicos y comprendiendo las limitaciones de cada terreno.
  - Este problema afecta directamente a **investigadores e ingenieros** que necesitan evidencia preliminar transparente para diseñar ensayos, y abre una oportunidad educativa clave: **acercar datos espaciales reales a estudiantes y personas sin experiencia científica** mediante herramientas comprensibles y accesibles.
  - **Nuestra propuesta de innovación es clara:** *«No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué características comparte, qué diferencias existen y qué nuevos lugares merecen ser estudiados utilizando evidencia científica.»*
- **0:40–1:40 · Demostración Científica en Vivo (Propuesta de Valor para Investigadores — Rúbrica UCN / UA):**
  - En **Ckepi**, facilitamos comparaciones científicas transparentes desacoplando el sustrato independiente ($X$), la respuesta ambiental ($Y$) y la **Brecha Física Irreducible ($B$: gravedad $0{,}38\text{ g}$, atmósfera de $\text{CO}_2$ a $0{,}6\text{ kPa}$, radiación $\sim 230\text{ mSv/año}$ y temperatura $\Delta T$)**.
  - A **escala métrica común de 30 m** (con sensibilidad a 30, 60 y 90 m), comparamos distribuciones completas mediante **Wasserstein-1 ($W_1$)** y **Kolmogorov–Smirnov ($D_{\text{KS}}$)** con **bootstrap por bloques 2D (IC 95 %)**.
  - **Oportunidad de investigación en Antofagasta (DEM reales, 30 m):** comparamos el CTX DEM de Jezero (NASA MRO, USGS) con ventanas de 6 km de Copernicus GLO-30. La celda poco estudiada **`83b224fffffffff`** (centro 23,05° S, 69,50° W) comparte la distribución de pendientes de Jezero con **$W_1 = 0{,}54^\circ$ (IC 95 %: $0{,}40^\circ$–$0{,}65^\circ$)**, y el resultado se mantiene a 60 y 90 m; el control clásico **Yungay** queda más lejos (**$W_1 = 3{,}32^\circ$**, por su cola de pendientes fuertes). **Qué no se parece:** la celda `83b221fffffffff`, a 4.200–5.270 m, es demasiado abrupta ($W_1 = 6{,}92^\circ$), y `83b225fffffffff` es demasiado plana. Es una **preselección para estudiar en terreno, no una certificación**.
- **1:40–2:30 · Impacto Local, Alfabetización Digital y Caja La Araucana:**
  - Con el módulo **"Tres Mundos en tu Mano"** y lectura por voz integrada (`Web Speech API`), cualquier estudiante, trabajador o adulto mayor comprende qué cambia entre la Tierra, la Luna y Marte (una mochila de 10 kg pesa 1,7 kg en la Luna y 3,8 kg en Marte).
  - Cumplimos directamente los **4 objetivos de Caja La Araucana** y sus **Metas ODS verificadas (`4.3, 4.4, 8, 9.5, 10, 17.3, 17.16, 17.17`)**, conectando a Antofagasta en una red interregional (*Lattice*) de ciencia abierta.
- **2:30–3:00 · Sostenibilidad y Cierre:**
  - Núcleo 100 % Open Source (Apache-2.0) para educación pública + informes exportables `.md` / `.csv` / `.geojson` para universidades, agencias espaciales y robótica minera en Antofagasta.

### Respuestas de 20 Segundos para el Jurado Académico (UCN / UA)
1. **Dr. Sergio Curilef Huichalaf (UCN, Física: sistemas complejos y mecánica estadística) — *"¿Por qué usan Wasserstein-1 y bootstrap por bloques 2D?"***
   - *"Porque dos terrenos pueden compartir pendiente media y tener colas de distribución opuestas. Wasserstein-1 nos da el costo físico de transporte en grados o metros a escala común de 30 m, y el bootstrap por bloques 2D de $10\times 10$ píxeles preserva la autocorrelación espacial del DEM, además de verificar estabilidad multiescala a 30, 60 y 90 m."*
2. **Dr. Jorge Littin Curinao (UCN, Matemáticas: probabilidad y procesos estocásticos) — *"¿Cómo evitan artefactos numéricos en el cálculo de pendientes y cómo definen la incertidumbre?"***
   - *"Proyectamos a escala métrica equivalente de 30 m/px (UTM 19S en la Tierra; en Marte, el CTX DEM ya viene en proyección equirectangular con escala verdadera en la latitud de Jezero, 18,47° N), aplicamos diferencias finitas centrales de segundo orden y recortamos 1 píxel por borde antes de calcular percentiles y distancias $W_1$ y $D_{\text{KS}}$."*
3. **Dr. Alessio Porcelli (Universidad de Antofagasta, Astronomía: astropartículas y rayos cósmicos) — *"¿Cómo tratan la radiación superficial marciana y lunar?"***
   - *"La separamos explícitamente en la Brecha Física Irreducible $B$: en Marte, Curiosity/RAD midió $\sim 0{,}64\text{ mSv/día}$ ($\sim 230\text{ mSv/año}$ de GCR y partículas solares, Hassler et al., 2014). En la Tierra la atmósfera y el campo magnético nos protegen (el fondo natural medio mundial ronda los 2,4 mSv/año, UNSCEAR): por eso Atacama no reproduce la radiación de Marte y lo declaramos como brecha, no como parecido."*
4. **Dr. Wai-Houng Chou Kam (UCN, Ciencias Farmacéuticas: nanomedicina) — *"¿Para qué le sirve esto a las personas?"***
   - *"Delimitamos explícitamente la frontera: Yungay es el control clásico hiperárido para astrobiología y sales endolíticas (Navarro-González et al., 2003), mientras que la celda `83b224fffffffff` se parece a Jezero solo en pendiente a 30 m: sirve para preseleccionar ensayos de movilidad, sin extrapolar habitabilidad biológica. Y las mismas comparaciones se convierten en tarjetas con voz para que cualquier persona aprenda con datos reales."*
