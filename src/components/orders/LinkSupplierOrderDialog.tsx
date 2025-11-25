import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SupplierOrder {
  id: string;
  proveedor_nombre: string;
  numero_factura: string;
  tipo_producto: string;
  quilataje: number | null;
  forma: string | null;
  color: string | null;
  claridad: string | null;
  fecha_compra: string;
  supplier?: {
    nombre_empresa: string;
  };
}

interface LinkSupplierOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess: () => void;
}

export const LinkSupplierOrderDialog = ({
  open,
  onOpenChange,
  orderId,
  onSuccess,
}: LinkSupplierOrderDialogProps) => {
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableOrders();
    }
  }, [open]);

  const fetchAvailableOrders = async () => {
    setFetching(true);
    try {
      // First, get all internal order IDs that are already linked
      const { data: linkedOrders } = await supabase
        .from("orders")
        .select("internal_order_id")
        .not("internal_order_id", "is", null);

      const linkedIds = linkedOrders?.map((o) => o.internal_order_id) || [];

      // Get all internal orders that are NOT linked
      let query = supabase
        .from("purchase_orders_internal")
        .select(`
          id,
          proveedor_nombre,
          numero_factura,
          tipo_producto,
          quilataje,
          forma,
          color,
          claridad,
          fecha_compra,
          supplier:suppliers(nombre_empresa)
        `)
        .order("fecha_compra", { ascending: false });

      if (linkedIds.length > 0) {
        query = query.not("id", "in", `(${linkedIds.join(",")})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSupplierOrders(data || []);
    } catch (error) {
      console.error("Error fetching supplier orders:", error);
      toast.error("Error al cargar órdenes de proveedor");
    } finally {
      setFetching(false);
    }
  };

  const handleLink = async () => {
    if (!selectedOrderId) {
      toast.error("Por favor selecciona una orden de proveedor");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ internal_order_id: selectedOrderId })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Orden vinculada correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error linking order:", error);
      toast.error("Error al vincular la orden");
    } finally {
      setLoading(false);
    }
  };

  const capitalizeFirst = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const getOrderLabel = (order: SupplierOrder) => {
    const supplierName = order.supplier?.nombre_empresa || order.proveedor_nombre;
    let label = `${supplierName} #${order.numero_factura}`;
    
    if (order.tipo_producto === "diamante" && order.quilataje) {
      const details = [
        order.quilataje ? `${order.quilataje}ct` : null,
        order.forma ? capitalizeFirst(order.forma) : null,
        order.color ? order.color.toUpperCase() : null,
        order.claridad ? order.claridad.toUpperCase() : null,
      ].filter(Boolean).join(" ");
      
      if (details) {
        label += ` - ${details}`;
      }
    } else {
      label += ` - ${capitalizeFirst(order.tipo_producto)}`;
    }
    
    label += ` (${format(new Date(order.fecha_compra), "dd/MM/yyyy", { locale: es })})`;
    
    return label;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Vincular a Orden de Proveedor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Orden de Proveedor</Label>
            {fetching ? (
              <div className="text-sm text-muted-foreground">Cargando órdenes disponibles...</div>
            ) : supplierOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No hay órdenes de proveedor disponibles para vincular
              </div>
            ) : (
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedOrderId
                      ? getOrderLabel(supplierOrders.find((o) => o.id === selectedOrderId)!)
                      : "Seleccionar orden..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[550px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar orden..." />
                    <CommandEmpty>No se encontraron órdenes.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-auto">
                      {supplierOrders.map((order) => (
                        <CommandItem
                          key={order.id}
                          value={getOrderLabel(order)}
                          onSelect={() => {
                            setSelectedOrderId(order.id);
                            setComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedOrderId === order.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {getOrderLabel(order)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleLink} disabled={loading || !selectedOrderId || fetching}>
            {loading ? "Vinculando..." : "Vincular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
