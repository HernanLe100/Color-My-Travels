import { useEffect, useMemo, useRef, useState } from "react";
import { Marker, Popup, GeoJSON } from "react-leaflet";
import { useZoomLevel } from "@/hooks/useZoomLevel";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const icon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// TODO: create seperate file to store types
type Color = {
  color: string;
  user_id: string;
  location_id: string;
  adm: string;
};

export default function MapContent() {
  const zoom = useZoomLevel();
  const [adm0, setAdm0] = useState<any[]>([]);
  const [adm1, setAdm1] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [colors, setColors] = useState<Color[]>([]);

  // TODO: extract from database instead of hardcoding
  const points = useMemo(
    () => [
      { id: 1, lat: 40.343, lng: -74.651, country: "USA", adm1: "US-NJ" },
      { id: 2, lat: 48.8566, lng: 2.3522, country: "FRA", adm1: "FR-IDF" },
    ],
    [],
  );
  const testUser = "0000";

  const countriesVisited = useMemo(
    () => [...new Set(points.map((p) => p.country))],
    [points],
  );

  const visitedADM1 = useMemo(
    () => new Set(points.map((p) => p.adm1)),
    [points],
  );

  const cache = useRef(new Map<string, any>());

  useEffect(() => {
    fetch(`http://localhost:5001/get_colors?user_id=${testUser}`)
      .then((res) => res.json())
      .then((data) => {
        setColors(data.db_response);
      });
  }, []);

  useEffect(() => {
    if (!countriesVisited.length) return;

    async function fetchLevel(country: string, level: string) {
      const key = `${country}-${level}`;

      if (cache.current.has(key)) {
        return cache.current.get(key);
      }

      const res = await fetch(
        `http://localhost:5001/geo?country=${country}&level=${level}`,
      );
      const data = await res.json();

      delete data.crs;

      cache.current.set(key, data);
      return data;
    }

    async function load() {
      const adm0Results = await Promise.all(
        countriesVisited.map((c) => fetchLevel(c, "ADM0")),
      );

      const adm1Results = await Promise.all(
        countriesVisited.map((c) => fetchLevel(c, "ADM1")),
      );

      setAdm0(adm0Results);
      setAdm1(adm1Results);
      setLoaded(true);
    }

    load();
  }, [countriesVisited.join(",")]);

  // Map shapeISO → color for each adm level
  const countryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of colors) {
      if (c.adm === "country") {
        const point = points.find((p) => p.id === Number(c.location_id));
        if (point) map.set(point.country, c.color);
      }
    }
    return map;
  }, [colors, points]);

  const adm1ColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of colors) {
      if (c.adm === "adm1") {
        const point = points.find((p) => p.id === Number(c.location_id));
        if (point) map.set(point.adm1, c.color);
      }
    }
    return map;
  }, [colors, points]);

  const level = zoom >= 8 ? "POINTS" : zoom >= 5 ? "ADM1" : "ADM0";

  const geoData = level === "ADM0" ? adm0 : level === "ADM1" ? adm1 : [];

  console.log("geoData:", geoData);

  const combinedGeo = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: geoData.flatMap((g) => g?.features || []),
    }),
    [geoData],
  );

  const filteredGeo = useMemo(() => {
    if (level !== "ADM1") return combinedGeo;

    return {
      type: "FeatureCollection" as const,
      features: combinedGeo.features.filter((f) =>
        visitedADM1.has(f.properties?.shapeISO),
      ),
    };
  }, [combinedGeo, visitedADM1, level]);

  if (!loaded) return null;

  return (
    <>
      {/* pins */}
      {level === "POINTS" &&
        points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
            <Popup>{p.country}</Popup>
          </Marker>
        ))}

      {/* polygons */}
      {level !== "POINTS" && combinedGeo.features.length > 0 && (
        <GeoJSON
          key={level} // MUST ADD KEY!!! Or else it will not re-render the polygon when the level changes
          data={filteredGeo}
          style={(feature) => {
            const iso = feature?.properties?.shapeISO;
            const fillColor =
              level === "ADM1"
                ? (adm1ColorMap.get(iso) ?? "#eb4034")
                : (countryColorMap.get(iso) ?? "#eb4034");
            return { color: fillColor, fillColor, fillOpacity: 0.3 };
          }}
        />
      )}
    </>
  );
}
