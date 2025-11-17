/*
  # Add Public Read Access for Pricing Scenarios and Competitor Pricing

  1. Changes
    - Add public read access to pricing_scenarios table
    - Add public read access to competitor_pricing table
    - Keep write operations authenticated for security

  This allows the calculator app to display scenarios and competitor data
  without requiring user authentication.
*/

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  -- Drop and recreate pricing_scenarios public read policy
  DROP POLICY IF EXISTS "Public users can read scenarios" ON pricing_scenarios;
  CREATE POLICY "Public users can read scenarios"
    ON pricing_scenarios FOR SELECT
    TO anon
    USING (true);

  -- Drop and recreate competitor_pricing public read policy
  DROP POLICY IF EXISTS "Public users can read competitor pricing" ON competitor_pricing;
  CREATE POLICY "Public users can read competitor pricing"
    ON competitor_pricing FOR SELECT
    TO anon
    USING (true);
END $$;
