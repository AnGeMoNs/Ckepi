# Guion Oficial de Pitch Presencial (3 Minutos + 2 Minutos Q&A · Sede Antofagasta / Caja La Araucana)

> **Equipo:** *Lattices Team* — **Ckepi**  
> **Formato Local:** **3:00 minutos de exposición** + **2:00 minutos de preguntas del jurado (UCN / UA / Caja La Araucana)**  
> **Pesos de Referencia Local:** Problema (20 %) · Solución (30 %) · Modelo Sostenible (20 %) · Prototipo en Vivo (20 %) · Comunicación (10 %)

---

## ⏱️ Escaleta Cronometrada de 3 Minutos (Reloj en Mano)

### Bloque 1 · `0:00 – 0:40` (40 s) · ¿El Problema es Real e Importante? + Nuestra Propuesta de Innovación
- **[En pantalla: Slide 1 / Slide 2 o vista principal de Ckepi]**
- **Voz:**
  > *«Buenas tardes. La propia NASA reconoce en este desafío que los análogos terrestres para la Luna y Marte aún no están completamente caracterizados, y que existen oportunidades reales para identificar nuevos lugares integrando datos científicos y comprendiendo las limitaciones físicas de cada terreno.*
  > *¿Por qué importa y a quién afecta? Afecta directamente a investigadores e ingenieros que necesitan información transparente para orientar investigaciones preliminares y preparar ensayos de campo; y abre una gran oportunidad educativa: acercar estos conocimientos a estudiantes y personas sin experiencia científica mediante herramientas comprensibles y accesibles.*
  > *Por eso nuestra propuesta de innovación en **Ckepi** parte de una regla honesta:* **No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué características comparte, qué diferencias existen y qué nuevos lugares merecen ser estudiados utilizando evidencia científica.**»*

---

### Bloque 2 · `0:40 – 1:45` (65 s) · Demo Científica en Vivo: Escala Común de $30\text{ m}$, Qué Sí se Parece y Qué No
- **[En pantalla: Demo en vivo de Ckepi — Globo 3D NASA Trek + Malla H3 + Panel de Distribuciones a 30 m]**
- **Voz:**
  > *«Veámoslo funcionando en vivo. En lugar de dar un porcentaje mágico de similitud, **Ckepi** separa tres capas: las variables independientes del terreno ($\mathbf{X}$), la respuesta ambiental ($\mathbf{Y}$) y la **Brecha Física Irreducible ($\mathbf{B}$)**.*
  > *En topografía, comparamos **modelos de elevación reales a una escala métrica común de 30 metros** sobre ventanas de $6\times 6\text{ km}$: el **CTX DEM de NASA MRO en el Cráter Jezero** frente a ventanas de **Copernicus GLO-30 en la Región de Antofagasta**, midiendo pendiente en grados y relieve local en metros mediante las distancias de **Wasserstein-1 ($W_1$)** y **Kolmogorov–Smirnov ($D_{\text{KS}}$)** con **intervalos de confianza al 95 % por bootstrap de bloques 2D** y sensibilidad a 30, 60 y 90 metros.*
  > *¿Qué descubrimos con datos reales? Que la celda poco estudiada **`83b224fffffffff`** en Antofagasta ($23{,}05^\circ\text{ S}, 69{,}50^\circ\text{ W}$) comparte la distribución de pendientes de Jezero con **$W_1 = 0{,}54^\circ$ (IC 95 %: $0{,}40^\circ\text{–}0{,}65^\circ$)**, más cerca que el control clásico de **Yungay ($W_1 = 3{,}32^\circ$)**.*
  > *Y también demostramos **qué NO se parece y por qué**: la celda altoandina `83b221fffffffff` es demasiado escarpada ($W_1 = 6{,}92^\circ$), la celda de salar `83b225fffffffff` es demasiado plana ($D_{\text{KS}} = 0{,}82$), y **ningún lugar de la Tierra reproduce la Brecha Física $\mathbf{B}$**: la gravedad marciana de $0{,}38\text{ g}$, su atmósfera de $\text{CO}_2$ a $0{,}6\text{ kPa}$ ni los $\sim 230\text{ mSv/año}$ de radiación medidos por Curiosity/RAD. Ckepi **preselecciona** sitios para estudio preliminar; no certifica seguridad operativa.»*

---

### Bloque 3 · `1:45 – 2:30` (45 s) · Demo Mobile-First «Modo Explorar» (3 Mundos de Cartón) + 4 Ejes Caja La Araucana, Empleos Locales y ODS
- **[En pantalla: Vista `?view=explore` — 3 Mundos de Cartón flotando (Luna · Antofagasta · Marte) + Lección con Pictogramas, Mochila de 10 kg y Voz `Web Speech API`]**
- **Voz:**
  > *«Y tras el feedback de los mentores, simplificamos la entrada para toda la comunidad con nuestro **Modo Explorar (`?view=explore`)**, que funciona incluso 100 % estático sin depender de servidor: en pantalla hay una sola pregunta y **tres mundos de cartón flotando —Luna, Antofagasta y Marte—**. Al tocar uno, cualquier niño, familia o persona mayor aprende paso a paso con **pictogramas propios, lectura en voz alta en tres idiomas (`ES/PT/EN`) y simuladores cotidianos**, como ver que una mochila de 10 kilos pesa 1,7 kilos en la Luna y 3,8 kilos en Marte, o explorar el ranking de las **4 zonas medidas de Antofagasta**.*
  > *Así cumplimos de forma concreta los **4 objetivos oficiales de Caja La Araucana** y sus **Metas ODS (`4.3, 4.4, 8, 9.5, 10, 13, 17.3, 17.16, 17.17`)**: 1) democratizamos ciencia de frontera, 2) formamos habilidades STEAM en geomática, estadística y datos NASA conectadas con **empleos reales de Antofagasta —robótica y automatización minera, observatorios astronómicos y energía solar del desierto—**, 3) ponemos en valor nuevos sectores de nuestra región y 4) articulamos una red interregional abierta.»*

---

### Bloque 4 · `2:30 – 3:00` (30 s) · Modelo Sostenible y Cierre
- **[En pantalla: Slide 7 / Exportación `.md / .csv / .geojson`]**
- **Voz:**
  > *«¿Cómo se sostiene? **Ckepi** es 100 % gratuito y abierto (Apache-2.0) para quien aprende, y se sostiene mediante servicios institucionales: talleres STEAM con kits de tarjetas impresas para colegios y municipios, y "nodos territoriales patrocinados" para caracterizar nuevos sitios junto a universidades y empresas.*
  > *Desde Antofagasta hacia la Luna y Marte: ciencia abierta que muestra qué compartimos, en qué nos diferenciamos y qué nuevos lugares de nuestra región merecen ser estudiados. Muchas gracias.»*

---

## 🛡️ Respuestas de $\le 20$ Segundos para el Jurado Académico y Caja La Araucana (Q&A de 2 Minutos)

1. **Dr. Sergio Curilef Huichalaf (UCN, Física Estadística) — *«¿Por qué usan Wasserstein-1 y cómo verifican que no dependa de la resolución?»***
   - *«Porque dos terrenos pueden tener igual pendiente media y colas opuestas. Wasserstein-1 mide el costo físico de transporte en grados o metros sobre la distribución completa, y comprobamos que la cercanía de la celda `83b224fffffffff` frente a Jezero ($W_1 = 0{,}54^\circ$) se mantiene estable al agregar por bloques a 30, 60 y 90 metros.»*
2. **Dr. Jorge Littin Curinao (UCN, Matemáticas / Procesos Estocásticos) — *«¿Por qué bootstrap por bloques 2D y cómo calculan la pendiente?»***
   - *«Los píxeles vecinos de un DEM tienen fuerte autocorrelación espacial; un bootstrap independiente subestimaría la varianza. Por eso remuestreamos bloques 2D de $10\times 10$ píxeles ($300\times 300\text{ m}$) sobre diferencias finitas centrales con recorte de borde de 1 píxel en grilla métrica de 30 m.»*
3. **Dr. Alessio Porcelli (UA, Astronomía / Astropartículas) — *«¿Cómo tratan la radiación cósmica y solar en Marte y la Luna?»***
   - *«La aislamos en la Brecha Física Irreducible $\mathbf{B}$: Curiosity/RAD midió $\sim 0{,}64\text{ mSv/día}$ ($\sim 230\text{ mSv/año}$, Hassler et al., 2014). En la Tierra la magnetósfera y la atmósfera nos protegen ($\sim 2{,}4\text{ mSv/año}$): declaramos explícitamente que Atacama sirve para radiación UV óptica, pero no reproduce radiación ionizante GCR.»*
4. **Dr. Wai-Houng Chou Kam (UCN, Ciencias Farmacéuticas) — *«¿Qué diferencia hay entre Yungay y el sitio que encontraron, y cómo le sirve a la comunidad?»***
   - *«Yungay es el estándar mundial para astrobiología hiperárida y suelos oxidantes (Navarro-González et al., 2003), mientras que la celda `83b224fffffffff` se parece a Jezero específicamente en pendiente topográfica a 30 m ($W_1 = 0{,}54^\circ$ vs. $3{,}32^\circ$ en Yungay). Y esa misma distinción se explica sin jerga y con voz para estudiantes y familias.»*
5. **Jurado Caja La Araucana — *«¿Cómo aseguran que personas sin conocimientos técnicos o sin internet puedan usarlo?»***
   - *«Diseñamos el modo "Tres Mundos en tu Mano" bajo criterios de baja alfabetización digital: una idea por tarjeta, lectura completa por voz sin necesidad de escribir, botones táctiles grandes $\ge 44\text{ px}$ en celulares básicos y fichas imprimibles para talleres presenciales en colegios y centros comunitarios.»*
