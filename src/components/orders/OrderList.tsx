import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, Eye, ChevronDown, FileText, FileSignature, Check, Clock, X, Box, DollarSign, Settings, Link, Trash2, Package, Gem, Wrench } from "lucide-react";
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
import { DeleteOrderDialog } from "./DeleteOrderDialog";
import { SupplierOrderPreviewDialog } from "./SupplierOrderPreviewDialog";
import { useUserRole } from "@/hooks/useUserRole";

interface OrderListProps {
  orders: Order[];
  loading: boolean;
  onEdit: (order: Order) => void;
  onRefresh: () => void;
  onOpenPrint: (orderId: string) => void;
  onSendToSign: (orderId: string) => void;
}

const OrderList = ({ orders, loading, onEdit, onOpenPrint, onSendToSign }: OrderListProps) => {
  const { isAdmin } = useUserRole();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierPreviewOpen, setSupplierPreviewOpen] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<Order | null>(null);
  const [selectedOrderForLink, setSelectedOrderForLink] = useState<Order | null>(null);
  const [selectedOrderForDelete, setSelectedOrderForDelete] = useState<Order | null>(null);
  const [selectedInternalOrderId, setSelectedInternalOrderId] = useState<string | null>(null);
  
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

  const handleOpenDeleteDialog = (order: Order) => {
    setSelectedOrderForDelete(order);
    setDeleteDialogOpen(true);
  };

  const capitalizeFirst = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const STONE_STATUS_LABELS: Record<string, string> = {
    en_busqueda: "En búsqueda",
    piedra_comprada: "Comprada",
    piedra_transito_pobox: "Tránsito PO Box",
    piedra_pobox: "En PO Box",
    piedra_levant: "En Levant",
    piedra_con_disenador: "Con diseñador",
    piedra_taller: "En taller",
    piedra_montada: "Montada",
  };

  const MOUNTING_STATUS_LABELS: Record<string, string> = {
    en_espera: "En espera",
    en_proceso_diseno: "En diseño",
    impresion_modelo: "Impresión",
    reimpresion_modelo: "Reimpresión",
    traslado_modelo: "Traslado",
    en_espera_taller: "Espera taller",
    en_proceso_vaciado: "Vaciado",
    pieza_terminada_taller: "Terminada taller",
    en_proceso_recoleccion: "Recolección",
    recolectado: "Recolectado",
    entregado_oyamel: "En Oyamel",
    entregado_levant: "En Levant",
    no_aplica: "No aplica",
  };

  const getStoneStatusLabel = (status: string | null) => {
    return status ? STONE_STATUS_LABELS[status] || status : "Sin definir";
  };

  const getMountingStatusLabel = (status: string | null) => {
    return status ? MOUNTING_STATUS_LABELS[status] || status : "Sin definir";
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
                <CardTitle className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {order.clients?.nombre} {order.clients?.apellido}
                  {order.custom_id && (
                    <span className="text-sm font-normal text-muted-foreground">
                      #{order.custom_id}
                    </span>
                  )}
                </CardTitle>
                
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

                  {/* Tarjeta Estatus de Piedra */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                    <div className="flex items-center gap-1.5">
                      {order.estatus_piedra === "piedra_montada" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Gem className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Piedra</p>
                        <p className="text-sm font-medium">
                          {getStoneStatusLabel(order.estatus_piedra)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta Estatus de Montura */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                    <div className="flex items-center gap-1.5">
                      {order.estatus_montura === "entregado_levant" || order.estatus_montura === "entregado_oyamel" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Montura</p>
                        <p className="text-sm font-medium">
                          {getMountingStatusLabel(order.estatus_montura)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {order.stl_file && (
                  <div className="flex items-center gap-2">
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
                <DropdownMenuContent align="end" className="w-56">
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
                  {order.internal_order_id ? (
                    <DropdownMenuItem onClick={() => {
                      setSelectedInternalOrderId(order.internal_order_id!);
                      setSupplierPreviewOpen(true);
                    }}>
                      <Package className="h-4 w-4 mr-2" />
                      Ver Orden de Proveedor
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleOpenLinkDialog(order)}>
                      <Link className="h-4 w-4 mr-2" />
                      Vincular a Orden de Proveedor
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => {
                    const detailUrl = `/crm/${order.client_id}`;
                    window.open(detailUrl, '_blank');
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
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
                    <span>{order.referencia_pago}</span>
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

    {/* Delete Order Dialog */}
    {selectedOrderForDelete && (
      <DeleteOrderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        order={selectedOrderForDelete}
        onSuccess={() => {
          // Refresh will be handled by parent component
          window.location.reload();
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

export default OrderList;
