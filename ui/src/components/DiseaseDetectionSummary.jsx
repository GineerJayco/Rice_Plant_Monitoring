import React from 'react';

const DiseaseDetectionSummary = ({ plants = [] }) => {
  const totalHealthy = plants.filter(p => String(p.disease).toLowerCase() === 'negative').length;
  const totalDisease = plants.filter(p => String(p.disease).toLowerCase() === 'positive').length;
  const hasData = plants.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-md p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
        <h3 className="text-[10px] font-black text-slate-300 tracking-[0.15em] uppercase">
          Disease Detection
        </h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col items-center justify-center border border-white/5 gap-2">
          <div className="w-10 h-0.5 bg-emerald-400 rounded-full"></div>
          <span className="text-2xl font-black text-emerald-400">
            {hasData ? totalHealthy : '—'}
          </span>
          <span className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">Total Healthy</span>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col items-center justify-center border border-white/5 gap-2">
          <div className="w-10 h-0.5 bg-red-400 rounded-full"></div>
          <span className="text-2xl font-black text-red-400">
            {hasData ? totalDisease : '—'}
          </span>
          <span className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">Total Sheath Blight</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-800/40 rounded-xl px-4 py-2.5 border border-white/5">
        {hasData ? (
          <span className="text-[10px] text-slate-400">
            {totalDisease === 0
              ? '✅ All plants are healthy — no disease detected.'
              : `⚠️ ${totalDisease} plant${totalDisease > 1 ? 's' : ''} showing signs of Sheath Blight.`}
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">Waiting for detection results...</span>
        )}
      </div>

      {/* Table Section */}
      <div className="flex flex-col gap-1">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-slate-800/20 rounded-lg">
          <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Plant</span>
          <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Healthy</span>
          <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Sheath Blight</span>
          <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Status</span>
        </div>

        {/* Table Rows */}
        {hasData ? (
          plants.map((plant) => {
            const isHealthy = String(plant.disease).toLowerCase() === 'negative';
            return (
              <div
                key={plant.active_plant}
                className="grid grid-cols-4 gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-[10px] text-slate-300 font-semibold">
                  Plant {plant.active_plant}
                </span>
                <span className="text-[10px] font-bold text-emerald-400">
                  {isHealthy ? '1' : '0'}
                </span>
                <span className="text-[10px] font-bold text-red-400">
                  {isHealthy ? '0' : '1'}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full w-fit ${
                    isHealthy
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  {isHealthy ? 'Healthy' : 'Detected'}
                </span>
              </div>
            );
          })
        ) : (
          <div className="px-3 py-3">
            <span className="text-[10px] text-slate-600">Waiting for data...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseDetectionSummary;
