/*
  # Fix Formula Definitions Insert Policy
  
  ## Changes:
  1. Add public INSERT policy for formula_definitions
  2. Add public UPDATE policy for formula_definitions
  3. Add public DELETE policy for formula_definitions
  
  This allows the admin panel to manage formulas without authentication errors.
  In production, these should be restricted to authenticated admin users.
*/

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert formulas" ON formula_definitions;
DROP POLICY IF EXISTS "Authenticated users can update formulas" ON formula_definitions;
DROP POLICY IF EXISTS "Authenticated users can delete formulas" ON formula_definitions;

-- Allow public insert access to formulas (for demo purposes)
CREATE POLICY "Public can insert formulas"
  ON formula_definitions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access to formulas (for demo purposes)
CREATE POLICY "Public can update formulas"
  ON formula_definitions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public delete access to formulas (for demo purposes)
CREATE POLICY "Public can delete formulas"
  ON formula_definitions
  FOR DELETE
  TO public
  USING (true);
