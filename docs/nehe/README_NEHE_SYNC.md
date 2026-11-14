# Carpeta de Sincronización de Presentación, PPT, Pitch y Demo (`docs/nehe/`)

> **Para:** Nehe & Dani (*Lattices Team*, NASA Space Apps Challenge 2026 — Sede Antofagasta)  
> **Propósito:** Centralizar todos los archivos actualizados de **PPT (7 Slides en Inglés), Prototipo Interactivo de Presentación, Guion de Pitch Presencial (3 min + Q&A), Guion de Video Demo (30 s) y Tablas de Datos Reales Verificados** para trabajar sincronizados sin pisar código.

---

## 📂 Índice de Archivos en `docs/nehe/`

| Archivo | Qué contiene | Para qué usarlo |
|---|---|---|
| [`PPT_7_SLIDES_GLOBAL_EN.md`](PPT_7_SLIDES_GLOBAL_EN.md) | **Contenido oficial de las 7 Slides (100 % en inglés):** Textos exactos, tablas, estructura visual y créditos legales Open Science cumpliendo el límite estricto de NASA ($\le 7$ slides incluyendo portada y créditos). | Copiar/pegar directamente en PowerPoint / Canva / Google Slides o usar como base del PDF de envío global. |
| [`PPT_7_SLIDES_PROTOTYPE.html`](PPT_7_SLIDES_PROTOTYPE.html) | **Presentación Interactiva HTML/CSS (7 Slides en inglés):** Deck visual autocontenido estilo *Dark Cosmic Glass* navegable con flechas `←` / `→` y con botón **`Print / PDF`**. | Abrir en cualquier navegador para proyectar en vivo o exportar el PDF de 7 páginas listo para subir. |
| [`PITCH_LOCAL_3MIN_ANTOFAGASTA_ES.md`](PITCH_LOCAL_3MIN_ANTOFAGASTA_ES.md) | **Guion de Pitch Presencial (3 Minutos + 2 Minutos Q&A en Español):** Estructura cronometrada para el Demo Day en Antofagasta (UCN / UA / Caja La Araucana), recorrido de la demo Mobile-First y respuestas de 20 s a cada juez. | Ensayar la exposición oral de 3 minutos y defender las preguntas del jurado local. |
| [`GUION_VIDEO_DEMO_30S_EN_ES.md`](GUION_VIDEO_DEMO_30S_EN_ES.md) | **Guion del Video Demo de $\le 30\text{ s}$:** Escaleta segundo a segundo (`0:00` a `0:30`) con qué pantalla grabar de la app, voz en español/inglés y subtítulos quemados en inglés obligatorios. | Grabar y editar el reel/video de 30 segundos sin pasarse ni un segundo del límite. |
| [`DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md`](DATOS_VERIFICADOS_PARA_DIAPOSITIVAS.md) | **Hoja de Datos Reales Verificados (*Cheat Sheet*):** Tablas listas para diapositivas con los resultados sobre **DEM reales a 30 m** (`NASA MRO CTX DEM` vs. `ESA Copernicus GLO-30`), casos positivos y negativos, tabla *Tres Mundos* (NASA NSSDCA), Brecha Física $\mathbf{B}$, ODS de Caja La Araucana y créditos legales. | Evitar cualquier contradicción numérica entre las diapositivas, el pitch oral y el código del backend. |

---

## 🎯 Las 4 Claves que Deben Sonar Igual en el PPT, el Video y el Pitch

1. **Nuestra Propuesta de Innovación (Frase Ancla):**
   - **ES:** *«No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué características comparte, qué diferencias existen y qué nuevos lugares merecen ser estudiados utilizando evidencia científica.»*
   - **EN:** *"We do not seek to prove that Atacama is identical to Mars. We seek to show which characteristics it shares, which differences exist, and which new locations deserve to be studied using scientific evidence."*
2. **Comparación Científica sobre DEM Reales a Escala Común de $30\text{ m}$ (Ventanas de $6\times 6\text{ km}$):**
   - **Marte (Referencia):** Cráter Jezero (`18.38° N, 77.58° E`) medido con **NASA MRO CTX DEM** (USGS, $20\text{ m/px}$ remuestreado por promedio de área a **$30\text{ m/px}$**; mediana de pendiente $P_{50} = 1.70^\circ$).
   - **Tierra (Antofagasta):** Ventanas de **ESA Copernicus DEM GLO-30** reproyectadas a **UTM Zona 19S (`EPSG:32719`, $30\text{ m/px}$)**.
   - **✅ Qué SÍ se parece en pendiente a $30\text{ m}$:** La celda poco estudiada **`83b224fffffffff`** (centro `23.052° S, 69.497° W`, $1.408\text{--}1.538\text{ m}$ en la Región de Antofagasta) tiene mediana $P_{50} = 1.37^\circ$, distancia **Wasserstein-1 $W_1 = 0.54^\circ$ (IC 95 % por bootstrap 2D: $0.40^\circ\text{--}0.65^\circ$)**, **$D_{\text{KS}} = 0.15$** y diferencia de relieve local $W_1 = 1.8\text{ m}$ (y la cercanía se mantiene a $60\text{ m}$ y $90\text{ m}$). Supera al control clásico **Yungay** ($W_1 = 3.32^\circ$, que tiene una cola de pendientes altas con $P_{90} = 15.1^\circ$ vs. $4.0^\circ$ en Jezero).
   - **❌ Qué NO se parece en pendiente a $30\text{ m}$ (Contraejemplos):**
     - La celda altoandina **`83b221fffffffff`** ($4.195\text{--}5.270\text{ m}$) es **demasiado escarpada** ($P_{50} = 7.89^\circ$, $W_1 = 6.92^\circ$, $D_{\text{KS}} = 0.74$, relieve $W_1 = 42.8\text{ m}$).
     - La celda de salar **`83b225fffffffff`** ($2.301\text{--}2.342\text{ m}$) es **demasiado plana** ($P_{50} = 0.19^\circ$, $W_1 = 1.71^\circ$, $D_{\text{KS}} = 0.82$).
3. **La Brecha Física Irreducible ($\mathbf{B}$ — Por qué ningún sitio terrestre es idéntico):**
   - **Gravedad:** Marte **$0.38\text{ g}$** ($3.72\text{ m/s}^2$) y Luna **$0.166\text{ g}$** ($1.62\text{ m/s}^2$) vs. Tierra **$1.00\text{ g}$** ($9.81\text{ m/s}^2$).
   - **Atmósfera:** Marte **$\sim 0.6\text{ kPa}$ ($6.1\text{ mbar}$, $95\%\text{ CO}_2$)** y Luna **$0\text{ kPa}$ (vacío)** vs. Tierra **$101.3\text{ kPa}$**.
   - **Radiación Ionizante:** Marte **$\sim 230\text{ mSv/año}$** ($\sim 0.64\text{ mSv/día}$, *Curiosity/RAD*, Hassler et al., 2014) y Luna **$\sim 380\text{ mSv/año}$** vs. Tierra **$\sim 2.4\text{ mSv/año}$**.
   - **Temperatura ($\Delta T$):** Luna $\Delta T \approx 290\text{ K}$ ($95\text{--}390\text{ K}$), Marte media $-59\text{ °C}$ a $-65\text{ °C}$ ($\Delta T \approx 80\text{--}100\text{ K}$) vs. Tierra media $15\text{ °C}$.
4. **Impacto Humano, Caja La Araucana y Metas ODS Verificadas:**
   - Modo accesible **«Tres Mundos en tu Mano»** (baja alfabetización digital, lectura por voz `Web Speech API`, 3 niveles, tarjetas imprimibles).
   - Cumple los **4 objetivos de Caja La Araucana** y sus metas ODS oficiales: **`4.3, 4.4, 8, 9.5, 10, 13, 17.3, 17.16, 17.17`**.
   - **Regla anti-descalificación:** Cero logos de NASA (*Meatball* / *Worm*) en las slides o el video.
