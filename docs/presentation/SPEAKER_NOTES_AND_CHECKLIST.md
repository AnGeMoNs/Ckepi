# Guion por Diapositiva (3 min) y Checklist Pre-Entrega — Ckepi

**Rama base verificada:** `kevin` (`00d1b11`)  
**Archivos generados:**
- Global (Inglés, ≤ 7 láminas): `ckepi-pitch-en.pdf` y `ckepi-pitch-en.pptx`
- Local Antofagasta (Español, ≤ 7 láminas): `ckepi-pitch-es.pdf` y `ckepi-pitch-es.pptx`

---

## 1. Guion Sincronizado con las 7 Diapositivas (3:00 min)

| Diapositiva | Tiempo | Qué decir (resumen para ensayar) |
|---|---|---|
| **1 · Portada** | `0:00–0:25` | *"Cuando miramos una fotografía del desierto de Atacama, es fácil pensar: esto parece Marte. Con Ckepi acercamos los datos de Tierra, Luna y Marte para entender qué podemos comparar y dónde termina la semejanza."* |
| **2 · Problema y Público** | `0:25–0:50` | *"El parecido visual o un promedio simple ocultan la física real: gravedad, presión, radiación e inercia térmica. Además, las herramientas científicas suelen dejar fuera a estudiantes, docentes y personas con baja alfabetización digital."* |
| **3 · Solución** | `0:50–1:20` | *"Construimos un motor abierto en React y MapLibre GL con 1,757 celdas H3 cacheadas, tres idiomas (es/pt/en) y tres pasos claros: explorar globos 3D, comparar por dimensión y ver los límites físicos."* |
| **4 · Ciencia y Datos NASA** | `1:20–1:50` | *"Nuestro modelo separa 19 variables en 10 forzamientos independientes (X), 6 respuestas dependientes (Y) y 3 fronteras de ruptura irreducibles (B: gravedad, presión y radiación), usando Perseverance MEDA, Curiosity REMS, PDS ODE, Trek WMTS, NASA POWER y Copernicus/ERA5-Land."* |
| **5 · Prueba Atacama ↔ Jezero** | `1:50–2:15` | *"En el caso verificado Cráter Jezero ↔ Atacama/Yungay (celda H3 `82b227fffffffff`), coinciden la aridez (0.982), el albedo (0.766) y la inercia térmica (0.691), pero la frontera de ruptura (R_break = 0.866) advierte explícitamente que Marte tiene 0.378 g, 8.07 mbar y 230 mSv/año. Por eso Atacama sirve para movilidad y sensores ópticos, no para paracaídas ni radiación GCR."* |
| **6 · Sostenibilidad y Hoja de Ruta** | `2:15–2:40` | *"La plataforma educativa y de exploración es gratuita y open-source. Como hipótesis por validar con instituciones, proponemos talleres, formación de guías y kits locales, sin afirmar ventas ni convenios cerrados. Siguiente paso: completar las 1,403 celdas Res-3 restantes y validar distribuciones DEM de 30 m."* |
| **7 · Créditos, IA y Cierre** | `2:40–3:00` | *"Todos los datos se atribuyen en texto sin logos NASA. La arquitectura científica es humana y declaramos con transparencia la asistencia de IA en código e i18n. Con Ckepi, una semejanza despierta la curiosidad; la evidencia nos enseña hasta dónde llega."* |

---

## 2. Checklist de Elegibilidad y Veracidad (Antes de Enviar)

- [ ] **Límite de diapositivas:** exactamente **7 diapositivas** (`ckepi-pitch-en.pdf`).
- [ ] **Idioma global:** versión `en` completamente en inglés para la plataforma Space Apps.
- [ ] **Sin logos prohibidos:** cero insignias/logos de NASA, Space Apps o instituciones locales sin permiso escrito.
- [ ] **Sin cifras sintéticas o exageradas:** cero *"87 % igual a Marte"*, cero certificación de aterrizaje seguro, y comparación DEM `NASADEM_HGT v001` / `CTX DEM` declarada como siguiente paso (salvo confirmación previa).
- [ ] **Completar Diapositiva 7:** reemplazar `[Insert Public URL]` y `[Insert Members]` en `build_deck.py` (o directamente en el `.pptx`) antes de exportar la versión final.
- [ ] **Prueba en incógnito:** abrir la URL pública de la demo y el PDF alojado en una ventana privada sin inicio de sesión.
