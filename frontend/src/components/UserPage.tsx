import type { Album, User } from "@/types";
import { useState, useEffect } from "react";
// @ts-ignore
import CitySearch from "./CitySearch";
import { Button } from "./ui/button";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function UserPage() {
  const [user, setUser] = useState<User>();
  // @ts-ignore
  const [albums, setAlbums] = useState<Album[]>([]);

  const token = localStorage.getItem("token");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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

  // @ts-ignore
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // @ts-ignore
  const handleSelect = (location: any) => {
    console.log(location);
    setSelectedLocation(location);
  };

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  async function handleDeleteUser() {
    if (!user) return;
    const res = await fetch(
      `${BACKEND_URL}/delete_user`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      alert(`Failed to delete user: ${await res.text()}`);
      setIsConfirmingDelete(false);
      return;
    }
    logout()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-bold">{user?.name}'s User Page</h1>

      <Button onClick={logout} className="w-fit cursor-pointer" size="lg">
        Logout
      </Button>

      {!isConfirmingDelete && (
        <Button onClick={() => setIsConfirmingDelete(true)} 
          className="w-fit cursor-pointer" size="lg" 
          variant="destructive">
          Delete My Account
        </Button>
      )}
      {isConfirmingDelete && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600 font-semibold">Are you sure you want to delete your account?</span>
          <Button type="button" variant="destructive" onClick={handleDeleteUser}>
            Confirm
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsConfirmingDelete(false)}>
            Cancel
          </Button>
        </div>
      )}

      <p className="text-neutral-400 text-xs">User Id: {user?.user_id}</p>
    </div>
  );
}
