import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Mail, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UseCase {
  id: string;
  template_name: string;
  template_description: string;
  icon: string;
  default_capabilities: string[];
}

interface Capability {
  id: string;
  capability_key: string;
  capability_name: string;
  description: string;
  category: string;
  credit_multiplier: number;
}

interface VolumeInputs {
  emails_per_month: number;
  rag_queries_per_month: number;
  db_lookups_per_month: number;
  voice_minutes_per_month: number;
}

export default function GuidedSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);

  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<string>>(new Set());
  const [volumes, setVolumes] = useState<VolumeInputs>({
    emails_per_month: 1000,
    rag_queries_per_month: 500,
    db_lookups_per_month: 1000,
    voice_minutes_per_month: 0,
  });

  const [costSummary, setCostSummary] = useState({ credits: 0, cost: 0 });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [sliderFeedback, setSliderFeedback] = useState('');

  useEffect(() => {
    loadData();
    trackEvent('guided_setup_started', {});
  }, []);

  async function loadData() {
    const [useCasesResult, capabilitiesResult] = await Promise.all([
      supabase.from('use_case_templates').select('*').order('sort_order'),
      supabase.from('agent_capabilities').select('*').order('sort_order'),
    ]);

    if (useCasesResult.data) setUseCases(useCasesResult.data);
    if (capabilitiesResult.data) setCapabilities(capabilitiesResult.data);
  }

  async function trackEvent(eventType: string, eventData: any) {
    await supabase.from('user_flow_analytics').insert({
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
    });
  }

  function selectUseCase(useCase: UseCase) {
    setSelectedUseCase(useCase);
    setSelectedCapabilities(new Set(useCase.default_capabilities));
    trackEvent('use_case_selected', { use_case_id: useCase.id, use_case_name: useCase.template_name });
    setCurrentStep(2);
  }

  function toggleCapability(key: string) {
    const newSet = new Set(selectedCapabilities);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedCapabilities(newSet);
    trackEvent('capability_toggled', { capability_key: key, selected: newSet.has(key) });
  }

  function handleVolumeChange(key: keyof VolumeInputs, value: number) {
    setVolumes({ ...volumes, [key]: value });

    const labels: Record<keyof VolumeInputs, string> = {
      emails_per_month: 'emails',
      rag_queries_per_month: 'RAG queries',
      db_lookups_per_month: 'DB lookups',
      voice_minutes_per_month: 'voice minutes',
    };

    setSliderFeedback(`Nice — ${value.toLocaleString()} ${labels[key]} selected.`);
    setTimeout(() => setSliderFeedback(''), 2000);

    trackEvent('volume_changed', { volume_type: key, value });
  }

  function calculateCost() {
    const baseCreditsPerAction = 40;
    let totalCredits = 0;

    const capabilityMultiplier = Array.from(selectedCapabilities).reduce((acc, key) => {
      const cap = capabilities.find(c => c.capability_key === key);
      return acc * (cap?.credit_multiplier || 1.0);
    }, 1.0);

    totalCredits += volumes.emails_per_month * baseCreditsPerAction * capabilityMultiplier * 0.3;
    totalCredits += volumes.rag_queries_per_month * baseCreditsPerAction * capabilityMultiplier * 1.2;
    totalCredits += volumes.db_lookups_per_month * baseCreditsPerAction * capabilityMultiplier * 0.5;
    totalCredits += volumes.voice_minutes_per_month * baseCreditsPerAction * capabilityMultiplier * 2.0;

    const monthlyCost = totalCredits * 0.01;

    return { credits: Math.round(totalCredits), cost: parseFloat(monthlyCost.toFixed(2)) };
  }

  function goToStep(step: number) {
    if (step === 4) {
      const summary = calculateCost();
      setCostSummary(summary);
      trackEvent('cost_calculated', { credits: summary.credits, cost: summary.cost });
    }
    setCurrentStep(step);
    trackEvent('step_completed', { step, step_name: getStepName(step) });
  }

  function getStepName(step: number) {
    const names = ['', 'Use Case', 'Capabilities', 'Volumes', 'Summary'];
    return names[step];
  }

  async function handleEmailCapture() {
    if (!userEmail.trim()) return;

    const summary = calculateCost();

    await supabase.from('guided_setup_sessions').insert({
      session_id: sessionId,
      use_case_id: selectedUseCase?.id,
      selected_capabilities: Array.from(selectedCapabilities),
      volume_inputs: volumes,
      cost_summary: summary,
      user_email: userEmail,
      completed_at: new Date().toISOString(),
    });

    trackEvent('email_captured', { email: userEmail, cost: summary.cost });

    alert('Quote sent! Check your email for your personalized cost analysis.');
    setShowEmailModal(false);
  }

  const canProceed = (step: number) => {
    if (step === 1) return selectedUseCase !== null;
    if (step === 2) return selectedCapabilities.size > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-black">Guided Setup</h1>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email me this quote
            </button>
          </div>

          <div className="flex items-center gap-3">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep === step
                      ? 'bg-black text-white'
                      : currentStep > step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                <span className="text-sm font-medium text-gray-700">{getStepName(step)}</span>
                {step < 4 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-2">Select a Use Case Template</h2>
            <p className="text-gray-600 mb-6">Choose the closest match to get started quickly</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {useCases.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => selectUseCase(useCase)}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="text-4xl mb-3">{useCase.icon}</div>
                  <h3 className="text-lg font-bold text-black mb-2">{useCase.template_name}</h3>
                  <p className="text-sm text-gray-700">{useCase.template_description}</p>
                  <div className="mt-4 text-sm text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                    Select →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-2">Select Agent Capabilities</h2>
            <p className="text-gray-600 mb-6">What should your agent be able to do?</p>

            <div className="space-y-3">
              {capabilities.map((capability) => (
                <label
                  key={capability.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedCapabilities.has(capability.capability_key)}
                    onChange={() => toggleCapability(capability.capability_key)}
                    className="mt-1 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black">{capability.capability_name}</span>
                      <div className="relative group/tooltip">
                        <Info className="h-4 w-4 text-gray-400" />
                        <div className="absolute left-0 top-6 hidden group-hover/tooltip:block bg-black text-white text-xs rounded-lg px-3 py-2 w-64 z-10">
                          {capability.description}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{capability.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => goToStep(1)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => goToStep(3)}
                disabled={!canProceed(2)}
                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-2">Select Usage Volumes</h2>
            <p className="text-gray-600 mb-6">Estimate your monthly usage</p>

            {sliderFeedback && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-in fade-in duration-200">
                {sliderFeedback}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold text-black">Emails per month</label>
                  <span className="text-gray-600 font-mono">{volumes.emails_per_month.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="100"
                  value={volumes.emails_per_month}
                  onChange={(e) => handleVolumeChange('emails_per_month', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>20,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold text-black">RAG queries per month</label>
                  <span className="text-gray-600 font-mono">{volumes.rag_queries_per_month.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={volumes.rag_queries_per_month}
                  onChange={(e) => handleVolumeChange('rag_queries_per_month', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>10,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold text-black">DB lookups per month</label>
                  <span className="text-gray-600 font-mono">{volumes.db_lookups_per_month.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="100"
                  value={volumes.db_lookups_per_month}
                  onChange={(e) => handleVolumeChange('db_lookups_per_month', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>20,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold text-black">Voice minutes per month</label>
                  <span className="text-gray-600 font-mono">{volumes.voice_minutes_per_month.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="50"
                  value={volumes.voice_minutes_per_month}
                  onChange={(e) => handleVolumeChange('voice_minutes_per_month', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>3,000</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => goToStep(2)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => goToStep(4)}
                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                See Cost Summary
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-2">Your Cost Summary</h2>
            <p className="text-gray-600 mb-8">Based on your configuration</p>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-8 mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="text-sm font-semibold text-green-700 uppercase mb-2">Total Credits / Month</div>
                  <div className="text-5xl font-bold text-black">{costSummary.credits.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-green-700 uppercase mb-2">Estimated Cost / Month</div>
                  <div className="text-5xl font-bold text-black">${costSummary.cost.toLocaleString()}</div>
                </div>
              </div>

              {costSummary.cost * 12 > 5000 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Potential Savings Available</p>
                  <p className="text-sm text-blue-700">
                    Your estimated annual cost is ${(costSummary.cost * 12).toLocaleString()}.
                    Talk to us about volume discounts.
                  </p>
                </div>
              )}
            </div>

            <details className="mb-6">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-black">
                View advanced breakdown →
              </summary>
              <div className="mt-4 space-y-3 pl-4">
                <div className="text-sm">
                  <span className="font-semibold">Use Case:</span> {selectedUseCase?.template_name}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Capabilities:</span> {Array.from(selectedCapabilities).join(', ')}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Volume Assumptions:</span>
                  <ul className="ml-4 mt-1 list-disc">
                    <li>{volumes.emails_per_month.toLocaleString()} emails/month</li>
                    <li>{volumes.rag_queries_per_month.toLocaleString()} RAG queries/month</li>
                    <li>{volumes.db_lookups_per_month.toLocaleString()} DB lookups/month</li>
                    <li>{volumes.voice_minutes_per_month.toLocaleString()} voice minutes/month</li>
                  </ul>
                </div>
              </div>
            </details>

            <div className="flex items-center justify-between">
              <button
                onClick={() => goToStep(3)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-lg font-semibold"
              >
                <Mail className="h-5 w-5" />
                Send My Quote
              </button>
            </div>
          </div>
        )}
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEmailModal(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold text-black mb-2">
              Send yourself this personalized cost analysis
            </h3>
            <p className="text-gray-600 mb-6">
              We'll send you a clean PDF + configuration summary.
            </p>

            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="your.email@company.com"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={handleEmailCapture}
                disabled={!userEmail.trim()}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Send Quote
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
