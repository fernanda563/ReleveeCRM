# Aplicar el tema del sistema en la vista de captura de INE

## Qué está pasando realmente

La vista `/captura-ine/:token` **sí** usa componentes de shadcn/ui (Card, Alert, Badge, Progress, Button, Skeleton). Lo que no se está aplicando es **el tema de la marca**: colores, radios y tokens que sí ves en el dashboard.

Causa verificada: el hook que carga el tema consulta la tabla `system_settings`, y esa tabla solo tiene permisos de lectura para administradores autenticados. En una vista pública (sin sesión) la consulta responde con error 400 — se ve en la consola del navegador al abrir `/captura-ine/test-token` — y la página se queda con los colores por defecto del CSS base en lugar del tema configurado.

Por eso los intentos anteriores (cambiar tarjetas, encabezado, tipografías) nunca resolvieron el problema: el marcado ya era correcto, faltaban los tokens del tema.

## Solución

1. **Permitir lectura pública solo de la configuración de apariencia**
   - Nueva política de lectura en `system_settings` limitada a `category = 'appearance'` para visitantes no autenticados, más el permiso de acceso correspondiente.
   - El resto de categorías (empresa, firma electrónica, metales, notificaciones, regional) siguen siendo privadas: la política filtra por categoría, no abre la tabla completa.
   - Nota: los valores de apariencia son colores y presets, no hay datos sensibles ahí.

2. **Hacer que las vistas públicas esperen al tema**
   - Ajustar el hook de tema para exponer un estado de "tema cargado" y que `/captura-ine` y `/agendar-cita` no muestren la interfaz hasta que se apliquen los tokens, evitando el parpadeo de colores por defecto.

3. **Verificación**
   - Abrir `/captura-ine/<token>` sin sesión en móvil y escritorio y comparar los tokens aplicados (`--background`, `--primary`, `--radius`) contra el dashboard; deben coincidir.
   - Confirmar que ya no aparece el error 400 en consola.
   - Confirmar que una consulta pública a otras categorías de `system_settings` sigue devolviendo vacío.

## Detalles técnicos

- Migración SQL:
  - `CREATE POLICY "Public can read appearance settings" ON public.system_settings FOR SELECT TO anon, authenticated USING (category = 'appearance');`
  - `GRANT SELECT ON public.system_settings TO anon;`
- `src/hooks/useThemeInitializer.ts`: devolver `ready: boolean`; filtrar la consulta con `.eq('category','appearance')`.
- `src/pages/MobileIneCapture.tsx` y `src/pages/PublicBooking.tsx`: usar ese estado para renderizar un `Skeleton` mientras carga el tema.
- No se cambia el marcado de las tarjetas ni de `IneCapture`; ya siguen el patrón del sistema.
