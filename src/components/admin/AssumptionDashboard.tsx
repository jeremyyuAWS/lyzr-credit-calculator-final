import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, Edit2, Save, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingAssumption {
  id: string;
  assumption_key: string;
  assumption_name: string;
  description: string;
  category: string;
  current_value: number;
  unit: string;
  confidence_level: 'low' | 'medium' | 'high' | 'validated';
  data_source: 'estimated' | 'calculated' | 'measured' | 'customer_data' | 'industry_benchmark';
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  cost_sensitivity_per_10pct: number;
  last_validated_at?: string;
  last_validated_by?: string;
  validation_notes?: string;
}

interface AssumptionValidation {
  id?: string;
  assumption_id: string;
  validation_date: string;
  validated_by: string;
  actual_value: number;
  expected_value: number;
  variance_percent: number;
  status: 'pending' | 'pass' | 'warning' | 'fail';
  validation_method: string;
  notes: string;
}

export default function AssumptionDashboard() {
  const [assumptions, setAssumptions] = useState<PricingAssumption[]>([]);
  const [validations, setValidations] = useState<Record<string, AssumptionValidation[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PricingAssumption>>({});
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validationForm, setValidationForm] = useState<Partial<AssumptionValidation>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterConfidence, setFilterConfidence] = useState<string>('all');
  const [filterImpact, setFilterImpact] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [assumptionsRes, validationsRes] = await Promise.all([
        supabase.from('pricing_assumptions').select('*').order('category, assumption_name'),
        supabase.from('assumption_validations').select('*').order('validation_date', { ascending: false })
      ]);

      if (assumptionsRes.error) throw assumptionsRes.error;
      if (validationsRes.error) throw validationsRes.error;

      setAssumptions(assumptionsRes.data || []);

      const validationsByAssumption: Record<string, AssumptionValidation[]> = {};
      (validationsRes.data || []).forEach((v: AssumptionValidation) => {
        if (!validationsByAssumption[v.assumption_id]) {
          validationsByAssumption[v.assumption_id] = [];
        }
        validationsByAssumption[v.assumption_id].push(v);
      });
      setValidations(validationsByAssumption);
    } catch (error) {
      console.error('Error loading assumptions:', error);
    } finally {
      setLoading(false);
    }
  }

  function startEditing(assumption: PricingAssumption) {
    setEditingId(assumption.id);
    setEditForm(assumption);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdits() {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('pricing_assumptions')
        .update({
          current_value: editForm.current_value,
          confidence_level: editForm.confidence_level,
          data_source: editForm.data_source,
          impact_level: editForm.impact_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      await loadData();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating assumption:', error);
      alert('Failed to update assumption');
    }
  }

  function startValidation(assumption: PricingAssumption) {
    setValidatingId(assumption.id);
    setValidationForm({
      assumption_id: assumption.id,
      expected_value: assumption.current_value,
      validation_method: 'manual',
      validated_by: 'admin',
      notes: ''
    });
  }

  function cancelValidation() {
    setValidatingId(null);
    setValidationForm({});
  }

  async function saveValidation() {
    if (!validatingId || !validationForm.actual_value) {
      alert('Please enter an actual value');
      return;
    }

    const variance = ((validationForm.actual_value - validationForm.expected_value!) / validationForm.expected_value!) * 100;
    let status: 'pass' | 'warning' | 'fail' = 'pass';
    if (Math.abs(variance) > 20) status = 'fail';
    else if (Math.abs(variance) > 10) status = 'warning';

    try {
      const { error: valError } = await supabase
        .from('assumption_validations')
        .insert([{
          assumption_id: validatingId,
          validation_date: new Date().toISOString(),
          validated_by: validationForm.validated_by,
          actual_value: validationForm.actual_value,
          expected_value: validationForm.expected_value,
          variance_percent: variance,
          status,
          validation_method: validationForm.validation_method,
          notes: validationForm.notes
        }]);

      if (valError) throw valError;

      const { error: updateError } = await supabase
        .from('pricing_assumptions')
        .update({
          last_validated_at: new Date().toISOString(),
          last_validated_by: validationForm.validated_by,
          validation_notes: validationForm.notes,
          confidence_level: status === 'pass' ? 'validated' : 'medium'
        })
        .eq('id', validatingId);

      if (updateError) throw updateError;

      await loadData();
      setValidatingId(null);
      setValidationForm({});
    } catch (error) {
      console.error('Error saving validation:', error);
      alert('Failed to save validation');
    }
  }

  const categories = ['all', ...Array.from(new Set(assumptions.map(a => a.category)))];
  const filteredAssumptions = assumptions.filter(a => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterConfidence !== 'all' && a.confidence_level !== filterConfidence) return false;
    if (filterImpact !== 'all' && a.impact_level !== filterImpact) return false;
    return true;
  });

  function getConfidenceColor(level: string): string {
    switch (level) {
      case 'validated': return 'text-green-700 bg-green-100';
      case 'high': return 'text-blue-700 bg-blue-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  function getImpactColor(level: string): string {
    switch (level) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  const criticalCount = assumptions.filter(a => a.impact_level === 'critical' && a.confidence_level !== 'validated').length;
  const unvalidatedCount = assumptions.filter(a => !a.last_validated_at).length;
  const lowConfidenceHighImpact = assumptions.filter(a =>
    (a.confidence_level === 'low' || a.confidence_level === 'medium') &&
    (a.impact_level === 'high' || a.impact_level === 'critical')
  ).length;

  if (loading) {
    return <div className="text-center py-8">Loading assumptions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Assumption Validation Dashboard</h3>
        <p className="text-sm text-gray-600 mt-1">
          Track and validate all pricing assumptions to ensure accurate cost calculations
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-900">{criticalCount}</div>
              <div className="text-sm text-red-700 mt-1">Critical Unvalidated</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-xs text-red-600 mt-2">
            High-priority assumptions needing validation
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-900">{lowConfidenceHighImpact}</div>
              <div className="text-sm text-yellow-700 mt-1">High Impact, Low Confidence</div>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="text-xs text-yellow-600 mt-2">
            Assumptions with biggest cost impact uncertainty
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-900">{unvalidatedCount}</div>
              <div className="text-sm text-blue-700 mt-1">Never Validated</div>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-xs text-blue-600 mt-2">
            Assumptions based purely on estimates
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Confidence:</label>
          <select
            value={filterConfidence}
            onChange={(e) => setFilterConfidence(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="validated">Validated</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Impact:</label>
          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAssumptions.map((assumption) => {
          const isEditing = editingId === assumption.id;
          const isValidating = validatingId === assumption.id;
          const recentValidations = validations[assumption.id]?.slice(0, 3) || [];

          return (
            <div
              key={assumption.id}
              className="bg-white border border-gray-300 rounded-lg p-5 hover:border-gray-400 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{assumption.assumption_name}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(assumption.confidence_level)}`}>
                      {assumption.confidence_level}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getImpactColor(assumption.impact_level)}`}>
                      {assumption.impact_level} impact
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {assumption.category}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{assumption.description}</p>

                  {isEditing ? (
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">Value</label>
                        <input
                          type="number"
                          value={editForm.current_value}
                          onChange={(e) => setEditForm({ ...editForm, current_value: parseFloat(e.target.value) })}
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Confidence</label>
                        <select
                          value={editForm.confidence_level}
                          onChange={(e) => setEditForm({ ...editForm, confidence_level: e.target.value as any })}
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="validated">Validated</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Source</label>
                        <select
                          value={editForm.data_source}
                          onChange={(e) => setEditForm({ ...editForm, data_source: e.target.value as any })}
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="estimated">Estimated</option>
                          <option value="calculated">Calculated</option>
                          <option value="measured">Measured</option>
                          <option value="customer_data">Customer Data</option>
                          <option value="industry_benchmark">Industry Benchmark</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Impact</label>
                        <select
                          value={editForm.impact_level}
                          onChange={(e) => setEditForm({ ...editForm, impact_level: e.target.value as any })}
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Current Value: </span>
                        <span className="font-semibold">
                          {assumption.current_value.toLocaleString()} {assumption.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Source: </span>
                        <span className="font-medium">{assumption.data_source}</span>
                      </div>
                      {assumption.cost_sensitivity_per_10pct > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="text-gray-600">10% swing: </span>
                          <span className="font-medium text-orange-600">
                            ±${assumption.cost_sensitivity_per_10pct.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {assumption.last_validated_at && (
                    <div className="text-xs text-gray-500 mb-2">
                      Last validated {new Date(assumption.last_validated_at).toLocaleDateString()} by {assumption.last_validated_by}
                      {assumption.validation_notes && ` - ${assumption.validation_notes}`}
                    </div>
                  )}

                  {isValidating && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 space-y-3">
                      <h5 className="font-medium text-sm">Validate Assumption</h5>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium block mb-1">Expected</label>
                          <input
                            type="number"
                            value={validationForm.expected_value}
                            disabled
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1">Actual Value *</label>
                          <input
                            type="number"
                            value={validationForm.actual_value || ''}
                            onChange={(e) => setValidationForm({ ...validationForm, actual_value: parseFloat(e.target.value) })}
                            placeholder="Enter measured value"
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1">Method</label>
                          <select
                            value={validationForm.validation_method}
                            onChange={(e) => setValidationForm({ ...validationForm, validation_method: e.target.value })}
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="manual">Manual Review</option>
                            <option value="analytics">Analytics Data</option>
                            <option value="customer_survey">Customer Survey</option>
                            <option value="benchmark">Industry Benchmark</option>
                            <option value="calculated">Calculated</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Notes</label>
                        <textarea
                          value={validationForm.notes}
                          onChange={(e) => setValidationForm({ ...validationForm, notes: e.target.value })}
                          placeholder="Add validation notes..."
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveValidation}
                          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
                        >
                          <Save className="h-3 w-3" />
                          Save Validation
                        </button>
                        <button
                          onClick={cancelValidation}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {recentValidations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">Recent Validations:</div>
                      <div className="space-y-1">
                        {recentValidations.map((val) => (
                          <div key={val.id} className="flex items-center gap-3 text-xs">
                            {val.status === 'pass' && <CheckCircle className="h-3 w-3 text-green-600" />}
                            {val.status === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-600" />}
                            {val.status === 'fail' && <AlertTriangle className="h-3 w-3 text-red-600" />}
                            <span className="text-gray-600">
                              {new Date(val.validation_date).toLocaleDateString()}:
                              Expected {val.expected_value}, Actual {val.actual_value}
                              ({val.variance_percent > 0 ? '+' : ''}{val.variance_percent.toFixed(1)}% variance)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdits}
                        className="p-2 bg-black text-white rounded-lg hover:bg-gray-800"
                        title="Save"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(assumption)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => startValidation(assumption)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        title="Validate"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssumptions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No assumptions match the current filters</p>
        </div>
      )}
    </div>
  );
}