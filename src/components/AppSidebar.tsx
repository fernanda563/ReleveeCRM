import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
  ClipboardList,
  Building2,
  Pencil,
  Wrench,
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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const menuSections = [
  {
    label: "Navegación Principal",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, adminOnly: false },
      { title: "Gestión de Clientes", url: "/crm", icon: Users, adminOnly: false },
      { title: "Proyectos", url: "/projects", icon: Gem, adminOnly: false },
      { title: "Órdenes de Compra", url: "/orders", icon: ShoppingCart, adminOnly: false },
      { title: "Órdenes de Trabajo", url: "/work-orders", icon: ClipboardList, adminOnly: false },
    ],
  },
  {
    label: "Proceso de Producción",
    items: [
      { title: "Producción", url: "/production", icon: Box, adminOnly: false },
      { title: "Proceso de Diseño", url: "/design-process", icon: Pencil, adminOnly: false },
      { title: "Proceso de Taller", url: "/workshop-process", icon: Wrench, adminOnly: false },
    ],
  },
  {
    label: "Reportes",
    items: [
      { title: "Estadísticas de Producción", url: "/production/dashboard", icon: BarChart3, adminOnly: false },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { title: "Colección STL/EDIT", url: "/stl-collection", icon: Box, adminOnly: true },
      { title: "Log de Auditoría", url: "/audit-log", icon: FileText, adminOnly: true },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Gestión de Usuarios", url: "/users", icon: Shield, adminOnly: true },
      { title: "Gestión de Proveedores", url: "/suppliers", icon: Building2, adminOnly: true },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { settings: companySettings } = useSystemSettings('company');

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? resolvedTheme : theme) : 'light';
  const companyLogo = companySettings?.company_logo_url as string | undefined;
  const lightLogo = (companySettings?.company_logo_light_url as string | undefined) || companyLogo;
  const darkLogo = (companySettings?.company_logo_dark_url as string | undefined) || companyLogo;
  const logoSrc = currentTheme === 'dark' ? darkLogo : lightLogo;

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Sesión cerrada");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center px-2 py-4">
          {mounted ? (
            <img 
              src={logoSrc}
              alt="Joyería Relevée"
              className={`object-contain transition-all duration-200 ${
                collapsed 
                  ? 'h-8 w-8' 
                  : 'h-12 w-auto max-w-[140px]'
              }`}
            />
          ) : (
            <div className={collapsed ? 'h-8 w-8' : 'h-12 w-[140px]'} />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuSections.map((section, sectionIndex) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || isAdmin()
          );
          
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={section.label}>
              <SidebarGroup>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => (
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
              
              {sectionIndex < menuSections.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          );
        })}
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
