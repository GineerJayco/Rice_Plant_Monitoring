import React, { useState, useEffect } from 'react';

const SparklineChart = ({ 
  value = 0, 
  max = 100, 
  unit = '', 
  tone = 'sky',
  size = 100 
}) => {
  const [history, setHistory] = useState([]);
  const isNumeric = Number.isFinite(Number(value));
  const numValue = isNumeric ? Number(value) : 0;

  useEffect(() => {
    if (!isNumeric) return;
    setHistory(prev => {
      const newHistory = [...prev, numValue];
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
  }, [numValue, isNumeric]);

  const tones = {
    emerald: { gradient: ['#10b981', '#34d399'], fill: 'rgba(16, 185, 129, 0.2)' },
    sky: { gradient: ['#0ea5e9', '#38bdf8'], fill: 'rgba(14, 165, 233, 0.2)' },
    amber: { gradient: ['#f59e0b', '#fbbf24'], fill: 'rgba(245, 158, 11, 0.2)' },
    violet: { gradient: ['#8b5cf6', '#a78bfa'], fill: 'rgba(139, 92, 246, 0.2)' },
  };

  const t = tones[tone] || tones.sky;
  const width = size;
  const height = 50;

  let pathData = `M 0 ${height}`;
  let lineData = '';

  if (history.length > 1) {
    const minVal = Math.min(...history) * 0.8; 
    const maxVal = Math.max(...history, max);
    const range = maxVal - minVal || 1;
    
    const points = history.map((val, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((val - minVal) / range) * height;
      return `${x},${y}`;
    });

    lineData = `M ${points.join(' L ')}`;
    pathData = `${lineData} L ${width} ${height} L 0 ${height} Z`;
  } else {
    // Flat line if only 1 data point
    const y = height / 2;
    lineData = `M 0 ${y} L ${width} ${y}`;
    pathData = `M 0 ${height} L 0 ${y} L ${width} ${y} L ${width} ${height} Z`;
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full" style={{ width: size }}>
      <div className="mb-2 flex items-baseline gap-0.5">
        <span className="text-xl font-black text-white">
          {isNumeric ? Math.round(numValue) : '—'}
        </span>
        <span className="text-[8px] font-bold text-gray-500 uppercase">{unit}</span>
      </div>
      
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`sl-gradient-${tone}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={t.gradient[0]} stopOpacity="0.5" />
            <stop offset="100%" stopColor={t.gradient[1]} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Area Fill */}
        <path d={pathData} fill={`url(#sl-gradient-${tone})`} className="transition-all duration-500" style={{ animation: 'sl-pop 1s ease-out forwards' }} />
        
        {/* Line */}
        <path d={lineData} fill="none" stroke={t.gradient[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" style={{ animation: 'sl-pop 1.2s ease-out forwards' }} />
      </svg>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sl-pop {
          from { opacity: 0; transform: translateY(10px) scaleY(0.5); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }
      `}} />
    </div>
  );
};

export default SparklineChart;
