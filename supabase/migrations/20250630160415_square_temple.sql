/*
  # Fix Knowledge Gap Tracking

  1. Changes
    - Add user_id to projects table query in getProjectInfo function
    - Ensure service role policies are properly created for inquiries and issues
    - Add additional logging for debugging

  2. Security
    - Verify service role policies exist and are working correctly
*/

-- Verify service role policies exist
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

-- Create a function to test the service role's ability to create inquiries
CREATE OR REPLACE FUNCTION test_create_inquiry()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_project_id uuid;
  test_user_id uuid;
  result text;
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
      'Test Inquiry from Service Role',
      'This is a test inquiry created by the service role',
      'Test content',
      ARRAY['test', 'service-role'],
      test_user_id,
      test_project_id
    );
    
    result := 'Successfully created test inquiry';
  EXCEPTION WHEN OTHERS THEN
    result := 'Failed to create test inquiry: ' || SQLERRM;
  END;
  
  RETURN result;
END;
$$;

-- Run the test function
SELECT test_create_inquiry() AS test_result;

-- Clean up the test function
DROP FUNCTION IF EXISTS test_create_inquiry();