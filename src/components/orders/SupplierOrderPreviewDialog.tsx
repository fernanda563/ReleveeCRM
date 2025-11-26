import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { InternalOrderCard } from "./InternalOrderCard";
import { InternalOrder } from "@/types/internal-orders";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SupplierOrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internalOrderId: string;
}

export const SupplierOrderPreviewDialog = ({
  open,
  onOpenChange,
  internalOrderId,
}: SupplierOrderPreviewDialogProps) => {
  const [order, setOrder] = useState<InternalOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && internalOrderId) {
      fetchOrder();
    }
  }, [open, internalOrderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("purchase_orders_internal")
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq("id", internalOrderId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("No se encontró la orden de proveedor");
        onOpenChange(false);
        return;
      }

      // Parse JSONB arrays and cast to InternalOrder
      const parsedOrder = {
        ...data,
        imagenes_producto: (Array.isArray(data.imagenes_producto) 
          ? data.imagenes_producto 
          : []) as string[],
        cantidad: data.cantidad || 1,
      } as InternalOrder;

      setOrder(parsedOrder);
    } catch (error) {
      console.error("Error fetching internal order:", error);
      toast.error("Error al cargar la orden de proveedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Orden de Proveedor</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          </div>
        ) : order ? (
          <InternalOrderCard 
            order={order} 
            showActions={false}
          />
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No se pudo cargar la orden
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
