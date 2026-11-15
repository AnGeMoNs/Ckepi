# Dashboard unificado CKEPI y revisión de Kevin

## Estado vigente · integración funcional del 15-nov-2026

**Decisión de Dani:** usar la funcionalidad de Kevin y conservar la identidad visual de Dani (cartón, vidrio, paleta V2, portada y motion). Esta sección sustituye las decisiones funcionales del registro anterior que aparece debajo.

- Base incorporada: `origin/kevin` en `fac89ae04be3d4a3605ec57f691f4ed25b30606b`, que incluye `kevin-dani-angelo` en `1864643`.
- Se integró el contenido de 51 archivos, resolviendo conflictos. Rama `dani`, HEAD `cd5c5e3`, sin staging, commit, push ni nueva rama. No hay un commit de merge que registre todavía la integración.
- Respaldo previo de 499 rutas y del índice: `/home/dani/respaldos/ckepi-antes-kevin-20261115-002827/`; `manifest.json` contiene los hashes y `archivos/` los originales.
- No se accedió al stash. Los siete archivos de datos modificados por Kevin quedaron en su versión local: sigue vigente la protección de DuckDB. No afirmar que se importó su último enriquecimiento SoilGrids. `REFERENCES.md` y `docs/RESULTADOS_TERRENO_REALES.md` también se conservaron.

**Producto único:** la portada mantiene sus dos entradas visuales, pero ambas abren `ExplorerPage`. `?view=app&mode=science` abre el modo científico y `?view=app&mode=student` el educativo. `?view=explore` y los enlaces técnicos también usan ese motor. El antiguo `DashboardPage` queda recuperable como código sin conectar a la navegación activa.

**Recorrido del pitch:** elegir Luna/Marte y objetivo del ensayo → descubrir candidatos terrestres → interpretar semejanzas X, respuestas Y y límites B → exportar evidencia o una ficha de ensayo. El modo científico muestra ranking y evidencia; el estudiante agrega explicación, laboratorios y planificación. El resultado prioriza investigación; no certifica sitios.

`ProductGuide.tsx` explica ese recorrido. `VerifiedTerrainDemo.tsx` muestra la evidencia ya guardada: Pampa Central W₁ = **0,535°**, Yungay **3,3217°**, contraejemplo H3 `83b221fffffffff` **6,9225°**. Pampa Central: IC 95 % [0,3972°, 0,6492°]. Son ventanas de 6 × 6 km a 30 m, con NASA MRO CTX / USGS y Copernicus GLO-30, separadas del ranking multivariable global. Fuentes, histogramas y aviso Copernicus siguen disponibles.

No usar «terreno perfecto», «ahorro millonario demostrado» ni «precisión de 30 m en todo el globo». La malla H3 busca a escala regional; los 30 m pertenecen a las ventanas DEM concretas. El nombre es **Ckepi**, no CPIK.

Integrados el mapa H3/lente/inspector, modos de lectura, descubrimientos, dimensiones del desafío, laboratorios y exportación de Kevin. El asesor IA está integrado como opción del servidor, pero estuvo desactivado en la verificación real; sus pruebas usan un proveedor simulado. No se llamó a OpenRouter. Se conservaron los arreglos de autenticación administrativa, bloqueo de rate limit, `Retry-After`, refino y transacciones de Dani. Las pruebas de IA usan el estado aislado actual; los tests API omiten el precalentamiento repetido, mientras los tests DEM ejercitan directamente el motor científico.

Para limitar transferencia y renderizado se entregan inicialmente los **250 mejores candidatos**, evaluando las **10.679 celdas** del catálogo local; el mapa permite pedir el globo completo. Las cards conservan motion reducido, marcos 9-slice y textura estática; no apilan desenfoques GPU. La caída del catálogo tiene un error independiente para que otra respuesta no lo borre; reintentar vuelve a cargarlo.

Verificación de esta integración: **30 pruebas backend aprobadas** (`pytest -q`, 286 s; advertencia Starlette/httpx), **29 frontend**, build y **1.811 claves ES/PT/EN**. **9 pruebas de navegador** sobre producción: siete con fixtures y dos de producto, incluido navegador → API real → DuckDB temporal → respuesta; móvil 320 px, inglés/claro, identidad visual, evidencia y navegación. Se repiten las comprobaciones afectadas tras los últimos ajustes. Se preservan `entry.*`, `expedition.*`, `legal.copernicus.*`, pictogramas y originales visuales.

Quedan fuera de esta verificación la validación en terreno, la aceptación con usuarios, una auditoría completa de las rúbricas y el despliegue público. Esta integración no equivale a esas validaciones.

## Registro anterior · dashboard de snapshots (sustituido funcionalmente)

## Resultado

El acceso `?view=app` abre ahora un único espacio de trabajo: **Comparar terrenos → Aprender STEAM → Evidencia y descarga**. La entrada de aprendizaje `?view=explore` también abre el mismo dashboard, inicialmente en STEAM. Los enlaces técnicos anteriores con `site`, `tab` o `profile` conservan el flujo avanzado.

La primera pantalla explica la pregunta, el método y el resultado que permite obtener. Muestra cuatro ventanas terrestres del snapshot frente a Jezero, separa distancias de terreno de referencias físicas y comunica que la preselección no certifica ensayos. Elegir Luna muestra referencias físicas y la ausencia de comparación DEM equivalente; no reutiliza el ranking marciano.

La identidad V2 conserva sal, cobre, azufre y cartón. El fondo nuevo es una imagen decorativa generada con IA, sin datos dibujados dentro; mide 1536 × 1024 y el WebP pesa 48.860 bytes. Los polígonos, gráficos y valores se obtienen del código y los snapshots existentes.

## Ramas consultadas

Se ejecutó `git fetch origin` para actualizar referencias, sin cambiar de rama ni hacer merge.

| Referencia | Commit observado | Hallazgo útil | Tratamiento |
|---|---|---|---|
| `origin/kevin` | `b74e463` | Enriquecimiento DEM/POWER, física planetaria y estado parcial SoilGrids/Macrostrat; asesor de viabilidad OpenRouter | Se revisaron contratos y estado documental. No se trasladó su DuckDB ni se activó el asesor |
| `origin/kevin-dani-angelo` | `2648e6f` | Mapa de cobertura H3, lente por variable, densidad e inspector terrestre | Se adopta el principio de selección de indicador y explicación contextual sobre los datos locales ya disponibles; no se presenta su mapa global como integrado |
| `integra/kevin-angemon` | `e64151a` | Flujo Comparar/Aprender/Planificar/Evidencia sobre Kevin | Referencia para unir tareas en una misma herramienta |
| `integra/kevin2` | `c735fc9` | Integración anterior con exploración local | Se conserva; su worktree pertenece a otro colaborador y no se modificó |

El documento ETL de Kevin registra SoilGrids/Macrostrat pausado en 2.440/7.676 celdas prioritarias. Esto es estado declarado por esa rama, no una nueva medición ejecutada aquí. Su snapshot de presentación todavía contiene conteos históricos distintos: **no se copiaron esas cifras al dashboard**.

El asesor de Kevin requiere credenciales/servicio externo OpenRouter y cambios de backend, esquemas y cliente. Este incremento no envía datos allí ni lo anuncia como activo. Se aprovecha su organización conceptual de fortalezas, limitaciones y protocolo en la explicación del resultado, construida con los datos locales. Una integración futura necesita revisión de contratos, seguridad, coste y autorización de uso del servicio.

## Decisiones de producto

- **Una sola herramienta:** STEAM vive dentro de la navegación del dashboard; cambiar de sección conserva la práctica actual durante la sesión. Recargar pierde ese estado, como antes.
- **Primero una pregunta:** el encabezado explica por qué comparar terrenos y qué obtiene la persona. No se exige entender PCA o modelos antes de ver un caso.
- **Evidencia antes que decoración:** W₁, IC 95 %, KS, escala, control Yungay y procedencia permanecen disponibles. Las fuentes extensas del resultado se expanden; el aviso Copernicus sigue visible.
- **Una decisión acotada:** la ventana de menor W₁ se identifica como candidata entre estas ventanas. Las demás se presentan como comparaciones más distantes; esto no establece un umbral universal de validez de misión.
- **Carga gráfica por demanda:** el inicio usa un SVG de coordenadas reales y límites H3, con proyección esquemática explícita. No depende de teselas, WebGL ni backend. El mapa satelital existente se carga solo al activarlo.
- **Anatomy secundario:** no aparece en el dashboard inicial. En la práctica de comparación, la figura existente solo se monta al pulsar su botón. No se borraron las figuras ni el resto de pantallas existentes.
- **Sin cambiar ciencia o datos:** no se modificaron fórmulas, DuckDB, el stash, resultados protegidos ni las citas verificadas. La integración de ramas fue selectiva a nivel de ideas de flujo; no se hizo merge.

## Archivos de este incremento

- `frontend/src/pages/DashboardPage.tsx`: espacio de trabajo, destino, indicadores, decisiones y navegación interna.
- `frontend/src/pages/dashboard.css`: estructura responsive, superficies y fondo de trabajo.
- `frontend/src/components/science/MeasuredFootprintMap.tsx`: esquema geográfico ligero de límites y coordenadas reales con selección por teclado.
- `frontend/src/App.tsx`: conecta los dos accesos locales al dashboard; conserva rutas avanzadas.
- `frontend/src/components/science/AnalogCard.tsx`: etiqueta de distancia y fuentes extensas desplegables.
- `frontend/src/components/expedition/ComparePractice.tsx`: Anatomy bajo acción explícita.
- `frontend/src/i18n/{es,pt,en}.json`: namespace `dashboard`, preservando los anteriores.
- `frontend/tests/e2e/dashboard.spec.ts`: seis regresiones de navegador.
- `frontend/public/img/backgrounds/ckepi-dashboard-workbench.webp` y `masters/ckepi-dashboard-workbench.png`: nueva imagen y original nativo.
- `docs/design/paper-cut/prompts.json` y `AI_DISCLOSURE.md`: procedencia y declaración del fondo.

## Verificación

Historia comprobada: navegador → snapshots estáticos locales → selección de ventana → lectura de la comparación → expedición STEAM → exportación CSV. No requiere iniciar el backend para ese subconjunto. Se utilizó un servidor Vite de esta revisión en `127.0.0.1:5188`, sin interrumpir servidores ajenos.

- **Compilación:** `npm run build` pasa. Continúan advertencias de tamaño de los chunks de Three y MapLibre; ya son rutas diferidas, no una eliminación del coste de sus herramientas.
- **Pruebas existentes:** `npm test`, 27 aprobadas.
- **Navegador Chromium:** seis pruebas nuevas aprobadas: carga sin backend/worker MapLibre y selección por teclado; CSV con incertidumbre/fuentes; progreso STEAM; ausencia honesta de DEM lunar; 320 px/tema claro/inglés; error de snapshot y reintento.
- **Paridad:** 1.364 claves hoja por idioma al cierre del cambio; volver a contar si hay ediciones concurrentes.
- **Visual:** capturas reales en `docs/design/dashboard/`: escritorio, primera pantalla, móvil 320 px, STEAM y tema claro. Sin imágenes rotas en la captura revisada. Móvil: `scrollWidth = innerWidth = 320`; escritorio: ambos 1440.
- **Estática:** nuevas fuentes TSX sin tipos `any` ni estilos inline; `git diff --check` pasa. Se revisaron hooks, carga diferida, foco, etiquetas y controles táctiles.
- **Backend:** no se ejecutó ni se modificó; las pruebas de backend anteriores no se cuentan como validación de esta UI.

Para repetir las pruebas nuevas con el servidor de desarrollo que configure Playwright:

```sh
cd frontend
npm test
npm run build
npm run test:e2e -- tests/e2e/dashboard.spec.ts
node scripts/check-i18n.mjs
```

En esta ronda, Playwright usó una configuración temporal que apuntó a `http://127.0.0.1:5188` y dejó resultados en `/tmp/ckepi-dashboard-test-results`. Las pruebas leen los snapshots locales; no simulan una validación de campo ni consultan servicios espaciales en vivo.

## Límites pendientes

No se prueba en esta ronda la disponibilidad de todas las teselas del mapa satelital opcional, el backend avanzado, OpenRouter ni el despliegue público. La prueba de escritorio es Chromium automatizado; no certifica rendimiento térmico en una sesión real de Brave ni accesibilidad WCAG completa. Falta aceptación visual de Dani y prueba de comprensión con usuarios.

No se publica ni se hace commit. Rama de trabajo: `dani`. El trabajo concurrente y los recursos preparados por otros colaboradores se conservan.

## Integración visual de recursos · 15-nov-2026

El dashboard utiliza ahora directamente los recursos generados, además del fondo: tres relieves conceptuales (Atacama, Marte, Luna), los cinco planetas de la familia, once símbolos científicos, el pin en el esquema de coordenadas reales y los bordes híbridos de cartón/vidrio mediante 9-slice. La selección de destino se hace desde las cards ilustradas; sus rótulos aclaran que el dibujo no es cartografía medida. La ubicación de datos reales continúa en el esquema H3 y en el mapa satelital opcional.

Se añadió contexto ambiental con valores existentes del catálogo (humedad, flujo solar, viento, inercia térmica y proxy de vegetación), con fuentes y ventana de observación. Se distingue explícitamente de las mediciones del DEM. No se añadieron observaciones inventadas ni nuevas consultas externas.

Recursos web utilizados en vez de los másteres PNG. Cards y navegación adaptadas a móvil; los marcos no interceptan clics ni foco. Capturas actualizadas: `docs/design/dashboard/dashboard-identity-{desktop,first-screen,mobile}.png`.

Verificación adicional: 25 elementos de imagen cargados, cero imágenes rotas, cero errores de consola/red; los tres relieves y once símbolos aparecen en la vista. A 320 px, `scrollWidth = innerWidth = 320`. La suite de navegador agrega una séptima prueba que comprueba los recursos y las respuestas 200 de ambos marcos y del pin. Las 27 pruebas existentes y build pasan; paridad ES/PT/EN: 1.372 claves por idioma. Continúa la advertencia de chunks grandes en las herramientas avanzadas diferidas.
