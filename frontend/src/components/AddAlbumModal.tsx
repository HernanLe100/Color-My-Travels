import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import CitySearch from "./CitySearch";
import type { SearchLocation } from "@/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;

  name: string;
  setName: (v: string) => void;

  notes: string;
  setNotes: (v: string) => void;

  startDate: string;
  setStartDate: (v: string) => void;

  endDate: string;
  setEndDate: (v: string) => void;

  images: File[];
  setImages: (files: File[]) => void;

  selectedLocation: SearchLocation | null;
  handleSelect: (loc: SearchLocation) => void;

  submitError: string | null;
  isSubmitting: boolean;
};

export default function AddAlbumModal({
  isOpen,
  onClose,
  onSubmit,
  name,
  setName,
  notes,
  setNotes,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  images,
  setImages,
  selectedLocation,
  handleSelect,
  submitError,
  isSubmitting,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">New Album</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create a new album entry for a location.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Album Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <CitySearch onSelect={handleSelect} />
          {selectedLocation && (
            <p className="text-sm text-slate-600">
              Selected: {selectedLocation.city}
              {selectedLocation.state ? `, ${selectedLocation.state}` : ""},{" "}
              {selectedLocation.country}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Images</Label>
            <input
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}