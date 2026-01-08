-- ============================================
-- MIGRACIÓN: Habilitar Realtime para materials
-- ============================================
-- Configura la tabla materials para funcionar con Supabase Realtime

-- 1. Establecer REPLICA IDENTITY FULL para obtener todos los campos en eventos
-- Esto es necesario para que UPDATE/DELETE envíen toda la fila, no solo la PK
ALTER TABLE public.materials REPLICA IDENTITY FULL;

-- 2. Verificar/agregar la tabla a la publicación de Realtime
-- (Ignorar error si ya existe)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'La tabla materials ya está en la publicación supabase_realtime';
END $$;

-- 3. También habilitar para analysis_states (para sincronizar cambios de estado)
ALTER TABLE public.analysis_states REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_states;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'La tabla analysis_states ya está en la publicación supabase_realtime';
END $$;
