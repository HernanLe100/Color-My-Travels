import type { Album, User } from "@/types";
import { useState, useEffect } from "react";
import CitySearch from "./CitySearch";
import { Button } from "./ui/button";

const BACKEND_URL = "https://127.0.0.1:5001"; //import.meta.env.BACKEND_URL

export default function UserPage() {
  const [user, setUser] = useState<User>();
  const [albums, setAlbums] = useState<Album[]>([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    fetch(`${BACKEND_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
      });
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetch(`${BACKEND_URL}/get_albums`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data.db_response);
      });
  }, [token]);

  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const handleSelect = (location: any) => {
    console.log(location);
    setSelectedLocation(location);
  };

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <div>
      <h1 className="text-lg font-bold px-4 pt-4">
        {user?.user_id}'s User Page
      </h1>

      <p className="px-4 pt-4">Name: {user?.name}</p>
      <p className="px-4 pt-4">Albums: {albums.length}</p>

      <div className="px-4">
        Album captions:
        {albums.map((album, i) => (
          <div key={i}>{album.caption}</div>
        ))}
      </div>

      <CitySearch onSelect={handleSelect} />
      <p>{JSON.stringify(selectedLocation)}</p>

      <Button onClick={logout}>Logout</Button>
    </div>
  );
}
