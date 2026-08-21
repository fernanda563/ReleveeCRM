import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { IneCapture } from "@/components/public/IneCapture";
import { dataUrlBase64 } from "@/lib/image-compression";
import {
  CONTACT_SOURCES,
  capitalizeAsYouType,
  clientBaseSchema,
} from "@/lib/client-schema";
import { Check, CalendarDays, Loader2, MapPin, ShieldCheck } from "lucide-react";

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
    let details = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.text === "function") {
      try {
        const text = await ctx.clone().text();
        const parsed = JSON.parse(text);
        return { data: null as T | null, error: parsed.error ?? details, code: parsed.code as string | undefined };
      } catch {
        /* keep default */
      }
    }
    return { data: null as T | null, error: details, code: undefined };
  }
  return { data: data as T, error: null as string | null, code: undefined };
}

const PublicBooking = () => {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sides, setSides] = useState<{ front: boolean; back: boolean }>({ front: false, back: false });
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notas, setNotas] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-5 pb-16 pt-8 sm:max-w-2xl sm:px-8 sm:pt-12 lg:max-w-3xl lg:pt-16">
        <header className="mb-8 text-center sm:mb-10">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Relevée</p>
          <h1 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
            Agenda tu cita
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Registro y reserva en unos minutos, desde cualquier dispositivo.
          </p>
        </header>

        {/* Progress */}
        <ol className="mb-8 flex items-center gap-2 sm:gap-4" aria-label="Progreso">
          {STEPS.map((label, index) => (
            <li key={label} className="flex-1">
              <div
                className={`h-1 rounded-full ${index <= step ? "bg-foreground" : "bg-muted"}`}
                aria-current={index === step ? "step" : undefined}
              />
              <span className="mt-2 block text-[11px] text-muted-foreground sm:text-xs">{`${index + 1} ${label}`}</span>
            </li>
          ))}
        </ol>

        {formError && (
          <div className="mb-5 rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground">
            {formError}
          </div>
        )}

        {/* Step 1 — datos */}
        {step === 0 && (
          <Card>
            <CardHeader className="hidden sm:block">
              <CardTitle>Tus datos</CardTitle>
              <CardDescription>Necesitamos estos datos para crear tu expediente.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 sm:pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitData)} className="space-y-5 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">

              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-12 text-base"
                        autoComplete="given-name"
                        onChange={(e) => field.onChange(capitalizeAsYouType(e.target.value))}
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
                        className="h-12 text-base"
                        autoComplete="family-name"
                        onChange={(e) => field.onChange(capitalizeAsYouType(e.target.value))}
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
                    <FormLabel>Correo electrónico *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        className="h-12 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuente_contacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Cómo se enteró de nosotros? *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
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

              <FormField
                control={form.control}
                name="privacidad"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                      <FormControl>
                        <Checkbox
                          checked={!!field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div>
                        <p className="text-sm text-foreground">
                          Acepto el aviso de privacidad y el tratamiento de mis datos e identificación
                          oficial para fines de atención y seguimiento.
                        </p>
                        {config?.privacy_version && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Versión {config.privacy_version}
                          </p>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="h-12 w-full text-base" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>
            </form>
          </Form>
        )}

        {/* Step 2 — INE */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
              <p className="text-sm text-muted-foreground">
                Tu identificación se guarda de forma privada y sólo puede consultarla el personal
                autorizado de Relevée.
              </p>
            </div>

            <IneCapture
              side="front"
              title="INE — Frente"
              hint="Coloca tu identificación sobre una superficie plana y captura el frente completo."
              uploaded={sides.front}
              onUpload={(dataUrl) => uploadSide("front", dataUrl)}
            />

            <IneCapture
              side="back"
              title="INE — Reverso"
              hint="Ahora captura el reverso, cuidando que se lea con claridad."
              uploaded={sides.back}
              onUpload={(dataUrl) => uploadSide("back", dataUrl)}
            />

            <Button
              className="h-12 w-full text-base"
              onClick={goToCalendar}
              disabled={!sides.front || !sides.back}
            >
              <CalendarDays className="mr-2 h-4 w-4" /> Continuar a elegir cita
            </Button>
          </div>
        )}

        {/* Step 3 — calendario */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-medium text-foreground">Selecciona tu cita</h2>

            {loadingAvailability ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availability.length === 0 ? (
              <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                Por ahora no hay horarios disponibles. Inténtalo más tarde.
              </div>
            ) : (
              <>
                <div className="-mx-5 overflow-x-auto px-5">
                  <div className="flex gap-2 pb-2">
                    {availability.map((day) => (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => {
                          setSelectedDay(day.date);
                          setSelectedSlot(null);
                        }}
                        className={`min-w-[92px] rounded-lg border px-3 py-3 text-sm ${
                          selectedDay === day.date
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-foreground"
                        }`}
                      >
                        {formatDayLabel(day.date)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {slotsForDay.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`h-12 rounded-lg border text-base ${
                        selectedSlot === slot
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground"
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground" htmlFor="notas">
                    ¿Algo que debamos saber? (opcional)
                  </label>
                  <Textarea
                    id="notas"
                    value={notas}
                    maxLength={500}
                    onChange={(e) => setNotas(e.target.value)}
                    className="min-h-[88px] text-base"
                  />
                </div>

                <Button
                  className="h-12 w-full text-base"
                  onClick={confirmBooking}
                  disabled={!selectedSlot || submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar cita
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 4 — confirmación */}
        {step === 3 && confirmation && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border">
              <Check className="h-7 w-7 text-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Tu cita está confirmada</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Te esperamos, {confirmation.nombre}.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-5 text-left">
              <Row label="Folio" value={confirmation.folio} />
              <Row
                label="Fecha"
                value={new Intl.DateTimeFormat("es-MX", {
                  timeZone: confirmation.timezone,
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(confirmation.fecha))}
              />
              <Row
                label="Hora"
                value={new Intl.DateTimeFormat("es-MX", {
                  timeZone: confirmation.timezone,
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).format(new Date(confirmation.fecha))}
              />
              <Row label="Sucursal" value={confirmation.sucursal} />
              <Row label="Modalidad" value={confirmation.modalidad === "virtual" ? "Virtual" : "Presencial"} />
              {confirmation.direccion && (
                <div className="flex items-start gap-2 pt-1 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{confirmation.direccion}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Guarda tu folio para cualquier cambio o cancelación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className="text-right text-sm font-medium text-foreground">{value}</span>
  </div>
);

export default PublicBooking;
