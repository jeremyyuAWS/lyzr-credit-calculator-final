import { Workflow, Sparkles, TrendingUp, Users } from 'lucide-react';
import type { WorkflowConfig } from '../BusinessSlidersTab';

interface WorkflowSummaryProps {
  workflow: WorkflowConfig;
}

export default function WorkflowSummary({ workflow }: WorkflowSummaryProps) {
  const totalTransactions =
    workflow.emails_per_month +
    workflow.chats_per_month +
    workflow.voice_calls_per_month +
    workflow.workflow_triggers_per_day * 22;

  const complexityColor = {
    Low: 'bg-green-100 text-green-700 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    High: 'bg-red-100 text-red-700 border-red-200',
  }[workflow.complexity_tier];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6 sticky top-6">
      <div>
        <h2 className="text-xl font-bold text-black mb-2 flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Workflow Summary
        </h2>
        <p className="text-sm text-gray-600">{workflow.workflow_description}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Recommended Model</span>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-black">{workflow.recommended_model}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Complexity Tier</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${complexityColor}`}>
            {workflow.complexity_tier}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Transactions/Month</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-black">{totalTransactions.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Number of Agents</span>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-black">{workflow.num_agents}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-black mb-3">Setup Requirements</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Agents</span>
            <span className="font-medium text-black">{workflow.num_agents}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Knowledge Bases</span>
            <span className="font-medium text-black">{workflow.num_knowledge_bases}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tools</span>
            <span className="font-medium text-black">{workflow.num_tools}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Eval Suites</span>
            <span className="font-medium text-black">{workflow.num_eval_suites}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-black mb-3">Monthly Volume Breakdown</h3>
        <div className="space-y-2 text-sm">
          {workflow.emails_per_month > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Emails</span>
              <span className="font-medium text-black">{workflow.emails_per_month.toLocaleString()}</span>
            </div>
          )}
          {workflow.chats_per_month > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Chats</span>
              <span className="font-medium text-black">{workflow.chats_per_month.toLocaleString()}</span>
            </div>
          )}
          {workflow.voice_calls_per_month > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Voice Calls</span>
              <span className="font-medium text-black">{workflow.voice_calls_per_month.toLocaleString()}</span>
            </div>
          )}
          {workflow.docs_per_month > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Documents</span>
              <span className="font-medium text-black">{workflow.docs_per_month.toLocaleString()}</span>
            </div>
          )}
          {workflow.workflow_triggers_per_day > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Workflow Triggers</span>
              <span className="font-medium text-black">{(workflow.workflow_triggers_per_day * 22).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
