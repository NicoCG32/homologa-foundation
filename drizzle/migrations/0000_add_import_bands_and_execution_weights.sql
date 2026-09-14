ALTER TABLE public.cargos ADD COLUMN codigo_nivel_jerarquico text;
ALTER TABLE public.ejecuciones ADD COLUMN criterios_usados jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE public.bandas_salariales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  tipo_empresa public.empresa_tipo NOT NULL,
  p25 numeric,
  p50 numeric,
  p75 numeric,
  promedio numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cargo_id, tipo_empresa)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bandas_salariales TO anon, authenticated;
GRANT ALL ON public.bandas_salariales TO service_role;
ALTER TABLE public.bandas_salariales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bandas_salariales_open" ON public.bandas_salariales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_bandas_salariales_updated_at BEFORE UPDATE ON public.bandas_salariales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX bandas_salariales_cargo_id_idx ON public.bandas_salariales(cargo_id);