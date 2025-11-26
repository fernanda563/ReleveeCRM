import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Order } from "@/pages/Orders";

interface DeleteOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess: () => void;
}

export const DeleteOrderDialog = ({
  open,
  onOpenChange,
  order,
  onSuccess,
}: DeleteOrderDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      // 0. Get current user for audit log
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // 1. Create audit log entry BEFORE deleting
      const clientName = order.clients 
        ? `${order.clients.nombre} ${order.clients.apellido}`
        : "Cliente desconocido";

      const { error: auditError } = await supabase
        .from("order_deletion_logs")
        .insert({
          order_id: order.id,
          order_custom_id: order.custom_id || null,
          deleted_by: user.id,
          order_data: {
            ...order,
            // Include client data in snapshot
            client_info: order.clients
          },
          client_name: clientName
        });

      if (auditError) {
        console.error("Error al crear log de auditoría:", auditError);
        toast.error("Error al registrar auditoría. Eliminación cancelada.");
        setLoading(false);
        return;
      }

      // 2. Eliminar archivos de comprobantes de pago del Storage
      if (order.comprobantes_pago && Array.isArray(order.comprobantes_pago)) {
        for (const url of order.comprobantes_pago) {
          try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/');
            const bucketIndex = pathSegments.indexOf('payment-receipts');
            if (bucketIndex !== -1) {
              const filePath = pathSegments.slice(bucketIndex + 1).join('/');
              
              const { error: storageError } = await supabase.storage
                .from('payment-receipts')
                .remove([filePath]);

              if (storageError) {
                console.error("Error al eliminar archivo:", storageError);
              }
            }
          } catch (urlError) {
            console.error("Error al procesar URL de comprobante:", urlError);
          }
        }
      }

      // 2b. Eliminar imágenes de referencia del Storage
      if (order.imagenes_referencia && Array.isArray(order.imagenes_referencia)) {
        for (const url of order.imagenes_referencia) {
          try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/');
            const bucketIndex = pathSegments.indexOf('reference-images');
            if (bucketIndex !== -1) {
              const filePath = pathSegments.slice(bucketIndex + 1).join('/');
              
              const { error: storageError } = await supabase.storage
                .from('reference-images')
                .remove([filePath]);

              if (storageError) {
                console.error("Error al eliminar imagen de referencia:", storageError);
              }
            }
          } catch (urlError) {
            console.error("Error al procesar URL de imagen de referencia:", urlError);
          }
        }
      }

      // 3. Intentar eliminar carpeta completa del order_id en storage
      try {
        const { data: files } = await supabase.storage
          .from('payment-receipts')
          .list(order.id);

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${order.id}/${file.name}`);
          await supabase.storage
            .from('payment-receipts')
            .remove(filePaths);
        }
      } catch (cleanupError) {
        console.error("Error en limpieza de carpeta:", cleanupError);
      }

      // 4. Eliminar la orden de la base de datos
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (deleteError) throw deleteError;

      toast.success("Orden eliminada y registrada en auditoría");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al eliminar orden:", error);
      toast.error(error.message || "Error al eliminar la orden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta orden?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Esta acción es permanente y no se puede deshacer.</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Se eliminará la orden permanentemente</li>
              <li>Se eliminarán todos los comprobantes de pago asociados</li>
              <li>Se eliminarán todas las imágenes de referencia</li>
              <li>Se registrará en el log de auditoría</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
