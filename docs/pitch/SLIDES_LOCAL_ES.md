# CKEPI · 7 láminas · Jurado local Antofagasta (español)

> Estilo TAKYA (pitch ganador de Nómada 2026): **título-afirmación**, **un número grande por lámina**, **fuente al pie**, cero preguntas de apertura.
> Toda cifra sale de `docs/RESULTADOS_TERRENO_REALES.md` o de `REFERENCES.md`. Base: `docs/pitch/SOLUCION_CKEPI.md`.

---

## 01 · Portada

**CKEPI**
**De la imagen a la evidencia.**
Análogos terrestres para el terreno de Marte, con la brecha física de la Luna, medidos con datos abiertos de NASA y ESA.

*Equipo Lattices · Antofagasta, Chile · NASA Space Apps 2026 · Desafío «Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars»*

- **Visual:** logo CKEPI vectorial sobre el fondo de cartón con la Tierra, la Luna y Marte (con su sello visible «AI-Generated»).
- **Fuente:** spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars

---

## 02 · El problema

**Dos desiertos iguales en la foto. Distintos en el terreno.**

> Gran cifra: **6×**
> El análogo clásico, Yungay, está **6 veces más lejos** de Jezero en pendiente que una zona poco estudiada de Antofagasta.

- **Visual:** dos cortes de terreno de 6 km lado a lado: la pampa (celda 83b224) y Jezero. Mismos colores de cartón.
- **Fuentes:** W₁ Yungay 3,32° ÷ W₁ celda 83b224 0,54° = 6,1. NASA MRO CTX DEM, Jezero (Calef et al., USGS, 2021) · ESA Copernicus DEM GLO-30.

---

## 03 · La propuesta de valor

**CKEPI te muestra en una sola tarjeta dónde ensayar, cuánto se parece y qué no.**
**La decisión final, siempre del científico.**

- **Visual:** la tarjeta, con tres filas grandes:
  - Se parece · pendiente 0,54°
  - Clásico · 3,32°
  - No se parece · 0,38 g
- **Fuente:** enunciado oficial NASA Space Apps 2026: «terrestrial analog sites are not entirely well characterized».

---

## 04 · Demo: Elige · Ubica · Compara · Explica

| Verbo | Lo que se ve (una captura cada uno) |
|---|---|
| **Elige** | El destino: Jezero (Marte). Luna: solo brecha física |
| **Ubica** | Mapa con las 4 celdas de Antofagasta medidas a 30 m y el control Yungay |
| **Compara** | La tarjeta: qué se parece, cuánto y qué no, con fuente y unidad |
| **Explica** | El modo Aprender: la misma evidencia para un estudiante |

- **Fuentes:** NASA MRO CTX DEM, Jezero · ESA Copernicus DEM GLO-30 · comparación a 30 m (commit `1535fb7`).

---

## 05 · El hallazgo

**Una zona poco estudiada de Antofagasta se parece a Jezero en pendiente a 30 m más que el clásico.**

> Gran cifra: **0,54°**
> Distancia de pendientes a 30 m (W₁), IC 95 % 0,40–0,65°. Estable a 60 y 90 m.
> Yungay: 3,32°. Celda 83b221 (caso negativo): 6,92°.

- **Visual:** mapa de Antofagasta con la celda `83b224` resaltada en cobre y Yungay en gris.
- **Límite que se dice:** una ventana de 6 × 6 km; DSM en la Tierra frente a DEM fotogramétrico en Marte.
- **Fuentes:** NASA MRO CTX DEM, Jezero (20 m → 30 m) · ESA Copernicus DEM GLO-30 (UTM 19S, 30 m) · Wasserstein-1, Kolmogorov–Smirnov y bootstrap espacial por bloques 2D · `docs/RESULTADOS_TERRENO_REALES.md`.

---

## 06 · Lo que no se parece

**Atacama no es Marte. Por eso medimos también lo que falla.**

> Tres cifras en fila:
> **0,38 g** gravedad · **~0,6 kPa** de CO₂ · **~230 mSv/año** de radiación

Se prueban aparte, en cámaras de vacío, aceleradores o vuelos parabólicos. Luna: 0,166 g · vacío · ~380 mSv/año en mínimo solar (simulado).

- **Visual:** la mochila de 10 kg que se siente como 3,8 kg en Marte y 1,7 kg en la Luna (taller de cartón).
- **Fuentes:** NASA NSSDCA Planetary Fact Sheets (Williams, 2024) · Hassler et al. 2014, *Science* (MSL RAD) · Reitz et al. 2012, *Planetary and Space Science*.

---

## 07 · Investigar y aprender con la misma evidencia

**La misma evidencia sirve al científico y enseña a un estudiante de Antofagasta.**

- **Modo Ciencia:** preselección explicable y descargable.
- **Modo Aprender:** Mirar, Comparar e Investigar, con voz, tres niveles de lectura y cero datos personales.
- **Siguiente paso:** probarlo con un colegio o una biblioteca de Antofagasta, y comparar el Polo Sur lunar con NASA LRO LOLA usando el mismo método.

**CKEPI: de la imagen a la evidencia.**

- **Visual:** QR al demo público y captura del taller de los tres mundos.
- **Fuentes:** código abierto Apache-2.0 · declaración de IA en `AI_DISCLOSURE.md` · ilustraciones generadas con IA y rotuladas en pantalla.

---

## Qué decir en cada lámina (guía para el equipo)

| # | Lámina | Frase exacta |
|---|---|---|
| 01 | Portada | «Somos CKEPI. Medimos qué lugares de la Tierra se parecen a la Luna y a Marte, y cuánto.» |
| 02 | Problema | Pausa. «En la foto son iguales. En el terreno, el clásico está seis veces más lejos.» |
| 03 | Valor | «En una sola tarjeta: dónde, cuánto y qué no.» Pausa. «La decisión, siempre del científico.» |
| 04 | Demo | Unos 8 s por verbo, con un mismo caso de principio a fin: Jezero → celda 83b224. |
| 05 | Hallazgo | Lento: «Cero coma cincuenta y cuatro grados. Más cerca que Yungay.» |
| 06 | No se parece | «Atacama no es Marte. Decimos qué falla y dónde se prueba.» |
| 07 | Cierre | «Una misma evidencia: para investigar y para aprender. De la imagen a la evidencia.» |

## Antes de exponer

- **Cálculo del 6×:** es 3,32 ÷ 0,54 = 6,1. Decir «unas seis veces», no «exactamente seis».
- **Demo:** probarla en el teléfono y en el proyector de la sede, a las 12:00, sin red. El modo Aprender funciona sin backend.
- **Material visual:** ningún logo de NASA, de La Araucana ni de universidades sin permiso.
