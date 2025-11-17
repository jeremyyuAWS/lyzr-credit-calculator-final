/*
  # Fix LLM Pricing RLS Policies
  
  This migration updates the RLS policies to allow public (anonymous) access
  to manage LLM pricing data since the admin panel doesn't require authentication.
  
  1. Changes
    - Drop restrictive authenticated-only policy
    - Add public policies for INSERT, UPDATE, DELETE operations
    - Maintain read access for everyone
  
  2. Security Note
    - This allows anonymous users to modify pricing data
    - Suitable for internal admin tools without auth
    - Consider adding authentication in production
*/

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can manage llm pricing" ON llm_pricing;

-- Create separate policies for public access to all operations
CREATE POLICY "Public can insert llm pricing"
  ON llm_pricing
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update llm pricing"
  ON llm_pricing
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete llm pricing"
  ON llm_pricing
  FOR DELETE
  TO public
  USING (true);

-- Also update pricing_version_log to allow public inserts
CREATE POLICY "Public can insert version log"
  ON pricing_version_log
  FOR INSERT
  TO public
  WITH CHECK (true);
