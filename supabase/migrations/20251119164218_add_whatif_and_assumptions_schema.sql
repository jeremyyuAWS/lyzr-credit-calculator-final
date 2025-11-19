/*
  # What-If Simulator and Assumptions Validation Schema
  
  This migration adds comprehensive support for:
  - What-If testing scenarios
  - Assumption tracking and validation
  - Customer segment templates
  - Enhanced scenario comparison
  
  1. New Tables
    - `whatif_tests` - Saved What-If analysis tests
    - `pricing_assumptions` - Track all pricing assumptions
    - `assumption_validations` - Validation history for assumptions
    - `customer_segment_templates` - Pre-configured customer templates
    - `scenario_comparisons` - Saved A/B/C comparison analyses
  
  2. Security
    - Enable RLS on all tables
    - Public access for demo/internal tool
*/

-- What-If Tests Table
CREATE TABLE IF NOT EXISTS whatif_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  test_description text,
  base_scenario_id uuid REFERENCES pricing_scenarios(id) ON DELETE SET NULL,
  
  -- What changes are being tested
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Results of the test
  impact_summary jsonb DEFAULT '{}'::jsonb,
  cost_before numeric,
  cost_after numeric,
  cost_change_amount numeric,
  cost_change_percent numeric,
  
  -- Affected components
  affected_features jsonb DEFAULT '[]'::jsonb,
  affected_sliders jsonb DEFAULT '[]'::jsonb,
  
  -- Metadata
  is_bookmarked boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now(),
  last_run_at timestamptz DEFAULT now(),
  run_count integer DEFAULT 1
);

ALTER TABLE whatif_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read whatif tests"
  ON whatif_tests FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert whatif tests"
  ON whatif_tests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update whatif tests"
  ON whatif_tests FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete whatif tests"
  ON whatif_tests FOR DELETE TO public USING (true);

-- Pricing Assumptions Table
CREATE TABLE IF NOT EXISTS pricing_assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assumption_key text UNIQUE NOT NULL,
  assumption_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  
  -- Current value
  current_value numeric NOT NULL,
  unit text,
  
  -- Confidence and source
  confidence_level text DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high', 'validated')),
  data_source text DEFAULT 'estimated' CHECK (data_source IN ('estimated', 'calculated', 'measured', 'customer_data', 'industry_benchmark')),
  
  -- Validation tracking
  last_validated_at timestamptz,
  last_validated_by text,
  validation_notes text,
  
  -- Impact analysis
  impact_level text DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  cost_sensitivity_per_10pct numeric,
  
  -- Related entities
  related_features jsonb DEFAULT '[]'::jsonb,
  related_formulas jsonb DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read assumptions"
  ON pricing_assumptions FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert assumptions"
  ON pricing_assumptions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update assumptions"
  ON pricing_assumptions FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete assumptions"
  ON pricing_assumptions FOR DELETE TO public USING (true);

-- Assumption Validations Table
CREATE TABLE IF NOT EXISTS assumption_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assumption_id uuid NOT NULL REFERENCES pricing_assumptions(id) ON DELETE CASCADE,
  
  validation_date timestamptz DEFAULT now(),
  validated_by text,
  
  -- Validation results
  actual_value numeric,
  expected_value numeric,
  variance_percent numeric,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'warning', 'fail')),
  
  -- Details
  validation_method text,
  data_sample_size integer,
  notes text,
  
  -- Actions taken
  assumption_updated boolean DEFAULT false,
  action_items jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE assumption_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read validations"
  ON assumption_validations FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert validations"
  ON assumption_validations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update validations"
  ON assumption_validations FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete validations"
  ON assumption_validations FOR DELETE TO public USING (true);

-- Customer Segment Templates Table
CREATE TABLE IF NOT EXISTS customer_segment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  template_name text NOT NULL,
  icon text DEFAULT '🏢',
  description text,
  
  -- Industry/segment info
  industry text,
  company_size text DEFAULT 'medium' CHECK (company_size IN ('startup', 'small', 'medium', 'enterprise')),
  
  -- Typical configuration
  typical_volumes jsonb NOT NULL,
  typical_complexity text DEFAULT 'medium',
  typical_features jsonb DEFAULT '{}'::jsonb,
  
  -- Cost estimates
  estimated_monthly_cost_min numeric,
  estimated_monthly_cost_max numeric,
  estimated_annual_cost_min numeric,
  estimated_annual_cost_max numeric,
  
  -- Usage patterns
  usage_patterns jsonb DEFAULT '{}'::jsonb,
  growth_trajectory text,
  
  -- Display
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  
  -- Metadata
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_segment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read templates"
  ON customer_segment_templates FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert templates"
  ON customer_segment_templates FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update templates"
  ON customer_segment_templates FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete templates"
  ON customer_segment_templates FOR DELETE TO public USING (true);

-- Scenario Comparisons Table
CREATE TABLE IF NOT EXISTS scenario_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_name text NOT NULL,
  description text,
  
  -- Scenarios being compared (up to 5)
  scenario_ids jsonb NOT NULL,
  
  -- Comparison results
  comparison_matrix jsonb DEFAULT '{}'::jsonb,
  insights jsonb DEFAULT '[]'::jsonb,
  recommendation text,
  
  -- Winner/best value
  recommended_scenario_id uuid REFERENCES pricing_scenarios(id),
  
  -- Metadata
  created_by text,
  created_at timestamptz DEFAULT now(),
  is_bookmarked boolean DEFAULT false
);

ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read comparisons"
  ON scenario_comparisons FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert comparisons"
  ON scenario_comparisons FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update comparisons"
  ON scenario_comparisons FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete comparisons"
  ON scenario_comparisons FOR DELETE TO public USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatif_tests_bookmarked ON whatif_tests(is_bookmarked);
CREATE INDEX IF NOT EXISTS idx_whatif_tests_created_at ON whatif_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assumptions_category ON pricing_assumptions(category);
CREATE INDEX IF NOT EXISTS idx_assumptions_confidence ON pricing_assumptions(confidence_level);
CREATE INDEX IF NOT EXISTS idx_assumptions_impact ON pricing_assumptions(impact_level);
CREATE INDEX IF NOT EXISTS idx_validations_assumption ON assumption_validations(assumption_id);
CREATE INDEX IF NOT EXISTS idx_templates_active ON customer_segment_templates(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_comparisons_bookmarked ON scenario_comparisons(is_bookmarked);

-- Insert seed data for pricing assumptions
INSERT INTO pricing_assumptions (assumption_key, assumption_name, description, category, current_value, unit, confidence_level, data_source, impact_level, cost_sensitivity_per_10pct, related_features) VALUES
  ('avg_tokens_per_email', 'Average Tokens per Email', 'Typical token count for email processing workflows', 'tokens', 2000, 'tokens', 'medium', 'estimated', 'high', 120, '["token_processing"]'::jsonb),
  ('avg_tokens_per_chat', 'Average Tokens per Chat', 'Typical token count for chat interactions', 'tokens', 1500, 'tokens', 'medium', 'estimated', 'high', 95, '["token_processing"]'::jsonb),
  ('avg_rag_queries_per_transaction', 'RAG Queries per Transaction', 'Average number of knowledge base retrievals', 'features', 2, 'queries', 'low', 'estimated', 'high', 85, '["rag_query"]'::jsonb),
  ('avg_tool_calls_per_transaction', 'Tool Calls per Transaction', 'Average external API/tool invocations', 'features', 1, 'calls', 'medium', 'estimated', 'medium', 45, '["tool_call"]'::jsonb),
  ('agent_communication_overhead', 'Agent Communication Overhead', 'Extra tokens for multi-agent coordination', 'tokens', 500, 'tokens', 'low', 'estimated', 'medium', 30, '["inter_agent_token"]'::jsonb),
  ('workflow_complexity_multiplier', 'Workflow Complexity Factor', 'Multiplier based on workflow complexity', 'multipliers', 1.2, 'multiplier', 'high', 'calculated', 'high', 180, '[]'::jsonb),
  ('credit_to_usd_rate', 'Credit to USD Conversion', 'Exchange rate: 100 Credits = $1', 'core', 0.01, 'USD per credit', 'validated', 'measured', 'critical', 0, '[]'::jsonb),
  ('model_handling_fee_pct', 'Model Handling Fee Percentage', 'Markup on LLM costs for Lyzr-hosted models', 'fees', 25, 'percent', 'high', 'calculated', 'critical', 250, '["model_handling_fee"]'::jsonb)
ON CONFLICT (assumption_key) DO NOTHING;

-- Insert seed data for customer segment templates
INSERT INTO customer_segment_templates (template_key, template_name, icon, description, industry, company_size, typical_volumes, typical_complexity, typical_features, estimated_monthly_cost_min, estimated_monthly_cost_max, usage_patterns, display_order, is_active, is_featured) VALUES
  ('ecommerce_startup', 'E-commerce Startup', '🛍️', 'Small to medium e-commerce with customer support automation', 'E-commerce', 'startup', 
   '{"emails_per_month": 3000, "chats_per_month": 2000, "documents_processed": 500, "voice_calls_per_month": 0}'::jsonb, 
   'medium',
   '{"rag_enabled": true, "multi_agent": false, "web_fetch": true, "avg_rag_per_txn": 2, "avg_tool_calls": 1}'::jsonb,
   1500, 2500,
   '{"peak_hours": "9am-6pm", "seasonal": true, "growth_rate": "15% monthly"}'::jsonb,
   1, true, true),
   
  ('healthcare_enterprise', 'Healthcare Enterprise', '🏥', 'Large healthcare organization with compliance and HIPAA requirements', 'Healthcare', 'enterprise',
   '{"emails_per_month": 15000, "chats_per_month": 8000, "documents_processed": 5000, "voice_calls_per_month": 2000}'::jsonb,
   'enterprise',
   '{"rag_enabled": true, "multi_agent": true, "reflection_runs": 3, "avg_rag_per_txn": 4, "avg_tool_calls": 2}'::jsonb,
   8000, 12000,
   '{"peak_hours": "24/7", "seasonal": false, "growth_rate": "5% monthly"}'::jsonb,
   2, true, true),
   
  ('fintech_scale', 'FinTech Scale-up', '💰', 'Growing financial services with high transaction volumes', 'Financial Services', 'medium',
   '{"emails_per_month": 10000, "chats_per_month": 12000, "documents_processed": 3000, "voice_calls_per_month": 500}'::jsonb,
   'complex',
   '{"rag_enabled": true, "multi_agent": true, "web_fetch": true, "avg_rag_per_txn": 3, "avg_tool_calls": 3}'::jsonb,
   5500, 8500,
   '{"peak_hours": "Market hours", "seasonal": false, "growth_rate": "20% monthly"}'::jsonb,
   3, true, true),
   
  ('saas_b2b', 'B2B SaaS Platform', '💼', 'SaaS company providing customer success automation', 'Technology', 'medium',
   '{"emails_per_month": 8000, "chats_per_month": 5000, "documents_processed": 2000, "voice_calls_per_month": 1000}'::jsonb,
   'medium',
   '{"rag_enabled": true, "multi_agent": false, "web_fetch": false, "avg_rag_per_txn": 2, "avg_tool_calls": 2}'::jsonb,
   3500, 5500,
   '{"peak_hours": "Business hours", "seasonal": false, "growth_rate": "10% monthly"}'::jsonb,
   4, true, false),
   
  ('education_platform', 'Education Platform', '🎓', 'EdTech platform with tutoring and student support', 'Education', 'small',
   '{"emails_per_month": 5000, "chats_per_month": 8000, "documents_processed": 1500, "voice_calls_per_month": 300}'::jsonb,
   'medium',
   '{"rag_enabled": true, "multi_agent": false, "web_fetch": true, "avg_rag_per_txn": 3, "avg_tool_calls": 1}'::jsonb,
   2500, 4000,
   '{"peak_hours": "After school", "seasonal": true, "growth_rate": "8% monthly"}'::jsonb,
   5, true, false)
ON CONFLICT (template_key) DO NOTHING;