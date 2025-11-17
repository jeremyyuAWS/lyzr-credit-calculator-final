import { useState } from 'react';
import { X, Mail, Download, Check, Loader, FileText, TrendingDown, Lightbulb, Users, Zap, DollarSign, AlertCircle } from 'lucide-react';
import type { WorkflowConfig } from './BusinessSlidersTab';
import type { CostBreakdown } from '../lib/costEngine';
import { supabase } from '../lib/supabase';
import {
  generateExecutiveSummary,
  generateWorkflowNarrative,
  generateAgentBreakdown,
  generateModelRationale,
  generateOptimizationSuggestions,
  type AgentBreakdownItem,
  type OptimizationSuggestion,
} from '../lib/reportIntelligence';

interface PremiumBusinessReportProps {
  workflow: WorkflowConfig;
  costBreakdown: CostBreakdown;
  sessionId?: string;
  onClose: () => void;
}

export default function PremiumBusinessReport({
  workflow,
  costBreakdown,
  sessionId,
  onClose,
}: PremiumBusinessReportProps) {
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const creditPrice = 0.008;
  const monthlyCostUSD = costBreakdown.monthly_credits * creditPrice;
  const annualCostUSD = costBreakdown.annual_credits * creditPrice;
  const perTransactionUSD = costBreakdown.credits_per_transaction * creditPrice;

  const totalTransactions =
    workflow.emails_per_month +
    workflow.chats_per_month +
    workflow.voice_calls_per_month +
    workflow.workflow_triggers_per_day * 22;

  // Generate report content
  const executiveSummary = generateExecutiveSummary(workflow, costBreakdown);
  const workflowNarrative = generateWorkflowNarrative(workflow);
  const agentBreakdown = generateAgentBreakdown(workflow, costBreakdown);
  const modelRationale = generateModelRationale(workflow, costBreakdown);
  const optimizationSuggestions = generateOptimizationSuggestions(workflow, costBreakdown);

  const reportTitle = `AI Workflow Cost Analysis - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;

  function validateEmail(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmail(value);
    setEmailValid(emailRegex.test(value));
    setEmailError(null);
  }

  async function handleEmailReport() {
    if (!emailValid) return;

    try {
      setEmailSending(true);
      setEmailError(null);

      // Save report to database
      const { data: reportData, error: reportError } = await supabase
        .from('report_analyses')
        .insert([{
          session_id: sessionId || null,
          report_title: reportTitle,
          workflow_config: workflow,
          cost_breakdown: costBreakdown,
          executive_summary: executiveSummary,
          workflow_narrative: workflowNarrative,
          agent_breakdown: agentBreakdown,
          model_rationale: modelRationale,
          optimization_suggestions: optimizationSuggestions,
          metadata: {
            generated_at: new Date().toISOString(),
            total_transactions: totalTransactions,
            monthly_cost_usd: monthlyCostUSD,
            annual_cost_usd: annualCostUSD,
          },
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      // Record email delivery intent
      const { error: deliveryError } = await supabase
        .from('report_deliveries')
        .insert([{
          report_id: reportData.id,
          recipient_email: email,
          delivery_status: 'pending',
        }]);

      if (deliveryError) throw deliveryError;

      // Call Edge Function to send email
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-report-email`;
      const functionHeaders = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const emailResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: functionHeaders,
        body: JSON.stringify({
          report_id: reportData.id,
          recipient_email: email,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
      }, 5000);

    } catch (error) {
      console.error('Error sending report:', error);
      setEmailError('Failed to send report. Please try again.');
      setEmailSending(false);
    }
  }

  function formatCurrency(amount: number, decimals: number = 2): string {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Business Cost Analysis</h2>
              <p className="text-sm text-gray-600">Detailed workflow breakdown and recommendations</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Email Capture - Premium Format */}
            {!emailSent ? (
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => validateEmail(e.target.value)}
                    className={`w-48 px-2 py-1 text-sm border-0 focus:outline-none focus:ring-0 ${
                      emailValid
                        ? 'text-green-700'
                        : email.length > 0
                        ? 'text-red-600'
                        : 'text-gray-700'
                    } ${emailSending ? 'bg-gray-50' : ''}`}
                    disabled={emailSending}
                  />
                  {emailValid && (
                    <button
                      onClick={handleEmailReport}
                      disabled={emailSending}
                      className="flex items-center gap-2 px-3 py-1 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition-all text-xs font-medium whitespace-nowrap"
                    >
                      {emailSending ? (
                        <>
                          <Loader className="h-3 w-3 animate-spin" />
                          Sending
                        </>
                      ) : (
                        'Email me this analysis'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium shadow-sm">
                <Check className="h-4 w-4" />
                <span>Report sent to {email}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 stroke-black" />
            </button>
          </div>
        </div>

        {emailError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {emailError}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Executive Summary */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-blue-900">Executive Summary</h3>
            </div>
            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
              {executiveSummary.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-3 last:mb-0">
                  {paragraph.split('**').map((part, i) =>
                    i % 2 === 0 ? part : <strong key={i} className="font-bold text-blue-900">{part}</strong>
                  )}
                </p>
              ))}
            </div>
          </section>

          {/* 2. Workflow Overview */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Workflow Overview</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-800 leading-relaxed">
              {workflowNarrative.split('\n').map((line, idx) => {
                if (!line.trim()) return null;
                const isBold = line.startsWith('**');
                const isIndented = line.startsWith('   •');

                return (
                  <div key={idx} className={isIndented ? 'ml-6 text-gray-600' : isBold ? 'font-semibold text-gray-900' : ''}>
                    {line.replace(/\*\*/g, '').replace(/^   • /, '• ')}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Agent Breakdown */}
          {agentBreakdown.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Agent Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Agent</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Calls</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Trigger Reason</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Tokens</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {agentBreakdown.map((agent, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{agent.agent_name}</td>
                        <td className="py-3 px-4 text-gray-600">{agent.agent_role}</td>
                        <td className="py-3 px-4 text-center text-gray-900">{agent.call_count}</td>
                        <td className="py-3 px-4 text-gray-600">{agent.trigger_reason}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{agent.token_usage.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(agent.cost_usd, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 4. Model Selection Rationale */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Model Selection Rationale</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
              {modelRationale.split('\n\n').map((section, idx) => {
                const lines = section.split('\n');
                const heading = lines[0];
                const content = lines.slice(1).join(' ');

                return (
                  <div key={idx}>
                    {heading.startsWith('**') ? (
                      <h4 className="font-bold text-gray-900 mb-1">{heading.replace(/\*\*/g, '')}</h4>
                    ) : null}
                    <p className="text-gray-700">{content}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5. Cost Breakdown Summary */}
          <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 text-white">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold">Cost Breakdown</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20">
                <p className="text-sm text-gray-300 mb-1">Per Interaction</p>
                <p className="text-3xl font-bold">{formatCurrency(perTransactionUSD, 4)}</p>
                <p className="text-xs text-gray-400 mt-2">Single customer transaction cost</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20">
                <p className="text-sm text-gray-300 mb-1">Monthly Cost</p>
                <p className="text-3xl font-bold">{formatCurrency(monthlyCostUSD)}</p>
                <p className="text-xs text-gray-400 mt-2">{totalTransactions.toLocaleString()} transactions/month</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20">
                <p className="text-sm text-gray-300 mb-1">Annual Projection</p>
                <p className="text-3xl font-bold">{formatCurrency(annualCostUSD)}</p>
                <p className="text-xs text-gray-400 mt-2">12-month forecast</p>
              </div>
            </div>

            {/* Volume Scenarios */}
            <div className="mt-6 pt-6 border-t border-white border-opacity-20">
              <h4 className="text-lg font-bold mb-4">Volume Scenarios</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-300 mb-1">Low Volume (50%)</p>
                  <p className="text-xl font-bold">{formatCurrency(monthlyCostUSD * 0.5)}/mo</p>
                </div>
                <div>
                  <p className="text-gray-300 mb-1">Current Volume</p>
                  <p className="text-xl font-bold">{formatCurrency(monthlyCostUSD)}/mo</p>
                </div>
                <div>
                  <p className="text-gray-300 mb-1">High Volume (2x)</p>
                  <p className="text-xl font-bold">{formatCurrency(monthlyCostUSD * 2)}/mo</p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Optimization Recommendations */}
          {optimizationSuggestions.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Optimization Recommendations</h3>
              </div>
              <div className="space-y-4">
                {optimizationSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      suggestion.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : suggestion.priority === 'medium'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                            suggestion.priority === 'high'
                              ? 'bg-red-200 text-red-800'
                              : suggestion.priority === 'medium'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {suggestion.priority}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 uppercase">{suggestion.category}</span>
                      </div>
                      {suggestion.potential_savings_usd && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-700">
                            Save {formatCurrency(suggestion.potential_savings_usd)}
                          </p>
                          {suggestion.potential_savings_percentage && (
                            <p className="text-xs text-gray-600">~{suggestion.potential_savings_percentage}% reduction</p>
                          )}
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-gray-700">{suggestion.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            Generated {new Date().toLocaleString()} • Lyzr AI Credit Calculator
          </p>
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
