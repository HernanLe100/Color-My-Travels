import { Navigate } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "@/App";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const token = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}