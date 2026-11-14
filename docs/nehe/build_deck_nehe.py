"""Build Ckepi's ultra-simplified, mentor-aligned 7-slide presentation (PPTX + PDF + HTML) in English (Global) and Spanish (Local Antofagasta / Caja La Araucana).
Short sentences, high visual impact, zero walls of text, 100% rubric compliance."""

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
            wm_text = "AI-generated background & symbol · Ckepi"
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

    return {
        "en": {
            "lang": "en",
            "badge_event": "NASA Space Apps 2026 · Moon & Mars Analog Challenge · Antofagasta, Chile",
            "s1_title": "CKEPI",
            "s1_subtitle": "Where in Antofagasta Do We Prepare for the Moon and Mars?",
            "s1_tagline": (
                "“We do not seek to prove that Atacama is identical to Mars. We show what it shares, "
                "what differs, and which new places in Antofagasta deserve to be studied with scientific evidence.”"
            ),
            "s1_caption": "Live App: 3 cardboard worlds (Moon · Antofagasta · Mars) + 3D globes + 30 m NASA/ESA DEM proof",
            "s1_meta": "Open-Source (Apache 2.0) · Free & No Login · Zero NASA Logos",
            "s2_kicker": "01 · THE PROBLEM",
            "s2_title": "Space missions test in deserts—but choose by sight and leave citizens out",
            "s2_p1_title": "1. Visual Bias in Field Tests",
            "s2_p1_body": "Missions keep repeating the same famous site (Yungay), while the rest of Antofagasta remains unmeasured at 30 m.",
            "s2_p2_title": "2. Closed to the Community",
            "s2_p2_body": "Planetary GIS tools are built only for specialists—excluding students, teachers, and families.",
            "s2_aud_title": "3. Our Value Proposition",
            "s2_aud_body": "Cross Moon & Mars landing sites with 4 real zones of Antofagasta at 30 m—for engineers and for every citizen.",
            "s3_kicker": "02 · HOW CKEPI WORKS (STEP BY STEP)",
            "s3_title": "Simple for the community, rigorous for the scientist",
            "s3_flow": [
                (
                    "Step 1 · Explore Mode (Community)",
                    "3 floating cardboard worlds (Moon · Antofagasta · Mars). Tap one: pictograms, 10 kg backpack, and voice readout (ES/PT/EN).",
                ),
                (
                    "Step 2 · Interactive Crossing",
                    "Crosses Jezero (Mars) & Shackleton (Moon) with 4 Antofagasta zones: clear Yes / Partial / No verdicts in < 0.4 s.",
                ),
                (
                    "Step 3 · Deep Science & 3D Map",
                    "3D NASA Trek globes, 12,193 H3 cells, 30 m slope histograms, physics lab, and field-trial sheet export (.md / .csv).",
                ),
            ],
            "s3_ui_card_title": "Works Anywhere (320px Mobile to 4K · Offline-Ready Local Mode)",
            "s3_ui_notes": (
                f"• Local Explore Mode (?view=explore) runs 100% static (< 50 ms) with voice (Web Speech API) and >= 44 px buttons.\n"
                f"• Science Mode (?view=app) runs on FastAPI + DuckDB ({counts['earth_h3_cells_total']:,} H3 cells) + MapLibre 3D + 1,052 i18n keys."
            ),
            "s4_kicker": "03 · THE METHOD & REAL NASA DATA",
            "s4_title": "We never say '87% Mars': we separate Terrain (X), Climate (Y), and Limits (B)",
            "s4_x_title": "1. Terrain We CAN Test (X)",
            "s4_x_list": "30 m slope (°), local relief (m), roughness, albedo, solar/UV flux, hyper-aridity (10 variables).",
            "s4_y_title": "2. Climate Response (Y)",
            "s4_y_list": "Day–night temperature swing ΔT (K), cooling rate, wind speed, dust (6 variables).",
            "s4_b_title": "3. What Earth CANNOT Imitate (B)",
            "s4_b_list": "Gravity (0.38 g / 0.166 g), thin CO2 air (~0.6 kPa) or vacuum (0 kPa), cosmic radiation (~230–380 mSv/yr).",
            "s4_formula": "30 m Comparison: Wasserstein-1 (W1 in ° & m) + Kolmogorov–Smirnov (D_KS) + 2D Block Bootstrap (95% CI)",
            "s4_sources_title": "Official Open Data Used (NASA & Partners)",
            "s4_sources": [
                ("Mars & Moon", "NASA MRO CTX DEM (Jezero 20m→30m), Perseverance MEDA, Curiosity REMS/RAD, LRO LOLA/Diviner, Trek WMTS, NSSDCA."),
                ("Antofagasta", "ESA Copernicus DEM GLO-30 (UTM 19S at 30 m · DLR/Airbus/EU/ESA), NASA POWER v2.5, ERA5-Land, SoilGrids, Macrostrat."),
            ],
            "s5_kicker": "04 · THE FINDING IN ANTOFAGASTA (REAL 30 m DATA)",
            "s5_title": "Jezero Crater (Mars, 1.70° slope) vs. 4 Real Zones in Antofagasta (6×6 km at 30 m)",
            "s5_match_title": "What Matches & What Fails at 30 m (Slope W1)",
            "s5_metrics": [
                ("1. ✅ Pampa Central (Cell 83b224)", "W1 = 0.54° [CI 0.40°–0.65°] · 6× closer than Yungay!"),
                ("   ↳ Multiscale & Relief", "Relief W1 = 1.8 m · Holds at 60 m (0.40°) & 90 m (0.27°)"),
                ("2. ⚖️ Classic Yungay Control", "W1 = 3.32° (Steep hills P90 = 15.1°; best for hyper-aridity)"),
                ("3. ⚠️ Near Yungay (Cell 83b220)", "W1 = 3.70° · KS = 0.52 (Hillier than Jezero floor)"),
                ("4. ❌ Salar Salt Flat (Cell 83b225)", "W1 = 1.71° · KS = 0.82 (FAILS: Too flat, P50 = 0.19°)"),
                ("5. ❌ High Andes / Pajonales (83b221)", "W1 = 6.92° · KS = 0.67 (FAILS: Too steep, P50 = 7.89°)"),
            ],
            "s5_brk_title": "Physical Limits B (Never Reproducible on Earth)",
            "s5_brk_rows": [
                ("10 kg Backpack", "3.8 kg Mars (0.38 g) / 1.7 kg Moon (0.166 g)", "10.0 kg Earth (1.00 g)"),
                ("Air Pressure", "~0.6 kPa CO2 Mars / 0 kPa Moon", "101.3 kPa Earth"),
                ("Radiation", "~230 mSv/yr Mars / ~380 Moon", "~2.4 mSv/yr Earth"),
                ("Temperature", "-59 to -65 °C Mars / ΔT ~290 K Moon", "15 °C Earth mean"),
            ],
            "s5_honesty": (
                "Result: Pampa Central (83b224) is pre-selected to test rover wheels, suspension & cameras on Jezero-like slopes. "
                "Yungay remains best for hyper-arid astrobiology. We pre-select sites for field study; we never certify mission safety."
            ),
            "s6_kicker": "05 · LOCAL IMPACT IN ANTOFAGASTA · CAJA LA ARAUCANA & UN SDGs",
            "s6_title": "4 Caja La Araucana Pillars, Regional Jobs & Open Sustainability",
            "s6_sus_title": "4 Caja La Araucana Axes & Antofagasta Jobs",
            "s6_sus_items": [
                "1. Science for All (SDG 4.3): Free cardboard-worlds mode with pictograms and voice for schools, families, and seniors.",
                "2. STEAM & Local Jobs (SDG 4.4, 8): Trains geomatics, statistics, and NASA data skills for 3 real Antofagasta sectors: Mining Robotics, Astronomical Observatories, and Solar Energy.",
                "3. Local Application (SDG 9.5, 10, 13): Puts 4 Antofagasta zones on the map and discovers Pampa 83b224 at 30 m.",
                "4. Interregional Network ‘Lattices’ (SDG 17.3, 17.16, 17.17): Connects Antofagasta (UCN, UA, schools) with other regions.",
            ],
            "s6_sdg_title": "Sustainability (Hypothesis to Validate)",
            "s6_sdg_items": [
                "100% Free Public Core (Apache 2.0): Web app and educational mode stay permanently free with no login.",
                "Institutional Hypothesis: Municipalities, libraries, and universities fund guided STEAM workshops, printable kits, and regional terrain reports (no unverified revenue claimed).",
                "Next Step: Field-validate Pampa 83b224 with university rover prototypes and local schools.",
            ],
            "s7_kicker": "06 · OPEN SCIENCE CREDITS, BRAND V2 & AI DISCLOSURE",
            "s7_title": "Legal Attribution (SPD-41a / FAIR) & Transparent AI Watermarking",
            "s7_credits_title": "Open Science Legal Credits & Brand V2 ('Salt, Copper & Sulfur')",
            "s7_credits": (
                "• Code: Apache License 2.0 · Zero NASA or third-party logos.\n"
                "• NASA Open Data (17 U.S.C. § 105): MRO CTX DEM (USGS 20m), Mars 2020 MEDA, MSL REMS/RAD, LRO LOLA/Diviner, MGS MOLA, NASA POWER v2.5, Trek WMTS, NSSDCA.\n"
                "• Partner Data: ESA Copernicus DEM GLO-30 (© DLR 2010-2014 & Airbus 2014-2018 under COPERNICUS by EU & ESA), ERA5-Land, SoilGrids (CC BY 4.0), Macrostrat (CC BY 4.0).\n"
                "• Fonts & Brand V2: Self-hosted Public Sans (USWDS/OFL) & IBM Plex Mono (OFL) + custom SVG pictograms. Colors: #101F24, #183A3A, #FFF2D7, #E4ED83, #E8A080."
            ),
            "s7_ai_title": "Super Intelligence (AI) & Watermark Disclosure (AI_DISCLOSURE.md)",
            "s7_ai_body": (
                "• 100% Human Scientific Conception: X → Y ∥ B model, 30 m DEM statistical proof, and Antofagasta findings are 100% human work.\n"
                "• Code & i18n Assistance: Claude Code, OpenAI Codex/GPT, and Google Antigravity assisted with code, tests, and ES/PT/EN parity (1,052 keys) under human review.\n"
                "• Visual AI & Mandatory Watermarks: Scientific maps, 3D globes, DEM plots, and the in-app vector logo contain ZERO generative AI. Decorative paper-cut backgrounds/symbol display ‘AI-generated · Ckepi’, and the Home intro video displays ‘AI-generated video’."
            ),
            "s7_links": "GitHub: https://github.com/AnGeMoNs/Ckepi  ·  Docs & 30 m Proof: docs/nehe/  ·  Lattices Team (Antofagasta, Chile)",
            "s7_closing": "“With Ckepi, a resemblance sparks curiosity; 30-meter evidence in Antofagasta teaches us how far it goes.”",
        },
        "es": {
            "lang": "es",
            "badge_event": "NASA Space Apps 2026 · Sede Antofagasta & Caja La Araucana · Equipo Lattices",
            "s1_title": "CKEPI",
            "s1_subtitle": "¿Dónde en Antofagasta nos preparamos para la Luna y Marte?",
            "s1_tagline": (
                "“No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué "
                "comparte, en qué se diferencia y qué nuevos lugares de Antofagasta merecen "
                "estudiarse con evidencia científica.”"
            ),
            "s1_caption": "App en vivo: 3 mundos de cartón (Luna · Antofagasta · Marte) + globos 3D + prueba real a 30 m",
            "s1_meta": "Código Abierto (Apache 2.0) · Gratis y Sin Login · Cero Logos NASA",
            "s2_kicker": "01 · EL PROBLEMA",
            "s2_title": "Las misiones ensayan en desiertos, pero eligen a simple vista y excluyen a la comunidad",
            "s2_p1_title": "1. Se elige por parecido visual",
            "s2_p1_body": "Se repite siempre el mismo sitio famoso (Yungay), mientras el resto de Antofagasta sigue sin medirse a 30 metros.",
            "s2_p2_title": "2. Herramientas cerradas al público",
            "s2_p2_body": "Los programas científicos actuales usan jerga técnica que deja fuera a escolares, docentes y familias.",
            "s2_aud_title": "3. Nuestra Propuesta de Valor",
            "s2_aud_body": "Cruzar la Luna y Marte con 4 zonas reales de Antofagasta medidas a 30 m: útil para ingenieros y simple para todos.",
            "s3_kicker": "02 · CÓMO FUNCIONA CKEPI (PASO A PASO)",
            "s3_title": "Simple para la comunidad, riguroso para el científico",
            "s3_flow": [
                (
                    "Paso 1 · Modo Explorar (Comunidad)",
                    "3 mundos de cartón flotando (Luna · Antofagasta · Marte). Tocas uno: pictogramas, mochila de 10 kg y voz en vivo (ES/PT/EN).",
                ),
                (
                    "Paso 2 · Cruce Interactivo",
                    "Cruza Jezero (Marte) y Shackleton (Luna) con 4 zonas de Antofagasta: veredictos Sí / En parte / No en < 0,4 s.",
                ),
                (
                    "Paso 3 · Modo Ciencia y Mapa 3D",
                    "Globos 3D NASA Trek, 12.193 celdas H3, histogramas a 30 m, laboratorio físico y ficha de ensayo exportable (.md / .csv).",
                ),
            ],
            "s3_ui_card_title": "Funciona en Cualquier Celular o PC (320px a 4K · Modo Local Estático)",
            "s3_ui_notes": (
                f"• El Modo Explorar (?view=explore) funciona 100 % estático (< 50 ms, incluso sin servidor) con voz Web Speech API y botones >= 44 px.\n"
                f"• El Modo Ciencia (?view=app) corre sobre FastAPI + DuckDB ({counts['earth_h3_cells_total']:,} celdas H3) + MapLibre 3D + 1.052 claves trilingües."
            ),
            "s4_kicker": "03 · EL MÉTODO Y LOS DATOS REALES DE NASA",
            "s4_title": "Nunca decimos «87 % igual a Marte»: separamos Terreno (X), Clima (Y) y Límites (B)",
            "s4_x_title": "1. Terreno que SÍ Probamos (X)",
            "s4_x_list": "Pendiente a 30 m (°), relieve local (m), rugosidad, albedo, luz solar/UV e hiperaridez (10 variables).",
            "s4_y_title": "2. Respuesta del Clima (Y)",
            "s4_y_list": "Cambio térmico día–noche ΔT (K), enfriamiento nocturno, viento y polvo (6 variables).",
            "s4_b_title": "3. Lo que la Tierra NO Imita (B)",
            "s4_b_list": "Gravedad (0,38 g / 0,166 g), aire delgado de CO2 (~0,6 kPa) o vacío (0 kPa) y radiación cósmica (~230–380 mSv/año).",
            "s4_formula": "Comparación a 30 m: Wasserstein-1 (W1 en ° y m) + Kolmogorov–Smirnov (D_KS) + Bootstrap 2D (IC 95%)",
            "s4_sources_title": "Datos Abiertos Oficiales Utilizados (NASA y Agencias Socias)",
            "s4_sources": [
                ("Marte y Luna", "NASA MRO CTX DEM (Jezero 20m→30m), Perseverance MEDA, Curiosity REMS/RAD, LRO LOLA/Diviner, Trek WMTS, NSSDCA."),
                ("Antofagasta", "ESA Copernicus DEM GLO-30 (UTM 19S a 30 m · DLR/Airbus/UE/ESA), NASA POWER v2.5, ERA5-Land, SoilGrids, Macrostrat."),
            ],
            "s5_kicker": "04 · EL HALLAZGO EN ANTOFAGASTA (DATOS REALES A 30 m)",
            "s5_title": "Cráter Jezero (Marte, pendiente 1,70°) vs. 4 Zonas de Antofagasta (6×6 km a 30 m)",
            "s5_match_title": "Qué Sí se Parece y Qué No a 30 m (Pendiente W1)",
            "s5_metrics": [
                ("1. ✅ Pampa Central (Celda 83b224)", "W1 = 0,54° [IC 0,40°–0,65°] · ¡6× más cerca que Yungay!"),
                ("   ↳ Relieve y Escala 30/60/90 m", "Relieve W1 = 1,8 m · Estable a 60 m (0,40°) y 90 m (0,27°)"),
                ("2. ⚖️ Yungay (Análogo Clásico)", "W1 = 3,32° (Laderas fuertes P90 = 15,1°; ideal en aridez)"),
                ("3. ⚠️ Cerca de Yungay (Celda 83b220)", "W1 = 3,70° · KS = 0,52 (Más quebrada que Jezero)"),
                ("4. ❌ Salar / Cordillera Sal (83b225)", "W1 = 1,71° · KS = 0,82 (NO SIRVE: Muy plana, P50 = 0,19°)"),
                ("5. ❌ Alta Cordillera / Pajonales (83b221)", "W1 = 6,92° · KS = 0,67 (NO SIRVE: Muy abrupta, P50 = 7,89°)"),
            ],
            "s5_brk_title": "Límites Físicos B (Jamás Reproducibles en la Tierra)",
            "s5_brk_rows": [
                ("Mochila de 10 kg", "3,8 kg Marte (0,38 g) / 1,7 kg Luna (0,166 g)", "10,0 kg Antofagasta (1,00 g)"),
                ("Presión del Aire", "~0,6 kPa CO2 Marte / 0 kPa Luna", "101,3 kPa Tierra"),
                ("Radiación Cósmica", "~230 mSv/año Marte / ~380 Luna", "~2,4 mSv/año Tierra"),
                ("Temperatura", "-59 a -65 °C Marte / ΔT ~290 K Luna", "15 °C media Tierra"),
            ],
            "s5_honesty": (
                "Conclusión: Preseleccionamos la Pampa de Antofagasta (83b224) para probar ruedas, suspensión y cámaras de rovers en pendientes como Jezero. "
                "Yungay sigue siendo ideal para astrobiología hiperárida. Preseleccionamos para estudiar en terreno; no certificamos."
            ),
            "s6_kicker": "05 · IMPACTO EN ANTOFAGASTA · CAJA LA ARAUCANA Y METAS ODS",
            "s6_title": "Los 4 Ejes de Caja La Araucana, Empleos Locales y Sostenibilidad",
            "s6_sus_title": "4 Ejes Caja La Araucana y Empleos en Antofagasta",
            "s6_sus_items": [
                "1. Ciencia para Todos (ODS 4.3): Modo Explorar gratuito con mundos de cartón, pictogramas y voz para colegios, familias y adultos mayores.",
                "2. STEAM y Empleo Local (ODS 4.4, 8): Enseña geomática, estadística y datos NASA para 3 rubros reales de Antofagasta: Robótica Minera, Observatorios Astronómicos y Energía Solar.",
                "3. Aplicación Local (ODS 9.5, 10, 13): Mide 4 zonas de Antofagasta y descubre el potencial de la Pampa (83b224) a 30 m.",
                "4. Red Interregional ‘Lattices’ (ODS 17.3, 17.16, 17.17): Conecta Antofagasta (UCN, UA, liceos) con otras regiones de Chile.",
            ],
            "s6_sdg_title": "Sostenibilidad (Hipótesis por Validar)",
            "s6_sdg_items": [
                "Núcleo Público 100 % Gratuito (Apache 2.0): La web y el modo educativo permanecen abiertos sin login ni cobros.",
                "Hipótesis Institucional: Municipios, bibliotecas y universidades financian talleres STEAM guiados, kits impresos y fichas territoriales (sin afirmar ventas ni convenios cerrados aún).",
                "Siguiente Paso: Validar la celda 83b224 en terreno con rovers universitarios y colegios de Antofagasta.",
            ],
            "s7_kicker": "06 · CRÉDITOS OPEN SCIENCE, IDENTIDAD V2 Y DECLARACIÓN DE IA",
            "s7_title": "Atribución Legal (SPD-41a / FAIR) y Marca de Agua Transparente de IA",
            "s7_credits_title": "Créditos Legales Open Science e Identidad V2 («Sal, Cobre y Azufre»)",
            "s7_credits": (
                "• Código: Apache License 2.0 · Cero logos de NASA ni de terceros.\n"
                "• Datos NASA (17 U.S.C. § 105): MRO CTX DEM (USGS 20m), Mars 2020 MEDA, MSL REMS/RAD, LRO LOLA/Diviner, MGS MOLA, NASA POWER v2.5, Trek WMTS, NSSDCA.\n"
                "• Datos Socios: ESA Copernicus DEM GLO-30 (© DLR 2010-2014 y Airbus 2014-2018 bajo COPERNICUS por UE y ESA), ERA5-Land, SoilGrids (CC BY 4.0), Macrostrat (CC BY 4.0).\n"
                "• Fuentes e Identidad V2: Public Sans (USWDS/OFL) e IBM Plex Mono (OFL) autoalojadas + pictogramas SVG propios. Paleta: #101F24, #183A3A, #FFF2D7, #E4ED83, #E8A080."
            ),
            "s7_ai_title": "Declaración de IA y Marcas de Agua Visibles (AI_DISCLOSURE.md)",
            "s7_ai_body": (
                "• Idea Científica 100 % Humana: El modelo X → Y ∥ B, la prueba DEM a 30 m y el hallazgo en Antofagasta son 100 % del equipo humano.\n"
                "• Asistencia en Código e i18n: Claude Code, OpenAI Codex/GPT y Google Antigravity asistieron en código, tests y paridad ES/PT/EN (1.052 claves) bajo revisión humana.\n"
                "• IA Visual con Marca de Agua: Los mapas científicos, globos 3D, gráficos DEM y el logo vectorial en la app tienen CERO IA generativa. Los fondos decorativos paper-cut llevan la marca visible ‘AI-generated · Ckepi’ y el video intro lleva ‘Video generado con IA / AI-generated video’."
            ),
            "s7_links": "GitHub: https://github.com/AnGeMoNs/Ckepi  ·  Dossier y Prueba 30 m: docs/nehe/  ·  Equipo Lattices (Antofagasta, Chile)",
            "s7_closing": "“Con Ckepi, una semejanza despierta la curiosidad; la evidencia a 30 metros en Antofagasta nos enseña hasta dónde llega.”",
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
    ui_lines = "<br/><br/>".join(c["s3_ui_notes"].split("\n"))
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
  .brand-logo-sm {{ height: 36px; width: auto; object-fit: contain; }}
  .brand-logo-lg {{ height: 72px; width: auto; object-fit: contain; margin-bottom: 10px; }}
  .kicker {{
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #E4ED83;
    margin-bottom: 4px;
  }}
  h1 {{ font-size: 50px; font-weight: 800; line-height: 1.05; color: #FFF2D7; }}
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
    padding: 15px 18px;
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.38);
  }}
  .card-title {{ font-size: 16.5px; font-weight: 700; margin-bottom: 6px; color: #FFF2D7; }}
  .copper {{ color: #E8A080; }}
  .sulfur {{ color: #E4ED83; }}
  .danger {{ color: #fca5a5; }}
  .ok {{ color: #86efac; }}
  p, li {{ font-size: 14px; line-height: 1.45; color: #EBE4D5; }}
  ul {{ padding-left: 18px; }}
  li {{ margin-bottom: 8px; }}
  .tagline {{
    font-size: 17.5px;
    line-height: 1.42;
    color: #FFF2D7;
    background: rgba(24, 58, 58, 0.82);
    border-left: 4px solid #E4ED83;
    border-radius: 8px;
    padding: 14px 18px;
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
    font-size: 12px;
    margin-right: 10px;
    white-space: nowrap;
  }}
  .source-row {{ display: flex; align-items: baseline; margin-top: 8px; font-size: 13.5px; color: #EBE4D5; }}
  .formula {{
    margin-top: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(24, 58, 58, 0.9);
    border: 1px solid rgba(228, 237, 131, 0.4);
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    color: #E4ED83;
  }}
  .metrics-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }}
  .metric {{
    background: rgba(24, 58, 58, 0.78);
    border-radius: 9px;
    padding: 8px 10px;
    border: 1px solid rgba(255, 242, 215, 0.18);
  }}
  .m-label {{ font-size: 11.5px; color: #BAC6C3; font-weight: 600; }}
  .m-val {{ font-size: 13.2px; font-weight: 750; color: #E4ED83; margin-top: 2px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }}
  th, td {{ padding: 7px 8px; border-bottom: 1px solid rgba(255, 242, 215, 0.16); text-align: left; color: #EBE4D5; }}
  th {{ color: #FFF2D7; }}
  td.warn {{ color: #E8A080; font-weight: 700; }}
  .honesty-box {{
    margin-top: 9px;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(24, 58, 58, 0.92);
    border: 1px solid rgba(232, 160, 128, 0.5);
    font-size: 13px;
    color: #FFF2D7;
  }}
  .closing {{
    font-size: 18.5px;
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
      <p style="font-size:21px; color:#E8A080; margin-top:4px; font-weight:700;">{c['s1_subtitle']}</p>
      <div class="tagline">{c['s1_tagline']}</div>
      <p style="font-size:13.5px; color:#E4ED83; font-weight:600;">{c['s1_meta']}</p>
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
    <div style="display:flex; flex-direction:column; gap:12px;">
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
      <p>{ui_lines}</p>
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
      <p style="font-size:12.5px; line-height:1.42;">{credits_lines}</p>
    </div>
    <div class="card">
      <div class="card-title copper">{c['s7_ai_title']}</div>
      <p style="font-size:12.5px; line-height:1.42;">{ai_lines}</p>
    </div>
  </div>
  <div class="card" style="text-align:center; font-size:13.5px; color:#FFF2D7; padding:9px 14px;">{c['s7_links']}</div>
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
    body_size: int = 13,
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
    tf.margin_top = Inches(0.14)
    p1 = tf.paragraphs[0]
    r1 = p1.add_run()
    r1.text = title
    r1.font.size = Pt(15.5)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(*title_color)
    p2 = tf.add_paragraph()
    p2.space_before = Pt(6)
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
    _add_textbox(s1, 0.65, 0.38, 11.8, 0.38, c["badge_event"], 11.5, True, C_PALE_SULFUR)
    s1.shapes.add_picture(str(logo_horiz), Inches(0.65), Inches(0.95), width=Inches(3.6))
    _add_textbox(s1, 0.65, 2.1, 6.15, 0.85, c["s1_subtitle"], 19, True, C_LIGHT_COPPER)
    _add_card(
        s1,
        0.65,
        3.05,
        6.15,
        1.9,
        "Our Innovation / Nuestra Innovación",
        c["s1_tagline"],
        C_PALE_SULFUR,
        14,
        C_ROCK_INK,
        C_PALE_SULFUR,
    )
    _add_textbox(s1, 0.65, 5.18, 6.15, 0.45, c["s1_meta"], 12, True, C_WARM_SALT)
    s1.shapes.add_picture(shot_mars, Inches(7.05), Inches(1.02), width=Inches(5.6))
    _add_textbox(s1, 7.05, 5.15, 5.6, 0.45, c["s1_caption"], 10.5, False, C_TEXT_MUTED, PP_ALIGN.CENTER)

    # Slide 2
    s2 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s2, assets["slide2_problema"], logo_horiz)
    _add_textbox(s2, 0.65, 0.35, 10.3, 0.32, c["s2_kicker"], 11.5, True, C_PALE_SULFUR)
    _add_textbox(s2, 0.65, 0.68, 10.3, 0.6, c["s2_title"], 23, True, C_WARM_SALT)
    _add_card(s2, 0.65, 1.5, 5.9, 1.7, c["s2_p1_title"], c["s2_p1_body"], C_LIGHT_COPPER, 13.5)
    _add_card(s2, 0.65, 3.35, 5.9, 1.7, c["s2_p2_title"], c["s2_p2_body"], C_PALE_SULFUR, 13.5)
    _add_card(s2, 0.65, 5.2, 5.9, 1.7, c["s2_aud_title"], c["s2_aud_body"], C_OK_GREEN, 13.5)
    s2.shapes.add_picture(shot_moon, Inches(6.85), Inches(1.5), width=Inches(5.8))

    # Slide 3
    s3 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s3, assets["slide3_solucion"], logo_horiz)
    _add_textbox(s3, 0.65, 0.35, 10.3, 0.32, c["s3_kicker"], 11.5, True, C_PALE_SULFUR)
    _add_textbox(s3, 0.65, 0.68, 10.3, 0.6, c["s3_title"], 23, True, C_WARM_SALT)
    for i, (t, b) in enumerate(c["s3_flow"]):
        _add_card(s3, 0.65 + i * 4.08, 1.48, 3.85, 1.85, t, b, C_LIGHT_COPPER, 12.5)
    s3.shapes.add_picture(shot_analysis, Inches(0.65), Inches(3.52), width=Inches(6.2))
    _add_card(s3, 7.1, 3.52, 5.55, 3.38, c["s3_ui_card_title"], c["s3_ui_notes"], C_PALE_SULFUR, 12.5)

    # Slide 4
    s4 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s4, assets["slide4_ciencia"], logo_horiz)
    _add_textbox(s4, 0.65, 0.35, 10.3, 0.32, c["s4_kicker"], 11.5, True, C_PALE_SULFUR)
    _add_textbox(s4, 0.65, 0.68, 10.3, 0.6, c["s4_title"], 23, True, C_WARM_SALT)
    _add_card(s4, 0.65, 1.48, 3.85, 2.0, c["s4_x_title"], c["s4_x_list"], C_PALE_SULFUR, 13)
    _add_card(s4, 4.73, 1.48, 3.85, 2.0, c["s4_y_title"], c["s4_y_list"], C_LIGHT_COPPER, 13)
    _add_card(s4, 8.81, 1.48, 3.85, 2.0, c["s4_b_title"], c["s4_b_list"], C_WARN_RED, 13)
    _add_textbox(s4, 0.65, 3.62, 12.0, 0.52, c["s4_formula"], 12.5, True, C_PALE_SULFUR)
    sources_text = "\n\n".join(f"• {k}: {v}" for k, v in c["s4_sources"])
    _add_card(s4, 0.65, 4.28, 12.0, 2.6, c["s4_sources_title"], sources_text, C_WARM_SALT, 12)

    # Slide 5
    s5 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s5, assets["slide5_hallazgo"], logo_horiz)
    _add_textbox(s5, 0.65, 0.35, 10.3, 0.32, c["s5_kicker"], 11.5, True, C_PALE_SULFUR)
    _add_textbox(s5, 0.65, 0.68, 10.3, 0.6, c["s5_title"], 22, True, C_WARM_SALT)
    metrics_text = "\n".join(f"• {k}: {v}" for k, v in c["s5_metrics"])
    _add_card(s5, 0.65, 1.45, 5.9, 3.7, c["s5_match_title"], metrics_text, C_OK_GREEN, 11.5)
    brk_text = "\n".join(f"• {var}: {mars}  vs.  {earth}" for var, mars, earth in c["s5_brk_rows"])
    _add_card(s5, 6.75, 1.45, 5.9, 3.7, c["s5_brk_title"], brk_text, C_LIGHT_COPPER, 12)
    _add_card(
        s5,
        0.65,
        5.3,
        12.0,
        1.58,
        "Concrete Takeaway / Conclusión Práctica",
        c["s5_honesty"],
        C_PALE_SULFUR,
        11.5,
        C_ROCK_INK,
        C_LIGHT_COPPER,
    )

    # Slide 6
    s6 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s6, assets["slide6_araucana"], logo_horiz)
    _add_textbox(s6, 0.65, 0.35, 10.3, 0.32, c["s6_kicker"], 11.5, True, C_PALE_SULFUR)
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
        11.5,
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
        12,
    )

    # Slide 7
    s7 = prs.slides.add_slide(blank)
    _apply_slide_bg_and_logo(s7, assets["slide7_creditos"], logo_horiz)
    _add_textbox(s7, 0.65, 0.35, 10.3, 0.32, c["s7_kicker"], 11.5, True, C_PALE_SULFUR)
    _add_textbox(s7, 0.65, 0.68, 10.3, 0.6, c["s7_title"], 23, True, C_WARM_SALT)
    _add_card(s7, 0.65, 1.45, 5.9, 3.65, c["s7_credits_title"], c["s7_credits"], C_PALE_SULFUR, 10.5)
    _add_card(s7, 6.75, 1.45, 5.9, 3.65, c["s7_ai_title"], c["s7_ai_body"], C_LIGHT_COPPER, 10.5)
    _add_textbox(s7, 0.65, 5.22, 12.0, 0.42, c["s7_links"], 12, False, C_WARM_SALT, PP_ALIGN.CENTER)
    _add_textbox(s7, 0.65, 5.75, 12.0, 0.75, c["s7_closing"], 17, True, C_PALE_SULFUR, PP_ALIGN.CENTER)

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
