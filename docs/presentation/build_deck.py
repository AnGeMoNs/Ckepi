"""Build Ckepi's 7-slide presentation (PDF + PPTX) in English and Spanish from verified data."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_DIR = Path(__file__).resolve().parent


def load_metrics() -> dict[str, Any]:
    return json.loads((OUT_DIR / "pitch_verified_metrics.json").read_text(encoding="utf-8"))


def build_copy(m: dict[str, Any]) -> dict[str, dict[str, Any]]:
    counts = m["schema_counts"]
    atacama = m["atacama_cell"]
    iv = atacama["iv_similarity_breakdown"]
    brk = {b["variable"]: b for b in atacama["breakage_alerts"]}

    return {
        "en": {
            "lang": "en",
            "badge_event": "NASA Space Apps Challenge 2026 · Antofagasta, Chile",
            "s1_title": "Ckepi",
            "s1_subtitle": "Terrestrial Analog Discovery Engine via Causal Variable Decomposition",
            "s1_tagline": (
                "“Ckepi brings Earth, Moon, and Mars data closer together to understand "
                "what we can compare—and where similarity ends.”"
            ),
            "s1_caption": "Live prototype (branch kevin): 3D Mars/Moon globes + global H3 Earth grid",
            "s1_meta": "Open-Source · MIT / Apache-2.0 · No Login Required",
            "s2_kicker": "01 · THE PROBLEM & AUDIENCE",
            "s2_title": "A desert photo looks like Mars—but hides the physics",
            "s2_p1_title": "Scientific Blind Spot",
            "s2_p1_body": (
                "Visual resemblance or simple averages mask critical differences in thermal inertia, "
                "slope, radiation, pressure, and gravity—leading to misleading analog claims."
            ),
            "s2_p2_title": "Accessibility Barrier",
            "s2_p2_body": (
                "Existing planetary tools assume specialist training, leaving out students, educators, "
                "families, and users with low digital literacy."
            ),
            "s2_aud_title": "Who We Serve & Potential Facilitators",
            "s2_aud_body": (
                "Mission researchers, students, teachers, and families. Libraries, municipalities, "
                "universities, and community centers are prospective facilitators (no confirmed agreements)."
            ),
            "s3_kicker": "02 · THE SOLUTION",
            "s3_title": "One scientific engine, progressive depth for every user",
            "s3_flow": [
                ("1. Explore 3D Globes", "Rotate Moon & Mars WMTS globes and probe any coordinate or 5 curated NASA ROIs."),
                ("2. Compare by Dimension", "Rank terrestrial H3 cells across independent substrate (X) and dependent climate (Y)."),
                ("3. Inspect Physical Limits", "Reveal irreducible breakage boundaries (B) and valid vs. invalid field tests."),
            ],
            "s3_ui_notes": (
                f"Built in React + MapLibre GL v6 with {counts['earth_h3_cells_total']:,} cached H3 cells, "
                "tri-lingual UI (EN / ES / PT · 460 keys), dark/light themes, and CSV / GeoJSON / Markdown export."
            ),
            "s4_kicker": "03 · SCIENCE & REAL NASA DATA",
            "s4_title": "Causal Decomposition (X → Y) & Breakage Boundaries (B)",
            "s4_x_title": f"{counts['independent_variables']} Independent Forcings (X)",
            "s4_x_list": "Roughness, slope, thermal inertia, albedo, solar flux, subsurface ice, aridity, RH, UV index, LAI.",
            "s4_y_title": f"{counts['dependent_variables']} Dependent Responses (Y)",
            "s4_y_list": "Diurnal ΔT, nocturnal cooling, mean surface temp, wind speed, aeolian dust flux, ice sublimation.",
            "s4_b_title": f"{counts['breakage_variables']} Breakage Boundaries (B)",
            "s4_b_list": "Surface gravity (g), atmospheric pressure (mbar), and ionizing cosmic radiation (mSv/yr).",
            "s4_formula": "Combined = 0.60·S_ind + 0.40·S_dep (RidgeCV / RandomForest / PCA + uncertainty interval)",
            "s4_sources_title": "Integrated Open Data (Measured · Orbital-Derived · Model Proxy)",
            "s4_sources": [
                ("NASA Mars & Moon", "Perseverance MEDA, Curiosity REMS, PDS ODE (LRO Diviner/LOLA/Mini-RF, MRO CRISM/SHARAD), Trek WMTS"),
                ("NASA & Earth Partners", "NASA POWER Climatology, Earthdata CMR/GIBS, Copernicus 90m DEM, ERA5-Land, SoilGrids v2.0, Macrostrat, ESA, CSA, JAXA"),
            ],
            "s5_kicker": "04 · VERIFIED PROOF & LIMITS",
            "s5_title": "Case Study: Jezero Crater (Mars) ↔ Atacama / Yungay (Earth)",
            "s5_match_title": f"Verified H3 Cell {atacama['earth_cell_h3']} · {atacama['known_analog_name']}",
            "s5_metrics": [
                ("Aridity Index Similarity", f"{iv['aridity_index']:.3f}"),
                ("Subsurface Ice Match", f"{iv['subsurface_ice_frac']:.3f}"),
                ("Surface Albedo Match", f"{iv['surface_albedo']:.3f}"),
                ("Thermal Inertia Match", f"{iv['thermal_inertia']:.3f}"),
                ("Slope Match", f"{iv['slope_deg']:.3f}"),
                ("Combined Score (CI)", f"{atacama['combined_score']:.3f} [{atacama['confidence_interval'][0]:.3f}–{atacama['confidence_interval'][1]:.3f}]"),
            ],
            "s5_brk_title": f"Irreducible Breakage Boundary (R_break = {atacama['r_break_overall']:.3f})",
            "s5_brk_rows": [
                ("Gravity", f"{brk['gravity_g']['planetary_value']} g (Mars)", f"{brk['gravity_g']['earth_baseline_value']} g (Earth)"),
                ("Pressure", f"{brk['atm_pressure_mbar']['planetary_value']} mbar", f"{brk['atm_pressure_mbar']['earth_baseline_value']} mbar"),
                ("Radiation", f"{brk['radiation_msv_yr']['planetary_value']} mSv/yr", f"{brk['radiation_msv_yr']['earth_baseline_value']} mSv/yr"),
            ],
            "s5_honesty": (
                "Valid in Atacama: optical/albedo calibration & terrain mobility. Invalid outdoors: parachutes, "
                "convective cooling, GCR shielding. No '87% Mars' claims, no safety certification; 30m NASADEM/CTX DEM comparison is next."
            ),
            "s6_kicker": "05 · SUSTAINABILITY & ROADMAP",
            "s6_title": "Open Access First, Validated Institutional Hypothesis",
            "s6_sus_title": "Sustainability Hypothesis (To Validate)",
            "s6_sus_items": [
                "Core web platform & open data remain 100% free for learners and educators.",
                "Hypothesis: institutions fund guided workshops, mediator training, print kits, and regional site briefs.",
                "No unverified revenue, pricing, or signed partnerships claimed.",
            ],
            "s6_sdg_title": "Local Lens & Next Engineering Steps",
            "s6_sdg_items": [
                "Antofagasta / Atacama as a natural reference laboratory; intended alignment with UN SDGs 4.3, 4.4, 9.5, 17.3, 17.16, 17.17.",
                f"Next: complete remaining 1,403 Res-3 ERA5 cells (10,000/11,403 done), validate 30m DEM distributions, and run user trials.",
            ],
            "s7_kicker": "06 · CREDITS, AI DISCLOSURE & LINKS",
            "s7_title": "Open Data Attribution & Transparent AI Use",
            "s7_credits_title": "Data & Open-Source Stack (Text Attribution Only · No NASA Logos)",
            "s7_credits": (
                "NASA (Moon/Mars Trek WMTS, PDS ODE, Mars 2020 MEDA, MSL REMS, POWER, Earthdata CMR/GIBS) · "
                "ESA Copernicus · CSA RADARSAT · JAXA G-Portal · Open-Meteo ERA5-Land · ISRIC SoilGrids v2.0 · Macrostrat · "
                "FastAPI, DuckDB, H3, scikit-learn, React, MapLibre GL JS."
            ),
            "s7_ai_title": "Super Intelligence (AI) Disclosure",
            "s7_ai_body": (
                "Human team conceived the scientific architecture (X → Y → B decomposition) and product decisions. "
                "AI assistants accelerated coding, refactoring, docs, and EN/ES/PT translation parity—reviewed by the team."
            ),
            "s7_links": "GitHub: https://github.com/AnGeMoNs/Ckepi  ·  Public Demo: [Insert Public URL]  ·  Team: [Insert Members]",
            "s7_closing": "“With Ckepi, a resemblance sparks curiosity; evidence teaches us how far it goes.”",
        },
        "es": {
            "lang": "es",
            "badge_event": "NASA Space Apps Challenge 2026 · Antofagasta, Chile",
            "s1_title": "Ckepi",
            "s1_subtitle": "Motor de Descubrimiento de Análogos Terrestres por Descomposición Causal",
            "s1_tagline": (
                "“Ckepi acerca los datos de Tierra, Luna y Marte para entender qué podemos comparar "
                "y dónde termina la semejanza.”"
            ),
            "s1_caption": "Prototipo en vivo (rama kevin): globos 3D Marte/Luna + malla H3 global de la Tierra",
            "s1_meta": "Código Abierto · MIT / Apache-2.0 · Sin Inicio de Sesión",
            "s2_kicker": "01 · EL PROBLEMA Y PÚBLICO",
            "s2_title": "Una foto del desierto parece Marte, pero oculta la física",
            "s2_p1_title": "Brecha Científica",
            "s2_p1_body": (
                "El parecido visual o los promedios simples ocultan diferencias críticas en inercia térmica, "
                "pendiente, radiación, presión y gravedad, induciendo comparaciones engañosas."
            ),
            "s2_p2_title": "Brecha de Acceso",
            "s2_p2_body": (
                "Las herramientas planetarias actuales exigen formación técnica, dejando fuera a estudiantes, "
                "docentes, familias y personas con baja alfabetización digital."
            ),
            "s2_aud_title": "A Quién Sirve y Posibles Facilitadores",
            "s2_aud_body": (
                "Estudiantes, familias, docentes e investigadores. Bibliotecas, municipios, universidades y "
                "organizaciones comunitarias son posibles facilitadores (sin alianzas confirmadas)."
            ),
            "s3_kicker": "02 · LA SOLUCIÓN",
            "s3_title": "Un mismo motor científico con profundidad progresiva",
            "s3_flow": [
                ("1. Explorar Globos 3D", "Rotar globos WMTS de Luna y Marte y sondear cualquier coordenada o 5 sitios NASA curados."),
                ("2. Comparar por Dimensión", "Ordenar celdas H3 terrestres separando sustrato independiente (X) y clima dependiente (Y)."),
                ("3. Ver Límites Físicos", "Mostrar fronteras de ruptura irreducibles (B) y qué pruebas de campo son válidas o inválidas."),
            ],
            "s3_ui_notes": (
                f"Desarrollado en React + MapLibre GL v6 con {counts['earth_h3_cells_total']:,} celdas H3 en caché, "
                "interfaz tri-idioma (ES / PT / EN · 460 claves), modo claro/oscuro y exportación CSV / GeoJSON / Markdown."
            ),
            "s4_kicker": "03 · CIENCIA Y DATOS REALES NASA",
            "s4_title": "Descomposición Causal (X → Y) y Fronteras de Ruptura (B)",
            "s4_x_title": f"{counts['independent_variables']} Forzamientos Independientes (X)",
            "s4_x_list": "Rugosidad, pendiente, inercia térmica, albedo, flujo solar, hielo subsuperficial, aridez, HR, UV, LAI.",
            "s4_y_title": f"{counts['dependent_variables']} Respuestas Dependientes (Y)",
            "s4_y_list": "Amplitud térmica ΔT, enfriamiento nocturno, temp. media, viento, flujo eólico de polvo, sublimación.",
            "s4_b_title": f"{counts['breakage_variables']} Fronteras de Ruptura (B)",
            "s4_b_list": "Gravedad superficial (g), presión atmosférica (mbar) y radiación cósmica ionizante (mSv/año).",
            "s4_formula": "Combinado = 0.60·S_ind + 0.40·S_dep (RidgeCV / RandomForest / PCA + intervalo de incertidumbre)",
            "s4_sources_title": "Datos Abiertos Integrados (Medido · Derivado Orbital · Proxy de Modelo)",
            "s4_sources": [
                ("NASA Marte y Luna", "Perseverance MEDA, Curiosity REMS, PDS ODE (LRO Diviner/LOLA/Mini-RF, MRO CRISM/SHARAD), Trek WMTS"),
                ("NASA y Socios Tierra", "NASA POWER Climatology, Earthdata CMR/GIBS, Copernicus 90m DEM, ERA5-Land, SoilGrids v2.0, Macrostrat, ESA, CSA, JAXA"),
            ],
            "s5_kicker": "04 · PRUEBA VERIFICADA Y LÍMITES",
            "s5_title": "Caso Real: Cráter Jezero (Marte) ↔ Atacama / Yungay (Tierra)",
            "s5_match_title": f"Celda H3 Verificada {atacama['earth_cell_h3']} · {atacama['known_analog_name']}",
            "s5_metrics": [
                ("Similitud Índice de Aridez", f"{iv['aridity_index']:.3f}"),
                ("Similitud Hielo Subsuperficial", f"{iv['subsurface_ice_frac']:.3f}"),
                ("Similitud Albedo Superficial", f"{iv['surface_albedo']:.3f}"),
                ("Similitud Inercia Térmica", f"{iv['thermal_inertia']:.3f}"),
                ("Similitud Pendiente", f"{iv['slope_deg']:.3f}"),
                ("Puntaje Combinado (IC)", f"{atacama['combined_score']:.3f} [{atacama['confidence_interval'][0]:.3f}–{atacama['confidence_interval'][1]:.3f}]"),
            ],
            "s5_brk_title": f"Frontera de Ruptura Irreducible (R_break = {atacama['r_break_overall']:.3f})",
            "s5_brk_rows": [
                ("Gravedad", f"{brk['gravity_g']['planetary_value']} g (Marte)", f"{brk['gravity_g']['earth_baseline_value']} g (Tierra)"),
                ("Presión", f"{brk['atm_pressure_mbar']['planetary_value']} mbar", f"{brk['atm_pressure_mbar']['earth_baseline_value']} mbar"),
                ("Radiación", f"{brk['radiation_msv_yr']['planetary_value']} mSv/año", f"{brk['radiation_msv_yr']['earth_baseline_value']} mSv/año"),
            ],
            "s5_honesty": (
                "Válido en Atacama: calibración óptica/albedo y movilidad. Inválido al aire libre: paracaídas, "
                "enfriamiento convectivo y radiación GCR. Sin '87% igual a Marte' ni certificación; DEM 30m NASADEM/CTX pendiente."
            ),
            "s6_kicker": "05 · SOSTENIBILIDAD Y HOJA DE RUTA",
            "s6_title": "Aprendizaje Gratuito y Hipótesis Institucional por Validar",
            "s6_sus_title": "Modelo de Sostenibilidad (Hipótesis)",
            "s6_sus_items": [
                "El acceso web y el aprendizaje son gratuitos y abiertos (stack MIT / Apache-2.0).",
                "Hipótesis: instituciones financian talleres, formación de guías, kits impresos y caracterización territorial.",
                "Sin afirmar ventas, precios ni convenios cerrados todavía.",
            ],
            "s6_sdg_title": "Lente Local y Siguientes Pasos",
            "s6_sdg_items": [
                "Desde Antofagasta y Atacama como referencia; contribución prevista a ODS 4.3, 4.4, 9.5, 17.3, 17.16 y 17.17.",
                "Siguiente: completar 1,403 celdas Res-3 ERA5 (10,000/11,403 listas), validar DEM 30 m y probar con usuarios reales.",
            ],
            "s7_kicker": "06 · CRÉDITOS, USO DE IA Y CIERRE",
            "s7_title": "Fuentes Abiertas y Declaración Transparente de IA",
            "s7_credits_title": "Créditos de Datos y Software (Solo Texto · Sin Logos NASA)",
            "s7_credits": (
                "NASA (Moon/Mars Trek WMTS, PDS ODE, Mars 2020 MEDA, MSL REMS, POWER, Earthdata CMR/GIBS) · "
                "ESA Copernicus · CSA RADARSAT · JAXA G-Portal · Open-Meteo ERA5-Land · ISRIC SoilGrids v2.0 · Macrostrat · "
                "FastAPI, DuckDB, H3, scikit-learn, React, MapLibre GL JS."
            ),
            "s7_ai_title": "Declaración de Super Intelligence (IA)",
            "s7_ai_body": (
                "La idea científica (descomposición X → Y → B) y decisiones de producto son del equipo humano. "
                "La IA asistió en código, refactorización, documentación y paridad ES/PT/EN, con revisión humana."
            ),
            "s7_links": "GitHub: https://github.com/AnGeMoNs/Ckepi  ·  Demo Pública: [Insertar URL]  ·  Equipo: [Insertar Integrantes]",
            "s7_closing": "“Con Ckepi, una semejanza despierta la curiosidad; la evidencia nos enseña hasta dónde llega.”",
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

    return f"""<!doctype html>
<html lang="{c['lang']}">
<head>
<meta charset="utf-8" />
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
    padding: 0.55in 0.65in;
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
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 8px;
  }}
  h1 {{ font-size: 56px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; }}
  h2 {{ font-size: 32px; font-weight: 750; line-height: 1.18; margin-bottom: 18px; }}
  .pill {{
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.14);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #7dd3fc;
    font-size: 13px;
    font-weight: 600;
  }}
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 22px; align-items: stretch; }}
  .grid-3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }}
  .grid-hero {{ display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 28px; align-items: center; flex: 1; }}
  .card {{
    background: rgba(15, 23, 42, 0.82);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 14px;
    padding: 18px 20px;
  }}
  .card-title {{ font-size: 17px; font-weight: 700; margin-bottom: 8px; color: #f1f5f9; }}
  .accent {{ color: #fb923c; }}
  .cyan {{ color: #38bdf8; }}
  .danger {{ color: #f87171; }}
  .ok {{ color: #34d399; }}
  p, li {{ font-size: 15px; line-height: 1.48; color: #cbd5e1; }}
  ul {{ padding-left: 18px; }}
  li {{ margin-bottom: 8px; }}
  .tagline {{
    font-size: 20px;
    line-height: 1.4;
    color: #e2e8f0;
    border-left: 4px solid #fb923c;
    padding-left: 16px;
    margin: 20px 0;
  }}
  .shot {{
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
    object-fit: cover;
  }}
  .shot-tall {{ height: 4.35in; object-position: top center; }}
  .shot-med {{ height: 3.45in; object-position: top center; }}
  .caption {{ font-size: 12px; color: #94a3b8; margin-top: 8px; text-align: center; }}
  .footer {{
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #64748b;
    border-top: 1px solid rgba(148, 163, 184, 0.16);
    padding-top: 10px;
  }}
  .badge {{
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    background: rgba(251, 146, 60, 0.16);
    color: #fdba74;
    font-weight: 700;
    font-size: 12px;
    margin-right: 10px;
    white-space: nowrap;
  }}
  .source-row {{ display: flex; align-items: baseline; margin-top: 10px; font-size: 14px; color: #cbd5e1; }}
  .formula {{
    margin-top: 14px;
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(14, 165, 233, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.3);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 14px;
    color: #e0f2fe;
  }}
  .metrics-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }}
  .metric {{
    background: rgba(30, 41, 59, 0.7);
    border-radius: 10px;
    padding: 10px 12px;
    border: 1px solid rgba(148, 163, 184, 0.16);
  }}
  .m-label {{ font-size: 12px; color: #94a3b8; }}
  .m-val {{ font-size: 18px; font-weight: 750; color: #34d399; margin-top: 2px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }}
  th, td {{ padding: 8px 10px; border-bottom: 1px solid rgba(148, 163, 184, 0.18); text-align: left; }}
  td.warn {{ color: #fca5a5; font-weight: 700; }}
  .honesty-box {{
    margin-top: 14px;
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.35);
    font-size: 14px;
    color: #fecaca;
  }}
  .closing {{
    font-size: 22px;
    font-weight: 700;
    text-align: center;
    color: #f8fafc;
    padding: 16px 24px;
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
      <p style="font-size:21px; color:#94a3b8; margin-top:8px; font-weight:600;">{c['s1_subtitle']}</p>
      <div class="tagline">{c['s1_tagline']}</div>
      <p style="font-size:14px; color:#7dd3fc; font-weight:600;">{c['s1_meta']}</p>
    </div>
    <div>
      <img class="shot shot-tall" src="{shot_mars}" alt="Ckepi 3D Explorer" />
      <div class="caption">{c['s1_caption']}</div>
    </div>
  </div>
  <div class="footer"><span>Ckepi · 1 / 7</span><span>NASA Space Apps Challenge 2026</span></div>
</section>

<!-- SLIDE 2 -->
<section class="slide">
  <div>
    <div class="kicker">{c['s2_kicker']}</div>
    <h2>{c['s2_title']}</h2>
  </div>
  <div class="grid-2" style="flex:1; align-items:center;">
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div class="card">
        <div class="card-title accent">{c['s2_p1_title']}</div>
        <p>{c['s2_p1_body']}</p>
      </div>
      <div class="card">
        <div class="card-title cyan">{c['s2_p2_title']}</div>
        <p>{c['s2_p2_body']}</p>
      </div>
      <div class="card">
        <div class="card-title">{c['s2_aud_title']}</div>
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
  <div class="grid-2" style="margin-top:16px; align-items:center;">
    <img class="shot shot-med" src="{shot_analysis}" alt="Causal Decomposition & Matrix" />
    <div class="card" style="height:100%; display:flex; flex-direction:column; justify-content:center;">
      <div class="card-title cyan">Verified UI & Accessibility (Branch: kevin)</div>
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
  <div class="card" style="margin-top:14px;">
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
        <thead><tr><th>Variable</th><th>Mars (Jezero)</th><th>Earth (Atacama)</th></tr></thead>
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
      <p>{c['s7_credits']}</p>
    </div>
    <div class="card">
      <div class="card-title accent">{c['s7_ai_title']}</div>
      <p>{c['s7_ai_body']}</p>
    </div>
  </div>
  <div class="card" style="text-align:center; font-size:15px; color:#cbd5e1;">{c['s7_links']}</div>
  <div class="closing">{c['s7_closing']}</div>
  <div class="footer"><span>Ckepi · 7 / 7</span><span>{c['s7_kicker']}</span></div>
</section>

</body>
</html>"""


def export_pdf(html_path: Path, pdf_path: Path) -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        page = browser.new_page()
        page.goto(html_path.as_uri(), wait_until="networkidle")
        page.pdf(path=str(pdf_path), prefer_css_page_size=True, print_background=True)
        browser.close()


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
) -> None:
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(15, 23, 42)
    shape.line.color.rgb = RGBColor(51, 65, 85)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.2)
    tf.margin_right = Inches(0.2)
    tf.margin_top = Inches(0.15)
    p1 = tf.paragraphs[0]
    r1 = p1.add_run()
    r1.text = title
    r1.font.size = Pt(16)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(*title_color)
    p2 = tf.add_paragraph()
    p2.space_before = Pt(6)
    r2 = p2.add_run()
    r2.text = body
    r2.font.size = Pt(13)
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
    _add_textbox(s1, 0.65, 0.45, 7.5, 0.4, c["badge_event"], 12, True, (125, 211, 252))
    _add_textbox(s1, 0.65, 1.15, 6.2, 0.9, c["s1_title"], 52, True, (248, 250, 252))
    _add_textbox(s1, 0.65, 2.05, 6.2, 0.8, c["s1_subtitle"], 19, True, (148, 163, 184))
    _add_textbox(s1, 0.65, 3.05, 6.2, 1.5, c["s1_tagline"], 18, False, (226, 232, 240))
    _add_textbox(s1, 0.65, 5.1, 6.2, 0.4, c["s1_meta"], 13, True, (56, 189, 248))
    s1.shapes.add_picture(shot_mars, Inches(7.05), Inches(1.1), width=Inches(5.6))
    _add_textbox(s1, 7.05, 5.1, 5.6, 0.4, c["s1_caption"], 11, False, (148, 163, 184), PP_ALIGN.CENTER)

    # Slide 2
    s2 = prs.slides.add_slide(blank)
    _style_bg(s2)
    _add_textbox(s2, 0.65, 0.45, 12.0, 0.35, c["s2_kicker"], 12, True, (56, 189, 248))
    _add_textbox(s2, 0.65, 0.8, 12.0, 0.65, c["s2_title"], 28, True, (248, 250, 252))
    _add_card(s2, 0.65, 1.65, 5.9, 1.65, c["s2_p1_title"], c["s2_p1_body"], (251, 146, 60))
    _add_card(s2, 0.65, 3.45, 5.9, 1.65, c["s2_p2_title"], c["s2_p2_body"], (56, 189, 248))
    _add_card(s2, 0.65, 5.25, 5.9, 1.65, c["s2_aud_title"], c["s2_aud_body"])
    s2.shapes.add_picture(shot_moon, Inches(6.85), Inches(1.65), width=Inches(5.8))

    # Slide 3
    s3 = prs.slides.add_slide(blank)
    _style_bg(s3)
    _add_textbox(s3, 0.65, 0.45, 12.0, 0.35, c["s3_kicker"], 12, True, (56, 189, 248))
    _add_textbox(s3, 0.65, 0.8, 12.0, 0.65, c["s3_title"], 28, True, (248, 250, 252))
    for i, (t, b) in enumerate(c["s3_flow"]):
        _add_card(s3, 0.65 + i * 4.08, 1.6, 3.85, 1.75, t, b, (251, 146, 60))
    s3.shapes.add_picture(shot_analysis, Inches(0.65), Inches(3.55), width=Inches(6.2))
    _add_card(s3, 7.1, 3.55, 5.55, 3.35, "Verified UI (Branch: kevin)", c["s3_ui_notes"], (56, 189, 248))

    # Slide 4
    s4 = prs.slides.add_slide(blank)
    _style_bg(s4)
    _add_textbox(s4, 0.65, 0.45, 12.0, 0.35, c["s4_kicker"], 12, True, (56, 189, 248))
    _add_textbox(s4, 0.65, 0.8, 12.0, 0.65, c["s4_title"], 28, True, (248, 250, 252))
    _add_card(s4, 0.65, 1.6, 3.85, 2.0, c["s4_x_title"], c["s4_x_list"], (56, 189, 248))
    _add_card(s4, 4.73, 1.6, 3.85, 2.0, c["s4_y_title"], c["s4_y_list"], (251, 146, 60))
    _add_card(s4, 8.81, 1.6, 3.85, 2.0, c["s4_b_title"], c["s4_b_list"], (248, 113, 113))
    _add_textbox(s4, 0.65, 3.8, 12.0, 0.55, c["s4_formula"], 14, True, (224, 242, 254))
    sources_text = "\n".join(f"• {k}: {v}" for k, v in c["s4_sources"])
    _add_card(s4, 0.65, 4.5, 12.0, 2.35, c["s4_sources_title"], sources_text)

    # Slide 5
    s5 = prs.slides.add_slide(blank)
    _style_bg(s5)
    _add_textbox(s5, 0.65, 0.45, 12.0, 0.35, c["s5_kicker"], 12, True, (56, 189, 248))
    _add_textbox(s5, 0.65, 0.8, 12.0, 0.65, c["s5_title"], 28, True, (248, 250, 252))
    metrics_text = "\n".join(f"• {k}: {v}" for k, v in c["s5_metrics"])
    _add_card(s5, 0.65, 1.6, 5.9, 3.65, c["s5_match_title"], metrics_text, (52, 211, 153))
    brk_text = "\n".join(f"• {var}: {mars}  vs  {earth}" for var, mars, earth in c["s5_brk_rows"])
    _add_card(s5, 6.75, 1.6, 5.9, 3.65, c["s5_brk_title"], brk_text, (248, 113, 113))
    _add_card(s5, 0.65, 5.45, 12.0, 1.4, "Physical Limits & Honesty", c["s5_honesty"], (252, 165, 165))

    # Slide 6
    s6 = prs.slides.add_slide(blank)
    _style_bg(s6)
    _add_textbox(s6, 0.65, 0.45, 12.0, 0.35, c["s6_kicker"], 12, True, (56, 189, 248))
    _add_textbox(s6, 0.65, 0.8, 12.0, 0.65, c["s6_title"], 28, True, (248, 250, 252))
    _add_card(s6, 0.65, 1.7, 5.9, 4.9, c["s6_sus_title"], "\n\n".join(f"• {x}" for x in c["s6_sus_items"]), (52, 211, 153))
    _add_card(s6, 6.75, 1.7, 5.9, 4.9, c["s6_sdg_title"], "\n\n".join(f"• {x}" for x in c["s6_sdg_items"]), (56, 189, 248))

    # Slide 7
    s7 = prs.slides.add_slide(blank)
    _style_bg(s7)
    _add_textbox(s7, 0.65, 0.45, 12.0, 0.35, c["s7_kicker"], 12, True, (56, 189, 248))
    _add_textbox(s7, 0.65, 0.8, 12.0, 0.65, c["s7_title"], 28, True, (248, 250, 252))
    _add_card(s7, 0.65, 1.65, 5.9, 3.0, c["s7_credits_title"], c["s7_credits"], (56, 189, 248))
    _add_card(s7, 6.75, 1.65, 5.9, 3.0, c["s7_ai_title"], c["s7_ai_body"], (251, 146, 60))
    _add_textbox(s7, 0.65, 4.9, 12.0, 0.55, c["s7_links"], 14, False, (203, 213, 225), PP_ALIGN.CENTER)
    _add_textbox(s7, 0.65, 5.75, 12.0, 0.8, c["s7_closing"], 20, True, (248, 250, 252), PP_ALIGN.CENTER)

    prs.save(str(pptx_path))


def main() -> None:
    metrics = load_metrics()
    copy = build_copy(metrics)
    for lang, c in copy.items():
        html_path = OUT_DIR / f"ckepi-pitch-{lang}.html"
        pdf_path = OUT_DIR / f"ckepi-pitch-{lang}.pdf"
        pptx_path = OUT_DIR / f"ckepi-pitch-{lang}.pptx"
        html_path.write_text(render_html(c), encoding="utf-8")
        export_pdf(html_path, pdf_path)
        build_pptx(c, pptx_path)
        print(f"Generated {pdf_path.name} and {pptx_path.name}")


if __name__ == "__main__":
    main()
