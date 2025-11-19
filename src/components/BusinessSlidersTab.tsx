import { useState, useEffect } from 'react';
import { TrendingUp, Settings, DollarSign, Info, Calendar, Zap, Sliders, Globe } from 'lucide-react';
import VolumeSliders from './sliders/VolumeSliders';
import ComplexitySliders from './sliders/ComplexitySliders';
import TokenControls from './sliders/TokenControls';
import WorkflowSummary from './sliders/WorkflowSummary';
import PremiumBusinessReport from './PremiumBusinessReport';
import CostForecastChart from './sliders/CostForecastChart';
import { calculateCompleteCostBreakdown, CostBreakdown } from '../lib/costEngine';
import type {
  TokenUsage,
  FeatureUsage,
  SetupRequirements,
  ModelPricing,
  FeaturePricing,
  SetupPricing,
  ModelHandlingFeeConfig,
} from '../lib/costEngine';
import { supabase } from '../lib/supabase';

// Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
const CREDIT_PRICE = 0.01;

export interface WorkflowConfig {
  // Workflow description from chat
  workflow_description: string;
  recommended_model: string;
  complexity_tier: 'Low' | 'Medium' | 'High';

  // Volume inputs
  emails_per_month: number;
  chats_per_month: number;
  voice_calls_per_month: number;
  docs_per_month: number;
  workflow_triggers_per_day: number;

  // Complexity inputs
  steps_per_workflow: number;
  agent_interactions: number;

  // Feature usage
  rag_lookups: number;
  tool_calls: number;
  db_queries: number;
  memory_ops: number;
  reflection_runs: number;
  web_fetches: number;
  deep_crawl_pages: number;

  // Token inputs
  avg_input_tokens: number;
  avg_output_tokens: number;
  inter_agent_tokens: number;

  // Setup requirements
  num_agents: number;
  num_knowledge_bases: number;
  num_tools: number;
  num_eval_suites: number;
}

const DEFAULT_WORKFLOW: WorkflowConfig = {
  workflow_description: 'Customer support automation with document processing',
  recommended_model: 'Claude 3.5 Sonnet',
  complexity_tier: 'Medium',

  emails_per_month: 5000,
  chats_per_month: 3000,
  voice_calls_per_month: 0,
  docs_per_month: 500,
  workflow_triggers_per_day: 100,

  steps_per_workflow: 5,
  agent_interactions: 3,

  rag_lookups: 2,
  tool_calls: 1,
  db_queries: 3,
  memory_ops: 4,
  reflection_runs: 1,
  web_fetches: 0,
  deep_crawl_pages: 0,

  avg_input_tokens: 2000,
  avg_output_tokens: 800,
  inter_agent_tokens: 500,

  num_agents: 3,
  num_knowledge_bases: 1,
  num_tools: 2,
  num_eval_suites: 1,
};

interface BusinessSlidersTabProps {
  initialWorkflow?: Partial<WorkflowConfig>;
}

export default function BusinessSlidersTab({ initialWorkflow }: BusinessSlidersTabProps) {
  const [workflow, setWorkflow] = useState<WorkflowConfig>({
    ...DEFAULT_WORKFLOW,
    ...initialWorkflow,
  });

  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExplainPrice, setShowExplainPrice] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CAD' | 'EUR' | 'INR'>('USD');
  const [selectedScenario, setSelectedScenario] = useState<{ label: string; multiplier: number } | null>(null);

  // Currency exchange rates (relative to USD)
  const currencyRates = {
    USD: { rate: 1, symbol: '$', name: 'US Dollar' },
    CAD: { rate: 1.36, symbol: 'C$', name: 'Canadian Dollar' },
    EUR: { rate: 0.92, symbol: '€', name: 'Euro' },
    INR: { rate: 83.12, symbol: '₹', name: 'Indian Rupee' },
  };

  // Format number with commas (e.g., 23000 -> "23,000")
  const formatWithCommas = (num: number): string => {
    return Math.round(num).toLocaleString('en-US');
  };

  // Convert USD to selected currency
  const convertCurrency = (usdAmount: number): number => {
    return usdAmount * currencyRates[selectedCurrency].rate;
  };

  // Format currency with proper symbol and comma separators
  const formatCurrency = (usdAmount: number, decimals: number = 2): string => {
    const converted = convertCurrency(usdAmount);
    const symbol = currencyRates[selectedCurrency].symbol;
    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${symbol}${formatted}`;
  };

  // Pricing data from database
  const [modelPricing, setModelPricing] = useState<ModelPricing | null>(null);
  const [featurePricing, setFeaturePricing] = useState<FeaturePricing | null>(null);
  const [setupPricing, setSetupPricing] = useState<SetupPricing | null>(null);
  const [handlingFee, setHandlingFee] = useState<ModelHandlingFeeConfig | null>(null);

  useEffect(() => {
    loadPricingData();
  }, [workflow.recommended_model]);

  useEffect(() => {
    if (modelPricing && featurePricing && setupPricing && handlingFee) {
      calculateCosts();
    }
  }, [workflow, modelPricing, featurePricing, setupPricing, handlingFee]);

  useEffect(() => {
    if (initialWorkflow) {
      setWorkflow(prev => ({
        ...prev,
        ...initialWorkflow,
      }));
    }
  }, [initialWorkflow]);

  async function loadPricingData() {
    try {
      setLoading(true);

      // Load model pricing
      const { data: llmData, error: llmError } = await supabase
        .from('llm_pricing')
        .select('*')
        .eq('model', workflow.recommended_model)
        .eq('enabled', true)
        .maybeSingle();

      if (llmError) throw llmError;

      if (llmData) {
        setModelPricing({
          input_cost_per_million: parseFloat(llmData.input_cost_per_million),
          output_cost_per_million: parseFloat(llmData.output_cost_per_million),
          is_lyzr_hosted: true, // TODO: Add this to database
        });
      }

      // Load feature pricing
      const { data: featureData, error: featureError } = await supabase
        .from('feature_pricing')
        .select('*')
        .eq('enabled', true);

      if (featureError) throw featureError;

      if (featureData) {
        const features: FeaturePricing = {
          rag_query_cost: featureData.find(f => f.feature_name === 'RAG Query')?.cost_credits || 0.05,
          tool_call_cost: featureData.find(f => f.feature_name === 'Tool Call')?.cost_credits || 1.0,
          db_query_cost: featureData.find(f => f.feature_name === 'DB Query')?.cost_credits || 0.02,
          memory_op_cost: featureData.find(f => f.feature_name === 'Memory Operation')?.cost_credits || 0.005,
          reflection_run_cost: featureData.find(f => f.feature_name === 'Reflection Run')?.cost_credits || 0.05,
          web_fetch_cost: featureData.find(f => f.feature_name === 'Web Fetch')?.cost_credits || 0.1,
          deep_crawl_page_cost: featureData.find(f => f.feature_name === 'Deep Crawl Page')?.cost_credits || 0.25,
          inter_agent_token_cost_per_million: featureData.find(f => f.feature_name === 'Inter-Agent Token')?.cost_credits || 0.000001,
        };
        setFeaturePricing(features);
      }

      // Load setup costs
      const { data: setupData, error: setupError } = await supabase
        .from('setup_costs')
        .select('*')
        .eq('enabled', true);

      if (setupError) throw setupError;

      if (setupData) {
        const setup: SetupPricing = {
          agent_setup_cost: setupData.find(s => s.item_name === 'Agent Setup')?.cost_credits || 0.05,
          kb_setup_cost: setupData.find(s => s.item_name === 'Knowledge Base')?.cost_credits || 1.0,
          tool_setup_cost: setupData.find(s => s.item_name === 'Tool Integration')?.cost_credits || 0.1,
          eval_suite_cost: setupData.find(s => s.item_name === 'Evaluation Suite')?.cost_credits || 2.0,
        };
        setSetupPricing(setup);
      }

      // Load handling fee
      const { data: feeData, error: feeError } = await supabase
        .from('model_handling_fee')
        .select('*')
        .eq('enabled', true)
        .maybeSingle();

      if (feeError) throw feeError;

      if (feeData) {
        setHandlingFee({
          fee_percentage: parseFloat(feeData.fee_percentage),
          applies_to: feeData.applies_to,
        });
      }
    } catch (err) {
      console.error('Error loading pricing data:', err);
    } finally {
      setLoading(false);
    }
  }

  function calculateCosts() {
    if (!modelPricing || !featurePricing || !setupPricing || !handlingFee) return;

    // Calculate total transactions per month
    const transactionsPerMonth =
      workflow.emails_per_month +
      workflow.chats_per_month +
      workflow.voice_calls_per_month +
      (workflow.workflow_triggers_per_day * 22); // 22 working days

    const tokens: TokenUsage = {
      input_tokens: workflow.avg_input_tokens,
      output_tokens: workflow.avg_output_tokens,
      inter_agent_tokens: workflow.inter_agent_tokens,
    };

    const features: FeatureUsage = {
      rag_queries: workflow.rag_lookups,
      tool_calls: workflow.tool_calls,
      db_queries: workflow.db_queries,
      memory_ops: workflow.memory_ops,
      reflection_runs: workflow.reflection_runs,
      web_fetches: workflow.web_fetches,
      deep_crawl_pages: workflow.deep_crawl_pages,
    };

    const setup: SetupRequirements = {
      agents: workflow.num_agents,
      knowledge_bases: workflow.num_knowledge_bases,
      tools: workflow.num_tools,
      eval_suites: workflow.num_eval_suites,
    };

    const breakdown = calculateCompleteCostBreakdown(
      tokens,
      features,
      setup,
      transactionsPerMonth,
      modelPricing,
      featurePricing,
      setupPricing,
      handlingFee
    );

    setCostBreakdown(breakdown);
  }

  function updateWorkflow(updates: Partial<WorkflowConfig>) {
    setWorkflow(prev => ({ ...prev, ...updates }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black">Business Cost Calculator</h1>
              <p className="text-gray-600 mt-1">Adjust volumes and features to estimate your monthly AI costs</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <div className="relative">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as 'USD' | 'CAD' | 'EUR' | 'INR')}
                  className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                >
                  {Object.entries(currencyRates).map(([code, { name }]) => (
                    <option key={code} value={code}>
                      {code} - {name}
                    </option>
                  ))}
                </select>
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Advanced Mode Toggle */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-300">
                <Sliders className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Advanced</span>
                <button
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    advancedMode ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      advancedMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Understanding Banner */}
        {workflow.workflow_description && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
                <Settings className="h-5 w-5 stroke-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black mb-1">Workflow Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {workflow.workflow_description}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                    <span className="text-gray-600">Model:</span>{' '}
                    <span className="font-semibold text-black">{workflow.recommended_model}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                    <span className="text-gray-600">Complexity:</span>{' '}
                    <span className="font-semibold text-black">{workflow.complexity_tier}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                    <span className="text-gray-600">Agents:</span>{' '}
                    <span className="font-semibold text-black">{workflow.num_agents}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Cost Summary (Sticky) */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              {/* Real-time Cost Display */}
              {costBreakdown && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Monthly & Annual Estimates
                  </h2>
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowExplainPrice(true)}
                      className="w-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-gray-600" />
                          <h3 className="text-lg font-semibold text-black">Monthly</h3>
                        </div>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-3xl font-bold text-black mb-1">
                        {formatWithCommas(costBreakdown.monthly_credits)} Credits
                      </p>
                      <p className="text-xl text-gray-600">
                        {formatCurrency(costBreakdown.monthly_credits * CREDIT_PRICE)}
                      </p>
                      <p className="text-xs text-gray-500 mt-3">
                        + {formatCurrency(costBreakdown.setup_costs * CREDIT_PRICE)} one-time setup
                      </p>
                      <p className="text-xs text-blue-600 mt-2 font-medium">Click to see detailed breakdown →</p>
                    </button>

                    <button
                      onClick={() => setShowExplainPrice(true)}
                      className="w-full p-6 bg-gradient-to-br from-black to-gray-800 rounded-xl border-2 border-gray-700 hover:border-gray-500 hover:shadow-lg transition-all cursor-pointer text-left text-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          <h3 className="text-lg font-semibold">Annual</h3>
                        </div>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-3xl font-bold mb-1">
                        {formatWithCommas(costBreakdown.annual_credits)} Credits
                      </p>
                      <p className="text-xl text-gray-300">
                        {formatCurrency(costBreakdown.annual_credits * CREDIT_PRICE)}
                      </p>
                      <p className="text-xs text-gray-400 mt-3">
                        + {formatCurrency(costBreakdown.setup_costs * CREDIT_PRICE)} one-time setup
                      </p>
                      <p className="text-xs text-blue-400 mt-2 font-medium">Click to see detailed breakdown →</p>
                    </button>
                  </div>

                  {/* Cost Scenarios */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-black mb-2">Cost Scenarios</h3>
                    <p className="text-xs text-gray-600 mb-4">Click a scenario to view its forecast</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Low (10th percentile)', multiplier: 0.5, color: 'border-green-200 bg-green-50', textColor: 'text-green-700', hoverColor: 'hover:bg-green-100' },
                        { label: 'Medium (50th percentile)', multiplier: 1.0, color: 'border-yellow-200 bg-yellow-50', textColor: 'text-yellow-700', hoverColor: 'hover:bg-yellow-100' },
                        { label: 'High (90th percentile)', multiplier: 1.8, color: 'border-red-200 bg-red-50', textColor: 'text-red-700', hoverColor: 'hover:bg-red-100' },
                      ].map((scenario) => (
                        <button
                          key={scenario.label}
                          onClick={() => setSelectedScenario(scenario)}
                          className={`w-full p-4 rounded-xl border-2 ${scenario.color} ${scenario.hoverColor} transition-all cursor-pointer ${
                            selectedScenario?.label === scenario.label ? 'ring-2 ring-black' : ''
                          }`}
                        >
                          <h4 className={`text-xs font-semibold mb-2 ${scenario.textColor}`}>
                            {scenario.label}
                          </h4>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-600">Monthly</p>
                              <p className={`text-base font-bold ${scenario.textColor}`}>
                                {formatCurrency(costBreakdown.monthly_credits * scenario.multiplier * CREDIT_PRICE)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Annual</p>
                              <p className={`text-base font-bold ${scenario.textColor}`}>
                                {formatCurrency(costBreakdown.annual_credits * scenario.multiplier * CREDIT_PRICE)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      * Scenarios based on usage patterns. Low = efficient usage, High = peak usage with buffer.
                    </p>
                  </div>
                </div>
              )}

              {/* Workflow Summary */}
              <WorkflowSummary workflow={workflow} />
            </div>
          </div>

          {/* Right Column - Sliders & Controls */}
          <div className="lg:col-span-8 space-y-6">
            {/* Volume Sliders */}
            <VolumeSliders workflow={workflow} onUpdate={updateWorkflow} />

            {/* Advanced Controls - Only shown when Advanced Mode is enabled */}
            {advancedMode && (
              <>
                {/* Complexity Sliders */}
                <ComplexitySliders workflow={workflow} onUpdate={updateWorkflow} />

                {/* Token Controls */}
                <TokenControls workflow={workflow} onUpdate={updateWorkflow} />
              </>
            )}

            {/* Cost Per Transaction (at bottom of sliders) */}
            {costBreakdown && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Cost per Transaction
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Credits</p>
                    <p className="text-2xl font-bold text-black">
                      {costBreakdown.credits_per_transaction.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">{selectedCurrency}</p>
                    <p className="text-2xl font-bold text-black">
                      {formatCurrency(costBreakdown.credits_per_transaction * CREDIT_PRICE, 6)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Token Cost</p>
                    <p className="text-xl font-bold text-blue-700">
                      {costBreakdown.token_cost_with_handling_fee.toFixed(4)}C
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">Feature Cost</p>
                    <p className="text-xl font-bold text-purple-700">
                      {costBreakdown.feature_cost.toFixed(4)}C
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cost Forecast Chart */}
            {costBreakdown && (
              <CostForecastChart
                monthlyCost={costBreakdown.monthly_credits}
                scenarioMultiplier={selectedScenario?.multiplier}
                scenarioLabel={selectedScenario?.label}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        </div>

        {/* Premium Business Report Modal */}
        {showExplainPrice && costBreakdown && (
          <PremiumBusinessReport
            costBreakdown={costBreakdown}
            workflow={workflow}
            onClose={() => setShowExplainPrice(false)}
          />
        )}
      </div>
    </div>
  );
}
