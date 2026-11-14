"""Build Ckepi's 7-slide reference presentation (PPTX + PDF + HTML) in English (Global) and Spanish (Local Antofagasta / Caja La Araucana) respecting all 3 rubrics."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

OUT_DIR = Path(__file__).resolve().parent


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
            "s1_title": "Ckepi",
            "s1_subtitle": "Terrestrial Planetary Analog Discovery Engine via Causal Decomposition (X → Y ∥ B) & 30 m Common-Scale Spatial Statistics",
            "s1_tagline": (
                "“We do not seek to prove that Atacama is identical to Mars. We seek to show which "
                "characteristics it shares, which differences exist, and which new locations deserve "
                "to be studied using scientific evidence.”"
            ),
            "s1_caption": "Live prototype: 3D Mars/Moon WMTS globes + live H3 hover HUD + 30 m CTX/Copernicus DEM comparison",
            "s1_meta": "Open-Source · Apache License 2.0 · Public Access Without Login · Zero NASA Logos",
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
                    "Interactive paper-cut hexagon intro transition (HexField) into 3D Moon/Mars WMTS globes with live H3 hover HUD and 5 NASA ROIs.",
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
            "s3_ui_card_title": "Verified Mobile-First UI & Engineering Architecture",
            "s3_ui_notes": (
                f"React 18 + TypeScript + MapLibre GL v6 (bundled WebWorker) + FastAPI + DuckDB ({counts['earth_h3_cells_total']:,} cached H3 cells: "
                "790 Res-2 & 11,403 Res-3) + SciPy 30 m DEM engine. Tri-lingual parity (EN/ES/PT · 842 i18n keys), dark/light themes, "
                "and reproducible CSV / GeoJSON / Markdown export."
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
            "s7_kicker": "06 · OPEN SCIENCE LEGAL CREDITS, BRAND IDENTITY & AI DISCLOSURE",
            "s7_title": "Full Legal Attribution (SPD-41a / FAIR) & Transparent AI Watermarking",
            "s7_credits_title": "Legal Open Science Citations (Code · Data · Typography · Icons · Brand)",
            "s7_credits": (
                "• Code License: Apache License 2.0 (osi-approved).\n"
                "• NASA Open Data (17 U.S.C. § 105 Public Domain, text credit only, zero NASA logos): MRO CTX / USGS Mars 2020 TRN DEM (20 m), Mars 2020 MEDA, MSL REMS/RAD, LRO LOLA/Diviner, MGS MOLA, NASA POWER v2.5, NASA Trek WMTS, NSSDCA.\n"
                "• Partner Data: ESA Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 & Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by EU & ESA), ERA5-Land, ISRIC SoilGrids v2.0 (CC BY 4.0), Macrostrat (CC BY 4.0).\n"
                "• Typography & Icons: System UI Stack + JetBrains Mono (SIL OFL 1.1) + Lucide Icons (ISC/MIT). Brand Palette: Deep Space #020617, Regolith #ea580c, Ckepi Cyan #0ea5e9."
            ),
            "s7_ai_title": "Super Intelligence (AI) & Watermark Disclosure (AI_DISCLOSURE.md)",
            "s7_ai_body": (
                "• 100% Human Scientific Conception: Causal decomposition (X → Y ∥ B), 30 m DEM statistical methodology, and product design are entirely original human work.\n"
                "• Code & i18n Assistance: Claude Code, OpenAI Codex/GPT, and Gemini assisted with boilerplate, tests, documentation, and ES/PT/EN translation parity under human verification.\n"
                "• Visual AI & Mandatory Watermark: Scientific maps, 3D globes, and DEM plots contain ZERO generative AI. The decorative Home intro video (ckepi-home.mp4) carries a visible ‘AI-generated video’ watermark, and decorative paper-cut card SVGs carry ‘AI-generated · Ckepi’ attribution."
            ),
            "s7_links": "Public Repo: https://github.com/AnGeMoNs/Ckepi  ·  Docs & 30 m Proof: docs/nehe/ & docs/RESULTADOS_TERRENO_REALES.md  ·  Team: Lattices (Antofagasta)",
            "s7_closing": "“With Ckepi, a resemblance sparks curiosity; 30-meter scientific evidence teaches us how far it truly goes.”",
        },
        "es": {
            "lang": "es",
            "badge_event": "NASA Space Apps Challenge 2026 · Sede Antofagasta & Caja La Araucana · Equipo Lattices",
            "s1_title": "Ckepi",
            "s1_subtitle": "Motor de Descubrimiento de Análogos Planetarios por Descomposición Causal (X → Y ∥ B) y Estadística Espacial a Escala Común de 30 m",
            "s1_tagline": (
                "“No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué "
                "características comparte, qué diferencias existen y qué nuevos lugares merecen "
                "ser estudiados utilizando evidencia científica.”"
            ),
            "s1_caption": "Prototipo en vivo: globos 3D Marte/Luna WMTS + HUD H3 en vivo + comparación real DEM a 30 m",
            "s1_meta": "Ciencia Abierta · Apache License 2.0 · Acceso Público Sin Login · Cero Logos NASA",
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
                    "1. Intro y Globos 3D WMTS",
                    "Intro con transición hexagonal paper-cut (HexField) hacia globos 3D de Luna y Marte con HUD H3 en vivo y 5 sitios NASA curados.",
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
            "s3_ui_card_title": "Arquitectura Verificada y Accesibilidad Mobile-First",
            "s3_ui_notes": (
                f"React 18 + TypeScript + MapLibre GL v6 (WebWorker integrado) + FastAPI + DuckDB ({counts['earth_h3_cells_total']:,} celdas H3 en caché: "
                "790 Res-2 y 11.403 Res-3) + motor estadístico SciPy a 30 m. Paridad trilingüe (ES/PT/EN · 842 claves), modo claro/oscuro "
                "y exportación reproducible CSV / GeoJSON / Markdown."
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
            "s7_kicker": "06 · CRÉDITOS LEGALES OPEN SCIENCE, IDENTIDAD DE MARCA Y DECLARACIÓN DE IA",
            "s7_title": "Atribución Legal Completa (SPD-41a / FAIR) y Transparencia en Uso de IA",
            "s7_credits_title": "Citas Legales Open Science (Código · Datos · Tipografías · Íconos · Marca)",
            "s7_credits": (
                "• Licencia de Código: Apache License 2.0 (aprobada por OSI).\n"
                "• Datos Abiertos NASA (17 U.S.C. § 105 Dominio Público, solo texto, cero logos NASA): MRO CTX / USGS Mars 2020 TRN DEM (20 m), Mars 2020 MEDA, MSL REMS/RAD, LRO LOLA/Diviner, MGS MOLA, NASA POWER v2.5, NASA Trek WMTS, NSSDCA.\n"
                "• Datos Socios: ESA Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 y Airbus Defence and Space GmbH 2014-2018 bajo COPERNICUS por UE y ESA), ERA5-Land, ISRIC SoilGrids v2.0 (CC BY 4.0), Macrostrat (CC BY 4.0).\n"
                "• Tipografía, Íconos y Marca: System UI Stack + JetBrains Mono (SIL OFL 1.1) + Lucide Icons (ISC/MIT). Paleta: Deep Space #020617, Regolith #ea580c, Ckepi Cyan #0ea5e9."
            ),
            "s7_ai_title": "Declaración de Super Intelligence (IA) y Marca de Agua (AI_DISCLOSURE.md)",
            "s7_ai_body": (
                "• Concepción Científica 100 % Humana: La descomposición causal (X → Y ∥ B), la metodología estadística DEM a 30 m y el diseño de producto son autoría íntegra del equipo humano.\n"
                "• Asistencia en Código e i18n: Claude Code, OpenAI Codex/GPT y Gemini asistieron en código, tests, documentación y paridad ES/PT/EN bajo revisión humana.\n"
                "• IA Visual y Marca de Agua Obligatoria: Los mapas científicos, globos 3D y gráficos DEM tienen CERO IA generativa. El video decorativo del Home (ckepi-home.mp4) lleva marca de agua visible ‘Video generado con IA / AI-generated video’ y los fondos paper-cut llevan atribución ‘Generado con IA · Ckepi’."
            ),
            "s7_links": "Repositorio Público: https://github.com/AnGeMoNs/Ckepi  ·  Dossier y Prueba 30 m: docs/nehe/ y docs/RESULTADOS_TERRENO_REALES.md  ·  Equipo: Lattices (Antofagasta)",
            "s7_closing": "“Con Ckepi, una semejanza despierta la curiosidad; la evidencia científica a 30 metros nos enseña hasta dónde llega.”",
        },
    }


def render_html(c: dict[str, Any]) -> str:
    shot_mars = (OUT_DIR / "shot_explorer_mars.png").as_uri()
    shot_analysis = (OUT_DIR / "shot_atacama_analysis.png").as_uri()
    shot_moon = (OUT_DIR / "shot_explorer_moon.png").as_uri()

    flow_html = "".join(
        f'<div class="card"><div class="card-title accent">{t}</div><p>{b}</p></div>'
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
    background: #060913;
    color: #f8fafc;
  }}
  .slide {{
    width: 13.333in;
    height: 7.5in;
    padding: 0.48in 0.6in;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    background: radial-gradient(circle at 85% 15%, rgba(234, 88, 12, 0.16), transparent 45%),
                radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.14), transparent 45%),
                #060913;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .slide:last-child {{ page-break-after: auto; }}
  .kicker {{
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 6px;
  }}
  h1 {{ font-size: 52px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; }}
  h2 {{ font-size: 28px; font-weight: 750; line-height: 1.18; margin-bottom: 12px; }}
  .pill {{
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.14);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #7dd3fc;
    font-size: 12px;
    font-weight: 600;
  }}
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; }}
  .grid-3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }}
  .grid-hero {{ display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 26px; align-items: center; flex: 1; }}
  .card {{
    background: rgba(15, 23, 42, 0.84);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 14px;
    padding: 15px 18px;
  }}
  .card-title {{ font-size: 16px; font-weight: 700; margin-bottom: 6px; color: #f1f5f9; }}
  .accent {{ color: #fb923c; }}
  .cyan {{ color: #38bdf8; }}
  .danger {{ color: #f87171; }}
  .ok {{ color: #34d399; }}
  p, li {{ font-size: 13.5px; line-height: 1.44; color: #cbd5e1; }}
  ul {{ padding-left: 18px; }}
  li {{ margin-bottom: 8px; }}
  .tagline {{
    font-size: 17px;
    line-height: 1.42;
    color: #e2e8f0;
    border-left: 4px solid #fb923c;
    padding-left: 16px;
    margin: 18px 0;
  }}
  .shot {{
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
    object-fit: cover;
  }}
  .shot-tall {{ height: 4.3in; object-position: top center; }}
  .shot-med {{ height: 3.35in; object-position: top center; }}
  .caption {{ font-size: 11.5px; color: #94a3b8; margin-top: 6px; text-align: center; }}
  .footer {{
    display: flex;
    justify-content: space-between;
    font-size: 11.5px;
    color: #64748b;
    border-top: 1px solid rgba(148, 163, 184, 0.16);
    padding-top: 8px;
  }}
  .badge {{
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    background: rgba(251, 146, 60, 0.16);
    color: #fdba74;
    font-weight: 700;
    font-size: 11.5px;
    margin-right: 10px;
    white-space: nowrap;
  }}
  .source-row {{ display: flex; align-items: baseline; margin-top: 8px; font-size: 13px; color: #cbd5e1; }}
  .formula {{
    margin-top: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(14, 165, 233, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.3);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    color: #e0f2fe;
  }}
  .metrics-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }}
  .metric {{
    background: rgba(30, 41, 59, 0.75);
    border-radius: 9px;
    padding: 8px 10px;
    border: 1px solid rgba(148, 163, 184, 0.16);
  }}
  .m-label {{ font-size: 11.5px; color: #94a3b8; font-weight: 600; }}
  .m-val {{ font-size: 13.5px; font-weight: 750; color: #34d399; margin-top: 2px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.5px; }}
  th, td {{ padding: 7px 8px; border-bottom: 1px solid rgba(148, 163, 184, 0.18); text-align: left; }}
  td.warn {{ color: #fca5a5; font-weight: 700; }}
  .honesty-box {{
    margin-top: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.35);
    font-size: 12.5px;
    color: #fecaca;
  }}
  .closing {{
    font-size: 19px;
    font-weight: 700;
    text-align: center;
    color: #f8fafc;
    padding: 12px 20px;
    border-radius: 12px;
    background: linear-gradient(90deg, rgba(234,88,12,0.18), rgba(14,165,233,0.18));
    border: 1px solid rgba(148, 163, 184, 0.25);
  }}
</style>
</head>
<body>

<!-- SLIDE 1 -->
<section class="slide">
  <div><span class="pill">{c['badge_event']}</span></div>
  <div class="grid-hero">
    <div>
      <h1>{c['s1_title']}</h1>
      <p style="font-size:18px; color:#94a3b8; margin-top:8px; font-weight:600;">{c['s1_subtitle']}</p>
      <div class="tagline">{c['s1_tagline']}</div>
      <p style="font-size:13px; color:#7dd3fc; font-weight:600;">{c['s1_meta']}</p>
    </div>
    <div>
      <img class="shot shot-tall" src="{shot_mars}" alt="Ckepi 3D Explorer" />
      <div class="caption">{c['s1_caption']}</div>
    </div>
  </div>
  <div class="footer"><span>Ckepi · 1 / 7</span><span>NASA Space Apps Challenge 2026 · Lattices Team</span></div>
</section>

<!-- SLIDE 2 -->
<section class="slide">
  <div>
    <div class="kicker">{c['s2_kicker']}</div>
    <h2>{c['s2_title']}</h2>
  </div>
  <div class="grid-2" style="flex:1; align-items:center;">
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card">
        <div class="card-title accent">{c['s2_p1_title']}</div>
        <p>{c['s2_p1_body']}</p>
      </div>
      <div class="card">
        <div class="card-title cyan">{c['s2_p2_title']}</div>
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
<section class="slide">
  <div>
    <div class="kicker">{c['s3_kicker']}</div>
    <h2>{c['s3_title']}</h2>
  </div>
  <div class="grid-3">{flow_html}</div>
  <div class="grid-2" style="margin-top:14px; align-items:center;">
    <img class="shot shot-med" src="{shot_analysis}" alt="Causal Decomposition & Matrix" />
    <div class="card" style="height:100%; display:flex; flex-direction:column; justify-content:center;">
      <div class="card-title cyan">{c['s3_ui_card_title']}</div>
      <p>{c['s3_ui_notes']}</p>
    </div>
  </div>
  <div class="footer"><span>Ckepi · 3 / 7</span><span>{c['s3_kicker']}</span></div>
</section>

<!-- SLIDE 4 -->
<section class="slide">
  <div>
    <div class="kicker">{c['s4_kicker']}</div>
    <h2>{c['s4_title']}</h2>
  </div>
  <div class="grid-3">
    <div class="card">
      <div class="card-title cyan">{c['s4_x_title']}</div>
      <p>{c['s4_x_list']}</p>
    </div>
    <div class="card">
      <div class="card-title accent">{c['s4_y_title']}</div>
      <p>{c['s4_y_list']}</p>
    </div>
    <div class="card">
      <div class="card-title danger">{c['s4_b_title']}</div>
      <p>{c['s4_b_list']}</p>
    </div>
  </div>
  <div class="formula">{c['s4_formula']}</div>
  <div class="card" style="margin-top:10px;">
    <div class="card-title">{c['s4_sources_title']}</div>
    {sources_html}
  </div>
  <div class="footer"><span>Ckepi · 4 / 7</span><span>{c['s4_kicker']}</span></div>
</section>

<!-- SLIDE 5 -->
<section class="slide">
  <div>
    <div class="kicker">{c['s5_kicker']}</div>
    <h2>{c['s5_title']}</h2>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title ok">{c['s5_match_title']}</div>
      <div class="metrics-grid">{metrics_html}</div>
    </div>
    <div class="card">
      <div class="card-title danger">{c['s5_brk_title']}</div>
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
<section class="slide">
  <div>
    <div class="kicker">{c['s6_kicker']}</div>
    <h2>{c['s6_title']}</h2>
  </div>
  <div class="grid-2" style="flex:1; align-items:center;">
    <div class="card" style="height:100%;">
      <div class="card-title ok">{c['s6_sus_title']}</div>
      <ul>{sus_html}</ul>
    </div>
    <div class="card" style="height:100%;">
      <div class="card-title cyan">{c['s6_sdg_title']}</div>
      <ul>{sdg_html}</ul>
    </div>
  </div>
  <div class="footer"><span>Ckepi · 6 / 7</span><span>{c['s6_kicker']}</span></div>
</section>

<!-- SLIDE 7 -->
<section class="slide">
  <div>
    <div class="kicker">{c['s7_kicker']}</div>
    <h2>{c['s7_title']}</h2>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title cyan">{c['s7_credits_title']}</div>
      <p style="font-size:12.5px; line-height:1.42;">{credits_lines}</p>
    </div>
    <div class="card">
      <div class="card-title accent">{c['s7_ai_title']}</div>
      <p style="font-size:12.5px; line-height:1.42;">{ai_lines}</p>
    </div>
  </div>
  <div class="card" style="text-align:center; font-size:13.5px; color:#cbd5e1; padding:10px 14px;">{c['s7_links']}</div>
  <div class="closing">{c['s7_closing']}</div>
  <div class="footer"><span>Ckepi · 7 / 7</span><span>{c['s7_kicker']}</span></div>
</section>

</body>
</html>"""


def _style_bg(slide: Any) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor(6, 9, 19)


def _add_textbox(
    slide: Any,
    left: float,
    top: float,
    width: float,
    height: float,
    text: str,
    size: int = 15,
    bold: bool = False,
    color: tuple[int, int, int] = (203, 213, 225),
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
    title_color: tuple[int, int, int] = (241, 245, 249),
    body_size: int = 12,
) -> None:
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(15, 23, 42)
    shape.line.color.rgb = RGBColor(51, 65, 85)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.18)
    tf.margin_right = Inches(0.18)
    tf.margin_top = Inches(0.14)
    p1 = tf.paragraphs[0]
    r1 = p1.add_run()
    r1.text = title
    r1.font.size = Pt(15)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(*title_color)
    p2 = tf.add_paragraph()
    p2.space_before = Pt(5)
    r2 = p2.add_run()
    r2.text = body
    r2.font.size = Pt(body_size)
    r2.font.color.rgb = RGBColor(203, 213, 225)


def build_pptx(c: dict[str, Any], pptx_path: Path) -> None:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    shot_mars = str(OUT_DIR / "shot_explorer_mars.png")
    shot_moon = str(OUT_DIR / "shot_explorer_moon.png")
    shot_analysis = str(OUT_DIR / "shot_atacama_analysis.png")

    # Slide 1
    s1 = prs.slides.add_slide(blank)
    _style_bg(s1)
    _add_textbox(s1, 0.65, 0.4, 9.5, 0.4, c["badge_event"], 11, True, (125, 211, 252))
    _add_textbox(s1, 0.65, 1.0, 6.2, 0.85, c["s1_title"], 50, True, (248, 250, 252))
    _add_textbox(s1, 0.65, 1.9, 6.2, 0.9, c["s1_subtitle"], 16, True, (148, 163, 184))
    _add_textbox(s1, 0.65, 2.95, 6.2, 1.85, c["s1_tagline"], 16, False, (226, 232, 240))
    _add_textbox(s1, 0.65, 5.2, 6.2, 0.45, c["s1_meta"], 12, True, (56, 189, 248))
    s1.shapes.add_picture(shot_mars, Inches(7.05), Inches(1.05), width=Inches(5.6))
    _add_textbox(s1, 7.05, 5.15, 5.6, 0.45, c["s1_caption"], 10, False, (148, 163, 184), PP_ALIGN.CENTER)

    # Slide 2
    s2 = prs.slides.add_slide(blank)
    _style_bg(s2)
    _add_textbox(s2, 0.65, 0.4, 12.0, 0.35, c["s2_kicker"], 11, True, (56, 189, 248))
    _add_textbox(s2, 0.65, 0.75, 12.0, 0.6, c["s2_title"], 24, True, (248, 250, 252))
    _add_card(s2, 0.65, 1.55, 5.9, 1.7, c["s2_p1_title"], c["s2_p1_body"], (251, 146, 60), 12)
    _add_card(s2, 0.65, 3.4, 5.9, 1.7, c["s2_p2_title"], c["s2_p2_body"], (56, 189, 248), 12)
    _add_card(s2, 0.65, 5.25, 5.9, 1.7, c["s2_aud_title"], c["s2_aud_body"], (52, 211, 153), 12)
    s2.shapes.add_picture(shot_moon, Inches(6.85), Inches(1.55), width=Inches(5.8))

    # Slide 3
    s3 = prs.slides.add_slide(blank)
    _style_bg(s3)
    _add_textbox(s3, 0.65, 0.4, 12.0, 0.35, c["s3_kicker"], 11, True, (56, 189, 248))
    _add_textbox(s3, 0.65, 0.75, 12.0, 0.6, c["s3_title"], 24, True, (248, 250, 252))
    for i, (t, b) in enumerate(c["s3_flow"]):
        _add_card(s3, 0.65 + i * 4.08, 1.5, 3.85, 1.85, t, b, (251, 146, 60), 12)
    s3.shapes.add_picture(shot_analysis, Inches(0.65), Inches(3.55), width=Inches(6.2))
    _add_card(s3, 7.1, 3.55, 5.55, 3.4, c["s3_ui_card_title"], c["s3_ui_notes"], (56, 189, 248), 12)

    # Slide 4
    s4 = prs.slides.add_slide(blank)
    _style_bg(s4)
    _add_textbox(s4, 0.65, 0.4, 12.0, 0.35, c["s4_kicker"], 11, True, (56, 189, 248))
    _add_textbox(s4, 0.65, 0.75, 12.0, 0.6, c["s4_title"], 24, True, (248, 250, 252))
    _add_card(s4, 0.65, 1.5, 3.85, 2.0, c["s4_x_title"], c["s4_x_list"], (56, 189, 248), 12)
    _add_card(s4, 4.73, 1.5, 3.85, 2.0, c["s4_y_title"], c["s4_y_list"], (251, 146, 60), 12)
    _add_card(s4, 8.81, 1.5, 3.85, 2.0, c["s4_b_title"], c["s4_b_list"], (248, 113, 113), 12)
    _add_textbox(s4, 0.65, 3.65, 12.0, 0.55, c["s4_formula"], 12, True, (224, 242, 254))
    sources_text = "\n\n".join(f"• {k}: {v}" for k, v in c["s4_sources"])
    _add_card(s4, 0.65, 4.35, 12.0, 2.6, c["s4_sources_title"], sources_text, (241, 245, 249), 11)

    # Slide 5
    s5 = prs.slides.add_slide(blank)
    _style_bg(s5)
    _add_textbox(s5, 0.65, 0.4, 12.0, 0.35, c["s5_kicker"], 11, True, (56, 189, 248))
    _add_textbox(s5, 0.65, 0.75, 12.0, 0.6, c["s5_title"], 23, True, (248, 250, 252))
    metrics_text = "\n".join(f"• {k}: {v}" for k, v in c["s5_metrics"])
    _add_card(s5, 0.65, 1.5, 5.9, 3.7, c["s5_match_title"], metrics_text, (52, 211, 153), 11)
    brk_text = "\n".join(f"• {var}: {mars}  vs.  {earth}" for var, mars, earth in c["s5_brk_rows"])
    _add_card(s5, 6.75, 1.5, 5.9, 3.7, c["s5_brk_title"], brk_text, (248, 113, 113), 11)
    _add_card(s5, 0.65, 5.35, 12.0, 1.6, "Physical Honesty & Scope of Validity", c["s5_honesty"], (252, 165, 165), 11)

    # Slide 6
    s6 = prs.slides.add_slide(blank)
    _style_bg(s6)
    _add_textbox(s6, 0.65, 0.4, 12.0, 0.35, c["s6_kicker"], 11, True, (56, 189, 248))
    _add_textbox(s6, 0.65, 0.75, 12.0, 0.6, c["s6_title"], 24, True, (248, 250, 252))
    _add_card(
        s6,
        0.65,
        1.55,
        5.9,
        5.3,
        c["s6_sus_title"],
        "\n\n".join(f"• {x}" for x in c["s6_sus_items"]),
        (52, 211, 153),
        11,
    )
    _add_card(
        s6,
        6.75,
        1.55,
        5.9,
        5.3,
        c["s6_sdg_title"],
        "\n\n".join(f"• {x}" for x in c["s6_sdg_items"]),
        (56, 189, 248),
        11,
    )

    # Slide 7
    s7 = prs.slides.add_slide(blank)
    _style_bg(s7)
    _add_textbox(s7, 0.65, 0.4, 12.0, 0.35, c["s7_kicker"], 11, True, (56, 189, 248))
    _add_textbox(s7, 0.65, 0.75, 12.0, 0.6, c["s7_title"], 24, True, (248, 250, 252))
    _add_card(s7, 0.65, 1.5, 5.9, 3.65, c["s7_credits_title"], c["s7_credits"], (56, 189, 248), 10)
    _add_card(s7, 6.75, 1.5, 5.9, 3.65, c["s7_ai_title"], c["s7_ai_body"], (251, 146, 60), 10)
    _add_textbox(s7, 0.65, 5.3, 12.0, 0.45, c["s7_links"], 12, False, (203, 213, 225), PP_ALIGN.CENTER)
    _add_textbox(s7, 0.65, 5.9, 12.0, 0.8, c["s7_closing"], 17, True, (248, 250, 252), PP_ALIGN.CENTER)

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
    metrics = load_metrics()
    copy = build_copy(metrics)
    for lang, c in copy.items():
        html_path = OUT_DIR / f"ckepi-pitch-{lang}.html"
        pptx_path = OUT_DIR / f"ckepi-pitch-{lang}.pptx"
        pdf_path = OUT_DIR / f"ckepi-pitch-{lang}.pdf"
        html_path.write_text(render_html(c), encoding="utf-8")
        build_pptx(c, pptx_path)
        export_pdf_from_pptx(pptx_path)
        print(f"Generated {pptx_path.name}, {pdf_path.name}, and {html_path.name}")


if __name__ == "__main__":
    main()
