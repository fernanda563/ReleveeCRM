import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MetalInput {
  size: number;
  width: number;
  thickness: number;
  alloy: string;
  pieceCount?: number;
}

export interface StoneInput {
  cut: string;
  diameter?: number;
  length?: number;
  width?: number;
  depth: number;
  stoneCount?: number;
}

export type CalcPayload =
  | { mode: "metal"; metal: MetalInput }
  | { mode: "stone"; stone: StoneInput }
  | { mode: "piece"; metal: MetalInput; stone?: StoneInput | null };

export type CalcSource = "backend" | "local";

/**
 * Envía los parámetros a la función de cálculo del backend (fuente de verdad).
 * Mientras responde —o si falla la red— devuelve el cálculo local recibido
 * como fallback, para que la UI nunca quede sin resultado.
 */
export function useWeightCalculation<T>(payload: CalcPayload, fallback: T, debounceMs = 250) {
  const [result, setResult] = useState<T>(fallback);
  const [source, setSource] = useState<CalcSource>("local");
  const [isCalculating, setIsCalculating] = useState(false);
  const requestId = useRef(0);
  const key = JSON.stringify(payload);

  useEffect(() => {
    const current = ++requestId.current;
    setIsCalculating(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("calculate-weight", {
          body: JSON.parse(key),
        });
        if (current !== requestId.current) return;
        if (error || !data?.result) throw error ?? new Error("Sin resultado");
        setResult(data.result as T);
        setSource("backend");
      } catch {
        if (current !== requestId.current) return;
        setSource("local");
      } finally {
        if (current === requestId.current) setIsCalculating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [key, debounceMs]);

  // Si aún no hay respuesta del backend, se usa el cálculo local.
  return {
    result: source === "backend" ? result : fallback,
    source,
    isCalculating,
  };
}
