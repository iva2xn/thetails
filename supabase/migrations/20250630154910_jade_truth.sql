/*
  # Update similarity_search function threshold

  1. Changes
    - Update the default threshold in similarity_search function from 0.7 to 0.4
    - This allows for more results to be returned by default, improving RAG performance
    - No schema changes, only function definition update
*/

-- Update similarity search function with lower default threshold
CREATE OR REPLACE FUNCTION similarity_search(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.4, -- Changed from 0.7 to 0.4
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

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Updated similarity_search function with 40% threshold ✅';
END $$;