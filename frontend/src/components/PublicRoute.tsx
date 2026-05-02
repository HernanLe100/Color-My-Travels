import { useAuth } from "@/App";
import type { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();

  //console.log("TOKEN:", token);
  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
