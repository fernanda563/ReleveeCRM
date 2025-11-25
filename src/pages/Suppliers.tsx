import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Building2, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";

interface Supplier {
  id: string;
  nombre_empresa: string;
  nombre_contacto: string;
  apellido_contacto: string | null;
  email: string;
  telefono: string | null;
  telefono_codigo_pais: string | null;
  pais: string | null;
  ciudad: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

const Suppliers = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin()) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin()) {
      fetchSuppliers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = suppliers.filter((supplier) =>
        supplier.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.nombre_contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.apellido_contacto?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [searchTerm, suppliers]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
      setFilteredSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Error al cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const getActiveSuppliers = () => suppliers.filter((s) => s.activo).length;

  const getTopCountry = () => {
    if (suppliers.length === 0) return { country: "N/A", count: 0 };
    
    const countryCounts = suppliers.reduce((acc, supplier) => {
      const country = supplier.pais || "Sin especificar";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0];
    return topCountry ? { country: topCountry[0], count: topCountry[1] } : { country: "N/A", count: 0 };
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
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

  const topCountry = getTopCountry();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Gestión de Proveedores</h1>
          <p className="text-muted-foreground mt-2">
            Administra el directorio de proveedores de la joyería
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getActiveSuppliers()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">País Principal</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topCountry.country}</div>
              <p className="text-xs text-muted-foreground">{topCountry.count} proveedores</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empresa, contacto o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers List */}
        <div className="space-y-4">
          {filteredSuppliers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron proveedores</p>
              </CardContent>
            </Card>
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {supplier.nombre_empresa}
                        </h3>
                        <Badge variant={supplier.activo ? "default" : "secondary"}>
                          {supplier.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">
                          Contacto: {supplier.nombre_contacto} {supplier.apellido_contacto || ""}
                        </p>
                        <p>📧 {supplier.email}</p>
                        {supplier.telefono && (
                          <p>📞 {supplier.telefono_codigo_pais || "+52"} {supplier.telefono}</p>
                        )}
                        {(supplier.pais || supplier.ciudad) && (
                          <p>
                            🌍 {supplier.ciudad ? `${supplier.ciudad}, ` : ""}{supplier.pais || ""}
                          </p>
                        )}
                        {supplier.direccion && <p>📍 {supplier.direccion}</p>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                    >
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
        onSuccess={fetchSuppliers}
      />
    </div>
  );
};

export default Suppliers;
