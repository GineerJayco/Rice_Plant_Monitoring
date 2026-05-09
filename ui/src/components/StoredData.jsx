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
  deleteAllSnapshots
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
        fetchPlantImages(selectedPlant, 100),
        fetchDetectionSummary(selectedPlant, startDate, endDate),
      ]);

      setRawSensors(sensorsRes.data || []);
      setRawDetections(detectionsRes.data || []);
      setRawImages(imagesRes.data || []);
      setDetectionSummary(summaryRes.summary || null);

    } catch (err) {
      setError(`Vault synchronization failed: ${err.message}`);
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
        image_url: img.image_url || null,
        plant_id: img.plant_id,
        sensors: closestSensor || null,
        detection: closestDetection || null,
      };
    });
  }, [rawImages, rawSensors, rawDetections]);

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
      await fetchAllData(true);
      setSelectedIds(new Set());
    } catch (err) {
      setError(`Vault clearance failed: ${err.message}`);
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
      <div className="p-6 pb-5 border-b border-white/5 bg-gray-950/40 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-black font-black text-lg">V</span>
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                  Archive <span className="text-emerald-500">Vault</span>
                </h1>
                <p className="text-gray-500 text-[9px] font-black tracking-[0.2em] uppercase mt-1">
                  Historical Intelligence & Multi-Sensor Snapshots
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Unified Stats Area */}
            {detectionSummary && (
              <div className="hidden md:flex items-center gap-5 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 mr-2">
                <div className="text-center">
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Yield</p>
                  <p className="text-xs font-black text-emerald-500">{detectionSummary.total_healthy || 0}</p>
                </div>
                <div className="w-px h-5 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Alerts</p>
                  <p className="text-xs font-black text-red-500">{detectionSummary.total_sheath_blight || 0}</p>
                </div>
                <div className="w-px h-5 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Records</p>
                  <p className="text-xs font-black text-blue-500">{snapshots.length}</p>
                </div>
              </div>
            )}

            {/* Controls Group */}
            <div className="flex items-center gap-3">
              {/* Plant Selector */}
              <div className="relative group">
                <select
                  value={selectedPlant}
                  onChange={e => setSelectedPlant(Number(e.target.value))}
                  className="appearance-none pl-4 pr-9 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white font-black text-[10px] focus:border-emerald-500 outline-none transition-all cursor-pointer hover:bg-gray-800"
                >
                  {[1, 2, 3, 4, 5, 6].map(p => (
                    <option key={p} value={p}>PLANT {p}</option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500 text-[9px]">▼</div>
              </div>

              {/* Date Filters */}
              <div className="flex items-center bg-gray-900 border border-white/10 rounded-xl px-3 py-2.5 gap-2 hover:border-white/20 transition-colors">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent text-[9px] font-black text-gray-300 outline-none uppercase cursor-pointer"
                />
                <span className="text-gray-700 font-black text-xs">/</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent text-[9px] font-black text-gray-300 outline-none uppercase cursor-pointer"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchAllData(true)}
                disabled={loading || refreshing || isDeleting}
                className={`w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all active:scale-95 disabled:opacity-50 ${refreshing ? 'animate-spin' : ''}`}
                title="Refresh Vault"
              >
                ↻
              </button>

              {/* Selection Mode Toggle */}
              <button
                onClick={toggleSelectionMode}
                disabled={loading || refreshing || isDeleting || snapshots.length === 0}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${selectionMode ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title={selectionMode ? "Exit Delete Mode" : "Enter Delete Mode"}
              >
                {selectionMode ? '✕' : '🗑️'}
              </button>

              {/* Clear All Button (Only in Selection Mode) */}
              {selectionMode && (
                <button
                  onClick={handleClearAll}
                  disabled={loading || refreshing || isDeleting || snapshots.length === 0}
                  className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 animate-in zoom-in-50"
                  title="Clear All Plant Records"
                >
                  <span className="text-[10px] font-black">ALL</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Toolbar (Conditional) */}
      {selectedIds.size > 0 && (
        <div className="mx-6 mt-4 p-4 bg-emerald-500 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-xl shadow-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-emerald-500 font-black text-xs">
              {selectedIds.size}
            </div>
            <p className="text-black font-black uppercase tracking-widest text-[10px]">Records Selected for Disposal</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 bg-black/10 hover:bg-black/20 text-black text-[10px] font-black uppercase rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="px-4 py-2 bg-black text-white hover:bg-gray-900 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-2"
            >
              {isDeleting ? 'Processing...' : 'Delete Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Unified Feed Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar vault-feed bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent">
        {/* Bulk Action Header */}
        {selectionMode && paginatedSnapshots.length > 0 && (
          <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between px-2 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleSelectAll}
                className="flex items-center gap-2 group"
              >
                <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${selectedIds.size === paginatedSnapshots.length ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-emerald-500'}`}>
                  {selectedIds.size === paginatedSnapshots.length && <span className="text-black text-[10px] font-black">✓</span>}
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Select Page ({paginatedSnapshots.length})</span>
              </button>
            </div>
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Delete Mode Active</p>
          </div>
        )}
        {error && (
          <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-black italic">!</div>
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500/10 border-b-blue-500 rounded-full animate-spin-slow"></div>
              </div>
            </div>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Vault Records...</p>
          </div>
        ) : (
          <div className="space-y-8 max-w-7xl mx-auto pb-24">
            {paginatedSnapshots.length > 0 ? (
              <>
                {paginatedSnapshots.map((snap, idx) => {
                  const absoluteIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                  return (
                    <div key={snap.id || absoluteIdx} className="group relative">
                      {/* Timeline Line */}
                      {idx !== paginatedSnapshots.length - 1 && (
                        <div className="absolute left-[20px] top-[100%] bottom-[-48px] w-px bg-white/5 group-hover:bg-emerald-500/20 transition-colors"></div>
                      )}

                      <div className="flex flex-col lg:row gap-6">
                        {/* Timestamp & Marker */}
                        <div className="lg:w-40 flex-shrink-0 flex items-start gap-3">
                          {selectionMode ? (
                            <button 
                              onClick={() => toggleSelection(snap.id)}
                              className="w-8 h-8 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10 hover:border-emerald-500 transition-all duration-500 overflow-hidden animate-in zoom-in-50"
                            >
                              {selectedIds.has(snap.id) ? (
                                <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center">
                                  <span className="text-black text-xs font-black">✓</span>
                                </div>
                              ) : (
                                <div className="w-2 h-2 rounded-full border border-white/30"></div>
                              )}
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center flex-shrink-0 relative z-10">
                              <span className="text-[9px] font-black text-gray-600">{absoluteIdx + 1}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-[11px] text-white font-black leading-none">{new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[8px] text-gray-500 font-bold mt-1 tracking-tight">{new Date(snap.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Snapshot Card (Bento Layout) */}
                        <div className={`flex-1 bg-gray-900/40 backdrop-blur-xl border rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all duration-700 hover:shadow-2xl hover:shadow-emerald-500/5 group/card ${selectedIds.has(snap.id) ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5'}`}>
                          <div className="flex flex-col xl:flex-row">
                            {/* Image Column */}
                            <div className="xl:w-1/3 aspect-video xl:aspect-auto relative overflow-hidden bg-gray-800">
                              {snap.image_url ? (
                                <img
                                  src={resolveImageUrl(snap.image_url)}
                                  alt="Archive Capture"
                                  className="w-full h-full object-cover grayscale opacity-50 group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all duration-1000 scale-110 group-hover/card:scale-100"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-900/50">
                                  <span className="text-4xl opacity-20">📷</span>
                                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">No Visual Link Available</p>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-80 xl:hidden"></div>

                              {/* Recognition Overlay */}
                              {snap.detection && (
                                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                                  <div className="flex-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-2 text-center">
                                    <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Healthy</p>
                                    <p className="text-lg font-black text-white leading-none">{snap.detection.healthy_count || 0}</p>
                                  </div>
                                  <div className="flex-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-2 text-center">
                                    <p className="text-[7px] font-black text-red-500 uppercase tracking-widest">Blight</p>
                                    <p className="text-lg font-black text-white leading-none">{snap.detection.sheath_blight_count || 0}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Intelligence Column */}
                            <div className="flex-1 p-6 xl:p-8 flex flex-col justify-between gap-6">
                              {/* Row 1: Header & Tags */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xl font-black tracking-tighter text-white group-hover/card:text-emerald-500 transition-colors">
                                    Record-#{absoluteIdx + 1}
                                  </h3>
                                  <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mt-1">Intelligence Packet v2.1</p>
                                </div>
                                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">PLANT {snap.plant_id}</p>
                                </div>
                              </div>

                              {/* Row 2: Sensor Bento */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  { label: 'Ambient Temp', value: snap.sensors?.temp ? `${snap.sensors.temp}°C` : '--', color: 'text-amber-500', icon: '🌡️' },
                                  { label: 'Air Humidity', value: snap.sensors?.humidity ? `${snap.sensors.humidity}%` : '--', color: 'text-sky-500', icon: '💧' },
                                  { label: 'Soil Health', value: snap.sensors ? `${getPlantSoil(snap.sensors)}%` : '--', color: 'text-emerald-500', icon: '🪴' },
                                  { label: 'Res. Status', value: snap.sensors ? 'OPTIMAL' : 'OFFLINE', color: snap.sensors ? 'text-blue-500' : 'text-gray-600', icon: '🔋' },
                                ].map((stat, i) => (
                                  <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 group/stat hover:bg-white/10 transition-all">
                                    <p className="text-[6.5px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-[9px]">{stat.icon}</span>
                                      <span className={`text-xs font-black ${stat.color} tracking-tighter group-hover/stat:scale-105 transition-transform origin-left`}>{stat.value}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Row 3: Soil Array & Analysis */}
                              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-5 pt-5 border-t border-white/5">
                                <div className="flex gap-1.5">
                                  {snap.sensors ? (
                                    [snap.sensors.soil_1, snap.sensors.soil_2, snap.sensors.soil_3, snap.sensors.soil_4, snap.sensors.soil_5, snap.sensors.soil_6].map((v, i) => (
                                      <div key={i} className="w-1.5 h-8 rounded-full bg-white/5 relative overflow-hidden" title={`Probe 0${i + 1}: ${v}%`}>
                                        <div
                                          className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ${v > 30 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                          style={{ height: `${v || 0}%` }}
                                        ></div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex gap-1.5 opacity-10">
                                      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-1.5 h-8 rounded-full bg-white/20"></div>)}
                                    </div>
                                  )}
                                  <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest self-center ml-2">Sensor Array</p>
                                </div>

                                <div className="flex items-center gap-5">
                                  <div className="text-right">
                                    <p className="text-[7px] font-black text-gray-500 uppercase mb-0.5 tracking-widest">Inference</p>
                                    <p className="text-[10px] font-black text-white">{snap.detection?.inference_ms ? `${snap.detection.inference_ms}ms` : '---'}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    {selectionMode && (
                                      <button 
                                        onClick={() => handleDeleteOne(snap.id, snap.timestamp)}
                                        disabled={isDeleting}
                                        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 text-gray-500 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 transition-all active:scale-95 animate-in slide-in-from-right-4"
                                        title="Delete Record"
                                      >
                                        <span className="text-xs">🗑️</span>
                                      </button>
                                    )}
                                    <button className="w-10 h-10 rounded-2xl bg-emerald-500 text-black flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 group/btn">
                                      <span className="text-base group-hover/btn:scale-125 transition-transform">➔</span>
                                    </button>
                                  </div>
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
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Prev
                    </button>
                    
                    <div className="flex items-center gap-1 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                            currentPage === page 
                              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
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
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-48 text-center bg-gray-900/20 rounded-[3rem] border border-dashed border-white/5">
                <div className="text-7xl mb-8 opacity-20 grayscale">🗄️</div>
                <h3 className="text-2xl font-black text-gray-400 uppercase tracking-[0.2em]">Vault Empty</h3>
                <p className="text-gray-600 text-[9px] mt-3 font-bold uppercase tracking-widest max-w-xs leading-loose">
                  No historical intelligence packets found for PLANT {selectedPlant} in the selected timeframe.
                </p>
                <button
                  onClick={() => setDateRange({
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0],
                  })}
                  className="mt-8 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Expand Timeframe
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoredData;
