import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Download, 
  Calendar,
  Bell,
  Gem,
  ShoppingCart,
  FileText,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { ClientTimeline } from "@/components/client-detail/ClientTimeline";
import { AppointmentsHistory } from "@/components/client-detail/AppointmentsHistory";
import { ProspectsHistory } from "@/components/client-detail/ProspectsHistory";
import { RemindersHistory } from "@/components/client-detail/RemindersHistory";
import { OrdersHistory } from "@/components/client-detail/OrdersHistory";

interface Client {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono_principal: string;
  telefono_adicional?: string;
  fuente_contacto?: string;
  documento_id_url?: string;
  created_at: string;
}

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingINE, setDownloadingINE] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Error al cargar la información del cliente");
      navigate("/crm");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadINE = async () => {
    if (!client?.documento_id_url) return;

    setDownloadingINE(true);
    try {
      // Extract file path from URL
      const urlParts = client.documento_id_url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      const { data, error } = await supabase.storage
        .from("ine-documents")
        .download(fileName);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INE_${client.nombre}_${client.apellido}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("INE descargada exitosamente");
    } catch (error) {
      console.error("Error downloading INE:", error);
      toast.error("Error al descargar el documento INE");
    } finally {
      setDownloadingINE(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/crm")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a CRM
          </Button>

          {client.documento_id_url && (
            <Button
              onClick={handleDownloadINE}
              disabled={downloadingINE}
              variant="outline"
            >
              {downloadingINE ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar INE
            </Button>
          )}
        </div>

        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">
                  {client.nombre} {client.apellido}
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Cliente desde {formatDate(client.created_at)}
                </p>
              </div>
              {client.documento_id_url && (
                <Badge variant="secondary" className="mt-1">
                  <FileText className="h-3 w-3 mr-1" />
                  INE Registrada
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.telefono_principal}</span>
                </div>
                {client.telefono_adicional && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.telefono_adicional}</span>
                  </div>
                )}
              </div>
              {client.fuente_contacto && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fuente de Contacto</p>
                  <p className="text-sm font-medium">{client.fuente_contacto}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs with History */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Citas
            </TabsTrigger>
            <TabsTrigger value="prospects" className="flex items-center gap-2">
              <Gem className="h-4 w-4" />
              Wish Lists
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recordatorios
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Órdenes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <ClientTimeline clientId={client.id} />
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <AppointmentsHistory clientId={client.id} />
          </TabsContent>

          <TabsContent value="prospects" className="mt-6">
            <ProspectsHistory clientId={client.id} />
          </TabsContent>

          <TabsContent value="reminders" className="mt-6">
            <RemindersHistory clientId={client.id} />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrdersHistory clientId={client.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDetail;
