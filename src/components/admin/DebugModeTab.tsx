import { useState, useEffect, useRef } from 'react';
import { Play, Save, ChevronRight, RefreshCw, Search, Calculator, Code, Bug } from 'lucide-react';
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

interface DebugModeTabProps {
  debugConfig?: {
    formulaKey?: string;
    variables?: string[];
  } | null;
  onConfigConsumed?: () => void;
}

export default function DebugModeTab({ debugConfig, onConfigConsumed }: DebugModeTabProps) {
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
  const [searchType, setSearchType] = useState<'all' | 'variables' | 'formulas'>('all');
  const [selectedFormulas, setSelectedFormulas] = useState<Set<string>>(new Set());
  const shouldAutoRunRef = useRef(false);

  useEffect(() => {
    loadFormulasAndVariables();
  }, []);

  useEffect(() => {
    if (debugConfig && debugConfig.formulaKey && formulas.length > 0 && variables.length > 0) {
      const newSelectedFormulas = new Set([debugConfig.formulaKey]);
      setSelectedFormulas(newSelectedFormulas);

      if (debugConfig.variables && debugConfig.variables.length > 0) {
        const newSelectedVars = new Set(debugConfig.variables);
        setSelectedVariables(newSelectedVars);

        const newInputs: Record<string, number> = {};
        debugConfig.variables.forEach(varKey => {
          const variable = variables.find(v => v.variable_key === varKey);
          if (variable) {
            newInputs[varKey] = variable.variable_value;
          }
        });

        newInputs['complexityMultiplier'] = 1.2;
        newInputs['agentMultiplier'] = 1.2;
        newInputs['scenarioMultiplier'] = 0.8;
        newInputs['registrationsPerDay'] = 100;
        newInputs['workingDaysPerMonth'] = 22;

        setInputs(newInputs);

        // Mark that we should auto-run the calculation
        shouldAutoRunRef.current = true;
      }

      setSearchTerm('');
      setSearchType('all');

      if (onConfigConsumed) {
        onConfigConsumed();
      }
    }
  }, [debugConfig, formulas, variables, onConfigConsumed]);

  // Auto-run calculation when inputs are ready and flag is set
  useEffect(() => {
    if (shouldAutoRunRef.current && selectedFormulas.size > 0 && Object.keys(inputs).length > 0) {
      shouldAutoRunRef.current = false;
      runCalculation();
    }
  }, [inputs, selectedFormulas]);

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

  function toggleFormula(formulaKey: string) {
    const newSelected = new Set(selectedFormulas);
    if (newSelected.has(formulaKey)) {
      newSelected.delete(formulaKey);
    } else {
      newSelected.add(formulaKey);
    }
    setSelectedFormulas(newSelected);
  }

  function updateInput(key: string, value: number) {
    setInputs({ ...inputs, [key]: value });
  }

  function resetToDefaults() {
    // Reset to default selected variables
    const defaultSelectedVars = new Set(['base_credits', 'credit_price_usd']);
    setSelectedVariables(defaultSelectedVars);

    // Clear selected formulas
    setSelectedFormulas(new Set());

    // Reset inputs to default values
    const defaultInputs: Record<string, number> = {};
    variables.forEach(v => {
      if (defaultSelectedVars.has(v.variable_key)) {
        defaultInputs[v.variable_key] = v.variable_value;
      }
    });

    // Add common calculation inputs with default values
    defaultInputs['complexityMultiplier'] = 1.2;
    defaultInputs['agentMultiplier'] = 1.2;
    defaultInputs['scenarioMultiplier'] = 0.8;
    defaultInputs['registrationsPerDay'] = 100;
    defaultInputs['workingDaysPerMonth'] = 22;

    setInputs(defaultInputs);

    // Clear trace
    setTrace(null);
    setExpandedSteps([]);

    // Clear search
    setSearchTerm('');
    setSearchType('all');
  }

  function evaluateFormulaExpression(expression: string, context: Record<string, number>): number {
    try {
      // Replace [variable_key] with actual values
      let evaluableExpr = expression;

      // First replace variables from database
      variables.forEach(v => {
        const pattern = new RegExp(`\\[${v.variable_key}\\]`, 'g');
        const value = context[v.variable_key] || v.variable_value;
        evaluableExpr = evaluableExpr.replace(pattern, String(value));
      });

      // Then replace any remaining bracketed variables with context values
      evaluableExpr = evaluableExpr.replace(/\[(\w+)\]/g, (_, varName) => {
        return String(context[varName] || 0);
      });

      // Replace common variable names without brackets if present in context
      Object.keys(context).forEach(key => {
        const pattern = new RegExp(`\\b${key}\\b`, 'g');
        evaluableExpr = evaluableExpr.replace(pattern, String(context[key]));
      });

      // Evaluate the expression safely
      return Function('"use strict"; return (' + evaluableExpr + ')')();
    } catch (error) {
      console.error('Error evaluating formula:', expression, error);
      return 0;
    }
  }

  function runCalculation() {
    setCalculating(true);
    const startTime = performance.now();

    const steps: CalculationStep[] = [];
    const formulasUsed: string[] = [];
    const variablesUsed: string[] = [];
    const context: Record<string, number> = { ...inputs };

    // If user selected specific formulas, use those
    if (selectedFormulas.size > 0) {
      const selectedFormulasList = formulas.filter(f => selectedFormulas.has(f.formula_key));

      selectedFormulasList.forEach((formula, index) => {
        const stepNumber = index + 1;

        // Track which variables this formula uses
        const stepInputs: Record<string, number> = {};
        formula.variables_used.forEach(varKey => {
          if (context[varKey] !== undefined) {
            stepInputs[varKey] = context[varKey];
          }
        });

        // Evaluate the formula
        const result = evaluateFormulaExpression(formula.formula_expression, context);

        // Store result for next formulas to use
        context[formula.formula_key] = result;
        context['result'] = result;
        context['previousResult'] = result;

        steps.push({
          step: stepNumber,
          operation: formula.formula_name,
          formula: formula.formula_expression,
          formula_key: formula.formula_key,
          inputs: stepInputs,
          result,
          explanation: formula.description || `Applies ${formula.formula_name} to calculate the next value.`,
        });

        formulasUsed.push(formula.formula_name);
        variablesUsed.push(...formula.variables_used);
      });

      // Calculate final metrics if we have the necessary values
      const creditsPerTransaction = context['result'] || context['creditsPerTransaction'] || 0;
      const registrationsPerDay = context['biz_txn_per_day'] || context['registrationsPerDay'] || 100;
      const workingDaysPerMonth = context['biz_working_days'] || context['workingDaysPerMonth'] || 22;
      // Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
      const creditPrice = context['credit_price_usd'] || context['creditPrice'] || 0.01;

      const monthlyCredits = creditsPerTransaction * registrationsPerDay * workingDaysPerMonth;
      const monthlyCost = monthlyCredits * creditPrice;
      const annualCost = monthlyCost * 12;

      const endTime = performance.now();

      const newTrace: DebugTrace = {
        trace_name: `Debug Trace - ${new Date().toLocaleString()}`,
        workflow_description: 'Custom calculation with selected formulas',
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
      return;
    }

    // Otherwise, use default calculation flow

    const baseCredits = inputs['base_credits'] || inputs['baseCredits'] || 40;
    const complexityMultiplier = inputs['complexityMultiplier'] || 1.2;
    const agentMultiplier = inputs['agentMultiplier'] || 1.2;
    const scenarioMultiplier = inputs['scenarioMultiplier'] || 0.8;
    const registrationsPerDay = inputs['registrationsPerDay'] || 100;
    const workingDaysPerMonth = inputs['workingDaysPerMonth'] || 22;
    // Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
    const creditPrice = inputs['credit_price_usd'] || inputs['creditPrice'] || 0.01;

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

  const filteredVariables = variables.filter(v => {
    if (searchType === 'formulas') return false;
    if (!searchTerm) return true;
    return v.variable_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.variable_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const filteredFormulas = formulas.filter(f => {
    if (searchType === 'variables') return false;
    if (!searchTerm) return true;
    return f.formula_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.formula_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const groupedVariables = filteredVariables.reduce((acc, variable) => {
    const category = variable.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(variable);
    return acc;
  }, {} as Record<string, PricingVariable[]>);

  const groupedFormulas = filteredFormulas.reduce((acc, formula) => {
    const category = formula.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(formula);
    return acc;
  }, {} as Record<string, Formula[]>);

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

      {/* Debug Config Notification */}
      {selectedFormulas.size > 0 && debugConfig && debugConfig.formulaKey && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bug className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900">Formula Debug Mode Active</h4>
              <p className="text-sm text-green-700 mt-1">
                Formula <span className="font-mono font-semibold">{debugConfig.formulaKey}</span> has been loaded with its required variables.
                Adjust the input values below and click "Run Calculation" to trace the formula execution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Variable & Formula Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-black mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Available Variables & Formulas
          </h4>

          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search variables, formulas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSearchType('all')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  searchType === 'all'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSearchType('variables')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  searchType === 'variables'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Variables
              </button>
              <button
                onClick={() => setSearchType('formulas')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  searchType === 'formulas'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Formulas
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {/* Variables Section */}
            {(searchType === 'all' || searchType === 'variables') && Object.keys(groupedVariables).length > 0 && (
              <div>
                {searchType === 'all' && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">VARIABLES</span>
                  </div>
                )}
                {Object.entries(groupedVariables).map(([category, categoryVariables]) => (
                  <div key={category} className="mb-3">
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
            )}

            {/* Formulas Section */}
            {(searchType === 'all' || searchType === 'formulas') && Object.keys(groupedFormulas).length > 0 && (
              <div>
                {searchType === 'all' && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                    <Code className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">FORMULAS</span>
                  </div>
                )}
                {Object.entries(groupedFormulas).map(([category, categoryFormulas]) => (
                  <div key={category} className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2 sticky top-0 bg-white py-1">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {categoryFormulas.map((formula) => (
                        <label
                          key={formula.id}
                          className="block p-2 hover:bg-gray-50 rounded border border-gray-100 cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFormulas.has(formula.formula_key)}
                              onChange={() => toggleFormula(formula.formula_key)}
                              className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-600"
                            />
                            <Code className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-black">
                                {formula.formula_name}
                              </div>
                              <div className="text-xs text-gray-500 truncate mb-1">
                                {formula.formula_key}
                              </div>
                              <div className="text-xs bg-gray-900 text-green-400 p-2 rounded font-mono overflow-x-auto">
                                {formula.formula_expression}
                              </div>
                              {formula.description && (
                                <p className="text-xs text-gray-600 mt-1">{formula.description}</p>
                              )}
                              {formula.variables_used.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {formula.variables_used.map((varKey, idx) => {
                                    const varExists = selectedVariables.has(varKey);
                                    return (
                                      <span
                                        key={idx}
                                        className={`text-xs px-1.5 py-0.5 rounded ${
                                          varExists
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}
                                        title={varExists ? 'Variable selected as input' : 'Variable not selected'}
                                      >
                                        {varKey}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {Object.keys(groupedVariables).length === 0 && Object.keys(groupedFormulas).length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No results found for "{searchTerm}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Input Parameters & Calculation */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-black">Input Parameters</h4>
              {selectedFormulas.size > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  {selectedFormulas.size} formula{selectedFormulas.size !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {(() => {
                // If formulas are selected, only show their required variables
                let displayedInputs = Object.entries(inputs);

                if (selectedFormulas.size > 0) {
                  const requiredVars = new Set<string>();
                  formulas
                    .filter(f => selectedFormulas.has(f.formula_key))
                    .forEach(f => {
                      f.variables_used.forEach(v => requiredVars.add(v));
                    });

                  displayedInputs = displayedInputs.filter(([key]) => requiredVars.has(key));
                }

                return displayedInputs
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
                });
              })()}
            </div>

            {selectedFormulas.size === 0 && (
              <div className="mt-4 text-center py-8 text-gray-500">
                <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium">No formula selected</p>
                <p className="text-xs mt-1">Select a formula from the left panel to see its input parameters</p>
              </div>
            )}

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
