import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Users as UsersIcon, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { UserDialog } from "@/components/users/UserDialog";
import { RoleDialog } from "@/components/users/RoleDialog";

type AppRole = "administrador" | "disenador" | "joyero" | "gerente_tienda" | "contador";

interface Profile {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  email: string;
  telefono: string | null;
  created_at: string;
  user_roles: { role: AppRole }[];
}

const Users = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin()) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin()) {
      fetchProfiles();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = profiles.filter((profile) =>
        `${profile.nombre} ${profile.apellido_paterno} ${profile.apellido_materno || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchTerm, profiles]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "administrador":
        return "bg-foreground/10 text-foreground border border-foreground";
      case "disenador":
        return "bg-foreground/10 text-foreground border border-foreground/50";
      case "joyero":
        return "bg-foreground/10 text-foreground border border-foreground/50";
      case "gerente_tienda":
        return "bg-foreground/10 text-foreground border border-foreground/50";
      case "contador":
        return "bg-foreground/10 text-foreground border border-foreground/50";
      default:
        return "bg-muted";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      administrador: "Administrador",
      disenador: "Diseñador",
      joyero: "Joyero",
      gerente_tienda: "Gerente de Tienda",
      contador: "Contador",
    };
    return labels[role] || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin()) {
    return null;
  }

  const stats = [
    {
      title: "Total Usuarios",
      value: profiles.length,
      icon: UsersIcon,
    },
    {
      title: "Diseñadores",
      value: profiles.filter((p) => p.user_roles.some((r) => r.role === "disenador")).length,
      icon: Shield,
    },
    {
      title: "Joyeros",
      value: profiles.filter((p) => p.user_roles.some((r) => r.role === "joyero")).length,
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <Button onClick={() => setUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema y sus roles
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <stat.icon className="h-4 w-4" />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros avanzados</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredProfiles.length} usuario(s) encontrado(s)
        </p>

        {/* Users List */}
        {filteredProfiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No se encontraron usuarios</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {profile.nombre} {profile.apellido_paterno}{" "}
                        {profile.apellido_materno || ""}
                      </h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{profile.email}</p>
                        {profile.telefono && <p>{profile.telefono}</p>}
                        <p>Registrado el {formatDate(profile.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profile.user_roles.length === 0 ? (
                          <Badge variant="outline">Sin roles asignados</Badge>
                        ) : (
                          profile.user_roles.map((ur, idx) => (
                            <Badge
                              key={idx}
                              className={getRoleBadgeColor(ur.role)}
                            >
                              {getRoleLabel(ur.role)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setRoleDialogOpen(true);
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Gestionar Roles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSuccess={fetchProfiles}
      />

      {selectedProfile && (
        <RoleDialog
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          profile={selectedProfile}
          onSuccess={fetchProfiles}
        />
      )}
    </div>
  );
};

export default Users;