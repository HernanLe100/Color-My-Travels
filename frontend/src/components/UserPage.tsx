import type { Album, User } from "@/types";
import { useState, useEffect } from "react";
import CitySearch from "./CitySearch";
import { Button } from "./ui/button";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-bold">{user?.name}'s User Page</h1>

      <Button onClick={logout} className="w-fit cursor-pointer" size="lg">
        Logout
      </Button>

      <p className="text-neutral-400 text-xs">User Id: {user?.user_id}</p>
    </div>
  );
}
