/*
  # Enable pgvector extension and prepare for Google Cloud integration

  1. Extensions
    - Enable pgvector extension for vector similarity search
    - This allows storing and querying high-dimensional vector embeddings

  2. Vector Support
    - pgvector provides vector data type and similarity search operators
    - Supports cosine distance, L2 distance, and inner product
    - Enables efficient similarity search with indexing (HNSW, IVFFlat)

  3. Preparation for RAG
    - Sets up foundation for Retrieval Augmented Generation
    - Allows storing text embeddings from Vertex AI
    - Enables semantic search capabilities

  Note: Supabase secrets for Google Cloud JSON key should be added via dashboard
*/

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE NOTICE 'pgvector extension is now enabled and ready for use';
  ELSE
    RAISE EXCEPTION 'Failed to enable pgvector extension';
  END IF;
END $$;

-- Create a sample embeddings table structure for future use
-- This demonstrates how to store text embeddings with metadata
CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(1536), -- Common dimension for OpenAI/Vertex AI embeddings
  metadata jsonb DEFAULT '{}',
  source_type text, -- 'context', 'issue', 'inquiry', 'product'
  source_id uuid, -- Reference to the original data item
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient vector similarity search
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS embeddings_project_id_idx ON embeddings(project_id);
CREATE INDEX IF NOT EXISTS embeddings_user_id_idx ON embeddings(user_id);
CREATE INDEX IF NOT EXISTS embeddings_source_type_idx ON embeddings(source_type);
CREATE INDEX IF NOT EXISTS embeddings_source_id_idx ON embeddings(source_id);

-- Enable RLS on embeddings table
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for embeddings
CREATE POLICY "Users can create own embeddings"
  ON embeddings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own embeddings"
  ON embeddings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own embeddings"
  ON embeddings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own embeddings"
  ON embeddings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_embeddings_updated_at
  BEFORE UPDATE ON embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function to perform similarity search
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