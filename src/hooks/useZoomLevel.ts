import { useMapEvents } from "react-leaflet";
import { useState } from "react";

export function useZoomLevel() {
  const [zoom, setZoom] = useState(3);

  // listen to Leaflet map events
  // zoomend fires every time user zooms
  // e.target.getZoom() returns the current zoom level
  useMapEvents({
    zoomend: (e) => {
      setZoom(e.target.getZoom());
    },
  });

  return zoom;
}