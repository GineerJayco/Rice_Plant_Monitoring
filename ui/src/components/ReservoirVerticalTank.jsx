import React, { useMemo } from 'react';

const statusToPercent = (raw) => {
  const normalized = String(raw ?? '').trim().toUpperCase();
  if (normalized === 'LOW') return 18;
  if (normalized === 'HIGH') return 86;
  return null;
};

const ReservoirVerticalTank = ({
  value,
  max = 100,
  unit = '',
  tone = 'sky',
  size = 110,
}) => {
  const isNumeric = Number.isFinite(Number(value));
  const numericValue = isNumeric ? Number(value) : 0;
  const statusPercent = useMemo(() => statusToPercent(value), [value]);
  const percentage = useMemo(() => {
    if (statusPercent != null) return statusPercent;
    if (!isNumeric) return 0;
    return Math.max(0, Math.min(100, (numericValue / max) * 100));
  }, [isNumeric, max, numericValue, statusPercent]);

  const normalizedStatus = useMemo(() => String(value ?? '').trim().toUpperCase(), [value]);
  const label = useMemo(() => {
    if (normalizedStatus === 'LOW') return 'Low';
    if (normalizedStatus === 'HIGH') return 'High';
    if (isNumeric) return String(Math.round(numericValue));
    if (!normalizedStatus || normalizedStatus === '—' || normalizedStatus === '-') return '—';
    return String(value);
  }, [isNumeric, normalizedStatus, numericValue, value]);

  const tones = {
    emerald: { shell: 'border-emerald-500/20 bg-emerald-500/10', fill: 'from-emerald-400 to-emerald-600', glow: 'shadow-emerald-500/20' },
    sky: { shell: 'border-sky-500/20 bg-sky-500/10', fill: 'from-sky-400 to-sky-600', glow: 'shadow-sky-500/20' },
    amber: { shell: 'border-amber-500/20 bg-amber-500/10', fill: 'from-amber-400 to-amber-600', glow: 'shadow-amber-500/20' },
    violet: { shell: 'border-violet-500/20 bg-violet-500/10', fill: 'from-violet-400 to-violet-600', glow: 'shadow-violet-500/20' },
    red: { shell: 'border-red-500/20 bg-red-500/10', fill: 'from-red-400 to-red-600', glow: 'shadow-red-500/20' },
  };

  const effectiveTone = normalizedStatus === 'LOW' ? 'red' : normalizedStatus === 'HIGH' ? 'sky' : tone;
  const t = tones[effectiveTone] || tones.sky;

  return (
    <div className="relative flex items-center justify-center gap-4" style={{ width: size }}>
      <div className="relative">
        {/* Reservoir shell */}
        <div
          className={[
            'relative w-12 h-20 overflow-hidden',
            'rounded-2xl border',
            'shadow-inner',
            t.shell,
          ].join(' ')}
        >
          {/* Top lip */}
          <div className="absolute inset-x-0 top-0 h-3 bg-white/5 border-b border-white/10" />

          {/* Fill */}
          <div
            className={[
              'absolute inset-x-0 bottom-0 transition-all duration-1000 ease-out',
              'bg-gradient-to-b',
              t.glow,
              `shadow-[0_0_20px_rgba(0,0,0,0.35)]`,
              `from-transparent`,
            ].join(' ')}
            style={{ 
              height: `${percentage}%`,
              animation: 'rvt-fill 1.5s ease-out forwards'
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${t.fill}`} />

            {/* Water surface */}
            <div className="absolute top-0 inset-x-0 h-1 bg-white/35" />
            <div className="absolute top-1 inset-x-0 h-4 opacity-60 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.25),transparent_60%)]" />
          </div>

          {/* Sight-glass highlight */}
          <div className="absolute inset-y-0 left-2 w-2 bg-white/5 blur-[0.5px]" />

          {/* Bottom base */}
          <div className="absolute inset-x-0 bottom-0 h-2 bg-black/20" />
        </div>

        {/* Side pipes (reservoir hint) */}
        <div className="absolute -left-2 top-6 h-8 w-2 rounded-full bg-white/10 border border-white/10" />
        <div className="absolute -right-2 top-10 h-6 w-2 rounded-full bg-white/10 border border-white/10" />
      </div>

      {/* Label */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-white">{label}</span>
          {unit ? <span className="text-[8px] font-bold text-gray-500 uppercase">{unit}</span> : null}
        </div>
        <div className="mt-1 text-[8px] font-bold uppercase tracking-widest text-gray-500">Reservoir</div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rvt-fill {
          from { height: 0%; }
          to { height: ${percentage}%; }
        }
      `}} />
    </div>
  );
};

export default ReservoirVerticalTank;

