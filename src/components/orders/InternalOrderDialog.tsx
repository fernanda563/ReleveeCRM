import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductType, Currency, InternalPaymentStatus, InternalOrderFormData, Supplier } from "@/types/internal-orders";
import { cn } from "@/lib/utils";

interface InternalOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  order?: any;
}

export const InternalOrderDialog = ({
  open,
  onOpenChange,
  onSuccess,
  order,
}: InternalOrderDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [formData, setFormData] = useState<InternalOrderFormData>({
    supplier_id: "",
    proveedor_nombre: "",
    proveedor_contacto: "",
    numero_factura: "",
    fecha_compra: undefined,
    fecha_entrega_esperada: undefined,
    tipo_producto: "",
    cantidad: "1",
    descripcion: "",
    quilataje: "",
    color: "",
    claridad: "",
    corte: "",
    forma: "",
    numero_reporte: "",
    certificado: "",
    tipo_gema: "",
    gema_quilataje: "",
    gema_color: "",
    gema_claridad: "",
    gema_forma: "",
    gema_certificado: "",
    material: "",
    talla: "",
    dimensiones: "",
    especificaciones: "",
    factura_pdf: null,
    imagenes_producto: [],
    precio_compra: "",
    moneda: "MXN",
    estatus_pago: "pendiente",
    notas_adicionales: "",
  });

  const updateFormData = (field: keyof InternalOrderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Cargar proveedores activos
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!open) return;
      
      setLoadingSuppliers(true);
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('id, nombre_empresa, nombre_contacto, email, telefono, activo')
          .eq('activo', true)
          .order('nombre_empresa', { ascending: true });

        if (error) throw error;
        setSuppliers(data || []);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        toast.error("Error al cargar proveedores");
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [open]);

  // Manejar selección de proveedor
  const handleSupplierChange = (supplierId: string) => {
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        supplier_id: supplierId,
        proveedor_nombre: selectedSupplier.nombre_empresa,
        proveedor_contacto: selectedSupplier.nombre_contacto
      }));
    }
  };

  const validateStep1 = () => {
    if (!formData.supplier_id) {
      toast.error("Debes seleccionar un proveedor");
      return false;
    }
    if (!formData.numero_factura.trim()) {
      toast.error("El número de factura es obligatorio");
      return false;
    }
    if (!formData.fecha_compra) {
      toast.error("La fecha de compra es obligatoria");
      return false;
    }
    if (formData.fecha_compra > new Date()) {
      toast.error("La fecha de compra no puede ser futura");
      return false;
    }
    if (formData.fecha_entrega_esperada && formData.fecha_entrega_esperada < formData.fecha_compra) {
      toast.error("La fecha de entrega debe ser posterior a la fecha de compra");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.tipo_producto) {
      toast.error("Selecciona el tipo de producto");
      return false;
    }
    const cantidad = parseInt(formData.cantidad);
    if (isNaN(cantidad) || cantidad < 1) {
      toast.error("La cantidad debe ser mayor a 0");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.tipo_producto === 'diamante') {
      if (!formData.quilataje.trim() || !formData.color || !formData.claridad || 
          !formData.corte || !formData.forma || !formData.numero_reporte || !formData.certificado) {
        toast.error("Para diamantes, todos los campos de especificación son obligatorios");
        return false;
      }
      const quilataje = parseFloat(formData.quilataje);
      if (isNaN(quilataje) || quilataje <= 0 || quilataje >= 1000) {
        toast.error("El quilataje debe estar entre 0.01 y 999.99");
        return false;
      }
    } else if (formData.tipo_producto === 'gema') {
      if (!formData.tipo_gema.trim()) {
        toast.error("El tipo de gema es obligatorio");
        return false;
      }
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.factura_pdf) {
      toast.error("Debes subir la factura en PDF");
      return false;
    }
    if (formData.factura_pdf.size > 10 * 1024 * 1024) {
      toast.error("El PDF de la factura no puede exceder 10MB");
      return false;
    }
    for (const img of formData.imagenes_producto) {
      if (img.size > 10 * 1024 * 1024) {
        toast.error("Las imágenes no pueden exceder 10MB cada una");
        return false;
      }
    }
    if (formData.imagenes_producto.length > 5) {
      toast.error("Puedes subir máximo 5 imágenes");
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    const precio = parseFloat(formData.precio_compra);
    if (isNaN(precio) || precio <= 0) {
      toast.error("El precio de compra debe ser mayor a 0");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      case 5:
        isValid = validateStep5();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else if (isValid && currentStep === 5) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const uploadFiles = async (orderId: string) => {
    const urls: { factura: string; imagenes: string[] } = { factura: "", imagenes: [] };

    // Upload factura PDF
    if (formData.factura_pdf) {
      const facturaPath = `${orderId}/facturas/${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
      const { error: facturaError } = await supabase.storage
        .from('purchase-order-documents')
        .upload(facturaPath, formData.factura_pdf);

      if (facturaError) throw facturaError;

      const { data: facturaData } = supabase.storage
        .from('purchase-order-documents')
        .getPublicUrl(facturaPath);

      urls.factura = facturaData.publicUrl;
    }

    // Upload product images
    for (const img of formData.imagenes_producto) {
      const imgExt = img.name.split('.').pop();
      const imgPath = `${orderId}/productos/${Date.now()}_${Math.random().toString(36).substring(7)}.${imgExt}`;
      
      const { error: imgError } = await supabase.storage
        .from('purchase-order-documents')
        .upload(imgPath, img);

      if (imgError) throw imgError;

      const { data: imgData } = supabase.storage
        .from('purchase-order-documents')
        .getPublicUrl(imgPath);

      urls.imagenes.push(imgData.publicUrl);
    }

    return urls;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Create temporary ID for file uploads
      const tempId = crypto.randomUUID();
      const { factura, imagenes } = await uploadFiles(tempId);

      // Prepare data for insertion
    const insertData: any = {
      tipo_producto: formData.tipo_producto,
      supplier_id: formData.supplier_id,
      proveedor_nombre: formData.proveedor_nombre,
      proveedor_contacto: formData.proveedor_contacto || null,
      numero_factura: formData.numero_factura,
        fecha_compra: format(formData.fecha_compra!, 'yyyy-MM-dd'),
        fecha_entrega_esperada: formData.fecha_entrega_esperada ? format(formData.fecha_entrega_esperada, 'yyyy-MM-dd') : null,
        cantidad: parseInt(formData.cantidad),
        descripcion: formData.descripcion || null,
        precio_compra: parseFloat(formData.precio_compra),
        moneda: formData.moneda,
        estatus_pago: formData.estatus_pago,
        notas_adicionales: formData.notas_adicionales || null,
        factura_pdf_url: factura,
        imagenes_producto: imagenes,
        estatus: 'pendiente',
      };

      // Add diamond-specific fields
      if (formData.tipo_producto === 'diamante') {
        insertData.quilataje = parseFloat(formData.quilataje);
        insertData.color = formData.color;
        insertData.claridad = formData.claridad;
        insertData.corte = formData.corte;
        insertData.forma = formData.forma;
        insertData.numero_reporte = formData.numero_reporte;
        insertData.certificado = formData.certificado;
      } else if (formData.tipo_producto === 'gema') {
        insertData.descripcion = `Tipo: ${formData.tipo_gema}. ${formData.descripcion || ''}`.trim();
        if (formData.gema_quilataje) insertData.quilataje = parseFloat(formData.gema_quilataje);
        if (formData.gema_color) insertData.color = formData.gema_color;
        if (formData.gema_claridad) insertData.claridad = formData.gema_claridad;
        if (formData.gema_forma) insertData.forma = formData.gema_forma;
        if (formData.gema_certificado) insertData.certificado = formData.gema_certificado;
      }

      const { error } = await supabase
        .from('purchase_orders_internal')
        .insert([insertData]);

      if (error) throw error;

      toast.success("Orden interna creada exitosamente");
      onSuccess();
      onOpenChange(false);
      setCurrentStep(1);
      setFormData({
        supplier_id: "",
        proveedor_nombre: "",
        proveedor_contacto: "",
        numero_factura: "",
        fecha_compra: undefined,
        fecha_entrega_esperada: undefined,
        tipo_producto: "",
        cantidad: "1",
        descripcion: "",
        quilataje: "",
        color: "",
        claridad: "",
        corte: "",
        forma: "",
        numero_reporte: "",
        certificado: "",
        tipo_gema: "",
        gema_quilataje: "",
        gema_color: "",
        gema_claridad: "",
        gema_forma: "",
        gema_certificado: "",
        material: "",
        talla: "",
        dimensiones: "",
        especificaciones: "",
        factura_pdf: null,
        imagenes_producto: [],
        precio_compra: "",
        moneda: "MXN",
        estatus_pago: "pendiente",
        notas_adicionales: "",
      });
    } catch (error: any) {
      console.error('Error creating internal order:', error);
      toast.error(error.message || "Error al crear la orden interna");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'images') => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'pdf') {
      const file = files[0];
      if (file && file.type === 'application/pdf') {
        updateFormData('factura_pdf', file);
      } else {
        toast.error("Solo se permiten archivos PDF");
      }
    } else {
      const validImages = Array.from(files).filter(file => 
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      );
      if (validImages.length !== files.length) {
        toast.error("Solo se permiten imágenes JPG, PNG o WEBP");
      }
      updateFormData('imagenes_producto', [...formData.imagenes_producto, ...validImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    updateFormData('imagenes_producto', formData.imagenes_producto.filter((_, i) => i !== index));
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="supplier_id">Proveedor *</Label>
        {loadingSuppliers ? (
          <div className="flex items-center justify-center h-10 border rounded-md bg-background">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando proveedores...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-4 border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              No hay proveedores activos en el sistema.
            </p>
          </div>
        ) : (
          <Select 
            value={formData.supplier_id} 
            onValueChange={handleSupplierChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-background">
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.nombre_empresa} ({supplier.nombre_contacto})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <Label htmlFor="numero_factura">Número de Factura *</Label>
        <Input
          id="numero_factura"
          value={formData.numero_factura}
          onChange={(e) => updateFormData('numero_factura', e.target.value)}
          placeholder="FAC-2024-001"
          maxLength={100}
        />
      </div>

      <div>
        <Label>Fecha de Compra *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.fecha_compra && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.fecha_compra ? format(formData.fecha_compra, "PPP", { locale: es }) : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.fecha_compra}
              onSelect={(date) => updateFormData('fecha_compra', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Fecha de Entrega Esperada</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.fecha_entrega_esperada && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.fecha_entrega_esperada ? format(formData.fecha_entrega_esperada, "PPP", { locale: es }) : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.fecha_entrega_esperada}
              onSelect={(date) => updateFormData('fecha_entrega_esperada', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="tipo_producto">Tipo de Producto *</Label>
        <Select value={formData.tipo_producto} onValueChange={(value) => updateFormData('tipo_producto', value as ProductType)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="diamante">Diamante</SelectItem>
            <SelectItem value="gema">Gema</SelectItem>
            <SelectItem value="anillo">Anillo</SelectItem>
            <SelectItem value="collar">Collar</SelectItem>
            <SelectItem value="arete">Arete</SelectItem>
            <SelectItem value="dije">Dije</SelectItem>
            <SelectItem value="cadena">Cadena</SelectItem>
            <SelectItem value="componente">Componente</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="cantidad">Cantidad *</Label>
        <Input
          id="cantidad"
          type="number"
          min="1"
          value={formData.cantidad}
          onChange={(e) => {
            const value = e.target.value;
            // Si el valor está vacío o es menor a 1, establecer "1"
            updateFormData('cantidad', value === '' || parseInt(value) < 1 ? '1' : value);
          }}
        />
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción General</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => updateFormData('descripcion', e.target.value)}
          placeholder="Descripción del producto"
          maxLength={500}
          rows={4}
        />
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (formData.tipo_producto === 'diamante') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quilataje">Quilataje *</Label>
              <Input
                id="quilataje"
                type="number"
                step="0.01"
                min="0.01"
                max="999.99"
                value={formData.quilataje}
                onChange={(e) => updateFormData('quilataje', e.target.value)}
                placeholder="Ej: 1.25"
              />
            </div>

            <div>
              <Label htmlFor="forma">Forma *</Label>
              <Select value={formData.forma} onValueChange={(value) => updateFormData('forma', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="redondo">Redondo</SelectItem>
                  <SelectItem value="princesa">Princesa</SelectItem>
                  <SelectItem value="esmeralda">Esmeralda</SelectItem>
                  <SelectItem value="cushion">Cushion</SelectItem>
                  <SelectItem value="oval">Oval</SelectItem>
                  <SelectItem value="pera">Pera</SelectItem>
                  <SelectItem value="marquesa">Marquesa</SelectItem>
                  <SelectItem value="corazon">Corazón</SelectItem>
                  <SelectItem value="radiante">Radiante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="color">Color *</Label>
              <Select value={formData.color} onValueChange={(value) => updateFormData('color', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="claridad">Claridad *</Label>
              <Select value={formData.claridad} onValueChange={(value) => updateFormData('claridad', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="corte">Corte *</Label>
            <Select value={formData.corte} onValueChange={(value) => updateFormData('corte', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excelente">Excelente</SelectItem>
                <SelectItem value="muy_bueno">Muy Bueno</SelectItem>
                <SelectItem value="bueno">Bueno</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="pobre">Pobre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="numero_reporte">Número de Reporte/Certificado *</Label>
            <Input
              id="numero_reporte"
              value={formData.numero_reporte}
              onChange={(e) => updateFormData('numero_reporte', e.target.value)}
              placeholder="GIA #123456"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="certificado">Certificado Emitido Por *</Label>
            <Select value={formData.certificado} onValueChange={(value) => updateFormData('certificado', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GIA">GIA</SelectItem>
                <SelectItem value="AGS">AGS</SelectItem>
                <SelectItem value="IGI">IGI</SelectItem>
                <SelectItem value="EGL">EGL</SelectItem>
                <SelectItem value="HRD">HRD</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    } else if (formData.tipo_producto === 'gema') {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="tipo_gema">Tipo de Gema *</Label>
            <Input
              id="tipo_gema"
              value={formData.tipo_gema}
              onChange={(e) => updateFormData('tipo_gema', e.target.value)}
              placeholder="Zafiro, Rubí, Esmeralda, etc."
            />
          </div>

          <div>
            <Label htmlFor="gema_quilataje">Quilataje</Label>
            <Input
              id="gema_quilataje"
              type="number"
              step="0.01"
              value={formData.gema_quilataje}
              onChange={(e) => updateFormData('gema_quilataje', e.target.value)}
              placeholder="Ej: 2.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gema_color">Color</Label>
              <Input
                id="gema_color"
                value={formData.gema_color}
                onChange={(e) => updateFormData('gema_color', e.target.value)}
                placeholder="Azul, Rojo, etc."
                maxLength={50}
              />
            </div>

            <div>
              <Label htmlFor="gema_claridad">Claridad</Label>
              <Input
                id="gema_claridad"
                value={formData.gema_claridad}
                onChange={(e) => updateFormData('gema_claridad', e.target.value)}
                placeholder="VVS, VS, etc."
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gema_forma">Forma</Label>
            <Input
              id="gema_forma"
              value={formData.gema_forma}
              onChange={(e) => updateFormData('gema_forma', e.target.value)}
              placeholder="Oval, Redondo, etc."
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="gema_certificado">Certificado</Label>
            <Input
              id="gema_certificado"
              value={formData.gema_certificado}
              onChange={(e) => updateFormData('gema_certificado', e.target.value)}
              placeholder="Número de certificado (opcional)"
              maxLength={100}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              value={formData.material}
              onChange={(e) => updateFormData('material', e.target.value)}
              placeholder="Oro, Plata, etc."
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="talla">Talla</Label>
            <Input
              id="talla"
              value={formData.talla}
              onChange={(e) => updateFormData('talla', e.target.value)}
              placeholder="6.5, M, L, etc."
              maxLength={20}
            />
          </div>

          <div>
            <Label htmlFor="dimensiones">Dimensiones</Label>
            <Input
              id="dimensiones"
              value={formData.dimensiones}
              onChange={(e) => updateFormData('dimensiones', e.target.value)}
              placeholder="10mm x 5mm"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="especificaciones">Especificaciones Adicionales</Label>
            <Textarea
              id="especificaciones"
              value={formData.especificaciones}
              onChange={(e) => updateFormData('especificaciones', e.target.value)}
              placeholder="Detalles adicionales del producto"
              maxLength={300}
              rows={4}
            />
          </div>
        </div>
      );
    }
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Subir Factura (Obligatorio) *</Label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, 'pdf')}
              className="hidden"
              id="pdf-upload"
            />
            <Label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="text-sm">
                Arrastra tu PDF aquí o{" "}
                <span className="text-primary hover:underline">haz clic para seleccionar</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Máximo 10MB
              </div>
            </Label>
          </div>
          {formData.factura_pdf && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>{formData.factura_pdf.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFormData('factura_pdf', null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Imágenes del Producto (Opcional)</Label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              onChange={(e) => handleFileChange(e, 'images')}
              className="hidden"
              id="images-upload"
            />
            <Label htmlFor="images-upload" className="cursor-pointer">
              <div className="text-sm">
                Arrastra tus imágenes aquí o{" "}
                <span className="text-primary hover:underline">haz clic para seleccionar</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                JPG, PNG o WEBP. Máximo 5 imágenes de 10MB cada una
              </div>
            </Label>
          </div>
          {formData.imagenes_producto.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {formData.imagenes_producto.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const formatCurrency = (value: string) => {
      const num = parseFloat(value.replace(/[^0-9.]/g, ''));
      if (isNaN(num)) return '$0.00';
      return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="precio_compra">Precio de Compra *</Label>
          <Input
            id="precio_compra"
            value={formData.precio_compra}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, '');
              updateFormData('precio_compra', value);
            }}
            placeholder="$0.00"
            onBlur={(e) => {
              const formatted = formatCurrency(e.target.value);
              e.target.value = formatted;
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="moneda">Moneda *</Label>
            <Select value={formData.moneda} onValueChange={(value) => updateFormData('moneda', value as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MXN">MXN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estatus_pago">Estatus de Pago *</Label>
            <Select value={formData.estatus_pago} onValueChange={(value) => updateFormData('estatus_pago', value as InternalPaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="anticipo">Anticipo</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="notas_adicionales">Notas Adicionales</Label>
          <Textarea
            id="notas_adicionales"
            value={formData.notas_adicionales}
            onChange={(e) => updateFormData('notas_adicionales', e.target.value)}
            placeholder="Notas adicionales sobre la compra"
            maxLength={500}
            rows={4}
          />
        </div>

        <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
          <h4 className="font-semibold text-base">Resumen de la Orden</h4>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Proveedor</span>
              <p className="font-medium">{formData.proveedor_nombre}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Factura</span>
              <p className="font-medium">{formData.numero_factura}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Producto</span>
              <p className="font-medium capitalize">{formData.tipo_producto}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Cantidad</span>
              <p className="font-medium">{formData.cantidad}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Precio Total</span>
              <p className="font-medium">{formatCurrency(formData.precio_compra)} {formData.moneda}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Fecha de Compra</span>
              <p className="font-medium">{formData.fecha_compra ? format(formData.fecha_compra, "PP", { locale: es }) : 'No especificada'}</p>
            </div>
          </div>

          <div className="pt-2 border-t grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Factura PDF</span>
              <p className="font-medium">{formData.factura_pdf ? 'Adjuntado' : 'No adjuntado'}</p>
            </div>
            
            {formData.imagenes_producto.length > 0 && (
              <div>
                <span className="text-muted-foreground">Imágenes del producto</span>
                <p className="font-medium">{formData.imagenes_producto.length} imagen(es)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Compra a Proveedor</DialogTitle>
          <DialogDescription>
            Completa la información para registrar la compra
          </DialogDescription>
        </DialogHeader>

        {/* Stepper visual */}
        <div className="flex justify-center mt-6 mb-3 px-8">
          <div className="flex items-start w-full max-w-3xl justify-between">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
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
                      "text-xs mt-2 font-medium transition-colors text-center whitespace-nowrap",
                      currentStep >= step ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step === 1 && "Proveedor"}
                    {step === 2 && "Producto"}
                    {step === 3 && "Especificaciones"}
                    {step === 4 && "Archivos"}
                    {step === 5 && "Pago"}
                  </span>
                </div>
                {index < 4 && (
                  <div
                    className={cn(
                      "w-16 h-0.5 mx-2 transition-colors",
                      currentStep > step ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 mt-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>

          <Button onClick={handleNext} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : currentStep === 5 ? (
              "Guardar Orden"
            ) : (
              <>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
