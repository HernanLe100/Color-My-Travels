import { BrowserRouter, Route, Routes } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import { SidebarProvider } from "./components/ui/sidebar"
import MapPage from "./components/MapPage"
import UserPage from "./components/UserPage"
import ColorsPage from "./components/ColorsPage"
import { useEffect } from "react"

const BACKEND_URL = "https://127.0.0.1:5001" //import.meta.env.BACKEND_URL

function App() {
  useEffect(() => {
    fetch(`${BACKEND_URL}/test`)
      .then(res => res.json())
      .then(data => console.log(data));
  }, []);

  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex w-full">
          <Sidebar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/user" element={<UserPage />} />
              <Route path="/colors" element={<ColorsPage />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App
