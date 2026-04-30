import React, { useEffect, useMemo, useRef, useState } from 'react';

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
 */
const SensorCard = ({ title, value, unit = '', icon = null, tone = 'emerald', meterMax = 100 }) => {
  const isNumeric = useMemo(() => Number.isFinite(Number(value)), [value]);
  const animatedValue = useAnimatedNumber(isNumeric ? Number(value) : value);

  const toneClasses = {
    emerald: {
      border: 'border-emerald-500/25 hover:border-emerald-400/60',
      glow: 'shadow-emerald-500/10',
      text: 'text-emerald-300',
      value: 'text-emerald-400',
      chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    },
    sky: {
      border: 'border-sky-500/25 hover:border-sky-400/60',
      glow: 'shadow-sky-500/10',
      text: 'text-sky-300',
      value: 'text-sky-400',
      chip: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
    },
    amber: {
      border: 'border-amber-500/25 hover:border-amber-400/60',
      glow: 'shadow-amber-500/10',
      text: 'text-amber-300',
      value: 'text-amber-400',
      chip: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    },
    violet: {
      border: 'border-violet-500/25 hover:border-violet-400/60',
      glow: 'shadow-violet-500/10',
      text: 'text-violet-300',
      value: 'text-violet-400',
      chip: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
    },
  };

  const t = toneClasses[tone] || toneClasses.emerald;
  const display = isNumeric ? (Math.round(animatedValue * 10) / 10).toString() : value ?? '—';
  const meterPct = (() => {
    if (!isNumeric) return 72;
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isFinite(Number(meterMax)) || Number(meterMax) <= 0) return 72;
    return Math.max(0, Math.min(100, (n / Number(meterMax)) * 100));
  })();

  return (
    <div
      className={[
        'relative min-h-[160px] overflow-hidden rounded-3xl border bg-gray-900/50',
        'backdrop-blur-md shadow-xl transition-all duration-300',
        'hover:scale-[1.02]',
        t.border,
        `shadow-lg ${t.glow}`,
      ].join(' ')}
    >
      {/* subtle gradient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {title}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={['text-4xl font-extrabold tracking-tight', t.value].join(' ')}>
                {display === 'null' || display === 'undefined' ? '—' : display}
              </span>
              {unit ? (
                <span className={['text-sm font-semibold', t.text].join(' ')}>
                  {unit}
                </span>
              ) : null}
            </div>
          </div>

          {icon ? (
            <div className={['shrink-0 rounded-2xl border px-3 py-2', t.chip].join(' ')}>
              <span className="text-lg">{icon}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 h-1.5 w-full rounded-full bg-white/5">
          <div
            className={[
              'h-1.5 rounded-full bg-gradient-to-r transition-all duration-500',
              tone === 'emerald'
                ? 'from-emerald-500 to-emerald-300'
                : tone === 'sky'
                  ? 'from-sky-500 to-sky-300'
                  : tone === 'amber'
                    ? 'from-amber-500 to-amber-300'
                    : 'from-violet-500 to-violet-300',
            ].join(' ')}
            style={{ width: `${meterPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SensorCard;
