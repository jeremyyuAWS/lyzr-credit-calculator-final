import { loadPricingVariables, CalculationContext } from './pricingVariables';

export interface CostBreakdown {
  volumeCosts: {
    emails: number;
    chats: number;
    voiceCalls: number;
    documents: number;
    workflowTriggers: number;
    total: number;
  };
  tokenCosts: {
    inputTokens: number;
    outputTokens: number;
    interAgentTokens: number;
    total: number;
  };
  featureCosts: {
    ragLookups: number;
    toolCalls: number;
    dbQueries: number;
    memoryOps: number;
    reflections: number;
    webFetches: number;
    deepCrawl: number;
    total: number;
  };
  infrastructureCosts: {
    platformFee: number;
    storage: number;
    total: number;
  };
  totalMonthlyCost: number;
  totalTransactions: number;
  costPerTransaction: number;
}

export interface BusinessMetrics {
  setupCost: number;
  monthlyCost: number;
  costPerTransaction: number;
  suggestedRetailPrice: number;
  breakEvenVolume: number;
  grossMarginPercent: number;
  monthlyProfit: number;
  annualRevenue: number;
  paybackPeriodMonths: number;
  totalCreditsPerMonth: number;
}

export async function calculateDetailedCosts(context: CalculationContext): Promise<CostBreakdown> {
  const prices = await loadPricingVariables();

  const totalTransactions = context.emails_per_month + context.chats_per_month +
                           context.voice_calls_per_month + context.docs_per_month;

  // Volume Costs
  const volumeCosts = {
    emails: context.emails_per_month * prices.cost_per_email,
    chats: context.chats_per_month * prices.cost_per_chat,
    voiceCalls: context.voice_calls_per_month * prices.cost_per_voice_call,
    documents: context.docs_per_month * prices.cost_per_document,
    workflowTriggers: context.workflow_triggers_per_day * 30 * prices.cost_per_workflow_trigger,
    total: 0,
  };
  volumeCosts.total = volumeCosts.emails + volumeCosts.chats + volumeCosts.voiceCalls +
                      volumeCosts.documents + volumeCosts.workflowTriggers;

  // Token Costs
  const tokenCosts = {
    inputTokens: (context.avg_input_tokens * totalTransactions / 1000) * prices.cost_per_1k_input_tokens,
    outputTokens: (context.avg_output_tokens * totalTransactions / 1000) * prices.cost_per_1k_output_tokens,
    interAgentTokens: (context.inter_agent_tokens * totalTransactions / 1000) * prices.cost_per_1k_input_tokens,
    total: 0,
  };
  tokenCosts.total = tokenCosts.inputTokens + tokenCosts.outputTokens + tokenCosts.interAgentTokens;

  // Feature Costs (per transaction)
  const featureCosts = {
    ragLookups: context.rag_lookups * totalTransactions * prices.cost_per_rag_lookup,
    toolCalls: context.tool_calls * totalTransactions * prices.cost_per_tool_call,
    dbQueries: context.db_queries * totalTransactions * prices.cost_per_db_query,
    memoryOps: context.memory_ops * totalTransactions * prices.cost_per_memory_op,
    reflections: context.reflection_runs * totalTransactions * prices.cost_per_reflection,
    webFetches: context.web_fetches * totalTransactions * prices.cost_per_web_fetch,
    deepCrawl: context.deep_crawl_pages * totalTransactions * prices.cost_per_deep_crawl_page,
    total: 0,
  };
  featureCosts.total = featureCosts.ragLookups + featureCosts.toolCalls + featureCosts.dbQueries +
                       featureCosts.memoryOps + featureCosts.reflections + featureCosts.webFetches +
                       featureCosts.deepCrawl;

  // Infrastructure Costs
  const infrastructureCosts = {
    platformFee: prices.monthly_platform_fee || 50,
    storage: 0, // Can be calculated based on data volume
    total: 0,
  };
  infrastructureCosts.total = infrastructureCosts.platformFee + infrastructureCosts.storage;

  const totalMonthlyCost = volumeCosts.total + tokenCosts.total + featureCosts.total + infrastructureCosts.total;
  const costPerTransaction = totalTransactions > 0 ? totalMonthlyCost / totalTransactions : 0;

  return {
    volumeCosts,
    tokenCosts,
    featureCosts,
    infrastructureCosts,
    totalMonthlyCost,
    totalTransactions,
    costPerTransaction,
  };
}

export async function calculateBusinessMetrics(
  context: CalculationContext,
  customPricePerTransaction?: number
): Promise<BusinessMetrics> {
  const prices = await loadPricingVariables();
  const costBreakdown = await calculateDetailedCosts(context);

  const setupCost = prices.setup_cost_base +
                   (context.num_agents * prices.setup_cost_per_agent) +
                   (context.num_knowledge_bases * prices.setup_cost_per_kb);

  const monthlyCost = costBreakdown.totalMonthlyCost;
  const costPerTransaction = costBreakdown.costPerTransaction;

  // Calculate suggested retail price based on target margin
  const marginDecimal = prices.target_gross_margin / 100;
  const suggestedRetailPrice = costPerTransaction / (1 - marginDecimal);

  // Use custom price if provided, otherwise use suggested
  const actualPrice = customPricePerTransaction || suggestedRetailPrice;

  // Break-even calculation
  const netProfitPerTransaction = (actualPrice - costPerTransaction) / prices.overhead_multiplier;
  const breakEvenVolume = netProfitPerTransaction > 0
    ? Math.ceil(setupCost / netProfitPerTransaction)
    : Infinity;

  // Gross margin
  const grossMarginPercent = actualPrice > 0
    ? ((actualPrice - costPerTransaction) / actualPrice) * 100
    : 0;

  // Monthly profit
  const revenue = costBreakdown.totalTransactions * actualPrice;
  const totalCostWithOverhead = monthlyCost * prices.overhead_multiplier;
  const monthlyProfit = revenue - totalCostWithOverhead;

  // Annual revenue
  const annualRevenue = revenue * 12;

  // Payback period
  const paybackPeriodMonths = monthlyProfit > 0 ? setupCost / monthlyProfit : Infinity;

  // Lyzr credits (1 credit = $0.01)
  const totalCreditsPerMonth = monthlyCost * 100;

  return {
    setupCost,
    monthlyCost,
    costPerTransaction,
    suggestedRetailPrice,
    breakEvenVolume,
    grossMarginPercent,
    monthlyProfit,
    annualRevenue,
    paybackPeriodMonths,
    totalCreditsPerMonth,
  };
}

export function formatCurrency(amount: number): string {
  if (amount === Infinity) return '∞';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num === Infinity) return '∞';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPercentage(percent: number): string {
  return `${percent.toFixed(1)}%`;
}
