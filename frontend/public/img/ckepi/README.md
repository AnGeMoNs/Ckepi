# CKEPI · Kit de identidad visual

Identidad original propuesta para CKEPI, creada el 14 de noviembre de 2026 con asistencia de Codex mediante geometría vectorial programada. Pendiente de aprobación final del equipo. No incluye logos, insignias ni sellos de NASA u otras instituciones y no comunica afiliación institucional.

## Concepto

Tres contornos hexagonales abiertos forman una C: Tierra, Luna y Marte. La geometría alude a las celdas espaciales H3 y a curvas de cartografía. El punto exterior representa una observación o destino por explorar. Los contornos son una metáfora de marca, no mediciones, órbitas a escala ni una figura científica.

Las letras CKEPI son trazos propios convertidos en geometría SVG: no requieren fuentes, imágenes externas, servidores ni bibliotecas en el frontend. El color continúa la paleta propuesta en `docs/BRAND_IDENTITY.md`.

## Archivos y variantes

- `svg/`: 24 maestros editables y escalables, con título y descripción accesibles. Todo el lettering es vectorial.
- `png/`: las mismas 24 variantes; símbolo a 1024 px de ancho y composiciones a 1800 px. Las variantes sin fondo conservan transparencia.
- `webp/`: las 24 variantes en compresión sin pérdida y con transparencia cuando corresponde.
- `jpg/`: 8 variantes con fondo claro u oscuro para presentaciones, mensajería y documentos.
- `icons/`: iconos PNG de 16, 32, 48, 64, 128, 180, 192, 256, 512 y 1024 px, maestro SVG y favicon ICO multirresolución.
- `CKEPI-brand-board.png`: lámina para revisar la identidad.
- `tokens.json`: colores y parámetros de uso.
- `CKEPI-brand-kit.zip`: paquete completo para compartir.
- `generate.py`: fuente reproducible de las geometrías y exportaciones; requiere Python, Cairo y Pillow. No instalar dependencias para mostrar los activos.

Cuatro composiciones: `horizontal` (cabecera), `stacked` (portada), `symbol` (avatar/icono) y `wordmark` (solo nombre).

Cada una tiene seis versiones:

| Sufijo | Uso |
|---|---|
| `color-dark` | Color transparente con letras claras, para fondo oscuro |
| `color-light` | Color transparente con letras oscuras, para fondo claro |
| `mono-white` | Blanco transparente, fondos oscuros, grabado o impresión de una tinta |
| `mono-black` | Negro transparente, fondos claros, impresión de una tinta |
| `on-dark` | Color con fondo espacio incorporado |
| `on-light` | Color con fondo papel incorporado |

`dark` y `light` indican el fondo de destino. JPG siempre incorpora fondo. Las versiones en color sobre fondo claro son de uso de marca; para tamaños pequeños o cuando se requiera máximo contraste, usar monocromo negro.

## Paleta

| Nombre | Hex | Papel |
|---|---|---|
| Espacio | `#05070D` | Fondo principal |
| Tinta | `#132A38` | Nombre en modo claro |
| Tierra | `#38BDF8` | Contorno exterior |
| Luna | `#CBD5E1` | Contorno intermedio |
| Marte | `#FB923C` | Contorno interior |
| Papel | `#F5F2EB` | Fondo claro y nombre en oscuro |

## Reglas de uso

- Mantener proporciones y colores; no rotar, estirar, agregar sombras ni reconstruir las letras con otra fuente.
- Reservar al menos 24 unidades de espacio libre por cada 256 unidades de ancho del símbolo, fuera de su caja.
- Símbolo recomendado desde 32 px; logo horizontal desde 180 px. Los iconos de 16 y 24 px son de reconocimiento, no para leer detalles del símbolo.
- Usar una imagen con `alt="CKEPI"` cuando el logo sea informativo. Si repite un nombre adyacente, usar `alt=""`.
- Para favicon, PWA y apple-touch-icon usar los archivos de `icons/`; aún no se conectan al manifiesto o HTML de la aplicación.
- Las dimensiones en píxeles de PNG y JPG limitan su ampliación. Usar SVG para impresión de gran tamaño.

## Integración propuesta

Desde Vite, los activos son públicos en `/img/ckepi/`:

```html
<img src="/img/ckepi/svg/ckepi-horizontal-color-dark.svg" alt="CKEPI" width="900" height="280" />
```

Esta entrega agrega activos; la adopción en cabecera, manifiesto, pitch e iconos del navegador se realiza por separado.

## Autoría y declaración

Geometría e implementación preparadas con asistencia de IA bajo la dirección del usuario. No se usó un generador de imágenes raster ni se copiaron emblemas de agencias. El kit debe incorporarse a la declaración de asistencia de IA cuando el equipo adopte la identidad. No se afirma exclusividad registral ni se realizó una búsqueda de marcas.

Los archivos de este directorio se entregan bajo Apache-2.0, de acuerdo con el archivo LICENSE raíz observado en esta entrega. Esta indicación corresponde al material gráfico y su generador; no concede derechos sobre nombres o marcas ajenas. La fuente DejaVu Sans del sistema se utilizó únicamente para los rótulos de la lámina raster de revisión; no forma parte del logo ni se distribuye como archivo de fuente.
