import { Mail, MessageSquare, Phone, FileText, Zap } from 'lucide-react';
import type { WorkflowConfig } from '../BusinessSlidersTab';

interface VolumeSlidersProps {
  workflow: WorkflowConfig;
  onUpdate: (updates: Partial<WorkflowConfig>) => void;
}

export default function VolumeSliders({ workflow, onUpdate }: VolumeSlidersProps) {
  const sliders = [
    {
      key: 'emails_per_month' as keyof WorkflowConfig,
      label: 'Emails per Month',
      icon: Mail,
      min: 0,
      max: 50000,
      step: 100,
      value: workflow.emails_per_month,
    },
    {
      key: 'chats_per_month' as keyof WorkflowConfig,
      label: 'Chats per Month',
      icon: MessageSquare,
      min: 0,
      max: 50000,
      step: 100,
      value: workflow.chats_per_month,
    },
    {
      key: 'voice_calls_per_month' as keyof WorkflowConfig,
      label: 'Voice Calls per Month',
      icon: Phone,
      min: 0,
      max: 10000,
      step: 50,
      value: workflow.voice_calls_per_month,
    },
    {
      key: 'docs_per_month' as keyof WorkflowConfig,
      label: 'Documents Processed',
      icon: FileText,
      min: 0,
      max: 10000,
      step: 50,
      value: workflow.docs_per_month,
    },
    {
      key: 'workflow_triggers_per_day' as keyof WorkflowConfig,
      label: 'Workflow Triggers per Day',
      icon: Zap,
      min: 0,
      max: 1000,
      step: 10,
      value: workflow.workflow_triggers_per_day,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
        <Zap className="h-5 w-5" />
        Volume Controls
      </h2>
      <div className="space-y-6">
        {sliders.map((slider) => (
          <div key={slider.key}>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <slider.icon className="h-4 w-4" />
                {slider.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={slider.value}
                  onChange={(e) => onUpdate({ [slider.key]: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-black focus:border-transparent"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                />
                <span className="text-xs text-gray-500 w-20">per month</span>
              </div>
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
              <span>{slider.min.toLocaleString()}</span>
              <span>{slider.max.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
