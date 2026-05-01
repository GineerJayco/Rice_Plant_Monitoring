import React, { useState } from 'react';
import logoImage from '../assets/2.png';

/**
 * Sidebar Component — compact, organized, all content visible.
 */
const Sidebar = ({
  selectedPlant = 1,
  setSelectedPlant,
  refreshing = false,
  lastUpdated = null,
  activeView = 'dashboard',
  setActiveView
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-[60] flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-gray-900/80 backdrop-blur-md lg:hidden"
      >
        <span className="text-base">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[55] w-56 transform bg-gray-950/70 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col h-screen`}
      >
        {/* ── Logo ── */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
          <img src={logoImage} alt="Logo" className="w-9 h-7 object-contain flex-shrink-0" />
          <div>
            <h1 className="text-xs font-extrabold text-white leading-tight uppercase tracking-wider">
              Rice Plant<br />Monitoring
            </h1>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 flex flex-col gap-3 px-3 py-3 overflow-hidden">

          {/* Main */}
          <div>
            <p className="px-1 text-[9px] font-black uppercase text-emerald-500/50 tracking-[0.2em] mb-1.5">
              Main
            </p>
            <button
              type="button"
              onClick={() => { setActiveView?.('dashboard'); setIsOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'text-gray-400 border border-transparent hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base">📊</span>
              <span>Dashboard</span>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* Plants */}
          <div className="flex-1">
            <p className="px-1 text-[9px] font-black uppercase text-emerald-500/50 tracking-[0.2em] mb-1.5">
              Plants
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setSelectedPlant(num);
                    setActiveView?.('dashboard');
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    selectedPlant === num && activeView === 'dashboard'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
                  }`}
                >
                  <span className="text-sm">{selectedPlant === num ? '🪴' : '🌿'}</span>
                  <span>Plant {num}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* Logs */}
          <div>
            <p className="px-1 text-[9px] font-black uppercase text-emerald-500/50 tracking-[0.2em] mb-1.5">
              More
            </p>
            <button
              type="button"
              onClick={() => { setActiveView?.('logs'); setIsOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                activeView === 'logs'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                  : 'text-gray-400 border border-transparent hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base">🧾</span>
              <span>Activity Logs</span>
            </button>
          </div>
        </nav>

        {/* ── Footer Status ── */}
        <div className="px-3 py-3 border-t border-white/5 space-y-2">
          {/* Connection pill */}
          <div className="flex items-center gap-2 bg-gray-800/40 px-3 py-2 rounded-lg border border-white/5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${refreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-widest">
              {refreshing ? 'Syncing…' : 'Live'}
            </span>
          </div>
          {/* Active plant info */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Monitoring</span>
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-tight">Plant {selectedPlant}</span>
          </div>
          {lastUpdated && (
            <p className="px-1 text-[9px] text-gray-600 opacity-70">
              Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
