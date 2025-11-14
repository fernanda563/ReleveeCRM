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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, Trash2, CalendarIcon, ImageIcon, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Order } from "@/pages/Orders";
import type { Client } from "@/pages/CRM";
import { useUserRole } from "@/hooks/useUserRole";
import { OrderDialogStep5 } from "./OrderDialogStep5";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  prospect?: Prospect | null;
  clientId?: string;
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

const OrderDialog = ({ open, onOpenChange, order, prospect, clientId, onSuccess, onOpenClientDialog }: OrderDialogProps) => {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientProspects, setClientProspects] = useState<Prospect[]>([]);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [step5Visited, setStep5Visited] = useState(false);
  const totalSteps = 5;
  
  // STL Files
  const [availableSTLFiles, setAvailableSTLFiles] = useState<any[]>([]);
  const [selectedSTLFileId, setSelectedSTLFileId] = useState("");

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
  
  // Reference images
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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
  
  // Delivery date
  const [fechaEntregaEsperada, setFechaEntregaEsperada] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      fetchClients();
      
      // Si viene de un proyecto, pre-cargar datos
      if (prospect && clientId) {
        setSelectedClientId(clientId);
        setTipoAccesorio(prospect.tipo_accesorio || "");
        setMetalTipo((prospect.metal_tipo as any) || "oro");
        setMetalColor(prospect.color_oro || "");
        setMetalPureza(prospect.pureza_oro || "");
        setPiedraTipo(prospect.tipo_piedra === "diamante" ? "diamante" : "gema");
        setNotas(prospect.observaciones || "");
        
        if (prospect.importe_previsto) {
          setPrecioVenta(formatCurrency(prospect.importe_previsto.toString()));
        }
        
        // Reset otros campos
        setTalla("");
        setImporteAnticipo("");
        setFormaPago("");
        setEstatusPago("anticipo_recibido");
        setPaymentReceipts([]);
        setReferenceImages([]);
        setUploadedReceiptUrls([]);
        setUploadedImageUrls([]);
        setSelectedSTLFileId("");
        setClientProspects([]);
        setSelectedProspectId("");
        setDiamanteColor("");
        setDiamanteClaridad("");
        setDiamanteCorte("");
        setDiamanteForma("");
        setDiamanteQuilataje("");
        setGemaObservaciones("");
        setFechaEntregaEsperada(undefined);
      } else if (order) {
        setSelectedClientId(order.client_id);
        setTipoAccesorio(order.tipo_accesorio || "");
        setTalla(order.talla?.toString() || "");
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
        setFechaEntregaEsperada(order.fecha_entrega_esperada ? new Date(order.fecha_entrega_esperada) : undefined);
        setSelectedSTLFileId(order.stl_file_id || "none");
        setPaymentReceipts([]);
        setReferenceImages([]);
        
        // Load existing payment receipts if editing
        if (order.comprobantes_pago && Array.isArray(order.comprobantes_pago)) {
          setUploadedReceiptUrls(order.comprobantes_pago as string[]);
        } else {
          setUploadedReceiptUrls([]);
        }
        
        // Load existing reference images if editing
        if (order.imagenes_referencia && Array.isArray(order.imagenes_referencia)) {
          setUploadedImageUrls(order.imagenes_referencia as string[]);
        } else {
          setUploadedImageUrls([]);
        }
        
        // NO cargar proyectos al editar una orden
        setClientProspects([]);
        setSelectedProspectId("");
      } else {
        resetForm();
      }
    }
  }, [open, order, prospect, clientId]);

  useEffect(() => {
    if (open) {
      fetchSTLFiles();
    }
  }, [open]);

  useEffect(() => {
    if (selectedClientId && !order && !prospect) {
      fetchClientProspects(selectedClientId);
      setSelectedProspectId("");
    } else {
      setClientProspects([]);
      setSelectedProspectId("");
    }
  }, [selectedClientId, order, prospect]);

  useEffect(() => {
    if (currentStep === 5) {
      // Pequeño delay para prevenir clicks/enters accidentales
      setTimeout(() => setStep5Visited(true), 100);
    }
  }, [currentStep]);

  const resetForm = () => {
    setCurrentStep(1);
    setStep5Visited(false);
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
    setFechaEntregaEsperada(undefined);
    setPaymentReceipts([]);
    setUploadedReceiptUrls([]);
    setReferenceImages([]);
    setUploadedImageUrls([]);
    setClientProspects([]);
    setSelectedProspectId("");
    setSelectedSTLFileId("none");
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

  const fetchSTLFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("stl_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvailableSTLFiles(data || []);
    } catch (error) {
      console.error("Error al cargar archivos STL:", error);
      setAvailableSTLFiles([]);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) {
        toast.error(`${file.name}: Solo se permiten imágenes JPG, PNG, WEBP`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name}: El archivo no debe superar 10MB`);
        return false;
      }
      return true;
    });
    setReferenceImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedReceipt = (index: number) => {
    setUploadedReceiptUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidType) {
        toast.error(`${file.name}: Solo se permiten imágenes`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name}: El archivo no debe superar 10MB`);
        return false;
      }
      return true;
    });
    setReferenceImages(prev => [...prev, ...validFiles]);
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

  const uploadReferenceImages = async (orderId: string) => {
    const uploadedUrls: string[] = [];
    
    for (const file of referenceImages) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${orderId}/${fileName}`;

      const { error } = await supabase.storage
        .from('reference-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from('reference-images')
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
      if (!fechaEntregaEsperada) {
        toast.error("Selecciona una fecha de entrega esperada");
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
        setStep5Visited(false);
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

      // 2b. Eliminar imágenes de referencia del Storage
      if (order.imagenes_referencia && Array.isArray(order.imagenes_referencia)) {
        for (const url of order.imagenes_referencia) {
          try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/');
            const bucketIndex = pathSegments.indexOf('reference-images');
            if (bucketIndex !== -1) {
              const filePath = pathSegments.slice(bucketIndex + 1).join('/');
              
              const { error: storageError } = await supabase.storage
                .from('reference-images')
                .remove([filePath]);

              if (storageError) {
                console.error("Error al eliminar imagen de referencia:", storageError);
              }
            }
          } catch (urlError) {
            console.error("Error al procesar URL de imagen de referencia:", urlError);
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

    // Validar campos obligatorios de diamante
    if (piedraTipo === "diamante") {
      if (!diamanteForma) {
        toast.error("Por favor selecciona el corte del diamante");
        setCurrentStep(3); // Volver al paso de la piedra
        return;
      }
      if (!diamanteQuilataje) {
        toast.error("Por favor ingresa el quilataje del diamante");
        setCurrentStep(3);
        return;
      }
      if (!diamanteColor) {
        toast.error("Por favor selecciona el color del diamante");
        setCurrentStep(3);
        return;
      }
      if (!diamanteClaridad) {
        toast.error("Por favor selecciona la claridad del diamante");
        setCurrentStep(3);
        return;
      }
      if (!diamanteCorte) {
        toast.error("Por favor selecciona la calidad del corte del diamante");
        setCurrentStep(3);
        return;
      }
    }

    setLoading(true);

    try {
      let receiptUrls = uploadedReceiptUrls;
      let imageUrls = uploadedImageUrls;
      
      // Upload receipts if this is a new order with files
      if (paymentReceipts.length > 0) {
        setUploading(true);
        const tempOrderId = order?.id || crypto.randomUUID();
        receiptUrls = await uploadReceipts(tempOrderId);
        setUploading(false);
      }

      // Upload reference images if there are new files
      if (referenceImages.length > 0) {
        setUploading(true);
        const tempOrderId = order?.id || crypto.randomUUID();
        const newImageUrls = await uploadReferenceImages(tempOrderId);
        imageUrls = [...uploadedImageUrls, ...newImageUrls];
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
        imagenes_referencia: imageUrls,
        fecha_entrega_esperada: fechaEntregaEsperada ? format(fechaEntregaEsperada, 'yyyy-MM-dd') : null,
        stl_file_id: selectedSTLFileId && selectedSTLFileId !== "none" ? selectedSTLFileId : null,
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
      console.error(error);
      const friendlyMessage = getFriendlyErrorMessage(error);
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyErrorMessage = (error: any): string => {
    const errorMessage = error?.message || "";
    
    // Check constraint violations
    if (errorMessage.includes("orders_diamante_forma_check")) {
      return "Por favor selecciona un corte válido para el diamante";
    }
    if (errorMessage.includes("orders_diamante_color_check")) {
      return "Por favor selecciona un color válido para el diamante";
    }
    if (errorMessage.includes("orders_diamante_claridad_check")) {
      return "Por favor selecciona una claridad válida para el diamante";
    }
    if (errorMessage.includes("orders_diamante_corte_check")) {
      return "Por favor selecciona una calidad de corte válida para el diamante";
    }
    if (errorMessage.includes("check constraint")) {
      return "Uno o más campos contienen valores no válidos. Por favor verifica tu información.";
    }
    
    // Foreign key violations
    if (errorMessage.includes("foreign key") || errorMessage.includes("violates")) {
      return "Error de relación en la base de datos. Por favor contacta al administrador.";
    }
    
    // Required field errors
    if (errorMessage.includes("not null") || errorMessage.includes("required")) {
      return "Por favor completa todos los campos obligatorios";
    }
    
    // Default message
    return "Error al guardar la orden. Por favor verifica la información e intenta nuevamente.";
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
          {[1, 2, 3, 4, 5].map((step) => (
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
                  {step === 4 && "Imágenes"}
                  {step === 5 && "Archivos 3D"}
                </span>
              </div>
              {step < 5 && (
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
                    <p className="text-sm font-medium">Comprobantes nuevos ({paymentReceipts.length})</p>
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

                {uploadedReceiptUrls.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-medium">Comprobantes guardados ({uploadedReceiptUrls.length})</p>
                    {uploadedReceiptUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-accent/5 border border-accent/20 rounded">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-accent" />
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-accent hover:underline truncate flex-1"
                          >
                            Ver comprobante {index + 1}
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadedReceipt(index)}
                          disabled={loading || uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fecha de Entrega Esperada *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaEntregaEsperada && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaEntregaEsperada ? format(fechaEntregaEsperada, "PPP", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaEntregaEsperada}
                      onSelect={(date) => {
                        setFechaEntregaEsperada(date);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Fecha estimada de entrega del pedido
                </p>
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

            {/* Step 4: Reference Images */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Reference Images Section */}
                <div className="space-y-3">
                  <Label>Imágenes de Referencia del Cliente</Label>
                  <p className="text-sm text-muted-foreground">
                    Sube imágenes de referencia proporcionadas por el cliente (máximo 10MB por imagen)
                  </p>
                  
                  {/* Drag and Drop Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragging 
                        ? "border-accent bg-accent/5" 
                        : "border-muted-foreground/30 hover:border-accent/50 hover:bg-accent/5"
                    )}
                    onClick={() => document.getElementById('reference-images-input')?.click()}
                  >
                    <input
                      id="reference-images-input"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={loading}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {isDragging ? "Suelta las imágenes aquí" : "Arrastra imágenes aquí o haz clic para seleccionar"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, WEBP (máx. 10MB por archivo)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Images Preview */}
                  {referenceImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Imágenes nuevas ({referenceImages.length})</p>
                      <div className="grid grid-cols-4 gap-3">
                        {referenceImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Referencia ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing Uploaded Images */}
                  {uploadedImageUrls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Imágenes guardadas ({uploadedImageUrls.length})</p>
                      {uploadedImageUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-accent/5 border border-accent/20 rounded">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ImageIcon className="h-4 w-4 text-accent flex-shrink-0" />
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-accent hover:underline truncate"
                            >
                              Ver imagen de referencia {index + 1}
                            </a>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadedImage(index)}
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

            {/* Step 5: 3D Files and Final Notes */}
            {currentStep === 5 && (
              <OrderDialogStep5
                notas={notas}
                setNotas={setNotas}
                selectedSTLFileId={selectedSTLFileId}
                setSelectedSTLFileId={setSelectedSTLFileId}
                availableSTLFiles={availableSTLFiles}
                loading={loading}
              />
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
                  disabled={loading || uploading || !step5Visited}
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
