ALTER TABLE public.homeworks ADD COLUMN IF NOT EXISTS section_type_config JSONB DEFAULT '{}';
