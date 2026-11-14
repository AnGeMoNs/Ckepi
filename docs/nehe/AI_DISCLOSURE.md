# Artificial Intelligence (Super Intelligence) Disclosure — Ckepi

In accordance with the **NASA Space Apps Challenge 2026** *Project Submission Guide* and *Judging & Awards Guide* rules on **Super Intelligence (SI)** / AI tools:

1. **Human Conception & Scientific Design:**
   - The core scientific concept of **Ckepi**—decoupling independent geophysical forcings ($X$), dependent environmental responses ($Y$), and irreducible physical breakage boundaries ($B$) over an H3 hexagonal spatial grid—was conceived and designed by the human team.
2. **AI-Assisted Acceleration:**
   - AI coding assistants (Claude Code / Google Antigravity) were used under human scientific direction to accelerate software implementation, statistical distribution modules (`scipy.stats.wasserstein_distance`, `scipy.stats.ks_2samp`, 2D spatial block bootstrap at 30 m / 60 m / 90 m scales), responsive React/Tailwind UI components (`TerrainDistributionPanel`, `LaAraucanaImpactPanel`), documentation structuring, and multilingual translation parity across Spanish (`es`), Portuguese (`pt`), and English (`en`).
   - All generated code, scientific equations, physical constants, and translations were reviewed and verified by the human team.
3. **Media & Branding Compliance:**
   - No NASA logos, mission patches, or trademarks were generated or modified using AI.
   - Scientific planetary imagery and terrain layers use the sources documented in the data provenance records. Decorative promotional artwork is identified separately below and must not be presented as scientific imagery or measured terrain.

## Decorative paper-cut backgrounds — 14 November 2026

### Paper-cut brand revision V2

OpenAI built-in `image_gen` was used via Codex to transform the original geometric CKEPI emblem into a transparent layered-paper symbol, under the user's art direction. The three open C-shaped bands and detached point were retained; colors were changed to warm salt ivory, pale sulfur and light copper. No institutional logo was used. The master is `frontend/public/img/ckepi/paper-cut/ckepi-symbol-paper-master.png`; derived WebP, hybrid SVG lockups and raster exports are in that brand directory. The lettering is programmatically drawn geometry. Home displays a separate visible `AI-generated · Ckepi` attribution with the generated logo. Monochrome and light vector-only variants remain available. The color system is an aesthetic proposal, not scientific data. Final team acceptance and visual review across devices remain pending.

- **Tool:** OpenAI built-in `image_gen`, operated through Codex under the user's art direction. The tool does not expose a model version in this session; no particular model version is claimed.
- **Scope:** Twelve independently generated decorative backgrounds: Home, The Problem, What CKEPI Does, The Finding, The Honest Limit, and Explorer; each has a landscape and portrait composition. The style is a handcrafted layered paper diorama. No scientific observations, measurements, discovered analogs or geometrically accurate planetary features are represented by this artwork.
- **Files:** `frontend/public/img/backgrounds/ckepi-{home,el-problema,que-hace-ckepi,el-hallazgo,el-limite-honesto,explorador}-{desktop,mobile}.webp`. Exact file sizes, export dimensions, original dimensions, and review notes are recorded in `manifest.json` in that directory. Prompts and source paths are recorded in `docs/design/paper-cut/prompts.json`; export code is in `scripts/assets/export_paper_cut_backgrounds.py`.
- **Processing:** Pillow was used only to fit the requested delivery dimensions and export compressed WebP files below 300,000 bytes. The generated originals are smaller than the requested delivery sizes; exported 2560×1440 and 1080×1920 files are resampled, not native-resolution generations.
- **Review:** Each selected image was visually reviewed for text, logos, people, flags, and planetary rings. A mobile Problem candidate with unwanted planets and a mobile Explorer candidate with warm colors were rejected and replaced.
- **Visible attribution:** The reusable `PaperCutBackground` component overlays the persistent text `AI-generated · Ckepi` using CSS, independently of the raster. Images must be used with this component or an equivalent visible attribution. Standalone redistribution or screenshots without that layer require adding the same visible attribution. The contact sheet includes visible attribution.
- **Integration status:** Assets and the component are prepared locally. Existing Home/Explorer consumers are not automatically replaced by this asset delivery. Final visual acceptance and adoption remain with the team; no deployment or push was performed for this delivery.

## Home intro video and logo in the product — 14 November 2026

- **Home video:** `frontend/public/media/ckepi-home.{webm,mp4}` and its two still frames are an AI-generated paper-cut animation (Google Gemini video generation, under the team's art direction; prompt in `docs/PROMPT_HOME_CKEPI.md`). It contains no NASA marks, people or flags. The Home shows a persistent «Video generado con IA / AI-generated video» label while the footage is visible; the audio track was removed and the files were re-encoded with ffmpeg.
- **Logo used in the product:** the app, favicon and Home use the **vector** V2 logo (`svg/ckepi-*-vector-dark.svg`, `icons/ckepi-vector-*.png`), drawn by code with the same geometry and the V2 «salt · copper · sulfur» colours. The AI-generated raster paper symbol described above is **not** used in the product, so the brand itself carries no AI imagery.
