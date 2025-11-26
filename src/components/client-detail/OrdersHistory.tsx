import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, ChevronDown, FileText, FileSignature, Check, Clock, X, Box, DollarSign, Settings, Link, Trash2, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OrderDialog from "@/components/orders/OrderDialog";
import { OrderPrintDialog } from "@/components/orders/OrderPrintDialog";
import { OrderStatusDialog } from "@/components/orders/OrderStatusDialog";
import { LinkSupplierOrderDialog } from "@/components/orders/LinkSupplierOrderDialog";
import { DeleteOrderDialog } from "@/components/orders/DeleteOrderDialog";
import { SupplierOrderPreviewDialog } from "@/components/orders/SupplierOrderPreviewDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Order {
  id: string;
  custom_id?: string;
  client_id: string;
  precio_venta: number;
  importe_anticipo: number;
  estatus_pago: string;
  metal_tipo: string;
  metal_pureza: string | null;
  metal_color: string | null;
  piedra_tipo: string;
  diamante_quilataje: number | null;
  diamante_forma: string | null;
  estatus_piedra: string | null;
  estatus_montura: string | null;
  signature_status?: string | null;
  signed_document_url?: string | null;
  forma_pago: string;
  referencia_pago: string | null;
  fecha_entrega_esperada?: string | null;
  created_at: string;
  internal_order_id?: string | null;
  stl_file?: {
    id: string;
    nombre: string;
    tipo_accesorio: string;
    stl_file_url: string;
  } | null;
}

interface OrdersHistoryProps {
  clientId: string;
}

export const OrdersHistory = ({ clientId }: OrdersHistoryProps) => {
  const { isAdmin } = useUserRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierPreviewOpen, setSupplierPreviewOpen] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<Order | null>(null);
  const [selectedOrderForLink, setSelectedOrderForLink] = useState<Order | null>(null);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null);
  const [selectedInternalOrderId, setSelectedInternalOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [clientId]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
      .select(`
        *,
        stl_file:stl_files!orders_stl_file_id_fkey(id, nombre, tipo_accesorio, stl_file_url)
      `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    if (status === "liquidado") {
      return (
        <Badge className="bg-foreground text-background flex items-center gap-1">
          <Check className="h-3 w-3" />
          Liquidado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <DollarSign className="h-3 w-3" />
        Anticipo Recibido
      </Badge>
    );
  };

  const getProductionStatus = (order: Order) => {
    if (order.estatus_piedra === "piedra_montada" && order.estatus_montura === "entregado_levant") {
      return (
        <Badge className="bg-foreground text-background flex items-center gap-1">
          <Check className="h-3 w-3" />
          Completada
        </Badge>
      );
    }
    return (
      <Badge className="bg-foreground/10 text-foreground border border-foreground flex items-center gap-1">
        <Settings className="h-3 w-3" />
        En Producción
      </Badge>
    );
  };

  const getSignatureStatusBadge = (status?: string | null) => {
    if (!status) return null;
    
    if (status === 'signed') {
      return (
        <Badge className="bg-green-600 text-white flex items-center gap-1">
          <Check className="h-3 w-3" />
          Firmado
        </Badge>
      );
    }
    if (status === 'pending') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pendiente de Firma
        </Badge>
      );
    }
    if (status === 'declined') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <X className="h-3 w-3" />
          Rechazado
        </Badge>
      );
    }
    return null;
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleOpenPrint = (orderId: string) => {
    setOrderToPrint(orderId);
  };

  const handleSendToSign = async (orderId: string) => {
    try {
      toast.info("Generando link de firma...");
      const { data, error } = await supabase.functions.invoke("send-to-sign", {
        body: { orderId },
      });

      if (error) throw error;

      toast.success("Link de firma generado correctamente");
      await fetchOrders();
    } catch (error) {
      console.error("Error sending to sign:", error);
      toast.error("Error al generar link de firma");
    }
  };

  const handleOpenStatusDialog = (order: Order) => {
    setSelectedOrderForStatus(order);
    setStatusDialogOpen(true);
  };

  const handleOpenLinkDialog = (order: Order) => {
    setSelectedOrderForLink(order);
    setLinkDialogOpen(true);
  };

  const handleOpenDeleteDialog = (order: Order) => {
    setSelectedOrderForDelete(order);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay órdenes registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {/* Header with client name, custom_id and actions dropdown */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {order.custom_id && (
                        <span className="text-sm font-normal text-muted-foreground">
                          #{order.custom_id}
                        </span>
                      )}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {/* Tarjeta Estado de Pago */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                        <div className="flex items-center gap-1.5">
                          {order.estatus_pago === "liquidado" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">Pago</p>
                            <p className="text-sm font-medium">
                              {order.estatus_pago === "liquidado" ? "Liquidado" : "Anticipo"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tarjeta Estado de Producción */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                        <div className="flex items-center gap-1.5">
                          {order.estatus_piedra === "piedra_montada" && order.estatus_montura === "entregado_levant" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">Producción</p>
                            <p className="text-sm font-medium">
                              {order.estatus_piedra === "piedra_montada" && order.estatus_montura === "entregado_levant" 
                                ? "Completada" 
                                : "En Proceso"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tarjeta Estado de Firma */}
                      {order.signature_status && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                          <div className="flex items-center gap-1.5">
                            {order.signature_status === "signed" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : order.signature_status === "declined" ? (
                              <X className="h-4 w-4 text-red-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-xs text-muted-foreground">Firma</p>
                              <p className="text-sm font-medium">
                                {order.signature_status === "signed" ? "Firmado" :
                                 order.signature_status === "declined" ? "Rechazado" :
                                 order.signature_status === "awaiting_signature" ? "Pendiente" : "Sin enviar"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {(order.stl_file || order.internal_order_id) && (
                      <div className="flex items-center gap-2">
                        {order.stl_file && (
                          <a
                            href={`/stl-viewer-fullscreen?url=${encodeURIComponent(order.stl_file.stl_file_url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Badge 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
                            >
                              <Box className="h-3 w-3" />
                              Ver STL
                            </Badge>
                          </a>
                        )}
                        {order.internal_order_id && (
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInternalOrderId(order.internal_order_id!);
                              setSupplierPreviewOpen(true);
                            }}
                          >
                            <Package className="h-3 w-3" />
                            Ver Orden de Proveedor
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Acciones
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleEdit(order)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenPrint(order.id)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Generar PDF
                        </DropdownMenuItem>
                        {order.signature_status !== 'signed' && (
                          <DropdownMenuItem onClick={() => handleSendToSign(order.id)}>
                            <FileSignature className="h-4 w-4 mr-2" />
                            {order.signature_status === 'pending' ? 'Reenviar a Firmar' : 'Enviar a Firmar'}
                          </DropdownMenuItem>
                        )}
                        {order.signature_status === 'signed' && order.signed_document_url && (
                          <DropdownMenuItem onClick={() => window.open(order.signed_document_url!, '_blank')}>
                            <FileSignature className="h-4 w-4 mr-2" />
                            Ver Documento Firmado
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleOpenStatusDialog(order)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Modificar Estatus
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenLinkDialog(order)}>
                          <Link className="h-4 w-4 mr-2" />
                          Vincular a Orden de Proveedor
                        </DropdownMenuItem>
                        {isAdmin() && (
                          <DropdownMenuItem 
                            onClick={() => handleOpenDeleteDialog(order)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Orden
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Product Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Metal:</span>
                    <span className="text-muted-foreground ml-2">
                      {order.metal_tipo === "oro" && `Oro ${order.metal_pureza} ${order.metal_color ? order.metal_color.charAt(0).toUpperCase() + order.metal_color.slice(1).toLowerCase() : ''}`}
                      {order.metal_tipo === "plata" && "Plata"}
                      {order.metal_tipo === "platino" && "Platino"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Piedra:</span>
                    <span className="text-muted-foreground ml-2">
                      {order.piedra_tipo === "diamante" &&
                        `Diamante ${order.diamante_quilataje}ct ${order.diamante_forma ? order.diamante_forma.charAt(0).toUpperCase() + order.diamante_forma.slice(1).toLowerCase() : ''}`}
                      {order.piedra_tipo === "gema" && "Gema"}
                    </span>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Precio Total</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${Number(order.precio_venta).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Anticipo</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${Number(order.importe_anticipo).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                    <p className="text-lg font-semibold text-warning">
                      $
                      {(Number(order.precio_venta) - Number(order.importe_anticipo)).toLocaleString(
                        "es-MX"
                      )}
                    </p>
                  </div>
                </div>

                {/* Payment Method and Reference */}
                <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-2">
                  <div>
                    <span className="font-medium text-foreground">Forma de Pago:</span>
                    <span className="ml-2 capitalize">{order.forma_pago}</span>
                  </div>
                  {order.referencia_pago && (
                    <div>
                      <span className="font-medium text-foreground">Referencia:</span>
                      <span className="ml-2">{order.referencia_pago}</span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Creada el {format(new Date(order.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                  </span>
                  {order.fecha_entrega_esperada && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-foreground font-medium">
                        Entrega: {format(new Date(order.fecha_entrega_esperada), "dd 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      {selectedOrder && (
        <OrderDialog
          open={!!selectedOrder}
          onOpenChange={(open) => {
            if (!open) setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSuccess={() => {
            fetchOrders();
            setSelectedOrder(null);
          }}
        />
      )}

      {orderToPrint && (
        <OrderPrintDialog
          orderId={orderToPrint}
          open={!!orderToPrint}
          onOpenChange={(open) => {
            if (!open) {
              setOrderToPrint(null);
              fetchOrders();
            }
          }}
        />
      )}

      {/* Status Dialog */}
      {selectedOrderForStatus && (
        <OrderStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          orderId={selectedOrderForStatus.id}
          currentPiedraStatus={selectedOrderForStatus.estatus_piedra || "en_busqueda"}
          currentMonturaStatus={selectedOrderForStatus.estatus_montura || "en_espera"}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}

      {/* Link Supplier Order Dialog */}
      {selectedOrderForLink && (
        <LinkSupplierOrderDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          orderId={selectedOrderForLink.id}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}

      {/* Delete Order Dialog */}
      {selectedOrderForDelete && (
        <DeleteOrderDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          order={selectedOrderForDelete}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}

      {/* Supplier Order Preview Dialog */}
      {selectedInternalOrderId && (
        <SupplierOrderPreviewDialog
          open={supplierPreviewOpen}
          onOpenChange={setSupplierPreviewOpen}
          internalOrderId={selectedInternalOrderId}
        />
      )}
    </>
  );
};
