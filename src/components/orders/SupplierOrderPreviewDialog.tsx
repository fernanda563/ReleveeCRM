import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { InternalOrderCard } from "./InternalOrderCard";
import { InternalOrder } from "@/types/internal-orders";
import { Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";

interface SupplierOrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internalOrderId: string;
  clientOrderId?: string;
  onUnlink?: () => void;
}

export const SupplierOrderPreviewDialog = ({
  open,
  onOpenChange,
  internalOrderId,
  clientOrderId,
  onUnlink,
}: SupplierOrderPreviewDialogProps) => {
  const [order, setOrder] = useState<InternalOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);

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

  const handleUnlink = async () => {
    if (!clientOrderId) return;

    try {
      setUnlinking(true);
      const { error } = await supabase
        .from("orders")
        .update({ internal_order_id: null })
        .eq("id", clientOrderId);

      if (error) throw error;

      toast.success("Orden de proveedor desvinculada exitosamente");
      onOpenChange(false);
      onUnlink?.();
    } catch (error) {
      console.error("Error unlinking supplier order:", error);
      toast.error("Error al desvincular la orden de proveedor");
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Orden de Proveedor</DialogTitle>
            {clientOrderId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlink}
                disabled={unlinking}
                className="gap-2"
              >
                {unlinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                Desvincular
              </Button>
            )}
          </div>
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
