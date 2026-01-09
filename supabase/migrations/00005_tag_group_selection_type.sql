-- Migration: Add selection_type to tag_groups
-- 'single' = radio (must select exactly one)
-- 'multiple' = checkbox (can select zero or more)

-- Add column with default 'single' for new groups
ALTER TABLE public.tag_groups
ADD COLUMN selection_type VARCHAR(10) DEFAULT 'single'
CHECK (selection_type IN ('single', 'multiple'));

-- Migrate existing groups to 'multiple' (preserve current behavior)
UPDATE public.tag_groups SET selection_type = 'multiple';
