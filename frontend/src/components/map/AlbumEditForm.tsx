import { useEffect, useState, type SetStateAction } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { Page } from "@/types";
import { cloudinaryImageUrl } from "./albumModalUtils";

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
};

export default function AlbumEditForm({
  editForm,
  setEditForm,
  pages,
  setPages,
  cloudName,
  onCancel,
  onSave,
}: AlbumEditFormProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!pages.length) {
      setActiveImageIndex(0);
      return;
    }
    if (activeImageIndex > pages.length - 1) {
      setActiveImageIndex(pages.length - 1);
    }
  }, [pages, activeImageIndex]);

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
        <div className="flex flex-col gap-2">
          <Label>Images</Label>
          {pages.length > 0 ? (
            <div className="mt-2 rounded-lg border border-slate-200 p-3 flex flex-col gap-3">
              <img
                src={cloudinaryImageUrl(cloudName, pages[activeImageIndex].id)}
                alt={`Album page ${activeImageIndex + 1}`}
                className="h-52 w-full rounded-md object-cover"
              />

              <Input
                id="edit-image-caption"
                value={pages[activeImageIndex].caption ?? ""}
                onChange={(e) =>
                  setPages((prev) =>
                    prev.map((page, idx) =>
                      idx === activeImageIndex
                        ? { ...page, caption: e.target.value }
                        : page,
                    ),
                  )
                }
                placeholder="Write a caption for this image"
              />

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setActiveImageIndex((current) => Math.max(0, current - 1))
                  }
                  disabled={activeImageIndex === 0}
                >
                  Prev
                </Button>
                <span className="text-sm text-slate-600">
                  {activeImageIndex + 1} / {pages.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setActiveImageIndex((current) =>
                      Math.min(pages.length - 1, current + 1),
                    )
                  }
                  disabled={activeImageIndex === pages.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No images in this album.</p>
          )}
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
