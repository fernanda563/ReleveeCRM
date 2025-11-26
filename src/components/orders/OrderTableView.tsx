import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order } from "@/pages/Orders";

interface OrderTableViewProps {
  orders: Order[];
  onOrderClick?: (order: Order) => void;
}

const capitalizeFirst = (text: string | undefined) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const OrderTableView = ({ orders, onOrderClick }: OrderTableViewProps) => {
  const formatStone = (order: Order) => {
    if (order.piedra_tipo === "diamante") {
      const parts = [];
      if (order.diamante_quilataje) parts.push(`${order.diamante_quilataje}ct`);
      if (order.diamante_forma) parts.push(capitalizeFirst(order.diamante_forma));
      if (order.diamante_color) parts.push(order.diamante_color.toUpperCase());
      if (order.diamante_claridad) parts.push(order.diamante_claridad.toUpperCase());
      return parts.join(" ");
    } else if (order.piedra_tipo === "gema") {
      return `Gema ${order.gema_observaciones ? `(${order.gema_observaciones})` : ""}`;
    }
    return capitalizeFirst(order.piedra_tipo);
  };

  const formatMetal = (order: Order) => {
    const parts = [capitalizeFirst(order.metal_tipo)];
    if (order.metal_pureza) parts.push(order.metal_pureza);
    if (order.metal_color) parts.push(capitalizeFirst(order.metal_color));
    return parts.join(" ");
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>ID Orden</TableHead>
            <TableHead>Tipo de Accesorio</TableHead>
            <TableHead>Metal</TableHead>
            <TableHead>Piedra</TableHead>
            <TableHead>No. Reporte</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onOrderClick?.(order)}
            >
              <TableCell className="font-medium">
                {order.clients?.nombre} {order.clients?.apellido}
              </TableCell>
              <TableCell>
                {order.custom_id || order.id.slice(0, 8)}
              </TableCell>
              <TableCell>{capitalizeFirst(order.tipo_accesorio)}</TableCell>
              <TableCell>{formatMetal(order)}</TableCell>
              <TableCell>{formatStone(order)}</TableCell>
              <TableCell>
                {order.internal_order?.numero_reporte || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
