import { useEffect, useMemo, useRef, useState } from "react";
import { Marker, GeoJSON } from "react-leaflet";
import { useZoomLevel } from "@/hooks/useZoomLevel";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { Album, Color, Pin } from "@/types";
import { useAuth } from "@/App";
import { Button } from "./ui/button";

const icon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; //"https://127.0.0.1:5001" 

export default function MapContent() {
  const zoom = useZoomLevel();
  const [adm0, setAdm0] = useState<any[]>([]);
  const [adm1, setAdm1] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [colors, setColors] = useState<Color[]>([]);

  const [pins, setPins] = useState<Pin[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const token = useAuth();

  useEffect(() => {
    if (!token) return;

    async function loadMapData() {
      const [locRes, albumRes] = await Promise.all([
        fetch(`${BACKEND_URL}/get_locations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/get_albums`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const locData = await locRes.json();
      const albumData = await albumRes.json();

      const rows = locData.db_response ?? [];
      const seen = new Set<number>();
      const uniquePins: Pin[] = [];
      for (const p of rows as Record<string, unknown>[]) {
        const id = Number(p.location_id);
        if (seen.has(id)) continue;
        seen.add(id);
        uniquePins.push({
          location_id: id,
          lat: Number(p.lat),
          lng: Number(p.lng),
          country: String(p.country ?? ""),
          adm1: String(p.adm1 ?? ""),
          city: String(p.city ?? ""),
        });
      }
      setPins(uniquePins);

      const albumRows = albumData.db_response ?? [];
      setAlbums(
        (albumRows as Record<string, unknown>[]).map((a) => ({
          album_id: Number(a.album_id),
          user_id: String(a.user_id ?? ""),
          notes: String(a.notes ?? ""),
          pages: Array.isArray(a.pages) ? (a.pages as string[]) : [],
          start_date: String(a.start_date ?? ""),
          end_date: String(a.end_date ?? ""),
          location_id: Number(a.location_id),
          name: String(a.name ?? ""),
        })),
      );

      setPinsLoaded(true);
    }

    loadMapData();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/get_colors`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.db_response) setColors(data.db_response);
      });
  }, [token]);

  const countriesVisited = useMemo(
    () => [...new Set(pins.map((p) => p.country))],
    [pins],
  );

  const visitedADM1 = useMemo(() => new Set(pins.map((p) => p.adm1)), [pins]);

  const cache = useRef(new Map<string, any>());

  useEffect(() => {
    if (!countriesVisited.length) {
      setLoaded(true);
      return;
    }

    async function fetchLevel(country: string, level: string) {
      const key = `${country}-${level}`;

      if (cache.current.has(key)) {
        return cache.current.get(key);
      }

      const res = await fetch(
        `${BACKEND_URL}/geo?country=${country}&level=${level}`,
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

  const albumAtLocation = useMemo(() => {
    if (!selectedPin) return null;
    return (
      albums.find((a) => a.location_id === selectedPin.location_id) ?? null
    );
  }, [albums, selectedPin]);

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

  function formatDate(value: string) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
  }

  return (
    <>
      {/* pins */}
      {level === "POINTS" &&
        pins.map((p) => (
          <Marker
            key={p.location_id}
            position={[p.lat, p.lng]}
            icon={icon}
            eventHandlers={{
              click: () => setSelectedPin(p),
            }}
          />
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

      {selectedPin && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 p-4"
          onClick={() => setSelectedPin(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border-2 border-stone-300 bg-stone-50 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="border-b border-stone-300 pb-4 text-center">
              <p className="text-xs font-medium uppercase text-stone-500">
                Travel album
              </p>
              <h2
                className="mt-2 text-2xl text-stone-900"
              >
                {selectedPin.city || "Unknown City"}
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                {[selectedPin.adm1, selectedPin.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </header>

            <div className="mt-5">
              {!albumAtLocation ? (
                <p className="text-center text-sm text-stone-600">
                  No album for this place yet.
                </p>
              ) : (
                <div className="rounded-md border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                  <h3 className="font-serif text-lg text-stone-800">
                    {albumAtLocation.name || "Untitled"}
                  </h3>
                  <p className="text-sm text-stone-500">
                    {formatDate(albumAtLocation.start_date)} —{" "}
                    {formatDate(albumAtLocation.end_date)}
                  </p>
                  {albumAtLocation.notes ? (
                    <blockquote className="border-l-2 border-stone-400 pl-3 text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
                      {albumAtLocation.notes}
                    </blockquote>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-stone-300 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPin(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
