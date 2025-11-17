import { TrendingUp, Users, Zap, CheckCircle } from 'lucide-react';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  agents: number;
  complexity: string;
  monthlyUsers: number;
  estimatedCredits: number;
  features: string[];
}

interface ScenarioCardProps {
  scenario: Scenario;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ScenarioCard({ scenario, isSelected, onSelect }: ScenarioCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${
        isSelected
          ? 'border-black bg-gray-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-black mb-1">{scenario.title}</h3>
          <p className="text-sm text-gray-600">{scenario.description}</p>
        </div>
        {isSelected && (
          <CheckCircle className="h-5 w-5 stroke-black flex-shrink-0 ml-2" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 stroke-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Agents</p>
            <p className="text-sm font-medium text-black">{scenario.agents}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 stroke-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Complexity</p>
            <p className="text-sm font-medium text-black">{scenario.complexity}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 stroke-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Users/mo</p>
            <p className="text-sm font-medium text-black">{scenario.monthlyUsers.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2">Key Features:</p>
        <div className="flex flex-wrap gap-2">
          {scenario.features.map((feature, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-black">
            {scenario.estimatedCredits.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">credits/month</span>
        </div>
      </div>
    </button>
  );
}
