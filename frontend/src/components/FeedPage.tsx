import { useAuth } from "@/App";
import type { Album, User } from "@/types";
import { useEffect, useState } from "react";

export default function FeedPage() {
  const token = useAuth();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [friendsAlbums, setFriendsAlbums] = useState<Album[]>([]);
  const [friends, setFriends] = useState<User[]>([]);

  const fetchFriendsAlbums = async () => {
    const res = await fetch(`${BACKEND_URL}/get_friends_albums`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setFriendsAlbums(data.albums);
  };

  const fetchFriends = async () => {
    const res = await fetch(`${BACKEND_URL}/get_friends`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setFriends(data.friends);
  };

  useEffect(() => {
    fetchFriendsAlbums();
    fetchFriends();
  }, []);

  return (
    <div>
      {friendsAlbums.map((album) => (
        <div key={album.album_id}>
          <h3>{album.name}</h3>
          <p>
            By:{" "}
            {friends.find((friend) => friend.user_id === album.user_id)?.name}
          </p>
          <p>{album.notes}</p>
        </div>
      ))}
    </div>
  );
}
