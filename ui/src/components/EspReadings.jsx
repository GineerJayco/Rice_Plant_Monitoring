import React, { useEffect, useMemo, useRef, useState } from 'react';
import SemiCircleGauge from './SemiCircleGauge';
import SparklineChart from './SparklineChart';
import VerticalTank from './VerticalTank';
import ReservoirVerticalTank from './ReservoirVerticalTank';
import SegmentedBar from './SegmentedBar';

/**
 * Smoothly animates a numeric value whenever it changes.
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
 * SensorView Component
 * Merged SensorCard + DataCard behavior into one reusable sensor panel.
 *
 * Props:
 *   title, value, unit, icon, tone, meterMax, type
 *   mqttSource (optional) — if true, shows an MQTT badge
 */
/**
 * SensorView Component
 * Merged SensorCard + DataCard behavior into one reusable sensor panel.
 *
 * Props:
 *   title, value, unit, icon, tone, meterMax, type
 *   mqttSource (optional) — if true, shows an MQTT badge
 */
const SensorView = ({
  title,
  value,
  unit = '',
  icon = null,
  tone = 'emerald',
  meterMax = 100,
  type = 'default',
  mqttSource = false,
}) => {
  const isNumeric = useMemo(() => Number.isFinite(Number(value)), [value]);
  const animatedValue = useAnimatedNumber(isNumeric ? Number(value) : value);
  const [showPing, setShowPing] = useState(false);

  // Show a "ping" animation whenever the value changes
  useEffect(() => {
    if (value !== null && value !== undefined && value !== '—') {
      setShowPing(true);
      const timer = setTimeout(() => setShowPing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const toneClasses = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-400/50',
      glow: 'shadow-emerald-500/5',
      text: 'text-emerald-400',
      bg: 'from-emerald-500/10 to-transparent',
      ping: 'bg-emerald-400',
      accent: 'emerald',
    },
    sky: {
      border: 'border-sky-500/20 hover:border-sky-400/50',
      glow: 'shadow-sky-500/5',
      text: 'text-sky-400',
      bg: 'from-sky-500/10 to-transparent',
      ping: 'bg-sky-400',
      accent: 'sky',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-400/50',
      glow: 'shadow-amber-500/5',
      text: 'text-amber-400',
      bg: 'from-amber-500/10 to-transparent',
      ping: 'bg-amber-400',
      accent: 'amber',
    },
    violet: {
      border: 'border-violet-500/20 hover:border-violet-400/50',
      glow: 'shadow-violet-500/5',
      text: 'text-violet-400',
      bg: 'from-violet-500/10 to-transparent',
      ping: 'bg-violet-400',
      accent: 'violet',
    },
  };

  const t = toneClasses[tone] || toneClasses.emerald;
  const displayValue = isNumeric ? animatedValue : value;

  return (
    <div
      className={[
        'relative h-full overflow-hidden rounded-[2rem] border bg-gray-900/20',
        'backdrop-blur-xl transition-all duration-700 group',
        'hover:-translate-y-2 hover:bg-gray-900/40 hover:shadow-2xl',
        t.border,
        t.glow,
      ].join(' ')}
    >
      {/* Background Glow */}
      <div className={['absolute -inset-px bg-gradient-to-br opacity-0 transition-opacity duration-700 group-hover:opacity-100', t.bg].join(' ')} />

      {/* Update Ping Effect */}
      {showPing && (
        <div className={`absolute top-2 right-2 h-1 w-1 rounded-full ${t.ping} animate-ping opacity-75`} />
      )}

      <div className="relative h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400/80">
            {title}
          </p>
          <div className="text-2xl transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 animate-float">
            {icon}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-2">
          {type === 'temperature' && (
            <div className="transform transition-transform duration-700 group-hover:scale-110">
              <SemiCircleGauge value={displayValue} max={meterMax} unit={unit} tone={tone} size={110} />
            </div>
          )}
          {type === 'humidity' && (
            <div className="transform transition-transform duration-700 group-hover:scale-110">
              <SparklineChart value={displayValue} max={meterMax} unit={unit} tone={tone} size={110} />
            </div>
          )}
          {type === 'water' && (
            <div className="transform transition-transform duration-700 group-hover:scale-110">
              <VerticalTank value={displayValue} max={meterMax} unit={unit} tone={tone} size={110} />
            </div>
          )}
          {type === 'reservoir' && (
            <div className="transform transition-transform duration-700 group-hover:scale-110">
              <ReservoirVerticalTank value={displayValue} max={meterMax} unit={unit} tone={tone} size={120} />
            </div>
          )}
          {type === 'soil' && (
            <div className="transform transition-transform duration-700 group-hover:scale-110">
              <SegmentedBar value={displayValue} max={meterMax} unit={unit} tone={tone} size={110} />
            </div>
          )}
          {!['temperature', 'humidity', 'water', 'reservoir', 'soil'].includes(type) && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black tracking-tighter ${t.text}`}>
                  {isNumeric ? Math.round(displayValue) : displayValue}
                </span>
                {unit ? <span className={`text-lg font-bold ${t.text}/50`}>{unit}</span> : null}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1 border ${mqttSource
              ? `bg-${t.accent}-500/10 border-${t.accent}-500/20`
              : 'bg-white/5 border-white/5'
            } transition-all duration-500`}>
            <div className={[
              'w-1 h-1 rounded-full',
              mqttSource ? 'animate-pulse' : '',
              mqttSource ? t.ping : 'bg-gray-600'
            ].join(' ')} />
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${mqttSource ? t.text : 'text-gray-500'}`}>
              {mqttSource ? 'HiveMQ Cloud Live' : 'Stable'}
            </span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default SensorView;
