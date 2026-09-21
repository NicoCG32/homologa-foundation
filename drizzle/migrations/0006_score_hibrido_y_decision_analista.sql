CREATE TABLE public.configuracion (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.configuracion TO service_role;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_configuracion_updated_at
BEFORE UPDATE ON public.configuracion
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.configuracion (clave, valor)
VALUES ('pesos_score', '{"motor": 70, "ia": 30}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

CREATE TABLE public.decisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ejecucion_id UUID NOT NULL UNIQUE REFERENCES public.ejecuciones(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  decision TEXT NOT NULL DEFAULT 'CONFIRMADA',
  comentario TEXT,
  usuario TEXT NOT NULL,
  scores_utilizados JSONB NOT NULL DEFAULT '{}'::jsonb,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.decisiones TO service_role;
ALTER TABLE public.decisiones ENABLE ROW LEVEL SECURITY;

CREATE INDEX decisiones_candidato_idx ON public.decisiones (candidato_id);

CREATE TRIGGER update_decisiones_updated_at
BEFORE UPDATE ON public.decisiones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();