-- ============================================
-- MIGRACIÓN INICIAL: Plataforma AMI de Marcadores
-- ============================================

-- ============================================
-- TIPOS ENUMERADOS
-- ============================================

-- Formato del material
CREATE TYPE material_format AS ENUM (
  'texto',
  'imagen',
  'video'
);

-- Categoría esperada del material
CREATE TYPE expected_category AS ENUM (
  'sin_alteraciones',
  'manipulado_digitalmente',
  'generado_por_ia',
  'deepfake',
  'desinformacion_textual'
);

-- ============================================
-- TABLA: analysis_states (Estados personalizables)
-- ============================================

CREATE TABLE public.analysis_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  display_order INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: nombre único por usuario
  UNIQUE(user_id, name)
);

-- Índice para ordenamiento
CREATE INDEX idx_analysis_states_order ON public.analysis_states(user_id, display_order);

-- ============================================
-- TABLA: materials (Material de prueba)
-- ============================================

CREATE TABLE public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  format material_format NOT NULL,
  expected_category expected_category NOT NULL,
  source VARCHAR(255) NOT NULL,
  description TEXT,
  subcategory VARCHAR(100),
  analysis_notes TEXT,
  analysis_state_id UUID REFERENCES public.analysis_states(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: URL única por usuario
  UNIQUE(user_id, url)
);

-- Índices para filtros y búsqueda
CREATE INDEX idx_materials_user ON public.materials(user_id);
CREATE INDEX idx_materials_category ON public.materials(expected_category);
CREATE INDEX idx_materials_format ON public.materials(format);
CREATE INDEX idx_materials_state ON public.materials(analysis_state_id);
CREATE INDEX idx_materials_source ON public.materials(source);

-- ============================================
-- TRIGGER: Actualizar updated_at automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

ALTER TABLE public.analysis_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS PARA analysis_states
-- ============================================

CREATE POLICY "Users can view own analysis states"
  ON public.analysis_states
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analysis states"
  ON public.analysis_states
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis states"
  ON public.analysis_states
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis states"
  ON public.analysis_states
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS PARA materials
-- ============================================

CREATE POLICY "Users can view own materials"
  ON public.materials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own materials"
  ON public.materials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own materials"
  ON public.materials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own materials"
  ON public.materials
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN: Crear estados por defecto para nuevos usuarios
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.analysis_states (name, color, display_order, user_id, is_default)
  VALUES
    ('Pendiente', '#FCD34D', 1, NEW.id, TRUE),
    ('En progreso', '#60A5FA', 2, NEW.id, FALSE),
    ('Analizado', '#34D399', 3, NEW.id, FALSE),
    ('Incompleto', '#F87171', 4, NEW.id, FALSE),
    ('Requiere revisión', '#A78BFA', 5, NEW.id, FALSE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de crear usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
