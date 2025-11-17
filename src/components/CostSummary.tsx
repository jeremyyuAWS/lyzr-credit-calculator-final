interface CostSummaryProps {
  creditsPerTransaction: number;
  monthlyCredits: number;
  monthlyCost: number;
  dailyCost: number;
  annualCost: number;
}

export default function CostSummary({
  creditsPerTransaction,
  monthlyCredits,
  monthlyCost,
  dailyCost,
  annualCost,
}: CostSummaryProps) {
  return (
    <div className="glass-card-light rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-black mb-8">Credit & Cost Summary</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-md">
          <div className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Credits per Transaction</div>
          <div className="text-3xl font-bold text-white">{creditsPerTransaction.toFixed(2)}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-md">
          <div className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Monthly Credits</div>
          <div className="text-3xl font-bold text-white">{monthlyCredits.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-md">
          <div className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Daily Cost</div>
          <div className="text-3xl font-bold text-white">${dailyCost.toFixed(2)}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-md">
          <div className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Monthly Cost</div>
          <div className="text-3xl font-bold text-white">${monthlyCost.toFixed(2)}</div>
        </div>

        <div className="p-7 bg-gradient-to-br from-black to-gray-800 rounded-xl col-span-full shadow-lg border-2 border-gray-700">
          <div className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Annual Cost</div>
          <div className="text-4xl font-bold text-white">${annualCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>
    </div>
  );
}
