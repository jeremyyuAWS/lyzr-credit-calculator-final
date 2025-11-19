import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Play, Lightbulb, Bug } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Formula {
  id: string;
  formula_name: string;
  formula_key: string;
  formula_expression: string;
  description: string | null;
  variables_used: string[];
  result_unit: string;
  category: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PricingVariable {
  id: string;
  variable_key: string;
  variable_name: string;
  variable_value: number;
  variable_type: string;
  description: string | null;
  unit: string | null;
}

interface FormulaEditorTabProps {
  onDebugFormula?: (formulaKey: string, variables: string[]) => void;
}

export default function FormulaEditorTab({ onDebugFormula }: FormulaEditorTabProps) {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Formula>>({});
  const [testVariables, setTestVariables] = useState<Record<string, number>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<PricingVariable[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredVariables, setFilteredVariables] = useState<PricingVariable[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFormulas();
    loadPricingVariables();
  }, []);

  async function loadPricingVariables() {
    const { data, error } = await supabase
      .from('pricing_variables')
      .select('*')
      .order('variable_name', { ascending: true });

    if (error) {
      console.error('Error loading pricing variables:', error);
    } else {
      setAvailableVariables(data || []);
    }
  }

  async function loadFormulas() {
    setLoading(true);
    const { data, error } = await supabase
      .from('business_formulas')
      .select('*')
      .order('category', { ascending: true })
      .order('formula_name', { ascending: true });

    if (error) {
      console.error('Error loading formulas:', error);
    } else {
      setFormulas(data || []);
    }
    setLoading(false);
  }

  function startEdit(formula: Formula) {
    setEditingId(formula.id);
    setEditForm(formula);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
    setIsCreating(false);
  }

  function startCreate() {
    setIsCreating(true);
    setEditForm({
      formula_name: '',
      formula_key: '',
      formula_expression: '',
      description: '',
      result_unit: 'USD',
      category: 'cost',
      variables_used: [],
      is_active: true,
    });
  }

  async function saveFormula() {
    if (isCreating) {
      const formulaKey = editForm.formula_name?.toLowerCase().replace(/\s+/g, '_') || '';
      const variablesUsed = extractVariablesFromExpression(editForm.formula_expression || '');

      const { error } = await supabase
        .from('business_formulas')
        .insert({
          formula_name: editForm.formula_name,
          formula_key: formulaKey,
          formula_expression: editForm.formula_expression,
          description: editForm.description,
          result_unit: editForm.result_unit || 'USD',
          category: editForm.category,
          variables_used: variablesUsed,
          is_active: true,
        });

      if (error) {
        console.error('Error creating formula:', error);
        alert('Error creating formula: ' + error.message);
      } else {
        await loadFormulas();
        cancelEdit();
      }
    } else if (editingId) {
      const variablesUsed = extractVariablesFromExpression(editForm.formula_expression || '');

      const { error } = await supabase
        .from('business_formulas')
        .update({
          formula_name: editForm.formula_name,
          formula_expression: editForm.formula_expression,
          description: editForm.description,
          result_unit: editForm.result_unit || 'USD',
          category: editForm.category,
          variables_used: variablesUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        console.error('Error updating formula:', error);
        alert('Error updating formula: ' + error.message);
      } else {
        await loadFormulas();
        cancelEdit();
      }
    }
  }

  function extractVariablesFromExpression(expression: string): string[] {
    const varPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const matches = expression.match(varPattern) || [];
    const keywords = new Set(['if', 'else', 'for', 'while', 'return', 'function', 'const', 'let', 'var', 'true', 'false']);
    const uniqueVars = Array.from(new Set(matches)).filter(v => !keywords.has(v));
    return uniqueVars;
  }

  function handleExpressionChange(value: string, cursorPos: number) {
    setEditForm({ ...editForm, formula_expression: value });
    setCursorPosition(cursorPos);

    const textBeforeCursor = value.substring(0, cursorPos);
    const currentWord = textBeforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/)?.[0] || '';

    if (currentWord.length >= 1) {
      const filtered = availableVariables.filter(v =>
        v.variable_key.toLowerCase().includes(currentWord.toLowerCase()) ||
        v.variable_name.toLowerCase().includes(currentWord.toLowerCase())
      );
      setFilteredVariables(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function insertVariable(variable: PricingVariable) {
    const expression = editForm.formula_expression || '';
    const textBeforeCursor = expression.substring(0, cursorPosition);
    const textAfterCursor = expression.substring(cursorPosition);

    const currentWord = textBeforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/)?.[0] || '';
    const beforeWord = textBeforeCursor.substring(0, textBeforeCursor.length - currentWord.length);

    const newExpression = beforeWord + variable.variable_key + textAfterCursor;
    setEditForm({ ...editForm, formula_expression: newExpression });
    setShowSuggestions(false);

    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeWord.length + variable.variable_key.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }

  async function deleteFormula(id: string) {
    if (!confirm('Are you sure you want to delete this formula?')) return;

    const { error } = await supabase
      .from('business_formulas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting formula:', error);
    } else {
      await loadFormulas();
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    const { error } = await supabase
      .from('business_formulas')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      console.error('Error toggling formula:', error);
    } else {
      await loadFormulas();
    }
  }

  function startTest(formula: Formula) {
    setTestingId(formula.id);
    const vars: Record<string, number> = {};
    formula.variables_used.forEach(v => {
      vars[v] = 0;
    });
    setTestVariables(vars);
    setTestResult(null);
  }

  function evaluateFormula() {
    const formula = formulas.find(f => f.id === testingId);
    if (!formula) return;

    try {
      let expression = formula.formula_expression;
      Object.keys(testVariables).forEach(varName => {
        const regex = new RegExp(varName, 'g');
        expression = expression.replace(regex, testVariables[varName].toString());
      });

      const result = eval(expression);
      setTestResult(`Result: ${result.toFixed(4)}`);
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading formulas...</div>
      </div>
    );
  }

  const categories = Array.from(new Set(formulas.map(f => f.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Formula Editor</h3>
          <p className="text-sm text-gray-600 mt-1">
            Edit calculation formulas used throughout the pricing engine
          </p>
        </div>
        <button
          onClick={startCreate}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isCreating
              ? 'bg-gray-200 text-gray-600 cursor-default'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
          disabled={isCreating}
        >
          <Plus className="h-4 w-4" />
          {isCreating ? 'Creating Formula...' : 'Add Formula'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-black">Create New Formula</h4>
            <button
              onClick={cancelEdit}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              title="Cancel"
            >
              <X className="h-5 w-5 stroke-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formula Name *
              </label>
              <input
                type="text"
                value={editForm.formula_name || ''}
                onChange={(e) => setEditForm({ ...editForm, formula_name: e.target.value })}
                placeholder="e.g., Monthly Revenue Calculator"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={editForm.category || 'core'}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="core">Core</option>
                <option value="tokens">Tokens</option>
                <option value="features">Features</option>
                <option value="agents">Agents</option>
                <option value="setup">Setup</option>
                <option value="business">Business</option>
                <option value="optimization">Optimization</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formula Expression *
            </label>
            <input
              ref={inputRef}
              type="text"
              value={editForm.formula_expression || ''}
              onChange={(e) => handleExpressionChange(e.target.value, e.target.selectionStart || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                const cursorPos = inputRef.current?.selectionStart || 0;
                handleExpressionChange(editForm.formula_expression || '', cursorPos);
              }}
              onClick={(e) => {
                const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
                setCursorPosition(cursorPos);
              }}
              placeholder="e.g., basePrice * quantity * (1 + taxRate / 100)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
            />

            {showSuggestions && filteredVariables.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border-2 border-black rounded-lg shadow-xl max-h-60 overflow-y-auto">
                <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 stroke-yellow-600" />
                  <span className="text-xs font-semibold text-gray-700">Available Variables</span>
                </div>
                {filteredVariables.map((variable) => (
                  <button
                    key={variable.id}
                    onClick={() => insertVariable(variable)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold text-black">{variable.variable_key}</div>
                        <div className="text-xs text-gray-600">{variable.variable_name}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {variable.variable_value} {variable.unit && `(${variable.unit})`}
                      </div>
                    </div>
                    {variable.description && (
                      <div className="text-xs text-gray-500 mt-1">{variable.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 mt-2">
              <p className="text-xs text-gray-500 flex-1">
                Start typing to see variable suggestions. Use standard JavaScript math operators (+, -, *, /, %, etc.)
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilteredVariables(availableVariables);
                  setShowSuggestions(!showSuggestions);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <Lightbulb className="h-3 w-3" />
                Show All Variables
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Explain what this formula calculates and when to use it"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              rows={3}
            />
          </div>

          {availableVariables.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-black mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 stroke-blue-600" />
                Quick Reference: Available Pricing Variables
              </h5>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableVariables.slice(0, 12).map((variable) => (
                  <button
                    key={variable.id}
                    type="button"
                    onClick={() => {
                      const currentExpr = editForm.formula_expression || '';
                      setEditForm({
                        ...editForm,
                        formula_expression: currentExpr + (currentExpr ? ' * ' : '') + variable.variable_key
                      });
                    }}
                    className="text-left px-2 py-1 bg-white rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-mono text-xs font-semibold text-black">{variable.variable_key}</div>
                    <div className="text-xs text-gray-600 truncate">{variable.variable_name}</div>
                  </button>
                ))}
              </div>
              {availableVariables.length > 12 && (
                <p className="text-xs text-gray-600 mt-2">
                  ...and {availableVariables.length - 12} more. Start typing in the formula field to see all suggestions.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-blue-200">
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={saveFormula}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              <Save className="h-4 w-4" />
              Create Formula
            </button>
          </div>
        </div>
      )}

      {categories.map(category => {
        const categoryFormulas = formulas.filter(f => f.category === category);
        return (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {category}
            </h4>
            <div className="space-y-2">
              {categoryFormulas.map(formula => (
                <div
                  key={formula.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {editingId === formula.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Formula Name
                          </label>
                          <input
                            type="text"
                            value={editForm.formula_name || ''}
                            onChange={(e) => setEditForm({ ...editForm, formula_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            value={editForm.category || ''}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Formula Expression
                        </label>
                        <input
                          type="text"
                          value={editForm.formula_expression || ''}
                          onChange={(e) => setEditForm({ ...editForm, formula_expression: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          rows={2}
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
                          onClick={saveFormula}
                          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h5 className="font-semibold text-black">{formula.formula_name}</h5>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              formula.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {formula.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                              v{formula.version}
                            </span>
                          </div>
                          {formula.description && (
                            <p className="text-sm text-gray-600 mt-1">{formula.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {onDebugFormula && (
                            <button
                              onClick={() => onDebugFormula(formula.formula_key, formula.variables_used)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors text-xs font-medium"
                              title="Debug this formula in Debug Mode"
                            >
                              <Bug className="h-4 w-4" />
                              Debug
                            </button>
                          )}
                          <button
                            onClick={() => startTest(formula)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Test formula"
                          >
                            <Play className="h-4 w-4 stroke-black" />
                          </button>
                          <button
                            onClick={() => startEdit(formula)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit formula"
                          >
                            <Edit2 className="h-4 w-4 stroke-black" />
                          </button>
                          <button
                            onClick={() => deleteFormula(formula.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete formula"
                          >
                            <Trash2 className="h-4 w-4 stroke-red-600" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded p-3 mb-2">
                        <code className="text-sm text-gray-800 font-mono">{formula.formula_expression}</code>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Variables:</span>
                        {formula.variables_used.map(v => (
                          <span key={v} className="px-2 py-1 bg-gray-100 rounded font-mono">{v}</span>
                        ))}
                      </div>

                      {testingId === formula.id && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                          <h6 className="font-semibold text-black">Test Formula</h6>
                          <div className="grid grid-cols-2 gap-3">
                            {formula.variables_used.map(varName => (
                              <div key={varName}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {varName}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={testVariables[varName] || 0}
                                  onChange={(e) => setTestVariables({
                                    ...testVariables,
                                    [varName]: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={evaluateFormula}
                              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <Play className="h-4 w-4" />
                              Evaluate
                            </button>
                            <button
                              onClick={() => setTestingId(null)}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Close
                            </button>
                          </div>
                          {testResult && (
                            <div className="p-3 bg-white border border-gray-200 rounded font-mono text-sm">
                              {testResult}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
