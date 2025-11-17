import { useState } from 'react';
import { Play, Save, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CalculationStep {
  step: number;
  operation: string;
  formula: string;
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

  function toggleStep(step: number) {
    setExpandedSteps(prev =>
      prev.includes(step)
        ? prev.filter(s => s !== step)
        : [...prev, step]
    );
  }

  function runCalculation() {
    setCalculating(true);
    const startTime = performance.now();

    const steps: CalculationStep[] = [];

    const step1Result = inputs.baseCredits * inputs.complexityMultiplier;
    steps.push({
      step: 1,
      operation: 'Apply Complexity Multiplier',
      formula: 'baseCredits × complexityMultiplier',
      inputs: {
        baseCredits: inputs.baseCredits,
        complexityMultiplier: inputs.complexityMultiplier,
      },
      result: step1Result,
      explanation: `Starting with base credits (${inputs.baseCredits}), we multiply by complexity multiplier (${inputs.complexityMultiplier}) to account for workflow complexity.`,
    });

    const step2Result = step1Result * inputs.agentMultiplier;
    steps.push({
      step: 2,
      operation: 'Apply Agent Multiplier',
      formula: 'previousResult × agentMultiplier',
      inputs: {
        previousResult: step1Result,
        agentMultiplier: inputs.agentMultiplier,
      },
      result: step2Result,
      explanation: `We then multiply by agent multiplier (${inputs.agentMultiplier}) to account for multi-agent coordination overhead.`,
    });

    const creditsPerTransaction = step2Result * inputs.scenarioMultiplier;
    steps.push({
      step: 3,
      operation: 'Apply Scenario Multiplier',
      formula: 'previousResult × scenarioMultiplier',
      inputs: {
        previousResult: step2Result,
        scenarioMultiplier: inputs.scenarioMultiplier,
      },
      result: creditsPerTransaction,
      explanation: `Finally, we apply scenario multiplier (${inputs.scenarioMultiplier}) to adjust for deployment type (optimized/standard/premium).`,
    });

    const monthlyCredits = creditsPerTransaction * inputs.registrationsPerDay * inputs.workingDaysPerMonth;
    steps.push({
      step: 4,
      operation: 'Calculate Monthly Credits',
      formula: 'creditsPerTxn × registrationsPerDay × workingDaysPerMonth',
      inputs: {
        creditsPerTransaction,
        registrationsPerDay: inputs.registrationsPerDay,
        workingDaysPerMonth: inputs.workingDaysPerMonth,
      },
      result: monthlyCredits,
      explanation: `Multiply credits per transaction (${creditsPerTransaction.toFixed(2)}) by daily registrations (${inputs.registrationsPerDay}) and working days (${inputs.workingDaysPerMonth}) to get monthly credit consumption.`,
    });

    const monthlyCost = monthlyCredits * inputs.creditPrice;
    steps.push({
      step: 5,
      operation: 'Convert to USD',
      formula: 'monthlyCredits × creditPrice',
      inputs: {
        monthlyCredits,
        creditPrice: inputs.creditPrice,
      },
      result: monthlyCost,
      explanation: `Convert monthly credits (${monthlyCredits.toLocaleString()}) to USD by multiplying with credit price ($${inputs.creditPrice}).`,
    });

    const annualCost = monthlyCost * 12;
    steps.push({
      step: 6,
      operation: 'Calculate Annual Cost',
      formula: 'monthlyCost × 12',
      inputs: {
        monthlyCost,
      },
      result: annualCost,
      explanation: `Multiply monthly cost ($${monthlyCost.toFixed(2)}) by 12 to get annual cost projection.`,
    });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Internal Debug Mode</h3>
          <p className="text-sm text-gray-600 mt-1">
            Step-by-step calculation trace with intermediate values and formula breakdown
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
            <div className="grid grid-cols-4 gap-4">
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
  );
}
