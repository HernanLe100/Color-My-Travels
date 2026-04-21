import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { Map, User, Paintbrush, Users, Newspaper } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="h-screen w-64 border-r">
      {/* Top title */}
      <SidebarHeader>
        <h1 className="text-lg font-bold px-4 pt-4">Color My Travels</h1>
      </SidebarHeader>

      {/* Main content */}
      <SidebarContent className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/"}>
              <Link to="/">
                <Map className="w-4 h-4 mr-2" />
                Map
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/colors"}
            >
              <Link to="/colors">
                <Paintbrush className="w-4 h-4 mr-2" />
                Edit Colors
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/feed"}
            >
              <Link to="/feed">
                <Newspaper className="w-4 h-4 mr-2" />
                Feed
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/friends"}
            >
              <Link to="/friends">
                <Users className="w-4 h-4 mr-2" />
                Friends
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* Bottom user */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/user"}>
              <Link to="/user">
                <User className="w-4 h-4 mr-2" />
                User
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
