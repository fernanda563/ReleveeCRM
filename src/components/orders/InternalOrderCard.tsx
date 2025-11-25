import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InternalOrder, Supplier } from "@/types/internal-orders";
import { Package, FileText, Image as ImageIcon, Edit, Trash2, ChevronDown, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [showGallery, setShowGallery] = useState(false);

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

  const capitalizeFirst = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const formatShape = (shape: string | undefined) => {
    if (!shape) return '';
    
    const shapes: Record<string, string> = {
      // English to Spanish translations
      'round': 'Redondo',
      'princess': 'Princesa',
      'emerald': 'Esmeralda',
      'asscher': 'Asscher',
      'marquise': 'Marquesa',
      'oval': 'Oval',
      'radiant': 'Radiante',
      'pear': 'Pera',
      'heart': 'Corazón',
      'cushion': 'Cojín',
      'baguette': 'Baguette',
      'trilliant': 'Trilliant',
      'rose': 'Rosa',
      // Spanish forms (normalize capitalization)
      'redondo': 'Redondo',
      'princesa': 'Princesa',
      'esmeralda': 'Esmeralda',
      'marquesa': 'Marquesa',
      'radiante': 'Radiante',
      'pera': 'Pera',
      'corazon': 'Corazón',
      'cojin': 'Cojín',
      'rosa': 'Rosa',
    };
    
    const normalized = shape.toLowerCase();
    return shapes[normalized] || capitalizeFirst(shape);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {order.supplier?.nombre_empresa || order.proveedor_nombre} #{order.numero_factura}
              </CardTitle>
              {order.batch_id && order.batch_count && (
                <Badge variant="secondary">
                  Lote de {order.batch_count} diamantes
                </Badge>
              )}
            </div>
          </div>
          
          {/* Actions Dropdown */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Acciones
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => window.open(order.factura_pdf_url, '_blank')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Descargar Factura
                </DropdownMenuItem>
                {order.imagenes_producto.length > 0 && (
                  <DropdownMenuItem onClick={() => setShowGallery(true)}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Ver Galería ({order.imagenes_producto.length})
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {isAdmin && onDelete && (
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
              <p><span className="font-medium">Forma:</span> {formatShape(order.forma)}</p>
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
              <span className="font-medium">Estatus:</span> {capitalizeFirst(order.estatus_pago)}
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

        {order.notas_adicionales && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-semibold text-sm">Notas</h4>
            <p className="text-sm text-muted-foreground">{order.notas_adicionales}</p>
          </div>
        )}
      </CardContent>

      {/* Image Gallery Dialog */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4">
            {order.imagenes_producto.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Producto ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
