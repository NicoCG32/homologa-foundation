CREATE TYPE public.criterio_campo AS ENUM ('nombre', 'descripcion', 'sueldo', 'tipo_empresa');

ALTER TABLE public.criterios
  ADD COLUMN campo public.criterio_campo NOT NULL DEFAULT 'nombre',
  ADD COLUMN obligatorio boolean NOT NULL DEFAULT false;