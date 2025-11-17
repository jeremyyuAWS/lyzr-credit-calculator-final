import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateForecast } from '../lib/calculator';

interface ForecastChartProps {
  currentMonthlyCost: number;
}

export default function ForecastChart({ currentMonthlyCost }: ForecastChartProps) {
  const [months, setMonths] = useState<6 | 12>(6);
  const [growthRate, setGrowthRate] = useState(0.05);

  const forecast = generateForecast(currentMonthlyCost, months, growthRate);
  const currentUsage = new Array(months).fill(currentMonthlyCost);

  const chartData = Array.from({ length: months }, (_, i) => ({
    month: `Month ${i + 1}`,
    current: currentUsage[i],
    projected: forecast[i],
  }));

  return (
    <div className="glass-card-light rounded-2xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-black">Cost Forecast</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Growth Rate:</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm text-black font-semibold focus:border-gray-500 focus:outline-none"
            />
            <span className="text-sm font-semibold text-gray-700">({(growthRate * 100).toFixed(0)}%)</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setMonths(6)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors border-2 ${
                months === 6
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:border-gray-400'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setMonths(12)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors border-2 ${
                months === 12
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:border-gray-400'
              }`}
            >
              12 Months
            </button>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="current"
              stroke="#9ca3af"
              strokeWidth={2}
              name="Current Usage"
              dot={{ fill: '#9ca3af', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#000000"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Projected Forecast"
              dot={{ fill: '#000000', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-400" />
          <span className="text-gray-600">Current Usage (Flat)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-black" style={{ backgroundImage: 'repeating-linear-gradient(to right, black 0, black 4px, transparent 4px, transparent 8px)' }} />
          <span className="text-gray-600">Projected Forecast ({(growthRate * 100).toFixed(0)}% growth)</span>
        </div>
      </div>
    </div>
  );
}
