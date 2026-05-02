import { Navigate } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "@/App";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  //console.log("TOKEN:", token);
  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
