export interface VolumeControl {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

interface VolumeControlsProps {
  controls: VolumeControl[];
  onChange: (key: string, value: number) => void;
  scenarioType: string;
}

export default function VolumeControls({
  controls,
  onChange,
  scenarioType,
}: VolumeControlsProps) {
  const formatValue = (value: number, unit?: string) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k${unit || ''}`;
    }
    return `${value}${unit || ''}`;
  };

  return (
    <div className="glass-card-light rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-black">Volume Controls</h2>
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
          {scenarioType}
        </span>
      </div>

      <div className="space-y-6">
        {controls.map((control) => (
          <div key={control.key}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">{control.label}</label>
              <span className="text-lg font-bold text-black">
                {formatValue(control.value, control.unit)}
              </span>
            </div>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={control.value}
              onChange={(e) => onChange(control.key, Number(e.target.value))}
              className="w-full h-2 bg-white/40 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatValue(control.min, control.unit)}</span>
              <span>{formatValue(control.max, control.unit)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
