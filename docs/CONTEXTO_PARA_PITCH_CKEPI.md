# Ckepi · Contexto para el encargado del pitch

**Documento interno para compartir con el equipo · 14 de noviembre de 2026**

**Referencia:** rama `dani`, base `d194dc3`. Estado observado durante la primera auditoría, aproximadamente a las 15:42 de Chile. El equipo sigue desarrollando; confirmar avances antes de grabar o presentar.

## 1. Lo que necesitas entender primero

**Ckepi es el proyecto del equipo. “Tres mundos para todos” es la dirección del módulo de aprendizaje de Dani, integrado al proyecto.** El nombre definitivo del módulo lo decide el equipo humano.

La idea del equipo consiste en explorar lugares terrestres que permitan comprender o estudiar algunas condiciones de la Luna y Marte, explicando también sus diferencias. La dirección de Dani añade una experiencia accesible para personas con poca experiencia digital: **Mirar → Comparar → Investigar**.

**Frase de trabajo:** “Ckepi acerca los datos de Tierra, Luna y Marte para entender qué podemos comparar y dónde termina la semejanza”.

No presentamos un simulador de conducción de rovers. Tampoco una certificación de sitios seguros. El eje humano es aprender con datos correctos y entender sus límites.

## 2. El problema y la solución que contamos

**Problema:** una fotografía puede sugerir que un desierto se parece a Marte, pero no explica en qué se parece, con qué evidencia ni qué diferencias siguen siendo imposibles de reproducir. Además, una interfaz técnica puede dejar fuera a personas con baja alfabetización digital.

**Solución del equipo:** un motor de exploración de análogos y un recorrido de aprendizaje que comparten información. El usuario empieza por una explicación sencilla y puede profundizar hasta conocer números, fuentes y método.

- **Mirar:** imagen, frase clara y controles sencillos. La lectura en voz alta es una función propuesta, pendiente de comprobación.
- **Comparar:** Tierra, Luna y Marte por dimensión: gravedad, presión, temperatura y terreno, con el alcance de cada dato.
- **Investigar:** fuentes y resultados calculados. La comparación real de terreno Atacama–Jezero es un entregable pendiente de validar.

**La escena de la demo:** una persona abre la experiencia, entiende una diferencia entre los tres mundos y llega a la evidencia que la sostiene. Mostrar únicamente pantallas y funciones disponibles en la versión ensayada.

## 3. Público e impacto

El módulo está pensado para estudiantes, familias, docentes y personas adultas con poca experiencia digital. Bibliotecas, municipios, universidades y organizaciones comunitarias son posibles facilitadores; no hay que presentarlos como clientes o aliados confirmados.

El beneficio que buscamos demostrar es concreto: **que una persona pueda explicar una semejanza y una diferencia planetaria, y localizar su fuente**. Todavía no hay evidencia auditada de aprendizaje, usuarios alcanzados o ahorro económico.

**El encargo del pitch:** hacer comprensible esa promesa, mostrar una prueba real y reconocer lo que falta. La idea y las decisiones de producto son del equipo humano; la asistencia de IA se declara con transparencia.

<!-- pagebreak -->

## 4. Qué existe y qué falta comprobar

**Existe en el código local:** interfaz React con español, inglés y portugués; mapas y globos; catálogo de objetivos; ranking de análogos; comparación de variables; exportaciones y avisos de diferencias físicas. La auditoría comprobó tipado TypeScript, paridad de 381 claves de idioma y dos pruebas unitarias aisladas. Eso no verifica el recorrido completo en navegador.

**Está en desarrollo o pendiente de validar:** el recorrido accesible completo “Tres mundos”, voz, impresión, funcionamiento offline, comparación con DEM reales, revisión móvil, despliegue público y materiales finales de entrega. Hay aportes en ramas de compañeros; no asumir que ya están integrados en `dani`.

**Advertencia para quien prepara gráficos:** el nuevo módulo estadístico genera actualmente terreno sintético. Sus histogramas, distancias e intervalos no deben presentarse como mediciones de Atacama o Jezero. Confirmar con el auditor si esta situación cambia.

## 5. Los datos: cómo nombrarlos sin exagerar

- **Datos planetarios de referencia:** las fichas de NASA sustentan explicaciones generales sobre gravedad, presión y otros parámetros. No son mediciones nuevas realizadas por Ckepi. La masa de una mochila no cambia al viajar; cambia su peso.
- **Comparación de terreno prevista:** NASADEM_HGT v001 para Tierra y el Mars 2020 Science Investigation CTX DEM Mosaic de Jezero, distribuido por USGS, para Marte. Son productos previstos para ese análisis; su uso efectivo debe confirmarse antes del pitch.
- **Método acordado:** recortes comparables, unidades métricas, escala común de 30 m, pendiente y relieve, distancias entre distribuciones, incertidumbre y sensibilidad a la escala. Es el protocolo del equipo, no una regla literal de NASA.
- **Límites:** un terreno terrestre no reproduce por sí solo gravedad, presión, composición atmosférica, radiación o todo el régimen térmico de otro mundo.

No decir “87 % igual a Marte”, “descubrimos un lugar nuevo” o “la IA demostró la causalidad” sin evidencia específica. La versión auditada usa ponderaciones y aproximaciones; no demuestra causalidad ni certifica seguridad.

## 6. Qué debe reconocer el jurado

- **Impact:** una persona concreta puede aprender o tomar una decisión mejor. Mostrar una prueba de uso cuando exista.
- **Creativity:** el valor está en conectar explicación accesible, comparación por dimensión y evidencia. Evitar “somos los primeros” sin demostrarlo.
- **Validity:** fuentes, método, resultados reproducibles, límites y usabilidad. Una gráfica vistosa no reemplaza la validación.
- **Relevance:** responder al desafío de identificar y caracterizar análogos; explicar qué papel cumplen los datos NASA en el resultado.
- **Presentation:** una historia clara y consistente entre discurso, demo y página escrita. Los cinco criterios merecen atención; no inventar ponderaciones adicionales.

La lente local documentada añade acceso a ciencia, competencias STEAM, aplicación territorial y conexión entre instituciones. Las metas ODS citadas por la organización en la documentación del equipo son 4.3, 4.4, 9.5, 17.3, 17.16 y 17.17: explicar una contribución concreta, sin afirmar impactos ya medidos.

<!-- pagebreak -->

## 7. Guion base para ensayar · alrededor de tres minutos

**Uso:** borrador conservador para el estado de desarrollo observado. Cronometrar con el presentador y sustituir la indicación de demo por un recorrido ensayado. No está cronometrado ni aprobado como versión final.

### Apertura · 0:00–0:25

Cuando miramos una fotografía del desierto de Atacama, es fácil pensar: esto parece Marte. Pero ¿se parece el suelo, la gravedad o el aire? Y, sobre todo, ¿cómo puede una persona comprobarlo si nunca ha usado una herramienta científica?

### Problema · 0:25–0:50

Ese es el desafío que abordamos con Ckepi: explorar análogos terrestres de la Luna y Marte y hacer comprensible la evidencia. Porque parecerse en una fotografía no significa compartir todas las condiciones físicas. Necesitamos explicar tanto la semejanza como sus límites.

### Solución y demostración · 0:50–1:40

Nuestro equipo está desarrollando un motor de exploración y una experiencia de aprendizaje llamada, provisionalmente, Tres mundos para todos. Queremos que cualquier persona pueda mirar, comparar e investigar, con explicaciones sencillas y fuentes visibles.

[Mostrar durante 20–25 segundos una función que opere en la versión ensayada. Identificar un dato, su fuente y una diferencia física. Si la función falla, usar una captura propia de esa misma versión y declararlo.]

El recorrido permite empezar por una pregunta cotidiana y avanzar hacia la evidencia. Los valores generales de los planetas vienen de fuentes de referencia; los resultados del terreno requieren un procesamiento diferente, que debe quedar identificado.

### Ciencia y límites · 1:40–2:10

Estamos trabajando en una comparación de terreno de Atacama y Jezero mediante modelos de elevación. Solo la presentaremos como resultado científico cuando esté validada. Y hay un límite que mostramos desde el principio: ningún desierto terrestre reproduce toda la gravedad, la atmósfera y la radiación de Marte.

### Sostenibilidad · 2:10–2:40

La propuesta es mantener el aprendizaje gratuito y abierto. Para sostenerlo, queremos validar servicios para instituciones: talleres, formación de personas guías y materiales impresos. Es una hipótesis de negocio; todavía no afirmamos ventas ni acuerdos. Su utilidad debe probarse con personas y organizaciones reales.

### Cierre · 2:40–3:00

Desde Antofagasta queremos acercar la ciencia planetaria a más personas. Buscamos espacios para probar la experiencia y mejorarla con sus usuarios. Con Ckepi, una semejanza despierta la curiosidad; la evidencia nos enseña hasta dónde llega.

**Si la comparación real queda validada:** sustituir “estamos trabajando” por una frase que nombre el sector, el dataset, la métrica y el resultado exacto autorizado por el auditor. No rellenar esa frase con cifras provisionales o sintéticas.

## 8. Modelo de sostenibilidad para el pitch local

Quien aprende accede gratis. La hipótesis es que instituciones financien talleres, formación de personas guías, kits impresos o la caracterización transparente de un sitio de su territorio. Antes de hablar de ingresos necesitamos validar quién compra, qué servicio necesita y cuánto cuesta prestarlo. Evitar precios, convenios, subvenciones o ahorros no comprobados.

<!-- pagebreak -->

## 9. Preguntas probables y respuestas breves

**¿Qué están mostrando hoy?** Un prototipo en desarrollo. Antes de exponer se confirma qué funciones están integradas y ensayadas; lo pendiente se presenta como siguiente paso.

**¿Qué tiene que ver con el desafío?** El núcleo explora y caracteriza semejanzas terrestres con Luna y Marte. El módulo de aprendizaje ayuda a entender cada dimensión y su evidencia, en vez de ser una colección genérica de curiosidades.

**¿Qué aporta Atacama si ya es un análogo conocido?** Sirve como referencia y control. Cualquier afirmación de un candidato poco estudiado necesita revisión bibliográfica y caracterización propia. Estar lejos de un sitio conocido no demuestra novedad.

**¿Cómo calculan el parecido?** El motor actual usa variables y ponderaciones. El análisis de terreno acordado comparará distribuciones a escala común; su validación está pendiente. No hay un porcentaje universal de “ser Marte”.

**¿Qué dato NASA utilizan?** Nombrar el producto realmente utilizado en la función mostrada y explicar qué aporta. Para el análisis de terreno previsto: NASADEM_HGT v001 y el DEM CTX de Jezero distribuido por USGS. Confirmar con el responsable de datos antes de decir “usamos”.

**¿La herramienta demuestra dónde una misión estará segura?** No. Ayuda a explorar semejanzas y límites. La seguridad de una operación requiere análisis y validación especializados.

**¿Por qué diseñar para baja alfabetización digital?** Para reducir barreras de acceso: una idea por pantalla, palabras claras, controles grandes y profundidad progresiva. Hay que comprobar su utilidad mediante pruebas de uso.

**¿Usaron IA?** Sí, como asistencia de desarrollo y documentación, conforme a la declaración del equipo. La idea es humana. Cada uso, medio y resultado debe declararse con precisión; no afirmar revisión completa de lo que sigue en desarrollo.

## 10. Entregables y comprobación antes de presentar

- **Pitch local:** preparar tres minutos y preguntas; duración, horario y reglas finales deben confirmarse con la organización de Antofagasta. La rúbrica Nómada es una referencia narrativa, no una ponderación NASA confirmada.
- **Entrega global:** según la copia de las guías guardada por el equipo, página en inglés y demo de hasta 30 segundos o hasta siete diapositivas. Si se habla español en el video, incluir subtítulos en inglés. Revisar la guía final antes de entregar.
- **Coherencia:** mismo nombre, misma promesa, mismo estado del producto y mismas fuentes en página, video, slides y discurso.
- **Material:** capturas propias de la versión ensayada, referencias visibles, declaración de IA y marcas de agua donde correspondan. Política del equipo: sin logos NASA; logos de terceros solo con permiso confirmado. No incluir menores identificables.
- **Demostración:** probar enlaces sin sesión y el recorrido en el dispositivo real. Una grabación de respaldo se identifica como grabación.
- **Plazo del equipo:** meta interna de envío el domingo 15 antes de las 20:00 de Chile. El cierre registrado es a las 23:59; confirmar el horario de evaluación local por separado.

## 11. Qué pedir ahora al equipo técnico

1. Una versión concreta que se pueda ensayar y su recorrido de 20–25 segundos.
2. Lista de funciones comprobadas y lista de funciones pendientes.
3. Un resultado real autorizado, su fuente y sus límites; si no existe, mantener la formulación de trabajo en curso.
4. Enlace final, capturas, nombre del equipo y confirmación de integrantes.
5. Confirmación del formato local y revisión de cada afirmación antes de grabar.

## 12. Fuentes y contexto para ampliar

- Desafío oficial: https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/
- Guía de evaluación: https://www.spaceappschallenge.org/resources/judging-awards-guide/
- Guía de entrega: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Referencias planetarias: https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- Repositorio del equipo: https://github.com/AnGeMoNs/Ckepi

Fuentes internas de este briefing: CONTEXTO_DANI.md, docs/SDD.md, docs/PLAN_GLOBAL_Y_ARQUITECTURA.md, PIZARRA.md y la copia de la rúbrica en /home/dani/proyectos/hackanasa/00_desafio/03_rubrica_oficial_global_2026.md, junto con la primera auditoría del código. Las guías oficiales completas devolvieron errores al reabrirlas durante la auditoría; este documento conserva esa limitación y no sustituye su confirmación por el equipo.
