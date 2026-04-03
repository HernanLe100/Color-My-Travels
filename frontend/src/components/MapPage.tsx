import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import MapContent from "./MapContent";
import { useAuth } from "@/App";

// Fix default icon paths
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapPage() {
  const position: [number, number] = [20, 0];

  const token = useAuth();

  const handleAddAlbum = async () => {
    if (!token) return;

    const res = await fetch("https://127.0.0.1:5001/add_album", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        location_id: 1,
        caption: "Princeton",
      }),
    });

    const data = await res.json();
    console.log("Added album:", data);

    // quick refresh
    window.location.reload();
  };

  return (
    <div className="h-screen w-full">
      <MapContainer
        center={position}
        zoom={3}
        minZoom={2}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap & Carto"
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />

        {/* Labels-only layer */}
        <TileLayer
          attribution="&copy; OpenStreetMap & Carto"
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          pane="overlayPane"
        />

        {/* either polygon or pin depending on zoom level */}
        <MapContent />
      </MapContainer>

      <button
        onClick={handleAddAlbum}
        className="absolute bottom-6 right-6 z-[1000] cursor-pointer
             w-14 h-14 rounded-full 
             bg-blue-600 hover:bg-blue-700
             text-white text-2xl
             flex items-center justify-center
             shadow-xl"
      >
        +
      </button>
    </div>
  );
}
