import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClientOrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

interface Order {
  id: string;
  custom_id: string | null;
  precio_venta: number;
  importe_anticipo: number;
  forma_pago: string;
  estatus_pago: string;
  estatus_piedra: string | null;
  estatus_montura: string | null;
  piedra_tipo: string;
  metal_tipo: string;
  metal_color: string | null;
  metal_pureza: string | null;
  tipo_accesorio: string | null;
  talla: number | null;
  diamante_forma: string | null;
  diamante_quilataje: number | null;
  diamante_color: string | null;
  diamante_claridad: string | null;
  diamante_corte: string | null;
  gema_observaciones: string | null;
  fecha_entrega_esperada: string | null;
  created_at: string;
  signature_status: string | null;
  clients: {
    nombre: string;
    apellido: string;
  };
  stl_files: {
    nombre: string;
    stl_file_url: string;
  } | null;
}

export const ClientOrderPreviewDialog = ({
  open,
  onOpenChange,
  orderId,
}: ClientOrderPreviewDialogProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && orderId && orderId !== "") {
      fetchOrder();
    }
  }, [open, orderId]);

  useEffect(() => {
    if (!open) {
      setOrder(null);
      setLoading(true);
    }
  }, [open]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          clients(nombre, apellido),
          stl_files!orders_stl_file_id_fkey(nombre, stl_file_url)
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("No se encontró la orden del cliente");
        onOpenChange(false);
        return;
      }

      setOrder(data as Order);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Error al cargar la orden del cliente");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      anticipo_recibido: { variant: "secondary", label: "Anticipo recibido" },
      liquidado: { variant: "default", label: "Liquidado" },
    };
    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSignatureStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Sin enviar</Badge>;
    
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      signed: { variant: "default", label: "Firmado" },
      awaiting_signature: { variant: "secondary", label: "Pendiente de firma" },
      declined: { variant: "destructive", label: "Rechazado" },
    };
    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const capitalizeFirst = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Orden de Cliente</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Cliente y ID */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {order.clients.nombre} {order.clients.apellido}
              </h3>
              {order.custom_id && (
                <p className="text-sm text-muted-foreground">{order.custom_id}</p>
              )}
            </div>

            {/* Estados */}
            <div className="flex flex-wrap gap-2">
              {getPaymentStatusBadge(order.estatus_pago)}
              {getSignatureStatusBadge(order.signature_status)}
            </div>

            {/* Producto */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Producto</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {order.tipo_accesorio && (
                  <p><span className="font-medium">Tipo:</span> {capitalizeFirst(order.tipo_accesorio)}</p>
                )}
                {order.talla && (
                  <p><span className="font-medium">Talla:</span> {order.talla}</p>
                )}
                <p><span className="font-medium">Metal:</span> {capitalizeFirst(order.metal_tipo)}</p>
                {order.metal_pureza && (
                  <p><span className="font-medium">Pureza:</span> {order.metal_pureza}</p>
                )}
                {order.metal_color && (
                  <p><span className="font-medium">Color:</span> {capitalizeFirst(order.metal_color)}</p>
                )}
              </div>
            </div>

            {/* Piedra */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Piedra</h4>
              <p className="text-sm"><span className="font-medium">Tipo:</span> {capitalizeFirst(order.piedra_tipo)}</p>
              
              {order.piedra_tipo === 'diamante' && order.diamante_quilataje && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <p><span className="font-medium">Quilataje:</span> {order.diamante_quilataje}ct</p>
                  {order.diamante_forma && (
                    <p><span className="font-medium">Forma:</span> {capitalizeFirst(order.diamante_forma)}</p>
                  )}
                  {order.diamante_color && (
                    <p><span className="font-medium">Color:</span> {order.diamante_color}</p>
                  )}
                  {order.diamante_claridad && (
                    <p><span className="font-medium">Claridad:</span> {order.diamante_claridad}</p>
                  )}
                  {order.diamante_corte && (
                    <p><span className="font-medium">Corte:</span> {capitalizeFirst(order.diamante_corte)}</p>
                  )}
                </div>
              )}

              {order.gema_observaciones && (
                <p className="text-sm"><span className="font-medium">Observaciones:</span> {order.gema_observaciones}</p>
              )}

              {order.estatus_piedra && (
                <p className="text-sm"><span className="font-medium">Estado:</span> {order.estatus_piedra.replace(/_/g, ' ')}</p>
              )}
            </div>

            {/* Montura */}
            {order.estatus_montura && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-semibold text-sm">Montura</h4>
                <p className="text-sm"><span className="font-medium">Estado:</span> {order.estatus_montura.replace(/_/g, ' ')}</p>
              </div>
            )}

            {/* Financiero */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Información Financiera</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Precio de Venta:</span> ${order.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                <p><span className="font-medium">Anticipo:</span> ${order.importe_anticipo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                <p><span className="font-medium">Saldo:</span> ${(order.precio_venta - order.importe_anticipo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                <p><span className="font-medium">Forma de Pago:</span> {capitalizeFirst(order.forma_pago)}</p>
              </div>
            </div>

            {/* Fechas */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Fechas</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Creación:</span> {format(new Date(order.created_at), 'dd/MM/yyyy')}</p>
                {order.fecha_entrega_esperada && (
                  <p><span className="font-medium">Entrega Esperada:</span> {format(new Date(order.fecha_entrega_esperada), 'dd/MM/yyyy')}</p>
                )}
              </div>
            </div>

            {/* Archivo STL */}
            {order.stl_files && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-semibold text-sm">Archivo STL</h4>
                <a
                  href={order.stl_files.stl_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {order.stl_files.nombre}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No se pudo cargar la orden
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
