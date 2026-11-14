---
name: pafi-analog-engine
description: >-
  Referencia teórica y puente hacia el motor causal de Ckepi (backend/app/engine/): descomposición
  X -> Y || B, emparejamiento H3 multirresolución (S_ind, S_dep, R_break) y comparación estadística
  no paramétrica de distribuciones topográficas a escala métrica común >= 30 m (Wasserstein-1 W_1,
  Kolmogorov-Smirnov D_KS y 2D Spatial Block Bootstrap).
---

# Skill · Referencia del Motor de Similitud Planetaria y Estadística a 30 m

## Fuentes de verdad reales en el repositorio
- Diseño técnico y matemático: [`docs/SDD.md`](../../../docs/SDD.md) §4 y [`docs/API_DATA_AND_MATCHING.md`](../../../docs/API_DATA_AND_MATCHING.md)
- Reglas para modificar el motor: [`.claude/skills/ckepi-engine-change/SKILL.md`](../ckepi-engine-change/SKILL.md)
- Auditoría científica a escala $\ge 30\text{ m}$: [`.claude/skills/rubrica-cientifica-30m/SKILL.md`](../rubrica-cientifica-30m/SKILL.md)
- Implementación en código:
  - [`backend/app/config.py`](../../../backend/app/config.py)
  - [`backend/app/engine/analog_matcher.py`](../../../backend/app/engine/analog_matcher.py)
  - [`backend/app/engine/causal_decomposer.py`](../../../backend/app/engine/causal_decomposer.py)
  - [`backend/app/engine/terrain_statistics.py`](../../../backend/app/engine/terrain_statistics.py)
  - [`backend/app/engine/known_analogs.py`](../../../backend/app/engine/known_analogs.py)

## Reglas de Implementación y Verificación Científica
1. **Separación Causal Estricta ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$):**
   - Nunca colapsar las variables en un porcentaje único. Reportar siempre $(S_{\text{ind}}, S_{\text{dep}}, R_{\text{break}})$ junto con la banda de incertidumbre (`score_ci_low`, `score_ci_high`).
2. **Distinguir Arquetipos Planetarios:**
   - **Luna Polar (*Shackleton*, $89.9^\circ\text{ S}$):** Tierras altas anortosíticas, iluminación solar rasante, trampas frías permanentes (PSRs a $25\text{--}40\text{ K}$) y vacío ($0\text{ kPa}$, $0.166\text{ g}$, $\sim 380\text{ mSv/año}$).
   - **Marte Lacustre/Deltaico (*Cráter Jezero*, $18.38^\circ\text{ N}$):** Escarpes vulcanoclásticos/deltaicos, atmósfera tenue de $\text{CO}_2$ ($0.6\text{ kPa}$, $0.38\text{ g}$, $\sim 230\text{ mSv/año}$).
3. **Comparación de Distribuciones a Escala Común $\ge 30\text{ m}$:**
   - Evaluar Pendiente ($^\circ$) y Relieve Local ($\text{m}$) a $30\text{ m/px}$ (con sensibilidad a $60\text{ m}$ y $90\text{ m}$) mediante **Wasserstein-1 ($W_1$)** y **Kolmogorov–Smirnov ($D_{\text{KS}}$)** con **2D Spatial Block Bootstrap** ($10 \times 10\text{ px}$, IC 95 %).
4. **Contraejemplos Positivos y Negativos Obligatorios:**
   - Demostrar tanto **qué sí se parece** (*Salar de Pajonales* `83b221fffffffff`, $W_1 = 0.77^\circ$ vs. Jezero) como **qué NO se parece** (*Control Yungay* `83b220fffffffff`, $W_1 = 4.13^\circ$ por ser una planicie aluvial plana) y por qué la Tierra nunca reproduce $\mathbf{B}$.
