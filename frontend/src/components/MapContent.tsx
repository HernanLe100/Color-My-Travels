import { useMemo, useState } from "react";
import type { Pin } from "@/types";
import { useAuth } from "@/App";
import { useMapTravelData } from "@/hooks/useMapTravelData";
import AlbumDetailModal from "./map/AlbumDetailModal";
import Loading from "./Loading";
import TripMarkersLayer from "./map/TripMarkersLayer";
import VisitedRegionsGeoJSON from "./map/VisitedRegionsGeoJSON";

type MapContentProps = {
  isTogglePins?: boolean;
};

export default function MapContent({ isTogglePins = false }: MapContentProps) {
  const token = useAuth();
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const {
    pins,
    albums,
    setAlbums,
    pinsLoaded,
    loaded,
    polygonLevel,
    showPins,
    showPolygons,
    filteredGeo,
    countryColorMap,
    adm1ColorMap,
    setColors,
  } = useMapTravelData(token, isTogglePins);

  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const albumsAtLocation = useMemo(() => {
    if (!selectedPin) return [];

    return albums
      .filter((a) => a.location_id === selectedPin.location_id)
      .sort((a, b) => {
        const dateA = new Date(a.created_at ?? 0).getTime();
        const dateB = new Date(b.created_at ?? 0).getTime();
        return dateB - dateA;
      });
  }, [albums, selectedPin]);

  if (!pinsLoaded || !loaded) {
    return <Loading />;
  }

  return (
    <>
      <TripMarkersLayer
        pins={pins}
        showPins={showPins}
        onPinSelect={setSelectedPin}
      />

      <VisitedRegionsGeoJSON
        showPolygons={showPolygons}
        polygonLevel={polygonLevel}
        data={filteredGeo}
        countryColorMap={countryColorMap}
        adm1ColorMap={adm1ColorMap}
      />

      {selectedPin && (
        <AlbumDetailModal
          pin={selectedPin}
          albums={albumsAtLocation}
          token={token}
          cloudName={cloudName}
          onClose={() => setSelectedPin(null)}
          setAlbums={setAlbums}
          setColors={setColors}
        />
      )}
    </>
  );
}