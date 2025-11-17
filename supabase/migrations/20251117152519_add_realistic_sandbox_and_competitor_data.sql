/*
  # Add Realistic Seed Data for Scenario Sandbox and Competitor Comparison

  1. Scenario Sandbox Data
    - Creates 3 realistic pricing scenarios with different configurations
    - Includes baseline, optimistic, and enterprise scenarios
    - Pre-calculated results for immediate comparison

  2. Competitor Pricing Data
    - Adds realistic competitor data for major AI agent platforms
    - Includes OpenAI Assistant API, LangChain, Microsoft Semantic Kernel, etc.
    - Pricing based on public information for educational purposes
*/

-- Clear existing test data
DELETE FROM pricing_scenarios WHERE scenario_name LIKE '%test%' OR scenario_name LIKE '%Test%';
DELETE FROM competitor_pricing;

-- Insert Scenario Sandbox Data
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
(
  'Current Baseline',
  'Standard pricing model for enterprise customers with moderate complexity workflows',
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
  'Admin'
),
(
  'High-Volume Discount',
  'Optimized pricing for high-volume customers with volume-based discount tiers',
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
  'Admin'
),
(
  'Enterprise Premium',
  'Premium pricing for enterprise clients with complex multi-agent workflows',
  '{
    "baseCredits": 50,
    "complexityMultiplier": 1.5,
    "agentMultiplier": 1.3,
    "scenarioMultiplier": 0.9,
    "registrationsPerDay": 150,
    "workingDaysPerMonth": 22
  }'::jsonb,
  '{
    "creditsPerTransaction": 87.75,
    "monthlyCredits": 289575,
    "monthlyCost": 2316.60,
    "annualCost": 27799.20
  }'::jsonb,
  false,
  'Admin'
);

-- Insert Competitor Pricing Data
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
  'Token-based + Tool Usage',
  5.00,
  15.00,
  '{
    "code_interpreter": "0.03 per session",
    "file_search": "0.10 per GB per day",
    "function_calling": "Included in token cost"
  }'::jsonb,
  'GPT-4 Turbo pricing. Additional charges for Code Interpreter ($0.03/session) and File Search ($0.10/GB/day). Built-in memory and conversation management.',
  'https://openai.com/pricing',
  NOW(),
  true
),
(
  'Anthropic Claude Agent',
  'anthropic-claude',
  'Token-based',
  3.00,
  15.00,
  '{
    "context_window": "200K tokens standard",
    "computer_use": "Beta - pricing TBD"
  }'::jsonb,
  'Claude 3.5 Sonnet pricing. Extended context window included. Computer Use feature in beta with future pricing to be announced.',
  'https://www.anthropic.com/pricing',
  NOW(),
  true
),
(
  'LangChain',
  'langchain',
  'Self-Hosted + LLM Costs',
  0.00,
  0.00,
  '{
    "langsmith_tracing": "$39/month for 5K traces",
    "langsmith_production": "$99/month for 25K traces",
    "underlying_llm": "Separate costs apply"
  }'::jsonb,
  'Open-source framework. LangSmith monitoring costs separate. Requires self-hosting infrastructure and separate LLM API costs (OpenAI, Anthropic, etc.)',
  'https://www.langchain.com/pricing',
  NOW(),
  true
),
(
  'Microsoft Semantic Kernel',
  'microsoft-semantic-kernel',
  'Self-Hosted + Azure AI',
  0.00,
  0.00,
  '{
    "azure_openai": "Varies by model",
    "azure_hosting": "Separate Azure costs",
    "enterprise_support": "Included with Azure"
  }'::jsonb,
  'Open-source framework from Microsoft. Free SDK but requires Azure OpenAI Service costs and Azure hosting infrastructure.',
  'https://learn.microsoft.com/semantic-kernel/',
  NOW(),
  true
),
(
  'Google Vertex AI Agent Builder',
  'google-vertex-agents',
  'Usage-based + Grounding',
  0.50,
  1.50,
  '{
    "grounding_search": "$35 per 1000 queries",
    "data_store": "$0.014 per GB per month",
    "vector_search": "$0.54 per million queries"
  }'::jsonb,
  'Gemini Pro pricing. Additional costs for grounding with Google Search ($35/1K queries) and data store operations. Includes built-in search and RAG.',
  'https://cloud.google.com/vertex-ai/pricing',
  NOW(),
  true
),
(
  'CrewAI',
  'crewai',
  'Self-Hosted + LLM Costs',
  0.00,
  0.00,
  '{
    "crewai_enterprise": "$2000/month (10 seats)",
    "underlying_llm": "Separate costs apply",
    "self_hosted": "Free for open-source"
  }'::jsonb,
  'Open-source multi-agent framework. CrewAI Enterprise ($2K/month) includes monitoring and collaboration tools. Self-hosted version free but requires separate LLM costs.',
  'https://www.crewai.com/pricing',
  NOW(),
  true
),
(
  'AutoGen',
  'microsoft-autogen',
  'Self-Hosted + LLM Costs',
  0.00,
  0.00,
  '{
    "autogen_studio": "Free open-source",
    "underlying_llm": "Separate costs apply",
    "azure_integration": "Optional Azure costs"
  }'::jsonb,
  'Open-source from Microsoft Research. Completely free framework but requires infrastructure and separate LLM API costs. No managed service available.',
  'https://microsoft.github.io/autogen/',
  NOW(),
  true
),
(
  'Relevance AI',
  'relevance-ai',
  'Credit-based Platform',
  8.00,
  24.00,
  '{
    "platform_fee": "20% markup on LLM costs",
    "managed_infrastructure": "Included",
    "tool_integrations": "$49/month for premium"
  }'::jsonb,
  'Managed platform with 20% markup on underlying LLM costs. Includes infrastructure, monitoring, and tool integrations. Premium tools $49/month.',
  'https://relevanceai.com/pricing',
  NOW(),
  true
),
(
  'Lyzr Automata',
  'lyzr',
  'Credit-based (Transparent)',
  4.00,
  12.00,
  '{
    "platform_fee": "25% markup (transparent)",
    "knowledge_base": "Included",
    "multi_agent": "Included",
    "compliance_guardrails": "Included"
  }'::jsonb,
  'Transparent 25% platform fee on LLM costs. Includes knowledge base, multi-agent orchestration, and enterprise compliance guardrails. No hidden fees.',
  'https://www.lyzr.ai/pricing',
  NOW(),
  true
),
(
  'Flowise',
  'flowise',
  'Self-Hosted',
  0.00,
  0.00,
  '{
    "open_source": "Free",
    "cloud_hosting": "User manages",
    "underlying_llm": "Separate costs apply"
  }'::jsonb,
  'Open-source low-code platform. Completely free but requires self-hosting and infrastructure management. Separate LLM API costs apply.',
  'https://flowiseai.com/',
  NOW(),
  true
);
