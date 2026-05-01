import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRef, useState } from "react";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import MapContent from "./MapContent";
import { useAuth } from "@/App";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import type { SearchLocation } from "@/types";
import { Switch } from "./ui/switch";
import AddAlbumModal from "./AddAlbumModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Fix default icon paths
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapPage() {
  const position: [number, number] = [20, 0];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [imageCaptions, setImageCaptions] = useState<string[]>([]);

  const [isTogglePins, setIsTogglePins] = useState(true);

  const token = useAuth();

  const [selectedLocation, setSelectedLocation] =
    useState<SearchLocation | null>(null);

  const handleSelect = (location: SearchLocation) => {
    setSelectedLocation(location);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!token) {
      setSubmitError("You must be signed in.");
      return;
    }
    if (!selectedLocation) {
      setSubmitError("Choose a city from search.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Ensure location
      const locRes = await fetch(`${BACKEND_URL}/ensure_location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adm1: selectedLocation.adm1,
          city: selectedLocation.city,
          country: selectedLocation.country,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        }),
      });

      const locData = await locRes.json();
      if (!locRes.ok) throw new Error(locData.error);

      const locationId = locData.location_id;

      // 2. Create album
      const albumRes = await fetch(`${BACKEND_URL}/add_album`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location_id: locationId,
          notes,
          name,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      const albumData = await albumRes.json();
      if (!albumRes.ok) throw new Error(albumData.error);

      const albumId = albumData.album_id;

      // 3. Upload images in order so album pages remain ordered.
      for (let index = 0; index < images.length; index += 1) {
        const file = images[index];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("album_id", albumId);
        formData.append("caption", imageCaptions[index] ?? "");

        const res = await fetch(`${BACKEND_URL}/upload_image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          console.error("Image upload failed");
        }
      }

      // reset
      setIsModalOpen(false);
      setImages([]);
      setImageCaptions([]);
      setNotes("");
      setName("");
      setStartDate("");
      setEndDate("");
      setSelectedLocation(null);

      window.location.reload();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------
  // drag and drop pins:
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const hasStartedDrag = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const handlePointerMove = (e: PointerEvent) => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    // start drag once outside button bounds
    if (!hasStartedDrag.current && isOutside) {
      hasStartedDrag.current = true;
      setDragging(true);

      mapRef.current?.dragging.disable();
    }
    if (!hasStartedDrag.current) return;

    setDragPos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const mapRef = useRef<L.Map | null>(null);
  const handlePointerUp = async (e: PointerEvent) => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);

    mapRef.current?.dragging.enable();
    dragStart.current = null;

    if (!hasStartedDrag.current) return;

    setDragging(false);

    if (!mapRef.current) return;

    const map = mapRef.current;

    // Convert screen coords -> map coords
    const point = map.containerPointToLatLng(
      map.mouseEventToContainerPoint(e as unknown as MouseEvent),
    );
    setIsModalOpen(true);

    const res = await fetch(
      `${BACKEND_URL}/coord_location?lat=${point.lat}&lng=${point.lng}`,
    );
    const data = await res.json();

    handleSelect({
      adm1: data[0].adm1,
      city: data[0].city,
      country: data[0].country,
      lat: data[0].lat,
      lng: data[0].lng,
      state: data[0].state,
    });

    hasStartedDrag.current = false;
  };
  // --------------------------------------------------

  return (
    <div className="h-screen w-full">
      <div className="pointer-events-auto absolute top-6 right-6 z-[1000]">
        <div className="flex max-w-xs items-center gap-4 rounded-xl border border-[#895737] bg-[#FEF9F1] px-4 py-3 shadow-lg">
          <div className="min-w-0 flex-1">
            <Label
              htmlFor="togglePins"
              className="block cursor-pointer text-sm font-medium text-[#5E3023]"
            >
              Pins
            </Label>
          </div>
          <Switch
            id="togglePins"
            className="shrink-0 cursor-pointer data-checked:bg-[#2A81CB]"
            checked={isTogglePins}
            onCheckedChange={setIsTogglePins}
          />
        </div>
      </div>

      <MapContainer
        center={position}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
        ref={mapRef}
        maxBounds={[
          [-90, -180], // southwest corner
          [90, 180],   // northeast corner
        ]}
        maxBoundsViscosity={0.8}
        zoomControl={false}
      >
        <ZoomControl 
          position="bottomleft"
        />
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
        <MapContent isTogglePins={isTogglePins} />
      </MapContainer>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsModalOpen(true)}
            // detect drags
            ref={buttonRef}
            onPointerDown={(e) => {
              e.preventDefault();
              dragStart.current = { x: e.clientX, y: e.clientY };
              hasStartedDrag.current = false;
              window.addEventListener("pointermove", handlePointerMove);
              window.addEventListener("pointerup", handlePointerUp);
            }}
            className="absolute bottom-6 right-6 z-[1000] cursor-pointer
             w-14 h-14 rounded-full
             bg-[#2A81CB] text-white text-2xl
             flex items-center justify-center
             shadow-xl"
          >
            +
          </Button>
        </TooltipTrigger>
        <TooltipContent className="z-[2000]">Add a new album</TooltipContent>
      </Tooltip>

      {dragging && (
        <div
          style={{
            position: "fixed",
            left: dragPos.x,
            top: dragPos.y,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
            zIndex: 2000,
          }}
        >
          <img src={markerIcon} style={{ width: 28, height: 41 }} />
        </div>
      )}

      {isModalOpen && (
        <AddAlbumModal
          isOpen={isModalOpen}
          onClose={() => {
            setSubmitError(null);
            setIsModalOpen(false);
          }}
          onSubmit={handleSubmit}
          name={name}
          setName={setName}
          notes={notes}
          setNotes={setNotes}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          images={images}
          setImages={setImages}
          imageCaptions={imageCaptions}
          setImageCaptions={setImageCaptions}
          selectedLocation={selectedLocation}
          handleSelect={handleSelect}
          submitError={submitError}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
