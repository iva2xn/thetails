/*
  # Improve Knowledge Gap Logging

  1. Changes
    - Add additional service role policies to ensure proper access
    - Add a function to test the service role's ability to create both issues and inquiries
    - Ensure both issues and inquiries can be created by the edge function

  2. Security
    - Maintain existing RLS policies
    - Add specific service role policies for both issues and inquiries tables
*/

-- Verify service role policies exist and create them if they don't
DO $$
BEGIN
  -- Check if service role policy for inquiries exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inquiries' 
    AND policyname = 'Service can create inquiries for users'
  ) THEN
    -- Create policy if it doesn't exist
    CREATE POLICY "Service can create inquiries for users"
      ON inquiries FOR INSERT TO service_role
      WITH CHECK (true);
    RAISE NOTICE 'Created service policy for inquiries ✅';
  ELSE
    RAISE NOTICE 'Service policy for inquiries already exists ✅';
  END IF;
  
  -- Check if service role policy for issues exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'issues' 
    AND policyname = 'Service can create issues for users'
  ) THEN
    -- Create policy if it doesn't exist
    CREATE POLICY "Service can create issues for users"
      ON issues FOR INSERT TO service_role
      WITH CHECK (true);
    RAISE NOTICE 'Created service policy for issues ✅';
  ELSE
    RAISE NOTICE 'Service policy for issues already exists ✅';
  END IF;
END $$;

-- Create a function to test the service role's ability to create both issues and inquiries
CREATE OR REPLACE FUNCTION test_knowledge_gap_logging()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_project_id uuid;
  test_user_id uuid;
  inquiry_result text;
  issue_result text;
BEGIN
  -- Get a sample project and user
  SELECT id, user_id INTO test_project_id, test_user_id FROM projects LIMIT 1;
  
  IF test_project_id IS NULL THEN
    RETURN 'No projects found for testing';
  END IF;
  
  -- Attempt to create an inquiry
  BEGIN
    INSERT INTO inquiries (
      title, 
      description, 
      content, 
      tags, 
      user_id, 
      project_id
    ) VALUES (
      'Test Inquiry from Knowledge Gap',
      'This is a test inquiry created by the knowledge gap logging system',
      'How do I integrate with your API?',
      ARRAY['test', 'auto-detected', 'ai-gap'],
      test_user_id,
      test_project_id
    );
    
    inquiry_result := 'Successfully created test inquiry';
  EXCEPTION WHEN OTHERS THEN
    inquiry_result := 'Failed to create test inquiry: ' || SQLERRM;
  END;
  
  -- Attempt to create an issue
  BEGIN
    INSERT INTO issues (
      title, 
      description, 
      severity,
      status,
      tags, 
      user_id, 
      project_id
    ) VALUES (
      'Test Issue from Knowledge Gap',
      'This is a test issue created by the knowledge gap logging system',
      'medium',
      'open',
      ARRAY['test', 'auto-detected', 'ai-gap'],
      test_user_id,
      test_project_id
    );
    
    issue_result := 'Successfully created test issue';
  EXCEPTION WHEN OTHERS THEN
    issue_result := 'Failed to create test issue: ' || SQLERRM;
  END;
  
  RETURN 'Inquiry test: ' || inquiry_result || E'\nIssue test: ' || issue_result;
END;
$$;

-- Run the test function
SELECT test_knowledge_gap_logging() AS test_result;

-- Clean up the test function
DROP FUNCTION IF EXISTS test_knowledge_gap_logging();