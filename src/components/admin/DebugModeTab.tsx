import { useState, useEffect } from 'react';
import { Play, Save, ChevronRight, Code, Database, TrendingUp } from 'lucide-react';
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
  const [inputs, setInputs] = useState({
    baseCredits: 40,
    complexityMultiplier: 1.2,
    agentMultiplier: 1.2,
    scenarioMultiplier: 0.8,
    registrationsPerDay: 100,
    workingDaysPerMonth: 22,
    creditPrice: 0.008,
  });

  const [trace, setTrace] = useState<DebugTrace | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [variables, setVariables] = useState<PricingVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trace' | 'formulas' | 'variables'>('trace');

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

      // Auto-populate inputs from variables
      const varMap: Record<string, number> = {};
      variablesResult.data.forEach(v => {
        varMap[v.variable_key] = v.variable_value;
      });

      setInputs(prev => ({
        ...prev,
        baseCredits: varMap['base_credits'] || prev.baseCredits,
        creditPrice: varMap['credit_price_usd'] || prev.creditPrice,
      }));
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

  function evaluateFormula(formulaKey: string, context: Record<string, number>): number {
    const formula = formulas.find(f => f.formula_key === formulaKey);
    if (!formula) return 0;

    try {
      const expression = formula.formula_expression
        .replace(/\[(\w+)\]/g, (_, varName) => {
          const variable = variables.find(v => v.variable_key === varName);
          if (variable) return String(variable.variable_value);
          return context[varName] !== undefined ? String(context[varName]) : '0';
        });

      return eval(expression);
    } catch (error) {
      console.error(`Error evaluating formula ${formulaKey}:`, error);
      return 0;
    }
  }

  function runCalculation() {
    setCalculating(true);
    const startTime = performance.now();

    const steps: CalculationStep[] = [];
    const formulasUsed: string[] = [];
    const variablesUsed: string[] = [];

    // Step 1: Apply Complexity Multiplier
    const complexityFormula = formulas.find(f => f.formula_key === 'apply_complexity_multiplier');
    const step1Result = inputs.baseCredits * inputs.complexityMultiplier;

    steps.push({
      step: 1,
      operation: 'Apply Complexity Multiplier',
      formula: complexityFormula?.formula_expression || 'baseCredits × complexityMultiplier',
      formula_key: complexityFormula?.formula_key,
      inputs: {
        baseCredits: inputs.baseCredits,
        complexityMultiplier: inputs.complexityMultiplier,
      },
      result: step1Result,
      explanation: `Starting with base credits (${inputs.baseCredits}), we multiply by complexity multiplier (${inputs.complexityMultiplier}) to account for workflow complexity.`,
    });

    if (complexityFormula) formulasUsed.push(complexityFormula.formula_name);
    variablesUsed.push('base_credits', 'complexity_multiplier');

    // Step 2: Apply Agent Multiplier
    const agentFormula = formulas.find(f => f.formula_key === 'apply_agent_multiplier');
    const step2Result = step1Result * inputs.agentMultiplier;

    steps.push({
      step: 2,
      operation: 'Apply Agent Multiplier',
      formula: agentFormula?.formula_expression || 'previousResult × agentMultiplier',
      formula_key: agentFormula?.formula_key,
      inputs: {
        previousResult: step1Result,
        agentMultiplier: inputs.agentMultiplier,
      },
      result: step2Result,
      explanation: `We then multiply by agent multiplier (${inputs.agentMultiplier}) to account for multi-agent coordination overhead.`,
    });

    if (agentFormula) formulasUsed.push(agentFormula.formula_name);
    variablesUsed.push('agent_multiplier');

    // Step 3: Apply Scenario Multiplier
    const scenarioFormula = formulas.find(f => f.formula_key === 'apply_scenario_multiplier');
    const creditsPerTransaction = step2Result * inputs.scenarioMultiplier;

    steps.push({
      step: 3,
      operation: 'Apply Scenario Multiplier',
      formula: scenarioFormula?.formula_expression || 'previousResult × scenarioMultiplier',
      formula_key: scenarioFormula?.formula_key,
      inputs: {
        previousResult: step2Result,
        scenarioMultiplier: inputs.scenarioMultiplier,
      },
      result: creditsPerTransaction,
      explanation: `Finally, we apply scenario multiplier (${inputs.scenarioMultiplier}) to adjust for deployment type (optimized/standard/premium).`,
    });

    if (scenarioFormula) formulasUsed.push(scenarioFormula.formula_name);
    variablesUsed.push('scenario_multiplier');

    // Step 4: Calculate Monthly Credits
    const monthlyFormula = formulas.find(f => f.formula_key === 'calculate_monthly_credits');
    const monthlyCredits = creditsPerTransaction * inputs.registrationsPerDay * inputs.workingDaysPerMonth;

    steps.push({
      step: 4,
      operation: 'Calculate Monthly Credits',
      formula: monthlyFormula?.formula_expression || 'creditsPerTxn × registrationsPerDay × workingDaysPerMonth',
      formula_key: monthlyFormula?.formula_key,
      inputs: {
        creditsPerTransaction,
        registrationsPerDay: inputs.registrationsPerDay,
        workingDaysPerMonth: inputs.workingDaysPerMonth,
      },
      result: monthlyCredits,
      explanation: `Multiply credits per transaction (${creditsPerTransaction.toFixed(2)}) by daily registrations (${inputs.registrationsPerDay}) and working days (${inputs.workingDaysPerMonth}) to get monthly credit consumption.`,
    });

    if (monthlyFormula) formulasUsed.push(monthlyFormula.formula_name);

    // Step 5: Convert to USD
    const usdFormula = formulas.find(f => f.formula_key === 'credits_to_usd');
    const monthlyCost = monthlyCredits * inputs.creditPrice;

    steps.push({
      step: 5,
      operation: 'Convert to USD',
      formula: usdFormula?.formula_expression || 'monthlyCredits × creditPrice',
      formula_key: usdFormula?.formula_key,
      inputs: {
        monthlyCredits,
        creditPrice: inputs.creditPrice,
      },
      result: monthlyCost,
      explanation: `Convert monthly credits (${monthlyCredits.toLocaleString()}) to USD by multiplying with credit price ($${inputs.creditPrice}).`,
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

  const groupedFormulas = formulas.reduce((acc, formula) => {
    const category = formula.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(formula);
    return acc;
  }, {} as Record<string, Formula[]>);

  const groupedVariables = variables.reduce((acc, variable) => {
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
            Step-by-step calculation trace with live formulas and pricing variables
          </p>
        </div>
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'trace'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Calculation Trace
            </div>
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'formulas'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Live Formulas ({formulas.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'variables'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Pricing Variables ({variables.length})
            </div>
          </button>
        </div>
      </div>

      {/* Calculation Trace Tab */}
      {activeTab === 'trace' && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-black mb-4">Input Parameters</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Credits
                </label>
                <input
                  type="number"
                  value={inputs.baseCredits}
                  onChange={(e) => setInputs({ ...inputs, baseCredits: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complexity Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.complexityMultiplier}
                  onChange={(e) => setInputs({ ...inputs, complexityMultiplier: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.agentMultiplier}
                  onChange={(e) => setInputs({ ...inputs, agentMultiplier: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.scenarioMultiplier}
                  onChange={(e) => setInputs({ ...inputs, scenarioMultiplier: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registrations per Day
                </label>
                <input
                  type="number"
                  value={inputs.registrationsPerDay}
                  onChange={(e) => setInputs({ ...inputs, registrationsPerDay: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working Days per Month
                </label>
                <input
                  type="number"
                  value={inputs.workingDaysPerMonth}
                  onChange={(e) => setInputs({ ...inputs, workingDaysPerMonth: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Price (USD)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={inputs.creditPrice}
                  onChange={(e) => setInputs({ ...inputs, creditPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={runCalculation}
              disabled={calculating}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
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
        </>
      )}

      {/* Live Formulas Tab */}
      {activeTab === 'formulas' && (
        <div className="space-y-6">
          {Object.entries(groupedFormulas).map(([category, categoryFormulas]) => (
            <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-black mb-4 capitalize">{category} Formulas</h4>
              <div className="space-y-3">
                {categoryFormulas.map((formula) => (
                  <div key={formula.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-black">{formula.formula_name}</h5>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block text-blue-600">
                          {formula.formula_key}
                        </code>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        formula.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {formula.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {formula.description && (
                      <p className="text-sm text-gray-600 mb-2">{formula.description}</p>
                    )}
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                      {formula.formula_expression}
                    </div>
                    {formula.variables_used.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-600">Variables: </span>
                        {formula.variables_used.map((varKey, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-1">
                            {varKey}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Variables Tab */}
      {activeTab === 'variables' && (
        <div className="space-y-6">
          {Object.entries(groupedVariables).map(([category, categoryVariables]) => (
            <div key={category} className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-black mb-4 capitalize">{category} Variables</h4>
              <div className="space-y-2">
                {categoryVariables.map((variable) => (
                  <div key={variable.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-black">{variable.variable_name}</h5>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-purple-600">
                          {variable.variable_key}
                        </code>
                        {variable.is_overridden && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            Overridden
                          </span>
                        )}
                      </div>
                      {variable.description && (
                        <p className="text-sm text-gray-600 mt-1">{variable.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-black text-lg">
                        {variable.variable_value.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </div>
                      {variable.unit && (
                        <div className="text-xs text-gray-500">{variable.unit}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
