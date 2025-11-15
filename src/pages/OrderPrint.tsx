import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import OrderPrintView from "@/components/orders/OrderPrintView";
import { Loader2 } from "lucide-react";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitForSession = async (timeout = 5000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log("Session ready:", session.user.id);
      return true;
    }
    await sleep(100);
  }
  console.warn("Session not ready after timeout");
  return false;
};

const OrderPrint = () => {
const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);


  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching order:", error);
        throw new Error(`Error al cargar orden: ${error.message}`);
      }
      
      return data;
    };

    const fetchData = async () => {
      try {
        // Wait for session to be ready
        await waitForSession();

        // Fetch order with retries
        let orderBase = null as any;
        for (let attempt = 1; attempt <= 3; attempt++) {
          orderBase = await fetchOrder();
          if (orderBase) break;
          console.log(`Attempt ${attempt} returned null, retrying...`);
          await sleep(250 * attempt);
        }


        if (!orderBase) {
          console.error("No order found with ID:", orderId);
          throw new Error("No tienes permisos para ver esta orden o no existe");
        }


        // Fetch client info separately
        let clientInfo = null;
        try {
          const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("nombre, apellido, telefono_principal, email")
            .eq("id", orderBase.client_id)
            .maybeSingle();
          if (clientError) {
            console.warn("Could not fetch client info:", clientError);
          } else {
            clientInfo = clientData;
          }
        } catch (clientErr) {
          console.warn("Error fetching client info:", clientErr);
        }

        const combinedOrder = { ...orderBase, clients: clientInfo };
        console.log("Order loaded successfully:", combinedOrder);
        setOrder(combinedOrder);

        // Fetch company settings (ignore errors if user doesn't have permissions)
        const companyData = {
          name: "Levant Jewelry",
          logo_light_url: null,
          address: null,
          phone: null,
          email: null,
        };

        try {
          const { data: settings, error: settingsError } = await supabase
            .from("system_settings")
            .select("key, value")
            .eq("category", "company");

          if (settingsError) {
            console.warn("Could not fetch company settings:", settingsError);
          } else if (settings) {
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
          console.warn("Error fetching company settings, using defaults:", settingsErr);
        }

        setCompanyInfo(companyData);
        setLoading(false);

        // Auto-trigger print dialog after content loads
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (err) {
        console.error("Error in fetchData:", err);
        const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar la orden";
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    } else {
      console.error("No orderId provided");
      setError("ID de orden no proporcionado");
      setLoading(false);
    }
  }, [orderId, retryCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setError(null); setLoading(true); setRetryCount((c) => c + 1); }}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    );
  }
  }

  if (!order || !companyInfo) {
    return null;
  }

  return <OrderPrintView order={order} companyInfo={companyInfo} />;
};

export default OrderPrint;
