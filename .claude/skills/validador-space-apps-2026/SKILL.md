---
name: validador-space-apps-2026
description: >-
  Valida un producto, idea, página de proyecto, demo de 7 slides o pitch para NASA Space Apps Challenge 2026
  contra la rúbrica oficial (Impact, Creativity, Validity, Relevance, Presentation; escala 1–5),
  las 12 puertas duras de elegibilidad (inglés, demo ≤30 s o ≤7 slides, links públicos, datos NASA con
  precisión, citas legales Open Science de datos/código/imágenes/tipografías/íconos, licencia OSI,
  reglas de IA y marca de agua, menores de 18, marcas NASA, política China), la rúbrica científica a
  escala >= 30 m (W_1, KS, bootstrap 2D, casos positivos y negativos, 0.38 g, 0.6 kPa CO2, radiación,
  temperatura) y la rúbrica local de Antofagasta / Caja La Araucana.
---

# Skill · Validador Maestro Space Apps 2026 (Global + Científico 30 m + Local Caja La Araucana)

## Fuentes de verdad reales en el repositorio (leer antes de evaluar)
- Plan Maestro y reglas de honestidad científica: [`docs/PLAN_MAESTRO.md`](../../../docs/PLAN_MAESTRO.md) y [`AGENTS.md`](../../../AGENTS.md)
- Paquete de envío en inglés y pitch local de 3 min: [`docs/SUBMISSION_PACK_EN.md`](../../../docs/SUBMISSION_PACK_EN.md)
- Deck prototipo de 7 slides en inglés: [`docs/DEMO_7_SLIDES_EN.md`](../../../docs/DEMO_7_SLIDES_EN.md) y [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html)
- Identidad visual de marca y licencias gráficas: [`docs/BRAND_IDENTITY.md`](../../../docs/BRAND_IDENTITY.md)
- Proveniencia de datos, referencias legales e IA: [`docs/DATA_PROVENANCE.md`](../../../docs/DATA_PROVENANCE.md), [`REFERENCES.md`](../../../REFERENCES.md), [`CITATION.cff`](../../../CITATION.cff), [`AI_DISCLOSURE.md`](../../../AI_DISCLOSURE.md)
- Formato de salida obligatorio: [`plantilla_scorecard.md`](plantilla_scorecard.md)

## Sub-Skills Especializadas que DEBES invocar o aplicar en paralelo
1. **Auditoría Global (Inglés, 7 Slides, Links Públicos, Legal Open Science, Marca e IA):**
   - [`.claude/skills/auditoria-global-ingles-legal-nasa/SKILL.md`](../auditoria-global-ingles-legal-nasa/SKILL.md)
2. **Rúbrica Científica ($\ge 30\text{ m}$, $W_1$, $D_{\text{KS}}$, Bootstrap 2D, Casos Positivos/Negativos, $0.38\text{ g}$, $0.6\text{ kPa }\text{CO}_2$, Radiación, Temperatura y Datos en Disco):**
   - [`.claude/skills/rubrica-cientifica-30m/SKILL.md`](../rubrica-cientifica-30m/SKILL.md)
3. **Rúbrica Local Antofagasta (5 Criterios NASA + Demo Básica Mobile-First + 4 Ejes Caja La Araucana):**
   - [`.claude/skills/rubrica-local-araucana/SKILL.md`](../rubrica-local-araucana/SKILL.md)

---

## Principios
1. **Evidencia o no cuenta.** Cada puntaje cita un archivo, línea, endpoint, componente UI o frase verificable del repositorio. Si no lo puedes ver, márcalo como *no verificado* y no lo puntúes por encima de 2.
2. **Lee como juez, no como equipo.** El juez global tiene minutos, no tiene contexto previo y evalúa en inglés.
3. **Primero las puertas duras (`G1–G12`) y las 4 compuertas científicas.** Un 5 en narrativa no sirve si falta una cita legal o si se reclama un dato que no está en disco.
4. **Honradez física innegociable:** Nunca "idéntico a la Luna/Marte". Siempre reportar qué sí se parece (y a qué escala en metros), qué NO se parece (con contraejemplos reales) y por qué falla físicamente ($\mathbf{B}$).

---

## Procedimiento en 8 Pasos

### Paso 1 · Inventario de Entregables y Datos en Disco
Revisa qué se está evaluando (`README.md`, `docs/SUBMISSION_PACK_EN.md`, `docs/DEMO_7_SLIDES_EN.md`, `docs/DEMO_7_SLIDES_PROTOTYPE.html`, `backend/`, `frontend/`) y verifica qué datos existen físicamente en `backend/app/data/`.

### Paso 2 · Las 12 Puertas Duras de Elegibilidad Global (`PASA / FALLA / NO VERIFICADO`)
Aplica [`.claude/skills/auditoria-global-ingles-legal-nasa/SKILL.md`](../auditoria-global-ingles-legal-nasa/SKILL.md):
| # | Puerta Dura | Qué verificar exactamente |
|---|---|---|
| **G1** | Desafío oficial 2026 | Responde a *"Comparing the Three Worlds: Earth, Moon, and Mars"* (no "Create Your Own"). |
| **G2** | Equipo 1–6 personas | Misma sede (Antofagasta, Chile) y registrados en la pestaña *Members*. |
| **G3** | Campos obligatorios completos | High-Level Summary, Project Details, NASA Data, Space Agency Partner & Other Data, AI Disclosure, Links (`docs/SUBMISSION_PACK_EN.md`). |
| **G4** | Demo: Video **$\le 30\text{ s}$** o Deck **$\le 7\text{ slides}$** | Verificar que [`docs/DEMO_7_SLIDES_EN.md`](../../../docs/DEMO_7_SLIDES_EN.md) y [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html) tengan exactamente $\le 7$ diapositivas contando portada y créditos. |
| **G5** | **100 % Inglés** en entregables globales | Página de proyecto, 7 slides de prototipo, subtítulos de video y `frontend/src/i18n/en.json` íntegramente en inglés. |
| **G6** | **Links públicos sin login** | Repositorio, demo y slides accesibles en ventana privada sin pedir cuenta, contraseña ni permiso. |
| **G7** | Envío en plazo oficial | Antes del domingo 23:59 hora local de Chile (meta interna $\le 20:00$). |
| **G8** | **Al menos 1 dataset NASA con precisión** | Productos NASA citados con misión, instrumento, ID exacto, resolución y DOI: `MRO CTX DEM` de Jezero (núcleo del terreno), `LRO LOLA/Diviner`, `MGS MOLA`, `Mars 2020 MEDA`, `MSL RAD`, `NASA POWER`. NASADEM **no** se usa en esta versión. |
| **G9** | **Citas legales Open Science completas** | Datos (`Public Domain` / `CC BY 4.0`), código (`MIT`), imágenes/teselas (`NASA` / `OSM` / `CARTO`), tipografías (`SIL OFL-1.1`), íconos (`Lucide MIT/ISC`) e identidad visual en [`REFERENCES.md`](../../../REFERENCES.md) y [`docs/BRAND_IDENTITY.md`](../../../docs/BRAND_IDENTITY.md). |
| **G10** | Sin menores de 18 años identificables | Cero rostros, voces o nombres de menores en capturas, slides o video. |
| **G11** | **Reglas de IA, marcas de agua y cero logos NASA** | Declaración completa en [`AI_DISCLOSURE.md`](../../../AI_DISCLOSURE.md); si hay imágenes/videos de IA deben llevar marca de agua visible `"AI-Generated"`; cero logos de NASA (*Meatball*/*Worm*) en todo el proyecto. |
| **G12** | Licencia OSI y cumplimiento de agencias | Archivo [`LICENSE`](../../../LICENSE) (MIT) en raíz y cero datos/APIs/portales de CNSA. |

### Paso 3 · Puntaje Oficial 1–5 por Criterio (`Impact, Creativity, Validity, Relevance, Presentation`)
Para cada uno de los 5 criterios, reporta: **puntaje (1–5), evidencia verificada, qué falta para el 5 y arreglo concreto en $\le 1\text{ h}$**.

### Paso 4 · Compuerta Científica Rigurosa ($\ge 30\text{ m}$, Distribuciones, Incertidumbre y Límites Físicos)
Aplica [`.claude/skills/rubrica-cientifica-30m/SKILL.md`](../rubrica-cientifica-30m/SKILL.md) y marca ✅/⚠️/❌:
- **Al menos 1 comparación real** (ej. **Cráter Jezero $\to$ Atacama**) remuestreada a **escala métrica común $\ge 30\text{ m}$** ($30\text{ m}$, con sensibilidad a $60\text{ m}$ y $90\text{ m}$) y **unidades explícitas en metros ($\text{m}$) y grados ($^\circ$)**.
- **Distancias estadísticas definidas sobre distribuciones completas:** **Wasserstein-1 ($W_1$)** y **Kolmogorov–Smirnov ($D_{\text{KS}}$)** en Pendiente ($^\circ$) y Relieve Local ($\text{m}$).
- **Incertidumbre espacialmente válida:** Intervalos de confianza al 95 % mediante **2D Spatial Block Bootstrap** ($10 \times 10\text{ px}$, $B=200$).
- **Qué SÍ se parece vs. ejemplos de qué NO se parece y POR QUÉ:**
  - *Positivo:* la celda **`83b224fffffffff`** («Pampa Central») se parece a Jezero en pendiente a 30 m con DEM reales ($W_1 = 0.54^\circ$, IC 95 % 0,40–0,65°, estable a 60 y 90 m). Fuente única: `docs/RESULTADOS_TERRENO_REALES.md`.
  - *Negativo:* la celda **`83b221fffffffff`** («Salar de Pajonales», 4.200–5.270 m) es mucho más abrupta ($W_1 = 6.92^\circ$); el control **Yungay** se aleja más que `83b224` ($W_1 = 3.32^\circ$) por su cola de laderas fuertes. Las cifras 0,77° y 4,13° venían del DEM sintético y están retiradas.
  - *Negativo físico irreducible ($\mathbf{B}$):* Ningún sitio terrestre reproduce la gravedad marciana (**$0.38\text{ g}$**) o lunar (**$0.166\text{ g}$**), la atmósfera marciana de **$\text{CO}_2$ a $\sim 0.6\text{ kPa}$ ($6.1\text{ mbar}$)** o el vacío lunar ($0\text{ kPa}$), la radiación ionizante superficial (**$\sim 230\text{ mSv/año}$ en Marte**, **$\sim 380\text{ mSv/año}$ en la Luna** vs. $2.4\text{ mSv/año}$ en la Tierra), ni la oscilación térmica $\Delta T$ ($80\text{--}100\text{ K}$ en Marte, $290\text{ K}$ en la Luna).
- **Honestidad de datos disponibles en disco:** la comparación usa ventanas reales (`backend/app/data/derived/terrain_windows_30m.*`); cualquier otra combinación sale rotulada `SYNTHETIC` y no debe presentarse como medición.

### Paso 5 · Lente Local Antofagasta, Demo Básica Mobile-First y Caja La Araucana
Aplica [`.claude/skills/rubrica-local-araucana/SKILL.md`](../rubrica-local-araucana/SKILL.md):
- **Demo Básica Mobile-First:** Responsive `320px` $\to$ `4K`, botones $\ge 44\text{ px}$, `0 any`, `0 style={{}}`, modo *"Tres Mundos en tu Mano"* con lectura por voz (`Web Speech API`).
- **4 Ejes Oficiales de Caja La Araucana (1–5 cada uno):**
  1. *Ciencia de frontera democratizada*
  2. *Competencias STEAM y empleabilidad*
  3. *Soluciones con aplicación local (Antofagasta)*
  4. *Red interregional de innovación (Lattices)*
- **Metas ODS verificadas:** `4.3, 4.4, 8, 9.5, 10, 13, 17.3, 17.16, 17.17` (sin cifras inventadas).

### Paso 6 · Verificación de las 7 Slides de Demo Prototipo
Revisa que [`docs/DEMO_7_SLIDES_EN.md`](../../../docs/DEMO_7_SLIDES_EN.md) y [`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html) estén listas para presentar o exportar a PDF sin depender de conexión externa.

### Paso 7 · Premios Globales Objetivo
Evalúa el posicionamiento para **Best Use of Science**, **Best Use of Data** y **Local Impact / Galactic Impact**.

### Paso 8 · Veredicto Final
Entrega el scorecard completo usando [`plantilla_scorecard.md`](plantilla_scorecard.md) y cierra con el veredicto: **"Enviar / Arreglar antes de enviar / Replantear"**.
