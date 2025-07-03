/*
  # Create data table for Data Library

  1. New Tables
    - `data`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `content` (text, optional) - for textual content
      - `file_url` (text, optional) - for uploaded files
      - `file_name` (text, optional) - original file name
      - `file_size` (integer, optional) - file size in bytes
      - `type` (text, required) - 'context', 'issue', 'inquiry', 'product'
      - `tags` (text array, optional) - for categorization
      - `metadata` (jsonb, optional) - for type-specific data (price for products, priority for issues, etc.)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, foreign key to projects)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `data` table
    - Add policies for authenticated users to manage their own data

  3. Constraints
    - Type validation constraint (context, issue, inquiry, product)
    - Foreign keys to auth.users and projects with cascade delete

  4. Triggers
    - Auto-update updated_at timestamp on row updates

  5. Indexes
    - Index on user_id for fast user queries
    - Index on project_id for fast project queries
    - Index on type for filtering by data type
    - Composite index on user_id, project_id, type for complex queries
*/

-- Create data table
CREATE TABLE IF NOT EXISTS data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  file_url text,
  file_name text,
  file_size integer,
  type text NOT NULL,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint for type validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'data_type_check' 
    AND table_name = 'data'
  ) THEN
    ALTER TABLE data 
    ADD CONSTRAINT data_type_check 
    CHECK (type = ANY (ARRAY['context'::text, 'issue'::text, 'inquiry'::text, 'product'::text]));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS data_user_id_idx ON data(user_id);
CREATE INDEX IF NOT EXISTS data_project_id_idx ON data(project_id);
CREATE INDEX IF NOT EXISTS data_type_idx ON data(type);
CREATE INDEX IF NOT EXISTS data_user_project_type_idx ON data(user_id, project_id, type);
CREATE INDEX IF NOT EXISTS data_created_at_idx ON data(created_at DESC);

-- Enable RLS
ALTER TABLE data ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  -- Create policy for INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'data' 
    AND policyname = 'Users can create own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create own data"
      ON data
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id)';
  END IF;

  -- Create policy for SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'data' 
    AND policyname = 'Users can view own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own data"
      ON data
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;

  -- Create policy for UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'data' 
    AND policyname = 'Users can update own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own data"
      ON data
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;

  -- Create policy for DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'data' 
    AND policyname = 'Users can delete own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own data"
      ON data
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Create trigger for data table (reuse existing function)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_data_updated_at'
    AND event_object_table = 'data'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_data_updated_at
      BEFORE UPDATE ON data
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()';
  END IF;
END $$;