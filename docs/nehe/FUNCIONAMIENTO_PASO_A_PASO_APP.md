# FUNCIONAMIENTO PASO A PASO DE LA APLICACIÓN CKEPI (Guía de Demo en Vivo y Flujo Completo)

> **Para:** Nehe & Dani (*Lattices Team*, NASA Space Apps Challenge 2026 — Sede Antofagasta)  
> **Rama Activa:** `dani` (`origin/dani`)  
> **Propósito:** Explicar **clic por clic y pantalla por pantalla** cómo funciona CKEPI de principio a fin, tanto para mostrarlo en la **Demo en Vivo de 60 segundos** frente al jurado como para responder cualquier pregunta sobre el flujo del usuario.

---

## VISTA GENERAL DE LAS 4 PANTALLAS DE CKEPI

La aplicación tiene un flujo progresivo diseñado tras el feedback de los mentores (**de lo más simple y visual para cualquier persona, hacia lo más profundo para el investigador**):

```text
[PASO 1: HOME INTRO (/)]
   │  Video animado en capas de papel + Marca de agua "Video generado con IA"
   │  Botón: "Explorar los tres mundos" (transición de ola hexagonal HexField)
   ▼
[PASO 2: MODO EXPLORAR LOCAL (?view=explore)]  ◄── PENSADO PARA LA COMUNIDAD Y COLEGIOS
   │  Izquierda: "¿Dónde en la Tierra nos preparamos para la Luna y Marte?"
   │  Derecha: 3 mundos de cartón flotando (Luna · Antofagasta · Marte)
   │  Al tocar un mundo -> Abre LearnDialog (4 pasos con pictogramas + Voz Web Speech API + Mochila 10 kg)
   │  Arriba a la derecha: Discos de idioma (ES / PT / EN) + Botón "Modo ciencia →"
   ▼
[PASO 3: MODO CIENCIA — CRUCE INTERACTIVO (?view=app)]  ◄── PENSADO PARA INVESTIGADORES Y STEAM
   │  A) Arriba (WorldsHero): 3 tarjetas de cristal (Luna · Antofagasta · Marte) con veredictos Sí / En parte / No
   │     Al tocar una tarjeta -> Abre CrossingDialog (cruce de 4 pasos + 4 zonas de Antofagasta a 30 m + Empleos locales)
   │  B) Barra de 4 Pestañas (con píldora deslizante de cobre):
   │     1. [Comparar]   -> Tablero Tres Mundos + Globos 3D (Luna/Marte) + Mapa H3 Tierra + Descomposición X→Y∥B + Histogramas DEM 30 m + Matriz Ranking
   │     2. [Aprender]   -> Laboratorio Interactivo de Física Planetaria (Tu cuerpo, Física imposible, Ingeniería espacial, 14 Curiosidades y Mini-retos)
   │     3. [Planificar] -> Ficha de Ensayo Local en Terreno y Economía Circular (equipos reutilizables y exportación .md)
   │     4. [Evidencia]  -> Trazabilidad completa de fuentes NASA/ESA, metodología X→Y∥B, metas ODS y Declaración de IA
   ▼
[OPCIONAL: MODO PRESENTACIÓN GUIADA (?view=intro)]
      4 tarjetas paso a paso con voz (1. Problema, 2. Qué hace Ckepi, 3. Hallazgo 83b224 a 30 m, 4. Límite honesto)
```

---

## PASO 1 · PANTALLA DE BIENVENIDA (`/` · `HomePage.tsx`)

1. **Qué ve el usuario al abrir la URL raíz (`/`):**
   - Un video en loop de estética *paper-cut* (`/media/ckepi-home.webm` / `.mp4`) que muestra las capas del desierto de Atacama y el espacio, acompañado en la esquina inferior por la etiqueta obligatoria **`«Video generado con IA» / «AI-generated video»`** y los créditos de datos abiertos de NASA/ESA.
   - Al terminar el video (o al pulsar **«Saltar intro»** arriba a la derecha), aparece sobre el último fotograma una malla de hexágonos de papel (`HexField.tsx`), el logo **CKEPI** en la paleta V2 (*Sal, Cobre y Azufre*), la pregunta **«¿Qué se parece? ¿Cuánto? ¿Y qué no?»**, el dato real de Antofagasta ($W_1 = 0,54^\circ$ vs. Yungay $3,32^\circ$ a $30\text{ m}$) y el botón principal **«Explorar los tres mundos»**.
2. **Qué pasa al hacer clic en «Explorar los tres mundos»:**
   - La malla de hexágonos se abre como una ola (`EXIT_MS = 1050 ms`) y lleva directamente al **Paso 2: Modo Explorar Local (`?view=explore`)**.

---

## PASO 2 · MODO EXPLORAR LOCAL (`?view=explore` · `LocalExplorePage.tsx` + `LearnDialog.tsx`)

> **Por qué existe esta pantalla:** Responde directamente al feedback de los mentores (*«no saturen de información al principio»*). Cualquier niño, estudiante, familia o persona mayor con baja alfabetización digital la entiende en 5 segundos.

1. **Qué hay en pantalla:**
   - **Cabecera limpia sin cajas:** Logo vectorial `CKEPI` (0 % IA), **3 discos de cartón para cambiar idioma en 1 clic (`ES`, `PT`, `EN` — 1.052 claves traducidas)** y el enlace **«Modo ciencia»**.
   - **Mitad izquierda:** Una sola pregunta grande: **«¿Dónde en la Tierra nos preparamos para la Luna y Marte?»**, una frase breve (*«Antes de viajar al espacio, se practica en lugares de la Tierra que se le parecen. El desierto de Antofagasta es uno de ellos»*) y la instrucción animada **«→ Toca un mundo»**.
   - **Mitad derecha:** Los **3 mundos de cartón recortado (`PaperPlanet.tsx`, dibujados 100 % por código SVG)** flotando con estrellas que titilan: **Luna** (arriba), **Antofagasta / Tierra** (centro, más grande) y **Marte** (abajo).
2. **Qué pasa al tocar cualquiera de los 3 mundos (`LearnDialog.tsx`):**
   Se abre una ventana de cristal (`.ckepi-glass`) con **una sola idea por paso**, un **pictograma grande**, un botón **«Escuchar» (`Web Speech API` que lee todo en voz alta)** y un **control interactivo para tocar**:
   - **Si tocas MARTE (4 pasos):**
     - *Paso 1 (¿Qué es?):* Explica que el rover *Perseverance* recorre el cráter Jezero.
     - *Paso 2 (¿Su suelo se parece al nuestro?):* Muestra un medidor interactivo (**«Muy parecido / Algo parecido / Poco parecido»**) conectado en vivo al backend (`< 0,4 s`). Al tocar **«Pampa de Antofagasta»** muestra **Muy parecido ($W_1 = 0,54^\circ$)**; al tocar **«Yungay»** muestra que en inclinación del suelo se parece menos ($W_1 = 3,32^\circ$).
     - *Paso 3 (¿Qué es distinto?):* Simulador interactivo de **Mochila**: el usuario mueve el peso de una mochila ($5\text{ a }20\text{ kg}$) y ve que **10 kg en Antofagasta pesan solo 3,8 kg en Marte ($0,38\text{ g}$)**, además de que el aire es muy delgado y hay mucha más radiación.
     - *Paso 4 (¿Para qué sirve saberlo?):* Muestra 3 fichas claras: *1) Probar ruedas y cámaras de robots aquí, 2) Gastar menos y arriesgar menos, 3) Aprender ciencia con nuestro propio desierto*.
   - **Si tocas LA LUNA (4 pasos):**
     - *Paso 1:* Bases planeadas en el Polo Sur Lunar (Cráter Shackleton).
     - *Paso 2:* Comparador interactivo **De día / De noche** con datos reales de la API (mostrando el salto térmico extremo en la Luna frente a Atacama).
     - *Paso 3:* Simulador de **Mochila** (**10 kg en Antofagasta pesan solo 1,7 kg en la Luna**, sin aire y sin escudo magnético).
     - *Paso 4:* Para qué sirve en Atacama: *Probar paneles solares, probar equipos contra el polvo y entrenar antes del viaje*.
   - **Si tocas ANTOFAGASTA / TIERRA (3 pasos):**
     - *Paso 1:* Por qué Antofagasta es uno de los desiertos más secos del mundo.
     - *Paso 2 (Medimos cuatro zonas):* Muestra la **lista ordenada de las 4 zonas reales de Antofagasta medidas a 30 m** de más a menos parecida a Jezero:
       1. **Pampa (`83b224`):** $0,54^\circ$ — *Muy parecido*
       2. **Salar (`83b225`):** $1,71^\circ$ — *Algo parecido (muy plano)*
       3. **Cerca de Yungay (`83b220`):** $3,70^\circ$ — *Poco parecido en pendiente (laderas fuertes)*
       4. **Alta cordillera (`83b221`):** $6,92^\circ$ — *Poco parecido (muy escarpado)*
     - *Paso 3 (¿Para qué sirve?):* Oficios que abre en la región: *Leer mapas del terreno, trabajar con datos y robots, mostrar nuestro desierto al mundo*.

---

## PASO 3 · MODO CIENCIA (`?view=app` · `ExplorerPage.tsx`)

Al pulsar **«Modo ciencia»** arriba a la derecha en el Modo Explorar (o abrir `?view=app`), entra la ola hexagonal (`HexReveal.tsx`) y se despliega la estación científica completa dividida en **2 bloques principales**:

### Bloque Superior: `WorldsHero.tsx` + `CrossingDialog.tsx` (El Cruce Interactivo con Antofagasta)
1. **Qué ve el usuario de inmediato:**
   - Tres tarjetas vivas de cristal (**Luna · Antofagasta · Marte**), cada una con su número ancla animado (`NumberTicker`: `0,17 g` en la Luna, `4 zonas reales medidas a 30 m` en Antofagasta, y `0,54°` de diferencia de pendientes en Marte) y **3 etiquetas de veredicto inmediato**:
     - 🟢 **Sí** (ej. *pendientes del terreno*, *terreno medido con DEM reales*, *laboratorio natural local*)
     - 🟡 **En parte** (ej. *desierto seco y cielo despejado*, *frío y cambio día–noche*, *red con otras regiones*)
     - 🔴 **No** (ej. *gravedad, aire y radiación*, *vacío: sin aire*, *radiación espacial*)
2. **Qué pasa al pulsar «Cruzar Marte ↔ Antofagasta», «Cruzar Luna ↔ Antofagasta» o «Ver el laboratorio local» (`CrossingDialog.tsx`):**
   - Se abre el diálogo de cruce científico-territorial en **4 pasos**:
     - **Paso 1 (El Cruce):** Animación de los dos mundos encontrándose.
     - **Paso 2 (Lo que sí se parece — DEM a 30 m):** Gráfico comparativo directo entre la **Zona de Antofagasta (`83b224`, $W_1 = 0,54^\circ$, IC 95 % $0,40^\circ\text{–}0,65^\circ$)** y **Yungay ($W_1 = 3,32^\circ$)** con cita exacta de `NASA MRO CTX DEM (20 m)` y `ESA Copernicus GLO-30 (30 m)`.
     - **Paso 3 (Lo que la Tierra no puede imitar — Brecha $\mathbf{B}$):** Control deslizante de mochila ($1\text{ a }50\text{ kg}$) + tabla comparativa de presión ($\text{kPa}$) y radiación ($\text{mSv/año}$).
     - **Paso 4 (Para qué sirve, qué aprendes en STEAM y empleos en Antofagasta):** Tres columnas concretas que cumplen los ejes de **Caja La Araucana**:
       - **Para qué sirve (Ensayos):** Ruedas y suspensión de rovers en pendientes como Jezero, navegación con cámaras, paneles solares con polvo.
       - **Qué aprendes (STEAM):** Leer mapas de elevación (geomática), comparar distribuciones con estadística ($W_1$, KS), programar con datos abiertos de NASA.
       - **En qué podrías trabajar en Antofagasta (Empleabilidad):** **Robótica y automatización minera**, **Observatorios astronómicos de la región** y **Energía solar del desierto**.

---

### Bloque Inferior: Las 4 Pestañas del Flujo Científico (`Comparar · Aprender · Planificar · Evidencia`)

Debajo de las 3 tarjetas está la barra de navegación con 4 pestañas:

#### Pestaña 1: `Comparar` (Por defecto)
1. **Tablero «Tres mundos, datos reales» (`ThreeWorldsBoard.tsx`):**
   - Compara lado a lado **Tierra (celda H3 activa) · Luna · Marte** en 6 variables clave (Gravedad, Presión del aire, Radiación, Temperatura media, Cambio día–noche y Pendiente), indicando con una insignia si cada dato es **medido**, **derivado**, **modelo** o **constante**, más el histograma de terreno medido a $30\text{ m}$ y botón rápido **«Ver la celda de Antofagasta (`83b224`)»**.
2. **Panel de Control Lateral (`ControlPanel.tsx`) y Barra de Acción (`ActionBar.tsx`):**
   - Permite elegir cualquiera de los **5 sitios curados de NASA** (Cráter Jezero, Cráter Gale, Mawrth Vallis en Marte; Cráter Shackleton Polo Sur, Mare Tranquillitatis en la Luna), el **Perfil de Misión** (Movilidad de Rover, Calibración Óptica, Habitabilidad/Astrobiología, Perforación ISRU), el **modelo matemático** (`RidgeCV`, `RandomForest`, `PCA`) y la métrica de distancia (`Euclidean`, `Mahalanobis` / `Pareto`).
3. **Mapas Sincronizados 2D/3D (`PlanetaryMap.tsx` + `AnalogMap.tsx`):**
   - **Izquierda (Globo Planetario 2D/3D):** Globo interactivo con teselas reales **NASA Moon Trek / Mars Trek WMTS**. Puedes rotarlo en 3D o hacer clic en cualquier coordenada de la Luna o Marte para sondear ese punto en vivo (`/api/v1/probe-planet`).
   - **Derecha (Mapa Terrestre H3):** Muestra las **12.193 celdas H3 en caché** coloreadas por similitud. Al pasar el mouse muestra el **HUD H3 en vivo**, y al hacer clic en **«Refinar celda»** subdivide cualquier hexágono en sus **7 celdas hijas de mayor resolución**.
4. **Descomposición Causal $\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$ (`DecompositionPanel.tsx`):**
   - Muestra el aporte de las 10 variables independientes ($\mathbf{X}$), las 6 respuestas dependientes ($\mathbf{Y}$) y las alertas rojas de las 3 fronteras de ruptura ($\mathbf{B}$).
5. **Diagnóstico de Misión y Estadística a 30 m (`MissionDiagnostics.tsx` + `TerrainDistributionPanel.tsx` + `LaAraucanaImpactPanel.tsx`):**
   - **Histogramas y curvas CDF superpuestas a 30 m** (Marte Jezero vs. Celda de Antofagasta vs. Control Yungay) para pendiente ($^\circ$) y relieve local ($\text{m}$).
   - **Perfil longitudinal (transecto de 3,6 km a 30 m/px)** y **tabla de sensibilidad multiescala (30 m · 60 m · 90 m)** con Bootstrap 2D (IC 95 %).
   - **Panel de Laboratorio Natural de Antofagasta y Caja La Araucana** + botones de exportación reproducible (`CSV`, `GeoJSON`, `Markdown`).
6. **Matriz de Ranking Global (`AnalogComparisonMatrix.tsx`):**
   - Tabla interactiva con las mejores celdas terrestres ordenadas por similitud e intervalo de confianza.

#### Pestaña 2: `Aprender` (`PlanetaryPhysicsLab.tsx`)
- Laboratorio interactivo STEAM con **4 aventuras científicas**:
  1. **Tu cuerpo en otros mundos:** Calculadora interactiva de masa ($\text{kg}$, constante) vs. peso ($\text{N}$, cambia con $g$), altura de salto y tiempo en el aire en Tierra, Luna y Marte.
  2. **Física imposible:** Tiro parabólico en distinta gravedad y diagrama de fases del agua a $\sim 0,6\text{ kPa}$ en Marte (por qué el agua líquida hierve o se congela al aire libre).
  3. **Ingeniería espacial:** Simulador de fuerzas sobre un rover en la pendiente real del sitio activo ($F_{\parallel} = m g \sin\theta$ y tracción normal $N = m g \cos\theta$).
  4. **Curiosidades y Mini-retos:** 14 tarjetas interactivas con fuentes NASA/peer-reviewed y 4 preguntas de autoevaluación con insignia de *Explorador/a Planetario/a*.

#### Pestaña 3: `Planificar` (`FieldTrialPlanner.tsx`)
- Permite armar una **Ficha de Ensayo Preliminar en Terreno** para la celda seleccionada de Antofagasta:
  - Incluye 3 plantillas rápidas (*🤖 Tracción rover*, *🌡️ Sensores térmicos*, *🎓 Taller escolar STEAM*).
  - Lista de **equipamiento reutilizable o en préstamo (Economía Circular · ODS 12)**: inclinómetro IMU, chasis STEAM, batería LiFePO4, estación meteorológica portátil, Arduino/ESP32.
  - Exporta un documento `.md` listo para llevar a terreno con las alertas de seguridad y límites físicos ($\mathbf{B}$).

#### Pestaña 4: `Evidencia` (`EvidencePanel.tsx`)
- Muestra en una sola vista toda la **procedencia legal y científica (`SPD-41a` / `FAIR`)**:
  - Tabla de fuentes abiertas integradas (NASA Trek WMTS, PDS ODE, POWER, ESA Copernicus DEM, ERA5-Land, SoilGrids, Macrostrat).
  - Metodología causal $\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$.
  - Alineación honesta con las **Metas ODS (`4.3, 4.4, 8, 9.5, 10, 12.5, 13, 17.3, 17.16, 17.17`)**.
  - **Declaración completa de uso de IA (`AI_DISCLOSURE.md`)**.

---

## GUION DE 45 SEGUNDOS PARA MOSTRAR LA DEMO EN VIVO EN EL ESCENARIO

1. **`0:00 – 0:10` (Modo Explorar `?view=explore`):**
   - Muestra los **3 mundos de cartón flotando**. Toca **Marte**, avanza al paso 2 y toca **«Pampa de Antofagasta»** (*Muy parecido, $0,54^\circ$*) vs. **«Yungay»** ($3,32^\circ$). Pulsa **«Escuchar»** 3 segundos para que el jurado oiga la voz accesibilidad.
2. **`0:10 – 0:25` (Cruce Interactivo `?view=app`):**
   - Pulsa **«Modo ciencia»** arriba a la derecha. En las 3 tarjetas de cristal (`WorldsHero`), toca **«Cruzar Marte ↔ Antofagasta»**: muestra el gráfico de barras de las **4 zonas medidas de Antofagasta a 30 m**, el simulador de mochila ($10\text{ kg} \to 3,8\text{ kg}$) y la columna de **empleos locales en Antofagasta** (robótica minera, observatorios y energía solar).
3. **`0:25 – 0:45` (Globo 3D y Estadística a 30 m):**
   - Cierra el diálogo, gira el **Globo 3D de Marte (Cráter Jezero)** junto al **Mapa H3 de Antofagasta**, baja al **Histograma de Pendientes a 30 m (`TerrainDistributionPanel`)** mostrando el intervalo de confianza Bootstrap 2D ($0,40^\circ\text{–}0,65^\circ$) y exporta el reporte en 1 clic.
