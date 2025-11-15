-- Asegurar que existe el registro para imported_themes
INSERT INTO system_settings (key, category, value, imported_themes)
VALUES ('imported_themes', 'appearance', '{"value": []}'::jsonb, '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;