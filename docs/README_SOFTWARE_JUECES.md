# Ckepi · Cómo funciona el software (guía para el jurado)

> Ckepi busca **en qué lugares de la Tierra conviene ensayar** antes de ir a la Luna o a Marte, cuánto se parecen al destino y, sobre todo, **qué no se parece**. Es una **preselección para estudiar en terreno**, nunca una certificación: ningún lugar de la Tierra es igual a otro mundo.

Esta guía recorre el modo **Científico** pantalla por pantalla —Inicio, Explorar, Resultados, Analizar y Fuentes— con la ciencia que hay detrás de cada número, para responder preguntas del jurado. Las cifras de terreno salen de [`RESULTADOS_TERRENO_REALES.md`](RESULTADOS_TERRENO_REALES.md); las fórmulas, de [`API_DATA_AND_MATCHING.md`](API_DATA_AND_MATCHING.md) y [`SDD.md`](SDD.md); la procedencia de cada variable, de [`DATA_PROVENANCE.md`](DATA_PROVENANCE.md).

---

## 0. La idea en una frase y el modelo en tres letras

**Elige adónde vas y qué quieres probar; Ckepi te muestra dónde ensayarlo en la Tierra, cuánto se parece y qué no se parece.**

Cada lugar se describe con 19 variables separadas en tres capas (descomposición causal **X → Y ∥ B**):

| Capa | Qué es | Variables |
|---|---|---|
| **X · Sustrato** (10) | Lo que el lugar *es*: forma y superficie | rugosidad, pendiente, inercia térmica, albedo, flujo solar, hielo subsuperficial, aridez, humedad relativa, índice UV, cobertura vegetal |
| **Y · Respuesta ambiental** (6) | Lo que el lugar *hace* como consecuencia de X | amplitud térmica diurna (ΔT), enfriamiento nocturno, temperatura media, viento, flujo de polvo, sublimación de hielo |
| **B · Brecha física irreducible** (3) | Lo que la Tierra **no puede imitar** al aire libre | gravedad, presión atmosférica, radiación |

**Por qué separar X e Y:** dos desiertos pueden tener el mismo frío nocturno por razones distintas. Ckepi compara primero el sustrato (X) y luego la respuesta (Y) por separado, y explica Y a partir de X con un modelo estadístico (Ridge o Random Forest) para saber *qué causa qué*.

---

## 1. Inicio

- Pantalla de entrada del modo Científico: el título en letras de cartón y tres destinos (**Tierra · Atacama**, **Luna · Polo Sur**, **Marte · Jezero**).
- Debajo, cuatro portales a las secciones: **Explorar, Resultados, Analizar, Fuentes**.
- Arriba, el interruptor **STEAM / Científico** (mismo motor, dos formas de leerlo) y el selector de idioma (es / pt / en) y tema (claro / oscuro).

---

## 2. Explorar (fase completa)

Es donde se **configura la misión**. Todo lo que se elige aquí recalcula la búsqueda sobre la malla global.

### 2.1 ¿Adónde vamos? — destino

1. **Mundo:** Luna o Marte (dos planetas de cartón; el elegido queda marcado con un anillo).
2. **Lugar:** cada mundo tiene sitios curados:
   - Luna: **Polo Sur – Cráter Shackleton**, **Mare Tranquillitatis – claraboya de tubo de lava**.
   - Marte: **Cráter Jezero (delta lacustre)**, **Cráter Gale (Aeolis Mons)**, **Arcadia Planitia (hielo somero)**.
3. Al elegir un lugar aparece una línea con su contexto de misión (por ejemplo, Jezero: antiguo delta fluvial con carbonatos y arcillas).

Los valores del destino (sus 19 variables) pasan a ser el **objetivo** que se busca en la Tierra.

**Si preguntan de dónde salen los datos del destino:** Marte usa mediciones de superficie (Curiosity REMS y Perseverance MEDA) para temperatura, ΔT y polvo; la Luna usa modelos físicos (equilibrio radiativo, ciclo diurno lunar) porque no hay estaciones meteorológicas. Cada valor indica si es **medido, derivado, modelo o constante de referencia** (ver §6).

### 2.2 ¿Qué quieres probar? — tipo de ensayo

Siete tipos de ensayo; cada uno cambia **qué variables pesan más** en la búsqueda:

| Ensayo | Para qué sirve | Qué prioriza |
|---|---|---|
| **Automático** | Ckepi decide qué pesa más | Pesos derivados de la descomposición X → Y del destino |
| **Aterrizaje** | Navegación y aterrizaje | Relieve, rugosidad |
| **Rover** | Movilidad de rovers | Pendientes y suelo |
| **Hielo** | ISRU: perforar y extraer agua | Hielo subsuperficial, frío |
| **Hábitat** | Cuevas, tubos de lava, refugios | Sustrato y protección |
| **Energía solar** | Paneles, UV y estrés térmico | Flujo solar, UV, ΔT |
| **Manual** | El científico ajusta cada variable | Lo que el usuario decida |

En todos los ensayos las variables se muestran igual: una tarjeta por variable con su **valor objetivo** en el destino, su **origen del dato** y su **peso**. Las 10 de X y las 6 de Y están en un carrusel de dos caras (Independientes ↔ Dependientes).

- **Ensayos predefinidos:** pesos de solo lectura, ordenados de mayor a menor influencia. El botón **Ajustar en modo manual** copia esos pesos al modo Manual.
- **Modo Manual:** cada variable tiene dos controles:
  - **Peso / importancia** (0 % = ignorar la variable).
  - **Similitud mínima** (0 % = sin filtro; por ejemplo, 70 % descarta celdas que no se parezcan al menos 70 % en esa variable).
  - Botones: **Pesos iguales (100 %)**, **Limpiar todo (0 %)**, **Aplicar comparación manual**.

### 2.3 Modo Descubrimiento

Interruptor que **oculta los análogos clásicos** (Atacama-Yungay, Haughton, Islandia…) para encontrar **lugares poco estudiados**. Es el corazón de la propuesta: no repetir los análogos de siempre sino descubrir candidatos nuevos y medirlos contra el clásico.

### 2.4 Ajustes científicos avanzados

| Ajuste | Qué hace |
|---|---|
| **Modelo de descomposición** | Ridge (lineal regularizado) o Random Forest para explicar Y a partir de X. En los ensayos predefinidos el ranking usa los pesos del perfil y el modelo solo actualiza el gráfico causal. |
| **Métrica de distancia** | Euclídea ponderada (diagonal) o Mahalanobis (tiene en cuenta la correlación entre variables). |
| **Penalizar objetivos estimados** | Baja el puntaje cuando el destino tiene muchas variables modeladas en vez de medidas (ajuste por confianza). |
| **Mín. similitud de sustrato (S_ind)** | Oculta celdas que no alcanzan esa similitud en X. |
| **Mín. similitud de respuesta (S_dep)** | Oculta celdas que no alcanzan esa similitud en Y. |

### 2.5 Los dos mapas

- **Luna y Marte en 3D (izquierda):** globo del destino con capas de color natural o altimetría (Luna: LRO WAC / LOLA; Marte: Viking MDIM21 / MOLA). Se gira, se acerca con los pines hexagonales y **un toque en cualquier punto lo convierte en un nuevo destino** («punto sondeado»). Leyenda: zona rastreada (alta confianza) frente a punto sondeado (estimado).
- **Lugares parecidos en la Tierra (derecha):** la Tierra dividida en **hexágonos H3**. El color indica la similitud con el destino:
  - verde: alta (≥ 75 %);
  - ámbar: media (55–74 %);
  - pálido: parcial (< 55 %).

  Se evalúan **10.686 celdas** terrestres. En **Opciones** se cambia la capa satelital (NASA GIBS, Sentinel-2…), la métrica coloreada (combinado, S_ind, S_dep, R_break), la densidad, el globo 2D/3D y el relieve 3D.

**Tocar un hexágono** abre su ficha al centro de la pantalla:

- Similitud global y desglose S_ind / S_dep.
- Perfil físico medido: temperatura y ΔT, aridez y pendiente, radiación y R_break, rugosidad e inercia, albedo y flujo solar, humedad y UV, viento y polvo.
- Geología (Macrostrat) y simulante de regolito sugerido.
- Enlaces a catálogos de NASA y ESA para esa celda.
- **Subdividir en 7 sub-hexágonos:** refina la zona hasta resolución H3 5 (~8,5 km).

### 2.6 Acciones

- **Actualizar análisis:** vuelve a consultar las fuentes en vivo (NASA POWER, Open-Meteo ERA5, DEM) y recalcula; los datos externos se guardan en caché.
- **Compartir enlace:** copia una URL que reproduce exactamente la misma configuración (destino, ensayo, pestaña), útil para que el jurado o un colega vea lo mismo.
- **Resultados** y **Analizar:** pasan a las siguientes fases.

---

## 3. Resultados

Muestra **dónde ensayar**, ordenado.

### 3.1 Descubrimiento sistemático frente a sitios clásicos

- **Mejor candidato no reconocido:** la celda poco estudiada con mayor similitud, su porcentaje, si está en la **frontera de Pareto** y tres medidores: **S_ind, S_dep, R_break**.
- **Control clásico:** el análogo famoso más parecido, con los mismos medidores. Una nota dice si el candidato nuevo **iguala o queda a menos de 3 puntos** del clásico, es decir, si aporta terreno inédito comparable.
- **Otros candidatos poco estudiados destacados.**

### 3.2 Comparativa lado a lado

- Tabla con los mejores candidatos: ubicación, categoría (nuevo descubrimiento, benchmark, óptimo de Pareto), % de similitud, S_ind, S_dep, R_break y **prueba principal validada** (qué ensayo de ingeniería sí tiene sentido ahí).
- Filtros: Todos / Descubrimientos / Benchmarks / Óptimos de Pareto, búsqueda por región y tamaño del top.
- **Exportar:** CSV, GeoJSON (para SIG) e informe Markdown.

### Cómo leer los números (preguntas típicas)

- **S_ind (sustrato)** y **S_dep (respuesta):** similitudes entre 0 y 1 que decaen exponencialmente con la distancia ponderada y normalizada entre destino y celda:

  `S = exp(−√( Σ wᵢ · ((pᵢ − eᵢ)/σᵢ)² ))`

  donde *p* es el valor del destino, *e* el de la Tierra, *σ* la escala de cada variable y *w* su peso.
- **Similitud combinada:** `0,60 · S_ind + 0,40 · S_dep`. El sustrato pesa más porque es lo que se pisa y se mide.
- **Ajuste por confianza:** `combinado × (0,75 + 0,25 · confianza del destino)`, con una incertidumbre de `(1 − confianza) × 0,22` que se muestra como intervalo.
- **R_break (brecha física):** compara gravedad, presión (escala logarítmica) y radiación del destino con la Tierra (1 g, 1013 mbar, 2,4 mSv/año). **Si supera 0,60 se marca como ruptura**, y el sistema separa:
  - pruebas **válidas en campo** (movilidad, sensores ópticos, perforación…);
  - pruebas **inválidas al aire libre** (paracaídas en CO₂, enfriamiento convectivo en vacío, radiación cósmica), que requieren cámaras de vacío o laboratorio.
- **Frontera de Pareto:** candidatos que ningún otro supera a la vez en todas las dimensiones; son las opciones «no dominadas».
- **Resolución:** H3 resolución 3 equivale a una escala efectiva de **~59,8 km**; al subdividir se llega a ~8,5 km (resolución 5).

---

## 4. Analizar

Muestra **por qué** un lugar se parece y **qué no se parece**.

### 4.1 Comparación real de terreno a 30 m (Jezero ↔ Antofagasta)

La prueba científica central. Se comparan **distribuciones completas de pendiente y relieve** en ventanas de 6 × 6 km, con ambos DEM llevados a la **misma escala de 30 m**:

- **Marte:** USGS Mars 2020 TRN **CTX DEM** de Jezero (NASA MRO CTX, 20 m → 30 m).
- **Tierra:** **Copernicus GLO-30** (ESA), reproyectado a UTM 19S.

| Ventana terrestre | Pendiente mediana | W₁ vs. Jezero (IC 95 %) | D_KS | Lectura |
|---|---|---|---|---|
| Celda `83b224` (Pampa Central) | 1,37° | **0,54°** (0,40–0,65) | 0,15 | ✅ Lo que sí se parece: el mejor ajuste, estable a 30, 60 y 90 m |
| Yungay (control clásico) | 2,56° | 3,32° | 0,31 | ⚠️ El clásico se aleja por su cola de laderas fuertes |
| Celda `83b225` (Cordillera de la Sal) | 0,19° | 1,71° (1,65–1,86) | 0,82 | ❌ Demasiado plana |
| Celda `83b221` (Salar de Pajonales) | 7,89° | 6,92° (6,17–7,31) | 0,74 | ❌ Lo que no se parece: mucho más abrupta |

Jezero tiene una pendiente mediana de **1,70°** (percentil 90: 4,01°).

- **W₁ (Wasserstein-1):** cuántos grados habría que «mover» para que la distribución de pendientes de un lugar quede igual a la del otro. Menos grados significa más parecido.
- **D_KS (Kolmogorov-Smirnov):** máxima diferencia entre las dos distribuciones acumuladas (0 = iguales).
- **IC 95 %:** sale de un **bootstrap espacial por bloques 2D**, que respeta que los píxeles vecinos no son independientes.
- **Sensibilidad de escala:** W₁ a 60 m = 0,40° y a 90 m = 0,27° para `83b224`; el resultado no depende de la resolución elegida.

**Frase para el jurado:** *«una celda poco estudiada de Antofagasta se parece a Jezero en pendiente a 30 m más que el análogo clásico, Yungay; es un candidato para estudiar en terreno, no un sitio certificado».*

**Límites, que conviene decir siempre:**

- Una ventana de 6 km no representa toda la celda (~12.000 km²).
- Solo se comparan pendiente y relieve.
- La Tierra es un DSM y Marte un DEM fotogramétrico.
- Gravedad (0,38 g), presión (~0,6 kPa de CO₂), radiación (~230 mSv/año) y temperatura no se reproducen.

### 4.2 Confianza de los datos

Un aviso indica qué variables del destino son medidas y cuáles estimadas, y cuánto afecta eso al puntaje.

### 4.3 Modelo causal X → Y

Cuánto explica el sustrato (X) cada respuesta (Y): R² por variable y componentes principales. Responde «¿este frío nocturno se debe al suelo o a otra cosa?».

### 4.4 Diagnóstico de misión

- Comparación **variable por variable** (destino frente a celda) con su similitud.
- **Alertas de ruptura** (gravedad, presión, radiación).
- Las **pruebas válidas e inválidas** en esa celda.
- Exportación del diagnóstico.

### 4.5 Lo que no se parece (brecha B)

| | Marte | Luna | Tierra |
|---|---|---|---|
| Gravedad | 0,38 g | 0,166 g | 1 g |
| Presión | ~0,6 kPa de CO₂ (promedio) | vacío (~0 kPa) | ~101 kPa |
| Radiación en superficie | ~230 mSv/año, medida por Curiosity/RAD (Hassler et al. 2014) | ~380 mSv/año en mínimo solar (~110 en máximo), simulada (Reitz et al. 2012) | ~2,4 mSv/año |
| Oscilación térmica | ΔT medido por MEDA en Jezero | ΔT modelado | ΔT de ERA5 en la celda |

Por eso Ckepi dice siempre «**preseleccionar para ensayar**», nunca «idéntico a Marte».

---

## 5. Fuentes

Toda la procedencia vive aquí, no repartida en letra chica por el software:

- Datos, sensores y misiones.
- Metodología.
- Referencias bibliográficas.
- Avisos legales, incluido el de Copernicus WorldDEM-30.

Solo datos abiertos (NASA, ESA, CSA, JAXA, Open-Meteo, Macrostrat).

---

## 6. Origen de cada dato (para preguntas de validez)

| Origen | Significado | Ejemplos |
|---|---|---|
| **Medido** | Instrumento real | Temperatura y ΔT de Marte (REMS/MEDA), ΔT y temperatura terrestres (ERA5-Land), DEM CTX y Copernicus |
| **Derivado** | Calculado a partir de mediciones | Flujo solar marciano por geometría orbital, enfriamiento nocturno |
| **Modelo** | Física aplicada donde no hay estaciones | Temperaturas lunares (Stefan-Boltzmann, ciclo de 354 h) |
| **Constante de referencia** | Literatura publicada | Rugosidad, inercia térmica, albedo e hielo en sitios curados (LOLA, THEMIS, SHARAD, Diviner, LEND) |

En la Tierra:

- **NASA POWER:** flujo solar, albedo, humedad, UV y viento.
- **Open-Meteo ERA5-Land:** temperaturas y ΔT.
- **DEM Copernicus:** pendiente y rugosidad.

Inercia térmica, hielo subsuperficial y cobertura vegetal son **proxies derivados**, y así se declara.

---

## 7. Arquitectura en una línea

- **Backend:** FastAPI + DuckDB/GeoParquet + H3 + scikit-learn/SciPy.
- **Frontend:** React + TypeScript + MapLibre + three.js, en tres idiomas (es/pt/en), mobile-first desde 320 px, con tema claro y oscuro y lectura por voz.
- Funciona también **sin backend**, con una instantánea estática de datos reales para la demo.
