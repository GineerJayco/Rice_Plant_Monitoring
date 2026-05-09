import React from 'react';

/**
 * SetupIndicator Component
 * Shows which setups are available and which one is currently active
 */
const SetupIndicator = ({ activePlant = 1 }) => {
  const setups = Array.from({ length: 6 }, (_, i) => i + 1);

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/40 backdrop-blur-md px-3 py-1.5 shadow-lg shadow-emerald-500/5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest">Plant</p>
        <p className="text-[8px] text-gray-400">
          <span className="text-emerald-300 font-semibold">{activePlant}</span>
        </p>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        {setups.map((setupId) => (
          <div key={setupId} className="flex items-center gap-2">
            <span
              className={[
                'h-1.5 w-1.5 rounded-full border transition-all duration-300',
                activePlant === setupId
                  ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.55)] scale-110'
                  : 'bg-white/10 border-white/10',
              ].join(' ')}
              title={`Plant ${setupId}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupIndicator;
