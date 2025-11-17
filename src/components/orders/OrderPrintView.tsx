import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface OrderPrintViewProps {
  order: {
    id: string;
    custom_id: string | null;
    created_at: string;
    fecha_entrega_esperada: string | null;
    precio_venta: number;
    importe_anticipo: number;
    forma_pago: string;
    referencia_pago?: string | null;
    estatus_pago: string;
    metal_tipo: string;
    metal_pureza: string | null;
    metal_color: string | null;
    piedra_tipo: string;
    diamante_forma: string | null;
    diamante_quilataje: number | null;
    diamante_color: string | null;
    diamante_claridad: string | null;
    diamante_corte: string | null;
    tipo_accesorio: string | null;
    talla: number | null;
    estatus_piedra: string | null;
    estatus_montura: string | null;
    notas: string | null;
    imagenes_referencia?: string[] | null;
    clients: {
      nombre: string;
      apellido: string;
      telefono_principal: string;
      email: string;
    };
  };
  companyInfo: {
    name: string;
    logo_light_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
}

const OrderPrintView = ({ order, companyInfo }: OrderPrintViewProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getStringValue = (field: any): string => {
    if (typeof field === 'string') return field;
    if (field && typeof field === 'object' && 'value' in field) return field.value;
    return String(field || '');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const getPaymentStatusText = (status: any) => {
    const key = getStringValue(status);
    const statusMap: Record<string, string> = {
      anticipo_recibido: "Anticipo Recibido",
      liquidado: "Liquidado",
    };
    return statusMap[key] || key;
  };

  const getStoneStatusText = (status: any) => {
    const key = getStringValue(status);
    if (!key) return "—";
    const statusMap: Record<string, string> = {
      en_busqueda: "En Búsqueda",
      adquirida: "Adquirida",
      piedra_montada: "Piedra Montada",
    };
    return statusMap[key] || key;
  };

  const getMountingStatusText = (status: any) => {
    const key = getStringValue(status);
    if (!key) return "—";
    const statusMap: Record<string, string> = {
      en_espera: "En Espera",
      en_fundicion: "En Fundición",
      en_ensamble: "En Ensamble",
      entregado_levant: "Entregado",
    };
    return statusMap[key] || key;
  };

  // Pre-carga de imágenes de referencia desde almacenamiento
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const objectUrlsRef = useRef<string[]>([]);

  function getStoragePathFromUrl(publicUrl: string): string | null {
    try {
      const u = new URL(publicUrl);
      const parts = u.pathname.split("/");
      const bucketIndex = parts.indexOf("reference-images");
      if (bucketIndex !== -1) {
        return parts.slice(bucketIndex + 1).join("/");
      }
      return null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let canceled = false;
    const createdUrls: string[] = [];

    const run = async () => {
      try {
        if (!order.imagenes_referencia || !Array.isArray(order.imagenes_referencia) || order.imagenes_referencia.length === 0) {
          setResolvedImages({});
          return;
        }

        const entries = await Promise.all(
          order.imagenes_referencia.map(async (url) => {
            try {
              const path = getStoragePathFromUrl(url);
              if (!path) return [url, url] as const;
              const { data, error } = await supabase.storage.from("reference-images").download(path);
              if (error || !data) return [url, url] as const;
              const objUrl = URL.createObjectURL(data);
              createdUrls.push(objUrl);
              return [url, objUrl] as const;
            } catch {
              return [url, url] as const;
            }
          })
        );

        if (!canceled) {
          const map: Record<string, string> = {};
          entries.forEach(([orig, res]) => { map[orig] = res; });

          // Revocar urls anteriores
          objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
          objectUrlsRef.current = createdUrls;

          setResolvedImages(map);
        }
      } finally {
        // noop
      }
    };

    run();

    return () => {
      canceled = true;
      // Revocar urls creadas para evitar fugas de memoria
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [order.imagenes_referencia]);

  const saldoPendiente = order.precio_venta - order.importe_anticipo;

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <div className="print-container">
        <style>{`
          @page {
            size: letter;
            margin: 0.75in;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: #ffffff !important;
            }

            .no-print {
              display: none !important;
            }

            * {
              color: #000 !important;
            }

            body, html, .print-container {
              background-color: #ffffff !important;
            }

            img {
              filter: grayscale(100%);
            }
          }

          .print-container {
            font-family: 'Inter', 'system-ui', sans-serif;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 20px;
            color: #000;
            background-color: #ffffff !important;
          }

        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #000;
        }

          .company-logo {
            max-width: 200px;
            max-height: 120px;
            object-fit: contain;
            background-color: #ffffff;
          }

        .company-info {
          text-align: right;
          font-size: 9px;
          line-height: 1.4;
        }

        .print-title {
          text-align: center;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 24px;
          text-transform: uppercase;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .info-section {
          border: 1px solid #000;
          padding: 12px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
        }

        .info-row {
          display: flex;
          margin-bottom: 6px;
          font-size: 11px;
        }

        .info-label {
          font-weight: 600;
          min-width: 120px;
        }

        .info-value {
          flex: 1;
        }

        .full-section {
          border: 1px solid #000;
          padding: 12px;
          margin-bottom: 16px;
        }

        .table-section {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        .table-section td {
          border: 1px solid #000;
          padding: 8px;
          font-size: 11px;
        }

        .table-section td:first-child {
          font-weight: 600;
          width: 180px;
          background-color: #ffffff;
        }

        .financial-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        .financial-table tr {
          border-bottom: 1px solid #000;
        }

        .financial-table td {
          padding: 8px;
          font-size: 11px;
        }

        .financial-table td:first-child {
          font-weight: 600;
        }

        .financial-table td:last-child {
          text-align: right;
          font-weight: 700;
        }

        .financial-total {
          background-color: #ffffff;
          font-size: 12px !important;
        }

        .print-footer {
          margin-top: 48px;
          padding-top: 16px;
          border-top: 1px solid #000;
        }

        .signature-line {
          margin-top: 48px;
          border-top: 1px solid #000;
          width: 300px;
          text-align: center;
          padding-top: 8px;
          font-size: 10px;
        }

        .footer-text {
          font-size: 9px;
          color: #666;
          margin-top: 16px;
        }

        /* Grid para imágenes de referencia */
        .reference-images-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 12px;
        }

        /* Contenedor de cada imagen */
        .reference-image-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          background: #f9fafb;
          text-align: center;
        }

        /* Imagen de referencia */
        .reference-image {
          width: 100%;
          height: auto;
          max-height: 250px;
          object-fit: contain;
          border-radius: 4px;
          background: #fff;
        }

        /* Pie de foto */
        .image-caption {
          font-size: 10px;
          color: #6b7280;
          margin-top: 6px;
          font-weight: 500;
        }

        /* Estilos específicos para impresión */
        @media print {
          .reference-images-grid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .reference-image-container {
            border: 1px solid #d1d5db !important;
            background: #ffffff !important;
            page-break-inside: avoid;
          }
          
          .reference-image {
            max-height: 200px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .image-caption {
            color: #374151 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="print-header">
        <div>
          {companyInfo.logo_light_url && (
            <img
              src={companyInfo.logo_light_url}
              alt={getStringValue(companyInfo.name)}
              className="company-logo"
            />
          )}
        </div>
        <div className="company-info">
          <div style={{ fontSize: '12px', fontWeight: 700 }}>{getStringValue(companyInfo.name)}</div>
          {companyInfo.address && <div>{getStringValue(companyInfo.address)}</div>}
          {companyInfo.phone && <div>Tel: {getStringValue(companyInfo.phone)}</div>}
          {companyInfo.email && <div>Email: {getStringValue(companyInfo.email)}</div>}
        </div>
      </div>

      {/* Title */}
      <div className="print-title">Orden de Compra</div>

      {/* Client and Order Info Grid */}
      <div className="info-grid">
        <div className="info-section">
          <div className="section-title">Información del Cliente</div>
          <div className="info-row">
            <span className="info-label">Nombre:</span>
            <span className="info-value">
              {getStringValue(order.clients.nombre)} {getStringValue(order.clients.apellido)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Teléfono:</span>
            <span className="info-value">{getStringValue(order.clients.telefono_principal)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{getStringValue(order.clients.email)}</span>
          </div>
        </div>

        <div className="info-section">
          <div className="section-title">Información de la Orden</div>
          <div className="info-row">
            <span className="info-label">ID de Orden:</span>
            <span className="info-value">{getStringValue(order.custom_id) || order.id.slice(0, 8)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Fecha de Creación:</span>
            <span className="info-value">{formatDate(order.created_at)}</span>
          </div>
          {order.fecha_entrega_esperada && (
            <div className="info-row">
              <span className="info-label">Entrega Esperada:</span>
              <span className="info-value">{formatDate(order.fecha_entrega_esperada)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="full-section">
        <div className="section-title">Detalles del Producto</div>
        <table className="table-section">
          <tbody>
            {order.tipo_accesorio && (
              <tr>
                <td>Tipo de Accesorio</td>
                <td>{(() => { const v = getStringValue(order.tipo_accesorio); return v ? v.charAt(0).toUpperCase() + v.slice(1) : ""; })()}</td>
              </tr>
            )}
            {order.talla && (
              <tr>
                <td>Talla</td>
                <td>{order.talla}</td>
              </tr>
            )}
            <tr>
              <td>Metal</td>
              <td>
                {(() => { const t = getStringValue(order.metal_tipo); return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; })()}
                {order.metal_pureza && ` - ${getStringValue(order.metal_pureza)}`}
                {order.metal_color && ` - ${(() => { const c = getStringValue(order.metal_color); return c ? c.charAt(0).toUpperCase() + c.slice(1) : ""; })()}` }
              </td>
            </tr>
            <tr>
              <td>Piedra</td>
              <td>{(() => { const v = getStringValue(order.piedra_tipo); return v ? v.charAt(0).toUpperCase() + v.slice(1) : ""; })()}</td>
            </tr>
            {order.diamante_forma && (
              <tr>
                <td>Forma de la Piedra</td>
                <td>{(() => { const v = getStringValue(order.diamante_forma); return v ? v.charAt(0).toUpperCase() + v.slice(1) : ""; })()}</td>
              </tr>
            )}
            {order.diamante_quilataje && (
              <tr>
                <td>Quilataje</td>
                <td>{order.diamante_quilataje} ct</td>
              </tr>
            )}
            {order.diamante_color && (
              <tr>
                <td>Color</td>
                <td>{getStringValue(order.diamante_color)}</td>
              </tr>
            )}
            {order.diamante_claridad && (
              <tr>
                <td>Claridad</td>
                <td>{getStringValue(order.diamante_claridad)}</td>
              </tr>
            )}
            {order.diamante_corte && (
              <tr>
                <td>Corte</td>
                <td>{(() => { const v = getStringValue(order.diamante_corte); return v ? v.charAt(0).toUpperCase() + v.slice(1) : ""; })()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Information */}
      <div className="full-section">
        <div className="section-title">Detalles del Pago</div>
        <table className="financial-table">
          <tbody>
            <tr>
              <td>Precio Total</td>
              <td>{formatCurrency(order.precio_venta)}</td>
            </tr>
            <tr>
              <td>Anticipo Recibido</td>
              <td>{formatCurrency(order.importe_anticipo)}</td>
            </tr>
            <tr className="financial-total">
              <td>Saldo Pendiente</td>
              <td>{formatCurrency(saldoPendiente)}</td>
            </tr>
            <tr>
              <td>Forma de Pago</td>
              <td style={{ fontWeight: 400 }}>
                {(() => { 
                  const v = getStringValue(order.forma_pago); 
                  return v ? v.charAt(0).toUpperCase() + v.slice(1) : ""; 
                })()}
              </td>
            </tr>
            {order.referencia_pago && (
              <tr>
                <td>Referencia</td>
                <td style={{ fontWeight: 400, fontFamily: 'monospace' }}>{getStringValue(order.referencia_pago)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reference Images - Observaciones Adicionales */}
      {order.imagenes_referencia && Array.isArray(order.imagenes_referencia) && order.imagenes_referencia.length > 0 && (
        <div className="full-section">
          <div className="section-title">Observaciones Adicionales</div>
          <div className="reference-images-grid">
            {order.imagenes_referencia.map((imageUrl, index) => (
              <div key={index} className="reference-image-container">
                <img 
                  src={resolvedImages[imageUrl] ?? imageUrl}
                  alt={`Referencia ${index + 1}`}
                  className="reference-image"
                  referrerPolicy="no-referrer"
                />
                <div className="image-caption">Imagen de Referencia {index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notas && (
        <div className="full-section">
          <div className="section-title">Notas Adicionales</div>
          <div style={{ fontSize: '11px', marginTop: '8px', lineHeight: '1.5' }}>
            {getStringValue(order.notas)}
          </div>
        </div>
      )}

       {/* Footer */}
      <div className="print-footer">
        <div className="signature-line">
          Firma del Cliente
        </div>
        <div className="footer-text">
          <div>Documento generado el {formatDate(new Date().toISOString())}</div>
          <div style={{ marginTop: '4px' }}>
            Este documento es una representación oficial de la orden de compra.
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default OrderPrintView;
