import { X, MessageCircle, Wrench, Coins, Package, Calculator, Users, Zap } from 'lucide-react';
import type { CostBreakdown } from '../../lib/costEngine';
import type { WorkflowConfig } from '../BusinessSlidersTab';
import { creditsToUSD } from '../../lib/costEngine';

interface ExplainMyPriceProps {
  costBreakdown: CostBreakdown;
  workflow: WorkflowConfig;
  onClose: () => void;
  formatCurrency?: (usdAmount: number, decimals?: number) => string;
}

export default function ExplainMyPrice({ costBreakdown, workflow, onClose, formatCurrency = (amt) => `$${amt.toFixed(2)}` }: ExplainMyPriceProps) {
  const creditPrice = 0.008;

  const totalTransactions =
    workflow.emails_per_month +
    workflow.chats_per_month +
    workflow.voice_calls_per_month +
    workflow.workflow_triggers_per_day * 22;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-black">Your Cost Breakdown</h2>
            <p className="text-sm text-gray-600 mt-1">Detailed receipt showing what powers your AI agents</p>
          </div>
          <button
            onClick={onClose}
            className="p-0 hover:opacity-70 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5 stroke-black" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. AI Processing Costs */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-blue-900">AI Processing</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              This covers the computational cost of your AI agents understanding questions and generating responses.
            </p>

            <div className="space-y-3 text-sm">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Understanding Requests</p>
                    <p className="text-xs text-gray-600">Processing incoming questions/data</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(workflow.avg_input_tokens * 0.003 / 1000, 4)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Generating Responses</p>
                    <p className="text-xs text-gray-600">Creating helpful, accurate answers</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(workflow.avg_output_tokens * 0.015 / 1000, 4)}</p>
                </div>
              </div>

              {workflow.num_agents > 1 && (
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">Agent Coordination</p>
                      <p className="text-xs text-gray-600">Multiple agents working together</p>
                    </div>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(costBreakdown.inter_agent_cost * creditPrice, 4)}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-100 rounded-lg p-4 mt-3">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-blue-900">AI Processing Total</p>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCurrency(costBreakdown.token_cost_with_handling_fee * creditPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Smart Features */}
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold text-purple-900">Smart Features & Capabilities</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Advanced capabilities that make your agents more powerful and knowledgeable.
            </p>

            <div className="space-y-2 text-sm">
              {workflow.rag_lookups > 0 && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Knowledge Base Searches</p>
                      <p className="text-xs text-gray-600">{workflow.rag_lookups} searches per interaction</p>
                    </div>
                    <span className="font-bold text-purple-700">
                      {formatCurrency(workflow.rag_lookups * 0.05 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.tool_calls > 0 && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">External Integrations</p>
                      <p className="text-xs text-gray-600">{workflow.tool_calls} API calls per interaction</p>
                    </div>
                    <span className="font-bold text-purple-700">
                      {formatCurrency(workflow.tool_calls * 1.0 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.db_queries > 0 && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Database Lookups</p>
                      <p className="text-xs text-gray-600">{workflow.db_queries} queries per interaction</p>
                    </div>
                    <span className="font-bold text-purple-700">
                      {formatCurrency(workflow.db_queries * 0.02 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.memory_ops > 0 && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Conversation Memory</p>
                      <p className="text-xs text-gray-600">{workflow.memory_ops} memory recalls per interaction</p>
                    </div>
                    <span className="font-bold text-purple-700">
                      {formatCurrency(workflow.memory_ops * 0.005 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.reflection_runs > 0 && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Quality Checks</p>
                      <p className="text-xs text-gray-600">{workflow.reflection_runs} accuracy verifications</p>
                    </div>
                    <span className="font-bold text-purple-700">
                      {formatCurrency(workflow.reflection_runs * 0.05 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.web_fetches > 0 && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Real-Time Web Data</p>
                      <p className="text-xs text-gray-600">{workflow.web_fetches} web pages fetched</p>
                    </div>
                    <span className="font-bold text-purple-700">
                      {formatCurrency(workflow.web_fetches * 0.1 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.deep_crawl_pages > 0 && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Deep Research</p>
                      <p className="text-xs text-gray-600">{workflow.deep_crawl_pages} pages analyzed in depth</p>
                    </div>
                    <span className="font-bold text-purple-700">
                      {formatCurrency(workflow.deep_crawl_pages * 0.25 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-purple-100 rounded-lg p-4 mt-3">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-purple-900">Smart Features Total</p>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCurrency(costBreakdown.feature_cost * creditPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. One-Time Setup */}
          <div className="bg-green-50 rounded-xl border border-green-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-bold text-green-900">Initial Setup (One-Time)</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Setting up your agents and their knowledge - you only pay this once.
            </p>

            <div className="space-y-2 text-sm">
              {workflow.num_agents > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">AI Agent Configuration</p>
                      <p className="text-xs text-gray-600">{workflow.num_agents} {workflow.num_agents === 1 ? 'agent' : 'agents'}</p>
                    </div>
                    <span className="font-bold text-green-700">
                      {formatCurrency(workflow.num_agents * 0.05 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.num_knowledge_bases > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Knowledge Base Setup</p>
                      <p className="text-xs text-gray-600">{workflow.num_knowledge_bases} {workflow.num_knowledge_bases === 1 ? 'database' : 'databases'}</p>
                    </div>
                    <span className="font-bold text-green-700">
                      {formatCurrency(workflow.num_knowledge_bases * 1.0 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.num_tools > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Integration Setup</p>
                      <p className="text-xs text-gray-600">{workflow.num_tools} {workflow.num_tools === 1 ? 'integration' : 'integrations'}</p>
                    </div>
                    <span className="font-bold text-green-700">
                      {formatCurrency(workflow.num_tools * 0.1 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}
              {workflow.num_eval_suites > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Quality Testing Setup</p>
                      <p className="text-xs text-gray-600">{workflow.num_eval_suites} {workflow.num_eval_suites === 1 ? 'test suite' : 'test suites'}</p>
                    </div>
                    <span className="font-bold text-green-700">
                      {formatCurrency(workflow.num_eval_suites * 2.0 * creditPrice)}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-green-100 rounded-lg p-4 mt-3">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-green-900">Setup Total (One-Time)</p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(costBreakdown.setup_costs * creditPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Your Monthly Costs */}
          <div className="bg-gradient-to-br from-black to-gray-800 rounded-xl border border-gray-700 p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-6 w-6" />
              <h3 className="text-xl font-bold">Your Total Costs</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-300 mb-1">Per Customer Interaction</p>
                <p className="text-3xl font-bold">{formatCurrency(costBreakdown.credits_per_transaction * creditPrice, 4)}</p>
                <p className="text-xs text-gray-400 mt-1">Each time a customer interacts with your AI</p>
              </div>

              <div className="pt-4 border-t border-gray-600">
                <p className="text-sm text-gray-300 mb-1">Expected Monthly Volume</p>
                <p className="text-2xl font-bold">{totalTransactions.toLocaleString()} interactions</p>
                <p className="text-xs text-gray-400 mt-1">Based on your configured volumes</p>
              </div>

              <div className="pt-4 border-t border-gray-600">
                <p className="text-sm text-gray-300 mb-2">Monthly Cost</p>
                <p className="text-3xl font-bold">{formatCurrency(costBreakdown.monthly_credits * creditPrice)}</p>
                <p className="text-xs text-gray-400 mt-1">Recurring monthly charge</p>
              </div>

              <div className="pt-4 border-t border-gray-600">
                <p className="text-sm text-gray-300 mb-2">Annual Cost</p>
                <p className="text-3xl font-bold">{formatCurrency(costBreakdown.annual_credits * creditPrice)}</p>
                <p className="text-xs text-gray-400 mt-1">12 months of service</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
