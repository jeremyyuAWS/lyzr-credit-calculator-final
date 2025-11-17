import { ScenarioType } from '../lib/calculator';

interface DeploymentScenariosProps {
  selectedScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
}

export default function DeploymentScenarios({ selectedScenario, onScenarioChange }: DeploymentScenariosProps) {
  const scenarios: { type: ScenarioType; label: string; description: string; badge: string }[] = [
    {
      type: 'optimized',
      label: 'Optimize Cost',
      description: 'Lowest cost, batch-friendly processing',
      badge: '-25%',
    },
    {
      type: 'standard',
      label: 'Balanced',
      description: 'Best mix of cost and performance',
      badge: 'Recommended',
    },
    {
      type: 'premium',
      label: 'Optimize Performance',
      description: 'Fastest response with priority processing',
      badge: '+30%',
    },
  ];

  return (
    <div className="glass-card-light rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-black mb-6">Deployment Scenarios</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {scenarios.map((scenario) => (
          <button
            key={scenario.type}
            onClick={() => onScenarioChange(scenario.type)}
            className={`p-6 rounded-xl transition-all text-left border-2 ${
              selectedScenario === scenario.type
                ? 'glass-button-selected shadow-lg border-white/30'
                : 'bg-white/90 backdrop-blur-sm border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`font-bold text-xl ${selectedScenario === scenario.type ? 'text-black' : 'text-black'}`}>{scenario.label}</span>
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                  scenario.type === 'standard'
                    ? selectedScenario === scenario.type
                      ? 'bg-black text-white'
                      : 'bg-gray-800 text-white'
                    : selectedScenario === scenario.type
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {scenario.badge}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${selectedScenario === scenario.type ? 'text-gray-600' : 'text-gray-600'}`}>{scenario.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
