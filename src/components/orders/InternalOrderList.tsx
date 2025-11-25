import { InternalOrder, Supplier } from "@/types/internal-orders";
import { InternalOrderCard } from "./InternalOrderCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface InternalOrderListProps {
  orders: InternalOrder[];
  loading: boolean;
  onRefresh?: () => void;
}

export const InternalOrderList = ({ orders, loading, onRefresh }: InternalOrderListProps) => {
  const { isAdmin } = useUserRole();

  const handleDownloadInvoice = (url: string) => {
    window.open(url, '_blank');
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
    <div className="space-y-4">
      {orders.map((order) => (
        <InternalOrderCard
          key={order.id}
          order={order}
          onEdit={() => {/* TODO: Implement edit */}}
          onDelete={() => handleDelete(order.id)}
          showActions={true}
          isAdmin={isAdmin()}
        />
      ))}
    </div>
  );
};
