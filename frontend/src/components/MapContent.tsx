import { useEffect, useMemo, useRef, useState } from "react";
import { Marker, Popup, GeoJSON } from "react-leaflet";
import { useZoomLevel } from "@/hooks/useZoomLevel";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { Pin } from "@/types";

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
  region_code: string;
  region_type: string;
};

export default function MapContent() {
  const zoom = useZoomLevel();
  const [adm0, setAdm0] = useState<any[]>([]);
  const [adm1, setAdm1] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [colors, setColors] = useState<Color[]>([]);

  const [pins, setPins] = useState<Pin[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);

  useEffect(() => {
    async function loadPoints() {
      const res = await fetch(
        `http://localhost:5001/get_locations?user_id=0000`,
      );
      const data = await res.json();

      // map DB response
      const mapped = data.db_response.map((p: any) => ({
        location_id: p.location_id,
        lat: p.lat,
        lng: p.lng,
        country: p.country,
        adm1: p.adm1,
        city: p.city,
      }));

      setPins(mapped);
      setPinsLoaded(true);
    }

    loadPoints();
  }, []);

  const testUser = "0000";

  const countriesVisited = useMemo(
    () => [...new Set(pins.map((p) => p.country))],
    [pins],
  );

  const visitedADM1 = useMemo(() => new Set(pins.map((p) => p.adm1)), [pins]);

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
      if (c.region_type === "country") {
        const point = pins.find((p) => p.country === c.region_code);
        if (point) map.set(point.country, c.color);
      }
    }
    return map;
  }, [colors, pins]);

  const adm1ColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of colors) {
      if (c.region_type === "adm1") {
        const point = pins.find((p) => p.adm1 === c.region_code);
        if (point) map.set(point.adm1, c.color);
      }
    }
    return map;
  }, [colors, pins]);

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

  const isLoading = !pinsLoaded || !loaded;

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p className="text-sm text-gray-600">Loading your travels...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* pins */}
      {level === "POINTS" &&
        pins.map((p) => (
          <Marker key={p.location_id} position={[p.lat, p.lng]} icon={icon}>
            <Popup>
              {p.city}, {p.adm1}, {p.country}
            </Popup>
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
