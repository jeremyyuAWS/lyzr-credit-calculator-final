import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DiscountsOverridesTabProps {
  accountId: string;
}

interface Account {
  id: string;
  name: string;
  global_discount_percentage: number;
  billing_mode: string;
  custom_model_handling_fee: number;
}

interface AccountDiscount {
  id: string;
  account_id: string;
  discount_percentage: number;
  discount_type: string;
  feature_category: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function DiscountsOverridesTab({ accountId }: DiscountsOverridesTabProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [discounts, setDiscounts] = useState<AccountDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    global_discount_percentage: 0,
    billing_mode: 'full-service',
    custom_model_handling_fee: 25,
  });

  useEffect(() => {
    loadData();
  }, [accountId]);

  async function loadData() {
    setLoading(true);
    try {
      const [accountResult, discountsResult] = await Promise.all([
        supabase.from('accounts').select('*').eq('id', accountId).maybeSingle(),
        supabase
          .from('account_discounts')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false }),
      ]);

      if (accountResult.data) {
        setAccount(accountResult.data);
        setAccountForm({
          global_discount_percentage: accountResult.data.global_discount_percentage || 0,
          billing_mode: accountResult.data.billing_mode || 'full-service',
          custom_model_handling_fee: accountResult.data.custom_model_handling_fee || 25,
        });
      }
      if (discountsResult.data) setDiscounts(discountsResult.data);
    } catch (error) {
      console.error('Error loading discounts data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveAccountSettings() {
    try {
      await supabase
        .from('accounts')
        .update({
          global_discount_percentage: accountForm.global_discount_percentage,
          billing_mode: accountForm.billing_mode,
          custom_model_handling_fee: accountForm.custom_model_handling_fee,
        })
        .eq('id', accountId);

      await loadData();
      setEditingAccount(false);
    } catch (error) {
      console.error('Error updating account settings:', error);
    }
  }

  async function addFeatureDiscount() {
    try {
      await supabase.from('account_discounts').insert({
        account_id: accountId,
        discount_percentage: 0,
        discount_type: 'feature',
        feature_category: 'KB Retrieve',
        enabled: true,
      });

      await loadData();
    } catch (error) {
      console.error('Error adding feature discount:', error);
    }
  }

  async function updateDiscount(discountId: string, updates: Partial<AccountDiscount>) {
    try {
      await supabase
        .from('account_discounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', discountId);

      await loadData();
    } catch (error) {
      console.error('Error updating discount:', error);
    }
  }

  async function deleteDiscount(discountId: string) {
    if (!confirm('Delete this discount?')) return;

    try {
      await supabase.from('account_discounts').delete().eq('id', discountId);
      await loadData();
    } catch (error) {
      console.error('Error deleting discount:', error);
    }
  }

  if (loading) {
    return (
      <div className="p-6 ">
        <div className="text-center py-8 text-gray-600">Loading discount settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6  space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">Account-Level Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure global discounts, billing mode, and custom markup fees for this account.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Global Discount (%)
              </label>
              {editingAccount ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={accountForm.global_discount_percentage}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      global_discount_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded text-black font-medium">
                  {account?.global_discount_percentage || 0}%
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Billing Mode</label>
              {editingAccount ? (
                <select
                  value={accountForm.billing_mode}
                  onChange={(e) => setAccountForm({ ...accountForm, billing_mode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="full-service">Full-Service Lyzr</option>
                  <option value="byom-only">BYOM Only</option>
                  <option value="custom">Custom</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded text-black font-medium">
                  {account?.billing_mode || 'full-service'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Model Handling Fee (%)
              </label>
              {editingAccount ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={accountForm.custom_model_handling_fee}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      custom_model_handling_fee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={accountForm.billing_mode === 'byom-only'}
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded text-black font-medium">
                  {account?.custom_model_handling_fee || 25}%
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingAccount ? (
              <>
                <button
                  onClick={saveAccountSettings}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingAccount(false);
                    setAccountForm({
                      global_discount_percentage: account?.global_discount_percentage || 0,
                      billing_mode: account?.billing_mode || 'full-service',
                      custom_model_handling_fee: account?.custom_model_handling_fee || 25,
                    });
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-black rounded hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingAccount(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-black rounded hover:bg-gray-50 text-sm"
              >
                Edit Settings
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-black">Feature-Level Discounts</h3>
            <p className="text-sm text-gray-600 mt-1">
              Apply specific discounts to individual features or categories.
            </p>
          </div>
          <button
            onClick={addFeatureDiscount}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Discount
          </button>
        </div>

        {discounts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No feature-level discounts configured. Click "Add Discount" to create one.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm w-16">Active</th>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm">Feature</th>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm w-32">Discount (%)</th>
                  <th className="text-left py-3 px-4 font-semibold text-black text-sm w-32">Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-black text-sm w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => updateDiscount(discount.id, { enabled: !discount.enabled })}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                        style={{ backgroundColor: discount.enabled ? '#000' : '#d1d5db' }}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          style={{
                            transform: discount.enabled ? 'translateX(1.5rem)' : 'translateX(0.25rem)',
                          }}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={discount.feature_category || ''}
                        onChange={(e) =>
                          updateDiscount(discount.id, { feature_category: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-sm"
                        placeholder="e.g., KB Retrieve"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={discount.discount_percentage}
                        onChange={(e) =>
                          updateDiscount(discount.id, {
                            discount_percentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {discount.discount_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteDiscount(discount.id)}
                        className="p-2 text-black hover:bg-gray-100 rounded"
                        title="Delete discount"
                      >
                        <Trash2 className="h-4 w-4 stroke-black" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-black mb-2">How Discounts Are Applied</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. Feature-level discounts are applied first (if enabled)</li>
          <li>2. Global account discount is applied to the remaining amount</li>
          <li>3. Discounts are cumulative but cannot exceed 100%</li>
          <li>4. Billing mode affects which costs are included in calculations</li>
        </ul>
      </div>
    </div>
  );
}
