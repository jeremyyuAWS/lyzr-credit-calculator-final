import { useState, useEffect } from 'react';
import { Play, Save, ChevronRight, RefreshCw, Search, Calculator } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CalculationStep {
  step: number;
  operation: string;
  formula: string;
  formula_key?: string;
  inputs: Record<string, number>;
  result: number;
  explanation: string;
}

interface DebugTrace {
  trace_name: string;
  workflow_description: string;
  input_parameters: Record<string, any>;
  calculation_steps: CalculationStep[];
  final_results: Record<string, number>;
  execution_time_ms: number;
  formulas_used: string[];
  variables_used: string[];
}

interface Formula {
  id: string;
  formula_name: string;
  formula_key: string;
  formula_expression: string;
  description: string | null;
  variables_used: string[];
  category: string;
  is_active: boolean;
}

interface PricingVariable {
  id: string;
  variable_key: string;
  variable_name: string;
  variable_value: number;
  variable_type: string;
  category: string;
  description: string | null;
  unit: string | null;
  is_overridden: boolean;
}

export default function DebugModeTab() {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [trace, setTrace] = useState<DebugTrace | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [variables, setVariables] = useState<PricingVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<Set<string>>(new Set([
    'base_credits',
    'credit_price_usd',
  ]));

  useEffect(() => {
    loadFormulasAndVariables();
  }, []);

  async function loadFormulasAndVariables() {
    setLoading(true);
    const [formulasResult, variablesResult] = await Promise.all([
      supabase
        .from('formula_definitions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true }),
      supabase
        .from('pricing_variables')
        .select('*')
        .order('category', { ascending: true })
    ]);

    if (formulasResult.data) setFormulas(formulasResult.data);
    if (variablesResult.data) {
      setVariables(variablesResult.data);

      // Initialize inputs from selected variables
      const initialInputs: Record<string, number> = {};
      variablesResult.data.forEach(v => {
        if (selectedVariables.has(v.variable_key)) {
          initialInputs[v.variable_key] = v.variable_value;
        }
      });

      // Add common calculation inputs
      initialInputs['complexityMultiplier'] = 1.2;
      initialInputs['agentMultiplier'] = 1.2;
      initialInputs['scenarioMultiplier'] = 0.8;
      initialInputs['registrationsPerDay'] = 100;
      initialInputs['workingDaysPerMonth'] = 22;

      setInputs(initialInputs);
    }
    setLoading(false);
  }

  function toggleStep(step: number) {
    setExpandedSteps(prev =>
      prev.includes(step)
        ? prev.filter(s => s !== step)
        : [...prev, step]
    );
  }

  function toggleVariable(varKey: string) {
    const newSelected = new Set(selectedVariables);
    if (newSelected.has(varKey)) {
      newSelected.delete(varKey);
      const newInputs = { ...inputs };
      delete newInputs[varKey];
      setInputs(newInputs);
    } else {
      newSelected.add(varKey);
      const variable = variables.find(v => v.variable_key === varKey);
      if (variable) {
        setInputs({ ...inputs, [varKey]: variable.variable_value });
      }
    }
    setSelectedVariables(newSelected);
  }

  function updateInput(key: string, value: number) {
    setInputs({ ...inputs, [key]: value });
  }

  function resetToDefaults() {
    const defaultInputs: Record<string, number> = {};
    variables.forEach(v => {
      if (selectedVariables.has(v.variable_key)) {
        defaultInputs[v.variable_key] = v.variable_value;
      }
    });

    // Add common calculation inputs
    defaultInputs['complexityMultiplier'] = 1.2;
    defaultInputs['agentMultiplier'] = 1.2;
    defaultInputs['scenarioMultiplier'] = 0.8;
    defaultInputs['registrationsPerDay'] = 100;
    defaultInputs['workingDaysPerMonth'] = 22;

    setInputs(defaultInputs);
  }

  function runCalculation() {
    setCalculating(true);
    const startTime = performance.now();

    const steps: CalculationStep[] = [];
    const formulasUsed: string[] = [];
    const variablesUsed: string[] = [];

    const baseCredits = inputs['base_credits'] || inputs['baseCredits'] || 40;
    const complexityMultiplier = inputs['complexityMultiplier'] || 1.2;
    const agentMultiplier = inputs['agentMultiplier'] || 1.2;
    const scenarioMultiplier = inputs['scenarioMultiplier'] || 0.8;
    const registrationsPerDay = inputs['registrationsPerDay'] || 100;
    const workingDaysPerMonth = inputs['workingDaysPerMonth'] || 22;
    const creditPrice = inputs['credit_price_usd'] || inputs['creditPrice'] || 0.008;

    // Step 1: Apply Complexity Multiplier
    const complexityFormula = formulas.find(f => f.formula_key === 'apply_complexity_multiplier');
    const step1Result = baseCredits * complexityMultiplier;

    steps.push({
      step: 1,
      operation: 'Apply Complexity Multiplier',
      formula: complexityFormula?.formula_expression || 'base_credits × complexityMultiplier',
      formula_key: complexityFormula?.formula_key,
      inputs: {
        base_credits: baseCredits,
        complexityMultiplier,
      },
      result: step1Result,
      explanation: `Starting with base credits (${baseCredits}), we multiply by complexity multiplier (${complexityMultiplier}) to account for workflow complexity.`,
    });

    if (complexityFormula) formulasUsed.push(complexityFormula.formula_name);
    variablesUsed.push('base_credits', 'complexity_multiplier');

    // Step 2: Apply Agent Multiplier
    const agentFormula = formulas.find(f => f.formula_key === 'apply_agent_multiplier');
    const step2Result = step1Result * agentMultiplier;

    steps.push({
      step: 2,
      operation: 'Apply Agent Multiplier',
      formula: agentFormula?.formula_expression || 'previousResult × agentMultiplier',
      formula_key: agentFormula?.formula_key,
      inputs: {
        previousResult: step1Result,
        agentMultiplier,
      },
      result: step2Result,
      explanation: `We then multiply by agent multiplier (${agentMultiplier}) to account for multi-agent coordination overhead.`,
    });

    if (agentFormula) formulasUsed.push(agentFormula.formula_name);
    variablesUsed.push('agent_multiplier');

    // Step 3: Apply Scenario Multiplier
    const scenarioFormula = formulas.find(f => f.formula_key === 'apply_scenario_multiplier');
    const creditsPerTransaction = step2Result * scenarioMultiplier;

    steps.push({
      step: 3,
      operation: 'Apply Scenario Multiplier',
      formula: scenarioFormula?.formula_expression || 'previousResult × scenarioMultiplier',
      formula_key: scenarioFormula?.formula_key,
      inputs: {
        previousResult: step2Result,
        scenarioMultiplier,
      },
      result: creditsPerTransaction,
      explanation: `Finally, we apply scenario multiplier (${scenarioMultiplier}) to adjust for deployment type (optimized/standard/premium).`,
    });

    if (scenarioFormula) formulasUsed.push(scenarioFormula.formula_name);
    variablesUsed.push('scenario_multiplier');

    // Step 4: Calculate Monthly Credits
    const monthlyFormula = formulas.find(f => f.formula_key === 'calculate_monthly_credits');
    const monthlyCredits = creditsPerTransaction * registrationsPerDay * workingDaysPerMonth;

    steps.push({
      step: 4,
      operation: 'Calculate Monthly Credits',
      formula: monthlyFormula?.formula_expression || 'creditsPerTxn × registrationsPerDay × workingDaysPerMonth',
      formula_key: monthlyFormula?.formula_key,
      inputs: {
        creditsPerTransaction,
        registrationsPerDay,
        workingDaysPerMonth,
      },
      result: monthlyCredits,
      explanation: `Multiply credits per transaction (${creditsPerTransaction.toFixed(2)}) by daily registrations (${registrationsPerDay}) and working days (${workingDaysPerMonth}) to get monthly credit consumption.`,
    });

    if (monthlyFormula) formulasUsed.push(monthlyFormula.formula_name);

    // Step 5: Convert to USD
    const usdFormula = formulas.find(f => f.formula_key === 'credits_to_usd');
    const monthlyCost = monthlyCredits * creditPrice;

    steps.push({
      step: 5,
      operation: 'Convert to USD',
      formula: usdFormula?.formula_expression || 'monthlyCredits × credit_price_usd',
      formula_key: usdFormula?.formula_key,
      inputs: {
        monthlyCredits,
        credit_price_usd: creditPrice,
      },
      result: monthlyCost,
      explanation: `Convert monthly credits (${monthlyCredits.toLocaleString()}) to USD by multiplying with credit price ($${creditPrice}).`,
    });

    if (usdFormula) formulasUsed.push(usdFormula.formula_name);
    variablesUsed.push('credit_price_usd');

    // Step 6: Calculate Annual Cost
    const annualFormula = formulas.find(f => f.formula_key === 'calculate_annual_cost');
    const annualCost = monthlyCost * 12;

    steps.push({
      step: 6,
      operation: 'Calculate Annual Cost',
      formula: annualFormula?.formula_expression || 'monthlyCost × 12',
      formula_key: annualFormula?.formula_key,
      inputs: {
        monthlyCost,
      },
      result: annualCost,
      explanation: `Multiply monthly cost ($${monthlyCost.toFixed(2)}) by 12 to get annual cost projection.`,
    });

    if (annualFormula) formulasUsed.push(annualFormula.formula_name);

    const endTime = performance.now();

    const newTrace: DebugTrace = {
      trace_name: `Debug Trace - ${new Date().toLocaleString()}`,
      workflow_description: 'Standard pricing calculation workflow',
      input_parameters: inputs,
      calculation_steps: steps,
      final_results: {
        creditsPerTransaction,
        monthlyCredits,
        monthlyCost,
        annualCost,
      },
      execution_time_ms: Math.round(endTime - startTime),
      formulas_used: formulasUsed,
      variables_used: Array.from(new Set(variablesUsed)),
    };

    setTrace(newTrace);
    setExpandedSteps(steps.map(s => s.step));
    setCalculating(false);
  }

  async function saveTrace() {
    if (!trace) return;

    const { error } = await supabase
      .from('calculation_debug_traces')
      .insert([{
        trace_name: trace.trace_name,
        workflow_description: trace.workflow_description,
        input_parameters: trace.input_parameters,
        calculation_steps: trace.calculation_steps,
        final_results: trace.final_results,
        execution_time_ms: trace.execution_time_ms,
      }]);

    if (error) {
      console.error('Error saving trace:', error);
      alert('Failed to save trace');
    } else {
      alert('Trace saved successfully!');
    }
  }

  const filteredVariables = variables.filter(v =>
    v.variable_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.variable_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedVariables = filteredVariables.reduce((acc, variable) => {
    const category = variable.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(variable);
    return acc;
  }, {} as Record<string, PricingVariable[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading debug tools...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Internal Debug Mode</h3>
          <p className="text-sm text-gray-600 mt-1">
            Build custom calculations using any pricing variables as inputs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </button>
          {trace && (
            <button
              onClick={saveTrace}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Trace
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Variable Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-black mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Available Variables
          </h4>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {Object.entries(groupedVariables).map(([category, categoryVariables]) => (
              <div key={category}>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2 sticky top-0 bg-white py-1">
                  {category}
                </div>
                <div className="space-y-1">
                  {categoryVariables.map((variable) => (
                    <label
                      key={variable.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVariables.has(variable.variable_key)}
                        onChange={() => toggleVariable(variable.variable_key)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black truncate">
                          {variable.variable_name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {variable.variable_key}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {variable.variable_value.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Input Parameters & Calculation */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-black mb-4">Input Parameters</h4>
            <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {Object.entries(inputs)
                .sort(([keyA], [keyB]) => {
                  // Prioritize selected variables
                  const aIsVar = selectedVariables.has(keyA);
                  const bIsVar = selectedVariables.has(keyB);
                  if (aIsVar && !bIsVar) return -1;
                  if (!aIsVar && bIsVar) return 1;
                  return keyA.localeCompare(keyB);
                })
                .map(([key, value]) => {
                  const variable = variables.find(v => v.variable_key === key);
                  const isVariable = !!variable;
                  const displayName = variable ? variable.variable_name : key.replace(/([A-Z])/g, ' $1').trim();

                  return (
                    <div key={key} className={isVariable ? 'border-l-4 border-blue-500 pl-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {displayName}
                        {variable?.unit && <span className="text-xs text-gray-500 ml-1">({variable.unit})</span>}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) => updateInput(key, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
                      />
                      {variable?.description && (
                        <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                      )}
                    </div>
                  );
                })}
            </div>

            <button
              onClick={runCalculation}
              disabled={calculating}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 w-full justify-center"
            >
              <Play className="h-4 w-4" />
              {calculating ? 'Calculating...' : 'Run Calculation'}
            </button>
          </div>

          {trace && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-black">Final Results</h4>
                  <span className="text-xs text-gray-500">
                    Executed in {trace.execution_time_ms}ms
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Credits/Transaction</div>
                    <div className="text-xl font-bold text-black font-mono">
                      {trace.final_results.creditsPerTransaction.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Monthly Credits</div>
                    <div className="text-xl font-bold text-black font-mono">
                      {trace.final_results.monthlyCredits.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Monthly Cost</div>
                    <div className="text-xl font-bold text-black font-mono">
                      ${trace.final_results.monthlyCost.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Annual Cost</div>
                    <div className="text-xl font-bold text-black font-mono">
                      ${trace.final_results.annualCost.toFixed(2)}
                    </div>
                  </div>
                </div>
                {trace.formulas_used.length > 0 && (
                  <div className="pt-3 border-t border-green-200">
                    <div className="text-xs text-gray-600 mb-1">Formulas Used:</div>
                    <div className="flex flex-wrap gap-1">
                      {trace.formulas_used.map((formula, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-green-300 text-gray-700">
                          {formula}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-black">Calculation Steps</h4>
                {trace.calculation_steps.map((step) => (
                  <div
                    key={step.step}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleStep(step.step)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-sm font-semibold">
                          {step.step}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-black">{step.operation}</div>
                          <div className="text-sm text-gray-600 font-mono">{step.formula}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Result</div>
                          <div className="font-mono font-semibold text-black">
                            {step.result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 stroke-gray-400 transition-transform ${
                            expandedSteps.includes(step.step) ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {expandedSteps.includes(step.step) && (
                      <div className="p-4 pt-0 border-t border-gray-200">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-700 mb-2">Explanation</div>
                            <p className="text-sm text-gray-800">{step.explanation}</p>
                          </div>

                          {step.formula_key && (
                            <div>
                              <div className="text-sm font-semibold text-gray-700 mb-2">Formula Key</div>
                              <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-blue-600">
                                {step.formula_key}
                              </code>
                            </div>
                          )}

                          <div>
                            <div className="text-sm font-semibold text-gray-700 mb-2">Inputs</div>
                            <div className="space-y-1">
                              {Object.entries(step.inputs).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-gray-600 font-mono">{key}:</span>
                                  <span className="font-mono text-black">
                                    {typeof value === 'number'
                                      ? value.toLocaleString(undefined, { maximumFractionDigits: 4 })
                                      : value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-gray-700">Output:</span>
                              <span className="font-mono font-semibold text-black">
                                {step.result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
