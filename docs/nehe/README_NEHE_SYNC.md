# Centro Maestro de Sincronización (`docs/nehe/`) · Global · Local · Ciencia 30 m · Caja La Araucana

> **Para:** Nehe & Dani (*Lattices Team*, NASA Space Apps Challenge 2026 — Sede Antofagasta)  
> **Rama Activa:** `dani` (`origin/dani`)  
> **Propósito:** Tener en una sola carpeta (`docs/nehe/`) **absolutamente todo el material actualizado** de los 4 pilares (**1. Global Inglés y Legal Open Science · 2. Local Antofagasta y Pitch · 3. Ciencia a 30 m con DEM reales · 4. Caja La Araucana y Metas ODS**), sincronizado con los últimos commits de **Claude**, **GPT (`Astra`/`Argon`)** y el equipo.

---

## 🗂️ 1. PILAR GLOBAL (100 % Inglés · 7 Slides · Video 30 s · Legal Open Science · IA)

| Archivo en `docs/nehe/` | Descripción y Uso Directo |
|---|---|
| [`PPT_7_SLIDES_GLOBAL_EN.md`](PPT_7_SLIDES_GLOBAL_EN.md) | **Las 7 Diapositivas Oficiales en Inglés:** Contenido completo slide por slide ($\le 7$ slides incluyendo portada y créditos legales) con los datos reales de DEM a $30\text{ m}$ y la tesis de innovación. |
| [`PPT_7_SLIDES_PROTOTYPE.html`](PPT_7_SLIDES_PROTOTYPE.html) | **Presentación Interactiva HTML/CSS (7 Slides):** Lista para abrir en navegador (flechas `←` / `→`) o exportar a PDF con el botón **`Print / PDF`**. |
| [`SUBMISSION_PACK_EN.md`](SUBMISSION_PACK_EN.md) | **Formulario Oficial de Envío NASA Space Apps (Inglés):** *High-Level Summary*, *How It Addresses the Challenge*, *Official NASA Data Field* listo para copiar/pegar en la plataforma global. |
| [`GUION_VIDEO_DEMO_30S_EN_ES.md`](GUION_VIDEO_DEMO_30S_EN_ES.md) | **Guion del Video Demo de $\le 30\text{ s}$:** Escaleta segundo a segundo (`0:00` a `0:29`) con subtítulos quemados en inglés obligatorios. |
| [`BRAND_IDENTITY_AND_LEGAL_CREDITS.md`](BRAND_IDENTITY_AND_LEGAL_CREDITS.md) | **Identidad Visual de Marca y Citas Legales Open Science:** Paleta de colores, licencias de fuentes (`SIL OFL-1.1`), íconos (`Lucide MIT`), mapas, código (`Apache-2.0`) y prohibición de logos NASA. |
| [`REFERENCES_OPEN_SCIENCE.md`](REFERENCES_OPEN_SCIENCE.md) | **Bibliografía Científica y DOIs Verificados:** Citas completas de NASA, ESA Copernicus, USGS, papers revisados por pares y marco ODS. |
| [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md) | **Declaración Oficial de Uso de IA (`Gate G11`):** Transparencia de autoría humana 100 % y asistencia técnica de IA. |
| [`RUBRICA_GLOBAL_INGLES_LEGAL_NASA.md`](RUBRICA_GLOBAL_INGLES_LEGAL_NASA.md) | **Checklist de Auditoría Global (`Puertas Duras G1–G12`):** Qué revisa el juez global antes de evaluar. |

---

## 🎤 2. PILAR LOCAL ANTOFAGASTA Y CAJA LA ARAUCANA (Pitch 3 min · Demo Mobile-First · 4 Ejes · Metas ODS)

| Archivo en `docs/nehe/` | Descripción y Uso Directo |
|---|---|
| [`PITCH_LOCAL_3MIN_ANTOFAGASTA_ES.md`](PITCH_LOCAL_3MIN_ANTOFAGASTA_ES.md) | **Guion Cronometrado de 3 Minutos + Q&A (20 s):** Estructura exacta para el Demo Day presencial frente a UCN, UA y Caja La Araucana, con respuestas a cada perfil del jurado. |
| [`CONTEXTO_PARA_PITCH_CKEPI.md`](CONTEXTO_PARA_PITCH_CKEPI.md) · [`.pdf`](CONTEXTO_PARA_PITCH_CKEPI.pdf) | **Briefing de Honestidad y Narrativa para el Exponedor (por Claude):** Qué afirmar, cómo nombrar cada dato sin exagerar y cómo presentar lo que está en vivo. |
| [`RUBRICA_LOCAL_ARAUCANA_Y_ODS.md`](RUBRICA_LOCAL_ARAUCANA_Y_ODS.md) | **Rúbrica Local + Demo Básica Mobile-First + 4 Ejes y Metas ODS de Caja La Araucana:** Evaluación de *Impact, Creativity, Validity, Relevance, Presentation*, checklist móvil (`320px`, botones $\ge 44\text{ px}$, voz `Web Speech API`) y tabla completa de **Metas ODS `4.3, 4.4, 8, 9.5, 10, 13, 17.3, 17.16, 17.17`**. |
| [`SCORECARD_MAESTRO_SPACE_APPS_2026.md`](SCORECARD_MAESTRO_SPACE_APPS_2026.md) | **Plantilla de Evaluación de Jueces:** Cuadro de mando unificado (`/25` NASA + Científico + `/35` Araucana). |

---

## 🔬 3. PILAR CIENCIA A 30 METROS (DEM Reales · $W_1$ y $D_{\text{KS}}$ · Bootstrap 2D · Casos Positivos/Negativos · Brecha $\mathbf{B}$)

| Archivo en `docs/nehe/` | Descripción y Uso Directo |
|---|---|
| [`RESULTADOS_TERRENO_REALES.md`](RESULTADOS_TERRENO_REALES.md) | **Fuente Única de Verdad de Terreno a 30 m (DEM Reales):** Tabla oficial de `NASA MRO CTX DEM` (Jezero, $20\text{ m} \to 30\text{ m}$) vs. `ESA Copernicus GLO-30` (UTM 19S, $30\text{ m}$, ventanas de $6\times 6\text{ km}$). |
| [`DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md`](DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md) | **Cheat Sheet Numérico para Slides:** Tablas listas para copiar/pegar: comparación a $30\text{ m}$, tabla *«Tres Mundos para Todos»* (NASA NSSDCA Fact Sheet) y Brecha Física Irreducible $\mathbf{B}$ ($0,38\text{ g}$, $0,6\text{ kPa }\text{CO}_2$, $230\text{ mSv/año}$, $\Delta T$). |
| [`terrain_windows_30m_provenance.json`](terrain_windows_30m_provenance.json) | **Metadatos y Hashes SHA-256 de los Recortes DEM Reales:** URLs exactas de USGS y AWS Copernicus, CRS, coordenadas de centro y rangos de elevación en metros. |
| [`DATA_PROVENANCE.md`](DATA_PROVENANCE.md) | **Matriz Completa de Procedencia de Datos:** Qué es Medido, Derivado, Modelo o Constante publicada en Luna, Marte y Tierra. |
| [`RUBRICA_CIENTIFICA_30M_W1_KS_BOOTSTRAP.md`](RUBRICA_CIENTIFICA_30M_W1_KS_BOOTSTRAP.md) | **Rúbrica Científica de 4 Compuertas:** Escala común $\ge 30\text{ m}$ en metros/grados, distancias $W_1$ y $D_{\text{KS}}$, *2D Spatial Block Bootstrap* (IC 95 %), qué sí se parece vs. qué NO se parece y por qué. |

---

## 🛠️ 4. ARQUITECTURA, PLAN MAESTRO Y BITÁCORA EN VIVO (Claude · GPT · Equipo)

| Archivo en `docs/nehe/` | Descripción y Uso Directo |
|---|---|
| [`BITACORA_CAMBIOS_CLAUDE_GPT_EQUIPO.md`](BITACORA_CAMBIOS_CLAUDE_GPT_EQUIPO.md) | **Bitácora en Vivo de Commits:** Qué acaban de subir **Claude** (`1535fb7`, `809f039`), **GPT (`Astra`/`Argon`)** (`533aed2`, `cea134c`), **Angemon** (`343f51f`) y **Kevin** (`fa9c314`). |
| [`PLAN_MAESTRO.md`](PLAN_MAESTRO.md) | **Plan Maestro Operativo:** Fases 1 a 6, estado real auditado y reglas de coordinación multi-agente. |
| [`MAPA_SOFTWARE_PIZARRA.svg`](MAPA_SOFTWARE_PIZARRA.svg) · [`MAPA_SOFTWARE.svg`](MAPA_SOFTWARE.svg) | **Diagramas Excalidraw Desplegados en SVG Vectorial:** Listos para incrustar en diapositivas de arquitectura técnica. |

---

## 📌 Resumen Rápido de lo que SIEMPRE Debemos Decir Igual

1. **Propuesta de Innovación:**
   > *«No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué características comparte, qué diferencias existen y qué nuevos lugares merecen ser estudiados utilizando evidencia científica.»*
2. **Resultado Real a $30\text{ m}$ (DEM Reales: `NASA MRO CTX DEM` vs. `ESA Copernicus GLO-30`, ventana $6\times 6\text{ km}$):**
   - **✅ Qué SÍ se parece en pendiente a $30\text{ m}$:** Celda poco estudiada **`83b224fffffffff`** (`23,05° S, 69,50° W`, Región de Antofagasta) con mediana $1,37^\circ$ vs. $1,70^\circ$ en Jezero, **$W_1 = 0,54^\circ$ (IC 95 %: $0,40^\circ\text{–}0,65^\circ$)**, **$D_{\text{KS}} = 0,15$** y diferencia de relieve $W_1 = 1,8\text{ m}$ (estable a $60\text{ m}$ y $90\text{ m}$). Se acerca más a Jezero que el control clásico **Yungay ($W_1 = 3,32^\circ$)**. Es una **preselección para estudiar en terreno, no una certificación**.
   - **❌ Qué NO se parece en pendiente a $30\text{ m}$ (Contraejemplos):**
     - Celda **`83b221fffffffff`** ($4.195\text{–}5.270\text{ m}$): **demasiado escarpada** ($P_{50} = 7,89^\circ$, $W_1 = 6,92^\circ$, $D_{\text{KS}} = 0,74$).
     - Celda **`83b225fffffffff`** ($2.301\text{–}2.342\text{ m}$): **demasiado plana** ($P_{50} = 0,19^\circ$, $W_1 = 1,71^\circ$, $D_{\text{KS}} = 0,82$).
3. **Brecha Física Irreducible ($\mathbf{B}$ — Por qué la Tierra nunca es idéntica):**
   - **Gravedad:** Marte **$0,38\text{ g}$** ($3,7\text{ m/s}^2$) y Luna **$0,166\text{ g}$** ($1,6\text{ m/s}^2$) vs. Tierra **$1,00\text{ g}$** ($9,8\text{ m/s}^2$).
   - **Atmósfera:** Marte **$\sim 0,6\text{ kPa}$ ($6,1\text{ mbar}$, $95\%\text{ CO}_2$)** y Luna **$0\text{ kPa}$ (vacío)** vs. Tierra **$101,3\text{ kPa}$**.
   - **Radiación:** Marte **$\sim 230\text{ mSv/año}$** ($\sim 0,64\text{ mSv/día}$, *Curiosity/RAD*, Hassler et al., 2014) y Luna **$\sim 380\text{ mSv/año}$** vs. Tierra **$\sim 2,4\text{ mSv/año}$** (fondo medio mundial, protegida por magnetósfera y atmósfera).
   - **Temperatura ($\Delta T$):** Luna $\Delta T \approx 290\text{ K}$ ($-178\text{ a }+117\text{ °C}$), Marte media $-59\text{ a }-65\text{ °C}$ vs. Tierra media $15\text{ °C}$.
4. **Caja La Araucana (4 Ejes) y Metas ODS:**
   - 1) Democratizar ciencia de frontera (`ODS 4.3`), 2) Competencias STEAM y empleabilidad (`ODS 4.4, 8`), 3) Aplicación local (`ODS 9.5, 10, 13`), 4) Red interregional *Lattices* (`ODS 17.3, 17.16, 17.17`).
