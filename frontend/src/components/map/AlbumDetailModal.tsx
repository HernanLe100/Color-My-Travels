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
import { apiFetch } from "@/lib/api";

type AlbumPageSlot =
  | { kind: "empty" }
  | { kind: "cover" }
  | { kind: "photo"; page: Page; index: number };

function albumPageSlots(activeAlbum: Album | null): AlbumPageSlot[] {
  if (!activeAlbum) return [{ kind: "empty" }];
  const slots: AlbumPageSlot[] = [{ kind: "cover" }];
  activeAlbum.pages.forEach((p, index) => {
    if (p?.id) slots.push({ kind: "photo", page: p, index });
  });
  return slots;
}

type AlbumDetailModalProps = {
  pin: Pin;
  albums: Album[];
  cloudName: string | undefined;
  onClose: () => void;
  setAlbums: Dispatch<SetStateAction<Album[]>>;
  setColors: Dispatch<SetStateAction<Color[]>>;
};

export default function AlbumDetailModal({
  pin,
  albums,
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

  // if there is only one album, set the active album index to 0 so that the album selection screen is not shown
  const [activeAlbumIndex, setActiveAlbumIndex] = useState<number | null>(
    albums.length === 1 ? 0 : null,
  );

  const activeAlbum =
    activeAlbumIndex !== null ? albums[activeAlbumIndex] : null;

  useEffect(() => {
    if (albums.length === 1) {
      setActiveAlbumIndex(0);
    }
  }, [albums.length]);

  const slots = useMemo(() => albumPageSlots(activeAlbum), [activeAlbum]);

  useEffect(() => {
    setIsEditing(false);
    setIsConfirmingDelete(false);
    setPageIndex(0);
  }, [pin.location_id, activeAlbum?.album_id]);

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
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Escape")
        return;
      const el = overlayRef.current;
      if (!el || !el.contains(e.target as Node)) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

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
    if (!activeAlbum) return;
    setEditForm({
      name: activeAlbum.name ?? "",
      notes: activeAlbum.notes ?? "",
      start_date: toDateInputValue(activeAlbum.start_date),
      end_date: toDateInputValue(activeAlbum.end_date),
    });
    setEditPages(activeAlbum.pages?.filter((p) => Boolean(p?.id)) ?? []);
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
    if (!activeAlbum) return;
    const res = await apiFetch(
      `/delete_album?album_id=${activeAlbum.album_id}`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) {
      alert(`Failed to delete activeAlbum: ${await res.text()}`);
      setIsConfirmingDelete(false);
      return;
    }
    window.location.reload();
  }

  async function handleSaveEdit() {
    if (!activeAlbum) return;

    const appendedPages: Page[] = [];

    // 1. Upload images FIRST
    for (let index = 0; index < newPageFiles.length; index += 1) {
      const formData = new FormData();
      formData.append("file", newPageFiles[index]);
      formData.append("album_id", String(activeAlbum.album_id));
      formData.append("caption", newPageCaptions[index] ?? "");

      const uploadRes = await apiFetch("/upload_image", {
        method: "POST",
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

    // 3. THEN update activeAlbum (single source of truth)
    const res = await apiFetch("/edit_album", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        album_id: activeAlbum.album_id,
        ...editForm,
        pages: finalPages,
      }),
    });

    if (!res.ok) {
      console.error("Failed to save activeAlbum:", await res.text());
      return;
    }

    // 4. Update UI
    setAlbums((prev) =>
      prev.map((a) =>
        a.album_id === activeAlbum.album_id
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
          <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
            <p className="text-sm">No activeAlbum for this place yet.</p>
          </div>
        );
      case "cover": {
        if (!activeAlbum) return null;

        const hasNotes = Boolean(activeAlbum.notes?.trim());

        return (
          <div
            className={`flex max-h-112 flex-col items-center overflow-y-auto px-2 pt-2 pb-6 text-center text-[#5E3023] min-h-64 ${
              hasNotes ? "justify-start" : "justify-center"
            }`}
          >
            <h3 className="mt-4 font-serif font-medium text-xl">
              {activeAlbum.name || "Untitled"}
            </h3>
            <p className="mt-1 text-sm">
              {formatAlbumDate(activeAlbum.start_date)} —{" "}
              {formatAlbumDate(activeAlbum.end_date)}
            </p>
            {activeAlbum.notes?.trim() ? (
              <div className="mt-5 w-full max-w-md text-left">
                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                  {activeAlbum.notes}
                </p>
              </div>
            ) : null}
          </div>
        );
      }
      case "photo":
        return (
          <div className="relative flex flex-col gap-3 h-full">
            <div className="flex items-center justify-center overflow-hidden rounded">
              <img
                src={cloudinaryImageUrl(cloudName, slot.page.id)}
                alt={slot.page.caption || "Album photo"}
                className="max-h-96 w-full object-contain"
              />
            </div>

            {slot.page.caption ? (
              <div className="max-h-24 overflow-y-auto px-2 w-full text-left">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#5E3023]">
                  {slot.page.caption}
                </p>
              </div>
            ) : null}

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
      const res = await apiFetch("/update_color", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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

    apiFetch("/get_colors")
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
      aria-labelledby="activeAlbum-dialog-title"
      className="fixed inset-0 z-1100 flex items-center justify-center bg-black/30 p-4 outline-none"
    >
      <div
        className={`relative w-full max-w-2xl rounded-lg border-2 border-stone-300 p-5 shadow-lg bg-[#FEF9F1]`}
      >
        <header
          className={`relative text-center ${isEditing ? "px-3" : "px-5"}`}
        >
          {/* back button */}
          {activeAlbumIndex !== null && !isEditing && albums.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setActiveAlbumIndex(null);
                setPageIndex(0);
              }}
              className="absolute left-0 top-0 flex items-center gap-0.5 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <ChevronLeft className="size-4 mr-1" />
              <span className="hidden sm:inline text-sm">Back</span>
            </button>
          )}

          {/* close button */}
          <button
            type="button"
            className="absolute right-0 top-0 text-stone-400 hover:text-stone-700 cursor-pointer"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
          <h2
            id="activeAlbum-dialog-title"
            className="font-serif mt-1 text-3xl text-[#895737] flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 82"
              className="h-[.7em] w-[.43em] shrink-0"
              fill="#2A81CB"
            >
              <path d="M47.88,35.08c-.03.06-.06.13-.09.19l.09-.19h0Z" />
              <path d="M25,50c-9.87,0-18.4-5.72-22.47-14.03h0s22.47,46.03,22.47,46.03l22.11-45.33c-4.19,7.93-12.52,13.33-22.11,13.33Z" />
              <path d="M25,0C11.19,0,0,11.19,0,25c0,3.94.91,7.66,2.53,10.97,4.06,8.31,12.6,14.03,22.47,14.03s17.92-5.4,22.11-13.33c.24-.46.47-.93.68-1.4.03-.06.06-.13.09-.19,1.36-3.08,2.12-6.49,2.12-10.08C50,11.19,38.81,0,25,0ZM25,34.26c-4.78,0-8.65-3.87-8.65-8.65s3.87-8.65,8.65-8.65,8.65,3.87,8.65,8.65-3.87,8.65-8.65,8.65Z" />
            </svg>
            {pin.city || "Somewhere"}
          </h2>
          <div className="mt-1 text-sm font-serif text-[#895737] flex items-center gap-2 justify-center">
            {/* ADM1 */}
            {pin.adm1 &&
              (adm1Color ? (
                <div className="flex items-center gap-1">
                  <span>{pin.adm1}</span>
                  <label
                    htmlFor="adm1-color-input"
                    className="group flex items-center gap-1 cursor-pointer"
                  >
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
                    <Pencil className="w-3 h-3" />
                  </label>
                </div>
              ) : (
                <span>{pin.adm1}</span>
              ))}

            {/* separator */}
            {pin.adm1 && pin.country && <span>·</span>}

            {/* COUNTRY */}
            {pin.country &&
              (countryColor ? (
                <div className="flex items-center gap-1">
                  <span>{pin.country}</span>
                  <label
                    htmlFor="country-color-input"
                    className="group flex items-center gap-1 cursor-pointer"
                  >
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
                    <Pencil className="w-3 h-3" />
                  </label>
                </div>
              ) : (
                <span>{pin.country}</span>
              ))}
          </div>
        </header>

        {/* {albums.length > 1 && (
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            {albums.map((a, i) => (
              <button
                key={a.album_id}
                onClick={() => {
                  setActiveAlbumIndex(i);
                  setPageIndex(0); // reset pages when switching albums
                }}
                className={`px-3 py-1 rounded border text-sm ${
                  i === activeAlbumIndex
                    ? "bg-[#895737] text-white"
                    : "bg-white text-[#895737]"
                }`}
              >
                {a.name || `Album ${i + 1}`}
              </button>
            ))}
          </div>
        )} */}

        {activeAlbumIndex === null ? (
          // album selection screen
          <div className="mt-2">
            <p className="text-base font-bold text-[#895737] font-serif text-center mb-1">
              Choose an album:
            </p>

            <div className="flex flex-col font-serif gap-3 overflow-y-auto px-2 pb-2 max-h-80">
              {albums.map((a, i) => (
                <button
                  key={a.album_id}
                  onClick={() => setActiveAlbumIndex(i)}
                  className="shrink-0 rounded-lg border hover:border-[#5E3023] border-stone-300 bg-white px-3 py-3 shadow-sm hover:bg-[#F3E9DC] transition text-left cursor-pointer"
                >
                  {/* title */}
                  <p className="text-sm font-semibold text-[#5E3023] truncate">
                    {a.name || `Album ${i + 1}`}
                  </p>

                  {/* dates */}
                  <p className="text-xs text-[#5E3023] mt-1">
                    {formatAlbumDate(a.start_date)} —{" "}
                    {formatAlbumDate(a.end_date)}
                  </p>

                  {/* notes preview */}
                  {a.notes?.trim() ? (
                    <p className="text-xs text-stone-400 mt-2 line-clamp-3">
                      {a.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-300 mt-2 italic">
                      No notes
                    </p>
                  )}

                  {/* page count */}
                  <p className="text-[10px] text-stone-400 mt-2">
                    {a.pages?.length ?? 0} pages
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : isEditing && activeAlbum ? (
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
            <div className="relative mt-4 rounded-md border border-stone-300 bg-[#F3E9DC] shadow-inner">
              <div
                className="absolute bottom-2 left-0 top-2 w-2 rounded-sm bg-[#895737]"
                aria-hidden
              />
              <div className="pl-5 pr-4 font-serif py-4 min-h-72 flex flex-col">
                <div className="flex-1 flex flex-col min-h-0">{renderPageBody()}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
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

              <div className="flex justify-center gap-1">
                {slots.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPageIndex(i)}
                    className={`h-2 w-2 rounded-full transition ${
                      i === pageIndex ? "bg-[#895737]" : "bg-stone-300"
                    }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>

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
          className={`mt-4 flex justify-between pt-0 ${
            isEditing ? "hidden" : ""
          }`}
        >
          <div className="flex gap-2 ml-auto">
            {activeAlbum && !isConfirmingDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={openEdit}
                className="cursor-pointer"
              >
                Edit <Pencil className="w-4 h-4" />
              </Button>
            )}
            {activeAlbum && !isConfirmingDelete && (
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
