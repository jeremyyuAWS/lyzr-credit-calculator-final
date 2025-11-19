import { useState, useEffect } from 'react';
import { Play, Save, Bookmark, Trash2, Plus, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WhatIfTest {
  id?: string;
  test_name: string;
  test_description: string;
  changes: WhatIfChange[];
  impact_summary?: any;
  cost_before?: number;
  cost_after?: number;
  cost_change_amount?: number;
  cost_change_percent?: number;
  affected_features?: string[];
  affected_sliders?: string[];
  is_bookmarked?: boolean;
  run_count?: number;
}

interface WhatIfChange {
  type: 'feature_cost' | 'model' | 'multiplier' | 'volume' | 'assumption';
  target: string;
  operation: 'multiply' | 'add' | 'set' | 'replace';
  value: number | string;
  description?: string;
}

interface WhatIfSimulatorProps {
  onRunTest?: (test: WhatIfTest) => void;
}

export default function WhatIfSimulator({ onRunTest }: WhatIfSimulatorProps) {
  const [tests, setTests] = useState<WhatIfTest[]>([]);
  const [currentTest, setCurrentTest] = useState<WhatIfTest>({
    test_name: '',
    test_description: '',
    changes: []
  });
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    try {
      const { data, error } = await supabase
        .from('whatif_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error loading What-If tests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTest() {
    if (!currentTest.test_name) {
      alert('Please enter a test name');
      return;
    }

    try {
      const { error } = await supabase
        .from('whatif_tests')
        .insert([{
          test_name: currentTest.test_name,
          test_description: currentTest.test_description,
          changes: currentTest.changes,
          is_bookmarked: false,
          created_by: 'admin'
        }]);

      if (error) throw error;

      await loadTests();
      setIsCreating(false);
      setCurrentTest({ test_name: '', test_description: '', changes: [] });
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save test');
    }
  }

  async function runTest(test: WhatIfTest) {
    setRunningTestId(test.id || null);

    if (onRunTest) {
      onRunTest(test);
    }

    if (test.id) {
      try {
        const { error } = await supabase
          .from('whatif_tests')
          .update({
            last_run_at: new Date().toISOString(),
            run_count: (test.run_count || 0) + 1
          })
          .eq('id', test.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating test run count:', error);
      }
    }

    setTimeout(() => setRunningTestId(null), 1000);
  }

  async function toggleBookmark(testId: string, currentState: boolean) {
    try {
      const { error } = await supabase
        .from('whatif_tests')
        .update({ is_bookmarked: !currentState })
        .eq('id', testId);

      if (error) throw error;
      await loadTests();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  }

  async function deleteTest(testId: string) {
    if (!confirm('Delete this test?')) return;

    try {
      const { error } = await supabase
        .from('whatif_tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;
      await loadTests();
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  }

  function addChange() {
    setCurrentTest({
      ...currentTest,
      changes: [
        ...currentTest.changes,
        {
          type: 'feature_cost',
          target: '',
          operation: 'multiply',
          value: 1.0,
          description: ''
        }
      ]
    });
  }

  function updateChange(index: number, field: string, value: any) {
    const newChanges = [...currentTest.changes];
    newChanges[index] = { ...newChanges[index], [field]: value };
    setCurrentTest({ ...currentTest, changes: newChanges });
  }

  function removeChange(index: number) {
    setCurrentTest({
      ...currentTest,
      changes: currentTest.changes.filter((_, i) => i !== index)
    });
  }

  const quickTests: Partial<WhatIfTest>[] = [
    {
      test_name: 'RAG Cost -50%',
      test_description: 'What if RAG queries cost 50% less?',
      changes: [
        { type: 'feature_cost', target: 'rag_query', operation: 'multiply', value: 0.5, description: 'Halve RAG query cost' }
      ]
    },
    {
      test_name: 'Switch to GPT-4o-mini',
      test_description: 'Impact of switching to cheaper model',
      changes: [
        { type: 'model', target: 'primary_model', operation: 'replace', value: 'gpt-4o-mini', description: 'Use GPT-4o-mini instead of GPT-4o' }
      ]
    },
    {
      test_name: 'Double Agent Count',
      test_description: 'What if multi-agent workflows become standard?',
      changes: [
        { type: 'multiplier', target: 'agent_multiplier', operation: 'multiply', value: 2.0, description: 'Double the agent multiplier' }
      ]
    },
    {
      test_name: 'Token Efficiency +25%',
      test_description: 'What if we optimize prompts to use 25% fewer tokens?',
      changes: [
        { type: 'assumption', target: 'avg_tokens_per_email', operation: 'multiply', value: 0.75, description: 'Reduce email tokens by 25%' },
        { type: 'assumption', target: 'avg_tokens_per_chat', operation: 'multiply', value: 0.75, description: 'Reduce chat tokens by 25%' }
      ]
    }
  ];

  function loadQuickTest(quickTest: Partial<WhatIfTest>) {
    setCurrentTest({
      test_name: quickTest.test_name || '',
      test_description: quickTest.test_description || '',
      changes: quickTest.changes || []
    });
    setIsCreating(true);
  }

  if (loading) {
    return <div className="text-center py-8">Loading What-If tests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">What-If Simulator</h3>
          <p className="text-sm text-gray-600 mt-1">
            Test pricing model changes and see their impact instantly
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Create Test
        </button>
      </div>

      {isCreating && (
        <div className="bg-white border-2 border-black rounded-2xl p-6 space-y-4">
          <h4 className="font-semibold">Create New What-If Test</h4>

          <div>
            <label className="block text-sm font-medium mb-2">Test Name</label>
            <input
              type="text"
              value={currentTest.test_name}
              onChange={(e) => setCurrentTest({ ...currentTest, test_name: e.target.value })}
              placeholder="e.g., RAG Cost Reduction Scenario"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={currentTest.test_description}
              onChange={(e) => setCurrentTest({ ...currentTest, test_description: e.target.value })}
              placeholder="Describe what this test explores..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Changes to Apply</label>
              <button
                onClick={addChange}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Change
              </button>
            </div>

            {currentTest.changes.map((change, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Change #{index + 1}</span>
                  <button
                    onClick={() => removeChange(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Type</label>
                    <select
                      value={change.type}
                      onChange={(e) => updateChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="feature_cost">Feature Cost</option>
                      <option value="model">Model Switch</option>
                      <option value="multiplier">Multiplier</option>
                      <option value="volume">Volume</option>
                      <option value="assumption">Assumption</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Target</label>
                    <input
                      type="text"
                      value={change.target}
                      onChange={(e) => updateChange(index, 'target', e.target.value)}
                      placeholder="e.g., rag_query"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Operation</label>
                    <select
                      value={change.operation}
                      onChange={(e) => updateChange(index, 'operation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="multiply">Multiply</option>
                      <option value="add">Add</option>
                      <option value="set">Set To</option>
                      <option value="replace">Replace</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Value</label>
                    <input
                      type="text"
                      value={change.value}
                      onChange={(e) => updateChange(index, 'value', e.target.value)}
                      placeholder="e.g., 0.5 or gpt-4o-mini"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={change.description || ''}
                    onChange={(e) => updateChange(index, 'description', e.target.value)}
                    placeholder="Explain this change..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ))}

            {currentTest.changes.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">
                No changes added yet. Click "Add Change" to get started.
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveTest}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Save className="h-4 w-4" />
              Save Test
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-600" />
          Quick Tests
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {quickTests.map((qt, idx) => (
            <button
              key={idx}
              onClick={() => loadQuickTest(qt)}
              className="text-left p-4 border border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-all"
            >
              <div className="font-medium text-sm">{qt.test_name}</div>
              <div className="text-xs text-gray-600 mt-1">{qt.test_description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Saved Tests ({tests.length})</h4>

        {tests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No saved tests yet. Create your first What-If test!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white border border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{test.test_name}</h5>
                      {test.is_bookmarked && (
                        <Bookmark className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{test.test_description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{test.changes?.length || 0} changes</span>
                      {test.run_count && <span>Run {test.run_count} times</span>}
                    </div>

                    {test.cost_change_amount !== undefined && test.cost_change_amount !== null && (
                      <div className="mt-3 flex items-center gap-2">
                        {test.cost_change_amount < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${test.cost_change_amount < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {test.cost_change_amount < 0 ? '' : '+'}${Math.abs(test.cost_change_amount).toFixed(2)}
                          {test.cost_change_percent && ` (${test.cost_change_percent > 0 ? '+' : ''}${test.cost_change_percent.toFixed(1)}%)`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => runTest(test)}
                      disabled={runningTestId === test.id}
                      className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      title="Run test"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => test.id && toggleBookmark(test.id, test.is_bookmarked || false)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      title={test.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    >
                      <Bookmark className={`h-4 w-4 ${test.is_bookmarked ? 'fill-yellow-600 text-yellow-600' : ''}`} />
                    </button>
                    <button
                      onClick={() => test.id && deleteTest(test.id)}
                      className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}