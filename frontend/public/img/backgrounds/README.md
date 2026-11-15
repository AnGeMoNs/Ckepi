# CKEPI · Fondos de papel recortado

12 imágenes decorativas generadas con OpenAI `image_gen` desde los prompts del usuario: 6 secciones × 2 composiciones independientes.

| Sección | Prefijo del archivo |
|---|---|
| Home | `ckepi-home` |
| El problema | `ckepi-el-problema` |
| Qué hace CKEPI | `ckepi-que-hace-ckepi` |
| El hallazgo | `ckepi-el-hallazgo` |
| El límite honesto | `ckepi-el-limite-honesto` |
| Explorador | `ckepi-explorador` |

Todos llevan sufijo `-desktop.webp` (2560×1440) o `-mobile.webp` (1080×1920). Son exportaciones redimensionadas desde originales de menor resolución; no se afirma generación nativa a esos tamaños. Cada fondo pesa menos de 300,000 bytes. Los nombres no certifican un hallazgo científico ni representan terrenos medidos.

## Uso en React

```tsx
import { PaperCutBackground } from "../components/ui/PaperCutBackground";

<PaperCutBackground scene="home" active={currentStep === 0}>
  <div className="ckepi-paper-copy">
    {/* Texto traducido del componente consumidor */}
  </div>
</PaperCutBackground>
```

El componente observa la visibilidad: no crea el `<picture>` hasta que la sección entra en pantalla y está activa. El navegador selecciona una composición con `<source media>`; no se precargan todas las secciones. Las peticiones ya iniciadas pueden terminar aunque el usuario abandone una sección y las imágenes visitadas pueden permanecer en la caché del navegador.

El Explorador se presenta al 15 % de opacidad. La marca `AI-generated · Ckepi` permanece opaca, visible en una esquina y separada del raster. La clase `ckepi-paper-copy` incorpora un velo al 82 % y texto crema para asegurar contraste del texto definido por esta clase incluso sobre zonas claras. Colores o estados propios de componentes descendientes requieren su propia revisión de contraste. No colocar información importante detrás de la marca.

No utilizar estos fondos como evidencia orbital, mapa científico o visualización derivada de DEM. La apariencia de texturas no garantiza un mosaico sin costuras; usar `cover`, sin repetición.

## Revisión y trazabilidad

- `ckepi-backgrounds-review.webp`: lámina de las doce imágenes con atribución visible.
- `manifest.json`: dimensiones, peso, calidad WebP y revisión por archivo.
- `docs/design/paper-cut/prompts.json`, desde la raíz del proyecto: base común, escenas, originales y adaptaciones de composición.
- `scripts/assets/export_paper_cut_backgrounds.py`, desde la raíz: exportación reproducible desde los originales locales registrados. No llama a APIs ni genera escenas.
- `AI_DISCLOSURE.md`, en la raíz del repositorio: declaración del uso de IA.

Las escenas se revisaron individualmente. No se observaron logos, letras, rostros, banderas ni anillos en Marte en los archivos seleccionados. La hoja de contacto sirve para revisión; las exportaciones finales son los doce archivos individuales.

El componente se entrega preparado para que la sesión responsable de Home lo adopte. No modifica rutas, App, Header, mapas ni contenido de otras sesiones.
