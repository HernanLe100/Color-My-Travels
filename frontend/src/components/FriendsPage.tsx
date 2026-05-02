import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuth } from "@/App";
import toast from "react-hot-toast";
import type { FriendRequest, SentRequest, User } from "@/types";
import Loading from "./Loading";
import { Send, Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function FriendsPage() {
  const { isAuthenticated } = useAuth();

  const [friendId, setFriendId] = useState("");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [confirmingFriendId, setConfirmingFriendId] = useState<string | null>(
    null,
  );

  const fetchRequests = async () => {
    const res = await apiFetch("/get_friend_requests");
    const data = await res.json();
    setRequests(data.requests);
  };

  const fetchSentRequests = async () => {
    const res = await apiFetch("/get_sent_requests");
    const data = await res.json();
    setSentRequests(data.requests);
  };

  const fetchFriends = async () => {
    const res = await apiFetch("/get_friends");
    const data = await res.json();
    setFriends(data.friends);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      const [reqData, sentData, friendsData] = await Promise.all([
        apiFetch("/get_friend_requests").then((r) => r.json()),
        apiFetch("/get_sent_requests").then((r) => r.json()),
        apiFetch("/get_friends").then((r) => r.json()),
      ]);
      setRequests(reqData.requests);
      setSentRequests(sentData.requests);
      setFriends(friendsData.friends);
      setIsLoading(false);
    };
    load();
  }, [isAuthenticated]);

  if (isLoading) return <Loading />;

  const sendRequest = async () => {
    if (!friendId.trim()) {
      toast.error("User ID is required");
      return;
    }
    setIsSendingRequest(true);
    const res = await apiFetch("/send_friend_request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ receiver_id: friendId }),
    });
    const data = await res.json();
    if (data.error) {
      toast.error(data.error);
      setIsSendingRequest(false);
      setFriendId("");
      return;
    }
    await fetchSentRequests();
    setIsSendingRequest(false);
    toast.success("Friend request sent");
    setFriendId("");
  };

  const cancelRequest = async (receiver_id: string) => {
    await apiFetch(`/cancel_friend_request?receiver_id=${receiver_id}`, {
      method: "DELETE",
    });
    fetchSentRequests();
    toast.success("Friend request cancelled");
  };

  const acceptRequest = async (sender_id: string) => {
    await apiFetch("/accept_friend_request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sender_id }),
    });
    fetchRequests();
    fetchFriends();
    toast.success("Friend request accepted");
  };

  const rejectRequest = async (sender_id: string) => {
    await apiFetch("/reject_friend_request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sender_id }),
    });
    fetchRequests();
    toast.success("Friend request rejected");
  };

  const deleteFriend = async (friend_id: string) => {
    await apiFetch(`/delete_friend?friend_id=${friend_id}`, {
      method: "DELETE",
    });
    fetchFriends();
    toast.success("Friend removed");
  };

  return (
    <div className="mx-auto w-full max-w-lg md:mx-0 md:max-w-none px-6 py-6 flex flex-col gap-5">
      <div className="flex flex-col gap-2 max-w-lg md:max-w-2xl">
        <p className="text-lg font-bold">Add Friend</p>
        <Input
          type="text"
          placeholder="Enter Friend User ID"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
        />
        <Button className="cursor-pointer" onClick={sendRequest}>
          {isSendingRequest ? "Sending..." : "Send Request"}
          {!isSendingRequest && <Send className="w-4 h-4" />}
        </Button>
      </div>

      {sentRequests.length > 0 && (
        <div className="flex flex-col gap-2 max-w-lg md:max-w-2xl">
          <p className="text-lg font-bold">Sent Requests</p>
          {sentRequests.map((req) => (
            <div
              key={req.receiver_id}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">{req.name}</p>
                <p className="text-xs text-stone-400">
                  User ID: {req.receiver_id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  Pending...
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => cancelRequest(req.receiver_id)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-lg md:max-w-2xl">
        <p className="text-lg font-bold">Friend Requests</p>
        {requests?.map((request) => (
          <div
            key={request.sender_id}
            className="flex items-center justify-between border border-neutral-200 rounded-lg px-4 py-2"
          >
            <div>
              <p className="text-sm font-medium">{request.name}</p>
              <p className="text-xs text-stone-400">
                User ID: {request.sender_id}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-green-600 cursor-pointer hover:bg-green-700"
                onClick={() => acceptRequest(request.sender_id)}
              >
                Accept <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-600 cursor-pointer hover:bg-red-700"
                onClick={() => rejectRequest(request.sender_id)}
              >
                Reject <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 max-w-lg md:max-w-2xl">
        <p className="text-lg font-bold">Friends</p>
        {friends?.map((friend) => (
          <div
            key={friend.user_id}
            className="flex items-center justify-between border border-neutral-200 rounded-lg px-4 py-2"
          >
            <div>
              <p className="text-sm font-medium">{friend.name}</p>
              <p className="text-xs text-stone-400">
                User ID: {friend.user_id}
              </p>
            </div>
            {confirmingFriendId === friend.user_id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">Remove friend?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    deleteFriend(friend.user_id);
                    setConfirmingFriendId(null);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmingFriendId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-red-600 cursor-pointer hover:bg-red-700"
                onClick={() => setConfirmingFriendId(friend.user_id)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
