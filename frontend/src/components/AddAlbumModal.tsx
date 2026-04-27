import { useEffect, useState, type SetStateAction } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import CitySearch from "./CitySearch";
import type { SearchLocation } from "@/types";
import { Textarea } from "./ui/textarea";
import ImageUploadInput from "./ImageUploadInput";

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
  setImages: (value: SetStateAction<File[]>) => void;
  setImageCaptions: (value: SetStateAction<string[]>) => void;
  imageCaptions: string[];

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
  imageCaptions,
  setImageCaptions,
  selectedLocation,
  handleSelect,
  submitError,
  isSubmitting,
}: Props) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!images.length) {
      setActiveImageIndex(0);
      return;
    }
    if (activeImageIndex > images.length - 1) {
      setActiveImageIndex(images.length - 1);
    }
  }, [images, activeImageIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900 px-2">New Album</h2>
        <p className="mt-1 text-sm text-slate-600 px-2">
          Create a new album entry for a location.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-4 space-y-3 max-h-[500px] overflow-y-auto px-2"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="flex gap-0">
              Album Name<span className="text-xs text-red-600">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this album"
              required
            />
          </div>

          <CitySearch onSelect={handleSelect} isRequired={!selectedLocation} />
          {selectedLocation && (
            <p className="text-sm text-slate-600">
              Selected: {selectedLocation.city}
              {selectedLocation.state
                ? `, ${selectedLocation.state}`
                : ""}, {selectedLocation.country}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label className="flex gap-0">
              Start Date<span className="text-xs text-red-600">*</span>
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="flex gap-0">
              End Date<span className="text-xs text-red-600">*</span>
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write a description for this album"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Images</Label>
            <ImageUploadInput
              onFilesAdded={(selectedFiles) => {
                // append images
                setImages((prev) => {
                  const next = [...prev, ...selectedFiles];

                  // jump to first newly added image
                  setActiveImageIndex(prev.length);

                  return next;
                });

                setImageCaptions((prev) => [
                  ...prev,
                  ...selectedFiles.map(() => ""),
                ]);
              }}
            />

            {images.length > 0 && (
              <div className="mt-2 rounded-lg border border-slate-200 p-3 flex flex-col gap-3">
                <img
                  src={URL.createObjectURL(images[activeImageIndex])}
                  alt={`Selected upload ${activeImageIndex + 1}`}
                  className="h-52 w-full rounded-md object-cover"
                />

                <Input
                  id="image-caption"
                  value={imageCaptions[activeImageIndex] ?? ""}
                  onChange={(e) => {
                    const nextCaptions = [...imageCaptions];
                    nextCaptions[activeImageIndex] = e.target.value;
                    setImageCaptions(nextCaptions);
                  }}
                  placeholder="Write a caption for this image"
                />

                {/* Image navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setActiveImageIndex((current) => Math.max(0, current - 1))
                    }
                    disabled={activeImageIndex === 0}
                    className="cursor-pointer"
                  >
                    Prev
                  </Button>
                  <span className="text-sm text-slate-600">
                    {activeImageIndex + 1} / {images.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setActiveImageIndex((current) =>
                        Math.min(images.length - 1, current + 1),
                      )
                    }
                    disabled={activeImageIndex === images.length - 1}
                    className="cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="lg"
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer hover:bg-neutral-700"
            >
              {isSubmitting ? "Saving…" : "Add Album"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
