import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { SidebarProvider } from "./components/ui/sidebar";
import MapPage from "./components/MapPage";
import UserPage from "./components/UserPage";
import ColorsPage from "./components/ColorsPage";
import { useEffect, useState } from "react";

import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  exp: number;
};

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem("token");
    if (!t) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(t);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        localStorage.removeItem("token");
        return null;
      }

      return t;
    } catch {
      localStorage.removeItem("token");
      return null;
    }
  });

  useEffect(() => {
    const sync = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return token;
}

function App() {
  const token = useAuth();
  /*useEffect(() => {
    fetch("https://127.0.0.1:5001/test")
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, []);*/

  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex w-full">
          {token && <Sidebar />}

          <main className="flex-1">
            <Routes>
              <Route
                path="/login"
                element={
                  // prevent logged in users from accessing login page
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              <Route
                path="/"
                element={
                  // prevent unauthenticated users from accessing map page
                  <ProtectedRoute>
                    <MapPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/user"
                element={
                  <ProtectedRoute>
                    <UserPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/colors"
                element={
                  <ProtectedRoute>
                    <ColorsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
