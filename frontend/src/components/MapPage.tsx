import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import MapContent from "./MapContent";
import { useAuth } from "@/App";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import type { SearchLocation } from "@/types";
import { Switch } from "./ui/switch";
import AddAlbumModal from "./AddAlbumModal";

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

  const [isTogglePins, setIsTogglePins] = useState(false);

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

  return (
    <div className="h-screen w-full">
      <div className="pointer-events-auto absolute top-6 right-6 z-[1000]">
        <div className="flex max-w-xs items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div className="min-w-0 flex-1">
            <Label
              htmlFor="togglePins"
              className="block cursor-pointer text-sm font-medium text-slate-900"
            >
              Pins
            </Label>
          </div>
          <Switch
            id="togglePins"
            className="shrink-0 cursor-pointer"
            checked={isTogglePins}
            onCheckedChange={setIsTogglePins}
          />
        </div>
      </div>

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
        <MapContent isTogglePins={isTogglePins} />
      </MapContainer>

      <Button
        onClick={() => setIsModalOpen(true)}
        className="absolute bottom-6 right-6 z-[1000] cursor-pointer
             w-14 h-14 rounded-full 
             text-white text-2xl
             flex items-center justify-center
             shadow-xl"
      >
        +
      </Button>

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
