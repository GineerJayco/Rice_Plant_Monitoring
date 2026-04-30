import React from 'react';
import Dashboard from './components/Dashboard';

/**
 * Main App Component
 * Full-screen app layout (no page scrolling)
 */
function App() {
  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Inline Navbar (kept in App so UI stays in one place) */}
      <header className="h-16 shrink-0 border-b border-emerald-500/20 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-gray-900 font-bold shadow-lg shadow-emerald-500/30">
              🌱
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-white truncate">
                Smart Irrigation Monitoring System
              </h1>
              <p className="text-[11px] text-gray-400 truncate">IoT Monitoring • Disease Detection</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-xl border border-emerald-500/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-emerald-300">Live Monitoring</span>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
