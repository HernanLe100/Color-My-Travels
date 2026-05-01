import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { SidebarProvider, useSidebar } from "./components/ui/sidebar";
import { Menu } from "lucide-react";
import MapPage from "./components/MapPage";
import UserPage from "./components/UserPage";
import ColorsPage from "./components/ColorsPage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import FriendsPage from "./components/FriendsPage";
import FeedPage from "./components/FeedPage";
import { apiFetch } from "./lib/api";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const res = await apiFetch("/me");
      setIsAuthenticated(res.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, refreshAuth }),
    [isAuthenticated, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return auth;
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
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex w-full">
          {isAuthenticated && <Sidebar />}

          <main className="flex-1 relative">
            {isAuthenticated && <MobileMenuButton />}
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
