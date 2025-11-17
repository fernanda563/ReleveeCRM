import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import OrderPrintView from "@/components/orders/OrderPrintView";
import { Loader2, Printer, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface OrderPrintDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoSendToSign?: boolean;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitForSession = async (timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      resolve(false);
    }, timeout);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && session)) {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        if (session) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        resolve(true);
      }
    });
  });
};

export const OrderPrintDialog = ({ orderId, open, onOpenChange, autoSendToSign = false }: OrderPrintDialogProps) => {
  const [order, setOrder] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingToSign, setSendingToSign] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const ensureImagesLoaded = async (container: HTMLElement, timeoutMs = 6000) => {
    const imgs = Array.from(container.querySelectorAll("img"));
    if (imgs.length === 0) return;
    await Promise.race([
      Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if ((img as HTMLImageElement).complete) return resolve();
              const onLoad = () => { cleanup(); resolve(); };
              const onError = () => { cleanup(); resolve(); };
              const cleanup = () => {
                img.removeEventListener("load", onLoad);
                img.removeEventListener("error", onError);
              };
              img.addEventListener("load", onLoad);
              img.addEventListener("error", onError);
            })
        )
      ),
      new Promise<void>((res) => setTimeout(res, timeoutMs)),
    ]);
  };

  const generateAndUploadPDF = async (): Promise<string | null> => {
    if (!printRef.current || !order) return null;
    
    try {
      // Esperar a que todas las imágenes carguen
      await ensureImagesLoaded(printRef.current);
      
      // Generar canvas del documento
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Convertir a PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      
      // Convertir PDF a Blob
      const pdfBlob = pdf.output('blob');
      
      // Generar nombre de archivo único
      const timestamp = Date.now();
      const fileName = order.custom_id 
        ? `${order.custom_id}_${timestamp}.pdf`
        : `${order.id.slice(0, 8)}_${timestamp}.pdf`;
      
      const filePath = `pending-signatures/${fileName}`;
      
      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error generating and uploading PDF:", error);
      throw error;
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !order) return;

    try {
      toast.info("Generando PDF...");

      await ensureImagesLoaded(printRef.current);

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: printRef.current.scrollWidth,
        windowHeight: printRef.current.scrollHeight,
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      
      const fileName = order.custom_id 
        ? `Orden_${order.custom_id}.pdf`
        : `Orden_${order.id.slice(0, 8)}.pdf`;
      
      pdf.save(fileName);
      toast.success("PDF descargado exitosamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  const handleSendToSign = async () => {
    if (!orderId) return;

    try {
      setSendingToSign(true);
      toast.info("Generando documento PDF...");

      // Generar y subir PDF a Storage
      const pdfUrl = await generateAndUploadPDF();
      
      if (!pdfUrl) {
        throw new Error("No se pudo generar el PDF");
      }

      console.log("PDF generado y subido:", pdfUrl);
      
      // Guardar URL del PDF en la orden
      await supabase
        .from('orders')
        .update({ pending_signature_pdf_url: pdfUrl })
        .eq('id', orderId);

      toast.info("Enviando documento a Dropbox Sign...");

      // Enviar URL del PDF a Dropbox Sign
      const { data, error } = await supabase.functions.invoke('send-to-sign', {
        body: { 
          orderId,
          pdfUrl
        }
      });

      if (error) throw error;

      toast.success("Documento enviado exitosamente a Dropbox Sign");
      
      // Refresh order data para obtener nuevo signature_status
      const { data: updatedOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      
      if (updatedOrder) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("nombre, apellido, telefono_principal, email")
          .eq("id", updatedOrder.client_id)
          .single();
        
        setOrder({ ...updatedOrder, clients: clientData });
      }
    } catch (error: any) {
      console.error("Error sending to sign:", error);
      toast.error(error.message || "Error al enviar documento a firma");
    } finally {
      setSendingToSign(false);
    }
  };

  useEffect(() => {
    if (!open || !orderId) {
      setOrder(null);
      setCompanyInfo(null);
      setError(null);
      setLoading(true);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await waitForSession();

        const fetchOrder = async () => {
          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .maybeSingle();
          
          if (error) throw new Error(`Error al cargar orden: ${error.message}`);
          return data;
        };

        let orderBase = null as any;
        for (let attempt = 1; attempt <= 3; attempt++) {
          orderBase = await fetchOrder();
          if (orderBase) break;
          await sleep(250 * attempt);
        }

        if (!orderBase) {
          throw new Error("No tienes permisos para ver esta orden o no existe");
        }

        let clientInfo = null;
        try {
          const { data: clientData } = await supabase
            .from("clients")
            .select("nombre, apellido, telefono_principal, email")
            .eq("id", orderBase.client_id)
            .maybeSingle();
          clientInfo = clientData;
        } catch (clientErr) {
          console.warn("Error fetching client info:", clientErr);
        }

        const combinedOrder = { ...orderBase, clients: clientInfo };
        setOrder(combinedOrder);

        // Obtener logo de la configuración del sistema
        let logoUrl = null;
        try {
          const { data: logoData } = await supabase
            .from("system_settings")
            .select("value")
            .eq("category", "company")
            .eq("key", "company_logo_url")
            .maybeSingle();
          
          if (logoData && logoData.value && typeof logoData.value === 'object' && 'value' in logoData.value) {
            logoUrl = logoData.value.value;
          }
        } catch (logoErr) {
          console.warn("Error fetching company logo:", logoErr);
        }

        const companyData = {
          name: "Levant Jewelry",
          logo_light_url: logoUrl,
          address: null,
          phone: null,
          email: null,
        };

        try {
          const { data: settings } = await supabase
            .from("system_settings")
            .select("key, value")
            .eq("category", "company");

          if (settings) {
            settings.forEach((setting) => {
              if (setting.key === "company_name" && setting.value) {
                companyData.name = setting.value as string;
              }
              if (setting.key === "company_logo_light_url" && setting.value) {
                companyData.logo_light_url = setting.value as string;
              }
              if (setting.key === "company_address" && setting.value) {
                companyData.address = setting.value as string;
              }
              if (setting.key === "company_phone" && setting.value) {
                companyData.phone = setting.value as string;
              }
              if (setting.key === "company_email" && setting.value) {
                companyData.email = setting.value as string;
              }
            });
          }
        } catch (settingsErr) {
          console.warn("Error fetching company settings:", settingsErr);
        }

        setCompanyInfo(companyData);
      } catch (err: any) {
        console.error("Error in fetchData:", err);
        setError(err.message || "Error al cargar la orden");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, open]);

  // Auto-send to sign when requested
  useEffect(() => {
    if (!open) return;
    if (autoSendToSign && order && !sendingToSign && !autoSentRef.current) {
      autoSentRef.current = true;
      handleSendToSign();
    }
  }, [open, autoSendToSign, order, sendingToSign]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white" style={{ backgroundColor: '#ffffff' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista de Impresión</span>
            <div className="flex gap-2">
              {!loading && !error && (
                <>
                  <Button onClick={handlePrint} size="sm" variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button onClick={handleDownloadPDF} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  {order && (!order.signature_status || order.signature_status === 'declined') && (
                    <Button 
                      onClick={handleSendToSign} 
                      size="sm"
                      disabled={sendingToSign}
                    >
                      {sendingToSign ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Enviar a firma
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive text-lg mb-4">{error}</p>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        )}

        {!loading && !error && order && companyInfo && (
          <div ref={printRef} style={{ backgroundColor: '#ffffff' }}>
            <OrderPrintView order={order} companyInfo={companyInfo} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
