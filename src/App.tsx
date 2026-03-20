import { BrowserRouter, Route, Routes } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import { SidebarProvider } from "./components/ui/sidebar"
import MapPage from "./components/MapPage"
import UserPage from "./components/UserPage"


function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex w-full">
          <Sidebar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/user" element={<UserPage />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App
