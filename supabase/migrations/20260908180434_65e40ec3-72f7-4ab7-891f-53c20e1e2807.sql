ALTER TABLE public.cargos
  ADD COLUMN IF NOT EXISTS codigo_area text,
  ADD COLUMN IF NOT EXISTS nombre_area text,
  ADD COLUMN IF NOT EXISTS codigo_subarea text,
  ADD COLUMN IF NOT EXISTS nombre_subarea text,
  ADD COLUMN IF NOT EXISTS codigo_cargo text,
  ADD COLUMN IF NOT EXISTS nivel_jerarquico text,
  ADD COLUMN IF NOT EXISTS experiencia_requerida text,
  ADD COLUMN IF NOT EXISTS requisitos_formacion text;

UPDATE public.criterios SET activo = false, campo = 'nombre'::criterio_campo WHERE campo = 'sueldo';

CREATE TYPE public.criterio_campo_v2 AS ENUM (
  'nombre','descripcion','area','subarea','codigo_cargo','nivel_jerarquico','experiencia','requisitos','tipo_empresa'
);

ALTER TABLE public.criterios ALTER COLUMN campo DROP DEFAULT;
ALTER TABLE public.criterios
  ALTER COLUMN campo TYPE public.criterio_campo_v2
  USING (campo::text)::public.criterio_campo_v2;
ALTER TABLE public.criterios ALTER COLUMN campo SET DEFAULT 'nombre'::public.criterio_campo_v2;

DROP TYPE public.criterio_campo;
ALTER TYPE public.criterio_campo_v2 RENAME TO criterio_campo;