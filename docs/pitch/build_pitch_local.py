"""Builds the 7-slide local pitch deck (Spanish) as an editable PPTX.

Run from the repo root:
    backend/.venv/bin/python docs/pitch/build_pitch_local.py

Slide text follows docs/pitch/PITCH_OFICIAL_FINAL.md (the speaker notes carry it verbatim) and
every terrain figure comes from docs/RESULTADOS_TERRENO_REALES.md. Screenshots are real captures
of the app (docs/pitch/img). No NASA logos.
"""

from __future__ import annotations

import re
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

HERE = Path(__file__).resolve().parent
IMG = HERE / "img"
OUT = HERE / "CKEPI_PITCH_LOCAL_7_SLIDES.pptx"

SPACE = RGBColor(0x10, 0x1F, 0x24)
INK = RGBColor(0x18, 0x3A, 0x3A)
SALT = RGBColor(0xFF, 0xF2, 0xD7)
COPPER = RGBColor(0xE8, 0xA0, 0x80)
SULFUR = RGBColor(0xE4, 0xED, 0x83)
MUTED = RGBColor(0xBC, 0xC6, 0xAE)

AI_NOTE = "Captura real de Ckepi · las ilustraciones de cartón son generadas con IA (AI-Generated)"


def pitch_sections() -> list[str]:
    """The six sections of the official pitch, as plain text for the speaker notes."""
    text = (HERE / "PITCH_OFICIAL_FINAL.md").read_text(encoding="utf-8")
    parts = re.split(r"\n### \d+\. ", text)[1:]
    cleaned = []
    for part in parts:
        body = part.split("\n---")[0]
        body = re.sub(r"\$\\mathbf\{(\w)\}\$", r"\1", body)
        body = re.sub(r"\$([^$]*)\$", lambda m: m.group(1).replace("^\\circ", "°").replace("{,}", ","), body)
        body = body.replace("**", "").replace("`", "")
        cleaned.append(body.strip())
    return cleaned


SLIDES = [
    {
        "kicker": "NASA Space Apps 2026 · Antofagasta · Lattices Team",
        "title": "CKEPI",
        "big": "De la imagen a la evidencia.",
        "bullets": [
            "Dónde ensayar en la Tierra antes de ir a la Luna o a Marte.",
            "Cuánto se parece cada lugar, y qué no se parece.",
            "Con datos abiertos de NASA y ESA, a una misma escala de 30 m.",
        ],
        "image": "01-inicio-ciencia.png",
        "source": "Desafío: Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars.",
        "note": 0,
    },
    {
        "kicker": "01 · El problema",
        "title": "¿Dónde probamos en la Tierra lo que trabajará en otros mundos?",
        "big": "≈ 6×",
        "big_caption": "más lejos de Jezero está el análogo clásico (Yungay) que una zona poco estudiada de Antofagasta, en pendiente a 30 m.",
        "bullets": [
            "La información científica está dispersa entre agencias y bases de datos.",
            "La búsqueda se concentra en unos pocos lugares conocidos.",
            "Quedan enormes territorios sin caracterizar.",
        ],
        "image": "03-explorar-mapas.png",
        "source": "W₁ Yungay 3,32° ÷ W₁ celda 83b224 0,54° = 6,1 · docs/RESULTADOS_TERRENO_REALES.md",
        "note": 0,
    },
    {
        "kicker": "02 · La solución",
        "title": "Ckepi descompone cada lugar en tres capas: X, Y y B.",
        "bullets": [
            "X · Sustrato: lo que el lugar es (pendiente, rugosidad, aridez…).",
            "Y · Respuesta ambiental: lo que el lugar hace (ΔT, viento, polvo…).",
            "B · Brecha física: lo que la Tierra no puede imitar (gravedad, presión, radiación).",
            "Eliges destino y ensayo; Ckepi ordena candidatos del catálogo terrestre.",
        ],
        "image": "02-explorar.png",
        "source": "Motor: FastAPI + DuckDB + H3 · datos abiertos de NASA, ESA y Open-Meteo.",
        "note": 1,
    },
    {
        "kicker": "03 · La evidencia",
        "title": "La ventana candidata supera al control en pendiente a 30 m.",
        "big": "0,54°",
        "big_caption": "distancia de pendientes (W₁) de la ventana 83b224 frente a Jezero · IC 95 % 0,40–0,65°.",
        "bullets": [
            "Yungay, el análogo clásico: 3,32°.",
            "Caso negativo (celda 83b221): 6,92°. El motor discrimina.",
            "Misma escala de 30 m: NASA MRO CTX (Jezero) y Copernicus GLO-30.",
        ],
        "image": "04-analizar-terreno.png",
        "source": "Ventanas de 6 × 6 km · Wasserstein-1, KS y bootstrap espacial 2D · solo pendiente y relieve.",
        "note": 2,
    },
    {
        "kicker": "04 · Por qué Ckepi, por qué ahora",
        "title": "Atacama no es Marte. Ckepi lo dice con números.",
        "big": "0,38 g · ~0,6 kPa · ~230 mSv/año",
        "big_caption": "Brechas de Marte: no se reproducen al aire libre. ΔT requiere ensayos térmicos.",
        "bullets": [
            "Compara distribuciones completas del terreno, no fotos ni promedios.",
            "Entrega evidencia para decidir dónde investigar; no certifica sitios.",
            "Artemis vuelve a la Luna: Antofagasta puede aportar territorio y talento.",
        ],
        "image": "03-explorar-mapas.png",
        "source": "NASA NSSDCA Fact Sheets · Hassler et al. 2014 (Curiosity/RAD) · Luna: 0,166 g, vacío, ~380 mSv/año (Reitz et al. 2012, simulado).",
        "note": 3,
    },
    {
        "kicker": "05 · Impacto",
        "title": "La misma evidencia sirve para investigar y para aprender.",
        "bullets": [
            "Modo Ciencia: preselección explicable y descargable para equipos de investigación.",
            "Módulo STEAM: propone acercar la ciencia con el mismo desafío.",
            "Misión de 5 estaciones, 3 niveles de dificultad y predicciones con datos reales.",
            "Cierre educativo e ingreso al Modo Ciencia; sin acreditación profesional.",
        ],
        "image": "06-steam-certificado.png",
        "source": "Voz (Web Speech API) · español, portugués e inglés · sin registro; nombre opcional local, no almacenado.",
        "note": 4,
    },
    {
        "kicker": "06 · Equipo y cierre",
        "title": "Desde Antofagasta, preparar la exploración de otros mundos.",
        "bullets": [
            "Lattices Team: tecnología, ciencia de datos e impacto social.",
            "Siguiente paso: ampliar variables y validar los candidatos en terreno.",
            "Demo abierta y código abierto (Apache-2.0).",
            "Repositorio: github.com/AnGeMoNs/Ckepi",
        ],
        "image": "05-steam-mision.png",
        "source": "Datos: NASA MRO CTX / USGS; Copernicus GLO-30 · Código: Apache-2.0 · Fuentes: Public Sans / IBM Plex Mono (OFL-1.1) · Iconos: Lucide (ISC).",
        "note": 5,
    },
]


def add_text(slide, left, top, width, height, text, size, color, bold=False, align=PP_ALIGN.LEFT, font="Arial"):
    box = slide.shapes.add_textbox(left, top, width, height)
    frame = box.text_frame
    frame.word_wrap = True
    para = frame.paragraphs[0]
    para.alignment = align
    run = para.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font
    return box


def build() -> None:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    notes = pitch_sections()

    for index, spec in enumerate(SLIDES, start=1):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        bg = slide.background.fill
        bg.solid()
        bg.fore_color.rgb = SPACE

        # Copper rule on the left edge: the cardboard edge of the identity.
        rule = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.18), prs.slide_height)
        rule.fill.solid()
        rule.fill.fore_color.rgb = COPPER
        rule.line.fill.background()

        add_text(slide, Inches(0.6), Inches(0.45), Inches(6.2), Inches(0.4), spec["kicker"].upper(), 13, COPPER, bold=True)
        title_size = 54 if index == 1 else 30
        add_text(slide, Inches(0.6), Inches(0.9), Inches(6.3), Inches(1.9), spec["title"], title_size, SALT, bold=True)

        # Four-line titles need more room before the body starts.
        top = Inches(2.65)
        if spec.get("big"):
            big_size = 40 if len(spec["big"]) < 12 else 19
            add_text(slide, Inches(0.6), top, Inches(6.3), Inches(0.65), spec["big"], big_size, SULFUR, bold=True, font="Courier New")
            top += Inches(0.7)
            if spec.get("big_caption"):
                add_text(slide, Inches(0.6), top, Inches(6.1), Inches(0.85), spec["big_caption"], 14, MUTED)
                top += Inches(0.9)

        box = slide.shapes.add_textbox(Inches(0.6), top, Inches(6.1), Inches(7.0) - top - Inches(0.7))
        frame = box.text_frame
        frame.word_wrap = True
        for i, bullet in enumerate(spec["bullets"]):
            para = frame.paragraphs[0] if i == 0 else frame.add_paragraph()
            para.space_after = Pt(7)
            run = para.add_run()
            run.text = f"— {bullet}"
            run.font.size = Pt(15)
            run.font.color.rgb = SALT
            run.font.name = "Arial"

        # Right: a real screenshot inside an ink panel.
        panel = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.1), Inches(0.9), Inches(5.8), Inches(5.3))
        panel.fill.solid()
        panel.fill.fore_color.rgb = INK
        panel.line.color.rgb = COPPER
        panel.line.width = Pt(1.25)
        image = IMG / spec["image"]
        if image.exists():
            pic = slide.shapes.add_picture(str(image), Inches(7.25), Inches(1.05), width=Inches(5.5))
            pic.top = Inches(0.9) + int((Inches(5.3) - pic.height) / 2)
        add_text(slide, Inches(7.1), Inches(6.25), Inches(5.8), Inches(0.3), AI_NOTE, 9, MUTED, align=PP_ALIGN.CENTER)

        add_text(slide, Inches(0.6), Inches(6.85), Inches(11.4), Inches(0.4), spec["source"], 10, MUTED)
        add_text(slide, Inches(12.2), Inches(6.85), Inches(0.8), Inches(0.4), f"{index}/7", 10, MUTED, align=PP_ALIGN.RIGHT, font="Courier New")

        note = notes[spec["note"]] if spec["note"] < len(notes) else ""
        if index == 1:
            note = "(Portada: presentarse en una frase y entrar al problema.)\n\n" + "\n\n".join(note.split("\n\n")[1:2])
        slide.notes_slide.notes_text_frame.text = note

    prs.save(OUT)
    print(f"saved {OUT} ({len(SLIDES)} slides)")


if __name__ == "__main__":
    build()
