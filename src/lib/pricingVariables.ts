import { supabase } from './supabase';

export interface PricingVariable {
  id: string;
  variable_key: string;
  variable_name: string;
  variable_value: number;
  unit: string;
  category: string;
  description: string | null;
  is_active: boolean;
}

export interface BusinessFormula {
  id: string;
  formula_key: string;
  formula_name: string;
  formula_expression: string;
  variables_used: string[];
  result_unit: string;
  category: string;
  description: string | null;
  is_active: boolean;
}

let cachedPricingVariables: Record<string, number> | null = null;
let cachedFormulas: Record<string, BusinessFormula> | null = null;

export async function loadPricingVariables(): Promise<Record<string, number>> {
  if (cachedPricingVariables) {
    return cachedPricingVariables;
  }

  const { data, error } = await supabase
    .from('pricing_variables')
    .select('variable_key, variable_value')
    .eq('is_active', true);

  if (error) {
    console.error('Error loading pricing variables:', error);
    return getDefaultPricingVariables();
  }

  const variables: Record<string, number> = {};
  data?.forEach(v => {
    variables[v.variable_key] = v.variable_value;
  });

  cachedPricingVariables = variables;
  return variables;
}

export async function loadBusinessFormulas(): Promise<Record<string, BusinessFormula>> {
  if (cachedFormulas) {
    return cachedFormulas;
  }

  const { data, error } = await supabase
    .from('business_formulas')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error loading business formulas:', error);
    return {};
  }

  const formulas: Record<string, BusinessFormula> = {};
  data?.forEach(f => {
    formulas[f.formula_key] = f;
  });

  cachedFormulas = formulas;
  return formulas;
}

export function clearPricingCache() {
  cachedPricingVariables = null;
  cachedFormulas = null;
}

function getDefaultPricingVariables(): Record<string, number> {
  return {
    cost_per_email: 0.015,
    cost_per_chat: 0.012,
    cost_per_voice_call: 0.25,
    cost_per_document: 0.08,
    cost_per_workflow_trigger: 0.005,
    cost_per_1k_input_tokens: 0.01,
    cost_per_1k_output_tokens: 0.03,
    cost_per_1k_embedding_tokens: 0.0001,
    cost_per_rag_lookup: 0.002,
    cost_per_tool_call: 0.001,
    cost_per_db_query: 0.0005,
    cost_per_memory_op: 0.0008,
    cost_per_reflection: 0.015,
    cost_per_web_fetch: 0.003,
    cost_per_deep_crawl_page: 0.005,
    setup_cost_base: 500,
    setup_cost_per_agent: 200,
    setup_cost_per_kb: 300,
    monthly_platform_fee: 50,
    cost_per_gb_storage: 0.10,
    target_gross_margin: 40,
    overhead_multiplier: 1.15,
    support_cost_per_user: 5,
  };
}

export interface CalculationContext {
  emails_per_month: number;
  chats_per_month: number;
  voice_calls_per_month: number;
  docs_per_month: number;
  workflow_triggers_per_day: number;
  steps_per_workflow: number;
  agent_interactions: number;
  rag_lookups: number;
  tool_calls: number;
  db_queries: number;
  memory_ops: number;
  reflection_runs: number;
  web_fetches: number;
  deep_crawl_pages: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  inter_agent_tokens: number;
  num_agents: number;
  num_knowledge_bases: number;
}

export async function calculateTotalMonthlyCost(context: CalculationContext): Promise<number> {
  const prices = await loadPricingVariables();

  const volumeCost =
    (context.emails_per_month * prices.cost_per_email) +
    (context.chats_per_month * prices.cost_per_chat) +
    (context.voice_calls_per_month * prices.cost_per_voice_call) +
    (context.docs_per_month * prices.cost_per_document) +
    (context.workflow_triggers_per_day * 30 * prices.cost_per_workflow_trigger);

  const totalTransactions = context.emails_per_month + context.chats_per_month +
                           context.voice_calls_per_month + context.docs_per_month;

  const tokenCost =
    ((context.avg_input_tokens * totalTransactions / 1000) * prices.cost_per_1k_input_tokens) +
    ((context.avg_output_tokens * totalTransactions / 1000) * prices.cost_per_1k_output_tokens) +
    ((context.inter_agent_tokens * totalTransactions / 1000) * prices.cost_per_1k_input_tokens);

  const featureCost =
    (context.rag_lookups * totalTransactions * prices.cost_per_rag_lookup) +
    (context.tool_calls * totalTransactions * prices.cost_per_tool_call) +
    (context.db_queries * totalTransactions * prices.cost_per_db_query) +
    (context.memory_ops * totalTransactions * prices.cost_per_memory_op) +
    (context.reflection_runs * totalTransactions * prices.cost_per_reflection) +
    (context.web_fetches * totalTransactions * prices.cost_per_web_fetch) +
    (context.deep_crawl_pages * totalTransactions * prices.cost_per_deep_crawl_page);

  const platformCost = prices.monthly_platform_fee;

  return volumeCost + tokenCost + featureCost + platformCost;
}

export async function calculateSetupCost(num_agents: number, num_knowledge_bases: number): Promise<number> {
  const prices = await loadPricingVariables();

  return prices.setup_cost_base +
         (num_agents * prices.setup_cost_per_agent) +
         (num_knowledge_bases * prices.setup_cost_per_kb);
}

export async function calculateBreakEvenVolume(
  costPerTransaction: number,
  pricePerTransaction: number,
  setupCost: number
): Promise<number> {
  const prices = await loadPricingVariables();

  const netProfitPerTransaction = (pricePerTransaction - costPerTransaction) / prices.overhead_multiplier;

  if (netProfitPerTransaction <= 0) {
    return Infinity;
  }

  return Math.ceil(setupCost / netProfitPerTransaction);
}

export async function calculateSuggestedRetailPrice(costPerTransaction: number): Promise<number> {
  const prices = await loadPricingVariables();

  const marginDecimal = prices.target_gross_margin / 100;
  const suggestedPrice = costPerTransaction / (1 - marginDecimal);

  return suggestedPrice;
}

export async function calculateGrossMargin(
  pricePerTransaction: number,
  costPerTransaction: number
): Promise<number> {
  if (pricePerTransaction === 0) return 0;

  return ((pricePerTransaction - costPerTransaction) / pricePerTransaction) * 100;
}

export async function calculateMonthlyProfit(
  totalTransactions: number,
  pricePerTransaction: number,
  totalMonthlyCost: number
): Promise<number> {
  const prices = await loadPricingVariables();

  const revenue = totalTransactions * pricePerTransaction;
  const totalCostWithOverhead = totalMonthlyCost * prices.overhead_multiplier;

  return revenue - totalCostWithOverhead;
}

export async function calculatePaybackPeriod(
  setupCost: number,
  monthlyProfit: number
): Promise<number> {
  if (monthlyProfit <= 0) {
    return Infinity;
  }

  return setupCost / monthlyProfit;
}
