import { useState, useEffect } from 'react';
import BusinessSlidersTab from './BusinessSlidersTab';
import ChatDiscoveryTab from './ChatDiscoveryTab';
import GuidedSetup from './GuidedSetup';
import WelcomeModal from './WelcomeModal';
import Header from './Header';
import AdminPanel from './AdminPanel';
import ResponsibleAI from './ResponsibleAI';
import type { WorkflowConfig } from './BusinessSlidersTab';

type TabType = 'guided-setup' | 'chat-discovery' | 'business-calculator' | 'responsible-ai';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<TabType>('guided-setup');
  const [adminOpen, setAdminOpen] = useState(false);
  const [workflowConfig, setWorkflowConfig] = useState<Partial<WorkflowConfig> | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [guidedSetupStep, setGuidedSetupStep] = useState(0);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('lyzr_calculator_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem('lyzr_calculator_welcome_seen', 'true');
    }
  }, []);

  function handleChatComplete(config: Partial<WorkflowConfig>) {
    setWorkflowConfig(config);
    setActiveTab('business-calculator');
  }

  function handleModeSelect(mode: 'guided' | 'chat') {
    if (mode === 'guided') {
      setActiveTab('guided-setup');
    } else {
      setActiveTab('chat-discovery');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <Header
        company="Lyzr AI Credits Calculator"
        agents="Multi-Agent Platform"
        useCase="Cost Estimation Tool"
        complexity="Enterprise"
        onSettingsClick={() => setAdminOpen(true)}
      />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('guided-setup')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'guided-setup'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {activeTab === 'guided-setup' && guidedSetupStep === 0 ? 'Choose Path' : 'Guided Setup'}
            </button>
            {(activeTab !== 'guided-setup' || guidedSetupStep > 0) && (
              <>
                <button
                  onClick={() => setActiveTab('chat-discovery')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'chat-discovery'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Chat Discovery
                </button>
                <button
                  onClick={() => setActiveTab('business-calculator')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'business-calculator'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Business Calculator
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('responsible-ai')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'responsible-ai'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Responsible AI
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'guided-setup' && <GuidedSetup onStepChange={setGuidedSetupStep} onModeSelect={handleModeSelect} />}
        {activeTab === 'chat-discovery' && <ChatDiscoveryTab onComplete={handleChatComplete} />}
        {activeTab === 'business-calculator' && <BusinessSlidersTab initialWorkflow={workflowConfig || undefined} />}
        {activeTab === 'responsible-ai' && <ResponsibleAI />}
      </div>

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onSelectMode={handleModeSelect}
      />

      {/* Admin Panel */}
      <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
}
