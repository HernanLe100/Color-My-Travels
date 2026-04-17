import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useAuth } from "@/App";

export default function FriendsPage() {
  const token = useAuth();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [friendId, setFriendId] = useState("");
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const sendRequest = async () => {
    const res = await fetch(`${BACKEND_URL}/send_friend_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        receiver_id: friendId,
      }),
    });

    const data = await res.json();
    console.log(data);
  };

  const fetchRequests = async () => {
    const res = await fetch(`${BACKEND_URL}/get_friend_requests`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setRequests(data.requests);
  };

  useEffect(() => {
    fetchRequests();
    fetchFriends();
  }, []);

  const acceptRequest = async (sender_id: string) => {
    await fetch(`${BACKEND_URL}/accept_friend_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sender_id }),
    });

    fetchRequests(); // refresh
  };

  const rejectRequest = async (sender_id: string) => {
    await fetch(`${BACKEND_URL}/reject_friend_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sender_id }),
    });

    fetchRequests();
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

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-lg font-bold">Add Friend</p>
        <Input
          type="text"
          placeholder="Enter friend user id"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
        />

        <Button className="cursor-pointer" onClick={sendRequest}>
          Send Request
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-lg font-bold">Friend Requests</p>
        {requests?.map((request, index) => {
          return (
            <div key={index}>
              <p>{request.name}</p>
              <Button onClick={() => acceptRequest(request.sender_id)}>
                Accept
              </Button>
              <Button onClick={() => rejectRequest(request.sender_id)}>
                Reject
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-lg font-bold">Friends</p>
        {friends?.map((friend, index) => {
          return (
            <div key={index}>
              <p>{friend?.name}</p>
              <p>{friend?.user_id}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
