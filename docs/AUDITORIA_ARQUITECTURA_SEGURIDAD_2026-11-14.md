# Auditoría local de arquitectura, prácticas y seguridad

Fecha: 14-nov-2026. Árbol compartido de la rama `dani`; otros agentes editan simultáneamente. Sin commit, push ni despliegue. Revisión transversal de rutas y contratos, almacenamiento, conectores, estado React, exportaciones, configuración de entrega y pruebas; no constituye revisión línea por línea de todo el repositorio ni certificación de seguridad o validez científica.

## Dictamen

La arquitectura de monolito modular es adecuada para el prototipo. No hace falta introducir microservicios, otro framework o más patrones. Hay separación útil de presentación, cliente HTTP, esquemas, cálculo y ETL. **No está todo cerrado para producción:** quedan dependencias de desarrollo vulnerables, riesgos de concurrencia y exposición pública, y comprobaciones de navegador/despliegue.

## Mapa y patrones observados

| Capa | Evidencia y patrón | Evaluación |
|---|---|---|
| Presentación | React, componentes por dominio y primitivas `components/ui` | Composición reutilizable; preservar tokens e i18n. |
| Estado / casos de uso | `useAnalogAnalysis`, `ExplorerPage` | Hooks separan red/presentación; siguen siendo grandes (412/648 líneas al revisar). Extraer sondeo/refinamiento por comportamiento cuando se amplíen. |
| Acceso API | `api/client.ts`, `ApiClientError`, señales de cancelación | Fachada central y errores traducibles; el genérico TS no valida JSON en ejecución. |
| HTTP backend | FastAPI, Pydantic, `Depends` | Fronteras tipadas y dependencias de autorización/límite. `main.py` mezcla rutas, cachés y persistencia (~800 líneas). |
| Motor | `causal_decomposer`, `analog_matcher`, `mission_advisor`, `terrain_statistics` | Funciones por responsabilidad y selección de algoritmo por parámetros; no se necesita inventar jerarquías Strategy. Parte del motor todavía realiza I/O. |
| Datos | DuckDB, Parquet, ETL | SQL revisado parametriza entradas; repositorio de datos todavía no está centralizado. |
| Conectores | `etl/http_utils.py` | Factory compartida para TLS y tiempos de espera; tres omisiones corregidas. No implica reintentos/circuit breaker universales. |
| Rendimiento | `lazy`/`Suspense`, chunks por proveedor, cachés acotadas | Buena base; MapLibre y Three siguen generando chunks grandes. |

## Correcciones aplicadas

1. **Alta: actualización administrativa abierta sin configuración.** `POST /api/v1/datasets/refresh` ahora rechaza si falta `ADMIN_TOKEN`, falta la cabecera o no coincide. Comparación mediante `secrets.compare_digest`. No se creó ni imprimió un secreto. La interfaz pública actual no envía esa cabecera: su botón de refresco recibirá un error de autorización; nunca incorporar el secreto en el bundle. Usar el endpoint desde una herramienta administrativa confiable.
2. **Media: carrera en rate limiting.** Lectura, comprobación y registro protegidos por un lock. Respuesta 429 incluye `Retry-After: 60`. El catálogo multiagencia, que realiza consultas externas, comparte ese límite.
3. **Media: refinamiento H3 inválido.** Resoluciones >=5 se rechazan antes de acceder a datos/red; evita solicitar hijos a una resolución más gruesa o refinar indefinidamente al mismo nivel.
4. **Media: reemplazos no atómicos.** DELETE+INSERT de celdas y series de sondeo usan transacciones con rollback. El sitio sondeado entra al catálogo en memoria después de persistir correctamente.
5. **Alta para el trabajo compartido: pruebas sobre datos de trabajo.** Una fixture automática copia los cuatro archivos materializados a un directorio temporal por prueba y sustituye el estado/configuración. La restauración histórica de `test_api.py` opera ahora sobre esa copia, no sobre la base del equipo. Las ventanas DEM y texturas usadas por el motor siguen leyéndose desde sus rutas existentes; no se modifican.
6. **Aislamiento de estado.** Diccionarios, cachés y locks pasan de atributos mutables de clase a atributos de instancia de `AppState`.
7. **Consistencia HTTP.** `earth_etl`, `global_earth_etl` y la consulta IAU usan la fábrica con certifi; conservan sus timeouts y cierres de cliente.

Pruebas nuevas en `backend/tests/test_security_regressions.py`: autorización a nivel endpoint, solicitudes concurrentes, catálogo limitado, límites H3 y preservación de una fila cuando el INSERT falla. Datos y tokens son ficticios.

## Riesgos pendientes y orden de trabajo

| Prioridad | Hallazgo / límite | Siguiente paso verificable |
|---|---|---|
| P1 | `npm audit`: 8 alertas de desarrollo (1 alta, 5 moderadas, 2 bajas); Vite 5.4.21/esbuild y cadena PWA. `--omit=dev`: 0 alertas. | Actualizar herramientas en un cambio dedicado, comprobar Node/plugins y repetir tests/build/audit. No se ejecutó `audit fix --force` ni una migración mayor durante la competencia. No exponer el servidor dev. |
| P1 | Rate limiter y locks son por proceso; limitan por IP observada y no garantizan control distribuido. El proxy debe preservar una IP confiable. | Definir despliegue de un worker y límites de solicitudes/concurrencia en el proxy. Probar dos clientes y no confiar ciegamente en `X-Forwarded-For`. |
| P1 | Caché de descomposición/catálogo no protegida completamente frente a varios threads; lecturas DuckDB pueden coexistir con escrituras de distinta configuración. | Extraer un servicio de datos, coordinar conexiones y probar búsquedas/sondeos simultáneos sobre una copia de DB. |
| P1 | Arranque puede materializar/actualizar datasets; búsquedas/descomposición son operaciones CPU sin cuota dedicada. | Separar ETL de arranque en modo público; probar presupuesto de CPU y límites de entrada/concurrencia. |
| P1 | Proxy de teselas no maneja todos los fallos de transporte; texturas pueden cachear un mosaico incompleto si faltan teselas. | Manejar timeout como 502/504, verificar imagen/tamaño, no persistir mosaicos incompletos, compartir solicitudes duplicadas y escribir archivos atómicamente. |
| P2 | Docker backend ejecuta como root; nginx no define política de cabeceras/CSP/TLS del despliegue. | Usuario no privilegiado con permisos de datos explícitos; diseñar CSP compatible con MapLibre/workers/fuentes y probarla antes de activar. |
| P2 | API TS hace cast de JSON; varios sondeos no admiten cancelación/deadline. | Validar respuestas en la frontera y probar cancelación/cambio de sitio también en sondeos/refinamientos. |
| P2 | Exportación CSV escapa comillas en región, pero no tiene política general contra fórmulas de hojas de cálculo. | Escapado por tipo de campo si se aceptan etiquetas externas/editables; test de `=`, `+`, `@` y saltos de línea. |
| P2 | Dependencias Python con mínimos sin lock reproducible; no se ejecutó escáner CVE Python. | Generar lock reproducible y auditoría de vulnerabilidades en entorno aislado. `uv pip check` solo comprueba compatibilidad. |
| P2 | SDD/AGENTS/plan contienen cifras y descripciones antiguas (claves i18n, health, licencia, escala). | Reconciliar documentación con implementación y licencia raíz; no atribuir requisitos internos a NASA sin fuente. |

No se observaron usos de `eval`, `shell=True`, `verify=False` ni `dangerouslySetInnerHTML` en la búsqueda dirigida de código de aplicación. Esto no equivale a un análisis completo de secretos o de dependencias transitivas.

## Ciencia y rúbrica

La revisión actual sí encontró ventanas reales CTX/Copernicus en `terrain_statistics.py`, carga de procedencia y fallback rotulado `SYNTHETIC`; el seed es estable (`crc32`). No corresponde repetir el diagnóstico histórico de «todo sintético». Los tests de DEM verifican procedencia, plausibilidad y reproducibilidad; no certifican georreferenciación, exactitud de todos los modelos físicos o causalidad. Esta auditoría técnica no reemplaza las tres evaluaciones de rúbrica previas al envío.

## Verificación

- Frontend: `npm test`, **24 pasan**; `npm run build`, **pasa**, advertencia de chunks >500 kB (Three ~528 kB, MapLibre ~1072 kB antes de gzip).
- Backend dirigido: **18 pasan, 1 deseleccionada**, incluyendo seguridad, DEM real, flujo local Jezero–Atacama y validaciones sin sondeo MEDA.
- Regresiones de seguridad repetidas después de los últimos cambios: **11 pasan**; compilación sintáctica Python también pasa. Starlette advierte de deprecación del transporte de TestClient; no hubo fallo por esa advertencia.
- Evidencia de dependencias: [salida completa de npm audit](audits/npm-audit-2026-11-14.json). El resultado cero de dependencias de producción no equivale a cero vulnerabilidades del sistema.
- Python: `uv pip check --python backend/.venv/bin/python`, **54 paquetes compatibles**. El entorno no tiene `pip`; no se instaló globalmente.
- i18n: **860 claves en paridad** es/pt/en.
- `git diff --check`: pasa al revisar. No se introdujeron cambios de UI en esta auditoría.
- Búsqueda TS: no se encontró uso de tipo `any`; la palabra aparece en un comentario. Dos estilos inline existentes requieren revisar su excepción funcional, no una sustitución automática.
- Navegador real, móvil, carga/concurrencia sostenida, contenedor y despliegue: **no verificados en esta ronda**. Los tests DOM sustituyen los mapas WebGL.

La suite completa con APIs externas se ejecuta adicionalmente con límite de tiempo; registrar abajo su resultado sin confundir fallos remotos con las pruebas aisladas.
