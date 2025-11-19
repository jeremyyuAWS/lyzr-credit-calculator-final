/*
  # Comprehensive Pricing Variables and Formulas

  Creates a complete pricing system for the Lyzr AI Credits Calculator with:
  - Per-unit costs for all operations
  - Business formulas including break-even analysis
  - Realistic pricing based on market rates

  ## Tables Created
    - pricing_variables: Core pricing data
    - business_formulas: Calculation formulas

  ## Security
    - RLS enabled
    - Public read access
*/

-- Drop existing policies if tables exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can read pricing variables" ON pricing_variables;
  DROP POLICY IF EXISTS "Authenticated users can update pricing variables" ON pricing_variables;
  DROP POLICY IF EXISTS "Authenticated users can insert pricing variables" ON pricing_variables;
  DROP POLICY IF EXISTS "Public can read business formulas" ON business_formulas;
  DROP POLICY IF EXISTS "Authenticated users can update business formulas" ON business_formulas;
  DROP POLICY IF EXISTS "Authenticated users can insert business formulas" ON business_formulas;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Create pricing_variables table
CREATE TABLE IF NOT EXISTS pricing_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_key text UNIQUE NOT NULL,
  variable_name text NOT NULL,
  variable_value numeric NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business_formulas table
CREATE TABLE IF NOT EXISTS business_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_key text UNIQUE NOT NULL,
  formula_name text NOT NULL,
  formula_expression text NOT NULL,
  variables_used text[] NOT NULL,
  result_unit text NOT NULL,
  category text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pricing_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_formulas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read pricing variables"
  ON pricing_variables FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can update pricing variables"
  ON pricing_variables FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert pricing variables"
  ON pricing_variables FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public can read business formulas"
  ON business_formulas FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can update business formulas"
  ON business_formulas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert business formulas"
  ON business_formulas FOR INSERT TO authenticated WITH CHECK (true);

-- Insert pricing variables
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, unit, category, description) VALUES
-- Volume Pricing
('cost_per_email', 'Cost per Email', 0.015, 'USD', 'volume', 'Cost to process one email transaction'),
('cost_per_chat', 'Cost per Chat', 0.012, 'USD', 'volume', 'Cost to process one chat message'),
('cost_per_voice_call', 'Cost per Voice Call', 0.25, 'USD', 'volume', 'Cost per voice call with transcription'),
('cost_per_document', 'Cost per Document', 0.08, 'USD', 'volume', 'Cost to process one document'),
('cost_per_workflow_trigger', 'Cost per Workflow Trigger', 0.005, 'USD', 'volume', 'Base cost per workflow execution'),

-- Token Pricing
('cost_per_1k_input_tokens', 'Input Token Cost', 0.01, 'USD', 'tokens', 'Cost per 1K input tokens'),
('cost_per_1k_output_tokens', 'Output Token Cost', 0.03, 'USD', 'tokens', 'Cost per 1K output tokens'),
('cost_per_1k_embedding_tokens', 'Embedding Token Cost', 0.0001, 'USD', 'tokens', 'Cost per 1K embedding tokens'),

-- Feature Costs
('cost_per_rag_lookup', 'RAG Lookup Cost', 0.002, 'USD', 'features', 'Cost per RAG query'),
('cost_per_tool_call', 'Tool Call Cost', 0.001, 'USD', 'features', 'Cost per tool invocation'),
('cost_per_db_query', 'Database Query Cost', 0.0005, 'USD', 'features', 'Cost per DB operation'),
('cost_per_memory_op', 'Memory Operation Cost', 0.0008, 'USD', 'features', 'Cost per memory operation'),
('cost_per_reflection', 'Reflection Cost', 0.015, 'USD', 'features', 'Cost per reflection run'),
('cost_per_web_fetch', 'Web Fetch Cost', 0.003, 'USD', 'features', 'Cost per web page fetch'),
('cost_per_deep_crawl_page', 'Deep Crawl Page Cost', 0.005, 'USD', 'features', 'Cost per crawl page'),

-- Infrastructure
('setup_cost_base', 'Base Setup Cost', 500, 'USD', 'infrastructure', 'One-time setup cost'),
('setup_cost_per_agent', 'Setup Cost per Agent', 200, 'USD', 'infrastructure', 'Setup cost per agent'),
('setup_cost_per_kb', 'Setup Cost per KB', 300, 'USD', 'infrastructure', 'Setup cost per knowledge base'),
('monthly_platform_fee', 'Monthly Platform Fee', 50, 'USD', 'infrastructure', 'Base monthly fee'),
('cost_per_gb_storage', 'Storage Cost per GB', 0.10, 'USD', 'infrastructure', 'Monthly cost per GB'),

-- Business Metrics
('target_gross_margin', 'Target Gross Margin', 40, 'percentage', 'business', 'Target profit margin %'),
('overhead_multiplier', 'Overhead Multiplier', 1.15, 'multiplier', 'business', 'Overhead cost multiplier'),
('support_cost_per_user', 'Support Cost per User', 5, 'USD', 'business', 'Monthly support cost per user')
ON CONFLICT (variable_key) DO UPDATE SET
  variable_value = EXCLUDED.variable_value,
  updated_at = now();

-- Insert formulas
INSERT INTO business_formulas (formula_key, formula_name, formula_expression, variables_used, result_unit, category, description) VALUES
(
  'break_even_volume',
  'Break-Even Volume',
  'total_setup_cost / ((price_per_transaction - cost_per_transaction) * overhead_multiplier)',
  ARRAY['total_setup_cost', 'price_per_transaction', 'cost_per_transaction', 'overhead_multiplier'],
  'transactions',
  'business',
  'Transactions needed to recover setup costs'
),
(
  'monthly_gross_profit',
  'Monthly Gross Profit',
  '(price_per_transaction * total_transactions) - total_monthly_cost',
  ARRAY['price_per_transaction', 'total_monthly_cost'],
  'USD',
  'business',
  'Gross profit before overhead'
),
(
  'suggested_retail_price',
  'Suggested Retail Price',
  'cost_per_transaction / (1 - (target_gross_margin / 100))',
  ARRAY['cost_per_transaction', 'target_gross_margin'],
  'USD',
  'pricing',
  'Recommended price for target margin'
)
ON CONFLICT (formula_key) DO UPDATE SET
  formula_expression = EXCLUDED.formula_expression,
  variables_used = EXCLUDED.variables_used,
  updated_at = now();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pricing_variables_category ON pricing_variables(category);
CREATE INDEX IF NOT EXISTS idx_pricing_variables_key ON pricing_variables(variable_key);
CREATE INDEX IF NOT EXISTS idx_business_formulas_category ON business_formulas(category);
CREATE INDEX IF NOT EXISTS idx_business_formulas_key ON business_formulas(formula_key);
