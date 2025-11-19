import { DollarSign, TrendingUp, Calendar, Zap } from 'lucide-react';
import type { CostBreakdown } from '../../lib/costEngine';
import type { WorkflowConfig } from '../BusinessSlidersTab';
import { creditsToUSD } from '../../lib/costEngine';

interface CostOutputPanelProps {
  costBreakdown: CostBreakdown;
  workflow: WorkflowConfig;
}

export default function CostOutputPanel({ costBreakdown, workflow }: CostOutputPanelProps) {
  // Pricing: 100 Credits = $1, therefore 1 Credit = $0.01
  const creditPrice = 0.01;

  // Calculate scenarios (10th, 50th, 90th percentile)
  const scenarios = [
    {
      label: 'Low (10th percentile)',
      multiplier: 0.5,
      color: 'border-green-200 bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Medium (50th percentile)',
      multiplier: 1.0,
      color: 'border-yellow-200 bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      label: 'High (90th percentile)',
      multiplier: 1.8,
      color: 'border-red-200 bg-red-50',
      textColor: 'text-red-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cost Per Transaction */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Cost per Transaction
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Credits</p>
            <p className="text-2xl font-bold text-black">
              {costBreakdown.credits_per_transaction.toFixed(4)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">USD</p>
            <p className="text-2xl font-bold text-black">
              ${creditsToUSD(costBreakdown.credits_per_transaction, creditPrice).toFixed(6)}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">Token Cost</p>
            <p className="text-xl font-bold text-blue-700">
              {costBreakdown.token_cost_with_handling_fee.toFixed(4)}C
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-600 mb-1">Feature Cost</p>
            <p className="text-xl font-bold text-purple-700">
              {costBreakdown.feature_cost.toFixed(4)}C
            </p>
          </div>
        </div>
      </div>

      {/* Monthly & Annual Estimates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Monthly & Annual Estimates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-black">Monthly</h3>
            </div>
            <p className="text-3xl font-bold text-black mb-1">
              {costBreakdown.monthly_credits.toFixed(2)} Credits
            </p>
            <p className="text-xl text-gray-600">
              ${creditsToUSD(costBreakdown.monthly_credits, creditPrice).toFixed(2)} USD
            </p>
            <p className="text-xs text-gray-500 mt-3">
              + ${creditsToUSD(costBreakdown.setup_costs, creditPrice).toFixed(2)} one-time setup
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-black to-gray-800 rounded-xl border border-gray-700 text-white">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Annual</h3>
            </div>
            <p className="text-3xl font-bold mb-1">
              {costBreakdown.annual_credits.toFixed(2)} Credits
            </p>
            <p className="text-xl text-gray-300">
              ${creditsToUSD(costBreakdown.annual_credits, creditPrice).toFixed(2)} USD
            </p>
            <p className="text-xs text-gray-400 mt-3">
              + ${creditsToUSD(costBreakdown.setup_costs, creditPrice).toFixed(2)} one-time setup
            </p>
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-black mb-6">Cost Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario) => {
            const monthlyCredits = costBreakdown.monthly_credits * scenario.multiplier;
            const annualCredits = costBreakdown.annual_credits * scenario.multiplier;

            return (
              <div
                key={scenario.label}
                className={`p-5 rounded-xl border-2 ${scenario.color}`}
              >
                <h3 className={`text-sm font-semibold mb-3 ${scenario.textColor}`}>
                  {scenario.label}
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Monthly</p>
                    <p className={`text-lg font-bold ${scenario.textColor}`}>
                      ${creditsToUSD(monthlyCredits, creditPrice).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Annual</p>
                    <p className={`text-base font-semibold ${scenario.textColor}`}>
                      ${creditsToUSD(annualCredits, creditPrice).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          * Scenarios calculated based on usage variance patterns. Low represents efficient usage, High represents peak usage with buffer.
        </p>
      </div>
    </div>
  );
}
