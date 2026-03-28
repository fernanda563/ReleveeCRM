

## Plan: Actualización automática y configurable de precios de metales

### Resumen

Crear una edge function que consulte Metals.dev, un cron job configurable para ejecutarla periódicamente, y una tarjeta de configuración en Ajustes del Sistema donde el admin controle la frecuencia y vea el estado de las sincronizaciones.

### Arquitectura

```text
[Configuración del Sistema]
  ├── Frecuencia: cada 1h / 6h / 12h / 24h / semanal
  ├── Última actualización: timestamp
  ├── Próxima actualización: timestamp
  └── Botón "Ejecutar ahora" (manual, opcional)
        │
        ▼
[pg_cron job] ──> [Edge Function: fetch-metal-prices]
        │                    │
        │                    ├── GET metals.dev/v1/latest
        │                    ├── Mapea por tipo_material + kilataje
        │                    └── UPDATE materials SET costo_directo
        │
        └── Frecuencia configurable vía UPDATE cron.job
```

### Pasos de implementación

**1. Secret `METALS_DEV_API_KEY`**

Solicitar al usuario su API key de Metals.dev usando `add_secret`.

**2. Edge Function `fetch-metal-prices`**

- Consulta `https://api.metals.dev/v1/latest?api_key=KEY&currency=USD&unit=g`
- Mapea precios por pureza:
  - Oro 24k = 100%, 18k = 75%, 14k = 58.5%, 10k = 41.7%
  - Plata 925 = 92.5%, 950 = 95%
  - Platino 950 = 95%
- Actualiza `materials` donde `categoria = 'Metales'` y coincida `tipo_material` + `kilataje`
- Registra timestamp de última actualización en `system_settings`
- Retorna resumen de materiales actualizados

**3. Migración: habilitar `pg_cron` y `pg_net`**

Habilitar las extensiones necesarias para programar jobs automáticos.

**4. Cron job inicial**

Usar la herramienta de insert para crear un cron job que invoque la edge function diariamente (frecuencia por defecto).

**5. Nueva tarjeta de configuración: `MetalPriceSettingsCard`**

Ubicada en la página de Configuración del Sistema (`SystemSettings.tsx`), con:

- **Frecuencia de actualización**: Select con opciones (cada 1h, 6h, 12h, 24h, semanal)
- **Última actualización**: fecha/hora de la última sincronización exitosa
- **Próxima actualización**: calculada según frecuencia
- **Materiales actualizados**: cantidad de materiales que se actualizan
- **Botón "Actualizar ahora"**: ejecución manual inmediata
- **Indicador de estado**: si la API key está configurada o no

Al cambiar la frecuencia, se actualiza el cron schedule vía una edge function auxiliar o directamente actualizando `system_settings` y recreando el cron job.

**6. Edge Function `update-metal-price-schedule`**

Recibe la nueva frecuencia (cron expression), ejecuta `cron.unschedule` + `cron.schedule` para actualizar el job. Esto permite que el cambio de frecuencia desde el frontend surta efecto en el backend.

### Mapeo de frecuencias a cron expressions

| Opción UI | Cron |
|---|---|
| Cada hora | `0 * * * *` |
| Cada 6 horas | `0 */6 * * *` |
| Cada 12 horas | `0 */12 * * *` |
| Diario | `0 8 * * *` |
| Semanal | `0 8 * * 1` |

### Archivos creados/modificados

- `supabase/functions/fetch-metal-prices/index.ts` — nueva edge function
- `supabase/functions/update-metal-price-schedule/index.ts` — nueva edge function para cambiar frecuencia
- `src/components/settings/MetalPriceSettingsCard.tsx` — nueva tarjeta de configuración
- `src/pages/SystemSettings.tsx` — agregar la nueva tarjeta
- Migración SQL — habilitar `pg_cron` y `pg_net`
- Insert SQL — crear cron job inicial

