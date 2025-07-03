/*
  # Create separate tables for each data type

  1. New Tables
    - `contexts` - for context data
    - `issues` - for issue/bug reports  
    - `inquiries` - for questions/requests
    - `products` - for product information

  2. Data Migration
    - Migrate existing data from `data` table to appropriate new tables
    - Preserve all existing data and relationships

  3. Security
    - Enable RLS on all new tables
    - Create policies for authenticated users to manage their own data

  4. Cleanup
    - Keep original `data` table for now (can be dropped later after verification)
*/

-- Create contexts table
CREATE TABLE IF NOT EXISTS contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  file_url text,
  file_name text,
  file_size integer,
  tags text[] DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  file_url text,
  file_name text,
  file_size integer,
  tags text[] DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content text,
  file_url text,
  file_name text,
  file_size integer,
  tags text[] DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price decimal(10,2),
  affiliate_link text,
  file_url text,
  file_name text,
  file_size integer,
  tags text[] DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for all new tables
CREATE INDEX IF NOT EXISTS contexts_user_id_idx ON contexts(user_id);
CREATE INDEX IF NOT EXISTS contexts_project_id_idx ON contexts(project_id);
CREATE INDEX IF NOT EXISTS contexts_created_at_idx ON contexts(created_at DESC);

CREATE INDEX IF NOT EXISTS issues_user_id_idx ON issues(user_id);
CREATE INDEX IF NOT EXISTS issues_project_id_idx ON issues(project_id);
CREATE INDEX IF NOT EXISTS issues_severity_idx ON issues(severity);
CREATE INDEX IF NOT EXISTS issues_status_idx ON issues(status);
CREATE INDEX IF NOT EXISTS issues_created_at_idx ON issues(created_at DESC);

CREATE INDEX IF NOT EXISTS inquiries_user_id_idx ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS inquiries_project_id_idx ON inquiries(project_id);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);
CREATE INDEX IF NOT EXISTS products_project_id_idx ON products(project_id);
CREATE INDEX IF NOT EXISTS products_price_idx ON products(price);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at DESC);

-- Enable RLS on all new tables
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contexts table
CREATE POLICY "Users can create own contexts"
  ON contexts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own contexts"
  ON contexts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own contexts"
  ON contexts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contexts"
  ON contexts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for issues table
CREATE POLICY "Users can create own issues"
  ON issues FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own issues"
  ON issues FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own issues"
  ON issues FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own issues"
  ON issues FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for inquiries table
CREATE POLICY "Users can create own inquiries"
  ON inquiries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own inquiries"
  ON inquiries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inquiries"
  ON inquiries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inquiries"
  ON inquiries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for products table
CREATE POLICY "Users can create own products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own products"
  ON products FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at on all new tables
CREATE TRIGGER update_contexts_updated_at
  BEFORE UPDATE ON contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data from data table to new tables
INSERT INTO contexts (id, title, description, content, file_url, file_name, file_size, tags, user_id, project_id, created_at, updated_at)
SELECT id, title, description, content, file_url, file_name, file_size, tags, user_id, project_id, created_at, updated_at
FROM data WHERE type = 'context';

INSERT INTO issues (id, title, description, severity, status, file_url, file_name, file_size, tags, user_id, project_id, created_at, updated_at)
SELECT 
  id, 
  title, 
  description, 
  COALESCE((metadata->>'severity')::text, 'medium'),
  COALESCE((metadata->>'status')::text, 'open'),
  file_url, 
  file_name, 
  file_size, 
  tags, 
  user_id, 
  project_id, 
  created_at, 
  updated_at
FROM data WHERE type = 'issue';

INSERT INTO inquiries (id, title, description, content, file_url, file_name, file_size, tags, user_id, project_id, created_at, updated_at)
SELECT id, title, description, content, file_url, file_name, file_size, tags, user_id, project_id, created_at, updated_at
FROM data WHERE type = 'inquiry';

INSERT INTO products (id, title, description, price, affiliate_link, file_url, file_name, file_size, tags, user_id, project_id, created_at, updated_at)
SELECT 
  id, 
  title, 
  description, 
  CASE 
    WHEN (metadata->>'price') IS NOT NULL AND (metadata->>'price') != '' 
    THEN (metadata->>'price')::decimal(10,2)
    ELSE NULL 
  END,
  metadata->>'affiliateLink',
  file_url, 
  file_name, 
  file_size, 
  tags, 
  user_id, 
  project_id, 
  created_at, 
  updated_at
FROM data WHERE type = 'product';