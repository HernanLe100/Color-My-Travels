import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { SidebarProvider, useSidebar } from "./components/ui/sidebar";
import { Menu } from "lucide-react";
import MapPage from "./components/MapPage";
import UserPage from "./components/UserPage";
import ColorsPage from "./components/ColorsPage";
import { useEffect, useState } from "react";

import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { jwtDecode } from "jwt-decode";
import FriendsPage from "./components/FriendsPage";
import FeedPage from "./components/FeedPage";

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

  // check if token is expired by setting a timer after calculating the time until expiry, 
  // if so, remove it from local storage AND set the token to null!!
  // ProtectedRoute will check for null token and redirect to login page
  useEffect(() => {
    let timeout: number | undefined;

    const setupExpiry = (t: string | null) => {
      if (!t) return;

      try {
        const decoded = jwtDecode<JwtPayload>(t);
        const now = Date.now() / 1000;

        const timeUntilExpiry = (decoded.exp - now) * 1000;

        if (timeUntilExpiry <= 0) {
          localStorage.removeItem("token");
          setToken(null);
        } else {
          timeout = window.setTimeout(() => {
            localStorage.removeItem("token");
            setToken(null);
          }, timeUntilExpiry);
        }
      } catch {
        localStorage.removeItem("token");
        setToken(null);
      }
    };

    setupExpiry(token);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [token]);

  // sync across tabs
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

function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className="fixed left-4 top-4 z-[1200] flex md:hidden items-center justify-center rounded-md bg-white p-2 shadow-md border border-stone-200"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5 text-stone-700" />
    </button>
  );
}

function App() {
  const token = useAuth();

  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex w-full">
          {token && <Sidebar />}

          <main className="flex-1 relative">
            {token && <MobileMenuButton />}
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

              <Route
                path="/friends"
                element={
                  <ProtectedRoute>
                    <FriendsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <FeedPage />
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
