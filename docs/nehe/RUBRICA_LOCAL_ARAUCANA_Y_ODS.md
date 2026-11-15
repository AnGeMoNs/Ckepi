---
name: rubrica-local-araucana
description: >-
  Audita el proyecto y el pitch presencial de 3 min bajo la rúbrica local de Antofagasta (UCN / UA /
  Caja La Araucana): (1) los 5 criterios oficiales NASA (Impact, Creativity, Validity, Relevance,
  Presentation) aterrizados al jurado presencial; (2) verificación de la Demo Básica Mobile-First
  (320px-4K, áreas táctiles >= 44px, voz Web Speech API, modo accesible); y (3) cumplimiento de los
  4 ejes oficiales de Caja La Araucana (Ciencia de Frontera, STEAM y Empleabilidad, Aplicación Local,
  Red Interregional) y sus metas ODS verificadas sin cifras inventadas.
---

# Skill · Rúbrica Local Antofagasta: 5 Criterios NASA + Demo Mobile-First + Ejes Caja La Araucana

## Fuentes de verdad en el repositorio
- Contexto estratégico y jurado local: [`CONTEXTO_DANI.md`](../../../CONTEXTO_DANI.md) (si está presente localmente) y [`docs/PLAN_MAESTRO.md`](../../../docs/PLAN_MAESTRO.md)
- Guion de pitch presencial (3 min + Q&A 20 s): [`docs/SUBMISSION_PACK_EN.md`](../../../docs/SUBMISSION_PACK_EN.md) §4
- Componentes UI de impacto local y accesibilidad:
  - [`frontend/src/components/mission/LaAraucanaImpactPanel.tsx`](../../../frontend/src/components/mission/LaAraucanaImpactPanel.tsx)
  - [`frontend/src/components/mission/MissionDiagnostics.tsx`](../../../frontend/src/components/mission/MissionDiagnostics.tsx)
  - [`frontend/src/pages/ExplorerPage.tsx`](../../../frontend/src/pages/ExplorerPage.tsx)

---

## Tesis Oficial del Problema, Propuesta de Valor e Innovación (Base Obligatoria del Pitch y Evaluación)

Antes de puntuar los 5 criterios, verifica que todo entregable mantenga exactamente este encuadre honesto y riguroso:
- **¿El problema es real?** **Sí.** NASA reconoce que los análogos terrestres no están completamente caracterizados y que existen oportunidades para identificar nuevos lugares útiles para la exploración espacial. La comparación requiere integrar datos científicos y comprender las limitaciones de cada terreno.
- **¿Es importante y afecta a las personas?** **Sí.** Afecta principalmente a **investigadores e ingenieros** que necesitan información para preparar ensayos. También existe una **oportunidad educativa**: acercar estos conocimientos a estudiantes y personas sin experiencia científica mediante herramientas comprensibles y accesibles.
- **Propuesta de Valor:** **Ckepi** busca facilitar comparaciones científicas transparentes, orientar investigaciones preliminares y permitir que más personas aprendan con datos espaciales. Además, estudia sectores poco caracterizados de **Antofagasta y otras regiones** para identificar nuevas oportunidades de investigación.
- **Propuesta de Innovación (Frase Ancla):**
  > *«No queremos demostrar que Atacama es idéntico a Marte. Queremos mostrar qué características comparte, qué diferencias existen y qué nuevos lugares merecen ser estudiados utilizando evidencia científica.»*

---

## Parte 1 · Evaluación de los 5 Criterios Oficiales NASA (Lente Jurado Local Antofagasta)

Puntúa cada criterio de **1 a 5** exigiendo evidencia concreta en código, UI y discurso:

| # | Criterio Oficial | Qué busca el Jurado Local (UCN + UA + Caja La Araucana) | Evidencia obligatoria en Ckepi |
|---|---|---|---|
| **1** | **Impact** *(Impacto)* | ¿Resuelve un problema real para misiones espaciales **y** genera valor educativo/productivo tangible para las familias, jóvenes y trabajadores de la Región de Antofagasta? | Preselección cuantitativa de sitios para pruebas de rovers/sensores en Antofagasta + módulo accesible *"Tres Mundos en tu Mano"* con voz para aulas y hogares sin barrera técnica. |
| **2** | **Creativity** *(Creatividad)* | ¿Qué aporta de verdaderamente original frente a los mapas turísticos o promedios globales de "Atacama = Marte"? | Descomposición causal $\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$ + comparación de distribuciones completas sobre DEM reales a $30\text{ m}$ ($W_1, D_{\text{KS}}$) que descubre que la celda poco estudiada **`83b224fffffffff` ($W_1 = 0,54^\circ$)** se acerca más a las pendientes de Jezero que el control clásico de **Yungay ($W_1 = 3,32^\circ$)**, mientras que `83b221fffffffff` resulta demasiado abrupta ($W_1 = 6,92^\circ$). |
| **3** | **Validity** *(Validez Científica y Técnica)* | ¿Resiste las preguntas de físicos estadísticos/matemáticos/astropartículas (UCN/UA) y ciencias farmacéuticas (UCN)? ¿Funciona la app de verdad frente a ellos? | Distancias $W_1$ y $D_{\text{KS}}$ sobre DEM reales (`NASA MRO CTX DEM` vs. `ESA Copernicus GLO-30`) con *bootstrap* por bloques 2D ($\text{IC } 95\%$), sensibilidad $30/60/90\text{ m}$, y declaración explícita de la Brecha Física Irreducible $\mathbf{B}$ ($0,38\text{ g}$, $0,6\text{ kPa }\text{CO}_2$, $230\text{ mSv/año}$). |
| **4** | **Relevance** *(Relevancia al Desafío)* | ¿Responde literal y completamente al desafío *"Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars"* con datos NASA en el núcleo? | Compara simultáneamente **Tierra, Luna y Marte** en todas las vistas (Globo 3D NASA Trek, malla H3, tabla verificada NSSDCA, motor causal y distribuciones reales a $30\text{ m}$). |
| **5** | **Presentation** *(Presentación y Demo en Vivo)* | ¿La historia de 3 minutos engancha en los primeros 15 segundos, muestra el producto funcionando en vivo y responde el Q&A en $\le 20\text{ s}$? | Guion cronometrado en [`docs/SUBMISSION_PACK_EN.md`](../../../docs/SUBMISSION_PACK_EN.md) §4 + deck prototipo de 7 slides ([`docs/DEMO_7_SLIDES_PROTOTYPE.html`](../../../docs/DEMO_7_SLIDES_PROTOTYPE.html)) + app responsive en vivo. |

---

## Parte 2 · Checklist de la Demo Básica Mobile-First (`320px` $\to$ `4K`)

El jurado local ve y prueba la aplicación en teléfonos móviles y proyectores durante el Demo Day. Verifica cada ítem:

1. **Adaptabilidad Mobile-First (`320px` de ancho mínimo):**
   - Sin desbordamiento horizontal (`overflow-x-hidden`) en pantallas de `320px` a `375px`.
   - Navegación entre paneles (Mapa H3 / Diagnóstico Causal / Distribuciones 30 m / Tres Mundos / Impacto Local) accesible con una sola mano en móvil.
2. **Áreas Táctiles Accesibles ($\ge 44\times 44\text{ px}$):**
   - Todos los botones interactivos, selectores de cuerpo celeste (Luna / Marte), presets de misión y controles de voz cumplen tamaño táctil mínimo de `44px` (`min-h-[44px]`).
3. **Cero Estilos Inline Arbitrarios y Tipado Estricto:**
   - Ejecuta:
     ```bash
     rg -n '\bany\b' frontend/src --glob '*.ts*'
     rg -n 'style=\{\{' frontend/src
     cd frontend && npm run build
     ```
   - Ambos conteos deben ser `0` y el build debe compilar sin errores.
4. **Modo Accesible *"Tres Mundos para Todos"* + Lectura por Voz (`Web Speech API`):**
   - Verifica en [`LaAraucanaImpactPanel.tsx`](../../../frontend/src/components/mission/LaAraucanaImpactPanel.tsx) y [`MissionDiagnostics.tsx`](../../../frontend/src/components/mission/MissionDiagnostics.tsx):
     - Tabla comparativa Tierra / Luna / Marte con valores oficiales del **NASA NSSDCA Planetary Fact Sheet** y analogías cotidianas (*"una mochila de 10 kg pesa 1,7 kg en la Luna y 3,8 kg en Marte"*).
     - Botón de lectura en voz alta (`window.speechSynthesis`) funcional en español (`es-CL`/`es-ES`), portugués (`pt-BR`) e inglés (`en-US`).
     - Micro-retos interactivos de 15 segundos (*Retrieval Practice*) para niños, jóvenes y adultos mayores.

---

## Parte 3 · Auditoría de los 4 Ejes Estratégicos de Caja La Araucana y Metas ODS

Verifica que tanto la interfaz ([`LaAraucanaImpactPanel.tsx`](../../../frontend/src/components/mission/LaAraucanaImpactPanel.tsx)) como el discurso presencial cubran los **4 ejes verificados de Caja La Araucana** sin inventar programas ni cifras no documentadas:

| # | Eje Estratégico Caja La Araucana | Cómo lo materializa Ckepi en Antofagasta | Estado (`PASS`/`FAIL`) |
|---|---|---|---|
| **1** | **Ciencia de Frontera Democratizada** | Transforma telemetría orbital compleja de NASA (`LOLA`, `MOLA`, `CTX DEM`, `MEDA`, `RAD`) y `Copernicus GLO-30` en una plataforma web abierta (`Apache-2.0`), gratuita, trilingüe (`ES`/`PT`/`EN`) y con lectura por voz para cualquier colegio, liceo técnico o familia sin requerir licencias de software SIG privativo. | Verificar en UI y pitch |
| **2** | **Competencias STEAM y Empleabilidad** | Entrena habilidades de alta demanda en la Región de Antofagasta: ciencia de datos geoespaciales (`H3`, `DuckDB`, `GeoParquet`), estadística espacial no paramétrica ($W_1$, $D_{\text{KS}}$, *bootstrap* 2D) y evaluación de terreno para **teleoperación de rovers y robótica minera autónoma**, además de perfiles comunitarios de **astro-geoturismo científico**. | Verificar en UI y pitch |
| **3** | **Aplicación Local Territorial** | Pone en valor el territorio de la Región de Antofagasta con rigor físico sobre DEM reales a $30\text{ m}$ (`docs/RESULTADOS_TERRENO_REALES.md`): preselecciona la celda poco estudiada **`83b224fffffffff` ($W_1 = 0,54^\circ$)** frente al control clásico de **Yungay ($W_1 = 3,32^\circ$)** y muestra por qué **`83b221fffffffff` ($W_1 = 6,92^\circ$)** y **`83b225fffffffff` ($W_1 = 1,71^\circ$)** no se parecen en pendiente. | Verificar en UI y pitch |
| **4** | **Red Interregional de Innovación (*Lattices*)** | Conecta el nodo Antofagasta (UCN, UA, ecosistema regional impulsado por Caja La Araucana) con universidades de otras regiones de Chile y catálogos abiertos de agencias espaciales globales (`NASA`, `ESA`, `CSA`, `JAXA`) mediante formatos estándar exportables (`.md`, `.csv`, `.geojson`). | Verificar en UI y pitch |

### Metas ODS Oficiales Declaradas por Caja La Araucana para Space Apps (`4.3, 4.4, 9.5, 17.3, 17.16, 17.17` + `8, 10, 13`)
Comprueba que tanto en [`LaAraucanaImpactPanel.tsx`](../../../frontend/src/components/mission/LaAraucanaImpactPanel.tsx) como en el pitch de 3 minutos y en las 7 slides se citen con exactitud las **6 metas ODS específicas que Caja La Araucana declara oficialmente para NASA Space Apps**, además de los ODS complementarios verificados en [`REFERENCES.md`](../../../REFERENCES.md) §5 y [`docs/DATA_PROVENANCE.md`](../../../docs/DATA_PROVENANCE.md) §1.5:

| ODS y Meta Específica | Definición Oficial ONU / Caja La Araucana | Cómo la cumple Ckepi en la Sede Antofagasta |
|---|---|---|
| **ODS 4 · Meta `4.3`** *(Educación de Calidad)* | Asegurar el acceso igualitario de todos los hombres y las mujeres a una formación técnica, profesional y superior de calidad, incluida la enseñanza universitaria. | Plataforma web libre (`Apache-2.0`), sin barrera de pago ni instalación, que acerca datos orbitales reales de NASA/ESA a liceos técnicos, colegios públicos y estudiantes de UCN/UA en Antofagasta. |
| **ODS 4 · Meta `4.4`** *(Competencias para el Empleo)* | Aumentar considerablemente el número de jóvenes y adultos que tienen las competencias necesarias, en particular técnicas y profesionales, para acceder al empleo, el trabajo decente y el emprendimiento. | Módulo progresivo *"Tres Mundos en tu Mano"* (3 niveles + voz `Web Speech API`) y formación práctica en ciencia de datos geoespaciales (`H3`, `DuckDB`), estadística a $30\text{ m}$ ($W_1, D_{\text{KS}}$) y evaluación de terrenos para robótica minera/espacial. |
| **ODS 9 · Meta `9.5`** *(Investigación Científica e Innovación)* | Aumentar la investigación científica y mejorar la capacidad tecnológica de los sectores industriales de todos los países, fomentando la innovación. | Caracterización cuantitativa a $30\text{ m}$ de sectores poco estudiados en la Región de Antofagasta (celda **`83b224fffffffff`, $W_1 = 0,54^\circ$**) frente al control clásico de **Yungay ($W_1 = 3,32^\circ$)** para preselección de estudios de movilidad y sensores. |
| **ODS 17 · Meta `17.3`** *(Movilización de Recursos para Ciencia)* | Movilizar recursos financieros adicionales de múltiples fuentes para el desarrollo científico y tecnológico regional. | Modelo sostenible gratuito para quien aprende, financiable mediante nodos territoriales patrocinados, fondos concursables (CORFO Semilla, Caja La Araucana, MinCiencia) y servicios técnicos para instituciones. |
| **ODS 17 · Meta `17.16`** *(Alianza Mundial Multi-Actor)* | Mejorar la Alianza Mundial para el Desarrollo Sostenible, complementada por alianzas entre múltiples interesados que movilicen e intercambien conocimientos, capacidad técnica y tecnología. | Red interregional (*Lattices*) que articula catálogos abiertos internacionales (`NASA`, `ESA`, `CSA`, `JAXA`) con universidades regionales (UCN, UA) bajo principios `FAIR` / `NASA TOPS`. |
| **ODS 17 · Meta `17.17`** *(Alianzas Público-Privadas y Sociedad Civil)* | Fomentar y promover la constitución de alianzas eficaces en las esferas pública, público-privada y de la sociedad civil. | Vinculación directa entre **Caja La Araucana**, academia regional, comunidades locales de Atacama (astro-geoturismo y custodia de sitios) e industria tecnológica. |
| **ODS 8, ODS 10 y ODS 13** *(Empleabilidad, Reducción de Brechas y Acción por el Clima)* | Trabajo decente y crecimiento regional (ODS 8), reducción de brechas digital/territorial/etaria mediante diseño para baja alfabetización digital con voz (ODS 10) y reducción de huella logística de campañas en terreno mediante preselección satelital a $30\text{ m}$ (ODS 13). | Tarjetas imprimibles, lectura por voz sin requerir teclado, y optimización previa en gabinete antes de movilizar expediciones. |

- **Regla de honestidad innegociable:** Confirmar que **no se inventen** años de memorias, convenios firmados ni estadísticas internas no verificadas de Caja La Araucana.

---

## Formato de Salida del Auditor Local
Entrega un cuadro de mando con:
1. Puntaje `1–5` en cada uno de los 5 criterios NASA bajo la mirada del jurado local (`/25`).
2. Estado `PASS/FAIL` de los 4 checks de la **Demo Básica Mobile-First**.
3. Puntaje `1–5` en los **4 Ejes de Caja La Araucana** (`/20`) + verificación de Metas ODS.
4. Tres mejoras accionables en $\le 30\text{ min}$ para maximizar el impacto en vivo en Antofagasta.
