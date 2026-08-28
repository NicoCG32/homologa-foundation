CREATE TYPE public.empresa_tipo AS ENUM ('P','M','G');
CREATE TYPE public.cargo_tipo AS ENUM ('INTERNO','REFERENCIA');
CREATE TYPE public.ejecucion_estado AS ENUM ('PENDIENTE','EN_PROCESO','COMPLETADA','ERROR');

CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo public.empresa_tipo NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO anon, authenticated;
GRANT ALL ON public.empresas TO service_role;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresas_open" ON public.empresas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo public.cargo_tipo NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  sueldo NUMERIC(14,2)
);
CREATE INDEX idx_cargos_empresa ON public.cargos(empresa_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO anon, authenticated;
GRANT ALL ON public.cargos TO service_role;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cargos_open" ON public.cargos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.criterios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  peso NUMERIC(6,3) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.criterios TO anon, authenticated;
GRANT ALL ON public.criterios TO service_role;
ALTER TABLE public.criterios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "criterios_open" ON public.criterios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ejecuciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estado public.ejecucion_estado NOT NULL DEFAULT 'PENDIENTE'
);
CREATE INDEX idx_ejecuciones_cargo ON public.ejecuciones(cargo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ejecuciones TO anon, authenticated;
GRANT ALL ON public.ejecuciones TO service_role;
ALTER TABLE public.ejecuciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ejecuciones_open" ON public.ejecuciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.resultados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ejecucion_id UUID NOT NULL REFERENCES public.ejecuciones(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  score_deterministico NUMERIC(6,3),
  score_semantico NUMERIC(6,3),
  score_final NUMERIC(6,3)
);
CREATE INDEX idx_resultados_ejecucion ON public.resultados(ejecucion_id);
CREATE INDEX idx_resultados_candidato ON public.resultados(candidato_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resultados TO anon, authenticated;
GRANT ALL ON public.resultados TO service_role;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resultados_open" ON public.resultados FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);