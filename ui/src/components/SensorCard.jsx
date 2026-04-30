import React, { useEffect, useMemo, useRef, useState } from 'react';
import CircularGauge from './CircularGauge';

/**
 * Smoothly animates a numeric value whenever it changes.
 * Keeps the implementation beginner-friendly (no extra libs).
 */
const useAnimatedNumber = (value, durationMs = 550) => {
  const [animated, setAnimated] = useState(() => (Number.isFinite(Number(value)) ? Number(value) : value));
  const previousRef = useRef(animated);

  useEffect(() => {
    const next = Number(value);
    const prev = Number(previousRef.current);

    if (!Number.isFinite(next) || !Number.isFinite(prev)) {
      previousRef.current = value;
      setAnimated(value);
      return;
    }

    const start = performance.now();
    const delta = next - prev;

    let rafId = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease out
      const eased = 1 - Math.pow(1 - t, 3);
      const current = prev + delta * eased;
      setAnimated(current);

      if (t < 1) rafId = requestAnimationFrame(tick);
      else previousRef.current = next;
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs]);

  return animated;
};

/**
 * SensorCard Component
 * Reusable card for sensor values (temp, humidity, etc.) with glassmorphism styling.
 * Now features a circular gauge for better visual feedback.
 */
const SensorCard = ({ title, value, unit = '', icon = null, tone = 'emerald', meterMax = 100 }) => {
  const isNumeric = useMemo(() => Number.isFinite(Number(value)), [value]);
  const animatedValue = useAnimatedNumber(isNumeric ? Number(value) : value);

  const toneClasses = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-400/50',
      glow: 'shadow-emerald-500/5',
      text: 'text-emerald-400',
      bg: 'from-emerald-500/5 to-transparent',
    },
    sky: {
      border: 'border-sky-500/20 hover:border-sky-400/50',
      glow: 'shadow-sky-500/5',
      text: 'text-sky-400',
      bg: 'from-sky-500/5 to-transparent',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-400/50',
      glow: 'shadow-amber-500/5',
      text: 'text-amber-400',
      bg: 'from-amber-500/5 to-transparent',
    },
    violet: {
      border: 'border-violet-500/20 hover:border-violet-400/50',
      glow: 'shadow-violet-500/5',
      text: 'text-violet-400',
      bg: 'from-violet-500/5 to-transparent',
    },
  };

  const t = toneClasses[tone] || toneClasses.emerald;
  const displayValue = isNumeric ? animatedValue : value;

  return (
    <div
      className={[
        'relative h-full overflow-hidden rounded-[2.5rem] border bg-gray-900/40',
        'backdrop-blur-xl transition-all duration-500 group',
        'hover:-translate-y-1 hover:bg-gray-900/60',
        t.border,
        t.glow,
      ].join(' ')}
    >
      {/* Dynamic Background Gradient */}
      <div className={['absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100', t.bg].join(' ')} />
      
      {/* Glass Highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-30" />

      <div className="relative h-full flex flex-col p-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.05em] text-gray-500">
            {title}
          </p>
          <div className="text-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
            {icon}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-2">
          <CircularGauge 
            value={displayValue} 
            max={meterMax} 
            unit={unit} 
            tone={tone} 
            size={100}
          />
        </div>

        {/* Status Indicator */}
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <div className={['w-1 h-1 rounded-full animate-pulse', tone === 'emerald' ? 'bg-emerald-400' : tone === 'sky' ? 'bg-sky-400' : tone === 'amber' ? 'bg-amber-400' : 'bg-violet-400'].join(' ')} />
          <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Stable</span>
        </div>
      </div>
    </div>
  );
};

export default SensorCard;

