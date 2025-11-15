import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Gem,
  LogOut,
  Shield,
  BarChart3,
  FileText,
  Box,
  Settings,
  Calendar,
  Cog,
  Users2,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    title: "Gestión de Clientes",
    url: "/crm",
    icon: Users,
    adminOnly: false,
  },
  {
    title: "Órdenes de Compra",
    url: "/orders",
    icon: ShoppingCart,
    adminOnly: false,
  },
  {
    title: "Producción",
    url: "/production",
    icon: Gem,
    adminOnly: false,
  },
  {
    title: "Estadísticas de Producción",
    url: "/production/dashboard",
    icon: BarChart3,
    adminOnly: false,
  },
  {
    title: "Gestión de Usuarios",
    url: "/users",
    icon: Shield,
    adminOnly: true,
  },
  {
    title: "Colección STL/EDIT",
    url: "/stl-collection",
    icon: Box,
    adminOnly: true,
  },
  {
    title: "Log de Auditoría",
    url: "/audit-log",
    icon: FileText,
    adminOnly: true,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  
  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin()
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Sesión cerrada");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Gem className="h-5 w-5 text-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Joyería Relevée
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                Sistema de Gestión
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {isAdmin() && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    tooltip={collapsed ? "Configuración" : undefined}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="end"
                  sideOffset={8}
                  className="w-56"
                >
                  <DropdownMenuItem onClick={() => navigate('/settings/calendar')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Google Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings/system')}>
                    <Cog className="mr-2 h-4 w-4" />
                    Sistema
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings/roles')}>
                    <Users2 className="mr-2 h-4 w-4" />
                    Gestión de Roles
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={collapsed ? "Cerrar sesión" : undefined}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
