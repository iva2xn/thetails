/*
  # Fix knowledge gap logging to use description field

  1. Changes
    - Update the chat-query function to store the full issue/inquiry content in the description field
    - Keep titles shorter and more descriptive with "Knowledge Gap:" prefix
    - Add more sophisticated filtering to prevent logging conversational messages

  2. Notes
    - This migration adds test functions to demonstrate the improved classification
    - The actual implementation is in the edge function (chat-query)
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
    position('talk to someone' in lower_content) > 0
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
  common_greetings text[] := ARRAY[
    'hi', 'hey', 'hello', 'test', 'hola', 'yo', 'sup', 'howdy', 'greetings', 
    'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you',
    'help', 'help me', 'can you help', 'please help'
  ];
  greeting text;
BEGIN
  -- Check if text is too short (less than 10 characters)
  IF length(trim(text_content)) < 10 THEN
    RETURN false;
  END IF;
  
  lower_content := lower(trim(text_content));
  
  -- Check if it's just a common greeting
  FOREACH greeting IN ARRAY common_greetings LOOP
    IF lower_content = greeting THEN
      RETURN false;
    END IF;
  END LOOP;
  
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
  'None of this helped. Can you forward the issue to the team?' as text,
  is_text_an_issue('None of this helped. Can you forward the issue to the team?') as is_issue,
  is_substantial_message('None of this helped. Can you forward the issue to the team?') as is_substantial,
  is_response_message('None of this helped. Can you forward the issue to the team?') as is_response;

-- Update table comments to reflect improved classification
COMMENT ON TABLE issues IS 'Stores issue reports, including those automatically detected by the AI when it encounters knowledge gaps. Issues are problems that need fixing.';
COMMENT ON TABLE inquiries IS 'Stores inquiries and questions, including those automatically detected by the AI when it encounters knowledge gaps. Inquiries are requests for information.';

-- Keep the test functions for documentation purposes
-- They can be dropped later if needed
-- DROP FUNCTION IF EXISTS is_text_an_issue(text);
-- DROP FUNCTION IF EXISTS is_substantial_message(text);
-- DROP FUNCTION IF EXISTS is_response_message(text);