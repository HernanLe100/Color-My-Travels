import { GeoJSON } from "react-leaflet";
import type { MapGeoJSONData, PolygonLevel } from "./mapGeoTypes";

type VisitedRegionsGeoJSONProps = {
  showPolygons: boolean;
  polygonLevel: PolygonLevel;
  data: MapGeoJSONData;
  countryColorMap: Map<string, string>;
  adm1ColorMap: Map<string, string>;
};

export default function VisitedRegionsGeoJSON({
  showPolygons,
  polygonLevel,
  data,
  countryColorMap,
  adm1ColorMap,
}: VisitedRegionsGeoJSONProps) {
  if (!showPolygons || data.features.length === 0) return null;

  return (
    <GeoJSON
      key={polygonLevel}
      data={data}
      interactive={false}
      style={(feature) => {
        const iso = feature?.properties?.shapeISO as string | undefined;
        const fillColor =
          polygonLevel === "ADM1"
            ? (adm1ColorMap.get(iso ?? "") ?? "#eb4034")
            : (countryColorMap.get(iso ?? "") ?? "#eb4034");
        return { color: fillColor, fillColor, fillOpacity: 0.3 };
      }}
    />
  );
}
