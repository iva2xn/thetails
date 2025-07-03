/*
  # Fix knowledge gap logging and classification

  1. Changes
    - Fix the FOREACH loop syntax error in the previous migration
    - Improve the text classification functions
    - Add better detection for response-like messages
    - Update table comments to clarify purpose

  2. Functions
    - Create improved functions for text classification
    - Add function to detect if a message is a response to the AI
    - Add function to check if a message is substantial enough to log
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

-- Create a function to check if a message looks like a response to the AI
CREATE OR REPLACE FUNCTION is_response_message(text_content text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  lower_content text;
BEGIN
  lower_content := lower(trim(text_content));
  
  -- Check for common response patterns
  RETURN (
    position('none of this' in lower_content) > 0 OR
    position('this didn''t help' in lower_content) > 0 OR
    position('this did not help' in lower_content) > 0 OR
    position('not helpful' in lower_content) > 0 OR
    position('can''t help' in lower_content) > 0 OR
    position('cannot help' in lower_content) > 0 OR
    position('forward the issue' in lower_content) > 0 OR
    position('contact support' in lower_content) > 0 OR
    position('talk to someone' in lower_content) > 0 OR
    position('i have an issue' in lower_content) > 0 OR
    position('i have a problem' in lower_content) > 0 OR
    position('i have a question' in lower_content) > 0
  );
END;
$$;

-- Create a function to check if a message is a simple greeting or too short to be meaningful
CREATE OR REPLACE FUNCTION is_substantial_message(text_content text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  lower_content text;
  word_count int;
  is_greeting boolean := false;
  common_greetings text[] := ARRAY[
    'hi', 'hey', 'hello', 'test', 'hola', 'yo', 'sup', 'howdy', 'greetings', 
    'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you',
    'help', 'help me', 'can you help', 'please help'
  ];
  i int;
BEGIN
  -- Check if text is too short (less than 10 characters)
  IF length(trim(text_content)) < 10 THEN
    RETURN false;
  END IF;
  
  lower_content := lower(trim(text_content));
  
  -- Check if it's just a common greeting
  FOR i IN 1..array_length(common_greetings, 1) LOOP
    IF lower_content = common_greetings[i] THEN
      is_greeting := true;
      EXIT;
    END IF;
  END LOOP;
  
  IF is_greeting THEN
    RETURN false;
  END IF;
  
  -- Count words (rough approximation)
  word_count := array_length(regexp_split_to_array(lower_content, '\s+'), 1);
  
  -- If it's just 1-2 words, it's probably not substantial
  IF word_count <= 2 THEN
    RETURN false;
  END IF;
  
  -- Check if it looks like a response to the AI
  IF is_response_message(text_content) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create a function to analyze text and determine if it's an issue or inquiry
CREATE OR REPLACE FUNCTION is_text_an_issue(text_content text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  lower_content text;
  issue_score int := 0;
  inquiry_score int := 0;
  issue_keywords text[] := ARRAY['error', 'bug', 'problem', 'broken', 'not working', 'fails', 'crash', 'issue', 'fix', 'wrong'];
  inquiry_keywords text[] := ARRAY['how', 'what', 'when', 'where', 'why', 'can', 'could', 'would', 'should', 'is', 'are', 'explain'];
  i int;
BEGIN
  lower_content := lower(text_content);
  
  -- Check for issue keywords
  FOR i IN 1..array_length(issue_keywords, 1) LOOP
    IF position(issue_keywords[i] in lower_content) > 0 THEN 
      issue_score := issue_score + 1; 
    END IF;
  END LOOP;
  
  -- Check for inquiry keywords
  FOR i IN 1..array_length(inquiry_keywords, 1) LOOP
    IF position(inquiry_keywords[i] in lower_content) > 0 THEN 
      inquiry_score := inquiry_score + 1; 
    END IF;
  END LOOP;
  
  -- Determine type based on keyword counts
  RETURN issue_score > inquiry_score;
END;
$$;

-- Test the classification functions with some examples
SELECT 
  'The login button is broken' as text,
  is_text_an_issue('The login button is broken') as is_issue,
  is_substantial_message('The login button is broken') as is_substantial,
  is_response_message('The login button is broken') as is_response
UNION ALL
SELECT 
  'How do I reset my password?' as text,
  is_text_an_issue('How do I reset my password?') as is_issue,
  is_substantial_message('How do I reset my password?') as is_substantial,
  is_response_message('How do I reset my password?') as is_response
UNION ALL
SELECT 
  'Hey' as text,
  is_text_an_issue('Hey') as is_issue,
  is_substantial_message('Hey') as is_substantial,
  is_response_message('Hey') as is_response
UNION ALL
SELECT 
  'I have an issue with the login' as text,
  is_text_an_issue('I have an issue with the login') as is_issue,
  is_substantial_message('I have an issue with the login') as is_substantial,
  is_response_message('I have an issue with the login') as is_response;

-- Add a comment to explain the knowledge gap detection feature
COMMENT ON TABLE issues IS 'Stores issue reports, including those automatically detected by the AI when it encounters knowledge gaps. Issues are problems that need fixing.';
COMMENT ON TABLE inquiries IS 'Stores inquiries and questions, including those automatically detected by the AI when it encounters knowledge gaps. Inquiries are requests for information.';