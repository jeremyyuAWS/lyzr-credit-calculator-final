/*
  # Feature Pricing Schema
  
  This migration adds support for feature-based pricing as specified in PRD Section 8.
  
  1. New Tables
    - `feature_pricing`
      - `id` (uuid, primary key)
      - `feature_name` (text) - RAG retrieve, Memory op, Tool call, DB query, etc.
      - `cost_credits` (numeric) - Cost in credits per operation
      - `unit` (text) - per query, per call, per op, etc.
      - `category` (text) - runtime, storage, integration
      - `description` (text) - Usage notes
      - `enabled` (boolean) - Active status
      - `created_at`, `updated_at` (timestamptz)
      - UNIQUE(feature_name)
    
    - `setup_costs`
      - `id` (uuid, primary key)
      - `item_name` (text) - Agent, KB, Tool, Eval Suite, etc.
      - `cost_credits` (numeric) - One-time cost in credits
      - `unit` (text) - per agent, per KB, per tool, etc.
      - `description` (text) - Setup notes
      - `enabled` (boolean) - Active status
      - `created_at`, `updated_at` (timestamptz)
      - UNIQUE(item_name)
    
    - `model_handling_fee`
      - `id` (uuid, primary key)
      - `fee_percentage` (numeric) - Markup percentage (e.g., 25 for 25%)
      - `applies_to` (text) - 'lyzr_hosted' or 'all'
      - `description` (text)
      - `enabled` (boolean)
      - `created_at`, `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Public read and write access (internal admin tool)
  
  3. Initial Data
    - Seed with feature costs from PRD Section 8
    - Seed with setup costs from PRD Section 8
    - Add 25% model handling fee
*/

-- Create feature_pricing table
CREATE TABLE IF NOT EXISTS feature_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL UNIQUE,
  cost_credits numeric NOT NULL CHECK (cost_credits >= 0),
  unit text NOT NULL DEFAULT 'per operation',
  category text NOT NULL DEFAULT 'runtime',
  description text DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feature_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read feature pricing"
  ON feature_pricing
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert feature pricing"
  ON feature_pricing
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update feature pricing"
  ON feature_pricing
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete feature pricing"
  ON feature_pricing
  FOR DELETE
  TO public
  USING (true);

-- Create setup_costs table
CREATE TABLE IF NOT EXISTS setup_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL UNIQUE,
  cost_credits numeric NOT NULL CHECK (cost_credits >= 0),
  unit text NOT NULL DEFAULT 'per item',
  description text DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE setup_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read setup costs"
  ON setup_costs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert setup costs"
  ON setup_costs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update setup costs"
  ON setup_costs
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete setup costs"
  ON setup_costs
  FOR DELETE
  TO public
  USING (true);

-- Create model_handling_fee table
CREATE TABLE IF NOT EXISTS model_handling_fee (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_percentage numeric NOT NULL CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  applies_to text NOT NULL DEFAULT 'lyzr_hosted',
  description text DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE model_handling_fee ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read model handling fee"
  ON model_handling_fee
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert model handling fee"
  ON model_handling_fee
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update model handling fee"
  ON model_handling_fee
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete model handling fee"
  ON model_handling_fee
  FOR DELETE
  TO public
  USING (true);

-- Seed feature pricing data from PRD Section 8.4
INSERT INTO feature_pricing (feature_name, cost_credits, unit, category, description, enabled) VALUES
  ('RAG Query', 0.05, 'per query', 'runtime', 'Retrieval-Augmented Generation query cost', true),
  ('Tool Call', 1.00, 'per call', 'runtime', 'External tool/API invocation cost', true),
  ('DB Query', 0.02, 'per query', 'runtime', 'Database query execution cost', true),
  ('Memory Operation', 0.005, 'per operation', 'runtime', 'Agent memory read/write operation', true),
  ('Reflection Run', 0.05, 'per run', 'runtime', 'Safety/quality reflection check', true),
  ('Web Fetch', 0.10, 'per fetch', 'integration', 'Single web page fetch cost', true),
  ('Deep Crawl Page', 0.25, 'per page', 'integration', 'Deep web crawl per page cost', true),
  ('Inter-Agent Token', 0.000001, 'per token', 'runtime', 'Agent-to-agent communication token cost (1C per 1M tokens)', true)
ON CONFLICT (feature_name) DO UPDATE SET
  cost_credits = EXCLUDED.cost_credits,
  unit = EXCLUDED.unit,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- Seed setup costs data from PRD Section 8.5
INSERT INTO setup_costs (item_name, cost_credits, unit, description, enabled) VALUES
  ('Agent Setup', 0.05, 'per agent', 'One-time cost to configure and deploy an agent', true),
  ('Knowledge Base', 1.00, 'per KB', 'One-time cost to setup and index a knowledge base', true),
  ('Tool Integration', 0.10, 'per tool', 'One-time cost to integrate external tool/API', true),
  ('Evaluation Suite', 2.00, 'per suite', 'One-time cost to setup evaluation and testing suite', true)
ON CONFLICT (item_name) DO UPDATE SET
  cost_credits = EXCLUDED.cost_credits,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- Seed model handling fee (25% markup for Lyzr-hosted models)
INSERT INTO model_handling_fee (fee_percentage, applies_to, description, enabled) VALUES
  (25, 'lyzr_hosted', 'Model hosting and management fee applied to Lyzr-hosted models', true)
ON CONFLICT DO NOTHING;
