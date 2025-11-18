/*
  # Add Enabled Status to Credit Settings
  
  1. Changes
    - Add `enabled` boolean column to `credit_settings_global` table
    - Add `enabled` boolean column to `credit_settings_overrides` table
    - Default all existing categories to enabled (true)
  
  2. Purpose
    - Allow users to enable/disable specific credit categories
    - Disabled categories won't be included in calculations
    - Provides more granular control over pricing model
  
  3. Notes
    - When a category is disabled globally, it can still be enabled via override
    - Override enabled status takes precedence over global setting
*/

-- Add enabled column to credit_settings_global
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_settings_global' AND column_name = 'enabled'
  ) THEN
    ALTER TABLE credit_settings_global ADD COLUMN enabled boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Add enabled column to credit_settings_overrides
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_settings_overrides' AND column_name = 'enabled'
  ) THEN
    ALTER TABLE credit_settings_overrides ADD COLUMN enabled boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Update all existing records to be enabled by default
UPDATE credit_settings_global SET enabled = true WHERE enabled IS NULL;
UPDATE credit_settings_overrides SET enabled = true WHERE enabled IS NULL;