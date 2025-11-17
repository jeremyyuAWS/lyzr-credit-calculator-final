/*
  # Internal Pricing Simulator Schema
  
  1. New Tables
    - `formula_definitions`
      - Stores editable calculation formulas for PMs to modify
      - Includes formula name, expression, variables used, and version tracking
    
    - `pricing_variables`
      - Excel-like storage for all pricing constants (multipliers, rates, fees)
      - Supports categories, override capability, and historical tracking
    
    - `pricing_scenarios`
      - Side-by-side scenario testing configurations
      - Allows A/B/C comparison of different pricing models
    
    - `competitor_pricing`
      - Benchmarking data for OpenAI, Claude, Bedrock, Groq, 11x, LangSmith
      - Tracks competitor rates for margin analysis
    
    - `calculation_debug_traces`
      - Step-by-step calculation breakdowns for transparency
      - Shows intermediate values, multipliers, and formula evaluation
  
  2. Security
    - Enable RLS on all tables
    - Restrict to authenticated users only (internal tool)
*/

-- Formula Definitions Table
CREATE TABLE IF NOT EXISTS formula_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_name text NOT NULL,
  formula_key text UNIQUE NOT NULL,
  formula_expression text NOT NULL,
  description text,
  variables_used jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE formula_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read formulas"
  ON formula_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert formulas"
  ON formula_definitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update formulas"
  ON formula_definitions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete formulas"
  ON formula_definitions FOR DELETE
  TO authenticated
  USING (true);

-- Pricing Variables Table
CREATE TABLE IF NOT EXISTS pricing_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_key text UNIQUE NOT NULL,
  variable_name text NOT NULL,
  variable_value numeric NOT NULL,
  variable_type text DEFAULT 'multiplier',
  category text DEFAULT 'general',
  description text,
  unit text,
  min_value numeric,
  max_value numeric,
  is_overridden boolean DEFAULT false,
  original_value numeric,
  last_modified_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read variables"
  ON pricing_variables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert variables"
  ON pricing_variables FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update variables"
  ON pricing_variables FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete variables"
  ON pricing_variables FOR DELETE
  TO authenticated
  USING (true);

-- Pricing Scenarios Table
CREATE TABLE IF NOT EXISTS pricing_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name text NOT NULL,
  scenario_description text,
  configuration jsonb NOT NULL,
  variables_snapshot jsonb,
  formulas_snapshot jsonb,
  results jsonb,
  is_baseline boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read scenarios"
  ON pricing_scenarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert scenarios"
  ON pricing_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update scenarios"
  ON pricing_scenarios FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete scenarios"
  ON pricing_scenarios FOR DELETE
  TO authenticated
  USING (true);

-- Competitor Pricing Table
CREATE TABLE IF NOT EXISTS competitor_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name text NOT NULL,
  competitor_key text UNIQUE NOT NULL,
  pricing_model text,
  input_token_cost_per_million numeric,
  output_token_cost_per_million numeric,
  additional_fees jsonb DEFAULT '{}'::jsonb,
  notes text,
  source_url text,
  last_verified timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE competitor_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read competitor pricing"
  ON competitor_pricing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert competitor pricing"
  ON competitor_pricing FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitor pricing"
  ON competitor_pricing FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete competitor pricing"
  ON competitor_pricing FOR DELETE
  TO authenticated
  USING (true);

-- Calculation Debug Traces Table
CREATE TABLE IF NOT EXISTS calculation_debug_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_name text NOT NULL,
  workflow_description text,
  input_parameters jsonb NOT NULL,
  calculation_steps jsonb NOT NULL,
  final_results jsonb NOT NULL,
  formulas_used jsonb,
  variables_used jsonb,
  execution_time_ms integer,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calculation_debug_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read debug traces"
  ON calculation_debug_traces FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert debug traces"
  ON calculation_debug_traces FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete debug traces"
  ON calculation_debug_traces FOR DELETE
  TO authenticated
  USING (true);

-- Insert default formulas
INSERT INTO formula_definitions (formula_key, formula_name, formula_expression, description, category, variables_used) VALUES
  ('credits_per_transaction', 'Credits Per Transaction', 'baseCredits * complexityMultiplier * agentMultiplier * scenarioMultiplier', 'Calculate credits consumed per single transaction', 'core', '["baseCredits", "complexityMultiplier", "agentMultiplier", "scenarioMultiplier"]'::jsonb),
  ('monthly_credits', 'Monthly Credits', 'creditsPerTransaction * registrationsPerDay * workingDaysPerMonth', 'Calculate total monthly credit consumption', 'core', '["creditsPerTransaction", "registrationsPerDay", "workingDaysPerMonth"]'::jsonb),
  ('monthly_cost', 'Monthly Cost', 'monthlyCredits * creditPrice', 'Calculate monthly cost in USD', 'core', '["monthlyCredits", "creditPrice"]'::jsonb),
  ('annual_cost', 'Annual Cost', 'monthlyCost * 12', 'Calculate annual cost in USD', 'core', '["monthlyCost"]'::jsonb),
  ('token_cost', 'Token Cost', '(inputTokens * inputCostPerMillion / 1000000) + (outputTokens * outputCostPerMillion / 1000000)', 'Calculate raw token cost', 'tokens', '["inputTokens", "outputTokens", "inputCostPerMillion", "outputCostPerMillion"]'::jsonb),
  ('handling_fee', 'Model Handling Fee', 'tokenCost * (1 + handlingFeePercentage / 100)', 'Apply handling fee to token cost', 'fees', '["tokenCost", "handlingFeePercentage"]'::jsonb)
ON CONFLICT (formula_key) DO NOTHING;

-- Insert default pricing variables
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit) VALUES
  ('base_credits', 'Base Credits', 40, 'credits', 'core', 'Base credit consumption per transaction', 'credits'),
  ('credit_price', 'Credit Price', 0.008, 'price', 'core', 'Cost per credit in USD', 'USD'),
  ('complexity_simple', 'Complexity: Simple', 0.8, 'multiplier', 'complexity', 'Multiplier for simple workflows', 'x'),
  ('complexity_moderate', 'Complexity: Moderate', 1.2, 'multiplier', 'complexity', 'Multiplier for moderate workflows', 'x'),
  ('complexity_complex', 'Complexity: Complex', 1.6, 'multiplier', 'complexity', 'Multiplier for complex workflows', 'x'),
  ('complexity_enterprise', 'Complexity: Enterprise', 2.4, 'multiplier', 'complexity', 'Multiplier for enterprise workflows', 'x'),
  ('agent_single', 'Agent Type: Single', 0.8, 'multiplier', 'agents', 'Multiplier for single agent', 'x'),
  ('agent_multi', 'Agent Type: Multi', 1.2, 'multiplier', 'agents', 'Multiplier for multi-agent', 'x'),
  ('agent_orchestrated', 'Agent Type: Orchestrated', 1.6, 'multiplier', 'agents', 'Multiplier for orchestrated agents', 'x'),
  ('scenario_optimized', 'Scenario: Optimized', 0.6, 'multiplier', 'scenarios', 'Multiplier for optimized scenario', 'x'),
  ('scenario_standard', 'Scenario: Standard', 0.8, 'multiplier', 'scenarios', 'Multiplier for standard scenario', 'x'),
  ('scenario_premium', 'Scenario: Premium', 1.04, 'multiplier', 'scenarios', 'Multiplier for premium scenario', 'x'),
  ('handling_fee_percentage', 'Model Handling Fee', 25, 'percentage', 'fees', 'Percentage fee for Lyzr-hosted models', '%'),
  ('rag_query_cost', 'RAG Query Cost', 0.05, 'price', 'features', 'Cost per RAG query', 'credits'),
  ('tool_call_cost', 'Tool Call Cost', 1.0, 'price', 'features', 'Cost per tool call', 'credits'),
  ('web_fetch_cost', 'Web Fetch Cost', 0.1, 'price', 'features', 'Cost per web fetch', 'credits'),
  ('deep_crawl_page_cost', 'Deep Crawl Page Cost', 0.25, 'price', 'features', 'Cost per deep crawl page', 'credits')
ON CONFLICT (variable_key) DO NOTHING;

-- Insert competitor pricing data
INSERT INTO competitor_pricing (competitor_key, competitor_name, pricing_model, input_token_cost_per_million, output_token_cost_per_million, notes) VALUES
  ('openai_gpt4', 'OpenAI GPT-4', 'Pay-per-token', 30.00, 60.00, 'GPT-4 pricing as of 2024'),
  ('openai_gpt4_turbo', 'OpenAI GPT-4 Turbo', 'Pay-per-token', 10.00, 30.00, 'GPT-4 Turbo pricing'),
  ('anthropic_claude_opus', 'Anthropic Claude Opus', 'Pay-per-token', 15.00, 75.00, 'Claude 3 Opus pricing'),
  ('anthropic_claude_sonnet', 'Anthropic Claude Sonnet', 'Pay-per-token', 3.00, 15.00, 'Claude 3 Sonnet pricing'),
  ('google_gemini_pro', 'Google Gemini Pro', 'Pay-per-token', 0.50, 1.50, 'Gemini Pro pricing'),
  ('aws_bedrock_claude', 'AWS Bedrock Claude', 'Pay-per-token', 3.00, 15.00, 'Bedrock Claude pricing'),
  ('groq_llama', 'Groq Llama 3', 'Pay-per-token', 0.10, 0.10, 'Groq ultra-fast inference'),
  ('11x_ai', '11x AI', 'Credit-based', 5.00, 10.00, 'Estimated 11x AI pricing'),
  ('langsmith', 'LangSmith', 'Usage-based', 8.00, 16.00, 'Estimated LangSmith pricing')
ON CONFLICT (competitor_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_formula_definitions_category ON formula_definitions(category);
CREATE INDEX IF NOT EXISTS idx_pricing_variables_category ON pricing_variables(category);
CREATE INDEX IF NOT EXISTS idx_pricing_scenarios_created_at ON pricing_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_pricing_active ON competitor_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_calculation_debug_traces_created_at ON calculation_debug_traces(created_at DESC);
