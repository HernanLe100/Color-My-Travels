import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { Album, Pin } from "@/types";
import { Button } from "../ui/button";
import {
  cloudinaryImageUrl,
  formatAlbumDate,
  toDateInputValue,
} from "./albumModalUtils";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setIsConfirmingDelete(false);
  }, [pin.location_id]);

  function openEdit() {
    if (!album) return;
    setEditForm({
      name: album.name ?? "",
      notes: album.notes ?? "",
      start_date: toDateInputValue(album.start_date),
      end_date: toDateInputValue(album.end_date),
    });
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
      body: JSON.stringify({ album_id: album.album_id, ...editForm }),
    });
    if (!res.ok) {
      console.error("Failed to save album:", await res.text());
      return;
    }
    setAlbums((prev) =>
      prev.map((a) =>
        a.album_id === album.album_id ? { ...a, ...editForm } : a,
      ),
    );
    setIsEditing(false);
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-lg border-2 border-stone-300 bg-stone-50 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="relative border-b border-stone-300 pb-4 text-center">
          <button
            type="button"
            className="absolute right-0 top-0 text-stone-400 hover:text-stone-700"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
          <p className="text-xs font-medium uppercase text-stone-500">
            Travel album
          </p>
          <h2 className="mt-2 text-2xl text-stone-900">
            {pin.city || "Unknown City"}
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            {[pin.adm1, pin.country].filter(Boolean).join(" · ")}
          </p>
        </header>

        {album?.pages?.some((p) => p?.id) ? (
          <div className="mt-3 flex flex-col gap-2">
            {album.pages.map((page, idx) =>
              page?.id ? (
                <img
                  key={idx}
                  src={cloudinaryImageUrl(cloudName, page.id)}
                  alt={page.caption || "image"}
                  className="w-full rounded object-cover"
                />
              ) : null,
            )}
          </div>
        ) : null}

        <div className="mt-5">
          {!album ? (
            <p className="text-center text-sm text-stone-600">
              No album for this place yet.
            </p>
          ) : isEditing ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">
                  Name
                </label>
                <input
                  className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs font-medium text-stone-500">
                    Start date
                  </label>
                  <input
                    type="date"
                    className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
                    value={editForm.start_date}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        start_date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs font-medium text-stone-500">
                    End date
                  </label>
                  <input
                    type="date"
                    className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-stone-500">
                  Notes
                </label>
                <textarea
                  rows={4}
                  className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-md border border-stone-200 bg-white p-4 shadow-sm">
              <h3 className="font-serif text-lg text-stone-800">
                {album.name || "Untitled"}
              </h3>
              <p className="text-sm text-stone-500">
                {formatAlbumDate(album.start_date)} —{" "}
                {formatAlbumDate(album.end_date)}
              </p>
              {album.notes ? (
                <blockquote className="border-l-2 border-stone-400 pl-3 text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
                  {album.notes}
                </blockquote>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between border-t border-stone-300 pt-4">
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
              <div className="flex items-center gap-2">
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
