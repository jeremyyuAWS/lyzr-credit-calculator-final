import { useState, useEffect } from 'react';
import { supabase, SetupCost } from '../../lib/supabase';
import { Save, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function SetupCostsGlobalTab() {
  const [setupCosts, setSetupCosts] = useState<SetupCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSetupCosts();
  }, []);

  async function fetchSetupCosts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('setup_costs')
        .select('*')
        .order('item_name', { ascending: true });

      if (error) throw error;
      setSetupCosts(data || []);
    } catch (err) {
      console.error('Error fetching setup costs:', err);
      setError('Failed to load setup costs');
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(id: string, field: keyof SetupCost, value: string | number | boolean) {
    setSetupCosts(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
    setUpdatedIds(prev => new Set(prev).add(id));
  }

  function addNewSetupCost() {
    const newCost: SetupCost = {
      id: `temp-${Date.now()}`,
      item_name: 'New Setup Item',
      cost_credits: 0,
      unit: 'per item',
      description: '',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSetupCosts(prev => [...prev, newCost]);
    setUpdatedIds(prev => new Set(prev).add(newCost.id));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const itemsToSave = setupCosts.filter(item => updatedIds.has(item.id));

      for (const item of itemsToSave) {
        const isNew = item.id.startsWith('temp-');
        const { id, created_at, updated_at, ...itemData } = item;

        if (isNew) {
          const { error } = await supabase
            .from('setup_costs')
            .insert([itemData]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('setup_costs')
            .update({ ...itemData, updated_at: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
        }
      }

      setSaveSuccess(true);
      setUpdatedIds(new Set());
      await fetchSetupCosts();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving setup costs:', err);
      setError(err.message || 'Failed to save setup costs');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this setup cost item?')) return;

    try {
      const { error } = await supabase
        .from('setup_costs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSetupCosts(prev => prev.filter(item => item.id !== id));
      setUpdatedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err: any) {
      console.error('Error deleting setup cost:', err);
      setError(err.message || 'Failed to delete setup cost');
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
          <h3 className="text-xl font-bold text-black">One-Time Setup Costs</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage one-time setup costs for agents, knowledge bases, tools, and evaluation suites
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addNewSetupCost}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-black rounded-lg hover:border-gray-400 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Setup Item
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
            Setup costs saved successfully!
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
                  Item Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Cost (Credits)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Unit
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
              {setupCosts.map((cost) => (
                <tr
                  key={cost.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    updatedIds.has(cost.id) ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={cost.item_name}
                      onChange={(e) => handleFieldChange(cost.id, 'item_name', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={cost.cost_credits}
                      onChange={(e) => handleFieldChange(cost.id, 'cost_credits', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={cost.unit}
                      onChange={(e) => handleFieldChange(cost.id, 'unit', e.target.value)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={cost.description}
                      onChange={(e) => handleFieldChange(cost.id, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Description..."
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={cost.enabled}
                      onChange={(e) => handleFieldChange(cost.id, 'enabled', e.target.checked)}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(cost.id)}
                      disabled={cost.id.startsWith('temp-')}
                      className="p-1 text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Delete setup cost"
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

      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Note:</strong> Setup costs are one-time charges applied during initial deployment.</p>
        <p><strong>Examples:</strong></p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li><strong>Agent Setup:</strong> 0.05 credits per agent</li>
          <li><strong>Knowledge Base:</strong> 1.0 credits per KB</li>
          <li><strong>Tool Integration:</strong> 0.1 credits per tool</li>
          <li><strong>Evaluation Suite:</strong> 2.0 credits per suite</li>
        </ul>
      </div>
    </div>
  );
}
