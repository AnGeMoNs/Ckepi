import { CopernicusNotice } from "../ui/CopernicusNotice";
import type { TerrainDistributionComparison } from "../../types/analog";

/** Exact DEM provenance as stored in the snapshot, plus the Copernicus licence notice. */
export function TerrainSource({ terrain }: { terrain: TerrainDistributionComparison }) {
  return (
    <>
      <p lang="en">{terrain.planetary_dem_source}</p>
      <p lang="en">{terrain.earth_dem_source}</p>
      <CopernicusNotice />
    </>
  );
}
