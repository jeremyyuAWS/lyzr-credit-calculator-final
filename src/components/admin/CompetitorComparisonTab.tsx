import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Competitor {
  id: string;
  competitor_name: string;
  competitor_key: string;
  pricing_model: string | null;
  input_token_cost_per_million: number | null;
  output_token_cost_per_million: number | null;
  additional_fees: Record<string, any>;
  notes: string | null;
  source_url: string | null;
  is_active: boolean;
}

interface LyzrPricing {
  inputCost: number;
  outputCost: number;
  handlingFee: number;
}

export default function CompetitorComparisonTab() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Competitor>>({});
  const [lyzrPricing, setLyzrPricing] = useState<LyzrPricing>({
    inputCost: 5.0,
    outputCost: 10.0,
    handlingFee: 25,
  });

  useEffect(() => {
    loadCompetitors();
  }, []);

  async function loadCompetitors() {
    setLoading(true);
    const { data, error } = await supabase
      .from('competitor_pricing')
      .select('*')
      .order('competitor_name', { ascending: true });

    if (error) {
      console.error('Error loading competitors:', error);
    } else {
      setCompetitors(data || []);
    }
    setLoading(false);
  }

  function startEdit(competitor: Competitor) {
    setEditingId(competitor.id);
    setEditForm(competitor);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveCompetitor() {
    if (!editingId) return;

    const { error } = await supabase
      .from('competitor_pricing')
      .update({
        competitor_name: editForm.competitor_name,
        pricing_model: editForm.pricing_model,
        input_token_cost_per_million: editForm.input_token_cost_per_million,
        output_token_cost_per_million: editForm.output_token_cost_per_million,
        notes: editForm.notes,
        source_url: editForm.source_url,
        last_verified: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId);

    if (error) {
      console.error('Error updating competitor:', error);
    } else {
      await loadCompetitors();
      cancelEdit();
    }
  }

  async function deleteCompetitor(id: string) {
    if (!confirm('Delete this competitor?')) return;

    const { error } = await supabase
      .from('competitor_pricing')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting competitor:', error);
    } else {
      await loadCompetitors();
    }
  }

  function calculateComparison(competitor: Competitor, sampleInputTokens = 10000, sampleOutputTokens = 5000) {
    if (!competitor.input_token_cost_per_million || !competitor.output_token_cost_per_million) {
      return null;
    }

    const competitorCost =
      (sampleInputTokens * competitor.input_token_cost_per_million) / 1_000_000 +
      (sampleOutputTokens * competitor.output_token_cost_per_million) / 1_000_000;

    const lyzrBaseCost =
      (sampleInputTokens * lyzrPricing.inputCost) / 1_000_000 +
      (sampleOutputTokens * lyzrPricing.outputCost) / 1_000_000;

    const lyzrCostWithFee = lyzrBaseCost * (1 + lyzrPricing.handlingFee / 100);

    const difference = lyzrCostWithFee - competitorCost;
    const percentageDiff = (difference / competitorCost) * 100;

    return {
      competitorCost,
      lyzrCost: lyzrCostWithFee,
      difference,
      percentageDiff,
      isLyzrCheaper: difference < 0,
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading competitor data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Competitor Comparison</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track competitor pricing for market positioning and margin analysis
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-black mb-3">Lyzr Pricing (Reference)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Cost per Million
            </label>
            <input
              type="number"
              step="0.1"
              value={lyzrPricing.inputCost}
              onChange={(e) => setLyzrPricing({ ...lyzrPricing, inputCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Output Cost per Million
            </label>
            <input
              type="number"
              step="0.1"
              value={lyzrPricing.outputCost}
              onChange={(e) => setLyzrPricing({ ...lyzrPricing, outputCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handling Fee (%)
            </label>
            <input
              type="number"
              step="1"
              value={lyzrPricing.handlingFee}
              onChange={(e) => setLyzrPricing({ ...lyzrPricing, handlingFee: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {competitors.map(competitor => {
          const comparison = calculateComparison(competitor);
          return (
            <div
              key={competitor.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              {editingId === competitor.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Competitor Name
                      </label>
                      <input
                        type="text"
                        value={editForm.competitor_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, competitor_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pricing Model
                      </label>
                      <input
                        type="text"
                        value={editForm.pricing_model || ''}
                        onChange={(e) => setEditForm({ ...editForm, pricing_model: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Input Token Cost per Million
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.input_token_cost_per_million || ''}
                        onChange={(e) => setEditForm({ ...editForm, input_token_cost_per_million: parseFloat(e.target.value) || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Output Token Cost per Million
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.output_token_cost_per_million || ''}
                        onChange={(e) => setEditForm({ ...editForm, output_token_cost_per_million: parseFloat(e.target.value) || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source URL
                    </label>
                    <input
                      type="url"
                      value={editForm.source_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, source_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      onClick={saveCompetitor}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h5 className="font-semibold text-black text-lg">{competitor.competitor_name}</h5>
                        {competitor.pricing_model && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                            {competitor.pricing_model}
                          </span>
                        )}
                      </div>
                      {competitor.notes && (
                        <p className="text-sm text-gray-600 mt-1">{competitor.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(competitor)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 stroke-black" />
                      </button>
                      <button
                        onClick={() => deleteCompetitor(competitor.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 stroke-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h6 className="text-sm font-semibold text-gray-700">Pricing</h6>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Input (per 1M tokens):</span>
                          <span className="font-mono">${competitor.input_token_cost_per_million?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Output (per 1M tokens):</span>
                          <span className="font-mono">${competitor.output_token_cost_per_million?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {comparison && (
                      <div className="space-y-2">
                        <h6 className="text-sm font-semibold text-gray-700">Comparison (10K input + 5K output)</h6>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{competitor.competitor_name}:</span>
                            <span className="font-mono">${comparison.competitorCost.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lyzr:</span>
                            <span className="font-mono">${comparison.lyzrCost.toFixed(4)}</span>
                          </div>
                          <div className={`flex justify-between items-center pt-2 border-t ${
                            comparison.isLyzrCheaper ? 'text-green-700' : 'text-red-700'
                          }`}>
                            <span className="font-semibold">Difference:</span>
                            <div className="flex items-center gap-1">
                              {comparison.isLyzrCheaper ? (
                                <TrendingDown className="h-4 w-4" />
                              ) : (
                                <TrendingUp className="h-4 w-4" />
                              )}
                              <span className="font-mono font-semibold">
                                {comparison.percentageDiff > 0 ? '+' : ''}{comparison.percentageDiff.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          {comparison.isLyzrCheaper ? (
                            <div className="text-xs text-green-600 mt-1">
                              Lyzr is cheaper by ${Math.abs(comparison.difference).toFixed(4)}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600 mt-1">
                              Lyzr is more expensive by ${Math.abs(comparison.difference).toFixed(4)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {competitor.source_url && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <a
                        href={competitor.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View pricing source →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
