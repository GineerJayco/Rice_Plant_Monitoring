import React from 'react';

const SegmentedBar = ({ 
  value = 0, 
  max = 100, 
  unit = '', 
  tone = 'emerald',
  size = 100 
}) => {
  const isNumeric = Number.isFinite(Number(value));
  const numValue = isNumeric ? Number(value) : 0;
  const percentage = Math.max(0, Math.min(100, (numValue / max) * 100));
  
  const segments = 8;
  const activeSegments = Math.round((percentage / 100) * segments);

  const tones = {
    emerald: { active: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', inactive: 'bg-emerald-950/30' },
    sky: { active: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]', inactive: 'bg-sky-950/30' },
    amber: { active: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', inactive: 'bg-amber-950/30' },
    violet: { active: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]', inactive: 'bg-violet-950/30' },
  };

  const t = tones[tone] || tones.emerald;

  return (
    <div className="relative flex flex-col items-center justify-center w-full gap-2" style={{ width: size }}>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-black text-white">
          {isNumeric ? Math.round(numValue) : '—'}
        </span>
        <span className="text-[8px] font-bold text-gray-500 uppercase">{unit}</span>
      </div>
      
      {/* Bar Container */}
      <div className="flex w-full gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div 
            key={i}
            className={`h-2 flex-1 rounded-sm transition-all duration-500 ${i < activeSegments ? t.active : t.inactive}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SegmentedBar;
