import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LargeCalendar } from "@/components/public/LargeCalendar";
import { es } from "date-fns/locale";

import { IneCapture } from "@/components/public/IneCapture";
import { QRCodeSVG } from "qrcode.react";
import { useThemeInitializer } from "@/hooks/useThemeInitializer";
import { useIsMobileDevice } from "@/hooks/use-mobile-device";
import { dataUrlBase64 } from "@/lib/image-compression";
import {
  CONTACT_SOURCES,
  capitalizeAsYouType,
  clientBaseSchema,
} from "@/lib/client-schema";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  Loader2,
  MapPin,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";


const publicFormSchema = clientBaseSchema.extend({
  privacidad: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar el aviso de privacidad" }),
  }),
});

type PublicFormValues = z.infer<typeof publicFormSchema>;

interface BookingConfig {
  nombre: string;
  timezone: string;
  duracion_minutos: number;
  modalidad: string;
  direccion: string | null;
  privacy_version: string;
}

interface DayAvailability {
  date: string;
  slots: string[];
}

interface Confirmation {
  folio: string;
  fecha: string;
  nombre: string;
  sucursal: string;
  direccion: string | null;
  modalidad: string;
  timezone: string;
}

const STEPS = ["Datos", "Identificación", "Cita", "Confirmación"];

async function callBooking<T>(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("public-booking", {
    body: { action, ...payload },
  });
  if (error) {
    const details = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.text === "function") {
      try {
        const text = await ctx.clone().text();
        const parsed = JSON.parse(text);
        return {
          data: null as T | null,
          error: (parsed.error as string) ?? details,
          code: parsed.code as string | undefined,
        };
      } catch {
        /* keep default */
      }
    }
    return { data: null as T | null, error: details, code: undefined };
  }
  return { data: data as T, error: null as string | null, code: undefined };
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const PublicBooking = () => {
  const { ready: themeReady } = useThemeInitializer();
  const isMobileDevice = useIsMobileDevice();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sides, setSides] = useState<{ front: boolean; back: boolean }>({
    front: false,
    back: false,
  });
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notas, setNotas] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [showManualUpload, setShowManualUpload] = useState(false);

  const captureUrl = token ? `${window.location.origin}/captura-ine/${token}` : null;


  const form = useForm<PublicFormValues>({
    resolver: zodResolver(publicFormSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      telefono_principal: "",
      fuente_contacto: "",
      privacidad: false as unknown as true,
    },
  });

  useEffect(() => {
    document.title = "Agenda tu cita | Relevée";
    callBooking<BookingConfig>("config").then(({ data }) => {
      if (data) setConfig(data);
    });
  }, []);

  // Polls for photos uploaded from the phone via the QR flow (desktop only).
  useEffect(() => {
    if (isMobileDevice || step !== 1 || !token || (sides.front && sides.back)) return;
    let active = true;
    const poll = async () => {
      const { data } = await callBooking<{ front: boolean; back: boolean }>("document_status", {
        token,
      });
      if (active && data) setSides({ front: data.front, back: data.back });
    };
    const id = window.setInterval(poll, 4000);
    poll();
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [isMobileDevice, step, token, sides.front, sides.back]);

  // TEMP DEBUG: expose helpers for visual testing
  useEffect(() => {
    (window as unknown as { __publicBookingDebug?: Record<string, unknown> }).__publicBookingDebug = {
      setStep,
      setAvailability,
      setSelectedDay,
      setLoadingAvailability,
      goToCalendar: () => {
        const mockDays = [
          { date: "2026-08-24", slots: ["2026-08-24T10:00:00-06:00", "2026-08-24T11:00:00-06:00"] },
          { date: "2026-08-25", slots: ["2026-08-25T10:00:00-06:00", "2026-08-25T11:00:00-06:00"] },
        ];
        setAvailability(mockDays);
        setSelectedDay(mockDays[0].date);
        setLoadingAvailability(false);
        setStep(2);
      },
    };
  }, [setStep, setAvailability, setSelectedDay, setLoadingAvailability]);



  const timezone = config?.timezone ?? "America/Mexico_City";

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat("es-MX", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));

  const formatDayLabel = (dateKey: string) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    return new Intl.DateTimeFormat("es-MX", {
      timeZone: "UTC",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  };

  const parseDayKey = (dateKey: string) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const toDayKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;

  const availableDates = useMemo(
    () => availability.map((d) => parseDayKey(d.date)),
    [availability],
  );


  const slotsForDay = useMemo(
    () => availability.find((d) => d.date === selectedDay)?.slots ?? [],
    [availability, selectedDay],
  );

  const submitData = async (values: PublicFormValues) => {
    setSubmitting(true);
    setFormError(null);
    const { data, error } = await callBooking<{ token: string }>("register", {
      nombre: values.nombre,
      apellido: values.apellido,
      email: values.email,
      telefono_principal: values.telefono_principal,
      fuente_contacto: values.fuente_contacto,
      privacy_accepted: true,
    });
    setSubmitting(false);
    if (error || !data) {
      setFormError(error ?? "No pudimos guardar tus datos.");
      return;
    }
    setToken(data.token);
    setStep(1);
  };

  const uploadSide = async (side: "front" | "back", dataUrl: string) => {
    if (!token) return false;
    const { error } = await callBooking("upload_document", {
      token,
      side,
      mime_type: "image/jpeg",
      data: dataUrlBase64(dataUrl),
    });
    if (error) return false;
    setSides((prev) => ({ ...prev, [side]: true }));
    return true;
  };

  const loadAvailability = async () => {
    setLoadingAvailability(true);
    setFormError(null);
    const { data, error } = await callBooking<{ days: DayAvailability[] }>("availability");
    setLoadingAvailability(false);
    if (error || !data) {
      setFormError(error ?? "No pudimos cargar la disponibilidad.");
      return;
    }
    setAvailability(data.days);
    setSelectedDay(data.days[0]?.date ?? null);
    setSelectedSlot(null);
  };

  const goToCalendar = async () => {
    setStep(2);
    await loadAvailability();
  };

  const confirmBooking = async () => {
    if (!token || !selectedSlot) return;
    setSubmitting(true);
    setFormError(null);
    const { data, error, code } = await callBooking<Confirmation>("book", {
      token,
      slot: selectedSlot,
      notas,
    });
    setSubmitting(false);
    if (error || !data) {
      setFormError(error ?? "No pudimos confirmar tu cita.");
      if (code === "slot_taken") {
        setSelectedSlot(null);
        await loadAvailability();
      }
      return;
    }
    setConfirmation(data);
    setStep(3);
  };

  if (!themeReady) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto space-y-4 px-6 py-8">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-20 items-center justify-center px-6">
          <div className="flex h-full items-center justify-center">
            <img
              src="/images/relevee-logo.png"
              alt="Relevée"
              className="h-10 max-h-full w-auto object-contain dark:invert"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">Agenda tu cita</h1>
          <p className="text-muted-foreground">
            Completa tu registro y reserva el horario que mejor te acomode.
          </p>
        </div>

        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Paso {Math.min(step + 1, STEPS.length)} de {STEPS.length} · {STEPS[step]}
            </p>
            <Badge variant="secondary">
              {Math.round(((step + 1) / STEPS.length) * 100)}%
            </Badge>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>

        {formError && (
          <Alert className="mb-6">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {step === 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-foreground" />
                Tus datos
              </CardTitle>
              <CardDescription>
                Necesitamos estos datos para crear tu expediente.
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submitData)}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="given-name"
                              onChange={(e) =>
                                field.onChange(capitalizeAsYouType(e.target.value))
                              }
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
                              autoComplete="family-name"
                              onChange={(e) =>
                                field.onChange(capitalizeAsYouType(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefono_principal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono / WhatsApp *</FormLabel>
                          <FormControl>
                            <PhoneInput value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              inputMode="email"
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="privacidad"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <div className="flex items-start gap-3 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => field.onChange(checked === true)}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal">
                                Acepto el aviso de privacidad y el tratamiento de mis datos e
                                identificación oficial para fines de atención y seguimiento.
                              </FormLabel>
                              {config?.privacy_version && (
                                <p className="text-xs text-muted-foreground">
                                  Versión {config.privacy_version}
                                </p>
                              )}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fuente_contacto"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>¿Cómo se enteró de nosotros? *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONTACT_SOURCES.map((source) => (
                              <SelectItem key={source.value} value={source.value}>
                                {source.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continuar
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}

        {step === 1 && isMobileDevice && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-foreground" />
                Identificación oficial
              </CardTitle>
              <CardDescription>
                Toma una foto del frente y del reverso de tu INE con la cámara de este celular.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Tu identificación se guarda de forma privada y sólo puede consultarla el
                  personal autorizado de Relevée.
                </AlertDescription>
              </Alert>

              <IneCapture
                side="front"
                title="INE — Frente"
                hint="Coloca tu identificación sobre una superficie plana y captura el frente completo."
                uploaded={sides.front}
                preferCamera
                onUpload={(dataUrl) => uploadSide("front", dataUrl)}
              />
              <IneCapture
                side="back"
                title="INE — Reverso"
                hint="Ahora captura el reverso, cuidando que se lea con claridad."
                uploaded={sides.back}
                preferCamera
                onUpload={(dataUrl) => uploadSide("back", dataUrl)}
              />
            </CardContent>
            <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                type="button"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Regresar
              </Button>
              <Button
                onClick={goToCalendar}
                disabled={!sides.front || !sides.back}
                className="w-full sm:w-auto"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Continuar a elegir cita
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 1 && !isMobileDevice && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-foreground" />
                Identificación oficial
              </CardTitle>
              <CardDescription>
                Escanea el código QR con tu celular para tomar las fotos del frente y el reverso de
                tu INE.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Tu identificación se guarda de forma privada y sólo puede consultarla el
                  personal autorizado de Relevée.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-4">
                  {captureUrl ? (
                    <div className="rounded-md bg-background p-2">
                      <QRCodeSVG value={captureUrl} size={188} level="M" includeMargin={false} />
                    </div>
                  ) : (
                    <Skeleton className="h-[204px] w-[204px]" />
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Válido sólo para este registro
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                      <div>
                        <p className="text-sm font-medium">1. Abre la cámara de tu celular</p>
                        <p className="text-sm text-muted-foreground">
                          Escanea el código y abre el enlace que aparece.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Camera className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                      <div>
                        <p className="text-sm font-medium">2. Toma las dos fotos</p>
                        <p className="text-sm text-muted-foreground">
                          Frente y reverso de tu INE, con buena luz y sin reflejos.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                      <div>
                        <p className="text-sm font-medium">3. Regresa a esta pantalla</p>
                        <p className="text-sm text-muted-foreground">
                          Se actualiza sola en cuanto recibamos tus fotos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {(["front", "back"] as const).map((side) => (
                      <div
                        key={side}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <span className="text-sm">
                          {side === "front" ? "INE — Frente" : "INE — Reverso"}
                        </span>
                        {sides[side] ? (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="h-3.5 w-3.5" /> Recibida
                          </Badge>
                        ) : (
                          <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Esperando foto
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="px-0"
                    onClick={() => setShowManualUpload((v) => !v)}
                  >
                    {showManualUpload
                      ? "Ocultar carga desde esta computadora"
                      : "¿Sin celular? Subir archivos desde esta computadora"}
                  </Button>
                </div>
              </div>

              {showManualUpload && (
                <div className="grid gap-4 md:grid-cols-2">
                  <IneCapture
                    side="front"
                    title="INE — Frente"
                    hint="Sube una imagen clara del frente de tu identificación."
                    uploaded={sides.front}
                    onUpload={(dataUrl) => uploadSide("front", dataUrl)}
                  />
                  <IneCapture
                    side="back"
                    title="INE — Reverso"
                    hint="Sube una imagen clara del reverso de tu identificación."
                    uploaded={sides.back}
                    onUpload={(dataUrl) => uploadSide("back", dataUrl)}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setStep(0)} type="button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Regresar
              </Button>
              <Button onClick={goToCalendar} disabled={!sides.front || !sides.back}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Continuar a elegir cita
              </Button>
            </CardFooter>
          </Card>
        )}



        {step === 2 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-foreground" />
                Selecciona tu cita
              </CardTitle>
              <CardDescription>Elige el día y horario que mejor te acomode.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAvailability ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6 items-start">
                  <Skeleton className="h-[380px] w-full" />
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ) : availability.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Por ahora no hay horarios disponibles. Inténtalo más tarde.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6 items-start">
                  <div className="space-y-3">
                    <Label className="text-base">Día</Label>
                    <div className="flex justify-center rounded-md border border-border p-2">
                      <LargeCalendar
                        mode="single"
                        locale={es}
                        selected={selectedDay ? parseDayKey(selectedDay) : undefined}
                        defaultMonth={
                          selectedDay ? parseDayKey(selectedDay) : availableDates[0]
                        }
                        onSelect={(date) => {
                          if (!date) return;
                          setSelectedDay(toDayKey(date));
                          setSelectedSlot(null);
                        }}
                        disabled={(date) =>
                          !availability.some((d) => d.date === toDayKey(date))
                        }
                        fromDate={availableDates[0]}
                        toDate={availableDates[availableDates.length - 1]}
                        initialFocus
                      />
                    </div>
                    {selectedDay && (
                      <p className="text-sm text-muted-foreground">
                        {formatDayLabel(selectedDay)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-3">
                      <Label className="text-base">Horario</Label>
                      {slotsForDay.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No hay horarios disponibles para este día.
                        </p>
                      ) : (
                        <ToggleGroup
                          type="single"
                          value={selectedSlot ?? ""}
                          onValueChange={(value) => value && setSelectedSlot(value)}
                          className="grid grid-cols-2 gap-2"
                        >
                          {slotsForDay.map((slot) => (
                            <ToggleGroupItem
                              key={slot}
                              value={slot}
                              variant="outline"
                              className="h-11 justify-center text-sm"
                            >
                              {formatTime(slot)}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notas">¿Algo que debamos saber? (opcional)</Label>
                      <Textarea
                        id="notas"
                        value={notas}
                        maxLength={500}
                        onChange={(e) => setNotas(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                type="button"
                disabled={submitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Regresar
              </Button>
              <Button onClick={confirmBooking} disabled={!selectedSlot || submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar cita
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && confirmation && (
          <Card className="border-border">
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border">
                <Check className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">Tu cita está confirmada</CardTitle>
              <CardDescription>Te esperamos, {confirmation.nombre}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-md border p-4">
                <DetailRow label="Folio" value={confirmation.folio} />
                <Separator />
                <DetailRow
                  label="Fecha"
                  value={new Intl.DateTimeFormat("es-MX", {
                    timeZone: confirmation.timezone,
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(confirmation.fecha))}
                />
                <DetailRow
                  label="Hora"
                  value={new Intl.DateTimeFormat("es-MX", {
                    timeZone: confirmation.timezone,
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }).format(new Date(confirmation.fecha))}
                />
                <DetailRow label="Sucursal" value={confirmation.sucursal} />
                <DetailRow
                  label="Modalidad"
                  value={confirmation.modalidad === "virtual" ? "Virtual" : "Presencial"}
                />
                {confirmation.direccion && (
                  <div className="flex items-start gap-2 pt-1 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{confirmation.direccion}</span>
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Guarda tu folio para cualquier cambio o cancelación.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PublicBooking;
