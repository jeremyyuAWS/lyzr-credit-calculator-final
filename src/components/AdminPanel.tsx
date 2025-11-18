import { useState } from 'react';
import { X, Settings2 } from 'lucide-react';
import PricingCatalogTab from './admin/PricingCatalogTab';
import FeaturePricingTab from './admin/FeaturePricingTab';
import SetupCostsGlobalTab from './admin/SetupCostsGlobalTab';
import LyzrApiSettingsTab from './admin/LyzrApiSettingsTab';
import FormulaEditorTab from './admin/FormulaEditorTab';
import PricingVariablesTab from './admin/PricingVariablesTab';
import ScenarioSandboxTab from './admin/ScenarioSandboxTab';
import CompetitorComparisonTab from './admin/CompetitorComparisonTab';
import DebugModeTab from './admin/DebugModeTab';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'setup-costs' | 'llm-pricing' | 'feature-pricing' | 'lyzr-api' | 'formulas' | 'variables' | 'scenarios' | 'competitors' | 'debug';

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('setup-costs');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [debugConfig, setDebugConfig] = useState<{
    formulaKey?: string;
    variables?: string[];
  } | null>(null);

  function handleDebugFormula(formulaKey: string, variables: string[]) {
    setDebugConfig({ formulaKey, variables });
    setActiveTab('debug');
    setShowAdvanced(true);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">Admin Panel</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                showAdvanced
                  ? 'bg-black text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Toggle Advanced Settings"
            >
              <Settings2 className="h-4 w-4" />
              <span className="text-sm font-medium">Advanced</span>
            </button>
            <button
              onClick={onClose}
              className="p-0 hover:opacity-70 focus:outline-none"
              aria-label="Close"
            >
              <X className="h-5 w-5 stroke-black" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('setup-costs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'setup-costs'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Setup Costs
            </button>
            <button
              onClick={() => setActiveTab('llm-pricing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'llm-pricing'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              LLM Pricing
            </button>
            <button
              onClick={() => setActiveTab('feature-pricing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'feature-pricing'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Feature Pricing
            </button>
            <button
              onClick={() => setActiveTab('lyzr-api')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'lyzr-api'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lyzr API
            </button>

            {showAdvanced && (
              <>
                <div className="flex items-center px-2">
                  <div className="h-8 w-px bg-gray-300"></div>
                </div>
                <button
                  onClick={() => setActiveTab('formulas')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'formulas'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Formula Editor
                </button>
                <button
                  onClick={() => setActiveTab('variables')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'variables'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pricing Variables
                </button>
                <button
                  onClick={() => setActiveTab('scenarios')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'scenarios'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Scenario Sandbox
                </button>
                <button
                  onClick={() => setActiveTab('competitors')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'competitors'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Competitor Comparison
                </button>
                <button
                  onClick={() => setActiveTab('debug')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'debug'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Debug Mode
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'llm-pricing' && <PricingCatalogTab />}
          {activeTab === 'feature-pricing' && <FeaturePricingTab />}
          {activeTab === 'setup-costs' && <SetupCostsGlobalTab />}
          {activeTab === 'lyzr-api' && <LyzrApiSettingsTab />}
          {activeTab === 'formulas' && <FormulaEditorTab onDebugFormula={handleDebugFormula} />}
          {activeTab === 'variables' && <PricingVariablesTab />}
          {activeTab === 'scenarios' && <ScenarioSandboxTab />}
          {activeTab === 'competitors' && <CompetitorComparisonTab />}
          {activeTab === 'debug' && <DebugModeTab debugConfig={debugConfig} onConfigConsumed={() => setDebugConfig(null)} />}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
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
