/**
 * Cost Engine - Implements PRD Section 8 authoritative formulas
 *
 * This module calculates AI workflow costs based on:
 * - Token usage (input/output)
 * - Model handling fees
 * - Feature costs (RAG, tools, DB, memory, reflection, web)
 * - One-time setup costs
 */

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  inter_agent_tokens: number;
}

export interface FeatureUsage {
  rag_queries: number;
  tool_calls: number;
  db_queries: number;
  memory_ops: number;
  reflection_runs: number;
  web_fetches: number;
  deep_crawl_pages: number;
}

export interface SetupRequirements {
  agents: number;
  knowledge_bases: number;
  tools: number;
  eval_suites: number;
}

export interface ModelPricing {
  input_cost_per_million: number;
  output_cost_per_million: number;
  is_lyzr_hosted: boolean;
}

export interface FeaturePricing {
  rag_query_cost: number;
  tool_call_cost: number;
  db_query_cost: number;
  memory_op_cost: number;
  reflection_run_cost: number;
  web_fetch_cost: number;
  deep_crawl_page_cost: number;
  inter_agent_token_cost_per_million: number;
}

export interface SetupPricing {
  agent_setup_cost: number;
  kb_setup_cost: number;
  tool_setup_cost: number;
  eval_suite_cost: number;
}

export interface ModelHandlingFeeConfig {
  fee_percentage: number;
  applies_to: 'lyzr_hosted' | 'all';
}

/**
 * Calculate token cost (PRD Section 8.1)
 * Formula: input_tokens × (input_cost_per_million / 1,000,000) + output_tokens × (output_cost_per_million / 1,000,000)
 */
export function calculateTokenCost(
  tokens: TokenUsage,
  pricing: ModelPricing
): number {
  const inputCost = (tokens.input_tokens * pricing.input_cost_per_million) / 1_000_000;
  const outputCost = (tokens.output_tokens * pricing.output_cost_per_million) / 1_000_000;
  return inputCost + outputCost;
}

/**
 * Calculate model handling fee (PRD Section 8.2)
 * Formula: if hosted_by_lyzr: total += total × 0.25
 */
export function applyModelHandlingFee(
  baseCost: number,
  isLyzrHosted: boolean,
  feeConfig: ModelHandlingFeeConfig
): number {
  if (feeConfig.applies_to === 'all' || (feeConfig.applies_to === 'lyzr_hosted' && isLyzrHosted)) {
    return baseCost * (1 + feeConfig.fee_percentage / 100);
  }
  return baseCost;
}

/**
 * Calculate inter-agent communication cost (PRD Section 8.3)
 * Formula: inter_agent_tokens × (1C / 1,000,000)
 */
export function calculateInterAgentCost(
  tokens: TokenUsage,
  pricing: FeaturePricing
): number {
  return (tokens.inter_agent_tokens * pricing.inter_agent_token_cost_per_million) / 1_000_000;
}

/**
 * Calculate feature costs (PRD Section 8.4)
 * Sum of each:
 * - rag_queries × 0.05
 * - tool_calls × 1
 * - db_queries × 0.02
 * - memory_ops × 0.005
 * - reflection_runs × 0.05
 * - web_fetches × 0.1
 * - deep_crawl_pages × 0.25
 */
export function calculateFeatureCosts(
  features: FeatureUsage,
  pricing: FeaturePricing
): number {
  return (
    features.rag_queries * pricing.rag_query_cost +
    features.tool_calls * pricing.tool_call_cost +
    features.db_queries * pricing.db_query_cost +
    features.memory_ops * pricing.memory_op_cost +
    features.reflection_runs * pricing.reflection_run_cost +
    features.web_fetches * pricing.web_fetch_cost +
    features.deep_crawl_pages * pricing.deep_crawl_page_cost
  );
}

/**
 * Calculate one-time setup costs (PRD Section 8.5)
 * - agents × 0.05
 * - KB × 1
 * - tools × 0.1
 * - eval suite × 2
 */
export function calculateSetupCosts(
  setup: SetupRequirements,
  pricing: SetupPricing
): number {
  return (
    setup.agents * pricing.agent_setup_cost +
    setup.knowledge_bases * pricing.kb_setup_cost +
    setup.tools * pricing.tool_setup_cost +
    setup.eval_suites * pricing.eval_suite_cost
  );
}

/**
 * Calculate cost per transaction (combines all cost components)
 */
export function calculateCreditsPerTransaction(
  tokens: TokenUsage,
  features: FeatureUsage,
  modelPricing: ModelPricing,
  featurePricing: FeaturePricing,
  handlingFeeConfig: ModelHandlingFeeConfig
): number {
  // 1. Token cost (input + output)
  const tokenCost = calculateTokenCost(tokens, modelPricing);

  // 2. Apply model handling fee to token cost
  const tokenCostWithFee = applyModelHandlingFee(tokenCost, modelPricing.is_lyzr_hosted, handlingFeeConfig);

  // 3. Inter-agent communication cost
  const interAgentCost = calculateInterAgentCost(tokens, featurePricing);

  // 4. Feature costs
  const featureCost = calculateFeatureCosts(features, featurePricing);

  // 5. Sum all costs
  return tokenCostWithFee + interAgentCost + featureCost;
}

/**
 * Calculate monthly total (PRD Section 8.6)
 * Formula: transactions_per_month × credits_per_txn
 */
export function calculateMonthlyTotal(
  creditsPerTransaction: number,
  transactionsPerMonth: number
): number {
  return creditsPerTransaction * transactionsPerMonth;
}

/**
 * Calculate annual total (PRD Section 8.7)
 * Formula: monthly × 12
 */
export function calculateAnnualTotal(monthlyCost: number): number {
  return monthlyCost * 12;
}

/**
 * Complete cost breakdown for a workflow
 */
export interface CostBreakdown {
  // Per transaction
  token_cost: number;
  token_cost_with_handling_fee: number;
  inter_agent_cost: number;
  feature_cost: number;
  credits_per_transaction: number;

  // Totals
  monthly_credits: number;
  annual_credits: number;

  // One-time
  setup_costs: number;

  // Combined
  total_monthly_with_setup: number;
  total_annual_with_setup: number;
}

export function calculateCompleteCostBreakdown(
  tokens: TokenUsage,
  features: FeatureUsage,
  setup: SetupRequirements,
  transactionsPerMonth: number,
  modelPricing: ModelPricing,
  featurePricing: FeaturePricing,
  setupPricing: SetupPricing,
  handlingFeeConfig: ModelHandlingFeeConfig
): CostBreakdown {
  // Per transaction costs
  const tokenCost = calculateTokenCost(tokens, modelPricing);
  const tokenCostWithFee = applyModelHandlingFee(tokenCost, modelPricing.is_lyzr_hosted, handlingFeeConfig);
  const interAgentCost = calculateInterAgentCost(tokens, featurePricing);
  const featureCost = calculateFeatureCosts(features, featurePricing);
  const creditsPerTransaction = tokenCostWithFee + interAgentCost + featureCost;

  // Monthly and annual recurring costs
  const monthlyCredits = calculateMonthlyTotal(creditsPerTransaction, transactionsPerMonth);
  const annualCredits = calculateAnnualTotal(monthlyCredits);

  // One-time setup costs
  const setupCosts = calculateSetupCosts(setup, setupPricing);

  return {
    token_cost: tokenCost,
    token_cost_with_handling_fee: tokenCostWithFee,
    inter_agent_cost: interAgentCost,
    feature_cost: featureCost,
    credits_per_transaction: creditsPerTransaction,
    monthly_credits: monthlyCredits,
    annual_credits: annualCredits,
    setup_costs: setupCosts,
    total_monthly_with_setup: monthlyCredits + setupCosts,
    total_annual_with_setup: annualCredits + setupCosts,
  };
}

/**
 * Helper to convert credits to USD
 * Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
 */
export function creditsToUSD(credits: number, creditPrice: number = 0.01): number {
  return credits * creditPrice;
}
