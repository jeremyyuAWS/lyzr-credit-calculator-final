export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  industry: string;
  conversation: Array<{
    role: 'ai' | 'user';
    message: string;
    delay?: number;
  }>;
  extractedData: {
    workflow_description: string;
    complexity_tier: string;
    emails_per_month: number;
    chats_per_month: number;
    voice_calls_per_month: number;
    docs_per_month: number;
    workflow_triggers_per_day: number;
    rag_queries: number;
    tool_calls: number;
    db_queries: number;
    memory_ops: number;
    reflection_runs: number;
    web_fetches: number;
    deep_crawl_pages: number;
    estimated_input_tokens: number;
    estimated_output_tokens: number;
    inter_agent_tokens: number;
    num_agents: number;
    requires_knowledge_base: boolean;
  };
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'ecommerce-support',
    title: 'E-Commerce Customer Support',
    description: 'Automated support for online retail',
    color: 'from-blue-500 to-cyan-500',
    icon: '🛒',
    industry: 'E-Commerce',
    conversation: [
      {
        role: 'ai',
        message: "Hello! I'm here to help you estimate the cost of your AI workflow. Let's start by understanding what you're building. What business problem or workflow are you trying to automate with AI?",
        delay: 800,
      },
      {
        role: 'user',
        message: 'I run an e-commerce store and want to automate customer support with AI agents that can handle order inquiries, returns, and product questions.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "Excellent! E-commerce customer support is a great use case for AI automation. Let me understand the volume first. How many customer inquiries do you handle per month across all channels?",
        delay: 1200,
      },
      {
        role: 'user',
        message: 'We get about 5,000 emails per month and 3,000 live chat conversations.',
        delay: 1200,
      },
      {
        role: 'ai',
        message: "Got it - 8,000 monthly interactions. Now, let's talk about complexity. When a customer asks about an order, does the AI need to look up information from your database?",
        delay: 1100,
      },
      {
        role: 'user',
        message: 'Yes, it needs to check order status in our database, look up product details from our catalog, and reference our return policy.',
        delay: 1300,
      },
      {
        role: 'ai',
        message: "Perfect! That means knowledge base queries for policies and database calls for real-time order data. On average, how many times would the AI need to look up information per customer conversation?",
        delay: 1200,
      },
      {
        role: 'user',
        message: 'Usually 2-3 lookups per conversation - checking order status, product details, and maybe shipping info.',
        delay: 1300,
      },
      {
        role: 'ai',
        message: "Understood. Now for the workflow complexity - are these simple FAQ-style responses, or do they require multi-step processes like processing a return or initiating a refund?",
        delay: 1200,
      },
      {
        role: 'user',
        message: 'About 60% are simple FAQs, but 40% require multi-step workflows - processing returns, updating orders, or escalating to human agents.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "That's helpful! For the complex workflows, will the AI need to use external tools or integrations? For example, updating order management systems or triggering refund processes?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Yes, it needs to integrate with Shopify for order updates, Stripe for refunds, and our CRM for escalations.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "Great! One more question - how important is response quality and safety? Do you need the AI to validate responses before sending them to customers?",
        delay: 1200,
      },
      {
        role: 'user',
        message: "It's moderately important. We'd like some basic validation to catch potential errors, but speed is also a priority.",
        delay: 1300,
      },
      {
        role: 'ai',
        message: "Perfect! I've gathered all the key information. Based on your requirements:\n\n• 8,000 monthly interactions (5K email, 3K chat)\n• 2-3 database/knowledge lookups per interaction\n• Moderate complexity with 40% requiring multi-step workflows\n• Integration with Shopify, Stripe, and CRM\n• Basic response validation\n\nI've calculated your estimated costs across different tiers. Click 'Proceed to Calculator' to see the detailed breakdown and adjust parameters.",
        delay: 1800,
      },
    ],
    extractedData: {
      workflow_description: 'E-commerce customer support automation with order tracking, product inquiries, and return processing',
      complexity_tier: 'moderate',
      emails_per_month: 5000,
      chats_per_month: 3000,
      voice_calls_per_month: 0,
      docs_per_month: 0,
      workflow_triggers_per_day: 267,
      rag_queries: 2,
      tool_calls: 3,
      db_queries: 4,
      memory_ops: 1,
      reflection_runs: 0,
      web_fetches: 0,
      deep_crawl_pages: 0,
      estimated_input_tokens: 800,
      estimated_output_tokens: 400,
      inter_agent_tokens: 200,
      num_agents: 2,
      requires_knowledge_base: true,
    },
  },
  {
    id: 'healthcare-triage',
    title: 'Healthcare Patient Triage',
    description: 'AI-powered patient intake & triage',
    color: 'from-green-500 to-emerald-500',
    icon: '🏥',
    industry: 'Healthcare',
    conversation: [
      {
        role: 'ai',
        message: "Hello! I'm here to help you estimate the cost of your AI workflow. Let's start by understanding what you're building. What business problem or workflow are you trying to automate with AI?",
        delay: 800,
      },
      {
        role: 'user',
        message: 'We need an AI system to help triage patients, collect initial symptoms, and route them to the appropriate healthcare provider.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "A healthcare triage system - that's critical work! Patient safety and accuracy are paramount. Let's start with volume. How many patient interactions would this system handle per month?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'About 2,000 voice calls per month and 1,500 chat conversations on our patient portal.',
        delay: 1200,
      },
      {
        role: 'ai',
        message: "3,500 monthly interactions with voice support - excellent. Now, voice calls will use more resources than text. What's the average duration of these triage calls?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Most calls are 3-5 minutes, but some complex cases can go up to 10 minutes.',
        delay: 1200,
      },
      {
        role: 'ai',
        message: "Understood. Now for the clinical logic - does the AI need to access medical protocols, patient history, or clinical guidelines to make triage decisions?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Yes, it needs to reference our symptom protocols, access patient medical history, check provider availability, and verify insurance eligibility.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "That's 4 different types of lookups per patient interaction. How many times on average would the AI need to query these systems during a single triage?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Probably 4-6 queries - checking symptoms against protocols, reviewing patient history, finding available providers, and verifying coverage.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "Got it. Now, how sophisticated does the clinical decision-making need to be? Simple rule-based triage or complex multi-factor risk assessment?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Very complex. The AI needs to evaluate multiple symptoms simultaneously, assess urgency levels, consider patient history, and make nuanced routing decisions.',
        delay: 1600,
      },
      {
        role: 'ai',
        message: "Given the medical nature, how important is quality assurance? Do you need the AI to self-review its recommendations or have a confidence threshold?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Critical. We need the AI to validate its reasoning, flag low-confidence cases for human review, and ensure HIPAA compliance in all responses.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "Excellent safety measures. Will you need multiple specialized agents? For example, one for symptom assessment, another for provider routing, and one for scheduling?",
        delay: 1400,
      },
      {
        role: 'user',
        message: 'Yes, we envision 3 agents: a Triage Specialist, a Provider Matcher, and a Scheduling Coordinator working together.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "Perfect! I have everything I need. Your healthcare triage system requires:\n\n• 3,500 monthly interactions (2K voice, 1.5K chat)\n• 4-6 data lookups per interaction (protocols, history, scheduling, insurance)\n• Complex multi-factor clinical decision-making\n• Multi-agent coordination (3 specialized agents)\n• High safety requirements with validation and confidence scoring\n\nClick 'Proceed to Calculator' to see your detailed cost breakdown across tiers.",
        delay: 1900,
      },
    ],
    extractedData: {
      workflow_description: 'Healthcare patient triage with symptom assessment, urgency evaluation, and intelligent provider routing',
      complexity_tier: 'complex',
      emails_per_month: 0,
      chats_per_month: 1500,
      voice_calls_per_month: 2000,
      docs_per_month: 0,
      workflow_triggers_per_day: 117,
      rag_queries: 4,
      tool_calls: 5,
      db_queries: 6,
      memory_ops: 3,
      reflection_runs: 2,
      web_fetches: 0,
      deep_crawl_pages: 0,
      estimated_input_tokens: 1200,
      estimated_output_tokens: 600,
      inter_agent_tokens: 400,
      num_agents: 3,
      requires_knowledge_base: true,
    },
  },
  {
    id: 'financial-advisor',
    title: 'Financial Advisory Assistant',
    description: 'AI financial planning & investment advice',
    color: 'from-purple-500 to-pink-500',
    icon: '💰',
    industry: 'Financial Services',
    conversation: [
      {
        role: 'ai',
        message: "Hello! I'm here to help you estimate the cost of your AI workflow. Let's start by understanding what you're building. What business problem or workflow are you trying to automate with AI?",
        delay: 800,
      },
      {
        role: 'user',
        message: 'We want to build an AI financial advisor that helps clients with investment planning, portfolio analysis, and financial goal setting.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "Financial advisory AI - a sophisticated use case! Let's break this down. First, how many client interactions do you expect per month?",
        delay: 1200,
      },
      {
        role: 'user',
        message: 'Around 1,000 email consultations and 800 live chat sessions monthly.',
        delay: 1200,
      },
      {
        role: 'ai',
        message: "1,800 monthly interactions. Now, will clients need to upload documents like tax returns, brokerage statements, or 401k summaries for analysis?",
        delay: 1200,
      },
      {
        role: 'user',
        message: 'Yes, about 500 documents per month - tax forms, investment statements, and financial reports.',
        delay: 1300,
      },
      {
        role: 'ai',
        message: "Good! Document processing is resource-intensive. How many pages on average per document?",
        delay: 1100,
      },
      {
        role: 'user',
        message: 'Tax returns are usually 15-20 pages, brokerage statements 5-10 pages. Average probably 12 pages per document.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "Got it - substantial document processing. Now, for the advisory logic, will the AI need to access real-time market data, historical performance, or economic indicators?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Yes, it needs current market prices, historical trends, interest rates, and sector performance data.',
        delay: 1300,
      },
      {
        role: 'ai',
        message: "That means web fetching for real-time data. How many external API calls or web lookups per client interaction?",
        delay: 1200,
      },
      {
        role: 'user',
        message: 'Probably 6-8 lookups - checking current holdings, market data, historical performance, and comparing to benchmarks.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "Understood. Now for complexity - are we talking simple budgeting advice or sophisticated portfolio optimization with tax strategies?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Very sophisticated. Portfolio optimization, tax-loss harvesting, rebalancing recommendations, and personalized strategies based on risk tolerance.',
        delay: 1600,
      },
      {
        role: 'ai',
        message: "Given the financial stakes, how important is accuracy validation? Should the AI verify its calculations and recommendations?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Extremely important. We need double-checking of calculations, compliance verification, and confidence scoring on recommendations.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "Makes sense for financial advice. Would you benefit from multiple specialized agents? Perhaps a Portfolio Analyst, Tax Strategist, Risk Assessor, and Compliance Checker?",
        delay: 1400,
      },
      {
        role: 'user',
        message: 'Yes! That multi-agent approach would provide comprehensive advisory services. 4 agents working together sounds right.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "Perfect! I've gathered comprehensive details. Your financial advisory system needs:\n\n• 1,800 monthly interactions (1K email, 800 chat)\n• 500 documents/month with ~12 pages each\n• 6-8 real-time market data lookups per interaction\n• Complex portfolio optimization and tax strategies\n• 4 specialized agents with orchestration\n• High accuracy with validation and compliance checks\n\nClick 'Proceed to Calculator' for your detailed cost analysis.",
        delay: 2000,
      },
    ],
    extractedData: {
      workflow_description: 'Financial advisory AI with portfolio optimization, tax planning, and personalized investment strategies',
      complexity_tier: 'complex',
      emails_per_month: 1000,
      chats_per_month: 800,
      voice_calls_per_month: 0,
      docs_per_month: 500,
      workflow_triggers_per_day: 60,
      rag_queries: 5,
      tool_calls: 6,
      db_queries: 5,
      memory_ops: 4,
      reflection_runs: 3,
      web_fetches: 7,
      deep_crawl_pages: 0,
      estimated_input_tokens: 2000,
      estimated_output_tokens: 1000,
      inter_agent_tokens: 600,
      num_agents: 4,
      requires_knowledge_base: true,
    },
  },
  {
    id: 'hr-recruitment',
    title: 'HR Recruitment Assistant',
    description: 'Automated candidate screening & scheduling',
    color: 'from-orange-500 to-red-500',
    icon: '👔',
    industry: 'Human Resources',
    conversation: [
      {
        role: 'ai',
        message: "Hello! I'm here to help you estimate the cost of your AI workflow. Let's start by understanding what you're building. What business problem or workflow are you trying to automate with AI?",
        delay: 800,
      },
      {
        role: 'user',
        message: 'We need an AI recruitment assistant to screen resumes, schedule interviews, and answer candidate questions.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "HR recruitment automation - very practical! How many candidates do you process monthly? Include resume reviews, email exchanges, and chats.",
        delay: 1200,
      },
      {
        role: 'user',
        message: 'We review about 500 resumes per month and have 1,000 email exchanges and 600 chat conversations with candidates.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "Got it! Does the AI need to parse resumes, check candidate qualifications against job requirements, and access your interview scheduling system?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Yes, it needs to extract resume data, match skills to job descriptions, and integrate with our calendar for scheduling.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "How sophisticated should the matching be? Simple keyword matching or nuanced skill assessment with cultural fit analysis?",
        delay: 1200,
      },
      {
        role: 'user',
        message: 'Moderately complex. It should understand skill equivalencies, assess experience levels, and identify strong candidate matches.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "Perfect! I've captured everything for your HR recruitment system. With 2,100 monthly interactions, document processing, and intelligent matching, I've calculated your costs. Click 'Proceed to Calculator' to review.",
        delay: 1600,
      },
    ],
    extractedData: {
      workflow_description: 'HR recruitment automation with resume screening, candidate matching, and interview scheduling',
      complexity_tier: 'moderate',
      emails_per_month: 1000,
      chats_per_month: 600,
      voice_calls_per_month: 0,
      docs_per_month: 500,
      workflow_triggers_per_day: 70,
      rag_queries: 3,
      tool_calls: 4,
      db_queries: 5,
      memory_ops: 2,
      reflection_runs: 1,
      web_fetches: 2,
      deep_crawl_pages: 0,
      estimated_input_tokens: 1000,
      estimated_output_tokens: 500,
      inter_agent_tokens: 300,
      num_agents: 2,
      requires_knowledge_base: true,
    },
  },
  {
    id: 'legal-contract',
    title: 'Legal Contract Analysis',
    description: 'AI-powered contract review & insights',
    color: 'from-indigo-500 to-blue-500',
    icon: '⚖️',
    industry: 'Legal',
    conversation: [
      {
        role: 'ai',
        message: "Hello! I'm here to help you estimate the cost of your AI workflow. Let's start by understanding what you're building. What business problem or workflow are you trying to automate with AI?",
        delay: 800,
      },
      {
        role: 'user',
        message: 'We want AI to review legal contracts, identify potential risks, and extract key terms for our law firm.',
        delay: 1400,
      },
      {
        role: 'ai',
        message: "Contract analysis AI - sophisticated application! How many contracts do you need to review per month?",
        delay: 1100,
      },
      {
        role: 'user',
        message: 'About 200 contracts monthly, ranging from simple NDAs to complex commercial agreements.',
        delay: 1300,
      },
      {
        role: 'ai',
        message: "Understood! Does the AI need to compare contracts against templates, check for compliance with regulations, and flag unusual clauses?",
        delay: 1400,
      },
      {
        role: 'user',
        message: 'Yes, it needs to reference our clause library, check regulatory requirements, and identify deviations from standard terms.',
        delay: 1500,
      },
      {
        role: 'ai',
        message: "How deep should the analysis go? Surface-level keyword scanning or comprehensive legal reasoning with precedent analysis?",
        delay: 1300,
      },
      {
        role: 'user',
        message: 'Very sophisticated. Deep legal reasoning, risk assessment, comparison with similar past contracts, and detailed recommendations.',
        delay: 1600,
      },
      {
        role: 'ai',
        message: "Excellent! I've gathered everything for your legal contract analysis system. With 200 monthly contracts requiring deep analysis and comprehensive review, I've prepared your cost estimate. Click 'Proceed to Calculator' to see the details.",
        delay: 1700,
      },
    ],
    extractedData: {
      workflow_description: 'Legal contract analysis with risk assessment, clause extraction, and compliance checking',
      complexity_tier: 'complex',
      emails_per_month: 0,
      chats_per_month: 0,
      voice_calls_per_month: 0,
      docs_per_month: 200,
      workflow_triggers_per_day: 7,
      rag_queries: 8,
      tool_calls: 4,
      db_queries: 6,
      memory_ops: 5,
      reflection_runs: 4,
      web_fetches: 3,
      deep_crawl_pages: 0,
      estimated_input_tokens: 3000,
      estimated_output_tokens: 1500,
      inter_agent_tokens: 800,
      num_agents: 3,
      requires_knowledge_base: true,
    },
  },
];

export function getScenarioById(id: string): DemoScenario | undefined {
  return demoScenarios.find(s => s.id === id);
}
