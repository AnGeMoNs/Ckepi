# Artificial Intelligence (Super Intelligence) Disclosure — Ckepi

In accordance with the **NASA Space Apps Challenge 2026** *Project Submission Guide* and *Judging & Awards Guide* rules on **Super Intelligence (SI)** / AI tools:

1. **Human Conception & Scientific Design:**
   - The core scientific concept of **Ckepi**—decoupling independent geophysical forcings ($X$), dependent environmental responses ($Y$), and irreducible physical breakage boundaries ($B$) over an H3 hexagonal spatial grid—was conceived and designed by the human team.
2. **AI-Assisted Acceleration:**
   - AI coding assistants (Claude Code / Google Antigravity) were used under human scientific direction to accelerate software implementation, statistical distribution modules (`scipy.stats.wasserstein_distance`, `scipy.stats.ks_2samp`, 2D spatial block bootstrap at 30 m / 60 m / 90 m scales), responsive React/Tailwind UI components (`TerrainDistributionPanel`, `LaAraucanaImpactPanel`), documentation structuring, and multilingual translation parity across Spanish (`es`), Portuguese (`pt`), and English (`en`).
   - All generated code, scientific equations, physical constants, and translations were reviewed and verified by the human team.
3. **Media & Branding Compliance:**
   - No NASA logos, mission patches, or trademarks were generated or modified using AI.
   - All planetary imagery and terrain layers are sourced directly from official open NASA/partner-agency services (NASA Trek WMTS, PDS, LRO/MRO, Copernicus).
   - Scientific planetary imagery and terrain layers use the sources documented in the data provenance records. Decorative promotional artwork is identified separately below and must not be presented as scientific imagery or measured terrain.
4. **Optional Runtime LLM Synthesis (OpenRouter):**
   - When configured by the operator via server-side `OPENROUTER_API_KEY`, the Mission Diagnostics panel can synthesize structured viability assessments and breakage-mitigation considerations over Ckepi's deterministic metrics ($S_{\text{ind}}$, $S_{\text{dep}}$, $R_{\text{break}}$, uncertainty, H3 scale, and Macrostrat/SoilGrids context).
   - Every numerical score remains computed deterministically without LLM involvement; LLM outputs are cached in DuckDB, localized (`es`/`pt`/`en`), and explicitly marked as scientific pre-selection requiring human engineering validation (not operational safety certification).

## Decorative paper-cut backgrounds — 14 November 2026

### Paper-cut brand revision V2

OpenAI built-in `image_gen` was used via Codex to transform the original geometric CKEPI emblem into a transparent layered-paper symbol, under the user's art direction. The three open C-shaped bands and detached point were retained; colors were changed to warm salt ivory, pale sulfur and light copper. No institutional logo was used. The master is `frontend/public/img/ckepi/paper-cut/ckepi-symbol-paper-master.png`; derived WebP, hybrid SVG lockups and raster exports are in that brand directory. The lettering is programmatically drawn geometry. Monochrome and light vector-only variants remain available. The color system is an aesthetic proposal, not scientific data. Final team acceptance and visual review across devices remain pending.

- **Tool:** OpenAI built-in `image_gen`, operated through Codex under the user's art direction. The tool does not expose a model version in this session; no particular model version is claimed.
- **Scope:** Twelve independently generated decorative backgrounds: Home, The Problem, What CKEPI Does, The Finding, The Honest Limit, and Explorer; each has a landscape and portrait composition. The style is a handcrafted layered paper diorama. No scientific observations, measurements, discovered analogs or geometrically accurate planetary features are represented by this artwork.
- **Files:** `frontend/public/img/backgrounds/ckepi-{home,el-problema,que-hace-ckepi,el-hallazgo,el-limite-honesto,explorador}-{desktop,mobile}.webp`. Exact file sizes, export dimensions, original dimensions, and review notes are recorded in `manifest.json` in that directory. Prompts and source paths are recorded in `docs/design/paper-cut/prompts.json`; export code is in `scripts/assets/export_paper_cut_backgrounds.py`.
- **Processing:** Pillow was used only to fit the requested delivery dimensions and export compressed WebP files below 300,000 bytes. The generated originals are smaller than the requested delivery sizes; exported 2560×1440 and 1080×1920 files are resampled, not native-resolution generations.
- **Review:** Each selected image was visually reviewed for text, logos, people, flags, and planetary rings. A mobile Problem candidate with unwanted planets and a mobile Explorer candidate with warm colors were rejected and replaced.
- **Visible attribution:** The reusable `PaperCutBackground` component overlays the persistent text `AI-generated · Ckepi` using CSS, independently of the raster. Images must be used with this component or an equivalent visible attribution. Standalone redistribution or screenshots without that layer require adding the same visible attribution. The contact sheet includes visible attribution.
- **Integration status (updated 14-nov-2026, night):** Integrated. After the intro video, the Home shows `ckepi-que-hace-ckepi-*` behind the two entry worlds, and the software backdrop uses `ckepi-home-*`. Both show a visible «Ilustración generada con IA · Ckepi / AI-generated illustration · Ckepi» label while the artwork is on screen.

## Home intro video and logo in the product — 14 November 2026

- **Home video:** `frontend/public/media/ckepi-home.{webm,mp4}` and its two still frames are an AI-generated paper-cut animation (Google Gemini video generation, under the team's art direction; prompt in `docs/PROMPT_HOME_CKEPI.md`). It contains no NASA marks, people or flags. The Home shows a persistent «Video generado con IA / AI-generated video» label while the footage is visible; the audio track was removed and the files were re-encoded with ffmpeg (on 14-nov-2026, night, they were re-encoded again from the original Gemini export at higher quality, still 1280 × 720). The footage includes AI-generated «CKEPI» lettering; it is decorative and is always shown with the AI label.
- **Logo used in the product:** the app, favicon and Home use the **vector** V2 logo (`svg/ckepi-*-vector-dark.svg`, `icons/ckepi-vector-*.png`), drawn by code with the same geometry and the V2 «salt · copper · sulfur» colours. The AI-generated raster paper symbol described above is **not** used in the product, so the logo used in the interface is not AI imagery. The only AI-generated brand lettering appears inside the labelled intro video.


## Interactive planet artwork and cardboard textures — 14 November 2026

- **Tool:** OpenAI built-in `image_gen` through Codex. No model/version is claimed because the tool does not expose one.
- **Scope:** Five decorative paper-cut planets (STEAM, Science, Earth, Moon, Mars) and five cardboard UI assets (ink/salt surfaces, torn frame, copper tab, corrugated strip), generated from `docs/design/paper-cut/PROMPTS_PLANETAS_GPT.md` under the team's art direction and V2 palette. They are illustrations and textures, not satellite measurements, precise maps, or scientific evidence.
- **Delivery:** WebP assets are in `frontend/public/img/planets/` and `frontend/public/img/paper/`; PNG delivery masters are in their `masters/` directories and untouched native generations in `masters/native/`. Planet delivery masters at 2048 square are enlarged exports from native 1254 square images, not native 2048 generations. Web planets are 1024 square and below 200,000 bytes; textures respect the requested 120,000/150,000-byte budgets.
- **Processing:** Pillow was used for export sizing, transparent-margin framing/cropping, PNG/WebP encoding and a labelled review contact sheet. No generative model output is presented as measured terrain. Exact source paths, generation prompts, native/output dimensions, hashes and file sizes are recorded in `docs/design/paper-cut/prompts.json` and `PLANETAS_Y_CARTON_V2_MANIFEST.json` beside it.
- **Review:** All ten selected images were visually reviewed for text, letters, logos, NASA insignia, flags, people and planetary rings; none were observed. The STEAM illustration intentionally has a dotted moon-orbit path, not a Saturn ring. PNG/WebP alpha and output dimensions were checked. Texture repetition and frame slicing still require acceptance in the consuming layout.
- **Attribution and integration:** No watermark is baked into these assets, as requested. Claude must preserve a clearly visible `AI-generated` attribution when integrating them into the website. This delivery creates assets and documentation only; it does not replace the current React drawings or modify application components.

## Cardboard planets, textures and learning cutouts — 14 November 2026, night

- **Tool and direction:** GPT image generation (OpenAI, through Codex), under the team's art direction. Prompts are in `docs/design/paper-cut/PROMPTS_PLANETAS_GPT.md`.
- **Files:** five planets (`frontend/public/img/planets/ckepi-planet-{steam,science,earth,moon,mars}.webp`) and five cardboard textures (`frontend/public/img/paper/*.webp`). Masters are in the `masters/` subfolders. Learning cutouts (`frontend/public/img/learn/`) will follow the same rules when they are delivered.
- **Visible watermark:** the Space Apps 2026 Project Submission Guide requires that AI images and videos "must include a visible watermark to indicate SI generation". Every planet and cutout shows a small cardboard seal ("Imagen IA" / "Imagem IA" / "AI image"). The Learn page states that its cardboard textures are AI-generated, and the Home keeps its AI label for the video and the backdrop.
- **Scope:** decorative only. No number, chart, terrain window or comparison is AI-generated. Values come from NASA NSSDCA, Hassler et al. 2014, Reitz et al. 2012, UNSCEAR and the Ckepi snapshot, and are drawn by code.
- **Interactive figure:** an isometric explanatory figure is being built with the open-source `anatomy` skill (MIT, by Ryan, github.com/wheresryan22/anatomy) under Claude's assistance. It is code-drawn, uses only snapshot numbers, and shows its own credit line.


## Cardboard/glass frames, conceptual terrain maps and scientific accessories — 14 November 2026

- **Generation:** OpenAI built-in `image_gen` through Codex, under the user's direction and CKEPI V2 visual system. The tool does not expose a specific model version.
- **Scope:** 17 separate decorative assets: three conceptual paper relief maps inspired by Atacama, lunar polar terrain and Jezero/Mars; two cardboard-and-glass card rims; one location pin; eleven science pictograms for gravity, atmosphere, ionizing radiation, temperature, slope, relief, water, solar/reflectance, wind/dust, soil/thermal context and vegetation.
- **Scientific boundary:** Terrain illustrations are not DEM products, mapped scientific observations or georeferenced layers. Their pixels and any freely placed pin do not correspond to geographic coordinates. Icons do not supply physical values. The application's real maps, data and source attribution remain separate.
- **Files:** `frontend/public/img/terrain-art/`, `frontend/public/img/card-frames/`, `frontend/public/img/science-accessories/`; untouched native PNGs in their `masters/` folders, compressed WebP for integration. Prompts, native/export dimensions, source paths, SHA-256 and byte sizes are in `docs/design/paper-cut/MAPAS_CARTON_HIBRIDO_MANIFEST.json` and the appended entries in `prompts.json`.
- **Export and review:** Pillow used only for resizing, compression and a labelled review contact sheet. All 17 images visually reviewed for unintended text, numbers, logos, NASA marks and people; no such elements observed. Transparent alpha and web budgets verified. UI card blur is CSS behavior, not a property conferred by the bitmap.
- **Attribution and interaction:** Original bitmaps contain no watermark text; the consuming interface must keep a visible `AI-generated` label. The separate `PREVIEW_MAPAS_CARTON_INTERACTIVO.html` shows that label and demonstrates marker movement, map switching and accessory selection. It has no scientific API connection and no measured values. DOM checks cover these behaviors; real-browser/mobile visual validation remains pending.
- **Integration status:** New assets and an isolated handoff preview only. Existing React pages, translations, datasets and scientific results were not changed by this delivery.


## Unified dashboard backdrop — 14 November 2026

OpenAI built-in `image_gen` via Codex generated a quiet V2 cardboard workbench backdrop, with no baked-in interface, text or scientific values. Source and exact prompt are appended in `docs/design/paper-cut/prompts.json`; the native PNG is preserved in `frontend/public/img/backgrounds/masters/ckepi-dashboard-workbench.png` and the 48,860-byte web export is `ckepi-dashboard-workbench.webp`. The dashboard identifies decorative artwork as AI-generated. Its coordinate schematic and numerical charts are drawn by code from existing snapshot data, not from this artwork. No model version is claimed.

### 2026-11-15 — Tactile cardboard UI controls

Two decorative button assets were generated with the OpenAI image-generation tool at the user's request: `frontend/public/img/controls/ckepi-button-copper-v1.webp` and `ckepi-pin-hex-v1.webp`. Transparent PNG masters are retained under `controls/masters/`. Both originals contain a visible `AI-Generated` mark; runtime text, units, focus, selection and actions remain native accessible UI. These assets are decorative and represent no sensor observation or scientific measurement. No agency logos were used.

The Spanish scientific-home title `frontend/public/img/controls/ckepi-scientific-title-es-v1.webp` was also generated with the OpenAI image-generation tool on 15 November 2026 at the user's request. Its transparent PNG master retains the embedded `AI-Generated` mark. The accessible heading remains localized native text; the Spanish word art is decorative and is replaced by localized text in English and Portuguese.


### 2026-11-15 — Demo completion and local presentation model

Codex assisted under human direction with STEAM progression/scoring fixes, keyboard navigation, regression checks and a separate editable seven-slide local presentation model. An assistant applied the repository judging profiles to review scientific limits, local criteria and proposed SDG contributions; this is an internal review, not organizer validation. The previous human-approved pitch remains separate. Existing real screenshots were reused with visible AI-Generated attribution for decorative artwork; no new scientific observations or impact results were generated. Speaker notes target 180 seconds and still require a human timed rehearsal.
