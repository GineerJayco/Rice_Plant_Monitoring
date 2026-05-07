import React from 'react';

/**
 * StoredData Component
 * Placeholder for future implementation of database/stored records.
 */
const StoredData = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
        <span className="text-4xl">📁</span>
      </div>
      <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Stored Data</h2>
      <p className="text-gray-400 max-w-md text-sm leading-relaxed">
        This section is reserved for viewing historical records and archived plant data. 
        Implementation is pending based on storage configuration.
      </p>
      
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
          <div className="text-emerald-400 text-xl mb-2">📅</div>
          <h3 className="text-white font-bold text-sm mb-1 uppercase">History</h3>
          <p className="text-gray-500 text-[10px]">Access logs from previous months and seasons.</p>
        </div>
        <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
          <div className="text-sky-400 text-xl mb-2">📈</div>
          <h3 className="text-white font-bold text-sm mb-1 uppercase">Analytics</h3>
          <p className="text-gray-500 text-[10px]">Comparative growth analysis across all setups.</p>
        </div>
      </div>
    </div>
  );
};

export default StoredData;
