import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Album, Page, Pin } from "@/types";
import { Button } from "../ui/button";
import AlbumEditForm from "./AlbumEditForm";
import {
  cloudinaryImageUrl,
  formatAlbumDate,
  toDateInputValue,
} from "./albumModalUtils";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type AlbumPageSlot =
  | { kind: "empty" }
  | { kind: "cover" }
  | { kind: "photo"; page: Page; index: number };

function albumPageSlots(album: Album | null): AlbumPageSlot[] {
  if (!album) return [{ kind: "empty" }];
  const slots: AlbumPageSlot[] = [{ kind: "cover" }];
  album.pages.forEach((p, index) => {
    if (p?.id) slots.push({ kind: "photo", page: p, index });
  });
  return slots;
}

type AlbumDetailModalProps = {
  pin: Pin;
  album: Album | null;
  token: string | null | undefined;
  cloudName: string | undefined;
  onClose: () => void;
  setAlbums: Dispatch<SetStateAction<Album[]>>;
};

export default function AlbumDetailModal({
  pin,
  album,
  token,
  cloudName,
  onClose,
  setAlbums,
}: AlbumDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    notes: "",
    start_date: "",
    end_date: "",
  });
  const [editPages, setEditPages] = useState<Page[]>([]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  const slots = useMemo(() => albumPageSlots(album), [album]);

  useEffect(() => {
    setIsEditing(false);
    setIsConfirmingDelete(false);
    setPageIndex(0);
  }, [pin.location_id, album?.album_id]);

  // to make sure the modal is focused when it is opened to prevent the map from moving
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    el.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  // to make sure the modal is focused when it is edited to prevent the map from moving
  useEffect(() => {
    if (isEditing) return;
    overlayRef.current?.focus({ preventScroll: true });
  }, [isEditing]);

  useEffect(() => {
    const root = overlayRef.current;
    if (!root) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const el = overlayRef.current;
      if (!el || !el.contains(e.target as Node)) return;

      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (isEditing) return;

      if (e.key === "ArrowLeft") {
        setPageIndex((i) => Math.max(0, i - 1));
      } else {
        setPageIndex((i) => Math.min(slots.length - 1, i + 1));
      }
    }

    root.addEventListener("keydown", onKeyDown, true);
    return () => root.removeEventListener("keydown", onKeyDown, true);
  }, [isEditing, slots.length]);

  useEffect(() => {
    if (pageIndex >= slots.length) {
      setPageIndex(Math.max(0, slots.length - 1));
    }
  }, [pageIndex, slots.length]);

  function openEdit() {
    if (!album) return;
    setEditForm({
      name: album.name ?? "",
      notes: album.notes ?? "",
      start_date: toDateInputValue(album.start_date),
      end_date: toDateInputValue(album.end_date),
    });
    setEditPages(album.pages?.filter((p) => Boolean(p?.id)) ?? []);
    setIsEditing(true);
  }

  function handleClose() {
    setIsEditing(false);
    setIsConfirmingDelete(false);
    onClose();
  }

  async function handleDeleteAlbum() {
    if (!album) return;
    const res = await fetch(
      `${BACKEND_URL}/delete_album?album_id=${album.album_id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      alert(`Failed to delete album: ${await res.text()}`);
      setIsConfirmingDelete(false);
      return;
    }
    window.location.reload();
  }

  async function handleSaveEdit() {
    if (!album) return;
    const res = await fetch(`${BACKEND_URL}/edit_album`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        album_id: album.album_id,
        ...editForm,
        pages: editPages,
      }),
    });
    if (!res.ok) {
      console.error("Failed to save album:", await res.text());
      return;
    }
    setAlbums((prev) =>
      prev.map((a) =>
        a.album_id === album.album_id ? { ...a, ...editForm, pages: editPages } : a,
      ),
    );
    setIsEditing(false);
  }

  const slot = slots[pageIndex] ?? slots[0];
  const totalPages = slots.length;
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };
  const stopAndPreventEvent = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  function renderPageBody() {
    if (!slot) return null;
    switch (slot.kind) {
      case "empty":
        return (
          <div className="flex h-full min-h-[18rem] flex-col items-center justify-center text-center">
            <p className="text-sm">No album for this place yet.</p>
          </div>
        );
      case "cover":
        if (!album) return null;
        return (
          <div className="flex max-h-[28rem] min-h-[18rem] flex-col items-center overflow-y-auto px-2 py-2 text-center text-[#5E3023]">
            <p className="text-xs font-medium uppercase tracking-wide">
              Travel album
            </p>
            <h3 className="mt-4 font-serif text-2xl">
              {album.name || "Untitled"}
            </h3>
            <p className="mt-3 text-sm">
              {formatAlbumDate(album.start_date)} —{" "}
              {formatAlbumDate(album.end_date)}
            </p>
            {album.notes?.trim() ? (
              <div className="mt-6 w-full max-w-sm text-left">
                <p className="mt-2 whitespace-pre-wrap border-l-2 border-stone-400 pl-3 text-sm leading-relaxed">
                  {album.notes}
                </p>
              </div>
            ) : null}
          </div>
        );
      case "photo":
        return (
          <div className="flex min-h-[18rem] flex-col gap-3">
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded">
              <img
                src={cloudinaryImageUrl(cloudName, slot.page.id)}
                alt={slot.page.caption || "Album photo"}
                className="max-h-[14rem] w-full object-contain"
              />
            </div>

            {slot.page.caption ? (
              <div className="mt-6 w-full max-w-sm text-left">
                <p className="mt-2 whitespace-pre-wrap border-l-2 border-stone-400 pl-3 text-sm leading-relaxed text-stone-800">
                  {slot.page.caption}
                </p>
              </div>
            ) : null}

            <p className="text-right text-xs text-stone-400">
              {slot.index + 1}
            </p>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="album-dialog-title"
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 p-4 outline-none"
      onClick={handleClose}
      // to make sure the map doesn't move
      onMouseDown={stopEvent}
      onMouseUp={stopEvent}
      onMouseMove={stopEvent}
      onDoubleClick={stopEvent}
      onTouchStart={stopEvent}
      onTouchMove={stopAndPreventEvent}
      onWheel={stopAndPreventEvent}
    >
      <div
        className="w-full max-w-2xl rounded-lg border-2 border-stone-300 bg-stone-100 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={stopEvent}
        onMouseUp={stopEvent}
        onMouseMove={stopEvent}
        onDoubleClick={stopEvent}
        onTouchStart={stopEvent}
        onTouchMove={stopAndPreventEvent}
        onWheel={stopAndPreventEvent}
      >
        <header className="relative border-b border-stone-300 pb-3 text-center">
          <button
            type="button"
            className="absolute right-0 top-0 text-stone-400 hover:text-stone-700 cursor-pointer"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
          <h2
            id="album-dialog-title"
            className="pr-8 font-serif text-xl text-stone-900"
          >
            {pin.city || "Somewhere"}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {[pin.adm1, pin.country].filter(Boolean).join(" · ")}
          </p>
        </header>

        {isEditing && album ? (
          <AlbumEditForm
            editForm={editForm}
            setEditForm={setEditForm}
            pages={editPages}
            setPages={setEditPages}
            cloudName={cloudName}
            onCancel={() => setIsEditing(false)}
            onSave={handleSaveEdit}
          />
        ) : (
          <>
            <div className="relative mt-4 min-h-[20rem] rounded-r-md border border-stone-300 bg-[#F3E9DC] shadow-inner">
              <div
                className="absolute bottom-2 left-0 top-2 w-2 rounded-sm bg-[#895737]"
                aria-hidden
              />
              <div className="min-h-[20rem] pl-5 pr-4 py-4">
                {renderPageBody()}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-300 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
                <span className="ml-1 hidden sm:inline">Prev</span>
              </Button>
              <p className="text-center text-xs text-stone-600">
                Page {totalPages === 0 ? 0 : pageIndex + 1} of {totalPages}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() =>
                  setPageIndex((i) => Math.min(totalPages - 1, i + 1))
                }
                aria-label="Next page"
              >
                <span className="mr-1 hidden sm:inline">Next</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        <div
          className={`mt-4 flex justify-between border-t border-stone-300 pt-4 ${
            isEditing ? "hidden" : ""
          }`}
        >
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveEdit}>
                  Save
                </Button>
              </>
            ) : album && !isConfirmingDelete ? (
              <Button type="button" variant="outline" onClick={openEdit}>
                Edit
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            {album && !isEditing && !isConfirmingDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsConfirmingDelete(true)}
              >
                Delete
              </Button>
            )}
            {isConfirmingDelete && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-sm text-stone-600">
                  Delete this album?
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteAlbum}
                >
                  Confirm
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
