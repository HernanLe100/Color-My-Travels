import type { Album, User } from "@/types";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import Loading from "./Loading";
import { LogOut, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";


export default function UserPage() {
  const [user, setUser] = useState<User>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [friendCount, setFriendCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/me").then((r) => r.json()),
      apiFetch("/get_albums").then((r) => r.json()),
      apiFetch("/get_friends").then((r) => r.json()),
    ]).then(([userData, albumsData, friendsData]) => {
      setUser(userData);
      setAlbums(albumsData.db_response);
      setFriendCount(friendsData.friends?.length ?? 0);
      setIsLoading(false);
    });
  }, []);

  async function logout() {
    await apiFetch("/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function handleDeleteUser() {
    if (!user) return;
    const res = await apiFetch("/delete_user", {
      method: "DELETE",
    });
    if (!res.ok) {
      alert(`Failed to delete user: ${await res.text()}`);
      setIsConfirmingDelete(false);
      return;
    }
    logout()
  }

  if (isLoading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-lg md:mx-0 md:max-w-none px-6 py-6 flex flex-col gap-4">
      <h1 className="text-lg font-bold">{user?.name}'s User Page</h1>
      <div className="flex flex-col gap-1">
        <span className="text-base font-bold">Stats</span>
        <span>Albums: {albums.length}</span>
        <span>Friends: {friendCount}</span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-base font-bold">Account Actions</span>
        <Button onClick={logout} className="w-fit cursor-pointer" size="lg">
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
            <span className="text-sm text-stone-600 font-semibold">Are you sure you want to delete your account?</span>
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
  );
}
