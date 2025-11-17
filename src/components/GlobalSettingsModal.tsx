import { X, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, CreditSettingGlobal, CreditSettingOverride } from '../lib/supabase';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

export default function GlobalSettingsModal({ isOpen, onClose, accountId }: GlobalSettingsModalProps) {
  const [globalSettings, setGlobalSettings] = useState<CreditSettingGlobal[]>([]);
  const [overrides, setOverrides] = useState<CreditSettingOverride[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'global' | 'override' | 'disabled'>('override');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, accountId]);

  async function loadSettings() {
    setLoading(true);
    try {
      const [globalResult, overridesResult] = await Promise.all([
        supabase.from('credit_settings_global').select('*').order('category'),
        supabase.from('credit_settings_overrides').select('*').eq('account_id', accountId),
      ]);

      if (globalResult.data) setGlobalSettings(globalResult.data);
      if (overridesResult.data) setOverrides(overridesResult.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function getEffectivePrice(category: string): number {
    const override = overrides.find((o) => o.category === category);
    if (override) return override.price_credits;

    const global = globalSettings.find((g) => g.category === category);
    return global?.price_credits || 0;
  }

  function getEffectiveEnabled(category: string): boolean {
    const override = overrides.find((o) => o.category === category);
    if (override) return override.enabled;

    const global = globalSettings.find((g) => g.category === category);
    return global?.enabled ?? true;
  }

  function hasOverride(category: string): boolean {
    return overrides.some((o) => o.category === category);
  }

  function getStatus(category: string): 'global' | 'override' | 'disabled' {
    const override = overrides.find((o) => o.category === category);
    if (override && !override.enabled) return 'disabled';
    if (override) return 'override';

    const global = globalSettings.find((g) => g.category === category);
    if (global && !global.enabled) return 'disabled';
    return 'global';
  }

  function startEditing(category: string) {
    setEditingCategory(category);
    setEditValue(getEffectivePrice(category).toString());
    setEditStatus(getStatus(category));
  }

  async function saveEdit() {
    if (!editingCategory) return;

    try {
      const existingOverride = overrides.find((o) => o.category === editingCategory);
      const globalSetting = globalSettings.find((g) => g.category === editingCategory);

      // Handle different status actions
      if (editStatus === 'global') {
        // Remove override to use global default
        if (existingOverride) {
          await supabase
            .from('credit_settings_overrides')
            .delete()
            .eq('id', existingOverride.id);
        }
      } else if (editStatus === 'disabled') {
        // Set enabled to false
        const newPrice = parseFloat(editValue);
        if (isNaN(newPrice) || newPrice < 0) return;

        if (existingOverride) {
          await supabase
            .from('credit_settings_overrides')
            .update({ enabled: false, price_credits: newPrice, updated_at: new Date().toISOString() })
            .eq('id', existingOverride.id);
        } else {
          await supabase.from('credit_settings_overrides').insert({
            account_id: accountId,
            category: editingCategory,
            price_credits: newPrice,
            enabled: false,
          });
        }
      } else {
        // Override with custom price
        const newPrice = parseFloat(editValue);
        if (isNaN(newPrice) || newPrice < 0) return;

        if (existingOverride) {
          await supabase
            .from('credit_settings_overrides')
            .update({ enabled: true, price_credits: newPrice, updated_at: new Date().toISOString() })
            .eq('id', existingOverride.id);
        } else {
          await supabase.from('credit_settings_overrides').insert({
            account_id: accountId,
            category: editingCategory,
            price_credits: newPrice,
            enabled: true,
          });
        }
      }

      await loadSettings();
      setEditingCategory(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving override:', error);
    }
  }

  async function toggleEnabled(category: string) {
    try {
      const existingOverride = overrides.find((o) => o.category === category);
      const currentEnabled = getEffectiveEnabled(category);
      const newEnabled = !currentEnabled;

      if (existingOverride) {
        const { error } = await supabase
          .from('credit_settings_overrides')
          .update({ enabled: newEnabled, updated_at: new Date().toISOString() })
          .eq('id', existingOverride.id);

        if (error) {
          console.error('Error updating override:', error);
          return;
        }
      } else {
        const globalSetting = globalSettings.find((g) => g.category === category);
        const { error } = await supabase.from('credit_settings_overrides').insert({
          account_id: accountId,
          category: category,
          price_credits: globalSetting?.price_credits ?? 0,
          enabled: newEnabled,
        });

        if (error) {
          console.error('Error creating override:', error);
          return;
        }
      }

      await loadSettings();
    } catch (error) {
      console.error('Error toggling enabled status:', error);
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

  async function resetAllOverrides() {
    if (!confirm('Reset all account overrides to global defaults?')) return;

    try {
      await supabase.from('credit_settings_overrides').delete().eq('account_id', accountId);
      await loadSettings();
    } catch (error) {
      console.error('Error resetting overrides:', error);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">Global Credit Settings</h2>
          <button
            onClick={onClose}
            className="p-0 hover:opacity-70 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5 stroke-black" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading settings...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-black">Enabled</th>
                    <th className="text-left py-3 px-4 font-semibold text-black">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-black">Price (Credits)</th>
                    <th className="text-left py-3 px-4 font-semibold text-black">Unit</th>
                    <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {globalSettings.map((setting) => {
                    const isEnabled = getEffectiveEnabled(setting.category);
                    return (
                      <tr
                        key={setting.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-opacity ${!isEnabled ? 'opacity-40' : ''}`}
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
                          <span className={isEnabled ? 'text-black' : 'text-gray-400 line-through'}>
                            {setting.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {editingCategory === setting.category ? (
                            editStatus === 'global' ? (
                              <span className="text-gray-500 text-sm italic">
                                {globalSettings.find((g) => g.category === setting.category)?.price_credits || 0}
                                <span className="text-xs ml-1">(global)</span>
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') {
                                    setEditingCategory(null);
                                    setEditValue('');
                                  }
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                autoFocus
                                disabled={editStatus === 'disabled'}
                              />
                            )
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
                          {editingCategory === setting.category ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as 'global' | 'override' | 'disabled')}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                              <option value="global">Use Global Default</option>
                              <option value="override">Account Override</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          ) : (
                            <>
                              {!isEnabled ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  Disabled
                                </span>
                              ) : hasOverride(setting.category) ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900 text-white">
                                  Override
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  Global
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {editingCategory === setting.category ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={saveEdit}
                                className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditValue('');
                                }}
                                className="px-3 py-1 text-sm bg-white border border-gray-300 text-black rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => startEditing(setting.category)}
                                className="px-3 py-1 text-sm bg-white border border-gray-300 text-black rounded hover:bg-gray-50"
                                disabled={!isEnabled}
                              >
                                Edit
                              </button>
                              {hasOverride(setting.category) && (
                                <button
                                  onClick={() => removeOverride(setting.category)}
                                  className="px-3 py-1 text-sm bg-white border border-gray-300 text-black rounded hover:bg-gray-50"
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
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={resetAllOverrides}
            className="px-4 py-2 text-sm bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4 stroke-black" />
            Reset All Overrides
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
