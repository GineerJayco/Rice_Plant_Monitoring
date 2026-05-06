import React, { useMemo } from 'react';

/**
 * DiseaseDetectionSummary Component
 * Shows a summary table of detection results for all 6 plants.
 *
 * Accepts two data sources:
 *   1. plantDetections (from useMqttData) — { [plantId]: { healthy, sheath_blight, detections[] } }
 *   2. plants (legacy mock/API array) — [{ active_plant, disease, ... }]
 *
 * MQTT data takes priority when available.
 */
const DiseaseDetectionSummary = ({ plants = [], plantDetections = {}, mqttConnected = false }) => {
  const hasMqttData = Object.keys(plantDetections).length > 0;

  // Build unified row data for all 6 plants
  const rows = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map((plantId) => {
      const mqttDet = plantDetections[plantId];
      const legacyPlant = plants.find((p) => p.active_plant === plantId);

      if (mqttDet) {
        return {
          plantId,
          healthy: mqttDet.healthy ?? 0,
          sheathBlight: mqttDet.sheath_blight ?? 0,
          isHealthy: (mqttDet.sheath_blight ?? 0) === 0,
          hasData: true,
          source: 'mqtt',
        };
      }

      if (legacyPlant) {
        const isHealthy = String(legacyPlant.disease).toLowerCase() === 'negative';
        return {
          plantId,
          healthy: isHealthy ? 1 : 0,
          sheathBlight: isHealthy ? 0 : 1,
          isHealthy,
          hasData: true,
          source: 'mock',
        };
      }

      return {
        plantId,
        healthy: 0,
        sheathBlight: 0,
        isHealthy: true,
        hasData: false,
        source: null,
      };
    });
  }, [plantDetections, plants]);

  const totalHealthy = rows.reduce((sum, r) => sum + r.healthy, 0);
  const totalDiseased = rows.reduce((sum, r) => sum + r.sheathBlight, 0);
  const hasAnyData = rows.some((r) => r.hasData);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-md p-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
        <h3 className="text-[10px] font-black text-slate-300 tracking-[0.15em] uppercase">
          Disease Detection Summary
        </h3>
        {hasMqttData && (
          <span className="ml-auto text-[7px] font-bold text-emerald-400/60 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5">
            MQTT
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 flex-shrink-0">
        <div className="bg-slate-800/40 rounded-xl py-3 px-2 flex flex-col items-center justify-center border border-white/5 gap-1">
          <div className="w-8 h-0.5 bg-emerald-400 rounded-full"></div>
          <span className="text-xl font-black text-emerald-400">
            {hasAnyData ? totalHealthy : '—'}
          </span>
          <span className="text-[8px] text-slate-400 font-medium tracking-widest uppercase text-center">Total Healthy</span>
        </div>
        <div className="bg-slate-800/40 rounded-xl py-3 px-2 flex flex-col items-center justify-center border border-white/5 gap-1">
          <div className="w-8 h-0.5 bg-red-400 rounded-full"></div>
          <span className="text-xl font-black text-red-400">
            {hasAnyData ? totalDiseased : '—'}
          </span>
          <span className="text-[8px] text-slate-400 font-medium tracking-widest uppercase text-center">Total Sheath Blight</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-800/40 rounded-xl px-3 py-2 border border-white/5 flex-shrink-0">
        {hasAnyData ? (
          <span className="text-[9px] text-slate-400">
            {totalDiseased === 0
              ? '✅ All plants are healthy — no disease detected.'
              : `⚠️ ${totalDiseased} detection${totalDiseased > 1 ? 's' : ''} of Sheath Blight across all plants.`}
          </span>
        ) : mqttConnected ? (
          <span className="text-[9px] text-amber-400/70 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border border-amber-500/20 border-t-amber-400 animate-spin flex-shrink-0" />
            Connected — waiting for detection cycle from Raspberry Pi...
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
          {rows.map((row) => (
            <div
              key={row.plantId}
              className="grid grid-cols-4 gap-1 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="text-[9px] text-slate-300 font-semibold">
                Plant {row.plantId}
              </span>
              <span className="text-[9px] font-bold text-emerald-400">
                {row.hasData ? row.healthy : '—'}
              </span>
              <span className="text-[9px] font-bold text-red-400">
                {row.hasData ? row.sheathBlight : '—'}
              </span>
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit ${
                  !row.hasData
                    ? 'bg-slate-500/15 text-slate-500 border border-slate-500/30'
                    : row.isHealthy
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {!row.hasData ? 'Pending' : row.isHealthy ? 'Healthy' : 'Detected'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetectionSummary;
