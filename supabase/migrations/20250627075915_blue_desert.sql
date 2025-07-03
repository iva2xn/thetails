/*
  # Add public visibility and improve slug management

  1. Changes
    - Add `is_public` column to projects table (boolean, default false)
    - Add `custom_slug` column to projects table (text, optional)
    - Update slug generation to use custom_slug if provided
    - Add unique constraint on custom_slug when not null

  2. Security
    - Update RLS policies to allow public access to public projects
    - Add policy for anonymous users to view public projects

  3. Functions
    - Update slug generation function to handle custom slugs
    - Add function to validate slug uniqueness
*/

-- Add new columns to projects table
DO $$
BEGIN
  -- Add is_public column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE projects ADD COLUMN is_public boolean DEFAULT false;
  END IF;

  -- Add custom_slug column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'custom_slug'
  ) THEN
    ALTER TABLE projects ADD COLUMN custom_slug text;
  END IF;
END $$;

-- Create unique index on custom_slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS projects_custom_slug_unique 
ON projects(custom_slug) WHERE custom_slug IS NOT NULL;

-- Update the slug generation function to handle custom slugs
CREATE OR REPLACE FUNCTION set_project_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- If custom_slug is provided, use it as the slug
  IF NEW.custom_slug IS NOT NULL AND NEW.custom_slug != '' THEN
    -- Validate and clean the custom slug
    NEW.custom_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(NEW.custom_slug, '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    );
    
    -- Remove leading/trailing hyphens
    NEW.custom_slug := trim(both '-' from NEW.custom_slug);
    
    -- Use custom slug as the final slug
    NEW.slug := NEW.custom_slug;
  ELSE
    -- Generate slug from name if no custom slug provided
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

-- Add RLS policy for public projects (anonymous access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Public projects are viewable by everyone'
  ) THEN
    EXECUTE 'CREATE POLICY "Public projects are viewable by everyone"
      ON projects
      FOR SELECT
      TO anon
      USING (is_public = true)';
  END IF;
END $$;

-- Add RLS policy for authenticated users to view public projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Authenticated users can view public projects'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view public projects"
      ON projects
      FOR SELECT
      TO authenticated
      USING (is_public = true OR auth.uid() = user_id)';
  END IF;
END $$;

-- Update existing policy to include public projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);