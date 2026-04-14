import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import MapContent from "./MapContent";
import { useAuth } from "@/App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import CitySearch from "./CitySearch";
import { Label } from "./ui/label";
import type { SearchLocation } from "@/types";
import { Switch } from "./ui/switch";

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

  const [isTogglePins, setIsTogglePins] = useState(false);

  const token = useAuth();

  const [selectedLocation, setSelectedLocation] =
    useState<SearchLocation | null>(null);

  const handleSelect = (location: SearchLocation) => {
    setSelectedLocation(location);
  };

  const handleAddAlbum = async (locationId: number) => {
    if (!token) return;

    const res = await fetch(`${BACKEND_URL}/add_album`, {
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

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Failed to add album");
    }

    window.location.reload();
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

      // 3. Upload images
      await Promise.all(
        images.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("album_id", albumId);

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
        }),
      );

      // reset
      setIsModalOpen(false);
      setImages([]);
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
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">New Album</h2>
            <p className="mt-1 text-sm text-slate-600">
              Create a new album entry for a location.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Album Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Add a name for your album"
                  required
                />
              </div>

              <CitySearch onSelect={handleSelect} />
              {selectedLocation && (
                <p className="text-sm text-slate-600">
                  Selected: {selectedLocation.city}
                  {selectedLocation.state
                    ? `, ${selectedLocation.state}`
                    : ""}, {selectedLocation.country}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  placeholder="Add the start date of your trip"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  placeholder="Add the end date of your trip"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Enter trip notes here..."
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Images</Label>
                <input
                  id="notes"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImages(Array.from(e.target.files));
                    }
                  }}
                  required
                />
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {images.map((file, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubmitError(null);
                    setIsModalOpen(false);
                  }}
                  size="lg"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting ? "Saving…" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
