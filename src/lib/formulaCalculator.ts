import { supabase } from './supabase';
import { loadPricingVariables } from './pricingVariables';

export interface SliderValues {
  // Volume sliders
  emails_per_month: number;
  chats_per_month: number;
  voice_calls_per_month: number;
  docs_per_month: number;
  workflow_triggers_per_day: number;

  // Complexity sliders
  steps_per_workflow: number;
  agent_interactions: number;
  rag_lookups: number;
  tool_calls: number;
  db_queries: number;
  memory_ops: number;
  reflection_runs: number;
  web_fetches: number;
  deep_crawl_pages: number;

  // Token usage sliders
  avg_input_tokens: number;
  avg_output_tokens: number;
  inter_agent_tokens: number;

  // Configuration
  num_agents: number;
  num_knowledge_bases: number;
}

export interface FormulaResult {
  formula_key: string;
  formula_name: string;
  result: number;
  result_unit: string;
  category: string;
  description: string;
}

export interface CostBreakdownResult {
  setup: {
    total_setup_cost: number;
    complexity_multiplier: number;
    cost_per_agent: number;
    cost_per_kb: number;
  };
  llm: {
    cost_per_transaction: number;
    monthly_total: number;
    cost_with_complexity: number;
    token_usage_per_step: number;
    inter_agent_cost: number;
  };
  features: {
    cost_per_transaction: number;
    monthly_total: number;
    rag_monthly: number;
    tool_monthly: number;
    memory_monthly: number;
    reflection_monthly: number;
    web_fetch_monthly: number;
  };
  volume: {
    monthly_cost: number;
    total_transactions: number;
  };
  aggregate: {
    cost_per_transaction_all_in: number;
    total_monthly_operational_cost: number;
    total_credits_required: number;
  };
  business: {
    margin_adjusted_price: number;
    break_even_volume: number;
    monthly_profit: number;
    annual_revenue: number;
    roi_months: number;
  };
}

let cachedPricingVars: Record<string, number> | null = null;
let cachedFormulas: any[] | null = null;

async function getPricingVariables(): Promise<Record<string, number>> {
  if (cachedPricingVars) return cachedPricingVars;
  cachedPricingVars = await loadPricingVariables();
  return cachedPricingVars;
}

async function getFormulas() {
  if (cachedFormulas) return cachedFormulas;

  const { data, error } = await supabase
    .from('business_formulas')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error loading formulas:', error);
    return [];
  }

  cachedFormulas = data || [];
  return cachedFormulas;
}

export function clearFormulaCache() {
  cachedPricingVars = null;
  cachedFormulas = null;
}

/**
 * Evaluate a formula expression with given context
 */
function evaluateFormula(
  expression: string,
  context: Record<string, number>
): number {
  try {
    // Replace variable names with their values
    let evalExpression = expression;

    // Sort by length descending to replace longer names first
    const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const value = context[key];
      // Use word boundaries to avoid partial replacements
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      evalExpression = evalExpression.replace(regex, String(value));
    }

    // Evaluate the mathematical expression
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${evalExpression}`)();

    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch (error) {
    console.error('Error evaluating formula:', expression, error);
    return 0;
  }
}

/**
 * Calculate a specific formula by key
 */
export async function calculateFormula(
  formulaKey: string,
  sliderValues: SliderValues
): Promise<FormulaResult | null> {
  const formulas = await getFormulas();
  const pricing = await getPricingVariables();

  const formula = formulas.find(f => f.formula_key === formulaKey);
  if (!formula) {
    console.error(`Formula not found: ${formulaKey}`);
    return null;
  }

  // Build context with slider values and pricing variables
  const context: Record<string, number> = {
    ...sliderValues,
    ...pricing,
  };

  // Calculate dependent formulas first (recursive calculation)
  for (const varKey of formula.variables_used) {
    if (!(varKey in context)) {
      // This variable might be another formula result
      const depResult = await calculateFormula(varKey, sliderValues);
      if (depResult) {
        context[varKey] = depResult.result;
      }
    }
  }

  const result = evaluateFormula(formula.formula_expression, context);

  return {
    formula_key: formula.formula_key,
    formula_name: formula.formula_name,
    result,
    result_unit: formula.result_unit,
    category: formula.category,
    description: formula.description,
  };
}

/**
 * Calculate complete cost breakdown with all formulas
 */
export async function calculateCompleteCostBreakdown(
  sliderValues: SliderValues
): Promise<CostBreakdownResult> {
  const formulas = await getFormulas();
  const pricing = await getPricingVariables();

  // Build initial context
  const context: Record<string, number> = {
    ...sliderValues,
    ...pricing,
  };

  // Calculate all formulas in dependency order
  const results: Record<string, number> = {};

  // Helper to calculate and store formula result
  const calcAndStore = async (key: string) => {
    if (results[key] !== undefined) return results[key];

    const result = await calculateFormula(key, sliderValues);
    if (result) {
      results[key] = result.result;
      context[key] = result.result;
    }
    return results[key] || 0;
  };

  // Calculate in order of dependencies
  // Setup costs
  await calcAndStore('setup_complexity_multiplier');
  await calcAndStore('setup_cost_per_agent_configured');
  await calcAndStore('setup_cost_per_kb_configured');
  await calcAndStore('setup_cost_total');

  // LLM costs
  await calcAndStore('llm_cost_per_transaction');
  await calcAndStore('token_usage_per_step');
  await calcAndStore('inter_agent_token_cost');
  await calcAndStore('llm_cost_with_complexity');
  await calcAndStore('llm_cost_monthly_total');

  // Feature costs
  await calcAndStore('feature_cost_per_transaction');
  await calcAndStore('rag_cost_monthly');
  await calcAndStore('tool_cost_monthly');
  await calcAndStore('memory_cost_monthly');
  await calcAndStore('reflection_cost_monthly');
  await calcAndStore('web_fetch_cost_monthly');
  await calcAndStore('feature_cost_monthly_total');

  // Volume costs
  await calcAndStore('volume_cost_monthly');
  await calcAndStore('total_transactions_monthly');

  // Aggregate costs
  await calcAndStore('total_monthly_operational_cost');
  await calcAndStore('cost_per_transaction_all_in');
  await calcAndStore('total_credits_required_monthly');

  // Business metrics
  await calcAndStore('margin_adjusted_price');
  await calcAndStore('break_even_with_setup');
  await calcAndStore('monthly_profit_at_volume');
  await calcAndStore('annual_revenue_projection');
  await calcAndStore('roi_months');

  return {
    setup: {
      total_setup_cost: results.setup_cost_total || 0,
      complexity_multiplier: results.setup_complexity_multiplier || 1,
      cost_per_agent: results.setup_cost_per_agent_configured || 0,
      cost_per_kb: results.setup_cost_per_kb_configured || 0,
    },
    llm: {
      cost_per_transaction: results.llm_cost_per_transaction || 0,
      monthly_total: results.llm_cost_monthly_total || 0,
      cost_with_complexity: results.llm_cost_with_complexity || 0,
      token_usage_per_step: results.token_usage_per_step || 0,
      inter_agent_cost: results.inter_agent_token_cost || 0,
    },
    features: {
      cost_per_transaction: results.feature_cost_per_transaction || 0,
      monthly_total: results.feature_cost_monthly_total || 0,
      rag_monthly: results.rag_cost_monthly || 0,
      tool_monthly: results.tool_cost_monthly || 0,
      memory_monthly: results.memory_cost_monthly || 0,
      reflection_monthly: results.reflection_cost_monthly || 0,
      web_fetch_monthly: results.web_fetch_cost_monthly || 0,
    },
    volume: {
      monthly_cost: results.volume_cost_monthly || 0,
      total_transactions: results.total_transactions_monthly || 0,
    },
    aggregate: {
      cost_per_transaction_all_in: results.cost_per_transaction_all_in || 0,
      total_monthly_operational_cost: results.total_monthly_operational_cost || 0,
      total_credits_required: results.total_credits_required_monthly || 0,
    },
    business: {
      margin_adjusted_price: results.margin_adjusted_price || 0,
      break_even_volume: results.break_even_with_setup || 0,
      monthly_profit: results.monthly_profit_at_volume || 0,
      annual_revenue: results.annual_revenue_projection || 0,
      roi_months: results.roi_months || 0,
    },
  };
}

/**
 * Get formulas by category
 */
export async function getFormulasByCategory(category: string): Promise<FormulaResult[]> {
  const formulas = await getFormulas();
  return formulas
    .filter(f => f.category === category)
    .map(f => ({
      formula_key: f.formula_key,
      formula_name: f.formula_name,
      result: 0,
      result_unit: f.result_unit,
      category: f.category,
      description: f.description,
    }));
}
