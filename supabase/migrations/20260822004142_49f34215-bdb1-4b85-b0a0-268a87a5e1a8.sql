CREATE POLICY "Public can read appearance settings" ON public.system_settings FOR SELECT TO anon, authenticated USING (category = 'appearance');
GRANT SELECT ON public.system_settings TO anon;