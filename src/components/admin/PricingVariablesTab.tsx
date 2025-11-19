import { useState, useEffect } from 'react';
import { Save, RotateCcw, Edit2, AlertCircle, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingVariable {
  id: string;
  variable_key: string;
  variable_name: string;
  variable_value: number;
  variable_type: string;
  category: string;
  description: string | null;
  unit: string | null;
  min_value: number | null;
  max_value: number | null;
  is_overridden: boolean;
  original_value: number | null;
}

export default function PricingVariablesTab() {
  const [variables, setVariables] = useState<PricingVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newVariable, setNewVariable] = useState({
    variable_name: '',
    variable_value: 0,
    variable_type: 'price',
    category: 'business',
    description: '',
    unit: '',
    min_value: 0,
    max_value: 100,
  });

  useEffect(() => {
    loadVariables();
  }, []);

  async function loadVariables() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pricing_variables')
      .select('*')
      .order('category', { ascending: true })
      .order('variable_name', { ascending: true });

    if (error) {
      console.error('Error loading variables:', error);
    } else {
      setVariables(data || []);
    }
    setLoading(false);
  }

  function handleValueChange(id: string, newValue: number) {
    setEditedValues({ ...editedValues, [id]: newValue });
    setHasChanges(true);
  }

  async function saveChanges() {
    const updates = Object.entries(editedValues).map(async ([id, value]) => {
      const variable = variables.find(v => v.id === id);
      if (!variable) return;

      const isOverridden = value !== (variable.original_value || variable.variable_value);

      return supabase
        .from('pricing_variables')
        .update({
          variable_value: value,
          is_overridden: isOverridden,
          original_value: variable.original_value || variable.variable_value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    });

    await Promise.all(updates);
    setEditedValues({});
    setHasChanges(false);
    await loadVariables();
  }

  async function resetVariable(id: string) {
    const variable = variables.find(v => v.id === id);
    if (!variable || !variable.original_value) return;

    const { error } = await supabase
      .from('pricing_variables')
      .update({
        variable_value: variable.original_value,
        is_overridden: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error resetting variable:', error);
    } else {
      setEditedValues({ ...editedValues, [id]: variable.original_value });
      await loadVariables();
    }
  }

  async function resetAllOverrides() {
    if (!confirm('Reset all overridden variables to their original values?')) return;

    const overriddenVars = variables.filter(v => v.is_overridden);
    const updates = overriddenVars.map(v =>
      supabase
        .from('pricing_variables')
        .update({
          variable_value: v.original_value || v.variable_value,
          is_overridden: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', v.id)
    );

    await Promise.all(updates);
    setEditedValues({});
    setHasChanges(false);
    await loadVariables();
  }

  function getCurrentValue(variable: PricingVariable): number {
    return editedValues[variable.id] ?? variable.variable_value;
  }

  async function createVariable() {
    const variableKey = newVariable.variable_name.toLowerCase().replace(/\s+/g, '_');

    const { error } = await supabase
      .from('pricing_variables')
      .insert({
        variable_key: variableKey,
        variable_name: newVariable.variable_name,
        variable_value: newVariable.variable_value,
        variable_type: newVariable.variable_type,
        category: newVariable.category,
        description: newVariable.description || null,
        unit: newVariable.unit || null,
        min_value: newVariable.min_value,
        max_value: newVariable.max_value,
        is_overridden: false,
        original_value: null,
      });

    if (error) {
      console.error('Error creating variable:', error);
      alert('Error creating variable: ' + error.message);
    } else {
      setIsCreating(false);
      setNewVariable({
        variable_name: '',
        variable_value: 0,
        variable_type: 'price',
        category: 'business',
        description: '',
        unit: '',
        min_value: 0,
        max_value: 100,
      });
      await loadVariables();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading pricing variables...</div>
      </div>
    );
  }

  const categories = Array.from(new Set(variables.map(v => v.category)));
  const overriddenCount = variables.filter(v => v.is_overridden).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Pricing Variables</h3>
          <p className="text-sm text-gray-600 mt-1">
            Excel-like editor for all pricing constants and multipliers
          </p>
          {overriddenCount > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span>{overriddenCount} variable{overriddenCount > 1 ? 's' : ''} overridden</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Variable
          </button>
          {overriddenCount > 0 && (
            <button
              onClick={resetAllOverrides}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </button>
          )}
          {hasChanges && (
            <button
              onClick={saveChanges}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="bg-white border-2 border-black rounded-lg p-6 space-y-4">
          <h4 className="text-lg font-semibold text-black">Create New Pricing Variable</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variable Name *
              </label>
              <input
                type="text"
                value={newVariable.variable_name}
                onChange={(e) => setNewVariable({ ...newVariable, variable_name: e.target.value })}
                placeholder="e.g., Premium Tier Multiplier"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={newVariable.category}
                onChange={(e) => setNewVariable({ ...newVariable, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="business">Business</option>
                <option value="model_costs">Model Costs</option>
                <option value="features">Features</option>
                <option value="setup">Setup</option>
                <option value="volume_tiers">Volume Tiers</option>
                <option value="optimization">Optimization</option>
                <option value="usage_patterns">Usage Patterns</option>
                <option value="assumptions">Assumptions</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value *
              </label>
              <input
                type="number"
                step="0.001"
                value={newVariable.variable_value}
                onChange={(e) => setNewVariable({ ...newVariable, variable_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={newVariable.variable_type}
                onChange={(e) => setNewVariable({ ...newVariable, variable_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="price">Price</option>
                <option value="percentage">Percentage</option>
                <option value="multiplier">Multiplier</option>
                <option value="credits">Credits</option>
                <option value="tokens">Tokens</option>
                <option value="count">Count</option>
                <option value="months">Months</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={newVariable.unit}
                onChange={(e) => setNewVariable({ ...newVariable, unit: e.target.value })}
                placeholder="e.g., USD, %, x"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Value
              </label>
              <input
                type="number"
                step="0.001"
                value={newVariable.min_value}
                onChange={(e) => setNewVariable({ ...newVariable, min_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Value
              </label>
              <input
                type="number"
                step="0.001"
                value={newVariable.max_value}
                onChange={(e) => setNewVariable({ ...newVariable, max_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newVariable.description}
              onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
              placeholder="Explain what this variable controls and how it affects pricing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={createVariable}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Save className="h-4 w-4" />
              Create Variable
            </button>
          </div>
        </div>
      )}

      {categories.map(category => {
        const categoryVars = variables.filter(v => v.category === category);
        const isFeatureCategory = category === 'features';
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {category}
              </h4>
              {isFeatureCategory && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    Managed in Feature Pricing tab - Values sync automatically
                  </span>
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Variable
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categoryVars.map(variable => {
                    const currentValue = getCurrentValue(variable);
                    const isModified = editedValues[variable.id] !== undefined;
                    return (
                      <tr
                        key={variable.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          variable.is_overridden ? 'bg-orange-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-black">{variable.variable_name}</div>
                            {variable.description && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {variable.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.001"
                            value={currentValue}
                            onChange={(e) => handleValueChange(variable.id, parseFloat(e.target.value) || 0)}
                            disabled={variable.category === 'features'}
                            className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                              isModified ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                            } ${variable.category === 'features' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                            title={variable.category === 'features' ? 'This value is managed in the Feature Pricing tab' : ''}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 font-mono">
                            {variable.unit || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                            {variable.variable_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {variable.is_overridden ? (
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800 inline-block w-fit">
                                Overridden
                              </span>
                              {variable.original_value && (
                                <span className="text-xs text-gray-500">
                                  Original: {variable.original_value}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                              Default
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {variable.is_overridden && variable.category !== 'features' && (
                            <button
                              onClick={() => resetVariable(variable.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reset
                            </button>
                          )}
                          {variable.category === 'features' && (
                            <span className="text-xs text-gray-400 italic">Read-only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
