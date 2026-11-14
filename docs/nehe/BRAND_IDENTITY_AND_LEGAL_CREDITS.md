# Ckepi — Visual Brand Identity & Open Science Legal Attribution Guide

> **Project:** Ckepi — Multi-Planetary Analog Discovery & Causal Decomposition Engine  
> **Team:** Lattices Team (Antofagasta, Chile — NASA Space Apps Challenge 2026)  
> **Standard:** NASA Open-Source Science (`SPD-41a` / `TOPS` / `FAIR`) & WCAG 2.1 AA/AAA

---

## 1. Brand Essence & Naming

- **Name:** **Ckepi** (inspired by High-Andean / Atacama territorial heritage of observation across extreme Horizons) + **Lattices Team** (representing the hexagonal **H3 spatial lattice** and the **interregional innovation network** connecting Antofagasta with Chile and global space science).
- **Visual Archetype:** *Orbital Telemetry meets Andean Cartography* — Dark-first scientific glassmorphism (`#05070D` OLED abyss) with high-contrast planetary chromatic coding (Earth Sky/Emerald, Lunar Anorthosite/Cyan, Martian Ferric Ochre, and Rose Physical-Rupture Alerts).

---

## 2. Semantic Color System (Tailwind Tokens & WCAG Contrast)

All UI components strictly use semantic Tailwind tokens defined in [`frontend/tailwind.config.js`](../frontend/tailwind.config.js) without arbitrary inline hex styles (`0 style={{}}`):

| Semantic Role | Primary Token | Hex Code | Contrast vs. `#05070D` | Physical / Planetary Meaning |
|---|---|---|---|---|
| **Deep Space Canvas (OLED)** | `slate-950` | `#05070D` | — | Low-energy dark telemetry background (`ISO/IEC 21031 SCI`) |
| **Elevated Glass Surface** | `slate-900/90` | `#0F172A` | $17.4:1$ (AAA) | Mission control cards, HUD panels, and modal overlays |
| **Earth / Atacama Analog** | `sky-400` / `emerald-400` | `#38BDF8` / `#34D399` | $10.2:1$ (AAA) | Terrestrial candidate sites (*Salar de Pajonales*, *Llullaillaco*) |
| **Moon (South Pole / Artemis)** | `cyan-400` / `slate-300` | `#22D3EE` / `#CBD5E1` | $11.8:1$ (AAA) | Anorthositic highlands, PSR craters (*Shackleton*), grazing solar illumination |
| **Mars (Jezero / ISRU)** | `orange-400` / `amber-400` | `#FB923C` / `#FBBF24` | $9.6:1$ (AAA) | Basaltic/lacustrine craters (*Jezero*), ferric regolith, $\text{CO}_2$ atmosphere |
| **Irreducible Gap Alert ($\mathbf{B}$)** | `rose-500` / `rose-400` | `#F43F5E` / `#FB7185` | $7.4:1$ (AAA) | Physical rupture barrier ($R_{\text{break}} \ge 0.60$: $0.38\text{ g}$, $0.6\text{ kPa }\text{CO}_2$, $230\text{ mSv/yr}$) |

---

## 3. Typography & Legal Font Licensing

All typography used across the web application, architecture diagrams, and the 7-slide prototype deck is 100% open-source under the **SIL Open Font License 1.1 (OFL-1.1)**:

1. **Display & Section Headings:** `Space Grotesk` (Designed by Florian Karsten — `SIL OFL 1.1`). Used for planetary titles, slide headers, and HUD badges.
2. **UI Body & Accessible Reading (*"Three Worlds in Your Hand"*):** `Inter` / System Sans-Serif Stack (Designed by Rasmus Andersson — `SIL OFL 1.1`). High x-height and open apertures for mobile-first legibility (`320px` $\to$ `4K`).
3. **Telemetry, H3 Indices & Mathematical Equations:** `JetBrains Mono` (Designed by JetBrains — `SIL OFL 1.1`). Tabular numerals (`tabular-nums`) for $W_1$, $D_{\text{KS}}$, 95% confidence intervals, H3 indices (`83b221fffffffff`), and physical units ($\text{m}$, $^\circ$, $\text{mSv/yr}$, $\text{kPa}$).

---

## 4. Iconography, Vector Diagrams & Legal Licensing

1. **UI Icons:** [`lucide-react`](https://lucide.dev/license) — Licensed under the **ISC / MIT Open Source License** (Copyright © Cole Bemis & Lucide Contributors).
2. **Architecture & Pizarra Vector Diagrams:**
   - [`docs/MAPA_SOFTWARE_PIZARRA.svg`](MAPA_SOFTWARE_PIZARRA.svg) (derived from [`docs/MAPA_SOFTWARE_PIZARRA.excalidraw`](MAPA_SOFTWARE_PIZARRA.excalidraw))
   - [`docs/MAPA_SOFTWARE.svg`](MAPA_SOFTWARE.svg) (derived from [`docs/MAPA_SOFTWARE.excalidraw`](MAPA_SOFTWARE.excalidraw))
   - Authored by **Lattices Team (2026)** and released under **Creative Commons Attribution 4.0 International (`CC BY 4.0`)**.

---

## 5. Complete Legal Open Science Attribution Format (Data, Code, Maps, Media)

In accordance with **NASA Science Policy Directive `SPD-41a` (Scientific Information Policy)** and **NASA Space Apps Challenge Rules (`Gate G8`, `Gate G9`, `Gate G12`)**, every external resource is legally cited as follows:

### A. NASA Datasets & Planetary Resources (U.S. Federal Public Domain — `17 U.S.C. § 105`)
> *"Planetary and Earth observation datasets courtesy of NASA, JPL-Caltech, GSFC, ASU, LaRC, and USGS Astrogeology Science Center. Specifically: NASA MRO CTX / USGS Mars 2020 Terrain Relative Navigation CTX DEM Mosaic (Jezero Crater, 20 m; core input of the terrain comparison); NASA LRO LOLA GDR & Diviner Lunar Radiometer GDR (PDS Geosciences Node); NASA MGS MOLA MEGDR (PDS Geosciences Node); NASA Mars 2020 Perseverance MEDA & MSL Curiosity REMS/RAD (PDS Atmospheres Node); NASA LaRC POWER API v2.5 (CERES/MERRA-2); NASA Solar System Treks (Moon Trek & Mars Trek WMTS); and NASA NSSDCA Planetary Fact Sheet (Williams, 2024)."*

### B. Partner Space Agency & Open Scientific Catalogs (each under its own licence)
> *"Earth terrain: Copernicus DEM GLO-30 (ESA), AWS Open Data instance, reprojected to UTM 19S at 30 m — © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved (Copernicus DEM licence; verify exact text before submission). Historical surface climate variables provided by Open-Meteo ERA5-Land Archive (ECMWF Copernicus Climate Change Service, CC BY 4.0). Geological lithology and stratigraphy provided by Macrostrat API v2 (University of Wisconsin–Madison, CC BY 4.0)."*

### C. Basemaps & Planetary Imagery
> *"Terrestrial map tiles © OpenStreetMap contributors (ODbL) and © CARTO (CC BY 4.0). Lunar and Martian global mosaic tiles courtesy of NASA/JPL-Caltech/GSFC/ASU via NASA Solar System Treks WMTS (Public Domain)."*

### D. Open-Source Software & Source Code (`Apache License 2.0`)
> *"Ckepi source code Copyright © 2026 Lattices Team, released under the Apache License 2.0 (see LICENSE). Built with FastAPI (MIT), Pydantic v2 (MIT), DuckDB (MIT), Uber H3 (Apache-2.0), NumPy/SciPy/scikit-learn (BSD-3-Clause), React 18 (MIT), Vite (MIT), Tailwind CSS (MIT), and MapLibre GL JS (BSD-3-Clause)."*

---

## 6. AI Disclosure, Watermark Policy & Strict Logo Prohibition (`Gate G11`)

1. **Human Scientific Conception:** The causal decomposition framework ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$), the 30 m non-parametric terrain distribution pipeline ($W_1$, $D_{\text{KS}}$, 2D spatial block bootstrap), and the territorial discovery in Antofagasta (*Salar de Pajonales* vs. *Yungay* control) are **100% conceived and directed by the human members of Lattices Team**. Full disclosure is maintained in [`AI_DISCLOSURE.md`](../AI_DISCLOSURE.md).
2. **Zero AI-Generated Scientific Imagery:** All H3 maps, 3D globes, empirical distribution plots, and SVG architecture diagrams in Ckepi are rendered deterministically by code from real datasets—**no generative AI images or synthetic photographs are used in the application or slides**.
3. **Mandatory Watermark Rule (if any promotional AI visual/video is used):** Any AI-generated visual or video clip used in auxiliary pitch media **MUST display a permanent visible watermark (`"AI-Generated Visual"`)** in the corner and be declared in [`AI_DISCLOSURE.md`](../AI_DISCLOSURE.md).
4. **Strict NASA & Institutional Logo Prohibition:**
   - **NEVER** use the NASA insignia (*Meatball*), NASA logotype (*Worm*), or official agency seals anywhere in the UI, slides, video, or repository.
   - **NEVER** use logos of Caja La Araucana, Universidad Católica del Norte (UCN), Universidad de Antofagasta (UA), or Nómada without explicit written permission; all institutional acknowledgments are rendered strictly as **plain-text credits**.
