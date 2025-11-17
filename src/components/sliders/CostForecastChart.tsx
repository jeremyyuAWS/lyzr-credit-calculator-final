import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  // Generate 12-month forecast with growth assumptions
  const generateForecastData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseMonthly = monthlyCost * scenarioMultiplier;

    // Simulate gradual growth (5% monthly) for realistic projection
    return months.map((month, index) => {
      const growthFactor = 1 + (index * 0.05);
      const projected = baseMonthly * growthFactor;

      return {
        month,
        cost: projected,
        costFormatted: formatCurrency(projected * 0.008, 0),
      };
    });
  };

  const forecastData = generateForecastData();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            12-Month Cost Forecast
          </h2>
          {scenarioLabel && (
            <p className="text-sm text-gray-600 mt-1">
              Showing: <span className="font-semibold">{scenarioLabel}</span>
            </p>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecastData}>
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
              formatter={(value: number) => [formatCurrency(value * 0.008), 'Monthly Cost']}
              labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="#000000"
              strokeWidth={2}
              name="Projected Cost"
              dot={{ fill: '#000000', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> This forecast assumes 5% monthly growth in usage.
          Actual costs will vary based on your real usage patterns.
        </p>
      </div>
    </div>
  );
}
