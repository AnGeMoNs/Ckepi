# Ckepi — Reglas del proyecto (NASA Space Apps 2026, Lattices Team)

Motor de descubrimiento de análogos planetarios terrestres (Luna/Marte) con descomposición causal de variables ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$) y estadística espacial no paramétrica a escala común de $30\text{ m}$. La fuente de verdad técnica es [`docs/SDD.md`](docs/SDD.md) y el plan operativo es [`docs/PLAN_MAESTRO.md`](docs/PLAN_MAESTRO.md); este archivo resume lo que no debes violar y cómo el **System Prompt** orquesta la evaluación del proyecto.

## Stack real (no el de las plantillas)
- **Backend** `backend/app/`: FastAPI + Pydantic v2, DuckDB + GeoParquet, h3, scikit-learn, SciPy (`terrain_statistics.py`). Motor en `engine/`, conectores en `etl/`, variables X/Y/B en `config.py`.
- **Frontend** `frontend/src/`: React 18 + TS estricto + Vite + Tailwind 3 + MapLibre GL v6. i18n `es`/`pt`/`en` (471 claves en paridad total).
- Hay backend y base de datos embebida: ignora de las plantillas antiguas cualquier regla de "sin backend/sin base de datos".

## Reglas no negociables
1. **Honradez física y estadística:** nunca "idéntico a la Luna/Marte". Todo puntaje expone incertidumbre, resolución H3, comparación a escala común $\ge 30\text{ m}$ ($W_1$, $D_{\text{KS}}$, *2D Spatial Block Bootstrap* IC 95 %), **casos positivos (qué sí se parece) y casos negativos (ejemplos de qué NO se parece y por qué)**, y la **Brecha Física Irreducible $\mathbf{B}$** (gravedad $0.38\text{ g}$ / $0.166\text{ g}$, presión $0.6\text{ kPa }\text{CO}_2$ / $0\text{ kPa}$, radiación $\sim 230\text{--}380\text{ mSv/año}$, oscilación térmica $\Delta T$). Distingue siempre entre celdas medidas en `ckepi.duckdb` y la demostración metodológica sobre DEM sintético calibrado en `terrain_statistics.py`.
2. **Fuentes reales y Legal Open Science (`SPD-41a` / `FAIR`):** jamás inventes coordenadas, sensores, datasets ni referencias. Toda fuente (datos, código, imágenes, teselas, tipografías `SIL OFL-1.1`, íconos `Lucide MIT`) e identidad visual de marca va en [`docs/DATA_PROVENANCE.md`](docs/DATA_PROVENANCE.md), [`REFERENCES.md`](REFERENCES.md) y [`docs/BRAND_IDENTITY.md`](docs/BRAND_IDENTITY.md).
3. **Solo datos abiertos** (NASA, ESA, CSA, JAXA, Open-Meteo, Macrostrat). Sin APIs/portales de CNSA. Licencia OSI (`MIT`).
4. **i18n e Inglés Global (`G5`):** cero texto hardcodeado; claves idénticas en `es.json`, `pt.json`, `en.json`; entregables globales ([`docs/SUBMISSION_PACK_EN.md`](docs/SUBMISSION_PACK_EN.md), [`docs/DEMO_7_SLIDES_EN.md`](docs/DEMO_7_SLIDES_EN.md), [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](docs/DEMO_7_SLIDES_PROTOTYPE.html)) 100 % en inglés.
5. **UI Mobile-First (`320px` $\to$ `4K`):** sin `style={{}}` con hex/px arbitrarios; usar tokens Tailwind y `components/ui/`; áreas táctiles $\ge 44\text{ px}$; lectura por voz `Web Speech API`; claro/oscuro.
6. **Tipado:** prohibido `any` en TS; Pydantic v2 en fronteras; consultas DuckDB parametrizadas; rate limit en endpoints de sondeo.
7. **APIs externas:** caché + checkpoints incrementales; tolerar `HTTP 429`; todo cliente HTTP sale de `etl/http_utils.py`.
8. **IA y Marcas (`G11`):** la concepción científica es 100 % del equipo humano. Registra el uso de IA en [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md). Si hubiera imágenes/videos generados por IA deben llevar marca de agua visible `"AI-Generated"`. **Cero logos/marcas de NASA** en todo el proyecto.
9. **Seguridad y Git:** No commitees `.env`, secretos ni tokens; no toques `backend/app/data/*.duckdb` fuera de ETL; trabaja exclusivamente en la rama `dani` sin hacer `merge` a `main` ni `push` sin orden explícita.

## Cómo trabajamos y cómo el System Prompt evalúa el proyecto
- **Definition of Done** (skill `ckepi-verify`): `pytest -q` en `backend/`, `npm run build` en `frontend/`, paridad i18n, revisión visual responsive.
- **Evaluación Integral de Rúbricas (Obligatoria antes de congelar o enviar):** El sistema evalúa siempre con los 3 pilares de rúbrica:
  1. **Pilar Global Inglés, 7 Slides Prototipo, Links Públicos, Legal Open Science, Identidad de Marca e IA:** agente `auditor-ingles-open-science-nasa` + skill `auditoria-global-ingles-legal-nasa`.
  2. **Pilar Científico ($\ge 30\text{ m}$ en metros/grados, $W_1$/KS, Bootstrap 2D, Casos Positivos/Negativos, $0.38\text{ g}$ / $0.6\text{ kPa }\text{CO}_2$ / Radiación / $\Delta T$ y Datos en Disco):** agente `abogado-del-diablo-juez-nasa` + skill `rubrica-cientifica-30m`.
  3. **Pilar Local Antofagasta (5 Criterios NASA + Demo Básica Mobile-First + 4 Ejes Caja La Araucana y ODS):** agente `juez-validador-space-apps-2026` + skills `rubrica-local-araucana` y `validador-space-apps-2026`.

## Orquestación (agentes y skills en `.claude/`)
| Necesidad de Evaluación o Desarrollo | Agente / Skill Obligatoria |
|---|---|
| **Revisar que todo esté en inglés, 7 slides de demo prototipo, links públicos, campo NASA con precisión, citas legales Open Science (datos, código, imágenes, tipografías, íconos), identidad visual de marca y declaración/marca de agua de IA** | agente [`.claude/agents/auditor-ingles-open-science-nasa.md`](.claude/agents/auditor-ingles-open-science-nasa.md) + skill [`.claude/skills/auditoria-global-ingles-legal-nasa/SKILL.md`](.claude/skills/auditoria-global-ingles-legal-nasa/SKILL.md) |
| **Evaluar rúbrica local (1. Impacto, 2. Creatividad, 3. Validez, 4. Relevancia, 5. Presentación), Demo Básica Mobile-First y los 4 ejes de Caja La Araucana (Ciencia de Frontera, STEAM/Empleabilidad, Aplicación Local, Red Interregional + ODS)** | agente [`.claude/agents/juez-validador-space-apps-2026.md`](.claude/agents/juez-validador-space-apps-2026.md) + skill [`.claude/skills/rubrica-local-araucana/SKILL.md`](.claude/skills/rubrica-local-araucana/SKILL.md) |
| **Evaluar rúbrica científica: al menos 1 comparación real (ej. Jezero $\to$ Atacama) remuestreada a $\ge 30\text{ m}$ en metros/grados, distancias $W_1$ y KS, incertidumbre Bootstrap 2D, qué sí se parece vs. ejemplos de qué NO se parece y por qué ($0.38\text{ g}$, $0.6\text{ kPa }\text{CO}_2$, radiación, temperatura) y datos disponibles en disco** | agente [`.claude/agents/abogado-del-diablo-juez-nasa.md`](.claude/agents/abogado-del-diablo-juez-nasa.md) + skill [`.claude/skills/rubrica-cientifica-30m/SKILL.md`](.claude/skills/rubrica-cientifica-30m/SKILL.md) |
| **Scorecard Maestro Unificado (Global + Científico + Local)** | skill [`.claude/skills/validador-space-apps-2026/SKILL.md`](.claude/skills/validador-space-apps-2026/SKILL.md) + [`plantilla_scorecard.md`](.claude/skills/validador-space-apps-2026/plantilla_scorecard.md) |
| **Storytelling, Guion 30 s EN, 7 Slides Prototipo y Pitch Local 3 min + Q&A** | skill [`.claude/skills/pitch-storytelling-space-apps/SKILL.md`](.claude/skills/pitch-storytelling-space-apps/SKILL.md) (`docs/DEMO_7_SLIDES_EN.md`, `docs/DEMO_7_SLIDES_PROTOTYPE.html`, `docs/SUBMISSION_PACK_EN.md`) |
| **Estructurar/priorizar (MECE, 80/20, SCR)** | agente `mckinsey-orquestador` + skill `mckinsey-space-apps` |
| **Ciencia Luna / Marte / Iluminación polar** | agentes `cientifico-lunar-artemis`, `geologo-marte-isru`, `astrodinamica-chrono-luna` |
| **Cambiar el motor de similitud o añadir variables** | skill `ckepi-engine-change` (+ `pafi-analog-engine` como referencia teórica) |
| **Verificar compilación, tests, i18n y limpieza antes de dar algo por hecho** | skill `ckepi-verify` |
| **Añadir texto/UI multilingüe** | skill `ckepi-ui-i18n` |

## Puntos de control
Cierre del envío: domingo 23:59 hora de Chile; apunta a enviar $\le 20:00$.
