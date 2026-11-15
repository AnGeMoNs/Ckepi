# CKEPI · Sal, cobre y azufre

Revisión V2 del 14 de noviembre de 2026. Sustituye la paleta celeste/gris/naranja anterior. El kit anterior se conserva en `docs/design/brand-v1/CKEPI-brand-kit-v1.zip`.

## Dirección

Papel mineral sobre noche azul: nombre crema, capas de sal y azufre pálido, cobre luminoso. El contraste cálido sobre los fondos azules crea jerarquía. El cristal se utiliza en superficies de información; el papel recortado, en la identidad y escenas. Los mapas científicos conservan su contenido y sus fuentes.

Inspiración territorial: USGS describe la periferia blanca del Salar de Atacama como material rico en arcillas y carbonatos: https://eros.usgs.gov/earthshots/salar-de-atacama-chile . La selección de hexadecimales es una propuesta estética del equipo; no una extracción espectral ni prueba científica. No se afirma que esta combinación sea universalmente la más atractiva.

## Colores de marca

| Papel | Hex | Uso |
|---|---|---|
| Noche mineral | `#101F24` | Base oscura y cristal |
| Tinta de roca | `#183A3A` | Nombre/texto en claro |
| Sal cálida | `#FFF2D7` | Nombre y capa exterior |
| Azufre pálido | `#E4ED83` | Acción principal, capa intermedia y punto |
| Cobre luminoso | `#E8A080` | Capa interior y acento secundario |
| Papel claro | `#F7F1E4` | Fondo del tema claro |

En el tema claro, el acento interactivo es oliva oscuro `#4F5B13`, con texto crema; los colores pálidos se reservan para rellenos. El logo claro usa contornos oscuros `#245953`, `#626D12`, `#9C422D`, para no perderse sobre papel. Los nombres heredados `earth`, `moon`, `mars` en el JSON y Tailwind son alias compatibles de marca, no colores físicos de planetas ni escala científica.

## Logo y formatos

- `paper-cut/ckepi-symbol-paper-master.png`: símbolo raster generado con `image_gen`, transparencia real y textura de cartulina. Original 1254×1254.
- `paper-cut/ckepi-symbol-paper-transparent.webp`: versión web con transparencia.
- Los 24 nombres existentes en `svg/`, `png/`, `webp/`, `jpg/` y los iconos se regeneraron con V2. Las composiciones oscuras en color incluyen el símbolo de papel; las claras y monocromas conservan geometría vectorial plana para legibilidad.
- **SVG oscuro a color es híbrido:** incrusta el WebP generado y conserva las letras como trazos vectoriales. El símbolo incrustado tiene resolución finita; no es un vector puro. Para ampliación sin límite y una tinta, usar las variantes monocromas vectoriales.
- Las letras conservan su construcción propia y tienen una pequeña capa inferior para sugerir grosor de papel.
- La Home consume el WebP horizontal V2; evita descargar el PNG maestro. En capturas de piezas con el símbolo generado, debe verse `AI-generated · Ckepi`.

El emblema mantiene tres contornos C abiertos y un punto de observación. Ningún elemento reproduce insignias de NASA u otra institución. Los colores no sustituyen etiquetas, iconos o unidades.

## Cristal

`Card` utiliza `.ckepi-glass`: relleno al 94 %, desenfoque de 12 px y reflejo fino superior. La transparencia es deliberadamente acotada para que el texto mantenga contraste sobre ilustraciones brillantes. Existe fondo opaco de respaldo y se respeta `prefers-reduced-transparency`. Evitar animar blur, aplicarlo a mapas completos o añadir brillos a cada control. El rendimiento en dispositivos debe revisarse antes de publicar.

## Contraste y límites

Las mediciones reproducibles están en `contrast-v2.json`. Se calculan las combinaciones de texto, acento y estados sobre las superficies claras y oscuras, y el cristal sobre fondos extremos blanco/negro. El umbral de referencia es 4.5:1 para texto normal y 3:1 para texto grande, según W3C: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html . Las mediciones de tokens no certifican toda la aplicación; componentes con opacidades propias, estados o colores locales requieren comprobación en pantalla.

## Procedencia

Dirección artística del usuario, generación del símbolo con OpenAI `image_gen` a partir del símbolo geométrico anterior, composición de letras y exportaciones programadas con asistencia de Codex. La versión de modelo no está expuesta por la herramienta. Código y activos del kit siguen la licencia Apache-2.0 raíz; no implica exclusividad de marca registrada.
