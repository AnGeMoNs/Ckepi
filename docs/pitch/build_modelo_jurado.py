"""Editable seven-slide local working model; preserves the team's previous deck."""
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from build_pitch_local import add_text, SPACE, INK, SALT, COPPER, SULFUR, MUTED, IMG, AI_NOTE

HERE = Path(__file__).resolve().parent
OUT = HERE / 'MODELO_JURADO_LOCAL_7_SLIDES.pptx'
SLIDES = [
('01 · PROMESA · 15 s', 'De la imagen a la evidencia', 'CKEPI', [
'Dónde ensayar en la Tierra antes de explorar la Luna o Marte.',
'Una preselección explicable; cada semejanza muestra su límite.'
], '01-inicio-ciencia.png',
'Lattices Team · Antofagasta, Chile · Modelo local editable para revisión humana',
'¿Dónde probamos en la Tierra lo que trabajará en otros mundos? Somos Lattices Team. Creamos Ckepi para pasar del parecido visual a una preselección con evidencia, mostrando también lo que ningún terreno terrestre puede reproducir.'),
('02 · PROBLEMA Y USUARIOS · 20 s', 'Parecerse en una foto no basta', '', [
'Investigadores: reúnen datos dispersos antes de elegir un terreno de ensayo.',
'Docentes y estudiantes: necesitan interpretar evidencia y reconocer límites.',
'Propuesta: comparar a una escala común y conservar fuentes e incertidumbre.'
], '03-explorar-mapas.png',
'Necesidad propuesta por el equipo; ahorro de tiempo/costo e impacto educativo aún sin medición.',
'Un equipo de robótica necesita un terreno para probar movilidad. Un docente necesita explicar por qué Atacama no es Marte. Hoy deben reunir fuentes y distinguir variables compatibles. Ckepi propone ordenar esa decisión, sin afirmar ahorros ni mejoras educativas que todavía no medimos.'),
('03 · SOLUCIÓN Y DEMO · 25 s', 'Tres capas para una decisión', 'X → Y ∥ B', [
'X · Sustrato: pendiente, rugosidad y propiedades del terreno.',
'Y · Respuestas: temperatura, viento y otras variables ambientales.',
'B · Brecha física: gravedad, presión y radiación.',
'Demo: elegir Marte → Analizar → comparar candidato, control y negativo.'
], '02-explorar.png',
'Modelo predictivo guiado por física; X → Y no demuestra causalidad experimental.',
'La solución separa tres capas: el sustrato X, las respuestas ambientales Y y la brecha física B. En la demo elegimos Marte y abrimos Analizar. Vemos un candidato, un control y un caso negativo. El modelo ayuda a ordenar hipótesis; no demuestra por sí solo relaciones causales.'),
('04 · EVIDENCIA CIENTÍFICA · 40 s', 'Una prueba real a 30 metros', 'W₁ = 0,54°', [
'Candidato 83b224 · IC 95 %: 0,40–0,65° · KS = 0,15.',
'Control Yungay: 3,32° · negativo 83b221: 6,92°.',
'Sensibilidad del candidato: 60 m → 0,40°; 90 m → 0,27°.',
'CTX DEM Jezero / USGS + Copernicus GLO-30; bootstrap espacial 2D.'
], '04-analizar-terreno.png',
'Fuente: docs/RESULTADOS_TERRENO_REALES.md · ventanas 6 × 6 km · pendiente/relieve; no toda una celda H3.',
'Esta es la evidencia central. Comparamos ventanas reales de Jezero y Antofagasta a treinta metros. Para el candidato, Wasserstein uno es cero coma cincuenta y cuatro grados, con intervalo del noventa y cinco por ciento entre cero coma cuarenta y cero coma sesenta y cinco; KS es cero coma quince. Menor distancia significa distribuciones de pendiente más próximas. Yungay queda en tres coma treinta y dos, y el caso negativo en seis coma noventa y dos. Repetimos a sesenta y noventa metros: el candidato mantiene su cercanía. Son ventanas de seis kilómetros; no representan toda la celda ni certifican un sitio.'),
('05 · LÍMITES Y RELEVANCIA LUNAR · 25 s', 'Atacama no es Marte ni la Luna', '', [
'Marte: 0,38 g · ~0,6 kPa CO₂ · ~230 mSv/año (RAD).',
'Luna: 0,166 g · vacío · ~380 mSv/año (modelo citado).',
'ΔT y radiación exigen ensayos específicos; no basta el terreno.',
'La prueba DEM validada aquí es marciana. La comparación lunar equivalente está pendiente.'
], '03-explorar-mapas.png',
'NASA Fact Sheets; Hassler et al. 2014; Reitz et al. 2012 (simulación lunar). No certifica seguridad ni aptitud.',
'Atacama no reproduce la gravedad, la atmósfera ni la radiación de esos mundos. Las cámaras y otros ensayos especializados solo estudian partes de esas diferencias. También importa la oscilación térmica. La evidencia DEM presentada corresponde a Marte: para la Luna mostramos contexto y límites, pero no reclamamos una comparación de terreno equivalente validada.'),
('06 · IMPACTO TERRITORIAL PROPUESTO · 35 s', 'Cuatro ejes, cuatro medidas futuras', '', [
'Ciencia de frontera · registrar comparaciones reproducidas. ODS 9.5.',
'STEAM / empleabilidad · medir comprensión antes/después y finalización. ODS 4.3 / 4.4.',
'Aplicación local · validar candidatos con observaciones de campo. ODS 9.5.',
'Red interregional · documentar colaboraciones acordadas y evidencia compartida. ODS 17.16 / 17.17.'
], '06-steam-certificado.png',
'Mapeo propuesto a ejes del repositorio; no aval del organizador. Metas ONU: sdgs.un.org/goals · sin resultados medidos.',
'Para Antofagasta proponemos cuatro líneas de trabajo: ciencia reproducible, aprendizaje STEAM, validación territorial y colaboración entre regiones. Cada una tiene una medida futura: comparaciones reproducidas, comprensión antes y después, candidatos observados en campo y colaboraciones documentadas. Las vinculamos con educación, investigación y alianzas de los ODS. Son objetivos, no impacto ya demostrado ni convenios firmados. La meta diecisiete punto tres trata de recursos para países en desarrollo: no la presentamos como financiamiento conseguido ni como una meta científica automática.'),
('07 · EQUIPO, SIGUIENTE PASO Y CRÉDITOS · 20 s', 'Validemos el siguiente paso', 'Lattices Team', [
'Buscamos revisión experta y un pilotaje educativo y territorial acordado.',
'Próximo hito: validar un candidato y medir aprendizaje, con protocolo.',
'Código y documentación: github.com/AnGeMoNs/Ckepi',
'Ckepi entrega evidencia para decidir dónde investigar.'
], '05-steam-mision.png',
'Datos: NASA MRO CTX / USGS; Copernicus GLO-30 · Código: Apache-2.0 · UI: Public Sans / IBM Plex Mono (OFL-1.1); Lucide (ISC).',
'Somos Lattices Team. Solicitamos revisión experta y colaboración para un pilotaje educativo y una validación de campo acordados. El código y las fuentes están en el repositorio. La concepción científica es del equipo humano; la IA asistió en implementación y decoración identificada. Ckepi entrega evidencia para decidir dónde investigar.')
]

def build():
    prs=Presentation(); prs.slide_width=Inches(13.333); prs.slide_height=Inches(7.5)
    for i,(kicker,title,big,bullets,img,source,notes) in enumerate(SLIDES,1):
        slide=prs.slides.add_slide(prs.slide_layouts[6]);fill=slide.background.fill;fill.solid();fill.fore_color.rgb=SPACE
        add_text(slide,Inches(.6),Inches(.35),Inches(12),Inches(.35),kicker,12,COPPER,True)
        add_text(slide,Inches(.6),Inches(.9),Inches(6.1),Inches(1.5),title,31,SALT,True)
        top=2.65
        if big:
            add_text(slide,Inches(.6),Inches(top),Inches(6.1),Inches(.65),big,30,SULFUR,True);top+=.8
        box=slide.shapes.add_textbox(Inches(.6),Inches(top),Inches(6.1),Inches(6.25-top));tf=box.text_frame;tf.word_wrap=True
        for j,line in enumerate(bullets):
            p=tf.paragraphs[0] if j==0 else tf.add_paragraph();p.text=line;p.font.name='Arial';p.font.size=Pt(16);p.font.color.rgb=SALT;p.space_after=Pt(12)
        panel=slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.1), Inches(.9), Inches(5.6), Inches(5.2));panel.fill.solid();panel.fill.fore_color.rgb=INK;panel.line.color.rgb=COPPER
        pic=slide.shapes.add_picture(str(IMG/img),Inches(7.25),Inches(1),width=Inches(5.3));pic.top=Inches(.9)+(Inches(5.2)-pic.height)//2
        add_text(slide,Inches(7.1),Inches(6.15),Inches(5.6),Inches(.45),AI_NOTE,9,MUTED,align=PP_ALIGN.CENTER)
        add_text(slide,Inches(.6),Inches(6.85),Inches(11.7),Inches(.5),source,10,MUTED)
        add_text(slide,Inches(12.2),Inches(6.85),Inches(.6),Inches(.3),f'{i}/7',10,MUTED)
        slide.notes_slide.notes_text_frame.text=f'TIEMPO OBJETIVO: {kicker.split("·")[-1].strip()}\nMODELO EDITABLE: ajustar con pitcher/speaker sin alterar evidencia.\n\n'+notes
    prs.save(OUT); print(OUT)
if __name__=='__main__':build()
