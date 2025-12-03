import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WorkOrder, WorkOrderStatus, WORK_ORDER_STATUS_LABELS } from "@/types/work-concepts";
import { WorkOrderItemsEditor } from "./WorkOrderItemsEditor";

interface WorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder | null;
  onSaved: () => void;
}

interface Client {
  id: string;
  nombre: string;
  apellido: string;
}

interface Supplier {
  id: string;
  nombre_empresa: string;
}

interface Order {
  id: string;
  custom_id: string | null;
  client_id: string;
}

interface WorkOrderItemData {
  id?: string;
  work_concept_id: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  notas: string;
  concept_name?: string;
}

export const WorkOrderDialog = ({
  open,
  onOpenChange,
  workOrder,
  onSaved,
}: WorkOrderDialogProps) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<WorkOrderItemData[]>([]);

  const [formData, setFormData] = useState({
    client_id: "",
    order_id: "",
    taller_id: "",
    descripcion: "",
    estado: "pendiente" as WorkOrderStatus,
    fecha_entrega_esperada: null as Date | null,
    notas: "",
  });

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchSuppliers();
      fetchOrders();
      if (workOrder) {
        loadWorkOrderData();
      } else {
        resetForm();
      }
    }
  }, [open, workOrder]);

  const resetForm = () => {
    setFormData({
      client_id: "",
      order_id: "",
      taller_id: "",
      descripcion: "",
      estado: "pendiente",
      fecha_entrega_esperada: null,
      notas: "",
    });
    setItems([]);
    setStep(1);
  };

  const loadWorkOrderData = async () => {
    if (!workOrder) return;

    setFormData({
      client_id: workOrder.client_id,
      order_id: workOrder.order_id || "",
      taller_id: workOrder.taller_id || "",
      descripcion: workOrder.descripcion || "",
      estado: workOrder.estado,
      fecha_entrega_esperada: workOrder.fecha_entrega_esperada
        ? new Date(workOrder.fecha_entrega_esperada)
        : null,
      notas: workOrder.notas || "",
    });

    // Load items
    const { data: itemsData } = await supabase
      .from("work_order_items")
      .select(`*, work_concept:work_concepts(nombre)`)
      .eq("work_order_id", workOrder.id);

    if (itemsData) {
      setItems(
        itemsData.map((item: any) => ({
          id: item.id,
          work_concept_id: item.work_concept_id,
          cantidad: item.cantidad,
          costo_unitario: item.costo_unitario,
          precio_unitario: item.precio_unitario,
          notas: item.notas || "",
          concept_name: item.work_concept?.nombre,
        }))
      );
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, nombre, apellido")
      .order("nombre");
    setClients(data || []);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("id, nombre_empresa")
      .eq("activo", true)
      .order("nombre_empresa");
    setSuppliers(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, custom_id, client_id")
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const calculateTotals = () => {
    const totalCosto = items.reduce(
      (sum, item) => sum + item.cantidad * item.costo_unitario,
      0
    );
    const totalPrecio = items.reduce(
      (sum, item) => sum + item.cantidad * item.precio_unitario,
      0
    );
    return { totalCosto, totalPrecio };
  };

  const handleSave = async () => {
    if (!formData.client_id) {
      toast.error("Selecciona un cliente");
      return;
    }

    if (items.length === 0) {
      toast.error("Agrega al menos un concepto de trabajo");
      return;
    }

    setSaving(true);

    try {
      const { totalCosto, totalPrecio } = calculateTotals();

      const orderData = {
        client_id: formData.client_id,
        order_id: formData.order_id || null,
        taller_id: formData.taller_id || null,
        descripcion: formData.descripcion.trim() || null,
        estado: formData.estado,
        fecha_entrega_esperada: formData.fecha_entrega_esperada
          ? format(formData.fecha_entrega_esperada, "yyyy-MM-dd")
          : null,
        notas: formData.notas.trim() || null,
        total_costo: totalCosto,
        total_precio: totalPrecio,
      };

      let workOrderId = workOrder?.id;

      if (workOrder) {
        // Update existing
        const { error } = await supabase
          .from("work_orders")
          .update(orderData)
          .eq("id", workOrder.id);

        if (error) throw error;

        // Delete existing items and recreate
        await supabase
          .from("work_order_items")
          .delete()
          .eq("work_order_id", workOrder.id);
      } else {
        // Create new
        const { data, error } = await supabase
          .from("work_orders")
          .insert(orderData)
          .select()
          .single();

        if (error) throw error;
        workOrderId = data.id;
      }

      // Insert items
      if (workOrderId && items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          work_order_id: workOrderId,
          work_concept_id: item.work_concept_id,
          cantidad: item.cantidad,
          costo_unitario: item.costo_unitario,
          precio_unitario: item.precio_unitario,
          notas: item.notas || null,
        }));

        const { error: itemsError } = await supabase
          .from("work_order_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast.success(
        workOrder
          ? "Orden de trabajo actualizada"
          : "Orden de trabajo creada"
      );
      onSaved();
    } catch (error: any) {
      console.error("Error saving work order:", error);
      toast.error(error.message || "Error al guardar la orden de trabajo");
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = formData.client_id
    ? orders.filter((o) => o.client_id === formData.client_id)
    : [];

  const { totalCosto, totalPrecio } = calculateTotals();
  const margin = totalPrecio - totalCosto;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workOrder ? "Editar Orden de Trabajo" : "Nueva Orden de Trabajo"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Paso 1: Información general"
              : "Paso 2: Conceptos de trabajo"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value, order_id: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nombre} {client.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Orden de compra vinculada */}
            <div className="space-y-2">
              <Label>Orden de compra vinculada (opcional)</Label>
            <Select
                value={formData.order_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, order_id: value === "none" ? "" : value })
                }
                disabled={!formData.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin vincular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vincular</SelectItem>
                  {filteredOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.custom_id || order.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vincula esta orden de trabajo a una orden de compra existente
              </p>
            </div>

            {/* Taller externo */}
            <div className="space-y-2">
              <Label>Taller externo (opcional)</Label>
            <Select
                value={formData.taller_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, taller_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar taller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.nombre_empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado (solo en edición) */}
            {workOrder && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: WorkOrderStatus) =>
                    setFormData({ ...formData, estado: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORK_ORDER_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-2">
              <Label>Descripción del trabajo</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Describe el trabajo a realizar..."
                rows={2}
              />
            </div>

            {/* Fecha de entrega */}
            <div className="space-y-2">
              <Label>Fecha de entrega esperada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.fecha_entrega_esperada && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fecha_entrega_esperada
                      ? format(formData.fecha_entrega_esperada, "PPP", {
                          locale: es,
                        })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_entrega_esperada || undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, fecha_entrega_esperada: date || null })
                    }
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea
                value={formData.notas}
                onChange={(e) =>
                  setFormData({ ...formData, notas: e.target.value })
                }
                placeholder="Notas internas..."
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="py-4">
            <WorkOrderItemsEditor items={items} onItemsChange={setItems} />

            {/* Totals */}
            {items.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Costo:
                  </span>
                  <span className="font-medium">
                    ${totalCosto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Precio:
                  </span>
                  <span className="font-medium">
                    ${totalPrecio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Margen:</span>
                  <span
                    className={`font-semibold ${
                      margin >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${margin.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={saving}
              className="sm:mr-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!formData.client_id}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving || items.length === 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {workOrder ? "Guardar cambios" : "Crear orden"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
