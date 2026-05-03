import { Marker, Tooltip } from "react-leaflet";
import type { Pin } from "@/types";
import type { Icon } from "leaflet";
import { tripPinIcon } from "./leafletTripPinIcon";

type TripMarkersLayerProps = {
  pins: Pin[];
  showPins: boolean;
  icon?: Icon;
  onPinSelect: (pin: Pin) => void;
};

export default function TripMarkersLayer({
  pins,
  showPins,
  icon = tripPinIcon,
  onPinSelect,
}: TripMarkersLayerProps) {
  if (!showPins) return null;

  return (
    <>
      {pins.map((p) => (
        <Marker
          key={p.location_id}
          position={[p.lat, p.lng]}
          icon={icon}
          eventHandlers={{
            click: () => onPinSelect(p),
          }}
        >
          <Tooltip direction="top" offset={[0, -30]} className="map-pin-tooltip">
            View Album
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
