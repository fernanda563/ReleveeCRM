import { supabase } from "@/integrations/supabase/client";

/** Invokes the public-booking edge function and normalizes its error payloads. */
export async function callBooking<T>(action: string, payload: Record<string, unknown> = {}) {
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
