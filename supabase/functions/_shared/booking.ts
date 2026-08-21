// Shared helpers for the public booking flow (timezone math + Google Calendar access)

export function getTimeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = parseInt(p.value, 10);
  }
  const asUtc = Date.UTC(
    map.year,
    (map.month ?? 1) - 1,
    map.day,
    map.hour === 24 ? 0 : map.hour,
    map.minute,
    map.second,
  );
  return asUtc - utcMs;
}

/** Convert a wall-clock time in `timeZone` to a UTC Date. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let offset = getTimeZoneOffsetMs(guess, timeZone);
  let result = guess - offset;
  offset = getTimeZoneOffsetMs(result, timeZone);
  result = guess - offset;
  return new Date(result);
}

/** Local (timeZone) calendar parts for an instant. */
export function utcToZonedParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour === "24" ? "0" : map.hour, 10),
    minute: parseInt(map.minute, 10),
    weekday: weekdayMap[map.weekday] ?? 0,
    dateKey: `${map.year}-${map.month}-${map.day}`,
  };
}

export function parseHm(value: string): { h: number; m: number } {
  const [h, m] = value.split(":").map((v) => parseInt(v, 10));
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
}

export interface CalendarConnection {
  id: string;
  calendar_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

/** Returns a valid access token, refreshing and persisting it when expired. */
export async function getAccessToken(
  supabaseAdmin: any,
  connection: CalendarConnection,
): Promise<string> {
  if (new Date(connection.token_expires_at) > new Date(Date.now() + 60_000)) {
    return connection.access_token;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Google token refresh failed [${response.status}]: ${body}`);
  }
  const tokens = JSON.parse(body);
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

  await supabaseAdmin
    .from("google_calendar_connections")
    .update({ access_token: tokens.access_token, token_expires_at: expiresAt })
    .eq("id", connection.id);

  return tokens.access_token;
}

/** Busy intervals only — never event details. */
export async function fetchBusyIntervals(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<Array<{ start: number; end: number }>> {
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Google freeBusy failed [${response.status}]: ${text}`);
  }
  const data = JSON.parse(text);
  const busy = data?.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b: { start: string; end: string }) => ({
    start: new Date(b.start).getTime(),
    end: new Date(b.end).getTime(),
  }));
}

export interface BookingSettings {
  id: string;
  nombre: string;
  calendar_connection_id: string | null;
  timezone: string;
  dias_disponibles: number[];
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  intervalo_minutos: number;
  buffer_minutos: number;
  anticipacion_minima_minutos: number;
  max_dias_adelante: number;
  direccion: string | null;
  modalidad: string;
  privacy_version: string;
}

/** Generates candidate slots (UTC instants) inside the configured window. */
export function generateSlots(settings: BookingSettings, from: Date, to: Date): Date[] {
  const tz = settings.timezone;
  const { h: startH, m: startM } = parseHm(settings.hora_inicio);
  const { h: endH, m: endM } = parseHm(settings.hora_fin);
  const slots: Date[] = [];

  const cursor = new Date(from.getTime());
  const seenDays = new Set<string>();

  for (let i = 0; i < 120; i++) {
    const parts = utcToZonedParts(cursor, tz);
    if (cursor.getTime() > to.getTime()) break;
    if (!seenDays.has(parts.dateKey)) {
      seenDays.add(parts.dateKey);
      if (settings.dias_disponibles.includes(parts.weekday)) {
        const dayStart = zonedTimeToUtc(parts.year, parts.month, parts.day, startH, startM, tz);
        const dayEnd = zonedTimeToUtc(parts.year, parts.month, parts.day, endH, endM, tz);
        for (
          let t = dayStart.getTime();
          t + settings.duracion_minutos * 60_000 <= dayEnd.getTime();
          t += settings.intervalo_minutos * 60_000
        ) {
          if (t >= from.getTime() && t <= to.getTime()) slots.push(new Date(t));
        }
      }
    }
    cursor.setTime(cursor.getTime() + 12 * 60 * 60 * 1000);
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}

export function isSlotFree(
  slot: Date,
  settings: BookingSettings,
  busy: Array<{ start: number; end: number }>,
): boolean {
  const buffer = settings.buffer_minutos * 60_000;
  const start = slot.getTime() - buffer;
  const end = slot.getTime() + settings.duracion_minutos * 60_000 + buffer;
  return !busy.some((b) => start < b.end && end > b.start);
}

export function normalizePhone(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

export function lastTenDigits(raw: string): string {
  const digits = normalizePhone(raw);
  return digits.slice(-10);
}

export function capitalizeName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function generateFolio(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `RLV-${out}`;
}
