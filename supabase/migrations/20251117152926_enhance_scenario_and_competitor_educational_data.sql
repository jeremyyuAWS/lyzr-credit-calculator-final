/*
  # Enhanced Educational Seed Data for Scenario Sandbox and Competitor Comparison

  1. Scenario Sandbox Enhancements
    - Add more diverse scenarios showing different use cases
    - Include scenarios for different customer segments (SMB, Mid-Market, Enterprise)
    - Add scenarios demonstrating discount strategies
    - Include edge cases (high volume, low complexity, etc.)

  2. Competitor Comparison Enhancements
    - Update with more detailed pricing breakdowns
    - Add context about what makes each competitor unique
    - Include total cost of ownership considerations
    - Add educational notes about when to use each comparison

  This migration helps the Lyzr team understand:
  - How to model different customer scenarios
  - How to compare against various competitors
  - How pricing changes affect margins
  - How to position Lyzr in the market
*/

-- Clear existing data for fresh start
DELETE FROM pricing_scenarios;
DELETE FROM competitor_pricing;

-- ============================================================================
-- SCENARIO SANDBOX: Educational Examples
-- ============================================================================

-- Scenario 1: Current Production Baseline (What we charge today)
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
(
  '🎯 Current Production Baseline',
  'This is our current production pricing model. Use this as the reference point for all comparisons. Based on actual customer data from Q4 2024.',
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
  'Product Team'
);

-- Scenario 2: SMB Starter Package
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
(
  '🚀 SMB Starter (Low Volume)',
  'Small business package with simplified workflows. Lower base credits, minimal complexity. Target: Startups with 10-25 registrations/day.',
  '{
    "baseCredits": 30,
    "complexityMultiplier": 1.0,
    "agentMultiplier": 1.0,
    "scenarioMultiplier": 1.0,
    "registrationsPerDay": 20,
    "workingDaysPerMonth": 22
  }'::jsonb,
  '{
    "creditsPerTransaction": 30.00,
    "monthlyCredits": 13200,
    "monthlyCost": 105.60,
    "annualCost": 1267.20
  }'::jsonb,
  false,
  'Product Team'
);

-- Scenario 3: Mid-Market Standard
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
(
  '🏢 Mid-Market Standard',
  'Standard package for mid-market companies. Moderate complexity, multiple agents. Target: 50-150 registrations/day with mixed workflows.',
  '{
    "baseCredits": 40,
    "complexityMultiplier": 1.25,
    "agentMultiplier": 1.2,
    "scenarioMultiplier": 0.85,
    "registrationsPerDay": 100,
    "workingDaysPerMonth": 22
  }'::jsonb,
  '{
    "creditsPerTransaction": 51.00,
    "monthlyCredits": 112200,
    "monthlyCost": 897.60,
    "annualCost": 10771.20
  }'::jsonb,
  false,
  'Product Team'
);

-- Scenario 4: Enterprise High-Volume with Discount
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
(
  '🏆 Enterprise (Volume Discount)',
  'Large enterprise with high volume. Reduced multipliers due to volume discounts and optimization. Target: 200+ registrations/day.',
  '{
    "baseCredits": 35,
    "complexityMultiplier": 1.1,
    "agentMultiplier": 1.15,
    "scenarioMultiplier": 0.7,
    "registrationsPerDay": 250,
    "workingDaysPerMonth": 22
  }'::jsonb,
  '{
    "creditsPerTransaction": 30.71,
    "monthlyCredits": 168905,
    "monthlyCost": 1351.24,
    "annualCost": 16214.88
  }'::jsonb,
  false,
  'Sales Team'
);

-- Scenario 5: Enterprise Premium (Complex Multi-Agent)
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
(
  '💎 Enterprise Premium (Complex)',
  'Premium tier for enterprises with highly complex multi-agent workflows. Custom integrations, advanced RAG, multiple knowledge bases.',
  '{
    "baseCredits": 55,
    "complexityMultiplier": 1.5,
    "agentMultiplier": 1.4,
    "scenarioMultiplier": 0.9,
    "registrationsPerDay": 150,
    "workingDaysPerMonth": 22
  }'::jsonb,
  '{
    "creditsPerTransaction": 103.95,
    "monthlyCredits": 343035,
    "monthlyCost": 2744.28,
    "annualCost": 32931.36
  }'::jsonb,
  false,
  'Enterprise Team'
);

-- Scenario 6: High-Frequency Low-Complexity (Testing Edge Case)
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
(
  '⚡ High-Frequency Simple Tasks',
  'Edge case: Very high volume but simple single-agent tasks. Great for testing pricing floors and automation workflows.',
  '{
    "baseCredits": 25,
    "complexityMultiplier": 0.8,
    "agentMultiplier": 1.0,
    "scenarioMultiplier": 0.9,
    "registrationsPerDay": 500,
    "workingDaysPerMonth": 22
  }'::jsonb,
  '{
    "creditsPerTransaction": 18.00,
    "monthlyCredits": 198000,
    "monthlyCost": 1584.00,
    "annualCost": 19008.00
  }'::jsonb,
  false,
  'Product Team'
);

-- Scenario 7: What-If: Aggressive Discount Strategy
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
(
  '🎲 What-If: Aggressive Pricing',
  'Experimental: What if we cut prices by 30% to compete with open-source? Tests minimum viable margin and market competitiveness.',
  '{
    "baseCredits": 28,
    "complexityMultiplier": 1.0,
    "agentMultiplier": 1.0,
    "scenarioMultiplier": 0.6,
    "registrationsPerDay": 100,
    "workingDaysPerMonth": 22
  }'::jsonb,
  '{
    "creditsPerTransaction": 16.80,
    "monthlyCredits": 36960,
    "monthlyCost": 295.68,
    "annualCost": 3548.16
  }'::jsonb,
  false,
  'Strategy Team'
);

-- ============================================================================
-- COMPETITOR COMPARISON: Educational Deep Dive
-- ============================================================================

-- Competitor 1: OpenAI Assistants API
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'OpenAI Assistants API',
  'openai-assistants',
  'Token-based + Tool Fees',
  5.00,
  15.00,
  '{
    "code_interpreter": "0.03 per session",
    "file_search": "0.10 per GB per day of storage",
    "function_calling": "Included in token cost",
    "hidden_costs": "Must manage conversation state, token limits, rate limiting"
  }'::jsonb,
  '📊 KEY INSIGHTS: OpenAI charges per token but adds tool fees. Code Interpreter adds $0.03/session (can add up fast). File Search costs $0.10/GB/day for vector storage. You must handle: rate limits, token management, conversation threading, error handling. Total cost can be 40-60% higher than advertised when tools are used.',
  'https://openai.com/pricing',
  NOW(),
  true
);

-- Competitor 2: Anthropic Claude
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'Anthropic Claude (Direct API)',
  'anthropic-claude',
  'Token-based Only',
  3.00,
  15.00,
  '{
    "context_window": "200K tokens included",
    "computer_use": "Beta - pricing TBD",
    "hidden_costs": "No built-in agent features, must build everything custom"
  }'::jsonb,
  '📊 KEY INSIGHTS: Claude 3.5 Sonnet is cheaper than GPT-4, but has NO built-in agent features. You must build: memory management, tool orchestration, workflow logic, RAG system, error handling. Development costs can be $50K-$200K. Computer Use feature is still beta. Best for: teams with ML engineers who want full control.',
  'https://www.anthropic.com/pricing',
  NOW(),
  true
);

-- Competitor 3: LangChain (Self-Hosted Framework)
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'LangChain + LangSmith',
  'langchain-langsmith',
  'Open-Source + Monitoring SaaS',
  0.00,
  0.00,
  '{
    "langsmith_dev": "$0 for 5K traces/month",
    "langsmith_plus": "$39/month for 5K traces",
    "langsmith_production": "$99/month for 25K traces",
    "langsmith_enterprise": "$Custom pricing",
    "underlying_llm": "OpenAI/Anthropic costs separate",
    "infrastructure": "AWS/GCP hosting costs",
    "engineering_time": "2-6 months dev time",
    "maintenance": "Ongoing updates and security patches"
  }'::jsonb,
  '📊 KEY INSIGHTS: LangChain is free (open-source) BUT requires massive engineering effort. Hidden costs: 2-6 months dev time ($100K-$400K in engineering), ongoing infrastructure ($500-$5K/month), separate LLM costs, LangSmith monitoring ($39-$99+/month), security updates, breaking changes every few months. TOTAL COST OF OWNERSHIP: Often 3-5x more expensive than managed solutions. Best for: Large teams with ML engineers and >$50M revenue.',
  'https://www.langchain.com/pricing',
  NOW(),
  true
);

-- Competitor 4: Microsoft Semantic Kernel
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'Microsoft Semantic Kernel',
  'microsoft-semantic-kernel',
  'Open-Source + Azure Costs',
  0.00,
  0.00,
  '{
    "azure_openai_gpt4": "$10-60 per 1M tokens",
    "azure_app_service": "$50-500/month",
    "azure_cosmos_db": "$25-2000/month for memory",
    "azure_ai_search": "$250+/month for RAG",
    "engineering_time": "3-8 months",
    "enterprise_support": "Included with Azure Enterprise Agreement"
  }'::jsonb,
  '📊 KEY INSIGHTS: Semantic Kernel is "free" but locks you into Azure ecosystem. Real costs: Azure OpenAI ($10-60/1M tokens, often 2x more expensive than OpenAI direct), infrastructure ($300-$2K+/month), engineering time (3-8 months). VENDOR LOCK-IN WARNING: Extremely hard to migrate off Azure once built. Best for: Enterprises already invested in Microsoft stack with Azure Enterprise Agreements.',
  'https://learn.microsoft.com/semantic-kernel/',
  NOW(),
  true
);

-- Competitor 5: Google Vertex AI Agent Builder
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'Google Vertex AI Agent Builder',
  'google-vertex-agents',
  'Usage-based + Data Store',
  0.50,
  1.50,
  '{
    "grounding_with_google_search": "$35 per 1000 queries",
    "data_store_storage": "$0.014 per GB per month",
    "vector_search_queries": "$0.54 per million queries",
    "gemini_pro": "$0.50 input / $1.50 output per 1M tokens",
    "minimum_monthly": "$0 (pay as you go)",
    "hidden_costs": "GCP infrastructure, Cloud Storage, BigQuery for analytics"
  }'::jsonb,
  '📊 KEY INSIGHTS: Vertex AI has cheapest token costs BUT grounding with Google Search is EXPENSIVE ($35/1K queries = $0.035 per query!). 10K searches/month = $350 extra. Vector search and data stores add $50-500/month. Best for: Apps that need Google Search integration OR already using GCP. Watch out for: Search grounding costs can explode with user queries.',
  'https://cloud.google.com/vertex-ai/pricing',
  NOW(),
  true
);

-- Competitor 6: CrewAI
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'CrewAI',
  'crewai',
  'Open-Source + Enterprise SaaS',
  0.00,
  0.00,
  '{
    "open_source": "Free (self-host)",
    "crewai_enterprise": "$2000/month for 10 seats",
    "underlying_llm": "OpenAI/Anthropic costs separate",
    "infrastructure": "AWS/GCP hosting",
    "additional_seats": "$200 per seat per month"
  }'::jsonb,
  '📊 KEY INSIGHTS: CrewAI is popular for multi-agent scenarios but has similar issues as LangChain. Open-source version is free but needs infrastructure + dev time (2-4 months). CrewAI Enterprise is $2K/month ($24K/year) for 10 seats + $200/seat after that. PLUS separate LLM costs. Best for: Multi-agent workflows where you need role-based agents. Total cost often $30-50K/year once you add LLM costs and infrastructure.',
  'https://www.crewai.com/pricing',
  NOW(),
  true
);

-- Competitor 7: AutoGen (Microsoft Research)
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'Microsoft AutoGen',
  'microsoft-autogen',
  'Fully Open-Source (No SaaS)',
  0.00,
  0.00,
  '{
    "autogen_studio": "Free (local app)",
    "underlying_llm": "OpenAI/Azure OpenAI costs",
    "infrastructure": "Self-hosted only",
    "no_cloud_service": "No managed option available",
    "engineering_time": "4-8 weeks minimum",
    "community_support_only": "No commercial support"
  }'::jsonb,
  '📊 KEY INSIGHTS: AutoGen is 100% free and open-source (from Microsoft Research) but has NO managed service option. You must self-host everything. Best for: Researchers and experimenters. NOT recommended for production without dedicated ML team. Requires understanding of multi-agent systems, async programming, and LLM orchestration. Development time: 4-8 weeks minimum. No SLAs, no support.',
  'https://microsoft.github.io/autogen/',
  NOW(),
  true
);

-- Competitor 8: Relevance AI
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'Relevance AI',
  'relevance-ai',
  'Managed Platform (Credit-based)',
  8.00,
  24.00,
  '{
    "platform_markup": "20% on top of LLM costs",
    "managed_infrastructure": "Included",
    "tool_marketplace": "$0-49/month per premium tool",
    "no_code_builder": "Included",
    "api_access": "Included",
    "monitoring": "Included"
  }'::jsonb,
  '📊 KEY INSIGHTS: Relevance AI is a no-code platform with 20% markup on LLM costs (similar to Lyzr''s 25%). Their base token costs shown here ALREADY include the markup. Good for: Non-technical teams who need agent workflows quickly. Watch out for: Premium tools cost extra ($49/month each), can add up. Less customizable than code-first solutions. Best for: Marketing/Sales teams building simple agents.',
  'https://relevanceai.com/pricing',
  NOW(),
  true
);

-- Competitor 9: Lyzr Automata (Our Platform!)
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'Lyzr Automata (Us!)',
  'lyzr-automata',
  'Transparent Credit-based',
  4.00,
  12.00,
  '{
    "platform_fee": "25% transparent markup",
    "knowledge_base": "Included (unlimited)",
    "multi_agent_orchestration": "Included",
    "rag_system": "Included",
    "compliance_guardrails": "Included",
    "memory_management": "Included",
    "api_access": "Included",
    "webhook_support": "Included",
    "no_hidden_fees": "True transparent pricing",
    "deployment_options": "Cloud or On-premise"
  }'::jsonb,
  '📊 OUR POSITIONING: Lyzr charges a transparent 25% platform fee on LLM costs. What you get: ✅ Knowledge base (competitors charge extra), ✅ Multi-agent orchestration (LangChain requires months to build), ✅ Compliance guardrails (unique to Lyzr), ✅ Production-ready infrastructure, ✅ No engineering time needed. COMPARISON: vs LangChain (save $100K+ in dev costs), vs Relevance (more customizable), vs OpenAI (built-in agent features), vs Azure (no vendor lock-in). Best for: Enterprises that need production-ready agents fast with compliance requirements.',
  'https://www.lyzr.ai/pricing',
  NOW(),
  true
);

-- Competitor 10: Flowise (Open-Source Low-Code)
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  'Flowise',
  'flowise',
  'Open-Source (Self-Hosted)',
  0.00,
  0.00,
  '{
    "open_source": "100% free",
    "low_code_ui": "Visual flow builder",
    "self_hosted_only": "Must run your own server",
    "underlying_llm": "OpenAI/Anthropic costs separate",
    "infrastructure": "$20-200/month hosting",
    "no_enterprise_features": "Basic features only",
    "community_support": "No commercial support"
  }'::jsonb,
  '📊 KEY INSIGHTS: Flowise is a low-code visual builder for LangChain flows. 100% free and open-source. Good for: Prototyping and simple demos. Limitations: Must self-host, no enterprise features (SSO, audit logs, RBAC), community support only, basic security. Development time: 1-2 weeks for simple flows, 1-2 months for production. Best for: Rapid prototyping or internal tools with low security requirements.',
  'https://flowiseai.com/',
  NOW(),
  true
);

-- Add a comparison summary insight
INSERT INTO competitor_pricing (
  competitor_name,
  competitor_key,
  pricing_model,
  input_token_cost_per_million,
  output_token_cost_per_million,
  additional_fees,
  notes,
  source_url,
  last_verified,
  is_active
) VALUES
(
  '📚 COMPARISON GUIDE',
  'comparison-guide',
  'Educational Resource',
  NULL,
  NULL,
  '{
    "when_to_use_open_source": "Large teams, >$50M revenue, have ML engineers, need full control",
    "when_to_use_managed": "Need to ship fast, <100 person eng team, want predictable costs",
    "when_to_use_lyzr": "Need compliance, want transparency, enterprise ready, no vendor lock-in",
    "total_cost_factors": ["Token costs", "Infrastructure", "Engineering time", "Maintenance", "Tool fees", "Hidden costs"]
  }'::jsonb,
  '🎓 HOW TO USE THIS COMPARISON: 1) Look beyond token costs - consider total cost of ownership. 2) Open-source often costs 3-5x more than listed due to engineering time. 3) Managed platforms (Lyzr, Relevance) save $100K+ in dev costs. 4) Calculate: (Token costs × volume) + Infrastructure + (Eng time × $150K/year salary) + Tool fees. 5) For 100K requests/month: Open-source total = $2K tokens + $50K eng = $52K/year. Lyzr total = $3K all-in = $36K/year + faster to market.',
  'https://www.lyzr.ai/comparison',
  NOW(),
  true
);
