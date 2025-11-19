/*
  # Force Schema Cache Refresh for business_formulas

  1. Purpose
    - Force PostgREST to recognize the business_formulas table
    - Add a comment to trigger schema cache update

  2. Changes
    - Add table comment to business_formulas
    - This operation will force PostgREST to refresh its schema cache
*/

-- Add comment to force schema cache refresh
COMMENT ON TABLE business_formulas IS 'Stores calculation formulas used throughout the pricing engine';

-- Ensure RLS is enabled
ALTER TABLE business_formulas ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they're registered
DROP POLICY IF EXISTS "Public can read business formulas" ON business_formulas;
CREATE POLICY "Public can read business formulas"
  ON business_formulas FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert business formulas" ON business_formulas;
CREATE POLICY "Authenticated users can insert business formulas"
  ON business_formulas FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update business formulas" ON business_formulas;
CREATE POLICY "Authenticated users can update business formulas"
  ON business_formulas FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete business formulas" ON business_formulas;
CREATE POLICY "Authenticated users can delete business formulas"
  ON business_formulas FOR DELETE 
  TO authenticated 
  USING (true);

-- Force schema reload
NOTIFY pgrst, 'reload schema';
