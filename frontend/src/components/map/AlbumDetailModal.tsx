import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useMap } from "react-leaflet";
import type { Album, Color, Page, Pin } from "@/types";
import { Button } from "../ui/button";
import AlbumEditForm from "./AlbumEditForm";
import {
  cloudinaryImageUrl,
  formatAlbumDate,
  toDateInputValue,
} from "./albumModalUtils";
import toast from "react-hot-toast";

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
  setColors: Dispatch<SetStateAction<Color[]>>;
};

export default function AlbumDetailModal({
  pin,
  album,
  token,
  cloudName,
  onClose,
  setAlbums,
  setColors,
}: AlbumDetailModalProps) {
  const map = useMap();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    notes: "",
    start_date: "",
    end_date: "",
  });
  const [editPages, setEditPages] = useState<Page[]>([]);
  const [newPageFiles, setNewPageFiles] = useState<File[]>([]);
  const [newPageCaptions, setNewPageCaptions] = useState<string[]>([]);
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

  // Prevent map pan/zoom while modal is open.
  useEffect(() => {
    const wasDraggingEnabled = map.dragging.enabled();
    const wasScrollWheelEnabled = map.scrollWheelZoom.enabled();
    const wasDoubleClickEnabled = map.doubleClickZoom.enabled();
    const wasTouchZoomEnabled = map.touchZoom.enabled();
    const wasBoxZoomEnabled = map.boxZoom.enabled();
    const wasKeyboardEnabled = map.keyboard.enabled();
    const wasTapEnabled =
      "tap" in map &&
      Boolean((map as { tap?: { enabled: () => boolean } }).tap?.enabled());

    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if ("tap" in map) {
      (map as { tap?: { disable: () => void } }).tap?.disable();
    }

    return () => {
      if (wasDraggingEnabled) map.dragging.enable();
      if (wasScrollWheelEnabled) map.scrollWheelZoom.enable();
      if (wasDoubleClickEnabled) map.doubleClickZoom.enable();
      if (wasTouchZoomEnabled) map.touchZoom.enable();
      if (wasBoxZoomEnabled) map.boxZoom.enable();
      if (wasKeyboardEnabled) map.keyboard.enable();
      if (wasTapEnabled) {
        (map as { tap?: { enable: () => void } }).tap?.enable();
      }
    };
  }, [map]);

  function openEdit() {
    if (!album) return;
    setEditForm({
      name: album.name ?? "",
      notes: album.notes ?? "",
      start_date: toDateInputValue(album.start_date),
      end_date: toDateInputValue(album.end_date),
    });
    setEditPages(album.pages?.filter((p) => Boolean(p?.id)) ?? []);
    setNewPageFiles([]);
    setNewPageCaptions([]);
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
    if (!album || !token) return;

    const appendedPages: Page[] = [];

    // 1. Upload images FIRST
    for (let index = 0; index < newPageFiles.length; index += 1) {
      const formData = new FormData();
      formData.append("file", newPageFiles[index]);
      formData.append("album_id", String(album.album_id));
      formData.append("caption", newPageCaptions[index] ?? "");

      const uploadRes = await fetch(`${BACKEND_URL}/upload_image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        console.error("Failed to upload:", await uploadRes.text());
        return;
      }

      const uploadData = await uploadRes.json();
      appendedPages.push({
        id: uploadData.id,
        caption: newPageCaptions[index] ?? "",
      });
    }

    // 2. Merge ALL pages
    const finalPages = [...editPages, ...appendedPages];

    // 3. THEN update album (single source of truth)
    const res = await fetch(`${BACKEND_URL}/edit_album`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        album_id: album.album_id,
        ...editForm,
        pages: finalPages,
      }),
    });

    if (!res.ok) {
      console.error("Failed to save album:", await res.text());
      return;
    }

    // 4. Update UI
    setAlbums((prev) =>
      prev.map((a) =>
        a.album_id === album.album_id
          ? { ...a, ...editForm, pages: finalPages }
          : a,
      ),
    );

    setNewPageFiles([]);
    setNewPageCaptions([]);
    setIsEditing(false);
  }

  const slot = slots[pageIndex] ?? slots[0];
  const totalPages = slots.length;
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;

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
          <div className="flex max-h-[28rem] flex-col items-center overflow-y-auto px-2 pt-2 pb-6 text-center text-[#5E3023]">
            
            <h3 className="mt-4 font-serif text-2xl">
              {album.name || "Untitled"}
            </h3>
            <p className="mt-3 text-sm">
              {formatAlbumDate(album.start_date)} —{" "}
              {formatAlbumDate(album.end_date)}
            </p>
            {album.notes?.trim() ? (
              <div className="mt-6 w-full max-w-md text-left">
                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                  {album.notes}
                </p>
              </div>
            ) : null}
          </div>
        );
      case "photo":
        return (
          <div className="flex flex-col gap-3">
            <div className="relative flex items-center justify-center overflow-hidden rounded">
              <img
                src={cloudinaryImageUrl(cloudName, slot.page.id)}
                alt={slot.page.caption || "Album photo"}
                className="max-h-[14rem] w-full object-contain"
              />
            </div>

            {slot.page.caption ? (
              <div className="max-h-24 overflow-y-auto px-2 w-full text-left">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#5E3023]">
                  {slot.page.caption}
                </p>
              </div>
            ) : null}

            <p className="text-right text-xs text-stone-400 overflow-auto">
              {slot.index + 1}
            </p>
          </div>
        );
      default:
        return null;
    }
  }

  const [localColors, setLocalColors] = useState<Color[]>([]);

  const handleColorChange = async (
    region_code: string,
    newColor: string,
    region_type: string,
    prevColor: string,
  ) => {
    if (!token) return;
    if (prevColor.toLowerCase() === newColor.toLowerCase()) return;

    // from useMapTravelData!!
    setColors((prev) =>
      prev.map((row) =>
        row.region_code === region_code && row.region_type === region_type
          ? { ...row, color: newColor }
          : row,
      ),
    );

    try {
      const res = await fetch(`${BACKEND_URL}/update_color`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          region_code,
          color: newColor,
          region_type,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Color updated successfully");
    } catch (err) {
      console.error(err);

      // rollback
      setLocalColors((prev) =>
        prev.map((row) =>
          row.region_code === region_code && row.region_type === region_type
            ? { ...row, color: prevColor }
            : row,
        ),
      );

      setColors((prev) =>
        prev.map((row) =>
          row.region_code === region_code && row.region_type === region_type
            ? { ...row, color: prevColor }
            : row,
        ),
      );
    }
  };

  useEffect(() => {
    if (!location) return;

    fetch(`${BACKEND_URL}/get_colors`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const all = data.db_response;

        const filtered = all.filter((row: Color) => {
          // match country
          if (row.region_type === "country") {
            return row.region_code === pin.country;
          }

          // match adm1 (must start with country code)
          if (row.region_type === "adm1" && pin.adm1) {
            return row.region_code === pin.adm1;
          }

          return false;
        });

        setLocalColors(filtered);
      });
  }, [location]);

  const countryColor = localColors.find(
    (c) => c.region_type === "country" && c.region_code === pin.country,
  );

  const adm1Color = localColors.find(
    (c) => c.region_type === "adm1" && c.region_code === pin.adm1,
  );

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="album-dialog-title"
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 p-4 outline-none"
    >
      <div className={`relative w-full max-w-2xl rounded-lg border-2 border-stone-300 p-5 shadow-lg bg-[#FEF9F1]`}>
        <header className={`relative pb-3 text-center ${isEditing ? "px-3" : "px-5"}`}>
          <div className={`absolute bottom-0 border-b border-stone-300 ${isEditing ? "left-4 right-4" : "left-0 right-0"}`} />
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
            className="font-serif text-2xl text-stone-900"
          >
            {pin.city || "Somewhere"}
          </h2>
          <div className="mt-1 text-sm text-stone-600 flex items-center gap-2 justify-center">
            {/* ADM1 */}
            {pin.adm1 && (
              adm1Color ? (
                <div className="flex items-center gap-1">
                  <span>{pin.adm1}</span>
                  <label htmlFor="adm1-color-input" className="group flex items-center gap-1 cursor-pointer">
                    <div className="relative">
                      <input
                        id="adm1-color-input"
                        type="color"
                        value={adm1Color.color}
                        onFocus={(e) => {
                          e.currentTarget.dataset.prev = adm1Color.color;
                        }}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          setLocalColors((prev) =>
                            prev.map((c) =>
                              c.region_code === adm1Color.region_code &&
                              c.region_type === adm1Color.region_type
                                ? { ...c, color: newColor }
                                : c,
                            ),
                          );
                        }}
                        onBlur={(e) => {
                          const prev =
                            e.currentTarget.dataset.prev || adm1Color.color;
                          handleColorChange(
                            adm1Color.region_code,
                            e.target.value,
                            adm1Color.region_type,
                            prev,
                          );
                        }}
                        className="w-6 h-6 p-0 border-none cursor-pointer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 text-white opacity-0 group-hover:opacity-100 transition pointer-events-none" />
                    </div>
                    <Pencil className="w-3 h-3 text-stone-500" />
                  </label>
                </div>
              ) : (
                <span>{pin.adm1}</span>
              )
            )}

            {/* separator */}
            {pin.adm1 && pin.country && <span>·</span>}

            {/* COUNTRY */}
            {pin.country && (
              countryColor ? (
                <div className="flex items-center gap-1">
                  <span>{pin.country}</span>
                  <label htmlFor="country-color-input" className="group flex items-center gap-1 cursor-pointer">
                    <div className="relative">
                      <input
                        id="country-color-input"
                        type="color"
                        value={countryColor.color}
                        onFocus={(e) => {
                          e.currentTarget.dataset.prev = countryColor.color;
                        }}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          setLocalColors((prev) =>
                            prev.map((c) =>
                              c.region_code === countryColor.region_code &&
                              c.region_type === countryColor.region_type
                                ? { ...c, color: newColor }
                                : c,
                            ),
                          );
                        }}
                        onBlur={(e) => {
                          const prev =
                            e.currentTarget.dataset.prev || countryColor.color;
                          handleColorChange(
                            countryColor.region_code,
                            e.target.value,
                            countryColor.region_type,
                            prev,
                          );
                        }}
                        className="w-6 h-6 p-0 border-none cursor-pointer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 text-white opacity-0 group-hover:opacity-100 transition pointer-events-none" />
                    </div>
                    <Pencil className="w-3 h-3 text-stone-500" />
                  </label>
                </div>
              ) : (
                <span>{pin.country}</span>
              )
            )}
          </div>
        </header>

        {isEditing && album ? (
          <AlbumEditForm
            editForm={editForm}
            setEditForm={setEditForm}
            pages={editPages}
            setPages={setEditPages}
            newPageFiles={newPageFiles}
            setNewPageFiles={setNewPageFiles}
            newPageCaptions={newPageCaptions}
            setNewPageCaptions={setNewPageCaptions}
            cloudName={cloudName}
            onCancel={() => setIsEditing(false)}
            onSave={handleSaveEdit}
          />
        ) : (
          <>
            <div className="relative mt-4 rounded-r-md border border-stone-300 bg-[#F3E9DC] shadow-inner">
              <div
                className="absolute bottom-2 left-0 top-2 w-2 rounded-sm bg-[#895737]"
                aria-hidden
              />
              <div className="pl-5 pr-4 py-4">
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
                <span className="ml-1 hidden sm:inline cursor-pointer">
                  Prev
                </span>
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
                <span className="mr-1 hidden sm:inline cursor-pointer">
                  Next
                </span>
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
          <div className="flex gap-2 ml-auto">
            {album && !isConfirmingDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={openEdit}
                className="cursor-pointer"
              >
                Edit <Pencil className="w-4 h-4" />
              </Button>
            )}
            {album && !isConfirmingDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsConfirmingDelete(true)}
                className="cursor-pointer"
              >
                Delete <Trash2 className="w-4 h-4" />
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
