---
name: ckepi-verify
description: Definition of Done de Ckepi. Úsala siempre antes de decir que un cambio está terminado, antes de un commit o PR, y cuando el usuario pida "verifica", "prueba", "revisa que compile" o "está listo?". Corre pytest del backend, build estricto del frontend, paridad de claves i18n es/pt/en, busca `any` y `style={{}}` prohibidos, y enlaza con las 3 skills de rúbrica (auditoria-global-ingles-legal-nasa, rubrica-cientifica-30m y rubrica-local-araucana).
---

# ckepi-verify

Un cambio no está hecho hasta que pasan las compuertas técnicas y de rúbrica que le aplican (definidas en `docs/SDD.md` §7 y `docs/PLAN_MAESTRO.md`). Corre las relevantes al área tocada e informa cuáles omitiste y por qué.

## Compuertas Técnicas

1. **Backend** (si tocaste `backend/`):
   `cd backend && .venv/bin/python -m pytest tests/test_causal_decomposer.py tests/test_api.py -q`
   *(Las pruebas que dependen de Open-Meteo Archive en vivo en `test_analog_matcher.py` pueden recibir `HTTP 429`: repórtalo como límite externo, no lo escondas ni toques `backend/app/data/ckepi.duckdb`).*
2. **Frontend** (si tocaste `frontend/`):
   `cd frontend && npm run build` (ejecuta `tsc && vite build`; debe dar 0 errores).
3. **Paridad i18n** (si tocaste `frontend/src/i18n/` o añadiste texto en UI):
   `python3 .claude/skills/ckepi-verify/scripts/check_i18n_parity.py`
4. **Prohibiciones estáticas** en `frontend/src`:
   - `rg -n '\bany\b' frontend/src --glob '*.ts*'` → `0` ocurrencias.
   - `rg -n 'style=\{\{' frontend/src` → `0` ocurrencias.
5. **Visual y Mobile-First** (si cambió la UI): revisa `320px` y `1280px+`, consola sin errores de WebGL y controles táctiles $\ge 44\text{ px}$.

## Compuertas de Rúbrica (Pre-Envío y Evaluación)
Cuando se evalúe el proyecto completo, documentación o entregables de hackathon, aplica también:
6. **Global Inglés, 7 Slides, Links, Legal Open Science, Marca e IA:** [`.claude/skills/auditoria-global-ingles-legal-nasa/SKILL.md`](../auditoria-global-ingles-legal-nasa/SKILL.md) (Agente: `auditor-ingles-open-science-nasa`).
7. **Rúbrica Científica ($\ge 30\text{ m}$, $W_1$/KS, Bootstrap 2D, Casos Positivos/Negativos, $0.38\text{ g}$ / $0.6\text{ kPa }\text{CO}_2$ / Radiación / $\Delta T$ y Datos en Disco):** [`.claude/skills/rubrica-cientifica-30m/SKILL.md`](../rubrica-cientifica-30m/SKILL.md) (Agente: `abogado-del-diablo-juez-nasa`).
8. **Rúbrica Local Antofagasta (5 Criterios NASA + Demo Básica Mobile-First + 4 Ejes Caja La Araucana):** [`.claude/skills/rubrica-local-araucana/SKILL.md`](../rubrica-local-araucana/SKILL.md) (Agente: `juez-validador-space-apps-2026`).

## Cómo reportar
Lista cada compuerta como `PASÓ` / `FALLÓ` / `OMITIDA` con la salida relevante. Si algo falla, muéstralo tal cual; no declares terminado.
