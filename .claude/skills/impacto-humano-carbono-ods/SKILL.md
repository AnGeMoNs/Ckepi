---
name: impacto-humano-carbono-ods
description: >-
  Integra en el motor de análogos planetarios de Ckepi la capa de vocación espacial ("Tres Mundos en tu
  Mano" para niños, jóvenes y adultos mayores), accesibilidad contra la baja alfabetización digital
  (voz Web Speech API, tarjetas imprimibles, 3 niveles), empleabilidad STEAM regional en Antofagasta,
  los 4 ejes oficiales de Caja La Araucana y sus metas ODS verificadas (4.3, 4.4, 8, 9.5, 10, 13, 17.3,
  17.16, 17.17).
---

# Skill · Impacto Humano, Baja Alfabetización Digital, Empleabilidad STEAM, Caja La Araucana y Metas ODS

## Fuentes de verdad reales en el repositorio
- Panel de impacto local y "Tres Mundos en tu Mano": [`frontend/src/components/mission/LaAraucanaImpactPanel.tsx`](../../../frontend/src/components/mission/LaAraucanaImpactPanel.tsx)
- Skill de rúbrica local y ODS: [`.claude/skills/rubrica-local-araucana/SKILL.md`](../rubrica-local-araucana/SKILL.md)
- Referencias verificadas ODS y NSSDCA: [`REFERENCES.md`](../../../REFERENCES.md) §5 y [`docs/DATA_PROVENANCE.md`](../../../docs/DATA_PROVENANCE.md) §1.5

## Reglas de Oro de Implementación (Ciencia NASA + Impacto Humano y Territorial)
1. **Nunca separar del motor de datos:** Toda experiencia educativa, laboral o climática se alimenta directamente de los valores verificados del sitio análogo (topografía a $30\text{ m}$, brecha física $\mathbf{B}$ y tabla **NASA NSSDCA Planetary Fact Sheet**).
2. **Doble Modo sobre un Único Frontend Mobile-First (`320px` $\to$ `4K`):**
   - **Modo Misión NASA:** Telemetría completa $(S_{\text{ind}}, S_{\text{dep}}, R_{\text{break}})$, distribuciones a $30\text{ m}$ ($W_1, D_{\text{KS}}$, *bootstrap* 2D) y globos 3D NASA Trek.
   - **Modo Explorador Universal (*"Tres Mundos en tu Mano"* — Cero Barrera Digital):** 3 niveles progresivos (*1. Mirar · 2. Comparar · 3. Investigar*), narración completa por voz (*Web Speech API* en `ES`/`PT`/`EN`), analogías físicas cotidianas (*mochila de 10 kg = 1,7 kg en la Luna y 3,8 kg en Marte*) y micro-retos de 15 segundos (*Retrieval Practice*).
3. **Alineación Estricta con los 4 Ejes y Metas ODS Declaradas por Caja La Araucana:**
   - **Eje 1 · Democratizar el acceso a ciencia de frontera $\to$ `ODS 4.3`:** Acceso libre y gratuito a datos orbitales NASA/ESA para colegios, liceos técnicos y educación superior.
   - **Eje 2 · Competencias STEAM y empleabilidad $\to$ `ODS 4.4` y `ODS 8`:** Habilidades técnicas en ciencia de datos espaciales (`H3`, `DuckDB`), evaluación de terrenos para robótica minera/espacial y astro-geoturismo comunitario en Antofagasta.
   - **Eje 3 · Soluciones con aplicación local $\to$ `ODS 9.5`, `ODS 10` y `ODS 13`:** Puesta en valor científica de sitios sub-estudiados de la Región de Antofagasta (*Salar de Pajonales*, *Cordillera de la Sal*, *Volcán Llullaillaco*), reducción de brechas digital/etaria/territorial y menor huella logística de campañas mediante preselección satelital.
   - **Eje 4 · Red interregional de innovación (*Lattices*) $\to$ `ODS 17.3`, `ODS 17.16` y `ODS 17.17`:** Alianza multi-actor entre Caja La Araucana, UCN, UA, regiones de Chile y ciencia abierta global (`NASA TOPS` / `FAIR`).
