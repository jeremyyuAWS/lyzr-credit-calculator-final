import { useState, useEffect } from 'react';
import { supabase, FeaturePricing } from '../../lib/supabase';
import { Save, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function FeaturePricingTab() {
  const [features, setFeatures] = useState<FeaturePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  async function fetchFeatures() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feature_pricing')
        .select('*')
        .order('category', { ascending: true })
        .order('feature_name', { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Error fetching features:', err);
      setError('Failed to load feature pricing');
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(id: string, field: keyof FeaturePricing, value: string | number | boolean) {
    setFeatures(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
    setUpdatedIds(prev => new Set(prev).add(id));
  }

  function addNewFeature() {
    const newFeature: FeaturePricing = {
      id: `temp-${Date.now()}`,
      feature_name: 'New Feature',
      cost_credits: 0,
      unit: 'per operation',
      category: 'runtime',
      description: '',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFeatures(prev => [...prev, newFeature]);
    setUpdatedIds(prev => new Set(prev).add(newFeature.id));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const itemsToSave = features.filter(item => updatedIds.has(item.id));

      for (const item of itemsToSave) {
        const isNew = item.id.startsWith('temp-');
        const { id, created_at, updated_at, ...itemData } = item;

        if (isNew) {
          const { error } = await supabase
            .from('feature_pricing')
            .insert([itemData]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('feature_pricing')
            .update({ ...itemData, updated_at: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
        }
      }

      setSaveSuccess(true);
      setUpdatedIds(new Set());
      await fetchFeatures();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving features:', err);
      setError(err.message || 'Failed to save feature pricing');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
      const { error } = await supabase
        .from('feature_pricing')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFeatures(prev => prev.filter(item => item.id !== id));
      setUpdatedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err: any) {
      console.error('Error deleting feature:', err);
      setError(err.message || 'Failed to delete feature');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-black">Feature Pricing</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage runtime feature costs (RAG, tools, DB queries, etc.)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addNewFeature}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-black rounded-lg hover:border-gray-400 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Feature
          </button>
          <button
            onClick={handleSave}
            disabled={saving || updatedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : `Save Changes${updatedIds.size > 0 ? ` (${updatedIds.size})` : ''}`}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Feature pricing saved successfully!
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm font-medium text-red-800">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Feature Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Cost (Credits)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Enabled
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {features.map((feature) => (
                <tr
                  key={feature.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    updatedIds.has(feature.id) ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={feature.feature_name}
                      onChange={(e) => handleFieldChange(feature.id, 'feature_name', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.001"
                      value={feature.cost_credits}
                      onChange={(e) => handleFieldChange(feature.id, 'cost_credits', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={feature.unit}
                      onChange={(e) => handleFieldChange(feature.id, 'unit', e.target.value)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={feature.category}
                      onChange={(e) => handleFieldChange(feature.id, 'category', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="runtime">Runtime</option>
                      <option value="storage">Storage</option>
                      <option value="integration">Integration</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={feature.description}
                      onChange={(e) => handleFieldChange(feature.id, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Description..."
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={feature.enabled}
                      onChange={(e) => handleFieldChange(feature.id, 'enabled', e.target.checked)}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(feature.id)}
                      disabled={feature.id.startsWith('temp-')}
                      className="p-1 text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Delete feature"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p>💡 <strong>Note:</strong> Feature costs are applied per operation during runtime calculations.</p>
        <p className="mt-1">Categories: <strong>Runtime</strong> (execution costs), <strong>Storage</strong> (data costs), <strong>Integration</strong> (external API costs)</p>
      </div>
    </div>
  );
}
