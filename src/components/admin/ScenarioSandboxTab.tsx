import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Scenario {
  id: string;
  scenario_name: string;
  scenario_description: string | null;
  configuration: {
    baseCredits: number;
    complexityMultiplier: number;
    agentMultiplier: number;
    scenarioMultiplier: number;
    registrationsPerDay: number;
    workingDaysPerMonth: number;
  };
  results: {
    creditsPerTransaction: number;
    monthlyCredits: number;
    monthlyCost: number;
    annualCost: number;
  } | null;
  is_baseline: boolean;
}

export default function ScenarioSandboxTab() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  useEffect(() => {
    loadScenarios();
  }, []);

  async function loadScenarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pricing_scenarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading scenarios:', error);
    } else {
      setScenarios(data || []);
    }
    setLoading(false);
  }

  async function createScenario() {
    if (!newScenarioName.trim()) return;

    const newScenario: Omit<Scenario, 'id'> = {
      scenario_name: newScenarioName.trim(),
      scenario_description: 'New pricing scenario',
      configuration: {
        baseCredits: 40,
        complexityMultiplier: 1.2,
        agentMultiplier: 1.2,
        scenarioMultiplier: 0.8,
        registrationsPerDay: 100,
        workingDaysPerMonth: 22,
      },
      results: null,
      is_baseline: false,
    };

    const { error } = await supabase
      .from('pricing_scenarios')
      .insert([newScenario]);

    if (error) {
      console.error('Error creating scenario:', error);
    } else {
      setNewScenarioName('');
      setShowCreateForm(false);
      await loadScenarios();
    }
  }

  async function duplicateScenario(scenario: Scenario) {
    const newName = `${scenario.scenario_name} (Copy)`;
    const { error } = await supabase
      .from('pricing_scenarios')
      .insert([{
        scenario_name: newName,
        scenario_description: scenario.scenario_description,
        configuration: scenario.configuration,
        results: null,
        is_baseline: false,
      }]);

    if (error) {
      console.error('Error duplicating scenario:', error);
    } else {
      await loadScenarios();
    }
  }

  async function deleteScenario(id: string) {
    if (!confirm('Delete this scenario?')) return;

    const { error } = await supabase
      .from('pricing_scenarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scenario:', error);
    } else {
      await loadScenarios();
    }
  }

  async function updateConfiguration(id: string, key: string, value: number) {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    const updatedConfig = { ...scenario.configuration, [key]: value };
    const results = calculateResults(updatedConfig);

    const { error } = await supabase
      .from('pricing_scenarios')
      .update({
        configuration: updatedConfig,
        results: results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating scenario:', error);
    } else {
      await loadScenarios();
    }
  }

  async function recalculateScenario(id: string) {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    const results = calculateResults(scenario.configuration);

    const { error } = await supabase
      .from('pricing_scenarios')
      .update({
        results: results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error recalculating scenario:', error);
    } else {
      await loadScenarios();
    }
  }

  function calculateResults(config: Scenario['configuration']) {
    const creditsPerTransaction =
      config.baseCredits *
      config.complexityMultiplier *
      config.agentMultiplier *
      config.scenarioMultiplier;

    const monthlyCredits =
      creditsPerTransaction *
      config.registrationsPerDay *
      config.workingDaysPerMonth;

    // Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
    const monthlyCost = monthlyCredits * 0.01;
    const annualCost = monthlyCost * 12;

    return {
      creditsPerTransaction,
      monthlyCredits,
      monthlyCost,
      annualCost,
    };
  }

  function toggleCompare(id: string) {
    setComparing(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading scenarios...</div>
      </div>
    );
  }

  const comparisonScenarios = scenarios.filter(s => comparing.includes(s.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Scenario Testing Sandbox</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create and compare up to 3 pricing scenarios side-by-side
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Scenario
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg animate-in slide-in-from-top-5 duration-300">
          <h4 className="text-lg font-semibold text-black mb-4">Create New Scenario</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scenario Name
              </label>
              <input
                type="text"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newScenarioName.trim()) {
                    createScenario();
                  }
                }}
                placeholder="e.g., Q4 Enterprise Plan"
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createScenario}
                disabled={!newScenarioName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Create Scenario
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewScenarioName('');
                }}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {comparing.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-black mb-4">Side-by-Side Comparison</h4>
          <div className="grid grid-cols-3 gap-4">
            {comparisonScenarios.map(scenario => (
              <div key={scenario.id} className="bg-white rounded-lg p-4 space-y-3">
                <div className="font-semibold text-black">{scenario.scenario_name}</div>
                {scenario.results && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credits/Txn:</span>
                      <span className="font-mono">{scenario.results.creditsPerTransaction.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly:</span>
                      <span className="font-mono">${scenario.results.monthlyCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual:</span>
                      <span className="font-mono">${scenario.results.annualCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => toggleCompare(scenario.id)}
                  className="w-full px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Remove from Comparison
                </button>
              </div>
            ))}
          </div>
          {comparisonScenarios.length === 3 && comparisonScenarios.every(s => s.results) && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <h5 className="font-medium text-black mb-2">Comparison Summary</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Lowest Monthly Cost:</span>
                  <div className="font-semibold">
                    {comparisonScenarios.reduce((min, s) =>
                      s.results!.monthlyCost < min.results!.monthlyCost ? s : min
                    ).scenario_name}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Cost Range:</span>
                  <div className="font-semibold">
                    ${Math.min(...comparisonScenarios.map(s => s.results!.monthlyCost)).toFixed(2)} -
                    ${Math.max(...comparisonScenarios.map(s => s.results!.monthlyCost)).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Max Difference:</span>
                  <div className="font-semibold">
                    {(
                      ((Math.max(...comparisonScenarios.map(s => s.results!.monthlyCost)) -
                        Math.min(...comparisonScenarios.map(s => s.results!.monthlyCost))) /
                        Math.min(...comparisonScenarios.map(s => s.results!.monthlyCost))) *
                      100
                    ).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {scenarios.map(scenario => (
          <div
            key={scenario.id}
            className={`bg-white border rounded-lg p-4 ${
              comparing.includes(scenario.id) ? 'border-blue-500 shadow-md' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-black">{scenario.scenario_name}</h4>
                  {scenario.is_baseline && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                      Baseline
                    </span>
                  )}
                </div>
                {scenario.scenario_description && (
                  <p className="text-sm text-gray-600 mt-1">{scenario.scenario_description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => recalculateScenario(scenario.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Recalculate"
                >
                  <RefreshCw className="h-4 w-4 stroke-black" />
                </button>
                <button
                  onClick={() => duplicateScenario(scenario)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4 stroke-black" />
                </button>
                <button
                  onClick={() => deleteScenario(scenario.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 stroke-red-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-700">Configuration</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Base Credits</label>
                    <input
                      type="number"
                      value={scenario.configuration.baseCredits}
                      onChange={(e) =>
                        updateConfiguration(scenario.id, 'baseCredits', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Complexity Mult.</label>
                    <input
                      type="number"
                      step="0.1"
                      value={scenario.configuration.complexityMultiplier}
                      onChange={(e) =>
                        updateConfiguration(scenario.id, 'complexityMultiplier', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Agent Mult.</label>
                    <input
                      type="number"
                      step="0.1"
                      value={scenario.configuration.agentMultiplier}
                      onChange={(e) =>
                        updateConfiguration(scenario.id, 'agentMultiplier', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Scenario Mult.</label>
                    <input
                      type="number"
                      step="0.1"
                      value={scenario.configuration.scenarioMultiplier}
                      onChange={(e) =>
                        updateConfiguration(scenario.id, 'scenarioMultiplier', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Reg./Day</label>
                    <input
                      type="number"
                      value={scenario.configuration.registrationsPerDay}
                      onChange={(e) =>
                        updateConfiguration(scenario.id, 'registrationsPerDay', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Working Days</label>
                    <input
                      type="number"
                      value={scenario.configuration.workingDaysPerMonth}
                      onChange={(e) =>
                        updateConfiguration(scenario.id, 'workingDaysPerMonth', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-700">Results</h5>
                {scenario.results ? (
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Credits per Transaction:</span>
                      <span className="font-mono font-semibold">
                        {scenario.results.creditsPerTransaction.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Monthly Credits:</span>
                      <span className="font-mono font-semibold">
                        {scenario.results.monthlyCredits.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Monthly Cost:</span>
                      <span className="font-mono font-semibold text-lg">
                        ${scenario.results.monthlyCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">Annual Cost:</span>
                      <span className="font-mono font-semibold">
                        ${scenario.results.annualCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No results calculated</div>
                )}

                <button
                  onClick={() => toggleCompare(scenario.id)}
                  disabled={comparing.length >= 3 && !comparing.includes(scenario.id)}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                    comparing.includes(scenario.id)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {comparing.includes(scenario.id) ? 'Remove from Comparison' : 'Add to Comparison'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
