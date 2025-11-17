import { Network, Database, Wrench, Brain, Shield, Globe, Search } from 'lucide-react';
import type { WorkflowConfig } from '../BusinessSlidersTab';

interface ComplexitySlidersProps {
  workflow: WorkflowConfig;
  onUpdate: (updates: Partial<WorkflowConfig>) => void;
}

export default function ComplexitySliders({ workflow, onUpdate }: ComplexitySlidersProps) {
  const sliders = [
    {
      key: 'steps_per_workflow' as keyof WorkflowConfig,
      label: 'Steps per Workflow',
      icon: Network,
      min: 1,
      max: 20,
      step: 1,
      value: workflow.steps_per_workflow,
      description: 'Number of sequential steps in each workflow',
    },
    {
      key: 'agent_interactions' as keyof WorkflowConfig,
      label: 'Agent Interactions',
      icon: Brain,
      min: 1,
      max: 10,
      step: 1,
      value: workflow.agent_interactions,
      description: 'Number of agent-to-agent communications',
    },
    {
      key: 'rag_lookups' as keyof WorkflowConfig,
      label: 'RAG Lookups per Transaction',
      icon: Search,
      min: 0,
      max: 20,
      step: 1,
      value: workflow.rag_lookups,
      description: 'Knowledge base queries',
    },
    {
      key: 'tool_calls' as keyof WorkflowConfig,
      label: 'Tool Calls',
      icon: Wrench,
      min: 0,
      max: 10,
      step: 1,
      value: workflow.tool_calls,
      description: 'External API/tool invocations',
    },
    {
      key: 'db_queries' as keyof WorkflowConfig,
      label: 'Database Queries',
      icon: Database,
      min: 0,
      max: 20,
      step: 1,
      value: workflow.db_queries,
      description: 'Database read/write operations',
    },
    {
      key: 'memory_ops' as keyof WorkflowConfig,
      label: 'Memory Operations',
      icon: Brain,
      min: 0,
      max: 20,
      step: 1,
      value: workflow.memory_ops,
      description: 'Agent memory read/write operations',
    },
    {
      key: 'reflection_runs' as keyof WorkflowConfig,
      label: 'Reflection Runs',
      icon: Shield,
      min: 0,
      max: 5,
      step: 1,
      value: workflow.reflection_runs,
      description: 'Safety and quality checks',
    },
    {
      key: 'web_fetches' as keyof WorkflowConfig,
      label: 'Web Fetches',
      icon: Globe,
      min: 0,
      max: 10,
      step: 1,
      value: workflow.web_fetches,
      description: 'Single web page fetches',
    },
    {
      key: 'deep_crawl_pages' as keyof WorkflowConfig,
      label: 'Deep Crawl Pages',
      icon: Globe,
      min: 0,
      max: 50,
      step: 1,
      value: workflow.deep_crawl_pages,
      description: 'Deep web crawl per page',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
        <Network className="h-5 w-5" />
        Complexity & Features
      </h2>
      <div className="space-y-6">
        {sliders.map((slider) => (
          <div key={slider.key}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <slider.icon className="h-4 w-4" />
                  {slider.label}
                </label>
                <p className="text-xs text-gray-500 mt-0.5 ml-6">{slider.description}</p>
              </div>
              <input
                type="number"
                value={slider.value}
                onChange={(e) => onUpdate({ [slider.key]: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-black focus:border-transparent"
                min={slider.min}
                max={slider.max}
                step={slider.step}
              />
            </div>
            <input
              type="range"
              value={slider.value}
              onChange={(e) => onUpdate({ [slider.key]: parseInt(e.target.value) })}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{slider.min}</span>
              <span>{slider.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
