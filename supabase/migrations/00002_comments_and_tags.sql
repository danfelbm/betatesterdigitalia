-- ============================================
-- MIGRACIÓN: Sistema de Comentarios y Etiquetas
-- ============================================
-- Agrega sistema de comentarios inmutables, grupos de etiquetas
-- personalizables y relación materiales-etiquetas

-- ============================================
-- TABLA: tag_groups (Grupos de etiquetas por usuario)
-- ============================================

CREATE TABLE public.tag_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: nombre único por usuario
  UNIQUE(user_id, name)
);

-- Índice para ordenamiento
CREATE INDEX idx_tag_groups_user_order ON public.tag_groups(user_id, display_order);

-- ============================================
-- TABLA: tags (Etiquetas individuales)
-- ============================================

CREATE TABLE public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.tag_groups(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: nombre único dentro del grupo
  UNIQUE(group_id, name)
);

-- Índices para búsqueda y ordenamiento
CREATE INDEX idx_tags_group_order ON public.tags(group_id, display_order);

-- ============================================
-- TABLA: comments (Comentarios de análisis - INMUTABLES)
-- ============================================

CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  analysis_state_id UUID REFERENCES public.analysis_states(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda por material y usuario
CREATE INDEX idx_comments_material ON public.comments(material_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_material_created ON public.comments(material_id, created_at DESC);

-- ============================================
-- TABLA: material_tags (Relación N:N materiales-etiquetas)
-- ============================================

CREATE TABLE public.material_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Una etiqueta solo puede estar asignada una vez por material
  UNIQUE(material_id, tag_id)
);

-- Índices para búsqueda bidireccional
CREATE INDEX idx_material_tags_material ON public.material_tags(material_id);
CREATE INDEX idx_material_tags_tag ON public.material_tags(tag_id);

-- ============================================
-- HABILITAR RLS EN TODAS LAS TABLAS NUEVAS
-- ============================================

ALTER TABLE public.tag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS PARA tag_groups
-- ============================================

CREATE POLICY "Users can view own tag groups"
  ON public.tag_groups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tag groups"
  ON public.tag_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tag groups"
  ON public.tag_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tag groups"
  ON public.tag_groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS PARA tags
-- ============================================
-- Nota: user_id se hereda del grupo, validamos via subquery

CREATE POLICY "Users can view tags of own groups"
  ON public.tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tag_groups
      WHERE tag_groups.id = tags.group_id
      AND tag_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags in own groups"
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tag_groups
      WHERE tag_groups.id = group_id
      AND tag_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags in own groups"
  ON public.tags
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tag_groups
      WHERE tag_groups.id = tags.group_id
      AND tag_groups.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tag_groups
      WHERE tag_groups.id = group_id
      AND tag_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags in own groups"
  ON public.tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tag_groups
      WHERE tag_groups.id = tags.group_id
      AND tag_groups.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA comments (INMUTABLES)
-- ============================================

CREATE POLICY "Users can view comments on own materials"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.materials
      WHERE materials.id = comments.material_id
      AND materials.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on own materials"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.materials
      WHERE materials.id = material_id
      AND materials.user_id = auth.uid()
    )
  );

-- IMPORTANTE: NO hay políticas UPDATE ni DELETE para comments
-- Esto garantiza la inmutabilidad a nivel de RLS

-- ============================================
-- POLÍTICAS RLS PARA material_tags
-- ============================================

CREATE POLICY "Users can view tags on own materials"
  ON public.material_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.materials
      WHERE materials.id = material_tags.material_id
      AND materials.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can assign tags to own materials"
  ON public.material_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.materials
      WHERE materials.id = material_id
      AND materials.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tags
      JOIN public.tag_groups ON tag_groups.id = tags.group_id
      WHERE tags.id = tag_id
      AND tag_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from own materials"
  ON public.material_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.materials
      WHERE materials.id = material_tags.material_id
      AND materials.user_id = auth.uid()
    )
  );

-- ============================================
-- ACTUALIZAR FUNCIÓN handle_new_user()
-- Ahora también crea grupos de etiquetas por defecto
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  group_confianza_id UUID;
  group_tipo_id UUID;
BEGIN
  -- Crear estados de análisis por defecto (existente)
  INSERT INTO public.analysis_states (name, color, display_order, user_id, is_default)
  VALUES
    ('Pendiente', '#FCD34D', 1, NEW.id, TRUE),
    ('En progreso', '#60A5FA', 2, NEW.id, FALSE),
    ('Analizado', '#34D399', 3, NEW.id, FALSE),
    ('Incompleto', '#F87171', 4, NEW.id, FALSE),
    ('Requiere revisión', '#A78BFA', 5, NEW.id, FALSE);

  -- Crear grupo: Nivel de Confianza
  INSERT INTO public.tag_groups (name, description, display_order, user_id)
  VALUES ('Nivel de Confianza', 'Indica qué tan seguro estás del análisis', 1, NEW.id)
  RETURNING id INTO group_confianza_id;

  -- Etiquetas para Nivel de Confianza
  INSERT INTO public.tags (group_id, name, color, description, display_order)
  VALUES
    (group_confianza_id, 'Alta confianza', '#22C55E', 'Muy seguro del resultado', 1),
    (group_confianza_id, 'Media confianza', '#F59E0B', 'Moderadamente seguro', 2),
    (group_confianza_id, 'Baja confianza', '#EF4444', 'Requiere más investigación', 3);

  -- Crear grupo: Tipo de Manipulación
  INSERT INTO public.tag_groups (name, description, display_order, user_id)
  VALUES ('Tipo de Manipulación', 'Clasificación del tipo de alteración detectada', 2, NEW.id)
  RETURNING id INTO group_tipo_id;

  -- Etiquetas para Tipo de Manipulación
  INSERT INTO public.tags (group_id, name, color, description, display_order)
  VALUES
    (group_tipo_id, 'Edición fotográfica', '#3B82F6', 'Photoshop, filtros, retoques', 1),
    (group_tipo_id, 'Generación IA', '#8B5CF6', 'Creado con inteligencia artificial', 2),
    (group_tipo_id, 'Deepfake', '#EC4899', 'Rostro o voz manipulados', 3),
    (group_tipo_id, 'Contexto falso', '#F97316', 'Contenido real con contexto erróneo', 4),
    (group_tipo_id, 'Sin alteración', '#10B981', 'Material auténtico', 5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Crear etiquetas para usuarios existentes
-- Ejecutar manualmente después de la migración
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_tags_for_existing_users()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
  group_confianza_id UUID;
  group_tipo_id UUID;
BEGIN
  FOR user_record IN
    SELECT id FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.tag_groups
      WHERE tag_groups.user_id = users.id
    )
  LOOP
    -- Crear grupo: Nivel de Confianza
    INSERT INTO public.tag_groups (name, description, display_order, user_id)
    VALUES ('Nivel de Confianza', 'Indica qué tan seguro estás del análisis', 1, user_record.id)
    RETURNING id INTO group_confianza_id;

    INSERT INTO public.tags (group_id, name, color, description, display_order)
    VALUES
      (group_confianza_id, 'Alta confianza', '#22C55E', 'Muy seguro del resultado', 1),
      (group_confianza_id, 'Media confianza', '#F59E0B', 'Moderadamente seguro', 2),
      (group_confianza_id, 'Baja confianza', '#EF4444', 'Requiere más investigación', 3);

    -- Crear grupo: Tipo de Manipulación
    INSERT INTO public.tag_groups (name, description, display_order, user_id)
    VALUES ('Tipo de Manipulación', 'Clasificación del tipo de alteración detectada', 2, user_record.id)
    RETURNING id INTO group_tipo_id;

    INSERT INTO public.tags (group_id, name, color, description, display_order)
    VALUES
      (group_tipo_id, 'Edición fotográfica', '#3B82F6', 'Photoshop, filtros, retoques', 1),
      (group_tipo_id, 'Generación IA', '#8B5CF6', 'Creado con inteligencia artificial', 2),
      (group_tipo_id, 'Deepfake', '#EC4899', 'Rostro o voz manipulados', 3),
      (group_tipo_id, 'Contexto falso', '#F97316', 'Contenido real con contexto erróneo', 4),
      (group_tipo_id, 'Sin alteración', '#10B981', 'Material auténtico', 5);

    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Migrar analysis_notes existentes a comments
-- Ejecutar manualmente si hay datos existentes
-- ============================================

CREATE OR REPLACE FUNCTION public.migrate_analysis_notes_to_comments()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  material_record RECORD;
BEGIN
  FOR material_record IN
    SELECT id, user_id, analysis_notes, analysis_state_id
    FROM public.materials
    WHERE analysis_notes IS NOT NULL
      AND analysis_notes != ''
      AND NOT EXISTS (
        SELECT 1 FROM public.comments
        WHERE comments.material_id = materials.id
      )
  LOOP
    INSERT INTO public.comments (material_id, content, analysis_state_id, user_id)
    VALUES (
      material_record.id,
      material_record.analysis_notes,
      material_record.analysis_state_id,
      material_record.user_id
    );

    migrated_count := migrated_count + 1;
  END LOOP;

  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIO: Deprecar analysis_notes
-- ============================================

COMMENT ON COLUMN public.materials.analysis_notes IS
  'DEPRECADO: Usar tabla comments en su lugar. Se mantiene para compatibilidad con datos existentes.';
