---
name: pitch-storytelling-space-apps
description: >-
  Construye y afina la historia del proyecto Ckepi para NASA Space Apps 2026 con los patrones de los
  ganadores globales y nacionales (TAKYA): produce el Summary de 3 golpes en inglés, el guion de video
  de 30 s con subtítulos en inglés, el deck prototipo de exactamente 7 slides (en inglés) y el pitch
  presencial de 3 min + 2 min de Q&A (sede Antofagasta / Caja La Araucana / UCN / UA), incluyendo
  créditos legales Open Science sin logos prohibidos.
---

# Skill · Pitch & Storytelling Space Apps (Global EN + 7 Slides Prototipo + Local Antofagasta)

## Fuentes de verdad reales en el repositorio
- Paquete oficial de entrega (Summary EN, Video 30 s EN, Pitch Local 3 min + Q&A 20 s): [`docs/SUBMISSION_PACK_EN.md`](../../../docs/SUBMISSION_PACK_EN.md)
- Deck prototipo de 7 slides en inglés: [`docs/DEMO_7_SLIDES_EN.md`](../../../docs/DEMO_7_SLIDES_EN.md) y [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html)
- Identidad visual de marca y política de logos/créditos: [`docs/BRAND_IDENTITY.md`](../../../docs/BRAND_IDENTITY.md)
- Contexto de pitch y arquitectura: [`docs/CONTEXTO_PARA_PITCH_CKEPI.md`](../../../docs/CONTEXTO_PARA_PITCH_CKEPI.md) y [`docs/PLAN_MAESTRO.md`](../../../docs/PLAN_MAESTRO.md)

## Principios
1. **Una historia, cuatro cortes sincronizados:**
   - **High-Level Summary escrito** (120–180 palabras, 100 % en inglés).
   - **Video de $\le 30\text{ s}$** (con subtítulos quemados en inglés).
   - **Deck Prototipo de $\le 7\text{ slides}$** ([`docs/DEMO_7_SLIDES_EN.md`](../../../docs/DEMO_7_SLIDES_EN.md) y [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html), 100 % en inglés).
   - **Pitch presencial de 3 min + 2 min Q&A** (en español para el jurado de Antofagasta: UCN, UA y Caja La Araucana).
2. **Prueba > adjetivos:** Cada afirmación incluye el dataset NASA exacto (`NASADEM_HGT v001`, `MRO CTX DEM`, `LRO LOLA/Diviner`, `Mars 2020 MEDA`, `MSL RAD`), la distancia estadística a $30\text{ m}$ ($W_1 = 0.77^\circ$ en Salar de Pajonales vs. $W_1 = 4.13^\circ$ en Yungay) y su intervalo de confianza *2D Block Bootstrap* ($\text{IC } 95\%$).
3. **Honradez física obligatoria:** Explicar siempre **qué sí se parece**, **qué NO se parece** (contraejemplos reales) y **por qué falla la analogía terrestre** en la Brecha Física Irreducible $\mathbf{B}$ ($0.38\text{ g}$, $0.6\text{ kPa }\text{CO}_2$, $\sim 230\text{ mSv/año}$ de radiación, $\Delta T$).
4. **Cero logos prohibidos:** Ningún logo de NASA (*Meatball* o *Worm*). Créditos de datos, código, imágenes, tipografías e íconos en texto legal Open Science.

## Estructura Obligatoria de las 7 Slides de Demo para Prototipo (`G4` & `G5`)
1. **Slide 1 — Cover & Architectural Thesis:** *Ckepi* (*Lattices Team*, Antofagasta, Chile), Challenge (*Comparing the Three Worlds: Earth, Moon, and Mars*), causal thesis $\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$.
2. **Slide 2 — The Problem ("False Analogs"):** Why visual similarity and single-number averages fail when comparing Earth, Moon, and Mars across incompatible spatial resolutions.
3. **Slide 3 — Live Prototype Walkthrough (Mission Mode + Explorer Mode):** 3D NASA Trek Globes, H3 multi-resolution grid, Causal Matrix, 30 m Distribution Panel, and Mobile-First *"Three Worlds in Your Hand"* with Web Speech API voice readout.
4. **Slide 4 — NASA & Partner Open Data Pipeline:** Exact NASA products (`NASADEM_HGT v001`, `LRO LOLA/Diviner`, `MGS MOLA`, `MRO CTX DEM`, `Mars 2020 MEDA`, `MSL RAD`, `NASA POWER`) + `ESA Copernicus GLO-30`, `Macrostrat`, `Open-Meteo`.
5. **Slide 5 — Real 30 m Scientific Proof (Jezero Crater $\to$ Atacama):** Common $30\text{ m}$ metric scale, Wasserstein-1 ($W_1$) & Kolmogorov–Smirnov ($D_{\text{KS}}$) with 2D Block Bootstrap ($95\%\text{ CI}$) and $30/60/90\text{ m}$ sensitivity. Positive match (*Salar de Pajonales* $W_1=0.77^\circ$) vs. Negative match (*Yungay* $W_1=4.13^\circ$).
6. **Slide 6 — Irreducible Physical Gap ($\mathbf{B}$) & Local Impact (Caja La Araucana / SDGs):** Gravity ($0.38\text{ g}$ / $0.166\text{ g}$), $\text{CO}_2$ pressure ($0.6\text{ kPa}$ / $0\text{ kPa}$), Radiation ($\sim 230\text{ / }380\text{ mSv/yr}$), $\Delta T$, plus Antofagasta STEAM employability and verified UN SDGs (`4.3, 4.4, 8, 9.5, 10, 13, 17.3, 17.16, 17.17`).
7. **Slide 7 — Legal Open Science Credits, Brand Identity & AI Disclosure:** Legal attribution for Data, Code (`MIT`), Images/Tiles, Fonts (`SIL OFL-1.1`), Icons (`Lucide MIT`), AI Disclosure (`AI_DISCLOSURE.md`), and public links.

## Revisión Final
Ejecuta siempre `auditoria-global-ingles-legal-nasa`, `rubrica-cientifica-30m` y `rubrica-local-araucana` tras actualizar cualquier material de pitch.
