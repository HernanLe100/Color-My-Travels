import type { Album, User } from "@/types";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import Loading from "./Loading";
import { LogOut, Trash2 } from "lucide-react";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function UserPage() {
  const [user, setUser] = useState<User>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [friendCount, setFriendCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem("token");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch(`${BACKEND_URL}/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${BACKEND_URL}/get_albums`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${BACKEND_URL}/get_friends`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([userData, albumsData, friendsData]) => {
      setUser(userData);
      setAlbums(albumsData.db_response);
      setFriendCount(friendsData.friends?.length ?? 0);
      setIsLoading(false);
    });
  }, [token]);

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
    sessionStorage.setItem("account_deleted", "true");
    logout();
  }

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen w-full bg-[#FEF9F1]">
    <div className="mx-auto w-full max-w-lg md:mx-0 md:max-w-none px-6 py-6 flex flex-col gap-4">
      <h1 className="text-lg font-bold text-[#5E3023] font-serif">Account Settings</h1>
      <div className="flex flex-col gap-1 font-serif">
        <span className="text-base font-bold text-[#5E3023]">Stats</span>
        <span className="text-[#895737]">Albums: {albums.length}</span>
        <span className="text-[#895737]">Friends: {friendCount}</span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-base font-bold text-[#5E3023] font-serif">Account Actions</span>
        <Button onClick={logout} className="w-fit cursor-pointer bg-black hover:bg-slate-800" size="lg">
          Logout <LogOut className="w-4 h-4" />
        </Button>
        {!isConfirmingDelete && (
          <Button onClick={() => setIsConfirmingDelete(true)}
            className="w-fit cursor-pointer" size="lg"
            variant="destructive">
            Delete My Account <Trash2 className="w-4 h-4" />
          </Button>
        )}
        {isConfirmingDelete && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600 font-semibold">Are you sure you want to delete your account?</span>
            <Button type="button" variant="destructive" onClick={handleDeleteUser}>
              Confirm
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsConfirmingDelete(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <p className="text-neutral-400 text-xs">User ID: {user?.user_id}</p>
    </div>
    </div>
  );
}