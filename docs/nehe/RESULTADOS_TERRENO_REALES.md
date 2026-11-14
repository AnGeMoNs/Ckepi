# Resultados de terreno reales · Jezero vs. Antofagasta (fuente única de verdad)

> Medidos el 14-nov-2026 con DEM reales a 30 m (commit `1535fb7`). Cualquier cifra de terreno en slides, pitch, UI, skills o agentes debe salir de esta tabla. Método y fuentes: `docs/DATA_PROVENANCE.md` §3. Reproducir: `cd backend && .venv/bin/python -m pytest tests/test_terrain_real_dem.py`.

**Datos:** Marte = USGS Mars 2020 TRN **CTX DEM** de Jezero (NASA MRO CTX, 20 m → 30 m). Tierra = **ESA Copernicus GLO-30** reproyectado a UTM 19S. Ventanas de 6 × 6 km (200 × 200 px). Jezero: pendiente mediana **1,70°**, percentil 90 **4,01°**, relieve mediano 9,0 m.

| Ventana terrestre | Pendiente mediana (p90) | W₁ pendiente vs. Jezero (IC 95 %) | D_KS | W₁ relieve | Lectura |
|---|---|---|---|---|---|
| `83b224fffffffff` · celda rotulada «Pampa Central» (23,05° S, 69,50° W) | 1,37° (2,85°) | **0,54°** (0,40–0,65) · 60 m: 0,40° · 90 m: 0,27° | 0,15 | 1,8 m | ✅ **Lo que sí se parece**: el mejor ajuste, estable en las tres escalas |
| `83b225fffffffff` · celda rotulada «Cordillera de la Sal» (23,61° S, 68,52° W) | 0,19° (0,66°) | 1,71° (1,65–1,86) | 0,82 | 8,2 m | ❌ Demasiado plana |
| Yungay (control, 24,08° S, 69,91° W) | 2,56° (15,11°) | 3,32° | 0,31 | 20,8 m | ⚠️ El análogo clásico se aleja por su cola de laderas fuertes |
| `83b220fffffffff` · celda de Yungay (24,14° S, 69,58° W) | 3,46° (14,35°) | 3,70° (3,22–4,20) | 0,52 | 22,4 m | ⚠️ Similar al control |
| `83b221fffffffff` · celda rotulada «Salar de Pajonales» (24,68° S, 68,60° W; 4.200–5.270 m) | 7,89° (15,51°) | 6,92° (6,17–7,31) | 0,74 | 42,8 m | ❌ **Lo que no se parece**: mucho más abrupta |

**Cómo decirlo:** «una celda poco estudiada de Antofagasta se parece a Jezero en pendiente a 30 m más que el análogo clásico, Yungay; es un candidato para estudiar en terreno, no un sitio certificado».

**Límites (decirlos siempre):** una ventana de 6 km no representa toda la celda (~12.000 km²) ni todo el cráter; el centro de la celda H3 no es necesariamente el lugar que da nombre a la región; solo se comparan pendiente y relieve; DSM (Tierra) frente a DEM fotogramétrico (Marte); gravedad (0,38 g), presión (~0,6 kPa CO₂), radiación (~230 mSv/año, Hassler et al. 2014) y temperatura no se reproducen en la Tierra.

> ⚠️ **Cifras retiradas:** «Salar de Pajonales W₁ = 0,77°» y «Yungay W₁ = 4,13°» provenían del terreno **sintético** anterior. No deben usarse.
