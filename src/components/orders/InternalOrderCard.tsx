import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InternalOrder, Supplier } from "@/types/internal-orders";
import { Package, FileText, Image as ImageIcon, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InternalOrderCardProps {
  order: InternalOrder;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isAdmin?: boolean;
}

export const InternalOrderCard = ({
  order,
  onEdit,
  onDelete,
  showActions = true,
  isAdmin = false,
}: InternalOrderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-500';
      case 'en_transito':
        return 'bg-blue-500';
      case 'recibido':
        return 'bg-green-500';
      case 'cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-500';
      case 'anticipo':
        return 'bg-orange-500';
      case 'pagado':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      pendiente: 'Pendiente',
      en_transito: 'En Tránsito',
      recibido: 'Recibido',
      cancelado: 'Cancelado',
    };
    return statuses[status] || status;
  };

  const formatProductType = (type: string) => {
    const types: Record<string, string> = {
      diamante: 'Diamante',
      gema: 'Gema',
      anillo: 'Anillo',
      collar: 'Collar',
      arete: 'Arete',
      dije: 'Dije',
      cadena: 'Cadena',
      componente: 'Componente',
      otro: 'Otro',
    };
    return types[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Orden Interna #{order.id.slice(0, 8)}
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={getStatusColor(order.estatus)}>
                {formatStatus(order.estatus)}
              </Badge>
              <Badge className={getPaymentStatusColor(order.estatus_pago)} variant="outline">
                {order.estatus_pago}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Proveedor</h4>
            <p className="text-sm">{order.supplier?.nombre_empresa || order.proveedor_nombre}</p>
            {(order.supplier?.nombre_contacto || order.proveedor_contacto) && (
              <p className="text-sm text-muted-foreground">
                {order.supplier?.nombre_contacto || order.proveedor_contacto}
              </p>
            )}
            <p className="text-sm">
              <span className="font-medium">Factura:</span> {order.numero_factura}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Producto</h4>
            <p className="text-sm">
              <span className="font-medium">Tipo:</span> {formatProductType(order.tipo_producto)}
            </p>
            <p className="text-sm">
              <span className="font-medium">Cantidad:</span> {order.cantidad}
            </p>
            {order.descripcion && (
              <p className="text-sm text-muted-foreground">{order.descripcion}</p>
            )}
          </div>
        </div>

        {order.tipo_producto === 'diamante' && order.quilataje && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-semibold text-sm">Especificaciones del Diamante</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <p><span className="font-medium">Quilataje:</span> {order.quilataje}ct</p>
              <p><span className="font-medium">Color:</span> {order.color}</p>
              <p><span className="font-medium">Claridad:</span> {order.claridad}</p>
              <p><span className="font-medium">Corte:</span> {order.corte}</p>
              <p><span className="font-medium">Forma:</span> {order.forma}</p>
              <p><span className="font-medium">Certificado:</span> {order.certificado}</p>
            </div>
            {order.numero_reporte && (
              <p className="text-sm">
                <span className="font-medium">Número de reporte:</span> {order.numero_reporte}
              </p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Financiero</h4>
            <p className="text-lg font-semibold text-primary">
              ${order.precio_compra.toLocaleString('es-MX')} {order.moneda}
            </p>
            <p className="text-sm">
              <span className="font-medium">Estatus:</span> {order.estatus_pago}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Fechas</h4>
            <p className="text-sm">
              <span className="font-medium">Compra:</span>{" "}
              {format(new Date(order.fecha_compra), "PP", { locale: es })}
            </p>
            {order.fecha_entrega_esperada && (
              <p className="text-sm">
                <span className="font-medium">Entrega esperada:</span>{" "}
                {format(new Date(order.fecha_entrega_esperada), "PP", { locale: es })}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <h4 className="font-semibold text-sm">Archivos</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(order.factura_pdf_url, '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Descargar Factura
            </Button>
            {order.imagenes_producto.length > 0 && (
              <Button variant="outline" size="sm">
                <ImageIcon className="h-4 w-4 mr-2" />
                Ver Galería ({order.imagenes_producto.length} imágenes)
              </Button>
            )}
          </div>
        </div>

        {order.notas_adicionales && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-semibold text-sm">Notas</h4>
            <p className="text-sm text-muted-foreground">{order.notas_adicionales}</p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 border-t pt-4">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {isAdmin && onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
