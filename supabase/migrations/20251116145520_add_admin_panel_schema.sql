/*
  # Admin Panel Schema Updates
  
  This migration reorganizes the credit pricing structure to support:
  - Runtime Settings (usage-based charges)
  - Setup Costs (one-time creation charges)
  - Discounts & Account Overrides
  
  1. Schema Changes
    - Add `setting_type` column to distinguish 'runtime' vs 'setup'
    - Add `description` column for better documentation
    - Create `account_discounts` table for global and account-level discounts
    - Add discount-related columns to accounts table
  
  2. New Tables
    - `account_discounts`
      - `id` (uuid, primary key)
      - `account_id` (uuid, nullable for global discounts)
      - `discount_percentage` (numeric) - Percentage discount (0-100)
      - `discount_type` (text) - 'global', 'account', or 'feature'
      - `feature_category` (text, nullable) - Specific feature for feature-level discounts
      - `enabled` (boolean) - Active status
      - `created_at`, `updated_at` (timestamptz)
  
  3. Data Migration
    - Update existing categories with setting_type
    - Add comprehensive runtime and setup categories
  
  4. Security
    - Maintain existing RLS policies
    - Add RLS for new account_discounts table
*/

-- Add new columns to credit_settings_global if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_settings_global' AND column_name = 'setting_type'
  ) THEN
    ALTER TABLE credit_settings_global ADD COLUMN setting_type text NOT NULL DEFAULT 'runtime';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_settings_global' AND column_name = 'description'
  ) THEN
    ALTER TABLE credit_settings_global ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

-- Create account_discounts table
CREATE TABLE IF NOT EXISTS account_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  discount_percentage numeric NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_type text NOT NULL DEFAULT 'account' CHECK (discount_type IN ('global', 'account', 'feature')),
  feature_category text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE account_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read account discounts"
  ON account_discounts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage account discounts"
  ON account_discounts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add discount columns to accounts table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'global_discount_percentage'
  ) THEN
    ALTER TABLE accounts ADD COLUMN global_discount_percentage numeric DEFAULT 0 CHECK (global_discount_percentage >= 0 AND global_discount_percentage <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'billing_mode'
  ) THEN
    ALTER TABLE accounts ADD COLUMN billing_mode text DEFAULT 'full-service' CHECK (billing_mode IN ('full-service', 'byom-only', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'custom_model_handling_fee'
  ) THEN
    ALTER TABLE accounts ADD COLUMN custom_model_handling_fee numeric DEFAULT 25 CHECK (custom_model_handling_fee >= 0 AND custom_model_handling_fee <= 100);
  END IF;
END $$;

-- Clear existing settings to rebuild with proper categorization
DELETE FROM credit_settings_global;

-- Insert Runtime Settings
INSERT INTO credit_settings_global (category, price_credits, unit, setting_type, description, enabled) VALUES
  -- Model Handling
  ('Model Handling Fee', 25, '% of token cost', 'runtime', 'Percentage markup on LLM token costs', true),
  ('Token Processing (Input)', 0.003, 'per 1K tokens', 'runtime', 'Cost per 1000 input tokens', true),
  ('Token Processing (Output)', 0.006, 'per 1K tokens', 'runtime', 'Cost per 1000 output tokens', true),
  ('Inter-Agent Communication', 0.002, 'per message', 'runtime', 'Token cost for agent-to-agent messages', true),
  
  -- Runtime Features
  ('KB Retrieve', 0.15, 'per query', 'runtime', 'Knowledge base retrieval operation', true),
  ('Memory Operation', 0.10, 'per operation', 'runtime', 'Read/write memory operations', true),
  ('API Light Call', 0.05, 'per call', 'runtime', 'Lightweight API endpoint call', true),
  ('Deep Crawl', 0.25, 'per page', 'runtime', 'Deep web crawling operation', true),
  ('Web Fetch', 0.08, 'per fetch', 'runtime', 'Simple web content fetch', true),
  ('RAI Run', 0.20, 'per run', 'runtime', 'Responsible AI check execution', true),
  ('Human-in-Loop Run', 0.15, 'per run', 'runtime', 'Human validation checkpoint', true),
  ('Standard Evaluation', 2.00, 'per 100 tests', 'runtime', 'Standard test suite execution', true),
  ('Enterprise Evaluation', 4.00, 'per 50 tests', 'runtime', 'Enterprise-grade evaluation suite', true),
  
  -- Storage Runtime
  ('KB Storage', 0.50, 'per GB/month', 'runtime', 'Knowledge base storage cost', true),
  ('KB Ingestion', 1.00, 'per 1K tokens', 'runtime', 'Cost to ingest data into KB', true)
  
ON CONFLICT (category) DO UPDATE SET
  setting_type = EXCLUDED.setting_type,
  description = EXCLUDED.description,
  price_credits = EXCLUDED.price_credits,
  unit = EXCLUDED.unit,
  enabled = EXCLUDED.enabled;

-- Insert Setup Costs
INSERT INTO credit_settings_global (category, price_credits, unit, setting_type, description, enabled) VALUES
  ('Agent Creation', 50.00, 'per agent', 'setup', 'One-time cost to create an agent', true),
  ('Tool Creation', 25.00, 'per tool', 'setup', 'One-time cost to create a custom tool', true),
  ('KB Creation', 75.00, 'per KB', 'setup', 'One-time cost to create knowledge base', true),
  ('KB Initial Ingestion', 5.00, 'per 1K tokens', 'setup', 'Initial data ingestion into new KB', true),
  ('RAI Setup', 100.00, 'per setup', 'setup', 'Configure Responsible AI guardrails', true),
  ('Evaluation Suite Creation', 150.00, 'per suite', 'setup', 'Create custom evaluation suite', true),
  ('Custom Integration', 200.00, 'per integration', 'setup', 'Setup custom API integration', true),
  ('Pipeline Creation', 125.00, 'per pipeline', 'setup', 'Create data processing pipeline', true)
  
ON CONFLICT (category) DO UPDATE SET
  setting_type = EXCLUDED.setting_type,
  description = EXCLUDED.description,
  price_credits = EXCLUDED.price_credits,
  unit = EXCLUDED.unit,
  enabled = EXCLUDED.enabled;
