"""Build Ckepi's focused, mentor-aligned 7-slide presentation (PPTX + PDF + HTML) in English (Global) and Spanish (Local Antofagasta / Caja La Araucana).
Refocused after mentor feedback: ZERO information overload, 100% concrete story centered on Antofagasta's 4 measured zones (30 m DEM) crossed with Mars (Jezero) & Moon (South Pole), fulfilling Global, Local, Scientific (30 m), and Caja La Araucana + UN SDG rubrics."""

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

    for key, filename in SLIDE_BG_SCENES:
        src_webp = BG_SRC_DIR / filename
        dst_raw = ASSETS_DIR / filename
        dst_veiled = ASSETS_DIR / f"{key}_ppt_bg.png"
        if src_webp.exists():
            shutil.copy2(src_webp, dst_raw)
            img = Image.open(src_webp).convert("RGBA").resize((1920, 1080), Image.Resampling.LANCZOS)
            veil = Image.new("RGBA", img.size, (16, 31, 36, 214))
            composited = Image.alpha_composite(img, veil)

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
            "badge_event": "NASA Space Apps 2026 · Identify Earth Locations that Analog Moon & Mars · Antofagasta, Chile",
            "s1_title": "CKEPI",
            "s1_subtitle": "Where in Antofagasta Can We Prepare for the Moon and Mars? Real 30 m NASA Evidence for Science & Community",
            "s1_tagline": (
                "“We do not seek to prove that Atacama is identical to Mars. We seek to show which "
                "characteristics it shares, which differences exist, and which new locations in "
                "Antofagasta deserve to be studied using scientific evidence.”"
            ),
            "s1_caption": "Live web app: 3 cardboard worlds (Moon · Antofagasta · Mars) + 3D globes + real 30 m DEM comparison",
            "s1_meta": "Open-Source · Apache License 2.0 · Free Without Login · Brand V2: Salt, Copper & Sulfur",
            "s2_kicker": "01 · THE CONCRETE PROBLEM & WHY IT MATTERS IN ANTOFAGASTA",
            "s2_title": "Missions test in Earth deserts—but rely on visual similarity and leave citizens out",
            "s2_p1_title": "1. The Real Scientific Problem (Recognized by NASA)",
            "s2_p1_body": (
                "Before going to the Moon or Mars, rovers and solar panels are tested on Earth. Yet missions keep defaulting "
                "to the same famous site (Yungay) by visual resemblance, while vast sectors of Antofagasta remain unmeasured at 30 m."
            ),
            "s2_p2_title": "2. Who It Affects (Engineers & Our Local Community)",
            "s2_p2_body": (
                "Engineers need quantitative proof of where a terrain test is valid or invalid. Meanwhile, complex planetary GIS tools "
                "exclude students, teachers, families, and people without scientific training."
            ),
            "s2_aud_title": "3. Concrete Value Proposition from Antofagasta",
            "s2_aud_body": (
                "Cross NASA Moon & Mars landing sites with 4 real measured zones of Antofagasta at 30 m—guiding field tests "
                "while letting any citizen explore our desert with voice and pictograms."
            ),
            "s3_kicker": "02 · CONCRETE SOLUTION: ONE ENGINE, TWO EXPERIENCES (MOBILE-FIRST)",
            "s3_title": "Focused and accessible: Explore Mode for everyone + Science Mode for researchers",
            "s3_flow": [
                (
                    "1. Explore Mode (?view=explore)",
                    "Three floating paper-cut worlds (Moon · Antofagasta · Mars). Tap one for a 4-step pictogram lesson, 10 kg backpack simulator, and voice readout (ES/PT/EN).",
                ),
                (
                    "2. Interactive Crossing (?view=app)",
                    "Crosses Moon (Shackleton South Pole) and Mars (Jezero Crater) with Antofagasta's 4 real measured zones: Yes / Partial / No verdicts in < 0.4 s.",
                ),
                (
                    "3. Deep Science & 3D H3 Grid",
                    "3D NASA Trek globes, 12,193 cached H3 cells (790 Res-2 & 11,403 Res-3), 30/60/90 m DEM distributions, and reproducible Markdown/CSV export.",
                ),
            ],
            "s3_ui_card_title": "Built to Be Concrete, Fast & Universal (320px Mobile to 4K)",
            "s3_ui_notes": (
                "Refocused after mentor feedback to eliminate visual overload: one question per screen, self-hosted Public Sans (USWDS) & "
                "IBM Plex Mono (SIL OFL 1.1), custom SVG pictograms, >= 44 px touch targets, Web Speech API voice, 1,052 i18n keys (EN/ES/PT), "
                f"and memoized DuckDB/SciPy backend answering real 30 m DEM comparisons in < 0.4 s across {counts['earth_h3_cells_total']:,} H3 cells."
            ),
            "s4_kicker": "03 · HOW IT WORKS: CAUSAL DECOMPOSITION (X → Y ∥ B) & NASA DATA",
            "s4_title": "We never say '87% Mars': we separate Terrain (X), Climate (Y), and Physical Limits (B)",
            "s4_x_title": "1. Substrate & Terrain (X · 10 Vars)",
            "s4_x_list": "What we CAN test in Antofagasta: 30 m slope (°), local relief (m), roughness, albedo, thermal inertia, solar/UV flux, hyper-aridity.",
            "s4_y_title": "2. Environmental Response (Y · 6 Vars)",
            "s4_y_list": "What partially responds: diurnal thermal swing ΔT (K), nocturnal cooling rate, surface wind speed, aeolian dust mobilization.",
            "s4_b_title": "3. Irreducible Limits (B · 3 Vars)",
            "s4_b_list": "What Earth NEVER reproduces outdoors: surface gravity (0.38 g / 0.166 g), pressure (~0.6 kPa CO2 / vacuum), cosmic radiation (mSv/yr).",
            "s4_formula": "30 m Common Scale: Wasserstein-1 (W1 in ° and m) + Kolmogorov–Smirnov (D_KS) + 2D Spatial Block Bootstrap (95% CI, 10×10 px blocks)",
            "s4_sources_title": "Real Open Datasets Used in This Comparison (SPD-41a / FAIR)",
            "s4_sources": [
                (
                    "Mars & Moon (NASA)",
                    "NASA MRO CTX / USGS Mars 2020 TRN DEM Mosaic (Jezero, 20 m → 30 m), Perseverance MEDA, Curiosity REMS & RAD (~230 mSv/yr), LRO LOLA & Diviner, NASA Trek WMTS, NSSDCA Fact Sheet.",
                ),
                (
                    "Antofagasta & Earth",
                    "ESA Copernicus DEM GLO-30 (UTM 19S at 30 m · DLR/Airbus/EU/ESA), NASA POWER v2.5, Open-Meteo ERA5-Land, ISRIC SoilGrids v2.0, Macrostrat.",
                ),
            ],
            "s5_kicker": "04 · CONCRETE FINDING IN ANTOFAGASTA: 4 REAL ZONES AT 30 m VS. MARS & MOON",
            "s5_title": "Jezero Crater (Mars CTX DEM, 1.70° median slope) vs. 4 Real Antofagasta Zones (6×6 km at 30 m)",
            "s5_match_title": "4 Measured Zones in Antofagasta Region (30 m DEM Ranking)",
            "s5_metrics": [
                ("1. ✅ Pampa Central (Cell 83b224 · 1,408 m)", "W1 = 0.54° [CI 0.40°–0.65°], KS = 0.15 (BEST MATCH)"),
                ("   ↳ Relief & Multiscale Stability", "Relief W1 = 1.8 m · Holds at 60 m (0.40°) & 90 m (0.27°)"),
                ("2. ⚖️ Classic Yungay Control (24.08°S)", "W1 = 3.32°, KS = 0.31 (Steep tails P90 = 15.11°; best for aridity)"),
                ("3. ⚠️ Near Yungay (Cell 83b220 · 1,423 m)", "W1 = 3.70° [CI 3.22°–4.20°], KS = 0.52 (Hillier than Jezero)"),
                ("4. ❌ Salar / Salt Flat (Cell 83b225 · 2,301 m)", "W1 = 1.71°, KS = 0.82 (FAILS: Too flat, P50 = 0.19°)"),
                ("5. ❌ High Andes / Pajonales (83b221 · 4,195 m)", "W1 = 6.92°, KS = 0.67 (FAILS: Too steep, P50 = 7.89°)"),
            ],
            "s5_brk_title": "What Earth Cannot Imitate (Irreducible Gap B · Why We Pre-Select, Not Certify)",
            "s5_brk_rows": [
                ("Gravity (10 kg Backpack)", "3.8 kg Mars (0.38 g) / 1.7 kg Moon (0.166 g)", "10.0 kg Antofagasta (1.00 g)"),
                ("Air / Pressure", "~0.6 kPa CO2 Mars / 0 kPa Moon vacuum", "101.3 kPa N2/O2 (~80.7 kPa at 2,450 m)"),
                ("Cosmic Radiation", "~230 mSv/yr Mars (RAD) / ~380 Moon", "~2.4 mSv/yr Earth (magnetic shield)"),
                ("Day–Night ΔT", "-59 to -65 °C Mars / ΔT ~290 K Moon", "15 °C Earth mean (ΔT ~28 K Atacama)"),
            ],
            "s5_honesty": (
                f"What to test in Pampa 83b224: rover wheels, suspension & optical/LiDAR navigation on Jezero-like slopes (W1 = 0.54° vs 3.32° in Yungay). "
                f"What to test in Yungay ({atacama['earth_cell_h3']}): hyper-arid astrobiology & UV (Aridity {iv['aridity_index']:.3f}). Never valid outdoors: parachutes, convective cooling, GCR shielding."
            ),
            "s6_kicker": "05 · CONCRETE IMPACT IN ANTOFAGASTA: CAJA LA ARAUCANA 4 AXES, JOBS & UN SDGs",
            "s6_title": "Connecting space science with local education, regional jobs, and sustainable open access",
            "s6_sus_title": "4 Caja La Araucana Axes & Concrete Value for Antofagasta",
            "s6_sus_items": [
                "1. Frontier Science for All (SDG 4.3): Zero-jargon Explore Mode with cardboard worlds, pictograms, and voice readout for schools, families, and seniors.",
                "2. STEAM Skills & Local Employability (SDG 4.4, 8): Trains elevation map reading (geomatics), spatial statistics, and Python/NASA data skills directly applicable to Antofagasta jobs: mining robotics & automation, astronomical observatories, and desert solar energy.",
                "3. Local Territorial Discovery (SDG 9.5, 10, 13): Characterizes 4 zones of Antofagasta and proves Pampa Central (83b224) beats classic Yungay for rover slope trials.",
                "4. Interregional Network ‘Lattices’ (SDG 17.3, 17.16, 17.17): Open Apache-2.0 platform connecting Antofagasta with universities, schools, and global agencies.",
            ],
            "s6_sdg_title": "Realistic Sustainability Hypothesis & Next Steps",
            "s6_sdg_items": [
                "100% Free Public Core (Apache License 2.0): Web app, local educational mode, and open datasets stay permanently free with no login.",
                "Institutional Hypothesis (To Validate): Municipalities, libraries, universities, and social funds sponsor guided STEAM school workshops, printable kits, and regional terrain reports (no unverified revenue or signed contracts claimed).",
                "Next Steps: Field-validate Cell 83b224 with university rover prototypes and test Explore Mode in Antofagasta classrooms.",
            ],
            "s7_kicker": "06 · OPEN SCIENCE LEGAL CREDITS, BRAND V2 & MANDATORY AI DISCLOSURE",
            "s7_title": "Full Legal Attribution (SPD-41a / FAIR), Self-Hosted Fonts & AI Watermarking",
            "s7_credits_title": "Legal Open Science Citations & Brand Identity V2 ('Salt, Copper & Sulfur')",
            "s7_credits": (
                "• Code License: Apache License 2.0 (OSI-approved).\n"
                "• NASA Open Data (17 U.S.C. § 105 Public Domain, text credit only, zero NASA logos): MRO CTX / USGS Mars 2020 TRN DEM (20 m), Mars 2020 MEDA, MSL REMS/RAD, LRO LOLA/Diviner, MGS MOLA, NASA POWER v2.5, NASA Trek WMTS, NSSDCA.\n"
                "• Partner Data: ESA Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 & Airbus Defence and Space GmbH 2014-2018 under COPERNICUS by EU & ESA), ERA5-Land, ISRIC SoilGrids v2.0 (CC BY 4.0), Macrostrat (CC BY 4.0).\n"
                "• Typography, Pictograms & Brand V2: Self-hosted Public Sans (USWDS / SIL OFL 1.1) & IBM Plex Mono (SIL OFL 1.1) + custom SVG pictograms. Palette: Mineral Night #101F24, Rock Ink #183A3A, Warm Salt #FFF2D7, Pale Sulfur #E4ED83, Light Copper #E8A080."
            ),
            "s7_ai_title": "Complete AI (Super Intelligence) & Watermark Declaration (AI_DISCLOSURE.md)",
            "s7_ai_body": (
                "• 100% Human Scientific Conception: Causal decomposition (X → Y ∥ B), 30 m DEM statistical comparison, and Antofagasta territorial thesis are 100% human work.\n"
                "• Code & i18n Assistance: Claude Code, OpenAI Codex/GPT, and Google Antigravity assisted with code, tests, docs, and ES/PT/EN parity (1,052 keys) under human verification.\n"
                "• Visual AI & Mandatory Visible Watermarks: Scientific maps, 3D globes, DEM plots, paper planets, and the in-app vector logo (ckepi-*-vector-dark.svg) contain ZERO generative AI. Decorative paper-cut backgrounds & raster paper symbol (OpenAI image_gen via Codex) display ‘AI-generated · Ckepi’, and the Home intro video (Google Gemini) displays a persistent ‘AI-generated video’ watermark."
            ),
            "s7_links": "Public Repo: https://github.com/AnGeMoNs/Ckepi  ·  Docs & 30 m Proof: docs/nehe/ & docs/RESULTADOS_TERRENO_REALES.md  ·  Team: Lattices (Antofagasta)",
            "s7_closing": "“With Ckepi, a resemblance sparks curiosity; 30-meter scientific evidence in Antofagasta teaches us how far it truly goes.”",
        },
        "es": {
            "lang": "es",
            "badge_event": "NASA Space Apps 2026 · Sede Antofagasta & Caja La Araucana · Equipo Lattices",
            "s1_title": "CKEPI",
            "s1_subtitle": "¿Dónde en Antofagasta nos preparamos para la Luna y Marte? Evidencia real a 30 m para la ciencia y la comunidad",
            "s1_tagline": (
                "“No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué "
                "características comparte, qué diferencias existen y qué nuevos lugares de Antofagasta "
                "merecen ser estudiados utilizando evidencia científica.”"
            ),
            "s1_caption": "App en vivo: 3 mundos de cartón (Luna · Antofagasta · Marte) + globos 3D + terreno real a 30 m",
            "s1_meta": "Ciencia Abierta · Apache License 2.0 · Gratis y Sin Login · Identidad V2: Sal, Cobre y Azufre",
            "s2_kicker": "01 · EL PROBLEMA CONCRETO Y POR QUÉ IMPORTA EN ANTOFAGASTA",
            "s2_title": "Las misiones ensayan en desiertos terrestres, pero eligen por vista y dejan fuera a la ciudadanía",
            "s2_p1_title": "1. El Problema Científico Real (Reconocido por NASA)",
            "s2_p1_body": (
                "Antes de viajar a la Luna o a Marte, los rovers y paneles solares se prueban en la Tierra. Pero se suele repetir "
                "el mismo sitio famoso por parecido visual (Yungay), mientras grandes zonas de Antofagasta siguen sin medirse a 30 m."
            ),
            "s2_p2_title": "2. A Quién Afecta (Ingenieros y Comunidad Local)",
            "s2_p2_body": (
                "Los ingenieros necesitan saber con datos qué prueba sirve y cuál falla. Al mismo tiempo, las herramientas científicas "
                "actuales están llenas de jerga que deja fuera a escolares, familias y personas sin formación técnica."
            ),
            "s2_aud_title": "3. Propuesta de Valor Concreta desde Antofagasta",
            "s2_aud_body": (
                "Cruzar los sitios de aterrizaje de NASA en la Luna y Marte con 4 zonas reales medidas a 30 m en Antofagasta, "
                "guiando ensayos reales y acercando nuestro desierto a cualquier persona con voz y pictogramas."
            ),
            "s3_kicker": "02 · SOLUCIÓN CONCRETA: UN MOTOR, DOS EXPERIENCIAS (MOBILE-FIRST)",
            "s3_title": "Enfocado tras el feedback de mentores: Modo Explorar (comunidad) + Modo Ciencia (expertos)",
            "s3_flow": [
                (
                    "1. Modo Explorar (?view=explore)",
                    "Tres mundos de cartón flotando (Luna · Antofagasta · Marte). Tocas uno y aprendes en 4 pasos con pictogramas, mochila de 10 kg y voz (ES/PT/EN).",
                ),
                (
                    "2. Cruce Interactivo (?view=app)",
                    "Cruza la Luna (Polo Sur) y Marte (Cráter Jezero) con las 4 zonas medidas de Antofagasta: veredictos Sí / En parte / No en < 0,4 s.",
                ),
                (
                    "3. Modo Ciencia y Malla H3 3D",
                    "Globos 3D NASA Trek, 12.193 celdas H3 en caché (790 Res-2 y 11.403 Res-3), distribuciones DEM a 30/60/90 m y ficha exportable.",
                ),
            ],
            "s3_ui_card_title": "Simple por fuera, riguroso por dentro (320px Móvil a 4K)",
            "s3_ui_notes": (
                "Rediseñado tras la mentoría para eliminar la sobrecarga de información: una pregunta por pantalla, tipografías autoalojadas "
                "Public Sans (USWDS) e IBM Plex Mono (SIL OFL 1.1), pictogramas propios en código, botones >= 44 px, lectura por voz Web Speech API, "
                f"1.052 claves trilingües (ES/PT/EN) y motor DuckDB/SciPy precalculado que responde en < 0,4 s sobre {counts['earth_h3_cells_total']:,} celdas H3."
            ),
            "s4_kicker": "03 · CÓMO FUNCIONA: DESCOMPOSICIÓN CAUSAL (X → Y ∥ B) Y DATOS NASA",
            "s4_title": "Nunca decimos «87 % igual a Marte»: separamos Terreno (X), Clima (Y) y Límites Físicos (B)",
            "s4_x_title": "1. Sustrato y Terreno (X · 10 Vars)",
            "s4_x_list": "Lo que SÍ podemos medir y probar en Antofagasta: pendiente a 30 m (°), relieve local (m), rugosidad, albedo, inercia térmica, flujo solar/UV y aridez.",
            "s4_y_title": "2. Respuesta Climática (Y · 6 Vars)",
            "s4_y_list": "Lo que se parece en parte: cambio térmico día–noche ΔT (K), enfriamiento nocturno, viento superficial y polvo en suspensión.",
            "s4_b_title": "3. Límites Irreproducibles (B · 3 Vars)",
            "s4_b_list": "Lo que la Tierra NUNCA imita al aire libre: gravedad (0,38 g / 0,166 g), presión (~0,6 kPa CO2 / vacío) y radiación cósmica (mSv/año).",
            "s4_formula": "Escala común 30 m: Wasserstein-1 (W1 en ° y m) + Kolmogorov–Smirnov (D_KS) + Bootstrap espacial por bloques 2D (IC 95%, bloques 10×10 px)",
            "s4_sources_title": "Datasets Abiertos Reales Utilizados (Cumplimiento SPD-41a / FAIR)",
            "s4_sources": [
                (
                    "Marte y Luna (NASA)",
                    "NASA MRO CTX / USGS Mars 2020 TRN DEM Mosaic (Jezero, 20 m → 30 m), Perseverance MEDA, Curiosity REMS y RAD (~230 mSv/año), LRO LOLA y Diviner, NASA Trek WMTS, NSSDCA.",
                ),
                (
                    "Antofagasta y Tierra",
                    "ESA Copernicus DEM GLO-30 (UTM 19S a 30 m · DLR/Airbus/UE/ESA), NASA POWER v2.5, Open-Meteo ERA5-Land, ISRIC SoilGrids v2.0, Macrostrat.",
                ),
            ],
            "s5_kicker": "04 · HALLAZGO CONCRETO EN ANTOFAGASTA: 4 ZONAS REALES A 30 m VS. MARTE Y LUNA",
            "s5_title": "Cráter Jezero (Marte CTX DEM, pendiente mediana 1,70°) vs. 4 Zonas de Antofagasta (6×6 km a 30 m)",
            "s5_match_title": "Ranking de las 4 Zonas Medidas en Antofagasta (DEM Real a 30 m)",
            "s5_metrics": [
                ("1. ✅ Pampa Central (Celda 83b224 · 1.408 m)", "W1 = 0,54° [IC 0,40°–0,65°], KS = 0,15 (MEJOR AJUSTE)"),
                ("   ↳ Relieve y Estabilidad 30/60/90 m", "Relieve W1 = 1,8 m · Estable a 60 m (0,40°) y 90 m (0,27°)"),
                ("2. ⚖️ Control Clásico Yungay (24,08°S)", "W1 = 3,32°, KS = 0,31 (Laderas fuertes P90 = 15,11°; ideal aridez)"),
                ("3. ⚠️ Cerca de Yungay (Celda 83b220 · 1.423 m)", "W1 = 3,70° [IC 3,22°–4,20°], KS = 0,52 (Más quebrada)"),
                ("4. ❌ Salar / Cordillera Sal (83b225 · 2.301 m)", "W1 = 1,71°, KS = 0,82 (NO SIRVE: Muy plana, P50 = 0,19°)"),
                ("5. ❌ Alta Cordillera / Pajonales (83b221 · 4.195 m)", "W1 = 6,92°, KS = 0,67 (NO SIRVE: Muy abrupta, P50 = 7,89°)"),
            ],
            "s5_brk_title": "Lo que la Tierra NO Puede Imitar (Brecha B · Preseleccionamos, No Certificamos)",
            "s5_brk_rows": [
                ("Gravedad (Mochila 10 kg)", "3,8 kg Marte (0,38 g) / 1,7 kg Luna (0,166 g)", "10,0 kg Antofagasta (1,00 g)"),
                ("Aire y Presión", "~0,6 kPa CO2 Marte / 0 kPa vacío Lunar", "101,3 kPa N2/O2 (~80,7 kPa a 2.450 m)"),
                ("Radiación Cósmica", "~230 mSv/año Marte (RAD) / ~380 Luna", "~2,4 mSv/año Tierra (escudo magnético)"),
                ("Cambio Día–Noche (ΔT)", "-59 a -65 °C Marte / ΔT ~290 K Luna", "15 °C media Tierra (ΔT ~28 K Atacama)"),
            ],
            "s5_honesty": (
                f"Qué ensayar en Pampa 83b224: ruedas, suspensión y navegación óptica/LiDAR en pendientes como Jezero (W1 = 0,54° vs 3,32° en Yungay). "
                f"Qué ensayar en Yungay ({atacama['earth_cell_h3']}): astrobiología hiperárida y UV (Aridez {iv['aridity_index']:.3f}). Inválido al aire libre: paracaídas, convección y blindaje GCR."
            ),
            "s6_kicker": "05 · IMPACTO CONCRETO EN ANTOFAGASTA: 4 EJES CAJA LA ARAUCANA, EMPLEOS Y ODS",
            "s6_title": "Conectando ciencia espacial con educación accesible, oficios regionales y acceso abierto",
            "s6_sus_title": "Los 4 Ejes de Caja La Araucana y Valor para Antofagasta",
            "s6_sus_items": [
                "1. Democratizar Ciencia de Frontera (ODS 4.3): Modo Explorar sin jerga con 3 mundos de cartón, pictogramas y lectura por voz para colegios, familias y personas mayores.",
                "2. Habilidades STEAM y Empleabilidad Local (ODS 4.4, 8): Enseña lectura de mapas de elevación (geomática), estadística espacial y datos abiertos NASA conectados con oficios reales de Antofagasta: robótica y automatización minera, observatorios astronómicos y energía solar.",
                "3. Aplicación Local en Antofagasta (ODS 9.5, 10, 13): Mide 4 zonas de nuestra región y demuestra que la Pampa (83b224) supera a Yungay para ensayos de pendiente.",
                "4. Red Interregional ‘Lattices’ (ODS 17.3, 17.16, 17.17): Plataforma abierta (Apache-2.0) que conecta Antofagasta con universidades, liceos y agencias espaciales.",
            ],
            "s6_sdg_title": "Sostenibilidad Realista (Hipótesis por Validar) y Hoja de Ruta",
            "s6_sdg_items": [
                "Núcleo Público 100 % Gratuito (Apache License 2.0): La app web, el modo local educativo y los datos permanecen libres sin login ni cobros.",
                "Hipótesis Institucional (Por Validar): Municipios, bibliotecas, universidades y fondos sociales financian talleres STEAM guiados, kits impresos y fichas de caracterización territorial (sin afirmar ventas ni convenios cerrados aún).",
                "Siguientes Pasos: Validar en terreno la celda 83b224 con prototipos universitarios y probar el Modo Explorar en aulas de Antofagasta.",
            ],
            "s7_kicker": "06 · CRÉDITOS LEGALES OPEN SCIENCE, IDENTIDAD V2 Y DECLARACIÓN DE IA",
            "s7_title": "Atribución Legal (SPD-41a / FAIR), Fuentes Autoalojadas y Marca de Agua IA",
            "s7_credits_title": "Citas Legales Open Science e Identidad V2 («Sal, Cobre y Azufre»)",
            "s7_credits": (
                "• Licencia de Código: Apache License 2.0 (aprobada por OSI).\n"
                "• Datos Abiertos NASA (17 U.S.C. § 105 Dominio Público, solo texto, cero logos NASA): MRO CTX / USGS Mars 2020 TRN DEM (20 m), Mars 2020 MEDA, MSL REMS/RAD, LRO LOLA/Diviner, MGS MOLA, NASA POWER v2.5, NASA Trek WMTS, NSSDCA.\n"
                "• Datos Socios: ESA Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 y Airbus Defence and Space GmbH 2014-2018 bajo COPERNICUS por UE y ESA), ERA5-Land, ISRIC SoilGrids v2.0 (CC BY 4.0), Macrostrat (CC BY 4.0).\n"
                "• Tipografía, Pictogramas e Identidad V2: Public Sans (USWDS / SIL OFL 1.1) e IBM Plex Mono (SIL OFL 1.1) autoalojadas + pictogramas SVG propios. Paleta V2: Noche Mineral #101F24, Tinta de Roca #183A3A, Sal Cálida #FFF2D7, Azufre Pálido #E4ED83, Cobre Luminoso #E8A080."
            ),
            "s7_ai_title": "Declaración Completa de IA y Marca de Agua Obligatoria (AI_DISCLOSURE.md)",
            "s7_ai_body": (
                "• Concepción Científica 100 % Humana: La descomposición causal (X → Y ∥ B), la comparación estadística DEM a 30 m y el hallazgo territorial en Antofagasta son 100 % autoría humana.\n"
                "• Asistencia en Código e i18n: Claude Code, OpenAI Codex/GPT y Google Antigravity asistieron en código, tests, documentación y paridad ES/PT/EN (1.052 claves) bajo revisión humana.\n"
                "• IA Visual y Marcas de Agua Visibles: Los mapas científicos, globos 3D, gráficos DEM, planetas de papel y el logo vectorial en la app (ckepi-*-vector-dark.svg) tienen CERO IA generativa. Los 12 fondos decorativos paper-cut y el símbolo raster (OpenAI image_gen vía Codex) llevan marca visible ‘AI-generated · Ckepi’, y el video intro (Google Gemini) lleva marca persistente ‘Video generado con IA / AI-generated video’."
            ),
            "s7_links": "Repositorio Público: https://github.com/AnGeMoNs/Ckepi  ·  Dossier y Prueba 30 m: docs/nehe/ y docs/RESULTADOS_TERRENO_REALES.md  ·  Equipo: Lattices (Antofagasta)",
            "s7_closing": "“Con Ckepi, una semejanza despierta la curiosidad; la evidencia científica a 30 metros en Antofagasta nos enseña hasta dónde llega.”",
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
    font-family: "Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
  h2 {{ font-size: 26px; font-weight: 750; line-height: 1.16; margin-bottom: 10px; color: #FFF2D7; }}
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
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
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
  .m-val {{ font-size: 12.8px; font-weight: 750; color: #E4ED83; margin-top: 2px; }}
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
        <thead><tr><th>Variable</th><th>Mars / Moon</th><th>Antofagasta (Earth)</th></tr></thead>
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

    # Slide 1
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
        "Concrete Focus / Enfoque Concreto en Antofagasta",
        c["s1_tagline"],
        C_PALE_SULFUR,
        13,
        C_ROCK_INK,
        C_PALE_SULFUR,
    )
    _add_textbox(s1, 0.65, 5.2, 6.15, 0.45, c["s1_meta"], 11, True, C_WARM_SALT)
    s1.shapes.add_picture(shot_mars, Inches(7.05), Inches(1.02), width=Inches(5.6))
    _add_textbox(s1, 7.05, 5.15, 5.6, 0.45, c["s1_caption"], 10, False, C_TEXT_MUTED, PP_ALIGN.CENTER)

    # Slide 2
    s2 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s2, assets["slide2_problema"], logo_horiz)
    _add_textbox(s2, 0.65, 0.35, 10.3, 0.32, c["s2_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s2, 0.65, 0.68, 10.3, 0.6, c["s2_title"], 22, True, C_WARM_SALT)
    _add_card(s2, 0.65, 1.5, 5.9, 1.72, c["s2_p1_title"], c["s2_p1_body"], C_LIGHT_COPPER, 11.5)
    _add_card(s2, 0.65, 3.35, 5.9, 1.72, c["s2_p2_title"], c["s2_p2_body"], C_PALE_SULFUR, 11.5)
    _add_card(s2, 0.65, 5.2, 5.9, 1.72, c["s2_aud_title"], c["s2_aud_body"], C_OK_GREEN, 11.5)
    s2.shapes.add_picture(shot_moon, Inches(6.85), Inches(1.5), width=Inches(5.8))

    # Slide 3
    s3 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s3, assets["slide3_solucion"], logo_horiz)
    _add_textbox(s3, 0.65, 0.35, 10.3, 0.32, c["s3_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s3, 0.65, 0.68, 10.3, 0.6, c["s3_title"], 22, True, C_WARM_SALT)
    for i, (t, b) in enumerate(c["s3_flow"]):
        _add_card(s3, 0.65 + i * 4.08, 1.48, 3.85, 1.85, t, b, C_LIGHT_COPPER, 11.5)
    s3.shapes.add_picture(shot_analysis, Inches(0.65), Inches(3.52), width=Inches(6.2))
    _add_card(s3, 7.1, 3.52, 5.55, 3.38, c["s3_ui_card_title"], c["s3_ui_notes"], C_PALE_SULFUR, 11.5)

    # Slide 4
    s4 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s4, assets["slide4_ciencia"], logo_horiz)
    _add_textbox(s4, 0.65, 0.35, 10.3, 0.32, c["s4_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s4, 0.65, 0.68, 10.3, 0.6, c["s4_title"], 22, True, C_WARM_SALT)
    _add_card(s4, 0.65, 1.48, 3.85, 2.0, c["s4_x_title"], c["s4_x_list"], C_PALE_SULFUR, 11.5)
    _add_card(s4, 4.73, 1.48, 3.85, 2.0, c["s4_y_title"], c["s4_y_list"], C_LIGHT_COPPER, 11.5)
    _add_card(s4, 8.81, 1.48, 3.85, 2.0, c["s4_b_title"], c["s4_b_list"], C_WARN_RED, 11.5)
    _add_textbox(s4, 0.65, 3.62, 12.0, 0.52, c["s4_formula"], 11.5, True, C_PALE_SULFUR)
    sources_text = "\n\n".join(f"• {k}: {v}" for k, v in c["s4_sources"])
    _add_card(s4, 0.65, 4.28, 12.0, 2.6, c["s4_sources_title"], sources_text, C_WARM_SALT, 11)

    # Slide 5
    s5 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s5, assets["slide5_hallazgo"], logo_horiz)
    _add_textbox(s5, 0.65, 0.35, 10.3, 0.32, c["s5_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s5, 0.65, 0.68, 10.3, 0.6, c["s5_title"], 21, True, C_WARM_SALT)
    metrics_text = "\n".join(f"• {k}: {v}" for k, v in c["s5_metrics"])
    _add_card(s5, 0.65, 1.45, 5.9, 3.7, c["s5_match_title"], metrics_text, C_OK_GREEN, 10.8)
    brk_text = "\n".join(f"• {var}: {mars}  vs.  {earth}" for var, mars, earth in c["s5_brk_rows"])
    _add_card(s5, 6.75, 1.45, 5.9, 3.7, c["s5_brk_title"], brk_text, C_LIGHT_COPPER, 10.8)
    _add_card(
        s5,
        0.65,
        5.3,
        12.0,
        1.58,
        "Concrete Action in Antofagasta (What Is Valid vs. Invalid)",
        c["s5_honesty"],
        C_PALE_SULFUR,
        10.5,
        C_ROCK_INK,
        C_LIGHT_COPPER,
    )

    # Slide 6
    s6 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s6, assets["slide6_araucana"], logo_horiz)
    _add_textbox(s6, 0.65, 0.35, 10.3, 0.32, c["s6_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s6, 0.65, 0.68, 10.3, 0.6, c["s6_title"], 22, True, C_WARM_SALT)
    _add_card(
        s6,
        0.65,
        1.5,
        5.9,
        5.3,
        c["s6_sus_title"],
        "\n\n".join(f"• {x}" for x in c["s6_sus_items"]),
        C_PALE_SULFUR,
        10.8,
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
        10.8,
    )

    # Slide 7
    s7 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s7, assets["slide7_creditos"], logo_horiz)
    _add_textbox(s7, 0.65, 0.35, 10.3, 0.32, c["s7_kicker"], 11, True, C_PALE_SULFUR)
    _add_textbox(s7, 0.65, 0.68, 10.3, 0.6, c["s7_title"], 22, True, C_WARM_SALT)
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
