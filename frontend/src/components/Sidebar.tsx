import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

import { Map, User, Paintbrush, Users, Newspaper } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AppSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const closeOnMobile = () => setOpenMobile(false);

  return (
    <Sidebar className="h-screen w-64 border-r [--sidebar:#F3E9DC] [--sidebar-accent:#FEF9F1] [--sidebar-accent-foreground:#5E3023]">
      {/* Top title */}
      <SidebarHeader>
        <h1 className="flex items-center gap-2 whitespace-nowrap text-xl font-bold px-4 pt-4 bg-linear-to-r from-[#3274A3] to-[#2A81CB] bg-clip-text text-transparent">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 82" className="h-[.7em] w-[.43em] shrink-0">
            <defs>
              <linearGradient id="pinGradient" x1="0" y1="0" x2="0" y2="82" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2A81CB" />
                <stop offset="100%" stopColor="#3274A3" />
              </linearGradient>
            </defs>
            <path fill="url(#pinGradient)" d="M47.88,35.08c-.03.06-.06.13-.09.19l.09-.19h0Z"/>
            <path fill="url(#pinGradient)" d="M25,50c-9.87,0-18.4-5.72-22.47-14.03h0s22.47,46.03,22.47,46.03l22.11-45.33c-4.19,7.93-12.52,13.33-22.11,13.33Z"/>
            <path fill="url(#pinGradient)" d="M25,0C11.19,0,0,11.19,0,25c0,3.94.91,7.66,2.53,10.97,4.06,8.31,12.6,14.03,22.47,14.03s17.92-5.4,22.11-13.33c.24-.46.47-.93.68-1.4.03-.06.06-.13.09-.19,1.36-3.08,2.12-6.49,2.12-10.08C50,11.19,38.81,0,25,0ZM25,34.26c-4.78,0-8.65-3.87-8.65-8.65s3.87-8.65,8.65-8.65,8.65,3.87,8.65,8.65-3.87,8.65-8.65,8.65Z"/>
          </svg> ColorMyTravels
          </h1>
      </SidebarHeader>

      {/* Main content */}
      <SidebarContent className="px-4 pt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/"} className="hover:border-l-2 text-[#5E3023] hover:border-[#895737] hover:rounded-l-none">
              <Link to="/" onClick={closeOnMobile}>
                <Map className="w-4 h-4 mr-2" />
                Map
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/colors"}
              className="hover:border-l-2 text-[#5E3023] hover:border-[#895737] hover:rounded-l-none"
            >
              <Link to="/colors" onClick={closeOnMobile}>
                <Paintbrush className="w-4 h-4 mr-2" />
                Colors
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/feed"}
              className="hover:border-l-2 text-[#5E3023] hover:border-[#895737] hover:rounded-l-none"
            >
              <Link to="/feed" onClick={closeOnMobile}>
                <Newspaper className="w-4 h-4 mr-2" />
                Feed
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/friends"}
              className="hover:border-l-2 text-[#5E3023] hover:border-[#895737] hover:rounded-l-none"
            >
              <Link to="/friends" onClick={closeOnMobile}>
                <Users className="w-4 h-4 mr-2" />
                Friends
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* Bottom user */}
      <SidebarFooter >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/user"} className="hover:border-l-2 text-[#5E3023] hover:border-[#895737] hover:rounded-l-none">
              <Link to="/user" onClick={closeOnMobile}>
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
