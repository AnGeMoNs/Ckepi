# Prompt · Home inicial de CKEPI (intro → presentación → software)

> Para el agente de frontend (Argon u otro). Copiar desde «PROMPT» hasta el final.
> Referencia visual: `/home/dani/Imágenes/nasaidentidad.png` (solo como estilo; **no** reproducir su contenido con marcas).

---

## PROMPT

Eres el desarrollador frontend de **Ckepi** (NASA Space Apps 2026, sede Antofagasta). Lee primero `CLAUDE.md`, `docs/SDD.md`, `docs/RESULTADOS_TERRENO_REALES.md` y `CONTEXTO_DANI.md`. Solo modificas `frontend/`. Antes de programar, explica tu plan en 5 líneas y espera el visto bueno de Dani. Usa las skills `frontend-design`, `better-layout`, `better-typography`, `better-colors`, `better-accessibility` y `ckepi-ui-i18n`; termina con `ckepi-verify`.

### Qué construir
Un recorrido de entrada en tres momentos, dentro de la app React existente (React 18 + Vite + Tailwind, sin librerías nuevas salvo que las justifiques):

1. **Home (intro):** pantalla completa con la palabra **CKEPI** animada en loop, en el estilo de papel recortado por capas.
2. **Presentación:** 3 a 4 pasos breves que cuentan el desafío con datos reales.
3. **Acción → software:** un botón principal que, con una transición de motion, abre el Explorador actual (`ExplorerPage`).

Implementación sugerida: `src/pages/HomePage.tsx` + `src/components/home/` (capas SVG, título en loop, pasos). Navegación por estado en `App.tsx` o hash (`#/`, `#/intro`, `#/app`), sin añadir un router. Un enlace compartido a la app (`?site=…`, `?tab=…`) debe abrir directamente el Explorador, sin pasar por la intro. Botón visible «Saltar intro», que además se recuerda en `localStorage` (con try/catch).

### Estilo (tomar de la referencia, sin copiarla)
- **Papel recortado por capas** que forman un túnel hacia el centro: 6–10 capas con bordes orgánicos y sombra suave entre capas (`drop-shadow`), dibujadas **en SVG por código** (no imágenes raster ni imágenes generadas con IA).
- **Concepto que da sentido:** las capas son **curvas de nivel**. Si es posible, deriva los contornos de las ventanas reales de 30 m (`backend/app/data/derived/terrain_windows_30m.json/.npz`, precalculados a un JSON liviano de polilíneas): las capas del borde = terreno de Antofagasta (celda `83b224`), el centro = Jezero. Si no da el tiempo, usa contornos dibujados a mano y no digas que son datos.
- **Paleta (tokens en `tailwind.config.ts` / CSS, claro y oscuro):** azul noche `#0B1D3A`, azul medio `#1E3A6E`, negro espacio `#0A0A0F`, blanco nube `#EEF1F5`, naranja Atacama `#D9822B`, amarillo sol `#F2C14E`, óxido marciano `#C1440E`, celeste `#7FB8E0`. Contraste WCAG AA para todo texto.
- **Elementos:** estrellas recortadas; un sol naranja-amarillo en capas en una esquina; **Tierra, Luna y Marte** reales en estilo papel (**Marte sin anillos**, nada de Saturno ni planetas decorativos).
- **Identidad local (Antofagasta):** en las capas inferiores, siluetas de papel del paisaje regional: la costa con el arco de La Portada, la pampa y un volcán andino con su cono, y un cielo nocturno muy estrellado (el cielo de Atacama). Sin logos ni marcas de terceros.
- **PROHIBIDO:** insignia de NASA («meatball»), logotipo *worm*, sello, banderas, parches de misión o cualquier imitación de ellos; logos de La Araucana, UCN o UA sin permiso escrito; menores reconocibles.

### La palabra CKEPI en loop
- Letras grandes construidas como **capas de papel apiladas** (3–4 capas por letra con leve desfase y sombra), tipografía geométrica gruesa. Si usas una fuente web, autoalójala (Fontsource, licencia OFL) y cítala en `REFERENCES.md`; si no, usa la pila de fuentes del sistema.
- Loop de ~6 s: las capas de cada letra se separan y se vuelven a apilar en secuencia (efecto de «respirar» en profundidad); las estrellas titilan; las capas del túnel tienen un paralaje lento. Debajo, un subtítulo que rota entre: «Tierra · Luna · Marte», «¿Qué se parece? ¿Cuánto? ¿Qué no?», «Antofagasta → Jezero, a 30 m».
- Solo `transform` y `opacity` (sin animar layout) para 60 fps en móvil. Con `prefers-reduced-motion: reduce`, todo queda estático y completo.

### Presentación (los textos salen de los JSON de i18n, es/pt/en)
1. **El problema:** «Las misiones prueban sus equipos en lugares de la Tierra parecidos a la Luna y Marte, pero muchos se eligen por parecido visual.»
2. **Qué hace Ckepi:** «Comparamos dimensión por dimensión con datos abiertos de NASA: qué se parece, cuánto y qué no.»
3. **El hallazgo (dato real, con fuente):** «Una zona poco estudiada de Antofagasta (celda H3 `83b224`) se parece a las pendientes del cráter Jezero más que el análogo clásico, Yungay: W₁ = 0,54° frente a 3,32°.» Fuente visible: «NASA MRO CTX DEM (USGS) · ESA Copernicus GLO-30 · 30 m». Usa **solo** cifras de `docs/RESULTADOS_TERRENO_REALES.md`.
4. **El límite honesto:** «La gravedad (0,38 g), la presión y la radiación de Marte nunca se reproducen en la Tierra. Preseleccionamos, no certificamos.»

Cada paso: una idea por pantalla, botón grande «Siguiente», opción «Escuchar» con `speechSynthesis` (idioma activo), navegación con teclado y flechas.

### Acción y motion hacia el software
- Botón principal **«Explorar los tres mundos»** (≥ 44 × 44 px, foco visible).
- Al pulsarlo: las capas de papel se abren hacia los lados (como abrir el túnel) y la cámara «entra» al centro, revelando el Explorador. Duración total ≤ 900 ms; usa la View Transitions API si está disponible y CSS como respaldo. Con movimiento reducido: un fundido simple de 150 ms.
- Al llegar, el foco va al primer encabezado del Explorador.

### Requisitos que no se negocian
- i18n completo en `es`, `pt`, `en` (paridad de claves; verifica con `node scripts/check-i18n.mjs`); nada de texto suelto.
- Sin `any`, sin `style={{}}` con colores o px arbitrarios; tokens Tailwind.
- Mobile-first: 320 px a 4K; el título no se corta en 320 px.
- Rendimiento: la Home no debe cargar mapas, three.js ni datos del Explorador (lazy). Objetivo: menos de 150 KB de JS gzip para la Home.
- Accesibilidad: `aria-label` en el título animado (lee «CKEPI» una vez), animaciones decorativas con `aria-hidden`, contraste AA.
- Créditos visibles en la Home: «Datos: NASA, ESA y agencias socias · Ckepi no está afiliado ni respaldado por NASA».

### Definición de terminado
`npm run build` sin errores, `npm test` en verde, paridad i18n, capturas a 320 px y 1440 px (con `webapp-testing`), prueba con movimiento reducido activado, y un mensaje a Dani con las capturas antes de hacer commit (solo `git add frontend/`).
