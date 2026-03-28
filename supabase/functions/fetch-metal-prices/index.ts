import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PURITY_MAP: Record<string, Record<string, number>> = {
  oro: {
    "24k": 1.0,
    "18k": 0.75,
    "14k": 0.585,
    "10k": 0.417,
  },
  plata: {
    "925": 0.925,
    "950": 0.95,
  },
  platino: {
    "950": 0.95,
  },
};

const METAL_API_KEYS: Record<string, string> = {
  oro: "gold",
  plata: "silver",
  platino: "platinum",
};

const METAL_LABELS: Record<string, string> = {
  oro: "Oro",
  plata: "Plata",
  platino: "Platino",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("METALS_DEV_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "METALS_DEV_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch metal prices
    const apiUrl = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=g`;
    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return new Response(
        JSON.stringify({ error: "Metals.dev API error", detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiData = await apiRes.json();
    const metals = apiData.metals;
    if (!metals) {
      return new Response(
        JSON.stringify({ error: "Unexpected API response", detail: apiData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch USD/MXN exchange rate
    let usdMxnRate = 20.0; // fallback
    try {
      const fxRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        if (fxData.rates?.MXN) {
          usdMxnRate = fxData.rates.MXN;
        }
      }
    } catch (fxErr) {
      console.error("Exchange rate fetch failed, using fallback:", fxErr);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Build price_table with all purities (USD and MXN)
    const priceTable: Array<{
      metal: string; metal_key: string; pureza: string;
      factor: number; precio_gramo: number; precio_gramo_mxn: number;
    }> = [];
    for (const [metalKey, purities] of Object.entries(PURITY_MAP)) {
      const apiMetalKey = METAL_API_KEYS[metalKey];
      if (!apiMetalKey || !metals[apiMetalKey]) continue;
      const basePrice = metals[apiMetalKey];
      for (const [purity, factor] of Object.entries(purities)) {
        const precioUsd = Math.round(basePrice * factor * 100) / 100;
        priceTable.push({
          metal: METAL_LABELS[metalKey],
          metal_key: metalKey,
          pureza: purity,
          factor,
          precio_gramo: precioUsd,
          precio_gramo_mxn: Math.round(precioUsd * usdMxnRate * 100) / 100,
        });
      }
    }

    // Fetch and update materials (store price in MXN)
    const { data: materials, error: fetchErr } = await supabase
      .from("materials")
      .select("id, nombre, tipo_material, kilataje, costo_directo")
      .eq("categoria", "Metales")
      .in("tipo_material", ["oro", "plata", "platino"]);

    if (fetchErr) {
      return new Response(
        JSON.stringify({ error: "DB fetch error", detail: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updates: Array<{ id: string; nombre: string; old_price: number; new_price: number }> = [];

    for (const mat of materials || []) {
      const metalKey = METAL_API_KEYS[mat.tipo_material];
      if (!metalKey || !metals[metalKey]) continue;

      const basePrice = metals[metalKey];
      const purities = PURITY_MAP[mat.tipo_material];
      if (!purities || !mat.kilataje) continue;

      const factor = purities[mat.kilataje];
      if (factor === undefined) continue;

      const priceUsd = Math.round(basePrice * factor * 100) / 100;
      const newPrice = Math.round(priceUsd * usdMxnRate * 100) / 100;

      if (newPrice !== mat.costo_directo) {
        const { error: upErr } = await supabase
          .from("materials")
          .update({ costo_directo: newPrice })
          .eq("id", mat.id);

        if (!upErr) {
          updates.push({
            id: mat.id,
            nombre: mat.nombre,
            old_price: mat.costo_directo,
            new_price: newPrice,
          });
        }
      }
    }

    // Save last sync timestamp
    const now = new Date().toISOString();
    const { data: existingSync } = await supabase
      .from("system_settings")
      .select("id")
      .eq("key", "metal_price_last_sync")
      .eq("category", "metals")
      .maybeSingle();

    if (existingSync) {
      await supabase
        .from("system_settings")
        .update({ value: { value: now } })
        .eq("key", "metal_price_last_sync");
    } else {
      await supabase
        .from("system_settings")
        .insert({ key: "metal_price_last_sync", category: "metals", value: { value: now } });
    }

    // Save price_table to system_settings
    const { data: existingTable } = await supabase
      .from("system_settings")
      .select("id")
      .eq("key", "metal_price_table")
      .eq("category", "metals")
      .maybeSingle();

    if (existingTable) {
      await supabase
        .from("system_settings")
        .update({ value: { value: priceTable } })
        .eq("key", "metal_price_table");
    } else {
      await supabase
        .from("system_settings")
        .insert({ key: "metal_price_table", category: "metals", value: { value: priceTable } });
    }

    // Save exchange rate to system_settings
    const exchangeRateValue = { usd_mxn: usdMxnRate, updated_at: now };
    const { data: existingRate } = await supabase
      .from("system_settings")
      .select("id")
      .eq("key", "metal_price_exchange_rate")
      .eq("category", "metals")
      .maybeSingle();

    if (existingRate) {
      await supabase
        .from("system_settings")
        .update({ value: { value: exchangeRateValue } })
        .eq("key", "metal_price_exchange_rate");
    } else {
      await supabase
        .from("system_settings")
        .insert({ key: "metal_price_exchange_rate", category: "metals", value: { value: exchangeRateValue } });
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: updates.length,
        updates,
        price_table: priceTable,
        exchange_rate: { usd_mxn: usdMxnRate },
        api_prices: {
          gold_per_gram_usd: metals.gold,
          silver_per_gram_usd: metals.silver,
          platinum_per_gram_usd: metals.platinum,
        },
        synced_at: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
