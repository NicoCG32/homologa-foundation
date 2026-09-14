DROP POLICY IF EXISTS bandas_salariales_open ON public.bandas_salariales;

ALTER TABLE public.bandas_salariales ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.bandas_salariales FROM anon;
REVOKE ALL ON public.bandas_salariales FROM authenticated;
GRANT ALL ON public.bandas_salariales TO service_role;