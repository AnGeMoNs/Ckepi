# Ckepi — Identidad Visual de Marca V2 («Sal, Cobre y Azufre»), Citas Legales Open Science y Guía de Declaración de IA (`Gate G11`)

> **Revisión activa, 14 de noviembre de 2026: SAL, COBRE Y AZUFRE (Identidad V2).**  
> **Guía y activos en `docs/nehe/`:** [`brand_and_backgrounds/IDENTIDAD_V2.md`](brand_and_backgrounds/IDENTIDAD_V2.md) y [`brand_and_backgrounds/CKEPI-brand-board.png`](brand_and_backgrounds/CKEPI-brand-board.png).  
> **Proyecto:** Ckepi — Motor de Descubrimiento de Análogos Planetarios y Descomposición Causal ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$)  
> **Equipo:** Lattices Team (Antofagasta, Chile — NASA Space Apps Challenge 2026)  
> **Estándar:** NASA Open-Source Science (`SPD-41a` / `TOPS` / `FAIR`) & WCAG 2.1 AA

---

## 1. Esencia de Marca e Identidad V2 («Sal, Cobre y Azufre»)

**CKEPI** vincula la comparación planetaria rigurosa con el aprendizaje accesible desde el Desierto de Atacama. Su dirección visual V2 es **papel mineral recortado por capas sobre un paisaje nocturno azul**:
- **Símbolo:** Tres contornos en **C** abiertos y un punto de observación independiente (representan observación comparativa entre Tierra, Luna y Marte; **cero insignias ni logos de NASA o terceros**).
- **Inspiración territorial:** El USGS describe la periferia blanca del Salar de Atacama como material rico en arcillas y carbonatos (`https://eros.usgs.gov/earthshots/salar-de-atacama-chile`). La selección de colores hexadecimales es una propuesta estética del equipo humano, no una extracción espectral ni una medición científica.

### Paleta Oficial V2 (`tokens.json` y `contrast-v2.json`)

| Rol Visual | Color Hex | Uso en la App y en las Diapositivas (`.pptx` / `.pdf` / `.html`) |
|---|---|---|
| **Noche mineral (`space`)** | `#101F24` | Base oscura principal, velo de contraste en diapositivas (`84%`) y superficies de cristal (`.ckepi-glass`). |
| **Tinta de roca (`ink`)** | `#183A3A` | Tarjetas destacadas, bordes minerales y texto sobre fondo claro. |
| **Sal cálida (`earth` / `paper`)** | `#FFF2D7` | Nombre `CKEPI`, títulos principales, texto en modo oscuro y capa exterior del símbolo. |
| **Azufre pálido (`moon`)** | `#E4ED83` | Acción principal, subtítulos/kickers, fórmulas y capa intermedia del símbolo. |
| **Cobre luminoso (`mars`)** | `#E8A080` | Capa interior del símbolo, acento secundario y alertas de frontera física $\mathbf{B}$. |
| **Papel claro** | `#F7F1E4` | Fondo del tema claro (con acento interactivo oliva oscuro `#4F5B13`). |

---

## 2. Logos Oficiales y Fondos Paper-Cut para Presentaciones (`docs/nehe/brand_and_backgrounds/`)

Todos los archivos listos para insertar en PowerPoint, Canva o Google Slides están en [`docs/nehe/brand_and_backgrounds/`](brand_and_backgrounds/):

1. **Logos en el Producto Web (100 % Vectoriales, CERO IA):**
   - [`ckepi-horizontal-vector-dark.svg`](brand_and_backgrounds/ckepi-horizontal-vector-dark.svg) y [`ckepi-vector-512.png`](brand_and_backgrounds/ckepi-vector-512.png): Dibujados íntegramente por código geométrico con los colores V2 (`#FFF2D7`, `#E4ED83`, `#E8A080`). Usados en el favicon, el Header y la aplicación web. **No contienen imagen generada por IA.**
2. **Logos Híbridos Paper-Cut para Presentaciones y Láminas:**
   - [`ckepi-horizontal-color-dark.png`](brand_and_backgrounds/ckepi-horizontal-color-dark.png), [`ckepi-horizontal-color-light.png`](brand_and_backgrounds/ckepi-horizontal-color-light.png), [`ckepi-symbol-color-dark.png`](brand_and_backgrounds/ckepi-symbol-color-dark.png) y [`CKEPI-brand-board.png`](brand_and_backgrounds/CKEPI-brand-board.png): Combinan letras vectoriales con el símbolo de textura de cartulina generado con IA (`OpenAI image_gen` vía Codex bajo dirección artística del equipo). **Siempre que se muestren en diapositivas o capturas, llevan visible la etiqueta `AI-generated · Ckepi`.**
3. **Fondos Paper-Cut 16:9 para las 7 Diapositivas (con Velo `#101F24` y Marca de Agua Visible):**
   - Originales WebP (`2560×1440`): `ckepi-home-desktop.webp`, `ckepi-el-problema-desktop.webp`, `ckepi-que-hace-ckepi-desktop.webp`, `ckepi-explorador-desktop.webp`, `ckepi-el-hallazgo-desktop.webp`, `ckepi-el-limite-honesto-desktop.webp`.
   - **Listos para PowerPoint (`1920×1080 PNG` con velo oscuro `#101F24` al 84 % para contraste WCAG AA y marca de agua `AI-generated background & symbol · Ckepi` en la esquina inferior derecha):**
     - [`slide1_home_ppt_bg.png`](brand_and_backgrounds/slide1_home_ppt_bg.png) (Slide 1: Portada)
     - [`slide2_problema_ppt_bg.png`](brand_and_backgrounds/slide2_problema_ppt_bg.png) (Slide 2: El Problema)
     - [`slide3_solucion_ppt_bg.png`](brand_and_backgrounds/slide3_solucion_ppt_bg.png) (Slide 3: Qué Hace Ckepi)
     - [`slide4_ciencia_ppt_bg.png`](brand_and_backgrounds/slide4_ciencia_ppt_bg.png) (Slide 4: Descomposición Causal y Datos NASA)
     - [`slide5_hallazgo_ppt_bg.png`](brand_and_backgrounds/slide5_hallazgo_ppt_bg.png) (Slide 5: Hallazgo Real a 30 m y Brecha $\mathbf{B}$)
     - [`slide6_araucana_ppt_bg.png`](brand_and_backgrounds/slide6_araucana_ppt_bg.png) (Slide 6: 4 Ejes Caja La Araucana y ODS)
     - [`slide7_creditos_ppt_bg.png`](brand_and_backgrounds/slide7_creditos_ppt_bg.png) (Slide 7: Créditos y Declaración de IA)

---

## 3. GUÍA PASO A PASO: Cómo Declarar la IA en Imágenes, Video, Logo y Código (Regla Oficial NASA `Gate G11`)

La regla de **Super Intelligence (SI) / AI** de NASA Space Apps 2026 **permite usar herramientas de IA**, siempre y cuando:
1. **La concepción científica e innovación sean 100 % del equipo humano.**
2. **Se declare con total transparencia qué se hizo con IA** (en el formulario de envío, en la Slide 7 de Créditos y en [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md)).
3. **Toda imagen o video generado con IA lleve una marca de agua o etiqueta visible en pantalla** (`"AI-generated video"` / `"AI-generated · Ckepi"`), y **jamás se presente arte decorativo generado con IA como si fuera un mapa científico o dato orbital de NASA**.
4. **Cero logos o insignias de NASA** generados o incluidos en cualquier parte.

### Qué hicimos exactamente y cómo está declarado y protegido:

| Elemento del Proyecto | ¿Usa IA Generativa? | Cómo está marcado en pantalla (Watermark) | Qué decir/escribir al declararlo |
|---|---|---|---|
| **1. Mapas 3D (Luna/Marte), Malla H3, Gráficos de Pendiente/Relieve a 30 m y Diagramas Excalidraw** | **❌ NO (0 % IA generativa)** | No aplica (son datos científicos reales renderizados por código). | *"All planetary globes, H3 hexagonal grids, and 30 m DEM statistical distributions are rendered deterministically from official NASA MRO CTX and ESA Copernicus GLO-30 datasets—zero generative AI is used in scientific visualizations."* |
| **2. Logo en la Aplicación Web (`ckepi-*-vector-dark.svg` / `ckepi-vector-*.png`)** | **❌ NO (Vector geométrico puro por código)** | No requiere marca de agua en el favicon/header vectorial. | *"The logo used inside the web application and favicon is pure programmatic vector geometry (`ckepi-*-vector-dark.svg`) with the V2 Salt, Copper & Sulfur palette."* |
| **3. Símbolo Paper-Cut Raster (`ckepi-symbol-paper-master.png`) y 12 Fondos Decorativos Paper-Cut (`ckepi-*-desktop/mobile.webp`)** | **✅ SÍ (`OpenAI image_gen` vía Codex bajo dirección artística de Dani)** | En la web (`PaperCutBackground.tsx`) y en la esquina inferior derecha de cada slide del `.pptx`/`.pdf` aparece la etiqueta visible: **`AI-generated · Ckepi`** / **`AI-generated background & symbol · Ckepi`**. | *"Twelve decorative layered-paper backgrounds and the raster paper-texture brand symbol were generated using OpenAI `image_gen` via Codex under the human team's art direction. They represent artistic dioramas (never scientific terrain) and display a persistent visible `'AI-generated · Ckepi'` attribution."* |
| **4. Video Decorativo de Fondo en el Home (`ckepi-home.mp4` / `.webm`)** | **✅ SÍ (`Google Gemini Video Generation` bajo dirección artística de Dani)** | Mientras el video se reproduce en el Home (`HomePage.tsx`), muestra en pantalla una etiqueta fija: **`«Video generado con IA»` / `«AI-generated video»`**. | *"The decorative paper-cut loop video on the Home intro screen (`ckepi-home.mp4`/`.webm`) was generated with Google Gemini video generation from the team's art prompt (`docs/PROMPT_HOME_CKEPI.md`), contains no audio or institutional logos, and displays a permanent `'AI-generated video'` watermark on screen."* |
| **5. Código, Estadística SciPy, Documentación y Traducción `ES/PT/EN` (842 claves)** | **✅ SÍ (Asistencia de código con `Claude Code`, `OpenAI Codex/GPT` y `Google Antigravity`)** | Declarado en `AI_DISCLOSURE.md`, `README.md`, Slide 7 y formulario de envío. | *"The scientific architecture (X → Y ∥ B causal decomposition and 30 m DEM comparison) was 100% conceived by the human team. AI coding assistants (Claude Code, OpenAI Codex/GPT, Google Antigravity) accelerated software implementation, unit tests, documentation, and ES/PT/EN translation parity under human verification."* |

### Texto Exacto en Inglés para Copiar y Pegar en el Formulario Global de NASA Space Apps (Campo AI / Super Intelligence Disclosure):

> **Super Intelligence (AI) Disclosure:**  
> 1. **100% Human Scientific Conception:** The causal variable decomposition framework ($\mathbf{X} \to \mathbf{Y} \parallel \mathbf{B}$), the 30-meter common-scale spatial distribution pipeline ($W_1$, $D_{\text{KS}}$, 2D spatial block bootstrap), and the territorial research in Antofagasta were 100% conceived and directed by the human team (*Lattices Team*).  
> 2. **Code & Translation Assistance:** AI coding assistants (Claude Code, OpenAI Codex/GPT, and Google Antigravity) were used under human review to accelerate FastAPI/React implementation, SciPy statistical tests, documentation, and 842-key translation parity across English, Spanish, and Portuguese.  
> 3. **Decorative Visuals & Mandatory Watermarks:** All scientific maps, 3D globes, H3 layers, DEM plots, and the in-app vector logo (`ckepi-*-vector-dark.svg`) contain **zero generative AI**. Decorative paper-cut backgrounds and the raster paper-texture symbol (generated with OpenAI `image_gen` via Codex under human art direction) display a persistent visible **`"AI-generated · Ckepi"`** watermark, and the decorative Home intro loop (`ckepi-home.mp4`/`.webm`, generated with Google Gemini video generation) displays a persistent visible **`"AI-generated video"`** watermark. No NASA logos or third-party insignia are used anywhere in the project. Full details are documented in `AI_DISCLOSURE.md`.
