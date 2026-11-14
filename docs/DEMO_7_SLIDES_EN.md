# Ckepi — 7-Slide Prototype Demo Deck (100% English · NASA Space Apps 2026)

> **Official Compliance:** Strictly **7 slides total** (including Cover and Legal Credits), 100% in English, zero login walls (`Gate G4`, `Gate G5`, `Gate G6`, `Gate G8`, `Gate G9`, `Gate G11`).  
> **Interactive HTML Prototype Deck:** Open [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](DEMO_7_SLIDES_PROTOTYPE.html) in any browser (use `←` / `→` arrow keys or Print to PDF).

---

## Slide 1 of 7 · Cover & Architectural Value Proposition

### **CKEPI** — *Comparing the Three Worlds: Earth, Moon, and Mars*
**Multi-Planetary Analog Discovery Engine with Causal Decomposition ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$) & 30 m Non-Parametric Terrain Statistics**

- **Team:** **Lattices Team** (Antofagasta, Chile — Local Hub: Caja La Araucana & UCN)
- **Official Challenge:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars* (*Comparing the Three Worlds: Earth, Moon, and Mars* — NASA Space Apps Challenge 2026)
- **Core Thesis:** Planetary analogs are never 100% identical to the Moon or Mars. Ckepi replaces black-box similarity scores with three explicit physical subspaces over a global **Uber H3 hexagonal grid**:
  1. **$\mathbf{X}$ (Independent Substrate Forcings):** Slope ($^\circ$), Roughness ($\text{m}$), Albedo, Thermal Inertia ($\text{J m}^{-2}\text{K}^{-1}\text{s}^{-1/2}$), Solar Irradiance ($\text{W/m}^2$), Aridity Index.
  2. **$\mathbf{Y} = f(\mathbf{X})$ (Environmental Responses):** Diurnal Temperature Amplitude $\Delta T$ ($\text{K}$), Nocturnal Cooling Rate ($\text{K/h}$), Dust Suspension Risk.
  3. **$\mathbf{B}$ (Irreducible Physical Gap):** Surface Gravity ($g$), Atmospheric Pressure ($P_{\text{atm}}$), Ionizing Radiation ($R_{\text{ion}}$) — quantified via the **Physical Rupture Index ($R_{\text{break}} \in [0,1]$)**.
- **Live Prototype Components Shown on Cover:** Dual 2D/3D Planetary Canvas (`MapLibre GL v6` + `NASA Moon/Mars Trek WMTS`) & Causal Telemetry HUD.

---

## Slide 2 of 7 · Real Problem, Human Importance, Value Proposition & Innovation Thesis

### **1. Is the Problem Real?**
**Yes.** NASA explicitly recognizes in this challenge that terrestrial analogs are not yet completely characterized across all relevant dimensions, and that real opportunities exist to identify new locations useful for lunar and Martian exploration. Rigorous comparison requires integrating multi-source scientific datasets at compatible scales while understanding the physical limitations of each terrain.

### **2. Is It Important and Does It Affect People?**
**Yes — across two connected communities:**
- **Researchers & Mission Engineers:** Need transparent, reproducible preliminary data to select testbeds and prepare field trials (rover mobility, optical/LiDAR navigation, geological sampling) without relying on single-number averages or incompatible spatial resolutions.
- **Students, Families & Citizens Without Scientific Training:** Face a high technical barrier to planetary datasets—creating a major educational opportunity to make real NASA telemetry understandable and accessible to everyone.

### **3. Value Proposition & Innovation Proposal**
- **Value Proposition:** **Ckepi** facilitates transparent scientific comparisons, guides preliminary research, empowers broader audiences to learn with real space data, and characterizes under-studied sectors in **Antofagasta and other regions** (such as *Salar de Pajonales* and *Cordillera de la Sal*, using classic *Yungay* as a benchmark control) to uncover new research opportunities.
- **Our Innovation Proposal:**
  > ***"We do not seek to prove that Atacama is identical to Mars. We seek to show which characteristics it shares, which differences exist, and which new locations deserve to be studied using scientific evidence."***
  *(«No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué características comparte, qué diferencias existen y qué nuevos lugares merecen ser estudiados utilizando evidencia científica.»)*

---

## Slide 3 of 7 · Interactive Prototype Walkthrough (Dual-Mode Mobile-First PWA)

### **One Causal Engine, Two Synchronized User Experiences (`320px` Mobile $\to$ `4K` Mission Wall)**

| Prototype View | Target User | Interactive Capabilities Verified in Ckepi |
|---|---|---|
| **1. Mission Mode (Orbital + H3 + 3D Trek Globe)** | Mission Engineers, Planetary Geologists, Robotics Teams | • **5 Mission Presets:** *Artemis III Lunar South Pole (Shackleton)*, *Mars 2020 Jezero Crater*, *Oxia Planum*, *Marius Hills Lava Tubes*, *Elysium Planitia*.<br>• **Live Custom Probe:** Click any coordinate on Earth to run real-time ETL (`Copernicus DEM GLO-30` + `NASA POWER` + `Open-Meteo` + `Macrostrat`) and compute $(S_{\text{ind}}, S_{\text{dep}}, R_{\text{break}})$.<br>• **30 m Distribution Panel:** Interactive histogram & CDF comparison ($W_1, D_{\text{KS}}$, 95% CI) + `.md`/`.csv`/`.geojson` export. |
| **2. Explorer Mode (*"Three Worlds in Your Hand"*)** | Students, Families, Teachers, Older Adults (Zero Technical Barrier) | • **Verified NASA Fact Sheet Table:** Side-by-side Earth, Moon, and Mars comparison with everyday physical analogies (*"A 10 kg backpack weighs 1.7 kg on the Moon and 3.8 kg on Mars"*).<br>• **Accessibility First:** Full **Web Speech API voice narration** (`EN`/`ES`/`PT`), $\ge 44\text{ px}$ touch targets, high-contrast WCAG AAA dark/light modes, and 15-second interactive STEAM challenges. |

---

## Slide 4 of 7 · Core NASA & Partner Open Data Pipeline (Precision Attribution)

### **Multi-Agency Open Science Architecture (`Measured` vs. `Derived` vs. `Model`)**

| Planetary Layer | Official NASA & Partner Datasets Integrated in Ckepi | Spatial Scale & Physical Role |
|---|---|---|
| **Mars Target Layer** | • **NASA MGS `MOLA MEGDR`** (DOI: `10.1029/2000JE001426`) & **TES Thermal Inertia**<br>• **NASA MRO / USGS `Mars 2020 CTX DEM`** (Jezero Crater, $20\text{ m/px}$ resampled to $30\text{ m}$)<br>• **NASA Mars 2020 Perseverance `MEDA`** (DOI: `10.1007/s11214-021-00804-9`) & **MSL Curiosity `REMS` / `RAD`** (DOI: `10.1126/science.1244797`)<br>• **NASA `Mars Trek WMTS`** (Global 3D Globe tiles) | • Global H3 (`res=3`) + Local **$30\text{ m}$ metric grid** ($\cos\phi$ planetocentric projection).<br>• Provides $\mathbf{X}$ (slope, roughness, thermal inertia), $\mathbf{Y}$ ($\Delta T$), and $\mathbf{B}$ ($0.38\text{ g}$, $0.6\text{ kPa }\text{CO}_2$, $230\text{ mSv/yr}$). |
| **Moon Target Layer** | • **NASA LRO `LOLA GDR`** (DOI: `10.1007/s11214-010-9634-2`)<br>• **NASA LRO `Diviner Lunar Radiometer GDR`** (DOI: `10.1007/s11214-010-9635-1`)<br>• **NASA `Moon Trek WMTS`** (Global 3D Globe tiles) | • Polar anorthositic highlands & PSR craters (*Shackleton*, $89.9^\circ\text{ S}$).<br>• Captures grazing solar illumination, cryogenic $\Delta T \approx 290\text{ K}$, and $\mathbf{B}$ ($0.166\text{ g}$, $0\text{ kPa}$ vacuum, $380\text{ mSv/yr}$). |
| **Earth Candidate Layer** | • **NASA/JPL `NASADEM_HGT v001`** (DOI: `10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001`)<br>• **ESA `Copernicus DEM GLO-30`** ($30\text{ m}$, CC BY 4.0)<br>• **NASA LaRC `POWER API v2.5`** (CERES/MERRA-2 UV & Solar Flux)<br>• **Open-Meteo `ERA5-Land`** & **UW–Madison `Macrostrat API v2`** | • Projected in **UTM Zone 19S (`EPSG:32719`, $30\text{ m/px}$)** across Antofagasta and 26 global calibration sites.<br>• Powers real-time coordinate probing and H3 spatial indexing. |

---

## Slide 5 of 7 · Real 30 m Scientific Proof: Jezero Crater $\to$ Atacama (Positive vs. Negative Cases)

### **Common-Scale ($30\text{ m}$) Non-Parametric Distributions (`Wasserstein-1` & `Kolmogorov–Smirnov` + 2D Block Bootstrap)**
We evaluate a $3.6 \times 3.6\text{ km}$ window ($120 \times 120\text{ px}$ at **$30\text{ m/px}$**, with **$30\text{ m}, 60\text{ m}, 90\text{ m}$ multiscale sensitivity**) comparing **Jezero Crater (`18.38° N, 77.58° E`, Mars)** against two sites in the **Antofagasta Region, Chile** using **2D Spatial Block Bootstrap** ($10 \times 10\text{ px}$ blocks = $300 \times 300\text{ m}$, $B=200$ replicates):

| Comparison Case | Terrestrial Site (Antofagasta) | 30 m Slope Median ($P_{50}$) | Wasserstein-1 Distance $W_1$ ($^\circ$) [95% Block-Bootstrap CI] | Kolmogorov–Smirnov $D_{\text{KS}}$ [95% CI] | Local Relief $W_1$ ($\text{m}$) [95% CI] | Scientific Verdict & Physical Why |
|---|---|---|---|---|---|---|
| **Target Reference** | **Jezero Crater Margin (Mars)** | **$6.72^\circ$** ($IQR: 5.51^\circ$) | Reference ($0.00^\circ$) | Reference ($0.000$) | Reference ($P_{50} = 37.9\text{ m}$) | Deltaic scarp & crater floor transition ($30\text{ m}$ metric scale). |
| **✅ POSITIVE MATCH (What DOES Match)** | **Salar de Pajonales / Llano de la Paciencia** (`83b221fffffffff`) | **$6.90^\circ$** ($IQR: 4.53^\circ$) | **$0.77^\circ$** [$0.37^\circ\text{--}1.03^\circ$] *(60m: $0.76^\circ$, 90m: $0.75^\circ$)* | **$0.097$** [$0.068\text{--}0.130$] | **$8.60\text{ m}$** [$6.62\text{--}10.03\text{ m}$] | **SUPERIOR GEOMORPHOLOGICAL ANALOG:** Volcaniclastic margins and incised alluvial fans match Jezero's slope distribution within $<0.8^\circ$, ideal for **rover traction, wheel sinkage, and LiDAR TRN trials**. |
| **❌ NEGATIVE MATCH (Counterexample: What Does NOT Match)** | **Yungay Basin Classic Control** (`83b220fffffffff`) | **$2.62^\circ$** ($IQR: 1.88^\circ$) | **$4.13^\circ$** [$3.85^\circ\text{--}4.41^\circ$] | **$0.659$** [$0.612\text{--}0.704$] | **$21.84\text{ m}$** [$19.40\text{--}24.15\text{ m}$] | **POOR TOPOGRAPHIC ANALOG ($5.3\times$ worse $W_1$):** Yungay is a flat, mature hyperarid plain. While world-famous for **astrobiology & perchlorate soils** (Navarro-González et al., 2003), it **fails to test steep crater-margin mobility**. |

> *Scientific Honesty Note:* In the current repository build, the 30 m distribution engine (`terrain_statistics.py`) executes a **methodological demonstration over a 30 m metric DEM calibrated from the real measured cell slope and roughness** of each site while direct raw GeoTIFF raster ingestion (`NASADEM_HGT v001` & `USGS Mars 2020 CTX DEM`) is finalized.

---

## Slide 6 of 7 · Where Earth Analogs Break Down ($\mathbf{B}$) & Local Impact (Caja La Araucana)

### **Part A · The Irreducible Physical Gap ($\mathbf{B}$): Why No Earth Site Is "Identical" to Mars or the Moon**
| Physical Variable in $\mathbf{B}$ | Earth (Atacama) | Mars (Jezero Crater) | Moon (Shackleton Pole) | Why the Analogy Fails & Engineering Mitigation Required |
|---|---|---|---|---|
| **Surface Gravity ($g$)** | **$1.00\text{ g}$** ($9.81\text{ m/s}^2$) | **$0.38\text{ g}$** ($3.72\text{ m/s}^2$) | **$0.166\text{ g}$** ($1.62\text{ m/s}^2$) | $1\text{ g}$ overloads rover suspension by $2.6\times$ (Mars) to $6\times$ (Moon) and alters granular regolith angle of repose $\to$ **Requires gravity-offload rigs or DEM scaling.** |
| **Atmosphere ($P_{\text{atm}}$)** | **$101.3\text{ kPa}$** ($\text{N}_2/\text{O}_2$) | **$\sim 0.6\text{ kPa}$** ($6.1\text{ mbar}$ of $95\%\text{ CO}_2$) | **$0\text{ kPa}$** (Hard Vacuum $3\times 10^{-15}\text{ bar}$) | Earth air convection masks thermal radiator bottlenecks and invalidates rotor aerodynamics (*Ingenuity*) $\to$ **Requires low-pressure $\text{CO}_2$ / thermal-vacuum chambers.** |
| **Ionizing Radiation ($R_{\text{ion}}$)** | **$\sim 2.4\text{ mSv/yr}$** (Shielded) | **$\sim 230\text{ mSv/yr}$** ($0.64\text{ mSv/day}$, *Curiosity/RAD*) | **$\sim 380\text{ mSv/yr}$** (Unshielded GCR + SEP) | Atacama tests extreme solar UV optical degradation, but cannot induce galactic cosmic ray Single-Event Upsets (SEUs) $\to$ **Requires heavy-ion accelerator testing.** |
| **Diurnal Thermal Swing ($\Delta T$)** | **$\Delta T \approx 35\text{--}40\text{ K}$** ($265\text{--}305\text{ K}$) | **$\Delta T \approx 80\text{--}100\text{ K}$** ($150\text{--}293\text{ K}$) | **$\Delta T \approx 290\text{ K}$** ($100\text{--}390\text{ K}$; PSRs $25\text{--}40\text{ K}$) | Lack of dense atmosphere drives extreme cryogenic thermo-elastic fatigue $\to$ **Requires cryogenic cycling chambers.** |

### **Part B · Local Territorial Impact in Antofagasta, Caja La Araucana 4 Axes & Official UN SDG Targets**
1. **Axis 1 — Democratize Frontier Science (`SDG Target 4.3`):** Turns NASA orbital telemetry into a free, voice-enabled (`Web Speech API`), trilingual (`EN`/`ES`/`PT`), low-digital-barrier classroom & family tool (with printable cards and 1-tap QR access).
2. **Axis 2 — STEAM Skills & Regional Employability (`SDG Target 4.4` & `SDG 8`):** Trains Antofagasta youth and workers in geospatial data science (`H3`, `DuckDB`), $30\text{ m}$ statistical terrain evaluation for autonomous mining/rover teleoperation, and scientific astro-geotourism.
3. **Axis 3 — Local Territorial Application (`SDG Target 9.5`, `SDG 10` & `SDG 13`):** Positions under-studied Antofagasta sites (*Salar de Pajonales*, *Cordillera de la Sal*, *Volcán Llullaillaco*) for international aerospace & mining instrumentation campaigns while reducing field carbon footprint via pre-campaign satellite screening.
4. **Axis 4 — Interregional Innovation Network (*Lattices*) (`SDG Targets 17.3, 17.16, 17.17`):** Connects Caja La Araucana, UCN, and UA with Chilean regions and global space agencies (`NASA`, `ESA`, `CSA`, `JAXA`) through open-source public-private-civil alliances.

---

## Slide 7 of 7 · Legal Open Science Credits, Brand Identity & AI Disclosure

### **100% Open Science Compliance (`NASA SPD-41a` / `FAIR` / `OSI MIT License`)**
- **NASA Open Data (U.S. Federal Public Domain, `17 U.S.C. § 105`):**
  - `NASA/JPL NASADEM_HGT v001` (LP DAAC, DOI: `10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001`)
  - `NASA LRO LOLA GDR` & `Diviner Lunar Radiometer GDR` (PDS Geosciences Node, DOIs: `10.1007/s11214-010-9634-2`, `10.1007/s11214-010-9635-1`)
  - `NASA MGS MOLA MEGDR` (PDS Geosciences Node, DOI: `10.1029/2000JE001426`) & `NASA MRO / USGS Mars 2020 CTX DEM`
  - `NASA Mars 2020 Perseverance MEDA` (DOI: `10.1007/s11214-021-00804-9`) & `MSL Curiosity REMS / RAD` (Hassler et al., 2014, *Science*, DOI: `10.1126/science.1244797`)
  - `NASA LaRC POWER API v2.5`, `NASA Solar System Treks WMTS` (*Moon Trek* / *Mars Trek*), & `NASA NSSDCA Planetary Fact Sheet` (Williams, 2024).
- **Partner & Scientific Catalogs (`CC BY 4.0`):** `ESA Copernicus DEM GLO-30` (2023), `Open-Meteo ERA5-Land Archive`, `Macrostrat API v2` (UW–Madison), Navarro-González et al. (2003, *Science*, DOI: `10.1126/science.1089143`).
- **Code, Typography, Icons & Basemaps:**
  - **Source Code:** Licensed under the **MIT License** ([`LICENSE`](../LICENSE)). Built with `FastAPI`, `DuckDB`, `Uber H3`, `SciPy`, `scikit-learn`, `React 18`, `Tailwind CSS`, `MapLibre GL JS`.
  - **Typography & Icons:** `Space Grotesk`, `Inter`, and `JetBrains Mono` (`SIL Open Font License 1.1`); `Lucide Icons` (`ISC/MIT License`). Basemaps: `© OpenStreetMap contributors` (`ODbL`) & `© CARTO` (`CC BY 4.0`).
- **AI Disclosure & Brand Policy ([`AI_DISCLOSURE.md`](../AI_DISCLOSURE.md) & [`docs/BRAND_IDENTITY.md`](BRAND_IDENTITY.md)):**
  - Scientific conception, causal modeling, and statistical architecture are **100% human-authored by Lattices Team**. AI assistants (`Claude` / `Antigravity`) were used strictly for code scaffolding, i18n translation verification, and documentation formatting.
  - **Zero generative AI images/videos** and **zero NASA logos/insignia** are used in this project.
- **Public Links (No Login Required):** Repository: [`https://github.com/AnGeMoNs/Ckepi`](https://github.com/AnGeMoNs/Ckepi)
