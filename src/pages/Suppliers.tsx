import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Building2, Globe, Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";
import { PRODUCT_TYPES } from "@/lib/product-types";

interface Supplier {
  id: string;
  nombre_empresa: string;
  nombre_contacto: string;
  email: string;
  telefono: string | null;
  telefono_codigo_pais: string | null;
  pais: string | null;
  notas: string | null;
  activo: boolean;
  tipos_productos: string[];
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
    if (isAdmin() && !roleLoading) {
      fetchSuppliers();
    }
  }, [roleLoading]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = suppliers.filter((supplier) =>
        supplier.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.nombre_contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [searchTerm, suppliers]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      const suppliersWithTypes = (data || []).map(supplier => ({
        ...supplier,
        tipos_productos: (supplier.tipos_productos as string[]) || []
      }));
      
      setSuppliers(suppliersWithTypes as Supplier[]);
      setFilteredSuppliers(suppliersWithTypes as Supplier[]);
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      if (error?.message && !error?.message.includes("Failed to fetch")) {
        toast.error("Error al cargar los proveedores");
      }
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

  const stats = [
    {
      title: "Total Proveedores",
      value: suppliers.length,
      icon: Building2,
    },
    {
      title: "Proveedores Activos",
      value: getActiveSuppliers(),
      icon: Building2,
    },
    {
      title: "País Principal",
      value: topCountry.country,
      subtitle: `${topCountry.count} proveedores`,
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">Gestión de Proveedores</h1>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </div>
          <p className="text-muted-foreground">
            Administra el directorio de proveedores de la joyería
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
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
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
                placeholder="Buscar por empresa, contacto o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredSuppliers.length} proveedor(es) encontrado(s)
        </p>

        {/* Suppliers List */}
        {filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No se encontraron proveedores</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSuppliers.map((supplier) => (
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
                          Contacto: {supplier.nombre_contacto}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {supplier.email}
                        </p>
                        {supplier.telefono && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {supplier.telefono_codigo_pais || "+52"} {supplier.telefono}
                          </p>
                        )}
                        {supplier.pais && (
                          <p className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {supplier.pais}
                          </p>
                        )}
                      </div>

                      {supplier.tipos_productos && supplier.tipos_productos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {supplier.tipos_productos.map((tipo) => {
                            const productType = PRODUCT_TYPES.find((p) => p.value === tipo);
                            return (
                              <Badge key={tipo} variant="secondary" className="text-xs">
                                {productType?.label || tipo}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
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
            ))}
          </div>
        )}
      </main>

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