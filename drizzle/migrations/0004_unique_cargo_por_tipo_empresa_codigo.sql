CREATE UNIQUE INDEX IF NOT EXISTS cargos_empresa_tipo_codigo_key
  ON public.cargos (empresa_id, tipo, codigo_cargo)
  WHERE codigo_cargo IS NOT NULL;