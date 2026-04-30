import React from 'react';

const VerticalTank = ({ 
  value = 0, 
  max = 100, 
  unit = '', 
  tone = 'violet',
  size = 100 
}) => {
  const isNumeric = Number.isFinite(Number(value));
  const numValue = isNumeric ? Number(value) : 0;
  const percentage = Math.max(0, Math.min(100, (numValue / max) * 100));

  const tones = {
    emerald: { bg: 'bg-emerald-500/20', fill: 'bg-emerald-500', glow: 'shadow-emerald-500' },
    sky: { bg: 'bg-sky-500/20', fill: 'bg-sky-500', glow: 'shadow-sky-500' },
    amber: { bg: 'bg-amber-500/20', fill: 'bg-amber-500', glow: 'shadow-amber-500' },
    violet: { bg: 'bg-violet-500/20', fill: 'bg-violet-500', glow: 'shadow-violet-500' },
  };

  const t = tones[tone] || tones.violet;

  return (
    <div className="relative flex items-center justify-center gap-4" style={{ width: size }}>
      {/* Tank Container */}
      <div className={`relative w-8 h-20 rounded-full border border-white/10 ${t.bg} overflow-hidden flex items-end shadow-inner`}>
        <div 
          className={`w-full ${t.fill} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)]`} 
          style={{ height: `${percentage}%` }}
        >
          {/* Water Surface reflection */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-black text-white">
          {isNumeric ? Math.round(numValue) : '—'}
        </span>
        <span className="text-[8px] font-bold text-gray-500 uppercase">{unit}</span>
      </div>
    </div>
  );
};

export default VerticalTank;
