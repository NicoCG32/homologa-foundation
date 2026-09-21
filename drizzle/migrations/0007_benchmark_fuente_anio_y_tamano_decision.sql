ALTER TABLE public.bandas_salariales ADD COLUMN IF NOT EXISTS fuente TEXT;
ALTER TABLE public.bandas_salariales ADD COLUMN IF NOT EXISTS anio INTEGER;
ALTER TABLE public.decisiones ADD COLUMN IF NOT EXISTS tamano_empresa public.empresa_tipo;