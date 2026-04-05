import { useAuth } from "@/App";
import type { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }: { children: JSX.Element }) {
  const token = useAuth();

  //console.log("TOKEN:", token);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
}
