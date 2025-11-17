import { useState } from 'react';
import BusinessSlidersTab from './BusinessSlidersTab';
import ChatDiscoveryTab from './ChatDiscoveryTab';
import Header from './Header';
import AdminPanel from './AdminPanel';
import type { WorkflowConfig } from './BusinessSlidersTab';

type TabType = 'chat-discovery' | 'business-calculator';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<TabType>('chat-discovery');
  const [adminOpen, setAdminOpen] = useState(false);
  const [workflowConfig, setWorkflowConfig] = useState<Partial<WorkflowConfig> | null>(null);

  function handleChatComplete(config: Partial<WorkflowConfig>) {
    setWorkflowConfig(config);
    setActiveTab('business-calculator');
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
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'chat-discovery' && <ChatDiscoveryTab onComplete={handleChatComplete} />}
        {activeTab === 'business-calculator' && <BusinessSlidersTab initialWorkflow={workflowConfig || undefined} />}
      </div>

      {/* Admin Panel */}
      <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
}
