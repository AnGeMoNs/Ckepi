# References & Open Data Sources — Ckepi

## 1. NASA Datasets & Services
- **NASA Moon Trek & Mars Trek WMTS** — Basemap imagery and LOLA/MOLA/CTX terrain layers (`https://trek.nasa.gov/`).
- **NASA Planetary Data System (PDS) / Orbital Data Explorer (ODE)** — LRO LOLA, Diviner, MRO HiRISE/CTX, MSL REMS, Mars 2020 MEDA (`https://pds.nasa.gov/`).
- **NASA Earthdata CMR** — MODIS Land Surface Temperature (`MOD11A1`) and SMAP Soil Moisture (`SPL3SMP`) (`https://cmr.earthdata.nasa.gov/`).
- **NASA POWER** — Solar irradiance and surface meteorology (`https://power.larc.nasa.gov/`).
- **NASA GIBS / Worldview** — Earth observation imagery (`https://earthdata.nasa.gov/gibs`).

## 2. Partner Space Agencies & Earth Science APIs
- **ESA Copernicus Data Space** — Sentinel-1 SAR, Sentinel-2 MSI, Copernicus DEM GLO-30 (`https://dataspace.copernicus.eu/`).
- **CSA (Canadian Space Agency)** — Open Data Portal / RADARSAT catalog (`https://donnees-data.asc-csa.gc.ca/`).
- **JAXA** — G-Portal / ALOS AW3D30 open elevation & Earth observation (`https://gportal.jaxa.jp/`).
- **Open-Meteo Archive & Forecast API** — ERA5-based meteorological reanalysis (`https://open-meteo.com/`).
- **Macrostrat** — Geological unit and lithology API (`https://macrostrat.org/api`).

## 3. Peer-Reviewed Scientific & Institutional References
- **NASAJPL (2020).** *NASADEM Merged DEM Global 1 arc second V001* (`NASADEM_HGT.001`), tiles `s23w069`, `s25w070` (referencia metodológica para escala métrica de 30 m en UTM Zona 19S `EPSG:32719`; en el motor actual se calibra sobre pendientes medidas por Copernicus DEM / ASTER 30m mientras se completa la ingesta GeoTIFF directa). NASA EOSDIS Land Processes DAAC. DOI: `10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001`.
- **Calef, F. J., III, et al. (2021).** *Mars 2020 Terrain Relative Navigation CTX DEM Mosaic* (Jezero Crater, 20 m/px; referencia de escala común a 30 m/px con corrección $\cos\phi$). USGS Astrogeology Science Center / NASA PDS Annex (`https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif`).
- **Hassler, D. M., Zeitlin, C., Wimmer-Schweingruber, R. F., et al. (2014).** *Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover.* **Science**, 343(6169), 1244797 (`~0.64 mSv/day` / `~230 mSv/yr` GCR + SEP surface dose). DOI: `10.1126/science.1244797`.
- **Williams, D. R. (2024).** *NASA NSSDCA Planetary Fact Sheets (Earth, Moon, Mars).* NASA Goddard Space Flight Center (`https://nssdc.gsfc.nasa.gov/planetary/factsheet/`).
- **Navarro-González, R., Rainey, F. A., Molina, P., et al. (2003).** *Mars-Like Soils in the Atacama Desert, Chile, and the Dry Limit of Microbial Life.* **Science**, 302(5647), 1018–1021. DOI: `10.1126/science.1089143`.
- **Caja de Compensación La Araucana (por verificar edición exacta 2024/2025).** *Memoria Integrada y Marco de Objetivos para NASA Space Apps Challenge Chile (Metas ODS declaradas: 4.3, 4.4, 9.5, 17.3, 17.16, 17.17).* Santiago / Antofagasta, Chile.

## 4. Open-Source Software & Libraries
- **Backend:** FastAPI (MIT), Pydantic v2 (MIT), DuckDB (MIT), H3-py (Apache-2.0), scikit-learn (BSD-3), SciPy (`scipy.stats.wasserstein_distance`, `scipy.stats.ks_2samp`, BSD-3), NumPy (BSD-3), Pandas (BSD-3), httpx (BSD-3).
- **Frontend:** React 18 (MIT), TypeScript (Apache-2.0), Vite (MIT), Tailwind CSS (MIT), MapLibre GL JS (BSD-3), i18next / react-i18next (MIT), Lucide Icons (ISC).

> Detailed variable provenance and physical assumptions are documented in [docs/DATA_PROVENANCE.md](docs/DATA_PROVENANCE.md).
