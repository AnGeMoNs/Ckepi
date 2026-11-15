# Ckepi · Módulo STEAM (guía para el jurado)

> **«La ciencia no empieza en un laboratorio: empieza cuando alguien mira su propio paisaje y se pregunta por qué.»**
>
> Muchas personas sienten que la ciencia queda lejos: en otro idioma, en otra ciudad, detrás de fórmulas. Ckepi quiere **acortar esa distancia**. Parte de lo que cada persona ya conoce —la pampa, el salar, el cielo del desierto— y la acompaña, paso a paso, hasta Marte. **Nadie está lejos de la ciencia; a veces solo falta que alguien le acerque el cielo.**

**Desafío abordado:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars* (NASA Space Apps 2026).

---

## 1. Propósito: reducir la brecha de ciencia en jóvenes

El módulo STEAM existe para **reducir la brecha de ciencia en jóvenes** (y en cualquier persona que quiera aprender). No es un juego aparte: **toma el mismo desafío que resuelve el modo Ciencia y lo convierte en un camino de aprendizaje con niveles de dificultad**, hasta que la persona entiende el módulo de ciencias por completo.

- **Mismo desafío, mismos datos.** Las cifras del módulo STEAM son las del modo Ciencia: la comparación real a 30 m entre el cráter Jezero (Marte) y la pampa de Antofagasta. Nada se inventa ni se simplifica hasta volverse falso.
- **Dificultad graduada.** Tres niveles sobre el mismo dato; cambia la profundidad de la explicación, no la verdad del número.
- **Una meta clara.** Al completar la ruta, la persona recibe un **certificado que es su pase al modo Ciencia**: ya conoce los conceptos que va a encontrar ahí.

---

## 2. Cómo se entra

- En la portada, el planeta **Aprender** abre el módulo STEAM y el planeta **Investigar** abre el modo Ciencia.
- Dentro del software, el interruptor **STEAM / Científico** cambia de modo en cualquier momento.

El módulo STEAM tiene tres pestañas:

| Pestaña | Para qué sirve |
|---|---|
| **Misión** | La «Misión Cadete»: el recorrido gamificado de cinco estaciones y el certificado. Es lo primero que se abre. |
| **Tres mundos** | Laboratorio de cartón para comparar la Tierra, la Luna y Marte (gravedad, aire, radiación, día y noche, duración del día). |
| **Explorar Mundos** | Los mismos mapas del modo Ciencia (globo 3D y hexágonos de la Tierra), con lenguaje simple. |

---

## 3. Niveles de dificultad

El selector **Nivel de dificultad** está siempre visible en la misión:

| Nivel | Cómo explica | Ejemplo (estación Comparar) |
|---|---|---|
| **1 · Simple** | Con lo cotidiano y lo cercano | «Imagina que cada pedacito de suelo es un poroto y lo pones en una columna según qué tan inclinado está.» |
| **2 · Intermedio** | Con el concepto y su nombre | «La distancia W₁ dice cuántos grados habría que mover para que un montón quede igual al otro.» |
| **3 · Técnico** | Con el método completo | «W₁ (Wasserstein-1) se mide en grados y su IC 95 % sale de un bootstrap espacial por bloques 2D.» |

**La escalera hasta el modo Ciencia:**

1. La persona completa las cinco estaciones en su nivel.
2. El certificado le propone **subir un nivel** y repetir la ruta con más profundidad (de Simple a Intermedio, de Intermedio a Técnico).
3. Al completar el nivel Técnico, el certificado ofrece **entrar al modo Ciencia**, donde encontrará las mismas medidas (pendiente, W₁, intervalo de confianza, brecha física) que ya domina.

El paso al modo Ciencia también se puede dar antes: el certificado de cualquier nivel incluye ese botón. Nadie queda bloqueado; la escalera es una invitación, no una barrera.

---

## 4. La Misión Cadete: de la pampa a Marte

Una ruta de la Tierra a Marte con **seis paradas**: cinco estaciones y el certificado. Un rover de cartón avanza por la ruta y cada estación completada queda sellada como **insignia**.

### 4.1 Predecir antes de mirar

Las cuatro primeras estaciones empiezan con una apuesta: la persona predice y **después** ve los datos. Es el ciclo *predecir → observar → explicar*.

- Acertar suma **10 puntos de ciencia**.
- Equivocarse no resta y se celebra: «No era esa, y está bien: así se aprende. Los datos deciden».
- Se puede ver los datos sin apostar.
- La respuesta correcta **se calcula con los datos reales**, no está escrita a mano.

### 4.2 Las cinco estaciones

Son los mismos pasos que hace la ciencia de verdad, agrupados en tres etapas: **Mirar → Comparar → Investigar**. Cada estación se puede **escuchar en voz alta** y termina con el **oficio real** que hace ese paso.

| # | Estación | Qué hace la persona | Dato real que usa | Oficio |
|---|---|---|---|---|
| 1 | **Observar** | Compara un corte de 6 km de la pampa con uno del cráter Jezero, a la misma escala | Perfiles de elevación a 30 m: Copernicus GLO-30 (ESA) y CTX de Jezero (NASA MRO, USGS) | Geólogo/a |
| 2 | **Medir** | Inclina una tabla de cartón y ve cuántos centímetros sube por cada metro | Pendiente mediana: Jezero 1,70°, pampa 1,37° | Topógrafo/a |
| 3 | **Comparar** | Compara dos «montones» de pendientes y cuántos grados separan sus formas | W₁ = 0,54° (IC 95 % 0,40–0,65) en la celda `83b224`, frente a 3,32° del clásico Yungay | Analista de datos |
| 4 | **Lo que no se parece** | Descubre lo que la Tierra no puede imitar y un terreno que tampoco se parece | 0,38 g / 0,166 g; ~0,6 kPa de CO₂ / vacío; ~230 mSv/año (Hassler 2014) / ~380 (Reitz 2012); celda `83b221`, W₁ = 6,92° | Ingeniero/a de ensayos |
| 5 | **Decidir** | Juzga tarjetas: ¿esta prueba se puede hacer en la pampa o hay que hacerla en laboratorio? Cada acierto suma 5 puntos | El protocolo del motor de Ckepi para la celda `83b224` | Operador/a de drones o rovers |

El máximo es de **70 puntos de ciencia** (4 predicciones de 10 puntos y 6 tarjetas de 5 puntos).

**Por qué importa la estación 4:** enseña que la ciencia también dice qué **no** funciona. Un buen análogo es el que conoce sus límites.

### 4.3 El certificado: el pase al modo Ciencia

Al terminar, la persona recibe su certificado de **«Exploradora o explorador de análogos planetarios»**:

- **Pase al modo Ciencia**, que se obtiene al completar las cinco estaciones. Si faltan estaciones, el certificado dice cuántas.
- **Nivel completado** (Simple, Intermedio o Técnico) y el botón para **subir de nivel**.
- Las **cinco insignias**, cada una con el oficio que practicó.
- Los **puntos de ciencia**.
- La **evidencia real** con la que trabajó, leída de los mismos datos: W₁ de la pampa frente a Jezero, su intervalo de confianza, el control Yungay y la brecha física.
- La aclaración honesta: es una preselección para estudiar en terreno, no una certificación.
- El **nombre se escribe en pantalla y no se guarda**; se puede **imprimir** un certificado por estudiante.

La misión cierra con **tres preguntas de investigación** respondidas con los datos: qué terreno merece investigarse, para qué ensayo preliminar podría servir y qué información falta todavía.

---

## 5. Tres mundos sobre la mesa

Un laboratorio para tocar la Tierra, la Luna y Marte. Cada dato se cruza con los otros dos mundos, con su unidad:

- gravedad;
- aire;
- radiación;
- oscilación entre el día y la noche;
- duración del día.

Las comparaciones usan metáforas de la vida diaria (cuánto pesaría tu mochila, cómo quedaría un globo inflado) en vez de números sueltos. Sirve de calentamiento antes de la misión.

---

## 6. La pedagogía detrás

- **Partir de lo conocido (Paulo Freire):** la misión empieza en el paisaje propio («¿has mirado la pampa por la ventana del bus?») y desde ahí viaja a Marte.
- **Aprender haciendo:** observar → medir → comparar → reconocer límites → decidir. Es el ciclo de una investigación real.
- **Predecir, observar, explicar:** apostar antes de mirar convierte el dato en una respuesta a una pregunta propia.
- **Pictogramas antes que palabras:** cada idea tiene un pictograma de cartón propio. Quien todavía lee con esfuerzo entiende primero con los ojos.
- **Niveles, no versiones:** el dato es el mismo en los tres niveles; lo que crece es la explicación.
- **Escuchar:** cada estación se puede oír en voz alta (Web Speech API) en español, portugués o inglés.
- **Honestidad como valor educativo:** se enseña la incertidumbre (intervalos de confianza) y lo que no se parece.
- **Vocación:** cada estación termina en un oficio real; la persona se ve a sí misma haciendo ciencia.

---

## 7. Llevarlo al aula

- **Sin registro:** no se piden ni se guardan datos personales; el avance vive solo en la pantalla.
- **En el teléfono:** mobile-first desde 320 px, botones grandes de cartón y textos de 18 px o más en las estaciones.
- **Datos incluidos:** la misión usa una instantánea de datos reales incluida en la aplicación.
- **Tres idiomas:** español, portugués e inglés.
- **Sugerencia para una clase de 45 minutos:** una misión completa en un nivel y una conversación final sobre los oficios. En la clase siguiente, el mismo curso sube de nivel.
- **Certificados impresos:** uno por estudiante, con su nombre.

---

## 8. Preguntas probables del jurado

- **¿Los datos del módulo STEAM son reales?** Sí. Salen de los mismos archivos que el modo Ciencia: DEM CTX de Jezero y Copernicus GLO-30, ambos a 30 m.
- **¿El certificado acredita algo oficial?** No. Reconoce que la persona completó la ruta y la invita al modo Ciencia; no certifica terreno ni competencias formales.
- **¿Hay que completar la misión para usar el modo Ciencia?** No. El modo Ciencia está siempre abierto; el certificado es el camino guiado para llegar preparado.
- **¿Qué pasa si alguien se equivoca en las predicciones?** Nada malo: ve la explicación con los datos y sigue. El error es parte del aprendizaje.

---

## 9. La frase para cerrar

> *«Ckepi no busca formar astronautas: busca que cada joven descubra que ya sabe mirar como un científico. Si un estudiante de Antofagasta entiende por qué su pampa se parece a Marte —y por qué no—, la ciencia dejó de estar lejos.»*
