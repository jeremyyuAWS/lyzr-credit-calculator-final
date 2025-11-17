import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isAnalyzing: boolean;
}

const EXAMPLE_SCENARIOS = [
  {
    label: 'E-commerce Platform',
    text: 'Build an e-commerce platform with product recommendations, order processing, and customer support chatbot for 5000 monthly users',
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  {
    label: 'HR Onboarding',
    text: 'Create an employee onboarding system with document verification, training modules, and automated workflows for 500 new hires per month',
    color: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  {
    label: 'Financial Services',
    text: 'Develop a loan processing system with credit analysis, document verification, and compliance checks for 2000 applications monthly',
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
  {
    label: 'Healthcare Portal',
    text: 'Build a patient portal with appointment scheduling, medical records processing, and symptom analysis for 3000 patients per month',
    color: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
  },
  {
    label: 'Education Platform',
    text: 'Create a learning management system with course recommendations, automated grading, and student support for 10000 students',
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  },
  {
    label: 'Real Estate CRM',
    text: 'Design a property management system with lead qualification, document processing, and virtual tours for 1500 monthly inquiries',
    color: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  },
];

export default function ChatInput({ onSubmit, isAnalyzing }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !isAnalyzing) {
      onSubmit(input);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePillClick = (text: string) => {
    setInput(text);
    onSubmit(text);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
          <Sparkles className="h-5 w-5 stroke-black" />
        </div>
        <h2 className="text-lg font-semibold text-black">Describe Your Business Scenario</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Enter your business requirements and our AI agents will analyze and provide cost estimates for different deployment scenarios.
      </p>
      <div className="relative mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Example: We need a customer onboarding system with document processing, email verification, and a chatbot for 1000 users per month..."
          className="w-full min-h-[160px] p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none text-sm text-black placeholder-gray-400"
          disabled={isAnalyzing}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isAnalyzing}
          className="absolute bottom-4 right-4 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Analyze scenario"
        >
          {isAnalyzing ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_SCENARIOS.map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => handlePillClick(scenario.text)}
              disabled={isAnalyzing}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${scenario.color} disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-current`}
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
