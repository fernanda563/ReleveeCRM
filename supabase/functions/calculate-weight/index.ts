import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import {
  ALLOYS,
  CUT_FACTORS,
  SIZE_MAP,
  calcMetal,
  calcPiece,
  calcStone,
} from "../_shared/weight-math.ts";

const metalSchema = z.object({
  size: z.number().min(1).max(40),
  width: z.number().min(0.1).max(30),
  thickness: z.number().min(0.1).max(10),
  alloy: z.string().min(1).max(10),
  pieceCount: z.number().int().min(1).max(200).optional(),
});

const stoneSchema = z.object({
  cut: z.string().min(1).max(30),
  diameter: z.number().min(0.1).max(60).optional(),
  length: z.number().min(0.1).max(60).optional(),
  width: z.number().min(0.1).max(60).optional(),
  depth: z.number().min(0.1).max(60),
  stoneCount: z.number().int().min(0).max(1000).optional(),
});

const bodySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("metal"), metal: metalSchema }),
  z.object({ mode: z.literal("stone"), stone: stoneSchema }),
  z.object({ mode: z.literal("piece"), metal: metalSchema, stone: stoneSchema.nullable().optional() }),
  z.object({ mode: z.literal("constants") }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // Validación de sesión (verify_jwt = false por defecto en Lovable Cloud)
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "No autorizado" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "No autorizado" }, 401);
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten() }, 400);
    }
    const body = parsed.data;

    if (body.mode === "constants") {
      return json({ sizeMap: SIZE_MAP, alloys: ALLOYS, cuts: CUT_FACTORS });
    }
    if (body.mode === "metal") {
      return json({ result: calcMetal(body.metal) });
    }
    if (body.mode === "stone") {
      return json({ result: calcStone(body.stone) });
    }
    return json({ result: calcPiece({ metal: body.metal, stone: body.stone ?? null }) });
  } catch (error) {
    console.error("calculate-weight error", error);
    return json({ error: "Error al calcular el peso" }, 500);
  }
});
