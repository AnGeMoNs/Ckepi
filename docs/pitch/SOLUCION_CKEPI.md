# CKEPI · La solución en una página

> Ancla del proyecto. Software, slides, pitch y página de Space Apps se derivan de aquí. Si algo no cabe en esta página, no va en la demo.
> Cifras: `docs/RESULTADOS_TERRENO_REALES.md` y snapshot `frontend/public/data/local/`. Desafío verificado el 14-nov-2026 en la web oficial.

## 1. El desafío (texto oficial, resumido)

**«Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars»** (NASA Space Apps 2026).

- Usar datos abiertos de NASA y otras agencias para **identificar y caracterizar nuevos análogos terrestres**.
- **No redescubrir** los conocidos: Atacama, Haughton y Death Valley ya están estudiados.
- **Escala:** una zona pequeña dentro de una región grande puede ser un análogo más fuerte.
- **Decir qué se parece, cuánto se parece y qué no.** La Tierra no reproduce la gravedad, el vacío lunar, la atmósfera de Marte ni la radiación.
- **Formato:** presentar los hallazgos como mapa, visualización u otra herramienta.

## 2. El problema, en una frase

**Elegir dónde ensayar en la Tierra todavía se decide por parecido visual, y ninguna herramienta abierta dice en minutos dónde, cuánto se parece y qué no.**

## 3. Usuario y momento de uso

| | |
|---|---|
| **Usuario principal** | Científico o ingeniero que prepara un ensayo de campo para la Luna o Marte |
| **Su pregunta** | «¿Dónde pruebo, para qué sirve y qué me falta?» |
| **Su límite** | El tiempo. Hoy: bajar DEM, reproyectar, remuestrear y calcular a mano |
| **Usuario secundario** | Estudiante o docente: la misma evidencia, explicada para aprender |

## 4. La solución

**CKEPI convierte datos abiertos de NASA y ESA en una preselección de análogos terrestres que se lee en una sola tarjeta: dónde, cuánto se parece y qué no.**

Cuatro pasos, una sola pantalla por paso:

1. **Destino:** el científico elige Jezero (Marte). Para el Polo Sur (Luna), hoy solo se muestra la brecha física.
2. **Mapa:** solo las zonas que importan. **Hoy:** las 4 celdas de Antofagasta medidas a 30 m y el control Yungay. **Por integrar:** la malla global H3 de 10.660 celdas de la rama `kevin`, filtrada a las mejores.
3. **Una sola tarjeta:** tres parámetros visuales, cada uno con su número, su unidad y su fuente. *(Por construir en el modo Ciencia.)*
   - **Se parece en:** pendiente a 30 m, W₁ = 0,54° (IC 95 % 0,40–0,65).
   - **Cuánto, frente al clásico:** Yungay, W₁ = 3,32°.
   - **No se parece en:** 0,38 g · ~0,6 kPa de CO₂ · ~230 mSv/año.
4. **Descargar:** CSV o GeoJSON con W₁, IC y fuente por celda. *(Por construir: la exportación actual, en `exportResults.ts`, requiere backend y no trae W₁ ni fuentes.)*

**Y para aprender:** la misma evidencia en el modo Aprender (taller de los tres mundos y misión del análogo), para colegios y bibliotecas de Antofagasta.

## 5. El hallazgo (lo que hoy está medido)

- **Candidato:** celda `83b224fffffffff`, una zona poco estudiada de la pampa de Antofagasta (23,05° S, 69,50° O).
- **Se parece a Jezero en pendiente a 30 m:** W₁ = 0,54°, IC 95 % 0,40–0,65°, estable a 60 y 90 m.
- **Más que el clásico Yungay:** W₁ = 3,32°.
- **Caso negativo:** la celda `83b221fffffffff` es mucho más abrupta (W₁ = 6,92°).
- **Límites:**
  - Es una ventana de 6 × 6 km y solo compara pendiente y relieve.
  - Es una **preselección para ir a terreno**, no una certificación.

## 6. Datos con precisión (lo mínimo que exige Space Apps)

| Rol | Dataset exacto | Fuente |
|---|---|---|
| Núcleo · Marte | **Mars 2020 Science Investigation CTX DEM Mosaic, Jezero Crater** (NASA MRO CTX, 20 m/px; Calef et al., USGS Astrogeology, 2021) | `M20_JezeroCrater_CTXDEM_20m.tif` |
| Núcleo · Tierra | **Copernicus DEM GLO-30** (ESA, DSM 1″). Aviso: «produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved». The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30. | AWS Open Data |
| Malla global | **NASA POWER Climatology API** (anual) + **Copernicus DEM 90 m vía Open-Meteo Elevation API** (respaldo: **NASA/METI ASTER GDEM 30 m** vía OpenTopoData) (rama `kevin`, por integrar) | 10.660 celdas H3 resolución 3 |
| Brecha física | **NASA NSSDCA Planetary Fact Sheets** (Williams, 2024); **MSL RAD** (Hassler et al., 2014, *Science*); Reitz et al., 2012 (Luna, simulado) | `REFERENCES.md` |

Lista completa de datos (Open-Meteo, Macrostrat, SoilGrids y otros): `REFERENCES.md`.

## 7. Qué hace el software y qué no (alineación)

**Va en la demo:**
- **Modo Ciencia:** mapa → tarjeta única → descarga (la descarga, por construir).
- **Modo Aprender:** taller y misión.

**No va en la demo:**
- globos 3D;
- paneles con 19 variables;
- rankings largos;
- textos de rúbrica, La Araucana u ODS dentro del software.

**Regla de la tarjeta única:** cada pantalla responde una sola pregunta, con un número grande, su unidad y su fuente. La meta es que se entienda de un vistazo.

## 8. Tareas de software para que la demo diga la verdad (en orden)

1. **Modo Ciencia estático:** mapa con las celdas medidas y una tarjeta única. Sin globos y sin backend.
2. **Descarga** CSV y GeoJSON con W₁, IC 95 %, KS y fuente por celda, generada desde el snapshot.
3. **Malla de Kevin:** exportar a JSON estático solo las celdas prioritarias para Jezero.

## 9. Lo que todavía no tenemos (decirlo antes de que lo pregunten)

- **Luna:** solo comparamos la brecha física. El terreno del Polo Sur con **LRO LOLA** es el siguiente paso, con el mismo método.
- **Terreno:** falta validación en campo.
- **Usuarios:** falta una prueba con usuarios. El siguiente paso es un colegio o una biblioteca de Antofagasta.

## 10. Rúbrica (para la página de Space Apps y el pitch; no va en el software)

| Criterio oficial (1–5) | Nuestra evidencia |
|---|---|
| **Impacto** | Junta en una tarjeta lo que hoy exige un flujo SIG manual. La misma evidencia sirve para enseñar en Antofagasta. |
| **Creatividad** | Distribuciones completas a 30 m, no promedios ni fotos. Decimos qué falla, no solo qué se parece. Un modo para investigar y otro para aprender. |
| **Validez** | DEM reales con W₁, KS, bootstrap 2D e IC 95 %. Sensibilidad a 30, 60 y 90 m. Tests reproducibles. Brecha física con fuentes. |
| **Relevancia** | Responde literal al desafío: un análogo nuevo dentro de una región conocida, con dataset NASA (CTX) como núcleo. |
| **Presentación** | Una historia: de la imagen a la evidencia. 7 slides, un hallazgo, un número por lámina. |
