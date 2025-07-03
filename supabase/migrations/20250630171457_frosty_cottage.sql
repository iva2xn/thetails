/*
  # Add service role policies and knowledge gap detection

  1. Service Role Policies
    - Add policies for service_role to create inquiries and issues
    - These policies allow the edge functions to create records on behalf of users
  
  2. Documentation
    - Add comments to tables to explain knowledge gap detection feature
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

-- Create a function to analyze text and determine if it's an issue or inquiry
-- This is for testing purposes only - the actual classification happens in the edge function
CREATE OR REPLACE FUNCTION classify_text_type(text_content text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  lower_content text;
  issue_score int := 0;
  inquiry_score int := 0;
BEGIN
  lower_content := lower(text_content);
  
  -- Check for issue keywords
  IF position('error' in lower_content) > 0 THEN issue_score := issue_score + 1; END IF;
  IF position('bug' in lower_content) > 0 THEN issue_score := issue_score + 1; END IF;
  IF position('problem' in lower_content) > 0 THEN issue_score := issue_score + 1; END IF;
  IF position('broken' in lower_content) > 0 THEN issue_score := issue_score + 1; END IF;
  IF position('not working' in lower_content) > 0 THEN issue_score := issue_score + 1; END IF;
  IF position('fails' in lower_content) > 0 THEN issue_score := issue_score + 1; END IF;
  IF position('crash' in lower_content) > 0 THEN issue_score := issue_score + 1; END IF;
  IF position('issue' in lower_content) > 0 THEN issue_score := issue_score + 1; END IF;
  
  -- Check for inquiry keywords
  IF position('how' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('what' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('when' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('where' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('why' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('can' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('could' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('would' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('should' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('is' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  IF position('are' in lower_content) > 0 THEN inquiry_score := inquiry_score + 1; END IF;
  
  -- Determine type based on keyword counts
  IF issue_score > inquiry_score THEN
    RETURN 'issue';
  ELSE
    RETURN 'inquiry';
  END IF;
END;
$$;

-- Test the classification function with some examples
SELECT 
  'The login button is broken' as text,
  classify_text_type('The login button is broken') as classification
UNION ALL
SELECT 
  'How do I reset my password?' as text,
  classify_text_type('How do I reset my password?') as classification
UNION ALL
SELECT 
  'I keep getting an error when uploading files' as text,
  classify_text_type('I keep getting an error when uploading files') as classification
UNION ALL
SELECT 
  'What payment methods do you accept?' as text,
  classify_text_type('What payment methods do you accept?') as classification;

-- Clean up the test function (comment out if you want to keep it for testing)
DROP FUNCTION IF EXISTS classify_text_type(text);

-- Add a comment to explain the knowledge gap detection feature
COMMENT ON TABLE issues IS 'Stores issue reports, including those automatically detected by the AI when it encounters knowledge gaps';
COMMENT ON TABLE inquiries IS 'Stores inquiries and questions, including those automatically detected by the AI when it encounters knowledge gaps';