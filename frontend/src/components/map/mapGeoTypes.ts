export type MapGeoJSONData = {
  type: "FeatureCollection";
  features: Array<{ properties?: { shapeISO?: string } }>;
};

export type PolygonLevel = "ADM0" | "ADM1";
