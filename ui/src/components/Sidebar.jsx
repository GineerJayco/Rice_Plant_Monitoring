import React, { useState } from 'react';

/**
 * Sidebar Component
 * - Replaces the top navbar with a sleek, vertical navigation.
 * - Collapsible on mobile.
 */
const Sidebar = ({ activePlant = 1, refreshing = false, lastUpdated = null }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-gray-900/80 backdrop-blur-md lg:hidden"
      >
        <span className="text-xl">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-[55] w-72 transform border-r border-emerald-500/20 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="p-8">
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-gray-900 text-2xl font-bold shadow-lg shadow-emerald-500/30">
              🌱
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white leading-tight">
                Smart<br />Irrigation
              </h1>
            </div>
          </div>

          {/* Navigation Links (Placeholders for now) */}
          <nav className="space-y-2">
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
            >
              <span className="text-xl">📊</span> Dashboard
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-xl">🌿</span> Setups
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="text-xl">⚙️</span> Settings
            </a>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-3 rounded-2xl border border-emerald-500/30">
              <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-amber-400' : 'bg-emerald-400'} ${refreshing ? 'animate-pulse' : ''}`}></div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                {refreshing ? 'Updating...' : 'Live Monitoring'}
              </span>
            </div>

            <div className="px-1">
              <p className="text-[11px] text-gray-500 uppercase font-bold tracking-widest mb-2">Monitoring Info</p>
              <div className="text-sm text-gray-300 space-y-1">
                  <span className="font-semibold text-emerald-400 text-right">Setup {activePlant}</span>
                {lastUpdated && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last update:</span>
                    <span className="font-semibold text-gray-300 text-right">{lastUpdated.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
