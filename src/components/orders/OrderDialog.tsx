import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/pages/Orders";
import type { Client } from "@/pages/CRM";
import { useUserRole } from "@/hooks/useUserRole";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  onSuccess: () => void;
  onOpenClientDialog?: () => void;
}

interface Prospect {
  id: string;
  tipo_piedra: string | null;
  metal_tipo: string | null;
  color_oro: string | null;
  pureza_oro: string | null;
  incluye_piedra: string | null;
  observaciones: string | null;
  importe_previsto: number | null;
  estado: string;
  tipo_accesorio: string | null;
  subtipo_accesorio: string | null;
  estilo_anillo: string | null;
}

const OrderDialog = ({ open, onOpenChange, order, onSuccess, onOpenClientDialog }: OrderDialogProps) => {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientProspects, setClientProspects] = useState<Prospect[]>([]);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [step4Visited, setStep4Visited] = useState(false);
  const totalSteps = 4;

  // Financial data
  const [selectedClientId, setSelectedClientId] = useState("");
  const [tipoAccesorio, setTipoAccesorio] = useState("");
  const [talla, setTalla] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [importeAnticipo, setImporteAnticipo] = useState("");
  const [anticipoError, setAnticipoError] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [estatusPago, setEstatusPago] = useState("anticipo_recibido");
  const [paymentReceipts, setPaymentReceipts] = useState<File[]>([]);
  const [uploadedReceiptUrls, setUploadedReceiptUrls] = useState<string[]>([]);

  // Metal data
  const [metalTipo, setMetalTipo] = useState<"oro" | "plata" | "platino">("oro");
  const [metalPureza, setMetalPureza] = useState<string>("");
  const [metalColor, setMetalColor] = useState<string>("");

  // Stone data
  const [piedraTipo, setPiedraTipo] = useState<"diamante" | "gema">("diamante");
  
  // Diamond data
  const [diamanteColor, setDiamanteColor] = useState("");
  const [diamanteClaridad, setDiamanteClaridad] = useState("");
  const [diamanteCorte, setDiamanteCorte] = useState("");
  const [diamanteQuilataje, setDiamanteQuilataje] = useState("");
  const [diamanteForma, setDiamanteForma] = useState("");

  // Gem data
  const [gemaObservaciones, setGemaObservaciones] = useState("");

  // Notes
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      fetchClients();
      if (order) {
        setSelectedClientId(order.client_id);
        setPrecioVenta(formatCurrency(order.precio_venta.toString()));
        setImporteAnticipo(formatCurrency(order.importe_anticipo.toString()));
        setFormaPago(order.forma_pago);
        setEstatusPago(order.estatus_pago);
        setMetalTipo(order.metal_tipo as "oro" | "plata" | "platino");
        setMetalPureza(order.metal_pureza || "");
        setMetalColor(order.metal_color || "");
        setPiedraTipo(order.piedra_tipo as "diamante" | "gema");
        setDiamanteColor(order.diamante_color || "");
        setDiamanteClaridad(order.diamante_claridad || "");
        setDiamanteCorte(order.diamante_corte || "");
        setDiamanteForma(order.diamante_forma || "");
        setDiamanteQuilataje(order.diamante_quilataje?.toString() || "");
        setGemaObservaciones(order.gema_observaciones || "");
        setNotas(order.notas || "");
        setPaymentReceipts([]);
        setUploadedReceiptUrls([]);
        // NO cargar proyectos al editar una orden
        setClientProspects([]);
        setSelectedProspectId("");
      } else {
        resetForm();
      }
    }
  }, [open, order]);

  useEffect(() => {
    if (selectedClientId && !order) {
      fetchClientProspects(selectedClientId);
      setSelectedProspectId("");
    } else {
      setClientProspects([]);
      setSelectedProspectId("");
    }
  }, [selectedClientId, order]);

  useEffect(() => {
    if (currentStep === 4) {
      // Pequeño delay para prevenir clicks/enters accidentales
      setTimeout(() => setStep4Visited(true), 100);
    }
  }, [currentStep]);

  const resetForm = () => {
    setCurrentStep(1);
    setStep4Visited(false);
    setSelectedClientId("");
    setTipoAccesorio("");
    setTalla("");
    setPrecioVenta("");
    setImporteAnticipo("");
    setAnticipoError("");
    setFormaPago("");
    setEstatusPago("anticipo_recibido");
    setMetalTipo("oro");
    setMetalPureza("");
    setMetalColor("");
    setPiedraTipo("diamante");
    setDiamanteColor("");
    setDiamanteClaridad("");
    setDiamanteCorte("");
    setDiamanteQuilataje("");
    setDiamanteForma("");
    setGemaObservaciones("");
    setNotas("");
    setPaymentReceipts([]);
    setUploadedReceiptUrls([]);
    setClientProspects([]);
    setSelectedProspectId("");
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("nombre");
    if (data) setClients(data);
  };

  const fetchClientProspects = async (clientId: string) => {
    if (!clientId) {
      setClientProspects([]);
      return;
    }
    
    setIsLoadingProspects(true);
    try {
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .eq("client_id", clientId)
        .eq("estado", "activo")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientProspects(data || []);
    } catch (error) {
      console.error("Error al cargar proyectos:", error);
      setClientProspects([]);
    } finally {
      setIsLoadingProspects(false);
    }
  };

  const generateProspectTitle = (prospect: Prospect): string => {
    const parts: string[] = [];
    
    if (prospect.tipo_accesorio) {
      parts.push(prospect.tipo_accesorio.charAt(0).toUpperCase() + prospect.tipo_accesorio.slice(1));
    }
    
    if (prospect.subtipo_accesorio) {
      parts.push(prospect.subtipo_accesorio);
    }
    
    if (prospect.estilo_anillo) {
      const estiloFormatted = prospect.estilo_anillo
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      parts.push(`(${estiloFormatted})`);
    }
    
    return parts.length > 0 ? parts.join(' - ') : "Proyecto sin título";
  };

  const applyProspectData = (prospectId: string) => {
    const prospect = clientProspects.find(p => p.id === prospectId);
    if (!prospect) return;

    // Prellenar Metal (Paso 2)
    if (prospect.metal_tipo) {
      setMetalTipo(prospect.metal_tipo as "oro" | "plata" | "platino");
      
      if (prospect.metal_tipo === "oro") {
        if (prospect.color_oro) setMetalColor(prospect.color_oro);
        if (prospect.pureza_oro) setMetalPureza(prospect.pureza_oro);
      }
    }

    // Prellenar Piedra (Paso 3)
    if (prospect.tipo_piedra && prospect.incluye_piedra === "sí") {
      setPiedraTipo(prospect.tipo_piedra as "diamante" | "gema");
    }

    // Prellenar Precio de Venta (Paso 1) - como sugerencia
    if (prospect.importe_previsto) {
      setPrecioVenta(formatCurrency(prospect.importe_previsto.toString()));
    }

    // Prellenar Notas (Paso 4)
    if (prospect.observaciones) {
      setNotas(prospect.observaciones);
    }

    toast.success("Datos del proyecto aplicados al formulario");
  };

  const formatCurrency = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return formatCurrency(parts[0] + '.' + parts.slice(1).join(''));
    }
    
    // Format with commas
    if (numericValue === '') return '';
    
    const [integer, decimal] = numericValue.split('.');
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return decimal !== undefined 
      ? `$${formattedInteger}.${decimal}`
      : `$${formattedInteger}`;
  };

  const unformatCurrency = (value: string): string => {
    return value.replace(/[^\d.]/g, '');
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type === "application/pdf" || file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) {
        toast.error(`${file.name}: Solo se permiten imágenes y PDFs`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name}: El archivo no debe superar 10MB`);
        return false;
      }
      return true;
    });
    setPaymentReceipts(prev => [...prev, ...validFiles]);
  };

  const removeReceipt = (index: number) => {
    setPaymentReceipts(prev => prev.filter((_, i) => i !== index));
  };

  const uploadReceipts = async (orderId: string) => {
    const uploadedUrls: string[] = [];
    
    for (const file of paymentReceipts) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${orderId}/${fileName}`;

      const { error } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }
    
    return uploadedUrls;
  };

  const canGoNext = (): boolean => {
    if (currentStep === 1) {
      // Validar paso 1
      if (!selectedClientId) {
        toast.error("Selecciona un cliente");
        return false;
      }
      if (!tipoAccesorio) {
        toast.error("Selecciona el tipo de accesorio");
        return false;
      }
      // Talla solo es obligatoria para anillos
      if (tipoAccesorio === "anillo" && !talla) {
        toast.error("La talla es obligatoria para anillos");
        return false;
      }
      if (!precioVenta || !importeAnticipo || !formaPago) {
        toast.error("Completa todos los campos obligatorios");
        return false;
      }
      if (parseFloat(unformatCurrency(importeAnticipo)) > parseFloat(unformatCurrency(precioVenta))) {
        toast.error("El anticipo no puede ser mayor al precio de venta");
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      // Validar paso 2
      if (metalTipo === "oro" && (!metalPureza || !metalColor)) {
        toast.error("Completa la pureza y color del oro");
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      // Validar paso 3
      if (piedraTipo === "diamante") {
        if (!diamanteForma || !diamanteQuilataje) {
          toast.error("Completa el corte y quilataje del diamante");
          return false;
        }
        if (!diamanteColor || !diamanteClaridad || !diamanteCorte) {
          toast.error("Completa el color, claridad y calidad de corte del diamante");
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (canGoNext()) {
      const nextStep = Math.min(currentStep + 1, totalSteps);
      setCurrentStep(nextStep);
      
      // Resetear la bandera cuando avanzamos al último paso
      if (nextStep === totalSteps) {
        setStep4Visited(false);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleDelete = async () => {
    if (!order) return;

    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar esta orden?\n\n" +
      "Esta acción:\n" +
      "• Eliminará la orden permanentemente\n" +
      "• Eliminará todos los comprobantes de pago asociados\n" +
      "• Se registrará en el log de auditoría\n" +
      "• No se puede deshacer\n\n" +
      "¿Deseas continuar?"
    );

    if (!confirmDelete) return;

    setLoading(true);

    try {
      // 0. Get current user for audit log
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // 1. Create audit log entry BEFORE deleting
      const clientName = order.clients 
        ? `${order.clients.nombre} ${order.clients.apellido}`
        : "Cliente desconocido";

      const { error: auditError } = await supabase
        .from("order_deletion_logs")
        .insert({
          order_id: order.id,
          order_custom_id: order.custom_id || null,
          deleted_by: user.id,
          order_data: {
            ...order,
            // Include client data in snapshot
            client_info: order.clients
          },
          client_name: clientName
        });

      if (auditError) {
        console.error("Error al crear log de auditoría:", auditError);
        toast.error("Error al registrar auditoría. Eliminación cancelada.");
        setLoading(false);
        return;
      }

      // 2. Eliminar archivos de comprobantes de pago del Storage
      if (order.comprobantes_pago && Array.isArray(order.comprobantes_pago)) {
        for (const url of order.comprobantes_pago) {
          try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/');
            const bucketIndex = pathSegments.indexOf('payment-receipts');
            if (bucketIndex !== -1) {
              const filePath = pathSegments.slice(bucketIndex + 1).join('/');
              
              const { error: storageError } = await supabase.storage
                .from('payment-receipts')
                .remove([filePath]);

              if (storageError) {
                console.error("Error al eliminar archivo:", storageError);
              }
            }
          } catch (urlError) {
            console.error("Error al procesar URL de comprobante:", urlError);
          }
        }
      }

      // 3. Intentar eliminar carpeta completa del order_id en storage
      try {
        const { data: files } = await supabase.storage
          .from('payment-receipts')
          .list(order.id);

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${order.id}/${file.name}`);
          await supabase.storage
            .from('payment-receipts')
            .remove(filePaths);
        }
      } catch (cleanupError) {
        console.error("Error en limpieza de carpeta:", cleanupError);
      }

      // 4. Eliminar la orden de la base de datos
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (deleteError) throw deleteError;

      toast.success("Orden eliminada y registrada en auditoría");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al eliminar orden:", error);
      toast.error(error.message || "Error al eliminar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevenir submit si no estamos en el paso final
    if (currentStep !== totalSteps) {
      console.warn("Submit bloqueado: usuario no está en el paso final");
      return;
    }

    if (!selectedClientId) {
      toast.error("Selecciona un cliente");
      return;
    }

    const precioVentaNumeric = parseFloat(unformatCurrency(precioVenta));
    const importeAnticipoNumeric = parseFloat(unformatCurrency(importeAnticipo));

    if (importeAnticipoNumeric > precioVentaNumeric) {
      toast.error("El anticipo no puede ser mayor al precio de venta");
      return;
    }

    setLoading(true);

    try {
      let receiptUrls = uploadedReceiptUrls;
      
      // Upload receipts if this is a new order with files
      if (paymentReceipts.length > 0) {
        setUploading(true);
        const tempOrderId = order?.id || crypto.randomUUID();
        receiptUrls = await uploadReceipts(tempOrderId);
        setUploading(false);
      }

      const orderData: any = {
        client_id: selectedClientId,
        tipo_accesorio: tipoAccesorio.toLowerCase(),
        talla: talla !== "" ? parseFloat(talla) : null,
        precio_venta: precioVentaNumeric,
        importe_anticipo: importeAnticipoNumeric,
        forma_pago: formaPago,
        estatus_pago: estatusPago,
        metal_tipo: metalTipo,
        metal_pureza: metalTipo === "oro" ? metalPureza : null,
        metal_color: metalTipo === "oro" ? metalColor : null,
        piedra_tipo: piedraTipo,
        notas: notas || null,
        comprobantes_pago: receiptUrls,
      };

      if (piedraTipo === "diamante") {
        orderData.diamante_color = diamanteColor || null;
        orderData.diamante_claridad = diamanteClaridad || null;
        orderData.diamante_corte = diamanteCorte || null;
        orderData.diamante_quilataje = diamanteQuilataje ? parseFloat(diamanteQuilataje) : null;
        orderData.diamante_forma = diamanteForma;
        orderData.gema_observaciones = null;
      } else {
        orderData.diamante_color = null;
        orderData.diamante_claridad = null;
        orderData.diamante_corte = null;
        orderData.diamante_quilataje = null;
        orderData.diamante_forma = null;
        orderData.gema_observaciones = gemaObservaciones || null;
      }

      if (order) {
        const { error } = await supabase
          .from("orders")
          .update(orderData)
          .eq("id", order.id);

        if (error) throw error;
        toast.success("Orden actualizada exitosamente");
      } else {
        const { error } = await supabase.from("orders").insert([orderData]);

        if (error) throw error;
        toast.success("Orden creada exitosamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar orden");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Editar Orden" : "Nueva Orden de Compra"}</DialogTitle>
          <DialogDescription>
            {order
              ? "Modifica los detalles de la orden"
              : "Completa la información para crear una nueva orden"}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper visual */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold transition-colors",
                    currentStep === step && "border-accent bg-accent text-accent-foreground",
                    currentStep > step && "border-primary bg-primary text-primary-foreground",
                    currentStep < step && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {currentStep > step ? "✓" : step}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 font-medium transition-colors text-center",
                    currentStep >= step ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step === 1 && "Cliente y Pago"}
                  {step === 2 && "Metal"}
                  {step === 3 && "Piedra"}
                  {step === 4 && "Notas"}
                </span>
              </div>
              {step < 4 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    currentStep > step ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
            {/* Step 1: Client and Payment */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                  disabled={loading || !!order}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Botón para agregar nuevo cliente */}
                    {onOpenClientDialog && (
                      <div className="p-2 border-b border-border">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-start text-accent hover:text-accent hover:bg-accent/10"
                          onClick={() => {
                            onOpenClientDialog();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Nuevo Cliente
                        </Button>
                      </div>
                    )}
                    
                    {/* Lista de clientes existentes */}
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown de Proyectos (solo si hay proyectos activos) */}
              {clientProspects.length > 0 && (
                <div className="space-y-2 mt-4 p-4 bg-accent/5 border border-accent/20 rounded-md">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prospect">¿Deseas usar un proyecto existente?</Label>
                    <Badge variant="secondary" className="text-xs">
                      {clientProspects.length} {clientProspects.length === 1 ? "proyecto" : "proyectos"} activo{clientProspects.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <Select
                    value={selectedProspectId}
                    onValueChange={(value) => {
                      setSelectedProspectId(value);
                      if (value) {
                        applyProspectData(value);
                      }
                    }}
                    disabled={loading || isLoadingProspects}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proyecto (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientProspects.map((prospect) => (
                        <SelectItem key={prospect.id} value={prospect.id}>
                          {generateProspectTitle(prospect)}
                          {prospect.importe_previsto && (
                            <span className="text-muted-foreground ml-2">
                              ({formatCurrency(prospect.importe_previsto.toString())})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Al seleccionar un proyecto, se rellenarán automáticamente los campos relacionados (metal, piedra, precio sugerido y notas).
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio de Venta *</Label>
                  <Input
                    id="precio"
                    type="text"
                    value={precioVenta}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setPrecioVenta(formatted);
                      
                      // Revalidate anticipo if it exists
                      if (importeAnticipo) {
                        const precioNum = parseFloat(unformatCurrency(formatted));
                        const anticipoNum = parseFloat(unformatCurrency(importeAnticipo));
                        if (anticipoNum > precioNum) {
                          setAnticipoError("El anticipo no puede ser mayor al precio de venta");
                        } else {
                          setAnticipoError("");
                        }
                      }
                    }}
                    required
                    disabled={loading}
                    placeholder="$0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anticipo">Anticipo *</Label>
                  <Input
                    id="anticipo"
                    type="text"
                    value={importeAnticipo}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setImporteAnticipo(formatted);
                      
                      if (precioVenta) {
                        const precioNum = parseFloat(unformatCurrency(precioVenta));
                        const anticipoNum = parseFloat(unformatCurrency(formatted));
                        if (anticipoNum > precioNum) {
                          setAnticipoError("El anticipo no puede ser mayor al precio de venta");
                        } else {
                          setAnticipoError("");
                        }
                      }
                    }}
                    required
                    disabled={loading}
                    placeholder="$0.00"
                  />
                  {anticipoError && (
                    <p className="text-sm text-destructive">{anticipoError}</p>
                  )}
                </div>
              </div>

              {precioVenta && importeAnticipo && (
                <div className="flex items-center justify-between py-2 px-3 border-l-2 border-warning bg-warning/5">
                  <span className="text-sm text-muted-foreground">Saldo Pendiente:</span>
                  <span className="text-base font-semibold text-warning">
                    ${(parseFloat(unformatCurrency(precioVenta)) - parseFloat(unformatCurrency(importeAnticipo))).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tipo_accesorio">Tipo de Accesorio *</Label>
                <Select value={tipoAccesorio} onValueChange={setTipoAccesorio} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anillo">Anillo</SelectItem>
                    <SelectItem value="collar">Collar</SelectItem>
                    <SelectItem value="pulsera">Pulsera</SelectItem>
                    <SelectItem value="arete">Arete</SelectItem>
                    <SelectItem value="dije">Dije</SelectItem>
                    <SelectItem value="cadena">Cadena</SelectItem>
                    <SelectItem value="toby">Toby</SelectItem>
                    <SelectItem value="piercing">Piercing</SelectItem>
                    <SelectItem value="brazalete">Brazalete</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipoAccesorio === "anillo" && (
                <div className="space-y-2">
                  <Label htmlFor="talla">Talla *</Label>
                  <Input
                    id="talla"
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    placeholder="Ej: 6.75"
                    value={talla}
                    onChange={(e) => setTalla(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forma_pago">Forma de Pago *</Label>
                  <Select value={formaPago} onValueChange={setFormaPago} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estatus_pago">Estatus de Pago *</Label>
                  <Select value={estatusPago} onValueChange={setEstatusPago} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anticipo_recibido">Anticipo Recibido</SelectItem>
                      <SelectItem value="liquidado">Liquidado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Comprobantes de Pago</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  multiple
                  onChange={handleReceiptUpload}
                  disabled={loading || uploading}
                />
                <p className="text-xs text-muted-foreground">
                  Sube imágenes (JPG, PNG) o PDFs de los comprobantes. Máximo 10MB por archivo.
                </p>
                
                {paymentReceipts.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {paymentReceipts.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReceipt(index)}
                          disabled={loading || uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Step 2: Metal */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                <Label>Tipo de Metal *</Label>
                <Select
                  value={metalTipo}
                  onValueChange={(value: any) => setMetalTipo(value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oro">Oro</SelectItem>
                    <SelectItem value="plata">Plata</SelectItem>
                    <SelectItem value="platino">Platino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {metalTipo === "oro" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pureza del Oro *</Label>
                    <Select
                      value={metalPureza}
                      onValueChange={setMetalPureza}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10k">10k</SelectItem>
                        <SelectItem value="14k">14k</SelectItem>
                        <SelectItem value="18k">18k</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color del Oro *</Label>
                    <Select value={metalColor} onValueChange={setMetalColor} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amarillo">Amarillo</SelectItem>
                        <SelectItem value="blanco">Blanco</SelectItem>
                        <SelectItem value="rosado">Rosado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              </div>
            )}

            {/* Step 3: Stone */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                <Label>Tipo de Piedra *</Label>
                <Select
                  value={piedraTipo}
                  onValueChange={(value: any) => setPiedraTipo(value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diamante">Diamante</SelectItem>
                    <SelectItem value="gema">Gema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {piedraTipo === "diamante" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Corte *</Label>
                      <Select
                        value={diamanteForma}
                        onValueChange={setDiamanteForma}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="redondo">Redondo (Brilliant)</SelectItem>
                          <SelectItem value="princesa">Princesa</SelectItem>
                          <SelectItem value="esmeralda">Esmeralda</SelectItem>
                          <SelectItem value="asscher">Asscher</SelectItem>
                          <SelectItem value="marquisa">Marquisa</SelectItem>
                          <SelectItem value="oval">Oval</SelectItem>
                          <SelectItem value="radiante">Radiante</SelectItem>
                          <SelectItem value="pera">Pera</SelectItem>
                          <SelectItem value="corazon">Corazón</SelectItem>
                          <SelectItem value="cojin">Cojín (Cushion)</SelectItem>
                          <SelectItem value="baguette">Baguette</SelectItem>
                          <SelectItem value="trilliant">Trilliant</SelectItem>
                          <SelectItem value="rose">Rose Cut</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quilataje *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={diamanteQuilataje}
                        onChange={(e) => setDiamanteQuilataje(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        disabled={loading}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Color *</Label>
                      <Select
                        value={diamanteColor}
                        onValueChange={setDiamanteColor}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="D">D (Incoloro)</SelectItem>
                          <SelectItem value="E">E (Incoloro)</SelectItem>
                          <SelectItem value="F">F (Incoloro)</SelectItem>
                          <SelectItem value="G">G (Casi Incoloro)</SelectItem>
                          <SelectItem value="H">H (Casi Incoloro)</SelectItem>
                          <SelectItem value="I">I (Casi Incoloro)</SelectItem>
                          <SelectItem value="J">J (Casi Incoloro)</SelectItem>
                          <SelectItem value="K">K (Débilmente Amarillo)</SelectItem>
                          <SelectItem value="L">L (Débilmente Amarillo)</SelectItem>
                          <SelectItem value="M">M (Débilmente Amarillo)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        D es el mejor (incoloro)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Claridad *</Label>
                      <Select
                        value={diamanteClaridad}
                        onValueChange={setDiamanteClaridad}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FL">FL - Flawless</SelectItem>
                          <SelectItem value="IF">IF - Internally Flawless</SelectItem>
                          <SelectItem value="VVS1">VVS1 - Very Very Slightly Included 1</SelectItem>
                          <SelectItem value="VVS2">VVS2 - Very Very Slightly Included 2</SelectItem>
                          <SelectItem value="VS1">VS1 - Very Slightly Included 1</SelectItem>
                          <SelectItem value="VS2">VS2 - Very Slightly Included 2</SelectItem>
                          <SelectItem value="SI1">SI1 - Slightly Included 1</SelectItem>
                          <SelectItem value="SI2">SI2 - Slightly Included 2</SelectItem>
                          <SelectItem value="I1">I1 - Included 1</SelectItem>
                          <SelectItem value="I2">I2 - Included 2</SelectItem>
                          <SelectItem value="I3">I3 - Included 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        FL es el mejor (sin defectos)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Calidad del Corte *</Label>
                      <Select
                        value={diamanteCorte}
                        onValueChange={setDiamanteCorte}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent (Excelente)</SelectItem>
                          <SelectItem value="Very Good">Very Good (Muy Bueno)</SelectItem>
                          <SelectItem value="Good">Good (Bueno)</SelectItem>
                          <SelectItem value="Fair">Fair (Regular)</SelectItem>
                          <SelectItem value="Poor">Poor (Pobre)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Afecta el brillo del diamante
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {piedraTipo === "gema" && (
                <div className="space-y-2">
                  <Label>Observaciones de la Gema</Label>
                  <Textarea
                    value={gemaObservaciones}
                    onChange={(e) => setGemaObservaciones(e.target.value)}
                    disabled={loading}
                    placeholder="Describe la gema, su tipo, características, etc."
                    rows={5}
                  />
                </div>
              )}
            </div>
            )}

            {/* Step 4: Notes */}
            {currentStep === 4 && (
              <div className="space-y-4">
              <div className="space-y-2">
                <Label>Notas Adicionales</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  disabled={loading}
                  placeholder="Detalles adicionales sobre la orden..."
                  rows={8}
                />
              </div>
            </div>
            )}

          <div className="flex justify-between gap-3 pt-6 mt-6 border-t">
            {/* Lado izquierdo: Eliminar o Anterior */}
            <div className="flex gap-3">
              {order && isAdmin ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Orden
                </Button>
              ) : (
                !order &&
                currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={loading}
                  >
                    Anterior
                  </Button>
                )
              )}
            </div>

            {/* Lado derecho: Cancelar y Siguiente/Guardar */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={loading}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || uploading || !step4Visited}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading ? "Subiendo comprobantes..." : "Guardando..."}
                    </>
                  ) : (
                    <>{order ? "Actualizar Orden" : "Crear Orden"}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
