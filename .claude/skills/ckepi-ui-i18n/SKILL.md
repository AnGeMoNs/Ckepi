---
name: ckepi-ui-i18n
description: Reglas para crear o editar UI y textos en el frontend de Ckepi (React, Tailwind, i18n es/pt/en). Úsala al añadir o cambiar componentes, mensajes, etiquetas, tooltips, errores, formatos de número/fecha o estilos, aunque el usuario solo pida "agrega un botón" o "muestra este dato". Evita texto hardcodeado, claves faltantes, `any` y estilos inline.
---

# ckepi-ui-i18n

Reglas del SDD §2 aplicadas al frontend (`frontend/src/`).

- **Texto:** toda cadena visible usa `t("clave")` de react-i18next. Añade la clave en `es.json`, `pt.json` y `en.json` en el mismo cambio. Un texto científico traducido con IA debe quedar revisable: no inventes terminología, reutiliza la ya presente en los JSON.
- **Números y fechas:** usa los helpers de `i18n/index.ts` (`formatNumber`, `formatPercent`, `getActiveIntlLocale`) o `Intl.*`; nunca `toFixed` para mostrar.
- **Estilos:** solo clases Tailwind y tokens/variables CSS; reutiliza `components/ui/` (Badge, Button, Card, InfoTooltip, ProgressBar, Select) antes de crear algo nuevo. Sin `style={{}}` con hex/px arbitrarios. Soporta tema claro y oscuro.
- **Responsive y tacto:** mobile-first desde 320px; controles interactivos con `min-h-11 min-w-11`.
- **Tipos:** sin `any`; modela datos de la API en `types/analog.ts` y llama al backend solo desde `api/client.ts`.
- **Accesibilidad:** nombres accesibles (`aria-label` también traducido), foco visible y respeto de `prefers-reduced-motion` en animaciones.
- **Honestidad en pantalla:** un resultado de similitud muestra su incertidumbre, la resolución H3 y la fuente de datos; no lo ocultes para "limpiar" la interfaz.

Al terminar corre `ckepi-verify` (paridad i18n y build).
