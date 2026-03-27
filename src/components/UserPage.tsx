import { useState, useEffect } from "react";

// TODO: create seperate file to store types
type User = {
  user_id: string;
  name: string;
};
type Album = {
  album_id: string;
  user_id: string;
  caption: string;
  pages: string[];
  start_date: string;
  end_date: string;
};

export default function UserPage() {
  const [user, setUser] = useState<User>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const testUser = "0000";
  useEffect(() => {
    fetch(`http://localhost:5001/get_user?user_id=${testUser}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data.db_response[0]);
      });
  }, []);
  useEffect(() => {
    fetch(`http://localhost:5001/get_albums?user_id=${testUser}`)
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data.db_response);
      });
  }, []);

  return (
    <div>
      <h1 className="text-lg font-bold px-4 pt-4">
        {user?.user_id}'s User Page
      </h1>
      <p className="px-4 pt-4">Name: {user?.name}</p>
      <p className="px-4 pt-4">Albums: {albums?.length}</p>
      <p className="px-4">
        Album captions:{" "}
        {albums?.map((album, i) => (
          <span key={i}>{album?.caption} </span>
        ))}
      </p>
    </div>
  );
}
