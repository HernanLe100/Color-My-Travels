import { useAuth } from "@/App";
import type { Album, User } from "@/types";
import { useEffect, useState } from "react";
import FeedAlbum from "./FeedAlbum";
import Loading from "./Loading";

export default function FeedPage() {
  const token = useAuth();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [friendsAlbums, setFriendsAlbums] = useState<Album[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sortedAlbums = [...friendsAlbums].sort((a, b) => {
    if (!a.created_at && !b.created_at) return 0;
    if (!a.created_at) return 1; // nulls last
    if (!b.created_at) return -1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const [albumsData, friendsData] = await Promise.all([
        fetch(`${BACKEND_URL}/get_friends_albums`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${BACKEND_URL}/get_friends`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      setFriendsAlbums(Array.isArray(albumsData.albums) ? albumsData.albums : []);
      setFriends(friendsData.friends);
      setIsLoading(false);
    };
    load();
  }, [token, BACKEND_URL]);

  if (isLoading) return <Loading />;

  return (
  <div className="min-h-screen w-full bg-[#FEF9F1]">
  <div className="box-border mx-auto w-full max-w-lg md:max-w-2xl flex flex-col gap-5 px-6 py-6">
    {friendsAlbums.length === 0 ? (
      <p className="text-center text-sm text-neutral-500">
        No albums from friends yet.
      </p>
    ) : null}

    {sortedAlbums.map((album) => (
      <FeedAlbum key={album.album_id} album={album} friends={friends} />
    ))}
  </div>
  </div>
);
}