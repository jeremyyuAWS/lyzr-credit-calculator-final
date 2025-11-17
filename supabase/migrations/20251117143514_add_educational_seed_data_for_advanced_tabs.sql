/*
  # Educational Seed Data for Advanced Pricing Simulator Tabs
  
  This migration adds comprehensive seed data to help Lyzr teams understand:
  - How to create and test custom formulas
  - How to manage pricing variables across categories
  - How to run scenario comparisons
  - How to track competitor pricing
  - How to debug calculation issues
  
  All data includes clear descriptions and real-world examples.
*/

-- Additional Educational Formulas
INSERT INTO formula_definitions (formula_key, formula_name, formula_expression, description, category, variables_used) VALUES
  (
    'break_even_volume',
    'Break-Even Volume Calculator',
    'fixedCosts / (sellingPrice - variableCost)',
    'Calculate break-even transaction volume: How many transactions needed to cover fixed costs',
    'business',
    '["fixedCosts", "sellingPrice", "variableCost"]'::jsonb
  ),
  (
    'customer_lifetime_value',
    'Customer Lifetime Value',
    'avgMonthlyRevenue * avgCustomerLifetimeMonths * profitMargin',
    'Calculate LTV: Total value a customer brings over their lifetime',
    'business',
    '["avgMonthlyRevenue", "avgCustomerLifetimeMonths", "profitMargin"]'::jsonb
  ),
  (
    'roi_calculation',
    'ROI Percentage',
    '((totalRevenue - totalCosts) / totalCosts) * 100',
    'Calculate Return on Investment as a percentage',
    'business',
    '["totalRevenue", "totalCosts"]'::jsonb
  ),
  (
    'volume_discount_calculator',
    'Volume Discount Calculator',
    'basePrice * (1 - (volume > tier1Threshold ? tier1Discount : 0) / 100)',
    'Apply tiered volume discounts based on usage thresholds',
    'business',
    '["basePrice", "volume", "tier1Threshold", "tier1Discount"]'::jsonb
  ),
  (
    'multimodal_cost',
    'Multimodal LLM Cost',
    '((textTokens * textCostPerMillion) + (imageUnits * imageCostPerUnit) + (videoSeconds * videoCostPerSecond)) / 1000000',
    'Calculate cost for multimodal models (text + images + video)',
    'tokens',
    '["textTokens", "textCostPerMillion", "imageUnits", "imageCostPerUnit", "videoSeconds", "videoCostPerSecond"]'::jsonb
  ),
  (
    'caching_savings',
    'Token Caching Savings',
    'cachedTokens * inputCostPerMillion * (1 - cachingDiscount) / 1000000',
    'Calculate cost savings from token caching (typically 50-90% discount)',
    'optimization',
    '["cachedTokens", "inputCostPerMillion", "cachingDiscount"]'::jsonb
  ),
  (
    'batch_processing_cost',
    'Batch Processing Cost',
    'totalTokens * costPerMillion * (1 - batchDiscount) / 1000000',
    'Calculate discounted cost for batch API processing',
    'optimization',
    '["totalTokens", "costPerMillion", "batchDiscount"]'::jsonb
  )
ON CONFLICT (formula_key) DO NOTHING;

-- Educational Pricing Variables with Clear Use Cases
INSERT INTO pricing_variables (variable_key, variable_name, variable_value, variable_type, category, description, unit, min_value, max_value) VALUES
  -- Business Modeling Variables
  (
    'fixed_monthly_costs',
    'Fixed Monthly Costs',
    5000,
    'price',
    'business',
    'Infrastructure, salaries, overhead costs per month',
    'USD',
    0,
    100000
  ),
  (
    'avg_customer_lifetime_months',
    'Avg Customer Lifetime',
    24,
    'months',
    'business',
    'Average months a customer stays with Lyzr',
    'months',
    1,
    120
  ),
  (
    'churn_rate_percentage',
    'Monthly Churn Rate',
    5,
    'percentage',
    'business',
    'Percentage of customers who leave each month',
    '%',
    0,
    50
  ),
  (
    'customer_acquisition_cost',
    'Customer Acquisition Cost',
    500,
    'price',
    'business',
    'Average cost to acquire one new customer',
    'USD',
    0,
    5000
  ),
  
  -- Optimization Variables
  (
    'caching_discount_percentage',
    'Token Caching Discount',
    50,
    'percentage',
    'optimization',
    'Discount for cached tokens (OpenAI/Anthropic offer ~50%)',
    '%',
    0,
    90
  ),
  (
    'batch_processing_discount',
    'Batch API Discount',
    50,
    'percentage',
    'optimization',
    'Discount for batch processing (OpenAI offers 50% off)',
    '%',
    0,
    75
  ),
  (
    'prompt_compression_ratio',
    'Prompt Compression Ratio',
    0.7,
    'multiplier',
    'optimization',
    'Token reduction from prompt optimization (0.7 = 30% reduction)',
    'x',
    0.5,
    1.0
  ),
  
  -- Real-World Usage Patterns
  (
    'peak_hour_multiplier',
    'Peak Hour Multiplier',
    1.5,
    'multiplier',
    'usage_patterns',
    'Traffic multiplier during peak hours (9am-5pm)',
    'x',
    1.0,
    3.0
  ),
  (
    'weekend_usage_ratio',
    'Weekend Usage Ratio',
    0.3,
    'multiplier',
    'usage_patterns',
    'Weekend usage as fraction of weekday usage',
    'x',
    0.0,
    1.0
  ),
  (
    'error_retry_rate',
    'Error Retry Rate',
    0.05,
    'percentage',
    'usage_patterns',
    'Percentage of requests that fail and require retry',
    '%',
    0,
    20
  ),
  
  -- Advanced Model Costs
  (
    'vision_image_cost',
    'Vision Image Cost',
    0.01,
    'price',
    'model_costs',
    'Cost per image for vision models (GPT-4V, Claude Vision)',
    'USD',
    0,
    0.5
  ),
  (
    'audio_minute_cost',
    'Audio Processing Cost',
    0.006,
    'price',
    'model_costs',
    'Cost per minute of audio transcription (Whisper)',
    'USD',
    0,
    0.1
  ),
  (
    'embedding_cost_per_million',
    'Embedding Cost',
    0.02,
    'price',
    'model_costs',
    'Cost per million tokens for embeddings (text-embedding-3)',
    'USD/M',
    0,
    1
  )
ON CONFLICT (variable_key) DO NOTHING;

-- Educational Pricing Scenarios with Clear Use Cases
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
  (
    'Tutorial: Basic Scenario Setup',
    'Example showing how to configure a simple pricing scenario. Start here to learn the basics. This represents a small business with simple workflows and low volume.',
    '{
      "baseCredits": 30,
      "complexityMultiplier": 0.8,
      "agentMultiplier": 0.8,
      "scenarioMultiplier": 0.6,
      "registrationsPerDay": 20,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 11.52,
      "monthlyCredits": 5069,
      "monthlyCost": 40.55,
      "annualCost": 486.62
    }'::jsonb,
    false,
    'Tutorial'
  ),
  (
    'SaaS Company: Mid-Market',
    'Mid-market SaaS company using Lyzr for customer onboarding automation. Moderate complexity, 150 daily onboardings, standard reliability requirements.',
    '{
      "baseCredits": 40,
      "complexityMultiplier": 1.2,
      "agentMultiplier": 1.2,
      "scenarioMultiplier": 0.8,
      "registrationsPerDay": 150,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 46.08,
      "monthlyCredits": 152064,
      "monthlyCost": 1216.51,
      "annualCost": 14598.14
    }'::jsonb,
    false,
    'Sales Engineering'
  ),
  (
    'E-Commerce: Black Friday Peak',
    'E-commerce company during peak season. High volume (1000/day), complex multi-agent workflows for order processing, inventory management, and customer support.',
    '{
      "baseCredits": 50,
      "complexityMultiplier": 1.6,
      "agentMultiplier": 1.6,
      "scenarioMultiplier": 1.04,
      "registrationsPerDay": 1000,
      "workingDaysPerMonth": 30
    }'::jsonb,
    '{
      "creditsPerTransaction": 133.12,
      "monthlyCredits": 3993600,
      "monthlyCost": 31948.80,
      "annualCost": 383385.60
    }'::jsonb,
    false,
    'Customer Success'
  ),
  (
    'Startup: MVP Testing Phase',
    'Early-stage startup testing MVP with minimal volume. Optimized for cost savings with simpler workflows. Good baseline for startups.',
    '{
      "baseCredits": 25,
      "complexityMultiplier": 0.8,
      "agentMultiplier": 0.8,
      "scenarioMultiplier": 0.6,
      "registrationsPerDay": 10,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 9.60,
      "monthlyCredits": 2112,
      "monthlyCost": 16.90,
      "annualCost": 202.75
    }'::jsonb,
    false,
    'Partnerships Team'
  ),
  (
    'Enterprise: Financial Services',
    'Large financial services company with strict compliance and premium support requirements. Complex orchestrated agents, high volume, premium tier.',
    '{
      "baseCredits": 60,
      "complexityMultiplier": 2.4,
      "agentMultiplier": 1.6,
      "scenarioMultiplier": 1.04,
      "registrationsPerDay": 500,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 239.62,
      "monthlyCredits": 2635840,
      "monthlyCost": 21086.72,
      "annualCost": 253040.64
    }'::jsonb,
    false,
    'Enterprise Sales'
  ),
  (
    'Cost Optimization Test: 40% Reduction',
    'Experimental scenario testing aggressive cost optimization through prompt engineering, caching, and workflow simplification. Compare against baseline.',
    '{
      "baseCredits": 24,
      "complexityMultiplier": 1.0,
      "agentMultiplier": 1.0,
      "scenarioMultiplier": 0.6,
      "registrationsPerDay": 100,
      "workingDaysPerMonth": 22
    }'::jsonb,
    '{
      "creditsPerTransaction": 14.40,
      "monthlyCredits": 31680,
      "monthlyCost": 253.44,
      "annualCost": 3041.28
    }'::jsonb,
    false,
    'Engineering Team'
  )
ON CONFLICT DO NOTHING;

-- Educational Debug Traces Showing Different Use Cases
INSERT INTO calculation_debug_traces (trace_name, workflow_description, input_parameters, calculation_steps, final_results, execution_time_ms, created_by) VALUES
  (
    'Tutorial: Understanding Credit Calculation',
    'Step-by-step breakdown of how credits are calculated. Use this to understand the pricing formula.',
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
        "operation": "Start with Base Credits",
        "formula": "baseCredits",
        "inputs": {"baseCredits": 40},
        "result": 40,
        "explanation": "Every transaction starts with a base credit allocation. This covers the minimum LLM usage, basic agent operations, and platform overhead."
      },
      {
        "step": 2,
        "operation": "Apply Complexity Multiplier",
        "formula": "baseCredits × complexityMultiplier",
        "inputs": {"baseCredits": 40, "complexityMultiplier": 1.2},
        "result": 48,
        "explanation": "Complexity multiplier adjusts for workflow sophistication: Simple (0.8x), Moderate (1.2x), Complex (1.6x), Enterprise (2.4x). More complex workflows require more LLM calls, longer prompts, and additional processing."
      },
      {
        "step": 3,
        "operation": "Apply Agent Multiplier",
        "formula": "previousResult × agentMultiplier",
        "inputs": {"previousResult": 48, "agentMultiplier": 1.2},
        "result": 57.6,
        "explanation": "Agent multiplier accounts for coordination overhead: Single Agent (0.8x), Multi-Agent (1.2x), Orchestrated (1.6x). Multi-agent systems require inter-agent communication, state management, and coordination logic."
      },
      {
        "step": 4,
        "operation": "Apply Scenario Multiplier",
        "formula": "previousResult × scenarioMultiplier",
        "inputs": {"previousResult": 57.6, "scenarioMultiplier": 0.8},
        "result": 46.08,
        "explanation": "Scenario multiplier adjusts for deployment type: Optimized (0.6x - aggressive caching), Standard (0.8x - balanced), Premium (1.04x - highest reliability, priority support)."
      },
      {
        "step": 5,
        "operation": "Calculate Monthly Volume",
        "formula": "creditsPerTxn × registrationsPerDay × workingDaysPerMonth",
        "inputs": {"creditsPerTransaction": 46.08, "registrationsPerDay": 100, "workingDaysPerMonth": 22},
        "result": 101376,
        "explanation": "Multiply per-transaction credits by daily volume and working days to get total monthly credit consumption. This assumes consistent daily volume - adjust workingDaysPerMonth for seasonal businesses."
      },
      {
        "step": 6,
        "operation": "Convert to Monthly Cost",
        "formula": "monthlyCredits × creditPrice",
        "inputs": {"monthlyCredits": 101376, "creditPrice": 0.008},
        "result": 811.01,
        "explanation": "Convert credits to USD at $0.008 per credit. This is Lyzr standard rate. Volume discounts available: Tier 1 (10K+ = 5% off), Tier 2 (50K+ = 10% off), Tier 3 (100K+ = 20% off)."
      },
      {
        "step": 7,
        "operation": "Project Annual Cost",
        "formula": "monthlyCost × 12",
        "inputs": {"monthlyCost": 811.01},
        "result": 9732.10,
        "explanation": "Annualized projection. Note: This assumes consistent monthly volume. For seasonal businesses, use Scenario Sandbox to model different monthly volumes."
      }
    ]'::jsonb,
    '{
      "creditsPerTransaction": 46.08,
      "monthlyCredits": 101376,
      "monthlyCost": 811.01,
      "annualCost": 9732.10,
      "effectiveCreditsPrice": 0.008,
      "dailyCost": 36.86,
      "costPerTransaction": 0.37
    }'::jsonb,
    18,
    'Documentation Team'
  ),
  (
    'Troubleshooting: High Costs Investigation',
    'Debug trace showing how to identify why costs are higher than expected. Customer reported 3x expected costs.',
    '{
      "baseCredits": 40,
      "complexityMultiplier": 2.4,
      "agentMultiplier": 1.6,
      "scenarioMultiplier": 1.04,
      "registrationsPerDay": 150,
      "workingDaysPerMonth": 22,
      "creditPrice": 0.008
    }'::jsonb,
    '[
      {
        "step": 1,
        "operation": "Base Credits Check",
        "formula": "baseCredits",
        "inputs": {"baseCredits": 40},
        "result": 40,
        "explanation": "Base credits are standard (40). Issue not here."
      },
      {
        "step": 2,
        "operation": "Complexity Check - ISSUE FOUND",
        "formula": "baseCredits × complexityMultiplier",
        "inputs": {"baseCredits": 40, "complexityMultiplier": 2.4},
        "result": 96,
        "explanation": "⚠️ ISSUE: Complexity set to 2.4x (Enterprise level). Customer workflow analysis shows this should be 1.2x (Moderate). Possible cause: Inefficient prompt design or unnecessary workflow steps."
      },
      {
        "step": 3,
        "operation": "Agent Overhead - High but Justified",
        "formula": "previousResult × agentMultiplier",
        "inputs": {"previousResult": 96, "agentMultiplier": 1.6},
        "result": 153.6,
        "explanation": "Orchestrated agents (1.6x) - appropriate for this use case."
      },
      {
        "step": 4,
        "operation": "Scenario Check",
        "formula": "previousResult × scenarioMultiplier",
        "inputs": {"previousResult": 153.6, "scenarioMultiplier": 1.04},
        "result": 159.74,
        "explanation": "Premium tier selected (1.04x). Could optimize to Standard (0.8x) to save 23%."
      },
      {
        "step": 5,
        "operation": "Monthly Projection",
        "formula": "creditsPerTxn × registrationsPerDay × workingDaysPerMonth",
        "inputs": {"creditsPerTransaction": 159.74, "registrationsPerDay": 150, "workingDaysPerMonth": 22},
        "result": 527244,
        "explanation": "Total monthly credits with current configuration."
      },
      {
        "step": 6,
        "operation": "Cost Impact",
        "formula": "monthlyCredits × creditPrice",
        "inputs": {"monthlyCredits": 527244, "creditPrice": 0.008},
        "result": 4217.95,
        "explanation": "💡 RECOMMENDATION: Optimize complexity (2.4x → 1.2x) and scenario (1.04x → 0.8x) to reduce monthly cost to ~$1,583 (62% savings)."
      }
    ]'::jsonb,
    '{
      "creditsPerTransaction": 159.74,
      "monthlyCredits": 527244,
      "monthlyCost": 4217.95,
      "annualCost": 50615.42,
      "recommendations": "1. Audit workflow complexity - reduce from 2.4x to 1.2x. 2. Consider Standard tier instead of Premium. 3. Implement prompt caching for 50% token savings."
    }'::jsonb,
    22,
    'Customer Success'
  ),
  (
    'Optimization Example: Before vs After',
    'Shows cost reduction achieved through optimization techniques: prompt engineering, caching, and workflow simplification.',
    '{
      "baseCredits": 40,
      "complexityMultiplier": 0.8,
      "agentMultiplier": 1.2,
      "scenarioMultiplier": 0.6,
      "registrationsPerDay": 100,
      "workingDaysPerMonth": 22,
      "creditPrice": 0.008,
      "optimizationApplied": true,
      "cachingEnabled": true,
      "promptCompressionRatio": 0.7
    }'::jsonb,
    '[
      {
        "step": 1,
        "operation": "Start with Optimized Base",
        "formula": "baseCredits",
        "inputs": {"baseCredits": 40},
        "result": 40,
        "explanation": "Standard base credits (40)"
      },
      {
        "step": 2,
        "operation": "Reduced Complexity Through Prompt Optimization",
        "formula": "baseCredits × complexityMultiplier × promptCompressionRatio",
        "inputs": {"baseCredits": 40, "complexityMultiplier": 0.8, "promptCompressionRatio": 0.7},
        "result": 22.4,
        "explanation": "✅ Applied prompt engineering techniques to reduce token usage by 30% (0.7x ratio). This includes: removing verbose instructions, using structured outputs, and eliminating redundant examples."
      },
      {
        "step": 3,
        "operation": "Agent Coordination",
        "formula": "previousResult × agentMultiplier",
        "inputs": {"previousResult": 22.4, "agentMultiplier": 1.2},
        "result": 26.88,
        "explanation": "Multi-agent setup with optimized inter-agent communication."
      },
      {
        "step": 4,
        "operation": "Caching Discount Applied",
        "formula": "previousResult × scenarioMultiplier × (1 - cachingDiscount)",
        "inputs": {"previousResult": 26.88, "scenarioMultiplier": 0.6, "cachingDiscount": 0.5},
        "result": 8.06,
        "explanation": "✅ Token caching enabled (50% discount on repeated context). System prompts and knowledge base content are cached, reducing cost by 50% on cache hits."
      },
      {
        "step": 5,
        "operation": "Monthly Volume",
        "formula": "creditsPerTxn × registrationsPerDay × workingDaysPerMonth",
        "inputs": {"creditsPerTransaction": 8.06, "registrationsPerDay": 100, "workingDaysPerMonth": 22},
        "result": 17732,
        "explanation": "Total monthly credits with all optimizations applied."
      },
      {
        "step": 6,
        "operation": "Final Optimized Cost",
        "formula": "monthlyCredits × creditPrice",
        "inputs": {"monthlyCredits": 17732, "creditPrice": 0.008},
        "result": 141.86,
        "explanation": "💰 RESULT: $141.86/month vs $811.01 baseline = 82.5% cost reduction! Optimizations: prompt engineering (-30%), workflow simplification (-20%), token caching (-50%)."
      }
    ]'::jsonb,
    '{
      "creditsPerTransaction": 8.06,
      "monthlyCredits": 17732,
      "monthlyCost": 141.86,
      "annualCost": 1702.27,
      "baselineMonthlyCost": 811.01,
      "savingsPerMonth": 669.15,
      "savingsPercentage": 82.5,
      "optimizationTechniques": ["Prompt compression (30% reduction)", "Token caching (50% discount)", "Workflow simplification", "Optimized scenario tier"]
    }'::jsonb,
    25,
    'Engineering Team'
  )
ON CONFLICT DO NOTHING;

-- Update competitor data with educational notes
UPDATE competitor_pricing SET
  notes = 'OpenAI GPT-4 pricing. Use this as benchmark for high-capability models. Consider batch API (50% off) and caching (50% off) for production. Best for: complex reasoning, code generation, creative writing.',
  additional_fees = '{"batch_discount": 50, "cached_input_discount": 50, "context_window": "128K", "strengths": "reasoning, code, creative writing"}'::jsonb
WHERE competitor_key = 'openai_gpt4';

UPDATE competitor_pricing SET
  notes = 'Anthropic Claude Sonnet - best balance of performance and cost for most use cases. Strong at: tool use, long context reasoning, instruction following. Recommended starting point for new projects.',
  additional_fees = '{"vision_support": true, "tool_use_included": true, "200k_context": true, "strengths": "balanced performance/cost, excellent instruction following"}'::jsonb
WHERE competitor_key = 'anthropic_claude_sonnet';

UPDATE competitor_pricing SET
  notes = 'Groq - Ultra-fast inference (10-20x faster than competitors) at low cost. Trade-off: limited model selection. Best for: real-time applications, high-throughput scenarios, latency-sensitive use cases.',
  additional_fees = '{"inference_speed": "10-20x faster", "strengths": "speed, cost-effectiveness", "limitations": "limited model options"}'::jsonb
WHERE competitor_key = 'groq_llama';

UPDATE competitor_pricing SET
  notes = 'DeepSeek R1 - Most cost-effective reasoning model on market. Comparable to GPT-4 for math/coding at ~1/100th the cost. Open-source weights available. Best for: cost-sensitive applications, mathematical reasoning.',
  additional_fees = '{"reasoning_focused": true, "open_source": true, "strengths": "extreme cost-effectiveness, math/coding", "context_window": "64K"}'::jsonb
WHERE competitor_key = 'deepseek_r1';

-- Add example scenario comparisons guide
INSERT INTO pricing_scenarios (scenario_name, scenario_description, configuration, results, is_baseline, created_by) VALUES
  (
    'Tutorial: How to Compare Scenarios',
    'STEP 1: Create multiple scenarios with different settings. STEP 2: Click "Add to Comparison" on up to 3 scenarios. STEP 3: View side-by-side comparison with cost deltas and recommendations. This example shows a baseline configuration.',
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
  )
ON CONFLICT DO NOTHING;
