# Revisión simulada del modelo para jurado local

15-nov-2026. Perfil aplicado: `.claude/agents/juez-validador-space-apps-2026.md`; skills `rubrica-local-araucana`, `rubrica-cientifica-30m`, `auditoria-global-ingles-legal-nasa` y `validador-space-apps-2026`. Revisión interna por asistente, **sin afiliación ni aval del jurado o de la organización**. Alcance: modelo nuevo editable local, siete slides. No modifica el software ni los materiales previos.

## Cinco criterios — valoración interna provisional

| Criterio | /5 | Evidencia y límite |
|---|---:|---|
| Impacto | 3 | Slides 2/6: usuarios, objetivos medibles; falta pilotaje real |
| Creatividad | 4 | Slide 3: X/Y/B y traducción educativa de la misma evidencia |
| Validez | 4 | Slide 4: caso real, control, negativo, W₁, KS, IC 2D, escala 30/60/90 m; no recalculado en esta revisión |
| Relevancia | 4 | Slides 4/5: NASA CTX Jezero y terreno regional; brechas y falta DEM lunar equivalente explícitas |
| Presentación | 4 | Siete slides, narración propuesta 180 s; ensayo humano y revisión de proyector pendientes |
| **Total interno** | **19/25** | No es puntuación oficial ni predicción del resultado |

## Cuatro ejes recogidos en el repositorio

La correspondencia procede de `.claude/skills/rubrica-local-araucana/SKILL.md`; **no se verificó con una publicación primaria del organizador** que sea una rúbrica vigente. La slide 6 la presenta como propuesta, sin logos ni convenios inventados.

| Eje | /5 | Indicador futuro propuesto |
|---|---:|---|
| Ciencia de frontera | 4 | Número de comparaciones reproducidas y verificadas por terceros |
| STEAM y empleabilidad | 3 | Finalización y comprensión antes/después; no empleos creados |
| Aplicación local | 4 | Candidatos contrastados con observaciones de campo y criterios de aceptación |
| Red interregional | 2 | Colaboraciones acordadas y resultados compartidos; ninguna alianza nueva se da por firmada |
| **Total interno** | **13/20** | Indicadores propuestos, no logros |

## Metas ODS contrastadas en fuente primaria ONU

Fuentes consultadas: [ODS 4](https://sdgs.un.org/goals/goal4), [ODS 9](https://sdgs.un.org/goals/goal9), [ODS 17](https://sdgs.un.org/goals/goal17), 15-nov-2026. Son marcos internacionales; no certifican que Ckepi haya producido impacto.

| Meta | Sentido de la meta ONU, resumido | Tratamiento del modelo |
|---|---|---|
| 4.3 | Acceso igualitario a formación técnica, profesional y superior asequible y de calidad | Contribución educativa propuesta; no matrícula formal ni acreditación |
| 4.4 | Competencias relevantes para empleo, trabajo decente y emprendimiento | Medir aprendizaje técnico; no atribuir empleabilidad demostrada |
| 9.5 | Fortalecer investigación y capacidad tecnológica | Reproducibilidad y contraste de campo propuestos |
| 17.3 | Movilizar recursos financieros adicionales para países en desarrollo desde diversas fuentes | No se reclama cumplimiento. No significa automáticamente recursos para ciencia |
| 17.16 | Alianzas de múltiples actores para compartir conocimiento, capacidad y recursos para los ODS | Colaboraciones futuras; falta acuerdo y evidencia |
| 17.17 | Alianzas eficaces públicas, público-privadas y de sociedad civil | Pilotajes acordados como propuesta; sin convenio inventado |

ODS 8, 10 y 13 quedan como vínculos secundarios potenciales, no como resultados del proyecto. No afirmar reducción de emisiones sin inventario ni contrafactual.

## Compuertas

- **Siete slides:** PASS; portada y cierre incluidos. PPT editable, sin placeholders de nombres/QR.
- **Ciencia:** PASS documental: candidato 83b224 = 0,54° [0,40–0,65], KS 0,15; Yungay = 3,32°; negativo 83b221 = 6,92°. Sensibilidad candidato 60 m = 0,40°, 90 m = 0,27°. Fuente protegida `docs/RESULTADOS_TERRENO_REALES.md`, sin modificarla ni recalcular datos.
- **Límites:** PASS documental: ventana 6 × 6 km, sin extrapolar a toda H3; B explícita y radiación lunar modelada; DEM lunar equivalente pendiente.
- **Legal/marca/IA:** créditos Apache-2.0, NASA MRO CTX/USGS, Copernicus, fuentes OFL e iconos ISC; capturas con aviso AI-Generated para decoración. Sin introducir logos oficiales. Fuentes completas en los registros existentes del proyecto; esta revisión no es dictamen jurídico.
- **Global inglés:** NO APLICA al modelo local español. No reemplaza el paquete global inglés.
- **Enlaces públicos y reglas oficiales 2026:** NO VERIFICADOS en esta revisión. El repositorio se referencia por su dirección conocida; sin inventar URL de demo.
- **Mobile/voz:** no se adjudica PASS a partir de las slides. Usar el informe funcional de la revisión de software independiente.
- **Entrega:** hora 12:00 según instrucción humana, no una base del organizador verificada.

## Correcciones antes de hablar

1. Ensayar 180 s y acordar si habrá interacción en vivo o captura.
2. Confirmar nombres/roles y quién opera la demo, sin añadir identidades inferidas.
3. Confirmar enlaces y pantalla de presentación. Mantener el PDF como respaldo.

## Evidencia técnica de esta generación

- `backend/.venv/bin/python docs/pitch/build_modelo_jurado.py`: exit 0.
- PowerPoint leído con python-pptx: siete slides, notas en todas y geometría dentro del lienzo.
- LibreOffice 24.2: exportación PDF exit 0; `pdfinfo`: siete páginas, sin cifrado.
- Mosaico de las siete páginas inspeccionado visualmente en `/tmp/ckepi-model-preview.jpg`: sin cortes ni superposición visibles. Legibilidad final en proyector no verificada.
- Texto y formas editables; capturas originales conservadas. No se alteró `PITCH_OFICIAL_FINAL.md` ni el PPT previo durante la generación de este modelo.
