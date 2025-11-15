-- Add theme customization settings to system_settings table
-- These settings will store the appearance configuration for the application

-- Insert default theme settings if they don't exist
INSERT INTO system_settings (category, key, value)
VALUES 
  ('appearance', 'theme_mode', '"system"'::jsonb),
  ('appearance', 'custom_theme_light', '{}'::jsonb),
  ('appearance', 'custom_theme_dark', '{}'::jsonb),
  ('appearance', 'theme_source', '"default"'::jsonb),
  ('appearance', 'tweakcn_registry_url', '""'::jsonb),
  ('appearance', 'active_preset', '"minimalista"'::jsonb)
ON CONFLICT DO NOTHING;

-- Add comment to explain the settings
COMMENT ON TABLE system_settings IS 'Stores system-wide configuration including theme customization from TweakCN';