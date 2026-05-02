import { useEffect, useMemo, useRef, useState } from "react";
import { useZoomLevel } from "@/hooks/useZoomLevel";
import type {
  MapGeoJSONData,
  PolygonLevel,
} from "@/components/map/mapGeoTypes";
import type { Album, Color, Page, Pin } from "@/types";

import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function useMapTravelData(
  token: string | null | undefined,
  isTogglePins: boolean,
) {
  const zoom = useZoomLevel();
  const [adm0, setAdm0] = useState<unknown[]>([]);
  const [adm1, setAdm1] = useState<unknown[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [colors, setColors] = useState<Color[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);

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
          pages: Array.isArray(a.pages) ? (a.pages as Page[]) : [],
          start_date: String(a.start_date ?? ""),
          end_date: String(a.end_date ?? ""),
          location_id: Number(a.location_id),
          name: String(a.name ?? ""),
          created_at: String(a.created_at ?? ""),
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

  const cache = useRef(new Map<string, unknown>());

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
        {headers: {
          "Accept": "application/json",
          Authorization: `Bearer ${token}`
        }}
      );
      const data = (await res.json()) as Record<string, unknown> & {
        crs?: unknown;
      };

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

  const polygonLevel: PolygonLevel = zoom >= 5 ? "ADM1" : "ADM0";
  const showPins = isTogglePins || zoom >= 8;
  const showPolygons = true; // zoom < 8;
  // note: we don't really need showPolygons if it's always true now, but I think it's nice to have that option if we ever change our minds again

  const geoData = polygonLevel === "ADM0" ? adm0 : adm1;

  const combinedGeo = useMemo((): MapGeoJSONData => {
    type GeoChunk = { features?: MapGeoJSONData["features"] };
    return {
      type: "FeatureCollection",
      features: (geoData as GeoChunk[]).flatMap((g) => g?.features ?? []),
    };
  }, [geoData]);

  const filteredGeo = useMemo(() => {
    if (polygonLevel !== "ADM1") return combinedGeo;

    const pinPoints = pins.map((p) => ({
      pt: point([p.lng, p.lat]),
      adm1: p.adm1,
      country: p.country
    }));

    const features = combinedGeo.features.flatMap((f) => {
      const iso = f.properties?.shapeISO;
  
      // first try match ISO code
      if (typeof iso === "string" && visitedADM1.has(iso)) {
        return [f];
      }
  
      // if no ISO match, find which polygon location exists in
      const match = pinPoints.find((p) =>
        f.properties?.shapeGroup === p.country &&
        booleanPointInPolygon(p.pt, f as any)
      );
  
      if (!match) return [];
  
      return [
        {
          ...f,
          properties: {
            ...f.properties,
            shapeISO: match.adm1, // fix ISO
          },
        },
      ];

    });

    const data = {
      type: "FeatureCollection" as const,
      features,
    };
    return data;
  }, [combinedGeo, visitedADM1, polygonLevel]);

  return {
    pins,
    albums,
    setAlbums,
    colors,
    pinsLoaded,
    loaded,
    polygonLevel,
    showPins,
    showPolygons,
    filteredGeo,
    countryColorMap,
    adm1ColorMap,
    setColors,
  };
}