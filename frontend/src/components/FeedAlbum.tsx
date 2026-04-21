import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Album, Page, User } from "@/types";
import { cloudinaryImageUrl, formatAlbumDate } from "./map/albumModalUtils";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

function photoPages(pages: Page[] | undefined): Page[] {
  return (pages ?? []).filter((p) => Boolean(p?.id));
}

function friendForAlbum(album: Album, friends: User[]) {
  return (
    friends.find((f) => f.user_id === album.user_id) ?? {
      user_id: album.user_id,
      name: album.friend_name ?? "Friend",
    }
  );
}

function locationLine(album: Album): string | null {
  const parts = [
    album.location_city,
    album.location_adm1,
    album.location_country,
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return null;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

  return date.toLocaleDateString();
}

export default function FeedAlbum({
  album,
  friends,
}: {
  album: Album;
  friends: User[];
}) {
  const friend = friendForAlbum(album, friends);
  const displayName = friend.name?.trim() || "Friend";
  const initial = displayName.charAt(0).toUpperCase() || "?";
  const photos = useMemo(() => photoPages(album.pages), [album.pages]);
  const [slide, setSlide] = useState(0);

  console.log(album);

  useEffect(() => {
    if (slide > photos.length - 1) {
      setSlide(Math.max(0, photos.length - 1));
    }
  }, [photos.length, slide]);

  const loc = locationLine(album);
  const dateRange = `${formatAlbumDate(album.start_date)} — ${formatAlbumDate(album.end_date)}`;

  const canPrev = photos.length > 1 && slide > 0;
  const canNext = photos.length > 1 && slide < photos.length - 1;

  const createdAt = album?.created_at ? new Date(album.created_at) : null;

  return (
    <article className="mx-auto w-lg overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-rose-200 text-sm font-semibold text-neutral-800"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {displayName}
          </p>
          {loc ? (
            <p className="truncate text-xs text-neutral-500">{loc}</p>
          ) : null}
        </div>
        <time
          className="shrink-0 text-xs text-neutral-400"
          dateTime={album?.created_at ?? ""}
        >
          {createdAt ? timeAgo(createdAt) : ""}
        </time>
      </div>

      {/* Caption block — album title, dates, notes */}
      <div className="space-y-2 px-3 pb-4 pt-2">
        <h3 className="text-base font-semibold leading-snug text-neutral-900">
          {album.name || "Untitled album"}: {dateRange}
        </h3>
        {album.notes?.trim() ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
            {album.notes}
          </p>
        ) : null}
      </div>

      {/* Media carousel */}
      {photos.length > 0 ? (
        <div className="relative bg-neutral-100">
          <div className="relative aspect-square w-full overflow-hidden">
            <img
              src={cloudinaryImageUrl(cloudName, photos[slide].id)}
              alt={photos[slide].caption || album.name}
              className="size-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  disabled={!canPrev}
                  onClick={() => setSlide((s) => Math.max(0, s - 1))}
                  className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm disabled:opacity-30"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  disabled={!canNext}
                  onClick={() =>
                    setSlide((s) => Math.min(photos.length - 1, s + 1))
                  }
                  className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm disabled:opacity-30"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Photo ${i + 1}`}
                      onClick={() => setSlide(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === slide ? "w-4 bg-white" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {photos[slide]?.caption ? (
            <p className="border-t border-neutral-100 px-3 py-2 text-sm text-neutral-700">
              <span className="font-semibold text-neutral-900">
                {displayName}
              </span>{" "}
              {photos[slide].caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
