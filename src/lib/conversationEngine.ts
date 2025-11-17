/**
 * Conversation Engine - Autoplay business-friendly discovery
 *
 * Asks tailored follow-up questions to understand cost drivers
 * Extracts the 14 critical dimensions from PRD Section 5.2
 */

export interface ConversationState {
  currentStep: number;
  responses: Record<string, any>;
  extractedData: ExtractedWorkflowData;
}

export interface ExtractedWorkflowData {
  // 1. Business Workflow
  workflow_description: string;
  trigger_events: string[];
  user_personas: string[];
  success_criteria: string[];

  // 2. Channels
  channels: ('email' | 'chat' | 'voice' | 'documents')[];

  // 3. Workflow Type
  workflow_type: string;

  // 4. Cognitive Requirements
  cognitive_requirements: string[];

  // 5. Knowledge Requirements
  requires_knowledge_base: boolean;
  rag_retrieval_volume: number;

  // 6. External Integrations
  external_integrations: string[];

  // 7. Agent Count
  num_agents: number;
  needs_orchestration: boolean;

  // 8. Token Estimation
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  inter_agent_tokens: number;

  // 9. Feature Usage
  rag_queries: number;
  db_queries: number;
  tool_calls: number;
  memory_ops: number;
  reflection_runs: number;
  web_fetches: number;
  deep_crawl_pages: number;

  // 10. Document Processing
  docs_per_month: number;
  pages_per_doc: number;

  // 11. Voice Usage
  voice_calls_per_month: number;

  // 12. Classification Requirements
  needs_intent_detection: boolean;
  needs_entity_extraction: boolean;

  // 13. Complexity Tier
  complexity_tier: 'Low' | 'Medium' | 'High';

  // 14. Volume Estimates
  emails_per_month: number;
  chats_per_month: number;
  workflow_triggers_per_day: number;
}

export interface ConversationQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'number' | 'multiselect';
  options?: string[];
  followUp?: (response: any, state: ConversationState) => boolean;
  extract: (response: any, state: ConversationState) => Partial<ExtractedWorkflowData>;
}

// Business-friendly conversation flow
export const conversationFlow: ConversationQuestion[] = [
  // Question 1: Understanding the business problem
  {
    id: 'business_problem',
    question: "Let's start by understanding what you're building. What business problem or workflow are you trying to automate with AI?",
    type: 'text',
    extract: (response) => ({
      workflow_description: response,
    }),
  },

  // Question 2: Communication channels
  {
    id: 'channels',
    question: "Great! How will your customers or employees interact with this AI system? (Select all that apply)",
    type: 'multiselect',
    options: ['Email', 'Chat/Messaging', 'Voice Calls', 'Document Upload', 'API/Integration'],
    extract: (response) => {
      const channelMap: Record<string, ('email' | 'chat' | 'voice' | 'documents')> = {
        'Email': 'email',
        'Chat/Messaging': 'chat',
        'Voice Calls': 'voice',
        'Document Upload': 'documents',
      };
      return {
        channels: response.map((r: string) => channelMap[r]).filter(Boolean),
      };
    },
  },

  // Question 3: Monthly volume
  {
    id: 'monthly_volume',
    question: "How many interactions do you expect per month? Think about emails, chats, or requests your system will handle.",
    type: 'number',
    extract: (response, state) => {
      const total = parseInt(response) || 5000;
      const channels = state.extractedData.channels || [];

      // Distribute volume across channels intelligently
      if (channels.includes('email') && channels.includes('chat')) {
        return {
          emails_per_month: Math.floor(total * 0.6),
          chats_per_month: Math.floor(total * 0.4),
        };
      } else if (channels.includes('email')) {
        return { emails_per_month: total };
      } else if (channels.includes('chat')) {
        return { chats_per_month: total };
      }
      return { workflow_triggers_per_day: Math.floor(total / 22) };
    },
  },

  // Question 4: Workflow complexity
  {
    id: 'workflow_steps',
    question: "Think about the process end-to-end. Roughly how many steps or decisions does your AI need to make for each request?",
    type: 'choice',
    options: [
      '1-3 steps (Simple, straightforward tasks)',
      '4-6 steps (Moderate complexity with some logic)',
      '7+ steps (Complex workflows with multiple decision points)',
    ],
    extract: (response) => {
      if (response.includes('1-3')) {
        return { complexity_tier: 'Low' as const };
      } else if (response.includes('4-6')) {
        return { complexity_tier: 'Medium' as const };
      }
      return { complexity_tier: 'High' as const };
    },
  },

  // Question 5: Knowledge base needs
  {
    id: 'knowledge_base',
    question: "Does your AI need to reference company knowledge, documents, or databases to answer questions?",
    type: 'choice',
    options: [
      'No - It can work with just the conversation context',
      'Yes - It needs to look up information occasionally (1-2 lookups per request)',
      'Yes - It needs frequent knowledge lookups (3+ lookups per request)',
    ],
    extract: (response) => {
      if (response.includes('No')) {
        return {
          requires_knowledge_base: false,
          rag_queries: 0,
        };
      } else if (response.includes('occasionally')) {
        return {
          requires_knowledge_base: true,
          rag_queries: 2,
        };
      }
      return {
        requires_knowledge_base: true,
        rag_queries: 5,
      };
    },
  },

  // Question 6: External integrations
  {
    id: 'integrations',
    question: "Does your AI need to connect with external tools or systems? (e.g., CRM, payment systems, databases, APIs)",
    type: 'choice',
    options: [
      'No external integrations needed',
      'Yes - 1-2 simple integrations (like checking a database)',
      'Yes - Multiple complex integrations (CRM, ERP, payment systems, etc.)',
    ],
    extract: (response) => {
      if (response.includes('No')) {
        return {
          tool_calls: 0,
          db_queries: 0,
        };
      } else if (response.includes('1-2')) {
        return {
          tool_calls: 1,
          db_queries: 3,
        };
      }
      return {
        tool_calls: 3,
        db_queries: 5,
      };
    },
  },

  // Question 7: Team/agent requirements
  {
    id: 'agent_needs',
    question: "Think about the different skills or roles needed. Do you need:",
    type: 'choice',
    options: [
      'A single AI agent to handle everything',
      'A small team (2-3 specialized agents working together)',
      'A full team (4+ agents, each with specific expertise)',
    ],
    extract: (response) => {
      if (response.includes('single')) {
        return {
          num_agents: 1,
          needs_orchestration: false,
          inter_agent_tokens: 0,
        };
      } else if (response.includes('small')) {
        return {
          num_agents: 3,
          needs_orchestration: true,
          inter_agent_tokens: 500,
        };
      }
      return {
        num_agents: 6,
        needs_orchestration: true,
        inter_agent_tokens: 1000,
      };
    },
  },

  // Question 8: Document processing
  {
    id: 'document_processing',
    question: "Will your AI need to read and process documents? If so, approximately how many documents per month?",
    type: 'number',
    extract: (response) => {
      const docs = parseInt(response) || 0;
      return {
        docs_per_month: docs,
        pages_per_doc: docs > 0 ? 5 : 0,
      };
    },
  },

  // Question 9: Safety and quality requirements
  {
    id: 'safety_requirements',
    question: "How important is it that responses are checked for safety, accuracy, and quality before being sent to users?",
    type: 'choice',
    options: [
      'Low priority - Speed is more important',
      'Moderate - Some quality checks are good',
      'High priority - Every response must be thoroughly validated',
    ],
    extract: (response) => {
      if (response.includes('Low')) {
        return { reflection_runs: 0 };
      } else if (response.includes('Moderate')) {
        return { reflection_runs: 1 };
      }
      return { reflection_runs: 2 };
    },
  },

  // Question 10: Response length expectations
  {
    id: 'response_length',
    question: "What kind of responses will your AI generate?",
    type: 'choice',
    options: [
      'Short and concise (1-2 sentences, like quick answers or confirmations)',
      'Medium length (a paragraph, like email responses or summaries)',
      'Long and detailed (multiple paragraphs, like reports or comprehensive answers)',
    ],
    extract: (response) => {
      if (response.includes('Short')) {
        return {
          estimated_input_tokens: 1000,
          estimated_output_tokens: 200,
        };
      } else if (response.includes('Medium')) {
        return {
          estimated_input_tokens: 2000,
          estimated_output_tokens: 800,
        };
      }
      return {
        estimated_input_tokens: 4000,
        estimated_output_tokens: 1500,
      };
    },
  },
];

// Generate AI's next question
export function getNextQuestion(state: ConversationState): ConversationQuestion | null {
  if (state.currentStep >= conversationFlow.length) {
    return null;
  }
  return conversationFlow[state.currentStep];
}

// Process user response and extract data
export function processResponse(
  response: any,
  state: ConversationState
): ConversationState {
  const currentQuestion = conversationFlow[state.currentStep];
  if (!currentQuestion) return state;

  const extracted = currentQuestion.extract(response, state);

  return {
    currentStep: state.currentStep + 1,
    responses: {
      ...state.responses,
      [currentQuestion.id]: response,
    },
    extractedData: {
      ...state.extractedData,
      ...extracted,
    },
  };
}

// Initialize conversation state
export function initializeConversation(): ConversationState {
  return {
    currentStep: 0,
    responses: {},
    extractedData: {
      workflow_description: '',
      trigger_events: [],
      user_personas: [],
      success_criteria: [],
      channels: [],
      workflow_type: '',
      cognitive_requirements: [],
      requires_knowledge_base: false,
      rag_retrieval_volume: 0,
      external_integrations: [],
      num_agents: 1,
      needs_orchestration: false,
      estimated_input_tokens: 2000,
      estimated_output_tokens: 800,
      inter_agent_tokens: 0,
      rag_queries: 0,
      db_queries: 0,
      tool_calls: 0,
      memory_ops: 3,
      reflection_runs: 1,
      web_fetches: 0,
      deep_crawl_pages: 0,
      docs_per_month: 0,
      pages_per_doc: 0,
      voice_calls_per_month: 0,
      needs_intent_detection: true,
      needs_entity_extraction: true,
      complexity_tier: 'Medium',
      emails_per_month: 5000,
      chats_per_month: 3000,
      workflow_triggers_per_day: 100,
    },
  };
}

// Generate final summary
export function generateWorkflowSummary(data: ExtractedWorkflowData): string {
  const channelNames = data.channels.join(', ');
  return `${data.workflow_description} This system handles approximately ${data.emails_per_month + data.chats_per_month} interactions per month via ${channelNames}. It uses ${data.num_agents} AI agent${data.num_agents > 1 ? 's' : ''} with ${data.complexity_tier.toLowerCase()} complexity.`;
}
