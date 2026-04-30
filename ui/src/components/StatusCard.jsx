import React from 'react';
import StatusBadge from './StatusBadge';

/**
 * StatusCard Component
 * Wide bento card that highlights disease detection result.
 */
const StatusCard = ({ disease = 'Negative', diseaseType = null, timestamp = '', source = 'api' }) => {
  const isPositive = String(disease).toLowerCase() === 'positive';

  const accent = isPositive
    ? 'from-red-500/15 via-red-500/5 to-gray-950 border-red-500/30 shadow-red-500/15'
    : 'from-emerald-500/15 via-emerald-500/5 to-gray-950 border-emerald-500/30 shadow-emerald-500/15';

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${accent} p-3 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-[1.01]`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),transparent_45%)]" />

      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400">Detection</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className={`text-2xl font-extrabold tracking-tight ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
              {isPositive ? 'Positive' : 'Negative'}
            </h2>
            <div className="text-[9px] font-semibold text-gray-300">
              {isPositive ? 'Action recommended.' : 'Healthy setup.'}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[8px] text-gray-400">
            {timestamp ? (
              <span>
                Time: <span className="text-gray-200 font-semibold">{timestamp}</span>
              </span>
            ) : null}
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>
              Src: <span className="text-gray-200 font-semibold">{source === 'mock' ? 'Mock' : 'API'}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <div className={`text-2xl ${isPositive ? 'animate-pulse' : ''}`}>
            {isPositive ? '🦠' : '🌿'}
          </div>
          <StatusBadge
            status={isPositive ? 'ALERT' : 'OK'}
            type={isPositive ? 'danger' : 'success'}
            icon={isPositive ? '⚠️' : '✓'}
          />
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
