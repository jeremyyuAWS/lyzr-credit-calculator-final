/*
  # Add Realistic Data for Internal Pricing Simulator
  
  This migration populates the pricing simulator with realistic, production-ready data:
  - Additional formulas for token-based calculations
  - Comprehensive pricing variables covering all cost components
  - Pre-configured pricing scenarios for common use cases
  - Updated competitor pricing with current market rates
  - Sample debug traces for testing
*/

-- Additional Formula Definitions
INSERT INTO formula_definitions (formula_key, formula_name, formula_expression, description, category, variables_used) VALUES
  ('token_cost_with_markup', 'Token Cost with Markup', '((inputTokens * inputCostPerMillion / 1000000) + (outputTokens * outputCostPerMillion / 1000000)) * (1 + markupPercentage / 100)', 'Calculate token cost with markup applied', 'tokens', '["inputTokens", "outputTokens", "inputCostPerMillion", "outputCostPerMillion", "markupPercentage"]'::jsonb),
  ('rag_total_cost', 'RAG Total Cost', 'ragQueries * ragCostPerQuery', 'Calculate total RAG feature cost', 'features', '["ragQueries", "ragCostPerQuery"]'::jsonb),
  ('tool_calling_cost', 'Tool Calling Cost', 'toolCalls * toolCallCost', 'Calculate total tool calling cost', 'features', '["toolCalls", "toolCallCost"]'::jsonb),
  ('memory_operations_cost', 'Memory Operations Cost', 'memoryOps * memoryOpCost', 'Calculate total memory operations cost', 'features', '["memoryOps", "memoryOpCost"]'::jsonb),
  ('web_fetch_total_cost', 'Web Fetch Total Cost', '(webFetches * webFetchCost) + (deepCrawlPages * deepCrawlPageCost)', 'Calculate total web access cost', 'features', '["webFetches", "webFetchCost", "deepCrawlPages", "deepCrawlPageCost"]'::jsonb),
  ('inter_agent_communication_cost', 'Inter-Agent Communication Cost', 'interAgentTokens * interAgentCostPerMillion / 1000000', 'Calculate cost of agent-to-agent communication', 'agents', '["interAgentTokens", "interAgentCostPerMillion"]'::jsonb),
  ('setup_total_cost', 'Setup Total Cost', '(agents * agentSetupCost) + (knowledgeBases * kbSetupCost) + (tools * toolSetupCost) + (evalSuites * evalSuiteCost)', 'Calculate one-time setup costs', 'setup', '["agents", "agentSetupCost", "knowledgeBases", "kbSetupCost", "tools", "toolSetupCost", "evalSuites", "evalSuiteCost"]'::jsonb),
  ('daily_cost', 'Daily Cost', 'monthlyCost / workingDaysPerMonth', 'Calculate average daily cost', 'core', '["monthlyCost", "workingDaysPerMonth"]'::jsonb),
  ('cost_per_user', 'Cost Per User', 'monthlyCost / activeUsers', 'Calculate average cost per active user', 'core', '["monthlyCost", "activeUsers"]'::jsonb),
  ('margin_percentage', 'Margin Percentage', '((sellingPrice - totalCost) / sellingPrice) * 100', 'Calculate profit margin percentage', 'business', '["sellingPrice", "totalCost"]'::jsonb)
ON CONFLICT (formula_key) DO NOTHING;

-- Additional Pricing Variables
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  -- Token costs for different models
  ('gpt4_input_cost', 'GPT-4 Input Cost', 30.0, 'price', 'model_costs', 'GPT-4 input token cost per million', 'USD/M', 0, 100),
  ('gpt4_output_cost', 'GPT-4 Output Cost', 60.0, 'price', 'model_costs', 'GPT-4 output token cost per million', 'USD/M', 0, 200),
  ('gpt4_turbo_input_cost', 'GPT-4 Turbo Input Cost', 10.0, 'price', 'model_costs', 'GPT-4 Turbo input token cost per million', 'USD/M', 0, 100),
  ('gpt4_turbo_output_cost', 'GPT-4 Turbo Output Cost', 30.0, 'price', 'model_costs', 'GPT-4 Turbo output token cost per million', 'USD/M', 0, 200),
  ('claude_opus_input_cost', 'Claude Opus Input Cost', 15.0, 'price', 'model_costs', 'Claude 3 Opus input token cost per million', 'USD/M', 0, 100),
  ('claude_opus_output_cost', 'Claude Opus Output Cost', 75.0, 'price', 'model_costs', 'Claude 3 Opus output token cost per million', 'USD/M', 0, 200),
  ('claude_sonnet_input_cost', 'Claude Sonnet Input Cost', 3.0, 'price', 'model_costs', 'Claude 3 Sonnet input token cost per million', 'USD/M', 0, 100),
  ('claude_sonnet_output_cost', 'Claude Sonnet Output Cost', 15.0, 'price', 'model_costs', 'Claude 3 Sonnet output token cost per million', 'USD/M', 0, 200),
  ('gemini_pro_input_cost', 'Gemini Pro Input Cost', 0.5, 'price', 'model_costs', 'Gemini Pro input token cost per million', 'USD/M', 0, 50),
  ('gemini_pro_output_cost', 'Gemini Pro Output Cost', 1.5, 'price', 'model_costs', 'Gemini Pro output token cost per million', 'USD/M', 0, 50),
  
  -- Markup and margin settings
  ('model_markup_percentage', 'Model Markup Percentage', 25, 'percentage', 'business', 'Markup applied to base model costs', '%', 0, 100),
  ('target_margin_percentage', 'Target Margin Percentage', 40, 'percentage', 'business', 'Target profit margin', '%', 0, 100),
  ('enterprise_discount', 'Enterprise Discount', 15, 'percentage', 'business', 'Volume discount for enterprise customers', '%', 0, 50),
  
  -- Volume tiers
  ('tier1_threshold', 'Tier 1 Threshold', 10000, 'credits', 'volume_tiers', 'Credits threshold for Tier 1 pricing', 'credits', 0, 100000),
  ('tier2_threshold', 'Tier 2 Threshold', 50000, 'credits', 'volume_tiers', 'Credits threshold for Tier 2 pricing', 'credits', 0, 500000),
  ('tier3_threshold', 'Tier 3 Threshold', 100000, 'credits', 'volume_tiers', 'Credits threshold for Tier 3 pricing', 'credits', 0, 1000000),
  ('tier1_discount', 'Tier 1 Discount', 5, 'percentage', 'volume_tiers', 'Discount for Tier 1 volume', '%', 0, 30),
  ('tier2_discount', 'Tier 2 Discount', 10, 'percentage', 'volume_tiers', 'Discount for Tier 2 volume', '%', 0, 30),
  ('tier3_discount', 'Tier 3 Discount', 20, 'percentage', 'volume_tiers', 'Discount for Tier 3 volume', '%', 0, 30),
  
  -- Additional feature costs
  ('db_query_cost', 'Database Query Cost', 0.02, 'price', 'features', 'Cost per database query', 'credits', 0, 1),
  ('memory_op_cost', 'Memory Operation Cost', 0.005, 'price', 'features', 'Cost per memory operation', 'credits', 0, 0.1),
  ('reflection_run_cost', 'Reflection Run Cost', 0.05, 'price', 'features', 'Cost per reflection run', 'credits', 0, 1),
  ('inter_agent_token_cost', 'Inter-Agent Token Cost', 1.0, 'price', 'features', 'Cost per million inter-agent tokens', 'USD/M', 0, 10),
  
  -- Setup costs
  ('agent_setup_cost', 'Agent Setup Cost', 0.05, 'price', 'setup', 'One-time cost per agent', 'credits', 0, 10),
  ('kb_setup_cost', 'Knowledge Base Setup Cost', 1.0, 'price', 'setup', 'One-time cost per knowledge base', 'credits', 0, 50),
  ('tool_setup_cost', 'Tool Setup Cost', 0.1, 'price', 'setup', 'One-time cost per tool', 'credits', 0, 10),
  ('eval_suite_cost', 'Eval Suite Cost', 2.0, 'price', 'setup', 'One-time cost per evaluation suite', 'credits', 0, 50),
  
  -- Average token assumptions
  ('avg_input_tokens_per_txn', 'Avg Input Tokens per Transaction', 5000, 'tokens', 'assumptions', 'Average input tokens per transaction', 'tokens', 100, 50000),
  ('avg_output_tokens_per_txn', 'Avg Output Tokens per Transaction', 2000, 'tokens', 'assumptions', 'Average output tokens per transaction', 'tokens', 100, 20000),
  ('avg_rag_queries_per_txn', 'Avg RAG Queries per Transaction', 3, 'count', 'assumptions', 'Average RAG queries per transaction', 'queries', 0, 20),
  ('avg_tool_calls_per_txn', 'Avg Tool Calls per Transaction', 2, 'count', 'assumptions', 'Average tool calls per transaction', 'calls', 0, 20),
  ('avg_web_fetches_per_txn', 'Avg Web Fetches per Transaction', 1, 'count', 'assumptions', 'Average web fetches per transaction', 'fetches', 0, 10)
ON CONFLICT (variable_key) DO NOTHING;

-- Realistic Pricing Scenarios
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
  (
    'Current Production Pricing',
    'Baseline pricing model currently in production',
    '{
      "baseCredits": 40,
      "complexityMultiplier": 1.2,
      "agentMultiplier": 1.2,
      "scenarioMultiplier": 0.8,
      "registrationsPerDay": 100,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 46.08,
      "monthlyCredits": 101376,
      "monthlyCost": 811.01,
      "annualCost": 9732.10
    }'::jsonb,
    true,
    'System'
  ),
  (
    'Aggressive Pricing - 20% Reduction',
    'Testing 20% price reduction to capture market share',
    '{
      "baseCredits": 32,
      "complexityMultiplier": 1.2,
      "agentMultiplier": 1.2,
      "scenarioMultiplier": 0.8,
      "registrationsPerDay": 100,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 36.86,
      "monthlyCredits": 81101,
      "monthlyCost": 648.81,
      "annualCost": 7785.68
    }'::jsonb,
    false,
    'Product Team'
  ),
  (
    'Premium Pricing - Enhanced Margins',
    'Testing premium pricing with 30% higher margins',
    '{
      "baseCredits": 52,
      "complexityMultiplier": 1.2,
      "agentMultiplier": 1.2,
      "scenarioMultiplier": 0.8,
      "registrationsPerDay": 100,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 59.90,
      "monthlyCredits": 131789,
      "monthlyCost": 1054.31,
      "annualCost": 12651.73
    }'::jsonb,
    false,
    'Finance Team'
  ),
  (
    'High Volume Enterprise - 200 txn/day',
    'Pricing for enterprise customers with high daily volume',
    '{
      "baseCredits": 40,
      "complexityMultiplier": 1.2,
      "agentMultiplier": 1.2,
      "scenarioMultiplier": 0.8,
      "registrationsPerDay": 200,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 46.08,
      "monthlyCredits": 202752,
      "monthlyCost": 1622.02,
      "annualCost": 19464.19
    }'::jsonb,
    false,
    'Sales Team'
  ),
  (
    'Startup Friendly - Optimized Costs',
    'Lower pricing for startups with simpler workflows',
    '{
      "baseCredits": 30,
      "complexityMultiplier": 0.8,
      "agentMultiplier": 0.8,
      "scenarioMultiplier": 0.6,
      "registrationsPerDay": 50,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 11.52,
      "monthlyCredits": 12672,
      "monthlyCost": 101.38,
      "annualCost": 1216.51
    }'::jsonb,
    false,
    'Product Team'
  ),
  (
    'Complex Multi-Agent - 500 txn/day',
    'High complexity workflows with orchestrated agents',
    '{
      "baseCredits": 50,
      "complexityMultiplier": 1.6,
      "agentMultiplier": 1.6,
      "scenarioMultiplier": 1.04,
      "registrationsPerDay": 500,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 133.12,
      "monthlyCredits": 1466320,
      "monthlyCost": 11730.56,
      "annualCost": 140766.72
    }'::jsonb,
    false,
    'Engineering Team'
  )
ON CONFLICT DO NOTHING;

-- Update Competitor Pricing with More Realistic Data
UPDATE competitor_pricing SET
  input_token_cost_per_million = 30.00,
  output_token_cost_per_million = 60.00,
  notes = 'GPT-4 standard pricing (as of Q4 2024)',
  additional_fees = '{"batch_discount": 50, "cached_input_discount": 50}'::jsonb,
  last_verified = now()
WHERE competitor_key = 'openai_gpt4';

UPDATE competitor_pricing SET
  input_token_cost_per_million = 10.00,
  output_token_cost_per_million = 30.00,
  notes = 'GPT-4 Turbo with 128K context window',
  additional_fees = '{"batch_discount": 50, "vision_support": true}'::jsonb,
  last_verified = now()
WHERE competitor_key = 'openai_gpt4_turbo';

UPDATE competitor_pricing SET
  input_token_cost_per_million = 15.00,
  output_token_cost_per_million = 75.00,
  notes = 'Claude 3 Opus - highest capability tier',
  additional_fees = '{"vision_support": true, "tool_use_included": true}'::jsonb,
  last_verified = now()
WHERE competitor_key = 'anthropic_claude_opus';

UPDATE competitor_pricing SET
  input_token_cost_per_million = 3.00,
  output_token_cost_per_million = 15.00,
  notes = 'Claude 3 Sonnet - balanced performance/cost',
  additional_fees = '{"vision_support": true, "tool_use_included": true, "200k_context": true}'::jsonb,
  last_verified = now()
WHERE competitor_key = 'anthropic_claude_sonnet';

-- Add more competitors
INSERT INTO competitor_pricing (competitor_key, competitor_name, pricing_model, input_token_cost_per_million, output_token_cost_per_million, notes, additional_fees, source_url, last_verified, is_active) VALUES
  (
    'openai_gpt35_turbo',
    'OpenAI GPT-3.5 Turbo',
    'Pay-per-token',
    0.50,
    1.50,
    'GPT-3.5 Turbo - most cost-effective OpenAI model',
    '{"16k_context": true, "batch_discount": 50}'::jsonb,
    'https://openai.com/pricing',
    now(),
    true
  ),
  (
    'anthropic_claude_haiku',
    'Anthropic Claude Haiku',
    'Pay-per-token',
    0.25,
    1.25,
    'Claude 3 Haiku - fastest and most affordable',
    '{"vision_support": true, "tool_use_included": true}'::jsonb,
    'https://anthropic.com/pricing',
    now(),
    true
  ),
  (
    'google_gemini_ultra',
    'Google Gemini Ultra',
    'Pay-per-token',
    2.50,
    7.50,
    'Gemini Ultra - highest capability Google model',
    '{"multimodal": true, "1m_context": true}'::jsonb,
    'https://ai.google.dev/pricing',
    now(),
    true
  ),
  (
    'deepseek_r1',
    'DeepSeek R1',
    'Pay-per-token',
    0.14,
    0.28,
    'DeepSeek R1 - extremely cost-effective reasoning model',
    '{"reasoning_focused": true, "open_source": true}'::jsonb,
    'https://platform.deepseek.com/pricing',
    now(),
    true
  ),
  (
    'mistral_large',
    'Mistral Large',
    'Pay-per-token',
    4.00,
    12.00,
    'Mistral Large - European alternative to GPT-4',
    '{"128k_context": true, "function_calling": true}'::jsonb,
    'https://mistral.ai/pricing',
    now(),
    true
  ),
  (
    'cohere_command_r_plus',
    'Cohere Command R+',
    'Pay-per-token',
    3.00,
    15.00,
    'Cohere Command R+ - enterprise RAG optimized',
    '{"rag_optimized": true, "128k_context": true}'::jsonb,
    'https://cohere.com/pricing',
    now(),
    true
  )
ON CONFLICT (competitor_key) DO NOTHING;

-- Sample Calculation Debug Traces
INSERT INTO calculation_debug_traces (trace_name, workflow_description, input_parameters, calculation_steps, final_results, execution_time_ms, created_by) VALUES
  (
    'Standard E-commerce Flow',
    'Multi-agent workflow for e-commerce order processing',
    '{
      "baseCredits": 40,
      "complexityMultiplier": 1.2,
      "agentMultiplier": 1.2,
      "scenarioMultiplier": 0.8,
      "registrationsPerDay": 100,
      "workingDaysPerMonth": 22,
      "creditPrice": 0.008
    }'::jsonb,
    '[
      {
        "step": 1,
        "operation": "Apply Complexity Multiplier",
        "formula": "baseCredits × complexityMultiplier",
        "inputs": {"baseCredits": 40, "complexityMultiplier": 1.2},
        "result": 48,
        "explanation": "Starting with base credits (40), multiply by complexity multiplier (1.2) for moderate workflow complexity."
      },
      {
        "step": 2,
        "operation": "Apply Agent Multiplier",
        "formula": "previousResult × agentMultiplier",
        "inputs": {"previousResult": 48, "agentMultiplier": 1.2},
        "result": 57.6,
        "explanation": "Multiply by agent multiplier (1.2) to account for multi-agent coordination."
      },
      {
        "step": 3,
        "operation": "Apply Scenario Multiplier",
        "formula": "previousResult × scenarioMultiplier",
        "inputs": {"previousResult": 57.6, "scenarioMultiplier": 0.8},
        "result": 46.08,
        "explanation": "Apply scenario multiplier (0.8) for standard deployment type."
      },
      {
        "step": 4,
        "operation": "Calculate Monthly Credits",
        "formula": "creditsPerTxn × registrationsPerDay × workingDaysPerMonth",
        "inputs": {"creditsPerTransaction": 46.08, "registrationsPerDay": 100, "workingDaysPerMonth": 22},
        "result": 101376,
        "explanation": "Multiply credits per transaction by daily volume and working days."
      },
      {
        "step": 5,
        "operation": "Convert to USD",
        "formula": "monthlyCredits × creditPrice",
        "inputs": {"monthlyCredits": 101376, "creditPrice": 0.008},
        "result": 811.01,
        "explanation": "Convert monthly credits to USD at $0.008 per credit."
      }
    ]'::jsonb,
    '{
      "creditsPerTransaction": 46.08,
      "monthlyCredits": 101376,
      "monthlyCost": 811.01,
      "annualCost": 9732.10
    }'::jsonb,
    12,
    'System'
  ),
  (
    'High-Volume Enterprise Calculation',
    'Enterprise customer with 500 transactions per day',
    '{
      "baseCredits": 40,
      "complexityMultiplier": 1.6,
      "agentMultiplier": 1.6,
      "scenarioMultiplier": 1.04,
      "registrationsPerDay": 500,
      "workingDaysPerMonth": 22,
      "creditPrice": 0.008
    }'::jsonb,
    '[
      {
        "step": 1,
        "operation": "Apply Complexity Multiplier",
        "formula": "baseCredits × complexityMultiplier",
        "inputs": {"baseCredits": 40, "complexityMultiplier": 1.6},
        "result": 64,
        "explanation": "Apply high complexity multiplier for enterprise workflows."
      },
      {
        "step": 2,
        "operation": "Apply Agent Multiplier",
        "formula": "previousResult × agentMultiplier",
        "inputs": {"previousResult": 64, "agentMultiplier": 1.6},
        "result": 102.4,
        "explanation": "Apply orchestrated agent multiplier for complex coordination."
      },
      {
        "step": 3,
        "operation": "Apply Scenario Multiplier",
        "formula": "previousResult × scenarioMultiplier",
        "inputs": {"previousResult": 102.4, "scenarioMultiplier": 1.04},
        "result": 106.496,
        "explanation": "Apply premium scenario multiplier."
      },
      {
        "step": 4,
        "operation": "Calculate Monthly Credits",
        "formula": "creditsPerTxn × registrationsPerDay × workingDaysPerMonth",
        "inputs": {"creditsPerTransaction": 106.496, "registrationsPerDay": 500, "workingDaysPerMonth": 22},
        "result": 1171456,
        "explanation": "Scale to enterprise volume."
      },
      {
        "step": 5,
        "operation": "Convert to USD",
        "formula": "monthlyCredits × creditPrice",
        "inputs": {"monthlyCredits": 1171456, "creditPrice": 0.008},
        "result": 9371.65,
        "explanation": "Convert to monthly USD cost."
      }
    ]'::jsonb,
    '{
      "creditsPerTransaction": 106.496,
      "monthlyCredits": 1171456,
      "monthlyCost": 9371.65,
      "annualCost": 112459.78
    }'::jsonb,
    15,
    'Enterprise Sales'
  )
ON CONFLICT DO NOTHING;
