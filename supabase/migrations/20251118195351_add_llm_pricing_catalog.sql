/*
  # LLM Pricing Catalog Schema
  
  This migration adds support for the Admin Pricing Catalog to manage LLM token pricing.
  
  1. New Tables
    - `llm_pricing` - Stores pricing for different LLM models
    - `pricing_version_log` - Tracks pricing updates
  
  2. Security
    - Enable RLS on all tables
    - Public read access for pricing data
  
  3. Initial Data
    - Seed with comprehensive LLM pricing
*/

-- Create llm_pricing table
CREATE TABLE IF NOT EXISTS llm_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  model text NOT NULL,
  input_cost_per_million numeric NOT NULL CHECK (input_cost_per_million >= 0),
  output_cost_per_million numeric NOT NULL CHECK (output_cost_per_million >= 0),
  comment text DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider, model)
);

ALTER TABLE llm_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read llm pricing"
  ON llm_pricing
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage llm pricing"
  ON llm_pricing
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create pricing_version_log table
CREATE TABLE IF NOT EXISTS pricing_version_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  updated_by text NOT NULL DEFAULT 'admin',
  change_summary text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_version_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read version log"
  ON pricing_version_log
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create version log"
  ON pricing_version_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed LLM pricing data
INSERT INTO llm_pricing (provider, model, input_cost_per_million, output_cost_per_million, comment, enabled) VALUES
  ('DeepSeek', 'DeepSeek R1', 550, 2190, 'Conversation with agent', true),
  ('OpenAI', 'gpt-4o', 2500, 10000, 'Conversation with agent', true),
  ('OpenAI', 'gpt-4o-mini', 150, 600, 'Conversation with agent', true),
  ('OpenAI', 'o1-preview', 15000, 60000, 'Conversation with agent', true),
  ('OpenAI', 'o1-mini', 3000, 12000, 'Conversation with agent', true),
  ('OpenAI', 'o3-mini', 1100, 4400, 'Conversation with agent', true),
  ('OpenAI', '4.1', 3000, 12000, 'Conversation with agent', true),
  ('OpenAI', 'gpt-5', 1250, 10000, 'Conversation with agent', true),
  ('OpenAI', 'gpt-5-mini', 250, 2000, 'Conversation with agent', true),
  ('OpenAI', 'gpt-5-nano', 50, 400, 'Conversation with agent', true),
  ('Anthropic', 'Claude 3.5 Sonnet', 3000, 15000, 'Conversation with agent', true),
  ('Anthropic', 'Claude 3.5 Haiku', 1000, 5000, 'Conversation with agent', true),
  ('Gemini', 'gemini-2.0-flash-exp', 100, 400, 'Conversation with agent', true),
  ('Gemini', 'gemini-2.0-flash-lite', 75, 300, 'Conversation with agent', true),
  ('Gemini', 'gemini-1.5-flash', 75, 300, 'Conversation with agent', true),
  ('Gemini', 'gemini-1.5-pro', 1250, 5000, 'Conversation with agent', true),
  ('Gemini', 'gemini-2.5-pro', 2500, 15000, 'Conversation with agent', true),
  ('Gemini', 'gemini-2.5-flash', 150, 3500, 'Conversation with agent', true),
  ('Groq', 'Groq Llama 3.3 70B Versatile', 590, 790, 'Conversation with agent', true),
  ('Groq', 'Groq Llama 3.1 8B Instant', 50, 80, 'Conversation with agent', true),
  ('Groq', 'Groq Mixtral 8x7B Instruct', 240, 240, 'Conversation with agent', true)
ON CONFLICT (provider, model) DO UPDATE SET
  input_cost_per_million = EXCLUDED.input_cost_per_million,
  output_cost_per_million = EXCLUDED.output_cost_per_million,
  comment = EXCLUDED.comment,
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- Create initial version log entry
INSERT INTO pricing_version_log (version, updated_by, change_summary) VALUES
  ('2025.11.16-01', 'admin', 'Initial LLM pricing catalog with 21 models')
ON CONFLICT DO NOTHING;