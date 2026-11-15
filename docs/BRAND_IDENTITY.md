# Ckepi — Visual Brand Identity & Open Science Legal Attribution Guide

> **Active revision, 14 November 2026: SAL / COPPER / SULFUR.** The active palette and usage rules are in [the V2 guide](../frontend/public/img/ckepi/IDENTIDAD_V2.md). The app's semantic tokens, Tailwind brand colors, Card glass surfaces and Home logo now use V2. This is a team design system, not NASA branding or an official agency standard. The generated paper-cut symbol is promotional artwork and requires visible AI attribution, as documented in `AI_DISCLOSURE.md`.

> **Project:** Ckepi — Multi-Planetary Analog Discovery & Causal Decomposition Engine  
> **Team:** Lattices Team (Antofagasta, Chile — NASA Space Apps Challenge 2026)  
> **Standard:** NASA Open-Source Science (`SPD-41a` / `TOPS` / `FAIR`) & WCAG 2.1 AA/AAA

---

## 1. Brand Essence & Naming

CKEPI links planetary comparison with accessible learning. Its current visual direction is **layered mineral paper over a blue night landscape**. Three open C contours represent comparative observation; they are not scientific diagrams or agency insignia. No etymology or cultural naming attribution is asserted without a team-verified source.

## 2. Active V2 Color System

| Role | Hex | Use |
|---|---|---|
| Mineral night | `#101F24` | Dark application surfaces and glass |
| Rock ink | `#183A3A` | Light-theme lettering |
| Warm salt | `#FFF2D7` | Primary logo and dark-theme text |
| Pale sulfur | `#E4ED83` | Primary action and middle paper layer |
| Light copper | `#E8A080` | Inner paper layer and secondary accent |
| Light paper | `#F7F1E4` | Light application background |

The light-theme action uses dark olive `#4F5B13` and pale text. Complete usage rules and provenance: [V2 guide](../frontend/public/img/ckepi/IDENTIDAD_V2.md). Measured semantic token contrast pairs: [contrast-v2.json](../frontend/public/img/ckepi/contrast-v2.json). These checks do not certify every rendered component. Glass surfaces retain a 94% fill, a 12px blur and an opaque fallback. No emissions or energy-efficiency benefit has been measured.

## 3. Typography & Legal Font Licensing

**Status (14-nov-2026): implemented.** `frontend/src/main.tsx` imports two web fonts through `@fontsource` packages. Vite bundles them as self-hosted WOFF/WOFF2 files, so no third-party font CDN is used. Both are under the **SIL Open Font License 1.1 (OFL-1.1)**:

1. **UI body, headings and accessible reading:** `Public Sans` (variable; created for the U.S. Web Design System — `SIL OFL 1.1`), declared as `font-sans` in `tailwind.config.ts`.
2. **Telemetry, H3 indices and numbers:** `IBM Plex Mono` (IBM — `SIL OFL 1.1`), weights 400 and 600, declared as `font-mono`. Used for $W_1$, $D_{\text{KS}}$, 95% confidence intervals, H3 indices (`83b224fffffffff`) and physical units ($\text{m}$, $^\circ$, $\text{mSv/yr}$, $\text{kPa}$).

Space Grotesk, Inter and JetBrains Mono, named in earlier drafts, are **not** used.

---

## 4. Iconography, Vector Diagrams & Legal Licensing

1. **UI Icons:** [`lucide-react`](https://lucide.dev/license) — Licensed under the **ISC License** (Copyright © Cole Bemis & Lucide Contributors).
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
> *"Earth terrain: Copernicus DEM GLO-30 (ESA), AWS Open Data instance, reprojected to UTM 19S at 30 m — produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30. Historical surface climate variables provided by Open-Meteo ERA5-Land Archive (ECMWF Copernicus Climate Change Service, CC BY 4.0). Geological lithology and stratigraphy provided by Macrostrat API v2 (University of Wisconsin–Madison, CC BY 4.0)."*

### C. Basemaps & Planetary Imagery
> *"Terrestrial map tiles © OpenStreetMap contributors (ODbL) and © CARTO (CC BY 4.0). Lunar and Martian global mosaic tiles courtesy of NASA/JPL-Caltech/GSFC/ASU via NASA Solar System Treks WMTS (Public Domain)."*

### D. Open-Source Software & Source Code (`Apache License 2.0`)
> *"Ckepi source code Copyright © 2026 Lattices Team, released under the Apache License 2.0 (see LICENSE). Built with FastAPI (MIT), Pydantic v2 (MIT), DuckDB (MIT), Uber H3 (Apache-2.0), NumPy/SciPy/scikit-learn (BSD-3-Clause), React 18 (MIT), Vite (MIT), Tailwind CSS (MIT), and MapLibre GL JS (BSD-3-Clause)."*

---

## 6. AI Disclosure, Watermark Policy & Strict Logo Prohibition (`Gate G11`)

1. **Human Scientific Conception:** The causal decomposition framework ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$), the 30 m non-parametric terrain distribution pipeline ($W_1$, $D_{\text{KS}}$, 2D spatial block bootstrap), and the territorial comparison in Antofagasta (cell `83b224fffffffff` closer to Jezero in slope than the classic *Yungay* control; cell `83b221fffffffff`, labelled *Salar de Pajonales*, as a negative case) are **100% conceived and directed by the human members of Lattices Team**. Full disclosure is maintained in [`AI_DISCLOSURE.md`](../AI_DISCLOSURE.md).
2. **Zero AI-Generated Scientific Imagery:** All H3 maps, 3D globes, empirical distribution plots, and SVG architecture diagrams in Ckepi are rendered deterministically by code from real datasets. **Generative AI is used only for decorative media:** the Home intro video and the paper-cut backgrounds, always shown with a visible "AI-generated" label and declared in `AI_DISCLOSURE.md`. They never stand for scientific imagery or measured terrain.
3. **Mandatory Watermark Rule (if any promotional AI visual/video is used):** Any AI-generated visual or video clip used in auxiliary pitch media **MUST display a permanent visible label (`"AI-generated"`, as shown on screen in the app)** in the corner and be declared in [`AI_DISCLOSURE.md`](../AI_DISCLOSURE.md).
4. **Strict NASA & Institutional Logo Prohibition:**
   - **NEVER** use the NASA insignia (*Meatball*), NASA logotype (*Worm*), or official agency seals anywhere in the UI, slides, video, or repository.
   - **NEVER** use logos of Caja La Araucana, Universidad Católica del Norte (UCN), Universidad de Antofagasta (UA), or Nómada without explicit written permission; all institutional acknowledgments are rendered strictly as **plain-text credits**.

### 2026-11-15 — Cardboard interaction assets

The generated copper push-button and cream/copper hexagonal pin in `frontend/public/img/controls/` extend the existing cardboard/glass palette. Native HTML controls provide labels, keyboard focus and actions; decorative backgrounds never encode scientific measurements. Both source PNGs carry `AI-Generated` marks. Only primary actions receive the copper rim glow. Reduced-motion preferences disable control displacement.

The Spanish scientific-home title `frontend/public/img/controls/ckepi-scientific-title-es-v1.webp` was also generated with the OpenAI image-generation tool on 15 November 2026 at the user's request. Its transparent PNG master retains the embedded `AI-Generated` mark. The accessible heading remains localized native text; the Spanish word art is decorative and is replaced by localized text in English and Portuguese.
