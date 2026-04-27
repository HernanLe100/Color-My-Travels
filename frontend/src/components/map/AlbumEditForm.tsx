import { useEffect, useState, type SetStateAction } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { Color, Page, Pin } from "@/types";
import { cloudinaryImageUrl } from "./albumModalUtils";
import ImageUploadInput from "../ImageUploadInput";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type EditFormState = {
  name: string;
  notes: string;
  start_date: string;
  end_date: string;
};

type AlbumEditFormProps = {
  editForm: EditFormState;
  setEditForm: (value: SetStateAction<EditFormState>) => void;
  pages: Page[];
  setPages: (value: SetStateAction<Page[]>) => void;
  cloudName: string | undefined;
  onCancel: () => void;
  onSave: () => void;
  newPageFiles: File[];
  setNewPageFiles: (value: SetStateAction<File[]>) => void;
  newPageCaptions: string[];
  setNewPageCaptions: (value: SetStateAction<string[]>) => void;
};

export default function AlbumEditForm({
  editForm,
  setEditForm,
  pages,
  setPages,
  cloudName,
  onCancel,
  onSave,
  newPageFiles,
  setNewPageFiles,
  newPageCaptions,
  setNewPageCaptions,
}: AlbumEditFormProps) {
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(
    null,
  );

  const totalItems = pages.length + newPageFiles.length;
  const viewingExisting = activeCarouselIndex < pages.length;
  const existingIndex = activeCarouselIndex;
  const newIndex = activeCarouselIndex - pages.length;

  useEffect(() => {
    if (totalItems === 0) {
      setActiveCarouselIndex(0);
      setConfirmDeleteIndex(null);
      return;
    }
    if (activeCarouselIndex > totalItems - 1) {
      setActiveCarouselIndex(totalItems - 1);
    }
  }, [totalItems, activeCarouselIndex]);

  const [showNewTag, setShowNewTag] = useState(false);

  function handleShowNewTag() {
    setShowNewTag(true);
    setTimeout(() => {
      setShowNewTag(false);
    }, 2000); // Hide the message after 2 seconds
  }

  return (
    <>
      <div className="mt-4 space-y-3 px-2 max-h-[500px] overflow-y-auto">
        {/* name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-album-name">Album Name</Label>
          <Input
            id="edit-album-name"
            value={editForm.name}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Enter a name for this album"
          />
        </div>

        {/* dates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-start-date">Start Date</Label>
            <Input
              id="edit-start-date"
              type="date"
              value={editForm.start_date}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  start_date: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-end-date">End Date</Label>
            <Input
              id="edit-end-date"
              type="date"
              value={editForm.end_date}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  end_date: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* notes */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-notes">Notes</Label>
          <Textarea
            id="edit-notes"
            rows={4}
            value={editForm.notes}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, notes: e.target.value }))
            }
            placeholder="Write a description for this album"
          />
        </div>

        {/* images */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label>Pages</Label>
            {totalItems > 0 ? (
              <div className="mt-2 rounded-lg border border-slate-200 p-3 flex flex-col gap-3">
                <img
                  src={
                    viewingExisting
                      ? cloudinaryImageUrl(cloudName, pages[existingIndex].id)
                      : URL.createObjectURL(newPageFiles[newIndex])
                  }
                  alt={`Album page ${activeCarouselIndex + 1}`}
                  className="h-52 w-full rounded-md object-cover"
                />

                <Input
                  id="edit-image-caption"
                  value={
                    viewingExisting
                      ? (pages[existingIndex].caption ?? "")
                      : (newPageCaptions[newIndex] ?? "")
                  }
                  onChange={(e) => {
                    if (viewingExisting) {
                      setPages((prev) =>
                        prev.map((page, idx) =>
                          idx === existingIndex
                            ? { ...page, caption: e.target.value }
                            : page,
                        ),
                      );
                      return;
                    }
                    const nextCaptions = [...newPageCaptions];
                    nextCaptions[newIndex] = e.target.value;
                    setNewPageCaptions(nextCaptions);
                  }}
                  placeholder={
                    viewingExisting
                      ? "Write a caption for this image"
                      : "Write a caption for this new image"
                  }
                />

                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setActiveCarouselIndex((current) =>
                        Math.max(0, current - 1),
                      )
                    }
                    disabled={activeCarouselIndex === 0}
                    className="cursor-pointer"
                  >
                    Prev
                  </Button>
                  <span className="text-sm text-slate-600 flex items-center gap-1">
                    {activeCarouselIndex + 1} / {totalItems}
                    {showNewTag && (
                      <span className="text-sm text-green-700">(New!)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {confirmDeleteIndex === activeCarouselIndex ? (
                      <>
                        <span className="text-xs text-stone-600">
                          Are you sure?
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            if (viewingExisting) {
                              setPages((prev) =>
                                prev.filter((_, idx) => idx !== existingIndex),
                              );
                            } else {
                              setNewPageFiles((prev) =>
                                prev.filter((_, idx) => idx !== newIndex),
                              );
                              setNewPageCaptions((prev) =>
                                prev.filter((_, idx) => idx !== newIndex),
                              );
                            }
                            setConfirmDeleteIndex(null);
                          }}
                        >
                          Confirm
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setConfirmDeleteIndex(null)}
                          className="cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setConfirmDeleteIndex(activeCarouselIndex)
                        }
                        className="cursor-pointer"
                      >
                        Delete page
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setActiveCarouselIndex((current) =>
                          Math.min(totalItems - 1, current + 1),
                        )
                      }
                      disabled={activeCarouselIndex === totalItems - 1}
                      className="cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No images in this album.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Add new pages by uploading new images</Label>
            <ImageUploadInput
              onFilesAdded={(selectedFiles) => {
                setNewPageFiles((prev) => [...prev, ...selectedFiles]);
                setNewPageCaptions((prev) => [
                  ...prev,
                  ...selectedFiles.map(() => ""),
                ]);

                if (totalItems === 0 && selectedFiles.length > 0) {
                  setActiveCarouselIndex(0);
                }

                toast.success("New pages added successfully");
                handleShowNewTag();
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-stone-300 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onSave}>
          Save
        </Button>
      </div>
    </>
  );
}
