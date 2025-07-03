-- ============================================================================
-- PGVECTOR AND EMBEDDINGS SETUP
-- Fixed version to handle existing policies
-- ============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verify extension is enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE NOTICE 'pgvector extension is enabled ✅';
  ELSE
    RAISE EXCEPTION 'pgvector extension failed to enable ❌';
  END IF;
END $$;

-- 3. Create embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(1536), -- Standard dimension for most embedding models
  metadata jsonb DEFAULT '{}',
  source_type text, -- 'context', 'issue', 'inquiry', 'product'
  source_id uuid, -- Reference to original data
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create vector similarity index (HNSW for fast approximate search)
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 5. Create regular indexes for filtering
CREATE INDEX IF NOT EXISTS embeddings_project_id_idx ON embeddings(project_id);
CREATE INDEX IF NOT EXISTS embeddings_user_id_idx ON embeddings(user_id);
CREATE INDEX IF NOT EXISTS embeddings_source_type_idx ON embeddings(source_type);
CREATE INDEX IF NOT EXISTS embeddings_source_id_idx ON embeddings(source_id);

-- 6. Enable Row Level Security
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can create own embeddings" ON embeddings;
  DROP POLICY IF EXISTS "Users can view own embeddings" ON embeddings;
  DROP POLICY IF EXISTS "Users can update own embeddings" ON embeddings;
  DROP POLICY IF EXISTS "Users can delete own embeddings" ON embeddings;
  
  -- Create new policies
  EXECUTE 'CREATE POLICY "Users can create own embeddings"
    ON embeddings FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id)';
    
  EXECUTE 'CREATE POLICY "Users can view own embeddings"
    ON embeddings FOR SELECT TO authenticated
    USING (auth.uid() = user_id)';
    
  EXECUTE 'CREATE POLICY "Users can update own embeddings"
    ON embeddings FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)';
    
  EXECUTE 'CREATE POLICY "Users can delete own embeddings"
    ON embeddings FOR DELETE TO authenticated
    USING (auth.uid() = user_id)';
    
  RAISE NOTICE 'RLS policies created successfully ✅';
END $$;

-- 8. Create updated_at trigger (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_embeddings_updated_at ON embeddings;
CREATE TRIGGER update_embeddings_updated_at
  BEFORE UPDATE ON embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Create similarity search function (replace if exists)
CREATE OR REPLACE FUNCTION similarity_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10,
  filter_project_id uuid DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  metadata jsonb,
  source_type text,
  source_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata,
    e.source_type,
    e.source_id
  FROM embeddings e
  WHERE 
    (filter_project_id IS NULL OR e.project_id = filter_project_id)
    AND (filter_user_id IS NULL OR e.user_id = filter_user_id)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 10. Create helper function for batch embedding insertion
CREATE OR REPLACE FUNCTION insert_embedding(
  p_content text,
  p_embedding vector(1536),
  p_metadata jsonb DEFAULT '{}',
  p_source_type text DEFAULT NULL,
  p_source_id uuid DEFAULT NULL,
  p_project_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO embeddings (
    content, embedding, metadata, source_type, 
    source_id, project_id, user_id
  ) VALUES (
    p_content, p_embedding, p_metadata, p_source_type,
    p_source_id, p_project_id, p_user_id
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- 11. Verification queries
DO $$
BEGIN
  -- Check pgvector extension
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE NOTICE 'pgvector extension: ✅ ENABLED';
  ELSE
    RAISE NOTICE 'pgvector extension: ❌ NOT ENABLED';
  END IF;
  
  -- Check embeddings table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'embeddings') THEN
    RAISE NOTICE 'embeddings table: ✅ CREATED';
  ELSE
    RAISE NOTICE 'embeddings table: ❌ NOT CREATED';
  END IF;
  
  -- Check similarity_search function
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'similarity_search') THEN
    RAISE NOTICE 'similarity_search function: ✅ CREATED';
  ELSE
    RAISE NOTICE 'similarity_search function: ❌ NOT CREATED';
  END IF;
  
  RAISE NOTICE 'Migration completed successfully! 🎉';
END $$;

-- 12. Show current table structure
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'embeddings' THEN '🆕 NEW'
    ELSE '📋 EXISTING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;