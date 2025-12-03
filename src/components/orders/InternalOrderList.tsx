import { InternalOrder, Supplier } from "@/types/internal-orders";
import { InternalOrderCard } from "./InternalOrderCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { InternalOrderDialog } from "./InternalOrderDialog";
import { ClientOrderPreviewDialog } from "./ClientOrderPreviewDialog";

interface InternalOrderListProps {
  orders: InternalOrder[];
  loading: boolean;
  onRefresh?: () => void;
}

export const InternalOrderList = ({ orders, loading, onRefresh }: InternalOrderListProps) => {
  const { isAdmin } = useUserRole();
  const [editingOrder, setEditingOrder] = useState<InternalOrder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [clientOrderPreviewOpen, setClientOrderPreviewOpen] = useState(false);
  const [selectedClientOrderId, setSelectedClientOrderId] = useState<string | null>(null);

  const handleEdit = (order: InternalOrder) => {
    // No permitir editar órdenes de lotes CSV
    if (order.batch_id && !order.is_batch_primary) {
      toast.error("No se puede editar una orden individual de un lote CSV");
      return;
    }
    
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta orden?')) return;

    try {
      const { error } = await supabase
        .from('purchase_orders_internal')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Orden eliminada exitosamente");
      onRefresh?.();
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error("Error al eliminar la orden");
    }
  };

  const handleViewClientOrder = (orderId: string) => {
    setSelectedClientOrderId(orderId);
    setClientOrderPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron órdenes internas
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <InternalOrderCard
            key={order.id}
            order={order}
            onEdit={() => handleEdit(order)}
            onDelete={() => handleDelete(order.id)}
            showActions={true}
            isAdmin={isAdmin()}
            onViewClientOrder={handleViewClientOrder}
          />
        ))}
      </div>

      <InternalOrderDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          onRefresh?.();
          setEditingOrder(null);
        }}
        order={editingOrder}
      />

      <ClientOrderPreviewDialog
        open={clientOrderPreviewOpen}
        onOpenChange={(open) => {
          setClientOrderPreviewOpen(open);
          if (!open) setSelectedClientOrderId(null);
        }}
        orderId={selectedClientOrderId || ""}
      />
    </>
  );
};
