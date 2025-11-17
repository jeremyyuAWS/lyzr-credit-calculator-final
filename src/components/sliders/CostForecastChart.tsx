import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface CostForecastChartProps {
  monthlyCost: number;
  scenarioMultiplier?: number;
  scenarioLabel?: string;
  formatCurrency: (usdAmount: number, decimals?: number) => string;
}

export default function CostForecastChart({
  monthlyCost,
  scenarioMultiplier = 1.0,
  scenarioLabel,
  formatCurrency
}: CostForecastChartProps) {
  // Generate 12-month forecast with multiple scenarios and optimization curves
  const generateForecastData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseMonthly = monthlyCost * scenarioMultiplier;

    return months.map((month, index) => {
      // Business growth factor (compound growth)
      const businessGrowth = Math.pow(1.04, index); // 4% compound monthly growth

      // Cost optimization factor (improving efficiency over time)
      // LLM models get cheaper, caching improves, prompt optimization reduces tokens
      const optimizationFactor = 1 - (index * 0.015); // 1.5% cost reduction per month

      // AI model price reduction (industry trend - models getting cheaper)
      const aiPriceReduction = 1 - (index * 0.01); // 1% monthly price reduction

      // Current path: Business grows but costs grow linearly
      const currentPath = baseMonthly * businessGrowth;

      // Optimized path: Business grows but with efficiency improvements
      const optimizedPath = baseMonthly * businessGrowth * optimizationFactor * aiPriceReduction;

      // Conservative estimate (middle ground)
      const conservativePath = baseMonthly * Math.pow(1.025, index); // 2.5% growth

      // Best case: Aggressive optimization + better caching
      const bestCase = baseMonthly * businessGrowth * Math.pow(0.97, index); // 3% monthly reduction

      // Worst case: High growth + no optimization
      const worstCase = baseMonthly * Math.pow(1.08, index); // 8% growth

      return {
        month,
        currentPath,
        optimizedPath,
        conservativePath,
        bestCase,
        worstCase,
      };
    });
  };

  const forecastData = generateForecastData();

  // Calculate total savings
  const lastMonth = forecastData[11];
  const savingsVsCurrent = ((lastMonth.currentPath - lastMonth.optimizedPath) * 0.008);
  const savingsPercentage = ((lastMonth.currentPath - lastMonth.optimizedPath) / lastMonth.currentPath * 100).toFixed(0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              12-Month Cost Forecast with Optimization
            </h2>
            {scenarioLabel && (
              <p className="text-sm text-gray-600 mt-1">
                Scenario: <span className="font-semibold">{scenarioLabel}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingDown className="h-5 w-5" />
              <div>
                <p className="text-xs text-gray-600">Potential Savings by Dec</p>
                <p className="text-lg font-bold">{formatCurrency(savingsVsCurrent)} ({savingsPercentage}%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend with descriptions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500"></div>
            <span className="text-gray-600">Worst Case</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-400"></div>
            <span className="text-gray-600">Current Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-yellow-500 border-t-2 border-dashed border-yellow-500"></div>
            <span className="text-gray-600">Conservative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">With Optimization</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-green-500 border-t-2 border-dashed border-green-500"></div>
            <span className="text-gray-600">Best Case</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrency(value * 0.008, 0)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  worstCase: 'Worst Case',
                  currentPath: 'Current Path',
                  conservativePath: 'Conservative',
                  optimizedPath: 'With Optimization',
                  bestCase: 'Best Case'
                };
                return [formatCurrency(value * 0.008), labels[name] || name];
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
            />

            {/* Worst Case - Red solid line */}
            <Line
              type="monotone"
              dataKey="worstCase"
              stroke="#ef4444"
              strokeWidth={2}
              name="worstCase"
              dot={false}
              strokeOpacity={0.7}
            />

            {/* Current Path - Gray solid line */}
            <Line
              type="monotone"
              dataKey="currentPath"
              stroke="#9ca3af"
              strokeWidth={2.5}
              name="currentPath"
              dot={{ fill: '#9ca3af', r: 3 }}
            />

            {/* Conservative - Yellow dashed line */}
            <Line
              type="monotone"
              dataKey="conservativePath"
              stroke="#eab308"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="conservativePath"
              dot={false}
            />

            {/* Optimized Path - Blue solid line (primary recommendation) */}
            <Line
              type="monotone"
              dataKey="optimizedPath"
              stroke="#3b82f6"
              strokeWidth={3}
              name="optimizedPath"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />

            {/* Best Case - Green dashed line */}
            <Line
              type="monotone"
              dataKey="bestCase"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="bestCase"
              dot={false}
              strokeOpacity={0.8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-900">Smart Caching</p>
            </div>
            <p className="text-xs text-blue-700">
              Reduce repeat queries by 30-40% with intelligent response caching
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="h-4 w-4 text-green-600" />
              <p className="text-xs font-semibold text-green-900">Prompt Optimization</p>
            </div>
            <p className="text-xs text-green-700">
              Streamline prompts to use 15-25% fewer tokens without losing quality
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-gray-600" />
              <p className="text-xs font-semibold text-gray-900">Model Price Trends</p>
            </div>
            <p className="text-xs text-gray-700">
              AI models typically decrease 10-15% in price annually
            </p>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900">
            <strong>💡 Optimization Opportunity:</strong> The blue line shows realistic cost trajectory with optimization.
            By implementing caching, prompt tuning, and leveraging decreasing model costs, you could save{' '}
            <strong className="text-blue-700">{formatCurrency(savingsVsCurrent)}</strong> by month 12 compared to current path.
          </p>
        </div>
      </div>
    </div>
  );
}
