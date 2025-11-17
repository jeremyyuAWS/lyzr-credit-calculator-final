/*
  # Add Public Read Access for Formulas and Pricing Variables
  
  ## Changes:
  1. Add public SELECT policies for formula_definitions
  2. Add public SELECT policies for pricing_variables
  
  This allows the UI to read formulas and variables without authentication.
  Write operations still require authentication.
*/

-- Drop existing authenticated-only read policies
DROP POLICY IF EXISTS "Authenticated users can read formulas" ON formula_definitions;
DROP POLICY IF EXISTS "Authenticated users can read variables" ON pricing_variables;

-- Allow public read access to formulas
CREATE POLICY "Public can read formulas"
  ON formula_definitions
  FOR SELECT
  TO public
  USING (true);

-- Allow public read access to pricing variables
CREATE POLICY "Public can read pricing variables"
  ON pricing_variables
  FOR SELECT
  TO public
  USING (true);
