CREATE TYPE public.semantico_estado AS ENUM ('OK', 'ERROR');

CREATE TABLE public.analisis_semanticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ejecucion_id uuid NOT NULL REFERENCES public.ejecuciones(id) ON DELETE CASCADE,
  modelo text NOT NULL,
  prompt_version text NOT NULL,
  estado public.semantico_estado NOT NULL,
  error_mensaje text,
  candidatos_enviados jsonb NOT NULL DEFAULT '[]'::jsonb,
  respuesta_cruda text,
  respuesta_validada jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analisis_semanticos_ejecucion ON public.analisis_semanticos(ejecucion_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.analisis_semanticos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analisis_semanticos TO authenticated;
GRANT ALL ON public.analisis_semanticos TO service_role;

ALTER TABLE public.analisis_semanticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY analisis_semanticos_open ON public.analisis_semanticos
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_analisis_semanticos_updated_at
BEFORE UPDATE ON public.analisis_semanticos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();