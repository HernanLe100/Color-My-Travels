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
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

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
    <article className="relative box-border font-serif bg-[#F3E9DC] text-[#5E3023] w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
      <div className="absolute top-2 bottom-2 left-0 w-2 rounded-sm bg-[#895737] z-10" aria-hidden />
      {/* Header */}
      <div className="flex items-center gap-3 pr-5 pl-7 pt-5 pb-1">
        <div
          className="flex size-10 font-sans text-black shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-rose-200 text-sm font-semibold"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-md font-semibold font-sans text-black">
            {displayName}
          </p>
          {loc ? (
            <p className="flex items-center gap-1 truncate text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 82" className="h-[.7em] w-[.43em] shrink-0" fill="#2A81CB">
                <path d="M47.88,35.08c-.03.06-.06.13-.09.19l.09-.19h0Z"/>
                <path d="M25,50c-9.87,0-18.4-5.72-22.47-14.03h0s22.47,46.03,22.47,46.03l22.11-45.33c-4.19,7.93-12.52,13.33-22.11,13.33Z"/>
                <path d="M25,0C11.19,0,0,11.19,0,25c0,3.94.91,7.66,2.53,10.97,4.06,8.31,12.6,14.03,22.47,14.03s17.92-5.4,22.11-13.33c.24-.46.47-.93.68-1.4.03-.06.06-.13.09-.19,1.36-3.08,2.12-6.49,2.12-10.08C50,11.19,38.81,0,25,0ZM25,34.26c-4.78,0-8.65-3.87-8.65-8.65s3.87-8.65,8.65-8.65,8.65,3.87,8.65,8.65-3.87,8.65-8.65,8.65Z"/>
              </svg>
              {loc}
            </p>
          ) : null}
        </div>
        <time
          className="shrink-0 text-xs font-sans text-neutral-500"
          dateTime={album?.created_at ?? ""}
        >
          {createdAt ? timeAgo(createdAt) : ""}
        </time>
      </div>

      {/* Caption block — album title, dates, notes */}
      <div className="pr-5 pl-7 pb-2 pt-2">
        <h3 className="text-base font-semibold leading-snug">
          {album.name || "Untitled album"}
        </h3>
        <p className="whitespace-pre-wrap text-sm pb-2 leading-relaxed max-h-24 overflow-y-auto">
          {dateRange}
        </p>
        {album.notes?.trim() ? (
          <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed max-h-24 overflow-y-auto">
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
            <p className="wrap-break-word border-t border-neutral-100 bg-[#F3E9DC] pr-5 pl-7 py-2 text-sm">
              {photos[slide].caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
