---
name: auditoria-global-ingles-legal-nasa
description: >-
  Audita y genera los requisitos globales de elegibilidad y presentación de NASA Space Apps 2026 y
  NASA Open Science (TOPS / SPD-41a / FAIR): (1) 100 % inglés en página de proyecto, deck de 7 slides
  y subtítulos de video; (2) prototipo de 7 slides listo para demo; (3) verificación de links públicos
  sin login; (4) campo NASA Data con precisión instrumental y DOI; (5) atribución legal de datos,
  código, imágenes, tipografías e íconos; (6) identidad visual de marca propia sin logos prohibidos;
  y (7) declaración de IA y marcas de agua visibles en imágenes/videos.
---

# Skill · Auditoría Global: Inglés, 7 Slides Prototipo, Links, Legal Open Science, Identidad Visual e IA

## Fuentes de verdad en el repositorio
- Paquete oficial en inglés: [`docs/SUBMISSION_PACK_EN.md`](../../../docs/SUBMISSION_PACK_EN.md)
- Deck prototipo de 7 slides en inglés: [`docs/DEMO_7_SLIDES_EN.md`](../../../docs/DEMO_7_SLIDES_EN.md) y [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html)
- Guía de identidad visual y licencias gráficas: [`docs/BRAND_IDENTITY.md`](../../../docs/BRAND_IDENTITY.md)
- Referencias legales y DOIs: [`REFERENCES.md`](../../../REFERENCES.md), [`docs/DATA_PROVENANCE.md`](../../../docs/DATA_PROVENANCE.md), [`CITATION.cff`](../../../CITATION.cff)
- Declaración de IA: [`AI_DISCLOSURE.md`](../../../AI_DISCLOSURE.md)
- Traducción inglesa de la UI: [`frontend/src/i18n/en.json`](../../../frontend/src/i18n/en.json)

---

## Procedimiento de Auditoría Paso a Paso

### Paso 1 · Revisión de Idioma Inglés 100 % (`Puerta Dura G5`)
1. Verifica que [`docs/SUBMISSION_PACK_EN.md`](../../../docs/SUBMISSION_PACK_EN.md) (secciones 1, 2 y 3), [`docs/DEMO_7_SLIDES_EN.md`](../../../docs/DEMO_7_SLIDES_EN.md) y [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html) estén escritos **100 % en inglés**.
2. Ejecuta paridad i18n:
   ```bash
   python3 .claude/skills/ckepi-verify/scripts/check_i18n_parity.py
   ```
3. Inspecciona [`frontend/src/i18n/en.json`](../../../frontend/src/i18n/en.json) para confirmar que no existan valores en español ni placeholders vacíos.
4. Si el equipo presenta video de $\le 30\text{ s}$ con locución en español, verifica que tenga **subtítulos quemados en inglés (`burned-in English subtitles`)** sincronizados con la sección 3 de [`docs/SUBMISSION_PACK_EN.md`](../../../docs/SUBMISSION_PACK_EN.md).

### Paso 2 · Verificación de las 7 Slides de Demo para Prototipo (`Puerta Dura G4`)
El límite estricto de NASA Space Apps cuando se envía presentación en lugar de (o como respaldo a) video es **máximo 7 diapositivas en total, incluyendo portada y diapositiva de créditos**. Verifica que [`docs/DEMO_7_SLIDES_EN.md`](../../../docs/DEMO_7_SLIDES_EN.md) y [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html) cumplan exactamente esta estructura:
- **Slide 1 — Cover & Value Proposition:** Project name (*Ckepi*), tagline, team (*Lattices Team*, Antofagasta, Chile), official challenge (*Comparing the Three Worlds: Earth, Moon, and Mars*), and architectural thesis ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$).
- **Slide 2 — The Problem & Status Quo Failure:** Why "Atacama looks like Mars" is scientifically insufficient (mixing incompatible spatial scales, ignoring the Irreducible Physical Gap $\mathbf{B}$, and relying on single-number black-box averages without uncertainty).
- **Slide 3 — Interactive Prototype Walkthrough (Dual-Mode UI):** Real UI flow showing **Mission Mode** (3D NASA Trek Globes, H3 multi-resolution grid, Causal Matrix, 30 m Distribution Panel) and **Explorer Mode ("Three Worlds in Your Hand")** with mobile-first layout and Web Speech API voice readout.
- **Slide 4 — Core NASA & Partner Open Data Pipeline:** Exact NASA datasets (`MRO CTX DEM` of Jezero as terrain core, `LRO LOLA` & `Diviner`, `MGS MOLA`, `MRO CTX DEM`, `Mars 2020 MEDA`, `MSL RAD`, `NASA POWER`) + partner catalogs (`ESA Copernicus GLO-30`, `Macrostrat`, `Open-Meteo`) mapped to variables $\mathbf{X}$, $\mathbf{Y}$, and $\mathbf{B}$.
- **Slide 5 — Real 30 m Scientific Proof (Jezero Crater $\to$ Antofagasta):** Real DEMs (NASA MRO CTX DEM of Jezero vs. ESA Copernicus GLO-30) at a common 30 m scale, Wasserstein-1 & KS with 2D block bootstrap (95% CI) and 30/60/90 m sensitivity. Positive: cell `83b224fffffffff` $W_1 = 0.54^\circ$ (0.40–0.65). Negative: cell `83b221fffffffff` $W_1 = 6.92^\circ$; classic Yungay $3.32^\circ$. Source: `docs/RESULTADOS_TERRENO_REALES.md`.
- **Slide 6 — Where Earth Analogs Break Down ($\mathbf{B}$) & Territorial Impact:** Explicit physical barriers: Gravity ($0.38\text{ g}$ Mars / $0.166\text{ g}$ Moon vs. $1.00\text{ g}$ Earth), Atmosphere ($0.6\text{ kPa }\text{CO}_2$ Mars / $0\text{ kPa}$ Moon vs. $101.3\text{ kPa}$ Earth), Radiation ($\sim 230\text{ mSv/yr}$ Mars / $\sim 380\text{ mSv/yr}$ Moon vs. $2.4\text{ mSv/yr}$ Earth), and diurnal $\Delta T$. Connects to Antofagasta STEAM literacy & Caja La Araucana / UN SDGs (`4.3, 4.4, 8, 9.5, 10, 17.3, 17.16, 17.17`).
- **Slide 7 — Open Science Legal Credits, Brand & AI Disclosure:** Complete legal citations for NASA/ESA data, MIT open-source code, SIL OFL typography, MIT icons, AI disclosure statement, and public repository/demo URLs (zero NASA logos).

### Paso 3 · Auditoría de Links Públicos sin Login (`Puerta Dura G6`)
1. Extrae todas las URLs de los documentos de entrega:
   ```bash
   rg -o 'https?://[^\s\)\]\">]+' README.md docs/SUBMISSION_PACK_EN.md docs/DEMO_7_SLIDES_EN.md REFERENCES.md
   ```
2. Verifica que:
   - El repositorio GitHub (`https://github.com/AnGeMoNs/Ckepi`) sea público.
   - Ningún link apunte a `localhost` como único entregable sin explicar el despliegue o prototipo estático autocontenido.
   - Ningún enlace de Google Drive, Figma, Canva, Notion o YouTube esté en modo privado o requiera cuenta para abrirse en ventana de incógnito.

### Paso 4 · Campo `NASA Data` con Precisión Instrumental (`Puerta Dura G8`)
Comprueba que el listado para pegar en el formulario oficial de NASA Space Apps contenga el nombre exacto de la misión, instrumento, ID del producto y DOI/URL oficial:
1. **NASA MRO CTX / USGS — `Mars 2020 TRN CTX DEM Mosaic, Jezero (20 m)`** (core terrain input). *NASADEM is not used in this build.*
2. **NASA Lunar Reconnaissance Orbiter (LRO) — `LOLA GDR` & `Diviner Lunar Radiometer GDR`** (PDS Geosciences Node, DOI: `10.1007/s11214-010-9634-2` / `10.1007/s11214-010-9635-1`).
3. **NASA Mars Global Surveyor (MGS) — `MOLA MEGDR`** (PDS Geosciences Node, DOI: `10.1029/2000JE001426`).
4. **NASA Mars Reconnaissance Orbiter (MRO) / USGS — `Mars 2020 Terrain Relative Navigation CTX DEM (20 m/px)`** (USGS Astrogeology Annex, Jezero Crater).
5. **NASA Mars 2020 Perseverance `MEDA` & MSL Curiosity `REMS` / `RAD`** (PDS Atmospheres Node, DOI: `10.1007/s11214-021-00804-9` & `10.1126/science.1244797`).
6. **NASA Langley Research Center — `NASA POWER API v2.5` (CERES / MERRA-2 Agroclimatology & Solar Irradiance)** (`https://power.larc.nasa.gov/`).
7. **NASA Solar System Treks (`Moon Trek` & `Mars Trek` WMTS / 3D Globes)** (NASA SSERVI / JPL).
8. **NASA NSSDCA Planetary Fact Sheet (Metric)** (Williams, D. R., NASA GSFC, 2024).

### Paso 5 · Atribución Legal Open Science (`SPD-41a` / `FAIR` — `Puerta Dura G9`)
Toda fuente externa debe estar legalmente citada por categoría en [`REFERENCES.md`](../../../REFERENCES.md) y [`docs/BRAND_IDENTITY.md`](../../../docs/BRAND_IDENTITY.md):

| Categoría | Recurso utilizado en Ckepi | Licencia Legal | Cómo citar correctamente (Open Science) |
|---|---|---|---|
| **Datos NASA / USGS** | NASADEM, LOLA, Diviner, MOLA, CTX DEM, MEDA, RAD, POWER, Trek, NSSDCA | **U.S. Federal Public Domain** (`17 U.S.C. § 105`, NASA SPD-41a) | *"Courtesy of NASA/JPL-Caltech/GSFC/ASU/USGS. Data retrieved from NASA PDS / LP DAAC / LaRC POWER (Public Domain)."* + DOI exacto |
| **Datos Agencias Socias / Abiertos** | ESA Copernicus DEM GLO-30, Open-Meteo ERA5-Land, Macrostrat API v2 | **Copernicus Open License / CC BY 4.0** | *"Contains modified Copernicus DEM data (2023), ESA (CC BY 4.0); Historical weather via Open-Meteo ERA5-Land (CC BY 4.0); Lithology via Macrostrat (CC BY 4.0)."* |
| **Código Fuente Propio** | Motor causal `backend/` y UI `frontend/` de Ckepi | **Apache License 2.0** (OSI-Approved, ver [`LICENSE`](../../../LICENSE)) | *"Copyright (c) 2026 Lattices Team (Ckepi). Released under the MIT Open Source License."* |
| **Librerías de Software** | FastAPI, DuckDB, NumPy, SciPy, scikit-learn, H3 (`Apache-2.0`), React, Vite, Tailwind CSS, MapLibre GL JS (`BSD-3-Clause`) | **MIT / BSD-3-Clause / Apache-2.0** (100 % OSI compatibles) | Declaradas en `backend/pyproject.toml`, `frontend/package.json` y `REFERENCES.md` §6 |
| **Imágenes y Teselas de Mapas** | Teselas WMTS NASA Moon/Mars Trek, bajorrelieves CARTO / OpenStreetMap | **Public Domain (NASA)** / **ODbL & CC BY-SA (OSM/CARTO)** | En el pie del lienzo cartográfico: *"© OpenStreetMap contributors © CARTO | Planetary tiles: NASA/JPL-Caltech/ASU"* |
| **Tipografías (Fonts)** | `Space Grotesk` (titulares), `Inter` (cuerpo UI), `JetBrains Mono` (telemetría/ecuaciones) | **SIL Open Font License 1.1 (OFL-1.1)** | Citadas en [`docs/BRAND_IDENTITY.md`](../../../docs/BRAND_IDENTITY.md) y `REFERENCES.md` |
| **Iconografía y Diagramas** | `Lucide Icons` (`lucide-react`), Diagramas SVG propios ([`MAPA_SOFTWARE_PIZARRA.svg`](../../../docs/MAPA_SOFTWARE_PIZARRA.svg), [`MAPA_SOFTWARE.svg`](../../../docs/MAPA_SOFTWARE.svg)) | **ISC / MIT License** (Lucide) + **CC BY 4.0** (diagramas del equipo) | Citados en [`docs/BRAND_IDENTITY.md`](../../../docs/BRAND_IDENTITY.md) |

### Paso 6 · Identidad Visual de Marca y Prohibición de Logos (`docs/BRAND_IDENTITY.md`)
1. Verifica que [`docs/BRAND_IDENTITY.md`](../../../docs/BRAND_IDENTITY.md) defina la paleta semántica de Ckepi:
   - **Fondo Cósmico OLED:** `#05070D` (`slate-950`)
   - **Tierra / Atacama (Cobre & Salar):** `#38BDF8` (`sky-400`) y `#10B981` (`emerald-500`)
   - **Luna (Regolito Anortosítico & Cian Polar):** `#94A3B8` (`slate-400`) y `#22D3EE` (`cyan-400`)
   - **Marte (Óxido Férrico & Ocre Jezero):** `#F97316` (`orange-500`) y `#F59E0B` (`amber-500`)
   - **Alerta de Ruptura Física ($\mathbf{B} / R_{\text{break}} \ge 0.60$):** `#F43F5E` (`rose-500`)
2. **Regla estricta de logotipos (`G11`):**
   - **PROHIBIDO** usar el logotipo oficial de NASA (*Meatball* o *Worm*) o sellos de agencias en la interfaz, README, slides o videos (NASA Media Usage Guidelines).
   - **PROHIBIDO** usar logotipos de Caja La Araucana, UCN, UA o Nómada sin permiso escrito explícito; el reconocimiento institucional se hace mediante **créditos en texto claro**.

### Paso 7 · Declaración de IA y Marcas de Agua (`Puerta Dura G11` — `AI_DISCLOSURE.md`)
1. Verifica que [`AI_DISCLOSURE.md`](../../../AI_DISCLOSURE.md) esté actualizado y declare:
   - Que la hipótesis científica ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$), selección de métricas ($W_1, D_{\text{KS}}$, bootstrap por bloques 2D) y arquitectura son **100 % autoría intelectual humana del equipo Lattices Team**.
   - Qué agentes/modelos de IA se usaron como asistentes de programación, traducción y auditoría documental.
2. **Política sobre imágenes y videos generados por IA:**
   - En Ckepi, **todas las visualizaciones científicas, mapas H3, curvas de distribución y diagramas SVG son generados determinísticamente por código a partir de datos reales (0 imágenes sintéticas generadas por IA difusiva)**.
   - Si el equipo llegara a incluir cualquier ilustración o clip de video generado por IA en el reel promocional, **DEBE llevar una marca de agua visible permanente (`"AI-Generated Visual"`)** en la esquina, declararse en `AI_DISCLOSURE.md`, y **NO contener ningún logo, insignia ni bandera de NASA**.
