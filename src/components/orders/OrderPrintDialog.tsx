import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import OrderPrintView from "@/components/orders/OrderPrintView";
import { Loader2, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReactToPrint } from "react-to-print";

interface OrderPrintDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const OrderPrintDialog = ({ orderId, open, onOpenChange }: OrderPrintDialogProps) => {
  const [order, setOrder] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

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

        const companyData = {
          name: "Levant Jewelry",
          logo_light_url: null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista de Impresión</span>
            <div className="flex gap-2">
              {!loading && !error && (
                <Button onClick={handlePrint} size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
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
          <div ref={printRef}>
            <OrderPrintView order={order} companyInfo={companyInfo} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
