import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Download, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';


interface LLMPricing {
  id: string;
  provider: string;
  model: string;
  input_cost_per_million: number;
  output_cost_per_million: number;
  comment: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface VersionLog {
  version: string;
  updated_by: string;
  created_at: string;
}

type SortField = 'provider' | 'model' | 'input_cost_per_million' | 'output_cost_per_million' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export default function PricingCatalogTab() {
  const [pricing, setPricing] = useState<LLMPricing[]>([]);
  const [originalPricing, setOriginalPricing] = useState<LLMPricing[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastVersion, setLastVersion] = useState<VersionLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [enabledFilter, setEnabledFilter] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [changedItems, setChangedItems] = useState<string[]>([]);
  const [recentlyUpdatedItems, setRecentlyUpdatedItems] = useState<string[]>([]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [pricingResult, versionResult] = await Promise.all([
        supabase.from('llm_pricing').select('*').order('provider').order('model'),
        supabase
          .from('pricing_version_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (pricingResult.data) {
        setPricing(pricingResult.data);
        setOriginalPricing(JSON.parse(JSON.stringify(pricingResult.data)));
      }
      if (versionResult.data) setLastVersion(versionResult.data);
      setHasChanges(false);
      setChangedItems([]);
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  }

  function updatePricing(id: string, field: keyof LLMPricing, value: any) {
    setPricing((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setHasChanges(true);
  }

  async function addNewRow() {
    const newRow: LLMPricing = {
      id: crypto.randomUUID(),
      provider: '',
      model: '',
      input_cost_per_million: 0,
      output_cost_per_million: 0,
      comment: '',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPricing((prev) => [...prev, newRow]);
    setEditingId(newRow.id);
    setHasChanges(true);
  }

  function deleteRow(id: string) {
    if (!confirm('Delete this model pricing?')) return;
    setPricing((prev) => prev.filter((item) => item.id !== id));
    setHasChanges(true);
  }

  function initiateConfirmSave() {
    const changes: string[] = [];

    pricing.forEach((item) => {
      const original = originalPricing.find((o) => o.id === item.id);
      if (!original) {
        changes.push(item.id);
      } else if (
        original.provider !== item.provider ||
        original.model !== item.model ||
        original.input_cost_per_million !== item.input_cost_per_million ||
        original.output_cost_per_million !== item.output_cost_per_million ||
        original.comment !== item.comment ||
        original.enabled !== item.enabled
      ) {
        changes.push(item.id);
      }
    });

    originalPricing.forEach((original) => {
      if (!pricing.find((p) => p.id === original.id)) {
        changes.push(original.id);
      }
    });

    setChangedItems(changes);
    setShowConfirmModal(true);
  }

  async function confirmSaveChanges() {
    try {
      const version = `${new Date().toISOString().split('T')[0].replace(/-/g, '.')}-${String(
        (lastVersion ? parseInt(lastVersion.version.split('-')[1]) : 0) + 1
      ).padStart(2, '0')}`;

      const now = new Date().toISOString();

      for (const item of pricing) {
        if (!item.provider || !item.model) continue;

        const existing = await supabase
          .from('llm_pricing')
          .select('id')
          .eq('provider', item.provider)
          .eq('model', item.model)
          .maybeSingle();

        if (existing.data && existing.data.id !== item.id) {
          alert(`Duplicate model: ${item.provider} - ${item.model}`);
          setShowConfirmModal(false);
          return;
        }

        const wasChanged = changedItems.includes(item.id);

        const dataToUpsert: any = {
          provider: item.provider,
          model: item.model,
          input_cost_per_million: item.input_cost_per_million,
          output_cost_per_million: item.output_cost_per_million,
          comment: item.comment,
          enabled: item.enabled,
          updated_at: wasChanged ? now : item.updated_at,
        };

        if (item.id && !item.id.startsWith('temp-')) {
          dataToUpsert.id = item.id;
        }

        const { error } = await supabase.from('llm_pricing').upsert(dataToUpsert);

        if (error) {
          console.error('Upsert error for item:', item, 'Error:', error);
          throw error;
        }
      }

      const deletedIds = originalPricing
        .filter((original) => !pricing.find((p) => p.id === original.id))
        .map((item) => item.id);

      if (deletedIds.length > 0) {
        await supabase.from('llm_pricing').delete().in('id', deletedIds);
      }

      await supabase.from('pricing_version_log').insert({
        version,
        updated_by: 'admin',
        change_summary: `Updated ${changedItems.length} model(s) in LLM pricing catalog`,
      });

      const updatedItemsCopy = [...changedItems];
      setShowConfirmModal(false);
      await loadData();

      setRecentlyUpdatedItems(updatedItemsCopy);
      setShowSuccessBanner(true);

      setTimeout(() => {
        setRecentlyUpdatedItems([]);
        setShowSuccessBanner(false);
      }, 5000);
    } catch (error: any) {
      console.error('Error saving pricing:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Error saving pricing: ${errorMessage}\n\nPlease check the console for more details.`);
      setShowConfirmModal(false);
    }
  }

  function exportCSV() {
    const headers = ['Provider', 'Model', 'Input Cost/1M', 'Output Cost/1M', 'Comments', 'Enabled', 'Last Updated'];
    const rows = pricing.map((p) => [
      p.provider,
      p.model,
      p.input_cost_per_million,
      p.output_cost_per_million,
      p.comment,
      p.enabled,
      new Date(p.updated_at).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-pricing-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const uniqueProviders = Array.from(new Set(pricing.map((p) => p.provider))).sort();

  let filteredPricing = pricing.filter((p) => {
    const matchesSearch =
      p.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = providerFilter === 'all' || p.provider === providerFilter;
    const matchesEnabled =
      enabledFilter === 'all' ||
      (enabledFilter === 'enabled' && p.enabled) ||
      (enabledFilter === 'disabled' && !p.enabled);
    return matchesSearch && matchesProvider && matchesEnabled;
  });

  filteredPricing = filteredPricing.sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'updated_at' || sortField === 'provider' || sortField === 'model') {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    } else {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-600">Loading pricing catalog...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {showSuccessBanner && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">✓</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">Changes Saved Successfully</h4>
            <p className="text-sm text-green-700">
              {recentlyUpdatedItems.length} model(s) updated with new timestamps
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-black mb-2">LLM Model Pricing</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage token pricing for all LLM providers and models. Prices are in credits per 1 million
          tokens.
        </p>

        {lastVersion && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-black">Last Updated:</span>{' '}
                {new Date(lastVersion.created_at).toLocaleString()} by {lastVersion.updated_by}
              </div>
              <div className="text-xs text-gray-500">Version: {lastVersion.version}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-4">
          <input
            type="text"
            placeholder="Search provider or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
          >
            <option value="all">All Providers</option>
            {uniqueProviders.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
          <button
            onClick={initiateConfirmSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              hasChanges
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredPricing.length} of {pricing.length} models
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 text-white sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm w-12">Active</th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm w-40 cursor-pointer hover:bg-gray-800"
                  onClick={() => handleSort('provider')}
                >
                  <div className="flex items-center gap-1">
                    Provider
                    {sortField === 'provider' &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm w-64 cursor-pointer hover:bg-gray-800"
                  onClick={() => handleSort('model')}
                >
                  <div className="flex items-center gap-1">
                    Model
                    {sortField === 'model' &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </th>
                <th
                  className="text-center py-3 px-4 font-semibold text-sm w-32 cursor-pointer hover:bg-gray-800"
                  onClick={() => handleSort('input_cost_per_million')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Input
                    {sortField === 'input_cost_per_million' &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                  <div className="text-xs font-normal text-gray-300">Credits / 1M</div>
                </th>
                <th
                  className="text-center py-3 px-4 font-semibold text-sm w-32 cursor-pointer hover:bg-gray-800"
                  onClick={() => handleSort('output_cost_per_million')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Output
                    {sortField === 'output_cost_per_million' &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                  <div className="text-xs font-normal text-gray-300">Credits / 1M</div>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Comments</th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm w-32 cursor-pointer hover:bg-gray-800"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center gap-1">
                    Last Updated
                    {sortField === 'updated_at' &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-sm w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPricing.map((item, index) => {
                const isRecentlyUpdated = recentlyUpdatedItems.includes(item.id);
                return (
                <tr
                  key={item.id}
                  className={`border-t border-gray-100 transition-colors ${
                    isRecentlyUpdated
                      ? 'bg-green-50 hover:bg-green-100'
                      : index % 2 === 0
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } ${!item.enabled ? 'opacity-40' : ''}`}
                >
                  <td className="py-2 px-4">
                    <button
                      onClick={() => updatePricing(item.id, 'enabled', !item.enabled)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
                      style={{ backgroundColor: item.enabled ? '#000' : '#d1d5db' }}
                    >
                      <span
                        className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"
                        style={{
                          transform: item.enabled ? 'translateX(1.25rem)' : 'translateX(0.25rem)',
                        }}
                      />
                    </button>
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      value={item.provider}
                      onChange={(e) => updatePricing(item.id, 'provider', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Provider"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      value={item.model}
                      onChange={(e) => updatePricing(item.id, 'model', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Model"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.input_cost_per_million}
                      onChange={(e) =>
                        updatePricing(
                          item.id,
                          'input_cost_per_million',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-black bg-gray-100"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.output_cost_per_million}
                      onChange={(e) =>
                        updatePricing(
                          item.id,
                          'output_cost_per_million',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-black bg-gray-100"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      value={item.comment}
                      onChange={(e) => updatePricing(item.id, 'comment', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Comment"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <div
                      className={`text-xs flex items-center gap-1 ${
                        isRecentlyUpdated ? 'text-green-700 font-semibold' : 'text-gray-600'
                      }`}
                      title={new Date(item.updated_at).toLocaleString()}
                    >
                      {isRecentlyUpdated && (
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      )}
                      {formatRelativeTime(item.updated_at)}
                      {isRecentlyUpdated && <span className="text-green-600">✓</span>}
                    </div>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => deleteRow(item.id)}
                      className="p-1 text-black hover:bg-gray-200 rounded"
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4 stroke-black" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-black mb-2 text-sm">Excel-like Features</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click any cell to edit inline</li>
          <li>• Click column headers to sort (Provider, Model, Input, Output, Last Updated)</li>
          <li>• Use provider and status dropdowns to filter results</li>
          <li>• Search filters the table in real-time</li>
          <li>• Toggle "Active" to hide models from calculator</li>
          <li>• Hover over "Last Updated" to see exact timestamp</li>
          <li>• Export to CSV for bulk editing in Excel</li>
          <li>• All changes must be saved before they take effect</li>
          <li>• "Last Updated" timestamps are only updated when you confirm and save changes</li>
        </ul>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-black mb-4">Confirm Pricing Changes</h3>
              <p className="text-gray-600 mb-4">
                You are about to update <span className="font-semibold text-black">{changedItems.length}</span>{' '}
                model(s) in the pricing catalog.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>What will happen:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Changed models will have their "Last Updated" timestamp updated</li>
                  <li>• Unchanged models will keep their existing timestamps</li>
                  <li>• A new version log entry will be created</li>
                  <li>• All changes will be immediately visible in the calculator</li>
                </ul>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveChanges}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
