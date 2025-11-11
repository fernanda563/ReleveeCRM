import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  nombre: string;
  apellido_paterno: string;
}

export interface ProductionFilters {
  estatusPiedra: string;
  estatusMontura: string;
  disenadorId: string;
  joyeroId: string;
  fechaDesde: Date | undefined;
  fechaHasta: Date | undefined;
}

interface ProductionFiltersProps {
  filters: ProductionFilters;
  onFiltersChange: (filters: ProductionFilters) => void;
}

const STONE_STATUSES = [
  { value: "en_busqueda", label: "En proceso de búsqueda" },
  { value: "piedra_comprada", label: "Piedra comprada" },
  { value: "piedra_transito_pobox", label: "Piedra en tránsito a PO Box" },
  { value: "piedra_pobox", label: "Piedra en PO Box" },
  { value: "piedra_levant", label: "Piedra en Levant" },
  { value: "piedra_con_disenador", label: "Piedra con diseñador" },
  { value: "piedra_en_taller", label: "Piedra en taller" },
  { value: "piedra_montada", label: "Piedra montada" },
];

const MOUNTING_STATUSES = [
  { value: "en_espera", label: "En espera de iniciar el proceso" },
  { value: "proceso_diseno", label: "En proceso de diseño" },
  { value: "impresion_modelo", label: "Impresión de modelo" },
  { value: "reimpresion_modelo", label: "Reimpresión de modelo" },
  { value: "traslado_modelo", label: "Traslado de modelo" },
  { value: "espera_taller", label: "En espera en taller" },
  { value: "proceso_vaciado", label: "En proceso de vaciado" },
  { value: "pieza_terminada_taller", label: "Pieza terminada en taller" },
  { value: "proceso_recoleccion", label: "En proceso de recolección" },
  { value: "recolectado", label: "Recolectado" },
  { value: "entregado_oyamel", label: "Entregado en Oyamel" },
  { value: "entregado_levant", label: "Entregado en Levant" },
  { value: "no_aplica", label: "No aplica" },
];

export const ProductionFiltersComponent = ({
  filters,
  onFiltersChange,
}: ProductionFiltersProps) => {
  const [disenadores, setDisenadores] = useState<Profile[]>([]);
  const [joyeros, setJoyeros] = useState<Profile[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch designers
      const { data: disenadorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "disenador");

      const disenadorIds = disenadorRoles?.map((r) => r.user_id) || [];

      if (disenadorIds.length > 0) {
        const { data: disenadorData } = await supabase
          .from("profiles")
          .select("id, nombre, apellido_paterno")
          .in("id", disenadorIds);

        setDisenadores(disenadorData || []);
      }

      // Fetch jewelers
      const { data: joyeroRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "joyero");

      const joyeroIds = joyeroRoles?.map((r) => r.user_id) || [];

      if (joyeroIds.length > 0) {
        const { data: joyeroData } = await supabase
          .from("profiles")
          .select("id, nombre, apellido_paterno")
          .in("id", joyeroIds);

        setJoyeros(joyeroData || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      estatusPiedra: "",
      estatusMontura: "",
      disenadorId: "",
      joyeroId: "",
      fechaDesde: undefined,
      fechaHasta: undefined,
    });
  };

  const hasActiveFilters =
    filters.estatusPiedra ||
    filters.estatusMontura ||
    filters.disenadorId ||
    filters.joyeroId ||
    filters.fechaDesde ||
    filters.fechaHasta;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filtros Avanzados</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Estado de Piedra */}
            <div className="space-y-2">
              <Label>Estado de Piedra</Label>
              <Select
                value={filters.estatusPiedra}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, estatusPiedra: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {STONE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado de Montura */}
            <div className="space-y-2">
              <Label>Estado de Montura</Label>
              <Select
                value={filters.estatusMontura}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, estatusMontura: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {MOUNTING_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Diseñador */}
            <div className="space-y-2">
              <Label>Diseñador Asignado</Label>
              <Select
                value={filters.disenadorId}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, disenadorId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los diseñadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los diseñadores</SelectItem>
                  <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                  {disenadores.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre} {d.apellido_paterno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Joyero */}
            <div className="space-y-2">
              <Label>Joyero Asignado</Label>
              <Select
                value={filters.joyeroId}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, joyeroId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los joyeros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los joyeros</SelectItem>
                  <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                  {joyeros.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nombre} {j.apellido_paterno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Desde */}
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.fechaDesde ? (
                      format(filters.fechaDesde, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.fechaDesde}
                    onSelect={(date) =>
                      onFiltersChange({ ...filters, fechaDesde: date })
                    }
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.fechaHasta ? (
                      format(filters.fechaHasta, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.fechaHasta}
                    onSelect={(date) =>
                      onFiltersChange({ ...filters, fechaHasta: date })
                    }
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
