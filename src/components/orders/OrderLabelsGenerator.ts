import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

interface Order {
  id: string;
  custom_id?: string | null;
  tipo_accesorio?: string | null;
  metal_tipo: string;
  metal_pureza?: string | null;
  metal_color?: string | null;
  piedra_tipo: string;
  diamante_quilataje?: number | null;
  diamante_forma?: string | null;
  diamante_color?: string | null;
  diamante_claridad?: string | null;
  gema_observaciones?: string | null;
  clients?: {
    nombre: string;
    apellido: string;
  } | null;
  internal_order?: {
    numero_reporte?: string | null;
  } | null;
}

const capitalizeFirst = (text: string | undefined | null): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const generateBarcodeImage = (value: string): string => {
  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, value, {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: false,
      margin: 0
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    return '';
  }
};

const formatStone = (order: Order): string => {
  if (order.piedra_tipo === 'diamante') {
    const parts = [];
    if (order.diamante_quilataje) parts.push(`${order.diamante_quilataje}ct`);
    if (order.diamante_forma) parts.push(capitalizeFirst(order.diamante_forma));
    if (order.diamante_color) parts.push(order.diamante_color);
    if (order.diamante_claridad) parts.push(order.diamante_claridad);
    return parts.join(' ') || 'Diamante';
  } else if (order.piedra_tipo === 'gema') {
    return order.gema_observaciones || 'Gema';
  }
  return capitalizeFirst(order.piedra_tipo);
};

const formatMetal = (order: Order): string => {
  const parts = [capitalizeFirst(order.metal_tipo)];
  if (order.metal_pureza) parts.push(order.metal_pureza);
  if (order.metal_color) parts.push(capitalizeFirst(order.metal_color));
  return parts.join(' ');
};

export const generateOrderLabelsPDF = async (orders: Order[]): Promise<void> => {
  if (!orders || orders.length === 0) {
    throw new Error('No hay órdenes para generar etiquetas');
  }

  // Create PDF with 51mm x 25mm page size (landscape)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [51, 25]
  });

  orders.forEach((order, index) => {
    // Add new page for each order (except first)
    if (index > 0) {
      pdf.addPage([51, 25], 'landscape');
    }

    const margin = 2;
    let yPosition = margin + 3;
    const lineHeight = 3.5;

    // Set font
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');

    // Line 1: Client name
    const clientName = order.clients 
      ? `${order.clients.nombre} ${order.clients.apellido}`
      : 'Cliente no especificado';
    pdf.text(clientName, margin, yPosition);
    yPosition += lineHeight;

    // Line 2: Order ID
    const orderId = order.custom_id || order.id.slice(0, 8);
    pdf.text(orderId, margin, yPosition);
    yPosition += lineHeight;

    // Line 3: Accessory Type | Metal
    const accessoryType = capitalizeFirst(order.tipo_accesorio) || 'Sin especificar';
    const metalInfo = formatMetal(order);
    pdf.text(`${accessoryType} | ${metalInfo}`, margin, yPosition);
    yPosition += lineHeight;

    // Line 4: Stone info
    const stoneInfo = formatStone(order);
    pdf.text(stoneInfo, margin, yPosition);
    yPosition += lineHeight + 1;

    // Generate and add barcode
    const barcodeValue = order.custom_id || order.id;
    const barcodeImage = generateBarcodeImage(barcodeValue);
    
    if (barcodeImage) {
      const barcodeWidth = 35;
      const barcodeHeight = 6;
      const barcodeX = (51 - barcodeWidth) / 2; // Center horizontally
      pdf.addImage(barcodeImage, 'PNG', barcodeX, yPosition, barcodeWidth, barcodeHeight);
      yPosition += barcodeHeight + 1;
    }

    // Line 5: Report number (if exists)
    const reportNumber = order.internal_order?.numero_reporte;
    if (reportNumber) {
      pdf.setFontSize(6);
      pdf.text(`Reporte: ${reportNumber}`, margin, yPosition);
    }
  });

  // Generate filename with current date
  const today = new Date().toISOString().split('T')[0];
  const filename = `etiquetas-ordenes-${today}.pdf`;
  
  // Download PDF
  pdf.save(filename);
};
