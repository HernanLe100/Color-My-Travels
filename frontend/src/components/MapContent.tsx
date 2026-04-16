import { useMemo, useState } from "react";
import type { Pin } from "@/types";
import { useAuth } from "@/App";
import { useMapTravelData } from "@/hooks/useMapTravelData";
import AlbumDetailModal from "./map/AlbumDetailModal";
import MapContentLoading from "./map/MapContentLoading";
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
  } = useMapTravelData(token, isTogglePins);

  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const albumAtLocation = useMemo(() => {
    if (!selectedPin) return null;
    return (
      albums.find((a) => a.location_id === selectedPin.location_id) ?? null
    );
  }, [albums, selectedPin]);

  if (!pinsLoaded || !loaded) {
    return <MapContentLoading />;
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
          album={albumAtLocation}
          token={token}
          cloudName={cloudName}
          onClose={() => setSelectedPin(null)}
          setAlbums={setAlbums}
        />
      )}
    </>
  );
}
