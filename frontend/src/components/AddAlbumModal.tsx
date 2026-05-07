import { useEffect, useRef, useState, type SetStateAction } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import CitySearch from "./CitySearch";
import type { SearchLocation } from "@/types";
import { Textarea } from "./ui/textarea";
import ImageUploadInput from "./ImageUploadInput";
import { ChevronLeft, ChevronRight, MapPinPlus, Trash2 } from "lucide-react";

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
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    city?: "required" | "unselected";
    dateRange?: boolean;
    image?: string;
  }>({});
  const cityQueryRef = useRef("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const cityTyped = cityQueryRef.current.trim().length > 0;
    const errors: typeof fieldErrors = {};

    if (!selectedLocation) errors.city = cityTyped ? "unselected" : "required";
    if (startDate && endDate && endDate < startDate) errors.dateRange = true;

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      return;
    }

    onSubmit(e);
  };

  const effectiveImageIndex =
    images.length === 0 ? 0 : Math.min(activeImageIndex, images.length - 1);

  const firstError = fieldErrors.city === "unselected"
    ? "Choose a city from search"
    : fieldErrors.city === "required"
      ? "City is required"
      : fieldErrors.dateRange
        ? "End date should be on or after start date"
        : fieldErrors.image
          ? fieldErrors.image
          : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 px-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#FEF9F1] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-4 shrink-0">
          <h2 className="text-2xl font-bold font-serif text-[#5E3023]">New Album</h2>
          <button
            type="button"
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleFormSubmit}
          noValidate
          className="flex flex-col min-h-0 flex-1"
        >
          <div className="overflow-y-auto flex-1 px-7 space-y-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="flex gap-0 font-serif font-semibold text-[#5E3023]">
              Album Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this album"
              maxLength={50}
              className="bg-white text-black font-serif"
            />
          </div>

          <CitySearch
            onSelect={handleSelect}
            isRequired={!selectedLocation}
            onQueryChange={(q) => { cityQueryRef.current = q; }}
          />
          {selectedLocation && (
            <p className="text-sm text-[#2A81CB] font-serif">
              Selected: {selectedLocation.city}
              {selectedLocation.adm1_name
                ? `, ${selectedLocation.adm1_name}`
                : ""}, {selectedLocation.country}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label className="flex gap-0 text-[#5E3023] font-serif font-semibold">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`bg-white font-serif ${startDate ? "text-black" : "text-neutral-500"}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="flex gap-0 text-[#5E3023] font-serif font-semibold">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`bg-white font-serif ${endDate ? "text-black" : "text-neutral-500"}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 text-[#5E3023]">
            <Label className="font-serif font-semibold">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write a description for this album"
              className="bg-white text-black font-serif"
            />
          </div>

          <div className="flex flex-col gap-2 text-[#5E3023]">
            <Label className="font-serif font-semibold">Images</Label>
            <ImageUploadInput
              onError={(msg) => setFieldErrors((f) => ({ ...f, image: msg ?? undefined }))}
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
              <div className="mt-2 bg-white rounded-lg border border-slate-200 p-3 flex flex-col gap-3">
                <img
                  src={URL.createObjectURL(images[effectiveImageIndex])}
                  alt={`Selected upload ${effectiveImageIndex + 1}`}
                  className="h-52 w-full rounded-md object-cover"
                />

                <Input
                  id="image-caption"
                  value={imageCaptions[effectiveImageIndex] ?? ""}
                  onChange={(e) => {
                    const nextCaptions = [...imageCaptions];
                    nextCaptions[effectiveImageIndex] = e.target.value;
                    setImageCaptions(nextCaptions);
                  }}
                  placeholder="Write a caption for this image"
                  className="bg-white text-black font-serif"
                />

                {/* Image navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveImageIndex((c) => Math.max(0, c - 1))}
                    disabled={effectiveImageIndex === 0}
                    className="cursor-pointe text-black"
                  >
                    <ChevronLeft className="size-4" /> Prev
                  </Button>
                  <span className="text-sm text-slate-600">
                    {effectiveImageIndex + 1} / {images.length}
                  </span>
                  <div className="flex items-center gap-2">
                    {confirmDeleteIndex === effectiveImageIndex ? (
                      <>
                        <span className="text-xs text-stone-600">Delete image?</span>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            setImages((prev) => prev.filter((_, i) => i !== effectiveImageIndex));
                            setImageCaptions((prev) => prev.filter((_, i) => i !== effectiveImageIndex));
                            setActiveImageIndex((c) => Math.max(0, c - 1));
                            setConfirmDeleteIndex(null);
                          }}
                        >
                          Confirm
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setConfirmDeleteIndex(null)}
                          className="cursor-pointer text-black"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setConfirmDeleteIndex(effectiveImageIndex)}
                        className="cursor-pointer"
                      >
                        Delete <Trash2 className="size-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveImageIndex((c) => Math.min(images.length - 1, c + 1))}
                      disabled={effectiveImageIndex === images.length - 1}
                      className="cursor-pointer text-black"
                    >
                      Next <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>{/* end scrollable */}

          {/* Footer */}
          <div className="shrink-0 px-7 py-4 flex flex-col gap-2">
            {firstError && (
              <p className="text-sm text-red-600">{firstError}</p>
            )}
            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                size="lg"
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer bg-[#2A81CB] hover:bg-[#1F3665]"
              >
                {isSubmitting ? "Saving…" : "Create Album"}
                {!isSubmitting && <MapPinPlus size={14} />}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
