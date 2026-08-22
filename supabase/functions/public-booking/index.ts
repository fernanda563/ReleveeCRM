import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  BookingSettings,
  capitalizeName,
  CalendarConnection,
  fetchBusyIntervals,
  generateFolio,
  generateSlots,
  getAccessToken,
  isSlotFree,
  lastTenDigits,
  utcToZonedParts,
} from "../_shared/booking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// --- lightweight in-memory rate limiting (per isolate) ---
const hits = new Map<string, number[]>();
function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > limit;
}

const registerSchema = z.object({
  nombre: z.string().trim().min(1).max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/),
  apellido: z.string().trim().min(1).max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/),
  email: z.string().trim().email().max(255),
  telefono_principal: z.string().trim().regex(/^\+\d{1,3}\d{10}$/),
  fuente_contacto: z.string().trim().min(1).max(50),
  privacy_accepted: z.literal(true),
});

const documentSchema = z.object({
  token: z.string().uuid(),
  side: z.enum(["front", "back"]),
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().min(100).max(12_000_000),
});

const availabilitySchema = z.object({
  from: z.string().optional(),
  days: z.number().int().min(1).max(60).optional(),
});

const bookSchema = z.object({
  token: z.string().uuid(),
  slot: z.string().datetime(),
  notas: z.string().trim().max(500).optional().or(z.literal("")),
});

async function loadSettings(): Promise<BookingSettings | null> {
  const { data } = await supabaseAdmin
    .from("public_booking_settings")
    .select("*")
    .eq("activo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as BookingSettings) ?? null;
}

async function loadConnection(settings: BookingSettings): Promise<CalendarConnection | null> {
  let query = supabaseAdmin
    .from("google_calendar_connections")
    .select("id, calendar_id, access_token, refresh_token, token_expires_at")
    .eq("is_active", true);

  if (settings.calendar_connection_id) query = query.eq("id", settings.calendar_connection_id);

  const { data } = await query.limit(1).maybeSingle();
  return (data as CalendarConnection) ?? null;
}

async function busyIntervals(
  settings: BookingSettings,
  from: Date,
  to: Date,
): Promise<Array<{ start: number; end: number }>> {
  const busy: Array<{ start: number; end: number }> = [];

  // Appointments already stored in the CRM
  const { data: appts } = await supabaseAdmin
    .from("appointments")
    .select("fecha, duracion_minutos, estado")
    .gte("fecha", from.toISOString())
    .lte("fecha", to.toISOString())
    .neq("estado", "cancelada");

  for (const a of appts ?? []) {
    const start = new Date(a.fecha).getTime();
    busy.push({ start, end: start + (a.duracion_minutos ?? settings.duracion_minutos) * 60_000 });
  }

  // Google Calendar free/busy (no event details ever leave the server)
  const connection = await loadConnection(settings);
  if (connection) {
    try {
      const token = await getAccessToken(supabaseAdmin, connection);
      const googleBusy = await fetchBusyIntervals(token, connection.calendar_id, from, to);
      busy.push(...googleBusy);
    } catch (err) {
      console.error("Google availability error:", err instanceof Error ? err.message : err);
    }
  }

  return busy;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? (await req.clone().json().catch(() => ({}))).action;

    const settings = await loadSettings();
    if (!settings) return json({ error: "El agendamiento en línea no está disponible." }, 503);

    if (action === "config") {
      return json({
        nombre: settings.nombre,
        timezone: settings.timezone,
        duracion_minutos: settings.duracion_minutos,
        modalidad: settings.modalidad,
        direccion: settings.direccion,
        privacy_version: settings.privacy_version,
        max_dias_adelante: settings.max_dias_adelante,
        dias_disponibles: settings.dias_disponibles,
      });
    }

    if (action === "register") {
      if (rateLimited(`reg:${ip}`, 8, 10 * 60_000)) {
        return json({ error: "Demasiados intentos. Intenta más tarde." }, 429);
      }

      const parsed = registerSchema.safeParse(await req.json());
      if (!parsed.success) {
        return json({ error: "Datos inválidos", fields: parsed.error.flatten().fieldErrors }, 400);
      }

      const input = parsed.data;
      const nombre = capitalizeName(input.nombre);
      const apellido = capitalizeName(input.apellido);
      const email = input.email.toLowerCase();
      const phone10 = lastTenDigits(input.telefono_principal);

      // Server-side deduplication (never exposes existing client data)
      const { data: byEmail } = await supabaseAdmin
        .from("clients")
        .select("id, email, telefono_principal")
        .ilike("email", email)
        .limit(2);

      const { data: byPhone } = await supabaseAdmin
        .from("clients")
        .select("id, email, telefono_principal")
        .ilike("telefono_principal", `%${phone10}`)
        .limit(2);

      const matches = new Map<string, { id: string }>();
      for (const c of [...(byEmail ?? []), ...(byPhone ?? [])]) matches.set(c.id, c);

      let clientId: string;
      let isExisting = false;

      if (matches.size === 1) {
        clientId = [...matches.values()][0].id;
        isExisting = true;
        await supabaseAdmin
          .from("clients")
          .update({
            privacy_accepted_at: new Date().toISOString(),
            privacy_policy_version: settings.privacy_version,
          })
          .eq("id", clientId);
      } else if (matches.size > 1) {
        // Ambiguous: reuse the email match and flag for internal review
        clientId = (byEmail?.[0] ?? [...matches.values()][0]).id;
        isExisting = true;
        await supabaseAdmin.from("client_duplicate_reviews").insert({
          client_id: clientId,
          matched_client_id: [...matches.keys()].find((id) => id !== clientId) ?? null,
          match_reason: "public_registration_ambiguous_match",
          payload: { email, phone_last10: phone10, nombre, apellido },
        });
      } else {
        const { data: created, error: insertError } = await supabaseAdmin
          .from("clients")
          .insert({
            nombre,
            apellido,
            email,
            telefono_principal: input.telefono_principal,
            fuente_contacto: input.fuente_contacto,
            registration_channel: "public_self_service",
            privacy_accepted_at: new Date().toISOString(),
            privacy_policy_version: settings.privacy_version,
          })
          .select("id")
          .single();

        if (insertError || !created) {
          console.error("Client insert failed:", insertError);
          return json({ error: "No pudimos guardar tus datos. Intenta de nuevo." }, 500);
        }
        clientId = created.id;
      }

      const { data: session, error: sessionError } = await supabaseAdmin
        .from("public_registration_sessions")
        .insert({ client_id: clientId })
        .select("token, expires_at")
        .single();

      if (sessionError || !session) {
        console.error("Session insert failed:", sessionError);
        return json({ error: "No pudimos iniciar tu registro." }, 500);
      }

      return json({ token: session.token, expires_at: session.expires_at, existing: isExisting });
    }

    // --- actions below require a valid registration session ---
    const body = ["upload_document", "book", "document_status"].includes(action)
      ? await req.json()
      : {};

    async function resolveSession(token: string) {
      const { data } = await supabaseAdmin
        .from("public_registration_sessions")
        .select("id, client_id, expires_at")
        .eq("token", token)
        .maybeSingle();
      if (!data) return null;
      if (new Date(data.expires_at) < new Date()) return null;
      return data;
    }

    if (action === "upload_document") {
      if (rateLimited(`doc:${ip}`, 20, 10 * 60_000)) {
        return json({ error: "Demasiadas cargas. Intenta más tarde." }, 429);
      }

      const parsed = documentSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Archivo inválido" }, 400);

      const session = await resolveSession(parsed.data.token);
      if (!session) return json({ error: "Tu sesión expiró. Vuelve a comenzar." }, 401);

      const base64 = parsed.data.data.replace(/^data:[^;]+;base64,/, "");
      let bytes: Uint8Array;
      try {
        const binary = atob(base64);
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      } catch {
        return json({ error: "No pudimos leer la imagen." }, 400);
      }
      if (bytes.length > 8 * 1024 * 1024) return json({ error: "La imagen es demasiado grande." }, 400);

      const ext = parsed.data.mime_type.split("/")[1];
      const path = `${session.client_id}/ine-${parsed.data.side}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("client-documents")
        .upload(path, bytes, { contentType: parsed.data.mime_type, upsert: false });

      if (uploadError) {
        console.error("Storage upload failed:", uploadError);
        return json({ error: "No pudimos subir la imagen. Intenta de nuevo." }, 500);
      }

      await supabaseAdmin
        .from("client_documents")
        .update({ status: "replaced" })
        .eq("client_id", session.client_id)
        .eq("document_type", "ine")
        .eq("document_side", parsed.data.side)
        .neq("status", "replaced");

      const { error: docError } = await supabaseAdmin.from("client_documents").insert({
        client_id: session.client_id,
        document_type: "ine",
        document_side: parsed.data.side,
        storage_path: path,
        mime_type: parsed.data.mime_type,
        status: "uploaded",
        source: "public_self_service",
      });

      if (docError) {
        console.error("Document insert failed:", docError);
        return json({ error: "No pudimos registrar el documento." }, 500);
      }

      return json({ ok: true, side: parsed.data.side });
    }

    if (action === "document_status") {
      if (rateLimited(`status:${ip}`, 300, 10 * 60_000)) {
        return json({ error: "Demasiadas consultas. Intenta más tarde." }, 429);
      }

      const parsedToken = z.object({ token: z.string().uuid() }).safeParse(body);
      if (!parsedToken.success) return json({ error: "Sesión inválida" }, 400);

      const session = await resolveSession(parsedToken.data.token);
      if (!session) return json({ error: "Tu sesión expiró. Vuelve a comenzar." }, 401);

      const { data: docs } = await supabaseAdmin
        .from("client_documents")
        .select("document_side")
        .eq("client_id", session.client_id)
        .eq("document_type", "ine")
        .neq("status", "replaced");

      const sidesFound = new Set((docs ?? []).map((d) => d.document_side));
      return json({ front: sidesFound.has("front"), back: sidesFound.has("back") });
    }



    if (action === "availability") {
      if (rateLimited(`avail:${ip}`, 60, 10 * 60_000)) {
        return json({ error: "Demasiadas consultas. Intenta más tarde." }, 429);
      }

      const parsed = availabilitySchema.safeParse(await req.json().catch(() => ({})));
      const days = parsed.success && parsed.data.days ? parsed.data.days : settings.max_dias_adelante;

      const from = new Date(Date.now() + settings.anticipacion_minima_minutos * 60_000);
      const to = new Date(Date.now() + Math.min(days, settings.max_dias_adelante) * 86_400_000);

      const busy = await busyIntervals(settings, from, to);
      const slots = generateSlots(settings, from, to).filter((s) => isSlotFree(s, settings, busy));

      const byDay: Record<string, string[]> = {};
      for (const slot of slots) {
        const parts = utcToZonedParts(slot, settings.timezone);
        (byDay[parts.dateKey] ??= []).push(slot.toISOString());
      }

      return json({
        timezone: settings.timezone,
        duracion_minutos: settings.duracion_minutos,
        days: Object.entries(byDay).map(([date, slotList]) => ({ date, slots: slotList })),
      });
    }

    if (action === "book") {
      if (rateLimited(`book:${ip}`, 10, 10 * 60_000)) {
        return json({ error: "Demasiados intentos. Intenta más tarde." }, 429);
      }

      const parsed = bookSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Datos de cita inválidos" }, 400);

      const session = await resolveSession(parsed.data.token);
      if (!session) return json({ error: "Tu sesión expiró. Vuelve a comenzar." }, 401);

      const slot = new Date(parsed.data.slot);
      const minStart = new Date(Date.now() + settings.anticipacion_minima_minutos * 60_000);
      const maxStart = new Date(Date.now() + settings.max_dias_adelante * 86_400_000);

      if (slot < minStart || slot > maxStart) {
        return json({ error: "Ese horario ya no está disponible. Selecciona otro horario.", code: "slot_taken" }, 409);
      }

      // Re-validate against the configured window and live availability
      const windowFrom = new Date(slot.getTime() - 60_000);
      const windowTo = new Date(slot.getTime() + settings.duracion_minutos * 60_000 + 60_000);
      const validSlots = generateSlots(settings, minStart, maxStart).map((s) => s.getTime());
      if (!validSlots.includes(slot.getTime())) {
        return json({ error: "Ese horario ya no está disponible. Selecciona otro horario.", code: "slot_taken" }, 409);
      }

      const busy = await busyIntervals(settings, windowFrom, windowTo);
      if (!isSlotFree(slot, settings, busy)) {
        return json({ error: "Este horario acaba de dejar de estar disponible. Selecciona otro horario.", code: "slot_taken" }, 409);
      }

      const connection = await loadConnection(settings);
      const folio = generateFolio();

      // The unique index on (calendar_connection_id, fecha) is the final race guard
      const { data: appointment, error: apptError } = await supabaseAdmin
        .from("appointments")
        .insert({
          client_id: session.client_id,
          tipo: settings.modalidad === "virtual" ? "virtual" : "presencial",
          fecha: slot.toISOString(),
          duracion_minutos: settings.duracion_minutos,
          notas: parsed.data.notas || null,
          origen: "public_self_service",
          folio,
          calendar_connection_id: connection?.id ?? null,
        })
        .select("id, fecha, folio")
        .single();

      if (apptError) {
        if ((apptError as { code?: string }).code === "23505") {
          return json({ error: "Este horario acaba de dejar de estar disponible. Selecciona otro horario.", code: "slot_taken" }, 409);
        }
        console.error("Appointment insert failed:", apptError);
        return json({ error: "No pudimos reservar tu cita. Intenta de nuevo." }, 500);
      }

      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("nombre, apellido, email, telefono_principal")
        .eq("id", session.client_id)
        .single();

      if (connection) {
        try {
          const token = await getAccessToken(supabaseAdmin, connection);
          const end = new Date(slot.getTime() + settings.duracion_minutos * 60_000);
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                summary: `Cita ${client?.nombre ?? ""} ${client?.apellido ?? ""} (${folio})`,
                description: [
                  `Folio: ${folio}`,
                  `Cliente: ${client?.nombre ?? ""} ${client?.apellido ?? ""}`,
                  `Tel: ${client?.telefono_principal ?? ""}`,
                  `Email: ${client?.email ?? ""}`,
                  "Origen: auto-registro público",
                  parsed.data.notas ? `Notas: ${parsed.data.notas}` : "",
                ].filter(Boolean).join("\n"),
                location: settings.direccion ?? undefined,
                start: { dateTime: slot.toISOString(), timeZone: settings.timezone },
                end: { dateTime: end.toISOString(), timeZone: settings.timezone },
              }),
            },
          );
          const text = await response.text();
          if (!response.ok) {
            console.error(`Google event creation failed [${response.status}]: ${text}`);
          } else {
            const event = JSON.parse(text);
            await supabaseAdmin
              .from("appointments")
              .update({ google_event_id: event.id })
              .eq("id", appointment.id);
          }
        } catch (err) {
          console.error("Google event error:", err instanceof Error ? err.message : err);
        }
      }

      return json({
        folio: appointment.folio,
        fecha: appointment.fecha,
        duracion_minutos: settings.duracion_minutos,
        nombre: `${client?.nombre ?? ""} ${client?.apellido ?? ""}`.trim(),
        sucursal: settings.nombre,
        direccion: settings.direccion,
        modalidad: settings.modalidad,
        timezone: settings.timezone,
      });
    }

    return json({ error: "Acción inválida" }, 400);
  } catch (error) {
    console.error("public-booking error:", error);
    return json({ error: "Ocurrió un error inesperado." }, 500);
  }
});
