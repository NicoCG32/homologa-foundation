CREATE TYPE public.diccionario_tipo AS ENUM ('AREA', 'SUBAREA', 'NIVEL');

CREATE TABLE public.diccionario_entradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.diccionario_tipo NOT NULL,
  codigo text NOT NULL,
  nombre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, codigo)
);

GRANT ALL ON public.diccionario_entradas TO service_role;
ALTER TABLE public.diccionario_entradas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_diccionario_entradas_updated_at
BEFORE UPDATE ON public.diccionario_entradas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.diccionario_entradas (tipo, codigo, nombre) VALUES
('AREA','1','Recursos Humanos'),
('SUBAREA','1','Dirección'),
('SUBAREA','2','Gestión de Personas'),
('SUBAREA','3','Administración de Personal'),
('SUBAREA','4','Remuneraciones'),
('SUBAREA','5','Atracción de Talento'),
('SUBAREA','6','Compensaciones y Beneficios'),
('SUBAREA','7','Gestión del Talento'),
('SUBAREA','8','Desarrollo Organizacional'),
('SUBAREA','9','Capacitación y Desarrollo'),
('SUBAREA','10','Relaciones Laborales'),
('SUBAREA','11','Bienestar y Calidad de Vida'),
('SUBAREA','12','People Analytics'),
('SUBAREA','13','Business Partner'),
('SUBAREA','14','Prevención y Seguridad Laboral'),
('NIVEL','1','Ejecutivo'),
('NIVEL','2','Jefatura'),
('NIVEL','3','Profesional'),
('NIVEL','4','Técnico'),
('NIVEL','5','Administrativo'),
('NIVEL','6','Operario');

ALTER TABLE public.empresas ADD COLUMN tamano public.empresa_tipo;
UPDATE public.empresas SET tamano = tipo WHERE tamano IS NULL;