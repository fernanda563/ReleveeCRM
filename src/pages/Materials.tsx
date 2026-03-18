import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Search, BarChart3, CheckCircle2, Layers } from "lucide-react";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { MaterialDialog } from "@/components/materials/MaterialDialog";

interface Material {
  id: string;
  nombre: string;
  categoria: string | null;
  unidad_medida: string;
  costo_directo: number;
  tipo_margen: string;
  valor_margen: number;
  redondeo: string;
  redondeo_multiplo: number | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export default function Materials() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin()) navigate("/dashboard");
  }, [roleLoading, isAdmin, navigate]);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("nombre");
    if (error) {
      toast.error("Error al cargar materiales");
    } else {
      setMaterials(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const categories = [...new Set(materials.map((m) => m.categoria).filter(Boolean))] as string[];

  const filtered = materials.filter((m) => {
    if (search && !m.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && m.categoria !== categoryFilter) return false;
    if (statusFilter === "activo" && !m.activo) return false;
    if (statusFilter === "inactivo" && m.activo) return false;
    return true;
  });

  const stats = {
    total: materials.length,
    activos: materials.filter((m) => m.activo).length,
    categorias: categories.length,
  };

  const handleSubmit = async (data: any) => {
    setSaving(true);
    if (editingMaterial) {
      const { error } = await supabase
        .from("materials")
        .update(data)
        .eq("id", editingMaterial.id);
      if (error) toast.error("Error al actualizar material");
      else toast.success("Material actualizado");
    } else {
      const { error } = await supabase.from("materials").insert(data);
      if (error) toast.error("Error al crear material");
      else toast.success("Material creado");
    }
    setSaving(false);
    setDialogOpen(false);
    setEditingMaterial(null);
    fetchMaterials();
  };

  const handleDelete = async () => {
    if (!deletingMaterial) return;
    const { error } = await supabase.from("materials").delete().eq("id", deletingMaterial.id);
    if (error) toast.error("Error al eliminar material");
    else toast.success("Material eliminado");
    setDeletingMaterial(null);
    fetchMaterials();
  };

  if (roleLoading || (!isAdmin())) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Materiales</h1>
          <p className="text-muted-foreground mt-1">Administra los materiales, costos y márgenes de utilidad</p>
        </div>
        <Button onClick={() => { setEditingMaterial(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Material
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total materiales</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-3xl font-bold">{stats.activos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Categorías</p>
              <p className="text-3xl font-bold">{stats.categorias}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Filtros avanzados</h3>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{filtered.length} resultado(s)</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No se encontraron materiales</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              onEdit={(mat) => { setEditingMaterial(mat); setDialogOpen(true); }}
              onDelete={(mat) => setDeletingMaterial(mat)}
            />
          ))}
        </div>
      )}

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingMaterial(null); }}
        onSubmit={handleSubmit}
        initialData={editingMaterial}
        existingCategories={categories}
        loading={saving}
      />

      <AlertDialog open={!!deletingMaterial} onOpenChange={(o) => !o && setDeletingMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar material</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{deletingMaterial?.nombre}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
