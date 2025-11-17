import { CalculatorState, COMPLEXITY_MULTIPLIERS, AGENT_MULTIPLIERS, SCENARIO_MULTIPLIERS } from '../lib/calculator';
import { useState, useEffect } from 'react';
import { supabase, CreditSettingGlobal } from '../lib/supabase';
import { Settings, Zap, Info } from 'lucide-react';

interface CalculationBreakdownProps {
  state: CalculatorState;
}

export default function CalculationBreakdown({ state }: CalculationBreakdownProps) {
  const [creditSettings, setCreditSettings] = useState<CreditSettingGlobal[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadCreditSettings();
  }, []);

  async function loadCreditSettings() {
    try {
      const { data } = await supabase
        .from('credit_settings_global')
        .select('*')
        .eq('enabled', true)
        .order('category');

      if (data) setCreditSettings(data);
    } catch (error) {
      console.error('Error loading credit settings:', error);
    }
  }

  const creditsPerTransaction = (
    state.baseCredits *
    COMPLEXITY_MULTIPLIERS[state.complexity] *
    AGENT_MULTIPLIERS[state.agentType] *
    SCENARIO_MULTIPLIERS[state.scenario]
  ).toFixed(2);

  return (
    <div className="glass-card-light rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-black">How Credits Are Calculated</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle details"
        >
          <Info className="h-5 w-5 stroke-black" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="text-gray-600">Base Credits</span>
          <span className="font-bold text-black">{state.baseCredits}</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="text-gray-600">
            Complexity Multiplier <span className="text-sm">({state.complexity})</span>
          </span>
          <span className="font-bold text-black">×{COMPLEXITY_MULTIPLIERS[state.complexity]}</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="text-gray-600">
            Agent Multiplier <span className="text-sm">({state.agentType})</span>
          </span>
          <span className="font-bold text-black">×{AGENT_MULTIPLIERS[state.agentType]}</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="text-gray-600">
            Scenario Multiplier <span className="text-sm">({state.scenario})</span>
          </span>
          <span className="font-bold text-black">×{SCENARIO_MULTIPLIERS[state.scenario]}</span>
        </div>

        <div className="mt-6 p-4 glass-button rounded-xl">
          <div className="text-sm text-gray-600 mb-2">Formula</div>
          <div className="font-mono text-sm text-black">
            {state.baseCredits} × {COMPLEXITY_MULTIPLIERS[state.complexity]} × {AGENT_MULTIPLIERS[state.agentType]} × {SCENARIO_MULTIPLIERS[state.scenario]} ={' '}
            <span className="font-bold">
              {creditsPerTransaction} credits
            </span>
          </div>
        </div>

        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <div className="mb-4">
              <h3 className="font-semibold text-black mb-2">Setup & Configuration Costs</h3>
              <p className="text-sm text-gray-600">
                One-time credits used when building your AI solution
              </p>
            </div>

            <div className="space-y-3">
              {creditSettings.length > 0 ? (
                creditSettings.map((setting) => {
                  const businessDescriptions: Record<string, { title: string; description: string }> = {
                    'Agent Creation': {
                      title: 'Creating an AI Agent',
                      description: 'Each specialized agent you configure for your application'
                    },
                    'Knowledge Base Creation': {
                      title: 'Setting Up a Knowledge Base',
                      description: 'Document repositories that power your AI with domain knowledge'
                    },
                    'RAI Creation': {
                      title: 'Enabling Responsible AI',
                      description: 'Guardrails and safety measures for your AI system'
                    },
                    'Tool Creation': {
                      title: 'Integrating a Tool',
                      description: 'API connections and external tool integrations'
                    },
                    'Evaluation Suite Creation': {
                      title: 'Quality Assurance Setup',
                      description: 'Testing frameworks to ensure AI accuracy and reliability'
                    }
                  };

                  const info = businessDescriptions[setting.category] || {
                    title: setting.category,
                    description: setting.unit
                  };

                  return (
                    <div
                      key={setting.id}
                      className="flex items-start justify-between py-3 px-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-black">{info.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{info.description}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-base font-bold text-black">{setting.price_credits}</div>
                        <div className="text-xs text-gray-500">credits</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No setup costs configured
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 stroke-gray-700 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-2">Understanding Credit Usage</p>
                  <div className="space-y-2">
                    <p>
                      <strong className="text-black">Runtime Credits:</strong> {creditsPerTransaction} credits per user interaction with your deployed AI system
                    </p>
                    <p>
                      <strong className="text-black">Setup Credits:</strong> One-time costs shown above for building and configuring your AI solution
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
