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

type MapContentProps = {
  isTogglePins?: boolean;
};

export default function MapContent({ isTogglePins = false }: MapContentProps) {
  const zoom = useZoomLevel();
  const [adm0, setAdm0] = useState<any[]>([]);
  const [adm1, setAdm1] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [colors, setColors] = useState<Color[]>([]);

  const [pins, setPins] = useState<Pin[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", notes: "", start_date: "", end_date: "" });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
      setLoaded(false);

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

  const polygonLevel = zoom >= 5 ? "ADM1" : "ADM0";
  const showPins = isTogglePins ? true : false || zoom >= 8;
  const showPolygons = zoom < 8;

  const geoData =
    polygonLevel === "ADM0" ? adm0 : polygonLevel === "ADM1" ? adm1 : [];

  const combinedGeo = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: geoData.flatMap((g) => g?.features || []),
    }),
    [geoData],
  );

  const filteredGeo = useMemo(() => {
    if (polygonLevel !== "ADM1") return combinedGeo;

    return {
      type: "FeatureCollection" as const,
      features: combinedGeo.features.filter((f) =>
        visitedADM1.has(f.properties?.shapeISO),
      ),
    };
  }, [combinedGeo, visitedADM1, polygonLevel]);

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

  function toDateInputValue(value: string) {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  }

  function openEdit() {
    if (!albumAtLocation) return;
    setEditForm({
      name: albumAtLocation.name ?? "",
      notes: albumAtLocation.notes ?? "",
      start_date: toDateInputValue(albumAtLocation.start_date),
      end_date: toDateInputValue(albumAtLocation.end_date),
    });
    setIsEditing(true);
  }

  async function handleDeleteAlbum() {
    if (!albumAtLocation) return;
    const res = await fetch(
      `${BACKEND_URL}/delete_album?album_id=${albumAtLocation.album_id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      alert(`Failed to delete album: ${await res.text()}`);
      setIsConfirmingDelete(false);
      return;
    }
    window.location.reload();
  }

  async function handleSaveEdit() {
    if (!albumAtLocation) return;
    const res = await fetch(`${BACKEND_URL}/edit_album`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ album_id: albumAtLocation.album_id, ...editForm }),
    });
    if (!res.ok) {
      console.error("Failed to save album:", await res.text());
      return;
    }
    setAlbums((prev) =>
      prev.map((a) =>
        a.album_id === albumAtLocation.album_id ? { ...a, ...editForm } : a,
      ),
    );
    setIsEditing(false);
  }

  console.log(showPins, showPolygons);

  return (
    <>
      {/* pins */}
      {showPins &&
        pins.map((p) => (
          <Marker
            key={p.location_id}
            position={[p.lat, p.lng]}
            icon={icon}
            eventHandlers={{
              click: () => { setSelectedPin(p); setIsEditing(false); setIsConfirmingDelete(false); },
            }}
          />
        ))}

      {/* polygons */}
      {showPolygons && combinedGeo.features.length > 0 && (
        <GeoJSON
          key={polygonLevel} // MUST ADD KEY!!! Or else it will not re-render the polygon when the level changes
          data={filteredGeo}
          style={(feature) => {
            const iso = feature?.properties?.shapeISO;
            const fillColor =
              polygonLevel === "ADM1"
                ? (adm1ColorMap.get(iso) ?? "#eb4034")
                : (countryColorMap.get(iso) ?? "#eb4034");
            return { color: fillColor, fillColor, fillOpacity: 0.3 };
          }}
        />
      )}

      {selectedPin && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 p-4"
          onClick={() => { setSelectedPin(null); setIsEditing(false); setIsConfirmingDelete(false); }}
        >
          <div
            className="w-full max-w-md rounded-lg border-2 border-stone-300 bg-stone-50 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="relative border-b border-stone-300 pb-4 text-center">
              <button
                type="button"
                className="absolute right-0 top-0 text-stone-400 hover:text-stone-700"
                onClick={() => { setSelectedPin(null); setIsEditing(false); setIsConfirmingDelete(false); }}
                aria-label="Close"
              >
                ✕
              </button>
              <p className="text-xs font-medium uppercase text-stone-500">
                Travel album
              </p>
              <h2 className="mt-2 text-2xl text-stone-900">
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
              ) : isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-500">Name</label>
                    <input
                      className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs font-medium text-stone-500">Start date</label>
                      <input
                        type="date"
                        className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        value={editForm.start_date}
                        onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs font-medium text-stone-500">End date</label>
                      <input
                        type="date"
                        className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        value={editForm.end_date}
                        onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-500">Notes</label>
                    <textarea
                      rows={4}
                      className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>
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

            <div className="mt-6 flex justify-between border-t border-stone-300 pt-4">
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSaveEdit}>
                      Save
                    </Button>
                  </>
                ) : albumAtLocation && !isConfirmingDelete ? (
                  <Button type="button" variant="outline" onClick={openEdit}>
                    Edit
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                {albumAtLocation && !isEditing && !isConfirmingDelete && (
                  <Button type="button" variant="destructive" onClick={() => setIsConfirmingDelete(true)}>
                    Delete
                  </Button>
                )}
                {isConfirmingDelete && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-600">Delete this album?</span>
                    <Button type="button" variant="destructive" onClick={handleDeleteAlbum}>
                      Confirm
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsConfirmingDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
