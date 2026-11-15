# Plan Maestro · Ckepi · NASA Space Apps 2026 (sede Antofagasta)

> Documento vivo y local. Actualizado: **sáb 14-nov 16:05**. Se marca `[x]` al cumplir cada paso, con su evidencia.
> Lee primero: `CLAUDE.md` → `docs/SDD.md` → `CONTEXTO_DANI.md` → este plan. Mapa: `docs/MAPA_SOFTWARE_PIZARRA.excalidraw`.
> **Hitos fijos:** sáb **18:00** corte de alcance · dom **20:00** envío interno · dom **23:59** cierre oficial (hora de Chile).

## 0. Estado de partida (verificado 15:55–16:05)

| Ítem | Estado |
|---|---|
| `pytest -q` | ✅ 8 pasan (con el margen del test relajado de 0,20 a 0,12, sin justificar aún) |
| `npm run build` | ✅ 0 errores · ⚠ bundle de 2 MB (542 KB gzip) |
| Paridad i18n | ✅ 381 claves |
| Comparación Atacama–Jezero | ✅ **Resuelto 17:20 (`1535fb7`)**: DEM reales (CTX Jezero + Copernicus GLO-30) a 30 m; resultados en `docs/RESULTADOS_TERRENO_REALES.md` |
| Documentación | ✅ Corregida (`809f039` y siguientes): cifras reales, licencia Apache-2.0, NASADEM marcado como no usado |
| Despliegue público del backend | 🔴 no existe. La regla NASA exige links públicos y sin login |
| Nada commiteado desde las 14:48 | ⚠ ~20 archivos modificados por tres agentes en el mismo árbol |

## 1. Riesgos que mandan sobre todo lo demás

1. **Integridad científica (resuelto):** la comparación ya usa DEM reales. Toda combinación sin ventana real sale rotulada `SYNTHETIC`. Las cifras antiguas 0,77° / 4,13° están retiradas.
2. **Despliegue:** sin backend público, el proyecto no se puede juzgar. Hay que decidirlo hoy.
3. **Commits mezclados:** cada agente commitea solo sus rutas y pronto, para no perder trabajo.

## 2. Pasos

### Fase 1 · Sincronizar (16:05–16:40) · Dani + todos
- [ ] 1.1 **Dani decide** A/B para el terreno real (ver §1.1) y la plataforma de despliegue (ver §3).
- [ ] 1.2 Astra explica por qué el margen del test pasó de 0,20 a 0,12 (¿cambió el motor o se ajustó el test para que pase?).
- [ ] 1.3 Cada agente hace un commit local de lo suyo: Astra `backend/`, Argon `frontend/`, Claude `docs/` + `README.md` + `REFERENCES.md` + `AI_DISCLOSURE.md`. **Push solo con el visto bueno de Dani.**
- [ ] 1.4 Dani decide qué hacer con `CLAUDE.md`, `AGENTS.md`, `.claude/`, `scripts/` (commitear o dejar locales) y con el submódulo `hackanasa` borrado (`D hackanasa`).

### Fase 2 · P0 científico real (16:40–18:00) · **Astra** (`backend/`)
- [x] 2.1 Descargar el **CTX DEM de Jezero** (USGS, 20 m, dominio público, 87 MB, sin login) a `backend/app/data/derived/` (no versionar el .tif si pesa; documentar la URL y el checksum).
- [x] 2.2 ~~NASADEM~~ → se usó **Copernicus GLO-30** (sin login). NASADEM queda como alternativa NASA si alguien crea cuenta Earthdata.
- [x] 2.3 Recortar ventanas de igual extensión, reproyectar a metros, remuestrear a 30 m. Verificar la escala E-O de Jezero en la etiqueta PDS4 (~19 m si la escala verdadera está en 0°).
- [x] 2.4 Sustituir `_synthesize_calibrated_metric_dem` por la lectura real; dejar el sintético **solo** en tests.
- [x] 2.5 Precalcular el resultado a `derived/*.json` con `sources[]`, para que la demo no dependa de la red.
- [x] 2.6 Test: una ventana real pequeña de fixture + verificación de que el JSON trae fuentes.
- [x] **Gate 18:00:** cumplido con la Opción A (datos reales).

### Fase 3 · Producto (16:40–22:00) · **Argon** (`frontend/`)
- [ ] 3.1 `TerrainDistributionPanel`: histogramas, W1/KS con IC 95 %, sensibilidad 30/60/90 m, texto "qué se parece, cuánto y qué no", rótulo de fuente; rótulo "sintético" si aplica la opción B.
- [ ] 3.2 **Modo Aprender «Tres mundos»** dentro del modo STEAM: tabla del §5.1 de `CONTEXTO_DANI.md` (valores de los NASA Fact Sheets con fuente en pantalla), 3 niveles, botón Escuchar, botones ≥ 44 px, texto ≥ 18 px.
- [ ] 3.3 Tokens de identidad (papel por capas: azul noche, celeste, naranja Atacama) sin romper el tema claro/oscuro.
- [ ] 3.4 `LaAraucanaImpactPanel`: solo afirmaciones verificables (nada de usuarios, convenios ni cifras inventadas).
- [ ] 3.5 Partir el bundle con `import()` (mapas y three.js bajo demanda).
- [ ] 3.6 Revisión de 320 px y 1280 px+ con `webapp-testing`; `better-accessibility` sobre el Modo Aprender.

### Fase 4 · Verdad documental (16:40–20:00) · **Claude** (`docs/`, `README.md`, `REFERENCES.md`, `AI_DISCLOSURE.md`, tests)
- [x] 4.1 Corregir `DATA_PROVENANCE.md` y `REFERENCES.md` para que digan **exactamente** lo que hace el código (hoy: sintético). Actualizar cuando Astra cierre la Fase 2.
- [x] 4.2 Verificar cada referencia nueva (DOI, URL, autores). Marcar como "por verificar" la de *Memoria La Araucana 2024–2026*.
- [ ] 4.3 `AI_DISCLOSURE.md`: declarar agentes y tareas sin exagerar la revisión humana.
- [ ] 4.4 `docs/SUBMISSION_PACK_EN.md`: revisión con `validador-space-apps-2026` en modo pre-envío; eliminar cualquier cifra que el código no produzca.
- [ ] 4.5 `README.md`: cómo correrlo, cómo se despliega, datos y licencias.
- [ ] 4.6 `CITATION.cff` + `docs/DMP.md` (mini-OSDMP de `nasa-ciencia-abierta`, con atribución CC BY 4.0).

### Fase 5 · Despliegue (sáb 20:00–dom 12:00) · Astra + Argon, Dani aprueba
- [ ] 5.1 Backend con datos precalculados, sin escribir en DuckDB en producción (o con escrituras desactivadas).
- [ ] 5.2 Frontend estático apuntando a la URL pública del backend; CORS restringido a ese dominio.
- [ ] 5.3 Probar en una ventana privada desde un celular con 4G.
- [ ] 5.4 `ckepi-verify` completo sobre lo desplegado.

### Fase 6 · Entrega (dom 12:00–20:00)
- [ ] 6.1 Corte de código dom 14:00: solo arreglos.
- [ ] 6.2 Video ≤ 30 s en inglés (o subtítulos), sin menores, sin logos NASA, IA con marca de agua visible (`pitch-storytelling-space-apps`).
- [ ] 6.3 Página de proyecto en inglés con todos los campos obligatorios y References.
- [ ] 6.4 `juez-validador-space-apps-2026` (pre-envío) + `abogado-del-diablo-juez-nasa` → arreglar lo crítico.
- [ ] 6.5 PR `dani → main` con `code-review`; merge con visto bueno del equipo.
- [ ] 6.6 **Submit for Judging ≤ 20:00** y comprobación en ventana privada.
- [ ] 6.7 Pitch local 3 min + 2 min de Q&A, ensayado (la Local Lead confirma el formato).

## 3. Decisiones pendientes de Dani

| # | Decisión | Recomendación |
|---|---|---|
| D1 | Terreno real (A) vs. rótulo sintético (B) a las 18:00 | A con CTX DEM + Copernicus GLO-30 si Earthdata no está listo |
| D2 | Despliegue del backend | Una plataforma con capa gratuita para FastAPI (Render, Fly.io, Railway; verificar límites) + frontend en GitHub Pages o Vercel |
| D3 | `CLAUDE.md`/`.claude/` al repo o solo locales | Commitear: documentan el uso de IA (transparencia) |
| D4 | Cuenta Earthdata | La crea una persona del equipo; nunca se commitean credenciales |
| D5 | Nombre del módulo de aprendizaje | Lo decide el equipo humano |

## 4. Cómo se sigue el progreso de Astra
Claude vigila `backend/` (cambios de archivos, commits nuevos, si `_synthesize_calibrated_metric_dem` desaparece y si aparece un DEM real) y avisa a Dani en el chat. Cada aviso dice qué cambió y qué paso del plan mueve.
