CREATE TABLE public.presets_pesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  pesos jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.presets_pesos TO service_role;

ALTER TABLE public.presets_pesos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_presets_pesos_updated_at
BEFORE UPDATE ON public.presets_pesos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();