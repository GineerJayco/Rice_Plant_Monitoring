import React from 'react';

const SemiCircleGauge = ({ 
  value = 0, 
  max = 100, 
  unit = '', 
  tone = 'amber',
  size = 100 
}) => {
  const isNumeric = Number.isFinite(Number(value));
  const numValue = isNumeric ? Number(value) : 0;
  const percentage = Math.max(0, Math.min(100, (numValue / max) * 100));
  
  const radius = (size / 2) - 10;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (percentage / 100) * circumference;

  const tones = {
    emerald: { gradient: ['#10b981', '#34d399'], glow: 'rgba(16, 185, 129, 0.3)' },
    sky: { gradient: ['#0ea5e9', '#38bdf8'], glow: 'rgba(14, 165, 233, 0.3)' },
    amber: { gradient: ['#f59e0b', '#fbbf24'], glow: 'rgba(245, 158, 11, 0.3)' },
    violet: { gradient: ['#8b5cf6', '#a78bfa'], glow: 'rgba(139, 92, 246, 0.3)' },
  };

  const t = tones[tone] || tones.amber;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 10} className="transform overflow-visible">
        <defs>
          <linearGradient id={`sc-gradient-${tone}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={t.gradient[0]} />
            <stop offset="100%" stopColor={t.gradient[1]} />
          </linearGradient>
          <filter id={`sc-glow-${tone}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background Track */}
        <path
          d={`M 10 ${size/2} A ${radius} ${radius} 0 0 1 ${size-10} ${size/2}`}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Progress Path */}
        <path
          d={`M 10 ${size/2} A ${radius} ${radius} 0 0 1 ${size-10} ${size/2}`}
          stroke={`url(#sc-gradient-${tone})`}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          filter={`url(#sc-glow-${tone})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Central Content */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-black text-white">
            {isNumeric ? Math.round(numValue) : '—'}
          </span>
          <span className="text-[8px] font-bold text-gray-500 uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default SemiCircleGauge;
