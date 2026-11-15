# RESUMEN CONCRETO TRAS EL FEEDBACK DE MENTORES — CKEPI (Antofagasta ↔ Luna y Marte)

> **Feedback de los mentores:** *«Tienen mucha información y nada concreto; hay que enfocarlo para que cumpla con la forma Global, Local, Ciencia y Caja La Araucana, centrándose en información concreta sobre Antofagasta.»*  
> **Respuesta aplicada en el Software (`commits bc9bd35` y `c735fc9`) y en las Presentaciones (`ckepi-pitch-es.pptx` y `ckepi-pitch-en.pptx`):** Eliminamos la sobrecarga de datos sueltos y enfocamos **todo el proyecto en UNA SOLA PREGUNTA CONCRETA** y en **4 ZONAS REALES MEDIDAS EN LA REGIÓN DE ANTOFAGASTA**.

---

## 1. LA PREGUNTA Y LA SOLUCIÓN EN 1 FRASE (SIN RUIDO)

- **La Pregunta:**
  > **«¿Dónde en la Región de Antofagasta nos preparamos para ir a la Luna y a Marte — qué se parece de verdad, cuánto se parece a 30 metros, qué cosas jamás puede imitar la Tierra y para qué nos sirve aquí en la región?»**
- **La Tesis de Innovación:**
  > **«No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué características comparte, qué diferencias existen y qué nuevos lugares de Antofagasta merecen ser estudiados utilizando evidencia científica.»**
- **Qué Hace el Software (2 Modos Simples y Directos):**
  1. **Modo Explorar (`?view=explore` — Para colegios, familias y comunidad sin jerga):**
     - En pantalla aparecen solo **3 mundos de cartón flotando (Luna · Antofagasta · Marte)** y una pregunta.
     - Al tocar un mundo, se abre una lección de **4 pasos cortos con 1 pictograma grande, 1 frase simple, 1 elemento interactivo para tocar** (medidor *«Muy parecido / Algo parecido / Poco parecido»*, día vs. noche, mochila de $10\text{ kg}$ que pesa $1,7\text{ kg}$ en la Luna y $3,8\text{ kg}$ en Marte, y el ranking de las 4 zonas de Antofagasta) + botón **«Escuchar» (`Web Speech API`)** en español, portugués e inglés.
  2. **Modo Ciencia (`?view=app` — Para investigadores, ingenieros y estudiantes STEAM):**
     - **Cruce Interactivo (`WorldsHero` + `CrossingDialog`):** Cruza en $< 0,4\text{ s}$ el **Cráter Jezero (Marte)** y el **Polo Sur Lunar (Cráter Shackleton)** con las **4 zonas medidas de Antofagasta**, entregando veredictos inmediatos (**Sí / En parte / No**).
     - **Explorador 3D y Malla Global H3:** Globos 3D NASA Trek WMTS + `12.193` celdas H3 en caché + histogramas de pendiente y relieve a $30\text{ m}$ (`TerrainDistributionPanel`) + ficha de ensayo exportable.

---

## 2. LA INFORMACIÓN CONCRETA SOBRE ANTOFAGASTA (LAS 4 ZONAS MEDIDAS A 30 METROS)

Comparamos el modelo de elevación real de NASA del **Cráter Jezero en Marte (`NASA MRO CTX DEM`, $20\text{ m} \to 30\text{ m}$, ventana de $6\times 6\text{ km}$, pendiente mediana $1,70^\circ$)** contra **4 zonas reales de la Región de Antofagasta (`ESA Copernicus DEM GLO-30`, UTM Zona 19S a $30\text{ m/px}$, ventanas de $6\times 6\text{ km}$)**:

| # | Zona de la Región de Antofagasta | Coordenadas y Altura | Pendiente Mediana ($P_{50}$) | Diferencia con Marte ($W_1$ a 30 m y Bootstrap IC 95 %) | Veredicto Concreto: ¿Sirve o No Sirve y Para Qué? |
|---|---|---|---|---|---|
| **1** | **✅ Pampa Central de Antofagasta** (`Celda H3 83b224fffffffff`) | `23,05° S, 69,50° W`<br/>($1.408\text{–}1.538\text{ m}$) | **$1,37^\circ$**<br/>*(Jezero: $1,70^\circ$)* | **$W_1 = 0,54^\circ$** (IC 95 %: $0,40^\circ\text{–}0,65^\circ$)<br/>$D_{\text{KS}} = 0,15$ · Relieve $W_1 = 1,8\text{ m}$<br/>*(Estable a 60 m: $0,40^\circ$ y 90 m: $0,27^\circ$)* | **SÍ SE PARECE EN TERRENO (EL HALLAZGO):** Es una zona poco estudiada de Antofagasta cuyas pendientes se parecen a Jezero **6 veces más que Yungay**. **Ideal para ensayar ruedas, suspensión y navegación con cámaras/LiDAR de rovers.** |
| **2** | **⚖️ Yungay (Análogo Clásico)** (`control_yungay` / `Celda 83b220fffffffff`) | `24,08° S, 69,91° W`<br/>($957\text{–}1.280\text{ m}$) | **$2,56^\circ$**<br/>*(Cola $P_{90}: 15,11^\circ$)* | **$W_1 = 3,32^\circ$** ($3,70^\circ$ en `83b220`)<br/>$D_{\text{KS}} = 0,31$ · Relieve $W_1 = 20,8\text{ m}$ | **SE PARECE EN ARIDEZ, PERO MENOS EN PENDIENTE:** Tiene laderas fuertes ($15,11^\circ$) que se alejan de la llanura de Jezero. **Ideal para astrobiología hiperárida, suelos salinos y radiación UV** (Aridez $0,967$, Albedo $0,956$). |
| **3** | **❌ Salar / Cordillera de la Sal** (`Celda H3 83b225fffffffff`) | `23,61° S, 68,52° W`<br/>($2.301\text{–}2.342\text{ m}$) | **$0,19^\circ$**<br/>*(Casi horizontal)* | **$W_1 = 1,71^\circ$** (IC 95 %: $1,65^\circ\text{–}1,86^\circ$)<br/>$D_{\text{KS}} = 0,82$ · Relieve $W_1 = 8,2\text{ m}$ | **NO SE PARECE EN PENDIENTE (MUY PLANA):** Costra de salar casi plana; no pone a prueba la tracción ni la suspensión que exige Jezero. |
| **4** | **❌ Alta Cordillera / Salar de Pajonales** (`Celda H3 83b221fffffffff`) | `24,68° S, 68,60° W`<br/>($4.195\text{–}5.270\text{ m}$) | **$7,89^\circ$**<br/>*(Cola $P_{90}: 15,51^\circ$)* | **$W_1 = 6,92^\circ$** (IC 95 %: $6,17^\circ\text{–}7,31^\circ$)<br/>$D_{\text{KS}} = 0,74$ · Relieve $W_1 = 42,8\text{ m}$ | **NO SE PARECE EN PENDIENTE (MUY ESCARPADA):** Terreno volcánico de alta montaña casi 5 veces más empinado que el fondo del cráter Jezero. |

---

## 3. LO QUE ANTOFAGASTA JAMÁS PUEDE IMITAR (LA BRECHA FÍSICA $\mathbf{B}$)

Para ser 100 % honestos científicamente, mostramos que **ningún desierto de la Tierra puede reproducir 4 cosas**:

| Variable Física ($\mathbf{B}$) | En Antofagasta (Tierra) | En la Luna (Polo Sur) | En Marte (Cráter Jezero) | Ejemplo Concreto en la App |
|---|---|---|---|---|
| **1. Gravedad ($g$)** | **$1,00\text{ g}$** ($9,8\text{ m/s}^2$) | **$0,166\text{ g}$** ($1,6\text{ m/s}^2$) | **$0,38\text{ g}$** ($3,7\text{ m/s}^2$) | **Una mochila de $10\text{ kg}$** pesa **$1,7\text{ kg}$** en la Luna y **$3,8\text{ kg}$** en Marte. |
| **2. Aire y Presión ($P_{\text{atm}}$)** | **$101,3\text{ kPa}$ $\text{N}_2/\text{O}_2$** ($\sim 80,7\text{ kPa}$ a $2.450\text{ m}$) | **$0\text{ kPa}$ (Vacío total, sin aire)** | **$\sim 0,6\text{ kPa}$ ($95\%\text{ CO}_2$)** | El aire de Marte es **160 veces más delgado** que el de la Tierra; en la Luna no hay aire. |
| **3. Radiación Cósmica ($R_{\text{ion}}$)** | **$\sim 2,4\text{ mSv/año}$** (protegidos por escudo magnético y atmósfera) | **$\sim 380\text{ mSv/año}$** (sin escudo magnético) | **$\sim 230\text{ mSv/año}$** ($\sim 0,64\text{ mSv/día}$, *Curiosity/RAD*) | En Marte la radiación ionizante es **~100 veces mayor** y en la Luna **~158 veces mayor**. |
| **4. Temperatura ($\Delta T$)** | Media **$15\text{ °C}$** ($\Delta T \approx 28\text{ K}$ en Atacama) | **$-178\text{ a }+117\text{ °C}$** ($\Delta T \approx 290\text{ K}$) | Media **$-59\text{ a }-65\text{ °C}$** | En la Luna cambia casi $300^\circ\text{C}$ entre el día y la noche. |

> **Conclusión concreta:** Por eso CKEPI **preselecciona sitios para estudiar en terreno; no los certifica**.

---

## 4. CÓMO CUMPLE CON LOS 4 PILARES (GLOBAL · LOCAL · CIENCIA · CAJA LA ARAUCANA)

1. **🌍 Pilar Global (NASA Space Apps):**
   - Entregables 100 % en inglés ([`ckepi-pitch-en.pptx`](ckepi-pitch-en.pptx), [`ckepi-pitch-en.pdf`](ckepi-pitch-en.pdf), [`SUBMISSION_PACK_EN.md`](SUBMISSION_PACK_EN.md)).
   - 7 diapositivas limpias, links públicos sin login, datasets NASA con nombre exacto (`MRO CTX DEM 20 m`, `Perseverance MEDA`, `Curiosity REMS/RAD`, `LRO LOLA/Diviner`, `NASA POWER v2.5`, `NASA Trek WMTS`, `NSSDCA`), citas legales Open Science (`Apache License 2.0`, tipografías autoalojadas `Public Sans` USWDS + `IBM Plex Mono` SIL OFL 1.1, `Copernicus DEM GLO-30` DLR/Airbus/UE/ESA), cero logos de NASA y marca de agua visible en fondos/video de IA ([`AI_DISCLOSURE.md`](AI_DISCLOSURE.md)).
2. **🔬 Pilar Ciencia (Escala Común de 30 m):**
   - Comparación real medida a $30\text{ m}$ en metros y grados (`CTX DEM` vs. `Copernicus GLO-30` en UTM 19S, ventanas de $6\times 6\text{ km}$), distancias $W_1$ y $D_{\text{KS}}$, incertidumbre con **Bootstrap espacial por bloques 2D (IC 95 %)**, estabilidad a 30/60/90 m, **qué sí se parece** (`83b224` $W_1 = 0,54^\circ$) vs. **ejemplos de qué NO se parece** (`83b225` muy plana $1,71^\circ$; `83b221` muy escarpada $6,92^\circ$) y **por qué** ($0,38\text{ g}$, $0,6\text{ kPa }\text{CO}_2$, radiación, $\Delta T$).
3. **🇨🇱 Pilar Local Antofagasta (5 Criterios NASA + Demo Básica Mobile-First):**
   - Centrado 100 % en nuestra región (**las 4 zonas de Antofagasta frente a la Luna y Marte**).
   - Demo Mobile-First (`320px` a `4K`) con el nuevo **Modo Explorar (`?view=explore`)**: 3 mundos de cartón flotando, pictogramas propios, voz `Web Speech API` y respuesta en $< 0,4\text{ s}$.
4. **🏛️ Pilar Caja La Araucana (4 Objetivos + Empleos Locales + Metas ODS):**
   - **Eje 1 — Democratizar ciencia de frontera (`ODS 4.3`):** Modo Explorar con pictogramas y voz para escolares, familias y personas mayores sin experiencia científica.
   - **Eje 2 — Competencias STEAM y empleabilidad local (`ODS 4.4, 8`):** Conecta la lectura de mapas de elevación (geomática), la estadística espacial y los datos abiertos de NASA con **3 áreas de empleo real en Antofagasta**:
     1. **Robótica y automatización minera**
     2. **Observatorios astronómicos de la región**
     3. **Energía solar del desierto**
   - **Eje 3 — Aplicación local en Antofagasta (`ODS 9.5, 10, 13`):** Descubre y pone en valor la Pampa Central (`83b224`) frente al análogo clásico Yungay.
   - **Eje 4 — Red interregional *Lattices* (`ODS 17.3, 17.16, 17.17`):** Plataforma libre (`Apache-2.0`) para articular a Caja La Araucana, UCN, UA, liceos y bibliotecas con otras regiones de Chile.
