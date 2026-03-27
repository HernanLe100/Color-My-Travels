import { MapContainer, Marker, Polygon, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default icon paths
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const icon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPage() {
  const position: [number, number] = [40.343, -74.651];

  const princetonArea: [number, number][] = [
    [40.37, -74.7], // NW
    [40.37, -74.62], // NE
    [40.32, -74.6], // SE
    [40.3, -74.68], // SW
  ];

  return (
    <div className="h-screen w-full">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* shaded area */}
        <Polygon
          positions={princetonArea}
          pathOptions={{
            color: "orange",
            fillColor: "orange",
            fillOpacity: 0.3,
          }}
        />

        <Marker position={position} icon={icon}>
          <Popup>Princeton</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
