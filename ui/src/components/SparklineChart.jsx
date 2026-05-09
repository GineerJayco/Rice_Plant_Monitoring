import React, { useState, useEffect, useMemo } from 'react';

/**
 * SparklineChart Component
 * A clean, minimalist trend chart with a smooth drawing animation.
 */
const SparklineChart = ({ 
  value = 0, 
  max = 100, 
  unit = '', 
  tone = 'sky',
  size = 110 
}) => {
  const [history, setHistory] = useState([]);
  const isNumeric = Number.isFinite(Number(value));
  const numValue = isNumeric ? Number(value) : 0;

  useEffect(() => {
    if (!isNumeric) return;
    setHistory(prev => {
      const newHistory = [...prev, numValue];
      return newHistory.slice(-20);
    });
  }, [numValue, isNumeric]);

  const tones = {
    emerald: { main: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    sky: { main: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
    amber: { main: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    violet: { main: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  };

  const t = tones[tone] || tones.sky;
  const width = size;
  const height = 40;

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (history.length < 2) {
      const y = height / 2;
      return {
        linePath: `M 0 ${y} L ${width} ${y}`,
        areaPath: `M 0 ${height} L 0 ${y} L ${width} ${y} L ${width} ${height} Z`,
        lastPoint: { x: width, y }
      };
    }

    const minVal = Math.min(...history) * 0.9;
    const maxVal = Math.max(...history, max * 0.7);
    const range = (maxVal - minVal) || 1;

    const points = history.map((val, i) => ({
      x: (i / (history.length - 1)) * width,
      y: height - ((val - minVal) / range) * height
    }));

    // Smooth Bezier path
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    return { 
      linePath: d, 
      areaPath: `${d} L ${width} ${height} L 0 ${height} Z`, 
      lastPoint: points[points.length - 1] 
    };
  }, [history, max, width, height]);

  return (
    <div className="flex flex-col items-center group">
      {/* Simple Clean Header */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-white tracking-tight">
          {isNumeric ? Math.round(numValue) : '—'}
        </span>
        <span className="text-[10px] font-medium text-gray-500">{unit}</span>
      </div>
      
      {/* Minimalist Chart */}
      <div className="relative overflow-visible">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id={`grad-${tone}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={t.main} stopOpacity="0.3" />
              <stop offset="100%" stopColor={t.main} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path 
            d={areaPath} 
            fill={`url(#grad-${tone})`} 
            className="transition-all duration-1000 ease-in-out"
          />
          
          {/* Main Line with Drawing Animation */}
          <path 
            d={linePath} 
            fill="none" 
            stroke={t.main} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            className="draw-line transition-all duration-700 ease-in-out"
          />

          {/* Solid Lead Point */}
          <circle 
            cx={lastPoint.x} 
            cy={lastPoint.y} 
            r="3" 
            fill="white" 
            className="shadow-sm"
          />
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .draw-line {
          stroke-dasharray: 500;
          stroke-dashoffset: 500;
          animation: draw 2s ease-out forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        .group:hover .draw-line {
          stroke-width: 3.5;
          filter: brightness(1.2);
        }
      `}} />
    </div>
  );
};

export default SparklineChart;


