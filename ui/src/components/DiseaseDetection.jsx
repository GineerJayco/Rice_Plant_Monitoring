import React from 'react';

/**
 * DiseaseDetection Component
 * Displays disease detection results for the currently selected plant.
 *
 * Accepts two modes:
 *   1. MQTT mode (detection prop)  — real data from raspicode.txt
 *      detection: { healthy, sheath_blight, detections: [{class_id, label, confidence, box}] }
 *   2. Legacy mode (disease/diseaseType props) — mock/API fallback
 */
const DiseaseDetection = ({
  // MQTT detection data (from useMqttData → plantDetections[plantId])
  detection = null,
  plantId = null,
  // Legacy props (kept for backward compatibility / mock mode)
  disease = 'Unknown',
  diseaseType = null,
  timestamp = '',
  source = 'api',
}) => {

  // ── MQTT Mode: real detection data from raspicode.txt ──
  if (detection && detection.healthy !== undefined) {
    const totalDetections = (detection.healthy || 0) + (detection.sheath_blight || 0);
    const hasDisease = (detection.sheath_blight || 0) > 0;
    const healthyPercent = totalDetections > 0 ? ((detection.healthy / totalDetections) * 100).toFixed(0) : 0;
    const diseasedPercent = totalDetections > 0 ? ((detection.sheath_blight / totalDetections) * 100).toFixed(0) : 0;

    const accent = hasDisease
      ? 'from-red-500/15 via-red-500/5 to-gray-950 border-red-500/30 shadow-red-500/15'
      : 'from-emerald-500/15 via-emerald-500/5 to-gray-950 border-emerald-500/30 shadow-emerald-500/15';

    const badgeClasses = hasDisease
      ? 'bg-red-500/20 border border-red-500/50 text-red-300 shadow-lg shadow-red-500/10'
      : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10';

    return (
      <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${accent} p-3 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-[1.01]`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),transparent_45%)]" />

        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Summary info */}
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400">
              Detection — Plant {plantId || '—'}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className={`text-2xl font-extrabold tracking-tight ${hasDisease ? 'text-red-400' : 'text-emerald-400'}`}>
                {hasDisease ? 'Positive' : 'Negative'}
              </h2>
              <div className="text-[9px] font-semibold text-gray-300">
                {hasDisease ? 'Sheath Blight detected — action recommended.' : 'Healthy — no disease detected.'}
              </div>
            </div>

            {/* Healthy / Diseased counts */}
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <span className="text-lg font-black text-emerald-400">{detection.healthy || 0}</span>
                <div className="text-[8px] text-emerald-300/80 font-bold uppercase leading-tight">
                  Healthy<br />
                  <span className="text-emerald-400/60">{healthyPercent}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <span className="text-lg font-black text-red-400">{detection.sheath_blight || 0}</span>
                <div className="text-[8px] text-red-300/80 font-bold uppercase leading-tight">
                  Sheath Blight<br />
                  <span className="text-red-400/60">{diseasedPercent}%</span>
                </div>
              </div>
            </div>

            {/* Detection details table */}
            {detection.detections && detection.detections.length > 0 && (
              <div className="mt-3">
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Detected Objects</p>
                <div className="rounded-xl border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-3 gap-1 px-2 py-1 bg-slate-800/30 text-[7px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Label</span>
                    <span>Confidence</span>
                    <span>Bounding Box</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto custom-scrollbar">
                    {detection.detections.map((det, idx) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-3 gap-1 px-2 py-1.5 text-[9px] border-t border-white/5 ${det.class_id === 0
                            ? 'text-emerald-300/90'
                            : 'text-red-300/90'
                          }`}
                      >
                        <span className="font-semibold">{det.label}</span>
                        <span>{(det.confidence * 100).toFixed(1)}%</span>
                        <span className="text-gray-500 font-mono text-[8px]">
                          {det.box?.map(v => Math.round(v)).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Inference time */}
            {detection.inference_ms ? (
              <div className="mt-2 text-[8px] text-gray-500">
                Inference: <span className="text-gray-400 font-semibold">{detection.inference_ms}ms</span>
              </div>
            ) : null}
          </div>

          {/* Right: Badge */}
          <div className="shrink-0 flex items-center gap-2">
            <div className={`text-2xl ${hasDisease ? 'animate-pulse' : ''}`}>
              {hasDisease ? '🦠' : '🌿'}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] backdrop-blur-sm transition-all hover:scale-[1.05] ${badgeClasses}`}>
              <span className="text-xs">{hasDisease ? '⚠️' : '✓'}</span>
              {hasDisease ? 'ALERT' : 'OK'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Legacy Mode: mock/API fallback ──
  const isPositive = String(disease).toLowerCase() === 'positive';

  const accent = isPositive
    ? 'from-red-500/15 via-red-500/5 to-gray-950 border-red-500/30 shadow-red-500/15'
    : 'from-emerald-500/15 via-emerald-500/5 to-gray-950 border-emerald-500/30 shadow-emerald-500/15';

  const badgeClasses = isPositive
    ? 'bg-red-500/20 border border-red-500/50 text-red-300 shadow-lg shadow-red-500/10'
    : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10';

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${accent} p-3 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-[1.01]`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),transparent_45%)]" />

      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400">Detection</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className={`text-2xl font-extrabold tracking-tight ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
              {isPositive ? 'Positive' : 'Negative'}
            </h2>
            <div className="text-[9px] font-semibold text-gray-300">
              {isPositive ? 'Action recommended.' : 'Healthy setup.'}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[8px] text-gray-400">
            {diseaseType ? (
              <span>
                Type: <span className="text-gray-200 font-semibold">{diseaseType}</span>
              </span>
            ) : null}
            {timestamp ? (
              <span>
                Time: <span className="text-gray-200 font-semibold">{timestamp}</span>
              </span>
            ) : null}
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>
              Src: <span className="text-gray-200 font-semibold">{source === 'mock' ? 'Mock' : 'MQTT'}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <div className={`text-2xl ${isPositive ? 'animate-pulse' : ''}`}>
            {isPositive ? '🦠' : '🌿'}
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] backdrop-blur-sm transition-all hover:scale-[1.05] ${badgeClasses}`}>
            <span className="text-xs">{isPositive ? '⚠️' : '✓'}</span>
            {isPositive ? 'ALERT' : 'OK'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
