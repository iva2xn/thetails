/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, required)
      - `plan` (text, default 'personal')
      - `social_links` (jsonb, default empty object)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users to manage their own projects

  3. Constraints
    - Plan validation constraint (personal, creator, business)
    - Foreign key to auth.users with cascade delete

  4. Triggers
    - Auto-update updated_at timestamp on row updates
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  plan text NOT NULL DEFAULT 'personal',
  social_links jsonb DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint for plan validation (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_plan_check' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_plan_check 
    CHECK (plan = ANY (ARRAY['personal'::text, 'creator'::text, 'business'::text]));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies (with IF NOT EXISTS equivalent)
DO $$
BEGIN
  -- Create policy for INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can create own projects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create own projects"
      ON projects
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id)';
  END IF;

  -- Create policy for SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can view own projects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own projects"
      ON projects
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;

  -- Create policy for UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can update own projects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own projects"
      ON projects
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;

  -- Create policy for DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can delete own projects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own projects"
      ON projects
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Create function to update updated_at timestamp (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects table (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_projects_updated_at'
    AND event_object_table = 'projects'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_projects_updated_at
      BEFORE UPDATE ON projects
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()';
  END IF;
END $$;