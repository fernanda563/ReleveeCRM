import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, Eye, ChevronDown, FileText, FileSignature, Check, Clock, X, Box, DollarSign, Settings, Link } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Order } from "@/pages/Orders";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrderStatusDialog } from "./OrderStatusDialog";
import { LinkSupplierOrderDialog } from "./LinkSupplierOrderDialog";

interface OrderListProps {
  orders: Order[];
  loading: boolean;
  onEdit: (order: Order) => void;
  onRefresh: () => void;
  onOpenPrint: (orderId: string) => void;
  onSendToSign: (orderId: string) => void;
}

const OrderList = ({ orders, loading, onEdit, onOpenPrint, onSendToSign }: OrderListProps) => {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<Order | null>(null);
  const [selectedOrderForLink, setSelectedOrderForLink] = useState<Order | null>(null);
  
  const handleGeneratePDF = (order: Order) => {
    onOpenPrint(order.id);
  };

  const handleOpenStatusDialog = (order: Order) => {
    setSelectedOrderForStatus(order);
    setStatusDialogOpen(true);
  };

  const handleOpenLinkDialog = (order: Order) => {
    setSelectedOrderForLink(order);
    setLinkDialogOpen(true);
  };

  const capitalizeFirst = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
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
          <p className="text-muted-foreground">No se encontraron órdenes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle>
                    {order.clients?.nombre} {order.clients?.apellido}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getPaymentStatusBadge(order.estatus_pago)}
                    {getProductionStatus(order)}
                    {getSignatureStatusBadge(order.signature_status)}
                  </div>
                </div>
                {order.custom_id && (
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <span className="font-medium text-muted-foreground">
                      {order.custom_id}
                    </span>
                    {order.stl_file && (
                      <>
                        <span className="text-muted-foreground">•</span>
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
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Acciones
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(order)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGeneratePDF(order)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generar PDF
                  </DropdownMenuItem>
                  {order.signature_status !== 'signed' && (
                    <DropdownMenuItem onClick={() => onSendToSign(order.id)}>
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
                  <DropdownMenuItem onClick={() => {
                    const detailUrl = `/crm/${order.client_id}`;
                    window.open(detailUrl, '_blank');
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Product Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Metal</h4>
                <p className="text-sm">
                  {order.metal_tipo === "oro" && `Oro ${order.metal_pureza} ${capitalizeFirst(order.metal_color || '')}`}
                  {order.metal_tipo === "plata" && "Plata"}
                  {order.metal_tipo === "platino" && "Platino"}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Piedra</h4>
                <p className="text-sm">
                  {order.piedra_tipo === "diamante" &&
                    `Diamante ${order.diamante_quilataje}ct ${capitalizeFirst(order.diamante_forma || '')}`}
                  {order.piedra_tipo === "gema" && "Gema"}
                </p>
              </div>
            </div>

            {/* Financial Info */}
            <div className="grid md:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Precio Total</h4>
                <p className="text-lg font-semibold text-primary">
                  ${Number(order.precio_venta).toLocaleString("es-MX")}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Anticipo</h4>
                <p className="text-lg font-semibold">
                  ${Number(order.importe_anticipo).toLocaleString("es-MX")}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Saldo Pendiente</h4>
                <p className="text-lg font-semibold text-warning">
                  $
                  {(Number(order.precio_venta) - Number(order.importe_anticipo)).toLocaleString(
                    "es-MX"
                  )}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Forma de Pago</h4>
                <p className="text-sm capitalize">{order.forma_pago}</p>
                {order.referencia_pago && (
                  <p className="text-sm">
                    <span className="font-medium">Referencia:</span>{" "}
                    <span className="font-mono">{order.referencia_pago}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Fechas</h4>
                <p className="text-sm">
                  <span className="font-medium">Creada:</span>{" "}
                  {format(new Date(order.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                </p>
                {order.fecha_entrega_esperada && (
                  <p className="text-sm">
                    <span className="font-medium">Entrega esperada:</span>{" "}
                    {format(new Date(order.fecha_entrega_esperada), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Status Dialog */}
    {selectedOrderForStatus && (
      <OrderStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        orderId={selectedOrderForStatus.id}
        currentPiedraStatus={selectedOrderForStatus.estatus_piedra}
        currentMonturaStatus={selectedOrderForStatus.estatus_montura}
        onSuccess={() => {
          // Refresh will be handled by parent component
          window.location.reload();
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
          // Refresh will be handled by parent component
          window.location.reload();
        }}
      />
    )}
    </>
  );
};

export default OrderList;
