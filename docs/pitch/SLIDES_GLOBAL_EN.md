# CKEPI · 7-slide demo · Global judging (English)

> Space Apps 2026 rule: **7-slide limit including title and intro slides**, all in English (Judging & Awards Guide, *Eligibility for Global Judging*).
> Style: one claim per slide, one large number, sources in the footer. Numbers come only from the project's measured results and `REFERENCES.md`.

---

## 1 · Title

**CKEPI — From image to evidence.**
Earth analogs for Mars terrain, with the Moon's physical gap, using open NASA and ESA data.

*Lattices Team · Antofagasta, Chile · Challenge: "Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars"*

- **Visual:** CKEPI vector logo on the cardboard three-worlds backdrop (labelled "AI-generated illustration").
- **Source:** spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars

---

## 2 · Problem

**Analog sites look alike in photos. Their terrain does not.**

> Big number: **6×**
> An under-studied Antofagasta cell's 30 m slope distribution is **~6× closer** to Jezero's than the classic Yungay analog's.

- **Visual:** two 6 km terrain cuts, the Antofagasta pampa vs. Jezero crater.
- **Sources:** Yungay W₁ 3.32° ÷ cell 83b224 W₁ 0.54° ≈ 6.1. Challenge statement: "terrestrial analog sites are not entirely well characterized."

---

## 3 · Solution

**CKEPI shows on one card where to test, how similar it is, and what breaks.**

**Choose** a target (Jezero; for the lunar south pole, the physical gap only) → **Locate** the Antofagasta cells measured at 30 m on a map → **Compare** on one card, with units and sources → **Learn** with the same evidence.

The final decision stays with the scientist.

- **Visual:** the card, with three large rows:
  - Matches · slope 0.54°
  - Classic · 3.32°
  - Breaks · 0.38 g
- **Source:** NASA MRO CTX DEM (Jezero) · ESA Copernicus DEM GLO-30 · 2D block-bootstrap Wasserstein-1.

---

## 4 · NASA data at the core

**Every number traces back to an open dataset.**

| Role | Exact product |
|---|---|
| Mars terrain (core) | **NASA MRO CTX DEM — Mars 2020 Science Investigation CTX DEM Mosaic, Jezero Crater**, 20 m/px (Calef et al., USGS Astrogeology, 2021), resampled to 30 m |
| Earth terrain | **ESA Copernicus DEM GLO-30**, reprojected to UTM 19S, 30 m |
| Global screening (being integrated) | **NASA POWER Climatology API** (annual) + **Copernicus DEM 90 m via the Open-Meteo Elevation API** (fallback **NASA/METI ASTER GDEM 30 m** via OpenTopoData) on an H3 resolution-3 grid |
| Physical gap | **NASA NSSDCA Planetary Fact Sheets**; **MSL RAD** (Hassler et al., 2014) |

Method: Wasserstein-1 and Kolmogorov–Smirnov on full slope distributions, 2D spatial block bootstrap (95% CI), 30/60/90 m sensitivity.

- **Sources:** REFERENCES.md · Copernicus notice: "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved". The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30.

---

## 5 · Finding

**An under-studied Antofagasta cell matches Jezero in 30 m slope better than the classic analog.**

> Big number: **0.54°**
> 30 m slope distance (W₁), 95% CI 0.40–0.65°, stable at 60 and 90 m.
> Yungay (classic): 3.32°. Cell 83b221 (negative case): 6.92°.

A field-study shortlist, not a certification. One 6 × 6 km window; slope and relief only; Earth DSM vs. Mars photogrammetric DEM.

- **Visual:** map of Antofagasta with cell `83b224fffffffff` (23.05° S, 69.50° W) highlighted.
- **Sources:** NASA MRO CTX DEM, Mars 2020 Science Investigation Mosaic (Calef et al., USGS, 2021) · ESA Copernicus DEM GLO-30 · Wasserstein-1, Kolmogorov–Smirnov, 2D spatial block bootstrap.

---

## 6 · Where the analogy breaks

**Atacama is not Mars. We show what fails, and where to test it instead.**

> **0.38 g** gravity · **~0.6 kPa** CO₂ · **~230 mSv/yr** radiation
> Moon: 0.166 g · vacuum · ~380 mSv/yr at solar minimum (simulated)

These can only be studied partially, in vacuum chambers, accelerators or parabolic flights. **Next:** the lunar south pole with **NASA LRO LOLA**, using the same 30 m method.

- **Sources:** NASA NSSDCA Planetary Fact Sheets (Williams, 2024) · Hassler et al. 2014, *Science* · Reitz et al. 2012, *Planetary and Space Science*.

---

## 7 · Impact and open science

**One body of evidence: scientists save time, students learn to investigate.**

- **Science mode:** explainable, downloadable shortlist.
- **Learn mode:** Look, Compare, Investigate, with voice, three reading levels and no personal data, built for schools and libraries in Antofagasta.
- **Open:** Apache-2.0 code, public demo, every value with its source.

**CKEPI — from image to evidence.**

- **Footer:** Code Apache-2.0 · Public Sans and IBM Plex Mono (SIL OFL-1.1) · Lucide (ISC) · AI disclosure: decorative illustrations and the intro video are AI-generated and watermarked on screen; AI assistants (Claude Code, Google Antigravity, Codex) helped with code and docs under human review; no data or chart is AI-generated · No NASA logos · Links: repo + demo (public, no login).
