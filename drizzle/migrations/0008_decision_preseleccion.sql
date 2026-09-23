CREATE TABLE public.decision_preseleccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ejecucion_id UUID NOT NULL REFERENCES public.ejecuciones(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  scores_utilizados JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ejecucion_id, candidato_id)
);
CREATE INDEX decision_preseleccion_ejecucion_idx ON public.decision_preseleccion (ejecucion_id);
REVOKE ALL ON public.decision_preseleccion FROM anon, authenticated;
GRANT ALL ON public.decision_preseleccion TO service_role;
ALTER TABLE public.decision_preseleccion ENABLE ROW LEVEL SECURITY;