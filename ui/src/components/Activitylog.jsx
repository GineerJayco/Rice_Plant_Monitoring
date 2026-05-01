import React from 'react';

/**
 * Activity log card similar to the reference dashboard.
 */
const Activitylog = ({ logs = [] }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-gray-900/60 p-3 backdrop-blur-md">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Activity Log
      </p>
      <div className="max-h-32 overflow-y-auto rounded-lg border border-white/5 bg-gray-950/90 p-3 font-mono text-[10px] leading-relaxed text-emerald-300 custom-scrollbar">
        {logs.length ? (
          logs.map((entry, idx) => (
            <div key={`${entry}-${idx}`}>{entry}</div>
          ))
        ) : (
          <div className="text-slate-500">No activity yet.</div>
        )}
      </div>
    </section>
  );
};

export default Activitylog;
