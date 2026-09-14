DROP POLICY IF EXISTS analisis_semanticos_open ON public.analisis_semanticos;
DROP POLICY IF EXISTS cargos_open ON public.cargos;
DROP POLICY IF EXISTS criterios_open ON public.criterios;
DROP POLICY IF EXISTS ejecuciones_open ON public.ejecuciones;
DROP POLICY IF EXISTS empresas_open ON public.empresas;
DROP POLICY IF EXISTS resultados_open ON public.resultados;

REVOKE ALL ON public.analisis_semanticos FROM anon, authenticated;
REVOKE ALL ON public.cargos FROM anon, authenticated;
REVOKE ALL ON public.criterios FROM anon, authenticated;
REVOKE ALL ON public.ejecuciones FROM anon, authenticated;
REVOKE ALL ON public.empresas FROM anon, authenticated;
REVOKE ALL ON public.resultados FROM anon, authenticated;

GRANT ALL ON public.analisis_semanticos TO service_role;
GRANT ALL ON public.cargos TO service_role;
GRANT ALL ON public.criterios TO service_role;
GRANT ALL ON public.ejecuciones TO service_role;
GRANT ALL ON public.empresas TO service_role;
GRANT ALL ON public.resultados TO service_role;

ALTER TABLE public.analisis_semanticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejecuciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;