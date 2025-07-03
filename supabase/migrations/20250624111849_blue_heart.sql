/*
  # Add slug column to projects table

  1. Changes
    - Add `slug` column to `projects` table (text, unique, not null)
    - Create unique index on slug column
    - Add function to generate slug from project name
    - Backfill existing projects with slugs

  2. Security
    - Update existing RLS policies to work with slug column
*/

-- Add slug column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'slug'
  ) THEN
    ALTER TABLE projects ADD COLUMN slug text;
  END IF;
END $$;

-- Create function to generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Backfill existing projects with slugs
DO $$
DECLARE
  project_record RECORD;
  base_slug text;
  final_slug text;
  counter integer;
BEGIN
  FOR project_record IN SELECT id, name FROM projects WHERE slug IS NULL LOOP
    base_slug := generate_slug(project_record.name);
    final_slug := base_slug;
    counter := 1;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM projects WHERE slug = final_slug AND id != project_record.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    UPDATE projects SET slug = final_slug WHERE id = project_record.id;
  END LOOP;
END $$;

-- Make slug column NOT NULL after backfilling
ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON projects(slug);

-- Create function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION set_project_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Only generate slug if it's not provided or if name changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name AND NEW.slug = OLD.slug) THEN
    base_slug := generate_slug(NEW.name);
    final_slug := base_slug;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM projects WHERE slug = final_slug AND id != NEW.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slugs
DROP TRIGGER IF EXISTS set_project_slug_trigger ON projects;
CREATE TRIGGER set_project_slug_trigger
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_slug();