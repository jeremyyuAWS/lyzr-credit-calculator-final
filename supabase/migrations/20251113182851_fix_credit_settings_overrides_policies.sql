/*
  # Fix Credit Settings Overrides Policies
  
  1. Changes
    - Update RLS policies for credit_settings_overrides to allow proper inserts and updates
    - Ensure the policies support both reading and writing override data
  
  2. Purpose
    - Fix toggle functionality in Global Settings Modal
    - Allow account-level overrides to be created and updated
  
  3. Security
    - Keep public read access for demo purposes
    - Allow all operations for simplicity (this is a demo app)
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can manage credit overrides" ON credit_settings_overrides;

-- Create separate policies for each operation
CREATE POLICY "Anyone can insert credit overrides"
  ON credit_settings_overrides
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update credit overrides"
  ON credit_settings_overrides
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete credit overrides"
  ON credit_settings_overrides
  FOR DELETE
  TO public
  USING (true);
