
interface CapacityRingProps {
  name: string;
  current: number;
  max: number;
  location?: string;
  onChange?: (value: number) => void;
}

export function CapacityRing({ name, current, max, location, onChange }: CapacityRingProps) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const stroke =
    pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : pct >= 40 ? '#2563EB' : '#059669';

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900">
            {pct}%
          </span>
        </div>
        <div className="flex-1 w-full space-y-3">
          <div>
            <h3 className="font-semibold text-slate-900">{name}</h3>
            {location ? <p className="text-xs text-slate-500">{location}</p> : null}
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{current}</span> / {max} occupants
          </p>
          {onChange ? (
            <div>
              <label className="text-xs font-medium text-slate-500">Update occupancy</label>
              <input
                type="range"
                min={0}
                max={max}
                value={current}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-1 w-full accent-emerald-600"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
