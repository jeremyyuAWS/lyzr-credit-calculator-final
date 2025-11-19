import { useState, useEffect } from 'react';
import { CheckCircle, TrendingDown, TrendingUp, AlertCircle, Save, Trash2, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Scenario {
  id: string;
  scenario_name: string;
  scenario_description: string;
  configuration: any;
  results: any;
}

interface ComparisonMetric {
  label: string;
  key: string;
  format: (value: any) => string;
  lowerIsBetter?: boolean;
}

interface ScenarioComparisonProps {
  scenarios?: Scenario[];
}

export default function ScenarioComparison({ scenarios: propScenarios }: ScenarioComparisonProps) {
  const [availableScenarios, setAvailableScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [comparisonName, setComparisonName] = useState('');
  const [savedComparisons, setSavedComparisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const metrics: ComparisonMetric[] = [
    { label: 'Monthly Cost', key: 'monthly_cost', format: (v) => `$${v?.toFixed(2) || '0.00'}`, lowerIsBetter: true },
    { label: 'Annual Cost', key: 'annual_cost', format: (v) => `$${v?.toFixed(0) || '0'}`, lowerIsBetter: true },
    { label: 'Credits/Transaction', key: 'credits_per_txn', format: (v) => `${v?.toFixed(2) || '0.00'}C`, lowerIsBetter: true },
    { label: 'Setup Costs', key: 'setup_costs', format: (v) => `$${v?.toFixed(0) || '0'}`, lowerIsBetter: true },
    { label: 'Transactions/Month', key: 'transactions_per_month', format: (v) => v?.toLocaleString() || '0' },
    { label: 'Cost per Transaction', key: 'cost_per_transaction', format: (v) => `$${v?.toFixed(4) || '0.0000'}`, lowerIsBetter: true },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [scenariosRes, comparisonsRes] = await Promise.all([
        supabase.from('pricing_scenarios').select('*').order('created_at', { ascending: false }),
        supabase.from('scenario_comparisons').select('*').order('created_at', { ascending: false })
      ]);

      if (scenariosRes.error) throw scenariosRes.error;
      if (comparisonsRes.error) throw comparisonsRes.error;

      setAvailableScenarios(propScenarios || scenariosRes.data || []);
      setSavedComparisons(comparisonsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleScenario(scenarioId: string) {
    if (selectedScenarioIds.includes(scenarioId)) {
      setSelectedScenarioIds(selectedScenarioIds.filter(id => id !== scenarioId));
    } else if (selectedScenarioIds.length < 5) {
      setSelectedScenarioIds([...selectedScenarioIds, scenarioId]);
    }
  }

  function getSelectedScenarios(): Scenario[] {
    return selectedScenarioIds
      .map(id => availableScenarios.find(s => s.id === id))
      .filter(Boolean) as Scenario[];
  }

  function getBestValue(metricKey: string, lowerIsBetter: boolean = false): any {
    const scenarios = getSelectedScenarios();
    if (scenarios.length === 0) return null;

    const values = scenarios.map(s => {
      const config = s.configuration || {};
      const results = s.results || {};
      return results[metricKey] ?? config[metricKey] ?? null;
    }).filter(v => v !== null);

    if (values.length === 0) return null;

    return lowerIsBetter ? Math.min(...values) : Math.max(...values);
  }

  function isBestValue(value: any, metricKey: string, lowerIsBetter: boolean = false): boolean {
    const best = getBestValue(metricKey, lowerIsBetter);
    return value !== null && value === best;
  }

  function calculateDifferences(): any[] {
    const scenarios = getSelectedScenarios();
    if (scenarios.length < 2) return [];

    const insights: any[] = [];
    const baseScenario = scenarios[0];

    for (let i = 1; i < scenarios.length; i++) {
      const compareScenario = scenarios[i];

      const baseMonthlyCost = baseScenario.results?.monthly_cost || 0;
      const compareMonthlyCost = compareScenario.results?.monthly_cost || 0;
      const costDiff = compareMonthlyCost - baseMonthlyCost;
      const costDiffPercent = baseMonthlyCost > 0 ? (costDiff / baseMonthlyCost) * 100 : 0;

      insights.push({
        comparison: `${baseScenario.scenario_name} vs ${compareScenario.scenario_name}`,
        costDiff,
        costDiffPercent,
        recommendation: Math.abs(costDiff) < 100 ? 'Similar cost' : (costDiff < 0 ? `${baseScenario.scenario_name} is cheaper` : `${compareScenario.scenario_name} is cheaper`)
      });
    }

    return insights;
  }

  async function saveComparison() {
    if (!comparisonName) {
      alert('Please enter a comparison name');
      return;
    }

    const scenarios = getSelectedScenarios();
    const insights = calculateDifferences();
    const bestScenario = scenarios.reduce((best, current) => {
      const bestCost = best.results?.monthly_cost || Infinity;
      const currentCost = current.results?.monthly_cost || Infinity;
      return currentCost < bestCost ? current : best;
    }, scenarios[0]);

    try {
      const { error } = await supabase
        .from('scenario_comparisons')
        .insert([{
          comparison_name: comparisonName,
          description: `Comparison of ${scenarios.map(s => s.scenario_name).join(', ')}`,
          scenario_ids: selectedScenarioIds,
          comparison_matrix: scenarios.map(s => ({
            id: s.id,
            name: s.scenario_name,
            metrics: s.results
          })),
          insights,
          recommended_scenario_id: bestScenario?.id,
          created_by: 'admin'
        }]);

      if (error) throw error;

      await loadData();
      setShowSaveDialog(false);
      setComparisonName('');
    } catch (error) {
      console.error('Error saving comparison:', error);
      alert('Failed to save comparison');
    }
  }

  async function deleteComparison(id: string) {
    if (!confirm('Delete this comparison?')) return;

    try {
      const { error } = await supabase
        .from('scenario_comparisons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting comparison:', error);
    }
  }

  function loadSavedComparison(comparison: any) {
    setSelectedScenarioIds(comparison.scenario_ids || []);
  }

  if (loading) {
    return <div className="text-center py-8">Loading scenarios...</div>;
  }

  const selectedScenarios = getSelectedScenarios();
  const insights = calculateDifferences();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">A/B/C Scenario Comparison</h3>
        <p className="text-sm text-gray-600 mt-1">
          Compare up to 5 scenarios side-by-side to identify the best value proposition
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Select Scenarios to Compare (up to 5)</h4>
          <span className="text-xs text-gray-600">{selectedScenarioIds.length}/5 selected</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {availableScenarios.slice(0, 9).map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => toggleScenario(scenario.id)}
              disabled={!selectedScenarioIds.includes(scenario.id) && selectedScenarioIds.length >= 5}
              className={`text-left p-3 border-2 rounded-lg transition-all ${
                selectedScenarioIds.includes(scenario.id)
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <div className="font-medium text-sm">{scenario.scenario_name}</div>
              <div className={`text-xs mt-1 ${selectedScenarioIds.includes(scenario.id) ? 'text-gray-300' : 'text-gray-600'}`}>
                {scenario.scenario_description?.substring(0, 50)}...
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedScenarios.length >= 2 && (
        <>
          <div className="bg-white border-2 border-black rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-sm border-b border-gray-300">
                      Metric
                    </th>
                    {selectedScenarios.map((scenario) => (
                      <th key={scenario.id} className="text-center px-4 py-3 font-semibold text-sm border-b border-gray-300">
                        {scenario.scenario_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, idx) => {
                    const bestValue = getBestValue(metric.key, metric.lowerIsBetter);

                    return (
                      <tr key={metric.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium border-b border-gray-200">
                          {metric.label}
                        </td>
                        {selectedScenarios.map((scenario) => {
                          const value = scenario.results?.[metric.key] ?? scenario.configuration?.[metric.key] ?? null;
                          const isBest = isBestValue(value, metric.key, metric.lowerIsBetter);

                          return (
                            <td
                              key={scenario.id}
                              className={`text-center px-4 py-3 text-sm border-b border-gray-200 ${
                                isBest ? 'bg-green-50 font-semibold' : ''
                              }`}
                            >
                              <div className="flex items-center justify-center gap-2">
                                {isBest && <CheckCircle className="h-4 w-4 text-green-600" />}
                                <span className={isBest ? 'text-green-700' : ''}>
                                  {value !== null ? metric.format(value) : '-'}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {insights.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Insights & Recommendations
              </h4>

              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {insight.costDiff < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="text-sm">
                      <span className="font-medium">{insight.comparison}:</span>{' '}
                      <span className={insight.costDiff < 0 ? 'text-green-700' : 'text-red-700'}>
                        {insight.costDiff < 0 ? '' : '+'}${Math.abs(insight.costDiff).toFixed(2)}
                      </span>{' '}
                      ({insight.costDiff < 0 ? '' : '+'}{insight.costDiffPercent.toFixed(1)}%)
                      <span className="text-gray-600 ml-2">• {insight.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    Best Value:{' '}
                    {selectedScenarios.reduce((best, current) => {
                      const bestCost = best.results?.monthly_cost || Infinity;
                      const currentCost = current.results?.monthly_cost || Infinity;
                      return currentCost < bestCost ? current : best;
                    }, selectedScenarios[0]).scenario_name}
                  </span>
                  <span className="text-gray-600">
                    (Lowest monthly cost for cost-conscious customers)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Save className="h-4 w-4" />
              Save Comparison
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Export as PDF
            </button>
          </div>
        </>
      )}

      {selectedScenarios.length < 2 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Select at least 2 scenarios to compare</p>
        </div>
      )}

      {savedComparisons.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Saved Comparisons ({savedComparisons.length})</h4>
          <div className="space-y-2">
            {savedComparisons.map((comparison) => (
              <div
                key={comparison.id}
                className="bg-white border border-gray-300 rounded-lg p-4 flex items-center justify-between hover:border-gray-400"
              >
                <div className="flex-1">
                  <div className="font-medium">{comparison.comparison_name}</div>
                  <div className="text-sm text-gray-600 mt-1">{comparison.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Created {new Date(comparison.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadSavedComparison(comparison)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteComparison(comparison.id)}
                    className="p-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h4 className="font-semibold mb-4">Save Comparison</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comparison Name</label>
              <input
                type="text"
                value={comparisonName}
                onChange={(e) => setComparisonName(e.target.value)}
                placeholder="e.g., Low vs Medium vs High Usage"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveComparison}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}