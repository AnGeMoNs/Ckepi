# Correcciones de navegación y consistencia — rama angemon

## Alcance

Esta revisión parte de `5a52133` en `angemon`. `main` se consultó como referencia;
no se reemplazó la rama por el ZIP adjunto ni se reescribió su historia.

- **Planificar:** título, objetivo, equipos y notas se mantienen al ir a Evidencia,
  Aprender o Comparar. El borrador vive en memoria: recargar o cerrar la página lo
  elimina. La interfaz invita a descargarlo. No se agrega almacenamiento personal.
- **Enlaces:** un sitio lunar inicializa el laboratorio con la Luna. Los perfiles
  desconocidos en la URL vuelven a `causal_auto`, y el catálogo confirma el cuerpo
  del sitio seleccionado. Esto no equivale todavía a guardar todos los controles
  científicos en un enlace compartido.
- **Portapapeles:** se espera el resultado del navegador; una denegación se informa
  como error y permite reintentar. El indicador no anuncia una copia fallida como éxito.
- **Teclado:** flechas, Inicio y Fin trasladan tanto el foco como la pestaña activa.
- **Consultas:** búsquedas y comparaciones obsoletas se cancelan; sondeos tardíos
  se ignoran al cambiar su contexto. Los paneles no muestran celdas del sitio
  anterior como si correspondieran al nuevo. Los filtros también se aplican a
  sitios sondeados, y se envía la penalización de estimaciones al sondeo planetario.
- **Errores:** una respuesta JSON malformada tiene un mensaje traducido. El aviso
  de API también aparece fuera de Comparar; los cálculos locales siguen disponibles.

Se conservan mapas, motor científico, datasets, fórmulas físicas, ODS y los tres
idiomas existentes (es/en/pt). Estas correcciones no validan científicamente las
mediciones ni certifican terrenos para una misión.

## Validación reproducible

Desde `frontend`:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Los tests de navegador usan respuestas controladas y el catálogo del repositorio.
Verifican interfaz, borrador/exportación, errores, selección de planeta, respuestas
pendientes, teclado y ancho móvil; no prueban disponibilidad de servicios externos.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permite usar un Chromium ya instalado.

Desde `backend`, con las dependencias de desarrollo instaladas:

```sh
pytest tests/test_confidence_and_validation.py tests/test_jezero_atacama_flow.py -q -k 'not mars_meda_and_pds'
```

Esas cuatro pruebas verifican validaciones, métricas y el recorrido Jezero–Atacama
con la base almacenada. La suite completa también incluye consultas externas:

```sh
pytest -q
```

La compilación puede advertir que Three.js y MapLibre superan 500 kB por fragmento;
ya se cargan de forma diferida y esa advertencia precede a esta revisión.

## Revisión humana

Cambios de implementación y pruebas preparados con asistencia de IA. La revisión
científica, las traducciones y la aceptación final corresponden al equipo, conforme
a `AI_DISCLOSURE.md`. No se agregaron imágenes generadas ni datos de producción.

## Resultado de esta revisión (14-11-2026)

| Verificación | Resultado |
| --- | --- |
| Fórmulas, traducciones, URL, cliente API y componentes con DOM simulado | 24 pruebas aprobadas |
| Backend con base almacenada / validación local | 4 pruebas aprobadas |
| Integraciones externas de la suite completa | 5 fallaron por verificación TLS/certificados del entorno; no se desactivó TLS |
| Chromium / 7 recorridos E2E preparados | No ejecutables aquí: el sistema deniega el socket de Chromium |

Las pruebas de componentes sustituyen los dos mapas WebGL, sin cambiar su código
de producción. No acreditan apariencia visual, renderizado 3D ni comportamiento
real del navegador en móvil. Los tests E2E quedan disponibles para ejecutarlos en
un equipo con Chromium funcional.
