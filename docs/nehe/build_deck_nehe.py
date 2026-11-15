"""Build Ckepi's 7-slide reference presentation (PPTX + PDF + HTML) in English (Global) and Spanish (Local Antofagasta / Caja La Araucana) using Brand Identity V2 ('Sal, cobre y azufre'), paper-cut backgrounds with mandatory visible AI watermark, and 100% compliance with all 3 rubrics."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

OUT_DIR = Path(__file__).resolve().parent
REPO_ROOT = OUT_DIR.parent.parent
BG_SRC_DIR = REPO_ROOT / "frontend" / "public" / "img" / "backgrounds"
BRAND_SRC_DIR = REPO_ROOT / "frontend" / "public" / "img" / "ckepi"
ASSETS_DIR = OUT_DIR / "brand_and_backgrounds"

# Brand Identity V2 ("Sal, cobre y azufre") Palette
C_MINERAL_NIGHT = (16, 31, 36)       # #101F24 - Base oscura y cristal
C_ROCK_INK = (24, 58, 58)            # #183A3A - Superficie / Tinta de roca
C_WARM_SALT = (255, 242, 215)        # #FFF2D7 - Nombre, títulos y capa exterior
C_PALE_SULFUR = (228, 237, 131)      # #E4ED83 - Acción principal, capa intermedia
C_LIGHT_COPPER = (232, 160, 128)     # #E8A080 - Capa interior y acento secundario
C_TEXT_BODY = (235, 228, 213)        # Crema suave legible sobre #101F24 (WCAG AA/AAA)
C_TEXT_MUTED = (186, 198, 195)       # Gris mineral claro
C_OK_GREEN = (134, 239, 172)         # Verde contraste para casos positivos
C_WARN_RED = (252, 165, 165)         # Coral claro para brecha física B y contraejemplos

SLIDE_BG_SCENES = [
    ("slide1_home", "ckepi-home-desktop.webp"),
    ("slide2_problema", "ckepi-el-problema-desktop.webp"),
    ("slide3_solucion", "ckepi-que-hace-ckepi-desktop.webp"),
    ("slide4_ciencia", "ckepi-explorador-desktop.webp"),
    ("slide5_hallazgo", "ckepi-el-hallazgo-desktop.webp"),
    ("slide6_araucana", "ckepi-el-limite-honesto-desktop.webp"),
    ("slide7_creditos", "ckepi-home-desktop.webp"),
]


def prepare_brand_and_background_assets() -> dict[str, Path]:
    """Copy Brand V2 assets and generate darkened 16:9 PNG slide backgrounds with visible AI watermark."""
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    paths: dict[str, Path] = {}

    # Copy key Brand V2 files into docs/nehe/brand_and_backgrounds/
    brand_files = {
        "logo_horiz_dark": BRAND_SRC_DIR / "png" / "ckepi-horizontal-color-dark.png",
        "logo_horiz_light": BRAND_SRC_DIR / "png" / "ckepi-horizontal-color-light.png",
        "logo_symbol_dark": BRAND_SRC_DIR / "png" / "ckepi-symbol-color-dark.png",
        "logo_vector_512": BRAND_SRC_DIR / "icons" / "ckepi-vector-512.png",
        "logo_vector_svg": BRAND_SRC_DIR / "svg" / "ckepi-horizontal-vector-dark.svg",
        "brand_board": BRAND_SRC_DIR / "CKEPI-brand-board.png",
        "identidad_v2_md": BRAND_SRC_DIR / "IDENTIDAD_V2.md",
        "tokens_json": BRAND_SRC_DIR / "tokens.json",
    }
    for key, src in brand_files.items():
        if src.exists():
            dst = ASSETS_DIR / src.name
            shutil.copy2(src, dst)
            paths[key] = dst

    # Generate 1920x1080 darkened slide backgrounds with #101F24 veil (84%) + visible AI watermark
    for key, filename in SLIDE_BG_SCENES:
        src_webp = BG_SRC_DIR / filename
        dst_raw = ASSETS_DIR / filename
        dst_veiled = ASSETS_DIR / f"{key}_ppt_bg.png"
        if src_webp.exists():
            shutil.copy2(src_webp, dst_raw)
            img = Image.open(src_webp).convert("RGBA").resize((1920, 1080), Image.Resampling.LANCZOS)
            # Apply Mineral Night (#101F24) veil at 84% opacity (214/255) for high WCAG AA contrast
            veil = Image.new("RGBA", img.size, (16, 31, 36, 214))
            composited = Image.alpha_composite(img, veil)

            # Draw subtle top/bottom mineral border & mandatory visible AI watermark badge in bottom-right
            draw = ImageDraw.Draw(composited)
            wm_text = "AI-generated background & symbol · Ckepi (Art direction: Lattices Team)"
            font = ImageFont.load_default()
            bbox = draw.textbbox((0, 0), wm_text, font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            pad_x, pad_y = 12, 6
            box_x1 = 1920 - tw - pad_x * 2 - 28
            box_y1 = 1080 - th - pad_y * 2 - 14
            box_x2 = 1920 - 28
            box_y2 = 1080 - 14
            draw.rounded_rectangle(
                [box_x1, box_y1, box_x2, box_y2],
                radius=6,
                fill=(16, 31, 36, 235),
                outline=(228, 237, 131, 140),
                width=1,
            )
            draw.text((box_x1 + pad_x, box_y1 + pad_y), wm_text, fill=(255, 242, 215, 235), font=font)

            composited.convert("RGB").save(dst_veiled, format="PNG", optimize=True)
            paths[key] = dst_veiled

    return paths


def load_metrics() -> dict[str, Any]:
    return json.loads((OUT_DIR / "pitch_verified_metrics.json").read_text(encoding="utf-8"))


def build_copy(m: dict[str, Any]) -> dict[str, dict[str, Any]]:
    counts = m["schema_counts"]
    atacama = m["atacama_cell"]
    iv = atacama["iv_similarity_breakdown"]

    return {
        "en": {
            "lang": "en",
            "badge_event": "NASA Space Apps Challenge 2026 · Identify Earth Locations that Analog Moon & Mars · Lattices Team",
            "s1_title": "CKEPI",
            "s1_subtitle": "Terrestrial Planetary Analog Discovery Engine via Causal Decomposition (X → Y ∥ B) & 30 m Common-Scale Spatial Statistics",
            "s1_tagline": (
                "“We do not seek to prove that Atacama is identical to Mars. We seek to show which "
                "characteristics it shares, which differences exist, and which new locations deserve "
                "to be studied using scientific evidence.”"
            ),
            "s1_caption": "Live prototype: 3D Mars/Moon WMTS globes + live H3 hover HUD + 30 m CTX/Copernicus DEM comparison",
            "s1_meta": "Open-Source · Apache License 2.0 · Brand V2: Salt, Copper & Sulfur · Zero NASA Logos",
            "s2_kicker": "01 · REAL PROBLEM, HUMAN IMPORTANCE & VALUE PROPOSITION",
            "s2_title": "Is the problem real and does it affect people? Yes—with scientific and educational impact",
            "s2_p1_title": "1. Is the Problem Real? (Scientific Gap)",
            "s2_p1_body": (
                "Yes. NASA recognizes terrestrial analogs are not fully characterized and opportunities exist to identify "
                "new sites. Visual resemblance or simple means mask critical differences in slope distributions, thermal inertia, "
                "radiation, pressure, and gravity."
            ),
            "s2_p2_title": "2. Does It Affect People? (Engineering & Educational Gap)",
            "s2_p2_body": (
                "Yes. It directly affects researchers and engineers preparing field trials, while specialist GIS tools exclude "
                "students, teachers, families, and people without scientific training or advanced digital literacy."
            ),
            "s2_aud_title": "3. Ckepi Value Proposition & Innovation Thesis",
            "s2_aud_body": (
                "Facilitate transparent scientific comparisons, guide preliminary screening, study under-characterized sectors of "
                "Antofagasta and other regions, and empower anyone to learn with real space data."
            ),
            "s3_kicker": "02 · DUAL-MODE INTERACTIVE SOLUTION & MOBILE-FIRST DEMO",
            "s3_title": "One scientific engine, two tailored experiences (320px Mobile to 4K Desktop)",
            "s3_flow": [
                (
                    "1. Explore 3D Globes & Intro",
                    "Layered paper-cut intro & hexagonal transition (HexField) into 3D Moon/Mars WMTS globes with live H3 hover HUD and 5 NASA ROIs.",
                ),
                (
                    "2. Compare X → Y & 30 m DEMs",
                    "Rank 12,193 cached Earth H3 cells (Res 2 & Res 3 + 7-child refinement) and inspect real 30 m slope/relief distributions.",
                ),
                (
                    "3. Explorer Mode & Voice Access",
                    "‘Three Worlds in Your Hand’ (Look → Compare → Investigate), Web Speech API voice readout, >= 44 px touch targets, ES/PT/EN (842 keys).",
                ),
            ],
            "s3_ui_card_title": "Verified Mobile-First UI & Brand V2 ('Salt, Copper & Sulfur')",
            "s3_ui_notes": (
                f"React 18 + TypeScript + MapLibre GL v6 (bundled WebWorker) + FastAPI + DuckDB ({counts['earth_h3_cells_total']:,} cached H3 cells: "
                "790 Res-2 & 11,403 Res-3) + SciPy 30 m DEM engine. Mineral Night (#101F24), Warm Salt (#FFF2D7), Pale Sulfur (#E4ED83) & Light Copper (#E8A080) "
                "glass UI (.ckepi-glass, WCAG AA verified in contrast-v2.json), 842 i18n keys, and CSV / GeoJSON / Markdown export."
            ),
            "s4_kicker": "03 · CAUSAL DECOMPOSITION (X → Y ∥ B) & PRECISION NASA OPEN DATA",
            "s4_title": "Separating geological substrate (X), climate response (Y), and irreducible boundaries (B)",
            "s4_x_title": f"{counts['independent_variables']} Independent Forcings (X · 0.60)",
            "s4_x_list": "Roughness, slope (°), thermal inertia (TIU), albedo, solar flux, subsurface ice, aridity, RH, UV index, LAI.",
            "s4_y_title": f"{counts['dependent_variables']} Dependent Responses (Y · 0.40)",
            "s4_y_list": "Diurnal ΔT (K), nocturnal cooling (K/hr), mean surface temp (°C), wind speed (m/s), aeolian dust, ice sublimation.",
            "s4_b_title": f"{counts['breakage_variables']} Irreducible Boundaries (B · R_break)",
            "s4_b_list": "Surface gravity (g), atmospheric pressure & composition (kPa CO2 / vacuum), and ionizing cosmic radiation (mSv/yr).",
            "s4_formula": "Combined = 0.60·S_ind + 0.40·S_dep (RidgeCV / RandomForest / PCA + 95% CI)  |  30 m Scale: W1 (m, °) + D_KS + 2D Block Bootstrap (95% CI)",
            "s4_sources_title": "Precision NASA & Partner Open Datasets (SPD-41a / FAIR Compliant)",
            "s4_sources": [
                (
                    "NASA Planetary (Measured & Orbital)",
                    "NASA MRO CTX / USGS Mars 2020 TRN CTX DEM Mosaic (20 m → 30 m), Perseverance MEDA, Curiosity REMS & RAD (~230 mSv/yr), LRO LOLA & Diviner, MGS MOLA, NASA Trek WMTS, NSSDCA Fact Sheet.",
                ),
                (
                    "NASA & Earth Partners (30 m & Global)",
                    "ESA Copernicus DEM GLO-30 (30 m UTM 19S · DLR/Airbus/ESA), NASA POWER v2.5, Earthdata CMR/GIBS, Open-Meteo ERA5-Land, ISRIC SoilGrids v2.0, Macrostrat, CSA RADARSAT, JAXA.",
                ),
            ],
            "s5_kicker": "04 · REAL 30 m DEM PROOF: WHAT MATCHES, WHAT FAILS & WHY (B)",
            "s5_title": "Real 30 m Comparison: Jezero Crater (Mars CTX DEM) ↔ Antofagasta (Copernicus GLO-30)",
            "s5_match_title": "Real 30 m DEM (6×6 km, 2D Block Bootstrap) & H3 Verification",
            "s5_metrics": [
                ("✅ Positive Match (Cell 83b224fffffffff)", "W1 = 0.54° [95% CI 0.40°–0.65°], D_KS = 0.15"),
                ("✅ Scale Sensitivity (30 m → 60 m → 90 m)", "W1 = 0.54° (30m) · 0.40° (60m) · 0.27° (90m)"),
                ("✅ Local Relief Match (30 m Window)", "W1 = 1.8 m [95% CI 1.3–2.3 m], D_KS = 0.13"),
                ("⚖️ Beats Classic Yungay Control (30 m)", "Yungay W1 = 3.32° (P90 = 15.11° vs Jezero 4.74°)"),
                ("❌ Counterexample 1: 83b221fffffffff", "W1 = 6.92°, D_KS = 0.67 (Too steep: P50 = 7.89°)"),
                ("❌ Counterexample 2: 83b225fffffffff", "W1 = 1.71°, D_KS = 0.82 (Too flat: P50 = 0.19°)"),
            ],
            "s5_brk_title": f"Irreducible Physical Gap B (Never Reproducible on Earth · R_break = {atacama['r_break_overall']:.3f})",
            "s5_brk_rows": [
                ("Surface Gravity", "0.38 g (Mars) / 0.166 g (Moon)", "1.00 g (Earth · 2.6× Mars / 6× Moon)"),
                ("Atmosphere / Pressure", "~0.6 kPa CO2 (~6–8 mbar) / 0 kPa", "101.3 kPa N2/O2 (~80.7 kPa at 2,450 m)"),
                ("Ionizing Radiation", "~230 mSv/yr (Mars RAD) / ~380 (Moon)", "~2.4 mSv/yr Earth (~96×–158× higher)"),
                ("Thermal Swing (ΔT)", "-59 to -65 °C Mars / ΔT ~290 K Moon", "15 °C mean Earth (ΔT ~28 K Atacama)"),
            ],
            "s5_honesty": (
                f"H3 Macro Match (Yungay {atacama['earth_cell_h3']}): Aridity {iv['aridity_index']:.3f}, Albedo {iv['surface_albedo']:.3f}, "
                f"Combined {atacama['combined_score']:.3f} [{atacama['confidence_interval'][0]:.3f}–{atacama['confidence_interval'][1]:.3f}]. "
                "Valid in Atacama: optical/albedo calibration & 30 m rover mobility. Invalid outdoors: parachutes, convective heat, GCR shielding. Pre-selection only, not safety certification."
            ),
            "s6_kicker": "05 · CAJA LA ARAUCANA 4 STRATEGIC AXES, UN SDGs & SUSTAINABILITY",
            "s6_title": "Territorial Impact from Antofagasta & Open-Science Sustainability Hypothesis",
            "s6_sus_title": "4 Caja La Araucana Objectives & Verified UN SDGs",
            "s6_sus_items": [
                "1. Democratize Frontier Science (SDG 4.3): Free browser access + voice-guided ‘Three Worlds for Everyone’ mode for students, families, and seniors.",
                "2. STEAM Skills & Employability (SDG 4.4, 8): Open Python/FastAPI/DuckDB/H3/React stack with real orbital telemetry for technical & university training.",
                "3. Local Territorial Application (SDG 9.5, 10, 13): Identifies new under-characterized Antofagasta sites (Cell 83b224fffffffff beats classic Yungay at 30 m).",
                "4. Interregional Innovation Network ‘Lattices’ (SDG 17.3, 17.16, 17.17): Connects Antofagasta with universities, schools, libraries, and global open science.",
            ],
            "s6_sdg_title": "Sustainability Model (Hypothesis to Validate) & Roadmap",
            "s6_sdg_items": [
                "100% Free & Open Core (Apache License 2.0): Web platform, datasets, and educational mode remain permanently free without login.",
                "Institutional Hypothesis (To Validate): Municipalities, libraries, universities, and social funds sponsor guided STEAM workshops, print card kits, and regional site reports (no unverified revenue or signed contracts claimed).",
                "Engineering Roadmap: Complete remaining 1,403 Res-3 ERA5 cells (10,000/11,403 cached), expand 30 m CTX/LOLA strips, and run school/community trials.",
            ],
            "s7_kicker": "06 · OPEN SCIENCE LEGAL CREDITS, BRAND V2 & MANDATORY AI DISCLOSURE",
            "s7_title": "Full Legal Attribution (SPD-41a / FAIR), Brand V2 & AI Watermarking",
            "s7_credits_title": "Legal Open Science Citations & Brand Identity V2 ('Salt, Copper & Sulfur')",
            "s7_credits": (
                "• Code License: Apache License 2.0 (OSI-approved).\n"
                "• NASA Open Data (17 U.S.C. § 105 Public Domain, text credit only, zero NASA logos): MRO CTX / USGS Mars 2020 TRN DEM (20 m), Mars 2020 MEDA, MSL REMS/RAD, LRO LOLA/Diviner, MGS MOLA, NASA POWER v2.5, NASA Trek WMTS, NSSDCA.\n"
                "• Partner Data: ESA Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 & Airbus Defence and Space GmbH 2014-2018 under COPERNICUS by EU & ESA), ERA5-Land, ISRIC SoilGrids v2.0 (CC BY 4.0), Macrostrat (CC BY 4.0).\n"
                "• Typography, Icons & Brand V2: System UI Stack + JetBrains Mono (SIL OFL 1.1) + Lucide Icons (ISC/MIT). Brand V2 Palette: Mineral Night #101F24, Rock Ink #183A3A, Warm Salt #FFF2D7, Pale Sulfur #E4ED83, Light Copper #E8A080."
            ),
            "s7_ai_title": "Complete AI (Super Intelligence) & Watermark Declaration (AI_DISCLOSURE.md)",
            "s7_ai_body": (
                "• 100% Human Scientific Conception: Causal decomposition (X → Y ∥ B), 30 m DEM statistical pipeline, and territorial thesis are 100% original human work.\n"
                "• Code & i18n Assistance: Claude Code, OpenAI Codex/GPT, and Gemini assisted with code, tests, docs, and ES/PT/EN parity (842 keys) under human verification.\n"
                "• Visual AI & Mandatory Visible Watermarks: Scientific maps, 3D globes, DEM plots, and the app's vector logo (ckepi-*-vector-dark.svg) contain ZERO generative AI. The 12 decorative paper-cut backgrounds & raster paper symbol (OpenAI image_gen via Codex) display ‘AI-generated · Ckepi’, and the Home intro video (Google Gemini) displays a persistent ‘AI-generated video’ watermark."
            ),
            "s7_links": "Public Repo: https://github.com/AnGeMoNs/Ckepi  ·  Docs & 30 m Proof: docs/nehe/ & docs/RESULTADOS_TERRENO_REALES.md  ·  Team: Lattices (Antofagasta)",
            "s7_closing": "“With Ckepi, a resemblance sparks curiosity; 30-meter scientific evidence teaches us how far it truly goes.”",
        },
        "es": {
            "lang": "es",
            "badge_event": "NASA Space Apps Challenge 2026 · Sede Antofagasta & Caja La Araucana · Equipo Lattices",
            "s1_title": "CKEPI",
            "s1_subtitle": "Motor de Descubrimiento de Análogos Planetarios por Descomposición Causal (X → Y ∥ B) y Estadística Espacial a Escala Común de 30 m",
            "s1_tagline": (
                "“No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué "
                "características comparte, qué diferencias existen y qué nuevos lugares merecen "
                "ser estudiados utilizando evidencia científica.”"
            ),
            "s1_caption": "Prototipo en vivo: globos 3D Marte/Luna WMTS + HUD H3 en vivo + comparación real DEM a 30 m",
            "s1_meta": "Ciencia Abierta · Apache License 2.0 · Identidad V2: Sal, Cobre y Azufre · Cero Logos NASA",
            "s2_kicker": "01 · PROBLEMA REAL, IMPORTANCIA HUMANA Y PROPUESTA DE VALOR",
            "s2_title": "¿El problema es real y afecta a las personas? Sí: en la ciencia y en la educación",
            "s2_p1_title": "1. ¿El Problema es Real? (Brecha Científica)",
            "s2_p1_body": (
                "Sí. NASA reconoce que los análogos terrestres no están completamente caracterizados y que existen oportunidades "
                "para identificar nuevos lugares útiles. Comparar requiere integrar datos y comprender las limitaciones de cada terreno."
            ),
            "s2_p2_title": "2. ¿Es Importante y Afecta a las Personas? (Investigación y Educación)",
            "s2_p2_body": (
                "Sí. Afecta a investigadores e ingenieros que preparan ensayos de campo, y abre una oportunidad educativa: "
                "acercar estos conocimientos a estudiantes y personas sin experiencia científica mediante herramientas accesibles."
            ),
            "s2_aud_title": "3. Propuesta de Valor e Innovación desde Antofagasta",
            "s2_aud_body": (
                "Facilitar comparaciones científicas transparentes, orientar investigaciones preliminares, estudiar sectores poco "
                "caracterizados de Antofagasta y otras regiones, y permitir que más personas aprendan con datos espaciales reales."
            ),
            "s3_kicker": "02 · SOLUCIÓN INTERACTIVA DUAL Y DEMO MOBILE-FIRST (320px → 4K)",
            "s3_title": "Un mismo motor científico con dos modos para todo público",
            "s3_flow": [
                (
                    "1. Intro Paper-Cut y Globos 3D",
                    "Intro en capas de papel y transición hexagonal (HexField) hacia globos 3D de Luna y Marte con HUD H3 en vivo y 5 sitios NASA curados.",
                ),
                (
                    "2. Comparar X → Y y DEM 30 m",
                    "Ordena 12.193 celdas H3 en caché (Res 2 y Res 3 + refinamiento a 7 hijas) y compara distribuciones reales de pendiente y relieve a 30 m.",
                ),
                (
                    "3. Modo Explorador y Voz",
                    "‘Tres Mundos en tu Mano’ (Mirar → Comparar → Investigar), lectura por voz Web Speech API, botones >= 44 px y paridad ES/PT/EN (842 claves).",
                ),
            ],
            "s3_ui_card_title": "Arquitectura Mobile-First e Identidad V2 («Sal, Cobre y Azufre»)",
            "s3_ui_notes": (
                f"React 18 + TypeScript + MapLibre GL v6 (WebWorker integrado) + FastAPI + DuckDB ({counts['earth_h3_cells_total']:,} celdas H3 en caché: "
                "790 Res-2 y 11.403 Res-3) + motor estadístico SciPy a 30 m. Superficies de cristal (.ckepi-glass) en Noche Mineral (#101F24), Sal Cálida (#FFF2D7), "
                "Azufre Pálido (#E4ED83) y Cobre Luminoso (#E8A080) con contraste WCAG AA verificado (contrast-v2.json) y exportación CSV / GeoJSON / Markdown."
            ),
            "s4_kicker": "03 · DESCOMPOSICIÓN CAUSAL (X → Y ∥ B) Y DATOS ABIERTOS NASA CON PRECISIÓN",
            "s4_title": "Separando sustrato geológico (X), respuesta climática (Y) y brecha física (B)",
            "s4_x_title": f"{counts['independent_variables']} Forzamientos Independientes (X · 0.60)",
            "s4_x_list": "Rugosidad, pendiente (°), inercia térmica (TIU), albedo, flujo solar, hielo subsuperficial, aridez, HR, UV, LAI.",
            "s4_y_title": f"{counts['dependent_variables']} Respuestas Dependientes (Y · 0.40)",
            "s4_y_list": "Amplitud térmica ΔT (K), enfriamiento nocturno (K/h), temp. media (°C), viento (m/s), polvo eólico, sublimación.",
            "s4_b_title": f"{counts['breakage_variables']} Brecha Física Irreducible (B · R_break)",
            "s4_b_list": "Gravedad superficial (g), presión y atmósfera (kPa CO2 / vacío) y radiación cósmica ionizante (mSv/año).",
            "s4_formula": "Combinado = 0.60·S_ind + 0.40·S_dep (RidgeCV / RandomForest / PCA + IC 95%)  |  Escala 30 m: W1 (m, °) + D_KS + Bootstrap 2D (IC 95%)",
            "s4_sources_title": "Datasets Reales NASA y Socios con Precisión (Cumplimiento SPD-41a / FAIR)",
            "s4_sources": [
                (
                    "NASA Planetario (Medido y Orbital)",
                    "NASA MRO CTX / USGS Mars 2020 TRN CTX DEM Mosaic (20 m → 30 m), Perseverance MEDA, Curiosity REMS y RAD (~230 mSv/año), LRO LOLA y Diviner, MGS MOLA, NASA Trek WMTS, NSSDCA.",
                ),
                (
                    "NASA y Socios Tierra (30 m y Global)",
                    "ESA Copernicus DEM GLO-30 (30 m UTM 19S · DLR/Airbus/ESA), NASA POWER v2.5, Earthdata CMR/GIBS, Open-Meteo ERA5-Land, ISRIC SoilGrids v2.0, Macrostrat, CSA RADARSAT, JAXA.",
                ),
            ],
            "s5_kicker": "04 · PRUEBA REAL A 30 m: QUÉ SÍ SE PARECE, QUÉ NO Y POR QUÉ (B)",
            "s5_title": "Comparación Real a 30 m: Cráter Jezero (Marte CTX DEM) ↔ Antofagasta (Copernicus GLO-30)",
            "s5_match_title": "DEM Real a 30 m (Ventanas 6×6 km, Bootstrap 2D) y Verificación H3",
            "s5_metrics": [
                ("✅ Caso Positivo (Celda 83b224fffffffff)", "W1 = 0.54° [IC 95% 0.40°–0.65°], D_KS = 0.15"),
                ("✅ Sensibilidad Escala (30 m → 60 m → 90 m)", "W1 = 0.54° (30m) · 0.40° (60m) · 0.27° (90m)"),
                ("✅ Relieve Local a 30 m (m)", "W1 = 1.8 m [IC 95% 1.3–2.3 m], D_KS = 0.13"),
                ("⚖️ Supera al Control Yungay a 30 m", "Yungay W1 = 3.32° (P90 = 15.11° vs Jezero 4.74°)"),
                ("❌ Caso Negativo 1: 83b221fffffffff", "W1 = 6.92°, D_KS = 0.67 (Muy abrupta: P50 = 7.89°)"),
                ("❌ Caso Negativo 2: 83b225fffffffff", "W1 = 1.71°, D_KS = 0.82 (Muy plana: P50 = 0.19°)"),
            ],
            "s5_brk_title": f"Brecha Física Irreducible B (Jamás Reproducible en la Tierra · R_break = {atacama['r_break_overall']:.3f})",
            "s5_brk_rows": [
                ("Gravedad Superficial", "0.38 g (Marte) / 0.166 g (Luna)", "1.00 g (Tierra · 2.6× Marte / 6× Luna)"),
                ("Atmósfera y Presión", "~0.6 kPa CO2 (~6–8 mbar) / 0 kPa", "101.3 kPa N2/O2 (~80.7 kPa a 2.450 m)"),
                ("Radiación Ionizante", "~230 mSv/año (Marte RAD) / ~380 (Luna)", "~2.4 mSv/año Tierra (~96×–158× mayor)"),
                ("Oscilación Térmica (ΔT)", "-59 a -65 °C Marte / ΔT ~290 K Luna", "15 °C media Tierra (ΔT ~28 K Atacama)"),
            ],
            "s5_honesty": (
                f"Similitud Macro H3 (Yungay {atacama['earth_cell_h3']}): Aridez {iv['aridity_index']:.3f}, Albedo {iv['surface_albedo']:.3f}, "
                f"Combinado {atacama['combined_score']:.3f} [{atacama['confidence_interval'][0]:.3f}–{atacama['confidence_interval'][1]:.3f}]. "
                "Válido en Atacama: calibración óptica/albedo y movilidad rover a 30 m. Inválido al aire libre: paracaídas, convección térmica y blindaje GCR. Preselección científica, no certificación."
            ),
            "s6_kicker": "05 · 4 EJES CAJA LA ARAUCANA, ODS ONU Y SOSTENIBILIDAD",
            "s6_title": "Impacto Territorial desde Antofagasta y Modelo de Sostenibilidad Abierto",
            "s6_sus_title": "Los 4 Ejes de Caja La Araucana y Metas ODS Verificadas",
            "s6_sus_items": [
                "1. Democratizar Ciencia de Frontera (ODS 4.3): Acceso web gratuito + modo guiado por voz ‘Tres Mundos para Todos’ para estudiantes, familias y personas mayores.",
                "2. Habilidades STEAM y Empleabilidad (ODS 4.4, 8): Stack abierto Python/FastAPI/DuckDB/H3/React con telemetría orbital real para formación técnico-profesional y universitaria.",
                "3. Aplicación Local en Antofagasta (ODS 9.5, 10, 13): Descubre sectores poco caracterizados de nuestra región (la celda 83b224fffffffff supera a Yungay clásico a 30 m).",
                "4. Red Interregional ‘Lattices’ (ODS 17.3, 17.16, 17.17): Conecta Antofagasta con universidades, liceos, bibliotecas y la comunidad global de ciencia abierta.",
            ],
            "s6_sdg_title": "Modelo de Sostenibilidad (Hipótesis por Validar) y Hoja de Ruta",
            "s6_sdg_items": [
                "Núcleo 100 % Gratuito y Abierto (Apache License 2.0): El software, los datos y el modo educativo permanecen abiertos sin barreras de pago ni inicio de sesión.",
                "Hipótesis Institucional (Por Validar): Municipios, bibliotecas, universidades y fondos sociales financian talleres STEAM guiados, kits de cartas impresas y reportes territoriales (sin afirmar ventas ni convenios cerrados aún).",
                "Hoja de Ruta: Completar las 1.403 celdas Res-3 ERA5 restantes (10.000/11.403 en caché), ampliar franjas DEM 30 m y validar en aula y terreno.",
            ],
            "s7_kicker": "06 · CRÉDITOS LEGALES OPEN SCIENCE, IDENTIDAD V2 Y DECLARACIÓN DE IA",
            "s7_title": "Atribución Legal (SPD-41a / FAIR), Identidad V2 y Marca de Agua IA",
            "s7_credits_title": "Citas Legales Open Science e Identidad V2 («Sal, Cobre y Azufre»)",
            "s7_credits": (
                "• Licencia de Código: Apache License 2.0 (aprobada por OSI).\n"
                "• Datos Abiertos NASA (17 U.S.C. § 105 Dominio Público, solo texto, cero logos NASA): MRO CTX / USGS Mars 2020 TRN DEM (20 m), Mars 2020 MEDA, MSL REMS/RAD, LRO LOLA/Diviner, MGS MOLA, NASA POWER v2.5, NASA Trek WMTS, NSSDCA.\n"
                "• Datos Socios: ESA Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 y Airbus Defence and Space GmbH 2014-2018 bajo COPERNICUS por UE y ESA), ERA5-Land, ISRIC SoilGrids v2.0 (CC BY 4.0), Macrostrat (CC BY 4.0).\n"
                "• Tipografía, Íconos e Identidad V2: System UI Stack + JetBrains Mono (SIL OFL 1.1) + Lucide Icons (ISC/MIT). Paleta V2: Noche Mineral #101F24, Tinta de Roca #183A3A, Sal Cálida #FFF2D7, Azufre Pálido #E4ED83, Cobre Luminoso #E8A080."
            ),
            "s7_ai_title": "Declaración Completa de IA y Marca de Agua Obligatoria (AI_DISCLOSURE.md)",
            "s7_ai_body": (
                "• Concepción Científica 100 % Humana: La descomposición causal (X → Y ∥ B), la metodología estadística DEM a 30 m y la tesis territorial son 100 % autoría humana.\n"
                "• Asistencia en Código e i18n: Claude Code, OpenAI Codex/GPT y Gemini asistieron en código, tests, documentación y paridad ES/PT/EN (842 claves) bajo revisión humana.\n"
                "• IA Visual y Marcas de Agua Visibles: Los mapas científicos, globos 3D, gráficos DEM y el logo vectorial de la app (ckepi-*-vector-dark.svg) tienen CERO IA generativa. Los 12 fondos decorativos paper-cut y el símbolo raster de papel (OpenAI image_gen vía Codex) llevan marca visible ‘AI-generated · Ckepi’, y el video intro del Home (Google Gemini) lleva marca persistente ‘Video generado con IA / AI-generated video’."
            ),
            "s7_links": "Repositorio Público: https://github.com/AnGeMoNs/Ckepi  ·  Dossier y Prueba 30 m: docs/nehe/ y docs/RESULTADOS_TERRENO_REALES.md  ·  Equipo: Lattices (Antofagasta)",
            "s7_closing": "“Con Ckepi, una semejanza despierta la curiosidad; la evidencia científica a 30 metros nos enseña hasta dónde llega.”",
        },
    }


def render_html(c: dict[str, Any], assets: dict[str, Path]) -> str:
    shot_mars = (OUT_DIR / "shot_explorer_mars.png").as_uri()
    shot_analysis = (OUT_DIR / "shot_atacama_analysis.png").as_uri()
    shot_moon = (OUT_DIR / "shot_explorer_moon.png").as_uri()
    logo_horiz = assets["logo_horiz_dark"].as_uri()
    bg1 = assets["slide1_home"].as_uri()
    bg2 = assets["slide2_problema"].as_uri()
    bg3 = assets["slide3_solucion"].as_uri()
    bg4 = assets["slide4_ciencia"].as_uri()
    bg5 = assets["slide5_hallazgo"].as_uri()
    bg6 = assets["slide6_araucana"].as_uri()
    bg7 = assets["slide7_creditos"].as_uri()

    flow_html = "".join(
        f'<div class="card"><div class="card-title copper">{t}</div><p>{b}</p></div>'
        for t, b in c["s3_flow"]
    )
    sources_html = "".join(
        f'<div class="source-row"><span class="badge">{k}</span><span>{v}</span></div>'
        for k, v in c["s4_sources"]
    )
    metrics_html = "".join(
        f'<div class="metric"><div class="m-label">{k}</div><div class="m-val">{v}</div></div>'
        for k, v in c["s5_metrics"]
    )
    brk_html = "".join(
        f'<tr><td>{var}</td><td class="warn">{mars}</td><td>{earth}</td></tr>'
        for var, mars, earth in c["s5_brk_rows"]
    )
    sus_html = "".join(f"<li>{item}</li>" for item in c["s6_sus_items"])
    sdg_html = "".join(f"<li>{item}</li>" for item in c["s6_sdg_items"])
    credits_lines = "<br/>".join(c["s7_credits"].split("\n"))
    ai_lines = "<br/>".join(c["s7_ai_body"].split("\n"))

    return f"""<!doctype html>
<html lang="{c['lang']}">
<head>
<meta charset="utf-8" />
<title>{c['s1_title']} — {c['badge_event']}</title>
<style>
  @page {{ size: 13.333in 7.5in; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
    background: #101F24;
    color: #FFF2D7;
  }}
  .slide {{
    width: 13.333in;
    height: 7.5in;
    padding: 0.44in 0.58in;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    background-color: #101F24;
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .slide:last-child {{ page-break-after: auto; }}
  .topbar {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }}
  .brand-logo-sm {{
    height: 36px;
    width: auto;
    object-fit: contain;
  }}
  .brand-logo-lg {{
    height: 68px;
    width: auto;
    object-fit: contain;
    margin-bottom: 10px;
  }}
  .kicker {{
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #E4ED83;
    margin-bottom: 4px;
  }}
  h1 {{ font-size: 48px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; color: #FFF2D7; }}
  h2 {{ font-size: 27px; font-weight: 750; line-height: 1.16; margin-bottom: 10px; color: #FFF2D7; }}
  .pill {{
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(24, 58, 58, 0.9);
    border: 1px solid rgba(228, 237, 131, 0.45);
    color: #E4ED83;
    font-size: 12px;
    font-weight: 600;
  }}
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: stretch; }}
  .grid-3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }}
  .grid-hero {{ display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 24px; align-items: center; flex: 1; }}
  .card {{
    background: rgba(16, 31, 36, 0.92);
    border: 1px solid rgba(255, 242, 215, 0.22);
    border-radius: 14px;
    padding: 14px 18px;
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.38);
  }}
  .card-title {{ font-size: 15.5px; font-weight: 700; margin-bottom: 6px; color: #FFF2D7; }}
  .copper {{ color: #E8A080; }}
  .sulfur {{ color: #E4ED83; }}
  .danger {{ color: #fca5a5; }}
  .ok {{ color: #86efac; }}
  p, li {{ font-size: 13.2px; line-height: 1.43; color: #EBE4D5; }}
  ul {{ padding-left: 18px; }}
  li {{ margin-bottom: 7px; }}
  .tagline {{
    font-size: 16.5px;
    line-height: 1.42;
    color: #FFF2D7;
    background: rgba(24, 58, 58, 0.78);
    border-left: 4px solid #E4ED83;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 14px 0;
  }}
  .shot {{
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(255, 242, 215, 0.28);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
    object-fit: cover;
  }}
  .shot-tall {{ height: 4.15in; object-position: top center; }}
  .shot-med {{ height: 3.2in; object-position: top center; }}
  .caption {{ font-size: 11.5px; color: #BAC6C3; margin-top: 6px; text-align: center; }}
  .footer {{
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #BAC6C3;
    border-top: 1px solid rgba(255, 242, 215, 0.16);
    padding-top: 6px;
  }}
  .badge {{
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    background: rgba(232, 160, 128, 0.2);
    color: #E8A080;
    font-weight: 700;
    font-size: 11.5px;
    margin-right: 10px;
    white-space: nowrap;
  }}
  .source-row {{ display: flex; align-items: baseline; margin-top: 7px; font-size: 12.8px; color: #EBE4D5; }}
  .formula {{
    margin-top: 9px;
    padding: 9px 14px;
    border-radius: 10px;
    background: rgba(24, 58, 58, 0.9);
    border: 1px solid rgba(228, 237, 131, 0.4);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px;
    color: #E4ED83;
  }}
  .metrics-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }}
  .metric {{
    background: rgba(24, 58, 58, 0.78);
    border-radius: 9px;
    padding: 7px 10px;
    border: 1px solid rgba(255, 242, 215, 0.18);
  }}
  .m-label {{ font-size: 11px; color: #BAC6C3; font-weight: 600; }}
  .m-val {{ font-size: 13px; font-weight: 750; color: #E4ED83; margin-top: 2px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.2px; }}
  th, td {{ padding: 6px 8px; border-bottom: 1px solid rgba(255, 242, 215, 0.16); text-align: left; color: #EBE4D5; }}
  th {{ color: #FFF2D7; }}
  td.warn {{ color: #E8A080; font-weight: 700; }}
  .honesty-box {{
    margin-top: 9px;
    padding: 9px 14px;
    border-radius: 10px;
    background: rgba(24, 58, 58, 0.92);
    border: 1px solid rgba(232, 160, 128, 0.5);
    font-size: 12.2px;
    color: #FFF2D7;
  }}
  .closing {{
    font-size: 18px;
    font-weight: 700;
    text-align: center;
    color: #FFF2D7;
    padding: 10px 18px;
    border-radius: 12px;
    background: rgba(24, 58, 58, 0.92);
    border: 1px solid rgba(228, 237, 131, 0.45);
  }}
</style>
</head>
<body>

<!-- SLIDE 1 -->
<section class="slide" style="background-image: url('{bg1}');">
  <div class="topbar">
    <span class="pill">{c['badge_event']}</span>
    <img class="brand-logo-sm" src="{logo_horiz}" alt="CKEPI Brand V2 Logo" />
  </div>
  <div class="grid-hero">
    <div>
      <img class="brand-logo-lg" src="{logo_horiz}" alt="CKEPI Logo" />
      <p style="font-size:17.5px; color:#E8A080; margin-top:4px; font-weight:650;">{c['s1_subtitle']}</p>
      <div class="tagline">{c['s1_tagline']}</div>
      <p style="font-size:12.5px; color:#E4ED83; font-weight:600;">{c['s1_meta']}</p>
    </div>
    <div>
      <img class="shot shot-tall" src="{shot_mars}" alt="Ckepi 3D Explorer" />
      <div class="caption">{c['s1_caption']}</div>
    </div>
  </div>
  <div class="footer"><span>Ckepi · 1 / 7 · Brand V2 (Salt · Copper · Sulfur)</span><span>NASA Space Apps Challenge 2026</span></div>
</section>

<!-- SLIDE 2 -->
<section class="slide" style="background-image: url('{bg2}');">
  <div class="topbar">
    <div>
      <div class="kicker">{c['s2_kicker']}</div>
      <h2>{c['s2_title']}</h2>
    </div>
    <img class="brand-logo-sm" src="{logo_horiz}" alt="CKEPI Logo" />
  </div>
  <div class="grid-2" style="flex:1; align-items:center;">
    <div style="display:flex; flex-direction:column; gap:11px;">
      <div class="card">
        <div class="card-title copper">{c['s2_p1_title']}</div>
        <p>{c['s2_p1_body']}</p>
      </div>
      <div class="card">
        <div class="card-title sulfur">{c['s2_p2_title']}</div>
        <p>{c['s2_p2_body']}</p>
      </div>
      <div class="card">
        <div class="card-title ok">{c['s2_aud_title']}</div>
        <p>{c['s2_aud_body']}</p>
      </div>
    </div>
    <div>
      <img class="shot shot-tall" src="{shot_moon}" alt="Moon Shackleton Explorer" />
      <div class="caption">Moon South Pole (Shackleton Crater) · NASA LRO WAC / LOLA Trek WMTS</div>
    </div>
  </div>
  <div class="footer"><span>Ckepi · 2 / 7</span><span>{c['s2_kicker']}</span></div>
</section>

<!-- SLIDE 3 -->
<section class="slide" style="background-image: url('{bg3}');">
  <div class="topbar">
    <div>
      <div class="kicker">{c['s3_kicker']}</div>
      <h2>{c['s3_title']}</h2>
    </div>
    <img class="brand-logo-sm" src="{logo_horiz}" alt="CKEPI Logo" />
  </div>
  <div class="grid-3">{flow_html}</div>
  <div class="grid-2" style="margin-top:12px; align-items:center;">
    <img class="shot shot-med" src="{shot_analysis}" alt="Causal Decomposition & Matrix" />
    <div class="card" style="height:100%; display:flex; flex-direction:column; justify-content:center;">
      <div class="card-title sulfur">{c['s3_ui_card_title']}</div>
      <p>{c['s3_ui_notes']}</p>
    </div>
  </div>
  <div class="footer"><span>Ckepi · 3 / 7</span><span>{c['s3_kicker']}</span></div>
</section>

<!-- SLIDE 4 -->
<section class="slide" style="background-image: url('{bg4}');">
  <div class="topbar">
    <div>
      <div class="kicker">{c['s4_kicker']}</div>
      <h2>{c['s4_title']}</h2>
    </div>
    <img class="brand-logo-sm" src="{logo_horiz}" alt="CKEPI Logo" />
  </div>
  <div class="grid-3">
    <div class="card">
      <div class="card-title sulfur">{c['s4_x_title']}</div>
      <p>{c['s4_x_list']}</p>
    </div>
    <div class="card">
      <div class="card-title copper">{c['s4_y_title']}</div>
      <p>{c['s4_y_list']}</p>
    </div>
    <div class="card">
      <div class="card-title danger">{c['s4_b_title']}</div>
      <p>{c['s4_b_list']}</p>
    </div>
  </div>
  <div class="formula">{c['s4_formula']}</div>
  <div class="card" style="margin-top:8px;">
    <div class="card-title">{c['s4_sources_title']}</div>
    {sources_html}
  </div>
  <div class="footer"><span>Ckepi · 4 / 7</span><span>{c['s4_kicker']}</span></div>
</section>

<!-- SLIDE 5 -->
<section class="slide" style="background-image: url('{bg5}');">
  <div class="topbar">
    <div>
      <div class="kicker">{c['s5_kicker']}</div>
      <h2>{c['s5_title']}</h2>
    </div>
    <img class="brand-logo-sm" src="{logo_horiz}" alt="CKEPI Logo" />
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title ok">{c['s5_match_title']}</div>
      <div class="metrics-grid">{metrics_html}</div>
    </div>
    <div class="card">
      <div class="card-title copper">{c['s5_brk_title']}</div>
      <table>
        <thead><tr><th>Variable</th><th>Mars / Moon</th><th>Earth (Atacama)</th></tr></thead>
        <tbody>{brk_html}</tbody>
      </table>
    </div>
  </div>
  <div class="honesty-box">{c['s5_honesty']}</div>
  <div class="footer"><span>Ckepi · 5 / 7</span><span>{c['s5_kicker']}</span></div>
</section>

<!-- SLIDE 6 -->
<section class="slide" style="background-image: url('{bg6}');">
  <div class="topbar">
    <div>
      <div class="kicker">{c['s6_kicker']}</div>
      <h2>{c['s6_title']}</h2>
    </div>
    <img class="brand-logo-sm" src="{logo_horiz}" alt="CKEPI Logo" />
  </div>
  <div class="grid-2" style="flex:1; align-items:center;">
    <div class="card" style="height:100%;">
      <div class="card-title sulfur">{c['s6_sus_title']}</div>
      <ul>{sus_html}</ul>
    </div>
    <div class="card" style="height:100%;">
      <div class="card-title copper">{c['s6_sdg_title']}</div>
      <ul>{sdg_html}</ul>
    </div>
  </div>
  <div class="footer"><span>Ckepi · 6 / 7</span><span>{c['s6_kicker']}</span></div>
</section>

<!-- SLIDE 7 -->
<section class="slide" style="background-image: url('{bg7}');">
  <div class="topbar">
    <div>
      <div class="kicker">{c['s7_kicker']}</div>
      <h2>{c['s7_title']}</h2>
    </div>
    <img class="brand-logo-sm" src="{logo_horiz}" alt="CKEPI Logo" />
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title sulfur">{c['s7_credits_title']}</div>
      <p style="font-size:12px; line-height:1.4;">{credits_lines}</p>
    </div>
    <div class="card">
      <div class="card-title copper">{c['s7_ai_title']}</div>
      <p style="font-size:12px; line-height:1.4;">{ai_lines}</p>
    </div>
  </div>
  <div class="card" style="text-align:center; font-size:13px; color:#FFF2D7; padding:9px 14px;">{c['s7_links']}</div>
  <div class="closing">{c['s7_closing']}</div>
  <div class="footer"><span>Ckepi · 7 / 7</span><span>{c['s7_kicker']}</span></div>
</section>

</body>
</html>"""


def _apply_slide_bg_and_logo(slide: Any, bg_path: Path, logo_path: Path, show_top_right_logo: bool = True) -> None:
    """Insert the 16:9 paper-cut background (with #101F24 veil & visible AI watermark) and the Brand V2 logo."""
    slide.shapes.add_picture(str(bg_path), Inches(0), Inches(0), width=Inches(13.333), height=Inches(7.5))
    if show_top_right_logo and logo_path.exists():
        slide.shapes.add_picture(str(logo_path), Inches(11.15), Inches(0.32), width=Inches(1.55))


def _add_textbox(
    slide: Any,
    left: float,
    top: float,
    width: float,
    height: float,
    text: str,
    size: int = 15,
    bold: bool = False,
    color: tuple[int, int, int] = C_TEXT_BODY,
    align: PP_ALIGN = PP_ALIGN.LEFT,
) -> None:
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(*color)


def _add_card(
    slide: Any,
    left: float,
    top: float,
    width: float,
    height: float,
    title: str,
    body: str,
    title_color: tuple[int, int, int] = C_WARM_SALT,
    body_size: int = 12,
    fill_rgb: tuple[int, int, int] = C_MINERAL_NIGHT,
    border_rgb: tuple[int, int, int] = C_ROCK_INK,
) -> None:
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(*fill_rgb)
    shape.line.color.rgb = RGBColor(*border_rgb)
    shape.line.width = Pt(1.25)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.18)
    tf.margin_right = Inches(0.18)
    tf.margin_top = Inches(0.13)
    p1 = tf.paragraphs[0]
    r1 = p1.add_run()
    r1.text = title
    r1.font.size = Pt(14.5)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(*title_color)
    p2 = tf.add_paragraph()
    p2.space_before = Pt(5)
    r2 = p2.add_run()
    r2.text = body
    r2.font.size = Pt(body_size)
    r2.font.color.rgb = RGBColor(*C_TEXT_BODY)


def build_pptx(c: dict[str, Any], assets: dict[str, Path], pptx_path: Path) -> None:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    shot_mars = str(OUT_DIR / "shot_explorer_mars.png")
    shot_moon = str(OUT_DIR / "shot_explorer_moon.png")
    shot_analysis = str(OUT_DIR / "shot_atacama_analysis.png")
    logo_horiz = assets["logo_horiz_dark"]

    # Slide 1 (Cover - Home Paper-Cut Background + Large CKEPI V2 Logo)
    s1 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s1, assets["slide1_home"], logo_horiz, show_top_right_logo=False)
    _add_textbox(s1, 0.65, 0.38, 11.8, 0.38, c["badge_event"], 11, True, C_PALE_SULFUR)
    s1.shapes.add_picture(str(logo_horiz), Inches(0.65), Inches(0.92), width=Inches(3.4))
    _add_textbox(s1, 0.65, 2.05, 6.15, 0.9, c["s1_subtitle"], 15, True, C_LIGHT_COPPER)
    _add_card(
        s1,
        0.65,
        3.05,
        6.15,
        1.95,
        "Innovation Thesis / Tesis de Innovación",
        c["s1_tagline"],
        C_PALE_SULFUR,
        13,
        C_ROCK_INK,
        C_PALE_SULFUR,
    )
    _add_textbox(s1, 0.65, 5.2, 6.15, 0.45, c["s1_meta"], 11, True, C_WARM_SALT)
    s1.shapes.add_picture(shot_mars, Inches(7.05), Inches(1.02), width=Inches(5.6))
    _add_textbox(s1, 7.05, 5.15, 5.6, 0.45, c["s1_caption"], 10, False, C_TEXT_MUTED, PP_ALIGN.CENTER)

    # Slide 2 (El Problema Paper-Cut Background)
    s2 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s2, assets["slide2_problema"], logo_horiz)
    _add_textbox(s2, 0.65, 0.35, 10.3, 0.32, c["s2_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s2, 0.65, 0.68, 10.3, 0.6, c["s2_title"], 23, True, C_WARM_SALT)
    _add_card(s2, 0.65, 1.5, 5.9, 1.72, c["s2_p1_title"], c["s2_p1_body"], C_LIGHT_COPPER, 11.5)
    _add_card(s2, 0.65, 3.35, 5.9, 1.72, c["s2_p2_title"], c["s2_p2_body"], C_PALE_SULFUR, 11.5)
    _add_card(s2, 0.65, 5.2, 5.9, 1.72, c["s2_aud_title"], c["s2_aud_body"], C_OK_GREEN, 11.5)
    s2.shapes.add_picture(shot_moon, Inches(6.85), Inches(1.5), width=Inches(5.8))

    # Slide 3 (Qué Hace CKEPI Paper-Cut Background)
    s3 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s3, assets["slide3_solucion"], logo_horiz)
    _add_textbox(s3, 0.65, 0.35, 10.3, 0.32, c["s3_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s3, 0.65, 0.68, 10.3, 0.6, c["s3_title"], 23, True, C_WARM_SALT)
    for i, (t, b) in enumerate(c["s3_flow"]):
        _add_card(s3, 0.65 + i * 4.08, 1.48, 3.85, 1.85, t, b, C_LIGHT_COPPER, 11.5)
    s3.shapes.add_picture(shot_analysis, Inches(0.65), Inches(3.52), width=Inches(6.2))
    _add_card(s3, 7.1, 3.52, 5.55, 3.38, c["s3_ui_card_title"], c["s3_ui_notes"], C_PALE_SULFUR, 11.5)

    # Slide 4 (Explorador Paper-Cut Background)
    s4 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s4, assets["slide4_ciencia"], logo_horiz)
    _add_textbox(s4, 0.65, 0.35, 10.3, 0.32, c["s4_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s4, 0.65, 0.68, 10.3, 0.6, c["s4_title"], 23, True, C_WARM_SALT)
    _add_card(s4, 0.65, 1.48, 3.85, 2.0, c["s4_x_title"], c["s4_x_list"], C_PALE_SULFUR, 11.5)
    _add_card(s4, 4.73, 1.48, 3.85, 2.0, c["s4_y_title"], c["s4_y_list"], C_LIGHT_COPPER, 11.5)
    _add_card(s4, 8.81, 1.48, 3.85, 2.0, c["s4_b_title"], c["s4_b_list"], C_WARN_RED, 11.5)
    _add_textbox(s4, 0.65, 3.62, 12.0, 0.52, c["s4_formula"], 11.5, True, C_PALE_SULFUR)
    sources_text = "\n\n".join(f"• {k}: {v}" for k, v in c["s4_sources"])
    _add_card(s4, 0.65, 4.28, 12.0, 2.6, c["s4_sources_title"], sources_text, C_WARM_SALT, 11)

    # Slide 5 (El Hallazgo Paper-Cut Background)
    s5 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s5, assets["slide5_hallazgo"], logo_horiz)
    _add_textbox(s5, 0.65, 0.35, 10.3, 0.32, c["s5_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s5, 0.65, 0.68, 10.3, 0.6, c["s5_title"], 22, True, C_WARM_SALT)
    metrics_text = "\n".join(f"• {k}: {v}" for k, v in c["s5_metrics"])
    _add_card(s5, 0.65, 1.45, 5.9, 3.7, c["s5_match_title"], metrics_text, C_OK_GREEN, 11)
    brk_text = "\n".join(f"• {var}: {mars}  vs.  {earth}" for var, mars, earth in c["s5_brk_rows"])
    _add_card(s5, 6.75, 1.45, 5.9, 3.7, c["s5_brk_title"], brk_text, C_LIGHT_COPPER, 11)
    _add_card(
        s5,
        0.65,
        5.3,
        12.0,
        1.58,
        "Physical Honesty & Scope of Validity",
        c["s5_honesty"],
        C_PALE_SULFUR,
        10.5,
        C_ROCK_INK,
        C_LIGHT_COPPER,
    )

    # Slide 6 (El Límite Honesto Paper-Cut Background)
    s6 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s6, assets["slide6_araucana"], logo_horiz)
    _add_textbox(s6, 0.65, 0.35, 10.3, 0.32, c["s6_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s6, 0.65, 0.68, 10.3, 0.6, c["s6_title"], 23, True, C_WARM_SALT)
    _add_card(
        s6,
        0.65,
        1.5,
        5.9,
        5.3,
        c["s6_sus_title"],
        "\n\n".join(f"• {x}" for x in c["s6_sus_items"]),
        C_PALE_SULFUR,
        11,
    )
    _add_card(
        s6,
        6.75,
        1.5,
        5.9,
        5.3,
        c["s6_sdg_title"],
        "\n\n".join(f"• {x}" for x in c["s6_sdg_items"]),
        C_LIGHT_COPPER,
        11,
    )

    # Slide 7 (Home Paper-Cut Background + Credits + AI Disclosure)
    s7 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s7, assets["slide7_creditos"], logo_horiz)
    _add_textbox(s7, 0.65, 0.35, 10.3, 0.32, c["s7_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s7, 0.65, 0.68, 10.3, 0.6, c["s7_title"], 23, True, C_WARM_SALT)
    _add_card(s7, 0.65, 1.45, 5.9, 3.65, c["s7_credits_title"], c["s7_credits"], C_PALE_SULFUR, 10)
    _add_card(s7, 6.75, 1.45, 5.9, 3.65, c["s7_ai_title"], c["s7_ai_body"], C_LIGHT_COPPER, 10)
    _add_textbox(s7, 0.65, 5.22, 12.0, 0.42, c["s7_links"], 11.5, False, C_WARM_SALT, PP_ALIGN.CENTER)
    _add_textbox(s7, 0.65, 5.75, 12.0, 0.75, c["s7_closing"], 16.5, True, C_PALE_SULFUR, PP_ALIGN.CENTER)

    prs.save(str(pptx_path))


def export_pdf_from_pptx(pptx_path: Path) -> None:
    subprocess.run(
        [
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            str(OUT_DIR),
            str(pptx_path),
        ],
        check=True,
    )


def main() -> None:
    assets = prepare_brand_and_background_assets()
    metrics = load_metrics()
    copy = build_copy(metrics)
    for lang, c in copy.items():
        html_path = OUT_DIR / f"ckepi-pitch-{lang}.html"
        pptx_path = OUT_DIR / f"ckepi-pitch-{lang}.pptx"
        pdf_path = OUT_DIR / f"ckepi-pitch-{lang}.pdf"
        html_path.write_text(render_html(c, assets), encoding="utf-8")
        build_pptx(c, assets, pptx_path)
        export_pdf_from_pptx(pptx_path)
        print(f"Generated {pptx_path.name}, {pdf_path.name}, and {html_path.name}")


if __name__ == "__main__":
    main()
