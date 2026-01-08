-- ============================================
-- MIGRACIÓN: Sistema de Roles (Admin/Regular)
-- ============================================
-- Transforma el modelo de datos aislados por usuario
-- a datos compartidos con control de permisos por rol

-- ============================================
-- TIPO ENUMERADO PARA ROLES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'regular');

-- ============================================
-- TABLA: profiles (Perfiles con rol)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'regular' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por rol
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Trigger para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCIONES HELPER PARA VERIFICAR ROL
-- ============================================

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para verificar si usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- POLÍTICAS RLS PARA profiles
-- ============================================

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Solo admins pueden actualizar roles (excepto su propio perfil básico)
CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- ELIMINAR POLÍTICAS RLS EXISTENTES
-- ============================================

-- Materials
DROP POLICY IF EXISTS "Users can view own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can create own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can update own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can delete own materials" ON public.materials;

-- Analysis States
DROP POLICY IF EXISTS "Users can view own analysis states" ON public.analysis_states;
DROP POLICY IF EXISTS "Users can create own analysis states" ON public.analysis_states;
DROP POLICY IF EXISTS "Users can update own analysis states" ON public.analysis_states;
DROP POLICY IF EXISTS "Users can delete own analysis states" ON public.analysis_states;

-- Tag Groups
DROP POLICY IF EXISTS "Users can view own tag groups" ON public.tag_groups;
DROP POLICY IF EXISTS "Users can create own tag groups" ON public.tag_groups;
DROP POLICY IF EXISTS "Users can update own tag groups" ON public.tag_groups;
DROP POLICY IF EXISTS "Users can delete own tag groups" ON public.tag_groups;

-- Tags
DROP POLICY IF EXISTS "Users can view tags of own groups" ON public.tags;
DROP POLICY IF EXISTS "Users can create tags in own groups" ON public.tags;
DROP POLICY IF EXISTS "Users can update tags in own groups" ON public.tags;
DROP POLICY IF EXISTS "Users can delete tags in own groups" ON public.tags;

-- Comments
DROP POLICY IF EXISTS "Users can view comments on own materials" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on own materials" ON public.comments;

-- Material Tags
DROP POLICY IF EXISTS "Users can view tags on own materials" ON public.material_tags;
DROP POLICY IF EXISTS "Users can assign tags to own materials" ON public.material_tags;
DROP POLICY IF EXISTS "Users can remove tags from own materials" ON public.material_tags;

-- ============================================
-- NUEVAS POLÍTICAS RLS: MATERIALS
-- ============================================

-- Todos los usuarios autenticados pueden ver todos los materiales
CREATE POLICY "Authenticated users can view all materials"
  ON public.materials
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo admin puede crear materiales
CREATE POLICY "Admins can create materials"
  ON public.materials
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin puede actualizar todo
CREATE POLICY "Admins can update materials"
  ON public.materials
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Usuarios regulares pueden actualizar solo analysis_state_id
-- Nota: La validación de campos se hace en el server action
CREATE POLICY "Regular users can update material state"
  ON public.materials
  FOR UPDATE
  TO authenticated
  USING (NOT public.is_admin())
  WITH CHECK (NOT public.is_admin());

-- Solo admin puede eliminar
CREATE POLICY "Admins can delete materials"
  ON public.materials
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- NUEVAS POLÍTICAS RLS: ANALYSIS_STATES
-- ============================================

CREATE POLICY "Authenticated users can view all states"
  ON public.analysis_states
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create states"
  ON public.analysis_states
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update states"
  ON public.analysis_states
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete states"
  ON public.analysis_states
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- NUEVAS POLÍTICAS RLS: TAG_GROUPS
-- ============================================

CREATE POLICY "Authenticated users can view all tag groups"
  ON public.tag_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create tag groups"
  ON public.tag_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tag groups"
  ON public.tag_groups
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete tag groups"
  ON public.tag_groups
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- NUEVAS POLÍTICAS RLS: TAGS
-- ============================================

CREATE POLICY "Authenticated users can view all tags"
  ON public.tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create tags"
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tags"
  ON public.tags
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete tags"
  ON public.tags
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- NUEVAS POLÍTICAS RLS: COMMENTS
-- Todos pueden ver y crear, nadie puede editar/eliminar
-- ============================================

CREATE POLICY "Authenticated users can view all comments"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Todos pueden crear comentarios (asignando su propio user_id)
CREATE POLICY "Authenticated users can create comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NUEVAS POLÍTICAS RLS: MATERIAL_TAGS
-- Todos pueden ver, asignar y remover etiquetas
-- ============================================

CREATE POLICY "Authenticated users can view all material tags"
  ON public.material_tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can assign tags"
  ON public.material_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can remove tags"
  ON public.material_tags
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- ACTUALIZAR FUNCIÓN handle_new_user()
-- Ahora crea perfil y solo datos por defecto para admin
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  group_confianza_id UUID;
  group_tipo_id UUID;
  is_first_user BOOLEAN;
  new_role user_role;
BEGIN
  -- Verificar si es el primer usuario (será admin)
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  -- Asignar rol
  IF is_first_user THEN
    new_role := 'admin';
  ELSE
    new_role := 'regular';
  END IF;

  -- Crear perfil con rol
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, new_role);

  -- Solo crear datos por defecto si es admin (primer usuario)
  IF is_first_user THEN
    -- Crear estados de análisis por defecto
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Migrar datos existentes al sistema de roles
-- Ejecutar manualmente después de aplicar la migración
-- ============================================

CREATE OR REPLACE FUNCTION public.migrate_to_roles_system()
RETURNS TEXT AS $$
DECLARE
  admin_user_id UUID;
  first_user_id UUID;
  profiles_created INT := 0;
  materials_migrated INT := 0;
  states_removed INT := 0;
  groups_removed INT := 0;
BEGIN
  -- 1. Crear perfiles para usuarios existentes que no tengan
  INSERT INTO public.profiles (id, role)
  SELECT u.id, 'regular'::user_role
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );
  GET DIAGNOSTICS profiles_created = ROW_COUNT;

  -- 2. Hacer al primer usuario (por created_at) admin
  SELECT id INTO first_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF first_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = first_user_id;
    admin_user_id := first_user_id;
  ELSE
    RETURN 'ERROR: No hay usuarios en la base de datos';
  END IF;

  -- 3. Reasignar todos los materiales al admin
  UPDATE public.materials
  SET user_id = admin_user_id
  WHERE user_id != admin_user_id;
  GET DIAGNOSTICS materials_migrated = ROW_COUNT;

  -- 4. Actualizar referencias de analysis_state_id en materiales
  -- Mapear estados de otros usuarios a los estados del admin por nombre
  UPDATE public.materials m
  SET analysis_state_id = (
    SELECT a2.id FROM public.analysis_states a2
    WHERE a2.user_id = admin_user_id
    AND a2.name = (
      SELECT name FROM public.analysis_states WHERE id = m.analysis_state_id
    )
    LIMIT 1
  )
  WHERE analysis_state_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.analysis_states
    WHERE id = m.analysis_state_id AND user_id != admin_user_id
  );

  -- 5. Actualizar referencias en comentarios
  UPDATE public.comments c
  SET analysis_state_id = (
    SELECT a2.id FROM public.analysis_states a2
    WHERE a2.user_id = admin_user_id
    AND a2.name = (
      SELECT name FROM public.analysis_states WHERE id = c.analysis_state_id
    )
    LIMIT 1
  )
  WHERE analysis_state_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.analysis_states
    WHERE id = c.analysis_state_id AND user_id != admin_user_id
  );

  -- 6. Actualizar referencias de material_tags
  -- Mapear etiquetas de otros usuarios a las del admin por nombre
  UPDATE public.material_tags mt
  SET tag_id = (
    SELECT t2.id FROM public.tags t2
    JOIN public.tag_groups g2 ON t2.group_id = g2.id
    WHERE g2.user_id = admin_user_id
    AND t2.name = (SELECT name FROM public.tags WHERE id = mt.tag_id)
    LIMIT 1
  )
  WHERE EXISTS (
    SELECT 1 FROM public.tags t
    JOIN public.tag_groups g ON t.group_id = g.id
    WHERE t.id = mt.tag_id AND g.user_id != admin_user_id
  );

  -- 7. Eliminar material_tags huérfanos (si el mapeo falló)
  DELETE FROM public.material_tags
  WHERE tag_id IS NULL;

  -- 8. Eliminar estados duplicados (mantener solo los del admin)
  DELETE FROM public.analysis_states
  WHERE user_id != admin_user_id;
  GET DIAGNOSTICS states_removed = ROW_COUNT;

  -- 9. Eliminar grupos de etiquetas duplicados (mantener solo los del admin)
  DELETE FROM public.tag_groups
  WHERE user_id != admin_user_id;
  GET DIAGNOSTICS groups_removed = ROW_COUNT;

  -- 10. Eliminar el constraint de URL única por usuario (ahora es global)
  ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_user_id_url_key;

  -- 11. Agregar constraint de URL única global
  -- Primero verificar si hay duplicados
  IF EXISTS (
    SELECT url FROM public.materials GROUP BY url HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'ADVERTENCIA: Hay URLs duplicadas. Revisa manualmente antes de agregar el constraint.';
  ELSE
    ALTER TABLE public.materials ADD CONSTRAINT materials_url_key UNIQUE (url);
  END IF;

  RETURN format(
    'Migración completada. Admin ID: %s. Perfiles creados: %s. Materiales migrados: %s. Estados eliminados: %s. Grupos eliminados: %s.',
    admin_user_id, profiles_created, materials_migrated, states_removed, groups_removed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INSTRUCCIONES POST-MIGRACIÓN
-- ============================================
--
-- 1. Aplicar esta migración con: supabase db push
--    o ejecutar el SQL directamente en el editor de Supabase
--
-- 2. Ejecutar la función de migración:
--    SELECT public.migrate_to_roles_system();
--
-- 3. Verificar que el admin fue asignado correctamente:
--    SELECT * FROM public.profiles WHERE role = 'admin';
--
-- 4. Verificar los materiales:
--    SELECT COUNT(*) FROM public.materials;
--
-- 5. Para cambiar el rol de un usuario manualmente:
--    UPDATE public.profiles SET role = 'admin' WHERE id = 'user-uuid-here';
-- ============================================
