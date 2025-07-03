/*
  # Add Knowledge Gap Tracking Support

  1. New Policies
    - Add policies to allow the AI service to create inquiries and issues on behalf of users
    - This enables the knowledge gap tracking feature where the AI creates entries when it can't answer questions

  2. Changes
    - No schema changes required, only policy updates
    - Existing tables and RLS setup remain the same
*/

-- Create a policy to allow the service role to create inquiries for any user
CREATE POLICY "Service can create inquiries for users"
  ON inquiries FOR INSERT TO service_role
  WITH CHECK (true);

-- Create a policy to allow the service role to create issues for any user
CREATE POLICY "Service can create issues for users"
  ON issues FOR INSERT TO service_role
  WITH CHECK (true);

-- Verify the policies were created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inquiries' 
    AND policyname = 'Service can create inquiries for users'
  ) THEN
    RAISE NOTICE 'Service policy for inquiries created successfully ✅';
  ELSE
    RAISE NOTICE 'Failed to create service policy for inquiries ❌';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'issues' 
    AND policyname = 'Service can create issues for users'
  ) THEN
    RAISE NOTICE 'Service policy for issues created successfully ✅';
  ELSE
    RAISE NOTICE 'Failed to create service policy for issues ❌';
  END IF;
END $$;