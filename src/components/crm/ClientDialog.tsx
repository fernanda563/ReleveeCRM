import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Search, X, Eye, Download } from "lucide-react";
import type { Client } from "@/pages/CRM";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUserRole } from "@/hooks/useUserRole";

// Helper function to capitalize first letter of each word in real-time
function capitalizeAsYouType(value: string): string {
  return value
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// Helper function to capitalize first letter of each word
function capitalizeFirstLetter(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to format phone number as (555) 123-4567
function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, '');
  
  // Apply formatting based on length
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
}

// Helper function to clean phone number (remove formatting)
function cleanPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}

// Zod schema with validation and normalization
const clientFormSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras")
    .transform(capitalizeFirstLetter),
  
  apellido: z
    .string()
    .min(1, "El apellido es obligatorio")
    .max(100, "El apellido no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras")
    .transform(capitalizeFirstLetter),
  
  email: z
    .string()
    .email({ message: "Formato de correo electrónico inválido" })
    .max(255, "El correo no puede exceder 255 caracteres")
    .transform((val) => val.toLowerCase())
    .optional()
    .or(z.literal("")),
  
  telefono_principal: z
    .string()
    .min(1, "El teléfono principal es obligatorio")
    .regex(/^\+\d+\d{10}$/, "El teléfono debe tener exactamente 10 dígitos"),
  
  telefono_adicional: z
    .string()
    .regex(/^(\+\d+\d{10})?$/, "El teléfono debe tener exactamente 10 dígitos")
    .optional()
    .or(z.literal("")),
  
  fuente_contacto: z
    .string()
    .min(1, "Debe seleccionar cómo se enteró de nosotros"),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess: () => void;
}

const ClientDialog = ({ open, onOpenChange, client, onSuccess }: ClientDialogProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ineFile, setIneFile] = useState<File | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { isAdmin, loading: roleLoading } = useUserRole();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      telefono_principal: "",
      telefono_adicional: "",
      fuente_contacto: "",
    },
  });

  useEffect(() => {
    if (client && open) {
      form.reset({
        nombre: client.nombre,
        apellido: client.apellido,
        email: client.email,
        telefono_principal: client.telefono_principal,
        telefono_adicional: client.telefono_adicional || "",
        fuente_contacto: client.fuente_contacto || "",
      });
      setEmailExists(false);
      setSearchQuery("");
      setSearchResults([]);
    } else if (!client && open) {
      form.reset({
        nombre: "",
        apellido: "",
        email: "",
        telefono_principal: "",
        telefono_adicional: "",
        fuente_contacto: "",
      });
      setIneFile(null);
      setEmailExists(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [client, open, form]);

  // Buscar clientes existentes (solo en modo creación)
  useEffect(() => {
    if (client || !open || !searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchingClients(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%`)
          .limit(5);

        if (error) throw error;

        setSearchResults(data || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error searching clients:", error);
        setSearchResults([]);
      } finally {
        setSearchingClients(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, client, open]);

  // Verificar si el email ya existe (con debounce)
  useEffect(() => {
    const email = form.watch("email");
    
    if (!email || !open) {
      setEmailExists(false);
      return;
    }

    // Si estamos editando, ignorar el email del cliente actual
    if (client && email.toLowerCase() === client.email.toLowerCase()) {
      setEmailExists(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, email")
          .ilike("email", email)
          .limit(1);

        if (error) throw error;

        setEmailExists(data && data.length > 0);
      } catch (error) {
        console.error("Error checking email:", error);
        setEmailExists(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [form.watch("email"), client, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Solo se permiten archivos PDF");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo no debe superar 5MB");
        return;
      }
      setIneFile(file);
    }
  };

  const uploadINE = async (clientId: string): Promise<string | null> => {
    if (!ineFile) return null;

    setUploading(true);
    const fileExt = "pdf";
    const fileName = `${clientId}_${Date.now()}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("ine-documents")
      .upload(filePath, ineFile);

    setUploading(false);

    if (uploadError) {
      toast.error("Error al subir el archivo");
      console.error(uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("ine-documents")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSelectExistingClient = (selectedClient: Client) => {
    form.reset({
      nombre: selectedClient.nombre,
      apellido: selectedClient.apellido,
      email: selectedClient.email,
      telefono_principal: selectedClient.telefono_principal,
      telefono_adicional: selectedClient.telefono_adicional || "",
      fuente_contacto: selectedClient.fuente_contacto || "",
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    toast.info("Datos del cliente cargados. Puedes modificarlos si lo necesitas.");
  };

  const handleViewClient = (clientId: string) => {
    onOpenChange(false);
    navigate(`/crm/${clientId}`);
  };

  const handleDelete = async () => {
    if (!client) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Cliente eliminado exitosamente. Todas las órdenes, citas, wish lists y recordatorios asociados también fueron eliminados.");
      onSuccess();
      onOpenChange(false);
      setShowDeleteAlert(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar cliente");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: ClientFormValues) => {
    setLoading(true);

    try {
      let documentUrl = client?.documento_id_url;

      if (client) {
        // Update existing client
        if (ineFile) {
          documentUrl = await uploadINE(client.id);
        }

        const { error } = await supabase
          .from("clients")
          .update({
            ...values,
            documento_id_url: documentUrl,
          })
          .eq("id", client.id);

        if (error) throw error;
        toast.success("Cliente actualizado exitosamente");
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert([{
            nombre: values.nombre,
            apellido: values.apellido,
            email: values.email || null,
            telefono_principal: values.telefono_principal,
            telefono_adicional: values.telefono_adicional || null,
            fuente_contacto: values.fuente_contacto,
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        if (ineFile && newClient) {
          documentUrl = await uploadINE(newClient.id);
          if (documentUrl) {
            await supabase
              .from("clients")
              .update({ documento_id_url: documentUrl })
              .eq("id", newClient.id);
          }
        }

        toast.success("Cliente creado exitosamente");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar cliente");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {client
              ? "Modifica la información del cliente"
              : "Completa los datos del nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        {/* Campo de Búsqueda Rápida (solo en modo creación) */}
        {!client && (
          <div className="space-y-2 pb-4 border-b">
            <label className="text-sm font-medium text-foreground">
              Buscar cliente existente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o apellido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {searchingClients && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Resultados de búsqueda */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="bg-muted rounded-md border border-border p-2 space-y-1">
                <p className="text-xs text-muted-foreground px-2 py-1">
                  Se encontraron {searchResults.length} cliente(s) con ese nombre:
                </p>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between gap-2 p-2 rounded hover:bg-background transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {result.nombre} {result.apellido}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.email} • {result.telefono_principal}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClient(result.id)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ver
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectExistingClient(result)}
                        className="h-8 px-2"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Cargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && !searchingClients && (
              <p className="text-sm text-muted-foreground px-2 py-1">
                No se encontraron clientes con ese nombre
              </p>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onKeyPress={(e) => {
                          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const capitalized = capitalizeAsYouType(e.target.value);
                          field.onChange(capitalized);
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido(s) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onKeyPress={(e) => {
                          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const capitalized = capitalizeAsYouType(e.target.value);
                          field.onChange(capitalized);
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="email"
                        placeholder="ejemplo@correo.com"
                        disabled={loading}
                        className={emailExists ? "border-destructive" : ""}
                      />
                      {checkingEmail && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {emailExists && (
                    <p className="text-sm font-medium text-destructive flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Este correo electrónico ya está registrado</span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono_principal"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Teléfono Principal *</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={loading}
                        defaultCountryCode="+52"
                        placeholder="5551234567"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono_adicional"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Teléfono Adicional</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={loading}
                        defaultCountryCode="+52"
                        placeholder="5551234567"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fuente_contacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Cómo se enteró de nosotros? *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una opción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="Recomendación">Recomendación</SelectItem>
                      <SelectItem value="Tienda física">Tienda física</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel htmlFor="ine">INE (PDF)</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="ine"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  disabled={loading || uploading}
                  className="flex-1"
                />
                {ineFile && (
                  <span className="text-sm text-muted-foreground">
                    {ineFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo 5MB. Solo archivos PDF.
              </p>
            </div>

            <div className="flex justify-between items-center gap-3 pt-4">
              {/* Botón de eliminar (solo visible para administradores y cuando se edita un cliente) */}
              {client && isAdmin() && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Cliente
                </Button>
              )}
              
              <div className="flex gap-3 ml-auto">
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
                  disabled={loading || uploading || !form.formState.isValid || emailExists}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading ? "Subiendo archivo..." : "Guardando..."}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {client ? "Actualizar" : "Crear"} Cliente
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Alert Dialog de Confirmación de Eliminación */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{" "}
              <span className="font-semibold">
                {client?.nombre} {client?.apellido}
              </span>{" "}
              y todos los registros asociados:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todas las órdenes de compra</li>
                <li>Todas las citas programadas</li>
                <li>Todas las wish lists</li>
                <li>Todos los recordatorios</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Definitivamente
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ClientDialog;
