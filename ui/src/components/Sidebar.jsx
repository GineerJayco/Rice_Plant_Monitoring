import React, { useState } from 'react';
import logoImage from '../assets/1.png';

/**
 * Sidebar Component
 * - Replaces the top navbar with a sleek, vertical navigation.
 * - Collapsible on mobile.
 */
const Sidebar = ({ selectedPlant = 1, setSelectedPlant, refreshing = false, lastUpdated = null }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-gray-900/80 backdrop-blur-md lg:hidden"
      >
        <span className="text-lg">{isOpen ? '✕' : '☰'}</span>
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
        className={`fixed inset-y-0 left-0 z-[55] w-64 transform bg-gray-950/40 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col`}
      >
        <div className="p-4">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-6">
            <img src={logoImage} alt="Intelligent Irrigation Logo" className="w-15 h-10" />
            <div>
              <h1 className="text-sm font-extrabold text-white leading-tight uppercase tracking-wider">
                Intelligent<br />Irrigation
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4">
            <div>
              <p className="px-4 text-[10px] font-black uppercase text-emerald-500/50 tracking-[0.2em] mb-2">Main</p>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider"
              >
                <span className="text-base">📊</span> Dashboard
              </a>
            </div>

            <div>
              <p className="px-4 text-[10px] font-black uppercase text-emerald-500/50 tracking-[0.2em] mb-2">Setups</p>
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedPlant(num)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedPlant === num
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="text-sm">{selectedPlant === num ? '🪴' : '🌿'}</span> Setup {num}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-4">
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-white/5 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <span className="text-base">⚙️</span> Settings
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-white/5">
          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-gray-800/30 px-3 py-2 rounded-xl border border-emerald-500/10">
              <div className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-amber-400' : 'bg-emerald-400'} ${refreshing ? 'animate-pulse' : ''}`}></div>
              <span className="text-[9px] font-black text-emerald-300/80 uppercase tracking-[0.2em]">
                {refreshing ? 'Syncing' : 'Live'}
              </span>
            </div>

            <div className="px-1">
              <p className="text-[9px] text-gray-600 uppercase font-black tracking-[0.2em] mb-2">Monitor</p>
              <div className="text-[10px] text-gray-500 space-y-1">
                <span className="font-bold text-emerald-500/80 uppercase tracking-tighter">Setup {selectedPlant}</span>
                {lastUpdated && (
                  <div className="flex justify-between items-center opacity-60">
                    <span>{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
