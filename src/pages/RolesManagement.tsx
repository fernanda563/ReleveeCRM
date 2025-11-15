import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, CheckCircle2, XCircle } from "lucide-react";

type Permission = {
  name: string;
  administrador: boolean;
  gerente_tienda: boolean;
  contador: boolean;
  disenador: boolean;
  joyero: boolean;
};

const permissions: Permission[] = [
  {
    name: "Gestión de Clientes",
    administrador: true,
    gerente_tienda: true,
    contador: false,
    disenador: false,
    joyero: false,
  },
  {
    name: "Gestión de Órdenes",
    administrador: true,
    gerente_tienda: true,
    contador: true,
    disenador: false,
    joyero: false,
  },
  {
    name: "Producción",
    administrador: true,
    gerente_tienda: false,
    contador: false,
    disenador: true,
    joyero: true,
  },
  {
    name: "Gestión de Usuarios",
    administrador: true,
    gerente_tienda: false,
    contador: false,
    disenador: false,
    joyero: false,
  },
  {
    name: "Colección STL",
    administrador: true,
    gerente_tienda: false,
    contador: false,
    disenador: false,
    joyero: false,
  },
  {
    name: "Log de Auditoría",
    administrador: true,
    gerente_tienda: false,
    contador: false,
    disenador: false,
    joyero: false,
  },
  {
    name: "Configuración del Sistema",
    administrador: true,
    gerente_tienda: false,
    contador: false,
    disenador: false,
    joyero: false,
  },
];

const roleDescriptions = {
  administrador: "Control total del sistema, gestión de usuarios y configuración",
  gerente_tienda: "Gestión de clientes, órdenes y ventas",
  contador: "Acceso a información financiera y reportes de órdenes",
  disenador: "Gestión de diseños y proceso de producción",
  joyero: "Gestión del proceso de manufactura y montaje",
};

export default function RolesManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();

  useEffect(() => {
    if (!loading && !isAdmin()) {
      navigate("/dashboard");
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Roles</h1>
        <p className="text-muted-foreground mt-2">
          Visualiza y administra los permisos de cada rol en el sistema
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Roles del Sistema</CardTitle>
            </div>
            <CardDescription>
              Descripción de cada rol y sus responsabilidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(roleDescriptions).map(([role, description]) => (
                <div
                  key={role}
                  className="rounded-lg border border-border p-4 space-y-2 bg-muted/30"
                >
                  <Badge variant="outline" className="font-medium">
                    {role}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matriz de Permisos</CardTitle>
            <CardDescription>
              Permisos asignados a cada rol del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Permiso</TableHead>
                    <TableHead className="text-center font-semibold">Admin</TableHead>
                    <TableHead className="text-center font-semibold">Gerente</TableHead>
                    <TableHead className="text-center font-semibold">Contador</TableHead>
                    <TableHead className="text-center font-semibold">Diseñador</TableHead>
                    <TableHead className="text-center font-semibold">Joyero</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.name}>
                      <TableCell className="font-medium">{permission.name}</TableCell>
                      <TableCell className="text-center">
                        {permission.administrador ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.gerente_tienda ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.contador ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.disenador ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.joyero ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
