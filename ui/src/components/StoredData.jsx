import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchSensorHistory,
  fetchDetectionHistory,
  fetchDetectionSummary,
  fetchPlantImages,
  checkBackendHealth,
  resolveImageUrl,
  deleteSnapshot,
  deleteSnapshotsBulk,
  deleteAllSnapshots,
  deleteAllSensorHistory
} from '../services/api';

/**
 * StoredData Component (V2.1 - Enhanced Unified View)
 * Combines Images, Detections, and Sensors into a single chronological feed
 */
const StoredData = () => {
  const [selectedPlant, setSelectedPlant] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [rawSensors, setRawSensors] = useState([]);
  const [rawDetections, setRawDetections] = useState([]);
  const [rawImages, setRawImages] = useState([]);
  const [detectionSummary, setDetectionSummary] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Fetch backend health on mount
  useEffect(() => {
    checkBackendHealth()
      .then(setBackendHealth)
      .catch(err => console.error('Backend health check failed:', err));
  }, []);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (!backendHealth) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const startDate = new Date(`${dateRange.start}T00:00:00Z`).toISOString();
      const endDate = new Date(`${dateRange.end}T23:59:59Z`).toISOString();

      const [sensorsRes, detectionsRes, imagesRes, summaryRes] = await Promise.all([
        fetchSensorHistory(startDate, endDate, 100),
        fetchDetectionHistory(selectedPlant, 100),
        fetchPlantImages(selectedPlant, 50),
        fetchDetectionSummary(selectedPlant, startDate, endDate),
      ]);

      setRawSensors(sensorsRes.data || []);
      setRawDetections(detectionsRes.data || []);
      setRawImages(imagesRes.data || []);
      setDetectionSummary(summaryRes.summary || null);

    } catch (err) {
      setError(`Data synchronization failed: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlant, dateRange, backendHealth]);

  // Fetch all historical data simultaneously
  useEffect(() => {
    fetchAllData();
    setCurrentPage(1); // Reset to first page when plant/date changes
  }, [fetchAllData, selectedPlant, dateRange]);

  /**
   * Unified Snapshots Logic:
   * Group data by timestamp to show "Events" where an image, detection, and sensors align.
   */
  const snapshots = useMemo(() => {
    if (!rawImages || rawImages.length === 0) return [];

    return rawImages
      .filter(img => Number(img.plant_id) === Number(selectedPlant))
      .map(img => {
      const imgTime = new Date(img.timestamp).getTime();

      // Find closest sensor reading (within 60 seconds for better tolerance)
      const closestSensor = rawSensors.find(s => {
        const sTime = new Date(s.timestamp).getTime();
        return Math.abs(sTime - imgTime) < 60000;
      });

      // Find closest detection result (within 60 seconds)
      const closestDetection = rawDetections.find(d => {
        const dTime = new Date(d.timestamp).getTime();
        return Math.abs(dTime - imgTime) < 60000;
      });

      return {
        id: img.id,
        timestamp: img.timestamp,
        // Fallback for image_url if backend only provides ID
        image_data: img.image_data || null,
        plant_id: img.plant_id,
        sensors: closestSensor || null,
        detection: closestDetection || null,
      };
    });
  }, [rawImages, rawSensors, rawDetections, selectedPlant]);

  // Helper to get specific plant soil moisture safely
  const getPlantSoil = (sensors) => {
    if (!sensors) return 0;
    const value = sensors[`soil_${selectedPlant}`];
    return value !== null && value !== undefined ? value : 0;
  };

  // Pagination Logic
  const totalPages = Math.ceil(snapshots.length / ITEMS_PER_PAGE);
  const paginatedSnapshots = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return snapshots.slice(start, start + ITEMS_PER_PAGE);
  }, [snapshots, currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Smooth scroll to top of feed
    const feedElement = document.querySelector('.vault-feed');
    if (feedElement) feedElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSnapshots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSnapshots.map(s => s.id)));
    }
  };

  const handleDeleteOne = async (id, timestamp) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    setIsDeleting(true);
    try {
      await deleteSnapshot(id, timestamp);
      await fetchAllData(true);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setError(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) return;

    setIsDeleting(true);
    try {
      const selectedSnapshots = snapshots.filter(s => selectedIds.has(s.id));
      const imageIds = selectedSnapshots.map(s => s.id);
      const timestamps = selectedSnapshots.map(s => s.timestamp);
      
      await deleteSnapshotsBulk(selectedPlant, imageIds, timestamps);
      await fetchAllData(true);
      setSelectedIds(new Set());
    } catch (err) {
      setError(`Bulk deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(`CRITICAL: This will PERMANENTLY delete ALL records for PLANT ${selectedPlant}. Proceed?`)) return;

    setIsDeleting(true);
    try {
      await deleteAllSnapshots(selectedPlant);
      
      // Optional: Clear sensor history too if user confirms
      if (window.confirm("Stored records cleared. Would you also like to CLEAR ALL SENSOR HISTORY? (This will empty the charts for ALL plants)")) {
        await deleteAllSensorHistory();
      }

      await fetchAllData(true);
      setSelectedIds(new Set());
    } catch (err) {
      setError(`Data clearance failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIds(new Set());
    }
  };

  if (!backendHealth) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-[#030712]">
        <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Neural Link Offline</h2>
        <p className="text-gray-500 text-xs font-medium animate-pulse uppercase tracking-tight text-center max-w-xs">
          Establishing encrypted connection to agricultural intelligence core...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#030712] text-white overflow-hidden font-sans">
      {/* Premium Unified Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-gray-950/40 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-black font-black text-base">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
                Stored <span className="text-emerald-500">Data</span>
              </h1>
              <p className="text-gray-500 text-[8px] font-black tracking-[0.2em] uppercase mt-0.5">
                Sensor Data and Image Captured
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Unified Stats Area - Refined Capsule Look */}
            {detectionSummary && (
              <div className="flex items-center gap-4 px-4 py-1.5 bg-black/60 rounded-xl border border-white/5 shadow-inner">
                <div className="text-center min-w-[40px]">
                  <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Healthy</p>
                  <p className="text-[11px] font-black text-emerald-500 leading-none">{detectionSummary.total_healthy || 0}</p>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div className="text-center min-w-[40px]">
                  <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Alerts</p>
                  <p className="text-[11px] font-black text-red-500 leading-none">{detectionSummary.total_sheath_blight || 0}</p>
                </div>
                <div className="w-px h-6 bg-white/10"></div>
                <div className="text-center min-w-[40px]">
                  <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Records</p>
                  <p className="text-[11px] font-black text-blue-500 leading-none">{snapshots.length}</p>
                </div>
              </div>
            )}

            {/* Controls Group */}
            <div className="flex items-center gap-2">
              <div className="relative group">
                <select
                  value={selectedPlant}
                  onChange={e => setSelectedPlant(Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-gray-900 border border-white/10 text-white font-black text-[9px] focus:border-emerald-500 outline-none transition-all cursor-pointer hover:bg-gray-800"
                >
                  {[1, 2, 3, 4, 5, 6].map(p => (
                    <option key={p} value={p}>PLANT {p}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500 text-[8px]">▼</div>
              </div>

              <div className="flex items-center bg-gray-900 border border-white/10 rounded-lg px-2.5 py-2 gap-2 hover:border-white/20 transition-colors">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent text-[8px] font-black text-gray-300 outline-none uppercase cursor-pointer"
                />
                <span className="text-gray-700 font-black text-[10px]">/</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent text-[8px] font-black text-gray-300 outline-none uppercase cursor-pointer"
                />
              </div>

              <button
                onClick={() => fetchAllData(true)}
                disabled={loading || refreshing || isDeleting}
                className={`w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all active:scale-95 disabled:opacity-50 ${refreshing ? 'animate-spin' : ''}`}
              >
                ↻
              </button>

              <button
                onClick={toggleSelectionMode}
                disabled={loading || refreshing || isDeleting || snapshots.length === 0}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${selectionMode ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                {selectionMode ? '✕' : '🗑️'}
              </button>

              {/* Clear All Button (Restored) */}
              {selectionMode && (
                <button
                  onClick={handleClearAll}
                  disabled={loading || refreshing || isDeleting || snapshots.length === 0}
                  className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  title="Clear All Plant Records"
                >
                  <span className="text-[9px] font-black">ALL</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Toolbar (Conditional) */}
      {selectedIds.size > 0 && (
        <div className="mx-6 mt-4 p-3 bg-emerald-500 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-xl shadow-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-emerald-500 font-black text-[10px]">
              {selectedIds.size}
            </div>
            <p className="text-black font-black uppercase tracking-widest text-[9px]">Records Selected</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-black/10 hover:bg-black/20 text-black text-[9px] font-black uppercase rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-black text-white hover:bg-gray-900 text-[9px] font-black uppercase rounded-lg transition-all"
            >
              {isDeleting ? '...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Unified Feed Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar vault-feed bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent">
        {/* Restored Bulk Select Header */}
        {selectionMode && paginatedSnapshots.length > 0 && (
          <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between px-1 animate-in slide-in-from-top-2">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 group"
            >
              <div className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${selectedIds.size === paginatedSnapshots.length ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-emerald-500'}`}>
                {selectedIds.size === paginatedSnapshots.length && <span className="text-black text-[10px] font-black">✓</span>}
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Select Page ({paginatedSnapshots.length})</span>
            </button>
            <p className="text-[7px] font-black text-red-500/50 uppercase tracking-[0.3em]">Delete Mode Active</p>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Data...</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-6xl mx-auto pb-24">
            {paginatedSnapshots.length > 0 ? (
              <>
                {paginatedSnapshots.map((snap, idx) => {
                  const absoluteIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                  return (
                    <div key={snap.id || absoluteIdx} className="group relative">
                      {/* Timeline Line */}
                      {idx !== paginatedSnapshots.length - 1 && (
                        <div className="absolute left-[16px] top-[40px] bottom-[-24px] w-px bg-white/5 group-hover:bg-emerald-500/20 transition-colors"></div>
                      )}

                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Timestamp & Marker */}
                        <div className="md:w-32 flex-shrink-0 flex items-start gap-3 pt-4">
                          {selectionMode ? (
                            <button 
                              onClick={() => toggleSelection(snap.id)}
                              className="w-7 h-7 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10 hover:border-emerald-500 transition-all duration-500 overflow-hidden"
                            >
                              {selectedIds.has(snap.id) ? (
                                <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center">
                                  <span className="text-black text-[10px] font-black">✓</span>
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full border border-white/30"></div>
                              )}
                            </button>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm">
                              <span className="text-[9px] font-black text-gray-500">{absoluteIdx + 1}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-white font-black leading-none">{new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[8px] text-gray-500 font-bold mt-1 tracking-tight">{new Date(snap.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Snapshot Card (Bento Layout) */}
                        <div className={`flex-1 bg-gray-900/40 backdrop-blur-xl border rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-500 group/card ${selectedIds.has(snap.id) ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/5'}`}>
                          <div className="flex flex-col lg:flex-row">
                            {/* Image Column */}
                            <div className="lg:w-[40%] aspect-video lg:aspect-auto relative overflow-hidden bg-gray-800">
                              {snap.image_data ? (
                                <img
                                  src={snap.image_data.startsWith('data:') ? snap.image_data : `data:image/jpeg;base64,${snap.image_data}`}
                                  alt="Archive"
                                  className="w-full h-full object-cover grayscale opacity-60 group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all duration-700 scale-105 group-hover/card:scale-100"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-900/50">
                                  <span className="text-2xl opacity-20">📷</span>
                                  <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest">No Link</p>
                                </div>
                              )}
                              
                              {/* Recognition Overlay */}
                              {snap.detection && (
                                <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                                  <div className={`px-2 py-0.5 rounded-full font-black text-[7px] backdrop-blur-md border ${
                                    (snap.detection.sheath_blight_count || 0) > 0 
                                      ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                                      : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                  }`}>
                                    ✓ {(snap.detection.sheath_blight_count || 0) > 0 ? 'POSITIVE' : 'NEGATIVE'}
                                  </div>
                                  <div className="flex gap-1">
                                    <div className="bg-black/40 backdrop-blur-md rounded-md border border-white/10 px-1.5 py-0.5 text-center min-w-[20px]">
                                      <p className="text-[10px] font-black text-white leading-none">{snap.detection.healthy_count || 0}</p>
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-md rounded-md border border-white/10 px-1.5 py-0.5 text-center min-w-[20px]">
                                      <p className="text-[10px] font-black text-red-500 leading-none">{snap.detection.sheath_blight_count || 0}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Intelligence Column */}
                            <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between gap-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-black tracking-tighter text-white group-hover/card:text-emerald-500 transition-colors leading-none">
                                    Record-#{absoluteIdx + 1}
                                  </h3>
                                  <p className="text-[7px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Intelligence Packet v2.1</p>
                                </div>
                                <div className="px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">PLANT {snap.plant_id}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                {[
                                  { label: 'Ambient Temp', value: snap.sensors?.temp ? `${snap.sensors.temp}°C` : '--', color: 'text-amber-500', icon: '🌡️' },
                                  { label: 'Air Humidity', value: snap.sensors?.humidity ? `${snap.sensors.humidity}%` : '--', color: 'text-sky-500', icon: '💧' },
                                  { label: 'Soil Moisture', value: snap.sensors ? `${getPlantSoil(snap.sensors)}%` : '--', color: 'text-emerald-500', icon: '🪴' },
                                  { label: 'Water (1-3)', value: snap.sensors?.water_level_healthy ? `${snap.sensors.water_level_healthy}%` : '--', color: 'text-violet-500', icon: '🚰' },
                                  { label: 'Water (4-6)', value: snap.sensors?.water_level_diseased ? `${snap.sensors.water_level_diseased}%` : '--', color: 'text-sky-500', icon: '🚰' },
                                ].map((stat, i) => (
                                  <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                    <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-[10px] font-black ${stat.color} tracking-tighter`}>{stat.value}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-1.5">
                                  <div className="flex gap-1">
                                    {snap.sensors ? (
                                      [snap.sensors.soil_1, snap.sensors.soil_2, snap.sensors.soil_3, snap.sensors.soil_4, snap.sensors.soil_5, snap.sensors.soil_6].map((v, i) => (
                                        <div key={i} className="w-1 h-6 rounded-full bg-white/5 relative overflow-hidden">
                                          <div
                                            className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ${v > 30 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                            style={{ height: `${v || 0}%` }}
                                          ></div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex gap-1 opacity-10">
                                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-1 h-6 rounded-full bg-white/20"></div>)}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[6px] font-black text-gray-600 uppercase tracking-widest ml-1">Sensor Array</p>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Inference</p>
                                    <p className="text-[9px] font-black text-white leading-none">{snap.detection?.inference_ms ? `${snap.detection.inference_ms}ms` : '---'}</p>
                                  </div>
                                  <button className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                    <span className="text-sm font-bold">→</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 transition-all"
                    >
                      Prev
                    </button>
                    
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-7 h-7 rounded-md text-[9px] font-black transition-all ${
                            currentPage === page 
                              ? 'bg-emerald-500 text-black' 
                              : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-48 text-center bg-gray-900/20 rounded-[2rem] border border-dashed border-white/5">
                <div className="text-5xl mb-6 opacity-20 grayscale">🗄️</div>
                <h3 className="text-xl font-black text-gray-400 uppercase tracking-[0.2em]">No Data Stored</h3>
                <p className="text-gray-600 text-[8px] mt-2 font-bold uppercase tracking-widest max-w-xs">
                  No historical sensor data or images found for PLANT {selectedPlant}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoredData;
