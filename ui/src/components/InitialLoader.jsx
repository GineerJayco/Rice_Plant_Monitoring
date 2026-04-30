import React from 'react';

/**
 * InitialLoader Component
 * Full-screen loading overlay (shown on first load)
 */
const InitialLoader = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/70 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl shadow-emerald-500/10">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-emerald-400 border-r-emerald-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🌱</div>
          </div>

          <div className="text-center">
            <p className="text-white font-semibold text-lg">Initializing Dashboard</p>
            <p className="text-gray-400 text-sm mt-1">Connecting to sensors...</p>
          </div>

          <div className="flex gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialLoader;
