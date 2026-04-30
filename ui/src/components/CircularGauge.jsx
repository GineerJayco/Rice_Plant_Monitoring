import React from 'react';

/**
 * CircularGauge Component
 * Renders a premium-looking circular progress gauge using SVG.
 */
const CircularGauge = ({ 
  value = 0, 
  max = 100, 
  unit = '', 
  tone = 'emerald',
  size = 140 
}) => {
  const isNumeric = Number.isFinite(Number(value));
  const numValue = isNumeric ? Number(value) : 0;
  const percentage = Math.max(0, Math.min(100, (numValue / max) * 100));
  
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const tones = {
    emerald: {
      gradient: ['#10b981', '#34d399'],
      glow: 'rgba(16, 185, 129, 0.3)',
      bg: 'rgba(16, 185, 129, 0.05)',
    },
    sky: {
      gradient: ['#0ea5e9', '#38bdf8'],
      glow: 'rgba(14, 165, 233, 0.3)',
      bg: 'rgba(14, 165, 233, 0.05)',
    },
    amber: {
      gradient: ['#f59e0b', '#fbbf24'],
      glow: 'rgba(245, 158, 11, 0.3)',
      bg: 'rgba(245, 158, 11, 0.05)',
    },
    violet: {
      gradient: ['#8b5cf6', '#a78bfa'],
      glow: 'rgba(139, 92, 246, 0.3)',
      bg: 'rgba(139, 92, 246, 0.05)',
    },
  };

  const t = tones[tone] || tones.emerald;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id={`gradient-${tone}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={t.gradient[0]} />
            <stop offset="100%" stopColor={t.gradient[1]} />
          </linearGradient>
          <filter id={`glow-${tone}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          fill="none"
        />
        
        {/* Progress Path */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${tone})`}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          filter={`url(#glow-${tone})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Central Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-black text-white">
            {isNumeric ? Math.round(numValue) : '—'}
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default CircularGauge;
