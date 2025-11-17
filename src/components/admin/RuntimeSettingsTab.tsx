import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { supabase, CreditSettingGlobal, CreditSettingOverride } from '../../lib/supabase';

interface RuntimeSettingsTabProps {
  accountId: string;
}

export default function RuntimeSettingsTab({ accountId }: RuntimeSettingsTabProps) {
  const [settings, setSettings] = useState<CreditSettingGlobal[]>([]);
  const [overrides, setOverrides] = useState<CreditSettingOverride[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [accountId]);

  async function loadSettings() {
    setLoading(true);
    try {
      const [globalResult, overridesResult] = await Promise.all([
        supabase
          .from('credit_settings_global')
          .select('*')
          .eq('setting_type', 'runtime')
          .order('category'),
        supabase
          .from('credit_settings_overrides')
          .select('*')
          .eq('account_id', accountId),
      ]);

      if (globalResult.data) setSettings(globalResult.data);
      if (overridesResult.data) setOverrides(overridesResult.data);
    } catch (error) {
      console.error('Error loading runtime settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function getEffectivePrice(category: string): number {
    const override = overrides.find((o) => o.category === category);
    if (override) return override.price_credits;

    const global = settings.find((s) => s.category === category);
    return global?.price_credits || 0;
  }

  function getEffectiveEnabled(category: string): boolean {
    const override = overrides.find((o) => o.category === category);
    if (override) return override.enabled;

    const global = settings.find((s) => s.category === category);
    return global?.enabled ?? true;
  }

  function hasOverride(category: string): boolean {
    return overrides.some((o) => o.category === category);
  }

  async function toggleEnabled(category: string) {
    try {
      const existingOverride = overrides.find((o) => o.category === category);
      const currentEnabled = getEffectiveEnabled(category);
      const newEnabled = !currentEnabled;

      if (existingOverride) {
        await supabase
          .from('credit_settings_overrides')
          .update({ enabled: newEnabled, updated_at: new Date().toISOString() })
          .eq('id', existingOverride.id);
      } else {
        const globalSetting = settings.find((s) => s.category === category);
        await supabase.from('credit_settings_overrides').insert({
          account_id: accountId,
          category: category,
          price_credits: globalSetting?.price_credits ?? 0,
          enabled: newEnabled,
        });
      }

      await loadSettings();
    } catch (error) {
      console.error('Error toggling enabled status:', error);
    }
  }

  function startEditing(settingId: string, category: string) {
    setEditingId(settingId);
    setEditValue(getEffectivePrice(category).toString());
  }

  async function saveEdit(category: string) {
    if (!editingId) return;

    try {
      const newPrice = parseFloat(editValue);
      if (isNaN(newPrice) || newPrice < 0) return;

      const existingOverride = overrides.find((o) => o.category === category);

      if (existingOverride) {
        await supabase
          .from('credit_settings_overrides')
          .update({ price_credits: newPrice, updated_at: new Date().toISOString() })
          .eq('id', existingOverride.id);
      } else {
        await supabase.from('credit_settings_overrides').insert({
          account_id: accountId,
          category: category,
          price_credits: newPrice,
          enabled: true,
        });
      }

      await loadSettings();
      setEditingId(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving override:', error);
    }
  }

  async function removeOverride(category: string) {
    try {
      await supabase
        .from('credit_settings_overrides')
        .delete()
        .eq('account_id', accountId)
        .eq('category', category);

      await loadSettings();
    } catch (error) {
      console.error('Error removing override:', error);
    }
  }

  function groupSettings() {
    const groups: Record<string, CreditSettingGlobal[]> = {
      'Model Handling': [],
      'Runtime Features': [],
      'Storage Runtime': [],
    };

    settings.forEach((setting) => {
      if (setting.category.includes('Model') || setting.category.includes('Token') || setting.category.includes('Inter-Agent')) {
        groups['Model Handling'].push(setting);
      } else if (setting.category.includes('Storage') || setting.category.includes('Ingestion')) {
        groups['Storage Runtime'].push(setting);
      } else {
        groups['Runtime Features'].push(setting);
      }
    });

    return groups;
  }

  if (loading) {
    return (
      <div className="p-6 ">
        <div className="text-center py-8 text-gray-600">Loading runtime settings...</div>
      </div>
    );
  }

  const groupedSettings = groupSettings();

  return (
    <div className="p-6 ">
      <p className="text-sm text-gray-600 mb-6">
        Runtime settings control usage-based charges. These costs are incurred during agent operations and scale with usage volume.
      </p>

      {Object.entries(groupedSettings).map(([groupName, groupSettings]) => (
        <div key={groupName} className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">{groupName}</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm w-16">Active</th>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm w-32">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm w-32">Unit</th>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm w-24">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-black text-sm w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupSettings.map((setting) => {
                  const isEnabled = getEffectiveEnabled(setting.category);
                  return (
                    <tr
                      key={setting.id}
                      className={`border-t border-gray-100 hover:bg-gray-50 transition-opacity ${!isEnabled ? 'opacity-40' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleEnabled(setting.category)}
                          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                          style={{ backgroundColor: isEnabled ? '#000' : '#d1d5db' }}
                          aria-label={`Toggle ${setting.category}`}
                        >
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            style={{ transform: isEnabled ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${isEnabled ? 'text-black' : 'text-gray-400 line-through'}`}>
                          {setting.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          {setting.description}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {editingId === setting.id ? (
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(setting.category);
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditValue('');
                              }
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className={`font-medium ${isEnabled ? 'text-black' : 'text-gray-400'}`}>
                            {getEffectivePrice(setting.category)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          {setting.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {hasOverride(setting.category) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900 text-white">
                            Override
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Global
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId === setting.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => saveEdit(setting.category)}
                              className="px-3 py-1 text-xs bg-black text-white rounded hover:bg-gray-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditValue('');
                              }}
                              className="px-3 py-1 text-xs bg-white border border-gray-300 text-black rounded hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEditing(setting.id, setting.category)}
                              className="px-3 py-1 text-xs bg-white border border-gray-300 text-black rounded hover:bg-gray-50"
                              disabled={!isEnabled}
                            >
                              Edit
                            </button>
                            {hasOverride(setting.category) && (
                              <button
                                onClick={() => removeOverride(setting.category)}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 text-black rounded hover:bg-gray-50"
                                title="Reset to global default"
                              >
                                <RotateCcw className="h-3 w-3 stroke-black" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
