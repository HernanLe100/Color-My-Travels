import type { Album, User } from "@/types";
import { useState, useEffect } from "react";
import CitySearch from "./CitySearch";

const BACKEND_URL = "https://127.0.0.1:5001" //import.meta.env.BACKEND_URL

export default function UserPage() {
  const [user, setUser] = useState<User>();
  const [albums, setAlbums] = useState<Album[]>([]);
  // TODO: fetch user from db
  const testUser = "0000";

  useEffect(() => {
    fetch(`${BACKEND_URL}/get_user?user_id=${testUser}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data.db_response[0]);
      });
  }, []);
  useEffect(() => {
    fetch(`${BACKEND_URL}/get_albums?user_id=${testUser}`)
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data.db_response);
      });
  }, []);

  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const handleSelect = (location: any) => {
    console.log(location);
    setSelectedLocation(location);
  };

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
          <div key={i}>{album?.caption} </div>
        ))}
      </p>

      <CitySearch onSelect={handleSelect} />
      <p>{JSON.stringify(selectedLocation)}</p>
    </div>
  );
}
