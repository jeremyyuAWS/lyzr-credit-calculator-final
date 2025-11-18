import { useState, useEffect } from 'react';
import { Play, Sparkles, MessageCircle, Settings2, X } from 'lucide-react';
import type { WorkflowConfig } from './BusinessSlidersTab';

interface Message {
  role: 'ai' | 'user';
  content: string;
  delay?: number;
}

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  conversation: Message[];
  finalConfig: Partial<WorkflowConfig>;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'customer-support',
    name: '🎧 Customer Support Bot',
    description: 'High-volume email & chat support with knowledge base',
    color: 'from-blue-400 to-cyan-500',
    icon: '🎧',
    conversation: [
      {
        role: 'ai',
        content: "Hi! I'm your AI pricing assistant. I'll help you calculate costs for your customer support bot. Let me ask a few questions to understand your needs.",
        delay: 800,
      },
      {
        role: 'ai',
        content: "First, how many customer emails do you handle per month?",
        delay: 1500,
      },
      {
        role: 'user',
        content: "We get about 5,000 customer emails monthly.",
        delay: 1200,
      },
      {
        role: 'ai',
        content: "Perfect! And how about live chat conversations?",
        delay: 1000,
      },
      {
        role: 'user',
        content: "Around 3,000 chat sessions per month.",
        delay: 1200,
      },
      {
        role: 'ai',
        content: "Great! Do you need the AI to search through documentation or knowledge bases?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Yes, we have a product documentation knowledge base.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Understood! I'm setting up RAG lookups for knowledge base searches. How many product documents do you process monthly?",
        delay: 1500,
      },
      {
        role: 'user',
        content: "About 500 documents.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "✨ Perfect! I've configured your Customer Support Bot with:\n\n• 5,000 emails/month\n• 3,000 chats/month\n• 2 RAG lookups per interaction\n• 1 knowledge base\n• Medium complexity workflow\n\nCalculating your costs now...",
        delay: 2000,
      },
    ],
    finalConfig: {
      workflow_description: 'Customer support automation with document processing',
      recommended_model: 'claude-3-5-sonnet',
      complexity_tier: 'Medium',
      complexity_level: 'moderate',
      selected_model: 'claude-3-5-sonnet',
      emails_per_month: 5000,
      chats_per_month: 3000,
      voice_calls_per_month: 0,
      docs_per_month: 500,
      workflow_triggers_per_day: 100,
      steps_per_workflow: 5,
      agent_interactions: 3,
      rag_lookups: 2,
      tool_calls: 1,
      db_queries: 3,
      memory_ops: 4,
      reflection_runs: 1,
      web_fetches: 0,
      deep_crawl_pages: 0,
      num_agents: 3,
      num_knowledge_bases: 1,
      num_tools: 2,
      num_eval_suites: 0,
      avg_input_tokens: 2000,
      avg_output_tokens: 800,
      inter_agent_tokens: 300,
    },
  },
  {
    id: 'sales-automation',
    name: '💼 Sales Outreach Agent',
    description: 'Automated lead qualification and follow-ups',
    color: 'from-purple-400 to-pink-500',
    icon: '💼',
    conversation: [
      {
        role: 'ai',
        content: "Hello! Let's configure your Sales Outreach Agent. I'll help you estimate costs based on your sales volume.",
        delay: 800,
      },
      {
        role: 'ai',
        content: "How many leads do you process per month?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "We handle about 2,000 leads monthly.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Great! How many automated emails do you send for follow-ups?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Around 8,000 personalized emails.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Do you need CRM integration for lead tracking?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Yes, we use Salesforce.",
        delay: 900,
      },
      {
        role: 'ai',
        content: "Perfect! I'm adding database queries for CRM sync. Do you want the AI to do research on companies before reaching out?",
        delay: 1500,
      },
      {
        role: 'user',
        content: "Yes, company research would be helpful.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "✨ Excellent! Your Sales Outreach Agent includes:\n\n• 2,000 leads/month\n• 8,000 personalized emails\n• CRM integration (DB queries)\n• Web research for company insights\n• 2 agents (Qualifier & Outreach)\n\nLet me calculate your pricing...",
        delay: 2000,
      },
    ],
    finalConfig: {
      workflow_description: 'Sales automation with lead qualification and personalized outreach',
      recommended_model: 'gpt-4o',
      complexity_tier: 'Medium',
      complexity_level: 'moderate',
      selected_model: 'gpt-4o',
      emails_per_month: 8000,
      chats_per_month: 500,
      voice_calls_per_month: 0,
      docs_per_month: 200,
      workflow_triggers_per_day: 90,
      steps_per_workflow: 4,
      agent_interactions: 2,
      rag_lookups: 1,
      tool_calls: 2,
      db_queries: 5,
      memory_ops: 3,
      reflection_runs: 0,
      web_fetches: 1,
      deep_crawl_pages: 0,
      num_agents: 2,
      num_knowledge_bases: 0,
      num_tools: 3,
      num_eval_suites: 0,
      avg_input_tokens: 1500,
      avg_output_tokens: 600,
      inter_agent_tokens: 250,
    },
  },
  {
    id: 'content-moderator',
    name: '🛡️ Content Moderator',
    description: 'Real-time content moderation at scale',
    color: 'from-red-400 to-orange-500',
    icon: '🛡️',
    conversation: [
      {
        role: 'ai',
        content: "Hi! Let's set up your Content Moderator. I'll help calculate costs for your moderation needs.",
        delay: 800,
      },
      {
        role: 'ai',
        content: "How many user-generated posts do you moderate daily?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "About 10,000 posts per day.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "That's high volume! Do you need multi-language support?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Yes, we support English, Spanish, and French.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Got it! Should the AI escalate to humans for sensitive content?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Yes, with confidence scores.",
        delay: 900,
      },
      {
        role: 'ai',
        content: "Perfect! I'm adding reflection runs for confidence scoring. Do you need to store moderation history?",
        delay: 1500,
      },
      {
        role: 'user',
        content: "Yes, for compliance audits.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "✨ Your Content Moderator is configured:\n\n• 10,000 posts/day (~220K/month)\n• Multi-language detection\n• Reflection for confidence scoring\n• Database logging for audits\n• Low complexity, high volume\n\nCalculating costs for scale...",
        delay: 2000,
      },
    ],
    finalConfig: {
      workflow_description: 'High-volume content moderation with multi-language support',
      recommended_model: 'gpt-4o-mini',
      complexity_tier: 'Low',
      complexity_level: 'simple',
      selected_model: 'gpt-4o-mini',
      emails_per_month: 0,
      chats_per_month: 0,
      voice_calls_per_month: 0,
      docs_per_month: 0,
      workflow_triggers_per_day: 10000,
      steps_per_workflow: 3,
      agent_interactions: 1,
      rag_lookups: 0,
      tool_calls: 0,
      db_queries: 2,
      memory_ops: 1,
      reflection_runs: 1,
      web_fetches: 0,
      deep_crawl_pages: 0,
      num_agents: 1,
      num_knowledge_bases: 0,
      num_tools: 1,
      num_eval_suites: 0,
      avg_input_tokens: 400,
      avg_output_tokens: 150,
      inter_agent_tokens: 0,
    },
  },
  {
    id: 'hr-assistant',
    name: '👥 HR Assistant',
    description: 'Employee onboarding and policy Q&A',
    color: 'from-green-400 to-emerald-500',
    icon: '👥',
    conversation: [
      {
        role: 'ai',
        content: "Welcome! Let's configure your HR Assistant. I'll help you estimate costs for employee support.",
        delay: 800,
      },
      {
        role: 'ai',
        content: "How many employees do you onboard monthly?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Around 50 new employees per month.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Great! How many HR-related questions does the team ask?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "About 1,500 questions via chat.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Do you have company policies and handbooks the AI should reference?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Yes, we have comprehensive HR documentation.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Perfect! Setting up knowledge base for policy searches. Do you need to track employee interactions?",
        delay: 1500,
      },
      {
        role: 'user',
        content: "Yes, for engagement analytics.",
        delay: 900,
      },
      {
        role: 'ai',
        content: "✨ Your HR Assistant is ready:\n\n• 50 onboarding workflows/month\n• 1,500 policy Q&A chats\n• Knowledge base for HR docs\n• Memory for personalized responses\n• Medium complexity\n\nCalculating your investment...",
        delay: 2000,
      },
    ],
    finalConfig: {
      workflow_description: 'HR assistant for onboarding and policy questions',
      recommended_model: 'claude-3-5-sonnet',
      complexity_tier: 'Medium',
      complexity_level: 'moderate',
      selected_model: 'claude-3-5-sonnet',
      emails_per_month: 200,
      chats_per_month: 1500,
      voice_calls_per_month: 0,
      docs_per_month: 100,
      workflow_triggers_per_day: 20,
      steps_per_workflow: 4,
      agent_interactions: 2,
      rag_lookups: 3,
      tool_calls: 1,
      db_queries: 2,
      memory_ops: 5,
      reflection_runs: 0,
      web_fetches: 0,
      deep_crawl_pages: 0,
      num_agents: 2,
      num_knowledge_bases: 1,
      num_tools: 1,
      num_eval_suites: 0,
      avg_input_tokens: 1800,
      avg_output_tokens: 700,
      inter_agent_tokens: 200,
    },
  },
  {
    id: 'research-agent',
    name: '🔬 Research Agent',
    description: 'Web research and competitive intelligence',
    color: 'from-indigo-400 to-blue-500',
    icon: '🔬',
    conversation: [
      {
        role: 'ai',
        content: "Hello! Let's build your Research Agent. I'll help calculate costs for automated research workflows.",
        delay: 800,
      },
      {
        role: 'ai',
        content: "How many research reports do you need per month?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "About 100 comprehensive reports.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Excellent! How many web pages should the AI analyze per report?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Around 20-30 pages per report.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "That's deep research! Should the AI extract structured data from websites?",
        delay: 1200,
      },
      {
        role: 'user',
        content: "Yes, we need structured competitive intelligence.",
        delay: 1000,
      },
      {
        role: 'ai',
        content: "Perfect! I'm adding deep crawl capabilities. Do you want the AI to cross-reference multiple sources?",
        delay: 1500,
      },
      {
        role: 'user',
        content: "Yes, with citation tracking.",
        delay: 900,
      },
      {
        role: 'ai',
        content: "✨ Your Research Agent includes:\n\n• 100 reports/month\n• 2,500 web pages crawled\n• Deep data extraction\n• Multi-agent collaboration\n• High complexity workflow\n\nCalculating premium research costs...",
        delay: 2000,
      },
    ],
    finalConfig: {
      workflow_description: 'Automated research with web crawling and competitive intelligence',
      recommended_model: 'gpt-4o',
      complexity_tier: 'High',
      complexity_level: 'complex',
      selected_model: 'gpt-4o',
      emails_per_month: 100,
      chats_per_month: 200,
      voice_calls_per_month: 0,
      docs_per_month: 100,
      workflow_triggers_per_day: 15,
      steps_per_workflow: 8,
      agent_interactions: 4,
      rag_lookups: 4,
      tool_calls: 3,
      db_queries: 4,
      memory_ops: 6,
      reflection_runs: 2,
      web_fetches: 5,
      deep_crawl_pages: 25,
      num_agents: 4,
      num_knowledge_bases: 1,
      num_tools: 4,
      num_eval_suites: 0,
      avg_input_tokens: 3500,
      avg_output_tokens: 1500,
      inter_agent_tokens: 500,
    },
  },
];

interface AutoplayDemoProps {
  onComplete: (config: Partial<WorkflowConfig>) => void;
  onClose: () => void;
}

export default function AutoplayDemo({ onComplete, onClose }: AutoplayDemoProps) {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSliders, setShowSliders] = useState(false);

  useEffect(() => {
    if (selectedScenario && isPlaying && currentMessageIndex < selectedScenario.conversation.length) {
      const currentMessage = selectedScenario.conversation[currentMessageIndex];
      const delay = currentMessage.delay || 1000;

      const timer = setTimeout(() => {
        setMessages(prev => [...prev, currentMessage]);
        setCurrentMessageIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (selectedScenario && currentMessageIndex >= selectedScenario.conversation.length && isPlaying) {
      setTimeout(() => {
        onComplete(selectedScenario.finalConfig);
        setIsPlaying(false);
      }, 1500);
    }
  }, [selectedScenario, isPlaying, currentMessageIndex]);

  function startDemo(scenario: DemoScenario) {
    setSelectedScenario(scenario);
    setMessages([]);
    setCurrentMessageIndex(0);
    setIsPlaying(true);
    setShowSliders(false);
  }

  function skipDemo() {
    if (selectedScenario) {
      setMessages(selectedScenario.conversation);
      setCurrentMessageIndex(selectedScenario.conversation.length);
      onComplete(selectedScenario.finalConfig);
      setTimeout(() => {
        backToScenarios();
      }, 1000);
    }
  }

  function backToScenarios() {
    setSelectedScenario(null);
    setMessages([]);
    setCurrentMessageIndex(0);
    setIsPlaying(false);
    setShowSliders(false);
  }

  if (selectedScenario && isPlaying) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className={`bg-gradient-to-r ${selectedScenario.color} p-6 rounded-t-2xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{selectedScenario.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedScenario.name}</h3>
                  <p className="text-white/90 text-sm mt-1">{selectedScenario.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 stroke-white" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'ai'
                      ? 'bg-gray-100 text-black'
                      : `bg-gradient-to-r ${selectedScenario.color} text-white`
                  }`}
                >
                  {message.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 stroke-black" />
                      <span className="text-xs font-semibold text-gray-600">AI Assistant</span>
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isPlaying && currentMessageIndex < selectedScenario.conversation.length && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isPlaying && currentMessageIndex >= selectedScenario.conversation.length && (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">✅</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-black mb-1">Configuration Applied!</h4>
                    <p className="text-sm text-gray-700">
                      Your calculator has been updated with this scenario's settings. Try another scenario or close to see the results.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  {currentMessageIndex}/{selectedScenario.conversation.length} messages
                </div>
                <button
                  onClick={backToScenarios}
                  className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                >
                  ← Back to Scenarios
                </button>
              </div>
              {isPlaying ? (
                <button
                  onClick={skipDemo}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Skip to Results →
                </button>
              ) : (
                <button
                  onClick={backToScenarios}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all text-sm font-medium shadow-lg"
                >
                  Try Another Scenario
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Interactive Pricing Demos</h2>
              <p className="text-gray-300">
                Watch our AI agent ask questions and configure your perfect workflow
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 stroke-white" />
            </button>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => startDemo(scenario)}
              className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-black hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${scenario.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{scenario.icon}</div>
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${scenario.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    <Play className="h-4 w-4 stroke-white" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-black mb-2 group-hover:text-black transition-colors">
                  {scenario.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {scenario.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MessageCircle className="h-3 w-3" />
                  <span>{scenario.conversation.length} interactions</span>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-black to-gray-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex items-start gap-3">
            <Settings2 className="h-5 w-5 stroke-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-black mb-1">How it works</h4>
              <p className="text-sm text-gray-600">
                Select a scenario above to see how our AI agent asks intelligent follow-up questions to understand your business needs. The agent will automatically configure the optimal sliders and settings for your use case.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
