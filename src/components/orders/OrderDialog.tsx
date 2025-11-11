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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import type { Order } from "@/pages/Orders";
import type { Client } from "@/pages/CRM";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  onSuccess: () => void;
}

const OrderDialog = ({ open, onOpenChange, order, onSuccess }: OrderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Financial data
  const [selectedClientId, setSelectedClientId] = useState("");
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
      fetchClients();
      if (order) {
        // Load order data
        setSelectedClientId(order.client_id);
        setPrecioVenta(order.precio_venta.toString());
        setImporteAnticipo(order.importe_anticipo.toString());
        setFormaPago(order.forma_pago);
        setEstatusPago(order.estatus_pago);
        setMetalTipo(order.metal_tipo as any);
        setMetalPureza(order.metal_pureza || "");
        setMetalColor(order.metal_color || "");
        setPiedraTipo(order.piedra_tipo as any);
        setDiamanteColor(order.diamante_color || "");
        setDiamanteClaridad(order.diamante_claridad || "");
        setDiamanteCorte(order.diamante_corte || "");
        setDiamanteQuilataje(order.diamante_quilataje?.toString() || "");
        setDiamanteForma(order.diamante_forma || "");
        setGemaObservaciones(order.gema_observaciones || "");
        setNotas(order.notas || "");
      } else {
        resetForm();
      }
    }
  }, [open, order]);

  const resetForm = () => {
    setSelectedClientId("");
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
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("nombre");
    if (data) setClients(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="client">Cliente y Pago</TabsTrigger>
              <TabsTrigger value="metal">Metal</TabsTrigger>
              <TabsTrigger value="stone">Piedra</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            {/* Tab 1: Client and Payment */}
            <TabsContent value="client" className="space-y-4 mt-4">
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
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              {precioVenta && importeAnticipo && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground">Saldo Pendiente:</p>
                  <p className="text-2xl font-bold text-warning">
                    ${(parseFloat(unformatCurrency(precioVenta)) - parseFloat(unformatCurrency(importeAnticipo))).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

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
            </TabsContent>

            {/* Tab 2: Metal */}
            <TabsContent value="metal" className="space-y-4 mt-4">
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
            </TabsContent>

            {/* Tab 3: Stone */}
            <TabsContent value="stone" className="space-y-4 mt-4">
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
                        disabled={loading}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Color</Label>
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
                      <Label>Claridad</Label>
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
                      <Label>Calidad del Corte</Label>
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
            </TabsContent>

            {/* Tab 4: Notes */}
            <TabsContent value="notes" className="space-y-4 mt-4">
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
