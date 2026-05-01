import React from 'react';

const DiseaseDetectionSummary = ({ plants = [] }) => {
  const totalHealthy = plants.filter(p => String(p.disease).toLowerCase() === 'negative').length;
  const totalDisease = plants.filter(p => String(p.disease).toLowerCase() === 'positive').length;
  const hasData = plants.length > 0;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-md p-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
        <h3 className="text-[10px] font-black text-slate-300 tracking-[0.15em] uppercase">
          Disease Detection
        </h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 flex-shrink-0">
        <div className="bg-slate-800/40 rounded-xl py-3 px-2 flex flex-col items-center justify-center border border-white/5 gap-1">
          <div className="w-8 h-0.5 bg-emerald-400 rounded-full"></div>
          <span className="text-xl font-black text-emerald-400">
            {hasData ? totalHealthy : '—'}
          </span>
          <span className="text-[8px] text-slate-400 font-medium tracking-widest uppercase text-center">Total Healthy</span>
        </div>
        <div className="bg-slate-800/40 rounded-xl py-3 px-2 flex flex-col items-center justify-center border border-white/5 gap-1">
          <div className="w-8 h-0.5 bg-red-400 rounded-full"></div>
          <span className="text-xl font-black text-red-400">
            {hasData ? totalDisease : '—'}
          </span>
          <span className="text-[8px] text-slate-400 font-medium tracking-widest uppercase text-center">Total Sheath Blight</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-800/40 rounded-xl px-3 py-2 border border-white/5 flex-shrink-0">
        {hasData ? (
          <span className="text-[9px] text-slate-400">
            {totalDisease === 0
              ? '✅ All plants are healthy — no disease detected.'
              : `⚠️ ${totalDisease} plant${totalDisease > 1 ? 's' : ''} showing signs of Sheath Blight.`}
          </span>
        ) : (
          <span className="text-[9px] text-slate-500">Waiting for detection results...</span>
        )}
      </div>

      {/* Table Section — scrollable if needed */}
      <div className="flex flex-col gap-0.5 min-h-0 flex-1">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-1 px-2 py-1 bg-slate-800/20 rounded-lg flex-shrink-0">
          <span className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">Plant</span>
          <span className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">Healthy</span>
          <span className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">Sheath Blight</span>
          <span className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">Status</span>
        </div>

        {/* Table Rows */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {hasData ? (
            plants.map((plant) => {
              const isHealthy = String(plant.disease).toLowerCase() === 'negative';
              return (
                <div
                  key={plant.active_plant}
                  className="grid grid-cols-4 gap-1 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-[9px] text-slate-300 font-semibold">
                    Plant {plant.active_plant}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400">
                    {isHealthy ? '1' : '0'}
                  </span>
                  <span className="text-[9px] font-bold text-red-400">
                    {isHealthy ? '0' : '1'}
                  </span>
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${
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
            <div className="px-2 py-2">
              <span className="text-[9px] text-slate-600">Waiting for data...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetectionSummary;
