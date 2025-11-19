/*
  # Slider-to-Cost Translation Formulas

  This migration creates comprehensive formulas that translate business slider values
  into actual costs for Setup, LLM pricing, and Feature usage.

  ## Formula Categories
    1. Setup Cost Formulas - Based on complexity and scale
    2. LLM Cost Formulas - Based on token usage and volume
    3. Feature Cost Formulas - Based on feature usage per transaction
    4. Total Cost Aggregation - Complete monthly cost calculation

  ## Key Principles
    - Complexity multipliers increase costs exponentially
    - Volume discounts apply at scale
    - Feature costs stack multiplicatively
    - Setup costs are one-time, operational costs are recurring
*/

-- Insert comprehensive business formulas
INSERT INTO business_formulas (formula_key, formula_name, formula_expression, variables_used, result_unit, category, description) VALUES

-- ========================================
-- SETUP COST FORMULAS
-- ========================================
(
  'setup_cost_total',
  'Total Setup Cost',
  'setup_cost_base + (num_agents * setup_cost_per_agent) + (num_knowledge_bases * setup_cost_per_kb) + (steps_per_workflow * 50) + (agent_interactions * 100)',
  ARRAY['setup_cost_base', 'setup_cost_per_agent', 'setup_cost_per_kb', 'num_agents', 'num_knowledge_bases', 'steps_per_workflow', 'agent_interactions'],
  'USD',
  'setup',
  'Complete one-time setup cost including base, agents, KBs, and complexity factors'
),
(
  'setup_complexity_multiplier',
  'Setup Complexity Multiplier',
  '1 + (steps_per_workflow / 20) + (agent_interactions / 10) + (rag_lookups / 20)',
  ARRAY['steps_per_workflow', 'agent_interactions', 'rag_lookups'],
  'multiplier',
  'setup',
  'Multiplier based on workflow complexity (1.0 to 3.0)'
),
(
  'setup_cost_per_agent_configured',
  'Setup Cost per Configured Agent',
  'setup_cost_per_agent * (1 + (tool_calls / 20) + (memory_ops / 40))',
  ARRAY['setup_cost_per_agent', 'tool_calls', 'memory_ops'],
  'USD',
  'setup',
  'Agent setup cost adjusted for tool and memory complexity'
),
(
  'setup_cost_per_kb_configured',
  'Setup Cost per KB with RAG',
  'setup_cost_per_kb * (1 + (rag_lookups / 10))',
  ARRAY['setup_cost_per_kb', 'rag_lookups'],
  'USD',
  'setup',
  'Knowledge base setup cost scaled by RAG usage intensity'
),

-- ========================================
-- LLM PRICING FORMULAS
-- ========================================
(
  'llm_cost_per_transaction',
  'LLM Cost per Transaction',
  '((avg_input_tokens / 1000) * cost_per_1k_input_tokens) + ((avg_output_tokens / 1000) * cost_per_1k_output_tokens) + ((inter_agent_tokens / 1000) * cost_per_1k_input_tokens)',
  ARRAY['avg_input_tokens', 'avg_output_tokens', 'inter_agent_tokens', 'cost_per_1k_input_tokens', 'cost_per_1k_output_tokens'],
  'USD',
  'llm',
  'Total LLM token cost per single transaction'
),
(
  'llm_cost_monthly_total',
  'Total Monthly LLM Cost',
  '(emails_per_month + chats_per_month + voice_calls_per_month + docs_per_month) * llm_cost_per_transaction',
  ARRAY['emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month', 'llm_cost_per_transaction'],
  'USD',
  'llm',
  'Total monthly LLM costs across all transaction types'
),
(
  'llm_cost_with_complexity',
  'LLM Cost with Complexity Factor',
  'llm_cost_per_transaction * (1 + (steps_per_workflow / 10) + (agent_interactions / 5))',
  ARRAY['llm_cost_per_transaction', 'steps_per_workflow', 'agent_interactions'],
  'USD',
  'llm',
  'LLM cost adjusted for workflow complexity and agent interactions'
),
(
  'token_usage_per_step',
  'Token Usage per Workflow Step',
  '(avg_input_tokens + avg_output_tokens) / steps_per_workflow',
  ARRAY['avg_input_tokens', 'avg_output_tokens', 'steps_per_workflow'],
  'tokens',
  'llm',
  'Average tokens consumed per workflow step'
),
(
  'inter_agent_token_cost',
  'Inter-Agent Communication Cost',
  '(agent_interactions * inter_agent_tokens / 1000) * cost_per_1k_input_tokens',
  ARRAY['agent_interactions', 'inter_agent_tokens', 'cost_per_1k_input_tokens'],
  'USD',
  'llm',
  'Cost of token usage for agent-to-agent communication'
),

-- ========================================
-- FEATURE COST FORMULAS
-- ========================================
(
  'feature_cost_per_transaction',
  'Feature Cost per Transaction',
  '(rag_lookups * cost_per_rag_lookup) + (tool_calls * cost_per_tool_call) + (db_queries * cost_per_db_query) + (memory_ops * cost_per_memory_op) + (reflection_runs * cost_per_reflection) + (web_fetches * cost_per_web_fetch) + (deep_crawl_pages * cost_per_deep_crawl_page)',
  ARRAY['rag_lookups', 'tool_calls', 'db_queries', 'memory_ops', 'reflection_runs', 'web_fetches', 'deep_crawl_pages', 'cost_per_rag_lookup', 'cost_per_tool_call', 'cost_per_db_query', 'cost_per_memory_op', 'cost_per_reflection', 'cost_per_web_fetch', 'cost_per_deep_crawl_page'],
  'USD',
  'features',
  'Total feature usage cost per transaction'
),
(
  'feature_cost_monthly_total',
  'Total Monthly Feature Cost',
  'feature_cost_per_transaction * (emails_per_month + chats_per_month + voice_calls_per_month + docs_per_month)',
  ARRAY['feature_cost_per_transaction', 'emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month'],
  'USD',
  'features',
  'Total monthly feature costs across all transactions'
),
(
  'rag_cost_monthly',
  'Monthly RAG Cost',
  'rag_lookups * (emails_per_month + chats_per_month + voice_calls_per_month + docs_per_month) * cost_per_rag_lookup',
  ARRAY['rag_lookups', 'emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month', 'cost_per_rag_lookup'],
  'USD',
  'features',
  'Total monthly RAG/vector search costs'
),
(
  'tool_cost_monthly',
  'Monthly Tool Integration Cost',
  'tool_calls * (emails_per_month + chats_per_month + voice_calls_per_month + docs_per_month) * cost_per_tool_call',
  ARRAY['tool_calls', 'emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month', 'cost_per_tool_call'],
  'USD',
  'features',
  'Total monthly external tool/API invocation costs'
),
(
  'memory_cost_monthly',
  'Monthly Memory Operations Cost',
  'memory_ops * (emails_per_month + chats_per_month + voice_calls_per_month + docs_per_month) * cost_per_memory_op',
  ARRAY['memory_ops', 'emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month', 'cost_per_memory_op'],
  'USD',
  'features',
  'Total monthly agent memory operation costs'
),
(
  'reflection_cost_monthly',
  'Monthly Reflection Cost',
  'reflection_runs * (emails_per_month + chats_per_month + voice_calls_per_month + docs_per_month) * cost_per_reflection',
  ARRAY['reflection_runs', 'emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month', 'cost_per_reflection'],
  'USD',
  'features',
  'Total monthly agent reflection/quality check costs'
),
(
  'web_fetch_cost_monthly',
  'Monthly Web Fetch Cost',
  '(web_fetches + deep_crawl_pages) * (emails_per_month + chats_per_month + voice_calls_per_month + docs_per_month) * ((cost_per_web_fetch + cost_per_deep_crawl_page) / 2)',
  ARRAY['web_fetches', 'deep_crawl_pages', 'emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month', 'cost_per_web_fetch', 'cost_per_deep_crawl_page'],
  'USD',
  'features',
  'Total monthly web scraping and crawling costs'
),

-- ========================================
-- VOLUME-BASED COST FORMULAS
-- ========================================
(
  'volume_cost_monthly',
  'Monthly Volume Cost',
  '(emails_per_month * cost_per_email) + (chats_per_month * cost_per_chat) + (voice_calls_per_month * cost_per_voice_call) + (docs_per_month * cost_per_document) + (workflow_triggers_per_day * 30 * cost_per_workflow_trigger)',
  ARRAY['emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month', 'workflow_triggers_per_day', 'cost_per_email', 'cost_per_chat', 'cost_per_voice_call', 'cost_per_document', 'cost_per_workflow_trigger'],
  'USD',
  'volume',
  'Total monthly volume-based channel costs'
),
(
  'total_transactions_monthly',
  'Total Monthly Transactions',
  'emails_per_month + chats_per_month + voice_calls_per_month + docs_per_month + (workflow_triggers_per_day * 30)',
  ARRAY['emails_per_month', 'chats_per_month', 'voice_calls_per_month', 'docs_per_month', 'workflow_triggers_per_day'],
  'count',
  'volume',
  'Total number of transactions across all channels'
),

-- ========================================
-- AGGREGATE COST FORMULAS
-- ========================================
(
  'cost_per_transaction_all_in',
  'All-In Cost per Transaction',
  '(volume_cost_monthly + llm_cost_monthly_total + feature_cost_monthly_total + monthly_platform_fee) / total_transactions_monthly',
  ARRAY['volume_cost_monthly', 'llm_cost_monthly_total', 'feature_cost_monthly_total', 'monthly_platform_fee', 'total_transactions_monthly'],
  'USD',
  'cost',
  'Complete cost per transaction including all factors'
),
(
  'total_monthly_operational_cost',
  'Total Monthly Operational Cost',
  'volume_cost_monthly + llm_cost_monthly_total + feature_cost_monthly_total + monthly_platform_fee',
  ARRAY['volume_cost_monthly', 'llm_cost_monthly_total', 'feature_cost_monthly_total', 'monthly_platform_fee'],
  'USD',
  'cost',
  'Complete monthly operational cost'
),
(
  'total_credits_required_monthly',
  'Total Lyzr Credits Required Monthly',
  'total_monthly_operational_cost * 100',
  ARRAY['total_monthly_operational_cost'],
  'credits',
  'cost',
  'Monthly Lyzr credits needed (1 credit = $0.01)'
),

-- ========================================
-- BUSINESS ANALYSIS FORMULAS
-- ========================================
(
  'margin_adjusted_price',
  'Price with Target Margin',
  'cost_per_transaction_all_in / (1 - (target_gross_margin / 100))',
  ARRAY['cost_per_transaction_all_in', 'target_gross_margin'],
  'USD',
  'pricing',
  'Suggested price to achieve target gross margin'
),
(
  'break_even_with_setup',
  'Break-Even Volume Including Setup',
  'setup_cost_total / (margin_adjusted_price - cost_per_transaction_all_in)',
  ARRAY['setup_cost_total', 'margin_adjusted_price', 'cost_per_transaction_all_in'],
  'transactions',
  'business',
  'Transactions needed to recover setup investment'
),
(
  'monthly_profit_at_volume',
  'Monthly Profit at Current Volume',
  '(total_transactions_monthly * margin_adjusted_price) - (total_monthly_operational_cost * overhead_multiplier)',
  ARRAY['total_transactions_monthly', 'margin_adjusted_price', 'total_monthly_operational_cost', 'overhead_multiplier'],
  'USD',
  'business',
  'Expected monthly profit at current volume and pricing'
),
(
  'annual_revenue_projection',
  'Annual Revenue Projection',
  'total_transactions_monthly * margin_adjusted_price * 12',
  ARRAY['total_transactions_monthly', 'margin_adjusted_price'],
  'USD',
  'business',
  'Projected annual revenue at current volume and pricing'
),
(
  'roi_months',
  'ROI Payback Period (Months)',
  'setup_cost_total / monthly_profit_at_volume',
  ARRAY['setup_cost_total', 'monthly_profit_at_volume'],
  'months',
  'business',
  'Months to recover initial setup investment'
)

ON CONFLICT (formula_key) DO UPDATE SET
  formula_expression = EXCLUDED.formula_expression,
  variables_used = EXCLUDED.variables_used,
  description = EXCLUDED.description,
  updated_at = now();

-- Create indexes for formula lookups
CREATE INDEX IF NOT EXISTS idx_business_formulas_result_unit ON business_formulas(result_unit);
