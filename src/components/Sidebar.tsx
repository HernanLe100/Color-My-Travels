import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
  } from "@/components/ui/sidebar"
  
  import { Map, User } from "lucide-react"
  
  export default function AppSidebar() {
    return (
      <Sidebar className="h-screen">
        {/* Top title */}
        <SidebarHeader>
          <h1 className="text-lg font-bold px-4 pt-4">
            Color My Travels
          </h1>
        </SidebarHeader>
  
        {/* Main content */}
        <SidebarContent className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Map className="w-4 h-4 mr-2" />
                Map
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
  
        {/* Bottom user */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <User className="w-4 h-4 mr-2" />
                User
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    )
  }