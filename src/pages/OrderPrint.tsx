import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import OrderPrintView from "@/components/orders/OrderPrintView";
import { Loader2 } from "lucide-react";

const OrderPrint = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch order data
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            clients (
              nombre,
              apellido,
              telefono_principal,
              email
            ),
            stl_files (
              id,
              nombre,
              stl_file_url
            )
          `)
          .eq("id", orderId)
          .maybeSingle();

        if (orderError) {
          console.error("Error fetching order:", orderError);
          throw orderError;
        }
        if (!orderData) {
          console.error("No order found with ID:", orderId);
          throw new Error("Orden no encontrada");
        }

        console.log("Order loaded successfully:", orderData);
        setOrder(orderData);

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
        setError(err instanceof Error ? err.message : "Error al cargar la orden");
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
  }, [orderId]);

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
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    );
  }

  if (!order || !companyInfo) {
    return null;
  }

  return <OrderPrintView order={order} companyInfo={companyInfo} />;
};

export default OrderPrint;
