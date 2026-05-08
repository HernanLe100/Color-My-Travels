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
import AboutPage from "./components/AboutPage";

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
          sessionStorage.setItem("session_expired", "true");
          setToken(null);
        } else {
          timeout = window.setTimeout(() => {
            localStorage.removeItem("token");
            sessionStorage.setItem("session_expired", "true");
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

function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="fixed top-0 left-0 right-0 z-1200 flex md:hidden items-center justify-between px-4 h-14 bg-[#F3E9DC] border-b border-stone-200">
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex items-center justify-center rounded-md p-1.5"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-[#5E3023]" />
      </button>
      <h1 className="flex items-center gap-1.5 font-black font-serif text-lg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 82" className="h-[.7em] w-[.43em] shrink-0">
          <defs>
            <linearGradient id="mobileHeaderPinGradient" x1="0" y1="0" x2="0" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2A81CB" />
              <stop offset="100%" stopColor="#3274A3" />
            </linearGradient>
          </defs>
          <path fill="url(#mobileHeaderPinGradient)" d="M47.88,35.08c-.03.06-.06.13-.09.19l.09-.19h0Z"/>
          <path fill="url(#mobileHeaderPinGradient)" d="M25,50c-9.87,0-18.4-5.72-22.47-14.03h0s22.47,46.03,22.47,46.03l22.11-45.33c-4.19,7.93-12.52,13.33-22.11,13.33Z"/>
          <path fill="url(#mobileHeaderPinGradient)" d="M25,0C11.19,0,0,11.19,0,25c0,3.94.91,7.66,2.53,10.97,4.06,8.31,12.6,14.03,22.47,14.03s17.92-5.4,22.11-13.33c.24-.46.47-.93.68-1.4.03-.06.06-.13.09-.19,1.36-3.08,2.12-6.49,2.12-10.08C50,11.19,38.81,0,25,0ZM25,34.26c-4.78,0-8.65-3.87-8.65-8.65s3.87-8.65,8.65-8.65,8.65,3.87,8.65,8.65-3.87,8.65-8.65,8.65Z"/>
        </svg>
        <span>
          <span className="bg-linear-to-r from-[#3274A3] to-[#2A81CB] bg-clip-text text-transparent">Color</span>{" "}
          <span className="text-[#895737]">My Travels</span>
        </span>
      </h1>
      <div className="w-8" />
    </header>
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
            {token && <MobileHeader />}
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

              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;