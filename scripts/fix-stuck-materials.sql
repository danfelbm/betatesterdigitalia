-- Encontrar el estado "Pendiente"
WITH pendiente AS (
  SELECT id FROM analysis_states WHERE name = 'Pendiente' LIMIT 1
)
-- Actualizar todos los materiales que están "En progreso" a "Pendiente"
UPDATE materials
SET analysis_state_id = (SELECT id FROM pendiente),
    updated_at = NOW()
WHERE analysis_state_id = (
  SELECT id FROM analysis_states WHERE name = 'En progreso' LIMIT 1
);
