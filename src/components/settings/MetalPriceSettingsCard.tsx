import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Coins, RefreshCw, Clock, CheckCircle2, AlertCircle, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, addHours, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface PriceRow {
  metal: string;
  metal_key: string;
  pureza: string;
  factor: number;
  precio_gramo: number;
  precio_gramo_mxn: number;
}

const FREQUENCY_OPTIONS = [
  { value: "1h", label: "Cada hora" },
  { value: "6h", label: "Cada 6 horas" },
  { value: "12h", label: "Cada 12 horas" },
  { value: "24h", label: "Diario" },
  { value: "semanal", label: "Semanal" },
];

const FREQUENCY_HOURS: Record<string, number> = {
  "1h": 1, "6h": 6, "12h": 12, "24h": 24, "semanal": 168,
};

export function MetalPriceSettingsCard() {
  const [frequency, setFrequency] = useState("24h");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [priceTable, setPriceTable] = useState<PriceRow[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingFreq, setUpdatingFreq] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value")
        .eq("category", "metals");

      if (data) {
        for (const row of data) {
          const raw = row.value as any;
          const val = raw && typeof raw === "object" && "value" in raw ? raw.value : raw;
          if (row.key === "metal_price_frequency" && val) setFrequency(val);
          if (row.key === "metal_price_last_sync" && val) setLastSync(val);
          if (row.key === "metal_price_table" && Array.isArray(val)) setPriceTable(val);
          if (row.key === "metal_price_exchange_rate" && val && typeof val === "object") {
            setExchangeRate(val.usd_mxn ?? null);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching metal price settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-metal-prices");
      if (error) throw error;

      toast({
        title: "Precios actualizados",
        description: `${data.updated_count} material(es) actualizado(s) correctamente`,
      });

      setLastSync(data.synced_at);
      if (Array.isArray(data.price_table)) setPriceTable(data.price_table);
      if (data.exchange_rate?.usd_mxn) setExchangeRate(data.exchange_rate.usd_mxn);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudieron actualizar los precios",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleFrequencyChange = async (newFrequency: string) => {
    setUpdatingFreq(true);
    try {
      const { error } = await supabase.functions.invoke("update-metal-price-schedule", {
        body: { frequency: newFrequency },
      });
      if (error) throw error;

      setFrequency(newFrequency);
      toast({
        title: "Frecuencia actualizada",
        description: `Los precios se actualizarán ${FREQUENCY_OPTIONS.find((o) => o.value === newFrequency)?.label.toLowerCase()}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo actualizar la frecuencia",
        variant: "destructive",
      });
    } finally {
      setUpdatingFreq(false);
    }
  };

  const getNextSync = () => {
    if (!lastSync) return null;
    const lastDate = new Date(lastSync);
    const hours = FREQUENCY_HOURS[frequency] || 24;
    if (frequency === "semanal") return addDays(lastDate, 7);
    return addHours(lastDate, hours);
  };

  const nextSync = getNextSync();

  const grouped = priceTable.reduce<Record<string, PriceRow[]>>((acc, row) => {
    (acc[row.metal] = acc[row.metal] || []).push(row);
    return acc;
  }, {});

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Precios de Metales</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Precios de Metales</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            API Configurada
          </Badge>
        </div>
        <CardDescription>
          Actualización automática de precios de oro, plata y platino vía Metals.dev
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Frequency selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Frecuencia de actualización
          </label>
          <Select value={frequency} onValueChange={handleFrequencyChange} disabled={updatingFreq}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exchange rate info */}
        {exchangeRate && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
            <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                1 USD = ${exchangeRate.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} MXN
              </p>
              <p className="text-xs text-muted-foreground">Tipo de cambio utilizado en la última sincronización</p>
            </div>
          </div>
        )}

        {/* Status info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Última actualización
            </div>
            <p className="text-sm font-medium text-foreground">
              {lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: es }) : "Nunca"}
            </p>
            {lastSync && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(lastSync), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            )}
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              Próxima actualización
            </div>
            <p className="text-sm font-medium text-foreground">
              {nextSync ? formatDistanceToNow(nextSync, { addSuffix: true, locale: es }) : "Pendiente"}
            </p>
            {nextSync && (
              <p className="text-xs text-muted-foreground">
                {format(nextSync, "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            )}
          </div>
        </div>

        {/* Price table by purity */}
        {priceTable.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Precios por pureza</label>
            {Object.entries(grouped).map(([metal, rows]) => (
              <div key={metal} className="rounded-lg border overflow-hidden">
                <div className="bg-muted/50 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{metal}</span>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="w-20 text-right">USD/g</span>
                    <span className="w-24 text-right">MXN/g</span>
                  </div>
                </div>
                <div className="divide-y">
                  {rows.map((r) => (
                    <div key={`${r.metal_key}-${r.pureza}`} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{r.pureza}</Badge>
                        <span className="text-xs text-muted-foreground">×{r.factor}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="w-20 text-right text-muted-foreground">
                          ${r.precio_gramo.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="w-24 text-right font-medium text-foreground">
                          ${(r.precio_gramo_mxn ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/30 border p-3">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Los precios se obtienen en USD y se convierten a MXN usando el tipo de cambio actual.
            Los materiales en el catálogo se almacenan en pesos mexicanos (MXN).
          </p>
        </div>

        {/* Manual sync button */}
        <Button onClick={handleSyncNow} disabled={syncing} className="w-full" variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Actualizando precios..." : "Actualizar ahora"}
        </Button>
      </CardContent>
    </Card>
  );
}
