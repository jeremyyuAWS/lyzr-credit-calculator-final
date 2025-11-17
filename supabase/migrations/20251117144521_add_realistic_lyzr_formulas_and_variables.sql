/*
  # Realistic Formulas and Pricing Variables for Lyzr Credit Calculator
  
  Based on actual Lyzr pricing model from costEngine.ts and calculator.ts
  
  ## Pricing Components:
  1. Token Costs: (input_tokens × input_cost + output_tokens × output_cost) / 1M
  2. Model Handling Fee: 25% markup for Lyzr-hosted models
  3. Inter-Agent Communication: 1 credit per million tokens
  4. Features: RAG ($0.05), Tools ($1), DB ($0.02), Memory ($0.005), Reflection ($0.05), Web ($0.1), Deep Crawl ($0.25)
  5. Setup: Agent ($0.05), KB ($1), Tool ($0.1), Eval Suite ($2)
  6. Multipliers: Complexity (0.8-2.4x), Agent Type (0.8-1.6x), Scenario (0.6-1.04x)
  7. Credit Price: $0.008
*/

-- ============================================================================
-- CORE FORMULAS
-- ============================================================================

INSERT INTO formula_definitions (formula_key, formula_name, formula_expression, description, category, variables_used) VALUES
  ('token_cost', 'Token Cost Calculator', '(inputTokens * inputCostPerMillion / 1000000) + (outputTokens * outputCostPerMillion / 1000000)', 'Calculate LLM token cost. Core formula: (input_tokens × input_cost + output_tokens × output_cost) / 1,000,000', 'core', '["inputTokens", "outputTokens", "inputCostPerMillion", "outputCostPerMillion"]'::jsonb),
  ('model_handling_fee', 'Model Handling Fee (25%)', 'tokenCost * (1 + modelHandlingFeePercentage / 100)', 'Apply 25% handling fee for Lyzr-hosted models', 'core', '["tokenCost", "modelHandlingFeePercentage"]'::jsonb),
  ('credits_per_transaction', 'Credits Per Transaction', 'baseCredits * complexityMultiplier * agentMultiplier * scenarioMultiplier', 'Calculate credits consumed per transaction', 'core', '["baseCredits", "complexityMultiplier", "agentMultiplier", "scenarioMultiplier"]'::jsonb),
  ('monthly_credits', 'Monthly Credit Consumption', 'creditsPerTransaction * transactionsPerDay * workingDaysPerMonth', 'Calculate total monthly credits', 'core', '["creditsPerTransaction", "transactionsPerDay", "workingDaysPerMonth"]'::jsonb),
  ('monthly_cost_usd', 'Monthly Cost (USD)', 'monthlyCredits * creditPriceUSD', 'Convert credits to USD at $0.008/credit', 'core', '["monthlyCredits", "creditPriceUSD"]'::jsonb),
  ('annual_cost_usd', 'Annual Cost Projection', 'monthlyCostUSD * 12', 'Project annual cost', 'core', '["monthlyCostUSD"]'::jsonb);

-- Token formulas
INSERT INTO formula_definitions (formula_key, formula_name, formula_expression, description, category, variables_used) VALUES
  ('inter_agent_cost', 'Inter-Agent Communication Cost', '(interAgentTokens * interAgentCostPerMillion) / 1000000', 'Cost for inter-agent token exchange: 1 credit per million tokens', 'tokens', '["interAgentTokens", "interAgentCostPerMillion"]'::jsonb),
  ('total_token_cost', 'Total Token Cost with Fee', '((inputTokens * inputCostPerMillion / 1000000) + (outputTokens * outputCostPerMillion / 1000000)) * (1 + modelHandlingFeePercentage / 100)', 'Complete token cost including 25% handling fee', 'tokens', '["inputTokens", "outputTokens", "inputCostPerMillion", "outputCostPerMillion", "modelHandlingFeePercentage"]'::jsonb),
  ('average_tokens_per_transaction', 'Avg Tokens Per Transaction', 'avgPromptTokens + avgCompletionTokens', 'Total tokens: simple=500-1K, moderate=2-3K, complex=8-11K', 'tokens', '["avgPromptTokens", "avgCompletionTokens"]'::jsonb);

-- Feature formulas
INSERT INTO formula_definitions (formula_key, formula_name, formula_expression, description, category, variables_used) VALUES
  ('rag_cost', 'RAG Query Cost', 'ragQueries * ragQueryCost', 'RAG cost: $0.05/query (embedding + vector search + reranking)', 'features', '["ragQueries", "ragQueryCost"]'::jsonb),
  ('tool_call_cost', 'Tool Execution Cost', 'toolCalls * toolCallCost', 'Tool execution cost: $1/call', 'features', '["toolCalls", "toolCallCost"]'::jsonb),
  ('db_query_cost', 'Database Query Cost', 'dbQueries * dbQueryCost', 'DB operation cost: $0.02/query', 'features', '["dbQueries", "dbQueryCost"]'::jsonb),
  ('memory_cost', 'Memory Operations Cost', 'memoryOps * memoryOpCost', 'Memory storage/retrieval: $0.005/operation', 'features', '["memoryOps", "memoryOpCost"]'::jsonb),
  ('reflection_cost', 'Reflection Cost', 'reflectionRuns * reflectionRunCost', 'Agent self-reflection: $0.05/run', 'features', '["reflectionRuns", "reflectionRunCost"]'::jsonb),
  ('web_fetch_cost', 'Web Fetch Cost', 'webFetches * webFetchCost', 'Web page fetch: $0.1/page', 'features', '["webFetches", "webFetchCost"]'::jsonb),
  ('deep_crawl_cost', 'Deep Crawl Cost', 'deepCrawlPages * deepCrawlPageCost', 'Deep crawl with JS: $0.25/page', 'features', '["deepCrawlPages", "deepCrawlPageCost"]'::jsonb),
  ('total_feature_cost', 'Total Feature Costs', '(ragQueries * ragQueryCost) + (toolCalls * toolCallCost) + (dbQueries * dbQueryCost) + (memoryOps * memoryOpCost) + (reflectionRuns * reflectionRunCost) + (webFetches * webFetchCost) + (deepCrawlPages * deepCrawlPageCost)', 'Sum of all feature costs', 'features', '["ragQueries", "ragQueryCost", "toolCalls", "toolCallCost", "dbQueries", "dbQueryCost", "memoryOps", "memoryOpCost", "reflectionRuns", "reflectionRunCost", "webFetches", "webFetchCost", "deepCrawlPages", "deepCrawlPageCost"]'::jsonb);

-- Setup formulas  
INSERT INTO formula_definitions (formula_key, formula_name, formula_expression, description, category, variables_used) VALUES
  ('agent_setup_cost_total', 'Agent Setup Cost', 'numAgents * agentSetupCost', 'One-time agent deployment: $0.05/agent', 'setup', '["numAgents", "agentSetupCost"]'::jsonb),
  ('kb_setup_cost_total', 'Knowledge Base Setup Cost', 'numKnowledgeBases * kbSetupCost', 'One-time KB creation: $1/KB', 'setup', '["numKnowledgeBases", "kbSetupCost"]'::jsonb),
  ('tool_setup_cost_total', 'Tool Setup Cost', 'numTools * toolSetupCost', 'One-time tool integration: $0.1/tool', 'setup', '["numTools", "toolSetupCost"]'::jsonb),
  ('eval_suite_cost_total', 'Evaluation Suite Cost', 'numEvalSuites * evalSuiteCost', 'One-time eval suite: $2/suite', 'setup', '["numEvalSuites", "evalSuiteCost"]'::jsonb),
  ('total_setup_cost', 'Total Setup Costs', '(numAgents * agentSetupCost) + (numKnowledgeBases * kbSetupCost) + (numTools * toolSetupCost) + (numEvalSuites * evalSuiteCost)', 'All one-time setup costs', 'setup', '["numAgents", "agentSetupCost", "numKnowledgeBases", "kbSetupCost", "numTools", "toolSetupCost", "numEvalSuites", "evalSuiteCost"]'::jsonb);

-- Business formulas
INSERT INTO formula_definitions (formula_key, formula_name, formula_expression, description, category, variables_used) VALUES
  ('cost_per_transaction_usd', 'Cost Per Transaction (USD)', 'creditsPerTransaction * creditPriceUSD', 'USD cost per transaction', 'business', '["creditsPerTransaction", "creditPriceUSD"]'::jsonb),
  ('break_even_volume', 'Break-Even Volume', 'monthlyFixedCosts / (revenuePerTransaction - costPerTransaction)', 'Transactions needed to break even', 'business', '["monthlyFixedCosts", "revenuePerTransaction", "costPerTransaction"]'::jsonb),
  ('gross_margin_percentage', 'Gross Margin %', '((revenuePerTransaction - costPerTransaction) / revenuePerTransaction) * 100', 'Profit margin percentage', 'business', '["revenuePerTransaction", "costPerTransaction"]'::jsonb),
  ('customer_lifetime_value', 'Customer Lifetime Value', 'avgTransactionsPerCustomerPerMonth * customerLifetimeMonths * (revenuePerTransaction - costPerTransaction)', 'Total customer profit over lifetime', 'business', '["avgTransactionsPerCustomerPerMonth", "customerLifetimeMonths", "revenuePerTransaction", "costPerTransaction"]'::jsonb);

-- ============================================================================
-- PRICING VARIABLES
-- ============================================================================

-- Core constants
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  ('credit_price_usd', 'Credit Price', 0.008, 'price', 'core', 'Lyzr credit price: $0.008/credit', 'USD', 0.001, 0.02),
  ('model_handling_fee_pct', 'Model Handling Fee', 25, 'percentage', 'core', '25% markup for Lyzr-hosted models', '%', 0, 50),
  ('base_credits', 'Base Credits', 40, 'credits', 'core', 'Base credits per transaction', 'credits', 10, 100);

-- Multipliers
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  ('mult_complexity_simple', 'Simple Complexity', 0.8, 'multiplier', 'multipliers', 'Simple: basic Q&A, minimal context', 'x', 0.5, 1.0),
  ('mult_complexity_moderate', 'Moderate Complexity', 1.2, 'multiplier', 'multipliers', 'Moderate: business logic, multi-step', 'x', 1.0, 1.5),
  ('mult_complexity_complex', 'Complex Complexity', 1.6, 'multiplier', 'multipliers', 'Complex: advanced reasoning, error handling', 'x', 1.5, 2.0),
  ('mult_complexity_enterprise', 'Enterprise Complexity', 2.4, 'multiplier', 'multipliers', 'Enterprise: orchestration, compliance', 'x', 2.0, 3.0),
  ('mult_agent_single', 'Single Agent', 0.8, 'multiplier', 'multipliers', 'Single agent workflows', 'x', 0.5, 1.0),
  ('mult_agent_multi', 'Multi Agent', 1.2, 'multiplier', 'multipliers', 'Multi-agent coordination', 'x', 1.0, 1.5),
  ('mult_agent_orchestrated', 'Orchestrated Agents', 1.6, 'multiplier', 'multipliers', 'Orchestrated multi-agent systems', 'x', 1.5, 2.0),
  ('mult_scenario_optimized', 'Optimized Scenario', 0.6, 'multiplier', 'multipliers', 'Optimized: caching, prompt optimization', 'x', 0.5, 0.8),
  ('mult_scenario_standard', 'Standard Scenario', 0.8, 'multiplier', 'multipliers', 'Standard: balanced cost/performance', 'x', 0.7, 1.0),
  ('mult_scenario_premium', 'Premium Scenario', 1.04, 'multiplier', 'multipliers', 'Premium: highest reliability, priority support', 'x', 1.0, 1.2);

-- Feature costs (in credits)
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  ('feat_rag_query', 'RAG Query', 0.05, 'credits', 'features', 'RAG: embedding + vector search + rerank', 'credits', 0.01, 0.1),
  ('feat_tool_call', 'Tool Call', 1.0, 'credits', 'features', 'Tool execution: API calls, code run', 'credits', 0.1, 2.0),
  ('feat_db_query', 'DB Query', 0.02, 'credits', 'features', 'Database read/write operation', 'credits', 0.001, 0.05),
  ('feat_memory_op', 'Memory Operation', 0.005, 'credits', 'features', 'Long-term memory storage/retrieval', 'credits', 0.001, 0.01),
  ('feat_reflection', 'Reflection Run', 0.05, 'credits', 'features', 'Agent self-reflection/evaluation', 'credits', 0.01, 0.1),
  ('feat_web_fetch', 'Web Fetch', 0.1, 'credits', 'features', 'Web page fetch and scraping', 'credits', 0.05, 0.2),
  ('feat_deep_crawl', 'Deep Crawl Page', 0.25, 'credits', 'features', 'Deep crawl with JS rendering', 'credits', 0.1, 0.5),
  ('feat_inter_agent_per_m', 'Inter-Agent Tokens', 1.0, 'credits', 'features', 'Inter-agent communication per M tokens', 'credits/M', 0.5, 2.0);

-- Setup costs (one-time, in credits)
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  ('setup_agent', 'Agent Setup', 0.05, 'credits', 'setup', 'One-time agent deployment', 'credits', 0.01, 0.1),
  ('setup_kb', 'Knowledge Base Setup', 1.0, 'credits', 'setup', 'One-time KB creation and indexing', 'credits', 0.5, 2.0),
  ('setup_tool', 'Tool Setup', 0.1, 'credits', 'setup', 'One-time tool integration', 'credits', 0.05, 0.5),
  ('setup_eval_suite', 'Eval Suite Setup', 2.0, 'credits', 'setup', 'One-time eval suite creation', 'credits', 1.0, 5.0);

-- Real model pricing (USD per million tokens)
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  ('model_gpt4_in', 'GPT-4 Input', 10.0, 'price', 'model_costs', 'GPT-4 Turbo input cost', 'USD/M', 5.0, 30.0),
  ('model_gpt4_out', 'GPT-4 Output', 30.0, 'price', 'model_costs', 'GPT-4 Turbo output cost', 'USD/M', 15.0, 60.0),
  ('model_gpt4o_in', 'GPT-4o Input', 2.5, 'price', 'model_costs', 'GPT-4o input (latest, cheaper)', 'USD/M', 1.0, 5.0),
  ('model_gpt4o_out', 'GPT-4o Output', 10.0, 'price', 'model_costs', 'GPT-4o output', 'USD/M', 5.0, 15.0),
  ('model_claude_sonnet_in', 'Claude Sonnet Input', 3.0, 'price', 'model_costs', 'Claude 3.5 Sonnet input', 'USD/M', 1.0, 5.0),
  ('model_claude_sonnet_out', 'Claude Sonnet Output', 15.0, 'price', 'model_costs', 'Claude 3.5 Sonnet output', 'USD/M', 10.0, 20.0),
  ('model_claude_haiku_in', 'Claude Haiku Input', 0.25, 'price', 'model_costs', 'Claude 3 Haiku input (fastest)', 'USD/M', 0.1, 0.5),
  ('model_claude_haiku_out', 'Claude Haiku Output', 1.25, 'price', 'model_costs', 'Claude 3 Haiku output', 'USD/M', 0.5, 2.0),
  ('model_gemini_in', 'Gemini Pro Input', 0.5, 'price', 'model_costs', 'Gemini Pro 1.5 input', 'USD/M', 0.25, 1.0),
  ('model_gemini_out', 'Gemini Pro Output', 1.5, 'price', 'model_costs', 'Gemini Pro 1.5 output', 'USD/M', 1.0, 3.0);

-- Typical token patterns
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  ('tokens_simple_in', 'Simple Input', 500, 'tokens', 'usage_patterns', 'Avg input tokens: simple tasks', 'tokens', 100, 1000),
  ('tokens_simple_out', 'Simple Output', 200, 'tokens', 'usage_patterns', 'Avg output tokens: simple tasks', 'tokens', 50, 500),
  ('tokens_moderate_in', 'Moderate Input', 2000, 'tokens', 'usage_patterns', 'Avg input tokens: moderate tasks', 'tokens', 1000, 4000),
  ('tokens_moderate_out', 'Moderate Output', 800, 'tokens', 'usage_patterns', 'Avg output tokens: moderate tasks', 'tokens', 500, 2000),
  ('tokens_complex_in', 'Complex Input', 8000, 'tokens', 'usage_patterns', 'Avg input tokens: complex reasoning', 'tokens', 4000, 16000),
  ('tokens_complex_out', 'Complex Output', 3000, 'tokens', 'usage_patterns', 'Avg output tokens: detailed responses', 'tokens', 2000, 8000);

-- Business variables
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  ('biz_working_days', 'Working Days/Month', 22, 'count', 'business', 'Standard business days (Mon-Fri)', 'days', 20, 23),
  ('biz_txn_per_day', 'Transactions/Day', 100, 'count', 'business', 'Default daily transaction volume', 'txn', 10, 10000);

-- Volume discounts
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  ('disc_tier1_threshold', 'Tier 1 Threshold', 10000, 'credits', 'volume_discounts', '10K credits/month = 5% off', 'credits', 5000, 20000),
  ('disc_tier1_percent', 'Tier 1 Discount', 5, 'percentage', 'volume_discounts', 'Tier 1 discount percentage', '%', 0, 10),
  ('disc_tier2_threshold', 'Tier 2 Threshold', 50000, 'credits', 'volume_discounts', '50K credits/month = 10% off', 'credits', 30000, 100000),
  ('disc_tier2_percent', 'Tier 2 Discount', 10, 'percentage', 'volume_discounts', 'Tier 2 discount percentage', '%', 5, 15),
  ('disc_tier3_threshold', 'Tier 3 Threshold', 100000, 'credits', 'volume_discounts', '100K credits/month = 20% off', 'credits', 75000, 200000),
  ('disc_tier3_percent', 'Tier 3 Discount', 20, 'percentage', 'volume_discounts', 'Tier 3 discount percentage', '%', 15, 25);
