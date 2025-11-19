/**
 * Report Intelligence Engine
 *
 * Generates contextual summaries, narratives, and optimization recommendations
 * for business reports based on workflow configuration and cost analysis.
 */

import type { WorkflowConfig } from '../components/BusinessSlidersTab';
import type { CostBreakdown } from './costEngine';

export interface AgentBreakdownItem {
  agent_name: string;
  agent_role: string;
  call_count: number;
  trigger_reason: string;
  token_usage: number;
  cost_usd: number;
}

export interface OptimizationSuggestion {
  category: 'cost' | 'performance' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potential_savings_usd?: number;
  potential_savings_percentage?: number;
}

export interface WorkflowStep {
  step_number: number;
  action: string;
  channel: string;
  agent_involved?: string;
  features_used: string[];
}

/**
 * Generate executive summary with use-case overview, complexity, and key insights
 */
export function generateExecutiveSummary(
  workflow: WorkflowConfig,
  costBreakdown: CostBreakdown
): string {
  // Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
  const creditPrice = 0.01;
  const monthlyCostUSD = costBreakdown.monthly_credits * creditPrice;
  const perTransactionUSD = costBreakdown.credits_per_transaction * creditPrice;

  const totalTransactions =
    workflow.emails_per_month +
    workflow.chats_per_month +
    workflow.voice_calls_per_month +
    (workflow.workflow_triggers_per_day * 22);

  const complexityDescriptions = {
    'simple': 'straightforward, single-step',
    'moderate': 'multi-step with moderate decision-making',
    'complex': 'sophisticated, multi-layered',
    'enterprise': 'highly complex, mission-critical'
  };

  const modelDescriptions: Record<string, string> = {
    'gpt-4o': 'GPT-4o (advanced reasoning)',
    'gpt-4o-mini': 'GPT-4o Mini (balanced efficiency)',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet (premium intelligence)',
    'claude-3-5-haiku': 'Claude 3.5 Haiku (fast responses)',
    'gemini-2-0-flash': 'Gemini 2.0 Flash (cost-effective)',
  };

  const topCostDriver = determineTopCostDriver(workflow, costBreakdown);

  return `This AI workflow powers a ${complexityDescriptions[workflow.complexity_level] || workflow.complexity_level} business process handling ${totalTransactions.toLocaleString()} interactions monthly across ${getActiveChannelCount(workflow)} channels.

Using ${modelDescriptions[workflow.selected_model] || workflow.selected_model} for optimal ${workflow.complexity_level === 'enterprise' || workflow.complexity_level === 'complex' ? 'reasoning depth' : 'cost-performance balance'}, the system processes an average of ${workflow.avg_input_tokens.toLocaleString()} input tokens and generates ${workflow.avg_output_tokens.toLocaleString()} output tokens per interaction.

**Monthly Investment:** $${monthlyCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | **Per Interaction:** $${perTransactionUSD.toFixed(4)} | **Annual Projection:** $${(monthlyCostUSD * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

**Primary Cost Driver:** ${topCostDriver} — representing the largest component of your operational expenses.`;
}

/**
 * Generate workflow narrative describing the step-by-step process
 */
export function generateWorkflowNarrative(workflow: WorkflowConfig): string {
  const steps: string[] = [];
  let stepNum = 1;

  if (workflow.emails_per_month > 0) {
    steps.push(`**Step ${stepNum++}:** Customer initiates contact via email (${workflow.emails_per_month.toLocaleString()}/month)`);
    steps.push(`   • AI agent analyzes email intent and context`);
    if (workflow.rag_lookups > 0) {
      steps.push(`   • Knowledge base searched ${workflow.rag_lookups}x to retrieve relevant information`);
    }
  }

  if (workflow.chats_per_month > 0) {
    steps.push(`**Step ${stepNum++}:** Customer engages in chat conversation (${workflow.chats_per_month.toLocaleString()}/month)`);
    steps.push(`   • Real-time AI responses with ${workflow.avg_output_tokens} tokens generated`);
    if (workflow.memory_ops > 0) {
      steps.push(`   • Conversation history recalled ${workflow.memory_ops}x for context continuity`);
    }
  }

  if (workflow.voice_calls_per_month > 0) {
    steps.push(`**Step ${stepNum++}:** Voice interaction handling (${workflow.voice_calls_per_month.toLocaleString()}/month)`);
    steps.push(`   • Speech-to-text processing and intent understanding`);
  }

  if (workflow.workflow_triggers_per_day > 0) {
    steps.push(`**Step ${stepNum++}:** Automated workflow triggers (${workflow.workflow_triggers_per_day}/day)`);
    steps.push(`   • Backend process automation without human intervention`);
  }

  if (workflow.tool_calls > 0) {
    steps.push(`**Step ${stepNum++}:** External system integration`);
    steps.push(`   • ${workflow.tool_calls} API calls to connected tools and services`);
  }

  if (workflow.db_queries > 0) {
    steps.push(`**Step ${stepNum++}:** Data retrieval and validation`);
    steps.push(`   • ${workflow.db_queries} database queries for real-time information`);
  }

  if (workflow.reflection_runs > 0) {
    steps.push(`**Step ${stepNum++}:** Quality assurance checkpoint`);
    steps.push(`   • ${workflow.reflection_runs} accuracy verifications before responding`);
  }

  return steps.join('\n');
}

/**
 * Generate agent breakdown showing which agents handle what
 */
export function generateAgentBreakdown(
  workflow: WorkflowConfig,
  costBreakdown: CostBreakdown
): AgentBreakdownItem[] {
  // Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
  const creditPrice = 0.01;
  const agents: AgentBreakdownItem[] = [];
  const totalCost = costBreakdown.credits_per_transaction * creditPrice;

  if (workflow.num_agents === 1) {
    agents.push({
      agent_name: 'Primary AI Agent',
      agent_role: 'Handles all customer interactions and workflow processing',
      call_count: 1,
      trigger_reason: 'Every customer interaction',
      token_usage: workflow.avg_input_tokens + workflow.avg_output_tokens,
      cost_usd: totalCost * 0.8,
    });
  } else if (workflow.num_agents > 1) {
    const orchestratorCost = totalCost * 0.3;
    const perAgentCost = (totalCost * 0.7) / (workflow.num_agents - 1);

    agents.push({
      agent_name: 'Orchestrator Agent',
      agent_role: 'Routes requests and coordinates specialized agents',
      call_count: 1,
      trigger_reason: 'Every interaction - initial triage and routing',
      token_usage: Math.floor(workflow.avg_input_tokens * 0.3),
      cost_usd: orchestratorCost,
    });

    if (workflow.emails_per_month > 0) {
      agents.push({
        agent_name: 'Email Processing Agent',
        agent_role: 'Analyzes email content, sentiment, and intent',
        call_count: Math.ceil(workflow.emails_per_month / (workflow.emails_per_month + workflow.chats_per_month + workflow.voice_calls_per_month)),
        trigger_reason: 'Email interactions detected',
        token_usage: Math.floor(workflow.avg_input_tokens * 0.25),
        cost_usd: perAgentCost,
      });
    }

    if (workflow.chats_per_month > 0 || workflow.voice_calls_per_month > 0) {
      agents.push({
        agent_name: 'Conversation Agent',
        agent_role: 'Real-time chat and voice interaction handling',
        call_count: Math.ceil((workflow.chats_per_month + workflow.voice_calls_per_month) / (workflow.emails_per_month + workflow.chats_per_month + workflow.voice_calls_per_month)),
        trigger_reason: 'Chat and voice interactions',
        token_usage: Math.floor(workflow.avg_output_tokens * 0.4),
        cost_usd: perAgentCost,
      });
    }

    if (workflow.rag_lookups > 0 || workflow.num_knowledge_bases > 0) {
      agents.push({
        agent_name: 'Knowledge Retrieval Agent',
        agent_role: 'Searches knowledge bases for relevant information',
        call_count: workflow.rag_lookups || 1,
        trigger_reason: 'When domain-specific information is needed',
        token_usage: Math.floor(workflow.avg_input_tokens * 0.15),
        cost_usd: perAgentCost,
      });
    }

    if (workflow.tool_calls > 0 || workflow.num_tools > 0) {
      agents.push({
        agent_name: 'Integration Agent',
        agent_role: 'Manages external API calls and tool integrations',
        call_count: workflow.tool_calls || 1,
        trigger_reason: 'When external system access is required',
        token_usage: Math.floor(workflow.avg_input_tokens * 0.1),
        cost_usd: perAgentCost,
      });
    }
  }

  return agents;
}

/**
 * Generate model selection rationale explaining why this model was chosen
 */
export function generateModelRationale(
  workflow: WorkflowConfig,
  costBreakdown: CostBreakdown
): string {
  const modelReasonings: Record<string, { strengths: string; bestFor: string; alternatives: string }> = {
    'gpt-4o': {
      strengths: 'Exceptional reasoning depth, handles complex multi-step logic, strong code understanding',
      bestFor: 'Complex enterprise workflows requiring sophisticated decision-making',
      alternatives: 'For simpler tasks, GPT-4o Mini offers 80% of the capability at 1/10th the cost'
    },
    'gpt-4o-mini': {
      strengths: 'Excellent balance of intelligence and efficiency, fast responses, cost-effective',
      bestFor: 'Standard business workflows with moderate complexity',
      alternatives: 'For maximum reasoning depth, GPT-4o provides enhanced analytical capabilities'
    },
    'claude-3-5-sonnet': {
      strengths: 'Superior contextual understanding, natural conversational flow, strong analytical reasoning',
      bestFor: 'Customer-facing applications requiring empathetic, nuanced responses',
      alternatives: 'Claude 3.5 Haiku offers similar quality with 3x faster speed for time-sensitive use cases'
    },
    'claude-3-5-haiku': {
      strengths: 'Fastest responses in class, maintains high quality, extremely cost-efficient',
      bestFor: 'High-volume interactions where speed and cost matter',
      alternatives: 'Claude 3.5 Sonnet provides deeper reasoning for complex analytical tasks'
    },
    'gemini-2-0-flash': {
      strengths: 'Most cost-effective option, excellent for structured tasks, reliable performance',
      bestFor: 'Budget-conscious deployments with predictable, structured workflows',
      alternatives: 'GPT-4o Mini offers enhanced reasoning for similar cost profiles'
    },
  };

  const reasoning = modelReasonings[workflow.selected_model] || {
    strengths: 'Balanced performance and cost characteristics',
    bestFor: 'General-purpose AI workflows',
    alternatives: 'Consider alternative models based on specific requirements'
  };

  const contextWindowAnalysis = workflow.avg_input_tokens > 8000
    ? `This workflow's ${workflow.avg_input_tokens.toLocaleString()}-token average input requires a model with substantial context window capacity. ${workflow.selected_model} handles this efficiently without truncation.`
    : `With an average input of ${workflow.avg_input_tokens.toLocaleString()} tokens, most modern models handle this comfortably. ${workflow.selected_model} was selected for its ${workflow.complexity_level === 'simple' ? 'cost efficiency' : 'reasoning capabilities'}.`;

  return `**Selected Model:** ${workflow.selected_model}

**Why This Model:**
${reasoning.strengths}

**Optimal Use Case:**
${reasoning.bestFor}

**Context Window Analysis:**
${contextWindowAnalysis}

**Alternative Consideration:**
${reasoning.alternatives}`;
}

/**
 * Generate optimization suggestions to reduce costs or improve performance
 */
export function generateOptimizationSuggestions(
  workflow: WorkflowConfig,
  costBreakdown: CostBreakdown
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  // Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
  const creditPrice = 0.01;
  const monthlyCost = costBreakdown.monthly_credits * creditPrice;

  // Check for over-tokenization
  if (workflow.avg_input_tokens > 4000) {
    const potentialSavings = monthlyCost * 0.15;
    suggestions.push({
      category: 'cost',
      priority: 'high',
      title: 'Optimize Prompt Length',
      description: `Your average input of ${workflow.avg_input_tokens.toLocaleString()} tokens is above optimal range. Consider using dynamic prompt trimming and context summarization to reduce token usage by 15-25% without sacrificing quality.`,
      potential_savings_usd: potentialSavings,
      potential_savings_percentage: 15,
    });
  }

  // Check for excessive RAG lookups
  if (workflow.rag_lookups > 3) {
    const potentialSavings = workflow.rag_lookups * 0.05 * creditPrice * (workflow.emails_per_month + workflow.chats_per_month);
    suggestions.push({
      category: 'efficiency',
      priority: 'medium',
      title: 'Reduce Knowledge Base Queries',
      description: `With ${workflow.rag_lookups} RAG lookups per interaction, consider implementing intelligent caching and query consolidation. Many queries may be retrieving similar information.`,
      potential_savings_usd: potentialSavings,
      potential_savings_percentage: Math.round((potentialSavings / monthlyCost) * 100),
    });
  }

  // Check for model over-specification
  if (workflow.selected_model === 'gpt-4o' && workflow.complexity_level === 'simple') {
    const currentCost = costBreakdown.token_cost_with_handling_fee * creditPrice;
    const potentialSavings = currentCost * 0.70;
    suggestions.push({
      category: 'cost',
      priority: 'high',
      title: 'Consider More Cost-Effective Model',
      description: `For simple workflows, GPT-4o Mini provides excellent quality at 1/10th the cost. This could reduce your AI processing costs by up to 70% with minimal quality impact.`,
      potential_savings_usd: potentialSavings * (workflow.emails_per_month + workflow.chats_per_month + workflow.voice_calls_per_month),
      potential_savings_percentage: 70,
    });
  }

  // Check for excessive tool calls
  if (workflow.tool_calls > 2) {
    suggestions.push({
      category: 'performance',
      priority: 'medium',
      title: 'Consolidate API Integrations',
      description: `${workflow.tool_calls} external API calls per interaction add latency and cost. Consider batching requests or pre-fetching common data to reduce integration overhead.`,
      potential_savings_usd: workflow.tool_calls * 1.0 * creditPrice * (workflow.emails_per_month + workflow.chats_per_month) * 0.4,
      potential_savings_percentage: Math.round((workflow.tool_calls - 2) / workflow.tool_calls * 100),
    });
  }

  // Check for multi-agent efficiency
  if (workflow.num_agents > 3 && costBreakdown.inter_agent_cost > 0) {
    suggestions.push({
      category: 'efficiency',
      priority: 'low',
      title: 'Streamline Agent Architecture',
      description: `With ${workflow.num_agents} agents, consider consolidating overlapping capabilities. Some specialized agents may be mergeable without sacrificing functionality.`,
      potential_savings_usd: costBreakdown.inter_agent_cost * creditPrice * 0.3,
      potential_savings_percentage: 5,
    });
  }

  // Volume-based optimization
  const totalTransactions = workflow.emails_per_month + workflow.chats_per_month + workflow.voice_calls_per_month;
  if (totalTransactions > 10000) {
    suggestions.push({
      category: 'cost',
      priority: 'high',
      title: 'Explore Volume Discounting',
      description: `At ${totalTransactions.toLocaleString()} monthly interactions, you qualify for enterprise volume pricing tiers. Contact your account executive to discuss custom pricing that could save 15-30% on your monthly costs.`,
      potential_savings_usd: monthlyCost * 0.20,
      potential_savings_percentage: 20,
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Helper: Determine the top cost driver
 */
function determineTopCostDriver(workflow: WorkflowConfig, costBreakdown: CostBreakdown): string {
  // Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
  const creditPrice = 0.01;
  const tokenCost = costBreakdown.token_cost_with_handling_fee * creditPrice;
  const featureCost = costBreakdown.feature_cost * creditPrice;
  const interAgentCost = costBreakdown.inter_agent_cost * creditPrice;

  if (tokenCost > featureCost && tokenCost > interAgentCost) {
    return 'AI Model Processing (token consumption)';
  } else if (featureCost > tokenCost && featureCost > interAgentCost) {
    if (workflow.rag_lookups > workflow.tool_calls) {
      return 'Knowledge Base Searches';
    } else if (workflow.tool_calls > 0) {
      return 'External API Integrations';
    } else {
      return 'Smart Features Usage';
    }
  } else {
    return 'Multi-Agent Coordination';
  }
}

/**
 * Helper: Get count of active channels
 */
function getActiveChannelCount(workflow: WorkflowConfig): number {
  let count = 0;
  if (workflow.emails_per_month > 0) count++;
  if (workflow.chats_per_month > 0) count++;
  if (workflow.voice_calls_per_month > 0) count++;
  if (workflow.workflow_triggers_per_day > 0) count++;
  return count;
}
