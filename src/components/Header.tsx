import { Settings, Calculator } from 'lucide-react';

interface HeaderProps {
  company: string;
  agents: string;
  useCase: string;
  complexity: string;
  onSettingsClick: () => void;
}

export default function Header({ company, agents, useCase, complexity, onSettingsClick }: HeaderProps) {
  return (
    <div className="glass-header px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <img src="/LyzrDark-logo.svg" alt="Lyzr" className="h-10" />
              <h1 className="text-3xl font-bold text-white">Credits Calculator</h1>
            </div>
            <p className="text-gray-300 text-sm italic">See Your AI Costs Before You Deploy.</p>
          </div>
          <button
            onClick={onSettingsClick}
            className="glass-button p-3 rounded-xl text-white"
            aria-label="Global Settings"
          >
            <Settings className="h-5 w-5 stroke-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
