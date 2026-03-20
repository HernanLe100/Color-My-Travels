import Sidebar from "./components/Sidebar"
import { SidebarProvider } from "./components/ui/sidebar"

function App() {
  return (
    <div>
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>
    </div>
  )
}

export default App
