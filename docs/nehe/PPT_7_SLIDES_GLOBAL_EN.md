# Ckepi — Official 7-Slide Prototype & Pitch Deck (100% English · Synchronized with Real 30 m DEM Data)

> **NASA Space Apps Challenge 2026 — Global & Local Judging Deck**  
> **Strict Rule (`Gate G4` & `Gate G5`):** Maximum **7 slides total** (including Cover and Legal Credits), **100% in English**, **zero NASA logos**.  
> **Interactive HTML Version:** [`docs/nehe/PPT_7_SLIDES_PROTOTYPE.html`](PPT_7_SLIDES_PROTOTYPE.html)

---

## SLIDE 1 OF 7 · Cover & Architectural Value Proposition

### **CKEPI** — *Comparing the Three Worlds: Earth, Moon, and Mars*
**Multi-Planetary Analog Discovery Engine with Causal Decomposition ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$) & Real 30 m Common-Scale Terrain Statistics**

- **Team:** **Lattices Team** (Antofagasta, Chile — Local Hub: Caja La Araucana & Universidad Católica del Norte)
- **Official Challenge:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*
- **Our Innovation Proposal:**
  > *"We do not seek to prove that Atacama is identical to Mars. We seek to show which characteristics it shares, which differences exist, and which new locations deserve to be studied using scientific evidence."*
- **Three-Subspace Causal Architecture over a Global Uber H3 Grid:**
  1. **$\mathbf{X}$ (Independent Substrate Forcings):** Slope ($^\circ$), Local Relief ($\text{m}$), Roughness, Albedo, Thermal Inertia ($\text{J m}^{-2}\text{K}^{-1}\text{s}^{-1/2}$), Solar Irradiance ($\text{W/m}^2$).
  2. **$\mathbf{Y} = f(\mathbf{X})$ (Environmental Responses):** Diurnal Temperature Swing $\Delta T$ ($\text{K}$), Nocturnal Cooling Rate ($\text{K/h}$), Aeolian Dust Suspension Risk.
  3. **$\mathbf{B}$ (Irreducible Physical Gap):** Surface Gravity ($g$), Atmospheric Pressure ($P_{\text{atm}}$), and Ionizing Radiation ($R_{\text{ion}}$) — quantified via the **Physical Rupture Index ($R_{\text{break}} \in [0,1]$)**.

---

## SLIDE 2 OF 7 · Real Problem, Human Importance & Value Proposition

### **Why Transparent Multi-Scale Analog Discovery Matters**

| Dimension | Grounded Scientific & Social Reality |
|---|---|
| **1. Is the Problem Real?** | **Yes.** NASA explicitly recognizes that terrestrial analogs are not yet completely characterized across all relevant physical dimensions, and that real opportunities exist to identify new locations useful for Moon and Mars exploration by integrating scientific datasets and understanding each terrain's limitations. |
| **2. Is It Important & Does It Affect People?** | **Yes — across two connected groups:**<br>• **Researchers & Mission Engineers:** Need transparent, reproducible preliminary evidence to prepare field trials without relying on single-number averages or incompatible spatial scales.<br>• **Students, Families & Citizens Without Scientific Training:** Face a high technical barrier to planetary datasets—creating a major educational opportunity to make real space data understandable and accessible. |
| **3. Ckepi's Value Proposition** | **Ckepi** facilitates transparent scientific comparisons, guides preliminary research (**pre-selecting sites for field study rather than certifying operational safety**), empowers everyone to learn with space data, and characterizes **under-studied sectors of Antofagasta and other regions** to uncover new research opportunities. |

---

## SLIDE 3 OF 7 · Interactive Prototype Walkthrough (Dual-Mode Mobile-First App)

### **One Open-Science Engine, Two Synchronized User Experiences (`320px` Mobile $\to$ `4K` Desktop)**

1. **Mission Mode (For Researchers, Geologists & Robotics Engineers):**
   - **Synchronized 2D/3D Planetary Canvas:** Global Earth H3 hexagonal grid (`res=2` to `res=5` with live 7-child subdivision) paired with interactive **NASA Moon Trek & Mars Trek WMTS 3D Globes**.
   - **Real-Time Coordinate Probe:** Click any point on Earth to query live satellite/climate ETL (`Copernicus DEM`, `NASA POWER Climatology`, `Open-Meteo ERA5-Land`, `ISRIC SoilGrids`, `Macrostrat`) and compute $(S_{\text{ind}}, S_{\text{dep}}, R_{\text{break}})$.
   - **Real 30 m Terrain Distribution Panel:** Displays empirical histograms, CDFs, **Wasserstein-1 ($W_1$)**, **Kolmogorov–Smirnov ($D_{\text{KS}}$)**, **2D Block-Bootstrap 95% CIs**, and **30 m / 60 m / 90 m sensitivity tables**, with 1-click export to `.md`, `.csv`, and `.geojson`.
2. **Explorer Mode — *"Three Worlds in Your Hand"* (For Low Digital Literacy, Classrooms & Families):**
   - **3 Progressive Learning Levels:** *1. Look (Image + Phrase + Voice) $\to$ 2. Compare (Earth · Moon · Mars Side-by-Side) $\to$ 3. Investigate (Real 30 m Slopes & Sources)*.
   - **Full Accessibility:** Built-in **Web Speech API voice readout** (`EN` / `ES` / `PT`), everyday physical analogies (*"A 10 kg backpack feels like 1.7 kg on the Moon and 3.8 kg on Mars"*), $\ge 44\text{ px}$ touch targets, WCAG AA/AAA contrast, and printable cards.

---

## SLIDE 4 OF 7 · Core NASA & Partner Open Data Pipeline (Precision Attribution)

### **Multi-Agency Open Science Provenance (`Measured` vs. `Derived` vs. `Model`)**

| Planetary Layer | Official NASA & Partner Datasets Integrated in Ckepi | Spatial Scale & Physical Role |
|---|---|---|
| **Mars Target Layer** | • **NASA MRO CTX / USGS `Mars 2020 TRN CTX DEM Mosaic, Jezero Crater (20 m/px)`** *(core input of the 30 m terrain comparison, public domain)*<br>• **NASA Mars 2020 Perseverance `MEDA`** (`10.1007/s11214-021-00804-9`) & **MSL Curiosity `REMS` / `RAD`** (`10.1126/science.1244797`)<br>• **NASA MGS `MOLA MEGDR`** (`10.1029/2000JE001426`) & **NASA `Mars Trek WMTS`** | • Jezero Crater DEM in Equirectangular projection with true scale at $18.47^\circ\text{ N}$, area-averaged to **$30\text{ m/px}$** ($6\times 6\text{ km}$ window = $200\times 200\text{ px}$).<br>• Supplies $\mathbf{X}$, $\mathbf{Y}$ ($\Delta T$), and $\mathbf{B}$ ($0.38\text{ g}$, $0.6\text{ kPa }\text{CO}_2$, $230\text{ mSv/yr}$). |
| **Moon Target Layer** | • **NASA LRO `LOLA GDR`** (`10.1007/s11214-010-9634-2`) & **`Diviner Lunar Radiometer GDR`** (`10.1007/s11214-010-9635-1`)<br>• **NASA `Moon Trek WMTS`** & **NSSDCA Planetary Fact Sheet** (Williams, 2024) | • Characterizes South Pole anorthositic highlands (*Shackleton Crater*, $89.9^\circ\text{ S}$), grazing solar illumination, $\Delta T \approx 290\text{ K}$, and $\mathbf{B}$ ($0.166\text{ g}$, $0\text{ kPa}$ vacuum, $380\text{ mSv/yr}$). |
| **Earth Candidate Layer** | • **ESA `Copernicus DEM GLO-30`** (1 arcsec DSM, AWS Open Data, reprojected to **UTM Zone 19S `EPSG:32719` at $30\text{ m/px}$**)<br>• **NASA LaRC `POWER API v2.5`** (20+ yr Climatology Solar & UV Flux)<br>• **Open-Meteo `ERA5-Land`**, **`ISRIC SoilGrids v2.0`** & **`Macrostrat API v2`** | • Real $6\times 6\text{ km}$ ($200\times 200\text{ px}$) metric windows in Antofagasta recorded with SHA-256 hashes in `terrain_windows_30m.json`. Any non-precomputed pair is explicitly flagged `SYNTHETIC — not a measurement`. |

---

## SLIDE 5 OF 7 · Real 30 m Scientific Proof: Jezero Crater $\to$ Antofagasta (Positive vs. Negative Cases)

### **Real DEM Comparison at Common $30\text{ m}$ Scale (`NASA MRO CTX DEM` vs. `ESA Copernicus GLO-30`, $6\times 6\text{ km}$ Windows)**
We compute central finite-difference **Slope ($^\circ$)** (1-pixel border trim) and **$300\times 300\text{ m}$ Local Relief ($\text{m}$)**, comparing full empirical distributions via **Wasserstein-1 ($W_1$)** and **2-sample Kolmogorov–Smirnov ($D_{\text{KS}}$)** with **2D Spatial Block Bootstrap** ($10\times 10\text{ px}$ blocks, 95% CI) across **30 m, 60 m, and 90 m**:

| Case Type | Window / H3 Cell (`res=3`) & Center | Elevation Range ($\text{m}$) | 30 m Slope Median $P_{50}$ ($^\circ$) | Slope $W_1$ ($^\circ$) [95% Block-Bootstrap CI] | Slope $D_{\text{KS}}$ | Local Relief $W_1$ ($\text{m}$) | Scientific Verdict & Physical Why |
|---|---|---|---|---|---|---|---|
| **Planetary Target** | **Jezero Crater, Mars** (`18.38° N, 77.58° E`, NASA MRO CTX DEM) | $-2,674$ to $-2,599\text{ m}$ | **$1.70^\circ$** ($P_{90} = 4.0^\circ$) | Reference ($0.00^\circ$) | Reference ($0.00$) | Reference | Real 20 m CTX DEM area-averaged to **30 m/px** ($200\times 200\text{ px}$). |
| **✅ POSITIVE MATCH (What DOES Match)** | **Antofagasta Cell `83b224fffffffff`** (`-23.052° S, -69.497° W`) | $1,408$ to $1,538\text{ m}$ | **$1.37^\circ$** | **$0.54^\circ$** [$0.40^\circ\text{--}0.65^\circ$] *(Holds at 60 m & 90 m)* | **$0.15$** | **$1.8\text{ m}$** | **CLOSEST REAL 30 m MATCH:** Reproduces Jezero's slope and relief distribution closer than classic Yungay—pre-selected for **preliminary rover mobility field study**. |
| **⚠️ CLASSIC BENCHMARK** | **Control Yungay** (`-24.08° S, -69.91° W`) | $957$ to $1,280\text{ m}$ | — ($P_{90} = 15.1^\circ$) | **$3.32^\circ$** | — | — | **HEAVIER STEEP TAIL:** World benchmark for hyperarid astrobiology (Navarro-González et al., 2003), but its 6 km window has a steeper tail ($P_{90}=15.1^\circ$ vs. $4.0^\circ$). |
| **❌ NEGATIVE MATCH #1 (Too Steep)** | **Andean Cell `83b221fffffffff`** (`-24.683° S, -68.604° W`) | $4,195$ to $5,270\text{ m}$ | **$7.89^\circ$** | **$6.92^\circ$** [$6.17^\circ\text{--}7.31^\circ$] | **$0.74$** | **$42.8\text{ m}$** | **DOES NOT MATCH:** High-Andean volcanic relief is far too rugged and steep compared to the Jezero window. |
| **❌ NEGATIVE MATCH #2 (Too Flat)** | **Salar Cell `83b225fffffffff`** (`-23.606° S, -68.524° W`) | $2,301$ to $2,342\text{ m}$ | **$0.19^\circ$** | **$1.71^\circ$** [$1.65^\circ\text{--}1.86^\circ$] | **$0.82$** | **$8.2\text{ m}$** | **DOES NOT MATCH:** Evaporitic salar crust is almost completely flat ($P_{50}=0.19^\circ$), failing to represent Jezero's gentle undulations. |

---

## SLIDE 6 OF 7 · Where Earth Analogs Always Break Down ($\mathbf{B}$) & Local Impact (Caja La Araucana · SDGs)

### **Part A · The Irreducible Physical Gap ($\mathbf{B}$): What Earth Can NEVER Reproduce and Why**
| Physical Parameter in $\mathbf{B}$ | Earth (Atacama) | Mars (Jezero Crater) | Moon (South Pole) | Why the Analogy Breaks Down Physically |
|---|---|---|---|---|
| **1. Surface Gravity ($g$)** | **$9.8\text{ m/s}^2$ ($1.00\text{ g}$)** | **$3.7\text{ m/s}^2$ ($0.377\text{ g}$)** | **$1.6\text{ m/s}^2$ ($0.166\text{ g}$)** | Weight on Mars is $2.6\times$ lower and on the Moon $6\times$ lower $\to$ alters wheel sinkage, regolith angle of repose, and suspension loads. |
| **2. Atmospheric Pressure ($P_{\text{atm}}$)** | **$1\text{ bar}$ ($101.3\text{ kPa }\text{N}_2/\text{O}_2$)** | **$\sim 0.006\text{ bar}$ ($0.6\text{ kPa}$, $95.1\%\text{ CO}_2$)** | **$\sim 3\times 10^{-15}\text{ bar}$ ($0\text{ kPa}$ vacuum)** | Martian air is $\sim 160\times$ thinner than Earth's $\to$ changes convective heat transfer, aeolian saltation, and aerodynamic lift. |
| **3. Ionizing Radiation ($R_{\text{ion}}$)** | **$\sim 2.4\text{ mSv/yr}$** (Magnetosphere + atmosphere shield) | **$\sim 230\text{ mSv/yr}$** ($\sim 0.64\text{ mSv/day}$, *Curiosity/RAD*, Hassler et al., 2014) | **$\sim 380\text{ mSv/yr}$** (Unshielded GCR + SEP) | Earth's magnetic shield and atmosphere block galactic cosmic rays $\to$ avionics Single-Event Upsets (SEUs) cannot be tested outdoors in Atacama. |
| **4. Surface Temperature ($\Delta T$)** | **Mean $15\text{ °C}$** ($\Delta T \approx 35\text{--}40\text{ K}$) | **Mean $-59\text{ °C}$ to $-65\text{ °C}$** (*Viking 1*: $-89\text{ to }-31\text{ °C}$) | **Equator: $-178\text{ to }+117\text{ °C}$** ($95\text{--}390\text{ K}$, $\Delta T \approx 295\text{ K}$) | Extreme cryogenic cycles over a $24.7\text{ h}$ Martian sol or $29.5\text{-Earth-day}$ lunar cycle exceed any terrestrial desert. |

### **Part B · Caja La Araucana 4 Strategic Objectives & Official UN SDG Targets**
1. **Democratize Frontier Science (`SDG Target 4.3`):** Free, open-source, voice-guided (`Web Speech API`) learning mode (*"Three Worlds in Your Hand"*) for schools, families, and older adults.
2. **STEAM Skills & Employability (`SDG Target 4.4` & `SDG 8`):** Trains Antofagasta students and workers in `H3`/`DuckDB` geospatial analysis, 30 m terrain statistics, and astro-geotourism.
3. **Local Territorial Application (`SDG Target 9.5`, `SDG 10` & `SDG 13`):** Highlights under-studied Antofagasta cells (`83b224fffffffff`) for preliminary research while reducing digital/territorial gaps and field logistics emissions.
4. **Interregional Innovation Network — *Lattices* (`SDG Targets 17.3, 17.16, 17.17`):** Multi-actor open-science network linking Caja La Araucana, UCN, and UA with Chilean regions and global agencies.

---

## SLIDE 7 OF 7 · Legal Open Science Credits, Brand Identity & AI Disclosure

### **100% Open Science Compliance (`NASA SPD-41a` / `FAIR` / `Apache-2.0 License`)**
- **NASA Open Datasets (U.S. Federal Public Domain, `17 U.S.C. § 105`):**
  - `NASA MRO CTX / USGS Mars 2020 TRN CTX DEM Mosaic, Jezero Crater (20 m/px)` (USGS Astrogeology Annex, Public Domain)
  - `NASA LRO LOLA GDR` & `Diviner Lunar Radiometer GDR` (PDS Geosciences Node, DOIs: `10.1007/s11214-010-9634-2`, `10.1007/s11214-010-9635-1`)
  - `NASA MGS MOLA MEGDR` (`10.1029/2000JE001426`), `NASA Mars 2020 Perseverance MEDA` (`10.1007/s11214-021-00804-9`) & `MSL Curiosity REMS / RAD` (Hassler et al., 2014, *Science*, `10.1126/science.1244797`)
  - `NASA LaRC POWER API v2.5`, `NASA Solar System Treks WMTS` (*Moon Trek* / *Mars Trek*), & `NASA NSSDCA Planetary Fact Sheet` (Williams, 2024).
- **Space Agency Partner & Open Catalogs:**
  - `ESA Copernicus DEM GLO-30` (© DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA).
  - `ECMWF / Open-Meteo ERA5-Land Archive` (`CC BY 4.0`), `ISRIC SoilGrids v2.0` (`CC BY 4.0`), `UW–Madison Macrostrat API v2` (`CC BY 4.0`).
- **Source Code, Typography, Icons & Basemaps:**
  - **Code:** Released under **Apache License 2.0** ([`LICENSE`](../../LICENSE)). Third-party libraries: `FastAPI`, `DuckDB`, `Uber H3`, `SciPy`, `scikit-learn`, `React 18`, `Tailwind CSS`, `MapLibre GL JS`.
  - **Typography & Icons:** System UI font stack (no web fonts are loaded or redistributed); `Lucide Icons` (`ISC/MIT License`). Basemaps: `© OpenStreetMap contributors` (`ODbL`) & `© CARTO` (`CC BY 4.0`).
- **AI Disclosure & Brand Policy ([`AI_DISCLOSURE.md`](../../AI_DISCLOSURE.md) & [`docs/BRAND_IDENTITY.md`](../BRAND_IDENTITY.md)):**
  - Scientific hypothesis ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$), statistical pipeline, and analog discoveries are **100% human-conceived by Lattices Team**. AI assistants (`Claude` / `Antigravity`) assisted in code scaffolding, translation parity, and documentation audits.
  - **Zero AI-generated images/videos** and **zero NASA logos/insignia** are used anywhere in this project.
- **Public Repository (No Login Required):** [`https://github.com/AnGeMoNs/Ckepi`](https://github.com/AnGeMoNs/Ckepi)
